import type { FitResult } from "@lockrate/engine";

export function FitCard({ fit, ownLabel, n }: { fit: FitResult; ownLabel: string; n: number }) {
  const cls = fit.verdict === "hedge" ? "t-ok" : fit.verdict === "partial" ? "t-warn" : "t-bad";
  const pos = Math.max(0, Math.min(1, (fit.score + 1) / 2));
  const t = fit.thresholds;
  return (
    <div className="card text-sm">
      <div className="muted text-xs">hedge fit</div>
      <div className={`mt-1 text-2xl font-semibold num ${cls}`}>{fit.score.toFixed(2)}</div>
      <div className="muted text-xs">correlation of monthly % changes, your prices vs SICI</div>

      <div className="relative mt-3 h-2 rounded-full" style={{ background: "var(--line)" }}>
        <div className="absolute inset-y-0 w-px" style={{ left: `${((t.partial + 1) / 2) * 100}%`, background: "var(--warn)" }} />
        <div className="absolute inset-y-0 w-px" style={{ left: `${((t.hedge + 1) / 2) * 100}%`, background: "var(--ok)" }} />
        <div className="absolute -top-1 h-4 w-1 rounded" style={{ left: `calc(${pos * 100}% - 2px)`, background: "var(--fg)" }} />
      </div>
      <div className="muted mt-1 flex justify-between text-[10px]">
        <span>-1</span>
        <span>skip &lt; {t.partial} ≤ partial &lt; {t.hedge} ≤ hedge</span>
        <span>+1</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="muted">beta</div>
          <div className="num">{fit.beta.toFixed(2)}</div>
        </div>
        <div>
          <div className="muted">r²</div>
          <div className="num">{fit.r2.toFixed(2)}</div>
        </div>
        <div>
          <div className="muted">overlap</div>
          <div className="num">
            {fit.n} periods{fit.lowConfidence ? " (short)" : ""}
          </div>
        </div>
      </div>
      <div className="muted mt-2 text-[11px]">
        source: {ownLabel === "custom" ? `your CSV, ${n} months` : ownLabel}
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {fit.reasons.map((r, i) => (
          <li key={i}>· {r}</li>
        ))}
      </ul>
    </div>
  );
}
