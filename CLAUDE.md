# Aptos Agent Skills

Specialized skills for AI assistants to build secure, modern Aptos dApps.

## Project Scaffolding

Use `npx create-aptos-dapp` to start new projects. Ask the user which network (devnet, testnet, mainnet) before
scaffolding, then use the same `<network>` value for both `create-aptos-dapp` and `aptos init`:

```bash
# Fullstack dApp with Vite (frontend + contracts)
npx create-aptos-dapp my-dapp \
  --project-type fullstack \
  --template boilerplate-template \
  --framework vite \
  --network <network>

# Fullstack dApp with Next.js
npx create-aptos-dapp my-dapp \
  --project-type fullstack \
  --template boilerplate-template \
  --framework nextjs \
  --network <network>

# Contract-only (Move project)
npx create-aptos-dapp my-contract \
  --project-type move \
  --network <network>
```

> **API Key:** If the user has a Geomi API key, pass `--api-key <key>` during scaffolding. It's optional for devnet but
> recommended for testnet/mainnet to avoid rate limits. Get one at https://geomi.dev (create project → API Resource →
> copy key).

**Post-scaffold checklist:**

1. `cd <project-name>`
2. Verify `.env` is in `.gitignore` before any git operations
3. Run `aptos init --network <network> --assume-yes` (use the **same network** as the `create-aptos-dapp` command above)
4. Verify: `npm run move:compile && npm run move:test`
5. `git init && git add . && git commit -m "Initial commit"`

## Skills

| Slash Command               | Skill                                                                         | Purpose                          |
| --------------------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| `/write-contracts`          | [write-contracts](skills/move/write-contracts/SKILL.md)                       | Generate secure Move contracts   |
| `/generate-tests`           | [generate-tests](skills/move/generate-tests/SKILL.md)                         | Create test suites (100% cov)    |
| `/security-audit`           | [security-audit](skills/move/security-audit/SKILL.md)                         | Audit contracts before deploy    |
| `/deploy-contracts`         | [deploy-contracts](skills/move/deploy-contracts/SKILL.md)                     | Deploy to devnet/testnet/mainnet |
| `/search-aptos-examples`    | [search-aptos-examples](skills/move/search-aptos-examples/SKILL.md)           | Find patterns from aptos-core    |
| `/analyze-gas-optimization` | [analyze-gas-optimization](skills/move/analyze-gas-optimization/SKILL.md)     | Optimize gas usage               |
| `/modernize-move`           | [modernize-move](skills/move/modernize-move/SKILL.md)                         | Modernize V1 contracts to V2     |
| `/use-ts-sdk`               | [use-ts-sdk](skills/sdk/typescript/use-ts-sdk/SKILL.md)                       | TypeScript SDK orchestrator      |
| `/ts-sdk-client`            | [ts-sdk-client](skills/sdk/typescript/ts-sdk-client/SKILL.md)                 | SDK client setup                 |
| `/ts-sdk-account`           | [ts-sdk-account](skills/sdk/typescript/ts-sdk-account/SKILL.md)               | Account/signer creation          |
| `/ts-sdk-address`           | [ts-sdk-address](skills/sdk/typescript/ts-sdk-address/SKILL.md)               | Address parsing & derivation     |
| `/ts-sdk-transactions`      | [ts-sdk-transactions](skills/sdk/typescript/ts-sdk-transactions/SKILL.md)     | Build, sign, submit txns         |
| `/ts-sdk-view-and-query`    | [ts-sdk-view-and-query](skills/sdk/typescript/ts-sdk-view-and-query/SKILL.md) | View functions & queries         |
| `/ts-sdk-types`             | [ts-sdk-types](skills/sdk/typescript/ts-sdk-types/SKILL.md)                   | Move-to-TS type mapping          |
| `/ts-sdk-wallet-adapter`    | [ts-sdk-wallet-adapter](skills/sdk/typescript/ts-sdk-wallet-adapter/SKILL.md) | React wallet integration         |

## When to Recommend Skills

### Intent-to-Command Mapping

| User Says                                                    | Recommend                           |
| ------------------------------------------------------------ | ----------------------------------- |
| "write contract", "build module", "create smart contract"    | `/write-contracts`                  |
| "write tests", "add coverage", "test this"                   | `/generate-tests`                   |
| "audit", "check security", "review for vulnerabilities"      | `/security-audit`                   |
| "deploy", "publish", "put on testnet/mainnet"                | `/deploy-contracts`                 |
| "find example", "search aptos", "how does X work"            | `/search-aptos-examples`            |
| "optimize gas", "reduce costs", "make cheaper"               | `/analyze-gas-optimization`         |
| "modernize", "upgrade to v2", "update syntax"                | `/modernize-move`                   |
| "typescript", "frontend", "call from JS", "SDK", "fullstack" | `/use-ts-sdk`                       |
| "wallet adapter", "connect wallet", "useWallet"              | `/ts-sdk-wallet-adapter`            |
| "create project", "new dApp", "scaffold"                     | Project Scaffolding section (above) |

