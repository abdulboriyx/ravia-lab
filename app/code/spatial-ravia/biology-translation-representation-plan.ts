import * as THREE from "three";
import type { TranslationDisplayIntent } from "./biology-translation-display-intent.ts";
import type { TranslationMotionState } from "./biology-motion-state.ts";
import type { GroundedTranslation } from "./biology-translation-structure-grounding.ts";
import { deriveTranslationVisualState } from "./biology-translation-visual-state.ts";

export type TranslationContextDetail = "hidden" | "minimal" | "coarse" | "local-enhanced";
export type TranslationActorPriority = "primary" | "secondary" | "contextual" | "hidden";
export type TranslationPhaseId =
  | "initiation"
  | "aminoacyl-trna-entry"
  | "codon-recognition"
  | "peptide-transfer"
  | "translocation"
  | "trna-exit"
  | "elongation-cycle"
  | "termination";

export const translationVisualScalePolicy = {
  ribosomeContextPointRadius: 0.019,
  trnaBackboneRadius: 0.019,
  mrnaBackboneRadius: 0.024,
  peptideBackboneRadius: 0.012,
  selectedResidueGlyphRadius: 0.031,
  atomGlyphRadius: 0.02,
  activeAtomScale: 0.14,
  activeBondRadius: 0.0025,
  supportingAtomOpacity: 0.3,
  transferExternalPeptideRadius: 0.01,
  aminoAcidGlyphRadius: 0.027,
  ptcGlyphRadius: 0.085,
  siteIndicatorWidth: 0.34,
  siteIndicatorHeight: 0.035,
  labelFontSize: 0.07,
} as const;

export type TranslationRegionOfInterest = {
  center: THREE.Vector3;
  radius: number;
  keyAnchors: Record<string, THREE.Vector3>;
};

export type TranslationCameraFrame = {
  target: THREE.Vector3;
  position: THREE.Vector3;
  fov: number;
  near: number;
  far: number;
};

export type TranslationRepresentationPlan = {
  roi: TranslationRegionOfInterest;
  reactionROI: TranslationRegionOfInterest;
  camera: TranslationCameraFrame;
  context: {
    largeSubunit: { detail: TranslationContextDetail; opacity: number };
    smallSubunit: { detail: TranslationContextDetail; opacity: number };
    mrna: { detail: TranslationContextDetail; opacity: number };
  };
  actors: Record<"aTrna" | "pTrna" | "eTrna" | "peptide" | "releaseFactor", TranslationActorPriority>;
  activeSite: {
    codon: boolean;
    anticodon: boolean;
    acceptorEnds: boolean;
    ptc: boolean;
    peptideCarrier: boolean;
    residues: GroundedTranslation["activeResidues"];
  };
  annotations: {
    sites: boolean;
    codon: boolean;
    anticodon: boolean;
    incoming: boolean;
    exiting: boolean;
    peptideTransfer: boolean;
    ptc: boolean;
  };
  timelineFocus: { preferredPhase: TranslationPhaseId; restartPhase: TranslationPhaseId; phaseCompatible: boolean };
  scale: typeof translationVisualScalePolicy;
};

const phaseForIntent: Record<TranslationDisplayIntent, TranslationPhaseId> = {
  overview: "aminoacyl-trna-entry",
  recognition: "codon-recognition",
  transfer: "peptide-transfer",
  translocation: "translocation",
  termination: "termination",
  entry: "aminoacyl-trna-entry",
};

function centerAndRadius(points: THREE.Vector3[], minimumRadius = 0.16) {
  const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / Math.max(points.length, 1));
  const radius = Math.max(minimumRadius, ...points.map((point) => point.distanceTo(center)));
  return { center, radius };
}

