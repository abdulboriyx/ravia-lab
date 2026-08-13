import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { centerOfSelectedAtoms, deriveConservativeAtomBonds, selectReactionAtomIndices, type SelectedMolecularAtom } from "./SelectedResidueDetailGeometry.ts";

const atoms: SelectedMolecularAtom[] = [
  { position: new THREE.Vector3(1, 2, 3), element: "P", atomName: "P", residueName: "A" },
  { position: new THREE.Vector3(1.12, 2, 3), element: "O", atomName: "O3'", residueName: "A" },
];

test("selected local atom detail stays finite, local, and conservatively bonded", () => {
  const center = centerOfSelectedAtoms(atoms);
  assert.ok(center);
  assert.equal(center.distanceTo(new THREE.Vector3(1.06, 2, 3)) < 1e-6, true);
  assert.equal(deriveConservativeAtomBonds(atoms).length, 1);
  assert.deepEqual(selectReactionAtomIndices(atoms, new THREE.Vector3(1.11, 2, 3), 1), [1]);
});
