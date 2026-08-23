import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { createDnaPairingProductionMigration } from "./p3-g-production-temporal-migration.ts";
import { executeDeterministicVideoExport, encodeCapturedFrameStream, encodeCompositeFrameSequence, referenceVideoEncoderBackend, serializeVideoArtifactMetadata, unavailableVideoEncoderBackend, type VideoExportRequestV2, type VideoFrameInputV1 } from "./b-c-deterministic-video-encoding.ts";
import type { CapturedFrameArtifactV1 } from "./p4-e-deterministic-image-capture.ts";
import type { VideoExportRequestV1 } from "./p4-f-deterministic-frame-sequence-export.ts";
import { evaluateExactFrame } from "./p4-b-exact-frame-runtime.ts";
import { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";
import type { FramePreparationResult } from "./p4-f-deterministic-frame-sequence-export.ts";

function request(format: "mp4" | "webm" = "mp4", background: "opaque" | "transparent" = "opaque"): VideoExportRequestV1 {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  const timeline = { schemaVersion: "1" as const, timelineId: "b-c-video", clock: { duration: 2, unit: "seconds" as const }, initialMechanismStateId: "paired", states: [{ mechanismStateId: "paired", scientificStateId: "paired-duplex", kind: "before" as const, actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] };
  const migration = createDnaPairingProductionMigration(scene, timeline, { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(migration.ok, true);
  if (!migration.ok) throw new Error("fixture migration unavailable");
  return { schemaVersion: "1", baseExactFrameRequest: { schemaVersion: "1", migration: migration.migration, renderConfig: { schemaVersion: "1", width: 320, height: 180, pixelRatio: 1, background: { mode: background, ...(background === "opaque" ? { color: "#ffffff" } : {}) }, runtimeMode: "EXACT_FRAME", ownerId: migration.migration.ownerId } }, firstFrame: 0, lastFrame: 2, fps: 30, format, captureScope: "CANVAS_ONLY" };
}

function frame(frameIndex: number, options: Partial<VideoFrameInputV1> = {}): CapturedFrameArtifactV1 {
  return { metadata: { schemaVersion: "1", format: "png", mimeType: "image/png", width: 320, height: 180, pixelRatio: 1, frameIndex, timeSeconds: frameIndex / 30, fps: 30, ownerId: "DnaBasePairInteractionPresentation", backgroundMode: "opaque", captureScope: "CANVAS_ONLY", timelineId: "b-c-video", sourceInteractionIds: ["at-pair-1"], sourceTopologyChangeIds: [], byteLength: 3 }, blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), ...options };
}

async function* source(frames: readonly CapturedFrameArtifactV1[]) { for (const item of frames) yield item; }

test("B-C encodes valid MP4 and WebM contracts through the reference backend", async () => {
  for (const format of ["mp4", "webm"] as const) {
    const result = await encodeCapturedFrameStream(source([frame(0), frame(1), frame(2)]), request(format), referenceVideoEncoderBackend, { checksum: () => "sha256:reference" });
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok) { assert.equal(result.artifact.metadata.format, format); assert.equal(result.artifact.metadata.frameCount, 3); assert.equal(result.artifact.metadata.fps, 30); assert.equal(result.artifact.metadata.durationSeconds, 3 / 30); assert.equal(result.artifact.metadata.checksum, "sha256:reference"); assert.equal(JSON.parse(serializeVideoArtifactMetadata(result.artifact.metadata)).frameCount, 3); }
  }
});

test("B-C rejects unavailable encoders, alpha requests, bad order, duplicates, missing frames, and dimensions", async () => {
  const unavailable = await encodeCapturedFrameStream(source([frame(0), frame(1), frame(2)]), request(), unavailableVideoEncoderBackend);
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) assert.equal(unavailable.code, "ENCODER_UNAVAILABLE");
  const alpha = await encodeCapturedFrameStream(source([frame(0)]), request("webm", "transparent"), referenceVideoEncoderBackend);
  assert.equal(alpha.ok, false);
  if (!alpha.ok) assert.equal(alpha.code, "VIDEO_ALPHA_UNSUPPORTED");
  const wrongOrder = await encodeCapturedFrameStream(source([frame(1), frame(0), frame(2)]), request(), referenceVideoEncoderBackend);
  assert.equal(wrongOrder.ok, false);
  if (!wrongOrder.ok) assert.equal(wrongOrder.code, "VIDEO_FRAME_SEQUENCE_INVALID");
  const duplicate = await encodeCapturedFrameStream(source([frame(0), frame(1), frame(1)]), request(), referenceVideoEncoderBackend);
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) assert.equal(duplicate.code, "VIDEO_FRAME_SEQUENCE_INVALID");
  const missing = await encodeCapturedFrameStream(source([frame(0), frame(1)]), request(), referenceVideoEncoderBackend);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "VIDEO_FRAME_SEQUENCE_INVALID");
  const badDimensions = frame(0);
  const dimensions = await encodeCapturedFrameStream(source([{ ...badDimensions, metadata: { ...badDimensions.metadata, width: 640 } }]), request(), referenceVideoEncoderBackend);
  assert.equal(dimensions.ok, false);
  if (!dimensions.ok) assert.equal(dimensions.code, "ENCODER_FRAME_REJECTED");
});

