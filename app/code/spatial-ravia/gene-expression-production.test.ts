import test from "node:test";
import assert from "node:assert/strict";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression.ts";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { projectTeachingForAudience } from "./teaching-audience-policy.ts";
import { evaluateTeachingAtTime } from "./teaching-snapshot.ts";
import { buildTeachingTextBundle, type NarrationCueProgramV1, type TeachingTextBundleV1 } from "./teaching-text.ts";
import { buildProductionTeachingView } from "./production-teaching-adapter.ts";
import { buildCaptionTrack, buildChapterTrack } from "./b-d-caption-video-packaging.ts";
import { buildSlideDeckPlan, buildSlidePackageManifest } from "./b-e-deterministic-slide-export.ts";
import { buildEmbedPackage, buildScenePackage } from "./b-f-embed-scene-package.ts";
import { applyCellularGeneExpressionExactFrame } from "./p4-b-exact-frame-runtime.ts";
import { createGeneExpressionTeachingPlan, projectGeneExpressionProductionAtTime, productionStateAtFrame, validateGeneExpressionProductionProjection } from "./gene-expression-production.ts";

const program = createCanonicalEukaryoticGeneExpressionProgram();

test("D-C2 creates one continuous canonical production owner projection", () => {
  const before = projectGeneExpressionProductionAtTime(program, 0.1);
  const transcription = projectGeneExpressionProductionAtTime(program, 1.75);
  const processing = projectGeneExpressionProductionAtTime(program, 3.75);
  const exported = projectGeneExpressionProductionAtTime(program, 6);
  const translated = projectGeneExpressionProductionAtTime(program, 7.9);
  const released = projectGeneExpressionProductionAtTime(program, 9);
  assert.equal(before.ok && before.projection.focus, "NUCLEAR");
  assert.equal(transcription.ok && transcription.projection.dna.transcriptionBubble, "OPEN");
  assert.equal(transcription.ok && transcription.projection.transcription.visibleRnaLength, 6);
  assert.equal(processing.ok && processing.projection.processing.removedIntronIds.includes("intron-1"), true);
  assert.equal(exported.ok && exported.projection.exportState.localization, "CYTOSOL");
  assert.equal(translated.ok && translated.projection.translation.activeCodonIndex, 1);
  assert.equal(released.ok && released.projection.translation.released, true);
  assert.equal(released.ok && released.projection.translation.peptideLength, 2);
});

test("D-C2 production state is direct, frame, restart, and late-early-late invariant", () => {
  const direct = projectGeneExpressionProductionAtTime(program, 7.9);
  const frame = productionStateAtFrame(program, 79, 10);
  assert.deepEqual(frame, direct);
  const late = projectGeneExpressionProductionAtTime(program, 9);
  const early = projectGeneExpressionProductionAtTime(program, 0.5);
  const lateAgain = projectGeneExpressionProductionAtTime(program, 9);
  assert.deepEqual(lateAgain, late);
  assert.equal(early.ok && early.projection.exportState.localization, "NUCLEOPLASM");
});

test("D-C2 rejects renderer projections that leak future science", () => {
  const valid = projectGeneExpressionProductionAtTime(program, 3.5);
  assert.equal(valid.ok, true);
  if (!valid.ok) return;
  const invalid = { ...valid.projection, processing: { ...valid.projection.processing, mature: true }, exportState: { ...valid.projection.exportState, localization: "CYTOSOL" as const } };
  assert.equal(validateGeneExpressionProductionProjection(program, invalid).ok, false);
});

