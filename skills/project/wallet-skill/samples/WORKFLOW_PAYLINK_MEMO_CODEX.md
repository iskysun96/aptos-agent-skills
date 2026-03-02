# Workflow — Paylink Checkout + On-chain Memo (Codex)

Goal: A usable wallet demo: payment link generator + checkout + receipts + on-chain memo feed. Uses wallet adapter + a
small Move module that emits PaymentEvent with memo.

## How to run (Codex)

In Codex: type `$` or `/skills`, select the skill, then paste each step prompt below.

## Parameters (edit if you want)

- PROJECT_NAME: paylink-memo-demo
- NETWORK: testnet
- DEFAULT_RECIPIENT: 0x0000000000000000000000000000000000000000000000000000000000000001
- DEFAULT_AMOUNT_APT: 0.05
- DEFAULT_LABEL: Coffee

---

## Step 1 — Scaffold project

Use the $scaffold-project skill.

Create a new fullstack Aptos dApp:

- template: boilerplate-template
- folder name: paylink-memo-demo
- set default network to testnet (.env if present) Then run:
- npm install
- npm run dev Return the URL and commands you ran.

---

## Step 2 — Wallet integration

Use the $wallet-skill skill.

In paylink-memo-demo:

- Detect framework entry points automatically
- Add @aptos-labs/wallet-adapter-react provider at the correct app root
- Add WalletConnectPanel UI:
  - Connect Petra
  - Connect AptosConnect
  - Disconnect
  - Show address + network Output full patch + commands to verify.

---

## Step 3 — Find references

Use the $search-aptos-examples skill.

Find official patterns for:

- emitting events via EventHandle stored as a top-level field in a `has key` struct
- coin::transfer usage from a module entry function Summarize what to copy (file paths + key APIs).

---

## Step 4 — Write Move module (on-chain memo)

Use the $write-contracts skill.

Add a Move module `paylink_memo` that:

- defines PaymentEvent { from, to, amount, memo: vector<u8>, timestamp_secs }
- stores EventHandle<PaymentEvent> in a top-level field of a `has key` resource: PaymentStore { payments:
  EventHandle<PaymentEvent> }
- init_module initializes PaymentStore at the module address
- entry fun pay(sender, to, amount, memo_bytes):
  - assert amount > 0
  - coin::transfer<AptosCoin>(sender, to, amount)
  - emit PaymentEvent using the stored EventHandle No legacy coin patterns. Respect Move.toml named addresses.

Output full source file.

---

## Step 5 — Tests

Use the $generate-tests skill.

Write Move tests:

- pay transfers and emits event
- memo bytes round-trip in emitted event
- amount=0 aborts Run tests and fix failures until green.

---

## Step 6 — Audit

Use the $security-audit skill.

Audit for:

- event handle queryability
- input validation
- correct ordering (transfer before event) Apply fixes and rerun tests.

---

## Step 7 — Deploy

Use the $deploy-contracts skill.

Deploy to testnet using repo scripts if present; otherwise aptos CLI. After deploy:

- capture deployed module address
- ensure frontend reads module address from env/config convention (e.g., VITE_MODULE_ADDRESS) Output: publish command +
  deployed address + where it’s stored.

---

## Step 8 — Build UI: pay link + checkout + receipts + memo feed

Use the $wallet-skill skill.

Implement frontend features (follow repo conventions):

1. PaymentLinkBuilder:
   - inputs: recipient, amount APT, label
   - generates /pay?to=...&amount=...&label=...
   - copy link button

2. Checkout page (/pay):
   - parse params
   - require wallet connect
   - memo input box
   - Pay button submits `${MODULE_ADDRESS}::paylink_memo::pay` via signAndSubmitTransaction args: [to, amount_in_octas,
     memo_bytes]
   - show tx hash and wait for confirmation if possible
   - store receipt in localStorage (timestamp, from, to, amount, label, memo, tx hash, network)

3. Receipts page (/receipts):
   - list receipts from localStorage
   - export JSON button

4. Memo feed page (/memos):
   - fetch latest PaymentEvent events from chain (via REST events-by-handle or TS SDK)
   - display from/to/amount/memo/timestamp
   - optional filter by recipient

Add helpers:

- APT string -> octas (u64) conversion
- string -> UTF-8 bytes conversion
- address validation

Output full patch + commands + demo steps.

---

## Step 9 — Verify via CLI (optional)

Use the $use-aptos-cli skill.

Give aptos CLI commands to verify balances and tx hash on explorer.

---

## Step 10 — If anything breaks

Use the $troubleshoot-errors skill.

Here is my error: <PASTE ERROR> Diagnose and provide a minimal fix patch + re-test steps.
