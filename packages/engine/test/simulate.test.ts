import { describe, expect, it } from "vitest";
import { simulate } from "../src/simulate";
import type { Exposure, HedgePlan, SeriesPoint } from "../src/types";

const exposure: Exposure = {
  spotNotionalUsd: 50_000,
  totalNotionalUsd: 50_000,
  dollarsPerPct: 500,
  gpuHours: 1,
  basketOverlap: 1,
  direction: -1,
  byModel: [],
};

const plan: HedgePlan = {
  instrument: "perp",
  side: "short",
  coverage: 1,
  notionalUsd: 50_000,
  quantity: 500,
  entryPrice: 100,
  leverage: 1,
  marginUsd: 50_000,
  feesUsd: 50,
  fundingUsdPerMonth: 0,
  capped: false,
  limitsApplied: [],
  warnings: [],
};

const t = ["2026-01", "2026-02", "2026-03", "2026-04"];
const s = (v: number[]): SeriesPoint[] => v.map((x, i) => ({ t: t[i] as string, v: x }));

describe("paper simulation", () => {
  it("a hedge sized at entry nets to zero on the first move", () => {
    const index = s([100, 90, 99, 108.9]);
    const own = s([2, 1.8, 1.98, 2.178]);
    const r = simulate({ exposure, plan, own, index });
    expect(r.periods[0]?.hedgedPnl).toBe(0);
    // later months drift because the hedge is in index points and the book is in %.
    // that drift is the basis an un-rolled hedge carries, and it should stay small.
    for (const p of r.periods) expect(Math.abs(p.hedgedPnl)).toBeLessThan(Math.abs(p.unhedgedPnl) * 0.15);
    expect(r.volReduction).toBeGreaterThan(0.85);
  });

  it("an unrelated index makes things worse, and the sim shows it", () => {
    const index = s([100, 110, 100, 110]);
    const own = s([2, 1.8, 2.0, 1.8]);
    const r = simulate({ exposure, plan, own, index });
    expect(r.hedged.stdev).toBeGreaterThan(r.unhedged.stdev);
    expect(r.volReduction).toBeLessThan(0);
  });

  it("funding is charged against the position", () => {
    const index = s([100, 100, 100, 100]);
    const own = s([2, 2, 2, 2]);
    const r = simulate({ exposure, plan, own, index, hourlyFundingRate: 0.00001 });
    // short receives funding when the rate is positive
    expect(r.periods[0]?.hedgePnl).toBeGreaterThan(0);
  });

  it("reports fees as cost when the hedge does nothing", () => {
    const index = s([100, 100, 100, 100]);
    const own = s([2, 2, 2, 2]);
    const r = simulate({ exposure, plan, own, index, takerFee: 0.001 });
    expect(r.costOfHedgeUsd).toBeCloseTo(100, 0);
    expect(r.hedged.total).toBeCloseTo(-100, 0);
  });
});
