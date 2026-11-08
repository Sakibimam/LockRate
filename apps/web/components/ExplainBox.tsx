"use client";

import { useState } from "react";
import type { Profile, RunResult } from "@lockrate/engine";

export function ExplainBox({ profile, result }: { profile: Profile; result: RunResult }) {
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, result }),
      });
      const j = (await r.json()) as { text?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "failed");
      setText(j.text ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card text-sm">
      <div className="flex items-center justify-between">
        <div className="muted text-xs">in plain words</div>
        <button className="ghost text-xs" onClick={go} disabled={busy}>
          {busy ? "writing..." : text ? "rewrite" : "explain this"}
        </button>
      </div>
      {text && <p className="mt-2 whitespace-pre-line leading-relaxed">{text}</p>}
      {err && <p className="muted mt-2 text-xs">{err}</p>}
      {!text && !err && (
        <p className="muted mt-2 text-xs">
          the summary is written by a model from the numbers above. it never changes them.
        </p>
      )}
    </div>
  );
}
