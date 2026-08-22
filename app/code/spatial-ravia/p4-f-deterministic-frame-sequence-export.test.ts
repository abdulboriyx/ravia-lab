import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { createDnaPairingProductionMigration, createDnaSeparationProductionMigration } from "./p3-g-production-temporal-migration.ts";
import { evaluateExactFrame, type ExactFrameRequestV1, type AppliedRenderStateV1 } from "./p4-b-exact-frame-runtime.ts";
import { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";
import { captureExactFrame, type CanvasCaptureTargetV1 } from "./p4-e-deterministic-image-capture.ts";
import { executeDeterministicFrameSequence, frameRequestForPlan, normalizeExactFrameSequencePlan, serializeFrameSequence, type FramePreparationResult, type VideoExportRequestV1 } from "./p4-f-deterministic-frame-sequence-export.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";

function staticTimeline(scene: ScientificSceneSpec, timelineId = "p4-f-static", duration = 2): ScientificTimeline {
  return { schemaVersion: "1", timelineId, clock: { duration, unit: "seconds" }, initialMechanismStateId: "paired", states: [{ mechanismStateId: "paired", scientificStateId: "paired-duplex", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] };
}

function separationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((item) => item.semanticTypeId === "strand").map((item) => item.actorId);
  return { ...base, topology: { ...base.topology, interactions: [{ ...base.topology.interactions[0]!, state: "present" }], continuities: [{ continuityId: "dna-backbone", strandActorId: strands[0]!, orderedActorIds: strands, state: "intact" }], changes: [{ changeId: "change-separation", kind: "separation", actorIds: [...strands, actorId("dna-1")], interactionIds: ["opened-pair-1"] }] }, states: [{ stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] }, { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] }] };
}

function separationTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  return { schemaVersion: "1", timelineId: "p4-f-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: scene.topology.actorIds }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: scene.topology.actorIds, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: scene.topology.actorIds, topologyChangeId: "change-separation" }], tracks: [] };
}

