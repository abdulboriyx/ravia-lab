import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import type { StructureManifestEntry } from "./biology-structure-grounding.ts";
import {
  alignStructureToMechanism,
  deriveStructureGeometry,
  parseMolecularStructure,
  parseMolecularStructureAsync,
  getStructureEntityChains,
  resolveStructureEntity,
  resolveStructureChain,
  resolveStructureAnchors,
  selectStructureChains,
} from "./biology-structure-parser.ts";
import { polymerClassFromMmcif } from "./biology-structure-mmcif.ts";

const pdbFixture = `
ATOM      1  N   GLY A   1      -1.000   0.000   0.000  1.00 10.00           N
ATOM      2  CA  GLY A   1       0.000   0.000   0.000  1.00 10.00           C
ATOM      3  C   GLY A   1       1.000   0.000   0.000  1.00 10.00           C
ATOM      4  P    DA B   1       0.000   1.000   0.000  1.00 10.00           P
ATOM      5  O5'  DA B   1       0.000   1.500   0.000  1.00 10.00           O
ATOM      6  P    DT B   2       2.000   1.000   0.000  1.00 10.00           P
ATOM      7  O5'  DT B   2       2.000   1.500   0.000  1.00 10.00           O
END
`.trim();

const mmcifFixture = `
data_TEST
#
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_comp_id
_atom_site.auth_asym_id
_atom_site.auth_seq_id
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
ATOM 1 C CA GLY A 1 0.0 0.0 0.0
ATOM 2 P P DA B 1 1.0 1.0 0.0
#
`.trim();

const manifest: StructureManifestEntry = {
  role: "test-polymerase",
  semanticEntityIds: ["polymerase"],
  provider: "rcsb-pdb",
  structureId: "TEST",
  assetUrl: "/test.pdb",
  format: "pdb",
  title: "Fixture",
  canonicalSystem: "fixture",
  organism: "fixture",
  sourceUrl: "https://example.test/TEST",
  selectedChains: ["A", "B"],
  renderMode: "residue-centroid-cloud",
  coarseGrainStride: 1,
  anchors: [
    { id: "protein-center", kind: "chain-centroid", chainIds: ["A"] },
    { id: "dna-start", kind: "nucleic-axis", chainId: "B", at: "start", sampleWindow: 1 },
    { id: "dna-end", kind: "nucleic-axis", chainId: "B", at: "end", sampleWindow: 1 },
  ],
  fallback: {
    status: "procedural",
    reason: "fixture",
  },
};

test("parses PDB coordinates into normalized chains and bounds", () => {
  const structure = parseMolecularStructure({
    structureId: "TEST",
    source: "rcsb-pdb",
    format: "pdb",
    text: pdbFixture,
  });
  assert.equal(structure.atoms.length, 7);
  assert.equal(structure.chains.length, 2);
  assert.equal(structure.chains[0]?.id, "A");
  assert.equal(structure.chains[1]?.entityType, "dna");
  assert.equal(Number.isFinite(structure.centroid[0]), true);
  assert.deepEqual(structure.bounds.min, [-1, 0, 0]);
});

test("Mol* normalizes mmCIF chain aliases, entity typing, and numbering", async () => {
  const structure = await parseMolecularStructureAsync({
    structureId: "TEST",
    source: "rcsb-pdb",
    format: "mmcif",
    text: mmcifFixture,
  });
  assert.equal(structure.atoms.length, 2);
  assert.equal(structure.chains[1]?.id, "B");
});

const metadataMmcifFixture = `data_TEST
_entity.id 1
_entity.type polymer
_entity.pdbx_description
;A quoted
multiline protein
;
loop_
_entity_poly.entity_id
_entity_poly.type
1 'polypeptide(L)'
2 polyribonucleotide
3 polydeoxyribonucleotide
4 'polydeoxyribonucleotide/polyribonucleotide hybrid'
loop_
_struct_asym.id
_struct_asym.entity_id
AA 1
BA 2
BB 3
CA 4
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_entity_id
_atom_site.label_seq_id
_atom_site.pdbx_PDB_ins_code
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.occupancy
_atom_site.B_iso_or_equiv
_atom_site.auth_seq_id
_atom_site.auth_comp_id
_atom_site.auth_asym_id
_atom_site.auth_atom_id
_atom_site.pdbx_PDB_model_num
ATOM 1 C CA GLY AA 1 12 ? 1 2 3 1.00 10.0 145 GLY A CA 1
ATOM 2 P P U BA 2 8 . 4 5 6 ? . 19 U B P 1
#`;

test("Mol* mmCIF adapter preserves multi-character aliases and authoritative polymer metadata", async () => {
  const structure = await parseMolecularStructureAsync({ structureId: "META", source: "rcsb-pdb", format: "mmcif", text: metadataMmcifFixture });
  const protein = resolveStructureChain(structure, { namespace: "label", id: "AA" });
  assert.equal(protein.authAsymId, "A");
  assert.equal(protein.entityId, "1");
  assert.equal(protein.entityType, "protein");
  assert.equal(resolveStructureChain(structure, { namespace: "auth", id: "B" }).id, "BA");
  assert.equal(protein.residues[0]?.labelSeqId, 12);
  assert.equal(protein.residues[0]?.authSeqId, 145);
  assert.equal(structure.entities?.find((entity) => entity.entityId === "1")?.description?.includes("multiline"), true);
  assert.equal(resolveStructureEntity(structure, "2").polymerClass, "rna");
  assert.equal(getStructureEntityChains(structure, "1")[0]?.id, "AA");
  assert.throws(
    () => resolveStructureChain({ ...structure, chains: [...structure.chains, { ...protein, id: "AA-copy" }] }, { namespace: "auth", id: "A" }),
    (error: unknown) => (error as { code?: string }).code === "ambiguous-chain-reference"
  );
  assert.throws(
    () => resolveStructureChain(structure, { namespace: "label", id: "missing" }),
    (error: unknown) => (error as { code?: string }).code === "chain-not-found"
  );
});

