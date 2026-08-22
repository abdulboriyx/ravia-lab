import assert from "node:assert/strict";
import test from "node:test";
import { p1AdversarialCorpus, p1DevelopmentCorpus, p1SealedHoldoutCorpus, validateP1AdversarialCorpus, validateP1HoldoutSealing } from "./p1-adversarial-corpus.ts";
import { runP1DevelopmentBenchmark } from "./p1-adversarial-benchmark.ts";

test("P1-G5 corpus is authoritative, deduplicated, balanced, and sealed", () => {
  assert.deepEqual(validateP1AdversarialCorpus(), []);
  assert.deepEqual(validateP1HoldoutSealing(), []);
  assert.equal(p1AdversarialCorpus.length, 86);
  assert.ok(p1DevelopmentCorpus.length / p1AdversarialCorpus.length >= 0.7 && p1DevelopmentCorpus.length / p1AdversarialCorpus.length <= 0.8);
  assert.equal(p1DevelopmentCorpus.length + p1SealedHoldoutCorpus.length, p1AdversarialCorpus.length);
  assert.ok(new Set(p1AdversarialCorpus.map(({ domain }) => domain)).size === 3);
});

test("P1-G5 development baseline is deterministic and never opens sealed holdout", () => {
  assert.deepEqual(runP1DevelopmentBenchmark(), runP1DevelopmentBenchmark());
  assert.throws(() => runP1DevelopmentBenchmark([p1SealedHoldoutCorpus[0]!]), /sealed-holdout/);
});
