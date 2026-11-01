import { describe, expect, it } from "vitest";
import { computeExposure } from "../src/exposure";
import type { Profile } from "../src/types";

const host: Profile = {
  id: "t",
  name: "test host",
  role: "operator",
  gpus: [{ model: "H100", count: 64 }],
  avgRateUsd: 2.1,
  spotShare: 1,
  utilisation: 0.7,
};

describe("exposure", () => {
  it("64 H100s at 70% util and $2.10", () => {
    const e = computeExposure(host);
    // 64 * 730 * 0.7 = 32704 hours
    expect(e.gpuHours).toBeCloseTo(32704, 0);
    expect(e.totalNotionalUsd).toBeCloseTo(68678.4, 0);
    expect(e.spotNotionalUsd).toBeCloseTo(68678.4, 0);
    expect(e.dollarsPerPct).toBeCloseTo(686.78, 1);
    expect(e.basketOverlap).toBe(1);
    expect(e.direction).toBe(-1);
  });

  it("spot share scales the hedgeable part only", () => {
    const e = computeExposure({ ...host, spotShare: 0.2 });
    expect(e.totalNotionalUsd).toBeCloseTo(68678.4, 0);
    expect(e.spotNotionalUsd).toBeCloseTo(13735.68, 0);
  });

  it("per-line hours and rates override the profile defaults", () => {
    const e = computeExposure({
      ...host,
      gpus: [
        { model: "H100", count: 10, hoursPerGpu: 500, rateUsd: 2 },
        { model: "OTHER", count: 10, hoursPerGpu: 500, rateUsd: 1 },
      ],
    });
    expect(e.gpuHours).toBe(10000);
    expect(e.totalNotionalUsd).toBe(15000);
    expect(e.basketOverlap).toBe(0.5);
    expect(e.byModel[1]?.inBasket).toBe(false);
  });

  it("buyers have positive direction", () => {
    expect(computeExposure({ ...host, role: "buyer" }).direction).toBe(1);
  });

  it("clamps silly inputs", () => {
    const e = computeExposure({ ...host, spotShare: 3, utilisation: 2 });
    expect(e.spotNotionalUsd).toBe(e.totalNotionalUsd);
    expect(e.gpuHours).toBe(64 * 730);
  });
});
