"use client";

import { useState } from "react";
import type { Profile } from "@lockrate/engine";

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
      if (r.status === 503) throw new Error("Reading pasted text isn't set up on this server. Fill in the form instead.");
      if (!r.ok || !j.draft) throw new Error(j.error ?? "Couldn't read that text. Fill in the form instead.");
      setDraft(j.draft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't read that text.");
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
      <label className="field-label" htmlFor="ratecard">
        Fill the form from a rate card
      </label>
      <textarea
        id="ratecard"
        className="text-sm"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a price list, invoice or contract summary"
      />
      <p className="hint">You'll see what we found before anything changes.</p>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" className="btn" disabled={busy || text.trim().length < 20} onClick={go}>
          {busy ? "Reading…" : "Read rate card"}
        </button>
      </div>
      {err && <p className="t-bad mt-2 text-sm">{err}</p>}
      {draft && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="font-semibold">Here's what we found</p>
          <ul className="space-y-2">
            {draft.gpus.map((g, i) => (
              <li key={i}>
                {g.count} × {g.model}
                {g.rateUsd != null ? ` at $${g.rateUsd}/hr` : ""}
                <span className="muted block text-xs">From: “{g.evidence}”</span>
              </li>
            ))}
            {draft.avgRateUsd != null && <li>Average price: ${draft.avgRateUsd}/hr</li>}
            {draft.spotShare != null && <li>At market prices: {Math.round(draft.spotShare * 100)}%</li>}
            {draft.utilisation != null && <li>Hours in use: {Math.round(draft.utilisation * 100)}%</li>}
          </ul>
          {draft.uncertain.length > 0 && (
            <div className="t-warn">
              <p>Check these yourself:</p>
              <ul className="ml-4 list-disc">
                {draft.uncertain.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => apply(draft)}>
              Fill in the form
            </button>
            <button type="button" className="btn" onClick={() => setDraft(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
