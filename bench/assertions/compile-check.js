"use strict";

const { extractCodeBlocks } = require("./shared/parse-markdown");
const { createWorkspace, runAptosCommand, cleanup } = require("./shared/move-workspace");

/**
 * promptfoo custom assertion: Move compilation check.
 *
 * Extracts Move code blocks from the LLM output, creates a temporary Move
 * workspace, and runs `aptos move compile` to verify the code compiles.
 *
 * @param {object} params - promptfoo assertion parameters.
 * @param {string} params.output - The LLM output (markdown).
 * @param {object} [params.context] - Optional context with vars.
 * @returns {{pass: boolean, score: number, reason: string}}
 */
module.exports = async function ({ output, context }) {
  // 1. Extract Move code blocks from the LLM output
  const moveBlocks = extractCodeBlocks(output, "move");

  if (moveBlocks.length === 0) {
    return {
      pass: false,
      score: 0,
      reason: "No Move code blocks found in the output. Expected at least one fenced ```move block.",
    };
  }

  // Combine all Move code blocks into a single source file
  const combinedCode = moveBlocks.join("\n\n");

  // 2. Create workspace
  const moveTomlPath =
    context && context.vars && context.vars.moveTomlPath
      ? context.vars.moveTomlPath
      : undefined;
  let workspace;
  try {
    workspace = createWorkspace(combinedCode, moveTomlPath);
  } catch (err) {
    return {
      pass: false,
      score: 0,
      reason: `Failed to create Move workspace: ${err.message}`,
    };
  }

  try {
    // 3. Run aptos move compile
    const result = runAptosCommand(workspace.dir, "move compile");

    // 4. Return result
    if (result.success) {
      return {
        pass: true,
        score: 1,
        reason: "Move code compiled successfully.",
      };
    } else {
      const errorDetail = result.error || result.output || "Unknown compilation error";
      return {
        pass: false,
        score: 0,
        reason: `Move compilation failed:\n${errorDetail}`,
      };
    }
  } finally {
    // 5. Cleanup
    cleanup(workspace.dir);
  }
};
