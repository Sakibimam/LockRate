# Contributing

Thanks for looking. Lockrate is small on purpose, and these notes keep it that way.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

You need Node 20 or later (`.nvmrc` pins 24) and pnpm. No API keys are needed for anything except the optional AI features.

## Before you open a PR

```bash
pnpm typecheck
pnpm test
```

CI runs both, plus a production build.

## Where things go

| If you're changing… | Put it in… |
| --- | --- |
| anything that produces a number (exposure, fit, size, replay) | `packages/engine`, **with a test** |
| how we read the market or build orders | `packages/injective` |
| AI summaries or rate-card reading | `packages/explain` |
| what people see | `apps/web/components` |

## Rules that don't bend

1. **The engine stays dependency-free.** If a hedge size can't be checked by reading the code, it's wrong.
2. **AI never produces a number that ends up in an order.** It can describe results and draft form inputs the user confirms. That's all.
3. **Leverage stays at 1x**, and size caps are checked both at planning and at order build.
4. **"Don't hedge" must stay reachable.** Any change to thresholds or beta handling needs a test showing the neocloud example still gets a no.

## Data

`data/` is read at request time and bundled into the deploy. If you add a file there, check `outputFileTracingIncludes` in `apps/web/next.config.ts` still matches it. Say in `data/README.md` where it came from and whether it's real or reconstructed.

## Commit style

Short, lowercase, and about what changed: `sici daily bars from trades`, `cost of hedge was always zero`.