test("D-C2 compiles cellular teaching chapters and preserves audience science", () => {
  const plan = createGeneExpressionTeachingPlan(program);
  const chapterProgram = compileTeachingChapterProgram(plan, program.cellularScene.scene, program.timeline, program.cellularScene.cellular);
  assert.equal(chapterProgram.ok, true);
  if (!chapterProgram.ok) return;
  const audiencePrograms = ["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((audience) => projectTeachingForAudience({ teachingPlan: plan, chapterProgram: chapterProgram.program, audience: audience as "BEGINNER" | "INTERMEDIATE" | "ADVANCED", scene: program.cellularScene.scene, timeline: program.timeline, cellular: program.cellularScene.cellular }));
  assert.equal(audiencePrograms.every((result) => result.ok), true);
  const snapshots = audiencePrograms.flatMap((result) => result.ok ? [evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: chapterProgram.program, audienceProgram: result.program, scientificTimeline: program.timeline, timeSeconds: 6 })] : []);
  assert.equal(snapshots.every((result) => result.ok), true);
  if (snapshots[0]?.ok) {
    const text = buildTeachingTextBundle({ snapshot: snapshots[0].snapshot, teachingPlan: plan, audienceProgram: audiencePrograms[0]!.ok ? audiencePrograms[0]!.program : (() => { throw new Error("audience") })(), context: { scene: program.cellularScene.scene, timeline: program.timeline } });
    assert.equal(text.ok, true);
  }
});

test("D-C2 misconception plan uses canonical nuclear-versus-cytosolic references", () => {
  const plan = createGeneExpressionTeachingPlan(program, "misconceptionCorrection");
  assert.equal(plan.misconceptionCorrection?.evidence.some((ref) => ref.kind === "compartment" && ref.compartmentId === "cytosol"), true);
  assert.equal(plan.misconceptionCorrection?.evidence.some((ref) => ref.kind === "cellularLocalization"), true);
});

