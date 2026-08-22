import assert from "node:assert/strict";
import test from "node:test";
import { misconceptionInvalidScienceCorpus, validateMisconceptionInvalidScienceCorpus } from "./p1-g3-misconception-invalid-science-corpus.ts";

test("P1-G3 science-error corpus preserves user claims and only names P1-E outcomes", () => {
  assert.deepEqual(validateMisconceptionInvalidScienceCorpus(), []);
  assert.ok(misconceptionInvalidScienceCorpus.length >= 20);
  assert.deepEqual(new Set(misconceptionInvalidScienceCorpus.map(({ expectedOutcome }) => expectedOutcome)), new Set(["ACCEPT", "CLAIM_REQUIRES_GROUNDING", "CORRECTION_REQUIRED", "INVALID_SCIENTIFIC_REQUEST"]));
  for (const entry of misconceptionInvalidScienceCorpus) {
    for (const claim of entry.preservedClaims) assert.equal(entry.rawPrompt.includes(claim.rawText), true, `${entry.caseId}: claim must remain verbatim in prompt`);
  }
});
