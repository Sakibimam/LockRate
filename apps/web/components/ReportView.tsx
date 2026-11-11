"use client";

import Link from "next/link";
import { FileText, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
          <FileText className="h-6 w-6 text-zinc-500" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">No statement yet</h1>
        <p className="mt-2 text-zinc-500">Check your risk first. Your statement shows up here.</p>
        <Button asChild className="mt-6">
          <Link href="/">Check my risk</Link>
        </Button>
      </div>
    );
  }

  const plan = saved.result.plan;
  const indexChange = ((indexEnd - indexStart) / indexStart) * 100;
  const up = indexChange >= 0;
  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Statement</h1>
        <p className="mt-1 text-zinc-500">
          {fmtDate(from)} to {fmtDate(to)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">GPU index</p>
            <p className="tabular mt-2 flex items-center gap-2 text-2xl font-semibold text-zinc-900">
              {up ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-rose-600" />}
              {up ? "+" : "−"}
              {num(Math.abs(indexChange))}%
            </p>
            <p className="tabular mt-0.5 text-xs text-zinc-500">
              {num(indexStart)} to {num(indexEnd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Your hedge</p>
            <p className="tabular mt-2 text-2xl font-semibold text-zinc-900">
              {plan.quantity > 0 ? `${plan.side === "short" ? "Sell" : "Buy"} ${num(plan.quantity, 1)} SICI` : "None"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{plan.quantity > 0 ? `${usd(plan.notionalUsd)}, no leverage` : "Your check said not to hedge"}</p>
          </CardContent>
        </Card>
      </div>

      {statement && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="tabular divide-y divide-zinc-100 text-sm">
              <div className="flex justify-between py-3">
                <dt className="text-zinc-500">From your prices alone</dt>
                <dd className="font-medium text-zinc-900">{signed(statement.actualPnlUsd)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-zinc-500">From the hedge, after costs</dt>
                <dd className="font-medium text-zinc-900">{signed(statement.hedgePnlUsd)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="font-medium text-zinc-900">Total</dt>
                <dd className="text-lg font-semibold text-zinc-900">{signed(statement.hedgedPnlUsd)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-1">
          <Accordion type="single" collapsible>
            <AccordionItem value="rates">
              <AccordionTrigger>Adjust your prices</AccordionTrigger>
              <AccordionContent>
                <p className="mb-3 text-xs text-zinc-500">Filled in from your settings. Change to what you actually billed or paid per GPU-hour.</p>
                <div className="grid max-w-sm grid-cols-2 gap-3">
                  <label className="text-xs text-zinc-500">
                    {fmtDate(from)}
                    <Input className="mt-1" type="number" step="0.01" value={ownStart} onChange={(e) => setOwnStart(Number(e.target.value))} />
                  </label>
                  <label className="text-xs text-zinc-500">
                    {fmtDate(to)}
                    <Input className="mt-1" type="number" step="0.01" value={ownEnd} onChange={(e) => setOwnEnd(Number(e.target.value))} />
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
            {statement && (
              <AccordionItem value="lines">
                <AccordionTrigger>Full breakdown</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 text-sm text-zinc-600">
                    {statement.lines.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
