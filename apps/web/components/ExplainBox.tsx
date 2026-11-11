"use client";

import { useState } from "react";
import { LoaderCircle, MessageSquareText } from "lucide-react";
import type { Profile, RunResult } from "@lockrate/engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      const j = (await r.json()) as { text?: string };
      if (r.status === 503) throw new Error("Not available on this server yet.");
      if (!r.ok) throw new Error("Couldn't write it. Try again.");
      setText(j.text ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't write it.");
    } finally {
      setBusy(false);
    }
  }

  if (text) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-medium text-zinc-900">In plain words</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{text}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="outline" className="w-full" onClick={go} disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" /> : <MessageSquareText />}
        Explain this to me
      </Button>
      {err && <p className="mt-2 text-center text-xs text-zinc-500">{err}</p>}
    </div>
  );
}
