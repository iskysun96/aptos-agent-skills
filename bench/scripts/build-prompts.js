#!/usr/bin/env node
/**
 * build-prompts.js
 *
 * Reads SKILL.md files and relevant pattern files, then writes:
 *   - system-prompt.txt  (system message content)
 *   - prompt.js          (promptfoo prompt function that injects vars)
 *
 * Using a JS prompt function guarantees variable substitution works,
 * regardless of how promptfoo handles Nunjucks in JSON prompt files.
 *
 * Usage:
 *   node scripts/build-prompts.js
 *
 * Run from the bench/ directory or the project root — paths are resolved
 * relative to the project root automatically.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Resolve project root (parent of bench/)
// ---------------------------------------------------------------------------
const SCRIPT_DIR = __dirname;
const BENCH_DIR = path.dirname(SCRIPT_DIR);
const PROJECT_DIR = path.dirname(BENCH_DIR);

// ---------------------------------------------------------------------------
// Skill → pattern mapping
// ---------------------------------------------------------------------------
const SKILL_CONFIG = {
  // Move skills
  'write-contracts': {
    skillPath: 'skills/move/write-contracts/SKILL.md',
    patterns: [
      'patterns/move/SECURITY.md',
      'patterns/move/OBJECTS.md',
      'patterns/move/DIGITAL_ASSETS.md',
      'patterns/move/FUNGIBLE_ASSETS.md',
      'patterns/move/MOVE_V2_SYNTAX.md',
    ],
    benchDir: 'bench/skills/move/write-contracts',
  },
  'generate-tests': {
    skillPath: 'skills/move/generate-tests/SKILL.md',
    patterns: ['patterns/move/TESTING.md'],
    benchDir: 'bench/skills/move/generate-tests',
  },
  'security-audit': {
    skillPath: 'skills/move/security-audit/SKILL.md',
    patterns: ['patterns/move/SECURITY.md'],
    benchDir: 'bench/skills/move/security-audit',
  },
  'analyze-gas-optimization': {
    skillPath: 'skills/move/analyze-gas-optimization/SKILL.md',
    patterns: ['patterns/move/STORAGE_OPTIMIZATION.md'],
    benchDir: 'bench/skills/move/analyze-gas-optimization',
  },
  'modernize-move': {
    skillPath: 'skills/move/modernize-move/SKILL.md',
    patterns: ['patterns/move/MOVE_V2_SYNTAX.md'],
    benchDir: 'bench/skills/move/modernize-move',
  },
  'deploy-contracts': {
    skillPath: 'skills/move/deploy-contracts/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/move/deploy-contracts',
  },
  'search-aptos-examples': {
    skillPath: 'skills/move/search-aptos-examples/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/move/search-aptos-examples',
  },
  // TS SDK skills — orchestrator + sub-skills each have their own SKILL.md
  'use-ts-sdk': {
    skillPath: 'skills/sdk/typescript/use-ts-sdk/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/use-ts-sdk',
  },
  'ts-sdk-client': {
    skillPath: 'skills/sdk/typescript/ts-sdk-client/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-client',
  },
  'ts-sdk-account': {
    skillPath: 'skills/sdk/typescript/ts-sdk-account/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-account',
  },
  'ts-sdk-address': {
    skillPath: 'skills/sdk/typescript/ts-sdk-address/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-address',
  },
  'ts-sdk-transactions': {
    skillPath: 'skills/sdk/typescript/ts-sdk-transactions/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-transactions',
  },
  'ts-sdk-view-and-query': {
    skillPath: 'skills/sdk/typescript/ts-sdk-view-and-query/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-view-and-query',
  },
  'ts-sdk-types': {
    skillPath: 'skills/sdk/typescript/ts-sdk-types/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-types',
  },
  'ts-sdk-wallet-adapter': {
    skillPath: 'skills/sdk/typescript/ts-sdk-wallet-adapter/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-wallet-adapter',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read a file, returning its contents or null (with a warning) if
 * the file does not exist.
 */
function readFileSafe(absolutePath, label) {
  try {
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch (err) {
    console.warn(`  Warning: could not read ${label} — ${absolutePath}`);
    return null;
  }
}

/**
 * Build the prompt.js content that gets written to each skill directory.
 * This function is invoked by promptfoo for each test case, ensuring
 * variables (task, contractCode, sourceCode) are always injected.
 */
function buildPromptJs() {
  const lines = [
    "const fs = require('fs');",
    "const path = require('path');",
    "",
    "const systemPrompt = fs.readFileSync(",
    "  path.join(__dirname, 'system-prompt.txt'), 'utf-8'",
    ");",
    "",
    "module.exports = function ({ vars }) {",
    "  let userContent = vars.task || '';",
    "  if (vars.contractCode) {",
    "    userContent += '\\n\\nContract:\\n```move\\n' + vars.contractCode + '\\n```';",
    "  }",
    "  if (vars.sourceCode) {",
    "    userContent += '\\n\\nSource code:\\n```move\\n' + vars.sourceCode + '\\n```';",
    "  }",
    "  return [",
    "    { role: 'system', content: systemPrompt },",
    "    { role: 'user', content: userContent },",
    "  ];",
    "};",
  ];
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let generated = 0;
let skipped = 0;

console.log('Building prompts...\n');

for (const [name, config] of Object.entries(SKILL_CONFIG)) {
  const skillAbsPath = path.join(PROJECT_DIR, config.skillPath);
  const benchAbsDir = path.join(PROJECT_DIR, config.benchDir);

  // Read the SKILL.md ---------------------------------------------------------
  const skillContent = readFileSafe(skillAbsPath, `${name} SKILL.md`);
  if (!skillContent) {
    console.warn(`  Skipping ${name}: SKILL.md not found.\n`);
    skipped++;
    continue;
  }

  // Read pattern files --------------------------------------------------------
  const patternContents = [];
  for (const patternRelPath of config.patterns) {
    const patternAbsPath = path.join(PROJECT_DIR, patternRelPath);
    const content = readFileSafe(patternAbsPath, `${name} pattern ${patternRelPath}`);
    if (content) {
      patternContents.push(content);
    }
  }

  // Compose system prompt -----------------------------------------------------
  const systemParts = [skillContent];
  if (patternContents.length > 0) {
    systemParts.push(...patternContents);
  }
  const systemMessage = systemParts.join('\n\n---\n\n');

  // Ensure bench directory exists ---------------------------------------------
  fs.mkdirSync(benchAbsDir, { recursive: true });

  // Write system-prompt.txt ---------------------------------------------------
  const systemPromptPath = path.join(benchAbsDir, 'system-prompt.txt');
  fs.writeFileSync(systemPromptPath, systemMessage, 'utf-8');

  // Write prompt.js -----------------------------------------------------------
  const promptJsPath = path.join(benchAbsDir, 'prompt.js');
  fs.writeFileSync(promptJsPath, buildPromptJs(), 'utf-8');

  const patternLabel =
    config.patterns.length > 0
      ? ` + ${config.patterns.length} pattern(s)`
      : '';
  console.log(`  ${name}: ${promptJsPath}${patternLabel}`);
  generated++;
}

console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
