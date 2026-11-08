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
  const [open, setOpen] = useState(false);
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
      if (!r.ok || !j.draft) throw new Error(j.error ?? "failed");
      setDraft(j.draft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="muted text-xs underline" onClick={() => setOpen(true)}>
        paste a rate card or invoice instead
      </button>
    );
  }

  return (
    <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
      <p className="muted text-xs">
        the model reads the text into the form. every number is shown with the phrase it came from and nothing is applied until you say so.
      </p>
      <textarea className="w-full text-xs" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="paste here" />
      <div className="flex items-center gap-2">
        <button className="ghost text-xs" disabled={busy || text.length < 20} onClick={go}>
          {busy ? "reading..." : "read it"}
        </button>
        <button className="muted text-xs" onClick={() => setOpen(false)}>
          close
        </button>
        {err && <span className="t-bad text-xs">{err}</span>}
      </div>
      {draft && (
        <div className="space-y-2 text-xs">
          <div className="font-medium">draft</div>
          <ul className="space-y-1">
            <li>role: {draft.role}</li>
            {draft.gpus.map((g, i) => (
              <li key={i}>
                {g.count} × {g.model}
                {g.rateUsd != null ? ` @ $${g.rateUsd}/h` : ""}
                {g.hoursPerGpu != null ? `, ${g.hoursPerGpu} h/gpu` : ""}
                <span className="muted"> — “{g.evidence}”</span>
              </li>
            ))}
            {draft.avgRateUsd != null && <li>blended rate: ${draft.avgRateUsd}/h</li>}
            {draft.spotShare != null && <li>spot share: {Math.round(draft.spotShare * 100)}%</li>}
            {draft.utilisation != null && <li>utilisation: {Math.round(draft.utilisation * 100)}%</li>}
          </ul>
          {draft.uncertain.length > 0 && (
            <div className="t-warn">
              unsure about:
              <ul className="ml-4 list-disc">
                {draft.uncertain.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="primary text-xs"
            onClick={() => {
              const patch: Partial<Profile> = {
                role: draft.role,
                gpus: draft.gpus.map((g) => ({
                  model: g.model,
                  count: g.count,
                  ...(g.hoursPerGpu != null ? { hoursPerGpu: g.hoursPerGpu } : {}),
                  ...(g.rateUsd != null ? { rateUsd: g.rateUsd } : {}),
                })),
              };
              if (draft.avgRateUsd != null) patch.avgRateUsd = draft.avgRateUsd;
              if (draft.spotShare != null) patch.spotShare = draft.spotShare;
              if (draft.utilisation != null) patch.utilisation = draft.utilisation;
              onDraft(patch);
              setDraft(null);
              setOpen(false);
            }}
          >
            apply to form
          </button>
        </div>
      )}
    </div>
  );
}
