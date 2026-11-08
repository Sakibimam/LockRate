"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimResult } from "@lockrate/engine";
import { pct, signed, usd } from "@/lib/format";

export function SimChart({ sim, role }: { sim: SimResult; role: "operator" | "buyer" }) {
  let cu = 0;
  let ch = 0;
  const rows = sim.periods.map((p) => {
    cu += p.unhedgedPnl;
    ch += p.hedgedPnl;
    return { t: p.t, unhedged: Math.round(cu), hedged: Math.round(ch), index: p.indexPrice };
  });
  const better = sim.volReduction > 0;
  return (
    <div className="card text-sm">
      <div className="flex items-baseline justify-between">
        <div className="muted text-xs">paper simulation · cumulative monthly P&amp;L vs the first month, {role === "operator" ? "revenue" : "cost"} view</div>
        <div className={`text-xs ${better ? "t-ok" : "t-bad"}`}>
          {better ? "volatility down" : "volatility up"} {pct(Math.abs(sim.volReduction), 0)}
        </div>
      </div>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="var(--muted)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted)" tickFormatter={(v: number) => usd(v)} width={70} />
            <Tooltip
              contentStyle={{ background: "var(--bg)", border: "1px solid var(--line)", fontSize: 12 }}
              formatter={(v) => usd(Number(v))}
            />
            <Line type="monotone" dataKey="unhedged" stroke="var(--muted)" dot={false} strokeWidth={1.5} name="unhedged" />
            <Line type="monotone" dataKey="hedged" stroke="var(--accent)" dot={false} strokeWidth={2} name="hedged" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-3 w-full text-xs">
        <thead className="muted">
          <tr>
            <th className="text-left font-normal"></th>
            <th className="text-right font-normal">total</th>
            <th className="text-right font-normal">worst month</th>
            <th className="text-right font-normal">monthly stdev</th>
          </tr>
        </thead>
        <tbody className="num">
          <tr>
            <td>unhedged</td>
            <td className="text-right">{signed(sim.unhedged.total)}</td>
            <td className="text-right">{usd(sim.unhedged.worst)}</td>
            <td className="text-right">{usd(sim.unhedged.stdev)}</td>
          </tr>
          <tr>
            <td>hedged</td>
            <td className="text-right">{signed(sim.hedged.total)}</td>
            <td className="text-right">{usd(sim.hedged.worst)}</td>
            <td className="text-right">{usd(sim.hedged.stdev)}</td>
          </tr>
        </tbody>
      </table>
      <p className="muted mt-2 text-[11px]">
        {sim.periods.length} months. position held at the planned size, no rolling. cost of hedge if it lost money: {usd(sim.costOfHedgeUsd)}.
      </p>
    </div>
  );
}
