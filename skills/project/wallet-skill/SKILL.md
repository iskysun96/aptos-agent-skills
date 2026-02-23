--- name: wallet-skill description: "Integrate Aptos wallets into ANY app repo. Web default: @aptos-labs/wallet-adapter-react supporting Petra Web + AptosConnect (included by default). Optional: Petra mobile deep links for native apps. Scope: wallet primitives only (provider wiring, connect/disconnect, address+network display, signAndSubmitTransaction, signMessage, troubleshooting). Includes non-technical workflow runbooks for Codex + Claude Code in samples/." metadata: category: project tags: ["wallet", "petra", "aptosconnect", "wallet-adapter", "frontend", "react", "nextjs", "vite", "mobile", "workflow"] priority: high --- # Wallet Skill (Aptos): Petra + AptosConnect (+ Optional Mobile)

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

> This skill is intentionally **wallet-only**. Product demos (like “claim button”) are provided as **workflow runbooks** in `samples/`.

---

## Non‑Negotiable Safety Rules

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

## Step 1 — Detect the root entry point

Use repo inspection:

- Next.js App Router: `app/layout.tsx` (wrap with a client `Providers` component)
- Next.js Pages Router: `pages/_app.tsx`
- Vite React: `src/main.tsx`
- CRA React: `src/index.tsx`

## Step 2 — Install deps (if missing)

```bash
pnpm add @aptos-labs/wallet-adapter-react
# or npm/yarn
```

## Step 3 — Provider (SSR-safe)

**Guidance:** show Petra as an opt-in wallet; AptosConnect is included by default and may appear in the wallet list.

```tsx
"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

// Show Petra in the wallet list even if not installed
const optInWallets = ["Petra"];

// Optional branding for AptosConnect flow
const dappInfo = {
  aptosConnect: {
    dappName: "My awesome dapp",
    dappImageURI: "..."
  }
};

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider autoConnect optInWallets={optInWallets} dappInfo={dappInfo}>
      {children}
    </AptosWalletAdapterProvider>
  );
}
```

## Step 4 — Connect/Disconnect Panel (Petra + AptosConnect)

> `useWallet()` is a React hook: only call it inside components or custom hooks.

```tsx
"use client";

import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function WalletConnectPanel() {
  const { connect, disconnect, connected, wallets, account, network } = useWallet();
  const [error, setError] = useState<string | null>(null);

  const connectByNeedle = async (needle: string) => {
    setError(null);
    const w = wallets.find((x) => (x.name || "").toLowerCase().includes(needle.toLowerCase()));
    if (!w) throw new Error(`${needle} not found in wallet list`);
    await connect(w.name);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {!connected ? (
          <>
            <button onClick={() => void connectByNeedle("petra")}>Connect Petra</button>
            <button onClick={() => void connectByNeedle("aptosconnect")}>Connect AptosConnect</button>
          </>
        ) : (
          <button onClick={() => void disconnect()}>Disconnect</button>
        )}
      </div>

      <div>
        <div>
          <b>Address:</b> {account?.address || "-"}
        </div>
        <div>
          <b>Network:</b> {network?.name || "-"}
        </div>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
```

## Step 5 — signAndSubmitTransaction (preferred)

```tsx
"use client";

import React, { useState } from "react";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";

export function SubmitTxDemo() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setHash(null);
    setError(null);
    if (!account) return;

    // Safe demo: transfer to self
    const tx: InputTransactionData = {
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [APTOS_COIN],
        functionArguments: [account.address, 1]
      }
    };

    try {
      const pending = await signAndSubmitTransaction(tx);
      setHash(pending.hash);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  return (
    <div>
      <button onClick={() => void send()} disabled={!account}>
        Send demo tx
      </button>
      {hash && <div>Tx hash: {hash}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
```

## Step 6 — signMessage (auth / proof-of-ownership)

```tsx
"use client";

import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function SignMessageDemo() {
  const { account, signMessage } = useWallet();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sign = async () => {
    setResult(null);
    setError(null);
    if (!account) return;

    try {
      const res = await signMessage({
        message: "Sign in to this app",
        nonce: String(Date.now())
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  return (
    <div>
      <button onClick={() => void sign()} disabled={!account}>
        Sign message
      </button>
      {result && <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
```

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

---

## References

- Claude Code Skills docs: https://code.claude.com/docs/en/skills
- Claude Skill authoring best practices:
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Anthropic Skill guide (PDF): https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf
- Codex Skills docs: https://developers.openai.com/codex/skills/
- Aptos Wallet Adapter guide: https://aptos.dev/build/sdks/wallet-adapter/dapp
- Petra docs (web + mobile): https://petra.app/docs/
