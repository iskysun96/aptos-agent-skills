"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_MOVE_TOML = path.resolve(
  PROJECT_ROOT,
  "bench",
  "fixtures",
  "move-toml",
  "template-Move.toml"
);

/**
 * Create a temporary Move project workspace for compilation testing.
 *
 * @param {string} moveCode - The Move source code to write into the workspace.
 * @param {string} [moveTomlPath] - Optional path to a custom Move.toml. Falls back to the
 *   default template at bench/fixtures/move-toml/template-Move.toml.
 * @returns {{dir: string, sourcePath: string}} The workspace directory and source file path.
 */
function createWorkspace(moveCode, moveTomlPath) {
  const tomlPath = moveTomlPath || DEFAULT_MOVE_TOML;

  // Validate the Move.toml template exists
  if (!fs.existsSync(tomlPath)) {
    throw new Error(
      `Move.toml template not found at ${tomlPath}. ` +
        `Ensure bench/fixtures/move-toml/template-Move.toml exists.`
    );
  }

  // Create unique temp directory
  const dirName = `aptos-bench-${crypto.randomUUID()}`;
  const dir = path.join(os.tmpdir(), dirName);

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "sources"), { recursive: true });

  // Copy Move.toml
  fs.copyFileSync(tomlPath, path.join(dir, "Move.toml"));

  // Write source file
  const sourcePath = path.join(dir, "sources", "main.move");
  fs.writeFileSync(sourcePath, moveCode, "utf-8");

  return { dir, sourcePath };
}

/**
 * Run an Aptos CLI command inside a workspace directory.
 *
 * @param {string} workspaceDir - The workspace directory path.
 * @param {string} command - The aptos subcommand to run (e.g., 'move compile', 'move test').
 * @returns {{success: boolean, output: string, error: string}}
 */
function runAptosCommand(workspaceDir, command) {
  const fullCommand = `aptos ${command} --skip-fetch-latest-git-deps --package-dir ${workspaceDir}`;

  try {
    const output = execSync(fullCommand, {
      encoding: "utf-8",
      timeout: 120_000, // 2 minute timeout
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
  if (!workspaceDir || !workspaceDir.includes("aptos-bench-")) {
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
  createWorkspace,
  runAptosCommand,
  cleanup,
};
