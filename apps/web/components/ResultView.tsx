"use client";

import Link from "next/link";
import { ArrowRight, Pencil, ShieldAlert, ShieldCheck, ShieldX, TrendingDown, TrendingUp, Activity, CircleDollarSign } from "lucide-react";
import type { Limits, Profile, RunResult } from "@lockrate/engine";
import type { SiciApi } from "@/app/api/sici/route";
import { num, usd, usdShort } from "@/lib/format";
import { EXAMPLE_LABELS, matchWord } from "@/lib/words";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimChart } from "./SimChart";
import { Details } from "./Details";
import { ExplainBox } from "./ExplainBox";

interface Props {
  profile: Profile;
  result: RunResult;
  limits: Limits;
  market: SiciApi | null | undefined;
  ownLabel: string;
  ownMonths: number;
  onEdit: () => void;
}

const TONE = {
  hedge: { icon: ShieldCheck, ring: "bg-emerald-50 text-emerald-600", card: "border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white", title: "You should hedge" },
  partial: { icon: ShieldAlert, ring: "bg-amber-50 text-amber-600", card: "border-amber-200 bg-gradient-to-b from-amber-50/70 to-white", title: "A small hedge could help" },
  skip: { icon: ShieldX, ring: "bg-rose-50 text-rose-600", card: "border-rose-200 bg-gradient-to-b from-rose-50/70 to-white", title: "Don't hedge" },
} as const;

function subline(r: RunResult): string {
  if (r.fit.verdict === "hedge") return "Your prices follow the GPU index, so a hedge can cancel most of your price risk.";
  if (r.fit.verdict === "partial") return "Your prices only partly follow the GPU index. A smaller hedge takes off some of the risk.";
  if (r.fit.beta < 0) return "Your prices move opposite to the GPU index. A hedge would lose money exactly when you do.";
  return "Your prices don't follow the GPU index closely enough for a hedge to help.";
}

const MATCH_TONE = { Strong: "good", Some: "warn", Weak: "bad", Opposite: "bad" } as const;

