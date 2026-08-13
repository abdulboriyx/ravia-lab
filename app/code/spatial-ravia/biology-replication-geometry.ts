import * as THREE from "three";
import type { ReplicationMotionState } from "./biology-motion-state.ts";

export const REPLICATION_FRAGMENT_CAPACITY = 4;

/** Fixed-size fork buffers can retain coincident inactive samples. */
export function deriveFiniteReplicationDirection(
  from: THREE.Vector3 | undefined,
  to: THREE.Vector3 | undefined,
  fallback: THREE.Vector3
) {
  if (!from || !to) return fallback.clone();
  const direction = to.clone().sub(from);
  return Number.isFinite(direction.x) && Number.isFinite(direction.y) && Number.isFinite(direction.z) && direction.lengthSq() >= 1e-12
    ? direction.normalize()
    : fallback.clone();
}

export type ReplicationForkSamples = {
  parentalA: THREE.Vector3[];
  parentalB: THREE.Vector3[];
  leadingTemplate: THREE.Vector3[];
  laggingTemplate: THREE.Vector3[];
  leadingDaughter: THREE.Vector3[];
  leadingActiveSampleCount: number;
  fragments: ReplicationFragmentSample[];
  helicasePosition: THREE.Vector3;
  leadingPolymerasePosition: THREE.Vector3;
  laggingPolymerasePosition: THREE.Vector3;
  primasePosition: THREE.Vector3;
  ligasePosition: THREE.Vector3;
};

export type ReplicationFragmentSample = {
  index: number;
  primer: THREE.Vector3[];
  fragment: THREE.Vector3[];
  primerActiveSampleCount: number;
  fragmentActiveSampleCount: number;
  completed: boolean;
  ligated: boolean;
};

type Branch = "leading" | "lagging";

function clamp01(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export function replicationBranchPoint(
  branch: Branch,
  forkX: number,
  distanceBehindFork: number
) {
  const distance = Math.max(distanceBehindFork, 0);
  const side = branch === "leading" ? -1 : 1;

  return new THREE.Vector3(
    forkX - distance * 2.35,
    side * (0.28 + distance * 0.62),
    side * 0.1 + Math.sin(distance * Math.PI * 2) * 0.04
  );
}

function sampleBranch({
  branch,
  forkX,
  samples,
  offsetY = 0,
  reverse = false,
}: {
  branch: Branch;
  forkX: number;
  samples: number;
  offsetY?: number;
  reverse?: boolean;
}) {
  const points: THREE.Vector3[] = [];

  for (let index = 0; index <= samples; index += 1) {
    const t = reverse ? 1 - index / samples : index / samples;
    const point = replicationBranchPoint(branch, forkX, t);
    points.push(point.add(new THREE.Vector3(0, offsetY, 0.08)));
  }

  return points;
}

function sampleParentalHelix({
  forkX,
  strandPhase,
  samples,
}: {
  forkX: number;
  strandPhase: number;
  samples: number;
}) {
  const points: THREE.Vector3[] = [];
  const endX = 2.5;
  const radius = 0.2;

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const x = THREE.MathUtils.lerp(forkX, endX, t);
    const angle = t * Math.PI * 8 + strandPhase;

    points.push(
      new THREE.Vector3(
        x,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      )
    );
  }

  return points;
}

function getActiveSampleCount(progress: number, samples: number) {
  if (progress <= 0) {
    return 0;
  }

  return Math.max(2, Math.min(samples + 1, Math.ceil(clamp01(progress) * samples) + 1));
}

function fragmentDistanceRange(index: number) {
  const start = 0.15 + index * 0.21;
  const end = start + 0.19;

  return { start, end };
}

