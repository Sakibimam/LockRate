import type { FitResult, Profile } from "@lockrate/engine";

export type Match = "Strong" | "Some" | "Weak" | "Opposite";

/** plain-language strength of the price match */
export function matchWord(fit: FitResult): Match {
  if (fit.beta < 0 || fit.score < 0) return "Opposite";
  if (fit.score >= fit.thresholds.hedge) return "Strong";
  if (fit.score >= fit.thresholds.partial) return "Some";
  return "Weak";
}

export function prettyProxy(key: string): string {
  const s = key
    .replace(/-/g, " ")
    .replace(/\bh(\d)/gi, "H$1")
    .replace(/\ba(\d)/gi, "A$1")
    .replace(/\b1y\b/, "1-year");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const isSeller = (p: Profile) => p.role === "operator";

/** short names for the sample profiles, for chips */
export const EXAMPLE_LABELS: Record<string, string> = {
  "marketplace-host-64-h100": "64 H100 host",
  "neocloud-80-contracted": "Neocloud on contracts",
  "decentralised-provider-4090": "4090 + A100 provider",
  "ai-team-inference-buyer": "AI team buying GPUs",
};

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
