import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runTeachingBenchmark, teachingBenchmarkCorpus, teachingBenchmarkHoldoutHash, teachingBenchmarkDimensions, teachingBenchmarkDevCorpus, teachingBenchmarkHoldoutCorpus } from "./teaching-benchmark.ts";

test("A-G freezes a 120-case 90/30 DEV/HOLDOUT corpus", () => {
  assert.equal(teachingBenchmarkCorpus.length, 120); assert.equal(teachingBenchmarkDevCorpus.length, 90); assert.equal(teachingBenchmarkHoldoutCorpus.length, 30); assert.match(teachingBenchmarkHoldoutHash, /^[a-f0-9]{64}$/); assert.equal(new Set(teachingBenchmarkCorpus.map((item) => item.caseId)).size, 120);
});

test("A-G corpus covers capabilities, modes, audiences, temporal stages, negatives, and metamorphics", () => {
  assert.deepEqual([...new Set(teachingBenchmarkCorpus.map((item) => item.mode))].sort(), ["compare", "explain", "misconceptionCorrection", "show", "why"]);
  assert.deepEqual([...new Set(teachingBenchmarkCorpus.map((item) => item.audience))].sort(), ["ADVANCED", "BEGINNER", "INTERMEDIATE"]);
  assert.ok(teachingBenchmarkCorpus.some((item) => item.family === "NEGATIVE")); assert.ok(teachingBenchmarkCorpus.some((item) => item.family === "METAMORPHIC")); assert.ok(teachingBenchmarkCorpus.some((item) => item.capability === "dna-local-chemistry")); assert.ok(teachingBenchmarkCorpus.some((item) => item.capability === "rna-fragmentation-unsupported"));
});

test("A-G DEV and sealed HOLDOUT pass every independent dimension with zero critical failures", () => {
  const report = runTeachingBenchmark(); assert.equal(report.total, 120); assert.equal(report.passed, 120); assert.equal(report.criticalFailures, 0); for (const dimension of teachingBenchmarkDimensions) assert.equal(report.dimensionScores[dimension], 1, dimension); assert.equal(report.bySplit.DEV.passed, 90); assert.equal(report.bySplit.SEALED_HOLDOUT.passed, 30);
});

test("A-G benchmark runtime is deterministic and metamorphic cases pass", () => {
  const first = runTeachingBenchmark(); const second = runTeachingBenchmark(); assert.deepEqual(first.results.map((item) => ({ id: item.caseId, passed: item.passed, dimensions: item.dimensions })), second.results.map((item) => ({ id: item.caseId, passed: item.passed, dimensions: item.dimensions }))); assert.ok(first.results.filter((item) => item.family === "METAMORPHIC").every((item) => item.dimensions.determinism)); assert.ok(first.runtimeMs >= 0);
});

test("A-G teaching authority audit finds no prompt, scientific-rule, renderer, or wall-clock authority in the benchmarked teaching layers", () => {
  const files = ["teaching-benchmark.ts", "teaching-text.ts", "teaching-snapshot.ts"].map((file) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8")).join("\n");
  assert.doesNotMatch(files, /rawPrompt|rawUtterance|prompt.*parse|parse.*prompt|from ['\"](three|@react-three|molstar)|camera|geometry|coordinates|materials|WebAudio|requestAnimationFrame|setInterval/);
});
