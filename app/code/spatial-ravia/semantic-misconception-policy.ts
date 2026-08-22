/** P1-E: sole deterministic claim and invalid-science policy over SemanticIntent v1. */

import { validateSemanticIntent, type SemanticIntentV1, type SemanticRequest } from "./semantic-intent.ts";

export const scientificClaimOutcomes = ["ACCEPT", "CLAIM_REQUIRES_GROUNDING", "CORRECTION_REQUIRED", "INVALID_SCIENTIFIC_REQUEST"] as const;
export type ScientificClaimOutcome = (typeof scientificClaimOutcomes)[number];

export type ScientificClaimPolicyDecision = {
  outcome: ScientificClaimOutcome;
  reason: string;
  disputedClaims: readonly SemanticIntentV1["assertedClaims"][number][];
};

const idsFor = (request: SemanticRequest) => new Set(request.subjects.flatMap((subject) => subject.resolvedId ? [subject.resolvedId] : subject.candidateIds ?? []));
const requestKey = (request: SemanticRequest) => `${request.phenomenon ?? ""}|${request.mechanism ?? ""}|${[...idsFor(request)].sort().join(",")}`;

function hasContradictoryStates(intent: SemanticIntentV1) {
  return intent.requests.some((request) => {
    const states = new Set(request.states ?? []);
    return (states.has("open") && states.has("closed")) || (states.has("paired") && states.has("unpaired")) || (states.has("intact") && states.has("cleaved"));
  });
}

function hasOppositeDirections(intent: SemanticIntentV1) {
  const directions = new Map<string, Set<string>>();
  for (const request of intent.requests) {
    const direction = request.direction?.biochemical;
    if (!direction) continue;
    const values = directions.get(requestKey(request)) ?? new Set<string>();
    values.add(direction);
    directions.set(requestKey(request), values);
  }
  return [...directions.values()].some((values) => values.has("fiveToThree") && values.has("threeToFive"));
}

/** A narrow frozen-vocabulary guard, not a general scientific grounding model. */
function hasIncompatibleCanonicalPair(intent: SemanticIntentV1) {
  return intent.requests.some((request) => {
    if (request.phenomenon !== "canonicalBasePairing") return false;
    const ids = idsFor(request);
    return (ids.has("adenine") && ids.has("guanine")) || (ids.has("adenine") && ids.has("cytosine")) || (ids.has("thymine") && ids.has("cytosine")) || (ids.has("uracil") && ids.has("cytosine"));
  });
}

/** Does not correct, ground, reparse, clarify, or choose a downstream path. */
export function evaluateScientificClaimPolicy(intent: SemanticIntentV1): ScientificClaimPolicyDecision {
  const validation = validateSemanticIntent(intent);
  if (!validation.valid) throw new Error(`Misconception policy requires valid SemanticIntent v1: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);

  if (hasContradictoryStates(intent)) return { outcome: "INVALID_SCIENTIFIC_REQUEST", reason: "The request contains mutually exclusive biological states.", disputedClaims: intent.assertedClaims };
  if (hasOppositeDirections(intent)) return { outcome: "INVALID_SCIENTIFIC_REQUEST", reason: "The same semantic request specifies opposite biochemical directions.", disputedClaims: intent.assertedClaims };
  if (hasIncompatibleCanonicalPair(intent)) return { outcome: "INVALID_SCIENTIFIC_REQUEST", reason: "The request specifies an incompatible canonical base-pair identity.", disputedClaims: intent.assertedClaims };

  const validated = intent.assertedClaims.filter((claim) => claim.status === "validated");
  if (validated.length) return { outcome: "CORRECTION_REQUIRED", reason: "A validated disputed scientific claim must be corrected before compilation.", disputedClaims: validated };
  const suspected = intent.assertedClaims.filter((claim) => claim.status === "suspected");
  if (suspected.length) return { outcome: "CLAIM_REQUIRES_GROUNDING", reason: "A preserved user claim requires scientific grounding before compilation.", disputedClaims: suspected };
  return { outcome: "ACCEPT", reason: "No claim or internal scientific contradiction requires intervention.", disputedClaims: [] };
}
