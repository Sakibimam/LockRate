import { z } from "zod";

export const GpuModelSchema = z.enum(["H100", "B200", "H200", "A100", "RTX4090", "OTHER"]);

export const GpuLineDraft = z.object({
  model: GpuModelSchema,
  count: z.number().int().nonnegative(),
  hoursPerGpu: z.number().nonnegative().nullable(),
  rateUsd: z.number().nonnegative().nullable(),
  /** what in the source text this came from, so the user can check it */
  evidence: z.string(),
});

/**
 * what the model is allowed to fill in from a pasted rate card or invoice.
 * every field is shown back to the user before it touches the engine.
 */
export const ProfileDraft = z.object({
  role: z.enum(["operator", "buyer"]),
  gpus: z.array(GpuLineDraft),
  avgRateUsd: z.number().nonnegative().nullable(),
  spotShare: z.number().min(0).max(1).nullable(),
  utilisation: z.number().min(0).max(1).nullable(),
  currency: z.string(),
  /** anything the model was unsure about. shown as warnings */
  uncertain: z.array(z.string()),
});

export type ProfileDraft = z.infer<typeof ProfileDraft>;
