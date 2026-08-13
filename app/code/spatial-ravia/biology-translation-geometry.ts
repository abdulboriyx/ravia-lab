import * as THREE from "three";
import type { TranslationMotionState } from "./biology-motion-state.ts";
import { lerpNumber } from "./biology-interpolation.ts";

export const TRANSLATION_PEPTIDE_SAMPLE_COUNT = 44;
export const TRANSLATION_MRNA_SAMPLE_COUNT = 72;

export type TranslationGeometrySamples = {
  mrna: THREE.Vector3[];
  mrnaActiveSampleCount: number;
  aSite: THREE.Vector3;
  pSite: THREE.Vector3;
  eSite: THREE.Vector3;
  codonA: THREE.Vector3;
  codonP: THREE.Vector3;
  codonE: THREE.Vector3;
  incomingTrnaPosition: THREE.Vector3;
  pSiteTrnaPosition: THREE.Vector3;
  eSiteTrnaPosition: THREE.Vector3;
  exitingTrnaPosition: THREE.Vector3;
  releaseFactorPosition: THREE.Vector3;
  peptideAnchor: THREE.Vector3;
  aminoAcidPosition: THREE.Vector3;
  polypeptide: THREE.Vector3[];
  polypeptideActiveSampleCount: number;
};

const E_SITE = new THREE.Vector3(-0.72, 0.12, 0.32);
const P_SITE = new THREE.Vector3(0, 0.12, 0.34);
const A_SITE = new THREE.Vector3(0.72, 0.12, 0.32);
const TRNA_SITE_LIFT = new THREE.Vector3(0, 0.58, 0.02);
const INCOMING_START = new THREE.Vector3(1.72, 1.38, 0.82);
const EXIT_END = new THREE.Vector3(-1.72, 1.05, 0.78);
const RELEASE_FACTOR_START = new THREE.Vector3(1.65, 1.32, 0.95);

function lerpVector(
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number
): THREE.Vector3 {
  return start.clone().lerp(end, Math.min(Math.max(t, 0), 1));
}

function finiteVector(point: THREE.Vector3) {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

export function translationSitePosition(site: "a" | "p" | "e") {
  if (site === "a") return A_SITE.clone();
  if (site === "p") return P_SITE.clone();
  return E_SITE.clone();
}

export function sampleTranslationMrna(
  motion: TranslationMotionState,
  sampleCount = TRANSLATION_MRNA_SAMPLE_COUNT
): THREE.Vector3[] {
  const codonShift = motion.mrnaOffset * 0.18;

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / Math.max(sampleCount - 1, 1);
    const x = lerpNumber(-2.35, 2.35, t) - codonShift;
    const y = -0.32 + Math.sin(t * Math.PI * 4) * 0.025;
    const z = Math.sin(t * Math.PI * 2) * 0.04;
    return new THREE.Vector3(x, y, z);
  });
}

export function interpolateTrnaTransit(
  from: THREE.Vector3,
  to: THREE.Vector3,
  progress: number
) {
  const lifted = lerpVector(from, to, progress);
  lifted.y += Math.sin(Math.min(Math.max(progress, 0), 1) * Math.PI) * 0.18;
  return lifted;
}

export function samplePolypeptidePath(
  motion: TranslationMotionState,
  sampleCount = TRANSLATION_PEPTIDE_SAMPLE_COUNT
) {
  const anchor = P_SITE.clone().add(new THREE.Vector3(0.02, 0.86, 0.28));
  const release = motion.polypeptideReleaseProgress;
  const activeSampleCount = Math.max(
    2,
    Math.min(sampleCount, Math.round(4 + motion.peptideLength * 24))
  );

  const points = Array.from({ length: sampleCount }, (_, index) => {
    const t = index / Math.max(sampleCount - 1, 1);
    const activeT = Math.min(t / Math.max(activeSampleCount / sampleCount, 0.001), 1);
    const releaseDrift = release * t;
    return new THREE.Vector3(
      anchor.x - activeT * 0.55 - releaseDrift * 0.35,
      anchor.y + activeT * 0.9 + Math.sin(activeT * Math.PI * 3) * 0.08 + releaseDrift * 0.28,
      anchor.z + activeT * 0.18 + Math.cos(activeT * Math.PI * 2) * 0.06
    );
  });

  return { points, activeSampleCount };
}

export function sampleTranslationGeometry(
  motion: TranslationMotionState
): TranslationGeometrySamples {
  const aSiteTop = A_SITE.clone().add(TRNA_SITE_LIFT);
  const pSiteTop = P_SITE.clone().add(TRNA_SITE_LIFT);
  const eSiteTop = E_SITE.clone().add(TRNA_SITE_LIFT);
  const translocation = motion.translocationProgress;
  const incomingToA = interpolateTrnaTransit(
    INCOMING_START,
    aSiteTop,
    motion.incomingTrnaProgress
  );
  const aToP = interpolateTrnaTransit(aSiteTop, pSiteTop, translocation);
  const pToE = interpolateTrnaTransit(pSiteTop, eSiteTop, translocation);
  const eExit = interpolateTrnaTransit(eSiteTop, EXIT_END, motion.exitingTrnaProgress);
  const pSiteTrnaPosition =
    translocation > 0 ? aToP : pSiteTop;
  const eSiteTrnaPosition =
    translocation > 0.35 ? pToE : eSiteTop;
  const releaseFactorPosition = interpolateTrnaTransit(
    RELEASE_FACTOR_START,
    A_SITE.clone().add(new THREE.Vector3(0, 0.6, 0.16)),
    motion.releaseFactorProgress
  );
  const peptide = samplePolypeptidePath(motion);
  const aminoAcidPosition = incomingToA.clone().add(new THREE.Vector3(0.06, 0.38, 0.02));

  const samples = {
    mrna: sampleTranslationMrna(motion),
    mrnaActiveSampleCount: TRANSLATION_MRNA_SAMPLE_COUNT,
    aSite: A_SITE.clone(),
    pSite: P_SITE.clone(),
    eSite: E_SITE.clone(),
    codonA: A_SITE.clone().setY(-0.28),
    codonP: P_SITE.clone().setY(-0.28),
    codonE: E_SITE.clone().setY(-0.28),
    incomingTrnaPosition: incomingToA,
    pSiteTrnaPosition,
    eSiteTrnaPosition,
    exitingTrnaPosition: eExit,
    releaseFactorPosition,
    peptideAnchor: peptide.points[0].clone(),
    aminoAcidPosition,
    polypeptide: peptide.points,
    polypeptideActiveSampleCount: peptide.activeSampleCount,
  };

  for (const point of [
    ...samples.mrna,
    ...samples.polypeptide,
    samples.aSite,
    samples.pSite,
    samples.eSite,
    samples.incomingTrnaPosition,
    samples.pSiteTrnaPosition,
    samples.eSiteTrnaPosition,
    samples.exitingTrnaPosition,
    samples.releaseFactorPosition,
    samples.aminoAcidPosition,
  ]) {
    if (!finiteVector(point)) {
      throw new Error("Translation geometry generated a non-finite point.");
    }
  }

  return samples;
}
