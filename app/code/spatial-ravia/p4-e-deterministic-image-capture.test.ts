import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { createDnaPairingProductionMigration } from "./p3-g-production-temporal-migration.ts";
import { evaluateExactFrame, type ExactFrameRequestV1, type RenderConfigV1 } from "./p4-b-exact-frame-runtime.ts";
import { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";
import { captureExactFrame, browserCanvasCaptureBackend, serializeCaptureMetadata, type CanvasCaptureTargetV1, type CaptureFrameRequestV1 } from "./p4-e-deterministic-image-capture.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

function timeline(scene: ScientificSceneSpec): ScientificTimeline {
  return { schemaVersion: "1", timelineId: "p4-e-static", clock: { duration: 20, unit: "seconds" }, initialMechanismStateId: "paired", states: [{ mechanismStateId: "paired", scientificStateId: "paired-duplex", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] };
}

function request(format: "png" | "pngTransparent" = "png", frameIndex = 427, backgroundMode: "opaque" | "transparent" = "opaque") {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  const migrationResult = createDnaPairingProductionMigration(scene, timeline(scene), { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(migrationResult.ok, true, JSON.stringify(migrationResult));
  if (!migrationResult.ok) throw new Error("migration unavailable");
  const renderConfig: RenderConfigV1 = { schemaVersion: "1", width: 320, height: 180, pixelRatio: 2, background: backgroundMode === "transparent" ? { mode: "transparent" } : { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId: migrationResult.migration.ownerId };
  const exactFrameRequest: ExactFrameRequestV1 = { schemaVersion: "1", migration: migrationResult.migration, frameIndex, fps: 30, renderConfig };
  const evaluated = evaluateExactFrame(exactFrameRequest);
  assert.equal(evaluated.ok, true, JSON.stringify(evaluated));
  if (!evaluated.ok) throw new Error("frame unavailable");
  return { exactFrameRequest, state: evaluated.appliedState };
}

function hostFor(state: ReturnType<typeof request>["state"], readiness = { geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: true }) {
  const host = new ExactFrameRenderHost({ ownerId: state.ownerId, setExactFrameState: () => undefined, getReadiness: () => readiness });
  const applied = host.apply(state);
  assert.equal(applied.ok, true);
  if (!applied.ok) throw new Error("host unavailable");
  return { host, applicationId: applied.applicationId };
}

function canvasFor(width: number, height: number): CanvasCaptureTargetV1 {
  return { width, height, toBlob: (callback) => callback(new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })) };
}

function captureRequest(exactFrameRequest: ExactFrameRequestV1, applicationId: number, format: "png" | "pngTransparent" = "png"): CaptureFrameRequestV1 {
  return { schemaVersion: "1", exactFrameRequest, applicationId, format, captureScope: "CANVAS_ONLY" };
}

test("P4-E captures frame 427 directly at exact pixel dimensions", async () => {
  const prepared = request();
  const mounted = hostFor(prepared.state);
  const result = await captureExactFrame({ host: mounted.host, request: captureRequest(prepared.exactFrameRequest, mounted.applicationId), canvas: canvasFor(640, 360) });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.artifact.metadata.frameIndex, 427);
    assert.equal(result.artifact.metadata.timeSeconds, 427 / 30);
    assert.equal(result.artifact.metadata.width, 640);
    assert.equal(result.artifact.metadata.height, 360);
    assert.equal(result.artifact.metadata.byteLength > 0, true);
  }
});

test("P4-E rejects capture before camera readiness and rejects stale frame identity", async () => {
  const prepared = request();
  const pending = hostFor(prepared.state, { geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: false });
  const notReady = await captureExactFrame({ host: pending.host, request: captureRequest(prepared.exactFrameRequest, pending.applicationId), canvas: canvasFor(640, 360) });
  assert.equal(notReady.ok, false);
  if (!notReady.ok) assert.equal(notReady.code, "CAPTURE_NOT_READY");
  const ready = hostFor(prepared.state);
  const staleId = ready.applicationId;
  ready.host.apply(prepared.state);
  const stale = await captureExactFrame({ host: ready.host, request: captureRequest(prepared.exactFrameRequest, staleId), canvas: canvasFor(640, 360) });
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.code, "CAPTURE_STALE_FRAME");
});

test("P4-E supports transparent PNG only with explicit transparent render state", async () => {
  const prepared = request("pngTransparent", 427, "transparent");
  const mounted = hostFor(prepared.state);
  const result = await captureExactFrame({ host: mounted.host, request: captureRequest(prepared.exactFrameRequest, mounted.applicationId, "pngTransparent"), canvas: canvasFor(640, 360) });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.artifact.metadata.backgroundMode, "transparent");
  const opaque = request("pngTransparent", 427, "opaque");
  const opaqueHost = hostFor(opaque.state);
  const invalid = await captureExactFrame({ host: opaqueHost.host, request: captureRequest(opaque.exactFrameRequest, opaqueHost.applicationId, "pngTransparent"), canvas: canvasFor(640, 360) });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, "CAPTURE_UNSUPPORTED_FORMAT");
});

test("P4-E repeated and out-of-order captures preserve metadata and semantic state", async () => {
  const prepared = request();
  const mounted = hostFor(prepared.state);
  const first = await captureExactFrame({ host: mounted.host, request: captureRequest(prepared.exactFrameRequest, mounted.applicationId), canvas: canvasFor(640, 360) });
  mounted.host.apply(prepared.state);
  const secondId = mounted.host.snapshot.applicationId;
  const second = await captureExactFrame({ host: mounted.host, request: captureRequest(prepared.exactFrameRequest, secondId), canvas: canvasFor(640, 360) });
  assert.equal(first.ok && second.ok, true);
  if (first.ok && second.ok) {
    assert.deepEqual({ ...first.artifact.metadata, byteLength: undefined }, { ...second.artifact.metadata, byteLength: undefined });
    assert.equal(JSON.stringify(first.artifact.metadata), JSON.stringify(first.artifact.metadata));
    assert.equal(JSON.parse(serializeCaptureMetadata(first.artifact.metadata)).timelineId, "p4-e-static");
  }
});

test("P4-E rejects unsupported scope, bad dimensions, and empty encoding", async () => {
  const prepared = request();
  const mounted = hostFor(prepared.state);
  const badScope = await captureExactFrame({ host: mounted.host, request: { ...captureRequest(prepared.exactFrameRequest, mounted.applicationId), captureScope: "COMPOSITE_VIEW" as "CANVAS_ONLY" }, canvas: canvasFor(640, 360) });
  assert.equal(badScope.ok, false);
  if (!badScope.ok) assert.equal(badScope.code, "CAPTURE_UNSUPPORTED_SCOPE");
  const badDimensions = await captureExactFrame({ host: mounted.host, request: captureRequest(prepared.exactFrameRequest, mounted.applicationId), canvas: canvasFor(320, 180) });
  assert.equal(badDimensions.ok, false);
  if (!badDimensions.ok) assert.equal(badDimensions.code, "CAPTURE_CANVAS_UNAVAILABLE");
  const emptyBackend = { ...browserCanvasCaptureBackend, capturePng: async () => new Blob() };
  const empty = await captureExactFrame({ host: mounted.host, request: captureRequest(prepared.exactFrameRequest, mounted.applicationId), canvas: canvasFor(640, 360), backend: emptyBackend });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.code, "CAPTURE_ENCODING_FAILED");
});
