import { GPU_LABELS, type Exposure, type FitResult, type HedgePlan, type Limits, type SimResult } from "@lockrate/engine";
import { num, pct, signed, usd } from "@/lib/format";
import { prettyProxy } from "@/lib/words";

interface Props {
  fit: FitResult;
  exposure: Exposure;
  plan: HedgePlan;
  sim: SimResult;
  limits: Limits;
  ownLabel: string;
  ownMonths: number;
}

export function Details({ fit, exposure, plan, sim, limits, ownLabel, ownMonths }: Props) {
  const pos = Math.max(0, Math.min(1, (fit.score + 1) / 2));
  const t = fit.thresholds;
  return (
    <details className="border-t pt-6" style={{ borderColor: "var(--line)" }}>
      <summary className="text-lg">How this was worked out</summary>

      <div className="mt-6 grid gap-10 text-sm md:grid-cols-2">
        <div>
          <h3 className="text-base font-bold">Price match</h3>
          <p className="muted mt-1">
            We compare how your prices and the SICI GPU index changed month to month. Above {t.hedge} we suggest a full hedge,
            above {t.partial} a small one.
          </p>
          <div className="relative mt-4 h-2 rounded-full" style={{ background: "var(--line)" }}>
            <div className="absolute inset-y-0 w-0.5" style={{ left: `${((t.partial + 1) / 2) * 100}%`, background: "var(--warn)" }} />
            <div className="absolute inset-y-0 w-0.5" style={{ left: `${((t.hedge + 1) / 2) * 100}%`, background: "var(--ok)" }} />
            <div className="absolute -top-1.5 h-5 w-1.5 rounded" style={{ left: `calc(${pos * 100}% - 3px)`, background: "var(--fg)" }} />
          </div>
          <div className="muted mt-1 flex justify-between text-xs">
            <span>Opposite</span>
            <span>Identical</span>
          </div>
          <table className="plain mt-4">
            <tbody className="num">
              <tr>
                <td>Correlation</td>
                <td className="r">{fit.score.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Beta, used for sizing</td>
                <td className="r">{fit.beta.toFixed(2)}</td>
              </tr>
              <tr>
                <td>R²</td>
                <td className="r">{fit.r2.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Months compared</td>
                <td className="r">{fit.n}</td>
              </tr>
              <tr>
                <td>Your price source</td>
                <td className="r">{ownLabel === "custom" ? `Pasted, ${ownMonths} months` : prettyProxy(ownLabel)}</td>
              </tr>
            </tbody>
          </table>
          {fit.reasons.length > 0 && (
            <ul className="muted mt-3 list-disc space-y-1 pl-5">
              {fit.reasons.map((r, i) => (
                <li key={i}>{r.charAt(0).toUpperCase() + r.slice(1)}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold">Your cards</h3>
          <p className="muted mt-1">
            The index covers H100, B200, H200, A100 and RTX 4090. {pct(exposure.basketOverlap, 0)} of your GPU-hours are on
            those cards.
          </p>
          <table className="plain mt-4">
            <thead>
              <tr>
                <th>Card</th>
                <th className="r">Hours a month</th>
                <th className="r">Value</th>
              </tr>
            </thead>
            <tbody className="num">
              {exposure.byModel.map((m, i) => (
                <tr key={i} className={m.inBasket ? "" : "muted"}>
                  <td>
                    {GPU_LABELS[m.model]}
                    {!m.inBasket && <span className="block text-xs">Not in the index</span>}
                  </td>
                  <td className="r">{num(m.gpuHours, 0)}</td>
                  <td className="r">{usd(m.notionalUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-base font-bold">Replay results</h3>
          <table className="plain mt-3">
            <thead>
              <tr>
                <th />
                <th className="r">Without</th>
                <th className="r">With hedge</th>
              </tr>
            </thead>
            <tbody className="num">
              <tr>
                <td>Total change</td>
                <td className="r">{signed(sim.unhedged.total)}</td>
                <td className="r">{signed(sim.hedged.total)}</td>
              </tr>
              <tr>
                <td>Worst month</td>
                <td className="r">{usd(sim.unhedged.worst)}</td>
                <td className="r">{usd(sim.hedged.worst)}</td>
              </tr>
              <tr>
                <td>Typical monthly swing</td>
                <td className="r">{usd(sim.unhedged.stdev)}</td>
                <td className="r">{usd(sim.hedged.stdev)}</td>
              </tr>
            </tbody>
          </table>
          <p className="muted mt-2">
            The hedge is held at one size the whole time. If it lost money overall, that cost was {usd(sim.costOfHedgeUsd)}.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold">Order details and limits</h3>
          <table className="plain mt-3">
            <tbody className="num">
              {plan.quantity > 0 && (
                <>
                  <tr>
                    <td>Side</td>
                    <td className="r capitalize">{plan.side}</td>
                  </tr>
                  <tr>
                    <td>Entry price</td>
                    <td className="r">{num(plan.entryPrice)}</td>
                  </tr>
                  <tr>
                    <td>Position value</td>
                    <td className="r">{usd(plan.notionalUsd)}</td>
                  </tr>
                </>
              )}
              <tr>
                <td>Largest hedge allowed</td>
                <td className="r">{usd(limits.maxNotionalUsd)}</td>
              </tr>
              <tr>
                <td>Leverage</td>
                <td className="r">None (1x)</td>
              </tr>
              <tr>
                <td>Market data must be newer than</td>
                <td className="r">{limits.staleDataMinutes} min</td>
              </tr>
            </tbody>
          </table>
          {(plan.limitsApplied.length > 0 || plan.warnings.length > 0) && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {plan.limitsApplied.map((l, i) => (
                <li key={`l${i}`} className="t-warn">
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </li>
              ))}
              {plan.warnings.map((w, i) => (
                <li key={`w${i}`} className="muted">
                  {w.charAt(0).toUpperCase() + w.slice(1)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </details>
  );
}
