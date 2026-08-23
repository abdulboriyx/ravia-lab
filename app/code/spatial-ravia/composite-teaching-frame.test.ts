import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { createDnaPairingProductionMigration } from "./p3-g-production-temporal-migration.ts";
import { evaluateExactFrame, type AppliedRenderStateV1 } from "./p4-b-exact-frame-runtime.ts";
import type { RenderReadinessV1 } from "./p4-c-renderer-state-reconstruction.ts";
import { buildCompositeExportSurface, buildCompositeReadiness, captureCompositeFrame, controlledElementScreenshotBackend, serializeCompositeMetadata, serializeCompositeReadiness, serializeCompositeSurface, validateCompositeExportSurface, type CompositeExportSurfaceV1 } from "./composite-teaching-frame.ts";
import { validateExportRequestV2, type ExportRequestV2 } from "./scene-export-contract-v2.ts";
import { projectTeachingForAudience } from "./teaching-audience-policy.ts";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { evaluateTeachingAtTime } from "./teaching-snapshot.ts";
import { buildTeachingTextBundle } from "./teaching-text.ts";
import { buildProductionTeachingView } from "./production-teaching-adapter.ts";
import type { TeachingSnapshotV1 } from "./teaching-snapshot.ts";
import type { TeachingTextBundleV1 } from "./teaching-text.ts";
import type { ProductionTeachingViewV1 } from "./production-teaching-adapter.ts";

function teachingState(timeSeconds = 0, audience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE"): { snapshot: TeachingSnapshotV1; bundle: TeachingTextBundleV1; view: ProductionTeachingViewV1 } {
  const scene = scientificSceneSpecFixtures["rna-dna-stability"];
  const chapter = compileTeachingChapterProgram(teachingPlanFixture, scene);
  assert.equal(chapter.ok, true);
  if (!chapter.ok) throw new Error(JSON.stringify(chapter));
  const projected = projectTeachingForAudience({ teachingPlan: teachingPlanFixture, chapterProgram: chapter.program, audience, scene });
  assert.equal(projected.ok, true);
  if (!projected.ok) throw new Error(JSON.stringify(projected));
  const evaluated = evaluateTeachingAtTime({ teachingPlan: teachingPlanFixture, chapterProgram: chapter.program, audienceProgram: projected.program, timeSeconds, cursor: { schemaVersion: "1", mode: "MANUAL_CHAPTER", chapterId: projected.program.selectedChapterIds[0] } });
  assert.equal(evaluated.ok, true);
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated));
  const text = buildTeachingTextBundle({ snapshot: evaluated.snapshot, teachingPlan: teachingPlanFixture, audienceProgram: projected.program, context: { scene } });
  assert.equal(text.ok, true);
  if (!text.ok) throw new Error(JSON.stringify(text));
  const view = buildProductionTeachingView({ snapshot: evaluated.snapshot, textBundle: text.bundle, narrationProgram: text.narration, chapterTitles: { "observe-local-sugars": "Observe the matched local sugars" } });
  return { snapshot: evaluated.snapshot, bundle: text.bundle, view };
}

