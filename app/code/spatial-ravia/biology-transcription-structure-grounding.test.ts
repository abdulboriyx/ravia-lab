import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { loadGroundedStructure, clearGroundedStructureCache } from "./biology-structure-loader.ts";
import { createTranscriptionStructureTransform, resolveTranscriptionStructureGrounding } from "./biology-transcription-structure-grounding.ts";

test("transcription manifest selects the deposited E. coli elongation complex", () => {
  const entry = resolveTranscriptionStructureGrounding();
  assert.ok(entry);
  assert.equal(entry.structureId, "6ALH");
  assert.deepEqual(entry.selectedChains, ["A", "B", "R", "G", "H", "I", "J", "K"]);
  assert.deepEqual(entry.chainEntityTypes, { A: "dna", B: "dna", R: "rna", G: "protein", H: "protein", I: "protein", J: "protein", K: "protein" });
  assert.equal(entry.fallback.status, "structure-guided");
});

test("6ALH yields finite DNA and RNA anchors from deposited coordinates", async () => {
  const entry = resolveTranscriptionStructureGrounding();
  assert.ok(entry);
  clearGroundedStructureCache();
  const loaded = await loadGroundedStructure(entry, async () =>
    readFileSync(new URL("../../../public/spatial-ravia/structures/6ALH.pdb", import.meta.url), "utf8")
  );
  assert.equal(loaded.structure.chains.find((chain) => chain.id === "A")?.entityType, "dna");
  assert.equal(loaded.structure.chains.find((chain) => chain.id === "R")?.entityType, "rna");
  assert.ok(loaded.geometry.residuePoints.length > 1000);
  const anchors = ["upstream-dna", "downstream-dna", "rna-exit"].map((id) => loaded.geometry.anchors.find((anchor) => anchor.id === id));
  assert.ok(anchors.every(Boolean));
  assert.ok(anchors.every((anchor) => anchor!.direction.lengthSq() > 0.01));
  assert.ok(anchors.every((anchor) => anchor!.point.toArray().every(Number.isFinite)));
});

test("transcription transform aligns coordinate DNA direction to mechanism tangent", () => {
  const transform = createTranscriptionStructureTransform({
    sourceAnchor: { point: new THREE.Vector3(1, 0, 0), direction: new THREE.Vector3(1, 0, 0) },
    targetAnchor: new THREE.Vector3(2, 3, 4),
    targetDirection: new THREE.Vector3(0, 1, 0),
    scale: 0.02,
  });
  assert.ok(transform.quaternion.x === transform.quaternion.x);
  assert.ok(new THREE.Vector3(1, 0, 0).applyQuaternion(transform.quaternion).distanceTo(new THREE.Vector3(0, 1, 0)) < 0.0001);
});
