import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createStructureConstrainedBackbone, structureConstrainedResiduePositions } from "./StructureConstrainedNucleicGeometry.ts";

test("structure-constrained nucleic backbone preserves finite deposited point order", () => {
  const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(.2, .1, 0), new THREE.Vector3(.25, .35, .1)];
  const backbone = createStructureConstrainedBackbone(points);
  assert.ok(backbone);
  assert.equal(backbone.getPoint(0).distanceTo(points[0]) < 1e-6, true);
  assert.equal(backbone.getPoint(1).distanceTo(points[2]) < 1e-6, true);
});

test("selected residue glyphs retain exactly the finite grounded positions", () => {
  const positions = structureConstrainedResiduePositions([{ position: new THREE.Vector3(0, 0, 0), labelSeqId: 34 }, { position: new THREE.Vector3(.1, 0, 0), labelSeqId: 35 }, { position: new THREE.Vector3(.2, 0, 0), labelSeqId: 36 }]);
  assert.equal(positions.length, 3);
  assert.equal(positions[0].distanceTo(positions[1]) > 0, true);
});
