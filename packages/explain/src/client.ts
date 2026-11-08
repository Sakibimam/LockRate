import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

let cached: Anthropic | null = null;

export function hasKey(env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}): boolean {
  return Boolean(env.ANTHROPIC_API_KEY || env.LLM_API_KEY);
}

export function client(): Anthropic {
  if (cached) return cached;
  const key = process.env.ANTHROPIC_API_KEY ?? process.env.LLM_API_KEY;
  cached = key ? new Anthropic({ apiKey: key }) : new Anthropic();
  return cached;
}
