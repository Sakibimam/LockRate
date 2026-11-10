# Compute price hedging: who else is doing it, and who actually needs it

Notes I kept while deciding whether Lockrate is worth building. Updated 10 Nov 2026.

## The instruments that exist now

| Venue | Product | Underlying | Status (Nov 2026) | Who can use it |
| --- | --- | --- | --- | --- |
| Injective | SICI/USDC perp | LO:TECH basket, 5 Nvidia cards, trailing 7d avg | mainnet since 26 Oct 2026, up to 10x, USDC margin | anyone with an Injective wallet, non-US |
| Injective | SICI options | same index, capped call/put spreads, fully collateralised | testnet, whitelisted writers, since 27 Oct 2026 | whitelist |
| CME / Silicon Data | H100 rental futures (NYMEX) | Silicon Data H100 rental index | announced for 5 Oct 2026 pending CFTC review. I could not confirm it is trading | US futures accounts |
| Kalshi | GPU rental price contracts | Ornn index, per chip (B200, H200, A100, some H100 ladders) | live since Jul 2026, monthly contracts | US retail, event-contract sized |
| Architect (AX) | compute perps, later US futures and options | Ornn and Compute Desk indexes | AX perps since early 2026 offshore; US DCM announced May 2026, pending | institutions, Bermuda / US pending |
| ICE / Ornn | H100 futures | Ornn OCPI | announced, no launch confirmed | US futures accounts |

Plus a long tail of indexes without a tradable product: Ornn OCPI, Silicon Data SDH100RT, SemiAnalysis contract pricing, various cloud trackers.

Two things stand out.

1. Everything that is actually tradable today is either a US-regulated product you need a futures account for, or SICI. For a small operator in India, Europe or Southeast Asia with a wallet and some USDC, SICI is the only thing they can touch this week.
2. None of these venues answer the question that comes before the trade. They all assume you know your exposure and that the index tracks you. That gap is the product.

## What I learned about the indexes

The one number that matters for a hedge is how closely the index moves with the hedger's own prices. The indexes disagree with each other by a lot:

- On the same week in Nov 2026 the Ornn OCPI H100 settled around $3.30/h, Silicon Data's H100 index showed about $3.01 on its chart and $2.53 in its FAQ, and marketplace floors were being quoted at $1.49 to $1.99. These are not measurement errors. They measure different things: executed on-demand trades, listed prices, and committed deals.
- SemiAnalysis reported one-year H100 contract pricing rising from about $1.70/h in Oct 2025 to about $2.35/h by Mar 2026, over a stretch where spot listings were falling. Contract and spot moved in opposite directions.
- SICI itself is a listing-based index (marketplace reference prices, outlier-filtered, trailing seven-day average). It is smooth by design, which makes it a poor fit for anyone whose revenue reprices daily and a reasonable fit for anyone pricing off listings monthly.

So "does SICI track me" is a real question with real negative answers. The reserved-contract neocloud in the sample data is the clearest case: its prices went up while the basket went down, and a SICI short would have lost money on both legs.

## Who needs this

Talked to or read about three groups. Rough sizing from public numbers, not from a market study.

**Marketplace hosts and small neoclouds (sellers).** Hundreds of operators with 8 to 512 cards listing on marketplaces (Vast, RunPod community, io.net, Akash, Spheron, Aethir hosts). Revenue floats hourly. A 64 H100 host at $2.10/h and 72% utilisation has roughly $69k/month floating and loses about $690/month for every 1% the market drops. In H1 2026 spot moved 20 to 40% peak to trough. These people have no treasury desk. They need a number and a yes/no.

**AI teams paying on-demand (buyers).** Inference-heavy startups that cannot commit to a year of reserved capacity. Their cost spikes are the mirror image of the hosts' revenue drops. Same tool, opposite side. A capped call (the SICI option, when it is on mainnet) is the natural instrument for them because it is a known premium with no margin calls.

**Lenders and GPU-backed credit.** Interesting but wrong for a spot index. Their collateral is covered by valuation warranties and the risk is residual value over years, not monthly rental drift. Lockrate says so and sends them away. Saying no is part of the product.

## Why not just build on CME / Kalshi

- Account access. A Bangkok or Bangalore host cannot open a US futures account in an afternoon. They can install Keplr.
- Size. CME contracts are built for desks. Kalshi contracts are small but settle to Ornn, which is a US-centric executed-trade index, and the user still needs a US account.
- Composability. SICI is on a chain with a public indexer and an SDK. Lockrate reads the market, checks staleness and builds an unsigned order in a few hundred lines. There is no equivalent for the regulated venues without a broker integration.
- Options. The Injective options primitive is capped-payout and fully collateralised. That is exactly the shape a small buyer wants, and no US venue offers compute options yet.

## What SICI is bad at, honestly

- Basket mismatch. If your fleet is 4090s and A100s on a p2p network, 20% of the index weight is your market and the other 80% is H100/H200/B200 pricing you do not earn. Expect a fit score around 0.5 at best.
- Smoothing. Seven-day trailing average means the index lags a sharp spot move by days. For a monthly hedge that is fine. For a weekly one it is not.
- Thin book. First two weeks: around $500k/day notional, trades arriving in bursts of about 130 a day. A $50k order moves it. Hence the notional cap.
- Short history. Sixteen trading days of real prints. The fit score before 26 Oct 2026 runs on a reconstructed series. That is labelled everywhere it appears and it is the single biggest weakness of the current build.

## What this means for Lockrate

- Lead with the verdict, not the trade. Half the users should be told not to hedge. That is the trust moment.
- Keep perps at 1x with hard caps. The point is insurance, not leverage.
- Options for buyers as soon as the option markets reach mainnet. The planner already has the slot.
- Get real revenue CSVs from five operators. That is worth more than any amount of proxy data.

## Sources

- Injective, SICI launch post (26 Oct 2026) and Injective Options post (27 Oct 2026), injective.com/blog
- Injective indexer, SICI/USDC PERP market `0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410`
- Silicon Data, H100 rental index and CME partnership notes, silicondata.com
- Ornn, Compute Price Index, data.ornn.com
- Kalshi, compute category, kalshi.com/category/commodities/compute
- Architect Financial Technologies press releases (Jan and May 2026), architect.co
- SemiAnalysis, "The Great GPU Shortage" rental capacity notes
- CFTC comment letters on compute futures (DeSilva Law, Architect), Nov 2026
- CloudZero, Coloprice, Uvik H100 pricing trackers for 2026 spot ranges
