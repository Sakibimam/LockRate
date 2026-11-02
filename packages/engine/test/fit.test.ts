import { describe, expect, it } from "vitest";
import { align, computeFit, verdictFor } from "../src/fit";
import type { SeriesPoint } from "../src/types";

const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
const series = (vals: number[]): SeriesPoint[] => vals.map((v, i) => ({ t: months[i] as string, v }));

describe("fit score", () => {
  it("verdict thresholds", () => {
    expect(verdictFor(0.9)).toBe("hedge");
    expect(verdictFor(0.7)).toBe("hedge");
    expect(verdictFor(0.55)).toBe("partial");
    expect(verdictFor(0.39)).toBe("skip");
    expect(verdictFor(0.5, { hedge: 0.6, partial: 0.5 })).toBe("partial");
  });

  it("align does an inner join on t", () => {
    const a = series([1, 2, 3]);
    const b: SeriesPoint[] = [{ t: "2026-02", v: 20 }, { t: "2026-03", v: 30 }, { t: "2026-09", v: 90 }];
    expect(align(a, b)).toEqual([[2, 20, "2026-02"], [3, 30, "2026-03"]]);
  });

  it("identical moves give a score of 1 and beta of 1", () => {
    const idx = series([100, 104, 101, 106, 110, 108, 112, 115]);
    const own = series([2.0, 2.08, 2.02, 2.12, 2.2, 2.16, 2.24, 2.3]);
    const f = computeFit({ own, index: idx });
    expect(f.score).toBeCloseTo(1, 2);
    expect(f.beta).toBeCloseTo(1, 2);
    expect(f.verdict).toBe("hedge");
    expect(f.n).toBe(7);
    expect(f.lowConfidence).toBe(false);
  });

  it("opposite moves are a skip even if the magnitude matches", () => {
    const idx = series([100, 104, 101, 106, 110, 108, 112, 115]);
    const own = series([2.0, 1.92, 1.98, 1.88, 1.8, 1.84, 1.76, 1.7]);
    const f = computeFit({ own, index: idx });
    expect(f.score).toBeLessThan(-0.9);
    expect(f.verdict).toBe("skip");
  });

  it("flags short overlap", () => {
    const f = computeFit({ own: series([1, 1.1, 1.2]), index: series([100, 110, 120]) });
    expect(f.lowConfidence).toBe(true);
    expect(f.n).toBe(2);
  });

  it("no overlap at all is a skip with a reason", () => {
    const f = computeFit({ own: series([1, 2]), index: [{ t: "2020-01", v: 1 }] });
    expect(f.verdict).toBe("skip");
    expect(f.reasons[0]).toMatch(/not enough/);
  });

  it("adds a warning when spot share is tiny", () => {
    const idx = series([100, 104, 101, 106, 110, 108, 112, 115]);
    const own = series([2.0, 2.08, 2.02, 2.12, 2.2, 2.16, 2.24, 2.3]);
    const f = computeFit({ own, index: idx, spotShare: 0.1 });
    expect(f.reasons.some((r) => r.includes("quarter"))).toBe(true);
  });
});
