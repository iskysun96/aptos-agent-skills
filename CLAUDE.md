# Aptos Agent Skills

Specialized skills for AI assistants to build secure, modern Aptos dApps.

## Project Scaffolding

Use the `create-aptos-dapp` boilerplate template to start new projects. Download and extract directly into the current
directory:

```bash
# Fullstack dApp (frontend + contracts)
curl -sL https://github.com/aptos-labs/create-aptos-dapp/archive/refs/heads/main.tar.gz \
  | tar xz --strip-components=3 "create-aptos-dapp-main/templates/boilerplate-template/"

# Contract-only
curl -sL https://github.com/aptos-labs/create-aptos-dapp/archive/refs/heads/main.tar.gz \
  | tar xz --strip-components=3 "create-aptos-dapp-main/templates/contract-boilerplate-template/"
```

**Post-scaffold checklist:**

1. `npm install`
2. Create `.env` (NEVER commit this file):
   ```
   PROJECT_NAME=my_dapp
   VITE_APP_NETWORK=devnet
   VITE_APTOS_API_KEY=              # Optional for devnet — get one at https://geomi.dev for higher rate limits
   VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS=
   # This is the module publisher account's private key.
   # Be cautious about who you share it with, and ensure it is not exposed when deploying your dApp.
   VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY=
   ```
   > **API Key:** Ask the user if they have a Geomi API key. It's optional for devnet but recommended for
   > testnet/mainnet to avoid rate limits. Get one at https://geomi.dev (create project → API Resource → copy key).
3. Verify `.env` is in `.gitignore` before any git operations
4. Update `contract/Move.toml` with project name and `my_addr = "_"`
5. Ask the user which network (devnet, testnet, mainnet), then run `aptos init --network <network> --assume-yes`
6. Verify: `npm run move:compile && npm run move:test`
7. `git init && git add . && git commit -m "Initial commit"`

## Skills

| Slash Command               | Skill                                                                                     | Purpose                          |
| --------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| `/write-contracts`          | [write-contracts](skills/move/write-contracts/SKILL.md)                                   | Generate secure Move contracts   |
| `/generate-tests`           | [generate-tests](skills/move/generate-tests/SKILL.md)                                     | Create test suites (100% cov)    |
| `/security-audit`           | [security-audit](skills/move/security-audit/SKILL.md)                                     | Audit contracts before deploy    |
| `/deploy-contracts`         | [deploy-contracts](skills/move/deploy-contracts/SKILL.md)                                 | Deploy to devnet/testnet/mainnet |
| `/search-aptos-examples`    | [search-aptos-examples](skills/move/search-aptos-examples/SKILL.md)                       | Find patterns from aptos-core    |
| `/analyze-gas-optimization` | [analyze-gas-optimization](skills/move/analyze-gas-optimization/SKILL.md)                 | Optimize gas usage               |
| `/modernize-move`           | [modernize-move](skills/move/modernize-move/SKILL.md)                                     | Modernize V1 contracts to V2     |
| `/use-ts-sdk`               | [use-ts-sdk](skills/sdk/typescript/use-ts-sdk/SKILL.md)                                   | TypeScript SDK orchestrator      |
| `/ts-sdk-client`            | [ts-sdk-client](skills/sdk/typescript/ts-sdk-client/SKILL.md)                             | SDK client setup                 |
| `/ts-sdk-account`           | [ts-sdk-account](skills/sdk/typescript/ts-sdk-account/SKILL.md)                           | Account/signer creation          |
| `/ts-sdk-address`           | [ts-sdk-address](skills/sdk/typescript/ts-sdk-address/SKILL.md)                           | Address parsing & derivation     |
| `/ts-sdk-transactions`      | [ts-sdk-transactions](skills/sdk/typescript/ts-sdk-transactions/SKILL.md)                 | Build, sign, submit txns         |
| `/ts-sdk-view-and-query`    | [ts-sdk-view-and-query](skills/sdk/typescript/ts-sdk-view-and-query/SKILL.md)             | View functions & queries         |
| `/ts-sdk-types`             | [ts-sdk-types](skills/sdk/typescript/ts-sdk-types/SKILL.md)                               | Move-to-TS type mapping          |
| `/ts-sdk-wallet-adapter`    | [ts-sdk-wallet-adapter](skills/sdk/typescript/ts-sdk-wallet-adapter/SKILL.md)             | React wallet integration         |

## When to Recommend Skills

### Intent-to-Command Mapping

| User Says                                                 | Recommend                           |
| --------------------------------------------------------- | ----------------------------------- |
| "write contract", "build module", "create smart contract" | `/write-contracts`                  |
| "write tests", "add coverage", "test this"                | `/generate-tests`                   |
| "audit", "check security", "review for vulnerabilities"   | `/security-audit`                   |
| "deploy", "publish", "put on testnet/mainnet"             | `/deploy-contracts`                 |
| "find example", "search aptos", "how does X work"         | `/search-aptos-examples`            |
| "optimize gas", "reduce costs", "make cheaper"            | `/analyze-gas-optimization`         |
| "modernize", "upgrade to v2", "update syntax"             | `/modernize-move`                   |
| "typescript", "frontend", "call from JS", "SDK", "fullstack" | `/use-ts-sdk`                       |
| "wallet adapter", "connect wallet", "useWallet"              | `/ts-sdk-wallet-adapter`            |
| "create project", "new dApp", "scaffold"                  | Project Scaffolding section (above) |

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
6. `/use-ts-sdk` → orchestrates frontend integration (routes to ts-sdk-client, ts-sdk-transactions, ts-sdk-view-and-query, ts-sdk-wallet-adapter as needed)

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

## Integration

**Claude Code:** This file is automatically loaded when detected in the repository.

**Other Editors (Cursor, Copilot):** Include this file (`CLAUDE.md`) in your workspace context. Reference skill files in
prompts: `@skills/move/write-contracts/SKILL.md`.
