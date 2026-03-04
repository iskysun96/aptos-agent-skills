# Aptos Agent Skills

**AI-powered skills for building fullstack Aptos dApps - smart contracts and frontend integration**

This repository provides specialized skills and patterns for AI assistants (Claude Code, Cursor, GitHub Copilot, future
Aptos Vibe tool) to help developers build secure, well-tested Aptos dApps following best practices.

## Features

- **8 Specialized Skills** - Context-aware skills for Move smart contract and TypeScript SDK development
- **Move Smart Contracts** - Modern Move V2 object model patterns
- **Security-First** - Comprehensive security checklist and audit patterns
- **100% Test Coverage** - Automated test generation with coverage requirements
- **Auto-Activation** - Skills trigger automatically based on developer actions
- **Pattern Library** - Reference documentation for objects, digital assets, fungible assets, and more

## Installation

### Via npx skills (Recommended)

```bash
npx skills add iskysun96/aptos-agent-skills
```

### Claude Code Plugin

```bash
/plugin marketplace add iskysun96/aptos-agent-skills
```

### Selective Installation

```bash
# Core Move skills only
npx skills add iskysun96/aptos-agent-skills \
  --skill write-contracts \
  --skill generate-tests \
  --skill security-audit \
  --skill deploy-contracts
```

See [INSTALL.md](INSTALL.md) for more installation options.

## Quick Start

### For Claude Code Users

1. Install via npx skills or clone this repository:

   ```bash
   npx skills add iskysun96/aptos-agent-skills
   # or
   git clone https://github.com/iskysun96/aptos-agent-skills.git
   ```

2. The `CLAUDE.md` file will be automatically detected and loaded by Claude Code

3. Start developing - skills activate automatically:
   - "Create a new dApp" → project scaffolding guidance in CLAUDE.md
   - "Write an NFT contract" → `/write-contracts` activates
   - After writing code → `/generate-tests` auto-activates
   - "Deploy to testnet" → `/deploy-contracts` activates
   - "Check security" → `/security-audit` activates

### For Other Editors (Cursor, Copilot)

1. Install via npx skills or clone this repository
2. Reference skill files in your prompts:
   ```
   @skills/move/write-contracts/SKILL.md Help me build an NFT marketplace
   ```
3. Include `CLAUDE.md` in your workspace context

## Repository Structure

```
aptos-agent-skills/
├── CLAUDE.md                              # Main guide for AI assistants (all editors)
├── INSTALL.md                             # Installation guide
├── README.md
├── package.json
├── .claude-plugin/
│   └── marketplace.json                   # Claude Code marketplace config
│
├── skills/
│   ├── sdk/
│   │   └── use-typescript-sdk/            # TypeScript SDK guide
│   └── move/
│       ├── write-contracts/
│       ├── generate-tests/
│       ├── security-audit/
│       ├── deploy-contracts/
│       ├── search-aptos-examples/
│       ├── analyze-gas-optimization/
│       └── modernize-move/
│
└── patterns/
    ├── move/
    │   ├── OBJECTS.md
    │   ├── SECURITY.md
    │   ├── DIGITAL_ASSETS.md
    │   ├── FUNGIBLE_ASSETS.md
    │   ├── MOVE_V2_SYNTAX.md
    │   ├── ADVANCED_TYPES.md
    │   ├── STORAGE_OPTIMIZATION.md
    │   └── TESTING.md
    └── fullstack/
        └── TYPESCRIPT_SDK.md
```

## Core Principles

### 1. Digital Asset Standard for NFTs

```move
// Use Aptos Digital Asset standard
use aptos_token_objects::collection;
use aptos_token_objects::token;
use aptos_token_objects::aptos_token::AptosToken;

public entry fun list_nft(
    seller: &signer,
    nft: Object<AptosToken>,  // Digital Asset standard
    price: u64
)
```

### 2. Object-Centric Development

```move
// MODERN (V2): Type-safe objects
public entry fun transfer_item(
    owner: &signer,
    item: Object<Item>,  // Type-safe!
    recipient: address
)
```

### 3. Frontend Integration

```typescript
// Entry function (write)
const payload = {
  function: `${MODULE_ADDRESS}::counter::increment`,
  functionArguments: []
};
await signAndSubmitTransaction({ data: payload });

// View function (read)
const [count] = await aptos.view({
  payload: {
    function: `${MODULE_ADDRESS}::counter::get_count`,
    functionArguments: [accountAddress]
  }
});
```

## Skills Overview

### Move Smart Contracts

- **write-contracts** - Generate secure Move V2 contracts
- **generate-tests** - Create comprehensive test suites (100% coverage required)
- **security-audit** - Security auditing before deployment
- **deploy-contracts** - Deploy to devnet/testnet/mainnet
- **search-aptos-examples** - Find patterns from aptos-core
- **analyze-gas-optimization** - Optimize gas usage
- **modernize-move** - Modernize V1 contracts to V2

### TypeScript SDK

- **use-typescript-sdk** - Guide for using @aptos-labs/ts-sdk (client setup, transactions, view functions, wallet
  adapter)

## Example Workflows

### Workflow: Build Move Contracts

1. Scaffold project with `create-aptos-dapp` (see CLAUDE.md)
2. `/write-contracts` → Write Move modules
3. `/generate-tests` → Create Move tests
4. `/security-audit` → Audit before deployment
5. `/deploy-contracts` → Deploy to network

## Formatting

This project uses Prettier for consistent markdown formatting:

```bash
# Format all markdown files
npm run format

# Check formatting without making changes
npm run format:check
```

## Resources

### Official Aptos Documentation

- **Object Model:** https://aptos.dev/build/smart-contracts/object
- **Security Guidelines:** https://aptos.dev/build/smart-contracts/move-security-guidelines
- **Move Book:** https://aptos.dev/build/smart-contracts/book
- **TypeScript SDK:** https://aptos.dev/sdks/ts-sdk
- **Wallet Adapter:** https://aptos.dev/sdks/wallet-adapter

### Template Sources

- **Fullstack Template:** https://github.com/aptos-labs/create-aptos-dapp/tree/main/templates/boilerplate-template
- **Contract-only Template:**
  https://github.com/aptos-labs/create-aptos-dapp/tree/main/templates/contract-boilerplate-template

## Contributing

We welcome contributions! Areas to contribute:

1. **Skills** - Add new skills or improve existing ones
2. **Patterns** - Enhance pattern documentation
3. **Examples** - Add working examples
4. **Bug Fixes** - Fix issues in skill logic or examples

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Roadmap

- [x] Core Move skills (8 skills)
- [x] Agent Skills Open Standard compliance
- [x] TypeScript SDK skill (use-typescript-sdk)
- [ ] Wallet integration skills (Coming Soon)
- [ ] Frontend integration skills (Coming Soon)
- [ ] E2E testing skills (Coming Soon)
- [ ] Example projects

---

**Built for secure, modern Aptos dApp development with AI assistance.**
