"use strict";

const { extractCodeBlocks } = require("./shared/parse-markdown");
const { createTsWorkspace, runTsc, cleanup } = require("./shared/ts-workspace");

/**
 * promptfoo custom assertion: TypeScript compilation check.
 *
 * Extracts TypeScript code blocks from the LLM output, creates a temporary
 * TS workspace with the Aptos SDK symlinked, and runs `tsc --noEmit`.
 *
 * @param {object} params - promptfoo assertion parameters.
 * @param {string} params.output - The LLM output (markdown with TypeScript code).
 * @returns {{pass: boolean, score: number, reason: string}}
 */
module.exports = async function ({ output }) {
  // 1. Extract TypeScript code blocks from output
  const tsBlocks = extractCodeBlocks(output, "typescript");

  if (tsBlocks.length === 0) {
    return {
      pass: false,
      score: 0,
      reason:
        "No TypeScript code blocks found in the output. Expected at least one fenced ```typescript or ```ts block.",
    };
  }

  // Combine all TS code blocks
  const combinedCode = tsBlocks.join("\n\n");

  // 2. Create TS workspace
  let workspace;
  try {
    workspace = createTsWorkspace(combinedCode);
  } catch (err) {
    return {
      pass: false,
      score: 0,
      reason: `Failed to create TypeScript workspace: ${err.message}`,
    };
  }

  try {
    // 3. Run tsc --noEmit
    const result = runTsc(workspace.dir);

    // 4. Return pass/fail based on compilation success
    if (result.success) {
      return {
        pass: true,
        score: 1,
        reason: "TypeScript code compiled successfully (no type errors).",
      };
    } else {
      const errorDetail = result.error || result.output || "Unknown TypeScript compilation error";
      return {
        pass: false,
        score: 0,
        reason: `TypeScript compilation failed:\n${errorDetail}`,
      };
    }
  } finally {
    // Cleanup
    cleanup(workspace.dir);
  }
};
