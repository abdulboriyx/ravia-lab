import assert from "node:assert/strict";
import test from "node:test";
import { isAuthenticatedLocalChemistryResult } from "./p2-local-chemistry-grounding.ts";
import { createConnectivityFixture, createInvalidScientificGroundingFixture, createScientificGroundingFixture, createScientificFixtureWorld } from "./p2-tf-scientific-grounding-fixtures.ts";
import { createScientificExecutionInventoryFromFixtureWorld, validateScientificExecutionInventory } from "./scientific-execution-inventory.ts";
import { resolveGroundingSubstrate } from "./p2-bcdf-grounding-seam.ts";

test("P2-TF executes the deposited two-chain A-T fixture through BCDF and P2-G", () => {
  const fixture = createScientificGroundingFixture();
  assert.equal(fixture.substrate.outcome, "RESOLVED");
  assert.equal(fixture.substrate.structureContext?.chainIds.length, 2);
  assert.equal(isAuthenticatedLocalChemistryResult(fixture.chemistry), true);
  assert.deepEqual(fixture.chemistry.assertions.map((item) => item.assertionId), [fixture.handles.facts.baseA, fixture.handles.facts.baseT, fixture.handles.facts.donorA, fixture.handles.facts.acceptorT]);
});

for (const kind of ["dnaGC", "rnaAU", "rnaGC", "rnaDnaHybrid", "invalidAG"] as const) test(`P2-TF grounds ${kind} through the same real BCDF→G fixture path`, () => {
  const fixture = createScientificGroundingFixture(kind);
  assert.equal(fixture.substrate.outcome, "RESOLVED");
  assert.equal(isAuthenticatedLocalChemistryResult(fixture.chemistry), true);
  assert.equal(fixture.chemistry.assertions.length, 4);
});

test("P2-TF chemistry authentication cannot be reconstructed from its public shape", () => {
  const fixture = createScientificGroundingFixture();
  const copied = { ...fixture.chemistry, assertions: [...fixture.chemistry.assertions] };
  assert.equal(isAuthenticatedLocalChemistryResult(copied), false);
});

for (const kind of ["dnaPhosphodiester", "rnaPhosphodiester", "rnaCleavage", "rnaExonuclease"] as const) test(`P2-TF grounds explicit ${kind} connectivity`, () => {
  const fixture = createConnectivityFixture(kind);
  assert.equal(isAuthenticatedLocalChemistryResult(fixture.chemistry), true);
  assert.ok(fixture.chemistry.assertions.some((assertion) => assertion.target === (kind === "rnaCleavage" ? "cleavageSite" : "phosphodiester")));
  assert.ok(fixture.chemistry.assertions.some((assertion) => assertion.target === "fivePrimeTerminus"));
  assert.ok(fixture.chemistry.assertions.some((assertion) => assertion.target === "threePrimeTerminus"));
});

test("P2-TF provides a provenance-backed two-strand separation context without geometry", () => {
  const fixture = createConnectivityFixture("strandSeparation");
  assert.equal(fixture.substrate.structureContext?.chainIds.length, 2);
  assert.equal(isAuthenticatedLocalChemistryResult(fixture.chemistry), true);
});

for (const kind of ["missingComponent", "missingTerminus", "malformedConnectivity", "oneSidedPhosphodiester"] as const) test(`P2-TF routes ${kind} to P2-G without a fabricated failure`, () => {
  const invalid = createInvalidScientificGroundingFixture(kind);
  assert.equal(invalid.owner, "P2-G");
  assert.ok(Array.isArray(invalid.result));
  if (Array.isArray(invalid.result)) assert.notEqual(invalid.result[0]?.status, "GROUNDED");
});

for (const [kind, owner, outcome] of [["invalidProvenance", "P2-B", "INVALID_SOURCE"], ["ambiguousAssembly", "P2-D", "AMBIGUOUS_STRUCTURE"], ["excludedChain", "P2-C", "UNRESOLVED_SELECTOR"], ["missingResidue", "P2-C", "UNRESOLVED_SELECTOR"], ["missingAtom", "P2-C", "UNRESOLVED_SELECTOR"], ["fidelityMismatch", "P2-F", "FIDELITY_UNSUPPORTED"]] as const) test(`P2-TF routes ${kind} to ${owner}`, () => {
  const invalid = createInvalidScientificGroundingFixture(kind);
  assert.equal(invalid.owner, owner);
  assert.equal(Array.isArray(invalid.result), false);
  if (!Array.isArray(invalid.result)) assert.equal(invalid.result.outcome, outcome);
});

test("P2-H1A coverage matrix constructs every requested scenario as a raw world", () => {
  const scenarios = ["dnaAT", "dnaGC", "rnaAU", "rnaGC", "rnaDnaHybrid", "dnaPhosphodiester", "rnaPhosphodiester", "rnaCleavage", "rnaExonuclease", "strandSeparation", "computedModel", "constrainedSchematic", "schematic", "invalidProvenance", "ambiguousAssembly", "ambiguousModel", "excludedChain", "missingResidue", "missingAtom", "missingComponent", "malformedConnectivity", "missingTerminus", "oneSidedPhosphodiester", "fidelityMismatch", "repeatedChainAmbiguity"] as const;
  for (const scenario of scenarios) { const world = createScientificFixtureWorld({ scenario }); assert.ok(world.structure.chains.length > 0); assert.equal(validateScientificExecutionInventory(createScientificExecutionInventoryFromFixtureWorld(world)).valid, true); }
});

test("P2-H1A preserves real assembly/model ambiguity and computed context gap", () => {
  const assembly = createScientificFixtureWorld({ scenario: "ambiguousAssembly" }); const assemblyResult = resolveGroundingSubstrate({ provenance: assembly.provenance, attachmentContext: { actorIds: [assembly.handles.strandA as never, assembly.handles.strandB as never], groupIds: [] }, inventory: assembly.inventory, structureRequest: assembly.structureRequest, selectors: assembly.selectors, fidelity: assembly.fidelity }); assert.equal(assemblyResult.outcome, "AMBIGUOUS_STRUCTURE");
  const model = createScientificFixtureWorld({ scenario: "ambiguousModel" }); const modelResult = resolveGroundingSubstrate({ provenance: model.provenance, attachmentContext: { actorIds: [model.handles.strandA as never, model.handles.strandB as never], groupIds: [] }, inventory: model.inventory, structureRequest: model.structureRequest, selectors: model.selectors, fidelity: model.fidelity }); assert.equal(modelResult.outcome, "AMBIGUOUS_STRUCTURE");
  const computed = createScientificFixtureWorld({ scenario: "computedModel" }); assert.equal(validateScientificExecutionInventory(createScientificExecutionInventoryFromFixtureWorld(computed)).valid, true); assert.equal(computed.provenance.sourceType, "computedModel"); assert.equal(computed.fidelity.representation.requirement, "computedModel");
});
