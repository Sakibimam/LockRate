import { NextResponse } from "next/server";
import { explainVerdict, hasKey } from "@lockrate/explain";
import type { Profile, RunResult } from "@lockrate/engine";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasKey()) {
    return NextResponse.json({ error: "no ANTHROPIC_API_KEY set. the app works without it, you just don't get the summary" }, { status: 503 });
  }
  const body = (await req.json()) as { profile: Profile; result: RunResult };
  if (!body?.profile || !body?.result) return NextResponse.json({ error: "bad request" }, { status: 400 });
  try {
    const text = await explainVerdict({ profile: body.profile, result: body.result });
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "explain failed" }, { status: 500 });
  }
}
