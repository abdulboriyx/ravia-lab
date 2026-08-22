/** P4-E: exact-frame canvas image capture behind one browser backend boundary. */

import type { ExactFrameRequestV1 } from "./p4-b-exact-frame-runtime.ts";
import type { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";

export type CaptureFormatV1 = "png" | "pngTransparent";
export type CaptureScopeV1 = "CANVAS_ONLY";

export type CaptureFrameRequestV1 = Readonly<{
  schemaVersion: "1";
  exactFrameRequest: ExactFrameRequestV1;
  applicationId: number;
  format: CaptureFormatV1;
  captureScope: CaptureScopeV1;
}>;

export type CapturedFrameMetadataV1 = Readonly<{
  schemaVersion: "1";
  format: CaptureFormatV1;
  mimeType: "image/png";
  width: number;
  height: number;
  pixelRatio: number;
  frameIndex?: number;
  timeSeconds: number;
  fps?: number;
  ownerId: string;
  backgroundMode: "opaque" | "transparent";
  captureScope: CaptureScopeV1;
  timelineId: string;
  sourceInteractionIds: readonly string[];
  sourceTopologyChangeIds: readonly string[];
  byteLength: number;
  checksum?: string;
}>;

export type CapturedFrameArtifactV1 = Readonly<{
  metadata: CapturedFrameMetadataV1;
  blob: Blob;
}>;

export type CaptureFailureCode = "CAPTURE_NOT_READY" | "CAPTURE_STALE_FRAME" | "CAPTURE_UNSUPPORTED_SCOPE" | "CAPTURE_UNSUPPORTED_FORMAT" | "CAPTURE_CANVAS_UNAVAILABLE" | "CAPTURE_ENCODING_FAILED" | "ENVIRONMENT_CAPABILITY_UNAVAILABLE" | "FRAGMENTATION_UNGROUNDED";
export type CaptureFailure = Readonly<{ ok: false; code: CaptureFailureCode; reasons: readonly string[] }>;
export type CaptureResult = Readonly<{ ok: true; artifact: CapturedFrameArtifactV1 } | CaptureFailure>;

export type CanvasCaptureTargetV1 = Readonly<{
  width: number;
  height: number;
  toBlob: (callback: (blob: Blob | null) => void, type?: string) => void;
}>;

export type CaptureBackendV1 = Readonly<{
  supports: (format: CaptureFormatV1, scope: CaptureScopeV1) => boolean;
  capturePng: (canvas: CanvasCaptureTargetV1) => Promise<Blob>;
}>;

const fail = (code: CaptureFailureCode, ...reasons: string[]): CaptureFailure => ({ ok: false, code, reasons });

function requestedTime(request: ExactFrameRequestV1): number | null {
  if (request.frameIndex !== undefined) {
    if (!Number.isInteger(request.frameIndex) || !Number.isInteger(request.fps) || request.frameIndex < 0 || !request.fps || request.fps <= 0) return null;
    return request.frameIndex / request.fps;
  }
  return typeof request.timeSeconds === "number" && Number.isFinite(request.timeSeconds) && request.timeSeconds >= 0 ? request.timeSeconds : null;
}

function expectedDimensions(request: ExactFrameRequestV1): { width: number; height: number } {
  return { width: Math.round(request.renderConfig.width * request.renderConfig.pixelRatio), height: Math.round(request.renderConfig.height * request.renderConfig.pixelRatio) };
}

export const browserCanvasCaptureBackend: CaptureBackendV1 = {
  supports: (format, scope) => scope === "CANVAS_ONLY" && (format === "png" || format === "pngTransparent"),
  capturePng: (canvas) => new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("canvas.toBlob returned no image blob")), "image/png")),
};

/**
 * Captures only the already-mounted canvas. DOM overlays are intentionally not
 * included; composite/browser screenshot capture remains a later boundary.
 */
