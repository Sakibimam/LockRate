import { DEFAULT_LIMITS } from "./limits";
import { clamp, round } from "./stats";
import type { Exposure, FitResult, HedgePlan, Instrument, Limits } from "./types";

export interface MarketSnapshot {
  price: number;
  /** min quantity step on the market, e.g. 0.001 */
  minQuantityTick: number;
  /** taker fee as a fraction, e.g. 0.0005 */
  takerFee: number;
  /** last hourly funding rate as a fraction. positive means longs pay */
  hourlyFundingRate: number;
}

export interface SizingInput {
  exposure: Exposure;
  fit: FitResult;
  market: MarketSnapshot;
  limits?: Limits;
  instrument?: Instrument;
  /** user override 0..1, multiplied on top of the verdict coverage */
  scale?: number;
}

export function coverageForVerdict(fit: FitResult): number {
  if (fit.verdict === "hedge") return 1;
  if (fit.verdict === "partial") return 0.5;
  return 0;
}

export function floorToTick(q: number, tick: number): number {
  if (tick <= 0) return q;
  return Math.floor(q / tick + 1e-9) * tick;
}

/**
 * sizes a perp hedge. everything here is arithmetic on the exposure and the
 * regression beta. options go through the same path with `capped: true` and a
 * premium check instead of margin; the option market is still testnet-only so
 * the planner only previews them.
 */
export function sizeHedge(input: SizingInput): HedgePlan {
  const limits = input.limits ?? DEFAULT_LIMITS;
  const instrument = input.instrument ?? "perp";
  const { exposure, fit, market } = input;
  const limitsApplied: string[] = [];
  const warnings: string[] = [];

  const base = coverageForVerdict(fit);
  const beta = clamp(fit.beta, 0, 1.5);
  const scale = clamp(input.scale ?? 1, 0, 1);
  let coverage = base * scale;

  // operators are long spot revenue, so they short the index. buyers do the reverse.
  const side: "long" | "short" = exposure.direction === -1 ? "short" : "long";

  let notional = exposure.spotNotionalUsd * coverage * beta;

  if (notional > limits.maxNotionalUsd) {
    limitsApplied.push(`notional capped at $${limits.maxNotionalUsd.toLocaleString()}`);
    notional = limits.maxNotionalUsd;
  }

  const price = market.price;
  let quantity = price > 0 ? floorToTick(notional / price, market.minQuantityTick) : 0;
  notional = quantity * price;
  if (exposure.spotNotionalUsd > 0) coverage = beta > 0 ? notional / (exposure.spotNotionalUsd * beta) : 0;

  const leverage = 1;
  const marginUsd = instrument === "perp" ? notional / leverage : 0;
  const feesUsd = notional * market.takerFee * 2;
  // funding is paid hourly. sign depends on side: longs pay when the rate is positive.
  const fundingSign = side === "long" ? 1 : -1;
  const fundingUsdPerMonth = notional * market.hourlyFundingRate * 24 * 30 * fundingSign;

  if (instrument === "option") {
    // rough premium check only. we don't price options here, the venue does.
    const premiumGuess = notional * 0.03;
    if (premiumGuess > limits.maxPremiumUsdPerMonth) {
      limitsApplied.push(`premium guess above $${limits.maxPremiumUsdPerMonth}/month, reduce size`);
    }
    warnings.push("SICI options are testnet-only right now. this is a preview, not an order");
  }

  if (fit.verdict === "skip") {
    warnings.push("verdict is skip. plan shown for reference only, nothing will be built");
  }
  if (quantity === 0 && exposure.spotNotionalUsd > 0 && base > 0) {
    warnings.push("size rounds to zero at the market's minimum quantity");
  }

  return {
    instrument,
    side,
    coverage: round(clamp(coverage, 0, 1.5), 3),
    notionalUsd: round(notional),
    quantity: round(quantity, 3),
    entryPrice: price,
    leverage,
    marginUsd: round(marginUsd),
    feesUsd: round(feesUsd),
    fundingUsdPerMonth: round(fundingUsdPerMonth),
    capped: instrument === "option",
    limitsApplied,
    warnings,
  };
}
