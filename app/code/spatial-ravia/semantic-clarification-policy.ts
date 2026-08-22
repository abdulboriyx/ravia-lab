/** P1-D: sole deterministic SemanticIntent v1 clarification policy. */

import { validateSemanticIntent, type SemanticIntentV1, type SemanticRequest } from "./semantic-intent.ts";

type ClarificationDecision = NonNullable<SemanticIntentV1["clarification"]>;

const materiallyDirectionalMechanisms = new Set(["strandOpening", "strandReannealing", "nucleotideAddition", "dnaReplication", "transcriptionElongation", "terminalExonucleaseAction"]);

const semanticSignature = (request: SemanticRequest) => JSON.stringify({
  // F1 validation requires a resolved ID or candidate IDs; raw mention text is
  // intentionally not part of downstream policy identity.
  subjects: request.subjects.map((subject) => subject.resolvedId ?? subject.candidateIds ?? []),
  phenomenon: request.phenomenon,
  mechanism: request.mechanism,
  states: request.states,
  direction: request.direction?.biochemical,
});

const entityQuestion = (candidateIds: readonly string[]) => {
  if (candidateIds.includes("dna") && candidateIds.includes("rna")) return "Does this refer to DNA or RNA?";
  if (candidateIds.includes("helicase") && candidateIds.includes("rnaPolymerase")) return "Do you mean helicase or RNA polymerase?";
  return `Which entity do you mean: ${candidateIds.join(" or ")}?`;
};

function alternativeQuestion(intent: SemanticIntentV1): string {
  const values = intent.alternatives.flatMap((alternative) => alternative.requests);
  const mechanisms = new Set(values.map((request) => request.mechanism).filter(Boolean));
  if (mechanisms.has("rnaCleavage") && mechanisms.has("terminalExonucleaseAction")) return "Do you mean RNA cleavage or exonuclease degradation?";
  const subjects = new Set(values.flatMap((request) => request.subjects.map((subject) => subject.resolvedId)).filter(Boolean));
  if (subjects.has("dna") && subjects.has("rna")) return "Does the helix refer to a DNA duplex or RNA secondary structure?";
  const states = new Set(values.flatMap((request) => request.states ?? []));
  if (states.has("open") && states.has("closed")) return "Should the structure be open or closed?";
  return "Which of the listed semantic alternatives should be used?";
}

function decide(intent: SemanticIntentV1): ClarificationDecision {
  // Mutually exclusive states are a scientific-validity decision, not an
  // ambiguity question; preserve them for P1-E instead of asking the user to
  // choose between states they explicitly requested simultaneously.
  if (intent.requests.some((request) => {
    const states = new Set(request.states ?? []);
    return (states.has("open") && states.has("closed")) || (states.has("paired") && states.has("unpaired")) || (states.has("intact") && states.has("cleaved"));
  })) return { required: false };
  for (const request of intent.requests) {
    const candidateIds = request.subjects.flatMap((subject) => subject.resolvedId ? [] : subject.candidateIds ?? []);
    if (candidateIds.length > 1) return { required: true, reason: "unresolvedEntity", questionPlaceholder: entityQuestion(candidateIds) };
  }

  const alternativeSignatures = new Set(intent.alternatives.flatMap((alternative) => alternative.requests.map(semanticSignature)));
  if (alternativeSignatures.size > 1) return { required: true, reason: "multiplePlausibleMeanings", questionPlaceholder: alternativeQuestion(intent) };

  for (const request of intent.requests) {
    if (request.direction?.meaning === "ambiguous" && request.direction.biochemical === undefined && request.mechanism && materiallyDirectionalMechanisms.has(request.mechanism)) {
      return { required: true, reason: "scienceChangingAmbiguity", questionPlaceholder: "Should the biochemical direction be 5′→3′ or 3′→5′?" };
    }
    if (request.subjects.length === 0 && request.mechanism && materiallyDirectionalMechanisms.has(request.mechanism)) {
      return { required: true, reason: "unresolvedEntity", questionPlaceholder: "Which molecular target should this mechanism apply to?" };
    }
  }

  return { required: false };
}

/** Applies policy only; it never reads raw text or chooses a semantic branch. */
export function applyClarificationPolicy(intent: SemanticIntentV1): SemanticIntentV1 {
  const inputValidation = validateSemanticIntent(intent);
  if (!inputValidation.valid) throw new Error(`Clarification policy requires valid SemanticIntent v1: ${inputValidation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  const result: SemanticIntentV1 = { ...intent, clarification: decide(intent) };
  const outputValidation = validateSemanticIntent(result);
  if (!outputValidation.valid) throw new Error(`Clarification policy emitted invalid SemanticIntent v1: ${outputValidation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  return result;
}
