import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createStructureConstrainedPeptidePath, deriveTransferCarrierPresentation, deriveTranslationPeptideCarrier, deriveTranslationTrnaTransforms } from "./biology-translation-actor-geometry.ts";
import { getTranslationMotionState } from "./biology-motion-state.ts";
import type { GroundedTranslation, GroundedTranslationSite } from "./biology-translation-structure-grounding.ts";

const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const site = (position: THREE.Vector3, anticodon: THREE.Vector3, acceptor: THREE.Vector3, rotation = new THREE.Quaternion()) : GroundedTranslationSite => ({ position, anticodon, acceptor, quaternion: rotation, trace: [anticodon, position, acceptor] });
const grounded: GroundedTranslation = {
  ribosome: { large: [point(-1, 0, 0)], small: [point(1, 0, 0)] }, mrna: [point(0, 0, 0), point(.1, 0, 0)], codonContact: point(0, 0, 0),
  activeResidues: { anticodon: { a: [], p: [], e: [] }, acceptor: { a: [], p: [], e: [] }, codon: [] },
  activeAtoms: { acceptor: { a: [], p: [], e: [] }, anticodon: { a: [], p: [], e: [] }, codon: [], status: "atom-derived" },
  peptidylTransferCenter: point(0, .5, 0), peptideExit: { position: point(0, .8, 0), direction: point(0, 1, 0) },
  sites: { a: site(point(.3, .1, 0), point(.2, 0, 0), point(.3, .4, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), .4)), p: site(point(-.3, .1, 0), point(-.2, 0, 0), point(-.3, .4, 0)), e: site(point(-.7, 0, 0), point(-.7, -.1, 0), point(-.7, .25, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -.4)) },
};
const frame = (phaseId: string, phaseProgress: number) => ({ timeMs: 0, phaseId, phaseLabel: phaseId, phaseIndex: 0, phaseDurationMs: 1, phaseProgress, normalizedTime: phaseProgress, state: {} });

test("structure-constrained peptide root follows the P then A carrier", () => {
  const before = deriveTranslationPeptideCarrier(grounded, getTranslationMotionState(frame("codon-recognition", .5)));
  const after = deriveTranslationPeptideCarrier(grounded, getTranslationMotionState(frame("peptide-transfer", .9)));
  assert.equal(before.root.distanceTo(grounded.sites.p.acceptor) < 1e-6, true);
  assert.equal(after.root.distanceTo(grounded.sites.a.acceptor) < .12, true);
  assert.equal(createStructureConstrainedPeptidePath(grounded, getTranslationMotionState(frame("peptide-transfer", .9))).points[0].distanceTo(after.root) < 1e-6, true);
});

test("A to P and P to E transforms interpolate finite structural orientations", () => {
  const motion = getTranslationMotionState(frame("translocation", .5));
  const transforms = deriveTranslationTrnaTransforms(grounded, motion);
  assert.equal(transforms.peptidylPosition.distanceTo(grounded.sites.a.position) > 0, true);
  assert.equal(transforms.peptidylPosition.distanceTo(grounded.sites.p.position) > 0, true);
  assert.equal(transforms.peptidylQuaternion.angleTo(grounded.sites.a.quaternion) > 0, true);
  assert.equal(Number.isFinite(transforms.exitingQuaternion.x) && Number.isFinite(transforms.exitingQuaternion.w), true);
});

test("transfer-focus peptide path remains carrier-local and bounded", () => {
  const motion = getTranslationMotionState(frame("peptide-transfer", .45));
  const path = createStructureConstrainedPeptidePath(grounded, motion, { transferFocus: true });
  assert.equal(path.externalSampleCount, 3);
  assert.equal(path.points[0].distanceTo(path.carrier.root) < 1e-8, true);
  assert.equal(path.points.every((value) => Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)), true);
  assert.equal(path.points.slice(1).every((value) => value.distanceTo(path.points[0]) < .8), true);
});

test("transfer presentation retains two site identities while carrier roles change", () => {
  const before = deriveTransferCarrierPresentation(getTranslationMotionState(frame("peptide-transfer", .2)));
  const during = deriveTransferCarrierPresentation(getTranslationMotionState(frame("peptide-transfer", .5)));
  const after = deriveTransferCarrierPresentation(getTranslationMotionState(frame("peptide-transfer", .8)));
  assert.deepEqual(before, { stage: "before", aRole: "aminoacyl", pRole: "peptidyl" });
  assert.deepEqual(during, { stage: "during", aRole: "acceptor", pRole: "donor" });
  assert.deepEqual(after, { stage: "after", aRole: "peptidyl", pRole: "deacylated" });
});
