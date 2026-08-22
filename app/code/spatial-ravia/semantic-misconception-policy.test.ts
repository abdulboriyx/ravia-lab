import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeRawPrompt } from "./prompt-normalization.ts";
import { extractSemanticIntent } from "./semantic-extractor.ts";
import { evaluateScientificClaimPolicy } from "./semantic-misconception-policy.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";

const extract = (raw: string) => extractSemanticIntent(normalizeRawPrompt(raw));

test("P1-E distinguishes normal requests, uncertainty claims, and claims already validated as misconceptions", () => {
  assert.equal(evaluateScientificClaimPolicy(extract("why does RNA fall apart easier")).outcome, "ACCEPT");
  assert.equal(evaluateScientificClaimPolicy(extract("DNA has ribose right?")).outcome, "CLAIM_REQUIRES_GROUNDING");
  assert.equal(evaluateScientificClaimPolicy(extract("A pairs with G")).outcome, "CLAIM_REQUIRES_GROUNDING");
  const validated = { ...extract("show DNA"), assertedClaims: [{ rawText: "DNA has ribose", status: "validated" as const }] };
  assert.equal(evaluateScientificClaimPolicy(validated).outcome, "CORRECTION_REQUIRED");
});

test("P1-E detects internally contradictory state, direction, and canonical-pair requests", () => {
  const contradictoryStates = { ...extract("show DNA"), requests: [{ subjects: [{ rawText: "DNA", resolvedId: "dna" }], states: ["open", "closed"] }], assertedClaims: [] } as SemanticIntentV1;
  assert.equal(evaluateScientificClaimPolicy(contradictoryStates).outcome, "INVALID_SCIENTIFIC_REQUEST");
  const contradictoryDirections = { ...extract("show DNA"), requests: [
    { subjects: [{ rawText: "DNA", resolvedId: "dna" }], mechanism: "strandOpening", direction: { biochemical: "fiveToThree", meaning: "scientific" as const } },
    { subjects: [{ rawText: "DNA", resolvedId: "dna" }], mechanism: "strandOpening", direction: { biochemical: "threeToFive", meaning: "scientific" as const } },
  ], assertedClaims: [] } as SemanticIntentV1;
  assert.equal(evaluateScientificClaimPolicy(contradictoryDirections).outcome, "INVALID_SCIENTIFIC_REQUEST");
  const incompatiblePair = { ...extract("show DNA"), requests: [{ subjects: [{ rawText: "A", resolvedId: "adenine" }, { rawText: "G", resolvedId: "guanine" }], phenomenon: "canonicalBasePairing" }], assertedClaims: [] } as SemanticIntentV1;
  assert.equal(evaluateScientificClaimPolicy(incompatiblePair).outcome, "INVALID_SCIENTIFIC_REQUEST");
});

test("P1-E accepts valid unusual requests and leaves P1-D-owned ambiguity untouched", () => {
  assert.equal(evaluateScientificClaimPolicy(extract("show a G-U wobble pair")).outcome, "ACCEPT");
  const ambiguous = extract("open the helix");
  assert.equal(ambiguous.alternatives.length, 2);
  assert.equal(evaluateScientificClaimPolicy(ambiguous).outcome, "ACCEPT");
});

test("P1-E is deterministic and does not depend on text parsing, routing, grounding, or capability selection", () => {
  const intent = extract("DNA has ribose right?");
  assert.deepEqual(evaluateScientificClaimPolicy(intent), evaluateScientificClaimPolicy(intent));
  const source = readFileSync(new URL("./semantic-misconception-policy.ts", import.meta.url), "utf8");
  for (const forbidden of ["normalizeRawPrompt", "extractSemanticIntent", "capability-registry", "scene-spec", "renderer", "router", "rawUtterance"]) assert.equal(source.includes(forbidden), false, forbidden);
});
