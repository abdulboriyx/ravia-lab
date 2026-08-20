import assert from "node:assert/strict";
import test from "node:test";
import { benchmarkFailureCategories, createBenchmarkReport, validateBenchmarkReport, type BenchmarkCaseResult, type BenchmarkReport } from "./benchmark-report.ts";

const expected = { disposition: "accepted", summary: "A supported local RNA scene." } as const;
const passing: BenchmarkCaseResult = { caseId: "rna-01", family: "rna", expected, actual: expected, passed: true, failures: [] };
const failing: BenchmarkCaseResult = {
  caseId: "dna-02", family: "dna", expected: { disposition: "accepted", summary: "A paired DNA duplex." }, actual: { disposition: "unsupported", summary: "No supported route." }, passed: false,
  failures: [{ category: "capabilityMismatch", severity: "error", detail: "The expected capability was not resolved." }, { category: "supportPolicyMismatch", severity: "blocker", detail: "A supported case became unsupported." }],
};

test("F6-D creates a deterministic report with all requested aggregate fields", () => {
  const first = createBenchmarkReport([passing, failing]);
  const second = createBenchmarkReport([failing, passing]);
  assert.deepEqual(first, second);
  assert.equal(first.total, 2);
  assert.equal(first.passed, 1);
  assert.equal(first.failed, 1);
  assert.deepEqual(first.familyCounts, [{ family: "dna", total: 1, passed: 0, failed: 1 }, { family: "rna", total: 1, passed: 1, failed: 0 }]);
  assert.deepEqual(first.failingCaseIds, ["dna-02"]);
  assert.deepEqual(first.categoryCounts.map((item) => item.category), benchmarkFailureCategories);
  assert.equal(validateBenchmarkReport(first).valid, true);
});

test("F6-D preserves expected-versus-actual outcomes and failure severity per case", () => {
  const report = createBenchmarkReport([failing]);
  assert.equal(report.results[0]!.expected.disposition, "accepted");
  assert.equal(report.results[0]!.actual.disposition, "unsupported");
  assert.deepEqual(report.results[0]!.failures.map((failure) => failure.severity), ["error", "blocker"]);
});

test("F6-D rejects noncanonical aggregates and unclassified failed cases", () => {
  const source = createBenchmarkReport([passing, failing]);
  const invalid: BenchmarkReport = { ...source, passed: 2, results: source.results.map((entry, index) => index === 0 ? { ...entry, failures: [] } : entry) };
  const result = validateBenchmarkReport(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((entry) => entry.path === "report.passed"));
    assert.ok(result.issues.some((entry) => entry.path.endsWith(".failures")));
  }
});
