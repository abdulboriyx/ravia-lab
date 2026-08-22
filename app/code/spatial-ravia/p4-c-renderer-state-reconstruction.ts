/** P4-C: concrete owner application and explicit renderer readiness boundary. */

import type { AppliedRenderStateV1, ExactFrameFailure, ExactFrameOwnerTarget } from "./p4-b-exact-frame-runtime.ts";
import type { PresentationOwnerId } from "./p3-e-presentation-synchronization.ts";
import { applyCameraState, type CameraHostV1, type CameraResolutionResult, type CameraStateV1 } from "./p4-d-deterministic-camera-execution.ts";

export type RenderReadinessReason = "STATE_NOT_APPLIED" | "GEOMETRY_PENDING" | "LABELS_PENDING" | "ASSET_PENDING" | "FONT_PENDING" | "LAYOUT_PENDING" | "MOLSTAR_PENDING" | "CAMERA_PENDING" | "CAMERA_BOUNDS_PENDING" | "CAMERA_UNRESOLVED" | "CAMERA_FAILED" | "SUPERSEDED_REBUILD_PENDING" | "RENDER_STATE_INCOMPATIBLE" | "ASSET_LOAD_FAILURE" | "MOLSTAR_FAILURE";
export type RenderReadinessDimension = "stateApplied" | "geometryReady" | "labelsReady" | "assetsReady" | "layoutReady" | "molstarReady" | "cameraReady";
export type RenderReadinessV1 = Readonly<{
  schemaVersion: "1";
  applicationId: number;
  ownerId: PresentationOwnerId;
  status: "READY" | "NOT_READY" | "FAILED";
  stateApplied: boolean;
  geometryReady: boolean;
  labelsReady: boolean;
  assetsReady: boolean;
  layoutReady: boolean;
  molstarReady: boolean;
  cameraReady: boolean;
  supersededWorkPending: boolean;
  reasons: readonly RenderReadinessReason[];
}>;

export type RendererStateApplicationFailureCode = ExactFrameFailure["code"] | "RENDER_STATE_INCOMPATIBLE" | "RENDERER_STATE_APPLICATION_FAILED";
export type RendererStateApplicationFailure = Readonly<{ ok: false; code: RendererStateApplicationFailureCode; reasons: readonly string[] }>;
export type RendererStateApplicationResult = Readonly<{ ok: true; applicationId: number; state: AppliedRenderStateV1; readiness: RenderReadinessV1 } | RendererStateApplicationFailure>;

export type ExactFrameComponentReadiness = Readonly<{
  geometryReady?: boolean;
  labelsReady?: boolean;
  assetsReady?: boolean;
  layoutReady?: boolean;
  molstarReady?: boolean;
  cameraReady?: boolean;
  reasons?: readonly RenderReadinessReason[];
}>;
export type ExactFrameOwnerComponentContract = Readonly<{
  ownerId: PresentationOwnerId;
  setExactFrameState: (state: AppliedRenderStateV1) => void;
  getReadiness?: () => ExactFrameComponentReadiness;
}>;

export type ExactFrameRenderHostContract = Readonly<{
  ownerId: PresentationOwnerId;
  renderMode: "EXACT_FRAME";
  appliedState: AppliedRenderStateV1 | null;
  readiness: RenderReadinessV1;
  applicationId: number;
}>;

const failure = (code: RendererStateApplicationFailureCode, ...reasons: string[]): RendererStateApplicationFailure => ({ ok: false, code, reasons });

function readinessFor(state: AppliedRenderStateV1, applicationId: number, component: ExactFrameOwnerComponentContract): RenderReadinessV1 {
  const componentReadiness = component.getReadiness?.() ?? { geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: false };
  const reasons = [...(componentReadiness.reasons ?? [])];
  const values = {
    stateApplied: true,
    geometryReady: componentReadiness.geometryReady ?? true,
    labelsReady: componentReadiness.labelsReady ?? true,
    assetsReady: componentReadiness.assetsReady ?? true,
    layoutReady: componentReadiness.layoutReady ?? true,
    molstarReady: componentReadiness.molstarReady ?? true,
    cameraReady: componentReadiness.cameraReady ?? false,
  };
  if (!values.geometryReady) reasons.push("GEOMETRY_PENDING");
  if (!values.labelsReady) reasons.push("LABELS_PENDING");
  if (!values.assetsReady) reasons.push("ASSET_PENDING");
  if (!values.layoutReady) reasons.push("LAYOUT_PENDING");
  if (!values.molstarReady) reasons.push("MOLSTAR_PENDING");
  if (!values.cameraReady) reasons.push("CAMERA_PENDING");
  const uniqueReasons = [...new Set(reasons)];
  const blockingReasons = uniqueReasons.filter((reason) => reason !== "CAMERA_PENDING");
  return { schemaVersion: "1", applicationId, ownerId: state.ownerId, status: blockingReasons.length === 0 ? "READY" : "NOT_READY", ...values, supersededWorkPending: false, reasons: uniqueReasons };
}

/**
 * Runtime host for concrete React/R3F owner components. P3 is evaluated before
 * this boundary; components only receive a complete absolute state.
 */
export class ExactFrameRenderHost {
  private applicationCounter = 0;
  private readonly component: ExactFrameOwnerComponentContract;
  private current: ExactFrameRenderHostContract;

