"use strict";

const { extractCodeBlocks } = require("./shared/parse-markdown");

/**
 * promptfoo custom assertion: TypeScript SDK pattern correctness checks.
 *
 * Checks:
 * 1. Correct import - uses @aptos-labs/ts-sdk (not deprecated 'aptos' package)
 * 2. No hardcoded keys - no hex strings that look like private keys (64+ char hex after 0x)
 * 3. Uses bigint - uses BigInt or n suffix for large numbers where appropriate
 * 4. waitForTransaction - if submitting transactions, calls waitForTransaction after
 * 5. No deprecated APIs - doesn't use getAccountAPTAmount, getAccountCoinAmount, deprecated AptosClient
 *
 * Score = checks passed / applicable checks.
 * Pass if score >= 0.6.
 *
 * @param {object} params - promptfoo assertion parameters.
 * @param {string} params.output - The LLM output (markdown with TypeScript code).
 * @returns {{pass: boolean, score: number, reason: string}}
 */
module.exports = async function ({ output }) {
  const tsBlocks = extractCodeBlocks(output, "typescript");

  if (tsBlocks.length === 0) {
    return {
      pass: false,
      score: 0,
      reason:
        "No TypeScript code blocks found in the output. Cannot perform SDK pattern checks.",
    };
  }

  const code = tsBlocks.join("\n\n");
  const checks = [];

  // --- Check 1: Correct import ---
  // Should use @aptos-labs/ts-sdk, not the deprecated 'aptos' package
  {
    const usesCorrectImport = /@aptos-labs\/ts-sdk/.test(code);
    const usesDeprecatedImport =
      /from\s+['"]aptos['"]/.test(code) || /require\s*\(\s*['"]aptos['"]\s*\)/.test(code);

    if (usesCorrectImport && !usesDeprecatedImport) {
      checks.push({
        name: "Correct import (@aptos-labs/ts-sdk)",
        passed: true,
        applicable: true,
        detail: "Uses @aptos-labs/ts-sdk correctly.",
      });
    } else if (usesDeprecatedImport) {
      checks.push({
        name: "Correct import (@aptos-labs/ts-sdk)",
        passed: false,
        applicable: true,
        detail:
          "Uses deprecated 'aptos' package. Should use @aptos-labs/ts-sdk.",
      });
    } else {
      // No imports at all -- might be a snippet; mark as not applicable
      checks.push({
        name: "Correct import (@aptos-labs/ts-sdk)",
        passed: true,
        applicable: false,
        detail: "No SDK imports detected; check not applicable.",
      });
    }
  }

  // --- Check 2: No hardcoded keys ---
  // Look for hex strings that resemble private keys: 0x followed by 64+ hex chars
  {
    const hardcodedKeyPattern = /0x[0-9a-fA-F]{64,}/;
    const hasHardcodedKey = hardcodedKeyPattern.test(code);
    checks.push({
      name: "No hardcoded keys",
      passed: !hasHardcodedKey,
      applicable: true,
      detail: hasHardcodedKey
        ? "Found what appears to be a hardcoded private key (0x + 64+ hex chars). Use environment variables instead."
        : "No hardcoded private keys detected.",
    });
  }

  // --- Check 3: Uses bigint ---
  // Check for BigInt() calls or numeric literals with 'n' suffix
  {
    const usesBigInt =
      /\bBigInt\s*\(/.test(code) || /\d+n\b/.test(code);
    // This is only applicable if there are numeric operations that likely need bigint
    // (e.g., amounts, balances)
    const hasAmountContext =
      /amount/i.test(code) || /balance/i.test(code) || /octas/i.test(code);

    if (hasAmountContext) {
      checks.push({
        name: "Uses bigint for large numbers",
        passed: usesBigInt,
        applicable: true,
        detail: usesBigInt
          ? "Uses BigInt or n-suffix for numeric values."
          : "Code references amounts/balances but does not use BigInt or n-suffix.",
      });
    } else {
      checks.push({
        name: "Uses bigint for large numbers",
        passed: true,
        applicable: false,
        detail: "No amount/balance context detected; check not applicable.",
      });
    }
  }

  // --- Check 4: waitForTransaction ---
  // If submitting transactions, should call waitForTransaction after
  {
    const submitsTransaction =
      /submitTransaction/.test(code) ||
      /signAndSubmitTransaction/.test(code);

    if (submitsTransaction) {
      const waitsForTransaction = /waitForTransaction/.test(code);
      checks.push({
        name: "waitForTransaction after submit",
        passed: waitsForTransaction,
        applicable: true,
        detail: waitsForTransaction
          ? "Calls waitForTransaction after submitting."
          : "Submits transactions but does not call waitForTransaction. Transactions should be confirmed before proceeding.",
      });
    } else {
      checks.push({
        name: "waitForTransaction after submit",
        passed: true,
        applicable: false,
        detail: "No transaction submission detected; check not applicable.",
      });
    }
  }

  // --- Check 5: No deprecated APIs ---
  // Shouldn't use getAccountAPTAmount, getAccountCoinAmount, or AptosClient
  {
    const deprecatedPatterns = [
      { pattern: /\bgetAccountAPTAmount\b/, name: "getAccountAPTAmount" },
      { pattern: /\bgetAccountCoinAmount\b/, name: "getAccountCoinAmount" },
      { pattern: /\bAptosClient\b/, name: "AptosClient" },
    ];

    const foundDeprecated = deprecatedPatterns.filter((dp) =>
      dp.pattern.test(code)
    );

    checks.push({
      name: "No deprecated APIs",
      passed: foundDeprecated.length === 0,
      applicable: true,
      detail:
        foundDeprecated.length === 0
          ? "No deprecated API usage detected."
          : `Uses deprecated APIs: ${foundDeprecated.map((d) => d.name).join(", ")}.`,
    });
  }

  // --- Scoring ---
  const applicableChecks = checks.filter((c) => c.applicable);
  const passedChecks = applicableChecks.filter((c) => c.passed);

  // If no checks are applicable, pass by default
  if (applicableChecks.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "No applicable SDK pattern checks for this output.",
    };
  }

  const score = passedChecks.length / applicableChecks.length;
  const passThreshold = 0.6;

  const summary = checks
    .map(
      (c) =>
        `  ${c.passed ? "PASS" : "FAIL"}${c.applicable ? "" : " (N/A)"}: ${c.name} - ${c.detail}`
    )
    .join("\n");

  return {
    pass: score >= passThreshold,
    score,
    reason: `SDK pattern check: ${passedChecks.length}/${applicableChecks.length} applicable checks passed (score: ${score.toFixed(2)}, threshold: ${passThreshold}).\n${summary}`,
  };
};
