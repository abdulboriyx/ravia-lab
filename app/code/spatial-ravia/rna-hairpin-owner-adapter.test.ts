import test from "node:test";
import assert from "node:assert/strict";
import { createRnaSecondaryStructureSpec, deriveRnaSecondaryStructurePresentation } from "./RnaSecondaryStructurePresentation.ts";
import { adaptSceneSpecToRnaHairpinOwnerInput, presentRnaHairpinOwnerInput, verifyRnaHairpinStructuredEquivalence } from "./rna-hairpin-owner-adapter.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";

const hairpinSceneSpec: SceneSpecV1 = {
  schemaVersion: "1",
  sceneId: "hairpin",
  compatibility: { semanticIntent: "1", scientificScene: "1" },
  semanticIntent: semanticIntentFixtures.rnaHairpin,
  scientificScene: scientificSceneSpecFixtures.hairpin,
};

test("P1-J3C preserves Foundation RNA identity, topology/state references, and provenance", () => {
  const input = adaptSceneSpecToRnaHairpinOwnerInput(hairpinSceneSpec);
  assert.equal(input.owner, "RnaSecondaryStructurePresentation");
  assert.equal(input.rnaActorId, "rna-1");
  assert.equal(input.pairedRegionGroupId, "group-hairpin");
  assert.equal(input.pairedStateId, "hairpin-folded");
  assert.deepEqual(input.basePairingInteractionIds, ["hairpin-pair"]);
  assert.equal(input.unpairedRegion, "hairpin-loop");
  assert.equal(input.fidelityProvenance, hairpinSceneSpec.scientificScene.fidelityProvenance);
});

test("P1-J3C is equivalent to the unchanged RNA secondary-structure hairpin owner", () => {
  const input = adaptSceneSpecToRnaHairpinOwnerInput(hairpinSceneSpec);
  const output = presentRnaHairpinOwnerInput(input);
  const existingOwnerResult = deriveRnaSecondaryStructurePresentation(createRnaSecondaryStructureSpec("hairpin"));
  assert.equal(output.owner, "RnaSecondaryStructurePresentation");
  assert.deepEqual(output.presentation, existingOwnerResult);
  assert.ok(output.presentation.topology.pairedResidues.length > 0);
  assert.ok(output.presentation.topology.unpairedResidues.length > 0);
  assert.ok(output.presentation.topology.regions.some((region) => region.kind === "hairpin"));
  assert.deepEqual(verifyRnaHairpinStructuredEquivalence(input, output), { equivalent: true, differences: [] });
});

test("P1-J3C rejects a SceneSpec without the hairpin pairing topology", () => {
  const notHairpin = { ...hairpinSceneSpec, sceneId: "generic-rna", scientificScene: scientificSceneSpecFixtures["generic-rna"] } as SceneSpecV1;
  assert.throws(() => adaptSceneSpecToRnaHairpinOwnerInput(notHairpin), /hairpin semantics and topology/);
});

test("P1-J3C rejects malformed direct structured owner input", () => {
  const input = adaptSceneSpecToRnaHairpinOwnerInput(hairpinSceneSpec);
  assert.throws(() => presentRnaHairpinOwnerInput({ ...input, basePairingInteractionIds: [] }), /missing paired topology references/);
  assert.throws(() => presentRnaHairpinOwnerInput({ ...input, unpairedRegion: "external-loop" }), /hairpin semantics/);
  assert.throws(() => presentRnaHairpinOwnerInput({ ...input, rawPrompt: "show an RNA hairpin" }), /unknown field/);
});
