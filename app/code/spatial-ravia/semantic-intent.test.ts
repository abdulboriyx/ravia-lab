import assert from "node:assert/strict";
import test from "node:test";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { assertSemanticIntent, semanticIntentSchemaVersion, validateSemanticIntent, type SemanticIntentV1 } from "./semantic-intent.ts";

test("SemanticIntent v1 fixtures validate without renderer concepts", () => {
  for (const intent of Object.values(semanticIntentFixtures)) assertSemanticIntent(intent);
  assert.equal(semanticIntentSchemaVersion, "1");
});

test("hostile and misconception fixtures preserve raw user meaning", () => {
  assert.equal(semanticIntentFixtures.badGrammar.rawUtterance, "why dna dont have 2 oh");
  assert.equal(semanticIntentFixtures.badGrammar.assertedClaims[0]?.status, "neutral");
  assert.equal(semanticIntentFixtures.misconception.assertedClaims[0]?.status, "suspected");
  assert.equal(semanticIntentFixtures.incompleteAnaphoric.clarification.required, true);
  assert.equal(semanticIntentFixtures.incompleteAnaphoric.alternatives.length, 2);
});

test("multi-intent and direction semantics remain distinct", () => {
  const intent = semanticIntentFixtures.multiIntent;
  assert.deepEqual(intent.acts, ["show", "explain"]);
  assert.equal(intent.requests[0]?.direction?.biochemical, "fiveToThree");
  assert.equal(intent.requests[0]?.spatialFrame, "strandRelative");
});

test("validation rejects unknown versions, invalid confidence, and screen/biochemical conflation", () => {
  const invalid = structuredClone(semanticIntentFixtures.rnaHairpin) as SemanticIntentV1;
  invalid.schemaVersion = "2" as never;
  invalid.confidence = 2;
  invalid.requests[0]!.spatialFrame = "screen";
  invalid.requests[0]!.direction = { biochemical: "fiveToThree", meaning: "scientific" };
  const result = validateSemanticIntent(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((entry) => entry.path === "schemaVersion"));
});

test("validation rejects invalid IDs and inconsistent clarification", () => {
  const invalid = structuredClone(semanticIntentFixtures.rnaHairpin) as SemanticIntentV1;
  invalid.requests[0]!.subjects[0]!.resolvedId = "notAnEntity" as never;
  invalid.clarification = { required: false, reason: "scienceChangingAmbiguity" };
  const result = validateSemanticIntent(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((entry) => entry.path.includes("resolvedId")));
    assert.ok(result.issues.some((entry) => entry.path === "clarification.reason"));
  }
});

test("runtime validation rejects unknown renderer fields at every supported level", () => {
  const topLevel = structuredClone(semanticIntentFixtures.rnaHairpin) as Record<string, unknown>;
  topLevel.renderMode = "molecular-structure";
  const nestedRequest = structuredClone(semanticIntentFixtures.rnaHairpin) as any;
  nestedRequest.requests[0].cameraPreset = "whole-helix";
  const nestedAlternative = structuredClone(semanticIntentFixtures.incompleteAnaphoric) as any;
  nestedAlternative.alternatives[0].rendererOwner = "molecular-view";
  assert.equal(validateSemanticIntent(topLevel as never).valid, false);
  assert.equal(validateSemanticIntent(nestedRequest as never).valid, false);
  assert.equal(validateSemanticIntent(nestedAlternative as never).valid, false);
});

test("runtime validation recursively rejects malformed alternatives", () => {
  const invalid = structuredClone(semanticIntentFixtures.incompleteAnaphoric) as any;
  invalid.alternatives[0].description = "";
  invalid.alternatives[0].confidence = 2;
  invalid.alternatives[0].requests[0].subjects[0].resolvedId = "not-an-entity";
  invalid.alternatives[1].requests[0].mechanism = "not-a-mechanism";
  const result = validateSemanticIntent(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((entry) => entry.path === "alternatives[0].description"));
    assert.ok(result.issues.some((entry) => entry.path === "alternatives[0].confidence"));
    assert.ok(result.issues.some((entry) => entry.path.includes("alternatives[0].requests[0].subjects[0].resolvedId")));
    assert.ok(result.issues.some((entry) => entry.path.includes("alternatives[1].requests[0].mechanism")));
  }
});
