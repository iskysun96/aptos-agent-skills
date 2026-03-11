# Community Skills

Community skills are built by developers across the Aptos ecosystem. They showcase third-party tools, integrations, and
creative patterns that extend what AI assistants can do with Aptos.

**Important:** Community skills are independently maintained by their authors. They have not been reviewed or audited by
Aptos Labs. Use them at your own discretion.

## Contributing a Community Skill

1. **Create a folder** at `community-skills/<your-skill-name>/`
2. **Add a `SKILL.md`** following the standard skill format (see any skill under `skills/` for reference)
3. **Include metadata** in your `SKILL.md` frontmatter — at minimum:
   ```yaml
   ---
   name: your-skill-name
   description: "What your skill does"
   metadata:
     author: your-github-username
     category: sdk | move | tooling
     tags: ["relevant", "tags"]
   ---
   ```
4. **Keep it self-contained** — one `SKILL.md` per skill, no bundled sample projects. Link to external repos or docs
   instead.
5. **Open a PR** that:
   - Adds your `community-skills/<skill-name>/SKILL.md`
   - Adds a row to the **Community Skills** table in `CLAUDE.md`
   - Adds your skill path to the `community-skills` plugin entry in `.claude-plugin/marketplace.json`
   - Does **not** modify official skills, the official skills table, `use-ts-sdk` routing, or the official plugin entry

## Guidelines

- Write neutral, technical documentation — avoid marketing language
- If your skill integrates a paid service, note that clearly in the description
- Pricing details go stale — link to your docs rather than hardcoding prices
- Code examples should be complete and runnable
- Include error handling guidance

## Questions?

Open an issue in this repository.
