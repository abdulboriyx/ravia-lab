import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { deriveStructureDerivedContext, selectStructureContextCells } from "./StructureDerivedContextGeometry.ts";

const points = [
  new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(-0.22, 0.02, 0), new THREE.Vector3(-0.05, 0, 0),
  new THREE.Vector3(0.18, 0.03, 0), new THREE.Vector3(0.38, 0, 0), new THREE.Vector3(0.04, 0.15, 0),
];

test("coarse structure context is finite, coordinate-derived, and bounded by its source", () => {
  const context = deriveStructureDerivedContext(points, new THREE.Vector3());
  assert.equal(context.coarseCells.length > 0, true);
  assert.equal(context.coarseCellSize > context.localCellSize, true);
  assert.equal(context.bounds.min.x <= -0.4 && context.bounds.max.x >= 0.38, true);
  assert.equal(context.coarseCells.every((cell) => Number.isFinite(cell.position.x) && cell.weight > 0), true);
});

test("context LOD keeps a quiet minimum form and enables additional local detail", () => {
  const context = deriveStructureDerivedContext(points, new THREE.Vector3());
  const minimal = selectStructureContextCells(context, "minimal", new THREE.Vector3(2, 2, 2));
  const coarse = selectStructureContextCells(context, "coarse", new THREE.Vector3(2, 2, 2));
  const enhanced = selectStructureContextCells(context, "local-enhanced", new THREE.Vector3(2, 2, 2));
  assert.equal(minimal.length < coarse.length, true);
  assert.equal(enhanced.length > coarse.length, true);
  assert.equal(selectStructureContextCells(context, "hidden", new THREE.Vector3()).length, 0);
});

test("active-region cutaway removes local context cells rather than hiding actors", () => {
  const context = deriveStructureDerivedContext(points, new THREE.Vector3());
  const visible = selectStructureContextCells(context, "local-enhanced", new THREE.Vector3());
  assert.equal(visible.every((cell) => cell.position.distanceToSquared(new THREE.Vector3()) > 0.2 * 0.2), true);
});
