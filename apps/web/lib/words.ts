import type { FitResult, Profile } from "@lockrate/engine";

/** plain-language strength of the price match */
export function matchWord(fit: FitResult): string {
  if (fit.beta < 0 || fit.score < 0) return "Opposite";
  if (fit.score >= fit.thresholds.hedge) return "Strong";
  if (fit.score >= fit.thresholds.partial) return "Some";
  return "Weak";
}

export function prettyProxy(key: string): string {
  const s = key.replace(/-/g, " ").replace(/\bh(\d)/gi, "H$1").replace(/\ba(\d)/gi, "A$1");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const isSeller = (p: Profile) => p.role === "operator";
