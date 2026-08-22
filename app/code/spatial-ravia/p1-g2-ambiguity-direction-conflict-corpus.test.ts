import assert from "node:assert/strict";
import test from "node:test";
import { ambiguityDirectionConflictCorpus, validateAmbiguityDirectionConflictCorpus } from "./p1-g2-ambiguity-direction-conflict-corpus.ts";

test("P1-G2 ambiguity corpus is structurally complete and preserves direction distinctions", () => {
  assert.deepEqual(validateAmbiguityDirectionConflictCorpus(), []);
  assert.ok(ambiguityDirectionConflictCorpus.length >= 20);
  assert.ok(ambiguityDirectionConflictCorpus.some(({ screenDirection }) => screenDirection === "screenLeft"));
  assert.ok(ambiguityDirectionConflictCorpus.some(({ biochemicalDirection }) => biochemicalDirection === "fiveToThree"));
  assert.ok(ambiguityDirectionConflictCorpus.some(({ expectedPolicyOutcome }) => expectedPolicyOutcome === "INVALID_SCIENTIFIC_REQUEST"));
  assert.ok(ambiguityDirectionConflictCorpus.some(({ clarificationRequired }) => clarificationRequired));
});
