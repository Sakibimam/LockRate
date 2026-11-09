// refreshes data/sici-daily.json from mainnet.
// usage: pnpm snapshot

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SiciClient } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../../data/sici-daily.json");

const client = new SiciClient();
const snap = await client.snapshot();
console.log(`${snap.market.ticker} last ${snap.lastPrice} oracle ${snap.oraclePrice} 24h vol $${Math.round(snap.volume24hUsd)}`);

const days = await client.dailyHistory();
console.log(`${days.length} daily bars, ${days[0]?.t} -> ${days.at(-1)?.t}`);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify(
    {
      marketId: client.cfg.marketId,
      ticker: snap.market.ticker,
      source: "injective indexer. chronos daily candles when available, otherwise trades bucketed per utc day",
      generatedAt: new Date().toISOString(),
      days: days.map((d) => ({ ...d, o: +d.o.toFixed(3), h: +d.h.toFixed(3), l: +d.l.toFixed(3), c: +d.c.toFixed(3), qty: +d.qty.toFixed(3) })),
    },
    null,
    2,
  ),
);
console.log(`wrote ${out}`);
