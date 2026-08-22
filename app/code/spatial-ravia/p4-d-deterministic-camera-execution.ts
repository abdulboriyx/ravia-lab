/** P4-D: pure exact-frame camera resolution and absolute application. */

import type { PresentationCameraCueV1, PresentationOwnerId } from "./p3-e-presentation-synchronization.ts";
import * as THREE from "three";

export type CameraPointV1 = readonly [number, number, number];

export type CameraBoundsV1 = Readonly<{
  center: CameraPointV1;
  radius: number;
  halfExtent?: CameraPointV1;
}>;

export type DeterministicCameraBaselineV1 = Readonly<{
  ownerId: PresentationOwnerId;
  cameraKind: "perspective";
  viewDirection: CameraPointV1;
  up: CameraPointV1;
  fov: number;
  near: number;
  far: number;
  minDistance: number;
  maxDistance: number;
  targetOffset?: CameraPointV1;
}>;

export type CameraStateV1 = Readonly<{
  schemaVersion: "1";
  ownerId: PresentationOwnerId;
  cameraKind: "perspective";
  position: CameraPointV1;
  target: CameraPointV1;
  up: CameraPointV1;
  fov: number;
  near: number;
  far: number;
  aspect: number;
  distance: number;
  cueKind: PresentationCameraCueV1["kind"];
  cueActorIds: readonly string[];
  resolvedCueId: string;
  renderWidth: number;
  renderHeight: number;
  pixelRatio: number;
  sourceOwnerId: PresentationOwnerId;
}>;

export type CameraResolutionFailureCode = "CAMERA_CUE_INVALID" | "CAMERA_BOUNDS_PENDING" | "CAMERA_STATE_UNRESOLVED" | "CAMERA_EXECUTION_UNSUPPORTED" | "CAMERA_APPLICATION_FAILED";
export type CameraResolutionFailure = Readonly<{ ok: false; code: CameraResolutionFailureCode; reasons: readonly string[] }>;
export type CameraResolutionResult = Readonly<{ ok: true; state: CameraStateV1 } | CameraResolutionFailure>;

export type ExactFrameCameraRequest = Readonly<{
  ownerId: PresentationOwnerId;
  cameraCue: PresentationCameraCueV1;
  renderConfig: Readonly<{ width: number; height: number; pixelRatio: number }>;
  ownerBounds: CameraBoundsV1 | null;
  deterministicCameraBaseline?: DeterministicCameraBaselineV1;
}>;

export type CameraHostV1 = Readonly<{
  ownerId: PresentationOwnerId;
  setCameraState: (state: CameraStateV1) => void;
}>;

const fail = (code: CameraResolutionFailureCode, ...reasons: string[]): CameraResolutionFailure => ({ ok: false, code, reasons });
const finitePoint = (point: CameraPointV1) => point.length === 3 && point.every(Number.isFinite);
const finitePositive = (value: number) => Number.isFinite(value) && value > 0;

function normalize(point: CameraPointV1): CameraPointV1 {
  const length = Math.hypot(...point);
  return length > 0 ? [point[0] / length, point[1] / length, point[2] / length] : [0, 0, 1];
}

function add(a: CameraPointV1, b: CameraPointV1): CameraPointV1 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }

function cueId(cue: PresentationCameraCueV1): string {
  return `${cue.kind}:${cue.actorIds.join(",")}:${cue.transitionProgress.toFixed(6)}`;
}

function validateRequest(request: ExactFrameCameraRequest): CameraResolutionFailure | undefined {
  const { cameraCue: cue, renderConfig, deterministicCameraBaseline: baseline } = request;
  if (!Number.isInteger(renderConfig.width) || renderConfig.width <= 0 || !Number.isInteger(renderConfig.height) || renderConfig.height <= 0 || !finitePositive(renderConfig.pixelRatio)) return fail("CAMERA_CUE_INVALID", "render dimensions and pixel ratio must be finite and positive");
  if (!finitePositive(cue.transitionProgress) && cue.transitionProgress !== 0) return fail("CAMERA_CUE_INVALID", "camera transition progress must be finite and non-negative");
  if (cue.transitionProgress > 1) return fail("CAMERA_CUE_INVALID", "camera transition progress must be at most one");
  if (cue.actorIds.some((actorId) => typeof actorId !== "string" || actorId.length === 0)) return fail("CAMERA_CUE_INVALID", "camera cue actor IDs must be non-empty strings");
  if (!baseline) return undefined;
  if (!finitePoint(baseline.viewDirection) || !finitePoint(baseline.up) || !finitePoint(baseline.targetOffset ?? [0, 0, 0])) return fail("CAMERA_CUE_INVALID", "camera baseline vectors must be finite triples");
  if (![baseline.fov, baseline.near, baseline.far, baseline.minDistance, baseline.maxDistance].every(finitePositive) || baseline.maxDistance < baseline.minDistance) return fail("CAMERA_CUE_INVALID", "camera baseline projection and distance limits are invalid");
  return undefined;
}

