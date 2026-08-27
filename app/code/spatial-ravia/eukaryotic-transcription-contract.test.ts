import assert from "node:assert/strict";
import test from "node:test";
import {
  applyEukaryoticTranscriptionAction,
  createInitialEukaryoticTranscriptionState,
  eukaryoticTranscriptionIdentity,
  eukaryoticTranscriptionTransitionTable,
  validateEukaryoticTranscriptionState,
} from "./eukaryotic-transcription-contract.ts";

function action(actionId: string, kind: Parameters<typeof applyEukaryoticTranscriptionAction>[1]["kind"], atSeconds: number, extra: Record<string, unknown> = {}) {
  return { actionId, kind, atSeconds, requestedBy: "TIMELINE" as const, ...extra } as Parameters<typeof applyEukaryoticTranscriptionAction>[1];
}

function apply(state: ReturnType<typeof createInitialEukaryoticTranscriptionState>, next: Parameters<typeof applyEukaryoticTranscriptionAction>[1]) {
  const result = applyEukaryoticTranscriptionAction(state, next);
  assert.equal(result.accepted, true, result.accepted ? "" : result.reason);
  return result.state;
}

test("the contract freezes eukaryotic nuclear Pol II identity and honest source fidelity", () => {
  const unavailable = createInitialEukaryoticTranscriptionState();
  assert.deepEqual(unavailable.identity, eukaryoticTranscriptionIdentity);
  assert.equal(unavailable.polymerase.sourceStatus, "REQUIRED_NOT_CONFIGURED");
  assert.equal(unavailable.fidelity, "S2_SCHEMATIC");
  assert.equal(validateEukaryoticTranscriptionState(unavailable).valid, true);

  const deposited = createInitialEukaryoticTranscriptionState({ sourceStatus: "AVAILABLE", sourceId: "future-pol2-elongation" });
  assert.equal(deposited.fidelity, "E0_DEPOSITED");
  assert.equal(validateEukaryoticTranscriptionState(deposited).valid, true);
});

test("the legal action path is explicit, immutable, and phase-consistent", () => {
  let state = createInitialEukaryoticTranscriptionState({ templateSequence: "ATGC" });
  state = apply(state, action("pic", "ASSEMBLE_PIC", 0.1));
  state = apply(state, action("open", "OPEN_PROMOTER", 0.2));
  state = apply(state, action("initiate", "INITIATE_TRANSCRIPT", 0.3));
  state = apply(state, action("add-1", "ADD_NUCLEOTIDE", 0.4, { nucleotide: "U" }));
  state = apply(state, action("pause", "PAUSE", 0.5, { pauseReason: "USER_CONTROL" }));
  state = apply(state, action("resume", "RESUME", 0.6));
  state = apply(state, action("terminate", "BEGIN_TERMINATION", 0.7));
  state = apply(state, action("release-rna", "RELEASE_TRANSCRIPT", 0.8));
  state = apply(state, action("release-pol2", "RELEASE_POLYMERASE", 0.9));
  assert.equal(state.phase, "POLYMERASE_RELEASED");
  assert.equal(state.transcript.status, "RELEASED");
  assert.equal(state.transcript.sequence, "U");
  assert.equal(state.transcript.hybridLength, 0);
  assert.equal(state.polymerase.state, "RELEASED");
  assert.equal(validateEukaryoticTranscriptionState(state).valid, true);
});

test("illegal actions are rejected without mutating state", () => {
  const state = createInitialEukaryoticTranscriptionState({ templateSequence: "AT" });
  const result = applyEukaryoticTranscriptionAction(state, action("bad-add", "ADD_NUCLEOTIDE", 0.1, { nucleotide: "A" }));
  assert.equal(result.accepted, false);
  assert.equal(result.code, "ILLEGAL_TRANSITION");
  assert.deepEqual(result.state, state);

  let initiated = createInitialEukaryoticTranscriptionState({ templateSequence: "AT" });
  initiated = apply(initiated, action("pic", "ASSEMBLE_PIC", 0.1));
  initiated = apply(initiated, action("open", "OPEN_PROMOTER", 0.2));
  initiated = apply(initiated, action("initiate", "INITIATE_TRANSCRIPT", 0.3));
  const mismatch = applyEukaryoticTranscriptionAction(initiated, action("wrong-base", "ADD_NUCLEOTIDE", 0.4, { nucleotide: "A" }));
  assert.equal(mismatch.accepted, false);
  assert.equal(mismatch.code, "TEMPLATE_COMPLEMENT_MISMATCH");
  assert.deepEqual(mismatch.state, initiated);
});

test("transition table prevents hidden prompt-specific transitions", () => {
  assert.deepEqual(eukaryoticTranscriptionTransitionTable.ADD_NUCLEOTIDE, ["INITIATING", "ELONGATING"]);
  assert.deepEqual(eukaryoticTranscriptionTransitionTable.RELEASE_TRANSCRIPT, ["TERMINATING"]);
  assert.deepEqual(eukaryoticTranscriptionTransitionTable.RELEASE_POLYMERASE, ["TRANSCRIPT_RELEASED"]);
});

