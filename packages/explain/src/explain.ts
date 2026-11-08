import type { RunResult, Profile } from "@lockrate/engine";
import { MODEL, client } from "./client";

const SYSTEM = `You explain the output of a GPU price-hedging tool to the person who runs the business.

You are handed numbers that were already computed. You do not compute, adjust, round or re-estimate anything. You never suggest a different size, a different instrument or leverage. If the verdict is "skip" you explain why hedging would hurt and you do not soften it.

Write 4 to 7 short sentences in plain English. No headings, no bullet points, no emoji. Mention: what floats with spot in dollars per month, the fit score and what it means for this business, the verdict, and if there is a plan, its side and size and what it would have done in the simulation. End with the single biggest caveat from the reasons or warnings. Do not add a disclaimer; the app already shows one.`;

export interface ExplainInput {
  profile: Profile;
  result: RunResult;
}

export async function explainVerdict(input: ExplainInput): Promise<string> {
  const { profile, result } = input;
  const payload = {
    business: { name: profile.name, role: profile.role, spotShare: profile.spotShare, gpus: profile.gpus },
    exposure: result.exposure,
    fit: result.fit,
    plan: result.plan,
    simulation: { unhedged: result.sim.unhedged, hedged: result.sim.hedged, volReduction: result.sim.volReduction, costOfHedgeUsd: result.sim.costOfHedgeUsd, periods: result.sim.periods.length },
  };

  const res = await client().beta.messages.create({
    model: MODEL,
    max_tokens: 1200,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(payload) }],
  });

  if (res.stop_reason === "refusal") return "";
  return res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
