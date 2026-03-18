# Marketplace Indexing Design

Get the Aptos Agent Skills repository properly indexed across Tier 1 AI skills marketplaces (SkillsMP, Skills.sh,
SkillHub, Claude Plugins Official, ClawHub).

## Goals

1. **Discoverability** - Skills appear when developers search for Aptos, Move, Web3 smart contracts
2. **Install count / adoption** - Maximize installs via `npx skills add` and marketplace presence
3. **Official Anthropic listing** - Get listed in `anthropics/claude-plugins-official`

## Target Marketplaces

| Marketplace             | URL          | How to Get Listed                              |
| ----------------------- | ------------ | ---------------------------------------------- |
| SkillsMP                | skillsmp.com | Auto-crawls GitHub (needs 2+ stars)            |
| Skills.sh (Vercel)      | skills.sh    | Appears via `npx skills add` install telemetry |
| SkillHub                | skillhub.club | Auto-indexes SKILL.md from GitHub             |
| Claude Plugins Official | GitHub       | Submit via Anthropic's in-app forms or PR      |
| ClawHub                 | clawhub.ai   | `clawhub publish`                              |

## Section 1: SKILL.md Metadata Standardization

All 17 SKILL.md files need frontmatter updates to be fully compliant with the
[Agent Skills specification](https://agentskills.io/specification).

### Changes to all 16 official skills

Add `license` and enrich `metadata` with `author` and `version`:

```yaml
---
name: <existing>
description: <existing>
license: MIT
metadata:
  author: aptos-labs
  version: "1.0"
  category: <existing>
  tags: <existing>
  priority: <existing>
---
```

### Fix modernize-move allowed-tools format

The `allowed-tools` field is currently a YAML list (array) but the Agent Skills spec defines it as a space-delimited
string:

```yaml
# Current (non-compliant):
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
  - AskUserQuestion

# Fixed (spec-compliant):
allowed-tools: Read Glob Grep Write Edit Bash AskUserQuestion
```

### Community skill (smoothsend-gasless)

Already has `author: ivedmohan` in metadata. Skip the `license` field for community skills -- let the author add it
themselves. Only add `version: "1.0"` to their metadata block.

### Files affected

16 official SKILL.md files (add `license: MIT` and `metadata.author`/`metadata.version`) plus 1 community SKILL.md
(add `metadata.version` only):

- `skills/move/write-contracts/SKILL.md`
- `skills/move/generate-tests/SKILL.md`
- `skills/move/security-audit/SKILL.md`
- `skills/move/deploy-contracts/SKILL.md`
- `skills/move/search-aptos-examples/SKILL.md`
- `skills/move/analyze-gas-optimization/SKILL.md`
- `skills/move/modernize-move/SKILL.md`
- `skills/project/create-aptos-project/SKILL.md`
- `skills/sdk/typescript/use-ts-sdk/SKILL.md`
- `skills/sdk/typescript/ts-sdk-client/SKILL.md`
- `skills/sdk/typescript/ts-sdk-account/SKILL.md`
- `skills/sdk/typescript/ts-sdk-address/SKILL.md`
- `skills/sdk/typescript/ts-sdk-transactions/SKILL.md`
- `skills/sdk/typescript/ts-sdk-view-and-query/SKILL.md`
- `skills/sdk/typescript/ts-sdk-types/SKILL.md`
- `skills/sdk/typescript/ts-sdk-wallet-adapter/SKILL.md`
- `community-skills/smoothsend-gasless/SKILL.md`

## Section 2: package.json and marketplace.json Enhancement

### package.json

Expand `keywords` for broader marketplace search coverage:

```json
"keywords": [
  "aptos",
  "move",
  "smart-contracts",
  "agent-skills",
  "ai",
  "claude",
  "cursor",
  "codex",
  "copilot",
  "web3",
  "blockchain",
  "nft",
  "defi",
  "typescript-sdk",
  "wallet-adapter",
  "move-v2",
  "digital-assets",
  "fungible-assets"
]
```

### marketplace.json

Add `category` and `tags` to each plugin entry for Claude Code marketplace filtering.

**Changes only** (existing fields like `name`, `owner`, `metadata`, `description`, `source`, `strict`, and `skills`
arrays are kept as-is):

```json
// In each plugin entry, ADD these fields:
"category": "blockchain",
"tags": ["aptos", "move", "smart-contracts", "web3", "defi", "nft", "typescript-sdk"]

// For community-skills plugin entry:
"category": "blockchain",
"tags": ["aptos", "community", "gasless"]
```

Note: The `category`, `tags`, and `skills` fields may not be in the official Claude Code plugin schema yet. They serve
as informational metadata for marketplace crawlers and may be silently ignored by Claude Code itself. This is acceptable
-- marketplace crawlers can still consume these fields for indexing.

### Files affected

- `package.json`
- `.claude-plugin/marketplace.json`

## Section 3: README and INSTALL Updates

### README.md

Add marketplace-specific badges alongside existing ones:

```markdown
[![SkillsMP](https://img.shields.io/badge/SkillsMP-Browse-purple.svg)](https://skillsmp.com/search?q=aptos)
[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install-blue.svg)](https://skills.sh/search?q=aptos)
```

Add marketplace links in the "Learn More" table:

```markdown
| [SkillsMP](https://skillsmp.com/search?q=aptos)     | Browse Aptos skills on SkillsMP     |
| [Skills.sh](https://skills.sh/search?q=aptos)       | Browse and install via Skills.sh    |
```

### INSTALL.md

1. Fix `use-typescript-sdk` to `use-ts-sdk` (line 64)
2. Expand Available Skills table to include all 17 skills (currently only lists 8). Use the README.md skill tables as
   the source of truth for names and descriptions.
3. Add marketplace-specific install sections:

```markdown
## Browse on Marketplaces

- **SkillsMP:** [skillsmp.com/search?q=aptos](https://skillsmp.com/search?q=aptos)
- **Skills.sh:** [skills.sh/search?q=aptos](https://skills.sh/search?q=aptos)
- **SkillHub:** [skillhub.club/search?q=aptos](https://skillhub.club/search?q=aptos)
- **ClawHub:** [clawhub.ai/search?q=aptos](https://clawhub.ai/search?q=aptos)
```

### Files affected

- `README.md`
- `INSTALL.md`

## Section 4: CI Validation

New GitHub Action at `.github/workflows/validate-skills.yml` that validates SKILL.md frontmatter on every PR.

### Trigger

```yaml
on:
  pull_request:
    paths:
      - "skills/**"
      - "community-skills/**"
```

### Validation checks

1. Every directory containing a SKILL.md has valid YAML frontmatter
2. Required fields present: `name` (1-64 chars, lowercase + hyphens) and `description` (1-1024 chars, non-empty)
3. `name` field matches the parent directory name
4. No consecutive hyphens in name, no leading/trailing hyphens
5. If `allowed-tools` is present, it must be a string (not a list)

### Implementation

Use `yq` (available on GitHub Actions Ubuntu runners) to parse YAML frontmatter reliably, including multi-line
description strings that use `"..."` quoting or `>-` folding. The script extracts frontmatter between the `---`
delimiters and validates each field with `yq`.

Fallback: If `yq` is unavailable, use the `skills-ref validate` CLI from the `agentskills/agentskills` repo.

For name-matches-directory validation, extract the immediate parent directory name (e.g., `write-contracts` from
`skills/move/write-contracts/SKILL.md`) and compare against the `name` field value.

### Files affected

- `.github/workflows/validate-skills.yml`

## Section 5: Marketplace Submissions (Local Only)

Documentation and scripts for manually submitting to marketplaces. These files are NOT committed to the repository --
they stay in a local gitignored directory.

**Prerequisite:** Add `.local/` to `.gitignore` before creating any files in this directory.

### Location

```
.local/marketplace-submissions/    (gitignored)
├── claude-plugins-official.md     # Draft submission for Anthropic's plugin directory
├── clawhub-publish.sh             # Script to publish to ClawHub
└── verification-checklist.md      # Checklist to verify presence on auto-indexed marketplaces
```

### Claude Plugins Official submission

The primary submission path is via Anthropic's in-app forms:

- Claude.ai: `claude.ai/settings/plugins/submit`
- Console: `platform.claude.com/plugins/submit`

The local doc will contain a draft of the submission content:

- Plugin name, description, and category
- Link to the repository
- List of skills with descriptions
- Evidence of quality (tests, CI, security practices)

As a secondary path, a PR to `anthropics/claude-plugins-official` may also be accepted.

### ClawHub publishing

Script that runs `clawhub publish` with the correct arguments. Requires:

- `clawhub` CLI installed (`npm i -g clawhub` -- install from the official `openclaw/clawhub` GitHub repo only)
- GitHub authentication (`clawhub auth login`)

### Verification checklist

A checklist to verify the repo appears on auto-indexed marketplaces after all changes are merged:

- [ ] SkillsMP: search for "aptos" on skillsmp.com
- [ ] Skills.sh: run `npx skills search aptos` and verify results
- [ ] SkillHub: search for "aptos" on skillhub.club
- [ ] Claude Code: run `/plugin marketplace add aptos-labs/aptos-agent-skills` and verify all 17 skills load
- [ ] ClawHub: search for "aptos" on clawhub.ai (after publishing)

### Files affected

- `.local/marketplace-submissions/` (local only, gitignored)
- `.gitignore` (add `.local/` entry)

## Out of Scope

- Tier 2 marketplaces (MCP registries like Smithery, Glama, PulseMCP)
- Tier 3 platform-specific listings (OpenAI Codex API, Hugging Face, LangChain Hub)
- Automated publish-on-release CI workflow
- Skills browser landing page
- Cross-marketplace analytics

## Implementation Order

1. Section 1 (SKILL.md metadata) -- foundation, unblocks auto-indexing
2. Section 2 (package.json / marketplace.json) -- improves search relevance
3. Section 3 (README / INSTALL) -- improves discoverability for humans
4. Section 4 (CI validation) -- prevents future regressions
5. Section 5 (marketplace submissions) -- manual follow-up actions
