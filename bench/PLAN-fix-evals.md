# Fix bench evals: prompt variable injection + output clarity

## Context

The second CI run (after path fixes) shows 14/15 skills still failing. The model produces **identical responses for all test cases within a skill**, proving that `{{task}}` template variables in `prompt.json` are not being substituted by promptfoo. Additionally, the CI output only shows `[PASS]`/`[FAIL]` per test case with no indication of which assertion failed or why.

**Evidence that variables aren't substituted:**
- `write-contracts`: 4 different tasks (fungible token, NFT, staking, DAO) all produce identical response about "staking contract"
- All SDK skills: identical boilerplate response, most showing `(cached)` with `Duration: 0s` — proves the rendered prompts are identical
- `analyze-gas-optimization`: 2 tests get slightly different responses only because different `contractCode` fixtures create different prompt hashes (the file content itself varies, not the template variable)

**Root cause:** promptfoo v0.120.26 loads `file://prompt.json` as parsed JSON and either doesn't apply Nunjucks to message content fields, or caches based on pre-substitution prompt hash. Either way, `{{task}}` is sent literally to the API.

## Fix 1: Switch from `prompt.json` to `prompt.js` (prompt function)

Replace the static JSON template with a JavaScript function that explicitly constructs the messages array with variables substituted. This completely sidesteps the Nunjucks/JSON rendering question.

### Changes to `bench/scripts/build-prompts.js`

Instead of writing `prompt.json`, generate two files per skill:

1. **`system-prompt.txt`** — the concatenated SKILL.md + pattern docs (same content that was in prompt.json's system message)
2. **`prompt.js`** — a prompt function that loads system-prompt.txt and builds messages with vars

The `prompt.js` is identical boilerplate for all skills:

```javascript
const fs = require('fs');
const path = require('path');

const systemPrompt = fs.readFileSync(
  path.join(__dirname, 'system-prompt.txt'), 'utf-8'
);

module.exports = function ({ vars }) {
  let userContent = vars.task || '';
  if (vars.contractCode) {
    userContent += `\n\nContract:\n\`\`\`move\n${vars.contractCode}\n\`\`\``;
  }
  if (vars.sourceCode) {
    userContent += `\n\nSource code:\n\`\`\`move\n${vars.sourceCode}\n\`\`\``;
  }
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];
};
```

Key: `system-prompt.txt` is loaded once at module level (cached across test cases), and vars are injected per test case.

### Changes to each `promptfooconfig.yaml` (15 files)

```yaml
# Before
prompts:
  - file://prompt.json

# After
prompts:
  - file://prompt.js
```

### Changes to `.gitignore`

Add generated build artifacts:
```
bench/skills/**/prompt.js
bench/skills/**/system-prompt.txt
```

Remove committed `prompt.json` files from git tracking (`git rm --cached`).

## Fix 2: Per-assertion failure output in `run-all.sh`

### New script: `bench/scripts/format-results.js`

Reads a promptfoo results JSON file and prints per-test, per-assertion failure details:

```
  ✗ Test: "Fungible Asset Token"
    ✗ compile-check — No Move code blocks found in response
    ✓ security-pattern-check — 6/6 checks passed
    ✗ v2-syntax-check — Score 0.43 < 0.6 threshold (Missing: #[event], receiver style)
```

Uses the results JSON structure:
- `results.results[]` — per-test results
- `.vars.task` or `.description` — test name
- `.gradingResult.componentResults[]` — per-assertion results
- `.componentResults[].pass`, `.reason`, `.assertion` — failure details

### Changes to `bench/scripts/run-all.sh`

After each `npx promptfoo eval`, pipe the results JSON through `format-results.js`:

```bash
if npx promptfoo eval --config "$CONFIG" --output "$OUTPUT_FILE"; then
    echo "  ✓ ${CATEGORY}/${SKILL} passed"
    PASSED=$((PASSED + 1))
else
    echo "  ✗ ${CATEGORY}/${SKILL} failed"
    FAILED=$((FAILED + 1))
fi
# Always show per-assertion breakdown
node "$SCRIPT_DIR/format-results.js" "$OUTPUT_FILE"
```

### Changes to `.github/workflows/skill-eval.yml`

Enhance the "Generate summary" and "Post PR comment" steps to include per-test failure details from results JSON, using the same `format-results.js` script or inline parsing.

## Files to Modify

| File | Change |
|------|--------|
| `bench/scripts/build-prompts.js` | Generate `prompt.js` + `system-prompt.txt` instead of `prompt.json` |
| `bench/skills/**/promptfooconfig.yaml` (15 files) | `file://prompt.json` → `file://prompt.js` |
| `bench/scripts/run-all.sh` | Add per-assertion failure output after each eval |
| `bench/scripts/format-results.js` | **New file** — parse results JSON, print assertion-level details |
| `.github/workflows/skill-eval.yml` | Enhance summary + PR comment with per-assertion details |
| `.gitignore` | Add `bench/skills/**/prompt.js`, `bench/skills/**/system-prompt.txt` |

Plus git housekeeping: `git rm --cached bench/skills/**/prompt.json`

## Verification

1. Run `node bench/scripts/build-prompts.js` — verify `system-prompt.txt` and `prompt.js` are generated for all 15 skills
2. Run a single skill eval locally: `cd bench && npm run eval:skill -- deploy-contracts` (cheapest skill, 1 test case, no fixtures)
   - Verify the response is task-specific (mentions "testnet" deployment, not generic)
   - Verify per-assertion output is printed
3. Run `npm run eval:skill -- write-contracts` — verify 4 test cases produce 4 DIFFERENT responses
4. Push and check CI output shows assertion-level details
