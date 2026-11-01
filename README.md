# Lockrate

Lockrate helps GPU operators and AI teams figure out how exposed they are to GPU rental price swings, and whether hedging on Injective's compute index (SICI) would actually help them.

Prototype. Runs in paper mode by default. Not financial advice.

## Why I'm building this

GPU rental prices move a lot, and different parts of the market don't move together. In one six-month window in 2026, one-year reserved prices went up while spot listings went down. If you're a host earning spot rates, or a team paying them, you're carrying that risk and there isn't an easy way to even measure it.

There are compute derivatives now (SICI perp and options on Injective, plus futures and perps elsewhere). But before anyone trades them, they need to answer two questions: how much am I exposed, and does this index actually follow my prices? That's the part Lockrate handles.

## What it does

1. You enter your GPU mix, monthly GPU-hours, average rate, and how much of your revenue or spend is spot vs. contracted.
2. It compares your price history (or a public proxy you pick) against SICI and gives a fit score.
3. Based on the score it says hedge, partial hedge, or don't hedge. If SICI doesn't track your prices it tells you to stay out and shows why.
4. If a hedge makes sense, it sizes a SICI perp position (or a capped option) within the budget you set.
5. Every plan is simulated against historical SICI data first.
6. In live mode you sign each order yourself from your wallet. Lockrate never touches keys or funds.
7. A monthly report compares what actually happened with what the hedged result would have been.

## Who it's for

- GPU operators whose revenue depends on spot rates: marketplace hosts, decentralized compute providers, small neoclouds.
- AI teams paying spot rates for training or inference who want to cap cost spikes.

If your revenue is mostly locked into long-term contracts, or you're a lender already covered by valuation warranties or insurance, a spot index hedge can hurt more than help. Lockrate will usually tell you that.

## Fit score

A hedge only works if the instrument moves with what you're exposed to, so this is the main piece. The score is the correlation of monthly changes between your prices and SICI.

| Score | Verdict | Result |
| --- | --- | --- |
| >= 0.7 | Hedge | Hedge sized to your exposure |
| 0.4 - 0.7 | Partial | Smaller hedge, leftover risk shown |
| < 0.4 | Don't hedge | Explanation + what the hedge would have cost |

Thresholds are configurable. The score is always calculated from data.

## Flow

```
inputs -> exposure -> fit score -> verdict
                                     |
                                     v
                              hedge planner -> paper sim -> (optional) signed order
                                                                  |
                                                                  v
                                                           monthly report
```

The LLM is only used to read pasted rate cards/invoices into the form (you confirm every field) and to explain the result in plain English. Exposure, fit score, sizing and limits are all plain code. Orders are only placed when you sign them.

## Instruments

| Instrument | Network | Notes |
| --- | --- | --- |
| SICI perpetual | Injective mainnet | Up to 10x, USDC margin. Lockrate uses 1x. |
| SICI options | Injective | Fully collateralized, capped payouts. Check availability before going live. |

SICI is made of five Nvidia GPUs at fixed weights (H100 40%, B200 25%, H200 15%, A100 10%, RTX 4090 10%). LO:TECH prices it from compute marketplace listings and publishes it hourly as a 7-day trailing average. It follows spot/on-demand prices, not long-term contracts.

## Safety

- No custody of keys or funds
- Paper mode unless live mode is turned on
- User signs every live order
- Hard caps on notional and monthly premium, 1x leverage on perps, checked before an order is built
- No plan if the latest SICI print is older than the configured limit
- No US persons in live mode (venue restriction)

## Structure

```
lockrate/
  apps/web/            Next.js app
  packages/engine/     exposure, fit score, sizing + tests
  packages/injective/  SICI data + order building (@injectivelabs/sdk-ts)
  packages/explain/    LLM prompts for parsing and summaries
  data/                cached SICI history, sample profiles
```

Market data comes from Injective's indexer and oracle APIs. Orders are built with `@injectivelabs/sdk-ts` and signed in Keplr or MetaMask. I also use the Injective MCP server to query markets while developing.

## Running it

Needs Node 20+, pnpm, and an Injective testnet wallet if you want to try live mode.

```bash
git clone https://github.com/Sakibimam/LockRate.git
cd LockRate
pnpm install
cp .env.example .env.local
pnpm dev
```

Env vars:

```
INJECTIVE_NETWORK=testnet        # or mainnet
SICI_MARKET_ID=                  # SICI perp market id
LLM_API_KEY=                     # optional
MAX_NOTIONAL_USD=
STALE_DATA_MINUTES=
```

Tests: `pnpm test`

## Demo

1. Load the "Marketplace host, 64 H100s, 100% spot" profile and check the score.
2. Switch to "Neocloud, 80% contracted". The verdict changes to don't hedge.
3. Run the paper sim and compare hedged vs unhedged.

## Known limitations

- Basis risk. SICI tracks spot listings, so contract-based pricing may not be covered.
- SICI markets only launched in October 2026, so liquidity is thin.
- Option payouts are capped.
- Not much SICI history yet, so the fit score will get more reliable over time.

## TODO

- [ ] CSV upload for revenue history
- [ ] capped options in the planner
- [ ] auto-roll with on-chain limits
- [ ] support more indexes

## License

MIT
