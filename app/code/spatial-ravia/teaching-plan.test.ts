import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { validateTeachingPlan, type TeachingPlan } from "./teaching-plan.ts";
import { timelineFixture } from "./scientific-timeline-fixtures.ts";

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

test("A-B TeachingPlan v2 validates authoritative state, interaction, topology, and timeline targets", () => {
  const scene = scientificSceneSpecFixtures.cleavage;
  const plan: TeachingPlan = { schemaVersion: "2", planId: "cleavage-teaching-v2", sceneId: scene.sceneId, requestMode: "explain", learningObjective: "Explain cleavage.", objectiveTrace: { objectiveKind: "EXPLAIN_MECHANISM", capabilityId: "rna-cleavage", phenomenon: "cleavage", targetActorIds: [scene.actors[0]!.actorId], requestMode: "explain" }, prerequisiteAssumptions: [], chapters: [{ chapterId: "grounded-cleavage", order: 1, title: "Grounded cleavage", focus: [{ kind: "scientificState", stateId: "rna-cleaved" }, { kind: "interaction", interactionId: "cleaved-link" as never }, { kind: "topologyChange", topologyChangeId: "change-rna-cleavage" }], }], projections: [{ audience: "beginner", chapterIds: ["grounded-cleavage"], revealedAnnotationIds: [] }, { audience: "intermediate", chapterIds: ["grounded-cleavage"], revealedAnnotationIds: [] }, { audience: "advanced", chapterIds: ["grounded-cleavage"], revealedAnnotationIds: [] }] };
  assert.equal(validateTeachingPlan(plan, scene).valid, true);
  const dangling = structuredClone(plan);
  dangling.chapters[0]!.focus[1] = { kind: "interaction", interactionId: "missing-interaction" as never };
  assert.equal(validateTeachingPlan(dangling, scene).valid, false);
  const timeline = structuredClone(timelineFixture);
  const timelinePlan = structuredClone(plan);
  timelinePlan.chapters[0]!.focus = [{ kind: "timelineChapter", timelineChapterId: "chapter-cleavage" }];
  assert.equal(validateTeachingPlan(timelinePlan, scene, timeline).valid, true);
  timelinePlan.chapters[0]!.focus = [{ kind: "timelineEvent", timelineEventId: "missing-event" }];
  assert.equal(validateTeachingPlan(timelinePlan, scene, timeline).valid, false);
});
