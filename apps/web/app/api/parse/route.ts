import { NextResponse } from "next/server";
import { hasKey, parseRateCard } from "@lockrate/explain";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasKey()) {
    return NextResponse.json({ error: "no ANTHROPIC_API_KEY set. fill the form by hand" }, { status: 503 });
  }
  const { text } = (await req.json()) as { text?: string };
  if (!text || text.trim().length < 20) return NextResponse.json({ error: "paste a bit more than that" }, { status: 400 });
  try {
    const draft = await parseRateCard(text);
    return NextResponse.json({ draft });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "parse failed" }, { status: 500 });
  }
}
