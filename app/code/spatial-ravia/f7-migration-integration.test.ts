import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { migrateDnaFoundationRequest } from "./dna-foundation-migration.ts";
import { migrateDnaStrandSeparationPrompt } from "./f7-dna-strand-separation-migration.ts";
import { migrateRnaHairpinThroughFoundation } from "./rna-hairpin-foundation-migration.ts";
import { adaptRnaExonucleaseMigration, createRnaExonucleaseMigration } from "./rna-exonuclease-migration.ts";
import { createFoundationLegacyMigration } from "./foundation-legacy-migration-seam.ts";
import { capabilityRegistryById } from "./capability-registry.ts";

test("F7-E all four migration families use the same seam and retain existing owners", () => {
  const dna = migrateDnaFoundationRequest({ rawPrompt: "show the structure of B-DNA", source: "structure", scientificScene: scientificSceneSpecFixtures["canonical-duplex"] });
  const pair = migrateDnaFoundationRequest({ rawPrompt: "show a G-C base pair in DNA", source: "basePairMechanism", pair: "G-C", scientificScene: scientificSceneSpecFixtures["gc-pairing"] });
  const separation = migrateDnaStrandSeparationPrompt("show DNA strands separating");
  const hairpin = migrateRnaHairpinThroughFoundation("show an RNA hairpin with paired stem and unpaired loop");
  const exonuclease = adaptRnaExonucleaseMigration(createRnaExonucleaseMigration("fiveToThree"));
  assert.ok(separation && hairpin);
  const migrations = [dna, pair, separation, hairpin, exonuclease];
  for (const migration of migrations) {
    assert.equal(migration.seam.seamVersion, "1");
    assert.equal(migration.seam.fallbackStatus, "none");
    assert.ok(migration.seam.productionOwner.length > 0);
    assert.ok(migration.seam.equivalence.actorIds.length > 0);
    assert.ok(migration.seam.equivalence.fidelitySourceIds.length > 0);
  }
  assert.equal(dna.seam.productionOwner, "molecular-view");
  assert.equal(pair.seam.productionOwner, "DnaBasePairInteractionPresentation");
  assert.equal(separation!.seam.productionOwner, "DnaStrandSeparationPresentation");
  assert.equal(hairpin!.seam.productionOwner, "RnaSecondaryStructurePresentation");
  assert.equal(exonuclease.seam.productionOwner, "RnaDegradationPresentation");
  assert.equal(pair.seam.semanticIntent.requests[0]!.subjects.some((subject) => subject.resolvedId === "guanine"), true);
  assert.equal(separation!.seam.sceneSpec.scientificScene.states.some((state) => state.kind === "open"), true);
  assert.equal(hairpin!.seam.sceneSpec.scientificScene.groups.some((group) => group.kind === "pairedStem"), true);
  assert.equal(exonuclease.seam.sceneSpec.semanticIntent.requests[0]!.direction?.biochemical, "fiveToThree");
});

test("F7-E seam rejects unsupported, clarification, malformed, ownerless, and unmapped inputs explicitly", () => {
  const base = migrateDnaFoundationRequest({ rawPrompt: "show the structure of B-DNA", source: "structure", scientificScene: scientificSceneSpecFixtures["canonical-duplex"] });
  const unsupported = { ...base.capability, supportStatus: "UNSUPPORTED" as const };
  const clarification = { ...base.capability, supportStatus: "CLARIFICATION_REQUIRED" as never };
  assert.throws(() => createFoundationLegacyMigration({ semanticIntent: base.semanticIntent, capability: unsupported, sceneSpec: base.sceneSpec, productionOwner: "molecular-view", legacyOutput: base.renderer }));
  assert.throws(() => createFoundationLegacyMigration({ semanticIntent: base.semanticIntent, capability: clarification, sceneSpec: base.sceneSpec, productionOwner: "molecular-view", legacyOutput: base.renderer }));
  assert.throws(() => createFoundationLegacyMigration({ semanticIntent: base.semanticIntent, capability: base.capability, sceneSpec: { ...base.sceneSpec, camera: { fov: 40 } } as never, productionOwner: "molecular-view", legacyOutput: base.renderer }));
  assert.throws(() => createFoundationLegacyMigration({ semanticIntent: base.semanticIntent, capability: base.capability, sceneSpec: base.sceneSpec, productionOwner: "", legacyOutput: base.renderer }));
  assert.throws(() => createFoundationLegacyMigration({ semanticIntent: base.semanticIntent, capability: base.capability, sceneSpec: base.sceneSpec, productionOwner: "molecular-view", legacyOutput: undefined as never }));
  assert.equal(capabilityRegistryById.has(base.capability.capabilityId), true);
});
