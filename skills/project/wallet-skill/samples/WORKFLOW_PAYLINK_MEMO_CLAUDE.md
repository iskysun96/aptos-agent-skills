# Workflow — Paylink Checkout + On-chain Memo (Claude Code)

Goal: A usable wallet demo: payment link generator + checkout + receipts + on-chain memo feed. Uses wallet adapter + a
small Move module that emits PaymentEvent with memo.

## How to run (Claude Code)

In Claude Code: type `/skill-name`, then paste each step prompt below.

## Parameters (edit if you want)

- PROJECT_NAME: paylink-memo-demo
- NETWORK: testnet
- DEFAULT_RECIPIENT: 0x0000000000000000000000000000000000000000000000000000000000000001
- DEFAULT_AMOUNT_APT: 0.05
- DEFAULT_LABEL: Coffee

---

## Step 1 — Scaffold

/scaffold-project

Create a new fullstack Aptos dApp:

- template: boilerplate-template
- folder name: paylink-memo-demo
- set default network to testnet (.env if present) Then run:
- npm install
- npm run dev Return the URL and commands you ran.

---

## Step 2 — Wallet integration

/wallet-skill

In paylink-memo-demo:

- Detect framework entry points
- Add wallet adapter provider at app root
- Add WalletConnectPanel (Petra/AptosConnect/Disconnect + address/network) Output full patch + commands.

---

## Step 3 — Find references

/search-aptos-examples

Find patterns for:

- emitting EventHandle events (stored as top-level field in a key struct)
- coin::transfer from a module entry function Summarize what to copy.

---

## Step 4 — Write Move module (on-chain memo)

/write-contracts

Add module `paylink_memo`:

- PaymentStore { payments: EventHandle<PaymentEvent> } stored at module address
- PaymentEvent includes memo bytes + timestamp
- init_module initializes store
- entry fun pay(sender, to, amount, memo_bytes):
  - validate amount > 0
  - transfer APT
  - emit PaymentEvent No legacy coin. Respect Move.toml named addresses.

Output full source.

---

## Step 5 — Tests

/generate-tests

Write and run tests:

- transfer + event emission
- memo bytes round trip
- amount=0 aborts Fix failures until green.

---

## Step 6 — Audit

/security-audit

Audit correctness + event handle queryability. Apply fixes and rerun tests.

---

## Step 7 — Deploy

/deploy-contracts

Deploy to testnet, output module address, and where the frontend stores it (env/config).

---

## Step 8 — UI + memo feed

/wallet-skill

Implement:

- PaymentLinkBuilder (/)
- Checkout page (/pay) calling `${MODULE_ADDRESS}::paylink_memo::pay` with memo bytes
- Receipts page (/receipts) stored in localStorage + export JSON
- On-chain memo feed (/memos) showing PaymentEvent events fetched via REST or TS SDK Add validation and APT->octas
  conversion. Output patch + demo steps.

---

## Step 9 — Verify via CLI (optional)

/use-aptos-cli

Commands to verify balances and tx hash.

---

## Step 10 — If stuck

/troubleshoot-errors

Paste the exact error; request minimal fix patch.
