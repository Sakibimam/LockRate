import type { FitResult } from "@lockrate/engine";

const COPY = {
  hedge: { title: "Hedge", body: "Your prices track SICI. A short (or long) SICI perp sized to your exposure takes most of the price risk off the table." },
  partial: { title: "Partial hedge", body: "Some co-movement, not enough to lean on. Half-size hedge, and the leftover basis stays visible in the simulation." },
  skip: { title: "Don't hedge", body: "SICI does not follow your prices. A hedge here would add a second bet on top of the one you already have." },
} as const;

export function VerdictBanner({ fit, stale }: { fit: FitResult; stale: boolean }) {
  const c = COPY[fit.verdict];
  return (
    <div className={`card verdict-${fit.verdict} border-2`}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">{c.title}</div>
          <p className="mt-1 text-sm">{c.body}</p>
        </div>
        <div className="text-right text-xs muted">
          fit {fit.score.toFixed(2)}
          {fit.lowConfidence && <div className="t-warn">short history</div>}
          {stale && <div className="t-warn">market data stale, no live plan</div>}
        </div>
      </div>
    </div>
  );
}
