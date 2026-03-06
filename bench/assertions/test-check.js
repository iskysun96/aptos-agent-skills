"use strict";

const fs = require("fs");
const path = require("path");
const { extractCodeBlocks } = require("./shared/parse-markdown");
const { createWorkspace, runAptosCommand, cleanup } = require("./shared/move-workspace");

/**
 * promptfoo custom assertion: Move test execution check.
 *
 * The source contract comes from context.vars.sourceCode (the fixture).
 * The LLM output contains the test code. Both are written into a workspace
 * and `aptos move test` is run.
 *
 * @param {object} params - promptfoo assertion parameters.
 * @param {string} params.output - The LLM output (markdown with test code).
 * @param {object} params.context - Context object from promptfoo.
 * @param {object} params.context.vars - Template variables.
 * @param {string} params.context.vars.sourceCode - The Move source contract to test against.
 * @returns {{pass: boolean, score: number, reason: string}}
 */
module.exports = async function ({ output, context }) {
  // 1. Extract Move test code from the LLM output
  const testBlocks = extractCodeBlocks(output, "move");

  if (testBlocks.length === 0) {
    return {
      pass: false,
      score: 0,
      reason:
        "No Move code blocks found in the output. Expected at least one fenced ```move block containing test code.",
    };
  }

  // 2. Get source contract from context.vars.sourceCode
  const sourceCode =
    context && context.vars && context.vars.sourceCode
      ? context.vars.sourceCode
      : null;

  if (!sourceCode) {
    return {
      pass: false,
      score: 0,
      reason:
        "No source contract provided in context.vars.sourceCode. " +
        "The test-check assertion requires a sourceCode variable pointing to the Move contract under test.",
    };
  }

  // Combine all test blocks into one test file
  const testCode = testBlocks.join("\n\n");

  // 3. Create workspace with both source and test file
  const moveTomlPath =
    context && context.vars && context.vars.moveTomlPath
      ? context.vars.moveTomlPath
      : undefined;

  let workspace;
  try {
    workspace = createWorkspace(sourceCode, moveTomlPath);
  } catch (err) {
    return {
      pass: false,
      score: 0,
      reason: `Failed to create Move workspace: ${err.message}`,
    };
  }

  try {
    // Write the test file alongside the source
    const testPath = path.join(workspace.dir, "sources", "main_tests.move");
    fs.writeFileSync(testPath, testCode, "utf-8");

    // 4. Run aptos move test
    const result = runAptosCommand(workspace.dir, "move test");

    // 5. Return result
    if (result.success) {
      return {
        pass: true,
        score: 1,
        reason: `Move tests passed successfully.\n${result.output}`,
      };
    } else {
      const errorDetail = result.error || result.output || "Unknown test error";
      return {
        pass: false,
        score: 0,
        reason: `Move tests failed:\n${errorDetail}`,
      };
    }
  } finally {
    // Cleanup
    cleanup(workspace.dir);
  }
};
