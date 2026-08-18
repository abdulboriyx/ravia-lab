import assert from "node:assert/strict";
import test from "node:test";
import { currentPresentationIntentExamples, presentationIntentActorFixture } from "./presentation-intent-fixtures.ts";
import { validatePresentationIntent, type PresentationIntent } from "./presentation-intent.ts";

test("F2-D validates current local, comparison, mechanism, and overview intent mappings", () => {
  for (const intent of Object.values(currentPresentationIntentExamples)) assert.deepEqual(validatePresentationIntent(intent, presentationIntentActorFixture), { valid: true, issues: [] });
});

test("F2-D requires real actor, group, and anchor references", () => {
  const invalid = structuredClone(currentPresentationIntentExamples.rnaLocalChemistry) as PresentationIntent;
  invalid.regionOfInterest = [{ kind: "anchor", actorId: "rna-ribose-1" as never, anchorId: "missing-anchor" }];
  const result = validatePresentationIntent(invalid, presentationIntentActorFixture);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((entry) => entry.path.endsWith("anchorId") && entry.message.includes("missing actor anchor")));
});

test("F2-D rejects renderer, geometry, and unknown fields at every intent boundary", () => {
  const invalid = structuredClone(currentPresentationIntentExamples.rnaLocalChemistry) as PresentationIntent & Record<string, unknown>;
  invalid.camera = { fov: 42, position: [0, 0, 4] };
  invalid.regionOfInterest = [{ kind: "actor", actorId: "rna-ribose-1", coordinates: [0, 0, 0] }] as never;
  const result = validatePresentationIntent(invalid, presentationIntentActorFixture);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((entry) => entry.path === "intent.camera"));
    assert.ok(result.issues.some((entry) => entry.path.endsWith("coordinates")));
  }
});

test("F2-D keeps focus/context distinct and constrains comparison semantics", () => {
  const invalid = structuredClone(currentPresentationIntentExamples.preVsMatureComparison) as PresentationIntent;
  invalid.contextActorIds = [invalid.focusActorIds[0]!];
  invalid.comparison = { left: invalid.comparison!.left, right: invalid.comparison!.left };
  const result = validatePresentationIntent(invalid, presentationIntentActorFixture);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((entry) => entry.message.includes("must not also be a focus actor")));
    assert.ok(result.issues.some((entry) => entry.path === "intent.comparison" && entry.message.includes("distinct")));
  }
});
