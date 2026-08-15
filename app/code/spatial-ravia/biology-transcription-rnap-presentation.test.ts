import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  deriveTranscriptionRnapPresentation,
  rnapPresentationWorldSpan,
  schematicRnapFallbackShape,
  transcriptionRnapPresentationPolicy,
} from "./biology-transcription-rnap-presentation.ts";
import type { StructureDerivedGeometry } from "./biology-structure-grounding.ts";

const geometry: StructureDerivedGeometry = {
  residuePoints: [
    { position: new THREE.Vector3(-18, 15, 12), chainId: "G", entityType: "protein" },
    { position: new THREE.Vector3(-8, 12, 15), chainId: "G", entityType: "protein" },
    { position: new THREE.Vector3(-17, -15, 12), chainId: "H", entityType: "protein" },
    { position: new THREE.Vector3(-8, -12, 15), chainId: "H", entityType: "protein" },
    { position: new THREE.Vector3(17, 15, -12), chainId: "I", entityType: "protein" },
    { position: new THREE.Vector3(8, 12, -15), chainId: "I", entityType: "protein" },
    { position: new THREE.Vector3(17, -15, -12), chainId: "J", entityType: "protein" },
    { position: new THREE.Vector3(8, -12, -15), chainId: "J", entityType: "protein" },
    // A deliberately distant assembly residue: it must not inflate the local RNAP body.
    { position: new THREE.Vector3(180, 120, 95), chainId: "K", entityType: "protein" },
  ],
  tracePaths: [],
  anchors: [
    { id: "upstream-dna", point: new THREE.Vector3(-12, 0, 0), direction: new THREE.Vector3(1, 0, 0) },
    { id: "downstream-dna", point: new THREE.Vector3(12, 0, 0), direction: new THREE.Vector3(1, 0, 0) },
    { id: "active-center", point: new THREE.Vector3(0, 0, 0), direction: new THREE.Vector3(1, 0, 0) },
  ],
  centroid: new THREE.Vector3(),
  bounds: { min: new THREE.Vector3(-18, -15, -15), max: new THREE.Vector3(180, 120, 95) },
};

test("6ALH RNAP presentation derives compact source-aligned lobes and an open DNA cleft", () => {
  const presentation = deriveTranscriptionRnapPresentation(geometry);

  assert.equal(presentation.source, "6ALH");
  assert.equal("body" in presentation, false, "the presentation must not recreate a global enclosing hull");
  assert.ok(presentation.lobes.length >= 2);
  assert.ok(presentation.cleft.axis.dot(new THREE.Vector3(1, 0, 0)) > 0.99);
  assert.ok(presentation.cleft.length > 0 && presentation.cleft.radius > 0);
  assert.ok([
    ...presentation.lobes.flatMap((lobe) => [lobe.center, lobe.radii]),
    presentation.cleft.center,
    presentation.sourceBounds.min,
    presentation.sourceBounds.max,
  ].every((point) => point.toArray().every(Number.isFinite)));
});

test("RNAP local body excludes distant assembly mass and obeys the DNA-ROI size policy", () => {
  const presentation = deriveTranscriptionRnapPresentation(geometry);
  const sourceSpan = presentation.sourceBounds.max.clone().sub(presentation.sourceBounds.min).length();
  assert.ok(sourceSpan < transcriptionRnapPresentationPolicy.activeSiteRadius * 2);

  // The 52 bp transcription teaching duplex is about 9 world units wide.
  const rnapPrimarySpan = rnapPresentationWorldSpan(
    presentation,
    transcriptionRnapPresentationPolicy.groundedWorldScale * 2.25,
  );
  assert.ok(rnapPrimarySpan < 9 * transcriptionRnapPresentationPolicy.maximumDnaRoiFraction);
});

test("RNAP cleft remains a non-zero local corridor", () => {
  const presentation = deriveTranscriptionRnapPresentation(geometry);
  assert.ok(presentation.cleft.radius >= transcriptionRnapPresentationPolicy.cleftRadius);
  assert.ok(presentation.cleft.length >= transcriptionRnapPresentationPolicy.cleftLength);
  assert.ok(presentation.lobes.every((lobe) => lobe.radii.length() > 0));
  assert.ok(presentation.lobes.length <= transcriptionRnapPresentationPolicy.maximumLobes);
  for (const lobe of presentation.lobes) {
    const offset = lobe.center.clone().sub(presentation.cleft.center);
    const along = offset.dot(presentation.cleft.axis);
    const radialDistance = offset.sub(presentation.cleft.axis.clone().multiplyScalar(along)).length();
    assert.ok(radialDistance - Math.max(lobe.radii.x, lobe.radii.y, lobe.radii.z) > presentation.cleft.radius);
  }
});

test("RNAP lobe calibration keeps a compact, coherent local body", () => {
  const presentation = deriveTranscriptionRnapPresentation(geometry);
  const lobeCenter = presentation.lobes
    .reduce((sum, lobe) => sum.add(lobe.center), new THREE.Vector3())
    .multiplyScalar(1 / presentation.lobes.length);
  assert.ok(presentation.lobes.every((lobe) => lobe.center.distanceTo(lobeCenter) < 35));
  assert.ok(presentation.lobes.every((lobe) => Math.max(lobe.radii.x, lobe.radii.y, lobe.radii.z) <= transcriptionRnapPresentationPolicy.maxLobeRadius));
});

test("schematic fallback remains one compact cleft-shaped enzyme body", () => {
  assert.equal(schematicRnapFallbackShape.bodyScale.length, 3);
  assert.ok(schematicRnapFallbackShape.bodyRadius > schematicRnapFallbackShape.cleftRadius);
  assert.ok(schematicRnapFallbackShape.cleftLength > 0);
});
