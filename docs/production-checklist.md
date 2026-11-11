# Before anyone hedges real money with this

What is done, what is missing, in the order I would fix it. Ticked items are in the repo and tested.

## Engine

- [x] exposure from fleet, hours, rates, spot share
- [x] fit score from monthly returns, beta, r², low-confidence flag
- [x] verdict thresholds configurable, negative beta forces skip
- [x] sizing at 1x with notional cap, tick rounding, fee and funding estimate
- [x] paper simulation, hedged vs unhedged, vol reduction, cost of hedge
- [x] monthly statement
- [x] 41 unit tests including the four sample profiles end to end
- [ ] rolling hedge in the simulation (re-size every month instead of hold)
- [ ] fit score on weekly data once there is enough SICI history
- [ ] confidence interval on the score, not just an n < 6 flag
- [ ] stress table: what the hedge does at -30% / +30% index moves

## Market data

- [x] live SICI market read from the mainnet indexer (price, oracle, funding, fees, ticks)
- [x] stale-data guard on the newer of last trade and last funding print
- [x] cached fallback when the indexer is down
- [x] daily history from chronos with trade-aggregation fallback
- [ ] LO:TECH index history. the pre-launch monthly series is reconstructed and labelled as such
- [ ] oracle vs mark divergence alert
- [ ] funding history in the simulation instead of the last rate

## Orders

- [x] unsigned market and limit order built with sdk-ts, limits re-checked at build time
- [x] reduce-only close
- [x] Keplr and Leap through wallet-core only (no walletconnect bundle)
- [ ] pre-flight simulate and show gas before signing
- [ ] position and margin health on the live page after fill
- [ ] option order builder once SICI options reach mainnet

## Safety

- [x] paper mode default, live behind LOCKRATE_LIVE=1
- [x] 1x only, cannot be raised through env
- [x] notional cap, stale guard, non-US attestation
- [ ] per-wallet daily notional limit stored server side
- [ ] second confirmation when a plan size changes by more than 20% between preview and sign
- [ ] geo check on the live route, not just a checkbox

## App

- [x] profile form, sample profiles, pasted CSV history
- [x] rate card parsing with field-level evidence, applied only on confirm
- [x] plain-language summary, works without a key
- [ ] save profiles (currently localStorage)
- [ ] CSV upload of actual invoices, not just a price column
- [ ] mobile layout pass
- [ ] auth, if this ever becomes multi-tenant

## Ops

- [x] deploy on Vercel (https://lockrate.vercel.app), data/ bundled into the functions
- [ ] hourly cron for `pnpm snapshot`
- [ ] error reporting on the API routes
- [ ] rate limit on /api/parse and /api/explain

## Legal

- [ ] terms page. the footer disclaimer is not enough for live mode
- [ ] confirm Injective's own restrictions list and mirror it
