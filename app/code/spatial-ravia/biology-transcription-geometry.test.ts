import assert from "node:assert/strict";
import test from "node:test";

import {
  bubbleOpeningAt,
  getTranscriptionPathFrame,
  sampleMechanisticDnaHelix,
  sampleMutableRnaExitPath,
  sampleRnaExitPath,
} from "./biology-transcription-geometry.ts";
import type { TranscriptionMotionState } from "./biology-motion-state.ts";

const motion: TranscriptionMotionState = {
  polymeraseX: 0,
  polymeraseY: 0.18,
  bubbleCenterX: 0,
  bubbleRadius: 0.56,
  bubbleOpenAmount: 1,
  rnaLength: 1.8,
  rnaReleaseProgress: 0,
  rnaOpacity: 1,
};

test("DNA helix sampling produces two separated helical backbones", () => {
  const samples = sampleMechanisticDnaHelix({ motion, samples: 40 });

  assert.equal(samples.length, 41);
  for (const sample of samples) {
    assert.ok(Number.isFinite(sample.strandA.x));
    assert.ok(sample.strandA.distanceTo(sample.strandB) > 0.25);
  }
});

test("transcription bubble opening peaks near center and falls outside window", () => {
  const center = bubbleOpeningAt(0, 0, 0.56, 1);
  const edge = bubbleOpeningAt(0.56, 0, 0.56, 1);
  const outside = bubbleOpeningAt(1.6, 0, 0.56, 1);

  assert.ok(center > 0.98);
  assert.ok(edge < center);
  assert.ok(outside < 0.01);
});

test("polymerase path frame has normalized tangent and finite orientation", () => {
  const frame = getTranscriptionPathFrame(0.4);

  assert.ok(Math.abs(frame.tangent.length() - 1) < 0.0001);
  assert.ok(Number.isFinite(frame.quaternion.w));
});

test("RNA exit path grows away from polymerase without invalid points", () => {
  const shortPath = sampleRnaExitPath({
    motion: { ...motion, rnaLength: 0.4 },
    samples: 20,
  });
  const longPath = sampleRnaExitPath({ motion, samples: 20 });

  assert.equal(shortPath.length, longPath.length);
  assert.ok(
    longPath[longPath.length - 1].distanceTo(longPath[0]) >
      shortPath[shortPath.length - 1].distanceTo(shortPath[0])
  );
  for (const point of longPath) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
    assert.ok(Number.isFinite(point.z));
  }
});

test("DNA helix sample count remains stable as bubble moves", () => {
  const early = sampleMechanisticDnaHelix({
    motion: { ...motion, bubbleCenterX: -0.8, bubbleOpenAmount: 0.2 },
    samples: 64,
  });
  const late = sampleMechanisticDnaHelix({
    motion: { ...motion, bubbleCenterX: 1.1, bubbleOpenAmount: 1 },
    samples: 64,
  });

  assert.equal(early.length, late.length);
  assert.equal(
    early.filter((_, index) => index % 4 === 0).length,
    late.filter((_, index) => index % 4 === 0).length
  );
});

test("RNA draw path keeps stable sample count while active length changes", () => {
  const shortPath = sampleRnaExitPath({
    motion: { ...motion, rnaLength: 0.25 },
    samples: 48,
  });
  const longPath = sampleRnaExitPath({
    motion: { ...motion, rnaLength: 2.2 },
    samples: 48,
  });

  assert.equal(shortPath.length, 49);
  assert.equal(shortPath.length, longPath.length);
  assert.ok(
    longPath[longPath.length - 1].distanceTo(longPath[0]) >
      shortPath[shortPath.length - 1].distanceTo(shortPath[0])
  );
});

test("mutable RNA path keeps fixed capacity while active range grows", () => {
  const early = sampleMutableRnaExitPath({
    motion: { ...motion, rnaLength: 0.25 },
    samples: 48,
  });
  const late = sampleMutableRnaExitPath({
    motion: { ...motion, rnaLength: 2.2 },
    samples: 48,
  });

  assert.equal(early.points.length, 49);
  assert.equal(early.points.length, late.points.length);
  assert.ok(early.activeSampleCount > 0);
  assert.ok(late.activeSampleCount > early.activeSampleCount);
});

test("mutable RNA active range stops increasing during termination release", () => {
  const attached = sampleMutableRnaExitPath({
    motion: { ...motion, rnaLength: 2.35, rnaReleaseProgress: 0 },
    samples: 56,
  });
  const released = sampleMutableRnaExitPath({
    motion: { ...motion, rnaLength: 2.35, rnaReleaseProgress: 1 },
    samples: 56,
  });

  assert.equal(attached.points.length, released.points.length);
  assert.equal(attached.activeSampleCount, released.activeSampleCount);

  for (const point of released.points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
    assert.ok(Number.isFinite(point.z));
  }
});
