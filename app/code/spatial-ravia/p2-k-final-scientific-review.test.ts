import assert from "node:assert/strict";
import test from "node:test";
import { capabilityRegistry } from "./capability-registry.ts";
import { p2KAuthorityReview, p2KCapabilityClassification, p2KFreshHoldout, p2KFreshHoldoutHash, p2KReviewVersion, runP2KDeterminism, runP2KFreshHoldout, runP2KMetamorphic } from "./p2-k-final-scientific-review.ts";

test("P2-K freezes a fresh 30-case holdout before execution", () => {
  assert.equal(p2KReviewVersion, "p2-k-v1");
  assert.equal(p2KFreshHoldout.length, 30);
  assert.equal(p2KFreshHoldoutHash.length, 64);
  assert.equal(new Set(p2KFreshHoldout.map((item) => item.id)).size, 30);
});

test("P2-K fresh holdout passes with no critical scientific failures", () => {
  const result = runP2KFreshHoldout();
  assert.equal(result.total, 30);
  assert.equal(result.passed, 30);
  assert.equal(result.criticalFailures, 0);
});

test("P2-K preserves meaning under metamorphic and repeated execution", () => {
  assert.deepEqual(runP2KMetamorphic(), { preserved: true, cases: 1 });
  assert.equal(runP2KDeterminism().deterministic, true);
});

test("P2-K records authority ownership, computed gap, and deferred visual gate", () => {
  assert.equal(p2KAuthorityReview.P2B, "source/provenance");
  assert.equal(p2KAuthorityReview.P2E, "scientific interactions/topology");
  assert.equal(p2KAuthorityReview.P2J1, "non-authoritative owner projection");
  assert.equal(p2KAuthorityReview.computedTopology, "COMPUTED_STRUCTURE_CONTEXT_GAP");
  assert.equal(p2KAuthorityReview.deferredGate, "P2_J_VISUAL_ACCEPTANCE_PENDING");
  assert.equal(p2KAuthorityReview.visualStatus, "UNVERIFIED — ENVIRONMENT BLOCKED");
  assert.equal(p2KCapabilityClassification.length, capabilityRegistry.length);
});
