# Aptos Move V2 Agent Skills

This repository provides specialized skills for AI assistants to build secure, modern Aptos Move V2 smart contracts.

**Main AI Instructions:** See [`setups/AGENTS.md`](setups/AGENTS.md) for complete guidance.

## Quick Links

- **[AI Assistant Guide](setups/AGENTS.md)** - Main orchestration file with workflows
- **[Object Patterns](patterns/OBJECTS.md)** - Object model reference
- **[Security Guide](patterns/SECURITY.md)** - Security checklist
- **[Testing Guide](patterns/TESTING.md)** - Test generation patterns
- **[Modern Syntax](patterns/MOVE_V2_SYNTAX.md)** - V2 syntax guide

## Skills

- **[write-contracts](skills/write-contracts/SKILL.md)** - Generate secure Move contracts
- **[generate-tests](skills/generate-tests/SKILL.md)** - Create comprehensive test suites
- **[security-audit](skills/security-audit/SKILL.md)** - Audit contracts before deployment
- **[scaffold-project](skills/scaffold-project/SKILL.md)** - Initialize new projects
- **[search-aptos-examples](skills/search-aptos-examples/SKILL.md)** - Find example patterns
- **[use-aptos-cli](skills/use-aptos-cli/SKILL.md)** - CLI command reference
- **[deploy-contracts](skills/deploy-contracts/SKILL.md)** - Deploy to networks
- **[troubleshoot-errors](skills/troubleshoot-errors/SKILL.md)** - Debug common errors

## Core Principles

1. **Search first** - Check aptos-core examples before writing
2. **Use objects** - Always use `Object<T>` references (never addresses)
3. **Security first** - Verify signers, validate inputs, protect references
4. **Test everything** - 100% coverage required
5. **Modern syntax** - Use inline functions, lambdas, V2 patterns

## Integration

**Claude Code:** This file is automatically loaded when detected in the repository.

**Other Editors:** Include `setups/AGENTS.md` in your workspace context.

---

For detailed instructions, see [`setups/AGENTS.md`](setups/AGENTS.md).
