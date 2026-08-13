import * as THREE from "three";
import type { TranscriptionMotionState } from "./biology-motion-state.ts";

export type DnaHelixSample = {
  center: THREE.Vector3;
  strandA: THREE.Vector3;
  strandB: THREE.Vector3;
  basePairStart: THREE.Vector3;
  basePairEnd: THREE.Vector3;
  opening: number;
  angle: number;
};

export type TranscriptionPathFrame = {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  quaternion: THREE.Quaternion;
};

export type RnaExitPathSample = {
  points: THREE.Vector3[];
  activeSampleCount: number;
};

export const transcriptionDnaPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.55, 0, -0.08),
  new THREE.Vector3(-1.35, 0.04, 0.04),
  new THREE.Vector3(0.2, -0.02, 0),
  new THREE.Vector3(1.55, 0.03, -0.04),
  new THREE.Vector3(2.55, 0, 0.08),
]);

export function bubbleOpeningAt(
  x: number,
  centerX: number,
  radius: number,
  amount: number
): number {
  if (radius <= 0 || amount <= 0) {
    return 0;
  }

  const distance = x - centerX;
  const gaussian = Math.exp(-(distance * distance) / (radius * radius));
  return THREE.MathUtils.clamp(gaussian * amount, 0, 1);
}

export function xToPathT(x: number): number {
  return THREE.MathUtils.clamp((x + 2.55) / 5.1, 0, 1);
}

export function getTranscriptionPathFrame(x: number): TranscriptionPathFrame {
  const t = xToPathT(x);
  const position = transcriptionDnaPath.getPointAt(t);
  const tangent = transcriptionDnaPath.getTangentAt(t).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0),
    tangent
  );

  return { position, tangent, quaternion };
}

export function sampleMechanisticDnaHelix({
  motion,
  samples = 96,
  helixRadius = 0.16,
  openedRadius = 0.32,
  turns = 6.25,
}: {
  motion: Pick<
    TranscriptionMotionState,
    "bubbleCenterX" | "bubbleRadius" | "bubbleOpenAmount"
  >;
  samples?: number;
  helixRadius?: number;
  openedRadius?: number;
  turns?: number;
}): DnaHelixSample[] {
  const result: DnaHelixSample[] = [];

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const center = transcriptionDnaPath.getPointAt(t);
    const tangent = transcriptionDnaPath.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(1, 0, 0),
          tangent
        )
      )
      .normalize();
    const binormal = new THREE.Vector3()
      .crossVectors(tangent, normal)
      .normalize();
    const angle = t * Math.PI * 2 * turns;
    // Constrain the displayed bubble to the short RNAP-bound region. The
    // state still controls opening; this only prevents a broad visual tear.
    const opening = bubbleOpeningAt(
      center.x,
      motion.bubbleCenterX,
      Math.min(motion.bubbleRadius, 0.42),
      motion.bubbleOpenAmount
    );
    const twistOffset = normal
      .clone()
      .multiplyScalar(Math.cos(angle) * helixRadius * (1 - opening * 0.7))
      .add(binormal.clone().multiplyScalar(Math.sin(angle) * helixRadius * (1 - opening * 0.7)));
    // Separate the transcription bubble perpendicular to its local helix
    // radius so the open strands cannot visually collapse into each other.
    const openingDirection = new THREE.Vector3().crossVectors(tangent, twistOffset).normalize();
    const openingOffset = openingDirection.multiplyScalar(openedRadius * opening);
    const strandA = center.clone().add(twistOffset).add(openingOffset);
    const strandB = center.clone().sub(twistOffset).sub(openingOffset);

    result.push({
      center,
      strandA,
      strandB,
      basePairStart: strandA,
      basePairEnd: strandB,
      opening,
      angle,
    });
  }

  return result;
}

export function sampleRnaExitPath({
  motion,
  samples = 56,
}: {
  motion: TranscriptionMotionState;
  samples?: number;
}): THREE.Vector3[] {
  return sampleMutableRnaExitPath({
    motion,
    samples,
    maxLength: motion.rnaLength,
  }).points;
}

export function sampleMutableRnaExitPath({
  motion,
  samples = 56,
  maxLength = 2.35,
}: {
  motion: TranscriptionMotionState;
  samples?: number;
  maxLength?: number;
}): RnaExitPathSample {
  const frame = getTranscriptionPathFrame(motion.polymeraseX);
  const right = new THREE.Vector3(0, -1, 0).applyQuaternion(frame.quaternion);
  const upward = new THREE.Vector3(0, 0, 1);
  const exit = frame.position
    .clone()
    .add(right.clone().multiplyScalar(0.28))
    .add(upward.clone().multiplyScalar(0.22));
  const releaseLift = motion.rnaReleaseProgress * 0.46;
  const releaseDrift = motion.rnaReleaseProgress * -0.42;
  const points: THREE.Vector3[] = [];
  const activeFraction =
    maxLength > 0
      ? THREE.MathUtils.clamp(motion.rnaLength / maxLength, 0, 1)
      : 0;
  const activeSampleCount =
    motion.rnaLength <= 0.02 || motion.rnaOpacity <= 0.02
      ? 0
      : Math.max(2, Math.min(samples + 1, Math.ceil(activeFraction * samples) + 1));

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const lengthT = t * maxLength;
    points.push(
      exit
        .clone()
        .add(frame.tangent.clone().multiplyScalar(-lengthT * 0.34))
        .add(right.clone().multiplyScalar(lengthT * 0.2 + releaseDrift * t))
        .add(
          upward
            .clone()
            .multiplyScalar(
              Math.sin(t * Math.PI) * 0.035 + releaseLift * t
            )
        )
    );
  }

  return { points, activeSampleCount };
}
