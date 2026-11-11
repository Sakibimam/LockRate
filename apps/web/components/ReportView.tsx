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
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold">Monthly statement</h1>
        <p className="mt-3 text-[17px]">
          There's nothing to report yet. Check your risk first and your statement will appear here.
        </p>
        <Link className="btn btn-primary mt-5" href="/">
          Check my risk
        </Link>
      </div>
    );
  }

  const plan = saved.result.plan;
  const indexChange = ((indexEnd - indexStart) / indexStart) * 100;
  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <div className="max-w-3xl space-y-12">
      <div>
        <h1 className="text-3xl font-bold sm:text-[2.5rem]">Monthly statement</h1>
        <p className="mt-3 text-[17px]">
          From {fmtDate(from)} to {fmtDate(to)}, the GPU price index went {indexChange >= 0 ? "up" : "down"}{" "}
          <span className="num">{num(Math.abs(indexChange))}%</span>, from <span className="num">{num(indexStart)}</span> to{" "}
          <span className="num">{num(indexEnd)}</span>.
        </p>
        <p className="muted mt-2">
          {plan.quantity > 0
            ? `Your hedge: ${plan.side === "short" ? "sold" : "bought"} ${num(plan.quantity, 3)} SICI at ${num(plan.entryPrice)}, worth ${usd(plan.notionalUsd)}.`
            : "You had no hedge in place."}{" "}
          Based on {saved.profile.name.charAt(0).toLowerCase() + saved.profile.name.slice(1)}.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold">Your price per GPU-hour</h2>
        <p className="muted mt-1">We filled these in from your settings. Change them to what you actually billed or paid.</p>
        <div className="mt-4 grid max-w-md grid-cols-2 gap-4">
          <label>
            <span className="field-label">On {fmtDate(from)}</span>
            <input className="num" type="number" step="0.01" value={ownStart} onChange={(e) => setOwnStart(Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label">On {fmtDate(to)}</span>
            <input className="num" type="number" step="0.01" value={ownEnd} onChange={(e) => setOwnEnd(Number(e.target.value))} />
          </label>
        </div>
      </section>

      {statement && (
        <section>
          <h2 className="text-2xl font-bold">How it worked out</h2>
          <dl className="facts mt-4">
            <div>
              <dt>Change from your prices alone</dt>
              <dd>{signed(statement.actualPnlUsd)}</dd>
            </div>
            <div>
              <dt>Hedge result, after fees and holding costs</dt>
              <dd>{signed(statement.hedgePnlUsd)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Overall</dt>
              <dd className="text-lg">{signed(statement.hedgedPnlUsd)}</dd>
            </div>
          </dl>
          <details className="mt-6">
            <summary>Line-by-line breakdown</summary>
            <ul className="muted mt-3 space-y-1 text-sm">
              {statement.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
