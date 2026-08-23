import assert from "node:assert/strict";
import test from "node:test";
import { projectTeachingForAudience } from "./teaching-audience-policy.ts";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { evaluateTeachingAtTime } from "./teaching-snapshot.ts";
import { buildTeachingTextBundle } from "./teaching-text.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { buildProductionTeachingView, productionTeachingCursor, serializeProductionTeachingView } from "./production-teaching-adapter.ts";

function makeView(audience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE", chapterId?: string) {
  const scene = scientificSceneSpecFixtures["rna-dna-stability"];
  const chapter = compileTeachingChapterProgram(teachingPlanFixture, scene);
  assert.equal(chapter.ok, true);
  if (!chapter.ok) throw new Error(JSON.stringify(chapter));
  const projected = projectTeachingForAudience({ teachingPlan: teachingPlanFixture, chapterProgram: chapter.program, audience, scene });
  assert.equal(projected.ok, true);
  if (!projected.ok) throw new Error(JSON.stringify(projected));
  const evaluated = evaluateTeachingAtTime({ teachingPlan: teachingPlanFixture, chapterProgram: chapter.program, audienceProgram: projected.program, timeSeconds: 0, cursor: productionTeachingCursor("MANUAL_CHAPTER", chapterId ?? projected.program.selectedChapterIds[0]) });
  assert.equal(evaluated.ok, true);
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated));
  const text = buildTeachingTextBundle({ snapshot: evaluated.snapshot, teachingPlan: teachingPlanFixture, audienceProgram: projected.program, context: { scene } });
  assert.equal(text.ok, true);
  if (!text.ok) throw new Error(JSON.stringify(text));
  return buildProductionTeachingView({ snapshot: evaluated.snapshot, textBundle: text.bundle, narrationProgram: text.narration, chapterTitles: { "observe-local-sugars": "Observe the matched local sugars", "connect-chemistry": "Connect the hydroxyl difference to susceptibility" } });
}

test("A-H builds a renderer-independent production view from canonical teaching state", () => {
  const view = makeView();
  assert.equal(view.schemaVersion, "1");
  assert.equal(view.support.status, "SUPPORTED");
  assert.equal(view.activeChapter?.chapterId, "observe-local-sugars");
  assert.equal(view.objectiveText, "Understand how to explain why the grounded teaching target.");
  assert.ok(view.activeFocusRefs.length > 0);
  assert.equal(view.exportBoundary, "TEACHING_DOM_EXPORT_NOT_YET_GUARANTEED");
});

test("A-H preserves audience projection and explicit manual chapter navigation", () => {
  const beginner = makeView("BEGINNER");
  const advanced = makeView("ADVANCED");
  const navigated = makeView("ADVANCED", "connect-chemistry");
  assert.equal(beginner.audience, "BEGINNER");
  assert.equal(advanced.audience, "ADVANCED");
  assert.equal(navigated.navigation.mode, "MANUAL_CHAPTER");
  assert.equal(navigated.navigation.chapterId, "connect-chemistry");
  assert.equal(navigated.activeChapter?.chapterId, "connect-chemistry");
  assert.ok([...beginner.activeFocusRefs, ...advanced.activeFocusRefs].every((ref) => ref.kind === "actor" && ["dna-deoxyribose-1", "rna-ribose-1"].includes(String(ref.actorId))));
});

test("A-H keeps time-following states history-independent", () => {
  const first = makeView();
  const later = makeView("INTERMEDIATE", "connect-chemistry");
  const restarted = makeView();
  assert.deepEqual(first, restarted);
  assert.notEqual(first.navigation.chapterId, later.navigation.chapterId);
});

test("A-H exposes grounded label seams without inventing geometry", () => {
  const view = makeView();
  assert.ok(view.labelProjections.length > 0);
  assert.ok(view.labelProjections.every((label) => label.anchorStatus === "EXISTING_PRODUCTION_SEAM_REQUIRED"));
  const serialized = serializeProductionTeachingView(view);
  assert.deepEqual(JSON.parse(serialized), view);
  assert.equal(serialized.includes("camera"), false);
  assert.equal(serialized.includes("geometry"), false);
});

test("A-H renders explicit unsupported state without fabricated content", () => {
  const view = makeView();
  const unavailable = buildProductionTeachingView({
    snapshot: { support: { status: "UNAVAILABLE", code: "FRAGMENTATION_UNGROUNDED", reasons: ["fragmentation is ungrounded"] }, teachingPlanId: view.teachingPlanId, snapshotTrace: view.snapshotTrace, activeChapterIds: [], completedChapterIds: [], pendingChapterIds: [], narrationCueIds: [], activeFocusRefs: [], activeContextRefs: [], suppressedRefs: [], audience: view.audience, detail: view.detail, terminologyLevel: view.terminologyLevel } as never,
    textBundle: { support: { status: "SUPPORTED", reasons: [] }, snapshotTrace: view.snapshotTrace, teachingPlanId: view.teachingPlanId, chapterId: "", chapterTitle: "", learningObjectiveText: "", explanationSegments: [], annotationText: [], causalText: [], contrastText: [], correctionText: [], narrationSegments: [], captionSegments: [] } as never,
    narrationProgram: { schemaVersion: "1", teachingPlanId: view.teachingPlanId, audience: view.audience, cues: [], captionSegments: [] },
  });
  assert.equal(unavailable.support.status, "UNAVAILABLE");
  assert.equal(unavailable.support.code, "FRAGMENTATION_UNGROUNDED");
  assert.equal(unavailable.explanationSegments.length, 0);
});
