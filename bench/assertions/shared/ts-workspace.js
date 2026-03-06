"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const BENCH_ROOT = path.resolve(PROJECT_ROOT, "bench");
const DEFAULT_TSCONFIG = path.resolve(
  BENCH_ROOT,
  "fixtures",
  "tsconfig",
  "template-tsconfig.json"
);

/**
 * Create a temporary TypeScript project workspace for compilation testing.
 *
 * @param {string} tsCode - The TypeScript source code to write.
 * @param {string} [tsconfigPath] - Optional path to a custom tsconfig.json. Falls back
 *   to bench/fixtures/tsconfig/template-tsconfig.json.
 * @returns {{dir: string, sourcePath: string}} The workspace directory and source file path.
 */
function createTsWorkspace(tsCode, tsconfigPath) {
  const configPath = tsconfigPath || DEFAULT_TSCONFIG;

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `tsconfig template not found at ${configPath}. ` +
        `Ensure bench/fixtures/tsconfig/template-tsconfig.json exists.`
    );
  }

  // Create unique temp directory
  const dirName = `ts-bench-${crypto.randomUUID()}`;
  const dir = path.join(os.tmpdir(), dirName);

  fs.mkdirSync(dir, { recursive: true });

  // Copy tsconfig.json
  fs.copyFileSync(configPath, path.join(dir, "tsconfig.json"));

  // Write source file
  const sourcePath = path.join(dir, "index.ts");
  fs.writeFileSync(sourcePath, tsCode, "utf-8");

  // Create node_modules/@aptos-labs directory for symlinks
  const aptosLabsDir = path.join(dir, "node_modules", "@aptos-labs");
  fs.mkdirSync(aptosLabsDir, { recursive: true });

  // Symlink @aptos-labs/ts-sdk from the bench project's node_modules
  const sdkSource = path.resolve(BENCH_ROOT, "node_modules", "@aptos-labs", "ts-sdk");
  const sdkTarget = path.join(aptosLabsDir, "ts-sdk");
  if (fs.existsSync(sdkSource)) {
    fs.symlinkSync(sdkSource, sdkTarget, "junction");
  }

  // Symlink @aptos-labs/wallet-adapter-react if it exists
  const walletSource = path.resolve(
    BENCH_ROOT,
    "node_modules",
    "@aptos-labs",
    "wallet-adapter-react"
  );
  const walletTarget = path.join(aptosLabsDir, "wallet-adapter-react");
  if (fs.existsSync(walletSource)) {
    fs.symlinkSync(walletSource, walletTarget, "junction");
  }

  return { dir, sourcePath };
}

/**
 * Run the TypeScript compiler in noEmit mode on a workspace.
 *
 * @param {string} workspaceDir - The workspace directory with tsconfig.json and index.ts.
 * @returns {{success: boolean, output: string, error: string}}
 */
function runTsc(workspaceDir) {
  const tsconfigPath = path.join(workspaceDir, "tsconfig.json");
  const fullCommand = `npx tsc --noEmit --project ${tsconfigPath}`;

  try {
    const output = execSync(fullCommand, {
      encoding: "utf-8",
      timeout: 60_000, // 1 minute timeout
      cwd: workspaceDir,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, output: output.trim(), error: "" };
  } catch (err) {
    return {
      success: false,
      output: err.stdout ? err.stdout.trim() : "",
      error: err.stderr ? err.stderr.trim() : err.message,
    };
  }
}

/**
 * Remove a temporary workspace directory.
 *
 * @param {string} workspaceDir - The directory to remove.
 */
function cleanup(workspaceDir) {
  if (!workspaceDir || !workspaceDir.includes("ts-bench-")) {
    // Safety check: only remove directories created by this module
    return;
  }
  try {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; ignore errors
  }
}

module.exports = {
  createTsWorkspace,
  runTsc,
  cleanup,
};
