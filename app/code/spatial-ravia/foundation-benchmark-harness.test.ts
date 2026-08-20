import assert from "node:assert/strict";
import test from "node:test";
import { foundationContractBenchmarkCases, foundationContractBenchmarkInvariants } from "./foundation-benchmark-fixtures.ts";
import { runFoundationContractBenchmark, validateFoundationBenchmarkCases } from "./foundation-benchmark-harness.ts";
const cases = foundationContractBenchmarkCases;

test("F6-A harness records all contract case categories and validates frozen contracts", () => {
  assert.equal(validateFoundationBenchmarkCases(cases).valid, true);
  const result = runFoundationContractBenchmark(cases, foundationContractBenchmarkInvariants);
  assert.equal(result.schemaVersion, "1");
  assert.equal(result.total, cases.length);
  assert.equal(result.failed, 0, JSON.stringify(result.cases.filter((entry) => !entry.passed), null, 2));
  assert.deepEqual(new Set(cases.map((entry) => entry.family)), new Set(["semanticIntent", "scientificSceneSpec", "timeline", "teachingPlan", "export", "sceneSpecV1", "capabilityRegistry"]));
  assert.deepEqual(new Set(cases.map((entry) => entry.kind)), new Set(["positive", "negative", "preservation", "crossContract"]));
});

test("F6-A metadata validation rejects duplicate IDs and undocumented negative failures", () => {
  const malformed = [{ ...cases[0]!, caseId: "duplicate" }, { ...cases[0]!, caseId: "duplicate" }, { ...cases[1]!, failure: undefined }];
  const result = validateFoundationBenchmarkCases(malformed);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path.includes("caseId")));
    assert.ok(result.issues.some((issue) => issue.path.includes("failure")));
  }
});

test("F6-A harness exposes deterministic failures for missing validators and invariants", () => {
  const result = runFoundationContractBenchmark([{ ...cases[0]!, family: "semanticIntent", expected: { valid: true, outcome: "not-this-outcome", invariants: ["missing"] } }], {});
  assert.equal(result.failed, 1);
  assert.ok(result.cases[0]!.failures.some((failure) => failure.category === "fixture"));
  assert.ok(result.cases[0]!.failures.some((failure) => failure.category === "outcome"));
});
