# What's live and what's fixed

Short answer: the GPU index price, the market details and any trade you send are live on **Injective mainnet**. The price history behind the "index match" score is partly a stored reconstruction, because the SICI market only started trading on 2026-10-26.

Lockrate has no smart contract of its own. Nothing is deployed on-chain by us. The app reads Injective's public market data and, when trading is switched on, builds a normal Injective order that **you** sign in your own wallet. No Lockrate server ever holds your keys or your money.

## Live, read from Injective every minute

| What | Where you see it | Source |
| --- | --- | --- |
| SICI price | header pill, hedge size, deposit | Injective indexer, SICI/USDC PERP market |
| Oracle (index) price | `/api/sici` | Injective oracle, `SICI/USDC` provider feed |
| 24h volume, funding rate, fees, tick sizes | plan card, order checks | Injective indexer |
| Market status (active or not) | order checks | Injective indexer |
| Freshness | green or amber dot | time since the last trade or hourly funding print |

Market id: `0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410`

The server caches this for 60 seconds. If Injective can't be reached, the app shows the last stored price, marks the data as `cached`, and switches off the "Set up hedge" button. It never trades on old data. The default limit is 180 minutes (`STALE_DATA_MINUTES`).

## Real, but stored in the repo

`data/sici-daily.json` holds the daily closes of the SICI perp since launch, pulled from Injective's trade history. The **Statement** page and the latest months of the index match use it.

It doesn't update by itself. Refresh it with `pnpm snapshot` and redeploy.

## Illustrative, until real history exists

| File | What it is |
| --- | --- |
| `data/proxies/sici-monthly-backfill.json` | the index before launch (Jul 2025 to Sep 2026), rebuilt from public H100, H200, A100 and 4090 rental prices using SICI's published weights |
| the other four files in `data/proxies/` | example price histories for the four example businesses |
| `data/profiles/*.json` | the four example businesses themselves |

So the four examples are made-up businesses on realistic price paths. Their results show how the tool behaves. They aren't anyone's real numbers.

When you paste **your own** prices (More options, then Your past prices), your side of the comparison is real. The index side before October 2026 is still the reconstruction until the index publisher releases official history. After that, it's a one-file swap.

## Trading

| | Public site (lockrate.vercel.app) | Your own copy with `LOCKRATE_LIVE=1` |
| --- | --- | --- |
| Check risk, see the plan | yes | yes |
| Connect Keplr | yes | yes |
| Build an order | no, the Hedge page says trading is off | yes, from live market data |
| Send to Injective mainnet | no | yes, after you approve it in Keplr |
| Close a hedge | no | yes, a reduce-only order |

Before any order reaches your wallet, the code checks again that the market is active, that the data is fresh, that leverage is 1x, and that the hedge is no bigger than $50,000 (`MAX_NOTIONAL_USD`). It refuses the order if any check fails.

## Check it yourself

1. **Is the price live?** Open <https://lockrate.vercel.app/api/sici>. Look for `"source":"live"` and `"fresh":true`.
2. **Is it the real market?** Ask Injective directly and compare `price` with `lastPrice` from step 1:
   ```
   curl "https://sentry.exchange.grpc-web.injective.network/api/chronos/v1/derivative/market_summary?marketId=0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410&resolution=24h"
   ```
   You can also find SICI/USDC PERP on [Helix](https://helix.app), Injective's main exchange.
3. **Does it move?** Reload `/api/sici` a few minutes later. The price and `lastPrintMs` follow the market.
4. **Is a trade real?** On your own copy with trading on, Keplr shows the full message before you approve it. After you send it, the app links to the transaction on [Injective Explorer](https://explorer.injective.network).
5. **Read the code.** Everything that talks to Injective is in `packages/injective/src/`, under 500 lines. Orders are built in `orders.ts`, and market data is read in `sici.ts`.
