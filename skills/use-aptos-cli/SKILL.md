---
name: use-aptos-cli
description: Reference for Aptos CLI commands for Move development. Use when "run aptos", "compile move", "test contract", "aptos command".
---

# Use Aptos CLI Skill

## Overview

Comprehensive reference for Aptos CLI commands used in Move development workflow.

**Installation:** https://aptos.dev/build/cli

## Core Commands

### Project Initialization

```bash
# Create new Move project
aptos move init --name <project_name>

# Example
aptos move init --name my_marketplace
```

### Compilation

```bash
# Compile Move modules
aptos move compile

# Compile with specific named addresses
aptos move compile --named-addresses my_addr=0xCAFE

# Compile without fetching latest deps (faster)
aptos move compile --skip-fetch-latest-git-deps

# Generate ABI
aptos move compile --save-metadata
```

### Testing

```bash
# Run all tests
aptos move test

# Run specific test
aptos move test --filter test_name

# Run tests with coverage
aptos move test --coverage

# Generate coverage summary
aptos move coverage summary

# Generate detailed coverage report for module
aptos move coverage source --module <module_name>

# Example: View coverage for marketplace module
aptos move coverage source --module marketplace
```

### Publishing/Deployment

```bash
# Publish to devnet (default)
aptos move publish --named-addresses my_addr=<your_address>

# Publish to testnet
aptos move publish \
    --network testnet \
    --named-addresses my_addr=<your_address>

# Publish to mainnet
aptos move publish \
    --network mainnet \
    --named-addresses my_addr=<your_address>

# Publish with profile
aptos move publish \
    --profile my_profile \
    --named-addresses my_addr=<your_address>

# Upgrade existing module
aptos move publish \
    --named-addresses my_addr=<your_address> \
    --upgrade
```

### Account Management

```bash
# Initialize new account
aptos init

# Initialize with specific network
aptos init --network testnet

# Create new account with profile
aptos init --profile my_profile

# Fund account (devnet/testnet only)
aptos account fund-with-faucet --account <address>

# Fund default account
aptos account fund-with-faucet --account default

# List account resources
aptos account list --account <address>

# Get account balance
aptos account balance --account <address>
```

### Running Functions

```bash
# Run entry function
aptos move run \
    --function-id <address>::<module>::<function> \
    --args <arg1> <arg2> ...

# Example: Create NFT
aptos move run \
    --function-id 0xCAFE::nft::mint_nft \
    --args string:"My NFT" string:"Description" string:"https://uri.com"

# Run with type arguments
aptos move run \
    --function-id <address>::<module>::<function> \
    --type-args <type1> <type2> \
    --args <arg1> <arg2>
```

### View Functions

```bash
# Call view function (read-only)
aptos move view \
    --function-id <address>::<module>::<function> \
    --args <arg1> <arg2>

# Example: Get NFT name
aptos move view \
    --function-id 0xCAFE::nft::get_nft_name \
    --args address:0x123
```

### Documentation

```bash
# Generate documentation
aptos move document

# Generate and open in browser
aptos move document --open
```

### Cleanup

```bash
# Clean build artifacts
aptos move clean
```

## Advanced Commands

### Scripting

```bash
# Run Move script
aptos move run-script \
    --compiled-script-path <path_to_compiled_script>
```

### Prove (Formal Verification)

```bash
# Run Move prover
aptos move prove

# Prove specific module
aptos move prove --module <module_name>
```

### Transaction Simulation

```bash
# Simulate transaction without submitting
aptos move run \
    --function-id <address>::<module>::<function> \
    --args <args> \
    --simulate
```

## Configuration

### Config File (~/.aptos/config.yaml)

```yaml
profiles:
  default:
    private_key: "0x..."
    public_key: "0x..."
    account: "0x..."
    rest_url: "https://fullnode.devnet.aptoslabs.com/v1"
    faucet_url: "https://faucet.devnet.aptoslabs.com"

  testnet:
    private_key: "0x..."
    public_key: "0x..."
    account: "0x..."
    rest_url: "https://fullnode.testnet.aptoslabs.com/v1"
    faucet_url: "https://faucet.testnet.aptoslabs.com"

  mainnet:
    private_key: "0x..."
    public_key: "0x..."
    account: "0x..."
    rest_url: "https://fullnode.mainnet.aptoslabs.com/v1"
```

### Switching Profiles

```bash
# Use specific profile
aptos --profile testnet move publish --named-addresses my_addr=0x123

# Set default profile
export APTOS_PROFILE=testnet
```

## Common Workflows

### Development Workflow

```bash
# 1. Initialize project
aptos move init --name my_project

# 2. Write code in sources/

# 3. Compile
aptos move compile

# 4. Run tests
aptos move test

# 5. Check coverage
aptos move test --coverage
aptos move coverage summary

# 6. Fix any issues and repeat 3-5
```

