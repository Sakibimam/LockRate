"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimResult } from "@lockrate/engine";
import { pct, usd } from "@/lib/format";

const monthLabel = (t: string) => {
  const d = new Date(`${t.slice(0, 7)}-01T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? t : d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

export function SimChart({ sim, hedged }: { sim: SimResult; hedged: boolean }) {
  let cu = 0;
  let ch = 0;
  const rows = sim.periods.map((p) => {
    cu += p.unhedgedPnl;
    ch += p.hedgedPnl;
    return { t: monthLabel(p.t), without: Math.round(cu), with: Math.round(ch) };
  });
  const calmer = sim.volReduction > 0;

  let summary: string;
  if (!hedged) summary = "With no hedge suggested, this is how your prices alone moved your money.";
  else if (calmer) summary = `With the hedge, your month-to-month swings would have been ${pct(sim.volReduction, 0)} smaller.`;
  else summary = `The hedge would have made your month-to-month swings ${pct(Math.abs(sim.volReduction), 0)} bigger.`;

  return (
    <section>
      <h2 className="text-2xl font-bold">The last {sim.periods.length} months, replayed</h2>
      <p className="mt-2 max-w-2xl text-[17px]">{summary}</p>

      <div className="mt-4 flex flex-wrap gap-5 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-block h-[3px] w-5 rounded" style={{ background: "var(--muted)" }} />
          Without a hedge
        </span>
        {hedged && (
          <span className="flex items-center gap-2">
            <span className="inline-block h-[3px] w-5 rounded" style={{ background: "var(--accent)" }} />
            With the hedge
          </span>
        )}
      </div>

      <div className="mt-3 h-64" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart className="chart" data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid className="chart-grid" stroke="#d8e0dc" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 12, fill: "var(--muted)" }} stroke="var(--line)" tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted)" }}
              stroke="var(--line)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => usd(v)}
              width={76}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
              formatter={(v, name) => [usd(Number(v)), name === "with" ? "With the hedge" : "Without a hedge"]}
            />
            <Line className="line-without" type="monotone" dataKey="without" stroke="#5b6863" dot={false} strokeWidth={2} isAnimationActive={false} />
            {hedged && <Line className="line-with" type="monotone" dataKey="with" stroke="#0e6b4f" dot={false} strokeWidth={2.5} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="muted mt-2 text-sm">Running total of how much your monthly money changed compared with the first month.</p>
    </section>
  );
}
