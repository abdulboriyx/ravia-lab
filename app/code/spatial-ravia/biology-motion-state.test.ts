import assert from "node:assert/strict";
import test from "node:test";

import { parseBiologyScenePrompt } from "./biology-parser.ts";
import {
  getActionPotentialMotionState,
  getSignalingMotionState,
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

test("canonical signaling motion follows causal activation order", () => {
  const scene = supportedScene("show RTK signaling through Ras Raf MEK ERK");

  assert.deepEqual(
    scene.temporal?.phases.map((phase) => phase.id),
    [
      "resting",
      "ligand-approach",
      "ligand-binding",
      "dimerization",
      "receptor-activation",
      "adaptor-recruitment",
      "ras-activation",
      "raf-activation",
      "mek-activation",
      "erk-activation",
      "erk-translocation",
      "response-ready",
    ]
  );

  const frameAt = (phaseId: string, offset = 800) => {
    const start = getPhaseStartTimeMs(scene.temporal, phaseId);
    assert.notEqual(start, null);
    return getSignalingMotionState(getTemporalFrame(scene.temporal, (start ?? 0) + offset));
  };

  const approach = frameAt("ligand-approach");
  assert.ok(approach.ligandApproachProgress > 0);
  assert.equal(approach.ligandBound, false);
  assert.equal(approach.receptorActivationProgress, 0);

  const dimerizing = frameAt("dimerization");
  assert.equal(dimerizing.ligandBound, true);
  assert.ok(dimerizing.dimerizationProgress > 0);
  assert.equal(dimerizing.receptorActivationProgress, 0);

  const receptorActive = frameAt("receptor-activation");
  assert.ok(receptorActive.dimerizationProgress > 0);
  assert.ok(receptorActive.receptorActivationProgress > 0);
  assert.equal(receptorActive.adaptorRecruitmentProgress, 0);

  const adaptor = frameAt("adaptor-recruitment");
  assert.ok(adaptor.receptorActivationProgress > 0);
  assert.ok(adaptor.adaptorRecruitmentProgress > 0);
  assert.equal(adaptor.rasActivationProgress, 0);

  const ras = frameAt("ras-activation");
  assert.ok(ras.sosRecruitmentProgress > 0);
  assert.ok(ras.rasActivationProgress > 0);
  assert.equal(ras.rafActivationProgress, 0);
  assert.equal(ras.rasState, "exchanging");

  const raf = frameAt("raf-activation");
  const mek = frameAt("mek-activation");
  const erk = frameAt("erk-activation");
  assert.ok(raf.rafActivationProgress > 0);
  assert.equal(raf.mekActivationProgress, 0);
  assert.ok(mek.rafActivationProgress > 0);
  assert.ok(mek.mekActivationProgress > 0);
  assert.equal(mek.erkActivationProgress, 0);
  assert.ok(erk.mekActivationProgress > 0);
  assert.ok(erk.erkActivationProgress > 0);
  assert.equal(erk.erkTranslocationProgress, 0);

  const translocation = frameAt("erk-translocation");
  assert.ok(translocation.erkActivationProgress > 0);
  assert.ok(translocation.erkTranslocationProgress > 0);

  const final = getSignalingMotionState(getTemporalFrame(scene.temporal, getTotalDurationMs(scene.temporal)));
  assert.equal(final.rasState, "gtp");
  assert.equal(final.responseState, "ready");
});
