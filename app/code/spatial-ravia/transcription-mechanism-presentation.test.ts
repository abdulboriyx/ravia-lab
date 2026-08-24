import assert from "node:assert/strict";
import test from "node:test";
import { deriveTranscriptionMechanismVisualState } from "./transcription-mechanism-presentation.ts";

const state = (time: number, extra: Partial<Parameters<typeof deriveTranscriptionMechanismVisualState>[0]> = {}) => deriveTranscriptionMechanismVisualState({ exactTimeSeconds: time, polymeraseEngagement: time > 0 ? 1 : 0, bubbleOpenFraction: time > 0 && time < 2 ? 0.8 : 0, nascentRnaVisualLength: time > 0.5 ? 3 : 0, transcriptReleaseProgress: time >= 2 ? 1 : 0, ...extra });

test("exact-time stage contract distinguishes all four chapters", () => {
  assert.deepEqual([0, 0.5, 1, 1.5, 2].map((time) => state(time).stage), ["START", "INITIATION", "ELONGATION", "ELONGATION", "TERMINATION"]);
});

test("polymerase presentation modes resolve with the mechanism stage", () => {
  assert.deepEqual([state(0).polymeraseMode, state(0.5).polymeraseMode, state(1).polymeraseMode, state(2).polymeraseMode], ["AVAILABLE", "PROMOTER_ENGAGED", "TRANSLOCATING", "RELEASED"]);
});

test("termination resolves bubble/transcript presentation instead of leaking elongation", () => {
  const end = state(2);
  assert.equal(end.bubbleVisibility, 0);
  assert.equal(end.polymeraseMode, "RELEASED");
  assert.match(end.teachingLabel, /resolved/);
});
