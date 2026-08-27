import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression.ts";
import {
  createInitialEukaryoticTranscriptionState,
  deriveEukaryoticTranscriptionCausalStateAtTime,
  deriveEukaryoticTranscriptionVisualConsequences,
  reduceEukaryoticTranscriptionAction,
  validateEukaryoticTranscriptionCausalState,
} from "./eukaryotic-transcription-causal-state.ts";

function apply(state: ReturnType<typeof createInitialEukaryoticTranscriptionState>, action: Parameters<typeof reduceEukaryoticTranscriptionAction>[1]) {
  const result = reduceEukaryoticTranscriptionAction(state, action);
  if (!result.ok) throw new Error(`${result.code}: ${result.reason}`);
  assert.deepEqual(validateEukaryoticTranscriptionCausalState(result.state), []);
  return result.state;
}

test("causal action sequence has explicit visible consequences", () => {
  let state = createInitialEukaryoticTranscriptionState();
  state = apply(state, { type: "OPEN_DNA_LOCALLY", openingFraction: 0.7 });
  state = apply(state, { type: "ENGAGE_POL_II" });
  state = apply(state, { type: "TRANSLOCATE_POL_II", axisPosition: 0.97 });
  state = apply(state, { type: "EXTEND_RNA_5_TO_3", nucleotideCount: 3 });
  state = apply(state, { type: "MAINTAIN_RNA_DNA_HYBRID" });
  const active = deriveEukaryoticTranscriptionVisualConsequences(state);
  assert.equal(active.localBubbleVisible > 0, true);
  assert.equal(active.polymeraseTranslocating, true);
  assert.equal(active.nascentRnaVisible, 1);
  assert.equal(active.hybridVisible, 1);
  state = apply(state, { type: "RELEASE_RNA" });
  assert.equal(deriveEukaryoticTranscriptionVisualConsequences(state).transcriptDetached, true);
  state = apply(state, { type: "CLOSE_BUBBLE" });
  assert.equal(state.dnaOpening, 0);
  assert.equal(state.bubbleClosure, 1);
  assert.equal(state.hybridLength, 0);
  assert.equal(state.transcriptReleased, true);
});

test("causal reducer rejects actions that violate biological order without mutating state", () => {
  const initial = createInitialEukaryoticTranscriptionState();
  const rejected = reduceEukaryoticTranscriptionAction(initial, { type: "TRANSLOCATE_POL_II", axisPosition: 0.5 });
  assert.equal(rejected.ok, false);
  if (rejected.ok) return;
  assert.equal(rejected.code, "TRANSLOCATION_REQUIRES_ENGAGEMENT");
  assert.deepEqual(rejected.state, initial);
  const open = apply(initial, { type: "OPEN_DNA_LOCALLY" });
  const engaged = apply(open, { type: "ENGAGE_POL_II" });
  const moved = apply(engaged, { type: "TRANSLOCATE_POL_II", axisPosition: 0.4 });
  const backwards = reduceEukaryoticTranscriptionAction(moved, { type: "TRANSLOCATE_POL_II", axisPosition: 0.3 });
  assert.equal(backwards.ok, false);
  if (!backwards.ok) assert.equal(backwards.code, "TRANSLOCATION_OUT_OF_ORDER");
});

test("canonical renderer endpoint reaches RNA release and bubble closure", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const state = deriveEukaryoticTranscriptionCausalStateAtTime(program, 2.35);
  assert.equal(state.transcriptReleased, true);
  assert.equal(state.transcriptRelease, 1);
  assert.equal(state.bubbleClosure, 1);
  assert.equal(state.dnaOpening, 0);
  assert.equal(state.polymeraseEngagement, 0);
});
