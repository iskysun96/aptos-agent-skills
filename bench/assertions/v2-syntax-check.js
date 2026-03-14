"use strict";

const { extractCodeBlocks } = require("./shared/parse-markdown");

/**
 * promptfoo custom assertion: checks that Move code uses V2 patterns
 * and avoids deprecated V1 patterns.
 *
 * V2 positive checks (should be present):
 * - Object<T> or object:: usage
 * - #[view] annotation
 * - #[event] annotation
 * - Receiver syntax (method calls with .)
 *
 * V1 negative checks (should be absent):
 * - create_resource_account or resource_account::
 * - coin::transfer (should use fungible_asset)
 * - table:: without smart_table:: (prefer SmartTable)
 *
 * Score based on V2 presence + V1 absence. Pass if score >= 0.6.
 *
 * @param {object} params - promptfoo assertion parameters.
 * @param {string} params.output - The LLM output (markdown with Move code).
 * @returns {{pass: boolean, score: number, reason: string}}
 */
module.exports = async function ({ output }) {
  const moveBlocks = extractCodeBlocks(output, "move");

  if (moveBlocks.length === 0) {
    return {
      pass: false,
      score: 0,
      reason:
        "No Move code blocks found in the output. Cannot perform V2 syntax checks.",
    };
  }

  const code = moveBlocks.join("\n\n");
  const checks = [];

  // --- V2 Positive Checks (should be present) ---

  // 1. Object<T> or object:: usage
  {
    const hasObject = /\bObject</.test(code) || /\bobject::/.test(code);
    checks.push({
      name: "Object<T> or object:: usage",
      type: "v2-positive",
      passed: hasObject,
      detail: hasObject
        ? "Uses Object<T> or object:: (V2 pattern)."
        : "No Object<T> or object:: usage found.",
    });
  }

  // 2. #[view] annotation
  {
    const hasView = /#\[view\]/.test(code);
    checks.push({
      name: "#[view] annotation",
      type: "v2-positive",
      passed: hasView,
      detail: hasView
        ? "#[view] annotation found."
        : "No #[view] annotation found.",
    });
  }

  // 3. #[event] annotation
  {
    const hasEvent = /#\[event\]/.test(code);
    checks.push({
      name: "#[event] annotation",
      type: "v2-positive",
      passed: hasEvent,
      detail: hasEvent
        ? "#[event] annotation found."
        : "No #[event] annotation found.",
    });
  }

  // 4. Receiver syntax (method calls with .)
  // Look for patterns like `object.method(` or `self.field` style receiver calls
  // A simple heuristic: any variable followed by dot followed by a known Move method style
  {
    const hasReceiverSyntax =
      /\w+\.transfer\(/.test(code) ||
      /\w+\.burn\(/.test(code) ||
      /\w+\.mint\(/.test(code) ||
      /\w+\.borrow\(/.test(code) ||
      /\w+\.borrow_mut\(/.test(code) ||
      /\w+\.extract\(/.test(code) ||
      /\w+\.deposit\(/.test(code) ||
      /\w+\.withdraw\(/.test(code) ||
      /\w+\.destroy\(/.test(code) ||
      /\w+\.emit\(/.test(code) ||
      /self\.\w+/.test(code);
    checks.push({
      name: "Receiver syntax",
      type: "v2-positive",
      passed: hasReceiverSyntax,
      detail: hasReceiverSyntax
        ? "Receiver-style method calls detected."
        : "No receiver-style method calls found.",
    });
  }

  // --- V1 Negative Checks (should be absent) ---

  // 5. No create_resource_account or resource_account::
  {
    const usesResourceAccount =
      /\bcreate_resource_account\b/.test(code) ||
      /\bresource_account::/.test(code);
    checks.push({
      name: "No resource accounts",
      type: "v1-negative",
      passed: !usesResourceAccount,
      detail: usesResourceAccount
        ? "Uses deprecated create_resource_account or resource_account:: (V1 pattern)."
        : "No deprecated resource account usage.",
    });
  }

  // 6. No coin::transfer (should use fungible_asset)
  {
    const usesCoinTransfer = /\bcoin::transfer\b/.test(code);
    checks.push({
      name: "No coin::transfer",
      type: "v1-negative",
      passed: !usesCoinTransfer,
      detail: usesCoinTransfer
        ? "Uses deprecated coin::transfer (should use fungible_asset)."
        : "No deprecated coin::transfer usage.",
    });
  }

  // 7. No table:: without smart_table:: (prefer SmartTable)
  {
    const usesTable = /\btable::/.test(code);
    const usesSmartTable = /\bsmart_table::/.test(code);
    // Fail only if table:: is used without also using smart_table::
    const usesPlainTableOnly = usesTable && !usesSmartTable;
    checks.push({
      name: "No plain table:: (prefer smart_table::)",
      type: "v1-negative",
      passed: !usesPlainTableOnly,
      detail: usesPlainTableOnly
        ? "Uses table:: without smart_table:: (prefer SmartTable)."
        : "No plain table:: usage (or uses smart_table::).",
    });
  }

  // --- Scoring ---
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed);
  const score = passedChecks.length / totalChecks;
  const passThreshold = 0.6;

  const summary = checks
    .map(
      (c) =>
        `  ${c.passed ? "PASS" : "FAIL"} [${c.type}]: ${c.name} - ${c.detail}`
    )
    .join("\n");

  return {
    pass: score >= passThreshold,
    score,
    reason: `V2 syntax check: ${passedChecks.length}/${totalChecks} checks passed (score: ${score.toFixed(2)}, threshold: ${passThreshold}).\n${summary}`,
  };
};
