import assert from "node:assert/strict";
import test from "node:test";
import { createP3FDevCorpus, createP3FSealedHoldout, p3fCorpusVersion, p3fHoldoutHash, runP3FBenchmark, summarizeP3FResults } from "./p3-f-mechanism-presentation-benchmark.ts";

test("P3-F corpus has frozen DEV and sealed holdout coverage", () => {
  const dev = createP3FDevCorpus(); const holdout = createP3FSealedHoldout();
  assert.equal(p3fCorpusVersion, "p3-f-v1");
  assert.equal(dev.length, 90); assert.equal(holdout.length, 30);
  assert.equal(new Set([...dev, ...holdout].map((item) => item.id)).size, 120);
  assert.equal(p3fHoldoutHash.length, 64);
  assert.equal(dev.filter((item) => item.family === "DNA").length, 35);
  assert.equal(dev.filter((item) => item.family === "RNA").length, 35);
  assert.equal(holdout.filter((item) => item.scenario === "exonuclease-gap").length > 0, true);
});

test("P3-F DEV benchmark passes all cases and reports dimensions independently", () => {
  const results = runP3FBenchmark(createP3FDevCorpus());
  const summary = summarizeP3FResults(results);
  assert.equal(summary.total, 90);
  assert.equal(summary.passed, 90);
  assert.equal(summary.criticalFailures, 0);
  assert.equal(summary.dimensions.timelineValidation, 90);
  assert.equal(summary.dimensions.temporalCompilation >= 70, true);
  assert.equal(summary.dimensions.seekReversibility >= 70, true);
});

test("P3-F sealed holdout passes once without expectation mutation", () => {
  const holdout = createP3FSealedHoldout();
  const frozen = JSON.stringify(holdout);
  const results = runP3FBenchmark(holdout);
  const summary = summarizeP3FResults(results);
  assert.equal(JSON.stringify(holdout), frozen);
  assert.equal(summary.total, 30);
  assert.equal(summary.passed, 30);
  assert.equal(summary.criticalFailures, 0);
});

test("P3-F repeated execution is deterministic", () => {
  const cases = createP3FSealedHoldout().slice(0, 8);
  assert.deepEqual(runP3FBenchmark(cases), runP3FBenchmark(cases));
});
