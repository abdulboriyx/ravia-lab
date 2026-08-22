import assert from "node:assert/strict";
import test from "node:test";
import { capabilityRegistry } from "./capability-registry.ts";
import { p2IDevCases, p2IHoldoutCases, runP2IBenchmark, runP2IDeterminism, runP2IMetamorphic } from "./p2-i-scientific-benchmark.ts";
import { runSealedP2IHoldoutOnce, sealedP2IHoldoutCases } from "./p2-i-scientific-benchmark.holdout.ts";

test("P2-I corpus has a frozen dev/holdout split and covers every registered capability", () => {
  assert.ok(p2IDevCases.length >= 80);
  assert.ok(p2IHoldoutCases.length >= 20);
  const covered = new Set([...p2IDevCases, ...p2IHoldoutCases].map((item) => item.capabilityId));
  assert.deepEqual([...capabilityRegistry].map((item) => item.capabilityId).filter((id) => !covered.has(id)), []);
  assert.equal(sealedP2IHoldoutCases.length, p2IHoldoutCases.length);
});

test("P2-I dev and sealed holdout meet critical-error acceptance", () => {
  const dev = runP2IBenchmark(p2IDevCases);
  const holdout = runSealedP2IHoldoutOnce();
  assert.equal(dev.criticalFailures, 0);
  assert.equal(holdout.criticalFailures, 0);
  assert.equal(holdout.noncriticalFailures, 0);
  assert.equal(holdout.passed, holdout.total);
});

test("P2-I execution is deterministic across repeated corpus runs", () => {
  const result = runP2IDeterminism([...p2IDevCases, ...p2IHoldoutCases]);
  assert.equal(result.deterministic, true);
});

test("P2-I preserves semantics under irrelevant corpus/inventory ordering", () => {
  const result = runP2IMetamorphic([...p2IDevCases, ...p2IHoldoutCases]);
  assert.ok(result.total > 0);
  assert.equal(result.preserved, true);
});

test("P2-I preserves explicit computed-gap and ambiguity outcomes", () => {
  const result = runP2IBenchmark([...p2IDevCases, ...p2IHoldoutCases]);
  const gaps = result.results.filter((item) => item.kind === "UNSUPPORTED_CURRENT_GROUNDING_PATH");
  assert.equal(gaps.length, 10);
  assert.equal(gaps.every((item) => item.passed), true);
  const negatives = result.results.filter((item) => item.id.includes("negative"));
  assert.equal(negatives.every((item) => item.passed), true);
});
