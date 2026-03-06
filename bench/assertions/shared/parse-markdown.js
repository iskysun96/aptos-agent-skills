"use strict";

/**
 * Extracts fenced code blocks from LLM markdown output.
 *
 * Matches patterns like:
 *   ```language
 *   ...code...
 *   ```
 *
 * Also handles untagged code blocks (no language specifier).
 */

const FENCED_BLOCK_RE = /```(\w+)?\s*\n([\s\S]*?)```/g;

/**
 * Extract all fenced code blocks from markdown text.
 *
 * @param {string} markdown - The raw markdown string (typically LLM output).
 * @returns {Array<{language: string|null, code: string}>} Array of extracted blocks.
 */
function extractAllCodeBlocks(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return [];
  }

  const blocks = [];
  let match;

  // Reset lastIndex in case the regex was used before
  FENCED_BLOCK_RE.lastIndex = 0;

  while ((match = FENCED_BLOCK_RE.exec(markdown)) !== null) {
    const language = match[1] ? match[1].toLowerCase() : null;
    const code = match[2].trimEnd();
    blocks.push({ language, code });
  }

  return blocks;
}

/**
 * Extract fenced code blocks for a specific language.
 *
 * Special handling: when language is 'typescript', also matches blocks
 * tagged as 'ts'. When language is 'ts', also matches 'typescript'.
 *
 * @param {string} markdown - The raw markdown string.
 * @param {string} language - The language tag to filter by (e.g., 'move', 'typescript', 'ts').
 * @returns {string[]} Array of code strings matching the requested language.
 */
function extractCodeBlocks(markdown, language) {
  const allBlocks = extractAllCodeBlocks(markdown);
  const target = language ? language.toLowerCase() : null;

  // Build the set of language tags to match
  const matchTags = new Set();
  if (target) {
    matchTags.add(target);
    // Auto-merge typescript <-> ts
    if (target === "typescript") {
      matchTags.add("ts");
    } else if (target === "ts") {
      matchTags.add("typescript");
    }
  }

  return allBlocks
    .filter((block) => {
      if (target === null) {
        return block.language === null;
      }
      return block.language !== null && matchTags.has(block.language);
    })
    .map((block) => block.code);
}

module.exports = {
  extractCodeBlocks,
  extractAllCodeBlocks,
};
