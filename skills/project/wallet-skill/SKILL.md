---
name: wallet-skill
description:
  "Integrates Aptos wallets into ANY app repo. Web default: @aptos-labs/wallet-adapter-react supporting Petra Web +
  AptosConnect (included by default). Optional: Petra mobile deep links for native apps. Scope: wallet primitives only
  (provider wiring, connect/disconnect, address+network display, signAndSubmitTransaction, signMessage,
  troubleshooting). Includes non-technical workflow runbooks for Codex + Claude Code in samples/. Triggers on: 'Petra',
  'AptosConnect', 'wallet adapter', 'connect wallet', 'signAndSubmitTransaction', 'signMessage', 'wallet not detected',
  'SSR wallet issue'."
metadata:
  category: project
  tags:
    ["wallet", "petra", "aptosconnect", "wallet-adapter", "frontend", "react", "nextjs", "vite", "mobile", "workflow"]
  priority: high
---

# Wallet Skill (Aptos): Petra + AptosConnect (+ Optional Mobile)

## Purpose

Provide a **repeatable wallet integration workflow** that works across most codebases.

**Web (default):**

- Use `@aptos-labs/wallet-adapter-react`
- Support **Petra Web** and **AptosConnect** via the adapter
- Provide connect/disconnect UI + address/network display
- Provide minimal examples for:
  - `signAndSubmitTransaction` (preferred for writes)
  - `signMessage` (auth / proof-of-ownership)

**Native Mobile (optional, only if requested):**

- Petra deep links (`petra://api/v1`) for mobile2mobile signing.

> This skill is intentionally **wallet-only**. Product demos are provided as **workflow runbooks** in `samples/`.

---

## Non-Negotiable Safety Rules

- ✅ NEVER request or accept seed phrases, mnemonics, private keys, or wallet backup files.
- ✅ NEVER ask users to paste secrets into code, logs, or chat.
- ✅ Prefer **sign+submit** for writes; avoid sign-only unless explicitly needed.
- ✅ Treat “User rejected” as normal UX (Cancelled → allow retry).
- ✅ Debugging: ask only for public info (address, network, tx hash, error string).

---

## When this skill should trigger

Trigger when the user mentions:

- Petra, AptosConnect, wallet adapter, connect wallet
- signAndSubmitTransaction, signMessage
- wallet not detected / SSR issues / wrong network issues

---

## Inputs (ask only if you can’t infer from the repo)

1. Platform: **web** vs **native mobile**
2. Framework: Next App Router / Next Pages / Vite / CRA / other
3. Network: devnet / testnet / mainnet (default: testnet)

---

## Output Standard (MANDATORY)

Whenever you apply this skill, output:

1. Detected framework + root entry file(s)
2. Plan
3. Patch:
   - files created (full contents)
   - files modified (full contents or clean diff sections)
4. Commands to run
5. Verification steps (click-by-click)

---

# Web Integration (Recommended)

... (leave your existing sections unchanged) ...

---

# Native Mobile (Optional): Petra deep links

Only implement if the user explicitly needs mobile signing. Do **not** invent schema fields; follow Petra docs and
reference implementations.

---

# Troubleshooting (fast)

- Wallet not detected / list empty: provider not wrapping root; SSR misuse (Next requires client components); extension
  not installed/enabled.
- Wrong network: show current network and block actions until switched.
- User rejected: show “Cancelled” and allow retry.
- Tx failure: show tx hash (if any) and error string; verify function/type args and deployment.

---

## Sample workflows (copy/paste runbooks)

- `samples/WORKFLOW_CLAIM_DEMO_CODEX.md` — end-to-end claim demo workflow for Codex (uses multiple skills)
- `samples/WORKFLOW_CLAIM_DEMO_CLAUDE.md` — end-to-end claim demo workflow for Claude Code (uses multiple skills)
- `samples/WORKFLOW_PAYLINK_MEMO_CODEX.md` — Paylink checkout + on-chain memo workflow (Codex)
- `samples/WORKFLOW_PAYLINK_MEMO_CLAUDE.md` — Paylink checkout + on-chain memo workflow (Claude Code)

---

## References

- Claude Code Skills docs: https://code.claude.com/docs/en/skills
- Claude Skill authoring best practices:
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Anthropic Skill guide (PDF): https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf
- Codex Skills docs: https://developers.openai.com/codex/skills/
- Aptos Wallet Adapter guide: https://aptos.dev/build/sdks/wallet-adapter/dapp
- Petra docs (web + mobile): https://petra.app/docs/
