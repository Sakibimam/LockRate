"use client";

import type { SiciApi } from "@/app/api/sici/route";
import { ago, num, pct, usd } from "@/lib/format";

export function SiciStrip({ market, fallbackPrice, dataGeneratedAt }: { market: SiciApi | null; fallbackPrice: number; dataGeneratedAt: string }) {
  if (!market) {
    return (
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="font-medium">SICI/USDC PERP</span>
        <span className="num">{num(fallbackPrice)}</span>
        <span className="muted">loading live print...</span>
      </div>
    );
  }
  const changeCls = market.change24hPct >= 0 ? "t-ok" : "t-bad";
  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <span className="font-medium">{market.ticker}</span>
      <span className="num text-lg">{num(market.lastPrice)}</span>
      <span className={`num ${changeCls}`}>{market.change24hPct >= 0 ? "+" : ""}{num(market.change24hPct)}% 24h</span>
      {market.oraclePrice > 0 && (
        <span className="muted num">
          index {num(market.oraclePrice)}
        </span>
      )}
      {market.volume24hUsd > 0 && <span className="muted num">vol {usd(market.volume24hUsd)}</span>}
      {market.hourlyFundingRate !== 0 && (
        <span className="muted num">funding {pct(market.hourlyFundingRate, 4)}/h</span>
      )}
      <span className="ml-auto flex items-center gap-2 text-xs">
        {market.source === "live" ? (
          <span className={market.fresh ? "t-ok" : "t-warn"}>
            {market.fresh ? "fresh" : "stale"} · last print {ago(market.lastPrintMs)}
          </span>
        ) : (
          <span className="t-warn">indexer unreachable · cached {dataGeneratedAt.slice(0, 10)}</span>
        )}
        <a
          className="muted underline"
          href={`https://helixapp.com/futures/sici-usdc-perp`}
          target="_blank"
          rel="noreferrer"
        >
          market
        </a>
      </span>
    </div>
  );
}
