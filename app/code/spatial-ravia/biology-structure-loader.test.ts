import assert from "node:assert/strict";
import test from "node:test";

import { StructureGroundingError, type StructureManifestEntry } from "./biology-structure-grounding.ts";
import { clearGroundedStructureCache, loadGroundedStructure } from "./biology-structure-loader.ts";

const entry: StructureManifestEntry = {
  role: "fixture", semanticEntityIds: ["fixture"], provider: "rcsb-pdb", structureId: "FIXTURE",
  assetUrl: "/fixture.pdb", format: "pdb", assemblyId: "1", title: "Fixture", canonicalSystem: "fixture",
  organism: "fixture", sourceUrl: "https://example.test", selectedChains: ["A"],
  renderMode: "residue-centroid-cloud", coarseGrainStride: 1,
  anchors: [{ id: "center", kind: "chain-centroid", chainIds: ["A"] }],
  fallback: { status: "structure-guided", reason: "fixture fallback" },
};
const fixture = "ATOM      1  CA  GLY A   1       1.000   2.000   3.000  1.00 10.00           C\nEND";
const mmcifFixture = `data_META
loop_
_entity.id
_entity.type
1 polymer
loop_
_entity_poly.entity_id
_entity_poly.type
1 'polypeptide(L)'
loop_
_struct_asym.id
_struct_asym.entity_id
AA 1
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_entity_id
_atom_site.label_seq_id
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.auth_asym_id
_atom_site.auth_seq_id
ATOM 1 C CA GLY AA 1 12 1 2 3 A 145
#`;

test("coordinate loader retains provenance, selected assembly, and caches normalized coordinate geometry", async () => {
  clearGroundedStructureCache();
  let calls = 0;
  const load = async () => { calls += 1; return fixture; };
  const first = await loadGroundedStructure(entry, load);
  const second = await loadGroundedStructure(entry, load);
  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.equal(first.groundingStatus, "structure-derived");
  assert.equal(first.provenance.assemblyId, "1");
  assert.equal(first.geometry.residuePoints[0]?.position.x, 0);
});

test("coordinate loader preserves typed coordinate and chain failures", async () => {
  clearGroundedStructureCache();
  await assert.rejects(
    () => loadGroundedStructure(entry, async () => { throw new StructureGroundingError("coordinate-load-failed", "offline"); }),
    (error: unknown) => error instanceof StructureGroundingError && error.code === "coordinate-load-failed"
  );
  clearGroundedStructureCache();
  await assert.rejects(
    () => loadGroundedStructure({ ...entry, selectedChains: ["Z"] }, async () => fixture),
    (error: unknown) => error instanceof StructureGroundingError && error.code === "chain-not-found"
  );
});

test("coordinate loader uses the Mol* mmCIF adapter once and retains normalized aliases", async () => {
  clearGroundedStructureCache();
  let calls = 0;
  const mmcifEntry = {
    ...entry,
    structureId: "META",
    assetUrl: "/meta.cif",
    format: "mmcif" as const,
    selectedChains: ["AA"],
    anchors: [{ id: "center", kind: "chain-centroid" as const, chainIds: ["AA"] }],
  };
  const first = await loadGroundedStructure(mmcifEntry, async () => { calls += 1; return mmcifFixture; });
  const second = await loadGroundedStructure(mmcifEntry, async () => { calls += 1; return mmcifFixture; });
  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.equal(first.structure.chains[0]?.labelAsymId, "AA");
  assert.equal(first.structure.chains[0]?.authAsymId, "A");
  assert.equal(first.structure.chains[0]?.residues[0]?.labelSeqId, 12);
  assert.equal(first.structure.chains[0]?.residues[0]?.authSeqId, 145);
});
