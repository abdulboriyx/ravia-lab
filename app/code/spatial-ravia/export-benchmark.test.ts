import assert from "node:assert/strict";
import test from "node:test";
import { exportBenchmarkCorpusV1, runExportBenchmark } from "./export-benchmark.ts";

test("B-H corpus freezes 100 cases with 75 DEV and 25 sealed holdout", () => {
  const corpus = exportBenchmarkCorpusV1();
  assert.equal(corpus.length, 100);
  assert.equal(corpus.filter((item) => item.split === "DEV").length, 75);
  assert.equal(corpus.filter((item) => item.split === "SEALED_HOLDOUT").length, 25);
  assert.equal(new Set(corpus.map((item) => item.caseId)).size, corpus.length);
});

test("B-H structural export benchmark passes without ffmpeg or browser raster runtime", async () => {
  const report = await runExportBenchmark();
  assert.equal(report.total, 100);
  assert.equal(report.passed, 100);
  assert.equal(report.criticalFailures, 0);
  assert.deepEqual(report.bySplit, { DEV: { total: 75, passed: 75 }, SEALED_HOLDOUT: { total: 25, passed: 25 } });
  assert.equal(report.realVideoStatus, "UNVERIFIED — RUNTIME UNAVAILABLE");
  assert.equal(report.visualStatus, "UNVERIFIED — ENVIRONMENT BLOCKED");
  assert.ok(report.partialStatuses.includes("ENCODER_UNAVAILABLE"));
  assert.ok(report.unsupportedStatuses.includes("MOLSTAR_EXACT_FRAME_UNSUPPORTED"));
});
