import assert from "node:assert/strict";
import test from "node:test";
import { buildCaptionTrack, buildChapterTrack, buildVideoPackageManifest, parseSerializedCaptionTimestamp, serializeCaptionTrack, serializeChapterTrack, serializeSrt, serializeVideoPackageManifest, serializeWebVtt, type CaptionPackagingInputV1 } from "./b-d-caption-video-packaging.ts";
import type { NarrationCueProgramV1, TeachingTextBundleV1 } from "./teaching-text.ts";
import type { TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { ExactFrameSequencePlanV1 } from "./p4-f-deterministic-frame-sequence-export.ts";
import type { VideoExportRequestV2 } from "./b-c-deterministic-video-encoding.ts";

const state = (stateId: string) => ({ kind: "scientificState" as const, stateId });
const text = (requestMode: TeachingTextBundleV1["requestMode"] = "why"): TeachingTextBundleV1 => ({ schemaVersion: "1", teachingPlanId: "teaching-plan", snapshotTrace: { chapterProgramId: "chapter-program", timeSeconds: 0, activeChapterIds: ["paired"] }, audience: "INTERMEDIATE", requestMode, chapterId: "paired", chapterTitle: "Paired", learningObjectiveText: "Understand the grounded sequence.", explanationSegments: [], annotationText: [], causalText: [], contrastText: [], correctionText: [], terminology: { level: "STANDARD_SCIENTIFIC", explanationDepth: "STRUCTURED" }, narrationSegments: [], captionSegments: [], segments: [], provenanceRefs: [], support: { status: "SUPPORTED", reasons: [] } });
const program = (ids: readonly string[], temporal = true): TeachingChapterProgramV1 => ({ schemaVersion: "1", planId: "chapter-program", sceneId: "scene", entries: ids.map((chapterId, order) => ({ chapterId, order: order + 1, role: order === 0 ? "IDENTIFY" : "EXPLAIN", dependsOn: order ? [ids[order - 1]!] : [], timelineRefs: temporal ? [{ kind: "timelineChapter", timelineChapterId: chapterId }] : [], ...(temporal ? { timelineMapping: { chapterIds: [chapterId], eventIds: [], transitionIds: [] } } : {}), disclosure: { primaryFocusRefs: [state(chapterId)], secondaryContextRefs: [], suppressedContextRefs: [], activeAnnotationIds: [], activeCausalStepIds: [], activeContrastIds: [], activeCorrectionIds: [], detail: "MECHANISTIC" }, provenanceRefs: [] })) });
const timeline = { schemaVersion: "1" as const, timelineId: "timeline-separation", clock: { duration: 4, unit: "seconds" as const }, initialMechanismStateId: "paired", states: [], transitions: [], events: [], tracks: [], chapters: [{ chapterId: "paired", start: 0, end: 1 }, { chapterId: "opening", start: 1, end: 2 }, { chapterId: "separation", start: 2, end: 2.1 }, { chapterId: "separated", start: 2.1, end: 4 }] };
const sequence: ExactFrameSequencePlanV1 = { schemaVersion: "1", fps: 30, firstFrame: 0, lastFrame: 119, frameCount: 120, durationSeconds: 4, frameTimes: [], width: 320, height: 180, pixelRatio: 1, ownerId: "DnaStrandSeparationPresentation", format: "pngSequence", captureScope: "CANVAS_ONLY" };
function narration(ids: readonly string[] = ["paired", "opening", "separation", "separated"], reverse = false): NarrationCueProgramV1 {
  const cues = ids.map((chapterId, index) => ({ cueId: `cue-${chapterId}`, chapterId, segmentIds: [`segment-${chapterId}`], purpose: "explain" as const, targetRefs: [state(chapterId)], timelineRefs: [{ kind: "timelineChapter" as const, timelineChapterId: chapterId }], activation: { chapterId, startSeconds: index, endSeconds: index === ids.length - 1 ? 4 : index + 1, timelineRefs: [{ kind: "timelineChapter" as const, timelineChapterId: chapterId }] }, audience: "INTERMEDIATE" as const, priority: 0, order: index, provenanceRefs: [] }));
  const captions = cues.map((cue) => ({ segmentId: cue.segmentIds[0]!, cueId: cue.cueId, chapterId: cue.chapterId, text: cue.chapterId === "separation" ? "Separation occurs at the grounded boundary." : `${cue.chapterId} state.`, activation: cue.activation, provenanceRefs: [] }));
  return { schemaVersion: "1", teachingPlanId: "teaching-plan", audience: "INTERMEDIATE", cues: reverse ? [...cues].reverse() : cues, captionSegments: reverse ? [...captions].reverse() : captions };
}
function input(overrides: Partial<CaptionPackagingInputV1> = {}): CaptionPackagingInputV1 { return { manifestId: "manifest", trackId: "track", narrationProgram: narration(), teachingText: text(), chapterProgram: program(["paired", "opening", "separation", "separated"]), timeline, sequence, captionPolicy: "SIDECAR", ...overrides }; }

test("B-D builds deterministic frame-aligned caption and temporal chapter tracks", () => {
  const captions = buildCaptionTrack(input());
  const chapters = buildChapterTrack(input());
  assert.equal(captions.ok && chapters.ok, true, JSON.stringify({ captions, chapters }));
  if (captions.ok && chapters.ok) {
    assert.deepEqual(captions.track.cues.map((cue) => [cue.chapterId, cue.startFrame, cue.endFrame]), [["paired", 0, 30], ["opening", 30, 60], ["separation", 60, 90], ["separated", 90, 120]]);
    assert.deepEqual(chapters.track.markers.map((marker) => [marker.chapterId, marker.startSeconds, marker.endSeconds]), [["paired", 0, 1], ["opening", 1, 2], ["separation", 2, 2.1], ["separated", 2.1, 4]]);
  }
});

test("B-D emits valid deterministic WebVTT and SRT with one rounding policy", () => {
  const result = buildCaptionTrack(input());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const vtt = serializeWebVtt(result.track);
  const srt = serializeSrt(result.track);
  assert.match(vtt, /^WEBVTT\n/);
  assert.match(vtt, /00:00:02\.000 --> 00:00:03\.000/);
  assert.match(srt, /00:00:02,000 --> 00:00:03,000/);
  assert.equal(parseSerializedCaptionTimestamp("00:00:02.000", "vtt"), 2);
  assert.equal(parseSerializedCaptionTimestamp("00:00:02,000", "srt"), 2);
  assert.equal(vtt, serializeWebVtt(result.track));
  assert.equal(srt, serializeSrt(result.track));
});

test("B-D requires explicit static presentation timing and never fabricates scientific time", () => {
  const staticNarration = narration(["dna-structure", "pairing"]);
  const staticInput = input({ timeline: undefined, sequence: undefined, chapterProgram: program(["dna-structure", "pairing"], false), narrationProgram: { ...staticNarration, cues: staticNarration.cues.map((cue) => ({ ...cue, activation: { chapterId: cue.chapterId, timelineRefs: [] } })), captionSegments: staticNarration.captionSegments.map((segment) => ({ ...segment, activation: { chapterId: segment.chapterId, timelineRefs: [] } })) } });
  const missing = buildCaptionTrack(staticInput);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "CAPTION_TIMING_REQUIRED");
  const withTiming = buildCaptionTrack({ ...staticInput, staticChapterTiming: { "dna-structure": { startSeconds: 0, endSeconds: 2 }, pairing: { startSeconds: 2, endSeconds: 4 } } });
  assert.equal(withTiming.ok, true, JSON.stringify(withTiming));
  const chapters = buildChapterTrack({ ...staticInput, staticChapterTiming: { "dna-structure": { startSeconds: 0, endSeconds: 2 }, pairing: { startSeconds: 2, endSeconds: 4 } } });
  assert.equal(chapters.ok, true);
  if (chapters.ok) assert.equal(chapters.track.mode, "STATIC_PRESENTATION");
});

