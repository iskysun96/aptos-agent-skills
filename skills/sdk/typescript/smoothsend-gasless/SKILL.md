---
name: smoothsend-gasless
description:
  "How to sponsor gas fees for Aptos dApp users using SmoothSend. Covers 3-line wallet adapter integration
  (transactionSubmitter), Script Composer for fee-in-token stablecoin transfers, and credit-based billing.
  Triggers on: 'gasless', 'sponsor gas', 'users pay no APT', 'transactionSubmitter', 'SmoothSend',
  'fee payer', 'pay gas for users', 'no gas required'."
metadata:
  category: sdk
  tags: ["typescript", "sdk", "wallet", "gasless", "sponsored", "smoothsend", "transactionSubmitter"]
  priority: high
---

# TypeScript SDK: SmoothSend Gasless Transactions

## Purpose

Guide **gasless transaction sponsorship** on Aptos using [SmoothSend](https://smoothsend.xyz). Users sign transactions via their wallet but never pay gas — you pay per transaction from pre-loaded credits. Works as a drop-in `transactionSubmitter` for `AptosWalletAdapterProvider`.

## ALWAYS

1. **Use `@smoothsend/sdk`** — official npm package for SmoothSend integration.
2. **Pass `SmoothSendTransactionSubmitter` as `transactionSubmitter`** in `AptosWalletAdapterProvider` — this enables gasless for all `signAndSubmitTransaction` calls.
3. **Store API key in env** — use `NEXT_PUBLIC_SMOOTHSEND_API_KEY` or `VITE_SMOOTHSEND_API_KEY` (never hardcode).
4. **Use testnet for development** — testnet is always free; no credits required.
5. **Handle 402 (Insufficient credits)** — API returns 402 when credits run out; show user-friendly message and link to billing.

## NEVER

1. **Do not expose API key in server-side only apps to client** — for frontend, use `NEXT_PUBLIC_` or `VITE_` prefixed env vars.
2. **Do not skip `transactionSubmitter`** — without it, users pay gas themselves; the provider falls back to normal submission.
3. **Do not use Script Composer for arbitrary transactions** — Script Composer is for stablecoin transfers (USDC, USDT, etc.) only; use Wallet Adapter for everything else.

---

## Method 1: Wallet Adapter (Recommended — Any Transaction)

Use for swaps, NFT mints, contract calls — any transaction type.

### Installation

```bash
npm install @smoothsend/sdk @aptos-labs/wallet-adapter-react
```

### Provider Setup (3 lines)

```tsx
import { SmoothSendTransactionSubmitter } from '@smoothsend/sdk';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

const smoothSend = new SmoothSendTransactionSubmitter({
  apiKey: process.env.NEXT_PUBLIC_SMOOTHSEND_API_KEY!,
  network: 'mainnet', // or 'testnet' (always free)
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.MAINNET,
        transactionSubmitter: smoothSend,
      }}
      onError={(error) => console.error('Wallet error:', error)}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
```

After this, every `signAndSubmitTransaction` call is gasless. No other code changes needed.

---

## Method 2: Script Composer (Fee-in-Token — Stablecoin Only)

Use for USDC, USDT, WBTC, USDe, USD1 transfers. Fee (~$0.01) is deducted from the token being sent — no APT or SmoothSend credits required.

```typescript
import { ScriptComposerClient } from '@smoothsend/sdk';

const client = new ScriptComposerClient({
  apiKey: process.env.NEXT_PUBLIC_SMOOTHSEND_API_KEY!,
  network: 'mainnet',
});

// USDC Mainnet asset address
const USDC_ASSET = '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b';

const build = await client.buildTransfer({
  sender: walletAddress,
  recipient: '0xRecipient...',
  amount: '1000000', // 1 USDC (6 decimals)
  assetType: USDC_ASSET,
  decimals: 6,
  symbol: 'USDC',
});

// Sign with wallet, then submit build.signedTransaction
```

---

## Error Handling

```tsx
try {
  const response = await signAndSubmitTransaction(payload);
  await aptos.waitForTransaction({ transactionHash: response.hash });
} catch (error: any) {
  if (error?.status === 402 || error?.message?.includes('Insufficient credits')) {
    // Credits exhausted — show upgrade CTA
    toast.error('Service temporarily unavailable. Please try again later.');
    window.open('https://dashboard.smoothsend.xyz/billing', '_blank');
  } else {
    throw error;
  }
}
```

---

## Pricing

| Network   | Cost                                  |
|-----------|----------------------------------------|
| Testnet   | Free — no credits required             |
| Mainnet (Wallet Adapter) | MAX(gas×1.5, $0.01) per tx      |
| Mainnet (Script Composer) | ~$0.01 deducted from token       |

Credits are pre-loaded via [dashboard.smoothsend.xyz](https://dashboard.smoothsend.xyz).

---

## Common Mistakes

| Mistake | Correct approach |
|---------|-------------------|
| Forgetting `transactionSubmitter` | Pass `smoothSend` in `dappConfig` |
| Hardcoding API key | Use env var with `NEXT_PUBLIC_` or `VITE_` prefix |
| Using Script Composer for non-transfer tx | Use Wallet Adapter for swaps, mints, contract calls |
| Not handling 402 | Catch and show user-friendly message + billing link |
| Wrong network | Match `network` in SmoothSend config to `dappConfig.network` |

---

## References

- SmoothSend Docs: https://docs.smoothsend.xyz
- Dashboard: https://dashboard.smoothsend.xyz
- npm: https://www.npmjs.com/package/@smoothsend/sdk
- MCP (AI context): `npx @smoothsend/mcp` — tools for get_docs, estimate_credits, get_code_snippet
- Related: [ts-sdk-wallet-adapter](../ts-sdk-wallet-adapter/SKILL.md), [ts-sdk-transactions](../ts-sdk-transactions/SKILL.md)
