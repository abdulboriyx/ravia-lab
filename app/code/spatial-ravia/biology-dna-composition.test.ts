import assert from "node:assert/strict";
import test from "node:test";
import { dnaSceneFamilies } from "./biology-dna-representation-contract.ts";
import { getDnaCompositionPlan, isValidDnaCompositionPlan } from "./biology-dna-composition.ts";

test("each DNA family has a deterministic static composition", () => {
  for (const family of dnaSceneFamilies) {
    const first = getDnaCompositionPlan(family);
    const second = getDnaCompositionPlan(family);
    assert.equal(first, second);
    assert.equal(isValidDnaCompositionPlan(first), true);
  }
});

test("sequence regions are DNA-attached intervals, never floating bars", () => {
  const plan = getDnaCompositionPlan("sequence-regulation");
  assert.deepEqual(plan.annotations.map((annotation) => annotation.kind), ["enhancer", "promoter", "gene"]);
  for (const annotation of plan.annotations) {
    assert.equal(annotation.placement, "dna-attached");
    assert.ok(annotation.dnaInterval[0] < annotation.dnaInterval[1]);
  }
});

test("focus composition reduces context while retaining DNA-owned direction indicators", () => {
  const repair = getDnaCompositionPlan("damage-repair");
  const chemistry = getDnaCompositionPlan("local-chemistry");
  assert.equal(repair.localChemistry.frame, "selected-residue");
  assert.equal(chemistry.localChemistry.frame, "selected-base-pair");
  assert.ok(chemistry.context.dnaOpacity < repair.context.dnaOpacity);
  assert.equal(chemistry.directionality.indicators.every((indicator) => indicator.visible), true);
});