test("B-D preserves future-leakage boundaries, source ordering, and rejects invalid references", () => {
  const reversed = buildCaptionTrack(input({ narrationProgram: narration(undefined, true) }));
  const normal = buildCaptionTrack(input());
  assert.equal(reversed.ok && normal.ok, true);
  if (reversed.ok && normal.ok) assert.deepEqual(reversed.track, normal.track);
  const invalidTiming = buildCaptionTrack(input({ narrationProgram: { ...narration(), cues: [{ ...narration().cues[0]!, activation: { ...narration().cues[0]!.activation, startSeconds: 2, endSeconds: 1 } }], captionSegments: narration().captionSegments } }));
  assert.equal(invalidTiming.ok, false);
  if (!invalidTiming.ok) assert.equal(invalidTiming.code, "CAPTION_TIMING_INVALID");
  const missingChapter = buildCaptionTrack(input({ narrationProgram: { ...narration(), captionSegments: [{ ...narration().captionSegments[0]!, chapterId: "missing" }] } }));
  assert.equal(missingChapter.ok, false);
  if (!missingChapter.ok) assert.equal(missingChapter.code, "CAPTION_REFERENCE_INVALID");
});

test("B-D packages NONE, SIDECAR, and BURNED_IN policies without requiring video bytes", () => {
  const none = buildVideoPackageManifest(input({ captionPolicy: "NONE" }));
  assert.equal(none.ok, true, JSON.stringify(none));
  if (none.ok) { assert.equal(none.manifest.packageStatus, "VIDEO_UNAVAILABLE"); assert.equal(none.manifest.encoderStatus, "ENCODER_UNAVAILABLE"); assert.equal(none.manifest.captionTracks.length, 0); }
  const sidecar = buildVideoPackageManifest(input());
  assert.equal(sidecar.ok, true);
  if (sidecar.ok) assert.equal(sidecar.manifest.captionTracks.length, 1);
  const burned = buildVideoPackageManifest(input({ captionPolicy: "BURNED_IN", exportRequest: { sourceSurface: "SCENE_WITH_TEACHING_OVERLAY" } as VideoExportRequestV2 }));
  assert.equal(burned.ok, true, JSON.stringify(burned));
  const invalidBurned = buildVideoPackageManifest(input({ captionPolicy: "BURNED_IN", exportRequest: { sourceSurface: "SCENE_CANVAS" } as VideoExportRequestV2 }));
  assert.equal(invalidBurned.ok, false);
  if (!invalidBurned.ok) assert.equal(invalidBurned.code, "VIDEO_PACKAGE_INVALID");
});

