import assert from "node:assert/strict";
import test from "node:test";
import { composeGroundedScientificScene, composeSceneSpecV1, executeScientificPlan, planScientificScene, validateScientificPlan } from "./p2-h-scientific-plan-compiler.ts";
import { createScientificGroundingFixture } from "./p2-tf-scientific-grounding-fixtures.ts";
import { createScientificFixtureWorld } from "./p2-tf-scientific-grounding-fixtures.ts";
import { createScientificExecutionInventoryFromFixtureWorld } from "./scientific-execution-inventory.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";

test("P2-H deterministically plans and executes a real DNA base-pairing substrate from structured intent", () => {
  const plan = planScientificScene(semanticIntentFixtures.slang!); assert.equal(plan.ok, true); if (!plan.ok) return;
  assert.equal(plan.plan.capabilityId, "dna-base-pairing"); assert.equal(validateScientificPlan(plan.plan).valid, true);
  const fixture = createScientificGroundingFixture("dnaAT"); const actorScene = { actors: [{ actorId: fixture.handles.actors.strandA, semanticTypeId: "nucleotide" as const, scope: "residue" as const, instanceId: "fixture-a" }, { actorId: fixture.handles.actors.strandB, semanticTypeId: "nucleotide" as const, scope: "residue" as const, instanceId: "fixture-b" }], groups: [] };
  const grounded = executeScientificPlan(plan.plan, { grounding: fixture.substrate, actorScene, chemistry: fixture.chemistry, interactions: [{ interactionId: "pair", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(grounded.ok, true); if (!grounded.ok) return;
  const scene = composeGroundedScientificScene("p2h-at-pair", { grounding: fixture.substrate, actorScene, chemistry: fixture.chemistry, interactions: [] }, grounded); assert.ok(!("issues" in scene)); if ("issues" in scene) return;
  assert.ok(!("issues" in composeSceneSpecV1("p2h-at-pair", semanticIntentFixtures.slang!, scene)));
});

test("P2-H materializes the DNA A-T vertical from raw execution inventory", () => {
  const planned = planScientificScene(semanticIntentFixtures.slang!, { capabilityId: "dna-base-pairing" }); assert.equal(planned.ok, true); if (!planned.ok) return;
  const result = executeScientificPlan(planned.plan, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld("dnaAT"))); assert.equal(result.ok, true); if (!result.ok) return; assert.equal(result.chemistry.schemaVersion, "2"); assert.ok(result.topology.model.topology.interactions.length >= 2); assert.equal(validateScientificPlan(result.plan).valid, true); assert.ok(!("camera" in result.scientificScene));
  const scene = composeSceneSpecV1("plan-dna-base-pairing", semanticIntentFixtures.slang!, result.scientificScene); assert.ok(!("issues" in scene));
});

test("P2-H reuses materializers for RNA cleavage and exact link topology", () => {
  const intent = structuredClone(semanticIntentFixtures.rnaHairpin!); intent.requests[0]!.phenomenon = "cleavage"; intent.requests[0]!.mechanism = "rnaCleavage"; intent.requests[0]!.subjects = [{ rawText: "RNA", resolvedId: "rna" }];
  const planned = planScientificScene(intent, { capabilityId: "rna-cleavage" }); assert.equal(planned.ok, true); if (!planned.ok) return;
  const result = executeScientificPlan(planned.plan, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld("rnaCleavage"))); assert.equal(result.ok, true, JSON.stringify(result)); if (!result.ok) return; assert.ok(result.chemistry.linkAssertions.some((link) => link.linkKind === "CLEAVAGE_SITE")); assert.ok(result.topology.model.topology.changes?.some((change) => change.kind === "cleavage"));
});

test("P2-H inventory execution preserves P2-D ambiguity and computed gap", () => {
  const base = semanticIntentFixtures.slang!; const assemblyPlan = planScientificScene(base, { capabilityId: "dna-base-pairing" }); assert.equal(assemblyPlan.ok, true); if (!assemblyPlan.ok) return;
  const ambiguousAssembly = executeScientificPlan(assemblyPlan.plan, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld({ scenario: "ambiguousAssembly" }))); assert.equal(ambiguousAssembly.ok, false); if (!ambiguousAssembly.ok) assert.equal(ambiguousAssembly.code, "AMBIGUOUS_STRUCTURE");
  const computedPlan = planScientificScene(base, { capabilityId: "dna-base-pairing", sourceStrategy: "computed" }); assert.equal(computedPlan.ok, true); if (!computedPlan.ok) return; const computed = executeScientificPlan(computedPlan.plan, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld({ scenario: "computedModel" }))); assert.equal(computed.ok, false); if (!computed.ok) assert.deepEqual(computed.reasons, ["COMPUTED_STRUCTURE_CONTEXT_GAP"]);
});

test("P2-H representative capability mappings reuse the same executor", () => {
  const cases = [
    ["dna-strand-separation", "dnaAT"], ["rna-secondary-structure", "rnaAU"], ["rna-dna-hybridization", "rnaDnaHybrid"],
    ["dna-phosphodiester-backbone", "dnaPhosphodiester"], ["rna-exonuclease-degradation", "rnaExonuclease"],
  ] as const;
  for (const [capabilityId, scenario] of cases) { const planned = planScientificScene(semanticIntentFixtures.slang!, { capabilityId }); assert.equal(planned.ok, true, capabilityId); if (!planned.ok) continue; const result = executeScientificPlan(planned.plan, createScientificExecutionInventoryFromFixtureWorld(createScientificFixtureWorld(scenario))); assert.equal(result.ok, true, `${capabilityId}: ${JSON.stringify(result)}`); }
});

test("P2-H explicitly refuses the documented computed structural topology gap", () => {
  const plan = planScientificScene(semanticIntentFixtures.slang!, { sourceStrategy: "computed" }); assert.equal(plan.ok, true); if (!plan.ok) return; assert.equal(plan.plan.disposition, "UNSUPPORTED_CURRENT_GROUNDING_PATH"); assert.deepEqual(plan.plan.limitations, ["COMPUTED_STRUCTURE_CONTEXT_GAP"]);
});
