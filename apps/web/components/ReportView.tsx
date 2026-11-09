"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildStatement } from "@lockrate/engine";
import { load, type Saved } from "@/lib/store";
import { num, signed, usd } from "@/lib/format";

interface Props {
  indexStart: number;
  indexEnd: number;
  from: string;
  to: string;
  daily: Array<{ t: string; c: number }>;
}

export function ReportView({ indexStart, indexEnd, from, to, daily }: Props) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [ownStart, setOwnStart] = useState<number>(0);
  const [ownEnd, setOwnEnd] = useState<number>(0);

  useEffect(() => {
    const s = load();
    setSaved(s);
    if (s) {
      const last = s.own.at(-1)?.v ?? s.profile.avgRateUsd;
      setOwnStart(last);
      setOwnEnd(s.profile.avgRateUsd);
    }
  }, []);

  const statement = useMemo(() => {
    if (!saved || !ownStart || !ownEnd) return null;
    const hours = (Date.parse(to) - Date.parse(from)) / 3_600_000;
    const sideSign = saved.result.plan.side === "long" ? 1 : -1;
    const funding = saved.result.plan.notionalUsd * (saved.result.plan.fundingUsdPerMonth / (saved.result.plan.notionalUsd || 1)) * (hours / 720) * (sideSign ? 1 : 1);
    return buildStatement({
      month: `${from} to ${to}`,
      profile: saved.profile,
      exposure: saved.result.exposure,
      plan: saved.result.plan,
      ownPriceStart: ownStart,
      ownPriceEnd: ownEnd,
      indexStart,
      indexEnd,
      fundingUsd: Number.isFinite(funding) ? funding : 0,
    });
  }, [saved, ownStart, ownEnd, from, to, indexStart, indexEnd]);

  if (!saved) {
    return (
      <div className="card text-sm">
        nothing to report yet. <Link className="underline" href="/">run an analysis first</Link>.
      </div>
    );
  }

  const plan = saved.result.plan;

  return (
    <div className="space-y-4">
      <div className="card text-sm">
        <div className="muted text-xs">statement period · since SICI launch</div>
        <div className="mt-1 text-lg font-medium">
          {from} → {to}
        </div>
        <div className="muted text-xs">
          SICI {num(indexStart)} → {num(indexEnd)} ({signed(((indexEnd - indexStart) / indexStart) * 100, 2).replace("$", "")}%), {daily.length} trading days
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card text-sm">
          <div className="muted text-xs">your rate over the same period ($/GPU-hour)</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="text-xs">
              at {from}
              <input className="num mt-1 w-full" type="number" step="0.01" value={ownStart} onChange={(e) => setOwnStart(Number(e.target.value))} />
            </label>
            <label className="text-xs">
              at {to}
              <input className="num mt-1 w-full" type="number" step="0.01" value={ownEnd} onChange={(e) => setOwnEnd(Number(e.target.value))} />
            </label>
          </div>
          <p className="muted mt-2 text-[11px]">
            prefilled from your last history point and the blended rate in the form. replace with what you actually billed.
          </p>
        </div>
        <div className="card text-sm">
          <div className="muted text-xs">position on the books</div>
          {plan.quantity > 0 ? (
            <div className="mt-1">
              <span className="capitalize">{plan.side}</span> {num(plan.quantity, 3)} SICI at {num(plan.entryPrice)}, {usd(plan.notionalUsd)} notional, {plan.leverage}x
            </div>
          ) : (
            <div className="mt-1">no hedge (verdict {saved.result.fit.verdict})</div>
          )}
          <div className="muted mt-1 text-xs">{saved.profile.name}</div>
        </div>
      </div>

      {statement && (
        <div className="card text-sm">
          <div className="muted text-xs">result</div>
          <table className="mt-2 w-full num">
            <tbody>
              <tr>
                <td className="py-1">unhedged</td>
                <td className="text-right">{signed(statement.actualPnlUsd)}</td>
              </tr>
              <tr>
                <td className="py-1">hedge after fees and funding</td>
                <td className="text-right">{signed(statement.hedgePnlUsd)}</td>
              </tr>
              <tr className="border-t font-medium" style={{ borderColor: "var(--line)" }}>
                <td className="py-1">net</td>
                <td className="text-right">{signed(statement.hedgedPnlUsd)}</td>
              </tr>
            </tbody>
          </table>
          <pre className="muted mt-3 whitespace-pre-wrap text-xs">{statement.lines.join("\n")}</pre>
        </div>
      )}
    </div>
  );
}