test("B-D preserves comparison/correction structure and fragmentation failure", () => {
  const compare = buildCaptionTrack(input({ teachingText: text("compare"), narrationProgram: { ...narration(["compare-a", "compare-b"]), cues: narration(["compare-a", "compare-b"]).cues, captionSegments: narration(["compare-a", "compare-b"]).captionSegments }, chapterProgram: program(["compare-a", "compare-b"]), timeline: { ...timeline, chapters: [{ chapterId: "compare-a", start: 0, end: 2 }, { chapterId: "compare-b", start: 2, end: 4 }] } }));
  assert.equal(compare.ok, true);
  const correction = buildCaptionTrack(input({ teachingText: text("misconceptionCorrection") }));
  assert.equal(correction.ok, true);
  const fragmented = buildVideoPackageManifest(input({ upstreamFailureCode: "FRAGMENTATION_UNGROUNDED" }));
  assert.equal(fragmented.ok, false);
  if (!fragmented.ok) assert.equal(fragmented.code, "FRAGMENTATION_UNGROUNDED");
});

test("B-D serializes tracks and manifests and preserves mock video linkage", () => {
  const chapters = buildChapterTrack(input());
  const captions = buildCaptionTrack(input());
  assert.equal(chapters.ok && captions.ok, true);
  if (!chapters.ok || !captions.ok) return;
  const manifest = buildVideoPackageManifest(input({ videoArtifact: { schemaVersion: "1", format: "webm", mimeType: "video/webm", width: 320, height: 180, fps: 30, firstFrame: 0, lastFrame: 119, frameCount: 120, durationSeconds: 4, sourceSurface: "SCENE_CANVAS", ownerId: sequence.ownerId, encoderBackend: "reference-test-encoder", encoderVersion: "1", byteLength: 12, status: "COMPLETE" } }));
  assert.equal(manifest.ok, true, JSON.stringify(manifest));
  if (manifest.ok) {
    assert.deepEqual(JSON.parse(serializeCaptionTrack(captions.track)), captions.track);
    assert.deepEqual(JSON.parse(serializeChapterTrack(chapters.track)), chapters.track);
    assert.deepEqual(JSON.parse(serializeVideoPackageManifest(manifest.manifest)), manifest.manifest);
    assert.equal(manifest.manifest.packageStatus, "READY");
  }
});
