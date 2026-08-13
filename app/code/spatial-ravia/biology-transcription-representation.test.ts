import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveTranscriptionDnaRegionAnnotation,
  isFiniteTranscriptionAnnotation,
  transcriptionVisualScalePolicy,
} from "./biology-transcription-representation.ts";
import { getTranscriptionPathFrame, sampleMechanisticDnaHelix, sampleMutableRnaExitPath } from "./biology-transcription-geometry.ts";
import type { TranscriptionMotionState } from "./biology-motion-state.ts";

const elongating: TranscriptionMotionState = {
  polymeraseX: 0,
  polymeraseY: 0.18,
  bubbleCenterX: 0,
  bubbleRadius: 0.56,
  bubbleOpenAmount: 1,
  rnaLength: 1.5,
  rnaReleaseProgress: 0,
  rnaOpacity: 1,
};

test("DNA-region annotations stay attached to the horizontal transcription path", () => {
  const annotation = deriveTranscriptionDnaRegionAnnotation(-1.2, 0.5);
  const dna = getTranscriptionPathFrame(-1.2).position;
  assert.ok(isFiniteTranscriptionAnnotation(annotation));
  assert.ok(annotation.connectorEnd.distanceTo(dna) < 0.001);
  assert.ok(annotation.start.distanceTo(annotation.end) > 0.2);
});

test("transcription visual grammar maintains a molecular scale hierarchy", () => {
  const values = Object.values(transcriptionVisualScalePolicy);
  assert.ok(values.every((value) => Number.isFinite(value) && value > 0));
  assert.ok(transcriptionVisualScalePolicy.basePairRadius < transcriptionVisualScalePolicy.dnaBackboneRadius);
  assert.ok(transcriptionVisualScalePolicy.rnaTerminalRadius > transcriptionVisualScalePolicy.rnaBackboneRadius);
});

test("transcription remains locally opened and its RNA exits from the polymerase region", () => {
  const dna = sampleMechanisticDnaHelix({ motion: elongating, samples: 96 });
  const center = dna.reduce((best, sample) => sample.opening > best.opening ? sample : best);
  const distant = dna.filter((sample) => Math.abs(sample.center.x) > 1.2);
  assert.ok(center.opening > 0.95);
  assert.ok(distant.every((sample) => sample.opening < 0.01));
  const rna = sampleMutableRnaExitPath({ motion: elongating });
  const polymerase = getTranscriptionPathFrame(elongating.polymeraseX).position;
  assert.ok(rna.points[0].distanceTo(polymerase) < 0.6);
  assert.ok(rna.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)));
});