export async function captureExactFrame(input: Readonly<{ host: ExactFrameRenderHost; request: CaptureFrameRequestV1; canvas: CanvasCaptureTargetV1; backend?: CaptureBackendV1 }>): Promise<CaptureResult> {
  const { host, request, canvas } = input;
  const backend = input.backend ?? browserCanvasCaptureBackend;
  if (request.schemaVersion !== "1") return fail("CAPTURE_UNSUPPORTED_FORMAT", "unsupported capture request version");
  if (!backend.supports(request.format, request.captureScope)) return fail(request.captureScope !== "CANVAS_ONLY" ? "CAPTURE_UNSUPPORTED_SCOPE" : "CAPTURE_UNSUPPORTED_FORMAT", "capture backend does not support the requested format and scope");
  const expectedTime = requestedTime(request.exactFrameRequest);
  if (expectedTime === null) return fail("CAPTURE_STALE_FRAME", "exact-frame request has no valid canonical time");
  const snapshot = host.snapshot;
  if (snapshot.applicationId !== request.applicationId || !snapshot.appliedState) return fail("CAPTURE_STALE_FRAME", "capture request does not identify the current applied frame");
  if (snapshot.appliedState.ownerId !== request.exactFrameRequest.migration.ownerId || snapshot.appliedState.renderConfig.ownerId !== request.exactFrameRequest.renderConfig.ownerId || snapshot.appliedState.timeSeconds !== expectedTime) return fail("CAPTURE_STALE_FRAME", "applied state does not match the requested exact frame");
  if (snapshot.readiness.status !== "READY" || !snapshot.readiness.stateApplied || !snapshot.readiness.geometryReady || !snapshot.readiness.labelsReady || !snapshot.readiness.assetsReady || !snapshot.readiness.layoutReady || !snapshot.readiness.molstarReady || !snapshot.readiness.cameraReady || snapshot.readiness.supersededWorkPending) return fail("CAPTURE_NOT_READY", `current frame is not capture-ready: ${snapshot.readiness.reasons.join(",")}`);
  if (request.format === "pngTransparent" && snapshot.appliedState.renderConfig.background.mode !== "transparent") return fail("CAPTURE_UNSUPPORTED_FORMAT", "transparent PNG requires transparent exact-frame background");
  if (request.format === "png" && snapshot.appliedState.renderConfig.background.mode !== "opaque") return fail("CAPTURE_UNSUPPORTED_FORMAT", "opaque PNG requires opaque exact-frame background");
  const dimensions = expectedDimensions(request.exactFrameRequest);
  if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) return fail("CAPTURE_CANVAS_UNAVAILABLE", `canvas dimensions ${canvas.width}x${canvas.height} do not match requested ${dimensions.width}x${dimensions.height}`);
  let blob: Blob;
  try { blob = await backend.capturePng(canvas); } catch (error) { return fail("CAPTURE_ENCODING_FAILED", error instanceof Error ? error.message : String(error)); }
  if (!blob || blob.size <= 0) return fail("CAPTURE_ENCODING_FAILED", "capture produced an empty image artifact");
  const applied = snapshot.appliedState;
  const metadata: CapturedFrameMetadataV1 = { schemaVersion: "1", format: request.format, mimeType: "image/png", width: dimensions.width, height: dimensions.height, pixelRatio: request.exactFrameRequest.renderConfig.pixelRatio, ...(request.exactFrameRequest.frameIndex !== undefined ? { frameIndex: request.exactFrameRequest.frameIndex } : {}), timeSeconds: expectedTime, ...(request.exactFrameRequest.fps !== undefined ? { fps: request.exactFrameRequest.fps } : {}), ownerId: applied.ownerId, backgroundMode: applied.renderConfig.background.mode, captureScope: request.captureScope, timelineId: applied.trace.timelineId, sourceInteractionIds: applied.trace.sourceInteractionIds, sourceTopologyChangeIds: applied.trace.sourceTopologyChangeIds, byteLength: blob.size };
  return { ok: true, artifact: { metadata, blob } };
}

export function serializeCaptureMetadata(metadata: CapturedFrameMetadataV1): string { return JSON.stringify(metadata); }

export function releaseCaptureObjectUrl(url: string): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
}