### Auto-Recommendation Rules

- **After writing contracts** → suggest `/generate-tests`
- **Before deployment** → suggest `/security-audit`
- **Before writing new contracts** → suggest `/search-aptos-examples` to find reference implementations
- **After audit finds issues** → fix, then re-run `/security-audit`

## Workflows

### Build a dApp

1. Scaffold project (see Project Scaffolding above)
2. `/write-contracts` → write Move modules
3. `/generate-tests` → create test suite, verify 100% coverage
4. `/security-audit` → audit before deployment
5. `/deploy-contracts` → deploy contract to specified network
6. `/use-ts-sdk` → orchestrates frontend integration (routes to ts-sdk-client, ts-sdk-transactions,
   ts-sdk-view-and-query, ts-sdk-wallet-adapter as needed)

### Frontend Integration (Existing Project)

1. `/use-ts-sdk` → add entry/view functions following existing patterns in the boilerplate

### Modernize Legacy Code

1. `/modernize-move` → analyze V1 patterns, apply V2 modernizations tier-by-tier

### Optimize Existing Contracts

1. `/analyze-gas-optimization` → identify expensive operations, apply optimizations

## Global Rules

These apply to ALL Move code, regardless of which skill is active. Individual skills have additional rules specific to
their domain.

**Move V2 Only:**

- ✅ ALWAYS use objects and `Object<T>` — NEVER use resource accounts
- ✅ ALWAYS use Move V2 syntax — NEVER mix V1 and V2 patterns
- ❌ NEVER use old examples without verifying they're V2-compatible

**Security Fundamentals:**

- ✅ ALWAYS verify signer authority in entry functions
- ✅ ALWAYS validate inputs (amounts, addresses, strings)
- ❌ NEVER return ConstructorRef from functions (caller can destroy object)
- ❌ NEVER expose `&mut` in public functions (allows mem::swap attacks)
- ❌ NEVER copy code without understanding security implications

## Pattern References

### Move Patterns

- **[Digital Assets](patterns/move/DIGITAL_ASSETS.md)** - NFT standard (CRITICAL for NFTs)
- **[Fungible Assets](patterns/move/FUNGIBLE_ASSETS.md)** - Token standard (CRITICAL for tokens/coins)
- **[Object Patterns](patterns/move/OBJECTS.md)** - Object model reference
- **[Security Guide](patterns/move/SECURITY.md)** - Security checklist
- **[Modern Syntax](patterns/move/MOVE_V2_SYNTAX.md)** - V2 syntax guide
- **[Advanced Types](patterns/move/ADVANCED_TYPES.md)** - Advanced type patterns
- **[Storage Optimization](patterns/move/STORAGE_OPTIMIZATION.md)** - Storage cost reduction
- **[Testing Patterns](patterns/move/TESTING.md)** - Unit testing guide

### Fullstack Patterns

- **[TypeScript SDK](patterns/fullstack/TYPESCRIPT_SDK.md)** - TS SDK reference

## Private Key & Credential Security

These rules govern YOUR behavior as an AI assistant. Private keys are the highest-sensitivity asset — exposure means
total loss of funds.

**Files containing secrets — NEVER read or display:**

- `~/.aptos/config.yaml` — Contains private keys for all profiles
- `.env` files — May contain `VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY`
- Any file matching: `*.key`, `*.pem`, `*.secret`, `*credentials*`

**NEVER:**

- ❌ Read or display the contents of `~/.aptos/config.yaml` or `.env` files
- ❌ Display, print, or include private key values in responses
- ❌ Run commands that output private keys (`cat ~/.aptos/config.yaml`,
  `echo $VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY`, `env | grep KEY`, `printenv`)
- ❌ Repeat a private key if a user shares one — warn them to rotate it immediately
- ❌ Run `git add .` or `git add -A` without first verifying `.env` is in `.gitignore`
- ❌ Include private key values in code examples — use placeholder `"0x..."` instead

**ALWAYS:**

- ✅ Use `"0x..."` as placeholder when showing config structure
- ✅ Warn users before running `aptos init` that it generates a private key to store securely
- ✅ Verify `.gitignore` contains `.env` BEFORE any `git add` command
- ✅ Tell users to check `~/.aptos/config.yaml` themselves rather than reading it for them
- ✅ Use `--profile <name>` to reference keys indirectly through the Aptos CLI

## Community Skills

Community skills are built by developers across the Aptos ecosystem. They showcase third-party tools, integrations, and
patterns. These skills are independently maintained by their authors and have not been reviewed or audited by Aptos
Labs. See [community-skills/README.md](community-skills/README.md) for contribution guidelines.

| Skill                                       | Author | Purpose |
| ------------------------------------------- | ------ | ------- |
| _(none yet — see community-skills/ folder)_ |        |         |

## Integration

**Claude Code:** This file is automatically loaded when detected in the repository.

**Other Editors (Cursor, Copilot):** Include this file (`CLAUDE.md`) in your workspace context. Reference skill files in
prompts: `@skills/move/write-contracts/SKILL.md`.
