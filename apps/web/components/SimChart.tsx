"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimResult } from "@lockrate/engine";
import { pct, usd, usdShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const monthLabel = (t: string) => {
  const d = new Date(`${t.slice(0, 7)}-01T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? t : d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

const GREY = "#a1a1aa";
const BLUE = "#2563eb";

export function SimChart({ sim, hedged }: { sim: SimResult; hedged: boolean }) {
  let cu = 0;
  let ch = 0;
  const rows = sim.periods.map((p) => {
    cu += p.unhedgedPnl;
    ch += p.hedgedPnl;
    return { t: monthLabel(p.t), without: Math.round(cu), with: Math.round(ch) };
  });
  const calmer = sim.volReduction > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Last {sim.periods.length} months, replayed</CardTitle>
          <p className="mt-0.5 text-sm text-zinc-500">Change in your monthly money vs. the first month</p>
        </div>
        {hedged && (
          <Badge tone={calmer ? "good" : "bad"}>
            {calmer ? `${pct(sim.volReduction, 0)} calmer` : `${pct(Math.abs(sim.volReduction), 0)} bumpier`}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: GREY }} /> Without hedge
          </span>
          {hedged && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: BLUE }} /> With hedge
            </span>
          )}
        </div>
        <div className="h-60" role="img" aria-label={hedged ? `With the hedge, monthly swings would have been ${pct(sim.volReduction, 0)} smaller.` : "Your money without a hedge."}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="withFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => usdShort(v)} width={56} />
              <Tooltip
                cursor={{ stroke: "#e4e4e7" }}
                contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}
                formatter={(v, name) => [usd(Number(v)), name === "with" ? "With hedge" : "Without hedge"]}
              />
              <Line type="monotone" dataKey="without" stroke={GREY} strokeWidth={2} dot={false} isAnimationActive={false} />
              {hedged && <Area type="monotone" dataKey="with" stroke={BLUE} strokeWidth={2.5} fill="url(#withFill)" dot={false} isAnimationActive={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
