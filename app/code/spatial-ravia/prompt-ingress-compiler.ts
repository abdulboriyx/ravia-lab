/** P1-H: the only public raw-prompt ingress composition entry point. */

import { applyClarificationPolicy } from "./semantic-clarification-policy.ts";
import { decomposeSemanticIntent, type SemanticIntentDecomposition } from "./semantic-intent-decomposition.ts";
import { extractSemanticIntent } from "./semantic-extractor.ts";
import { evaluateScientificClaimPolicy, type ScientificClaimPolicyDecision } from "./semantic-misconception-policy.ts";
import { normalizeRawPrompt, type NormalizedPrompt } from "./prompt-normalization.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";

export type PromptIngressDisposition = "READY" | "CLARIFICATION_REQUIRED" | "GROUNDING_REQUIRED" | "CORRECTION_REQUIRED" | "INVALID_REQUEST";
export type PromptIngressReasonCode = "ambiguous_entity" | "ambiguous_mechanism" | "missing_target" | "scientific_claim_requires_grounding" | "correction_required" | "invalid_scientific_request";
export type PromptIngressResult = {
  normalizedPrompt: NormalizedPrompt;
  semanticIntent: SemanticIntentV1;
  clarification: SemanticIntentV1["clarification"];
  scientificValidity: ScientificClaimPolicyDecision;
  decomposition: SemanticIntentDecomposition;
  disposition: PromptIngressDisposition;
  reasonCodes: readonly PromptIngressReasonCode[];
};

function resultDecision(intent: SemanticIntentV1, science: ScientificClaimPolicyDecision): Pick<PromptIngressResult, "disposition" | "reasonCodes"> {
  // Ambiguity has precedence: claims cannot silently consume unresolved meanings.
  if (intent.clarification.required) {
    const code = intent.clarification.reason === "unresolvedEntity" ? "ambiguous_entity" : intent.clarification.reason === "scienceChangingAmbiguity" ? "missing_target" : "ambiguous_mechanism";
    return { disposition: "CLARIFICATION_REQUIRED", reasonCodes: [code] };
  }
  if (science.outcome === "INVALID_SCIENTIFIC_REQUEST") return { disposition: "INVALID_REQUEST", reasonCodes: ["invalid_scientific_request"] };
  if (science.outcome === "CORRECTION_REQUIRED") return { disposition: "CORRECTION_REQUIRED", reasonCodes: ["correction_required"] };
  if (science.outcome === "CLAIM_REQUIRES_GROUNDING") return { disposition: "GROUNDING_REQUIRED", reasonCodes: ["scientific_claim_requires_grounding"] };
  return { disposition: "READY", reasonCodes: [] };
}

/** Composes B→C→D→E→F without adding semantic or policy logic. */
export function compilePromptIngress(rawPrompt: string): PromptIngressResult {
  const normalizedPrompt = normalizeRawPrompt(rawPrompt);
  const semanticIntent = applyClarificationPolicy(extractSemanticIntent(normalizedPrompt));
  const scientificValidity = evaluateScientificClaimPolicy(semanticIntent);
  const decomposition = decomposeSemanticIntent(semanticIntent);
  return { normalizedPrompt, semanticIntent, clarification: semanticIntent.clarification, scientificValidity, decomposition, ...resultDecision(semanticIntent, scientificValidity) };
}
