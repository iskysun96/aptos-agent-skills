# Installation Guide

## Quick Install (All Skills)

```bash
npx skills add aptos-labs/aptos-agent-skills
```

## Selective Installation

### Core Move Skills (Recommended)

```bash
npx skills add aptos-labs/aptos-agent-skills \
  --skill write-contracts \
  --skill generate-tests \
  --skill security-audit \
  --skill deploy-contracts
```

### Full Move Development

```bash
npx skills add aptos-labs/aptos-agent-skills \
  --skill write-contracts \
  --skill generate-tests \
  --skill security-audit \
  --skill deploy-contracts \
  --skill search-aptos-examples \
  --skill analyze-gas-optimization \
  --skill modernize-move
```

## Agent-Specific Installation

```bash
# For Claude Code
npx skills add aptos-labs/aptos-agent-skills -a claude-code

# For Cursor
npx skills add aptos-labs/aptos-agent-skills -a cursor

# For GitHub Copilot
npx skills add aptos-labs/aptos-agent-skills -a copilot
```

## Claude Code Plugin

```bash
/plugin marketplace add aptos-labs/aptos-agent-skills
```

## Available Skills

### Move Smart Contracts

| Skill                      | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `write-contracts`          | Generate secure Aptos Move V2 smart contracts                |
| `generate-tests`           | Generate Move unit tests targeting 100% code coverage        |
| `security-audit`           | Security audit for Move smart contracts before deployment    |
| `deploy-contracts`         | Deploy Move contracts to devnet, testnet, or mainnet         |
| `search-aptos-examples`    | Search aptos-core for reference implementations and patterns |
| `analyze-gas-optimization` | Analyze and reduce gas costs in Move smart contracts         |
| `modernize-move`           | Migrate Move V1 resource accounts to V2 object model         |

### TypeScript SDK

| Skill                   | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| `use-ts-sdk`            | Aptos TypeScript SDK orchestrator for frontend integration                     |
| `ts-sdk-client`         | Set up Aptos client with AptosConfig and network selection                     |
| `ts-sdk-account`        | Create Aptos accounts and signers from private keys or derivation paths        |
| `ts-sdk-address`        | Parse and derive Aptos account addresses (AIP-40)                              |
| `ts-sdk-transactions`   | Build, sign, and submit Aptos transactions including sponsored and multi-agent |
| `ts-sdk-view-and-query` | Call Move view functions and query on-chain Aptos data                         |
| `ts-sdk-types`          | Map Move types to TypeScript (u64, u128, address, vector)                      |
| `ts-sdk-wallet-adapter` | Integrate Aptos wallets into React apps with useWallet                         |

### Project Setup

| Skill                  | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `create-aptos-project` | Scaffold new Aptos dApp projects with create-aptos-dapp |

### Community

| Skill                | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `smoothsend-gasless` | Sponsor gas fees for Aptos transactions with SmoothSend |

## Verifying Installation

After installation, verify the skills are available:

```bash
# Check installed skills
ls ~/.claude/skills/

# Or for Cursor
ls ~/.cursor/skills/
```

## Uninstalling

```bash
npx skills remove aptos-labs/aptos-agent-skills
```

## Browse on Marketplaces

- **SkillsMP:** [skillsmp.com/search?q=aptos](https://skillsmp.com/search?q=aptos)
- **Skills.sh:** [skills.sh/search?q=aptos](https://skills.sh/search?q=aptos)
- **SkillHub:** [skillhub.club/search?q=aptos](https://www.skillhub.club/search?q=aptos)
- **ClawHub:** [clawhub.ai/search?q=aptos](https://clawhub.ai/search?q=aptos)

## Manual Installation

If you prefer manual installation:

1. Clone the repository:

   ```bash
   git clone https://github.com/aptos-labs/aptos-agent-skills.git
   ```

2. Copy to your agent's skills directory:

   ```bash
   # For Claude Code
   cp -r aptos-agent-skills/skills/* ~/.claude/skills/
   cp -r aptos-agent-skills/patterns/* ~/.claude/patterns/
   ```

3. Reference in your project by including `CLAUDE.md` in your workspace context.
