import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Profile, SeriesPoint } from "@lockrate/engine";

/** walk up from cwd until we find the repo's data/ folder */
export function dataDir(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = join(dir, "data");
    if (existsSync(join(candidate, "sici-daily.json"))) return candidate;
    dir = resolve(dir, "..");
  }
  throw new Error("could not find data/ directory");
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(dataDir(), rel), "utf8")) as T;
}

export interface DailyFile {
  marketId: string;
  ticker: string;
  source: string;
  generatedAt: string;
  days: Array<{ t: string; o: number; h: number; l: number; c: number; qty: number }>;
}

export interface ProxyFile {
  unit: string;
  frequency: string;
  note: string;
  points: SeriesPoint[];
}

export function loadDaily(): DailyFile {
  return readJson<DailyFile>("sici-daily.json");
}

export function loadProfiles(): Profile[] {
  const dir = join(dataDir(), "profiles");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Profile);
}

export function loadProxies(): Record<string, ProxyFile> {
  const dir = join(dataDir(), "proxies");
  const out: Record<string, ProxyFile> = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    out[f.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(dir, f), "utf8")) as ProxyFile;
  }
  return out;
}

/**
 * monthly index series for the fit score: the reconstructed backfill for months
 * before launch, real month-end closes from the perp for anything after.
 */
export function indexMonthly(daily: DailyFile, proxies: Record<string, ProxyFile>): SeriesPoint[] {
  const real = new Map<string, number>();
  for (const d of daily.days) real.set(d.t.slice(0, 7), d.c);
  const backfill = proxies["sici-monthly-backfill"]?.points ?? [];
  const merged = new Map<string, number>();
  for (const p of backfill) merged.set(p.t, p.v);
  for (const [t, v] of real) merged.set(t, v);
  return [...merged.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([t, v]) => ({ t, v }));
}
