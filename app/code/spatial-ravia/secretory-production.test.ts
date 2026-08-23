import test from "node:test";
import assert from "node:assert/strict";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { projectTeachingForAudience } from "./teaching-audience-policy.ts";
import { evaluateTeachingAtTime } from "./teaching-snapshot.ts";
import { buildTeachingTextBundle } from "./teaching-text.ts";
import { buildProductionTeachingView } from "./production-teaching-adapter.ts";
import { buildCaptionTrack, buildChapterTrack } from "./b-d-caption-video-packaging.ts";
import { buildSlideDeckPlan, buildSlidePackageManifest } from "./b-e-deterministic-slide-export.ts";
import { buildScenePackage, buildEmbedPackage } from "./b-f-embed-scene-package.ts";
import { applyCellularSecretoryExactFrame } from "./p4-b-exact-frame-runtime.ts";
import { createCanonicalSecretoryPathwayProgram } from "./secretory-pathway.ts";
import { createSecretoryTeachingPlan, projectSecretoryProductionAtTime, secretoryProductionStateAtFrame, validateSecretoryProductionProjection } from "./secretory-production.ts";

const program = createCanonicalSecretoryPathwayProgram();

test("D-D production owner projects only canonical secretory state", () => {
  const early = projectSecretoryProductionAtTime(program, 10.5);
  const late = projectSecretoryProductionAtTime(program, 16.4);
  assert.equal(early.ok, true);
  assert.equal(late.ok, true);
  if (!early.ok || !late.ok) return;
  assert.equal(early.projection.protein.actorId, late.projection.protein.actorId);
  assert.equal(early.projection.protein.luminalChainLength <= early.projection.protein.translatedResidueCount, true);
  assert.equal(late.projection.protein.localization, "EXTRACELLULAR_SPACE");
  assert.equal(late.projection.extracellular, true);
  assert.deepEqual(secretoryProductionStateAtFrame(program, 164, 10), late);
  const invalid = { ...early.projection, protein: { ...early.projection.protein, qualityState: "PASS" as const } };
  assert.equal(validateSecretoryProductionProjection(program, invalid).ok, false);
});

test("D-D teaching preserves cellular refs and audience-invariant science", () => {
  const plan = createSecretoryTeachingPlan(program, "why");
  const compiled = compileTeachingChapterProgram(plan, program.cellularScene.scene, program.timeline, program.cellularScene.cellular);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) return;
  const audiences = (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((audience) => projectTeachingForAudience({ teachingPlan: plan, chapterProgram: compiled.program, audience, scene: program.cellularScene.scene, timeline: program.timeline, cellular: program.cellularScene.cellular }));
  assert.equal(audiences.every((item) => item.ok), true);
  const snapshot = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: compiled.program, audienceProgram: audiences[1]!.ok ? audiences[1]!.program : (() => { throw new Error("audience") })(), scientificTimeline: program.timeline, timeSeconds: 16.4 });
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok || !audiences[1]!.ok) return;
  const text = buildTeachingTextBundle({ snapshot: snapshot.snapshot, teachingPlan: plan, audienceProgram: audiences[1]!.program, context: { scene: program.cellularScene.scene, timeline: program.timeline } });
  assert.equal(text.ok, true);
  if (!text.ok) return;
  const view = buildProductionTeachingView({ snapshot: snapshot.snapshot, textBundle: text.bundle, narrationProgram: text.narration });
  assert.equal(view.support.status, "SUPPORTED");
  assert.equal([...view.activeFocusRefs, ...view.secondaryContextRefs].some((ref) => ref.kind === "cellularLocalization" || ref.kind === "compartment"), true);
});

