import test from "node:test";
import assert from "node:assert/strict";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression.ts";
import { projectGeneExpressionProductionAtTime } from "./gene-expression-production.ts";
import { deriveTranscriptionPresentationState, isValidTranscriptionPresentationState } from "./transcription-presentation-state.ts";

const program = createCanonicalEukaryoticGeneExpressionProgram();
const times = [0.1, 0.25, 0.4, 0.75, 1.0, 1.25, 1.6, 1.8, 1.95] as const;
const boundaryTimes = [0, 0.001, 0.499, 0.5, 0.501, 1.499, 1.5, 1.501, 1.999, 2] as const;

function stateAt(time: number) {
  const result = projectGeneExpressionProductionAtTime(program, time);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("projection failure");
  return deriveTranscriptionPresentationState(program, result.projection);
}

test("continuous transcription presentation is deterministic and bounded", () => {
  for (const state of times.map(stateAt)) {
    for (const value of [state.normalizedProgress, state.polymeraseGenePosition, state.bubbleCenter, state.bubbleOpenFraction, state.bubbleWidth, state.dnaRepairProgress, state.nascentRnaVisualLength, state.nascentRnaAnchor, state.polymeraseEngagement, state.transcriptReleaseProgress]) {
      assert.equal(Number.isFinite(value), true);
    }
    assert.equal(state.polymeraseGenePosition, state.bubbleCenter);
    assert.equal(state.polymeraseGenePosition, state.nascentRnaAnchor);
    assert.ok(state.polymeraseGenePosition >= 0 && state.polymeraseGenePosition <= 1);
    assert.ok(state.bubbleOpenFraction >= 0 && state.bubbleOpenFraction <= 1);
  }
});

test("polymerase, bubble, and RNA anchor move monotonically through elongation", () => {
  const states = times.map(stateAt);
  const positions = states.map((state) => state.polymeraseGenePosition);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(states[2]!.bubbleOpenFraction > 0);
  assert.ok(states[2]!.nascentRnaVisualLength < states[4]!.nascentRnaVisualLength);
  assert.ok(states[4]!.nascentRnaVisualLength < states[6]!.nascentRnaVisualLength);
});

test("exact-time reconstruction has no future RNA leakage and closes after termination", () => {
  assert.equal(stateAt(0.1).nascentRnaVisualLength, 0);
  assert.equal(stateAt(0.25).nascentRnaVisualLength, 0);
  assert.equal(stateAt(2).bubbleOpenFraction, 0);
  const early = stateAt(0.75);
  const late = stateAt(1.8);
  assert.ok(late.polymeraseGenePosition > early.polymeraseGenePosition);
  assert.equal(stateAt(0.75).polymeraseGenePosition, early.polymeraseGenePosition);
});

test("chapter and scrub boundaries always return a complete render-safe object", () => {
  for (const time of boundaryTimes) {
    const state = stateAt(time);
    assert.equal(isValidTranscriptionPresentationState(state), true);
    assert.deepEqual(Object.keys(state).sort(), [
      "bubbleCenter", "bubbleOpenFraction", "bubbleWidth", "dnaRepairProgress", "exactTimeSeconds",
      "nascentRnaAnchor", "nascentRnaVisualLength", "normalizedProgress", "polymeraseEngagement",
      "polymeraseGenePosition", "schemaVersion", "transcriptReleaseProgress",
    ].sort());
  }
});