### Deployment Workflow

```bash
# 1. Ensure tests pass
aptos move test --coverage

# 2. Compile
aptos move compile

# 3. Deploy to testnet first
aptos move publish \
    --network testnet \
    --named-addresses my_addr=<testnet_address>

# 4. Test on testnet
aptos move run \
    --network testnet \
    --function-id <testnet_address>::<module>::<function> \
    --args ...

# 5. If successful, deploy to mainnet
aptos move publish \
    --network mainnet \
    --named-addresses my_addr=<mainnet_address>
```

### Testing Workflow

```bash
# Run all tests
aptos move test

# Run specific test
aptos move test --filter test_create_nft

# Run with coverage
aptos move test --coverage

# Check coverage summary
aptos move coverage summary
# Expected: 100.0% coverage

# View uncovered lines
aptos move coverage source --module my_module
```

## Argument Types

### Primitive Types

```bash
# u8, u16, u32, u64, u128, u256
--args u64:1000

# bool
--args bool:true

# address
--args address:0x1
```

### Complex Types

```bash
# string (UTF-8)
--args string:"Hello World"

# hex (raw bytes)
--args hex:0x48656c6c6f

# vector
--args "u64:[1,2,3,4,5]"

# vector of strings
--args "string:[\"one\",\"two\",\"three\"]"
```

### Object Types

```bash
# Object address (for Object<T> parameters)
--args address:0x123abc...
```

## Network URLs

### Devnet
```
REST: https://fullnode.devnet.aptoslabs.com/v1
Faucet: https://faucet.devnet.aptoslabs.com
Explorer: https://explorer.aptoslabs.com/?network=devnet
```

### Testnet
```
REST: https://fullnode.testnet.aptoslabs.com/v1
Faucet: https://faucet.testnet.aptoslabs.com
Explorer: https://explorer.aptoslabs.com/?network=testnet
```

### Mainnet
```
REST: https://fullnode.mainnet.aptoslabs.com/v1
Explorer: https://explorer.aptoslabs.com/?network=mainnet
```

## Troubleshooting Commands

### Check CLI Version

```bash
aptos --version
```

### Update CLI

```bash
# Using cargo
cargo install --git https://github.com/aptos-labs/aptos-core.git aptos

# Using prebuilt binaries
# Download from: https://github.com/aptos-labs/aptos-core/releases
```

### Clear Cache

```bash
# Remove build directory
rm -rf build/

# Recompile
aptos move compile
```

### Verbose Output

```bash
# Add --verbose flag to any command
aptos move compile --verbose
aptos move test --verbose
```

## Common Error Solutions

### "Package dependencies not resolved"

```bash
# Solution: Fetch dependencies
aptos move compile
```

### "Address not found in named addresses"

```bash
# Solution: Specify named addresses
aptos move compile --named-addresses my_addr=0xCAFE
```

### "Insufficient funds"

```bash
# Solution: Fund account (testnet/devnet only)
aptos account fund-with-faucet --account default
```

### "Module already published"

```bash
# Solution: Use upgrade flag
aptos move publish --named-addresses my_addr=0x123 --upgrade
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `aptos move init` | Create new project |
| `aptos move compile` | Compile Move code |
| `aptos move test` | Run tests |
| `aptos move test --coverage` | Test with coverage |
| `aptos move publish` | Deploy module |
| `aptos move run` | Execute entry function |
| `aptos move view` | Call view function |
| `aptos account fund-with-faucet` | Get test tokens |
| `aptos account list` | View account resources |
| `aptos init` | Initialize CLI config |

## ALWAYS Rules

- ✅ ALWAYS run `aptos move test --coverage` before deployment
- ✅ ALWAYS verify 100% coverage
- ✅ ALWAYS test on testnet before mainnet
- ✅ ALWAYS use named addresses (not hardcoded)
- ✅ ALWAYS specify network for deployment
- ✅ ALWAYS check CLI version is up-to-date

## NEVER Rules

- ❌ NEVER deploy without testing
- ❌ NEVER skip coverage verification
- ❌ NEVER deploy directly to mainnet without testnet testing
- ❌ NEVER hardcode addresses in code
- ❌ NEVER commit private keys to git

## References

**Official Documentation:**
- CLI Guide: https://aptos.dev/build/cli
- Working with Move Contracts: https://aptos.dev/build/cli/working-with-move-contracts
- CLI Reference: https://aptos.dev/build/cli/cli-reference

**Related Skills:**
- `scaffold-project` - Initialize projects
- `write-contracts` - Write modules to compile
- `generate-tests` - Create tests to run
- `deploy-contracts` - Deploy modules
- `troubleshoot-errors` - Fix CLI errors

---

**Remember:** Test locally, deploy to testnet, verify, then mainnet. Always use --coverage.
