import { NextResponse } from "next/server";
import { SiciClient } from "@lockrate/injective";
import { limitsFromEnv, isFresh } from "@lockrate/engine";
import { loadDaily } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SiciApi {
  source: "live" | "cached";
  ticker: string;
  marketId: string;
  lastPrice: number;
  oraclePrice: number;
  change24hPct: number;
  volume24hUsd: number;
  hourlyFundingRate: number;
  takerFee: number;
  minQuantityTick: number;
  minPriceTick: number;
  status: string;
  lastPrintMs: number;
  fresh: boolean;
  staleLimitMinutes: number;
  error?: string;
}

let cache: { at: number; body: SiciApi } | null = null;

export async function GET() {
  const limits = limitsFromEnv(process.env);
  if (cache && Date.now() - cache.at < 60_000) return NextResponse.json(cache.body);

  const daily = loadDaily();
  const last = daily.days.at(-1);
  const fallback: SiciApi = {
    source: "cached",
    ticker: daily.ticker,
    marketId: daily.marketId,
    lastPrice: last?.c ?? 0,
    oraclePrice: 0,
    change24hPct: 0,
    volume24hUsd: 0,
    hourlyFundingRate: 0,
    takerFee: 0.0005,
    minQuantityTick: 0.001,
    minPriceTick: 0.01,
    status: "unknown",
    lastPrintMs: last ? Date.parse(`${last.t}T23:59:59Z`) : 0,
    fresh: false,
    staleLimitMinutes: limits.staleDataMinutes,
  };

  try {
    const client = new SiciClient();
    const snap = await client.snapshot();
    const body: SiciApi = {
      source: "live",
      ticker: snap.market.ticker,
      marketId: snap.market.marketId,
      lastPrice: snap.lastPrice,
      oraclePrice: snap.oraclePrice,
      change24hPct: snap.change24hPct,
      volume24hUsd: snap.volume24hUsd,
      hourlyFundingRate: snap.market.hourlyFundingRate,
      takerFee: snap.market.takerFee,
      minQuantityTick: snap.market.minQuantityTick,
      minPriceTick: snap.market.minPriceTick,
      status: snap.market.status,
      lastPrintMs: snap.lastPrintMs,
      fresh: isFresh(snap.lastPrintMs, limits),
      staleLimitMinutes: limits.staleDataMinutes,
    };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (e) {
    fallback.error = e instanceof Error ? e.message : String(e);
    return NextResponse.json(fallback, { status: 200 });
  }
}
