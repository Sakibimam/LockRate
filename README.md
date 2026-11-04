# Lockrate

GPU rental prices move. If you sell GPU hours on spot, or buy them that way, that movement is your P&L. Lockrate works out how much of your monthly book floats with the market, checks whether Injective's compute index (SICI) actually tracks *your* prices, and only then sizes a hedge on the SICI perp.

Half the time the right answer is "don't hedge", and the app should say so.

Prototype. Paper mode only for now. Not financial advice.

## Status

- [x] exposure engine with tests
- [x] fit score (pearson on monthly % changes, beta for sizing) with tests
- [x] sizing at 1x with a notional cap
- [x] paper simulation
- [x] monthly statement
- [x] SICI market reads from the mainnet indexer
- [x] unsigned order builder
- [ ] web app
- [ ] rate card parsing / summaries
- [ ] live signing

## Layout

```
packages/engine     exposure, fit, sizing, simulation, statement. pure ts
packages/injective  SICI market reads and order building on @injectivelabs/sdk-ts
data                SICI history and sample profiles
```

## Running it

Node 20+, pnpm.

```bash
pnpm install
pnpm test
pnpm typecheck
```

## The index

SICI is five Nvidia cards at fixed weights: H100 40%, B200 25%, H200 15%, A100 10%, RTX 4090 10%. LO:TECH prices it from marketplace listings, publishes hourly as a trailing seven-day average. The perp (`SICI/USDC PERP`, market `0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410`) has been on Injective mainnet since 26 Oct 2026.

It tracks on-demand listings. It does not track reserved contracts, and the fit score is there to catch that.

MIT.
