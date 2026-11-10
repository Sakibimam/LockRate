import {
  IndexerGrpcDerivativesApi,
  IndexerGrpcOracleApi,
  IndexerRestDerivativesChronosApi,
  IndexerRestMarketChronosApi,
  type PerpetualMarket,
} from "@injectivelabs/sdk-ts";
import type { SeriesPoint } from "@lockrate/engine";
import { SICI_ORACLE, loadConfig, type InjectiveConfig } from "./config";

export interface SiciMarketInfo {
  marketId: string;
  ticker: string;
  status: string;
  quoteDenom: string;
  quoteDecimals: number;
  oracleBase: string;
  oracleQuote: string;
  oracleScaleFactor: number;
  initialMarginRatio: number;
  maintenanceMarginRatio: number;
  minPriceTick: number;
  minQuantityTick: number;
  takerFee: number;
  makerFee: number;
  /** last hourly funding rate as fraction. 0 if unknown */
  hourlyFundingRate: number;
  /** timestamp of the last funding print (ms). a clean hourly heartbeat for the market */
  lastFundingMs: number;
  nextFundingMs?: number;
}


export interface SiciSnapshot {
  market: SiciMarketInfo;
  /** last traded price in index points */
  lastPrice: number;
  /** oracle index print in index points */
  oraclePrice: number;
  volume24hUsd: number;
  change24hPct: number;
  /** timestamp of the most recent print we could find (ms) */
  lastPrintMs: number;
  fetchedAtMs: number;
}

export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  qty: number;
}

function chainToIndexPoints(x: string | number, quoteDecimals: number): number {
  return Number(x) / 10 ** quoteDecimals;
}

export class SiciClient {
  readonly cfg: InjectiveConfig;
  private readonly derivatives: IndexerGrpcDerivativesApi;
  private readonly oracle: IndexerGrpcOracleApi;
  private readonly chronosMarket: IndexerRestMarketChronosApi;
  private readonly chronosDerivatives: IndexerRestDerivativesChronosApi;

  constructor(cfg: InjectiveConfig = loadConfig(typeof process !== "undefined" ? process.env : {})) {
    this.cfg = cfg;
    this.derivatives = new IndexerGrpcDerivativesApi(cfg.endpoints.indexer);
    this.oracle = new IndexerGrpcOracleApi(cfg.endpoints.indexer);
    this.chronosMarket = new IndexerRestMarketChronosApi(`${cfg.endpoints.chronos}/api/chronos/v1/market`);
    this.chronosDerivatives = new IndexerRestDerivativesChronosApi(`${cfg.endpoints.chronos}/api/chronos/v1/derivative`);
  }

  async market(): Promise<SiciMarketInfo> {
    const m = (await this.derivatives.fetchMarket(this.cfg.marketId)) as PerpetualMarket;
    const quoteDecimals = m.quoteToken?.decimals ?? 6;
    const info = m.perpetualMarketInfo;
    // the chain stores a cumulative price. the indexer's fundingRates endpoint is the
    // clean source for the last hourly rate, so we read that separately.
    let hourlyFundingRate = 0;
    let lastFundingMs = 0;
    try {
      const fr = await this.derivatives.fetchFundingRates({ marketId: this.cfg.marketId, pagination: { limit: 1 } });
      const last = fr.fundingRates[0];
      if (last) {
        hourlyFundingRate = Number(last.rate);
        lastFundingMs = Number(last.timestamp);
      }
    } catch {
      /* non-fatal, we just show 0 */
    }
    return {
      marketId: m.marketId,
      ticker: m.ticker,
      status: m.marketStatus,
      quoteDenom: m.quoteDenom,
      quoteDecimals,
      oracleBase: m.oracleBase,
      oracleQuote: m.oracleQuote,
      oracleScaleFactor: m.oracleScaleFactor,
      initialMarginRatio: Number(m.initialMarginRatio),
      maintenanceMarginRatio: Number(m.maintenanceMarginRatio),
      minPriceTick: chainToIndexPoints(m.minPriceTickSize, quoteDecimals),
      minQuantityTick: Number(m.minQuantityTickSize),
      takerFee: Number(m.takerFeeRate),
      makerFee: Number(m.makerFeeRate),
      hourlyFundingRate,
      lastFundingMs,
      nextFundingMs: info?.nextFundingTimestamp ? Number(info.nextFundingTimestamp) * 1000 : undefined,
    };
  }

