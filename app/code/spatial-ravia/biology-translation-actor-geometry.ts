import * as THREE from "three";
import type { TranslationMotionState } from "./biology-motion-state.ts";
import type { GroundedTranslation, GroundedTranslationSite } from "./biology-translation-structure-grounding.ts";

export type TransferCarrierPresentation = {
  stage: "before" | "during" | "after";
  aRole: "aminoacyl" | "acceptor" | "peptidyl";
  pRole: "peptidyl" | "donor" | "deacylated";
};

export function deriveTransferCarrierPresentation(motion: TranslationMotionState): TransferCarrierPresentation {
  const progress = motion.peptideTransferProgress;
  if (progress < 0.45) return { stage: "before", aRole: "aminoacyl", pRole: "peptidyl" };
  if (progress < 0.55) return { stage: "during", aRole: "acceptor", pRole: "donor" };
  return { stage: "after", aRole: "peptidyl", pRole: "deacylated" };
}

export function transformSitePoint(source: GroundedTranslationSite, point: THREE.Vector3, position: THREE.Vector3, quaternion: THREE.Quaternion) {
  return point.clone().sub(source.position).applyQuaternion(source.quaternion.clone().invert()).applyQuaternion(quaternion).add(position);
}

export function interpolateSiteQuaternion(source: THREE.Quaternion, target: THREE.Quaternion, progress: number) {
  return source.clone().slerp(target, THREE.MathUtils.clamp(progress, 0, 1)).normalize();
}

export function deriveTranslationTrnaTransforms(grounding: GroundedTranslation, motion: TranslationMotionState) {
  const { a, p, e } = grounding.sites;
  const translocation = THREE.MathUtils.clamp(motion.translocationProgress, 0, 1);
  const peptidylPosition = a.position.clone().lerp(p.position, translocation);
  const peptidylQuaternion = interpolateSiteQuaternion(a.quaternion, p.quaternion, translocation);
  const exitingProgress = THREE.MathUtils.clamp((translocation - 0.18) / 0.82, 0, 1);
  const exitingPosition = p.position.clone().lerp(e.position, exitingProgress);
  const exitingQuaternion = interpolateSiteQuaternion(p.quaternion, e.quaternion, exitingProgress);
  return { peptidylPosition, peptidylQuaternion, exitingPosition, exitingQuaternion };
}

export function deriveTranslationPeptideCarrier(grounding: GroundedTranslation, motion: TranslationMotionState) {
  const { a, p } = grounding.sites;
  const transforms = deriveTranslationTrnaTransforms(grounding, motion);
  const transfer = THREE.MathUtils.clamp(motion.peptideTransferProgress / 0.55, 0, 1);
  if (motion.phaseId === "peptide-transfer") {
    return { site: transfer < 1 ? "p" as const : "a" as const, root: p.acceptor.clone().lerp(a.acceptor, transfer) };
  }
  if (motion.aSiteOccupancy.carriesPeptide) {
    return {
      site: "a" as const,
      root: transformSitePoint(a, a.acceptor, transforms.peptidylPosition, transforms.peptidylQuaternion),
    };
  }
  return { site: "p" as const, root: p.acceptor.clone() };
}

export function createStructureConstrainedPeptidePath(
  grounding: GroundedTranslation,
  motion: TranslationMotionState,
  options: { transferFocus?: boolean } = {}
) {
  const carrier = deriveTranslationPeptideCarrier(grounding, motion);
  const fullExit = grounding.peptideExit.position;
  const exitVector = fullExit.clone().sub(grounding.peptidylTransferCenter);
  const exitDistance = exitVector.length();
  const localExit = options.transferFocus
    ? grounding.peptidylTransferCenter.clone().addScaledVector(exitVector.normalize(), Math.min(exitDistance, 0.18))
    : fullExit;
  const direction = grounding.peptideExit.direction.clone().normalize();
  const carrierToPtc = grounding.peptidylTransferCenter.clone().sub(carrier.root);
  const bend = new THREE.Vector3(-carrierToPtc.y, carrierToPtc.x, 0).normalize().multiplyScalar(Math.min(0.035, carrierToPtc.length() * 0.14));
  const carrierControl = carrier.root.clone().lerp(grounding.peptidylTransferCenter, 0.5).add(bend);
  const externalCount = options.transferFocus ? 3 : Math.max(5, Math.round(8 + motion.peptideLength * 12));
  const external = Array.from({ length: externalCount }, (_, index) => {
    const distance = (index + 1) * (options.transferFocus ? 0.025 : 0.04);
    return localExit.clone().addScaledVector(direction, distance).add(new THREE.Vector3(0, distance * 0.16, Math.sin(index * 0.75) * 0.006));
  });
  return { carrier, points: [carrier.root, carrierControl, grounding.peptidylTransferCenter.clone(), localExit.clone(), ...external], externalSampleCount: externalCount };
}
