import { describe, expect, it } from "vitest";
import { DEFAULT_LIMITS, StaleDataError, assertFresh, isFresh, limitsFromEnv } from "../src/limits";

describe("limits", () => {
  it("reads env with fallbacks", () => {
    const l = limitsFromEnv({ MAX_NOTIONAL_USD: "1234", STALE_DATA_MINUTES: "nope" });
    expect(l.maxNotionalUsd).toBe(1234);
    expect(l.staleDataMinutes).toBe(DEFAULT_LIMITS.staleDataMinutes);
    expect(l.maxLeverage).toBe(1);
  });

  it("leverage can never be raised through env", () => {
    expect(limitsFromEnv({ MAX_LEVERAGE: "10" } as never).maxLeverage).toBe(1);
  });

  it("stale guard", () => {
    const now = 1_000_000_000_000;
    const limits = { ...DEFAULT_LIMITS, staleDataMinutes: 60 };
    expect(isFresh(now - 59 * 60_000, limits, now)).toBe(true);
    expect(isFresh(now - 61 * 60_000, limits, now)).toBe(false);
    expect(() => assertFresh(now - 61 * 60_000, limits, now)).toThrow(StaleDataError);
  });
});
