# @lockrate/engine

All of Lockrate's maths. No dependencies, about 700 lines, 41 tests.

```ts
import { run } from "@lockrate/engine";

const { exposure, fit, plan, sim } = run({
  profile,          // your fleet, prices, spot share
  own,              // your monthly prices: [{ t: "2026-03", v: 2.15 }, …]
  index,            // SICI monthly closes, same shape
  market: { price: 107.84, minQuantityTick: 0.001, takerFee: 0.0005, hourlyFundingRate: 0 },
});
```

| Export | Returns |
| --- | --- |
| `computeExposure(profile)` | dollars floating per month, per 1% move, hours, share inside the index |
| `computeFit({ own, index })` | price match, beta, r², verdict, reasons |
| `sizeHedge({ exposure, fit, market })` | side, contracts, margin, fees, funding, limits applied |
| `simulate({ exposure, plan, own, index })` | month-by-month replay, swings removed, cost of hedge |
| `buildStatement(...)` | monthly statement lines |
| `limitsFromEnv(env)` | caps from env, with leverage always 1 |

The maths is explained step by step in [docs/how-it-works.md](../../docs/how-it-works.md).

```bash
pnpm test    # from the repo root
```
