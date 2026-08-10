import assert from "node:assert/strict";
import test from "node:test";
import {
  formatFailureAnalysis,
  runSpatialRaviaEvaluation,
  spatialRaviaEvaluationCases
} from "./evaluation.ts";

test("formal scientific evaluation suite covers remaining feature cases and required dimensions", () => {
  const report = runSpatialRaviaEvaluation();
  const dimensions = new Set(report.results.flatMap((result) =>
    result.checks.map((check) => check.dimension)
  ));
  const categories = new Set(report.results.map((result) => result.category));

  assert.ok(spatialRaviaEvaluationCases.length >= 60);
  assert.equal(report.totalCases, spatialRaviaEvaluationCases.length);
  assert.ok(categories.has("paraphrase"));
  assert.ok(categories.has("misspelling"));
  assert.ok(categories.has("ambiguous-process"));
  assert.ok(categories.has("incorrect-assumption"));
  assert.ok(categories.has("impossible-intervention"));
  assert.ok(categories.has("unsupported-process"));
  assert.ok(categories.has("mixed-organism-context"));
  assert.ok(categories.has("conflicting-instructions"));
  assert.ok(categories.has("misleading-3d-request"));
  assert.ok(categories.has("entity-alias-collision"));
  assert.ok(categories.has("adversarial-hallucination"));
  assert.ok(dimensions.has("process-selection"));
  assert.ok(dimensions.has("context-extraction"));
  assert.ok(dimensions.has("entity-resolution"));
  assert.ok(dimensions.has("model-construction"));
  assert.ok(dimensions.has("abstention"));
  assert.ok(dimensions.has("scientific-invariants"));
  assert.ok(dimensions.has("follow-up-state"));
  assert.ok(dimensions.has("representation-selection"));
  assert.ok(dimensions.has("visualization-honesty"));
});

test("formal scientific evaluation produces machine and human-readable analysis", () => {
  const report = runSpatialRaviaEvaluation();
  const analysis = formatFailureAnalysis(report);

  assert.equal(report.suite, "spatial-ravia-scientific-evaluation");
  assert.ok(report.totalCases >= 60);
  assert.ok("results" in report);
  assert.ok(analysis.includes("Failure Analysis"));
  assert.ok(analysis.includes("Build, type-check, and lint success are implementation checks only."));
});
