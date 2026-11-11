# Changelog

## 0.1.0 — November 2026

First public version.

**Engine**
- Exposure from fleet, hours, prices and spot share
- Price match (correlation), beta and verdict, with negative beta always a no
- Sizing at 1x with a hard cap, tick rounding, and fee and funding estimates
- Replay of the plan over history, with and without the hedge
- Monthly statement
- 41 tests, including all four example businesses end to end

**Market**
- Live SICI read from the Injective mainnet indexer, with a stale-data guard and a cached fallback
- Daily history from chronos, with a fallback that aggregates trades
- Unsigned market and limit orders, and a reduce-only close, via Keplr or Leap

**App**
- Two-question start, then your GPUs, then one clear result: hedge, small hedge or don't
- Result screen with three key numbers, the plan, a 15-month replay and the maths on demand
- Connect wallet (Keplr) from the header
- Hedge page in four steps, off by default
- Monthly statement
- Shareable example links: `/?example=<id>`
- White theme on Radix UI with shadcn-style components
- Optional AI: plain-English summary and rate-card reading, applied only after you confirm

**Deploy**
- Runs on Vercel. `data/` is bundled into every function.
- Live at https://lockrate.vercel.app
