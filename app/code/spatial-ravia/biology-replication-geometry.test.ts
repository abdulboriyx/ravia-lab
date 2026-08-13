import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";

import {
  getReplicationMotionState,
  type ReplicationMotionState,
} from "./biology-motion-state.ts";
import { dnaReplicationSynthesisScene } from "./biology-scene-builders.ts";
import {
  deriveFiniteReplicationDirection,
  REPLICATION_FRAGMENT_CAPACITY,
  sampleReplicationFork,
} from "./biology-replication-geometry.ts";
import {
  getPhaseStartTimeMs,
  getTemporalFrame,
  getTotalDurationMs,
} from "./biology-timeline.ts";

function frameAtPhase(phaseId: string, progress: number) {
  const scene = dnaReplicationSynthesisScene("full-replication");
  const phaseStart = getPhaseStartTimeMs(scene.temporal, phaseId);
  const phase = scene.temporal?.phases.find((item) => item.id === phaseId);

  assert.notEqual(phaseStart, null);
  assert.ok(phase);

  return getTemporalFrame(
    scene.temporal,
    phaseStart! + (phase.durationMs ?? 0) * progress
  );
}

function assertFiniteSamples(points: { x: number; y: number; z: number }[]) {
  for (const point of points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
    assert.ok(Number.isFinite(point.z));
  }
}

test("replication scenes expose ordered temporal phases", () => {
  const scene = dnaReplicationSynthesisScene("full-replication");

  assert.ok(scene.temporal);
  assert.equal(scene.temporal.phases[0].id, "setup");
  assert.ok(getTotalDurationMs(scene.temporal) > 0);
  assert.ok(scene.entities.some((entity) => entity.id === "helicase"));
  assert.ok(scene.entities.some((entity) => entity.id === "primase"));
  assert.ok(scene.entities.some((entity) => entity.id === "ligase"));
});

test("replication fork progress and leading synthesis are monotonic", () => {
  const early = getReplicationMotionState(frameAtPhase("fork-opening", 0.2));
  const middle = getReplicationMotionState(frameAtPhase("elongation", 0.5));
  const late = getReplicationMotionState(frameAtPhase("completion", 1));

  assert.ok(middle.forkProgress > early.forkProgress);
  assert.ok(late.forkProgress >= middle.forkProgress);
  assert.ok(middle.leadingProgress > early.leadingProgress);
  assert.ok(late.leadingProgress >= middle.leadingProgress);
});

test("lagging repeated cycle index advances while cycle progress resets", () => {
  const start = getReplicationMotionState(frameAtPhase("elongation", 0.05));
  const later = getReplicationMotionState(frameAtPhase("elongation", 0.85));

  assert.ok(later.laggingCycleIndex > start.laggingCycleIndex);
  assert.ok(start.laggingCycleProgress >= 0);
  assert.ok(start.laggingCycleProgress < 1);
  assert.ok(later.laggingCycleProgress >= 0);
  assert.ok(later.laggingCycleProgress < 1);
  assert.ok(later.completedFragments >= start.completedFragments);
});

test("replication fork sampling keeps fixed buffer sizes as fork moves", () => {
  const early = sampleReplicationFork({
    motion: getReplicationMotionState(frameAtPhase("fork-opening", 0.4)),
    samples: 48,
  });
  const late = sampleReplicationFork({
    motion: getReplicationMotionState(frameAtPhase("elongation", 0.8)),
    samples: 48,
  });

  assert.equal(early.parentalA.length, late.parentalA.length);
  assert.equal(early.leadingTemplate.length, late.leadingTemplate.length);
  assert.equal(early.laggingTemplate.length, late.laggingTemplate.length);
  assert.equal(early.fragments.length, REPLICATION_FRAGMENT_CAPACITY);
  assert.equal(early.fragments.length, late.fragments.length);
  assert.notEqual(early.helicasePosition.x, late.helicasePosition.x);
});

test("leading daughter grows continuously while lagging fragment cycles reset", () => {
  const earlyMotion = getReplicationMotionState(frameAtPhase("elongation", 0.2));
  const laterMotion = getReplicationMotionState(frameAtPhase("elongation", 0.75));
  const early = sampleReplicationFork({ motion: earlyMotion, samples: 64 });
  const later = sampleReplicationFork({ motion: laterMotion, samples: 64 });

  assert.ok(later.leadingActiveSampleCount > early.leadingActiveSampleCount);
  assert.ok(laterMotion.completedFragments >= earlyMotion.completedFragments);

  if (laterMotion.laggingCycleIndex > earlyMotion.laggingCycleIndex) {
    assert.ok(laterMotion.activeFragmentProgress < 1);
  }
});

test("primers precede active Okazaki DNA extension", () => {
  const primerOnlyMotion: ReplicationMotionState = {
    ...getReplicationMotionState(frameAtPhase("elongation", 0.3)),
    activePrimerProgress: 0.8,
    activeFragmentProgress: 0,
  };
  const samples = sampleReplicationFork({ motion: primerOnlyMotion });
  const active = samples.fragments[primerOnlyMotion.laggingCycleIndex];

  assert.ok(active.primerActiveSampleCount > 0);
  assert.equal(active.fragmentActiveSampleCount, 0);
});

test("replication strand directionality is represented by opposite growth geometry", () => {
  const samples = sampleReplicationFork({
    motion: getReplicationMotionState(frameAtPhase("elongation", 0.65)),
    samples: 64,
  });
  const leadingStart = samples.leadingDaughter[0];
  const leadingEnd = samples.leadingDaughter[samples.leadingActiveSampleCount - 1];
  const activeFragment = samples.fragments.find(
    (fragment) => fragment.fragmentActiveSampleCount > 2
  );

  assert.ok(leadingEnd.x > leadingStart.x);

  if (activeFragment) {
    const fragmentStart = activeFragment.fragment[0];
    const fragmentEnd =
      activeFragment.fragment[activeFragment.fragmentActiveSampleCount - 1];

    assert.ok(fragmentEnd.x < fragmentStart.x);
    assert.ok(fragmentStart.y > 0);
  }
});

test("replication samples remain finite through completion", () => {
  const samples = sampleReplicationFork({
    motion: getReplicationMotionState(frameAtPhase("completion", 1)),
  });

  assertFiniteSamples(samples.parentalA);
  assertFiniteSamples(samples.parentalB);
  assertFiniteSamples(samples.leadingTemplate);
  assertFiniteSamples(samples.laggingTemplate);
  assertFiniteSamples(samples.leadingDaughter);

  for (const fragment of samples.fragments) {
    assertFiniteSamples(fragment.primer);
    assertFiniteSamples(fragment.fragment);
  }
});

test("structure-grounded actor directions stay finite for coincident fork samples", () => {
  const samples = sampleReplicationFork({
    motion: getReplicationMotionState(frameAtPhase("elongation", 0.5)),
  });
  const coincident = samples.leadingTemplate[0]!.clone();
  const direction = deriveFiniteReplicationDirection(
    coincident,
    coincident,
    new THREE.Vector3(1, 0, 0)
  );
  assert.deepEqual(direction.toArray(), [1, 0, 0]);
});
