import assert from "node:assert/strict";
import test from "node:test";
import { p4GVisualCorpus, p4GVisualCorpusHash, runP4GVisualBenchmark } from "./p4-g-visual-benchmark.ts";

test("P4-G freezes a 40-case DEV/HOLDOUT visual corpus", () => {
  assert.equal(p4GVisualCorpus.length, 40);
  assert.equal(p4GVisualCorpus.filter((item) => item.split === "DEV").length, 30);
  assert.equal(p4GVisualCorpus.filter((item) => item.split === "HOLDOUT").length, 10);
  assert.match(p4GVisualCorpusHash, /^fnv1a:[0-9a-f]{8}$/);
  assert.equal(new Set(p4GVisualCorpus.map((item) => item.id)).size, 40);
});

test("P4-G structural and semantic DEV benchmark passes with explicit pixel/manual status", async () => {
  const report = await runP4GVisualBenchmark("DEV");
  assert.equal(report.total, 30);
  assert.equal(report.dev.passed, 30);
  assert.equal(report.criticalFailures, 0);
  assert.equal(report.results.every((item) => item.pixel === "UNVERIFIED" && item.manual === "UNVERIFIED"), true);
});

test("P4-G sealed HOLDOUT preserves owner, failure, and exact-frame invariants", async () => {
  const report = await runP4GVisualBenchmark("HOLDOUT");
  assert.equal(report.total, 10);
  assert.equal(report.holdout.passed, 10, JSON.stringify(report.results));
  assert.equal(report.criticalFailures, 0);
});

test("P4-G repeated corpus execution is deterministic", async () => {
  const first = await runP4GVisualBenchmark();
  const second = await runP4GVisualBenchmark();
  assert.deepEqual(first, second);
});
