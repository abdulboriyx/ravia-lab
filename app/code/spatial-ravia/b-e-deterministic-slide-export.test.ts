import assert from "node:assert/strict";
import test from "node:test";
import { buildSlideDeckPlan, buildSlidePackageManifest, rasterizeSlides, serializeSlideDeckPlan, serializeSlidePackageManifest, type SlideExportInputV1 } from "./b-e-deterministic-slide-export.ts";
import type { AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import type { TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { TeachingPlan } from "./teaching-plan.ts";
import type { TeachingTextBundleV1, TeachingTextSegmentV1 } from "./teaching-text.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

const ref = (stateId: string) => ({ kind: "scientificState" as const, stateId });
const segment = (segmentId: string, text: string, chapterId: string): TeachingTextSegmentV1 => ({ segmentId, kind: "EXPLANATION", text, targetRefs: [ref(chapterId)], scientificClaimRefs: [], provenanceRefs: [], audience: "INTERMEDIATE", chapterId });
const bundle = (chapterId: string, requestMode: TeachingTextBundleV1["requestMode"] = "explain", extraText = "Grounded explanation."): TeachingTextBundleV1 => { const item = segment(`segment-${chapterId}`, extraText, chapterId); return { schemaVersion: "1", teachingPlanId: "teaching-plan", snapshotTrace: { chapterProgramId: "chapter-program", timeSeconds: 0, activeChapterIds: [chapterId] }, audience: "INTERMEDIATE", requestMode, chapterId, chapterTitle: chapterId, learningObjectiveText: `Understand ${chapterId}.`, explanationSegments: [item], annotationText: [], causalText: requestMode === "why" ? [item] : [], contrastText: requestMode === "compare" ? [item] : [], correctionText: requestMode === "misconceptionCorrection" ? [item] : [], terminology: { level: "STANDARD_SCIENTIFIC", explanationDepth: "STRUCTURED" }, narrationSegments: [], captionSegments: [], segments: [item], provenanceRefs: [], support: { status: "SUPPORTED", reasons: [] } }; };
const chapterProgram = (entries: TeachingChapterProgramV1["entries"]): TeachingChapterProgramV1 => ({ schemaVersion: "1", planId: "chapter-program", sceneId: "scene", entries });
const entry = (chapterId: string, order: number, mapping?: TeachingChapterProgramV1["entries"][number]["timelineMapping"], role: TeachingChapterProgramV1["entries"][number]["role"] = "EXPLAIN", dependsOn: readonly string[] = order > 1 ? [`chapter-${order - 1}`] : []): TeachingChapterProgramV1["entries"][number] => ({ chapterId, order, role, dependsOn: [...dependsOn], timelineRefs: mapping ? [{ kind: "timelineChapter", timelineChapterId: chapterId }] : [], ...(mapping ? { timelineMapping: mapping } : {}), disclosure: { primaryFocusRefs: [ref(chapterId)], secondaryContextRefs: [], suppressedContextRefs: [], activeAnnotationIds: [], activeCausalStepIds: [], activeContrastIds: [], activeCorrectionIds: [], detail: "STRUCTURAL" }, provenanceRefs: [] });
const audience = { audience: "INTERMEDIATE", entries: [] } as unknown as AudienceTeachingProgramV1;
const plan = { schemaVersion: "3", planId: "teaching-plan", sceneId: "scene", requestMode: "explain", chapters: [], projections: [] } as unknown as TeachingPlan;
const staticInput = (overrides: Partial<SlideExportInputV1> = {}): SlideExportInputV1 => ({ deckId: "deck", title: "Grounded lesson", teachingPlan: plan, chapterProgram: chapterProgram([entry("dna", 1, undefined, "IDENTIFY"), entry("pairing", 2, undefined, "EXPLAIN", ["dna"])]), audienceProgram: audience, textBundles: { dna: bundle("dna"), pairing: bundle("pairing") }, frameByChapterId: { dna: { sourceSurface: "SCENE_CANVAS", frameIndex: 0, timeSeconds: 0, artifactId: "frame-dna" }, pairing: { sourceSurface: "SCENE_CANVAS", frameIndex: 0, timeSeconds: 0, artifactId: "frame-pairing" } }, exportSurface: "SCENE_CANVAS", ...overrides });
const temporalTimeline: ScientificTimeline = { schemaVersion: "1", timelineId: "timeline", clock: { duration: 4, unit: "seconds" }, initialMechanismStateId: "paired", states: [], transitions: [{ transitionId: "transition-opening", fromMechanismStateId: "paired", toMechanismStateId: "opening", start: 1, end: 3 }], events: [{ eventId: "event-separation", at: 2, kind: "topologyChanged", actorIds: [], topologyChangeId: "change-separation" }], tracks: [], chapters: [{ chapterId: "chapter-1", start: 0, end: 1 }, { chapterId: "chapter-2", start: 1, end: 3 }, { chapterId: "chapter-3", start: 3, end: 4 }] };

test("B-E builds deterministic static DNA deck plans and IDs", () => {
  const result = buildSlideDeckPlan(staticInput());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) { assert.deepEqual(result.plan.slideIds, ["slide:deck:intermediate:explain:dna", "slide:deck:intermediate:explain:pairing"]); assert.equal(result.plan.slides[0]?.frame.selectionReason, "STATIC_MANUAL_STATE"); assert.equal(result.plan.slides[0]?.layout, "FOCUS_IMAGE"); }
});

test("B-E selects event, transition midpoint, and chapter-start frames explicitly", () => {
  const chapters = chapterProgram([entry("chapter-1", 1, { chapterIds: ["chapter-1"], eventIds: ["event-separation"], transitionIds: [] }), entry("chapter-2", 2, { chapterIds: ["chapter-2"], eventIds: [], transitionIds: ["transition-opening"] }), entry("chapter-3", 3, { chapterIds: ["chapter-3"], eventIds: [], transitionIds: [] })]);
  const result = buildSlideDeckPlan(staticInput({ chapterProgram: chapters, timeline: temporalTimeline, sequence: { schemaVersion: "1", fps: 30, firstFrame: 0, lastFrame: 119, frameCount: 120, durationSeconds: 4, frameTimes: [], width: 320, height: 180, pixelRatio: 1, ownerId: "owner", format: "pngSequence", captureScope: "CANVAS_ONLY" }, textBundles: { "chapter-1": bundle("chapter-1"), "chapter-2": bundle("chapter-2"), "chapter-3": bundle("chapter-3") }, frameByChapterId: { "chapter-1": { sourceSurface: "SCENE_CANVAS", frameIndex: 60 }, "chapter-2": { sourceSurface: "SCENE_CANVAS", frameIndex: 60 }, "chapter-3": { sourceSurface: "SCENE_CANVAS", frameIndex: 90 } } }));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) assert.deepEqual(result.plan.slides.map((slide) => [slide.frame.selectionReason, slide.frame.timeSeconds, slide.frame.frameIndex]), [["TIMELINE_EVENT", 2, 60], ["TRANSITION_MIDPOINT", 2, 60], ["CHAPTER_START", 3, 90]]);
});