/** Pure camera semantics. No prior camera pose, viewport, or scheduler is read. */
export function resolveExactFrameCamera(request: ExactFrameCameraRequest): CameraResolutionResult {
  const invalid = validateRequest(request);
  if (invalid) return invalid;
  const baseline = request.deterministicCameraBaseline;
  if (!baseline) return fail("CAMERA_STATE_UNRESOLVED", "exact-frame camera requires a registered deterministic baseline");
  if (baseline.ownerId !== request.ownerId) return fail("CAMERA_CUE_INVALID", "camera baseline owner does not match requested owner");
  const cue = request.cameraCue;
  if (cue.kind === "preserveCurrent" && !request.deterministicCameraBaseline) return fail("CAMERA_STATE_UNRESOLVED", "preserveCurrent has no deterministic baseline");
  if (!request.ownerBounds) return fail("CAMERA_BOUNDS_PENDING", `${cue.kind} camera framing requires complete owner bounds`);
  const bounds = request.ownerBounds;
  if (!finitePoint(bounds.center) || !finitePositive(bounds.radius)) return fail("CAMERA_CUE_INVALID", "owner bounds must contain a finite positive radius");
  const aspect = request.renderConfig.width / request.renderConfig.height;
  const direction = normalize(baseline.viewDirection);
  const target = add(bounds.center, baseline.targetOffset ?? [0, 0, 0]);
  const verticalExtent = bounds.halfExtent ? Math.max(bounds.halfExtent[1], bounds.radius * 0.36) : bounds.radius;
  const horizontalExtent = bounds.halfExtent ? Math.max(bounds.halfExtent[0], bounds.radius * 0.36) : bounds.radius;
  const tangent = Math.tan((baseline.fov * Math.PI) / 360);
  const distance = Math.min(baseline.maxDistance, Math.max(baseline.minDistance, verticalExtent / (0.62 * tangent), horizontalExtent / (Math.max(0.35, aspect) * 0.62 * tangent)));
  const state: CameraStateV1 = {
    schemaVersion: "1", ownerId: baseline.ownerId, cameraKind: baseline.cameraKind,
    position: [target[0] + direction[0] * distance, target[1] + direction[1] * distance, target[2] + direction[2] * distance],
    target, up: normalize(baseline.up), fov: baseline.fov, near: baseline.near, far: baseline.far, aspect, distance,
    cueKind: cue.kind, cueActorIds: [...cue.actorIds], resolvedCueId: cueId(cue), renderWidth: request.renderConfig.width, renderHeight: request.renderConfig.height, pixelRatio: request.renderConfig.pixelRatio, sourceOwnerId: baseline.ownerId,
  };
  return { ok: true, state };
}

export const deterministicCameraBaselines: Readonly<Record<PresentationOwnerId, DeterministicCameraBaselineV1>> = {
  DnaBasePairInteractionPresentation: { ownerId: "DnaBasePairInteractionPresentation", cameraKind: "perspective", viewDirection: [0.42, -0.3, 1], up: [0, 1, 0], fov: 29, near: 0.1, far: 200, minDistance: 3.2, maxDistance: 40 },
  DnaStrandSeparationPresentation: { ownerId: "DnaStrandSeparationPresentation", cameraKind: "perspective", viewDirection: [0.74, -0.76, 0.66], up: [0, 1, 0], fov: 29, near: 0.1, far: 200, minDistance: 5.5, maxDistance: 90 },
  RnaSecondaryStructurePresentation: { ownerId: "RnaSecondaryStructurePresentation", cameraKind: "perspective", viewDirection: [0, 0, 1], up: [0, 1, 0], fov: 42, near: 0.1, far: 200, minDistance: 3.8, maxDistance: 80 },
  RnaDegradationPresentation: { ownerId: "RnaDegradationPresentation", cameraKind: "perspective", viewDirection: [0, 0, 1], up: [0, 1, 0], fov: 45, near: 0.1, far: 200, minDistance: 3.8, maxDistance: 80 },
};

export function resolveOwnerCamera(ownerId: PresentationOwnerId, cameraCue: PresentationCameraCueV1, renderConfig: ExactFrameCameraRequest["renderConfig"], ownerBounds: CameraBoundsV1 | null): CameraResolutionResult {
  return resolveExactFrameCamera({ ownerId, cameraCue, renderConfig, ownerBounds, deterministicCameraBaseline: deterministicCameraBaselines[ownerId] });
}

/** Mol* currently exposes asynchronous reset/refit semantics, not an exact-frame pose contract. */
export function resolveMolstarExactFrameCamera(): CameraResolutionFailure {
  return fail("CAMERA_EXECUTION_UNSUPPORTED", "Mol* camera application is not yet an exact-frame deterministic contract");
}

/** Applies a complete pose and projection. It never reads or updates a prior pose. */
export function applyCameraState(state: CameraStateV1, host: CameraHostV1): CameraResolutionResult {
  if (host.ownerId !== state.ownerId) return fail("CAMERA_APPLICATION_FAILED", "camera host owner does not match resolved state");
  try { host.setCameraState(state); } catch (error) { return fail("CAMERA_APPLICATION_FAILED", error instanceof Error ? error.message : String(error)); }
  return { ok: true, state };
}

/** Concrete Three.js bridge; the input pose is already completely resolved. */
export function applyCameraStateToThreeCamera(camera: THREE.Camera, state: CameraStateV1): void {
  camera.position.set(...state.position);
  camera.up.set(...state.up);
  if (camera instanceof THREE.PerspectiveCamera) {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = state.fov;
    perspective.aspect = state.aspect;
    perspective.near = state.near;
    perspective.far = state.far;
    perspective.updateProjectionMatrix();
  }
  camera.lookAt(...state.target);
}

export function serializeCameraState(state: CameraStateV1): string { return JSON.stringify(state); }
