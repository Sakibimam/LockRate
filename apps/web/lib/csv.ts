import type { SeriesPoint } from "@lockrate/engine";

/**
 * accepts "2026-03,2.15" or "2026-03-31 2.15" or tab separated, one row per line.
 * header rows and blank lines are skipped. months are normalised to YYYY-MM.
 */
export function parseSeriesCsv(text: string): { points: SeriesPoint[]; skipped: number } {
  const points: SeriesPoint[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[,\t; ]+/);
    const t = parts[0] ?? "";
    const v = Number(parts[1]);
    const m = /^(\d{4})-(\d{2})/.exec(t);
    if (!m || !Number.isFinite(v)) {
      skipped++;
      continue;
    }
    points.push({ t: `${m[1]}-${m[2]}`, v });
  }
  points.sort((a, b) => (a.t < b.t ? -1 : 1));
  return { points, skipped };
}
