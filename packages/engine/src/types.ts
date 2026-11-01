// shared types for the engine. no runtime code here.

export type GpuModel = "H100" | "B200" | "H200" | "A100" | "RTX4090" | "OTHER";

export type Role = "operator" | "buyer";

export interface GpuLine {
  model: GpuModel;
  count: number;
  /** hours per GPU per month. defaults to 730 * utilisation if missing */
  hoursPerGpu?: number;
  /** $/GPU-hour this line actually earns or pays. falls back to profile avgRate */
  rateUsd?: number;
}

export interface Profile {
  id: string;
  name: string;
  role: Role;
  gpus: GpuLine[];
  /** blended $/GPU-hour across the fleet */
  avgRateUsd: number;
  /** 0..1 share of revenue (operator) or spend (buyer) that floats with spot */
  spotShare: number;
  /** 0..1 utilisation, used when a line has no hoursPerGpu */
  utilisation: number;
  /** optional: own monthly price history, $/GPU-hour, oldest first */
  priceHistory?: SeriesPoint[];
  /** which proxy series to use when priceHistory is empty */
  proxy?: string;
  notes?: string;
}

export interface SeriesPoint {
  /** ISO date, YYYY-MM-DD, or YYYY-MM for monthly series */
  t: string;
  v: number;
}

export interface Exposure {
  /** $/month of revenue or spend that floats with spot */
  spotNotionalUsd: number;
  /** $/month total (spot + contracted) */
  totalNotionalUsd: number;
  /** $ change in monthly P&L for a 1% move in spot price */
  dollarsPerPct: number;
  /** total GPU-hours/month in the fleet */
  gpuHours: number;
  /** share of GPU-hours that sit inside the SICI basket */
  basketOverlap: number;
  /** -1 operator (hurt by falling prices), +1 buyer (hurt by rising prices) */
  direction: -1 | 1;
  byModel: Array<{ model: GpuModel; gpuHours: number; notionalUsd: number; inBasket: boolean }>;
}

export type Verdict = "hedge" | "partial" | "skip";

export interface FitThresholds {
  hedge: number;
  partial: number;
}

export interface FitResult {
  /** pearson correlation of period-over-period % changes */
  score: number;
  /** regression slope of own returns on index returns (hedge ratio) */
  beta: number;
  r2: number;
  /** number of overlapping return observations */
  n: number;
  verdict: Verdict;
  thresholds: FitThresholds;
  /** when n is too small to trust the score */
  lowConfidence: boolean;
  reasons: string[];
}

export type Instrument = "perp" | "option";

export interface Limits {
  maxNotionalUsd: number;
  maxPremiumUsdPerMonth: number;
  /** perps only. we always use 1 */
  maxLeverage: number;
  staleDataMinutes: number;
}

export interface HedgePlan {
  instrument: Instrument;
  /** "short" for operators, "long" for buyers */
  side: "long" | "short";
  /** fraction of exposure hedged after verdict + beta + limits */
  coverage: number;
  notionalUsd: number;
  /** contracts in index units (SICI points) */
  quantity: number;
  entryPrice: number;
  leverage: number;
  marginUsd: number;
  /** estimated taker fee for entry + exit */
  feesUsd: number;
  /** estimated funding over one month at the last observed rate */
  fundingUsdPerMonth: number;
  capped: boolean;
  limitsApplied: string[];
  warnings: string[];
}

export interface SimPeriod {
  t: string;
  indexPrice: number;
  ownPrice: number;
  unhedgedPnl: number;
  hedgePnl: number;
  hedgedPnl: number;
}

export interface SimResult {
  periods: SimPeriod[];
  unhedged: { total: number; worst: number; stdev: number };
  hedged: { total: number; worst: number; stdev: number };
  /** 1 - hedged stdev / unhedged stdev */
  volReduction: number;
  costOfHedgeUsd: number;
}
