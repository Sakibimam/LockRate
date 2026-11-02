import { describe, expect, it } from "vitest";
import { floorToTick, sizeHedge } from "../src/sizing";
import type { Exposure, FitResult } from "../src/types";

const exposure: Exposure = {
  spotNotionalUsd: 68678,
  totalNotionalUsd: 68678,
  dollarsPerPct: 686.78,
  gpuHours: 32704,
  basketOverlap: 1,
  direction: -1,
  byModel: [],
};

const fit = (verdict: FitResult["verdict"], beta = 1, score = 0.9): FitResult => ({
  score,
  beta,
  r2: score * score,
  n: 10,
  verdict,
  thresholds: { hedge: 0.7, partial: 0.4 },
  lowConfidence: false,
  reasons: [],
});

const market = { price: 107.84, minQuantityTick: 0.001, takerFee: 0.0005, hourlyFundingRate: 0.00000416666 };

describe("sizing", () => {
  it("floors to tick", () => {
    expect(floorToTick(1.23456, 0.001)).toBeCloseTo(1.234, 6);
    expect(floorToTick(5, 0)).toBe(5);
  });

  const wide = { maxNotionalUsd: 1_000_000, maxPremiumUsdPerMonth: 10_000, maxLeverage: 1, staleDataMinutes: 180 };

  it("full hedge at beta 1 shorts the whole spot book at 1x", () => {
    const p = sizeHedge({ exposure, fit: fit("hedge"), market, limits: wide });
    expect(p.side).toBe("short");
    expect(p.leverage).toBe(1);
    expect(p.notionalUsd).toBeCloseTo(68678, -1);
    expect(p.quantity).toBeCloseTo(636.85, 1);
    expect(p.marginUsd).toBe(p.notionalUsd);
    expect(p.coverage).toBeCloseTo(1, 2);
    expect(p.limitsApplied).toEqual([]);
  });

  it("partial verdict halves the size", () => {
    const p = sizeHedge({ exposure, fit: fit("partial", 1, 0.5), market, limits: wide });
    expect(p.notionalUsd).toBeCloseTo(34339, -1);
  });

  it("skip verdict sizes to zero and says so", () => {
    const p = sizeHedge({ exposure, fit: fit("skip", 1, 0.1), market });
    expect(p.quantity).toBe(0);
    expect(p.warnings.some((w) => w.includes("skip"))).toBe(true);
  });

  it("beta scales the size", () => {
    const p = sizeHedge({ exposure, fit: fit("hedge", 0.6), market, limits: wide });
    expect(p.notionalUsd).toBeCloseTo(68678 * 0.6, -1);
  });

  it("default cap is $50k and applies before anything is built", () => {
    const p = sizeHedge({ exposure, fit: fit("hedge"), market });
    expect(p.notionalUsd).toBeLessThanOrEqual(50_000);
    expect(p.limitsApplied[0]).toMatch(/50,000/);
  });

  it("hard cap on notional applies before anything is built", () => {
    const p = sizeHedge({
      exposure,
      fit: fit("hedge"),
      market,
      limits: { maxNotionalUsd: 10_000, maxPremiumUsdPerMonth: 500, maxLeverage: 1, staleDataMinutes: 60 },
    });
    expect(p.notionalUsd).toBeLessThanOrEqual(10_000);
    expect(p.limitsApplied[0]).toMatch(/capped/);
  });

  it("buyers go long", () => {
    const p = sizeHedge({ exposure: { ...exposure, direction: 1 }, fit: fit("hedge"), market });
    expect(p.side).toBe("long");
    expect(p.fundingUsdPerMonth).toBeGreaterThan(0);
  });

  it("options are preview only", () => {
    const p = sizeHedge({ exposure, fit: fit("hedge"), market, instrument: "option" });
    expect(p.capped).toBe(true);
    expect(p.marginUsd).toBe(0);
    expect(p.warnings.some((w) => w.includes("testnet"))).toBe(true);
  });

  it("user scale reduces coverage", () => {
    const p = sizeHedge({ exposure, fit: fit("hedge"), market, scale: 0.25, limits: wide });
    expect(p.coverage).toBeCloseTo(0.25, 2);
  });
});
