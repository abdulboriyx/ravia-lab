import assert from "node:assert/strict";
import test from "node:test";

import * as THREE from "three";
import {
  dnaPolymeraseComplexDefinition,
  getStateAdjustedDomain,
  resolveProteinAttachmentPoint,
  rnaPolymeraseComplexDefinition,
  validateProteinComplexDefinition,
} from "./ProteinComplexDefinitions.ts";

test("protein complex definitions contain valid declarative domain geometry", () => {
  for (const definition of [
    rnaPolymeraseComplexDefinition,
    dnaPolymeraseComplexDefinition,
  ]) {
    const validation = validateProteinComplexDefinition(definition);
    assert.equal(validation.ok, true, validation.reason);
    assert.ok(definition.domains.length >= 4);
    assert.ok(definition.channels && definition.channels.length >= 1);
    assert.ok(definition.attachmentPoints && definition.attachmentPoints.length >= 2);
  }
});

test("RNA polymerase exposes distinct DNA channel and RNA exit attachment points", () => {
  const dnaEntry = resolveProteinAttachmentPoint(
    rnaPolymeraseComplexDefinition,
    "dna-entry"
  );
  const dnaExit = resolveProteinAttachmentPoint(
    rnaPolymeraseComplexDefinition,
    "dna-exit"
  );
  const rnaExit = resolveProteinAttachmentPoint(
    rnaPolymeraseComplexDefinition,
    "rna-exit"
  );

  assert.ok(dnaEntry);
  assert.ok(dnaExit);
  assert.ok(rnaExit);
  assert.ok(dnaEntry.distanceTo(dnaExit) > 0.9);
  assert.ok(rnaExit.distanceTo(dnaEntry) > 0.45);
});

test("attachment point resolution applies world transform", () => {
  const position = new THREE.Vector3(1, 2, 3);
  const quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    Math.PI / 2
  );
  const resolved = resolveProteinAttachmentPoint(
    dnaPolymeraseComplexDefinition,
    "template-entry",
    { position, quaternion, scale: 2 }
  );

  assert.ok(resolved);
  assert.ok(resolved.distanceTo(position) > 0.6);
  assert.ok(Number.isFinite(resolved.x));
  assert.ok(Number.isFinite(resolved.y));
  assert.ok(Number.isFinite(resolved.z));
});

test("state modifiers adjust domains without mutating definitions", () => {
  const original = rnaPolymeraseComplexDefinition.domains.find(
    (domain) => domain.id === "clamp"
  );
  assert.ok(original);

  const adjusted = getStateAdjustedDomain(
    rnaPolymeraseComplexDefinition,
    original,
    "open"
  );

  assert.notDeepEqual(adjusted.position, original.position);
  assert.deepEqual(
    rnaPolymeraseComplexDefinition.domains.find((domain) => domain.id === "clamp")?.position,
    original.position
  );
});
