import type { GpuModel } from "./types";

/**
 * SICI composition as published by Injective / LO:TECH on 2026-10-26.
 * five nvidia cards, fixed weights, rebased to 100 at the 2026-07-22 fixing.
 */
export const SICI_WEIGHTS: Record<Exclude<GpuModel, "OTHER">, number> = {
  H100: 0.4,
  B200: 0.25,
  H200: 0.15,
  A100: 0.1,
  RTX4090: 0.1,
};

export const SICI_BASKET: GpuModel[] = Object.keys(SICI_WEIGHTS) as GpuModel[];

export function inBasket(model: GpuModel): boolean {
  return model !== "OTHER" && model in SICI_WEIGHTS;
}

export const GPU_LABELS: Record<GpuModel, string> = {
  H100: "H100 SXM 80GB",
  B200: "B200",
  H200: "H200",
  A100: "A100 SXM 80GB",
  RTX4090: "RTX 4090",
  OTHER: "Other / not in index",
};
