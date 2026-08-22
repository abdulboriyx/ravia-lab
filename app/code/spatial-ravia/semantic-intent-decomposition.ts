/** P1-F: a projection of compound SemanticIntent v1 without semantic reparsing. */

import { validateSemanticIntent, type SemanticIntentV1, type SemanticRequest } from "./semantic-intent.ts";
import type { IntentAct } from "./foundation-semantic-vocabulary.ts";

export const semanticIntentDecompositionVersion = "1" as const;

export type DecompositionOrder =
  | { kind: "parallel" }
  | { kind: "explicitSequence"; subIntentIds: readonly string[] }
  | { kind: "unspecified" };

export type DecompositionConflict = {
  kind: "clarificationRequired" | "claimRequiresScientificPolicy";
  handoff: "P1-D" | "P1-E";
  message: string;
};

export type SemanticSubIntent = {
  id: string;
  act: IntentAct;
  /** References into sharedContext.requests; request content is never copied. */
  requestIndexes: readonly number[];
};

export type SemanticIntentDecomposition = {
  schemaVersion: typeof semanticIntentDecompositionVersion;
  /** The frozen semantic authority is retained intact and remains the source of truth. */
  sharedContext: Pick<SemanticIntentV1, "canonicalGloss" | "requests" | "assertedClaims" | "alternatives" | "clarification" | "confidence">;
  subIntents: readonly SemanticSubIntent[];
  ordering: DecompositionOrder;
  conflicts: readonly DecompositionConflict[];
};

const allRequestIndexes = (requests: readonly SemanticRequest[]) => requests.map((_, index) => index);

function conflictsFor(intent: SemanticIntentV1): DecompositionConflict[] {
  const conflicts: DecompositionConflict[] = [];
  if (intent.clarification.required) {
    conflicts.push({ kind: "clarificationRequired", handoff: "P1-D", message: "The semantic input already requires clarification; no sub-intent is discarded." });
  }
  if (intent.assertedClaims.some((claim) => claim.status !== "neutral" && claim.status !== "corrected")) {
    conflicts.push({ kind: "claimRequiresScientificPolicy", handoff: "P1-E", message: "A preserved claim requires P1-E policy before compilation." });
  }
  return conflicts;
}

/**
 * Produces a lossless, non-authoritative projection.  Frozen SemanticIntent v1
 * does not encode clause-level sequence, so this layer reports `unspecified`
 * unless a future version supplies an explicit semantic ordering signal.
 */
export function decomposeSemanticIntent(intent: SemanticIntentV1): SemanticIntentDecomposition {
  const validation = validateSemanticIntent(intent);
  if (!validation.valid) throw new Error(`Semantic decomposition requires valid SemanticIntent v1: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);

  const requestIndexes = allRequestIndexes(intent.requests);
  return {
    schemaVersion: semanticIntentDecompositionVersion,
    sharedContext: {
      canonicalGloss: intent.canonicalGloss,
      requests: intent.requests,
      assertedClaims: intent.assertedClaims,
      alternatives: intent.alternatives,
      clarification: intent.clarification,
      confidence: intent.confidence,
    },
    subIntents: intent.acts.map((act, index) => ({ id: `act-${index + 1}-${act}`, act, requestIndexes })),
    ordering: { kind: intent.acts.length > 1 ? "parallel" : "unspecified" },
    conflicts: conflictsFor(intent),
  };
}
