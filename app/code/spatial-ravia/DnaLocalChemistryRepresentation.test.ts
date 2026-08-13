import assert from "node:assert/strict";
import test from "node:test";
import { getDnaLocalChemistryPlan, isValidDnaLocalChemistryPlan } from "./DnaLocalChemistryRepresentation.ts";

test("G-C local chemistry has three distinct hydrogen-bond connectors", () => {
  const plan = getDnaLocalChemistryPlan("gc-base-pair");
  assert.equal(plan.bonds.filter((bond) => bond.kind === "hydrogen").length, 3);
  assert.deepEqual(new Set(plan.actors.map((actor) => actor.label)), new Set(["Guanine", "Cytosine"]));
  assert.equal(plan.view.focus, "base-pair");
});

test("an individual nucleotide contains phosphate, deoxyribose, and a nitrogenous base", () => {
  const plan = getDnaLocalChemistryPlan("nucleotide");
  assert.equal(plan.atoms.some((atom) => atom.role === "phosphate" && atom.element === "P"), true);
  assert.equal(plan.atoms.some((atom) => atom.role === "sugar"), true);
  assert.equal(plan.atoms.some((atom) => atom.role === "base"), true);
  assert.equal(plan.view.focus, "nucleotide");
});

test("thymine dimer explicitly contains two adjacent thymine lesion actors and crosslinks", () => {
  const plan = getDnaLocalChemistryPlan("thymine-dimer");
  assert.equal(plan.actors.filter((actor) => actor.id.startsWith("thymine-")).length, 2);
  assert.equal(plan.bonds.filter((bond) => bond.kind === "lesion-crosslink").length, 2);
  assert.ok(plan.atoms.filter((atom) => atom.role === "context").length > 0);
});

test("mismatch chemistry stays local and distinguishes its noncovalent contact", () => {
  const plan = getDnaLocalChemistryPlan("mismatch");
  assert.equal(plan.bonds.filter((bond) => bond.kind === "hydrogen").length, 1);
  assert.equal(plan.actors.some((actor) => actor.kind === "repair-context" && actor.emphasis === "secondary"), true);
  for (const subject of ["gc-base-pair", "nucleotide", "thymine-dimer", "mismatch"] as const) {
    const local = getDnaLocalChemistryPlan(subject);
    assert.equal(isValidDnaLocalChemistryPlan(local), true);
    assert.equal(local.camera.framing, "local");
    assert.ok(local.camera.distanceScale <= 0.32);
  }
});
