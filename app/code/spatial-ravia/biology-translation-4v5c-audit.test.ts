import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as THREE from "three";

import { expandStructureAssembly, parseMolecularStructureAsync, resolveStructureChain } from "./biology-structure-parser.ts";
import { translation4v5cAudit } from "./biology-translation-4v5c-audit.ts";
import { deriveStructureDerivedContext } from "./StructureDerivedContextGeometry.ts";

test("4V5C assembly 1 and deposited translation-role references resolve deterministically", async () => {
  const structure = await parseMolecularStructureAsync({ structureId: "4V5C", source: "rcsb-pdb", format: "mmcif", text: await readFile("public/spatial-ravia/structures/4V5C.cif", "utf8") });
  const assembly = expandStructureAssembly(structure, "1");
  assert.equal(structure.assemblies?.some((candidate) => candidate.assemblyId === "1"), true);
  assert.equal(assembly.chains.length, 802);
  const mRNA = resolveStructureChain(assembly, translation4v5cAudit.mRNA);
  const a = resolveStructureChain(assembly, translation4v5cAudit.aSiteTRNA);
  const p = resolveStructureChain(assembly, translation4v5cAudit.pSiteTRNA);
  const e = resolveStructureChain(assembly, translation4v5cAudit.eSiteTRNA);
  assert.deepEqual([mRNA.entityId, a.entityId, p.entityId, e.entityId], ["24", "25", "22", "23"]);
  assert.equal(new Set([mRNA.id, a.id, p.id, e.id]).size, 4);
  assert.ok([a, p, e].every((chain) => chain.entityType === "rna"));
});

test("4V5C deposited tRNAs retain explicit anticodon and resolved 3 prime acceptor residue anchors", async () => {
  const structure = expandStructureAssembly(await parseMolecularStructureAsync({ structureId: "4V5C", source: "rcsb-pdb", format: "mmcif", text: await readFile("public/spatial-ravia/structures/4V5C.cif", "utf8") }), "1");
  for (const [site, reference] of Object.entries({ a: translation4v5cAudit.aSiteTRNA, p: translation4v5cAudit.pSiteTRNA, e: translation4v5cAudit.eSiteTRNA }) as Array<["a" | "p" | "e", typeof translation4v5cAudit.aSiteTRNA]>) {
    const chain = resolveStructureChain(structure, reference);
    const mapping = translation4v5cAudit.tRNAResidueAnchors[site];
    const resolve = (ids: readonly number[]) => chain.residues.filter((residue) => ids.includes(residue.labelSeqId ?? -1));
    const anticodon = resolve(mapping.anticodonLabelSeqIds), acceptor = resolve(mapping.acceptorLabelSeqIds);
    assert.equal(anticodon.length, 3);
    assert.equal(acceptor.length, 3);
    const center = (residues: typeof anticodon) => residues.reduce((sum, residue) => sum.add(new THREE.Vector3(...residue.centroid)), new THREE.Vector3()).multiplyScalar(1 / residues.length);
    const axis = center(acceptor).sub(center(anticodon));
    assert.equal(axis.lengthSq() > 1e-6, true);
  }
});

test("4V5C acceptor subsets expose finite deposited atom detail for the focused transfer view", async () => {
  const structure = expandStructureAssembly(await parseMolecularStructureAsync({ structureId: "4V5C", source: "rcsb-pdb", format: "mmcif", text: await readFile("public/spatial-ravia/structures/4V5C.cif", "utf8") }), "1");
  for (const site of ["a", "p"] as const) {
    const chain = resolveStructureChain(structure, translation4v5cAudit[site === "a" ? "aSiteTRNA" : "pSiteTRNA"]);
    const ids = translation4v5cAudit.tRNAResidueAnchors[site].acceptorLabelSeqIds;
    const atoms = chain.residues
      .filter((residue) => (ids as readonly number[]).includes(residue.labelSeqId ?? -1))
      .flatMap((residue) => residue.atoms);
    assert.ok(atoms.length > 0);
    assert.ok(atoms.every((atom) => Number.isFinite(atom.x) && Number.isFinite(atom.y) && Number.isFinite(atom.z) && atom.atomName.length > 0 && atom.element.length > 0));
  }
});

test("4V5C anticodon subsets retain finite deposited atom detail", async () => {
  const structure = expandStructureAssembly(await parseMolecularStructureAsync({ structureId: "4V5C", source: "rcsb-pdb", format: "mmcif", text: await readFile("public/spatial-ravia/structures/4V5C.cif", "utf8") }), "1");
  const chain = resolveStructureChain(structure, translation4v5cAudit.aSiteTRNA);
  const ids = translation4v5cAudit.tRNAResidueAnchors.a.anticodonLabelSeqIds;
  const atoms = chain.residues.filter((residue) => (ids as readonly number[]).includes(residue.labelSeqId ?? -1)).flatMap((residue) => residue.atoms);
  assert.equal(atoms.length > 0, true);
  assert.equal(atoms.every((atom) => Number.isFinite(atom.x) && Number.isFinite(atom.y) && Number.isFinite(atom.z)), true);
});

test("4V5C large and small coordinate groups derive separate nonempty coarse contexts", async () => {
  const structure = expandStructureAssembly(await parseMolecularStructureAsync({ structureId: "4V5C", source: "rcsb-pdb", format: "mmcif", text: await readFile("public/spatial-ravia/structures/4V5C.cif", "utf8") }), "1");
  const pointsFor = (entities: readonly string[]) => structure.chains
    .filter((chain) => entities.includes(chain.entityId ?? ""))
    .flatMap((chain) => chain.residues.filter((_, index) => index % 24 === 0).map((residue) => new THREE.Vector3(...residue.centroid)));
  const large = pointsFor(translation4v5cAudit.largeSubunitEntityIds);
  const small = pointsFor(translation4v5cAudit.smallSubunitEntityIds);
  const largeContext = deriveStructureDerivedContext(large, new THREE.Vector3());
  const smallContext = deriveStructureDerivedContext(small, new THREE.Vector3());
  assert.equal(largeContext.coarseCells.length > 0 && smallContext.coarseCells.length > 0, true);
  assert.notDeepEqual(largeContext.bounds, smallContext.bounds);
  assert.equal(largeContext.coarseCells.every((cell) => Number.isFinite(cell.position.x)), true);
  assert.equal(smallContext.coarseCells.every((cell) => Number.isFinite(cell.position.x)), true);
});
