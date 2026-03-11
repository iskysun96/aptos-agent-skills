#!/usr/bin/env node
/**
 * format-results.js
 *
 * Reads a promptfoo results JSON file and prints per-test, per-assertion
 * failure details. Designed to be called after each eval run to give
 * immediate visibility into what failed and why.
 *
 * Usage:
 *   node scripts/format-results.js <results-file.json>
 */

const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('Usage: node format-results.js <results-file.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
} catch (err) {
  console.error(`  Could not read results: ${err.message}`);
  process.exit(1);
}

const results = data.results?.results || [];
if (results.length === 0) {
  console.log('  No test results found.');
  process.exit(0);
}

for (const result of results) {
  const desc = result.description || result.vars?.task?.slice(0, 80) || 'Unknown test';
  const icon = result.success ? '\u2713' : '\u2717';
  const label = result.success ? 'PASS' : 'FAIL';

  console.log(`    ${icon} [${label}] ${desc}`);

  // Show per-assertion details for failures
  const components = result.gradingResult?.componentResults || [];
  if (!result.success && components.length > 0) {
    for (const comp of components) {
      const aIcon = comp.pass ? '\u2713' : '\u2717';
      // Extract assertion name from the assertion config
      let name = 'assertion';
      if (comp.assertion) {
        if (comp.assertion.type === 'javascript' && comp.assertion.value) {
          // Extract filename from file:// path
          const match = comp.assertion.value.match(/([^/]+)\.js$/);
          name = match ? match[1] : comp.assertion.type;
        } else if (comp.assertion.type) {
          name = `${comp.assertion.type}: ${comp.assertion.value || ''}`.slice(0, 60);
        }
      }

      if (!comp.pass) {
        // Truncate reason to keep output readable
        const reason = (comp.reason || 'no reason given').slice(0, 200);
        console.log(`      ${aIcon} ${name} \u2014 ${reason}`);
      }
    }
  }
}

// Print summary line
const passed = results.filter((r) => r.success).length;
const failed = results.length - passed;
console.log(
  `    Results: ${passed} passed, ${failed} failed, ${results.length} total`
);
