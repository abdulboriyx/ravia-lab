import assert from "node:assert/strict";
import test from "node:test";
import { groundLocalChemistry, type LocalChemistryGroundingInput } from "./p2-local-chemistry-grounding.ts";

const residue = (chainId: string, sequence: number, name: string, atomNames: string[], entityType: "dna" | "rna") => ({ key: `${chainId}:${sequence}`, residueName: name, residueSequence: sequence, authSeqId: sequence, residueInsertionCode: "", chainId, entityType, atoms: atomNames.map((atomName, index) => ({ serial: index, atomName, residueName: name, residueSequence: sequence, residueInsertionCode: "", chainId, entityType, element: "C", x: 0, y: 0, z: 0 })), centroid: [0, 0, 0] as [number, number, number] });
const chain = (id: string, entityType: "dna" | "rna", residues: ReturnType<typeof residue>[]) => ({ id, entityType, residues, atoms: [], centroid: [0, 0, 0] as [number, number, number], bounds: { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] } });
const dna = chain("D", "dna", [residue("D", 1, "DT", ["P", "O3'", "O5'", "C1'", "N3"], "dna"), residue("D", 2, "DA", ["P", "O3'", "O5'", "C1'", "N6"], "dna")]);
const rna = chain("R", "rna", [residue("R", 1, "U", ["P", "O2'", "O3'", "O5'", "C1'", "O4"], "rna")]);
const resolved = (bindingId: string, residueKeys: string[]) => ({ status: "resolved" as const, binding: { bindingId, actorId: "actor-1" as never, selector: { kind: "chain" as const, structureId: "CHEM", chain: { namespace: "normalized" as const, id: "D" } } }, chainIds: [], residueKeys, atomKeys: [] });
const input = (): LocalChemistryGroundingInput => ({
  schemaVersion: "1",
  substrate: { outcome: "RESOLVED", provenance: { sourceId: "source-chem" as never }, structureContext: { structureId: "CHEM" }, selectors: { valid: true, issues: [], resolutions: [resolved("dna-1", ["D:1"]), resolved("dna-2", ["D:2"]), resolved("rna-1", ["R:1"])] }, fidelity: { accepted: true, decision: {} } } as never,
  structure: { structureId: "CHEM", chains: [dna, rna] },
  components: [
    { componentId: "DT", nucleicChemistry: "DNA", base: "T", sugar: "deoxyribose", atomNames: ["P", "O3'", "O5'", "C1'", "N3"], donorAtomNames: [], acceptorAtomNames: ["N3"], evidenceType: "ccdComponent", confidence: .98, limitations: [] },
    { componentId: "DA", nucleicChemistry: "DNA", base: "A", sugar: "deoxyribose", atomNames: ["P", "O3'", "O5'", "C1'", "N6"], donorAtomNames: ["N6"], acceptorAtomNames: [], evidenceType: "mmcifAtomNaming", confidence: .93, limitations: [] },
    { componentId: "U", nucleicChemistry: "RNA", base: "U", sugar: "ribose", atomNames: ["P", "O2'", "O3'", "O5'", "C1'", "O4"], donorAtomNames: [], acceptorAtomNames: ["O4"], evidenceType: "ccdComponent", confidence: .99, limitations: [] },
  ],
  connectivity: { termini: [{ terminus: "fivePrime", residueKey: "D:1" }, { terminus: "threePrime", residueKey: "D:2" }], phosphodiesterLinks: [{ linkId: "intact", upstreamResidueKey: "D:1", downstreamResidueKey: "D:2", atomKeys: ["D:1:O3'", "D:2:P", "D:2:O5'"], state: "intact" }, { linkId: "cut", upstreamResidueKey: "D:1", downstreamResidueKey: "D:2", atomKeys: ["D:1:O3'", "D:2:P", "D:2:O5'"], state: "cleaved" }] },
  requests: [],
});

test("P2-G grounds DNA/RNA nucleotide chemistry, ribose/deoxyribose, 2′-OH, bases, phosphate, termini, donor/acceptor, and connectivity", () => {
  const value = input(); value.requests = [
    { assertionId: "dna-context", bindingId: "dna-1", componentId: "DT", target: "nucleotideContext" }, { assertionId: "dna-sugar", bindingId: "dna-1", componentId: "DT", target: "sugar" },
    { assertionId: "thymine", bindingId: "dna-1", componentId: "DT", target: "base" }, { assertionId: "rna-oh", bindingId: "rna-1", componentId: "U", target: "twoPrimeHydroxyl" },
    { assertionId: "uracil", bindingId: "rna-1", componentId: "U", target: "base" }, { assertionId: "phosphate", bindingId: "dna-2", componentId: "DA", target: "phosphate" },
    { assertionId: "five-prime", bindingId: "dna-1", componentId: "DT", target: "fivePrimeTerminus" }, { assertionId: "three-prime", bindingId: "dna-2", componentId: "DA", target: "threePrimeTerminus" },
    { assertionId: "link", bindingId: "dna-1", componentId: "DT", target: "phosphodiester", linkId: "intact" }, { assertionId: "cut", bindingId: "dna-2", componentId: "DA", target: "cleavageSite", linkId: "cut" },
    { assertionId: "donor", bindingId: "dna-2", componentId: "DA", target: "donor", atomName: "N6" }, { assertionId: "acceptor", bindingId: "rna-1", componentId: "U", target: "acceptor", atomName: "O4" },
  ];
  const results = groundLocalChemistry(value); assert.equal(results.every((result) => result.status === "GROUNDED"), true);
  const oh = results.find((result) => result.status === "GROUNDED" && result.assertion.assertionId === "rna-oh"); assert.equal(oh?.status, "GROUNDED"); if (oh?.status === "GROUNDED") assert.equal(oh.assertion.nucleicChemistry, "RNA");
});

test("P2-G returns explicit failures for inconsistent chemistry, missing components/atoms, malformed selectors, and insufficient evidence", () => {
  const value = input(); value.requests = [
    { assertionId: "dna-oh", bindingId: "dna-1", componentId: "DT", target: "twoPrimeHydroxyl" }, { assertionId: "missing-component", bindingId: "dna-1", componentId: "missing", target: "base" },
    { assertionId: "missing-atom", bindingId: "dna-1", componentId: "DT", target: "donor", atomName: "N6" }, { assertionId: "bad-link", bindingId: "dna-1", componentId: "DT", target: "phosphodiester", linkId: "cut" },
    { assertionId: "missing-binding", bindingId: "missing", componentId: "DT", target: "base" },
  ];
  const statuses = groundLocalChemistry(value).map((result) => result.status);
  assert.deepEqual(statuses, ["CHEMISTRY_INCONSISTENT", "COMPONENT_UNRESOLVED", "CHEMICAL_GROUP_UNRESOLVED", "CHEMISTRY_INCONSISTENT", "EVIDENCE_INSUFFICIENT"]);
  const malformed = input(); malformed.substrate = { outcome: "RESOLVED", provenance: { sourceId: "source-chem" as never }, structureContext: { structureId: "CHEM" }, selectors: { valid: false, issues: [{ path: "bindings[0]", message: "bad" }], resolutions: [] }, fidelity: { accepted: true, decision: {} } } as never; malformed.requests = [{ assertionId: "malformed", bindingId: "dna-1", componentId: "DT", target: "base" }];
  assert.equal(groundLocalChemistry(malformed)[0]?.status, "EVIDENCE_INSUFFICIENT");
});
