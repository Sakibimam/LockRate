import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeExposure } from "../src/exposure";
import { computeFit } from "../src/fit";
import { run } from "../src/pipeline";
import { simulate } from "../src/simulate";
import { sizeHedge } from "../src/sizing";
import type { Profile, SeriesPoint } from "../src/types";

// the sample profiles in data/ are what the demo walks through. if someone edits a
// proxy series and a verdict flips, this is where it shows up.

const root = join(__dirname, "../../../data");
const read = <T>(p: string): T => JSON.parse(readFileSync(join(root, p), "utf8")) as T;

const proxies = Object.fromEntries(
  readdirSync(join(root, "proxies")).map((f) => [f.replace(/\.json$/, ""), read<{ points: SeriesPoint[] }>(`proxies/${f}`).points]),
);
const profiles = readdirSync(join(root, "profiles")).map((f) => read<Profile>(`profiles/${f}`));
const daily = read<{ days: Array<{ t: string; c: number }> }>("sici-daily.json");

const real = new Map(daily.days.map((d) => [d.t.slice(0, 7), d.c]));
const index: SeriesPoint[] = (proxies["sici-monthly-backfill"] ?? []).map((p) => ({ t: p.t, v: real.get(p.t) ?? p.v }));
for (const [t, v] of real) if (!index.some((p) => p.t === t)) index.push({ t, v });
index.sort((a, b) => (a.t < b.t ? -1 : 1));

const market = { price: daily.days.at(-1)?.c ?? 100, minQuantityTick: 0.001, takerFee: 0.0005, hourlyFundingRate: 0.00000416666 };

const expected: Record<string, "hedge" | "partial" | "skip"> = {
  "marketplace-host-64-h100": "hedge",
  "neocloud-80-contracted": "skip",
  "decentralised-provider-4090": "partial",
  "ai-team-inference-buyer": "hedge",
};

describe("sample profiles", () => {
  it("covers every verdict", () => {
    expect(new Set(Object.values(expected)).size).toBe(3);
  });

  for (const p of profiles) {
    it(`${p.id} -> ${expected[p.id]}`, () => {
      const own = proxies[p.proxy ?? ""];
      expect(own, `proxy ${p.proxy} missing`).toBeDefined();
      const r = run({ profile: p, own, index, market });
      expect(r.fit.verdict).toBe(expected[p.id]);
      if (r.fit.verdict === "skip") {
        expect(r.plan.quantity).toBe(0);
      } else {
        expect(r.plan.quantity).toBeGreaterThan(0);
        expect(r.plan.leverage).toBe(1);
        expect(r.sim.volReduction).toBeGreaterThan(0);
      }
      expect(r.plan.side).toBe(p.role === "operator" ? "short" : "long");
    });
  }

  it("the neocloud would have been hurt by hedging", () => {
    const p = profiles.find((x) => x.id === "neocloud-80-contracted") as Profile;
    const own = proxies[p.proxy ?? ""] as SeriesPoint[];
    const r = run({ profile: p, own, index, market });
    expect(r.fit.score).toBeLessThan(0);
    // pretend the verdict was ignored and a full short went on anyway
    const exposure = computeExposure(p);
    const fit = { ...computeFit({ own, index }), verdict: "hedge" as const, beta: 1 };
    const plan = sizeHedge({ exposure, fit, market, limits: { maxNotionalUsd: 1e9, maxPremiumUsdPerMonth: 1e9, maxLeverage: 1, staleDataMinutes: 180 } });
    const sim = simulate({ exposure, plan, own, index });
    expect(sim.hedged.stdev).toBeGreaterThan(sim.unhedged.stdev);
    expect(sim.volReduction).toBeLessThan(0);
  });
});
