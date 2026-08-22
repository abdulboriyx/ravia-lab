import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { applyCameraState, deterministicCameraBaselines, resolveExactFrameCamera, resolveMolstarExactFrameCamera, resolveOwnerCamera, serializeCameraState, type CameraStateV1 } from "./p4-d-deterministic-camera-execution.ts";
import { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";
import type { AppliedRenderStateV1 } from "./p4-b-exact-frame-runtime.ts";

const bounds = { center: [0, 1, 0] as const, halfExtent: [2, 1, 0.5] as const, radius: 2.3 };
const renderConfig = { width: 1280, height: 720, pixelRatio: 1 };
const cue = { kind: "frameActors" as const, actorIds: [actorId("strand-a"), actorId("strand-b")], transitionProgress: 0.5 };

function resolve(ownerId: "DnaStrandSeparationPresentation" | "RnaSecondaryStructurePresentation" = "DnaStrandSeparationPresentation", config = renderConfig) {
  return resolveOwnerCamera(ownerId, cue, config, bounds);
}

test("P4-D resolves a deterministic DNA camera from cue, bounds, and fixed dimensions", () => {
  const first = resolve();
  const second = resolve();
  assert.equal(first.ok, true);
  assert.deepEqual(first, second);
  if (first.ok) {
    assert.equal(first.state.aspect, 1280 / 720);
    assert.equal(first.state.cueKind, "frameActors");
    assert.equal(first.state.renderWidth, 1280);
    assert.equal(first.state.renderHeight, 720);
    assert.equal(JSON.parse(serializeCameraState(first.state)).resolvedCueId, first.state.resolvedCueId);
  }
});

test("P4-D direct, out-of-order, repeated, and backward camera evaluation is history-independent", () => {
  const direct = resolve();
  const sequence = [resolve("DnaStrandSeparationPresentation", { ...renderConfig, width: 1920, height: 1080 }), resolve("DnaStrandSeparationPresentation", { ...renderConfig, width: 640, height: 480 }), resolve(), resolve("DnaStrandSeparationPresentation", { ...renderConfig, width: 640, height: 480 }), resolve()];
  assert.equal(direct.ok, true);
  assert.equal(sequence[2]?.ok, true);
  assert.equal(sequence[4]?.ok, true);
  if (direct.ok && sequence[2]?.ok && sequence[4]?.ok) {
    assert.deepEqual(sequence[2].state, direct.state);
    assert.deepEqual(sequence[4].state, direct.state);
  }
});

test("P4-D preserves camera semantics across DPR and changes only aspect when dimensions change", () => {
  const one = resolve("RnaSecondaryStructurePresentation", { ...renderConfig, pixelRatio: 1 });
  const two = resolve("RnaSecondaryStructurePresentation", { ...renderConfig, pixelRatio: 2 });
  const wide = resolve("RnaSecondaryStructurePresentation", { ...renderConfig, width: 1600 });
  assert.equal(one.ok && two.ok && wide.ok, true);
  if (one.ok && two.ok && wide.ok) {
    assert.deepEqual({ position: one.state.position, target: one.state.target, fov: one.state.fov, distance: one.state.distance }, { position: two.state.position, target: two.state.target, fov: two.state.fov, distance: two.state.distance });
    assert.notEqual(one.state.aspect, wide.state.aspect);
  }
});

test("P4-D rejects missing bounds and unresolved preserveCurrent without a baseline", () => {
  const missing = resolveOwnerCamera("DnaStrandSeparationPresentation", cue, renderConfig, null);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "CAMERA_BOUNDS_PENDING");
  const unresolved = resolveExactFrameCamera({ ownerId: "DnaStrandSeparationPresentation", cameraCue: { kind: "preserveCurrent", actorIds: [], transitionProgress: 0 }, renderConfig, ownerBounds: bounds });
  assert.equal(unresolved.ok, false);
  if (!unresolved.ok) assert.equal(unresolved.code, "CAMERA_STATE_UNRESOLVED");
});

test("P4-D applies a complete absolute camera state and overwrites prior pose", () => {
  let applied: CameraStateV1 | null = null;
  const first = resolve();
  const second = resolve("DnaStrandSeparationPresentation", { ...renderConfig, width: 640, height: 480 });
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  const result = applyCameraState(first.state, { ownerId: first.state.ownerId, setCameraState: (state) => { applied = state; } });
  assert.equal(result.ok, true);
  const resultTwo = applyCameraState(second.state, { ownerId: second.state.ownerId, setCameraState: (state) => { applied = state; } });
  assert.equal(resultTwo.ok, true);
  assert.deepEqual(applied, second.state);
});

test("P4-D integrates camera readiness with current-frame identity", () => {
  const dummyState = { schemaVersion: "1", ownerId: "DnaStrandSeparationPresentation", timeSeconds: 0, renderConfig: { schemaVersion: "1", ...renderConfig, background: { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId: "DnaStrandSeparationPresentation" }, presentation: {} as AppliedRenderStateV1["presentation"], ownerState: {} as AppliedRenderStateV1["ownerState"], actorVisibility: [], labels: {} as AppliedRenderStateV1["labels"], cameraCue: cue, trace: { sourceInteractionIds: [], sourceTopologyChangeIds: [], sourceContinuityIds: [], sourceActorIds: [], timelineId: "camera" } } as AppliedRenderStateV1;
  const host = new ExactFrameRenderHost({ ownerId: "DnaStrandSeparationPresentation", setExactFrameState: () => undefined });
  const application = host.apply(dummyState);
  assert.equal(application.ok, true);
  const camera = resolve();
  assert.equal(camera.ok, true);
  if (!application.ok || !camera.ok) return;
  const stale = host.apply(dummyState);
  assert.equal(stale.ok, true);
  const result = host.applyCamera(camera.state, { ownerId: camera.state.ownerId, setCameraState: () => undefined }, application.applicationId);
  assert.equal(result.ok, false);
  assert.equal(host.snapshot.readiness.cameraReady, false);
});

test("P4-D exposes explicit deterministic owner baselines", () => {
  assert.equal(deterministicCameraBaselines.DnaBasePairInteractionPresentation.ownerId, "DnaBasePairInteractionPresentation");
  assert.equal(deterministicCameraBaselines.RnaDegradationPresentation.cameraKind, "perspective");
});

test("P4-D reports the current Mol* exact-frame camera limitation explicitly", () => {
  const result = resolveMolstarExactFrameCamera();
  assert.equal(result.code, "CAMERA_EXECUTION_UNSUPPORTED");
});