  constructor(component: ExactFrameOwnerComponentContract) {
    this.component = component;
    this.current = { ownerId: component.ownerId, renderMode: "EXACT_FRAME", appliedState: null, applicationId: 0, readiness: { schemaVersion: "1", applicationId: 0, ownerId: component.ownerId, status: "NOT_READY", stateApplied: false, geometryReady: false, labelsReady: false, assetsReady: false, layoutReady: false, molstarReady: false, cameraReady: false, supersededWorkPending: false, reasons: ["STATE_NOT_APPLIED"] } };
  }

  get snapshot(): ExactFrameRenderHostContract { return this.current; }

  apply(state: AppliedRenderStateV1): RendererStateApplicationResult {
    if (state.schemaVersion !== "1" || state.renderConfig.runtimeMode !== "EXACT_FRAME") return failure("RENDER_STATE_INCOMPATIBLE", "exact-frame state version or runtime mode is incompatible");
    if (state.ownerId !== this.component.ownerId || state.renderConfig.ownerId !== this.component.ownerId) return failure("OWNER_UNAVAILABLE", "applied state does not match the concrete owner component");
    const applicationId = ++this.applicationCounter;
    try {
      this.component.setExactFrameState(state);
    } catch (error) {
      return failure("RENDERER_STATE_APPLICATION_FAILED", error instanceof Error ? error.message : String(error));
    }
    const readiness = readinessFor(state, applicationId, this.component);
    this.current = { ownerId: this.component.ownerId, renderMode: "EXACT_FRAME", appliedState: state, applicationId, readiness };
    return { ok: true, applicationId, state, readiness };
  }

  /** Re-read real component signals after geometry/assets/layout work settles. */
  refreshReadiness(applicationId = this.current.applicationId): RenderReadinessV1 {
    if (applicationId !== this.current.applicationId || !this.current.appliedState) return { ...this.current.readiness, status: "NOT_READY", supersededWorkPending: true, reasons: ["SUPERSEDED_REBUILD_PENDING"] };
    const readiness = readinessFor(this.current.appliedState, applicationId, this.component);
    this.current = { ...this.current, readiness };
    return readiness;
  }

  /** A stale async completion cannot mark a newer frame ready. */
  acceptReadiness(applicationId: number, update: Partial<RenderReadinessV1>): RenderReadinessV1 {
    if (applicationId !== this.current.applicationId || !this.current.appliedState) return { ...this.current.readiness, status: "NOT_READY", supersededWorkPending: true, reasons: ["SUPERSEDED_REBUILD_PENDING"] };
    const next = { ...this.current.readiness, ...update, applicationId, ownerId: this.component.ownerId, schemaVersion: "1" as const };
    const reasons = [...(next.reasons ?? [])];
    if (!next.geometryReady && !reasons.includes("GEOMETRY_PENDING")) reasons.push("GEOMETRY_PENDING");
    if (!next.labelsReady && !reasons.includes("LABELS_PENDING")) reasons.push("LABELS_PENDING");
    if (!next.assetsReady && !reasons.includes("ASSET_PENDING")) reasons.push("ASSET_PENDING");
    if (!next.layoutReady && !reasons.includes("LAYOUT_PENDING")) reasons.push("LAYOUT_PENDING");
    if (!next.molstarReady && !reasons.includes("MOLSTAR_PENDING")) reasons.push("MOLSTAR_PENDING");
    if (!next.cameraReady && !reasons.includes("CAMERA_PENDING")) reasons.push("CAMERA_PENDING");
    const normalizedReasons = [...new Set(reasons)];
    const blockingReasons = normalizedReasons.filter((reason) => reason !== "CAMERA_PENDING");
    const normalized = { ...next, reasons: normalizedReasons, status: next.stateApplied && next.geometryReady && next.labelsReady && next.assetsReady && next.layoutReady && next.molstarReady && !next.supersededWorkPending && blockingReasons.length === 0 ? "READY" as const : "NOT_READY" as const };
    this.current = { ...this.current, readiness: normalized };
    return normalized;
  }

  /** Applies the already-resolved absolute camera pose for the current frame. */
  applyCamera(state: CameraStateV1, cameraHost: CameraHostV1, applicationId = this.current.applicationId): CameraResolutionResult {
    if (applicationId !== this.current.applicationId || !this.current.appliedState) {
      return { ok: false, code: "CAMERA_APPLICATION_FAILED", reasons: ["camera application belongs to a superseded frame"] };
    }
    const result = applyCameraState(state, cameraHost);
    if (result.ok) this.acceptReadiness(applicationId, { cameraReady: true, reasons: this.current.readiness.reasons.filter((reason) => reason !== "CAMERA_PENDING" && reason !== "CAMERA_UNRESOLVED" && reason !== "CAMERA_FAILED") });
    else this.acceptReadiness(applicationId, { cameraReady: false, reasons: [...this.current.readiness.reasons, result.code === "CAMERA_BOUNDS_PENDING" ? "CAMERA_BOUNDS_PENDING" : result.code === "CAMERA_STATE_UNRESOLVED" ? "CAMERA_UNRESOLVED" : "CAMERA_FAILED"] });
    return result;
  }
}

export function createExactFrameOwnerTarget(component: ExactFrameOwnerComponentContract): ExactFrameOwnerTarget { return { ownerId: component.ownerId, setExactFrameState: component.setExactFrameState }; }

export function serializeRenderReadiness(readiness: RenderReadinessV1): string { return JSON.stringify(readiness); }
