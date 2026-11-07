export const usd = (x: number, dp = 0) =>
  x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: dp, minimumFractionDigits: dp });

export const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;

export const num = (x: number, dp = 2) => x.toLocaleString("en-US", { maximumFractionDigits: dp });

export const signed = (x: number, dp = 0) => (x >= 0 ? "+" : "") + usd(x, dp);

export function ago(ms: number, now = Date.now()): string {
  const m = Math.round((now - ms) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
