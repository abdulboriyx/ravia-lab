import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression.ts";
import { createExpertTranscriptionControlState, deriveTranscriptionChapterSteps, deriveTranscriptionExpertEvents, reduceExpertTranscriptionControl, validateExpertTranscriptionControlState } from "./transcription-expert-controls.ts";

const program = createCanonicalEukaryoticGeneExpressionProgram();
const events = deriveTranscriptionExpertEvents(program, 8, 2.35);

test("expert event stepping uses canonical transcription event boundaries", () => {
  const initial = createExpertTranscriptionControlState(events, 8, 2);
  assert.deepEqual(events.map((event) => Number(event.displayTime.toFixed(6))), [1.702128, 3.404255, 5.106383, 6.808511, 8]);
  assert.equal(initial.eventIndex, 0);
  const forward = reduceExpertTranscriptionControl(initial, { type: "STEP_FORWARD_EVENT" });
  assert.equal(forward.exactTime, events[1]!.displayTime);
  assert.equal(forward.playing, false);
  const back = reduceExpertTranscriptionControl(forward, { type: "STEP_BACK_EVENT" });
  assert.equal(back.exactTime, events[0]!.displayTime);
});

test("chapter controls derive their displayed times from canonical event boundaries", () => {
  const chapters = deriveTranscriptionChapterSteps(events, 8);
  assert.deepEqual(chapters.map((chapter) => chapter.label), ["START", "INITIATION", "ELONGATION", "TERMINATION"]);
  assert.deepEqual(chapters.map((chapter) => Number(chapter.time.toFixed(6))), [0, 1.702128, 3.404255, 6.808511]);
  assert.equal(createExpertTranscriptionControlState(events, 8, chapters[1]!.time).exactTime, chapters[1]!.time);
});

test("expert controls separate inspection from biological state and reset deterministically", () => {
  let state = createExpertTranscriptionControlState(events, 8, 2);
  state = reduceExpertTranscriptionControl(state, { type: "SELECT_TARGET", target: "HYBRID" });
  state = reduceExpertTranscriptionControl(state, { type: "SET_GEOMETRY_MODE", mode: "DERIVED" });
  state = reduceExpertTranscriptionControl(state, { type: "RESET_CAMERA" });
  assert.equal(state.selectedTarget, "HYBRID");
  assert.equal(state.geometryMode, "DERIVED");
  assert.equal(state.cameraRevision, 1);
  const reset = reduceExpertTranscriptionControl(state, { type: "RESET_SCENE" });
  assert.equal(reset.exactTime, 0);
  assert.equal(reset.selectedTarget, "NONE");
  assert.equal(reset.geometryMode, "DEPOSITED");
  assert.equal(reset.sceneRevision, 1);
  assert.deepEqual(validateExpertTranscriptionControlState(reset), []);
});

test("playback is bounded and exact-time seeking pauses", () => {
  let state = createExpertTranscriptionControlState(events, 8, 0);
  state = reduceExpertTranscriptionControl(state, { type: "TOGGLE_PLAY" });
  assert.equal(state.playing, true);
  state = reduceExpertTranscriptionControl(state, { type: "ADVANCE_TIME", deltaSeconds: 20 });
  assert.equal(state.exactTime, 0.25);
  state = reduceExpertTranscriptionControl(state, { type: "SEEK_EXACT_TIME", exactTime: 6 });
  assert.equal(state.exactTime, 6);
  assert.equal(state.playing, false);
});
