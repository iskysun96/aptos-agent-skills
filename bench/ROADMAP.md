# Bench Framework Roadmap

## Future Scope

### Coverage Assertion
Run `aptos move test --coverage`, parse coverage percentage, score based on threshold (e.g., 80% = pass). Would enhance generate-tests eval.

### Multi-Model Comparison
Run same test cases against Haiku, Sonnet, Opus to find cost/quality sweet spot per skill. Add provider variants in promptfooconfig.yaml.

### LLM-Graded Rubric
Use `llm-rubric` assertion type more broadly for subjective quality scoring on advisory skills (deploy-contracts, search-aptos-examples, analyze-gas-optimization).

### Prompt Caching Analysis
Measure cost reduction from Anthropic prompt caching on repeated system prompts. Compare cached vs uncached runs.

### Eval Dashboard
Export historical results to a simple static site or spreadsheet for team visibility. Could use promptfoo's built-in export or custom script.

### Automated Skill Improvement
When eval detects regression, auto-generate improvement suggestions based on failure patterns. Could integrate with CI to create issues.

### Cross-Skill Integration Tests
Test workflows that chain skills:
- write-contracts -> generate-tests -> security-audit
- write-contracts -> deploy-contracts
- write-contracts -> use-typescript-sdk (full-stack)
