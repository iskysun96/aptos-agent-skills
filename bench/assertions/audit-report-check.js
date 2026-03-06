"use strict";

/**
 * promptfoo custom assertion: validates that an audit report output
 * contains the required security audit categories.
 *
 * Checks for 7 categories (case-insensitive):
 * 1. Access Control
 * 2. Input Validation
 * 3. Object Safety
 * 4. Reference Safety
 * 5. Arithmetic Safety
 * 6. Generic Type Safety
 * 7. Testing
 *
 * Score = categories found / 7.
 * Pass if >= 5/7 categories are present.
 *
 * @param {object} params - promptfoo assertion parameters.
 * @param {string} params.output - The LLM output (audit report text).
 * @returns {{pass: boolean, score: number, reason: string}}
 */
module.exports = async function ({ output }) {
  if (!output || typeof output !== "string") {
    return {
      pass: false,
      score: 0,
      reason: "No output provided to check for audit report categories.",
    };
  }

  const CATEGORIES = [
    { name: "Access Control", pattern: /access\s+control/i },
    { name: "Input Validation", pattern: /input\s+validation/i },
    { name: "Object Safety", pattern: /object\s+safety/i },
    { name: "Reference Safety", pattern: /reference\s+safety/i },
    { name: "Arithmetic Safety", pattern: /arithmetic\s+safety/i },
    { name: "Generic Type Safety", pattern: /generic\s+type\s+safety/i },
    { name: "Testing", pattern: /\btesting\b/i },
  ];

  const TOTAL = CATEGORIES.length;
  const PASS_THRESHOLD = 5;

  const results = CATEGORIES.map((cat) => ({
    name: cat.name,
    found: cat.pattern.test(output),
  }));

  const found = results.filter((r) => r.found);
  const missing = results.filter((r) => !r.found);
  const score = found.length / TOTAL;

  const summary = results
    .map((r) => `  ${r.found ? "FOUND" : "MISSING"}: ${r.name}`)
    .join("\n");

  const passResult = found.length >= PASS_THRESHOLD;

  return {
    pass: passResult,
    score,
    reason: `Audit report completeness: ${found.length}/${TOTAL} categories found (threshold: ${PASS_THRESHOLD}/${TOTAL}).\n${summary}`,
  };
};