test("D-C2 routes the canonical projection through P4 and export/package seams", async () => {
  const projection = projectGeneExpressionProductionAtTime(program, 7.9);
  assert.equal(projection.ok, true);
  if (!projection.ok) return;
  const applied = applyCellularGeneExpressionExactFrame(projection.projection, { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque", color: "#101820" } });
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  assert.equal(applied.state.projection.translation.activeCodonIndex, projection.projection.translation.activeCodonIndex);
  assert.equal(applied.state.renderConfig.runtimeMode, "EXACT_FRAME");

  const plan = createGeneExpressionTeachingPlan(program);
  const chapters = compileTeachingChapterProgram(plan, program.cellularScene.scene, program.timeline, program.cellularScene.cellular);
  assert.equal(chapters.ok, true);
  if (!chapters.ok) return;
  const audience = projectTeachingForAudience({ teachingPlan: plan, chapterProgram: chapters.program, audience: "INTERMEDIATE", scene: program.cellularScene.scene, timeline: program.timeline, cellular: program.cellularScene.cellular });
  assert.equal(audience.ok, true);
  if (!audience.ok) return;

  const bundles: Record<string, TeachingTextBundleV1> = {};
  const narrations: NarrationCueProgramV1[] = [];
  for (const chapter of program.timeline.chapters ?? []) {
    const snapshot = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: chapters.program, audienceProgram: audience.program, scientificTimeline: program.timeline, timeSeconds: chapter.start });
    assert.equal(snapshot.ok, true);
    if (!snapshot.ok) continue;
    const text = buildTeachingTextBundle({ snapshot: snapshot.snapshot, teachingPlan: plan, audienceProgram: audience.program, context: { scene: program.cellularScene.scene, timeline: program.timeline } });
    assert.equal(text.ok, true);
    if (!text.ok) continue;
    bundles[chapter.chapterId] = text.bundle;
    narrations.push(text.narration);
  }
  const firstChapter = program.timeline.chapters?.[0];
  assert.ok(firstChapter);
  const firstSnapshot = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: chapters.program, audienceProgram: audience.program, scientificTimeline: program.timeline, timeSeconds: firstChapter.start });
  assert.equal(firstSnapshot.ok, true);
  if (!firstSnapshot.ok) return;
  const firstText = bundles[firstChapter.chapterId];
  assert.ok(firstText);
  const teachingView = buildProductionTeachingView({ snapshot: firstSnapshot.snapshot, textBundle: firstText, narrationProgram: narrations[0]! });
  assert.equal(teachingView.support.status, "SUPPORTED");

  const sequence = { schemaVersion: "1" as const, fps: 10, firstFrame: 0, lastFrame: 90, frameCount: 91, durationSeconds: 9.1, frameTimes: Array.from({ length: 91 }, (_, index) => index / 10), width: 1280, height: 720, pixelRatio: 1, ownerId: "GENE_EXPRESSION_CELLULAR_V1", format: "pngSequence" as const, captureScope: "CANVAS_ONLY" as const };
  const allCues = narrations.flatMap((item) => item.cues).filter((cue, index, all) => all.findIndex((candidate) => candidate.cueId === cue.cueId) === index);
  const combinedNarration: NarrationCueProgramV1 = { ...narrations[0]!, cues: allCues, captionSegments: narrations.flatMap((item) => item.captionSegments).filter((segment, index, all) => all.findIndex((candidate) => candidate.segmentId === segment.segmentId) === index) };
  const caption = buildCaptionTrack({ manifestId: "gene-expression", trackId: "gene-expression-captions", narrationProgram: combinedNarration, teachingText: firstText, chapterProgram: chapters.program, timeline: program.timeline, sequence });
  assert.equal(caption.ok, true);
  const chapterTrack = buildChapterTrack({ manifestId: "gene-expression", trackId: "gene-expression-chapters", narrationProgram: narrations[0]!, chapterProgram: chapters.program, timeline: program.timeline, sequence });
  assert.equal(chapterTrack.ok, true);

  const frameByChapterId = Object.fromEntries((program.timeline.chapters ?? []).map((chapter) => {
    const entry = chapters.program.entries.find((candidate) => candidate.chapterId === chapter.chapterId);
    const eventTime = entry?.timelineMapping?.eventIds.map((id) => program.timeline.events.find((candidate) => candidate.eventId === id)?.at).find((time): time is number => time !== undefined) ?? chapter.start;
    return [chapter.chapterId, { sourceSurface: "SCENE_CANVAS" as const, timeSeconds: eventTime, frameIndex: Math.round(eventTime * 10), selectionReason: "TIMELINE_EVENT" as const }];
  }));
  const slides = buildSlideDeckPlan({ deckId: "gene-expression-flagship", title: "From DNA to polypeptide", teachingPlan: plan, chapterProgram: chapters.program, audienceProgram: audience.program, textBundles: bundles, timeline: program.timeline, sequence, frameByChapterId, exportSurface: "SCENE_CANVAS", capabilityId: "transcription-initiation" });
  assert.equal(slides.ok, true, slides.ok ? "" : slides.reasons.join("; "));
  if (!slides.ok) return;
  const slideManifest = buildSlidePackageManifest(slides.plan);
  assert.equal(slideManifest.ok, true);

  const pkg = await buildScenePackage({ packageId: "gene-expression-flagship", scientificSceneSpec: program.cellularScene.scene, cellularScientificExtension: program.cellularScene.cellular, scientificTimeline: program.timeline, teaching: { plan, chapterProgram: chapters.program, audiencePrograms: [audience.program], selectedAudience: "INTERMEDIATE", selectedSnapshot: firstSnapshot.snapshot, textBundles: Object.values(bundles), narration: narrations[0]! }, viewer: { schemaVersion: "1", packageVersion: "1", requiredRuntimeVersion: "teaching-runtime-v1", sceneOwner: "gene-expression-cellular-v1", capabilityId: "transcription-initiation", initialView: "TIME_FOLLOWING", initialTimeSeconds: 0, teachingEnabled: true, audience: "INTERMEDIATE", playbackEnabled: true, supportedControls: ["PLAY", "SEEK", "CHAPTER_NAVIGATION", "AUDIENCE_SELECT"], assetResolution: "BUNDLED" }, representation: { owner: "PROCEDURAL", interactiveView: "SUPPORTED", exactFrameExport: "SUPPORTED" }, limitations: ["S2_SCHEMATIC molecular presentation"] });
  assert.equal(pkg.ok, true, pkg.ok ? "" : pkg.reasons.join("; "));
  if (!pkg.ok) return;
  assert.equal(pkg.package.cellularScientificExtension?.compartments.some((item) => item.compartmentId === "nucleus"), true);
  const embed = await buildEmbedPackage(pkg.package);
  assert.equal(embed.ok, true);
  if (embed.ok) assert.equal(JSON.parse(JSON.stringify(embed.embed)).package.cellularScientificExtension?.localizations.length, program.cellularScene.cellular.localizations.length);
});