  async oraclePrice(): Promise<number> {
    const r = await this.oracle.fetchOraclePrice({
      baseSymbol: SICI_ORACLE.base,
      quoteSymbol: SICI_ORACLE.quote,
      oracleType: SICI_ORACLE.type,
      oracleScaleFactor: SICI_ORACLE.scaleFactor,
    });
    // the indexer returns the scaled integer even when you pass the scale factor
    return Number(r.price) / 10 ** SICI_ORACLE.scaleFactor;
  }

  async snapshot(): Promise<SiciSnapshot> {
    const market = await this.market();
    const [summary, oracle, trades] = await Promise.all([
      this.chronosDerivatives.fetchMarketSummary(this.cfg.marketId).catch(() => null),
      this.oraclePrice().catch(() => 0),
      this.derivatives.fetchTrades({ marketId: this.cfg.marketId, pagination: { limit: 1 } }).catch(() => null),
    ]);
    const lastTrade = trades?.trades[0];
    const lastTradePrice = lastTrade ? chainToIndexPoints(lastTrade.executionPrice, market.quoteDecimals) : 0;
    const lastPrice = summary?.price ?? lastTradePrice;
    // trades come in bursts, funding settles every hour. either counts as a print.
    const lastPrintMs = Math.max(lastTrade?.executedAt ?? 0, market.lastFundingMs);
    return {
      market,
      lastPrice,
      oraclePrice: oracle,
      volume24hUsd: summary?.volume ?? 0,
      change24hPct: summary?.change ?? 0,
      lastPrintMs,
      fetchedAtMs: Date.now(),
    };
  }

  /**
   * candles via chronos. resolution in tradingview style: "60", "D".
   * returns [] when chronos is down so callers can fall back to trades.
   */
  async candles(resolution: string | number = "D", countback = 90): Promise<Candle[]> {
    try {
      const rows = await this.chronosMarket.fetchMarketsHistory({
        marketIds: [this.cfg.marketId],
        resolution,
        countback,
      });
      const h = rows[0];
      if (!h || !h.t?.length) return [];
      return h.t.map((ts: number, i: number) => ({
        t: new Date(ts * 1000).toISOString().slice(0, resolution === "D" || resolution === "1D" ? 10 : 16),
        o: Number(h.o[i]),
        h: Number(h.h[i]),
        l: Number(h.l[i]),
        c: Number(h.c[i]),
        qty: Number(h.v[i]),
      }));
    } catch {
      return [];
    }
  }

  /** every trade since launch, newest first from the indexer, returned oldest first */
  async allTrades(maxPages = 60): Promise<Array<{ ts: number; price: number; qty: number; side: string }>> {
    const market = await this.market();
    const out: Array<{ ts: number; price: number; qty: number; side: string }> = [];
    for (let page = 0; page < maxPages; page++) {
      const r = await this.derivatives.fetchTrades({
        marketId: this.cfg.marketId,
        pagination: { limit: 100, skip: page * 100 },
      });
      for (const t of r.trades) {
        out.push({
          ts: t.executedAt,
          price: chainToIndexPoints(t.executionPrice, market.quoteDecimals),
          qty: Number(t.executionQuantity),
          side: t.tradeDirection,
        });
      }
      if (r.trades.length < 100) break;
    }
    return out.sort((a, b) => a.ts - b.ts);
  }

  /** daily candles, chronos first, trades as fallback */
  async dailyHistory(): Promise<Candle[]> {
    const c = await this.candles("D", 120);
    if (c.length) return c;
    return bucketTradesByDay(await this.allTrades());
  }
}

export function bucketTradesByDay(trades: Array<{ ts: number; price: number; qty: number }>): Candle[] {
  const days = new Map<string, Candle>();
  for (const t of trades) {
    const day = new Date(t.ts).toISOString().slice(0, 10);
    const c = days.get(day);
    if (!c) {
      days.set(day, { t: day, o: t.price, h: t.price, l: t.price, c: t.price, qty: t.qty });
    } else {
      c.h = Math.max(c.h, t.price);
      c.l = Math.min(c.l, t.price);
      c.c = t.price;
      c.qty += t.qty;
    }
  }
  return [...days.values()].sort((a, b) => (a.t < b.t ? -1 : 1));
}

export function candlesToSeries(candles: Candle[]): SeriesPoint[] {
  return candles.map((c) => ({ t: c.t, v: c.c }));
}

/** last close of each calendar month, for joining with monthly own-price history */
export function monthlyCloses(candles: Candle[]): SeriesPoint[] {
  const byMonth = new Map<string, number>();
  for (const c of candles) byMonth.set(c.t.slice(0, 7), c.c);
  return [...byMonth.entries()].map(([t, v]) => ({ t, v }));
}
