import test from "node:test";
import assert from "node:assert/strict";
import { rnaPresentationOwners } from "./RnaPresentationRouter.ts";
import { migrateRnaHairpinThroughFoundation } from "./rna-hairpin-foundation-migration.ts";

const prompt = "show an RNA hairpin with paired stem and unpaired loop";

test("F7-C routes an RNA hairpin through frozen semantic, capability, and SceneSpec contracts", () => {
  const migration = migrateRnaHairpinThroughFoundation(prompt);
  assert.ok(migration);
  assert.equal(migration.semantic.intent.requests[0]?.phenomenon, "rnaSecondaryStructure");
  assert.equal(migration.semantic.intent.requests[0]?.mechanism, "rnaSecondaryFolding");
  assert.ok(migration.semantic.intent.requests[0]?.states?.includes("folded"));
  assert.equal(migration.capability.capabilityId, "rna-secondary-structure");
  assert.equal(migration.capability.presentationOwner, "RnaSecondaryStructurePresentation");
  assert.equal(migration.sceneSpec.sceneId, "hairpin");
  assert.equal(migration.sceneSpec.scientificScene.actors[0]?.semanticTypeId, "rna");
  assert.ok(migration.sceneSpec.scientificScene.groups.some((group) => group.kind === "pairedStem"));
  assert.ok(migration.sceneSpec.scientificScene.states.some((state) => state.kind === "paired"));
  assert.ok(migration.sceneSpec.scientificScene.topology.interactions.some((interaction) => interaction.type === "basePairing" && interaction.state === "present"));
});

test("F7-C retains the existing secondary-structure owner and its paired/unpaired topology", () => {
  const migration = migrateRnaHairpinThroughFoundation(prompt);
  assert.ok(migration);
  assert.equal(migration.productionRoute.owner, rnaPresentationOwners.secondaryStructure);
  assert.equal(migration.productionRoute.owner, "RnaSecondaryStructurePresentation");
  assert.equal(migration.productionRoute.sourceSpec.family, "secondaryStructure");
  const presentation = migration.productionRoute.presentation;
  if (!("motif" in presentation) || !("topology" in presentation)) assert.fail("secondary-structure owner must return its existing topology payload");
  assert.equal(presentation.motif, "hairpin");
  assert.ok(presentation.topology.pairedResidues.length > 0);
  assert.ok(presentation.topology.unpairedResidues.length > 0);
  assert.ok(presentation.topology.regions.some((region) => region.kind === "hairpin"));
});

test("F7-C does not turn unrelated RNA prompts into a hairpin rendering branch", () => {
  assert.equal(migrateRnaHairpinThroughFoundation("show an individual RNA nucleotide"), undefined);
});