function roiFor(grounding: GroundedTranslation, intent: TranslationDisplayIntent): { composition: TranslationRegionOfInterest; reaction: TranslationRegionOfInterest } {
  const { a, p, e } = grounding.sites;
  const anchors: Record<string, THREE.Vector3> = {
    aSite: a.position,
    pSite: p.position,
    eSite: e.position,
    aAnticodon: a.anticodon,
    aAcceptor: a.acceptor,
    pAcceptor: p.acceptor,
    peptideTransferCenter: grounding.peptidylTransferCenter,
    peptideExit: grounding.peptideExit.position,
    codon: grounding.codonContact,
  };
  const reactionPoints = (() => {
    switch (intent) {
      case "recognition": return [a.position, ...grounding.activeResidues.anticodon.a.map((residue) => residue.position), ...grounding.activeResidues.codon.map((residue) => residue.position)];
      case "transfer": return [...grounding.activeAtoms.acceptor.a.map((atom) => atom.position), ...grounding.activeAtoms.acceptor.p.map((atom) => atom.position), grounding.peptidylTransferCenter];
      case "translocation": return [a.position, p.position, e.position, grounding.codonContact];
      case "entry": return [a.position, a.anticodon, grounding.codonContact];
      case "termination": return [a.position, p.position, p.acceptor, grounding.peptidylTransferCenter, grounding.peptideExit.position, grounding.codonContact];
      case "overview": return [a.position, p.position, e.position, grounding.codonContact, grounding.peptideExit.position];
    }
  })();
  const reaction = { ...centerAndRadius(reactionPoints), keyAnchors: anchors };
  if (intent !== "transfer") return { composition: reaction, reaction };

  // Preserve a small, static ownership context around both deposited tRNA
  // acceptor arms; never use phase-dependent actor visibility for framing.
  const armPoints = [grounding.sites.a, grounding.sites.p].flatMap((site) => site.trace
    .slice()
    .sort((left, right) => left.distanceToSquared(site.acceptor) - right.distanceToSquared(site.acceptor))
    .slice(0, 4));
  return {
    composition: { ...centerAndRadius([...reactionPoints, ...armPoints], 0.3), keyAnchors: anchors },
    reaction,
  };
}

function cameraFor(roi: TranslationRegionOfInterest, intent: TranslationDisplayIntent): TranslationCameraFrame {
  const orientation = new THREE.Vector3(2.35, 1.25, 3.15).normalize();
  const broad = intent === "overview" || intent === "translocation";
  const transfer = intent === "transfer";
  const distance = THREE.MathUtils.clamp(
    roi.radius * (broad ? 5.2 : transfer ? 4.4 : 4.15),
    broad ? 1.7 : transfer ? 0.78 : 1.05,
    broad ? 4.8 : transfer ? 1.9 : 2.7
  );
  return {
    target: roi.center.clone(),
    position: roi.center.clone().addScaledVector(orientation, distance),
    fov: broad ? 30 : transfer ? 24 : 27,
    near: 0.05,
    far: 30,
  };
}

function priorities(intent: TranslationDisplayIntent): TranslationRepresentationPlan["actors"] {
  switch (intent) {
    case "transfer": return { aTrna: "primary", pTrna: "primary", eTrna: "hidden", peptide: "primary", releaseFactor: "hidden" };
    case "recognition": return { aTrna: "primary", pTrna: "contextual", eTrna: "hidden", peptide: "hidden", releaseFactor: "hidden" };
    case "translocation": return { aTrna: "primary", pTrna: "primary", eTrna: "secondary", peptide: "secondary", releaseFactor: "hidden" };
    case "entry": return { aTrna: "primary", pTrna: "secondary", eTrna: "hidden", peptide: "secondary", releaseFactor: "hidden" };
    case "termination": return { aTrna: "hidden", pTrna: "secondary", eTrna: "hidden", peptide: "primary", releaseFactor: "primary" };
    case "overview": return { aTrna: "primary", pTrna: "primary", eTrna: "secondary", peptide: "primary", releaseFactor: "hidden" };
  }
}

function opacityFor(priority: TranslationActorPriority) {
  return priority === "primary" ? 1 : priority === "secondary" ? 0.68 : priority === "contextual" ? 0.38 : 0;
}

