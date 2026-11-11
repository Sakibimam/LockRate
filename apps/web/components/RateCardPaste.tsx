"use client";

import { useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import type { Profile } from "@lockrate/engine";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { InfoTip } from "@/components/ui/tooltip";

interface Draft {
  role: "operator" | "buyer";
  gpus: Array<{ model: Profile["gpus"][number]["model"]; count: number; hoursPerGpu: number | null; rateUsd: number | null; evidence: string }>;
  avgRateUsd: number | null;
  spotShare: number | null;
  utilisation: number | null;
  currency: string;
  uncertain: string[];
}

export function RateCardPaste({ onDraft }: { onDraft: (p: Partial<Profile>) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function go() {
    setBusy(true);
    setErr(null);
    setDraft(null);
    try {
      const r = await fetch("/api/parse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const j = (await r.json()) as { draft?: Draft; error?: string };
      if (r.status === 503) throw new Error("Not available on this server yet. Fill the form instead.");
      if (!r.ok || !j.draft) throw new Error("Couldn't read that. Fill the form instead.");
      setDraft(j.draft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't read that.");
    } finally {
      setBusy(false);
    }
  }

  function apply(d: Draft) {
    const patch: Partial<Profile> = {
      role: d.role,
      gpus: d.gpus.map((g) => ({
        model: g.model,
        count: g.count,
        ...(g.hoursPerGpu != null ? { hoursPerGpu: g.hoursPerGpu } : {}),
        ...(g.rateUsd != null ? { rateUsd: g.rateUsd } : {}),
      })),
    };
    if (d.avgRateUsd != null) patch.avgRateUsd = d.avgRateUsd;
    if (d.spotShare != null) patch.spotShare = d.spotShare;
    if (d.utilisation != null) patch.utilisation = d.utilisation;
    onDraft(patch);
    setDraft(null);
    setText("");
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-900">
        Fill from a price list
        <InfoTip>Paste an invoice or price list. You'll check what we found before anything changes.</InfoTip>
      </div>
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text here" />
      <Button variant="outline" size="sm" className="mt-2" disabled={busy || text.trim().length < 20} onClick={go}>
        {busy ? <LoaderCircle className="animate-spin" /> : <FileText />}
        Read it
      </Button>
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
      {draft && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <p className="font-medium text-zinc-900">We found</p>
          <ul className="mt-2 space-y-2">
            {draft.gpus.map((g, i) => (
              <li key={i}>
                <span className="font-medium">
                  {g.count} × {g.model}
                </span>
                {g.rateUsd != null ? ` at $${g.rateUsd}/hr` : ""}
                <span className="block text-xs text-zinc-500">“{g.evidence}”</span>
              </li>
            ))}
          </ul>
          {draft.uncertain.length > 0 && <p className="mt-2 text-xs text-amber-700">Double-check: {draft.uncertain.join(", ")}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => apply(draft)}>
              Use this
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
