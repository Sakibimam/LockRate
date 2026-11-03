import { describe, expect, it } from "vitest";
import { buildStatement } from "../src/report";
import type { Exposure, HedgePlan, Profile } from "../src/types";

const profile: Profile = {
  id: "p",
  name: "host",
  role: "operator",
  gpus: [],
  avgRateUsd: 2,
  spotShare: 1,
  utilisation: 1,
};
const exposure: Exposure = {
  spotNotionalUsd: 10_000,
  totalNotionalUsd: 10_000,
  dollarsPerPct: 100,
  gpuHours: 1,
  basketOverlap: 1,
  direction: -1,
  byModel: [],
};
const plan: HedgePlan = {
  instrument: "perp",
  side: "short",
  coverage: 1,
  notionalUsd: 10_000,
  quantity: 100,
  entryPrice: 100,
  leverage: 1,
  marginUsd: 10_000,
  feesUsd: 10,
  fundingUsdPerMonth: 0,
  capped: false,
  limitsApplied: [],
  warnings: [],
};

describe("monthly statement", () => {
  it("nets actual and hedge", () => {
    const s = buildStatement({
      month: "2026-11",
      profile,
      exposure,
      plan,
      ownPriceStart: 2,
      ownPriceEnd: 1.8,
      indexStart: 100,
      indexEnd: 90,
    });
    expect(s.actualPnlUsd).toBe(-1000);
    expect(s.hedgePnlUsd).toBe(990);
    expect(s.hedgedPnlUsd).toBe(-10);
    expect(s.lines.at(-1)).toMatch(/net/);
  });
});
