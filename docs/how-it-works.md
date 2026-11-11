# How Lockrate works

This walks through every number the app shows, using one real example from the repo. You don't need a finance background. If you can follow a shopping receipt, you can follow this.

**The example:** a marketplace host with **64 H100 GPUs**. All of its income is at market prices, the GPUs are rented out **72%** of the time, and the average price is **$2.10 per GPU-hour**. It's the `marketplace-host-64-h100` profile in [`data/profiles/`](../data/profiles).

Every function named below lives in [`packages/engine/src/`](../packages/engine/src).

---

## Step 1. How much money moves with the market?

*Code: `computeExposure()` in `exposure.ts`*

A month has about **730 hours**. Start with how many GPU-hours you actually sell:

```
64 GPUs × 730 hours × 72% in use  =  33,638 GPU-hours a month
```

Multiply by the price to get monthly income:

```
33,638 hours × $2.10  =  $70,641 a month
```

Some businesses lock part of their income into fixed-price contracts. That part doesn't move with the market, so we only count the floating part, the **spot share**. This host is 100% spot, so:

```
$70,641 × 100%  =  $70,641 floats with the market
```

And the number people actually feel:

```
$70,641 ÷ 100  =  $706 lost for every 1% the market drops
```

A 20% price drop, which happened in 2026, costs this host about **$14,000 a month**.

> **Sellers vs buyers.** If you *rent out* GPUs, falling prices hurt you. If you *rent* GPUs, rising prices hurt you. The maths is the same, but the hedge points the other way (step 4).

**Cards outside the index.** SICI covers H100, B200, H200, A100 and RTX 4090. If part of your fleet is something else, the app counts those hours and warns you. More than half the fleet outside the index means "expect drift".

---

## Step 2. Does the index move like your prices?

*Code: `computeFit()` in `fit.ts`*

This is the step most tools skip, and the one that matters most.

We take your monthly prices and the SICI index's monthly prices. For each month, we work out the **percentage change** from the month before:

| Month | Your price | Change | SICI | Change |
| --- | ---: | ---: | ---: | ---: |
| Jan | $2.20 | | 104.0 | |
| Feb | $2.09 | −5.0% | 99.3 | −4.5% |
| Mar | $2.15 | +2.9% | 101.9 | +2.6% |
| … | … | … | … | … |

*Illustrative rows. The real series are in `data/proxies/`.*

Then we ask two questions about those two columns of changes.

**1. Do they move together?** This is the **price match**, a correlation from −1 to +1:

| Score | Meaning | App says |
| --- | --- | --- |
| near **+1** | when one goes up, the other goes up | Strong |
| around **0.5** | sometimes together, sometimes not | Some |
| near **0** | no relationship | Weak |
| **negative** | they move in *opposite* directions | Opposite |

**2. How strongly?** This is **beta**. A beta of 1.0 means a 10% move in SICI usually comes with a 10% move in your price. A beta of 0.5 means about 5%. We use beta to size the hedge, so a hedge on a gentle-moving business is smaller.

**For our host:** price match **0.98**, beta **1.06**, measured over **15 months**. H100 marketplace prices and a basket that's 40% H100 listings move almost in lockstep.

**For the neocloud example:** price match **−0.58**. Its one-year contract prices went *up* while marketplace prices went *down*. That's a different market wearing the same GPU.

> **Fewer than 6 months of data?** The app still shows a result, but says it's a first look.

---

## Step 3. The verdict

*Code: `verdictFor()` in `fit.ts`*

```
price match ≥ 0.7          →  Hedge         (cover 100%)
price match 0.4 to 0.7     →  Small hedge   (cover 50%)
price match below 0.4      →  Don't hedge
beta below zero            →  Don't hedge, whatever the score
```

The last rule is the safety net. If your prices move against the index, a "hedge" would lose money in the same months your business does. No score overrides that.

**Our host: 0.98, so Hedge.**

---

## Step 4. How big should the hedge be?

*Code: `sizeHedge()` in `sizing.ts`*

```
ideal size  =  floating dollars × coverage × beta
            =  $70,641 × 100% × 1.06
            =  $74,738
```

Then the guardrails apply:

