# Workflow — End-to-End Claim Demo (Claude Code)

This runbook creates a fully working demo app:

- Scaffold fullstack Aptos dApp
- Add Petra + AptosConnect wallet connect (wallet skill)
- Add Move FA “claim once” module + tests + audit
- Deploy to testnet
- Wire a Claim button UI
- Optional: gas optimization, scripts, upgradeability

## How to run (Claude Code)

Invoke skills using slash commands:

- Type `/skill-name` then paste the step prompt.

## Parameters (edit if you want)

- PROJECT_NAME: `airdrop-claim-demo`
- NETWORK: `testnet`
- TOKEN_NAME: `Demo Token`
- TOKEN_SYMBOL: `DEMO`
- DECIMALS: `0`
- CLAIM_AMOUNT_TOKENS: `100`

---

## Step 0 — Scaffold project

Copy/paste into Claude Code:

```text
/scaffold-project

Create a new fullstack Aptos dApp:
- template: boilerplate-template
- folder name: airdrop-claim-demo
- set network default to testnet (update .env if present)
Then run:
- npm install
- npm run dev
Return the URL and the exact commands you ran.
```

---

## Step 1 — Wallet integration (wallet skill)

Copy/paste into Claude Code:

```text
/wallet-skill

In airdrop-claim-demo:
- Detect the framework entry points automatically
- Add @aptos-labs/wallet-adapter-react provider at the correct app root
- Add WalletConnectPanel UI:
  - Connect Petra
  - Connect AptosConnect
  - Disconnect
  - Show address + network
- Add two demo actions:
  - signAndSubmitTransaction demo (coin::transfer to self for 1 unit)
  - signMessage demo (nonce included)
Output full patch + commands to verify.
```

---

## Step 2 — Find references

Copy/paste into Claude Code:

```text
/search-aptos-examples

Find official patterns for:
- Fungible Asset (FA) create + mint + primary store deposit
- “claim once” gating keyed by address (Table or equivalent)
Summarize what to copy (file paths + key functions).
```

---

## Step 3 — Write the Move module

Copy/paste into Claude Code:

```text
/write-contracts

Create contract/sources/airdrop.move implementing:
- FA token init in init_module:
  - name: Demo Token
  - symbol: DEMO
  - decimals: 0
- Store mint ref securely and track claimed addresses keyed by address
- entry fun claim(user: &signer):
  - abort if already claimed (E_ALREADY_CLAIMED)
  - mint CLAIM_AMOUNT_TOKENS (100)
  - deposit to user primary store
  - record claimed
  - emit ClaimedEvent(claimer, amount)
- view fun:
  - is_claimed(addr): bool
  - claim_amount(): u64
  - balance(addr): u64
  - get_metadata()
No legacy coin.
Respect Move.toml named address conventions in this project.
Output full code.
```

---

## Step 4 — Tests

Copy/paste into Claude Code:

```text
/generate-tests

Create contract/tests/airdrop_tests.move:
- claim succeeds once
- second claim aborts with E_ALREADY_CLAIMED
- views correct before/after
- balance increases after claim
Run tests and fix failures until green.
```

---

## Step 5 — Audit

Copy/paste into Claude Code:

```text
/security-audit

Audit the airdrop module for:
- double-claim correctness
- mint ref safety
- signer validation
- storage correctness
Apply must-fix changes and rerun tests.
```

---

## Step 6 — Deploy

Copy/paste into Claude Code:

```text
/deploy-contracts

Deploy the package to testnet using existing scripts if present; otherwise use aptos CLI.
After deploy:
- capture deployed module address
- ensure frontend reads module address from env/config convention (e.g., VITE_MODULE_ADDRESS)
Output: publish command + deployed address + where it’s stored.
```

---

## Step 7 — Wire Claim UI (wallet skill)

Copy/paste into Claude Code:

```text
/wallet-skill

Add a minimal AirdropClaimCard UI:
- Requires wallet connect
- Reads views: is_claimed(account.address), claim_amount(), balance(account.address)
- Shows Claim button if not claimed
- Claim uses signAndSubmitTransaction calling `${MODULE_ADDRESS}::airdrop::claim`
- Wait for confirmation then refresh views
- Show tx hash
Follow repo conventions (entry-functions/ and view-functions if present).
Output full patch + commands to demo + click-by-click demo steps.
```

---

## Step 8 — Verify via CLI (optional)

Copy/paste into Claude Code:

```text
/use-aptos-cli

Give exact aptos CLI commands to:
- confirm profile/network
- check account address/balance
- verify module published at deployed address
- verify claim tx on explorer
```

---

## Step 9 — If anything breaks

Copy/paste into Claude Code:

```text
/troubleshoot-errors

Here is my error:
<PASTE ERROR>
Diagnose and provide a minimal fix patch + re-test steps.
```

---

## Optional improvements

- Gas review: `/analyze-gas-optimization`
- Helper scripts: `/generate-move-scripts`
- Upgradeability: `/implement-upgradeable-contracts`
