import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { getTranslationMotionState } from "./biology-motion-state.ts";
import { translationScene } from "./biology-scene-builders.ts";
import { getInitialTimeMs, getTemporalFrame } from "./biology-timeline.ts";
import { deriveTransferOwnershipLabelAnchors, deriveTranslationRepresentationPlan, translationVisualScalePolicy } from "./biology-translation-representation-plan.ts";
import type { GroundedTranslation, GroundedTranslationSite } from "./biology-translation-structure-grounding.ts";

const vector = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const site = (position: THREE.Vector3, anticodon: THREE.Vector3, acceptor: THREE.Vector3): GroundedTranslationSite => ({
  position,
  anticodon,
  acceptor,
  quaternion: new THREE.Quaternion(),
  trace: [anticodon, position, acceptor],
});

const grounding: GroundedTranslation = {
  ribosome: { large: [vector(-1, 0, 0)], small: [vector(1, 0, 0)] },
  mrna: [vector(-0.4, -0.1, 0), vector(0, 0, 0), vector(0.4, 0.1, 0)],
  codonContact: vector(0.1, 0, 0),
  activeResidues: {
    anticodon: { a: [vector(0.08, 0, 0), vector(0.1, 0, 0), vector(0.12, 0, 0)].map((position) => ({ position })), p: [vector(-0.2, 0, 0)].map((position) => ({ position })), e: [vector(-0.45, 0, 0)].map((position) => ({ position })) },
    acceptor: { a: [vector(0.22, 0.36, 0), vector(0.24, 0.36, 0), vector(0.26, 0.36, 0)].map((position) => ({ position })), p: [vector(-0.1, 0.34, 0), vector(-0.08, 0.34, 0), vector(-0.06, 0.34, 0)].map((position) => ({ position })), e: [vector(-0.48, 0.26, 0)].map((position) => ({ position })) },
    codon: [vector(0.08, 0, 0), vector(0.1, 0, 0), vector(0.12, 0, 0)].map((position) => ({ position })),
  },
  activeAtoms: {
    acceptor: { a: [vector(.22, .36, 0)].map((position) => ({ position, element: "O", atomName: "O3'", residueName: "A" })), p: [vector(-.1, .34, 0)].map((position) => ({ position, element: "O", atomName: "O3'", residueName: "A" })), e: [] },
    anticodon: { a: [], p: [], e: [] },
    codon: [], status: "atom-derived",
  },
  peptidylTransferCenter: vector(0.08, 0.35, 0),
  peptideExit: { position: vector(-0.02, 0.68, 0.08), direction: vector(0, 1, 0) },
  sites: {
    a: site(vector(0.2, 0.16, 0), vector(0.1, 0, 0), vector(0.24, 0.36, 0)),
    p: site(vector(-0.12, 0.14, 0), vector(-0.2, 0, 0), vector(-0.08, 0.34, 0)),
    e: site(vector(-0.48, 0.08, 0), vector(-0.45, 0, 0), vector(-0.48, 0.26, 0)),
  },
};

const frame = (phaseId: string, phaseProgress = 0.5) => ({ timeMs: 0, phaseId, phaseLabel: phaseId, phaseIndex: 0, phaseDurationMs: 1, phaseProgress, normalizedTime: phaseProgress, state: {} });
const finite = (point: THREE.Vector3) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);

