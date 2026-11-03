import { computeExposure } from "./exposure";
import { computeFit } from "./fit";
import { DEFAULT_LIMITS } from "./limits";
import { simulate } from "./simulate";
import { sizeHedge, type MarketSnapshot } from "./sizing";
import type { Exposure, FitResult, FitThresholds, HedgePlan, Limits, Profile, SeriesPoint, SimResult } from "./types";

export interface RunInput {
  profile: Profile;
  /** own price series. falls back to profile.priceHistory */
  own?: SeriesPoint[];
  index: SeriesPoint[];
  market: MarketSnapshot;
  limits?: Limits;
  thresholds?: FitThresholds;
  scale?: number;
}

export interface RunResult {
  exposure: Exposure;
  fit: FitResult;
  plan: HedgePlan;
  sim: SimResult;
}

/** the whole thing in one call. the web app and the tests both use this */
export function run(input: RunInput): RunResult {
  const own = input.own ?? input.profile.priceHistory ?? [];
  const exposure = computeExposure(input.profile);
  const fit = computeFit({
    own,
    index: input.index,
    thresholds: input.thresholds,
    basketOverlap: exposure.basketOverlap,
    spotShare: input.profile.spotShare,
  });
  const plan = sizeHedge({
    exposure,
    fit,
    market: input.market,
    limits: input.limits ?? DEFAULT_LIMITS,
    scale: input.scale,
  });
  const sim = simulate({
    exposure,
    plan,
    own,
    index: input.index,
    hourlyFundingRate: input.market.hourlyFundingRate,
    takerFee: input.market.takerFee,
  });
  return { exposure, fit, plan, sim };
}
