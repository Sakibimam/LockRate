import type { Limits } from "./types";

export const DEFAULT_LIMITS: Limits = {
  maxNotionalUsd: 50_000,
  maxPremiumUsdPerMonth: 2_000,
  maxLeverage: 1,
  staleDataMinutes: 180,
};

export function limitsFromEnv(env: Record<string, string | undefined> = {}): Limits {
  const num = (k: string, d: number) => {
    const v = env[k];
    if (v === undefined || v === "") return d;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    maxNotionalUsd: num("MAX_NOTIONAL_USD", DEFAULT_LIMITS.maxNotionalUsd),
    maxPremiumUsdPerMonth: num("MAX_PREMIUM_USD_PER_MONTH", DEFAULT_LIMITS.maxPremiumUsdPerMonth),
    maxLeverage: 1,
    staleDataMinutes: num("STALE_DATA_MINUTES", DEFAULT_LIMITS.staleDataMinutes),
  };
}

export class StaleDataError extends Error {
  constructor(public ageMinutes: number, public limitMinutes: number) {
    super(`latest SICI print is ${Math.round(ageMinutes)} min old, limit is ${limitMinutes} min`);
    this.name = "StaleDataError";
  }
}

/** throws if the last print is older than allowed. call before planning anything */
export function assertFresh(lastPrintMs: number, limits: Limits, nowMs = Date.now()): void {
  const age = (nowMs - lastPrintMs) / 60_000;
  if (age > limits.staleDataMinutes) throw new StaleDataError(age, limits.staleDataMinutes);
}

export function isFresh(lastPrintMs: number, limits: Limits, nowMs = Date.now()): boolean {
  return (nowMs - lastPrintMs) / 60_000 <= limits.staleDataMinutes;
}
