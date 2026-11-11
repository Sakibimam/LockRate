import { GPU_LABELS, type Exposure, type FitResult, type HedgePlan, type Limits, type SimResult } from "@lockrate/engine";
import { num, pct, signed, usd } from "@/lib/format";
import { capitalise, prettyProxy } from "@/lib/words";

interface Props {
  fit: FitResult;
  exposure: Exposure;
  plan: HedgePlan;
  sim: SimResult;
  limits: Limits;
  ownLabel: string;
  ownMonths: number;
}

function Table({ rows, head }: { rows: Array<[React.ReactNode, ...React.ReactNode[]]>; head?: string[] }) {
  return (
    <table className="tabular w-full text-sm">
      {head && (
        <thead>
          <tr className="text-left text-xs text-zinc-500">
            {head.map((h, i) => (
              <th key={i} className={`pb-2 font-medium ${i ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-zinc-100">
            {r.map((c, j) => (
              <td key={j} className={`py-2 ${j ? "text-right font-medium text-zinc-900" : "text-zinc-600"}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
      {note && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{note}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Details({ fit, exposure, plan, sim, limits, ownLabel, ownMonths }: Props) {
  const pos = Math.max(0, Math.min(1, (fit.score + 1) / 2));
  const t = fit.thresholds;
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Section title="Index match" note={`Correlation of monthly price changes. ${t.hedge}+ means hedge, ${t.partial}+ means a small hedge.`}>
        <div className="relative h-2 rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200">
          <div className="absolute -top-1 h-4 w-1.5 rounded-full bg-zinc-900" style={{ left: `calc(${pos * 100}% - 3px)` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
          <span>Opposite</span>
          <span>Identical</span>
        </div>
        <div className="mt-3">
          <Table
            rows={[
              ["Correlation", fit.score.toFixed(2)],
              ["Beta (used for sizing)", fit.beta.toFixed(2)],
              ["R²", fit.r2.toFixed(2)],
              ["Months compared", fit.n],
              ["Your prices", ownLabel === "custom" ? `Pasted, ${ownMonths} months` : prettyProxy(ownLabel)],
            ]}
          />
        </div>
      </Section>

      <Section title="Your GPUs" note={`${pct(exposure.basketOverlap, 0)} of your GPU-hours are on cards the index covers (H100, B200, H200, A100, RTX 4090).`}>
        <Table
          head={["GPU", "Hours / mo", "Value / mo"]}
          rows={exposure.byModel.map((m) => [
            <span key="n" className={m.inBasket ? "" : "text-zinc-400"}>
              {GPU_LABELS[m.model]}
              {!m.inBasket && " (not in index)"}
            </span>,
            num(m.gpuHours, 0),
            usd(m.notionalUsd),
          ])}
        />
      </Section>

      <Section title="Replay" note={`One position held for all ${sim.periods.length} months. If the hedge lost money overall, it cost ${usd(sim.costOfHedgeUsd)}.`}>
        <Table
          head={["", "Without", "With hedge"]}
          rows={[
            ["Total change", signed(sim.unhedged.total), signed(sim.hedged.total)],
            ["Worst month", usd(sim.unhedged.worst), usd(sim.hedged.worst)],
            ["Typical swing", usd(sim.unhedged.stdev), usd(sim.hedged.stdev)],
          ]}
        />
      </Section>

      <Section title="Safety limits">
        <Table
          rows={[
            ...(plan.quantity > 0
              ? ([
                  ["Side", capitalise(plan.side)],
                  ["Entry price", num(plan.entryPrice)],
                ] as Array<[React.ReactNode, React.ReactNode]>)
              : []),
            ["Largest hedge allowed", usd(limits.maxNotionalUsd)],
            ["Leverage", "None (1x)"],
            ["Market data must be newer than", `${limits.staleDataMinutes} min`],
          ]}
        />
        {fit.reasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-zinc-500">
            {fit.reasons.map((r, i) => (
              <li key={i}>{capitalise(r)}</li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