function sampleFragmentPath({
  forkX,
  index,
  samples,
  offsetY,
}: {
  forkX: number;
  index: number;
  samples: number;
  offsetY: number;
}) {
  const { start, end } = fragmentDistanceRange(index);
  const points: THREE.Vector3[] = [];

  for (let sampleIndex = 0; sampleIndex <= samples; sampleIndex += 1) {
    const t = sampleIndex / samples;
    const distance = THREE.MathUtils.lerp(start, end, t);
    points.push(
      replicationBranchPoint("lagging", forkX, distance).add(
        new THREE.Vector3(0, offsetY, 0.1)
      )
    );
  }

  return points;
}

export function sampleReplicationFork({
  motion,
  samples = 72,
  fragmentSamples = 16,
}: {
  motion: ReplicationMotionState;
  samples?: number;
  fragmentSamples?: number;
}): ReplicationForkSamples {
  const forkX = motion.forkX;
  const forkOpening = motion.forkOpenAmount;
  const leadingTemplate = sampleBranch({
    branch: "leading",
    forkX,
    samples,
  });
  const laggingTemplate = sampleBranch({
    branch: "lagging",
    forkX,
    samples,
  });
  const leadingDaughter = sampleBranch({
    branch: "leading",
    forkX,
    samples,
    offsetY: -0.16,
    reverse: true,
  });
  const fragments: ReplicationFragmentSample[] = [];

  for (let index = 0; index < REPLICATION_FRAGMENT_CAPACITY; index += 1) {
    const completed = index < motion.completedFragments;
    const active = index === motion.laggingCycleIndex && !completed;
    const primerProgress = completed ? 1 : active ? motion.activePrimerProgress : 0;
    const fragmentProgress = completed ? 1 : active ? motion.activeFragmentProgress : 0;

    fragments.push({
      index,
      primer: sampleFragmentPath({
        forkX,
        index,
        samples: fragmentSamples,
        offsetY: 0.15,
      }),
      fragment: sampleFragmentPath({
        forkX,
        index,
        samples: fragmentSamples,
        offsetY: 0.24,
      }),
      primerActiveSampleCount: getActiveSampleCount(primerProgress, fragmentSamples),
      fragmentActiveSampleCount: getActiveSampleCount(fragmentProgress, fragmentSamples),
      completed,
      ligated: completed && motion.ligationProgress > index / REPLICATION_FRAGMENT_CAPACITY,
    });
  }

  return {
    parentalA: sampleParentalHelix({
      forkX,
      strandPhase: 0,
      samples,
    }),
    parentalB: sampleParentalHelix({
      forkX,
      strandPhase: Math.PI,
      samples,
    }),
    leadingTemplate: leadingTemplate.map((point) =>
      point.clone().lerp(new THREE.Vector3(forkX, -0.18, 0.02), 1 - forkOpening)
    ),
    laggingTemplate: laggingTemplate.map((point) =>
      point.clone().lerp(new THREE.Vector3(forkX, 0.18, -0.02), 1 - forkOpening)
    ),
    leadingDaughter,
    leadingActiveSampleCount: getActiveSampleCount(motion.leadingProgress, samples),
    fragments,
    helicasePosition: new THREE.Vector3(forkX, 0, 0),
    leadingPolymerasePosition: replicationBranchPoint(
      "leading",
      forkX,
      Math.max(0.08, 1 - motion.leadingProgress)
    ).add(new THREE.Vector3(0, -0.2, 0.22)),
    laggingPolymerasePosition: replicationBranchPoint(
      "lagging",
      forkX,
      fragmentDistanceRange(motion.laggingCycleIndex).start + 0.12
    ).add(new THREE.Vector3(0, 0.36, 0.22)),
    primasePosition: replicationBranchPoint(
      "lagging",
      forkX,
      fragmentDistanceRange(motion.laggingCycleIndex).start
    ).add(new THREE.Vector3(0.05, 0.28, 0.18)),
    ligasePosition: replicationBranchPoint("lagging", forkX, 0.52).add(
      new THREE.Vector3(-0.08, 0.36, 0.2)
    ),
  };
}
