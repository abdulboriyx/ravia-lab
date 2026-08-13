import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import { parseBiologyScenePrompt } from "./biology-parser.ts";
import {
  createStructureAlignmentQuaternion,
  createStructureTransform,
  getReplicationStructureProvenance,
  replicationStructureManifest,
  resolveReplicationStructureGrounding,
} from "./biology-replication-structure-grounding.ts";

function supportedScene(prompt: string) {
  const result = parseBiologyScenePrompt(prompt);
  assert.equal(result.status, "supported", prompt);
  return result.scene;
}

test("replication structure manifest resolves semantic roles deterministically", () => {
  assert.equal(replicationStructureManifest.length, 2);
  assert.equal(resolveReplicationStructureGrounding("replicative-helicase")?.structureId, "9DLS");
  assert.equal(resolveReplicationStructureGrounding("dna-polymerase")?.structureId, "3BDP");
  assert.equal(resolveReplicationStructureGrounding("bound-dna"), null);
});

test("replication structure provenance retains grounding mode and selected chains", () => {
  const provenance = getReplicationStructureProvenance("hybrid");
  assert.deepEqual(
    provenance.map((entry) => entry.structureId),
    ["9DLS", "3BDP"]
  );
  assert.deepEqual(provenance[0]?.selectedChains, ["A", "B", "C", "D", "E", "F", "G"]);
  assert.equal(provenance[1]?.groundingStatus, "hybrid");
});

test("alignment quaternion and transform stay finite", () => {
  const quaternion = createStructureAlignmentQuaternion({
    sourceDirection: new THREE.Vector3(1, 0, 0),
    targetDirection: new THREE.Vector3(0, 1, 0),
  });
  assert.ok(Math.abs(quaternion.length() - 1) < 0.00001);

  const grounding = resolveReplicationStructureGrounding("dna-polymerase");
  assert.ok(grounding);
  const transform = createStructureTransform({
    grounding,
    sourceAnchor: {
      point: new THREE.Vector3(0.25, 0, 0),
      direction: new THREE.Vector3(1, 0, 0),
    },
    targetAnchor: new THREE.Vector3(1, 2, 3),
    targetDirection: new THREE.Vector3(0, 1, 0),
    scale: 0.5,
  });
  assert.equal(transform.position.distanceTo(new THREE.Vector3(1, 1.875, 3)) < 0.001, true);
  assert.equal(transform.scale, 0.5);
  assert.equal(transform.fallbackUsed, false);
});

test("degenerate alignment directions use an identity quaternion", () => {
  const quaternion = createStructureAlignmentQuaternion({
    sourceDirection: new THREE.Vector3(),
    targetDirection: new THREE.Vector3(1, 0, 0),
  });
  assert.deepEqual(quaternion.toArray(), [0, 0, 0, 1]);
});

test("structure-grounded canonical replication scenes keep temporal mechanism", () => {
  const scene = supportedScene("show DNA replication");
  assert.ok(scene.temporal);
  assert.ok(scene.entities.some((entity) => entity.id === "helicase"));
  assert.ok(scene.entities.some((entity) => entity.id === "polymerase"));
  assert.ok(scene.actions.some((action) => action.actor === "helicase" && action.action === "unwinds"));
  assert.ok(scene.actions.some((action) => action.actor === "polymerase" && action.action === "synthesizes"));
});

test("focused replication prompts still route after generic structure grounding", () => {
  for (const prompt of [
    "show helicase opening DNA",
    "show leading strand synthesis",
    "show lagging strand synthesis",
    "show how Okazaki fragments are made",
    "show ligase joining Okazaki fragments",
  ]) {
    const scene = supportedScene(prompt);
    assert.equal(scene.renderMode, "mechanistic-3d", prompt);
  }
});
