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
   #This is the module publisher account's private key. Be cautious about who you share it with, and ensure it is not exposed when deploying your dApp.
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

| Slash Command               | Skill                                                                     | Purpose                          |
| --------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| `/write-contracts`          | [write-contracts](skills/move/write-contracts/SKILL.md)                   | Generate secure Move contracts   |
| `/generate-tests`           | [generate-tests](skills/move/generate-tests/SKILL.md)                     | Create test suites (100% cov)    |
| `/security-audit`           | [security-audit](skills/move/security-audit/SKILL.md)                     | Audit contracts before deploy    |
| `/deploy-contracts`         | [deploy-contracts](skills/move/deploy-contracts/SKILL.md)                 | Deploy to devnet/testnet/mainnet |
| `/search-aptos-examples`    | [search-aptos-examples](skills/move/search-aptos-examples/SKILL.md)       | Find patterns from aptos-core    |
| `/analyze-gas-optimization` | [analyze-gas-optimization](skills/move/analyze-gas-optimization/SKILL.md) | Optimize gas usage               |
| `/modernize-move`           | [modernize-move](skills/move/modernize-move/SKILL.md)                     | Modernize V1 contracts to V2     |
| `/use-typescript-sdk`       | [use-typescript-sdk](skills/sdk/use-typescript-sdk/SKILL.md)              | TypeScript SDK integration       |

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
| "typescript", "frontend", "call from JS", "SDK"           | `/use-typescript-sdk`               |
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

### Frontend Integration

1. `/use-typescript-sdk` → set up Aptos client, wallet adapter, view/entry functions

### Modernize Legacy Code

1. `/modernize-move` → analyze V1 patterns, apply V2 modernizations tier-by-tier

### Optimize Existing Contracts

1. `/analyze-gas-optimization` → identify expensive operations, apply optimizations

## ALWAYS Rules (Non-Negotiable)

**Object Model:**

- ✅ Use `Object<T>` for object references (never raw addresses)
- ✅ Generate all refs (TransferRef, DeleteRef) in constructor BEFORE ConstructorRef is destroyed
- ✅ Use `object::owner(obj)` to verify ownership
- ✅ Use `object::generate_signer(&constructor_ref)` for object signers
- ✅ Use named objects for singletons: `object::create_named_object(creator, seed)`

**Security:**

- ✅ Verify signer authority: `assert!(signer::address_of(user) == expected, E_UNAUTHORIZED)`
- ✅ Check object ownership: `assert!(object::owner(obj) == signer::address_of(user), E_NOT_OWNER)`
- ✅ Validate all numeric inputs: `assert!(amount > 0 && amount <= MAX, E_INVALID_AMOUNT)`
- ✅ Use `phantom` for generic type safety: `struct Vault<phantom CoinType>`
- ✅ Protect critical fields from `mem::swap` attacks

**Testing:**

- ✅ Achieve 100% line coverage: `aptos move test --coverage`
- ✅ Test all error paths with `#[expected_failure(abort_code = E_CODE)]`
- ✅ Test access control with multiple signers
- ✅ Test input validation with invalid data

**Syntax:**

- ✅ Use inline functions with lambdas for iteration
- ✅ Use modern object functions: `object::address_to_object<T>(addr)`
- ✅ Use proper error constants: `const E_NOT_OWNER: u64 = 1;`

## NEVER Rules (Strictly Prohibited)

**Legacy Patterns:**

- ❌ NEVER use resource accounts (legacy pattern, use objects instead)
- ❌ NEVER use raw addresses for objects (use `Object<T>`)
- ❌ NEVER use `account::create_resource_account()` (replaced by named objects)

**Security Violations:**

- ❌ NEVER return ConstructorRef from functions (caller can destroy object)
- ❌ NEVER expose `&mut` in public functions (allows mem::swap attacks)
- ❌ NEVER skip signer verification in entry functions
- ❌ NEVER trust caller addresses without verification
- ❌ NEVER allow ungated transfers without good reason

**Bad Practices:**

- ❌ NEVER deploy without 100% test coverage
- ❌ NEVER skip input validation
- ❌ NEVER ignore security checklist
- ❌ NEVER copy code without understanding security implications
- ❌ NEVER use old examples without verifying they're V2-compatible

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

## Common Mistakes

| Mistake                                  | Why It's Wrong                 | Correct Pattern                                                 |
| ---------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| `public fun create(): ConstructorRef`    | Caller can destroy object      | Return `Object<T>` instead                                      |
| `public fun update(item: &mut T)`        | Allows mem::swap attacks       | Use `acquires`, borrow internally                               |
| `entry fun transfer(item_addr: address)` | Legacy pattern, no type safety | Use `Object<Item>`                                              |
| No signer verification                   | Anyone can call function       | `assert!(signer::address_of(user) == expected, E_UNAUTHORIZED)` |
| No input validation                      | Overflow, zero amounts, etc.   | `assert!(amount > 0 && amount <= MAX, E_INVALID)`               |
| Skipping tests                           | Bugs in production             | Write tests with 100% coverage                                  |
| Using resource accounts                  | Deprecated in V2               | Use named objects instead                                       |

## Troubleshooting Quick Reference

| Error                     | Cause                                      | Fix                                                            |
| ------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `LINKER_ERROR`            | Missing dependency in Move.toml            | Add required package (AptosFramework, AptosStdlib, AptosToken) |
| `ABORTED at 0x1`          | Assertion failed, no error code            | Use named error constants: `const E_CODE: u64 = N;`            |
| `Type mismatch`           | Using `address` where `Object<T>` expected | Use `Object<T>` in function signatures                         |
| `Resource already exists` | `move_to` called twice                     | Check `exists<T>(addr)` first                                  |
| `object does not exist`   | Wrong seed or creator address              | Verify seed/creator for named objects, check init_module ran   |

## Integration

**Claude Code:** This file is automatically loaded when detected in the repository.

**Other Editors (Cursor, Copilot):** Include this file (`CLAUDE.md`) in your workspace context. Reference skill files in
prompts: `@skills/move/write-contracts/SKILL.md`.
