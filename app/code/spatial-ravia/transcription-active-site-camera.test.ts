import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { deriveTranscriptionActiveSiteCutaway, deriveTranscriptionActiveSiteRoi, deriveTranscriptionCameraFrame, pointIsInsideTranscriptionCutaway } from "./transcription-active-site-camera.ts";

function geometry(points: Array<[number, number, number]>) {
  const value = new THREE.BufferGeometry();
  value.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  return value;
}

test("active-site ROI uses deposited nucleic geometry and local protein context, not full protein bounds", () => {
  const roi = deriveTranscriptionActiveSiteRoi({
    proteinGeometry: geometry([[0.4, 0, 0], [0, 0.55, 0], [0, 0, 0.65], [4, 4, 4]]),
    nucleicGeometries: [
      { chainId: "R", visual: "nucleotide-ring", geometry: geometry([[0, 0, 0], [0.1, 0.1, 0], [3, 3, 3]]) },
      { chainId: "A", visual: "nucleotide-ring", geometry: geometry([[0.05, 0, 0]]) },
      { chainId: "B", visual: "nucleotide-ring", geometry: geometry([[0.05, 0.1, 0]]) },
    ],
    scale: 0.01,
  });
  assert.ok(Math.abs(roi.center.x - 0.05) < 1e-5);
  assert.ok(Math.abs(roi.center.y - 0.05) < 1e-5);
  assert.equal(roi.source, "deposited-dna-rna-plus-local-polymerase");
  assert.ok(roi.bounds.max.x < 1);
  assert.ok(roi.radius < 1);
  assert.ok(roi.radius < 0.8);
  assert.ok(roi.proteinVertexFraction < 1);
  assert.ok(roi.proteinVertexFraction < 0.5);
  assert.ok(!roi.nucleicBounds.containsPoint(new THREE.Vector3(3, 3, 3)));
});

test("active-site camera target and fit are deterministic", () => {
  const roi = deriveTranscriptionActiveSiteRoi({
    proteinGeometry: geometry([[0.8, 0.2, 0], [-0.8, -0.2, 0]]),
    nucleicGeometries: [
      { chainId: "R", visual: "nucleotide-ring", geometry: geometry([[0, -0.1, 0], [0, 0.1, 0]]) },
      { chainId: "A", visual: "nucleotide-ring", geometry: geometry([[0.05, -0.1, 0]]) },
      { chainId: "B", visual: "nucleotide-ring", geometry: geometry([[-0.05, 0.1, 0]]) },
    ],
    scale: 0.01,
  });
  const first = deriveTranscriptionCameraFrame({ roi, width: 1280, height: 720 });
  const second = deriveTranscriptionCameraFrame({ roi, width: 1280, height: 720 });
  assert.deepEqual(first.target.toArray(), [0, 0, 0]);
  assert.deepEqual(first.position.toArray(), second.position.toArray());
  assert.equal(first.fov, 34);
  assert.ok(first.distance > 0);
});

test("transcription scene declares the structure-derived active-site camera owner", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  const roiSource = await readFile(new URL("./transcription-active-site-camera.ts", import.meta.url), "utf8");
  assert.match(source, /data-camera-owner="r3f-structure-derived"/);
  assert.match(source, /STRUCTURE_DERIVED_ACTIVE_SITE/);
  assert.match(source, /<TranscriptionCameraRig/);
  assert.match(source, /resolveEukaryoticPolIIStructuralActorPackage/);
  assert.doesNotMatch(source, /TranscriptionDnaTemplate/);
  assert.doesNotMatch(roiSource, /140/);
  assert.match(roiSource, /TRANSCRIPTION_NUCLEIC_CONTACT_DISTANCE_ANGSTROM/);
  assert.match(roiSource, /proteinVertexFraction/);
});

test("active-site ROI accepts eukaryotic Pol II chain identities from the manifest", () => {
  const roi = deriveTranscriptionActiveSiteRoi({
    proteinGeometry: geometry([[0.4, 0, 0], [0, 0.4, 0], [0, 0, 0.4]]),
    nucleicGeometries: [
      { chainId: "N", visual: "nucleotide-ring", geometry: geometry([[0, 0, 0], [0.1, 0.1, 0]]) },
      { chainId: "M", visual: "nucleotide-ring", geometry: geometry([[0.05, 0, 0]]) },
      { chainId: "O", visual: "nucleotide-ring", geometry: geometry([[0.05, 0.1, 0]]) },
    ],
    dnaChainIds: ["M", "O"],
    rnaChainIds: ["N"],
    scale: 0.01,
  });
  assert.equal(roi.source, "deposited-dna-rna-plus-local-polymerase");
  assert.ok(roi.radius > 0);
});

test("active-site cutaway is a bounded front-facing window around deposited nucleic acids", () => {
  const roi = deriveTranscriptionActiveSiteRoi({
    proteinGeometry: geometry([
      [0.4, 0, 0], [0, 0.4, 0], [0, 0, 0.4],
      [2, 2, 2],
    ]),
    nucleicGeometries: [
      { chainId: "R", visual: "nucleotide-ring", geometry: geometry([[0, 0, 0], [0.1, 0, 0]]) },
      { chainId: "A", visual: "nucleotide-ring", geometry: geometry([[0.05, 0, 0]]) },
      { chainId: "B", visual: "nucleotide-ring", geometry: geometry([[0.05, 0.05, 0]]) },
    ],
    scale: 0.01,
  });
  const cutaway = deriveTranscriptionActiveSiteCutaway({ roi, scale: 0.01 });
  assert.ok(cutaway.bounds.containsPoint(roi.center));
  assert.ok(cutaway.viewDirection.length() > 0.99 && cutaway.viewDirection.length() < 1.01);
  assert.ok(pointIsInsideTranscriptionCutaway(roi.center.clone().addScaledVector(cutaway.viewDirection, 0.001), cutaway));
  assert.ok(!pointIsInsideTranscriptionCutaway(roi.center.clone().addScaledVector(cutaway.viewDirection, -0.001), cutaway));
  assert.ok(cutaway.halfExtent.length() < 0.3);
});
