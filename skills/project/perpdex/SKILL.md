--- name: perpdex description: "Generic Perp DEX architecture + correctness constraints for an off-chain orderbook perpetual exchange with on-chain escrow on Aptos. Focuses on matching correctness (maker pricing), margin/locks, liquidation flow, and API routing consistency (without prescribing specific endpoints)." metadata: category: project tags: ["perp", "dex", "orderbook", "matching-engine", "margin", "liquidation", "escrow", "api", "websocket"] priority: high ---

# Skill: Perp DEX Architecture and Correctness

## Purpose
This skill defines **generic, correctness-first constraints** for building an MVP orderbook perpetual exchange:
- off-chain matching engine
- on-chain escrow/collateral on Aptos
- REST + WebSocket APIs
- frontend trading UX

It exists to prevent subtle but critical correctness errors (pricing, priority, routing, idempotency).

## Safety and Non-Negotiables
- Never request or handle private keys/seed phrases.
- No “infinite money” / balance bypass patterns.
- All balance changes must be traceable to a user action or a forced action (liquidation/settlement).
- Operator powers must be explicit, auditable, and logged.
- Externally reachable endpoints must be retry-safe (idempotent where applicable).

---

## Canonical Architecture (MVP)

### Components

1. **On-chain escrow + settlement (Aptos Move)**
   - holds collateral (e.g., USDC/FA)
   - maintains `free` vs `locked` balances
   - emits events for deposits/withdrawals/settlements

2. **Off-chain matching engine (authoritative for orderbook + fills)**
   - maintains books per market
   - matches taker orders against resting maker orders
   - produces fills + updates positions
   - publishes updates to clients (WS) and persists history

3. **API layer (REST + WS)**
   - REST for commands + queries (implementation-defined endpoints)
   - WS for streaming orderbook/trades/mark/user events

4. **Frontend**
   - wallet connect + deposit/withdraw
   - trading UI (book/chart/order entry)
   - positions + margin + liquidation risk

---

# Matching Correctness (Critical)

## Definitions

- **Maker**: resting order already on the book
- **Taker**: incoming order that consumes liquidity

## Price-Time Priority

- Matching must honor price priority first, then time priority within price level.
- Do not “improve” execution price beyond the maker’s resting price unless explicitly designed.

## Trade Price Rule (Fix)

**Trade price is always the MAKER (resting) order’s price.**

- Taker BUY crossing asks ⇒ maker = best ask ⇒ **tradePrice = bestAsk.price**
- Taker SELL crossing bids ⇒ maker = best bid ⇒ **tradePrice = bestBid.price**

This prevents price-time priority violations.

## Fill Generation Pseudocode

- If taker is **BUY**:
  - while remaining > 0 and bestAsk.price <= taker.limit:
    - maker = bestAsk
    - fillQty = min(remaining, maker.remaining)
    - fillPrice = maker.price ✅
- If taker is **SELL**:
  - while remaining > 0 and bestBid.price >= taker.limit:
    - maker = bestBid
    - fillQty = min(remaining, maker.remaining)
    - fillPrice = maker.price ✅

## Reduce-only and Locks

- Reduce-only orders must not increase locked collateral.
- Lock/unlock logic must be deterministic and retry-safe.

---

# Margin Model (MVP)

## MVP Constraints

- isolated margin only
- leverage cap ≤ 5x (or a single constant)
- maintenance margin defined per market
- clear liquidation trigger

## Required accounting fields (conceptual)

Per user per market:

- position size, entry price, realized PnL
- unrealized PnL (mark price based)
- initial/maintenance margin requirement
- locked/free collateral

---

# Liquidation (MVP)

## Trigger (example)

- `equity < maintenanceMarginRequirement`

## Liquidation flow

1. cancel open orders (unlock)
2. force-close position (best-effort)
3. update locks and settle
4. emit liquidation record (server logs + optionally chain events)

All liquidation actions must be externally observable and replay-safe.

---

# API Routing Consistency (No endpoint prescription)

## Rule: define an API_PREFIX once and use it everywhere

Implementation must choose ONE approach and apply it consistently in:

- frontend default base URL
- server route mounting
- documentation

### Option A: API mounted under `/api`

- frontend base: `${origin}/api`
- server mounts all routes under `/api/*`

### Option B: API mounted at root

- frontend base: `${origin}`
- server mounts routes at `/*`

### MUST

- Do not mix “/api” and “no prefix” between frontend and backend.
- Do not mix route naming schemes in docs (“/order” vs “/v1/orders”)—pick one convention.

---

# WebSocket Consistency (generic)

- Define stable channel names and payload schemas once.
- User stream must emit order/fill/position/margin updates in a consistent order.

---

# Idempotency Rules (generic)

- Place order: accept a client-supplied id to dedupe retries.
- Deposit/withdraw: accept unique request id/tx hash and dedupe.
- Cancel order: safe to call multiple times.

---

# Troubleshooting Checklist

- Price violations: confirm `tradePrice` = maker.price
- Balance drift: reconcile escrow vs locks; ensure cancels unlock
- Routing 404s: confirm API_PREFIX and base URL match
- WS desync: ensure ordering + replay-safe snapshots

---
