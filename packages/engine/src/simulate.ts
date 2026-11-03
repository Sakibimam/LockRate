import { align } from "./fit";
import { round, stdev } from "./stats";
import type { Exposure, HedgePlan, SeriesPoint, SimPeriod, SimResult } from "./types";

export interface SimInput {
  exposure: Exposure;
  plan: HedgePlan;
  own: SeriesPoint[];
  index: SeriesPoint[];
  /** hourly funding assumption, fraction. default 0 */
  hourlyFundingRate?: number;
  /** taker fee fraction per side. default 0.0005 */
  takerFee?: number;
}

/**
 * replays the hedge over history. each period:
 *   unhedged = spot notional * own % change (sign by role)
 *   hedge    = quantity * index delta (sign by side) - funding
 * the position is held at the planned quantity throughout. no rebalancing, so
 * the result is conservative for a hedge that gets rolled monthly.
 */
export function simulate(input: SimInput): SimResult {
  const { exposure, plan } = input;
  const takerFee = input.takerFee ?? 0.0005;
  const funding = input.hourlyFundingRate ?? 0;
  const rows = align(input.own, input.index);
  const periods: SimPeriod[] = [];

  const sideSign = plan.side === "long" ? 1 : -1;
  // operator earns more when own price rises, buyer pays more
  const ownSign = exposure.direction === -1 ? 1 : -1;
  const hoursPerPeriod = 24 * 30;

  for (let i = 1; i < rows.length; i++) {
    const [ownPrev, idxPrev] = rows[i - 1] as [number, number, string];
    const [own, idx, t] = rows[i] as [number, number, string];
    const ownChg = ownPrev === 0 ? 0 : (own - ownPrev) / ownPrev;
    const unhedged = exposure.spotNotionalUsd * ownChg * ownSign;
    const fundingCost = plan.quantity * idxPrev * funding * hoursPerPeriod * sideSign;
    const hedge = sideSign * plan.quantity * (idx - idxPrev) - fundingCost;
    periods.push({
      t,
      indexPrice: idx,
      ownPrice: own,
      unhedgedPnl: round(unhedged),
      hedgePnl: round(hedge),
      hedgedPnl: round(unhedged + hedge),
    });
  }

  const fees = plan.quantity * (rows[0]?.[1] ?? plan.entryPrice) * takerFee * 2;
  const u = periods.map((p) => p.unhedgedPnl);
  const h = periods.map((p) => p.hedgedPnl);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const su = stdev(u);
  const sh = stdev(h);
  const hedgeTotal = sum(periods.map((p) => p.hedgePnl));

  return {
    periods,
    unhedged: { total: round(sum(u)), worst: round(Math.min(0, ...u)), stdev: round(su) },
    hedged: { total: round(sum(h) - fees), worst: round(Math.min(0, ...h)), stdev: round(sh) },
    volReduction: su === 0 ? 0 : round(1 - sh / su, 3),
    // what the hedge cost you if it lost money, plus fees. zero if it paid out.
    costOfHedgeUsd: round(fees + Math.max(0, -hedgeTotal)),
  };
}
