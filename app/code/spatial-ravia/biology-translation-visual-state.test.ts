import assert from "node:assert/strict";
import test from "node:test";
import { getTranslationMotionState } from "./biology-motion-state.ts";
import { deriveTranslationVisualState } from "./biology-translation-visual-state.ts";

const frame = (phaseId: string, phaseProgress = 0.5) => ({ timeMs: 0, phaseId, phaseLabel: phaseId, phaseIndex: 0, phaseDurationMs: 1, phaseProgress, normalizedTime: phaseProgress, state: {} });

test("translation visual state makes recognition transfer and exit phase-explicit", () => {
  const recognition = deriveTranslationVisualState(getTranslationMotionState(frame("codon-recognition")));
  const transfer = deriveTranslationVisualState(getTranslationMotionState(frame("peptide-transfer")));
  const exit = deriveTranslationVisualState(getTranslationMotionState(frame("trna-exit")));
  assert.equal(recognition.recognition, true);
  assert.equal(recognition.activeSites.a > recognition.activeSites.e, true);
  assert.equal(transfer.peptideTransfer, true);
  assert.equal(transfer.activeSites.a, transfer.activeSites.p);
  assert.equal(exit.exiting, true);
  assert.equal(exit.activeSites.e > exit.activeSites.a, true);
});