test("mmCIF authoritative polymer classes do not rely on residue-name guesses", () => {
  assert.equal(polymerClassFromMmcif("polypeptide(L)"), "protein");
  assert.equal(polymerClassFromMmcif("polyribonucleotide"), "rna");
  assert.equal(polymerClassFromMmcif("polydeoxyribonucleotide"), "dna");
  assert.equal(polymerClassFromMmcif("polydeoxyribonucleotide/polyribonucleotide hybrid"), "hybrid");
  assert.equal(polymerClassFromMmcif(undefined), "unknown");
});

test("chain selection keeps requested chains and rejects missing ones", () => {
  const structure = parseMolecularStructure({
    structureId: "TEST",
    source: "rcsb-pdb",
    format: "pdb",
    text: pdbFixture,
  });
  const selected = selectStructureChains(structure, ["B"]);
  assert.equal(selected.chains.length, 1);
  assert.equal(selected.chains[0]?.id, "B");
  assert.throws(() => selectStructureChains(structure, ["Z"]), /Missing requested chains/);
});

test("geometry derivation depends on input coordinates deterministically", () => {
  const structure = selectStructureChains(
    parseMolecularStructure({
      structureId: "TEST",
      source: "rcsb-pdb",
      format: "pdb",
      text: pdbFixture,
    }),
    ["A", "B"]
  );
  const geometryA = deriveStructureGeometry(structure, manifest);
  const shifted = parseMolecularStructure({
    structureId: "TEST",
    source: "rcsb-pdb",
    format: "pdb",
    text: pdbFixture.replace("  2.000   1.000   0.000", "  4.000   1.000   0.000"),
  });
  const geometryB = deriveStructureGeometry(shifted, manifest);
  assert.equal(geometryA.residuePoints.length > 0, true);
  const dnaEndA = geometryA.anchors.find((anchor) => anchor.id === "dna-end");
  const dnaEndB = geometryB.anchors.find((anchor) => anchor.id === "dna-end");
  assert.ok(dnaEndA);
  assert.ok(dnaEndB);
  assert.equal(dnaEndA!.point.x === dnaEndB!.point.x, false);
  assert.equal(Number.isFinite(geometryA.bounds.min.x), true);
  assert.ok(geometryA.centroid.lengthSq() < 0.000001);
  assert.ok(geometryA.residuePoints.every((point) => point.position.length() < 4));
});

test("anchors and alignment resolve from structural evidence", () => {
  const structure = selectStructureChains(
    parseMolecularStructure({
      structureId: "TEST",
      source: "rcsb-pdb",
      format: "pdb",
      text: pdbFixture,
    }),
    ["A", "B"]
  );
  const anchors = resolveStructureAnchors(structure, manifest.anchors);
  const start = anchors.find((anchor) => anchor.id === "dna-start");
  const end = anchors.find((anchor) => anchor.id === "dna-end");
  assert.ok(start);
  assert.ok(end);
  assert.equal(start!.direction.length() > 0.9, true);

  const aligned = alignStructureToMechanism({
    sourceAnchor: start!,
    targetAnchor: new THREE.Vector3(5, 0, 0),
    sourceDirection: start!.direction,
    targetDirection: new THREE.Vector3(0, 1, 0),
  });
  const mapped = start!.point.clone().applyQuaternion(aligned.quaternion).add(aligned.position);
  assert.ok(mapped.distanceTo(new THREE.Vector3(5, 0, 0)) < 0.0001);
});

test("alignment rejects a zero-length PCA-like direction", () => {
  const anchor = { id: "origin", point: new THREE.Vector3(), direction: new THREE.Vector3(1, 0, 0) };
  assert.throws(() => alignStructureToMechanism({
    sourceAnchor: anchor,
    targetAnchor: new THREE.Vector3(),
    sourceDirection: new THREE.Vector3(),
    targetDirection: new THREE.Vector3(1, 0, 0),
  }), /not finite/);
});

test("nucleic anchors avoid NaN directions for coincident endpoint coordinates", () => {
  const structure = selectStructureChains(
    parseMolecularStructure({
      structureId: "TEST",
      source: "rcsb-pdb",
      format: "pdb",
      text: pdbFixture,
    }),
    ["B"]
  );
  // Model an occasional short deposited fragment whose terminal phosphates
  // occupy the same selected coordinate.
  const chain = structure.chains[0]!;
  chain.residues[1]!.atoms.forEach((atom) => { atom.x = 0; atom.y = 1; atom.z = 0; });
  chain.residues[1]!.centroid = [0, 1, 0];
  const [anchor] = resolveStructureAnchors(structure, [
    { id: "coincident-end", kind: "nucleic-axis", chainId: "B", at: "start", sampleWindow: 1 },
  ]);
  assert.ok(anchor);
  assert.equal(Number.isFinite(anchor!.direction.x), true);
  assert.equal(Number.isFinite(anchor!.direction.y), true);
  assert.equal(Number.isFinite(anchor!.direction.z), true);
  assert.ok(anchor!.direction.lengthSq() > 0.9);
});
