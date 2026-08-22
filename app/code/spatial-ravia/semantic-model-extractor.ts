/** P1-K5 async model-backed P1-C seam. The legacy synchronous extractor is
 * intentionally not used as a silent fallback here. Provider failure is
 * returned explicitly for the caller to handle safely. */
import { normalizeRawPrompt, type NormalizedPrompt } from "./prompt-normalization.ts";
import { inferSemanticIntent, type SemanticInferenceProvider, type SemanticInferenceResult } from "./semantic-inference-provider.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";

export type ModelSemanticExtraction = SemanticInferenceResult;

export async function extractSemanticIntentWithModel(input: string | NormalizedPrompt, provider: SemanticInferenceProvider): Promise<ModelSemanticExtraction> {
  const normalized = typeof input === "string" ? normalizeRawPrompt(input) : input;
  return inferSemanticIntent(normalized, provider);
}

/** Explicit adapter for callers that already have a validated model intent. */
export function modelIntentOrThrow(result: ModelSemanticExtraction): SemanticIntentV1 {
  if (!result.ok) throw new Error(`Model semantic inference failed (${result.code}): ${result.issues.join("; ")}`);
  return result.intent;
}
