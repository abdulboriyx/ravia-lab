import assert from "node:assert/strict";
import test from "node:test";
import { createScientificFixtureWorld } from "./p2-tf-scientific-grounding-fixtures.ts";
import { createScientificExecutionInventoryFromFixtureWorld } from "./scientific-execution-inventory.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { migrateProductionScientificScene } from "./p2-j-production-grounding-migration.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";
import { composeSceneSpecV1 } from "./p2-h-scientific-plan-compiler.ts";
import { adaptDnaBasePairingOwnerView, adaptDnaStrandSeparationOwnerView, adaptRnaHairpinOwnerView, adaptRnaExonucleaseOwnerView } from "./p2-j1-owner-scientific-views.ts";

const intent = (phenomenon: string, mechanism: string, subjects: SemanticSubject[]) => ({ ...structuredClone(semanticIntentFixtures.slang!), rawUtterance: "validated structured intent", requests: [{ ...structuredClone(semanticIntentFixtures.slang!.requests[0]!), phenomenon, mechanism, subjects }] } as unknown as SemanticIntentV1);
type SemanticSubject = { rawText: string; resolvedId?: string; role?: string };
const exonucleaseIntent = { schemaVersion: "1" as const, rawUtterance: "validated structured intent", canonicalGloss: "Validated RNA terminal exonuclease request", acts: ["show" as const], requests: [{ subjects: [{ rawText: "RNA", resolvedId: "rna", role: "substrate" }, { rawText: "RNA strand", resolvedId: "strand", role: "substrate" }], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["intact" as const, "partiallyDegraded" as const], focus: "terminus" as const, direction: { biochemical: "fiveToThree" as const, meaning: "scientific" as const }, outputPreferences: ["static" as const], requestedOutput: "scientificFigure" as const }], assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 1 } as unknown as SemanticIntentV1;

test("P2-J routes all selected capabilities through P2-H and never uses a generic owner fallback", () => {
  const cases = [
    ["dna-base-pairing", "dnaAT", semanticIntentFixtures.slang!],
    ["dna-strand-separation", "dnaAT", intent("strandSeparation", "strandOpening", [{ rawText: "DNA", resolvedId: "dna" }, { rawText: "DNA strands", resolvedId: "strand" }])],
    ["rna-secondary-structure", "rnaAU", semanticIntentFixtures.rnaHairpin!],
    ["rna-exonuclease-degradation", "rnaExonuclease", exonucleaseIntent],
  ] as const;
  for (const [capabilityId, scenario, semanticIntent] of cases) {
    const result = migrateProductionScientificScene(semanticIntent, capabilityId, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld(scenario)));
    if (!result.ok) assert.notEqual(result.code, "GENERIC_FALLBACK");
    assert.equal(result.ok, true, `${capabilityId} did not reach its existing owner`);
    if (result.ok) assert.equal(result.owner.length > 0, true);
  }
});

test("P2-J rejects unsupported capabilities explicitly", () => {
  const result = migrateProductionScientificScene(semanticIntentFixtures.slang!, "rna-processing", createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld("rnaAU")));
  assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "PRODUCTION_OWNER_UNAVAILABLE");
});

test("P2-J preserves explicit grounding failures without owner fallback", () => {
  const result = migrateProductionScientificScene(semanticIntentFixtures.slang!, "dna-base-pairing", createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld({ scenario: "ambiguousAssembly" })));
  assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "GROUNDING_FAILURE");
});

test("P2-J1 owner views reject incomplete grounded evidence without synthetic defaults", () => {
  const cases = [
    ["dna-base-pairing", semanticIntentFixtures.slang!, "dnaAT", (scene: any) => ({ ...scene, topology: { ...scene.topology, interactions: [] } }), adaptDnaBasePairingOwnerView],
    ["dna-strand-separation", intent("strandSeparation", "strandOpening", [{ rawText: "DNA", resolvedId: "dna" }, { rawText: "strands", resolvedId: "strand" }]), "dnaAT", (scene: any) => ({ ...scene, topology: { ...scene.topology, changes: [] } }), adaptDnaStrandSeparationOwnerView],
    ["rna-secondary-structure", semanticIntentFixtures.rnaHairpin!, "rnaAU", (scene: any) => ({ ...scene, topology: { ...scene.topology, interactions: [] } }), adaptRnaHairpinOwnerView],
    ["rna-exonuclease-degradation", exonucleaseIntent, "rnaExonuclease", (scene: any) => ({ ...scene, topology: { ...scene.topology, changes: [] } }), adaptRnaExonucleaseOwnerView],
  ] as const;
  for (const [capabilityId, semanticIntent, scenario, mutate, adapter] of cases) {
    const migrated = migrateProductionScientificScene(semanticIntent, capabilityId, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld(scenario)));
    assert.equal(migrated.ok, true); if (!migrated.ok) continue;
    if (!migrated.scientific.ok) continue;
    const original = composeSceneSpecV1(migrated.scientific.plan.planId, semanticIntent, migrated.scientific.scientificScene); assert.equal("issues" in original, false); if ("issues" in original) continue;
    const mutatedScene = mutate(original.scientificScene); const rejected = adapter({ ...original, scientificScene: mutatedScene }, { ...migrated.scientific, scientificScene: mutatedScene });
    assert.equal(rejected.ok, false); if (!rejected.ok) assert.equal(rejected.code, "OWNER_VIEW_UNAVAILABLE");
  }
});
