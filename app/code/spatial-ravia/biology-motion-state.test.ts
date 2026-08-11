import assert from "node:assert/strict";
import test from "node:test";

import { parseBiologyScenePrompt } from "./biology-parser.ts";
import {
  getActionPotentialMotionState,
  getTranscriptionMotionState,
} from "./biology-motion-state.ts";
import {
  getPhaseStartTimeMs,
  getTemporalFrame,
  getTotalDurationMs,
} from "./biology-timeline.ts";

function supportedScene(prompt: string) {
  const result = parseBiologyScenePrompt(prompt);

  assert.equal(result.status, "supported");

  return result.scene;
}

test("transcription scene exposes temporal phases with representative durations", () => {
  const scene = supportedScene("show RNA polymerase transcribing a gene");

  assert.deepEqual(
    scene.temporal?.phases.map((phase) => phase.id),
    ["initiation", "opening", "elongation", "termination"]
  );
  assert.ok(getTotalDurationMs(scene.temporal) > 12000);
});

test("transcription motion moves polymerase and grows RNA during elongation", () => {
  const scene = supportedScene("show RNA polymerase transcribing a gene");
  const elongationStart = getPhaseStartTimeMs(scene.temporal, "elongation");

  assert.notEqual(elongationStart, null);

  const earlyFrame = getTemporalFrame(scene.temporal, elongationStart ?? 0);
  const lateFrame = getTemporalFrame(
    scene.temporal,
    (elongationStart ?? 0) + 6000
  );
  const early = getTranscriptionMotionState(earlyFrame);
  const late = getTranscriptionMotionState(lateFrame);

  assert.ok(late.polymeraseX > early.polymeraseX);
  assert.ok(late.rnaLength > early.rnaLength);
  assert.equal(late.bubbleCenterX, late.polymeraseX);
  assert.equal(late.bubbleOpenAmount, 1);
});

test("transcription termination releases RNA and closes the bubble", () => {
  const scene = supportedScene("show RNA polymerase transcribing a gene");
  const total = getTotalDurationMs(scene.temporal);
  const termination = getTranscriptionMotionState(
    getTemporalFrame(scene.temporal, total)
  );

  assert.equal(termination.bubbleOpenAmount, 0);
  assert.equal(termination.rnaReleaseProgress, 1);
  assert.ok(termination.polymeraseY > 0.6);
});

test("action-potential motion interpolates voltage and channel flux by phase", () => {
  const scene = supportedScene("show how an action potential works");
  const depolStart = getPhaseStartTimeMs(scene.temporal, "depolarization");
  const repolStart = getPhaseStartTimeMs(scene.temporal, "repolarization");

  assert.notEqual(depolStart, null);
  assert.notEqual(repolStart, null);

  const earlyDepol = getActionPotentialMotionState(
    getTemporalFrame(scene.temporal, depolStart ?? 0)
  );
  const lateDepol = getActionPotentialMotionState(
    getTemporalFrame(scene.temporal, (depolStart ?? 0) + 1900)
  );
  const midRepol = getActionPotentialMotionState(
    getTemporalFrame(scene.temporal, (repolStart ?? 0) + 1200)
  );

  assert.ok(lateDepol.voltageMv > earlyDepol.voltageMv);
  assert.equal(lateDepol.sodiumFluxActivity, 1);
  assert.ok(lateDepol.sodiumChannelOpenAmount > 0.8);
  assert.ok(midRepol.voltageMv < lateDepol.voltageMv);
  assert.equal(midRepol.potassiumFluxActivity, 1);
  assert.ok(midRepol.potassiumChannelOpenAmount > 0.8);
});
