import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { resolveGroundingSubstrate } from "./p2-bcdf-grounding-seam.ts";

const source = { sourceId: "pdb-dna", sourceType: "depositedStructure" as const, fidelity: "E0_DEPOSITED" as const, provider: { id: "RCSB-PDB" }, accessionOrEntryId: "4V5C", structure: { structureId: "4V5C", assemblyId: "1" }, citationReference: "citation", licenseReference: "license", contentHash: "pending:pdb-dna", sourceConfidence: .95, groundingConfidence: .93, mechanismEvidence: "direct" as const, visualApproximation: "minor" as const, attachmentId: "dna-attachment", target: { kind: "actor" as const, id: "dna-1" } };
const context = { actorIds: [actorId("dna-1")], groupIds: [] as never[] };
const inventory = { asymmetricUnit: { chainIds: ["A", "B"], modelNumbers: [1] }, biologicalAssemblies: [{ assemblyId: "1", chainIds: ["A", "B"], modelNumbers: [1] }] };
const fidelity = { grounding: { kind: "sourceSelected" as const, confidence: .93 }, mechanismEvidence: "direct" as const, representation: { requirement: "depositedCoordinates" as const, declaredBy: "evidence" as const } };
const actorScene = { actors: [{ actorId: actorId("dna-1"), semanticTypeId: "strand" as const, role: "templateStrand" as const, scope: "strand" as const, instanceId: "dna-instance" }], groups: [] };
const structure = { structureId: "4V5C", chains: [{ id: "A", authAsymId: "A", entityType: "dna" as const, residues: [{ key: "A:1", residueName: "A", residueSequence: 1, authSeqId: 1, residueInsertionCode: "", chainId: "A", entityType: "dna" as const, atoms: [{ serial: 1, atomName: "P", residueName: "A", residueSequence: 1, residueInsertionCode: "", chainId: "A", entityType: "dna" as const, element: "P", x: 0, y: 0, z: 0 }], centroid: [0, 0, 0] as [number, number, number] }], atoms: [], centroid: [0, 0, 0] as [number, number, number], bounds: { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] } }] };
const selectors = { schemaVersion: "1" as const, actorScene, structure, bindings: [{ bindingId: "dna-chain", actorId: actorId("dna-1"), instanceId: "dna-instance", selector: { kind: "chain" as const, structureId: "4V5C", chain: { namespace: "normalized" as const, id: "A" } } }] };

test("composes provenance, assembly, selectors, and fidelity", () => {
  const result = resolveGroundingSubstrate({ provenance: source, attachmentContext: context, inventory, structureRequest: { assembly: { kind: "biologicalAssembly", assemblyId: "1" }, modelNumber: 1, chainIds: ["A"] }, selectors, fidelity });
  assert.equal(result.outcome, "RESOLVED");
  if (result.outcome === "RESOLVED") { assert.equal(result.structureContext?.modelNumber, 1); assert.equal(result.fidelity.accepted, true); }
});

test("propagates ambiguity, context exclusion, and invalid source", () => {
  const ambiguous = resolveGroundingSubstrate({ provenance: { ...source, structure: { structureId: "4V5C" } }, attachmentContext: context, inventory: { ...inventory, biologicalAssemblies: [{ assemblyId: "1", chainIds: ["A"], modelNumbers: [1] }, { assemblyId: "2", chainIds: ["A"], modelNumbers: [1] }] }, fidelity });
  assert.equal(ambiguous.outcome, "AMBIGUOUS_STRUCTURE");
  const invalid = resolveGroundingSubstrate({ provenance: { ...source, accessionOrEntryId: undefined }, attachmentContext: context, inventory, fidelity });
  assert.equal(invalid.outcome, "INVALID_SOURCE");
  const unsupported = resolveGroundingSubstrate({ provenance: source, attachmentContext: context, inventory, structureRequest: { assembly: { kind: "biologicalAssembly", assemblyId: "1" }, chainIds: ["Z"] }, fidelity });
  assert.equal(unsupported.outcome, "UNSUPPORTED_CONTEXT");
});