export function deriveTranslationRepresentationPlan(
  grounding: GroundedTranslation,
  motion: TranslationMotionState,
  intent: TranslationDisplayIntent
): TranslationRepresentationPlan {
  const { composition: roi, reaction: reactionROI } = roiFor(grounding, intent);
  const visual = deriveTranslationVisualState(motion);
  const expectedPhase = phaseForIntent[intent];
  const phaseCompatible = intent === "overview" || motion.phaseId === expectedPhase || (intent === "entry" && motion.phaseId === "codon-recognition");
  const actors = priorities(intent);
  const focused = intent !== "overview";
  const recognition = (intent === "recognition" && phaseCompatible) || (intent === "overview" && visual.recognition);
  const transfer = (intent === "transfer" && phaseCompatible) || (intent === "overview" && visual.peptideTransfer);
  const termination = intent === "termination" && phaseCompatible;
  const translocation = intent === "translocation" && phaseCompatible;

  return {
    roi,
    reactionROI,
    camera: cameraFor(roi, intent),
    context: {
      largeSubunit: { detail: intent === "transfer" || intent === "recognition" ? "local-enhanced" : focused ? "minimal" : "coarse", opacity: intent === "transfer" ? 0.09 : focused ? 0.16 : 0.38 },
      smallSubunit: { detail: intent === "transfer" || intent === "recognition" ? "local-enhanced" : focused ? "minimal" : "coarse", opacity: intent === "transfer" ? 0.09 : focused ? 0.16 : 0.38 },
      // Chain X is the green local structural fragment seen beside the A/P
      // terminal regions. It remains evidence/context in transfer focus, not
      // a third competing functional actor.
      mrna: { detail: focused ? "local-enhanced" : "coarse", opacity: intent === "transfer" ? 0.3 : focused ? 0.78 : 1 },
    },
    actors,
    activeSite: {
      codon: recognition || intent === "entry" || termination,
      anticodon: recognition || intent === "entry",
      acceptorEnds: transfer || intent === "transfer" || termination,
      ptc: transfer || intent === "transfer" || termination,
      peptideCarrier: actors.peptide !== "hidden",
      residues: grounding.activeResidues,
    },
    annotations: {
      sites: intent === "overview" || translocation || intent === "entry",
      codon: recognition || intent === "entry" || termination,
      anticodon: recognition,
      incoming: intent === "entry" && phaseCompatible,
      exiting: (intent === "overview" && visual.exiting) || (intent === "translocation" && phaseCompatible),
      peptideTransfer: transfer,
      ptc: transfer,
    },
    timelineFocus: { preferredPhase: expectedPhase, restartPhase: expectedPhase, phaseCompatible },
    scale: translationVisualScalePolicy,
  };
}

export function deriveTranslationCameraFrame(
  grounding: GroundedTranslation,
  intent: TranslationDisplayIntent
) {
  return cameraFor(roiFor(grounding, intent).composition, intent);
}

export function deriveTransferOwnershipLabelAnchors(
  grounding: GroundedTranslation,
  frame: TranslationCameraFrame
) {
  const view = frame.position.clone().sub(frame.target).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, view);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  right.normalize();
  const screenUp = new THREE.Vector3().crossVectors(view, right).normalize();
  const offset = (side: number) => right.clone().multiplyScalar(side * 0.12).addScaledVector(screenUp, 0.1);
  return {
    a: grounding.sites.a.acceptor.clone().add(offset(1)),
    p: grounding.sites.p.acceptor.clone().add(offset(-1)),
  };
}

export function getTranslationRestartPhase(intent: TranslationDisplayIntent) {
  return phaseForIntent[intent];
}

export function getTranslationActorOpacity(plan: TranslationRepresentationPlan, actor: keyof TranslationRepresentationPlan["actors"]) {
  return opacityFor(plan.actors[actor]);
}
