# data

Everything the app and the tests read from disk. Nothing in here is pulled at runtime unless you run the snapshot script.

## sici-daily.json

Real. Daily OHLC of the SICI/USDC perp on Injective mainnet, built from the indexer's trade history and bucketed per UTC day. Market id `0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410`. Refresh with:

```
pnpm snapshot
```

That hits the chronos candle endpoint first and falls back to aggregating raw trades when chronos is unavailable (it was down for most of the first week, hence the fallback).

## proxies/

Monthly series used for the fit score demo. SICI only started trading on 2026-10-26 so there is no official monthly history yet.

- `sici-monthly-backfill.json` is a reconstruction of the basket using the published weights and public H100/H200/A100/4090 rental reporting, rebased to 100 at the 2026-07-22 fixing like the real index. It is illustrative. When LO:TECH publishes history it gets swapped out, and the app already reads the real daily series for anything after launch.
- the other four are shaped price paths for the sample profiles: an H100 marketplace host, one-year reserved H100 contracts, a 4090/A100 decentralised fleet, and an on-demand inference buyer. The reserved series is anchored on reported contract moves (roughly 1.70 in Oct 2025 to 2.35 by Mar 2026) and goes the opposite way to spot on purpose, because that is the case the verdict has to catch.

Upload your own CSV in the app and none of this matters.

## profiles/

Sample operator and buyer profiles that the demo loads. Field meanings are in `packages/engine/src/types.ts`.
