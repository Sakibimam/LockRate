"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { GPU_LABELS, type GpuLine, type GpuModel, type Profile, type SeriesPoint } from "@lockrate/engine";
import { parseSeriesCsv } from "@/lib/csv";
import { prettyProxy } from "@/lib/words";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { InfoTip } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Segmented } from "@/components/ui/segmented";
import { RateCardPaste } from "./RateCardPaste";
import type { ProxyMap } from "./Dashboard";

const MODELS = Object.keys(GPU_LABELS) as GpuModel[];
const shortLabel = (m: GpuModel) => (m === "OTHER" ? "Other card" : GPU_LABELS[m].replace(/ SXM.*$/, ""));

interface Props {
  profile: Profile;
  onProfile: (p: Profile) => void;
  proxies: ProxyMap;
  ownLabel: string;
  onOwn: (pts: SeriesPoint[], label: string) => void;
  scale: number;
  onScale: (x: number) => void;
  onBack: () => void;
  onDone: () => void;
}

function Field({ label, tip, value, children }: { label: string; tip?: string; value?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
          {label}
          {tip && <InfoTip>{tip}</InfoTip>}
        </span>
        {value && <span className="tabular text-sm font-semibold text-zinc-900">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export function FleetStep({ profile, onProfile, proxies, ownLabel, onOwn, scale, onScale, onBack, onDone }: Props) {
  const [csv, setCsv] = useState("");
  const [csvNote, setCsvNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<string>(ownLabel in proxies ? ownLabel : "custom");

  const set = (patch: Partial<Profile>) => onProfile({ ...profile, ...patch });
  const setLine = (i: number, patch: Partial<GpuLine>) => set({ gpus: profile.gpus.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const seller = profile.role === "operator";
  const totalCards = profile.gpus.reduce((a, g) => a + (g.count || 0), 0);

  return (
    <div className="mx-auto max-w-xl">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-2 flex items-center gap-3 text-xs font-medium text-zinc-500">
        <span>Step 2 of 2</span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
          <span className="block h-full w-full bg-zinc-900" />
        </span>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Your GPUs</h1>
      <p className="mt-2 text-zinc-500">Rough numbers are fine. You can change them later.</p>

      <Card className="mt-8">
        <CardContent className="space-y-7">
          <Field label="I…">
            <Segmented
              value={profile.role}
              onChange={(role) => set({ role })}
              options={[
                { value: "operator", label: "Rent out GPUs" },
                { value: "buyer", label: "Pay for GPUs" },
              ]}
            />
          </Field>

          <div>
            <div className="mb-2 grid grid-cols-[minmax(0,1fr)_76px_88px_36px] gap-2 text-xs font-medium text-zinc-500">
              <span>GPU</span>
              <span>How many</span>
              <span>$ / hour</span>
              <span />
            </div>
            <div className="space-y-2">
              {profile.gpus.map((l, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_76px_88px_36px] items-center gap-2">
                  <NativeSelect aria-label="GPU model" value={l.model} onChange={(e) => setLine(i, { model: e.target.value as GpuModel })}>
                    {MODELS.map((m) => (
                      <option key={m} value={m}>
                        {shortLabel(m)}
                      </option>
                    ))}
                  </NativeSelect>
                  <Input aria-label="How many" type="number" min={0} value={l.count} onChange={(e) => setLine(i, { count: Number(e.target.value) })} />
                  <Input
                    aria-label="Dollars per hour"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder={String(profile.avgRateUsd)}
                    value={l.rateUsd ?? ""}
                    onChange={(e) => setLine(i, { rateUsd: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    disabled={profile.gpus.length === 1}
                    onClick={() => set({ gpus: profile.gpus.filter((_, j) => j !== i) })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => set({ gpus: [...profile.gpus, { model: "H100", count: 8 }] })}>
              <Plus /> Add GPU type
            </Button>
          </div>

          <Field label="Typical price per GPU-hour" tip="Used for any row above where you left the price blank.">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <Input
                className="pl-7"
                type="number"
                step="0.01"
                min={0}
                value={profile.avgRateUsd}
                onChange={(e) => set({ avgRateUsd: Number(e.target.value) })}
              />
            </div>
          </Field>

          <Field
            label="Paid at market price"
            tip={`The share of your ${seller ? "income" : "GPU bill"} that isn't locked into a fixed-price contract. Only this part can swing.`}
            value={`${Math.round(profile.spotShare * 100)}%`}
          >
            <Slider aria-label="Paid at market price" min={0} max={1} step={0.05} value={[profile.spotShare]} onValueChange={([v]) => set({ spotShare: v ?? 0 })} />
            <div className="mt-1 flex justify-between text-xs text-zinc-400">
              <span>All fixed contracts</span>
              <span>All market price</span>
            </div>
          </Field>

          <Accordion type="single" collapsible className="-mb-2 border-t border-zinc-100">
            <AccordionItem value="more">
              <AccordionTrigger>More options</AccordionTrigger>
              <AccordionContent className="space-y-7 pt-2">
                <Field
                  label={seller ? "Rented out" : "In use"}
                  tip="How much of the month each GPU is busy."
                  value={`${Math.round(profile.utilisation * 100)}%`}
                >
                  <Slider aria-label="Utilisation" min={0} max={1} step={0.05} value={[profile.utilisation]} onValueChange={([v]) => set({ utilisation: v ?? 0 })} />
                </Field>

                <Field label="Your past prices" tip="We compare these with the GPU price index to see if a hedge would follow you.">
                  <NativeSelect
                    value={history}
                    onChange={(e) => {
                      const k = e.target.value;
                      setHistory(k);
                      if (k !== "custom" && proxies[k]) onOwn(proxies[k]!.points, k);
                    }}
                  >
                    {Object.keys(proxies).map((k) => (
                      <option key={k} value={k}>
                        Typical: {prettyProxy(k)}
                      </option>
                    ))}
                    <option value="custom">Paste my own</option>
                  </NativeSelect>
                  {history === "custom" && (
                    <div className="mt-3 space-y-2">
                      <Textarea rows={4} className="tabular" placeholder={"2026-03, 2.15\n2026-04, 2.08\n2026-05, 1.97"} value={csv} onChange={(e) => setCsv(e.target.value)} />
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const { points, skipped } = parseSeriesCsv(csv);
                            if (points.length < 3) {
                              setCsvNote({ ok: false, text: "Add at least 3 months: month, price" });
                              return;
                            }
                            onOwn(points, "custom");
                            setCsvNote({ ok: true, text: `Using ${points.length} months${skipped ? `, skipped ${skipped}` : ""}` });
                          }}
                        >
                          Use these prices
                        </Button>
                        {csvNote && <span className={csvNote.ok ? "text-xs text-emerald-600" : "text-xs text-rose-600"}>{csvNote.text}</span>}
                      </div>
                    </div>
                  )}
                </Field>

                <Field label="Hedge size" tip="Scale the suggested hedge down if you want to keep some of the risk." value={`${Math.round(scale * 100)}%`}>
                  <Slider aria-label="Hedge size" min={0} max={1} step={0.05} value={[scale]} onValueChange={([v]) => onScale(v ?? 0)} />
                </Field>

                <RateCardPaste onDraft={(p) => onProfile({ ...profile, ...p })} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Button size="lg" className="mt-6 w-full" onClick={onDone} disabled={totalCards === 0}>
        See my result <ArrowRight />
      </Button>
    </div>
  );
}
