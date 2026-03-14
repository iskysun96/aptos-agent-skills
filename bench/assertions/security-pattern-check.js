"use strict";

const { extractCodeBlocks } = require("./shared/parse-markdown");

/**
 * promptfoo custom assertion: static regex-based security pattern checks on Move code.
 *
 * Runs 6 security checks:
 * 1. Signer verification - entry functions contain signer::address_of or object::owner
 * 2. No ConstructorRef return - public functions do NOT return ConstructorRef
 * 3. No public &mut - public functions do NOT expose &mut in params (except &mut signer and self receivers)
 * 4. Error constants - defines const E_ error constants
 * 5. Events - defines event structs with #[event]
 * 6. No resource accounts - does NOT use create_resource_account or resource_account::
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
        "No Move code blocks found in the output. Cannot perform security pattern checks.",
    };
  }

  const code = moveBlocks.join("\n\n");
  const results = [];
  const TOTAL_CHECKS = 6;

  // --- Check 1: Signer verification ---
  // Entry functions should contain signer::address_of or object::owner
  {
    const hasEntryFunctions = /\bentry\b\s+(public\s+)?fun\b/.test(code) ||
      /\bpublic\s+entry\b\s+fun\b/.test(code);
    if (hasEntryFunctions) {
      const hasSignerCheck =
        /signer::address_of/.test(code) || /object::owner/.test(code);
      results.push({
        name: "Signer verification",
        passed: hasSignerCheck,
        detail: hasSignerCheck
          ? "Entry functions verify signer authority."
          : "Entry functions found but no signer::address_of or object::owner verification detected.",
      });
    } else {
      // No entry functions, check passes vacuously
      results.push({
        name: "Signer verification",
        passed: true,
        detail: "No entry functions found; check not applicable.",
      });
    }
  }

  // --- Check 2: No ConstructorRef return ---
  // Public functions should NOT return ConstructorRef
  {
    // Match public fun ... : ... ConstructorRef patterns
    const publicFnReturnPattern =
      /\bpublic\b[^{]*\bfun\b[^{]*:\s*[^{]*\bConstructorRef\b/;
    const returnsConstructorRef = publicFnReturnPattern.test(code);
    results.push({
      name: "No ConstructorRef return",
      passed: !returnsConstructorRef,
      detail: returnsConstructorRef
        ? "Public function returns ConstructorRef, which allows callers to destroy the object."
        : "No public functions return ConstructorRef.",
    });
  }

  // --- Check 3: No public &mut ---
  // Public functions should NOT have &mut in params, except &mut signer and self receiver style
  {
    // Find all public fun signatures
    const publicFnPattern = /\bpublic\b[^{]*\bfun\b\s+\w+[^{]*\([^)]*\)/g;
    const publicFns = code.match(publicFnPattern) || [];
    let hasDangerousMut = false;

    for (const sig of publicFns) {
      // Extract the parameter list
      const paramMatch = sig.match(/\(([^)]*)\)/);
      if (!paramMatch) continue;
      const params = paramMatch[1];

      // Find all &mut occurrences in params
      const mutRefs = params.match(/&mut\s+\w+/g) || [];
      for (const ref of mutRefs) {
        // Allow &mut signer
        if (/&mut\s+signer/.test(ref)) continue;
        // Allow self receiver patterns (e.g., &mut Self, &mut MyStruct in inline style)
        // Typically self receiver is the first param, but we'll be lenient
        hasDangerousMut = true;
        break;
      }
      if (hasDangerousMut) break;
    }

    results.push({
      name: "No public &mut",
      passed: !hasDangerousMut,
      detail: hasDangerousMut
        ? "Public function exposes &mut parameter (potential mem::swap attack vector)."
        : "No dangerous &mut parameters in public functions.",
    });
  }

  // --- Check 4: Error constants ---
  // Should define const E_ error constants
  {
    const hasErrorConstants = /\bconst\s+E_\w+/.test(code);
    results.push({
      name: "Error constants",
      passed: hasErrorConstants,
      detail: hasErrorConstants
        ? "Error constants (const E_*) are defined."
        : "No error constants (const E_*) found. Move best practice is to define named error constants.",
    });
  }

  // --- Check 5: Events ---
  // Should define event structs with #[event]
  {
    const hasEvents = /#\[event\]/.test(code);
    results.push({
      name: "Events",
      passed: hasEvents,
      detail: hasEvents
        ? "Event structs with #[event] annotation found."
        : "No #[event] annotated structs found. Contracts should emit events for important state changes.",
    });
  }

  // --- Check 6: No resource accounts ---
  // Should NOT use create_resource_account or resource_account::
  {
    const usesResourceAccounts =
      /\bcreate_resource_account\b/.test(code) ||
      /\bresource_account::/.test(code);
    results.push({
      name: "No resource accounts",
      passed: !usesResourceAccounts,
      detail: usesResourceAccounts
        ? "Uses deprecated resource accounts. Should use objects instead."
        : "No deprecated resource account usage detected.",
    });
  }

  // --- Aggregate ---
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);
  const score = passed.length / TOTAL_CHECKS;

  const summary = results
    .map((r) => `  ${r.passed ? "PASS" : "FAIL"}: ${r.name} - ${r.detail}`)
    .join("\n");

  return {
    pass: failed.length === 0,
    score,
    reason: `Security pattern check: ${passed.length}/${TOTAL_CHECKS} passed.\n${summary}`,
  };
};