test("B-E preserves comparison/correction layouts and omits absent summaries", () => {
  const comparison = buildSlideDeckPlan(staticInput({ chapterProgram: chapterProgram([entry("compare", 1, undefined, "COMPARE")]), textBundles: { compare: bundle("compare", "compare") }, frameByChapterId: { compare: { sourceSurface: "SCENE_CANVAS", frameIndex: 0 } } }));
  assert.equal(comparison.ok, true);
  if (comparison.ok) assert.equal(comparison.plan.slides[0]?.layout, "COMPARISON");
  const correction = buildSlideDeckPlan(staticInput({ teachingPlan: { ...plan, requestMode: "misconceptionCorrection" }, chapterProgram: chapterProgram([entry("correction", 1, undefined, "CORRECT")]), textBundles: { correction: bundle("correction", "misconceptionCorrection") }, frameByChapterId: { correction: { sourceSurface: "SCENE_CANVAS", frameIndex: 0 } } }));
  assert.equal(correction.ok, true);
  if (correction.ok) { assert.equal(correction.plan.slides[0]?.layout, "CORRECTION"); assert.equal(correction.plan.slides.some((slide) => slide.chapterId === "summary"), false); }
});

test("B-E rejects missing frames, missing text, unavailable overlays, and overflow", () => {
  const missingFrame = buildSlideDeckPlan(staticInput({ frameByChapterId: { dna: { sourceSurface: "SCENE_CANVAS" } } }));
  assert.equal(missingFrame.ok, false);
  if (!missingFrame.ok) assert.equal(missingFrame.code, "SLIDE_FRAME_UNAVAILABLE");
  const missingText = buildSlideDeckPlan(staticInput({ textBundles: { dna: bundle("dna") } }));
  assert.equal(missingText.ok, false);
  if (!missingText.ok) assert.equal(missingText.code, "SLIDE_PACKAGE_INVALID");
  const overlay = buildSlideDeckPlan(staticInput({ exportSurface: "SCENE_WITH_TEACHING_OVERLAY", frameByChapterId: { dna: { sourceSurface: "SCENE_CANVAS" }, pairing: { sourceSurface: "SCENE_CANVAS" } } }));
  assert.equal(overlay.ok, false);
  if (!overlay.ok) assert.equal(overlay.code, "TEACHING_OVERLAY_UNAVAILABLE");
  const overflow = buildSlideDeckPlan(staticInput({ textBundles: { dna: bundle("dna", "explain", "x".repeat(1501)), pairing: bundle("pairing") } }));
  assert.equal(overflow.ok, false);
  if (!overflow.ok) assert.equal(overflow.code, "SLIDE_CONTENT_OVERFLOW");
});

