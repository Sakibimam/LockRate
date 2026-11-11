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
      if (r.status === 503) throw new Error("Written explanations aren't set up on this server.");
      if (!r.ok) throw new Error(j.error ?? "Couldn't write an explanation. Try again.");
      setText(j.text ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't write an explanation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      {text ? (
        <>
          <h2 className="text-2xl font-bold">In plain words</h2>
          <p className="mt-2 max-w-2xl whitespace-pre-line text-[17px]">{text}</p>
          <p className="muted mt-2 text-sm">Written by AI from the numbers above. It doesn't change them.</p>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={go} disabled={busy}>
            {busy ? "Writing…" : "Explain this in plain words"}
          </button>
          {err && <span className="muted text-sm">{err}</span>}
        </div>
      )}
    </section>
  );
}
