import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRawPrompt } from "./prompt-normalization.ts";
import { extractSemanticIntent } from "./semantic-extractor.ts";
import { applyClarificationPolicy } from "./semantic-clarification-policy.ts";
import { evaluateScientificClaimPolicy } from "./semantic-misconception-policy.ts";
import { decomposeSemanticIntent } from "./semantic-intent-decomposition.ts";
import { validateSemanticIntent, type SemanticIntentV1 } from "./semantic-intent.ts";

const extract = (raw: string) => extractSemanticIntent(normalizeRawPrompt(raw));
const evaluate = (raw: string) => {
  const extracted = extract(raw);
  const clarified = applyClarificationPolicy(extracted);
  return { extracted, clarified, science: evaluateScientificClaimPolicy(clarified), decomposition: decomposeSemanticIntent(clarified) };
};

test("P1-G0 preserves deterministic ownership across representative prompt policies", () => {
  const cases = [
    ["open the helix", true, "ACCEPT", ["show"]],
    ["break the RNA", false, "ACCEPT", ["show"]],
    ["DNA has ribose right?", false, "CLAIM_REQUIRES_GROUNDING", ["explain"]],
    ["A pairs with G", false, "CLAIM_REQUIRES_GROUNDING", ["show"]],
    ["show replication and explain helicase", false, "ACCEPT", ["show", "explain"]],
    ["compare DNA and RNA and animate the strands opening", false, "ACCEPT", ["compare", "animate"]],
    ["break RNA from the left", false, "ACCEPT", ["show"]],
    ["degrade RNA 5′ to 3′", false, "ACCEPT", ["show"]],
    ["unzip the DNA", false, "ACCEPT", ["show"]],
    ["show the hairpin, then explain why it forms", false, "ACCEPT", ["show", "explain"]],
  ] as const;
  for (const [raw, clarificationRequired, scienceOutcome, acts] of cases) {
    const result = evaluate(raw);
    assert.equal(validateSemanticIntent(result.extracted).valid, true, raw);
    assert.equal(validateSemanticIntent(result.clarified).valid, true, raw);
    assert.equal(result.clarified.clarification.required, clarificationRequired, raw);
    assert.equal(result.science.outcome, scienceOutcome, raw);
    assert.deepEqual(result.decomposition.subIntents.map(({ act }) => act), acts, raw);
    assert.equal(result.decomposition.sharedContext.requests, result.clarified.requests, raw);
  }
});

test("P1-G0 retains ambiguity, claim, and invalid-science outcomes without cross-policy overwrite", () => {
  const ambiguousClaim: SemanticIntentV1 = {
    ...extract("open the helix"),
    assertedClaims: [{ rawText: "DNA has ribose", status: "suspected" }],
  };
  const clarified = applyClarificationPolicy(ambiguousClaim);
  assert.equal(clarified.clarification.required, true);
  assert.equal(evaluateScientificClaimPolicy(clarified).outcome, "CLAIM_REQUIRES_GROUNDING");
  assert.equal(decomposeSemanticIntent(clarified).conflicts.length, 2);

  const contradictory = {
    ...extract("show DNA and explain DNA"),
    requests: [{ subjects: [{ rawText: "DNA", resolvedId: "dna" as const }], states: ["open", "closed"] as const }],
  } as SemanticIntentV1;
  const result = applyClarificationPolicy(contradictory);
  assert.equal(result.clarification.required, false);
  assert.equal(evaluateScientificClaimPolicy(result).outcome, "INVALID_SCIENTIFIC_REQUEST");
  assert.deepEqual(decomposeSemanticIntent(result).subIntents.map(({ act }) => act), ["show", "explain"]);
});

test("P1-G0 does not turn screen direction into biochemical direction or infer sequence", () => {
  const screen = evaluate("break RNA from the left");
  assert.equal(screen.clarified.requests[0]?.direction?.screen, "screenLeft");
  assert.equal(screen.clarified.requests[0]?.direction?.biochemical, undefined);
  const orderedWords = evaluate("show the hairpin, then explain why it forms");
  assert.deepEqual(orderedWords.decomposition.ordering, { kind: "parallel" });
});
