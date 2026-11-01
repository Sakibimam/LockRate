import { inBasket } from "./basket";
import { clamp, round } from "./stats";
import type { Exposure, GpuLine, Profile } from "./types";

const HOURS_PER_MONTH = 730;

export function lineHours(line: GpuLine, utilisation: number): number {
  const perGpu = line.hoursPerGpu ?? HOURS_PER_MONTH * clamp(utilisation, 0, 1);
  return Math.max(0, line.count) * Math.max(0, perGpu);
}

/**
 * how many dollars a month float with spot prices, and what a 1% move does to them.
 * nothing clever here on purpose. the point is that it is auditable.
 */
export function computeExposure(p: Profile): Exposure {
  const spotShare = clamp(p.spotShare, 0, 1);
  let gpuHours = 0;
  let total = 0;
  let basketHours = 0;

  const byModel = p.gpus.map((line) => {
    const hours = lineHours(line, p.utilisation);
    const rate = line.rateUsd ?? p.avgRateUsd;
    const notional = hours * rate;
    gpuHours += hours;
    total += notional;
    const inIdx = inBasket(line.model);
    if (inIdx) basketHours += hours;
    return { model: line.model, gpuHours: round(hours, 1), notionalUsd: round(notional), inBasket: inIdx };
  });

  const spotNotional = total * spotShare;

  return {
    spotNotionalUsd: round(spotNotional),
    totalNotionalUsd: round(total),
    dollarsPerPct: round(spotNotional / 100),
    gpuHours: round(gpuHours, 1),
    basketOverlap: gpuHours === 0 ? 0 : round(basketHours / gpuHours, 4),
    direction: p.role === "operator" ? -1 : 1,
    byModel,
  };
}
