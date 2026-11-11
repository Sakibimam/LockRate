# User guide

Lockrate answers one question for anyone whose business depends on GPU rental prices: **would hedging on Injective's SICI GPU index actually protect me?**

## Who it helps

**You rent out GPUs** (a host, a GPU cloud, or a seller on a marketplace). When rental prices fall, your income falls. A hedge **sells** SICI, so it earns money when prices drop and makes up some of the gap.

**You pay for GPUs** (an AI team, a startup or a lab). When prices rise, your bill rises. A hedge **buys** SICI, so it earns money when prices climb.

## What you get

- **A straight answer.** "You should hedge", "A small hedge could help" or "Don't hedge".
- **Protection from a bad hedge.** If your prices don't follow the index, for example on fixed one-year contracts, Lockrate says no. A hedge in that case would lose money exactly when you do.
- **The size, in dollars.** How much of your monthly money moves with the market, what a 1% move costs you, and how big the hedge should be.
- **A replay.** How your last 15 months would have looked with and without the hedge.
- **Hard safety limits.** No leverage, at most $50,000 per hedge, and no trading on old prices.
- **No sign-up.** No account and no KYC form. You keep your own funds in your own wallet. Lockrate never holds them.
- **Open to anyone outside the US** with a wallet. US GPU futures need a futures broker account most small hosts can't get.

## How to use it

### 1. Check your risk (about a minute)

1. Open <https://lockrate.vercel.app>.
2. Pick **I rent out GPUs** or **I pay for GPUs**. Or tap one of the examples to see a finished result.
3. Enter your GPUs: the model, how many, your hourly price, and how much of it is paid at market price, not on a fixed contract.
4. Optional: open **More options** to set how busy your GPUs are, or to paste your own past prices or a price list. This is what makes the answer about **your** business and not a typical one.
5. Press **See my result**.

### 2. Read the result

- **The headline** is the answer.
- **At risk** is your monthly money that moves with GPU prices.
- **If prices drop 1%** (or rise, for buyers) is what that move costs you each month.
- **Index match** shows how closely SICI has followed your prices. Strong means a hedge will follow you.
- **Your hedge** is how many SICI contracts to sell or buy, the deposit, and the monthly cost.
- **The chart** replays the past with and without the hedge. A calmer line is the point.
- **How we worked this out** shows all of the maths. Every "i" icon explains one number.

### 3. Set up the hedge (your own copy only)

Trading is switched off on the public site. To trade, run your own copy with `LOCKRATE_LIVE=1` (see the [README](../README.md#run-it-yourself)) and then:

1. Install [Keplr](https://www.keplr.app) and add USDC on Injective to it.
2. Press **Connect wallet**.
3. On **Hedge**, tick the two boxes, press **Check the order** and read the checks.
4. Press **Approve and send**, then approve in Keplr. You get a link to the transaction.
5. To undo it later, open **Close an open hedge**, find your position and close it.

### 4. Watch it

**Statement** shows what the index has done since launch and what your hedge would have made or cost after fees.

## Good to know

- **A hedge isn't free money.** It cuts swings both ways. If prices move in your favour, the hedge gives some of that back.
- **Funding.** Perpetual contracts pay or charge a small hourly amount. The plan card shows the monthly estimate.
- **New market.** SICI started trading in October 2026, so trading volume is still small. Start small.
- **Not advice.** Lockrate does the maths. It doesn't know your contracts, your taxes or your local rules.
- **US persons can't trade** this market.

What's live and what's illustrative is set out in **[whats-real.md](whats-real.md)**.