test("D-D P4 and ScenePackage/EmbedPackage preserve the integrated cellular lesson", async () => {
  const projection = projectSecretoryProductionAtTime(program, 16.4);
  assert.equal(projection.ok, true);
  if (!projection.ok) return;
  const applied = applyCellularSecretoryExactFrame(projection.projection, { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque", color: "#101820" } });
  assert.equal(applied.ok, true);
  const plan = createSecretoryTeachingPlan(program);
  const compiled = compileTeachingChapterProgram(plan, program.cellularScene.scene, program.timeline, program.cellularScene.cellular);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) return;
  const audience = projectTeachingForAudience({ teachingPlan: plan, chapterProgram: compiled.program, audience: "INTERMEDIATE", scene: program.cellularScene.scene, timeline: program.timeline, cellular: program.cellularScene.cellular });
  assert.equal(audience.ok, true);
  if (!audience.ok) return;
  const snapshot = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: compiled.program, audienceProgram: audience.program, scientificTimeline: program.timeline, timeSeconds: 16.4 });
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const text = buildTeachingTextBundle({ snapshot: snapshot.snapshot, teachingPlan: plan, audienceProgram: audience.program, context: { scene: program.cellularScene.scene, timeline: program.timeline } });
  assert.equal(text.ok, true);
  if (!text.ok) return;
  const bundles: Record<string, import("./teaching-text.ts").TeachingTextBundleV1> = {};
  const narrations: import("./teaching-text.ts").NarrationCueProgramV1[] = [];
  for (const entry of compiled.program.entries) {
    const eventId = entry.timelineMapping?.eventIds[0];
    const event = program.timeline.events.find((candidate) => candidate.eventId === eventId);
    if (!event) continue;
    const chapterSnapshot = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: compiled.program, audienceProgram: audience.program, scientificTimeline: program.timeline, timeSeconds: event.at });
    if (!chapterSnapshot.ok) continue;
    const chapterText = buildTeachingTextBundle({ snapshot: chapterSnapshot.snapshot, teachingPlan: plan, audienceProgram: audience.program, context: { scene: program.cellularScene.scene, timeline: program.timeline } });
    if (chapterText.ok) { bundles[entry.chapterId] = chapterText.bundle; narrations.push(chapterText.narration); }
  }
  const allCues = narrations.flatMap((item) => item.cues).filter((cue, index, all) => all.findIndex((candidate) => candidate.cueId === cue.cueId) === index);
  const combinedNarration = { ...text.narration, cues: allCues, captionSegments: narrations.flatMap((item) => item.captionSegments).filter((segment, index, all) => all.findIndex((candidate) => candidate.segmentId === segment.segmentId) === index) };
  const sequence = { schemaVersion: "1" as const, fps: 10, firstFrame: 0, lastFrame: 164, frameCount: 165, durationSeconds: 16.5, frameTimes: Array.from({ length: 165 }, (_, index) => index / 10), width: 1280, height: 720, pixelRatio: 1, ownerId: "SECRETORY_PATHWAY_CELLULAR_V1", format: "pngSequence" as const, captureScope: "CANVAS_ONLY" as const };
  const staticChapterTiming = Object.fromEntries(compiled.program.entries.map((entry) => { const eventId = entry.timelineMapping?.eventIds[0]; const time = program.timeline.events.find((event) => event.eventId === eventId)?.at ?? 0; return [entry.chapterId, { startSeconds: time, endSeconds: Math.min(program.timeline.clock.duration, time + 0.1) }]; }));
  const captionResult = buildCaptionTrack({ manifestId: "secretory", trackId: "secretory-captions", narrationProgram: combinedNarration, chapterProgram: compiled.program, timeline: program.timeline, sequence, staticChapterTiming });
  assert.equal(captionResult.ok, true, captionResult.ok ? "" : captionResult.reasons.join("; "));
  assert.equal(buildChapterTrack({ manifestId: "secretory", trackId: "secretory-chapters", narrationProgram: combinedNarration, chapterProgram: compiled.program, timeline: program.timeline, sequence }).ok, true);
  const frameByChapterId = Object.fromEntries(Object.entries(bundles).map(([chapterId]) => { const eventId = compiled.program.entries.find((entry) => entry.chapterId === chapterId)?.timelineMapping?.eventIds[0]; const time = program.timeline.events.find((event) => event.eventId === eventId)?.at ?? 0; return [chapterId, { sourceSurface: "SCENE_CANVAS" as const, timeSeconds: time, frameIndex: Math.round(time * 10), selectionReason: "TIMELINE_EVENT" as const }]; }));
  const slides = buildSlideDeckPlan({ deckId: "secretory-flagship", title: "Secretory protein lifecycle", teachingPlan: plan, chapterProgram: compiled.program, audienceProgram: audience.program, textBundles: bundles, timeline: program.timeline, sequence, frameByChapterId, exportSurface: "SCENE_CANVAS", capabilityId: "exocytosis" });
  assert.equal(slides.ok, true, slides.ok ? "" : slides.reasons.join("; "));
  if (slides.ok) assert.equal(buildSlidePackageManifest(slides.plan).ok, true);
  const pkg = await buildScenePackage({ packageId: "secretory-pathway-flagship", scientificSceneSpec: program.cellularScene.scene, cellularScientificExtension: program.cellularScene.cellular, scientificTimeline: program.timeline, teaching: { plan, chapterProgram: compiled.program, audiencePrograms: [audience.program], selectedAudience: "INTERMEDIATE", selectedSnapshot: snapshot.snapshot, textBundles: [text.bundle], narration: text.narration }, viewer: { schemaVersion: "1", packageVersion: "1", requiredRuntimeVersion: "teaching-runtime-v1", sceneOwner: "secretory-pathway-cellular", capabilityId: "exocytosis", initialView: "TIME_FOLLOWING", initialTimeSeconds: 16.4, teachingEnabled: true, audience: "INTERMEDIATE", playbackEnabled: true, supportedControls: ["PLAY", "SEEK", "CHAPTER_NAVIGATION", "AUDIENCE_SELECT"], assetResolution: "BUNDLED" }, representation: { owner: "PROCEDURAL", interactiveView: "SUPPORTED", exactFrameExport: "SUPPORTED" }, limitations: ["S2_SCHEMATIC organelle and folding presentation"] });
  assert.equal(pkg.ok, true, pkg.ok ? "" : pkg.reasons.join("; "));
  if (!pkg.ok) return;
  const embed = await buildEmbedPackage(pkg.package);
  assert.equal(embed.ok, true);
  assert.equal(pkg.package.cellularScientificExtension?.compartments.some((item) => item.compartmentId === "er-lumen"), true);
  assert.equal(pkg.package.cellularScientificExtension?.compartments.some((item) => item.compartmentId === "extracellular-space"), true);
});