test("B-E supports structural plans without rasterization and validates PNG artifacts", async () => {
  const result = buildSlideDeckPlan(staticInput());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const unavailable = await rasterizeSlides(result.plan, { backendId: "controlled-slide-browser", available: false, capture: async () => new Blob() });
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) assert.equal(unavailable.code, "SLIDE_RENDER_UNAVAILABLE");
  const raster = await rasterizeSlides(result.plan, { backendId: "reference-slide-browser", available: true, capture: async () => new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) }, { checksum: () => "sha256:slide" });
  assert.equal(raster.ok, true);
  if (raster.ok) { assert.equal(raster.artifacts.length, 2); assert.equal(raster.artifacts[0]?.metadata.checksum, "sha256:slide"); }
});

test("B-E manifest supports unavailable and mock-available artifacts with safe round trips", () => {
  const result = buildSlideDeckPlan(staticInput());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const unavailable = buildSlidePackageManifest(result.plan);
  assert.equal(unavailable.ok, true);
  if (unavailable.ok) { assert.equal(unavailable.manifest.artifactStatus, "SLIDE_RENDER_UNAVAILABLE"); assert.deepEqual(JSON.parse(serializeSlideDeckPlan(result.plan)), result.plan); assert.deepEqual(JSON.parse(serializeSlidePackageManifest(unavailable.manifest)), unavailable.manifest); }
});

test("B-E preserves array-order invariance and fragmentation failure", () => {
  const normal = buildSlideDeckPlan(staticInput());
  const reordered = buildSlideDeckPlan(staticInput({ chapterProgram: chapterProgram([entry("pairing", 2, undefined, "EXPLAIN", ["dna"]), entry("dna", 1, undefined, "IDENTIFY")]), textBundles: { pairing: bundle("pairing"), dna: bundle("dna") } }));
  assert.equal(normal.ok && reordered.ok, true);
  if (normal.ok && reordered.ok) assert.deepEqual(normal.plan.slides, reordered.plan.slides);
  const fragmented = buildSlideDeckPlan(staticInput({ upstreamFailureCode: "FRAGMENTATION_UNGROUNDED" }));
  assert.equal(fragmented.ok, false);
  if (!fragmented.ok) assert.equal(fragmented.code, "FRAGMENTATION_UNGROUNDED");
});
