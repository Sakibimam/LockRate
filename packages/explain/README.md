# @lockrate/explain

Optional AI features. The app works fully without them.

| Export | What it does |
| --- | --- |
| `explainVerdict({ profile, result })` | plain-English summary of numbers the engine already computed |
| `parseRateCard(text)` | reads a pasted price list or invoice into a draft profile, Zod-validated, with the phrase each number came from |
| `hasKey()` | whether `ANTHROPIC_API_KEY` (or `LLM_API_KEY`) is set |

**What it can't do:** produce any number that sizes or places an order. Drafts are only applied to the form after the user confirms, and the engine computes everything from there.
