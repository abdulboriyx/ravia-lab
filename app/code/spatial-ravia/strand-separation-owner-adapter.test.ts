import assert from "node:assert/strict";
import test from "node:test";
import { createDnaStrandSeparationScientificScene, createDnaStrandSeparationTimeline } from "./f7-dna-strand-separation-migration.ts";
import { adaptDnaMechanismSpec } from "./semantic-intent-legacy-adapters.ts";
import { createDnaStrandSeparationSpec } from "./DnaStrandSeparationPresentation.ts";
import { createStrandSeparationOwnerInput, routeStrandSeparationOwnerInput, strandSeparationProductionOwner, verifyStrandSeparationStructuredEquivalence } from "./strand-separation-owner-adapter.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";

function fixture(): SceneSpecV1 {
  const scientificScene = createDnaStrandSeparationScientificScene();
  return {
    schemaVersion: "1", sceneId: scientificScene.sceneId,
    compatibility: { semanticIntent: "1", scientificScene: "1", timeline: "1" },
    semanticIntent: adaptDnaMechanismSpec(createDnaStrandSeparationSpec({ state: "opening" }), "resolved strand separation").intent,
    scientificScene, timeline: createDnaStrandSeparationTimeline(scientificScene),
  };
}

test("P1-J3B derives a complete structured owner input without raw prompt or renderer fields", () => {
  const input = createStrandSeparationOwnerInput(fixture());
  assert.deepEqual(input.strandActorIds.map(String), ["dna-template-1", "dna-coding-1"]);
  assert.equal(input.closedStateId, "closed-duplex");
  assert.equal(input.openStateId, "locally-open");
  assert.equal(input.mechanism, "strandSeparation");
  assert.equal(input.interactions[0]?.state, "absent");
  assert.deepEqual(input.direction, { biochemical: "strandRelative", meaning: "scientific" });
  assert.equal(input.fidelityProvenance.sources.length > 0, true);
  assert.equal("rawUtterance" in input, false);
  assert.equal("camera" in input, false);
});

test("P1-J3B routes structured Foundation data to the accepted production owner with equivalent mechanism facts", () => {
  const input = createStrandSeparationOwnerInput(fixture());
  const route = routeStrandSeparationOwnerInput(input);
  assert.equal(route.owner, strandSeparationProductionOwner);
  assert.equal(route.plan.sourceSpec.family, "strandSeparation");
  assert.equal(route.plan.sourceSpec.interactions.filter((item) => item.type === "hydrogenBond").every((item) => item.state === "absent"), true);
  assert.deepEqual(verifyStrandSeparationStructuredEquivalence(input, route), { equivalent: true, differences: [] });
});

test("P1-J3B rejects invalid direct structured owner input", () => {
  const input = createStrandSeparationOwnerInput(fixture());
  assert.throws(() => routeStrandSeparationOwnerInput({ ...input, strandActorIds: [input.strandActorIds[0]] }), /exactly two strand actor IDs/);
  assert.throws(() => routeStrandSeparationOwnerInput({ ...input, interactions: [] }), /absent base-pairing interaction/);
  assert.throws(() => routeStrandSeparationOwnerInput({ ...input, rawPrompt: "unzip DNA" }), /unknown field/);
});
