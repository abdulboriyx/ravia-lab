import assert from "node:assert/strict";
import test from "node:test";
import { createScientificExecutionInventoryFromFixtureWorld, validateScientificExecutionInventory } from "./scientific-execution-inventory.ts";
import { createScientificFixtureWorld } from "./p2-tf-scientific-grounding-fixtures.ts";
import { resolveGroundingSubstrate } from "./p2-bcdf-grounding-seam.ts";
import { groundAuthenticatedLocalChemistry, isAuthenticatedLocalChemistryResult } from "./p2-local-chemistry-grounding.ts";

const substrateFor = (world: ReturnType<typeof createScientificFixtureWorld>) => resolveGroundingSubstrate({ provenance: world.provenance, attachmentContext: { actorIds: [world.handles.strandA as never, world.handles.strandB as never], groupIds: [] }, inventory: world.inventory, structureRequest: world.structureRequest, selectors: world.selectors, fidelity: world.fidelity });

test("execution inventory contains raw data only and drives RNA cleavage B→D→C→F→G", () => {
  const world = createScientificFixtureWorld("rnaCleavage"); const inventory = createScientificExecutionInventoryFromFixtureWorld(world); assert.equal(validateScientificExecutionInventory(inventory).valid, true);
  const text = JSON.stringify(inventory); for (const forbidden of ["schemaVersion\":\"2", "linkAssertions", "topology", "structureContext", "decision"]) assert.equal(text.includes(forbidden), false);
  const substrate = substrateFor(world); assert.equal(substrate.outcome, "RESOLVED"); if (substrate.outcome !== "RESOLVED") return; const chemistry = groundAuthenticatedLocalChemistry({ schemaVersion: "1", substrate, structure: world.structure, components: world.components, connectivity: world.connectivity, requests: world.chemistryRequests }); assert.equal(isAuthenticatedLocalChemistryResult(chemistry), true);
});

test("execution inventory preserves raw DNA A-T data deterministically", () => { const world = createScientificFixtureWorld("dnaAT"); const inventory = createScientificExecutionInventoryFromFixtureWorld(world); assert.equal(validateScientificExecutionInventory(inventory).valid, true); assert.equal(inventory.entries[0]!.source.sourceType, "depositedStructure"); assert.equal(inventory.entries[0]!.structure?.chains.length, 2); });