function staticRequest(): VideoExportRequestV1 {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  const migration = createDnaPairingProductionMigration(scene, staticTimeline(scene), { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(migration.ok, true);
  if (!migration.ok) throw new Error("migration unavailable");
  return { schemaVersion: "1", baseExactFrameRequest: { schemaVersion: "1", migration: migration.migration, renderConfig: { schemaVersion: "1", width: 320, height: 180, pixelRatio: 1, background: { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId: migration.migration.ownerId } }, firstFrame: 0, lastFrame: 2, fps: 30, format: "pngSequence", captureScope: "CANVAS_ONLY" };
}

function prepare(request: ExactFrameRequestV1): FramePreparationResult {
  const evaluated = evaluateExactFrame(request);
  if (!evaluated.ok) return { ok: false, code: evaluated.code === "FRAGMENTATION_UNGROUNDED" ? "FRAGMENTATION_UNGROUNDED" : "FRAME_RENDER_FAILED", frameIndex: request.frameIndex, reasons: evaluated.reasons };
  const host = new ExactFrameRenderHost({ ownerId: evaluated.appliedState.ownerId, setExactFrameState: () => undefined, getReadiness: () => ({ geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: true }) });
  const applied = host.apply(evaluated.appliedState);
  if (!applied.ok) return { ok: false, code: "FRAME_RENDER_FAILED", frameIndex: request.frameIndex, reasons: applied.reasons };
  const canvas: CanvasCaptureTargetV1 = { width: evaluated.appliedState.renderConfig.width, height: evaluated.appliedState.renderConfig.height, toBlob: (callback) => callback(new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" })) };
  return { ok: true, host, canvas, applicationId: applied.applicationId };
}

test("P4-F normalizes inclusive frame ranges and exact frame times", () => {
  const normalized = normalizeExactFrameSequencePlan(staticRequest());
  assert.equal(normalized.ok, true);
  if (normalized.ok) {
    assert.equal(normalized.plan.frameCount, 3);
    assert.deepEqual(normalized.plan.frameTimes, [0, 1 / 30, 2 / 30]);
    assert.equal(normalized.plan.durationSeconds, 3 / 30);
    assert.equal(frameRequestForPlan(staticRequest(), 2).frameIndex, 2);
  }
  assert.equal(normalizeExactFrameSequencePlan({ ...staticRequest(), firstFrame: 3, lastFrame: 2 }).ok, false);
});

test("P4-F executes an independent static sequence with progress and manifest metadata", async () => {
  const request = staticRequest();
  const progress: number[] = [];
  const result = await executeDeterministicFrameSequence(request, { prepareFrame: prepare, checksum: () => "sha256:test-frame", onFrame: (_artifact, frameIndex) => { progress.push(frameIndex); } }, { retainArtifacts: true, onProgress: (value) => progress.push(value.currentFrameIndex) });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.sequence.frames.map((frame) => frame.frameIndex), [0, 1, 2]);
    assert.equal(result.sequence.frames.every((frame) => frame.checksum === "sha256:test-frame"), true);
    assert.equal(result.sequence.artifacts?.length, 3);
    assert.equal(JSON.parse(serializeFrameSequence(result.sequence)).frameCount, 3);
  }
  assert.deepEqual(progress, [0, 0, 1, 1, 2, 2]);
});

test("P4-F scrambled and reverse execution reorder into the same canonical sequence", async () => {
  const request = { ...staticRequest(), firstFrame: 0, lastFrame: 4 };
  const normal = await executeDeterministicFrameSequence(request, { prepareFrame: prepare }, { retainArtifacts: true });
  const reverse = await executeDeterministicFrameSequence(request, { prepareFrame: prepare }, { retainArtifacts: true, executionOrder: [4, 2, 0, 3, 1] });
  assert.equal(normal.ok && reverse.ok, true);
  if (normal.ok && reverse.ok) assert.deepEqual(normal.sequence.frames, reverse.sequence.frames);
});

test("P4-F direct-frame state matches the corresponding sequence frame", async () => {
  const request = staticRequest();
  const sequence = await executeDeterministicFrameSequence(request, { prepareFrame: prepare }, { retainArtifacts: true });
  const direct = evaluateExactFrame(frameRequestForPlan(request, 1));
  assert.equal(sequence.ok && direct.ok, true);
  if (sequence.ok && direct.ok) {
    const sequenceState = sequence.sequence.artifacts?.[1];
    assert.equal(sequenceState?.metadata.timeSeconds, direct.timeSeconds);
    assert.equal(sequenceState?.metadata.ownerId, direct.appliedState.ownerId);
  }
});

test("P4-F propagates cancellation, frame failure, and unavailable video encoders", async () => {
  const request = staticRequest();
  const cancelled = await executeDeterministicFrameSequence(request, { prepareFrame: prepare }, { signal: { aborted: true } });
  assert.equal(cancelled.ok, false);
  if (!cancelled.ok) assert.equal(cancelled.code, "EXPORT_CANCELLED");
  const failed = await executeDeterministicFrameSequence(request, { prepareFrame: () => ({ ok: false, code: "FRAME_RENDER_FAILED", reasons: ["fixture failure"] }) });
  assert.equal(failed.ok, false);
  if (!failed.ok) assert.equal(failed.code, "FRAME_RENDER_FAILED");
  const encoderRequest = { ...request, format: "mp4" as const };
  const unavailable = await executeDeterministicFrameSequence(encoderRequest, { prepareFrame: prepare });
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) assert.equal(unavailable.code, "ENCODER_UNAVAILABLE");
});

test("P4-F DNA separation sequence preserves exact event boundary and timer-independent state", async () => {
  const scene = separationScene();
  const migration = createDnaSeparationProductionMigration(scene, separationTimeline(scene), { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening");
  assert.equal(migration.ok, true);
  if (!migration.ok) return;
  const request: VideoExportRequestV1 = { schemaVersion: "1", baseExactFrameRequest: { schemaVersion: "1", migration: migration.migration, renderConfig: { schemaVersion: "1", width: 320, height: 180, pixelRatio: 1, background: { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId: migration.migration.ownerId } }, firstFrame: 0, lastFrame: 2, fps: 1, format: "pngSequence", captureScope: "CANVAS_ONLY" };
  const result = await executeDeterministicFrameSequence(request, { prepareFrame: prepare }, { retainArtifacts: true });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.equal(result.sequence.frames[0]?.timeSeconds, 0);
    assert.equal(result.sequence.frames[1]?.timeSeconds, 1);
    assert.equal(result.sequence.frames[2]?.timeSeconds, 2);
  }
});