function Stat({ icon: Icon, label, tip, value, sub, badge }: { icon: typeof Activity; label: string; tip: string; value: React.ReactNode; sub?: string; badge?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-zinc-500">
            <Icon className="h-4 w-4 text-zinc-400" />
            {label}
            <InfoTip>{tip}</InfoTip>
          </span>
          {badge}
        </div>
        <div className="tabular mt-3 text-2xl font-semibold tracking-tight text-zinc-900">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function ResultView({ profile, result, limits, market, ownLabel, ownMonths, onEdit }: Props) {
  const { fit, exposure, plan, sim } = result;
  const seller = profile.role === "operator";
  const tone = TONE[fit.verdict];
  const match = matchWord(fit);
  const hedged = plan.quantity > 0;
  const stale = !market || market.source !== "live" || !market.fresh;
  const capped = plan.limitsApplied.some((l) => l.startsWith("notional capped"));
  const funding = -plan.fundingUsdPerMonth;
  const cards = profile.gpus.reduce((a, g) => a + (g.count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-500">
          {EXAMPLE_LABELS[profile.id] ? `Example: ${EXAMPLE_LABELS[profile.id]}` : "Your result"} · {cards} GPUs · {Math.round(profile.spotShare * 100)}% at market price
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
      </div>

      <div className={cn("rounded-2xl border p-6 sm:p-8", tone.card)}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", tone.ring)}>
            <tone.icon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{tone.title}</h1>
            <p className="mt-1.5 max-w-2xl text-zinc-600">{subline(result)}</p>
          </div>
        </div>
        {fit.lowConfidence && <p className="mt-4 text-sm text-amber-700">Based on only {fit.n} months of prices. Treat it as a first look.</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              icon={CircleDollarSign}
              label="At risk"
              tip={`Your monthly ${seller ? "income" : "GPU bill"} that moves with market prices.`}
              value={usdShort(exposure.spotNotionalUsd)}
              sub="per month"
            />
            <Stat
              icon={seller ? TrendingDown : TrendingUp}
              label={seller ? "If prices drop 1%" : "If prices rise 1%"}
              tip={seller ? "How much less you'd earn each month after a 1% fall in GPU prices." : "How much more you'd pay each month after a 1% rise in GPU prices."}
              value={<span className="text-rose-600">{seller ? "−" : "+"}{usd(exposure.dollarsPerPct)}</span>}
              sub="per month"
            />
            <Stat
              icon={Activity}
              label="Index match"
              tip="How closely the SICI GPU price index has moved with your prices, month to month. Strong means a hedge will follow you."
              value={match}
              sub={`over ${fit.n} months`}
              badge={<Badge tone={MATCH_TONE[match]}>{fit.score.toFixed(2)}</Badge>}
            />
          </div>

          <SimChart sim={sim} hedged={hedged} />

          <Card>
            <CardContent className="py-1">
              <Accordion type="single" collapsible>
                <AccordionItem value="math">
                  <AccordionTrigger>How we worked this out</AccordionTrigger>
                  <AccordionContent>
                    <Details fit={fit} exposure={exposure} plan={plan} sim={sim} limits={limits} ownLabel={ownLabel} ownMonths={ownMonths} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="order-first space-y-6 lg:order-none lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Your hedge</CardTitle>
              {hedged && <Badge tone="blue">No leverage</Badge>}
            </CardHeader>
            <CardContent>
              {hedged ? (
                <>
                  <div className="text-sm text-zinc-500">{plan.side === "short" ? "Sell" : "Buy"}</div>
                  <div className="tabular text-3xl font-semibold tracking-tight text-zinc-900">
                    {num(plan.quantity, 1)} <span className="text-lg font-medium text-zinc-500">SICI</span>
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    <Row label="Hedge size" value={usd(plan.notionalUsd)} extra={capped ? <Badge tone="warn">Capped</Badge> : null} />
                    <Row label="You deposit" value={`${usd(plan.marginUsd)} USDC`} />
                    <Row label="Trading fees" value={plan.feesUsd < 1 ? "under $1" : `≈ ${usd(plan.feesUsd)}`} />
                    <Row label="Monthly cost" value={Math.abs(funding) < 1 ? "≈ $0" : funding > 0 ? `≈ +${usd(funding)}` : `≈ ${usd(Math.abs(funding))}`} hint={funding >= 1 ? "paid to you" : undefined} />
                  </dl>
                  <Button asChild size="lg" className="mt-6 w-full">
                    <Link href="/live" aria-disabled={stale} className={stale ? "pointer-events-none opacity-40" : ""}>
                      Set up hedge <ArrowRight />
                    </Link>
                  </Button>
                  <p className="mt-3 text-center text-xs text-zinc-500">
                    {stale ? "Market data is updating. Try again shortly." : "You approve every trade in your own wallet."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold tracking-tight text-zinc-900">Nothing to do</p>
                  <p className="mt-1.5 text-sm text-zinc-500">
                    {fit.verdict === "skip" ? "Leave your business as it is. Check again when you have more price history." : "The hedge rounds down to zero. Try more GPUs or a bigger hedge size."}
                  </p>
                  <Button variant="outline" className="mt-5 w-full" onClick={onEdit}>
                    Try different numbers
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <ExplainBox profile={profile} result={result} />

          <Link href="/report" className="block rounded-2xl border border-zinc-200 p-5 text-sm transition hover:border-zinc-400">
            <span className="font-medium text-zinc-900">Monthly statement</span>
            <span className="mt-0.5 block text-zinc-500">See what the hedge would have done since launch.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, hint, extra }: { label: string; value: string; hint?: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="tabular flex items-center gap-2 font-medium text-zinc-900">
        {extra}
        {value}
        {hint && <span className="text-xs font-normal text-emerald-600">{hint}</span>}
      </dd>
    </div>
  );
}
