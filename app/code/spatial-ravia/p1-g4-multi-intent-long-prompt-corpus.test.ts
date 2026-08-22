import assert from "node:assert/strict";
import test from "node:test";
import { multiIntentLongPromptCorpus, validateMultiIntentLongPromptCorpus } from "./p1-g4-multi-intent-long-prompt-corpus.ts";

test("P1-G4 multi-intent corpus preserves shared request references and F1 sequence limits", () => {
  assert.deepEqual(validateMultiIntentLongPromptCorpus(), []);
  assert.ok(multiIntentLongPromptCorpus.length >= 18);
  assert.ok(multiIntentLongPromptCorpus.some(({ expectedActs }) => expectedActs.includes("show") && expectedActs.includes("explain")));
  assert.ok(multiIntentLongPromptCorpus.some(({ expectedActs }) => expectedActs.includes("compare") && expectedActs.includes("animate")));
  assert.ok(multiIntentLongPromptCorpus.some(({ sequenceRepresentableUnderF1V1 }) => !sequenceRepresentableUnderF1V1));
  assert.ok(multiIntentLongPromptCorpus.some(({ expectedConflictHandoff }) => expectedConflictHandoff.includes("P1-D")));
  assert.ok(multiIntentLongPromptCorpus.some(({ expectedConflictHandoff }) => expectedConflictHandoff.includes("P1-E")));
});
