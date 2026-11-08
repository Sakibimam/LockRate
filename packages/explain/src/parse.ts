import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL, client } from "./client";
import { ProfileDraft } from "./schema";

const SYSTEM = `You read GPU rental rate cards, invoices and capacity sheets and fill a form.

Rules:
- Only use numbers that appear in the text. Never estimate a price or a count.
- If a value is not in the text, leave it null and say so in "uncertain".
- Map cards to the closest index model: H100 (any H100 SXM/PCIe), B200, H200, A100, RTX4090. Anything else is OTHER.
- "spotShare" is the fraction of revenue or spend that is on-demand / hourly / not under a fixed-term contract. Only fill it if the text makes it clear.
- "role" is "operator" if the text is about selling or hosting capacity, "buyer" if it is about renting it.
- Quote the exact phrase each GPU line came from in "evidence".
- Monthly or per-day prices must be converted to per GPU-hour and the conversion noted in "uncertain".`;

/**
 * pasted text -> a draft the user confirms field by field.
 * the numbers never go straight into the engine; the form does.
 */
export async function parseRateCard(text: string): Promise<ProfileDraft> {
  const res = await client().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "medium", format: zodOutputFormat(ProfileDraft) },
    system: SYSTEM,
    messages: [{ role: "user", content: text.slice(0, 40_000) }],
  });
  if (res.stop_reason === "refusal") {
    throw new Error("the model declined to read this document");
  }
  if (!res.parsed_output) throw new Error("could not read a profile out of that text");
  return res.parsed_output;
}