test("representation plans derive anchor-based ROI and camera frames", () => {
  const transfer = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("peptide-transfer")), "transfer");
  const recognition = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("codon-recognition")), "recognition");
  const translocation = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("translocation")), "translocation");
  assert.equal(finite(transfer.roi.center), true);
  assert.equal(transfer.roi.radius > 0, true);
  assert.equal(transfer.roi.center.distanceTo(grounding.peptidylTransferCenter) < 0.25, true);
  assert.equal(recognition.roi.center.distanceTo(grounding.codonContact) < 0.2, true);
  assert.equal(translocation.roi.keyAnchors.aSite.equals(grounding.sites.a.position), true);
  assert.equal(translocation.roi.keyAnchors.pSite.equals(grounding.sites.p.position), true);
  assert.equal(translocation.roi.keyAnchors.eSite.equals(grounding.sites.e.position), true);
  assert.equal(transfer.camera.target.equals(transfer.roi.center), true);
  assert.equal(transfer.camera.position.distanceTo(transfer.camera.target) > 0, true);
  assert.equal(recognition.camera.fov < translocation.camera.fov, true);
  const transferBefore = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("peptide-transfer", 0.1)), "transfer");
  const transferAfter = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("peptide-transfer", 0.9)), "transfer");
  assert.equal(transferBefore.camera.target.equals(transferAfter.camera.target), true);
  assert.equal(transferBefore.camera.position.equals(transferAfter.camera.position), true);
  assert.equal(transferBefore.camera.fov, transferAfter.camera.fov);
  assert.ok(transfer.reactionROI.radius <= transfer.roi.radius);
  assert.ok(transfer.roi.radius >= 0.3);
  assert.ok(transfer.roi.keyAnchors.aAcceptor.distanceTo(transfer.roi.center) <= transfer.roi.radius + 0.4);
  assert.ok(transfer.roi.keyAnchors.pAcceptor.distanceTo(transfer.roi.center) <= transfer.roi.radius + 0.4);
  const labels = deriveTransferOwnershipLabelAnchors(grounding, transfer.camera);
  assert.equal(finite(labels.a) && finite(labels.p), true);
  assert.equal(labels.a.distanceTo(labels.p) > 0.1, true);
  assert.equal(labels.a.distanceTo(grounding.peptidylTransferCenter) > 0.05, true);
  assert.equal(labels.p.distanceTo(grounding.peptidylTransferCenter) > 0.05, true);
});

test("composition and annotation plans remain phase-consistent", () => {
  const transfer = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("peptide-transfer")), "transfer");
  const recognition = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("codon-recognition")), "recognition");
  const translocation = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("translocation")), "translocation");
  const termination = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("termination")), "termination");
  assert.deepEqual([transfer.actors.aTrna, transfer.actors.pTrna, transfer.actors.eTrna], ["primary", "primary", "hidden"]);
  assert.equal(transfer.activeSite.ptc, true);
  assert.equal(transfer.annotations.peptideTransfer, true);
  assert.equal(recognition.activeSite.codon, true);
  assert.equal(recognition.activeSite.anticodon, true);
  assert.equal(recognition.annotations.peptideTransfer, false);
  assert.equal(translocation.annotations.sites, true);
  assert.equal(translocation.annotations.peptideTransfer, false);
  assert.equal(termination.actors.releaseFactor, "primary");
  assert.equal(termination.actors.eTrna, "hidden");
});

test("timeline focus and scale policy are deterministic and biologically ordered", () => {
  const transfer = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("peptide-transfer")), "transfer");
  const recognitionAtEntry = deriveTranslationRepresentationPlan(grounding, getTranslationMotionState(frame("aminoacyl-trna-entry")), "recognition");
  assert.equal(transfer.timelineFocus.preferredPhase, "peptide-transfer");
  assert.equal(transfer.timelineFocus.restartPhase, "peptide-transfer");
  assert.equal(recognitionAtEntry.timelineFocus.phaseCompatible, false);
  assert.equal(translationVisualScalePolicy.peptideBackboneRadius < translationVisualScalePolicy.trnaBackboneRadius, true);
  assert.equal(translationVisualScalePolicy.selectedResidueGlyphRadius > translationVisualScalePolicy.atomGlyphRadius, true);
  assert.equal(translationVisualScalePolicy.activeAtomScale < 1, true);
  assert.equal(translationVisualScalePolicy.activeBondRadius < translationVisualScalePolicy.peptideBackboneRadius, true);
  assert.equal(translationVisualScalePolicy.transferExternalPeptideRadius < translationVisualScalePolicy.peptideBackboneRadius, true);
  for (const value of Object.values(translationVisualScalePolicy)) assert.equal(Number.isFinite(value) && value > 0, true);
});

test("focused translation plans restart at their requested temporal phase", () => {
  const scene = translationScene("peptide-bond", { organism: "unspecified" });
  const restartTime = getInitialTimeMs(scene.temporal);
  assert.equal(getTemporalFrame(scene.temporal, restartTime)?.phaseId, "peptide-transfer");
});
