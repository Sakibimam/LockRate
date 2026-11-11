"use client";

import type { SiciApi } from "@/app/api/sici/route";
import { ago, num } from "@/lib/format";

export function MarketLine({ market, fallbackPrice }: { market: SiciApi | null; fallbackPrice: number }) {
  const price = market?.lastPrice || fallbackPrice;
  const change = market?.change24hPct ?? 0;
  let status = "Checking the market…";
  let cls = "muted";
  if (market) {
    if (market.source !== "live") {
      status = "Market unreachable, showing saved prices";
      cls = "t-warn";
    } else if (!market.fresh) {
      status = `Last trade ${ago(market.lastPrintMs)}`;
      cls = "t-warn";
    } else {
      status = `Updated ${ago(market.lastPrintMs)}`;
    }
  }
  return (
    <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
      <span>
        GPU price index <strong className="num">{num(price)}</strong>
      </span>
      {market?.source === "live" &&
        (Math.abs(change) < 0.01 ? (
          <span className="muted">No change today</span>
        ) : (
          <span className={`num ${change > 0 ? "t-ok" : "t-bad"}`}>
            {change > 0 ? "Up" : "Down"} {num(Math.abs(change))}% today
          </span>
        ))}
      <span className={cls}>{status}</span>
    </p>
  );
}
