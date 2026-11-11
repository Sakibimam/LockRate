# Lockrate

GPU rental prices move. If you sell GPU hours on spot, or buy them that way, that movement is your P&L. Lockrate works out how much of your monthly book floats with the market, checks whether Injective's compute index (SICI) actually tracks *your* prices, and only then sizes a hedge on the SICI perp that you sign from your own wallet.

Half the time the right answer is "don't hedge", and the app says so.

Prototype. Paper mode by default. Not financial advice.

## What's in the box

- **Exposure engine.** Fleet, hours, rates, spot share in; dollars-per-month floating and dollars-per-1%-move out. Per-card breakdown with a flag for anything outside the five SICI cards.
- **Hedge fit score.** Pearson correlation of monthly % changes between your price history and SICI, plus the regression beta that sizing actually uses. Thresholds: 0.7 hedge, 0.4 partial, below that skip. Negative beta is always a skip.
- **Sizing.** 1x only, USDC margin, hard notional cap, rounded to the market tick. Fees and funding estimated from the live market.
- **Paper simulation.** Replays the planned position over history. Hedged vs unhedged, worst month, volatility change, what the hedge cost if it lost.
- **Live market read** from the Injective mainnet indexer: last price, oracle print, 24h volume, hourly funding, fee tiers, tick sizes, and a stale-data guard.
- **Order builder.** Unsigned `MsgCreateDerivativeMarketOrderV2` / limit order with every limit re-checked, plus a reduce-only close. Signed in Keplr or Leap. No keys, no custody.
- **Monthly statement.** What the index did, what your rate did, what the hedge returned after fees and funding.
- **Optional LLM.** Reads a pasted rate card into the form (every number shown with the phrase it came from, applied only when you confirm) and writes a plain-English summary of the result. It never produces a number that drives a trade. Works without a key.

## Numbers from the sample profiles

Run against the data in `data/` on 10 Nov 2026 with the $50k default cap:

| Profile | Floating / month | Fit | Verdict | Plan | Vol change |
| --- | --- | --- | --- | --- | --- |
| Marketplace host, 64 H100, 100% spot | $70.6k | 0.98 | hedge | short 464 SICI ($50k, capped) | -61% |
| Neocloud, 512 cards, 80% on 1y contracts | $158k | -0.58 | **skip** | none | — |
| Decentralised 4090 + A100 provider | $38k | 0.55 | partial | short 174 SICI ($18.8k) | -12% |
| AI team buying on-demand H100/H200 | $36k | 0.93 | hedge | long 285 SICI ($30.7k) | -62% |

The neocloud is the point. Its contract prices rose while spot fell; a SICI short would have lost on both legs.

## Layout

```
apps/web            next 16 app: analyse, report, live
packages/engine     exposure, fit, sizing, simulation, statement. pure ts, 41 tests
packages/injective  SICI market reads and order building on @injectivelabs/sdk-ts
packages/explain    rate card parsing and summaries on @anthropic-ai/sdk
data                real SICI daily bars since launch, proxy series, sample profiles
docs                research notes, production checklist, demo script
```

Everything that produces a number is in `packages/engine` and has no dependencies. The web app and the tests call the same `run()`.

## Running it

Node 20+, pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
pnpm test         # engine tests
pnpm typecheck
pnpm snapshot     # refresh data/sici-daily.json from mainnet
```

`.env.local`:

```
INJECTIVE_NETWORK=mainnet
SICI_MARKET_ID=0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410
ANTHROPIC_API_KEY=            # optional
MAX_NOTIONAL_USD=50000
MAX_PREMIUM_USD_PER_MONTH=2000
STALE_DATA_MINUTES=180
LOCKRATE_LIVE=0               # 1 shows the live tab
```

## The index

SICI is five Nvidia cards at fixed weights: H100 40%, B200 25%, H200 15%, A100 10%, RTX 4090 10%. LO:TECH prices it from marketplace listings, publishes hourly as a trailing seven-day average, rebased to 100 at the 22 Jul 2026 fixing. The perp (`SICI/USDC PERP`) has been on Injective mainnet since 26 Oct 2026. Capped-payout SICI options are on testnet with whitelisted writers; the planner has a slot for them but only previews.

It tracks on-demand listings. It does not track reserved contracts, and the fit score will tell you that.

## Safety

- paper by default, live behind an env flag
- 1x, cannot be raised through config
- notional cap and stale-data guard enforced before an order object exists, and again at build time
- every live order signed by the user, nothing custodial
- non-US attestation on the live page, matching the venue

## Limits

- SICI has sixteen trading days of real prints. Everything before 26 Oct 2026 in the fit score is a labelled reconstruction (`data/README.md`). Upload your own CSV and the index side still uses the reconstruction for older months.
- The book is thin. Around $500k/day in the first two weeks. The cap exists for a reason.
- The simulation holds a fixed position. A monthly roll would do better and is on the list.
- Options are preview only until they reach mainnet.

See `docs/production-checklist.md` for the full list and `docs/research.md` for the competitor and demand notes (CME/Silicon Data, Kalshi/Ornn, Architect AX, ICE).

## Next

- [ ] small test position opened and closed on mainnet from the live page, tx hashes here
- [ ] capped SICI options in the planner and order builder when they ship on mainnet
- [ ] rolling hedge in the simulation
- [ ] LO:TECH index history to replace the reconstruction
- [ ] pilots with three to five operators on real revenue CSVs

MIT.
