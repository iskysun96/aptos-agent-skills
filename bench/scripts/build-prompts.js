#!/usr/bin/env node
/**
 * build-prompts.js
 *
 * Reads SKILL.md files and relevant pattern files, then writes a prompt.json
 * (promptfoo prompt file) into each skill's bench directory.
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
  // TS SDK skills — all use the same orchestrator SKILL.md
  'use-ts-sdk': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/use-ts-sdk',
  },
  'ts-sdk-client': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/sdk/ts-sdk-client',
  },
  'ts-sdk-account': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/sdk/ts-sdk-account',
  },
  'ts-sdk-address': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/sdk/ts-sdk-address',
  },
  'ts-sdk-transactions': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: ['patterns/fullstack/TYPESCRIPT_SDK.md'],
    benchDir: 'bench/skills/sdk/ts-sdk-transactions',
  },
  'ts-sdk-view-and-query': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/sdk/ts-sdk-view-and-query',
  },
  'ts-sdk-types': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: [],
    benchDir: 'bench/skills/sdk/ts-sdk-types',
  },
  'ts-sdk-wallet-adapter': {
    skillPath: 'skills/sdk/use-typescript-sdk/SKILL.md',
    patterns: [],
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
 * Build the user-message template using promptfoo Nunjucks syntax.
 * Includes {{task}} and optional {{contractCode}} / {{sourceCode}} blocks.
 */
function buildUserTemplate() {
  const parts = [
    '{{task}}',
    '{{#if contractCode}}\n\nContract:\n```move\n{{contractCode}}\n```{{/if}}',
    '{{#if sourceCode}}\n\nSource code:\n```move\n{{sourceCode}}\n```{{/if}}',
  ];
  return parts.join('');
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

  // Build messages array (promptfoo prompt format) ----------------------------
  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: buildUserTemplate() },
  ];

  // Ensure bench directory exists ---------------------------------------------
  fs.mkdirSync(benchAbsDir, { recursive: true });

  // Write prompt.json ---------------------------------------------------------
  const outPath = path.join(benchAbsDir, 'prompt.json');
  fs.writeFileSync(outPath, JSON.stringify(messages, null, 2) + '\n', 'utf-8');

  const patternLabel =
    config.patterns.length > 0
      ? ` + ${config.patterns.length} pattern(s)`
      : '';
  console.log(`  ${name}: ${outPath}${patternLabel}`);
  generated++;
}

console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
