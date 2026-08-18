import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { validateTeachingPlan, type TeachingPlan } from "./teaching-plan.ts";

test("F3-B teaching plan supports why, teaching sequencing, misconception correction, and all audience projections", () => {
  assert.deepEqual(validateTeachingPlan(teachingPlanFixture, scientificSceneSpecFixtures["rna-dna-stability"]), { valid: true, issues: [] });
  assert.deepEqual(teachingPlanFixture.projections.map((projection) => projection.audience), ["beginner", "intermediate", "advanced"]);
});

test("F3-B rejects dangling F2 references, unsupported audiences, malformed chapter order, mutations, and renderer fields", () => {
  const invalid = structuredClone(teachingPlanFixture) as TeachingPlan & Record<string, unknown>;
  invalid.camera = { fov: 42 };
  invalid.chapters[0]!.order = 2;
  invalid.chapters[0]!.focus[0] = { kind: "actor", actorId: "missing-actor" as typeof invalid.chapters[number]["focus"][number] extends { actorId: infer Id } ? Id : never };
  invalid.projections[0]!.audience = "expert" as never;
  (invalid as Record<string, unknown>).actors = [];
  const result = validateTeachingPlan(invalid, scientificSceneSpecFixtures["rna-dna-stability"]);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((entry) => entry.path === "plan.camera"));
    assert.ok(result.issues.some((entry) => entry.path.includes("chapters[0].order")));
    assert.ok(result.issues.some((entry) => entry.message.includes("missing F2 target")));
    assert.ok(result.issues.some((entry) => entry.message.includes("unsupported")));
    assert.ok(result.issues.some((entry) => entry.path === "plan.actors"));
  }
});

test("F3-B supports show, explain, compare, why, and misconception-correction request distinctions", () => {
  for (const requestMode of ["show", "explain", "compare", "why", "misconceptionCorrection"] as const) {
    const plan = { ...teachingPlanFixture, requestMode };
    assert.equal(validateTeachingPlan(plan, scientificSceneSpecFixtures["rna-dna-stability"]).valid, true, requestMode);
  }
});
