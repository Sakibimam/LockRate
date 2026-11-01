import { pctChanges, pearson, round, slope } from "./stats";
import type { FitResult, FitThresholds, SeriesPoint, Verdict } from "./types";

export const DEFAULT_THRESHOLDS: FitThresholds = { hedge: 0.7, partial: 0.4 };

/** below this many overlapping observations the score is shown but flagged */
export const MIN_OBS = 6;

export function verdictFor(score: number, t: FitThresholds = DEFAULT_THRESHOLDS): Verdict {
  if (score >= t.hedge) return "hedge";
  if (score >= t.partial) return "partial";
  return "skip";
}

/** inner join on t, keeps order of `a` */
export function align(a: SeriesPoint[], b: SeriesPoint[]): Array<[number, number, string]> {
  const bm = new Map(b.map((p) => [p.t, p.v] as const));
  const out: Array<[number, number, string]> = [];
  for (const p of a) {
    const v = bm.get(p.t);
    if (v !== undefined) out.push([p.v, v, p.t]);
  }
  return out;
}

export interface FitInput {
  own: SeriesPoint[];
  index: SeriesPoint[];
  thresholds?: FitThresholds;
  /** share of fleet hours inside the basket, from exposure. only used for messaging */
  basketOverlap?: number;
  /** share of revenue that is spot. used to warn, not to change the score */
  spotShare?: number;
}

/**
 * the fit score is a plain pearson correlation of period returns between the
 * user's own price series and the index. beta is the regression slope and is
 * what we actually size with. no model, no guessing.
 */
export function computeFit(input: FitInput): FitResult {
  const thresholds = input.thresholds ?? DEFAULT_THRESHOLDS;
  const joined = align(input.own, input.index);
  const own = pctChanges(joined.map((r) => r[0]));
  const idx = pctChanges(joined.map((r) => r[1]));
  const n = Math.min(own.length, idx.length);

  const reasons: string[] = [];

  if (n < 2) {
    reasons.push("not enough overlapping history to compute a score");
    return {
      score: 0,
      beta: 0,
      r2: 0,
      n,
      verdict: "skip",
      thresholds,
      lowConfidence: true,
      reasons,
    };
  }

  const score = pearson(idx, own);
  const beta = slope(idx, own);
  const r2 = score * score;
  let verdict = verdictFor(score, thresholds);
  const lowConfidence = n < MIN_OBS;

  if (lowConfidence) {
    reasons.push(`only ${n} overlapping periods. treat the score as indicative`);
  }
  if (score < thresholds.partial) {
    reasons.push("your prices and SICI have not moved together. a SICI hedge would add risk, not remove it");
  } else if (score < thresholds.hedge) {
    reasons.push("partial co-movement. a smaller hedge removes some risk and leaves the rest visible");
  } else {
    reasons.push("your prices track the index closely enough to hedge");
  }
  if (beta < 0 && verdict !== "skip") {
    reasons.push("negative beta: your prices move against the index. not hedgeable with SICI");
    verdict = "skip";
  }
  if (input.spotShare !== undefined && input.spotShare < 0.25) {
    reasons.push("less than a quarter of your book floats with spot. most of your risk is not price risk");
  }
  if (input.basketOverlap !== undefined && input.basketOverlap < 0.5) {
    reasons.push("more than half of your fleet is outside the five SICI cards. expect basis drift");
  }

  return {
    score: round(score, 3),
    beta: round(beta, 3),
    r2: round(r2, 3),
    n,
    verdict,
    thresholds,
    lowConfidence,
    reasons,
  };
}
