import assert from "node:assert/strict";
import test from "node:test";
import { actorId, groupId, type ScientificActorScene } from "./scientific-actor.ts";
import { resolveMolecularIdentitySelectors, type MolecularSelectorAuthorityInput } from "./p2-molecular-selector-grounding.ts";
import type { ResolvedStructureContext } from "./p2-d-structure-context.ts";

const scene: ScientificActorScene = {
  actors: [
    { actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", semanticTypeId: "strand", role: "templateStrand", scope: "strand" },
    { actorId: actorId("dna-a-2"), instanceId: "dna-instance-b", semanticTypeId: "strand", role: "codingStrand", scope: "strand" },
  ],
  groups: [{ groupId: groupId("group-local-base"), kind: "basePair", memberActorIds: [actorId("dna-a-1"), actorId("dna-a-2")] }],
};
const atom = (atomName: string) => ({ serial: 1, atomName, residueName: "A", residueSequence: 1, residueInsertionCode: "", chainId: "A", entityType: "dna" as const, element: "C", x: 0, y: 0, z: 0 });
const chain = (id: string, authAsymId = id) => ({ id, authAsymId, entityType: "dna" as const, residues: [{ key: `${id}:1`, residueName: "A", residueSequence: 1, authSeqId: 1, residueInsertionCode: "", chainId: id, entityType: "dna" as const, atoms: [atom("P"), atom("C1'")], centroid: [0, 0, 0] as [number, number, number] }], atoms: [], centroid: [0, 0, 0] as [number, number, number], bounds: { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] } });
const resolvedContext: ResolvedStructureContext = { sourceId: "p2-b-source" as never, structureId: "TEST", assembly: { kind: "biologicalAssembly", assemblyId: "1" }, modelNumber: 1, chainIds: ["A", "B"], alternateLocationPolicy: "notApplicable", rationale: ["test"] };
const base: MolecularSelectorAuthorityInput = { schemaVersion: "1", actorScene: scene, structure: { structureId: "TEST", chains: [chain("A", "X"), chain("B", "X")] }, resolvedContext, bindings: [] };

test("P2-C resolves explicit chains, residues, atoms, termini, bases, sugar/phosphate groups, and repeated instances", () => {
  const input: MolecularSelectorAuthorityInput = { ...base, bindings: [
    { bindingId: "chain-a", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "chain", structureId: "TEST", chain: { namespace: "normalized", id: "A" } } },
    { bindingId: "atom-a", actorId: actorId("dna-a-2"), instanceId: "dna-instance-b", selector: { kind: "atom", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, atomNames: ["P", "C1'"] } },
    { bindingId: "terminus-a", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "terminus", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, terminus: "fivePrime" } },
    { bindingId: "base-a", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "localGroup", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, group: "base", base: "A" } },
    { bindingId: "sugar-a", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "localGroup", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, group: "sugar" } },
    { bindingId: "phosphate-a", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "localGroup", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, group: "phosphate" } },
    { bindingId: "domain-a", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "localGroup", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, group: "domain", domainId: "major-groove-region" } },
    { bindingId: "f2-group", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "scientificGroup", groupId: groupId("group-local-base"), memberActorIds: [actorId("dna-a-1"), actorId("dna-a-2")] } },
  ] };
  const result = resolveMolecularIdentitySelectors(input);
  assert.equal(result.valid, true);
  assert.equal(result.resolutions.every((resolution) => resolution.status === "resolved"), true);
  assert.equal(result.resolutions.find((resolution) => resolution.binding.bindingId === "atom-a")?.status, "resolved");
});

test("P2-C reports chain ambiguity and rejects guessing, dangling selectors, contradictory ranges, identities, and invalid local mappings", () => {
  const ambiguous = resolveMolecularIdentitySelectors({ ...base, bindings: [{ bindingId: "ambiguous", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "chain", structureId: "TEST", chain: { namespace: "auth", id: "X" } } }] });
  assert.equal(ambiguous.valid, true); assert.equal(ambiguous.resolutions[0]?.status, "ambiguous");
  const invalid = resolveMolecularIdentitySelectors({ ...base, bindings: [
    { bindingId: "bad-range", actorId: actorId("dna-a-1"), instanceId: "wrong-instance", selector: { kind: "residue", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 2, end: 1, namespace: "auth" } } },
    { bindingId: "missing-atom", actorId: actorId("dna-a-2"), instanceId: "dna-instance-b", selector: { kind: "atom", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, atomNames: ["O9'"] } },
    { bindingId: "wrong-base", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "localGroup", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, residue: { start: 1, end: 1, namespace: "auth" }, group: "base", base: "G" } },
    { bindingId: "wrong-terminus", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "terminus", structureId: "TEST", chain: { namespace: "normalized", id: "A" }, terminus: "amino" } },
    { bindingId: "dangling-chain", actorId: actorId("dna-a-1"), instanceId: "dna-instance-a", selector: { kind: "chain", structureId: "TEST", chain: { namespace: "normalized", id: "MISSING" } } },
  ] });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.issues.some((entry) => entry.path.includes("instanceId")));
  assert.ok(invalid.issues.some((entry) => entry.path.includes("selector.residue") && entry.message.includes("non-contradictory")));
  assert.equal(invalid.resolutions.find((resolution) => resolution.binding.bindingId === "missing-atom")?.status, "unresolved");
  assert.equal(invalid.resolutions.find((resolution) => resolution.binding.bindingId === "wrong-base")?.status, "unresolved");
  assert.equal(invalid.resolutions.find((resolution) => resolution.binding.bindingId === "wrong-terminus")?.status, "unresolved");
  assert.equal(invalid.resolutions.find((resolution) => resolution.binding.bindingId === "dangling-chain")?.status, "unresolved");
});
