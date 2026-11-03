import { round } from "./stats";
import type { Exposure, HedgePlan, Profile } from "./types";

export interface MonthlyStatement {
  month: string;
  profile: string;
  spotNotionalUsd: number;
  ownPriceStart: number;
  ownPriceEnd: number;
  indexStart: number;
  indexEnd: number;
  actualPnlUsd: number;
  hedgePnlUsd: number;
  hedgedPnlUsd: number;
  fundingUsd: number;
  feesUsd: number;
  lines: string[];
}

export interface StatementInput {
  month: string;
  profile: Profile;
  exposure: Exposure;
  plan: HedgePlan;
  ownPriceStart: number;
  ownPriceEnd: number;
  indexStart: number;
  indexEnd: number;
  fundingUsd?: number;
}

/** one month, one page. what happened, what the hedge did, net */
export function buildStatement(i: StatementInput): MonthlyStatement {
  const ownChg = i.ownPriceStart === 0 ? 0 : (i.ownPriceEnd - i.ownPriceStart) / i.ownPriceStart;
  const ownSign = i.exposure.direction === -1 ? 1 : -1;
  const actual = i.exposure.spotNotionalUsd * ownChg * ownSign;
  const sideSign = i.plan.side === "long" ? 1 : -1;
  const funding = i.fundingUsd ?? 0;
  const hedge = sideSign * i.plan.quantity * (i.indexEnd - i.indexStart) - funding - i.plan.feesUsd;
  const lines = [
    `${i.profile.name}, ${i.month}`,
    `spot book $${i.exposure.spotNotionalUsd.toLocaleString()} / month`,
    `own price ${i.ownPriceStart} -> ${i.ownPriceEnd} (${round(ownChg * 100, 2)}%)`,
    `SICI ${i.indexStart} -> ${i.indexEnd} (${round(((i.indexEnd - i.indexStart) / i.indexStart) * 100, 2)}%)`,
    `unhedged result $${round(actual).toLocaleString()}`,
    `hedge (${i.plan.side} ${i.plan.quantity} SICI) $${round(hedge).toLocaleString()} incl. fees and funding`,
    `net $${round(actual + hedge).toLocaleString()}`,
  ];
  return {
    month: i.month,
    profile: i.profile.name,
    spotNotionalUsd: i.exposure.spotNotionalUsd,
    ownPriceStart: i.ownPriceStart,
    ownPriceEnd: i.ownPriceEnd,
    indexStart: i.indexStart,
    indexEnd: i.indexEnd,
    actualPnlUsd: round(actual),
    hedgePnlUsd: round(hedge),
    hedgedPnlUsd: round(actual + hedge),
    fundingUsd: round(funding),
    feesUsd: i.plan.feesUsd,
    lines,
  };
}