1. **Size cap.** The app never builds anything bigger than `MAX_NOTIONAL_USD`, which defaults to **$50,000**. The SICI market is young and thin, and a bigger order would move the price against you. Our host hits the cap, so its hedge is **$50,000**.
2. **Convert to contracts.** One SICI contract is worth the index price, which was **107.84** on 10 Nov 2026:
   ```
   $50,000 ÷ 107.84  =  463.649 contracts
   ```
   This is rounded *down* to the market's smallest step of 0.001.
3. **Direction.** The host earns less when prices fall, so it **sells** (goes short). It makes money when the index falls. The AI-team example *pays* more when prices rise, so it **buys** (goes long).
4. **No leverage.** You put up the full $50,000 in USDC as margin. That means no borrowing and no margin calls on a normal day. This is fixed in code.

**Running costs**, estimated from the live market:

| Cost | How it's worked out | Our host |
| --- | --- | --- |
| Trading fees | size × taker fee × 2, once to open and once to close | about $50 |
| Holding cost (funding) | size × hourly funding rate × 720 hours | depends on the market. It can be paid *to* you. |

---

## Step 5. Would it actually have helped?

*Code: `simulate()` in `simulate.ts`*

We replay the last 15 months. For each month:

```
without hedge  =  floating dollars × your price change
hedge result   =  contracts × index change  (sign flipped for a sell)  −  funding
with hedge     =  without hedge + hedge result
```

Then we compare how bumpy the two are, using the standard deviation of monthly results:

```
swings removed  =  1 − (bumpiness with hedge ÷ bumpiness without)
```

**Our host: 61% of the month-to-month swings removed.** The worst months mostly disappear.

The replay is deliberately conservative. It holds one position size for all 15 months. A real hedge would be re-sized monthly as the business changes, and that would usually do better. The app also shows the **cost of the hedge**: what you'd have lost on the hedge plus fees, if it lost money overall. Insurance isn't free, and you should see the premium.

---

## Step 6. Placing it (optional)

*Code: `buildPerpOrder()` in `packages/injective/src/orders.ts`*

Off by default. When someone turns it on with `LOCKRATE_LIVE=1`, these steps happen in order:

1. The plan from the risk check is loaded from your browser.
2. You connect **Keplr** or **Leap**, and confirm you're not a US person and that you've seen the replay.
3. Lockrate fetches the live market and **checks everything again**: size cap, 1x, fresh data, minimum order size, price step. Any failure means no order is built.
4. Your wallet shows you the exact order. **You** approve it, or you don't.
5. Later, *Close an open hedge* reads your position back and builds an order that can only reduce it, never flip it.

---

## The four examples, side by side

| | Host, 64 H100 | Neocloud, 512 cards | 4090 + A100 provider | AI team (buyer) |
| --- | ---: | ---: | ---: | ---: |
| Floating per month | $70,641 | $158,100 | $38,062 | $36,442 |
| Per 1% move | $706 | $1,581 | $381 | $364 |
| Price match | 0.98 | **−0.58** | 0.55 | 0.93 |
| Beta | 1.06 | −0.56 | 0.99 | 0.84 |
| Verdict | Hedge | **Don't hedge** | Small hedge | Hedge |
| Side | sell | none | sell | buy |
| Contracts | 463.649 | 0 | 174.357 | 284.868 |
| Size | $50,000 (capped) | $0 | $18,803 | $30,720 |
| Swings removed | 61% | n/a | 12% | 62% |

`pnpm test` runs all four through the engine. `packages/engine/test/profiles.test.ts` checks each verdict, side and leverage, and that every hedge it recommends actually reduces swings.

---

## Where the data comes from

| Data | Real or reconstructed | File |
| --- | --- | --- |
| SICI daily prices since 26 Oct 2026 | **Real**, from the Injective mainnet indexer | `data/sici-daily.json` |
| SICI monthly history before launch | Reconstructed from published weights and public rental reports | `data/proxies/sici-monthly-backfill.json` |
| Example businesses' price histories | Shaped from public reporting, for the demo | `data/proxies/*.json` |
| Live price, funding, fees | **Real**, fetched on page load | `/api/sici` |

Paste your own monthly prices and the example histories stop mattering. More detail in [`data/README.md`](../data/README.md).