test("B-C preserves cancellation and progress without reporting partial success", async () => {
  const progress: string[] = [];
  const result = await encodeCapturedFrameStream(source([frame(0), frame(1), frame(2)]), request(), referenceVideoEncoderBackend, { signal: { aborted: true }, onProgress: (value) => progress.push(value.phase) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "ENCODER_CANCELLED");
  assert.deepEqual(progress, []);
});

test("B-C executes exact P4 frames before encoding and keeps frame order independent of encoder timing", async () => {
  const videoRequest = request();
  const prepare = (exactRequest: Parameters<typeof evaluateExactFrame>[0]): FramePreparationResult => {
    const evaluated = evaluateExactFrame(exactRequest);
    assert.equal(evaluated.ok, true);
    if (!evaluated.ok) throw new Error("exact frame fixture unavailable");
    const host = new ExactFrameRenderHost({ ownerId: evaluated.appliedState.ownerId, setExactFrameState: () => undefined, getReadiness: () => ({ geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: true }) });
    const applied = host.apply(evaluated.appliedState);
    assert.equal(applied.ok, true);
    if (!applied.ok) throw new Error("host fixture unavailable");
    return { ok: true as const, host, applicationId: applied.applicationId, canvas: { width: 320, height: 180, toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" })) } };
  };
  const progress: number[] = [];
  const result = await executeDeterministicVideoExport(videoRequest, { prepareFrame: (exactRequest) => prepare(exactRequest), checksum: () => "frame" }, referenceVideoEncoderBackend, { onProgress: (value) => { if (value.currentFrameIndex !== undefined) progress.push(value.currentFrameIndex); } });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) { assert.equal(result.artifact.metadata.frameCount, 3); assert.equal(result.artifact.metadata.sourceSurface, "SCENE_CANVAS"); }
  assert.deepEqual(progress, [0, 0, 1, 1, 2, 2]);
});

test("B-C accepts a bounded teaching-overlay sequence only with v2 teaching identity", async () => {
  const v2: VideoExportRequestV2 = { ...request("webm"), schemaVersion: "2", sourceSurface: "SCENE_WITH_TEACHING_OVERLAY", teaching: { teachingPlanId: "teaching-plan", snapshotId: "snapshot", textBundleId: "text-bundle", audience: "INTERMEDIATE", requestMode: "why" } };
  const artifact = { metadata: { schemaVersion: "1" as const, exportSurface: "SCENE_WITH_TEACHING_OVERLAY" as const, format: "png" as const, mimeType: "image/png" as const, width: 320, height: 180, pixelRatio: 1, applicationId: 1, ownerId: "DnaBasePairInteractionPresentation", timelineId: "b-c-video", timeSeconds: 0, frameIndex: 0, fps: 30, teachingPlanId: "teaching-plan", chapterProgramId: "chapter", teachingChapterId: "chapter", audience: "INTERMEDIATE" as const, requestMode: "why" as const, provenanceRefs: [], byteLength: 3, backend: "reference" }, blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) };
  const artifacts = [0, 1, 2].map((frameIndex) => ({ ...artifact, metadata: { ...artifact.metadata, frameIndex, timeSeconds: frameIndex / 30 } }));
  const result = await encodeCompositeFrameSequence(artifacts, v2, referenceVideoEncoderBackend);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) assert.equal(result.artifact.metadata.sourceSurface, "SCENE_WITH_TEACHING_OVERLAY");
  const missingTeaching = { ...v2, teaching: undefined } as VideoExportRequestV2;
  const missing = await encodeCompositeFrameSequence(artifacts, missingTeaching, referenceVideoEncoderBackend);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "VIDEO_FRAME_SEQUENCE_INVALID");
});
