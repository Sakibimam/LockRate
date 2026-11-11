# @lockrate/injective

Reads the SICI/USDC perpetual market on Injective and builds **unsigned** orders. It never signs anything.

| Export | What it does |
| --- | --- |
| `new SiciClient()` | `.market()`, `.snapshot()`, `.position(subaccountId)`, daily candles |
| `buildPerpOrder({ plan, market, injectiveAddress, limits })` | re-checks every limit, then returns an unsigned `MsgCreateDerivativeMarketOrderV2` and a preview. Throws `OrderRefused` if anything is off. |
| `buildClosePerpOrder({ position, market, injectiveAddress })` | reduce-only order on the opposite side |
| `loadConfig(env)` | network and market id from env |

Refresh the saved daily history in `data/sici-daily.json`:

```bash
pnpm snapshot    # from the repo root
```

It tries the chronos candle API first, then falls back to aggregating raw trades by UTC day.

Market: `SICI/USDC PERP`, id `0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410`, on mainnet since 26 Oct 2026.