function exactFrame(timeSeconds = 0) {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  const timeline = { schemaVersion: "1" as const, timelineId: "b-b-static", clock: { duration: 20, unit: "seconds" as const }, initialMechanismStateId: "paired", states: [{ mechanismStateId: "paired", scientificStateId: "paired-duplex", kind: "before" as const, actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] };
  const migration = createDnaPairingProductionMigration(scene, timeline, { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(migration.ok, true);
  if (!migration.ok) throw new Error(JSON.stringify(migration));
  const evaluated = evaluateExactFrame({ schemaVersion: "1", migration: migration.migration, timeSeconds, renderConfig: { schemaVersion: "1", width: 320, height: 180, pixelRatio: 2, background: { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId: migration.migration.ownerId } });
  assert.equal(evaluated.ok, true);
  if (!evaluated.ok) throw new Error(JSON.stringify(evaluated));
  return evaluated.appliedState;
}

function readiness(applicationId: number, overrides: Partial<RenderReadinessV1> = {}): RenderReadinessV1 {
  return { schemaVersion: "1", applicationId, ownerId: "DnaBasePairInteractionPresentation", status: "READY", stateApplied: true, geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: true, supersededWorkPending: false, reasons: [], ...overrides };
}

function surface(applicationId = 1, timeSeconds = 0): { surface: CompositeExportSurfaceV1; appliedState: AppliedRenderStateV1; view: ProductionTeachingViewV1; snapshot: TeachingSnapshotV1; bundle: TeachingTextBundleV1 } {
  const appliedState = exactFrame(timeSeconds);
  const teaching = teachingState(timeSeconds);
  const built = buildCompositeExportSurface({ applicationId, appliedState, snapshot: teaching.snapshot, textBundle: teaching.bundle, view: teaching.view, overlay: { inclusion: "text", includeProvenance: true } });
  assert.equal("exportSurface" in built, true, JSON.stringify(built));
  if (!("exportSurface" in built)) throw new Error(JSON.stringify(built));
  return { surface: built, appliedState, view: teaching.view, snapshot: teaching.snapshot, bundle: teaching.bundle };
}

test("B-B preserves v1 export requests and validates additive v2 surface selection", () => {
  const base = { requestId: "b-b-scene", packageId: "rna-stability-package", sceneVersion: "1.0.0", sceneHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", format: "png" as const, resolution: { width: 320, height: 180, aspectRatio: "16:9" }, background: { mode: "opaque" as const, color: "#ffffff" }, timeline: { mode: "frame" as const, frame: 0, fps: 30 }, inclusion: { labels: "requested" as const, provenance: "references" as const, citations: "none" as const, licenses: "included" as const } };
  const v2: ExportRequestV2 = { ...base, schemaVersion: "2", surface: "SCENE_CANVAS" };
  assert.equal(validateExportRequestV2(v2, { metadata: { schemaVersion: "1", packageId: "rna-stability-package", sceneId: "rna-stability-scene", sceneVersion: "1.0.0", sceneHash: base.sceneHash, runtime: { rendererVersion: "r", runtimeVersion: "r" } }, provenanceSourceIds: [], citations: [], licenses: [] }).valid, true);
  assert.equal(validateExportRequestV2({ ...v2, surface: "SCENE_WITH_TEACHING_OVERLAY", teaching: undefined } as ExportRequestV2, { metadata: { schemaVersion: "1", packageId: "rna-stability-package", sceneId: "rna-stability-scene", sceneVersion: "1.0.0", sceneHash: base.sceneHash, runtime: { rendererVersion: "r", runtimeVersion: "r" } }, provenanceSourceIds: [], citations: [], licenses: [] }).valid, false);
  const invalidCaptionFlag = { ...v2, surface: "SCENE_WITH_TEACHING_OVERLAY", teaching: { overlay: "text" as const, includeCaptions: "yes" as unknown as boolean, snapshot: { teachingPlanId: "plan", chapterProgramId: "chapter", timeSeconds: 0, activeChapterIds: ["chapter"], audience: "INTERMEDIATE" as const, requestMode: "why" as const }, textBundle: { teachingPlanId: "plan", chapterProgramId: "chapter", timeSeconds: 0, chapterId: "chapter", audience: "INTERMEDIATE" as const, requestMode: "why" as const } } } as ExportRequestV2;
  const captionResult = validateExportRequestV2(invalidCaptionFlag, { metadata: { schemaVersion: "1", packageId: "rna-stability-package", sceneId: "rna-stability-scene", sceneVersion: "1.0.0", sceneHash: base.sceneHash, runtime: { rendererVersion: "r", runtimeVersion: "r" } }, provenanceSourceIds: [], citations: [], licenses: [] });
  assert.equal(captionResult.valid, false);
  if (!captionResult.valid) assert.ok(captionResult.issues.some((entry) => entry.path === "request.teaching.includeCaptions"));
});

test("B-B builds a bound composite surface with exact frame and teaching identities", () => {
  const built = surface();
  assert.equal(built.surface.exportSurface, "SCENE_WITH_TEACHING_OVERLAY");
  assert.equal(built.surface.exactFrame.timeSeconds, 0);
  assert.equal(built.surface.teachingSnapshot.timeSeconds, 0);
  assert.equal(built.surface.teachingText.chapterProgramId, built.surface.teachingSnapshot.chapterProgramId);
  assert.equal(built.surface.exactFrame.width, 320);
  assert.equal(built.surface.dimensions.pixelRatio, 2);
});

test("B-B readiness requires P4, fonts, DOM, layout, and teaching identities", () => {
  const ready = buildCompositeReadiness({ p4Readiness: readiness(1), fontsReady: true, teachingDomReady: true, compositeLayoutReady: true, teachingSnapshotIdentityReady: true, textBundleIdentityReady: true });
  assert.equal(ready.status, "READY");
  const fontPending = buildCompositeReadiness({ p4Readiness: readiness(1), fontsReady: false, teachingDomReady: true, compositeLayoutReady: true, teachingSnapshotIdentityReady: true, textBundleIdentityReady: true });
  assert.equal(fontPending.status, "NOT_READY");
  assert.ok(fontPending.reasons.includes("FONT_NOT_READY"));
  const layoutPending = buildCompositeReadiness({ p4Readiness: readiness(1), fontsReady: true, teachingDomReady: true, compositeLayoutReady: false, teachingSnapshotIdentityReady: true, textBundleIdentityReady: true });
  assert.equal(layoutPending.status, "NOT_READY");
  assert.ok(layoutPending.reasons.includes("COMPOSITE_LAYOUT_NOT_READY"));
});

test("B-B controlled element capture returns deterministic metadata and rejects stale readiness", async () => {
  const built = surface(7);
  const ready = buildCompositeReadiness({ p4Readiness: readiness(7), fontsReady: true, teachingDomReady: true, compositeLayoutReady: true, teachingSnapshotIdentityReady: true, textBundleIdentityReady: true });
  const target = { width: 640, height: 360, screenshot: async () => new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) };
  const captured = await captureCompositeFrame({ surface: built.surface, readiness: ready, currentApplicationId: 7, target, backend: controlledElementScreenshotBackend, checksum: () => "sha256:test" });
  assert.equal(captured.ok, true, JSON.stringify(captured));
  if (captured.ok) { assert.equal(captured.artifact.metadata.width, 640); assert.equal(captured.artifact.metadata.checksum, "sha256:test"); assert.equal(JSON.parse(serializeCompositeMetadata(captured.artifact.metadata)).applicationId, 7); }
  const stale = await captureCompositeFrame({ surface: built.surface, readiness: ready, currentApplicationId: 8, target, backend: controlledElementScreenshotBackend });
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.code, "CAPTURE_STALE_FRAME");
});

test("B-B rejects scene/teaching mismatch and anchored annotations without export anchors", () => {
  const built = surface();
  const teaching = teachingState(1);
  const mismatch = buildCompositeExportSurface({ applicationId: 1, appliedState: built.appliedState, snapshot: teaching.snapshot, textBundle: teaching.bundle, view: teaching.view });
  assert.equal("ok" in mismatch, true);
  if ("ok" in mismatch) assert.equal(mismatch.code, "CAPTURE_STALE_FRAME");
  const anchored = buildCompositeExportSurface({ applicationId: 1, appliedState: built.appliedState, snapshot: built.snapshot, textBundle: built.bundle, view: built.view, overlay: { inclusion: "textAndAnchoredCallouts" } });
  assert.equal("ok" in anchored, true);
  if ("ok" in anchored) assert.equal(anchored.code, "TEACHING_OVERLAY_UNAVAILABLE");
  const textMismatch = { ...built.bundle, audience: "BEGINNER" as const };
  const mismatchedText = buildCompositeExportSurface({ applicationId: 1, appliedState: built.appliedState, snapshot: built.snapshot, textBundle: textMismatch, view: built.view });
  assert.equal("ok" in mismatchedText, true);
  if ("ok" in mismatchedText) assert.equal(mismatchedText.code, "TEACHING_OVERLAY_UNAVAILABLE");
});

test("B-B temporal composite identities follow exact time without future or history state", () => {
  const times = [0, 0.5, 1, 2, 5];
  const direct = times.map((timeSeconds) => surface(1, timeSeconds).surface);
  const lateEarlyLate = [surface(1, 5), surface(2, 0), surface(3, 5)].map((entry) => entry.surface);
  assert.deepEqual(direct.map((entry) => entry.exactFrame.timeSeconds), times);
  assert.deepEqual(lateEarlyLate.map((entry) => entry.exactFrame.timeSeconds), [5, 0, 5]);
  assert.deepEqual(direct[4].teachingText, lateEarlyLate[2].teachingText);
  assert.deepEqual(validateCompositeExportSurface(direct[0]), { ok: true });
});

test("B-B preserves static and temporal proof boundaries for supported teaching surfaces", () => {
  const staticSurface = surface(11, 0).surface;
  const temporalSurface = surface(12, 2).surface;
  assert.equal(staticSurface.exportSurface, "SCENE_WITH_TEACHING_OVERLAY");
  assert.equal(temporalSurface.exportSurface, "SCENE_WITH_TEACHING_OVERLAY");
  assert.equal(staticSurface.teachingSnapshot.timeSeconds, staticSurface.exactFrame.timeSeconds);
  assert.equal(temporalSurface.teachingSnapshot.timeSeconds, temporalSurface.exactFrame.timeSeconds);
  assert.equal(staticSurface.overlay.inclusion, "text");
  assert.equal(temporalSurface.overlay.includeProvenance, true);
});

test("B-B serializes surfaces/readiness and preserves static exact-time reconstruction semantics", () => {
  const late = surface(1, 2);
  const early = surface(2, 0);
  const lateAgain = surface(3, 2);
  assert.deepEqual({ ...late.surface, exactFrame: { ...late.surface.exactFrame, applicationId: undefined } }, { ...lateAgain.surface, exactFrame: { ...lateAgain.surface.exactFrame, applicationId: undefined } });
  assert.notEqual(late.surface.exactFrame.applicationId, early.surface.exactFrame.applicationId);
  assert.deepEqual(JSON.parse(serializeCompositeSurface(late.surface)), late.surface);
  const ready = buildCompositeReadiness({ p4Readiness: readiness(1), fontsReady: true, teachingDomReady: true, compositeLayoutReady: true, teachingSnapshotIdentityReady: true, textBundleIdentityReady: true });
  assert.deepEqual(JSON.parse(serializeCompositeReadiness(ready)), ready);
});
