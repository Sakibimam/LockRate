import { describe, expect, it } from "vitest";
import { mean, pctChanges, pearson, slope, stdev } from "../src/stats";

describe("stats", () => {
  it("mean and stdev", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(stdev([1])).toBe(0);
  });

  it("pearson on perfectly correlated series", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });

  it("pearson handles flat series", () => {
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
  });

  it("slope is the hedge ratio", () => {
    expect(slope([0.01, 0.02, -0.01], [0.02, 0.04, -0.02])).toBeCloseTo(2);
  });

  it("pct changes", () => {
    expect(pctChanges([100, 110, 99])).toEqual([0.1, -0.1]);
    expect(pctChanges([5])).toEqual([]);
  });
});
