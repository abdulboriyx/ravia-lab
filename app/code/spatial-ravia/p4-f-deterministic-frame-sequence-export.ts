/** P4-F: deterministic exact-frame sequence execution and encoder boundary. */

import type { ExactFrameRequestV1 } from "./p4-b-exact-frame-runtime.ts";
import type { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";
import { captureExactFrame, type CaptureBackendV1, type CapturedFrameArtifactV1, type CaptureFrameRequestV1, type CanvasCaptureTargetV1, type CapturedFrameMetadataV1 } from "./p4-e-deterministic-image-capture.ts";

export type VideoExportFormatV1 = "pngSequence" | "mp4" | "webm";
export type VideoExportRequestV1 = Readonly<{
  schemaVersion: "1";
  baseExactFrameRequest: Omit<ExactFrameRequestV1, "frameIndex" | "timeSeconds" | "fps">;
  firstFrame: number;
  lastFrame: number;
  fps: number;
  format: VideoExportFormatV1;
  captureScope: "CANVAS_ONLY";
}>;

export type ExactFrameSequencePlanV1 = Readonly<{
  schemaVersion: "1";
  fps: number;
  firstFrame: number;
  lastFrame: number;
  frameCount: number;
  durationSeconds: number;
  frameTimes: readonly number[];
  width: number;
  height: number;
  pixelRatio: number;
  ownerId: string;
  format: VideoExportFormatV1;
  captureScope: "CANVAS_ONLY";
}>;

export type FrameSequenceFailureCode = "VIDEO_EXPORT_INVALID_REQUEST" | "FRAME_SEQUENCE_INVALID" | "FRAME_RENDER_FAILED" | "FRAME_CAPTURE_FAILED" | "FRAME_NOT_READY" | "STALE_FRAME_CAPTURE" | "ENCODER_UNAVAILABLE" | "ENCODING_FAILED" | "UNSUPPORTED_VIDEO_FORMAT" | "ENVIRONMENT_CAPABILITY_UNAVAILABLE" | "EXPORT_CANCELLED" | "FRAGMENTATION_UNGROUNDED" | "CAMERA_EXECUTION_UNSUPPORTED";
export type FrameSequenceFailure = Readonly<{ ok: false; code: FrameSequenceFailureCode; frameIndex?: number; reasons: readonly string[] }>;

export type CapturedFrameSequenceV1 = Readonly<{
  schemaVersion: "1";
  format: "pngSequence";
  firstFrame: number;
  lastFrame: number;
  frameCount: number;
  fps: number;
  durationSeconds: number;
  width: number;
  height: number;
  pixelRatio: number;
  ownerId: string;
  captureScope: "CANVAS_ONLY";
  frames: readonly CapturedFrameMetadataV1[];
  artifacts?: readonly CapturedFrameArtifactV1[];
}>;

export type EncodedVideoArtifactV1 = Readonly<{ format: "mp4" | "webm"; bytes: Uint8Array; frameCount: number; fps: number; width: number; height: number }>;
export type VideoEncoderBackendV1 = Readonly<{
  supports: (format: "mp4" | "webm") => boolean;
  encode: (sequence: CapturedFrameSequenceV1) => Promise<EncodedVideoArtifactV1>;
}>;

export type FramePreparationResult = Readonly<{ ok: true; host: ExactFrameRenderHost; canvas: CanvasCaptureTargetV1; applicationId: number } | FrameSequenceFailure>;
export type FrameSequenceRuntimeV1 = Readonly<{
  prepareFrame: (request: ExactFrameRequestV1) => Promise<FramePreparationResult> | FramePreparationResult;
  captureBackend?: CaptureBackendV1;
  onFrame?: (artifact: CapturedFrameArtifactV1, frameIndex: number) => Promise<void> | void;
  checksum?: (artifact: CapturedFrameArtifactV1) => Promise<string> | string;
}>;
export type FrameSequenceProgressV1 = Readonly<{ completedFrames: number; totalFrames: number; currentFrameIndex: number }>;

export type FrameSequenceExecutionResult = Readonly<{ ok: true; plan: ExactFrameSequencePlanV1; sequence: CapturedFrameSequenceV1 } | FrameSequenceFailure>;

const fail = (code: FrameSequenceFailureCode, reasons: readonly string[], frameIndex?: number): FrameSequenceFailure => ({ ok: false, code, ...(frameIndex === undefined ? {} : { frameIndex }), reasons });

export function normalizeExactFrameSequencePlan(request: VideoExportRequestV1): { ok: true; plan: ExactFrameSequencePlanV1 } | FrameSequenceFailure {
  if (request.schemaVersion !== "1") return fail("VIDEO_EXPORT_INVALID_REQUEST", ["unsupported video export request version"]);
  if (!Number.isInteger(request.firstFrame) || !Number.isInteger(request.lastFrame) || request.firstFrame < 0 || request.lastFrame < request.firstFrame) return fail("FRAME_SEQUENCE_INVALID", ["frame range must be non-negative integers with lastFrame >= firstFrame"]);
  if (!Number.isInteger(request.fps) || request.fps <= 0 || request.fps > 240) return fail("VIDEO_EXPORT_INVALID_REQUEST", ["fps must be an integer from 1 to 240"]);
  if (request.format !== "pngSequence" && request.format !== "mp4" && request.format !== "webm") return fail("UNSUPPORTED_VIDEO_FORMAT", ["requested video format is not registered"]);
  if (request.captureScope !== "CANVAS_ONLY") return fail("UNSUPPORTED_VIDEO_FORMAT", ["only CANVAS_ONLY capture is registered"]);
  const config = request.baseExactFrameRequest.renderConfig;
  if (config.schemaVersion !== "1" || !Number.isInteger(config.width) || !Number.isInteger(config.height) || config.width <= 0 || config.height <= 0 || !Number.isFinite(config.pixelRatio) || config.pixelRatio <= 0) return fail("VIDEO_EXPORT_INVALID_REQUEST", ["base exact-frame render configuration is invalid"]);
  const frameCount = request.lastFrame - request.firstFrame + 1;
  if (!Number.isSafeInteger(frameCount)) return fail("FRAME_SEQUENCE_INVALID", ["frame range is too large"]);
  const frameTimes = Array.from({ length: frameCount }, (_, index) => (request.firstFrame + index) / request.fps);
  return { ok: true, plan: { schemaVersion: "1", fps: request.fps, firstFrame: request.firstFrame, lastFrame: request.lastFrame, frameCount, durationSeconds: frameCount / request.fps, frameTimes, width: config.width, height: config.height, pixelRatio: config.pixelRatio, ownerId: config.ownerId, format: request.format, captureScope: request.captureScope } };
}

export function frameRequestForPlan(request: VideoExportRequestV1, frameIndex: number): ExactFrameRequestV1 {
  return { ...request.baseExactFrameRequest, frameIndex, fps: request.fps };
}

function mapCaptureFailure(code: string, reasons: readonly string[], frameIndex: number): FrameSequenceFailure {
  if (code === "CAPTURE_NOT_READY") return fail("FRAME_NOT_READY", reasons, frameIndex);
  if (code === "CAPTURE_STALE_FRAME") return fail("STALE_FRAME_CAPTURE", reasons, frameIndex);
  if (code === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", reasons, frameIndex);
  if (code === "CAMERA_EXECUTION_UNSUPPORTED") return fail("CAMERA_EXECUTION_UNSUPPORTED", reasons, frameIndex);
  return fail("FRAME_CAPTURE_FAILED", reasons, frameIndex);
}

export async function executeDeterministicFrameSequence(request: VideoExportRequestV1, runtime: FrameSequenceRuntimeV1, options: Readonly<{ retainArtifacts?: boolean; signal?: { readonly aborted: boolean }; executionOrder?: readonly number[]; onProgress?: (progress: FrameSequenceProgressV1) => void }> = {}): Promise<FrameSequenceExecutionResult> {
  const normalized = normalizeExactFrameSequencePlan(request);
  if (!normalized.ok) return normalized;
  const { plan } = normalized;
  if (plan.format !== "pngSequence") return fail("ENCODER_UNAVAILABLE", [`no deterministic ${plan.format} encoder is available; PNG sequence planning remains supported`]);
  const executionOrder = options.executionOrder ? [...options.executionOrder] : Array.from({ length: plan.frameCount }, (_, index) => plan.firstFrame + index);
  if (executionOrder.length !== plan.frameCount || new Set(executionOrder).size !== plan.frameCount || executionOrder.some((frameIndex) => frameIndex < plan.firstFrame || frameIndex > plan.lastFrame)) return fail("FRAME_SEQUENCE_INVALID", ["executionOrder must contain every frame exactly once"]);
  const metadataByFrame = new Map<number, CapturedFrameMetadataV1>();
  const artifactsByFrame = new Map<number, CapturedFrameArtifactV1>();
  for (const frameIndex of executionOrder) {
    if (options.signal?.aborted) return fail("EXPORT_CANCELLED", ["frame sequence export was cancelled"], frameIndex);
    const exactRequest = frameRequestForPlan(request, frameIndex);
    let prepared: FramePreparationResult;
    try { prepared = await runtime.prepareFrame(exactRequest); } catch (error) { return fail("FRAME_RENDER_FAILED", [error instanceof Error ? error.message : String(error)], frameIndex); }
    if (!prepared.ok) return prepared.frameIndex === undefined ? { ...prepared, frameIndex } : prepared;
    const captureRequest: CaptureFrameRequestV1 = { schemaVersion: "1", exactFrameRequest: exactRequest, applicationId: prepared.applicationId, format: "png", captureScope: plan.captureScope };
    const captured = await captureExactFrame({ host: prepared.host, request: captureRequest, canvas: prepared.canvas, backend: runtime.captureBackend });
    if (!captured.ok) return mapCaptureFailure(captured.code, captured.reasons, frameIndex);
    let frameMetadata = captured.artifact.metadata;
    if (runtime.checksum) {
      const checksum = await runtime.checksum(captured.artifact);
      if (checksum) frameMetadata = { ...frameMetadata, checksum };
    }
    metadataByFrame.set(frameIndex, frameMetadata);
    if (options.retainArtifacts) artifactsByFrame.set(frameIndex, captured.artifact);
    if (runtime.onFrame) await runtime.onFrame(captured.artifact, frameIndex);
    options.onProgress?.({ completedFrames: metadataByFrame.size, totalFrames: plan.frameCount, currentFrameIndex: frameIndex });
  }
  const orderedFrames = executionOrder.map((frameIndex) => frameIndex).sort((a, b) => a - b);
  const sequence: CapturedFrameSequenceV1 = { schemaVersion: "1", format: "pngSequence", firstFrame: plan.firstFrame, lastFrame: plan.lastFrame, frameCount: plan.frameCount, fps: plan.fps, durationSeconds: plan.durationSeconds, width: plan.width * plan.pixelRatio, height: plan.height * plan.pixelRatio, pixelRatio: plan.pixelRatio, ownerId: plan.ownerId, captureScope: plan.captureScope, frames: orderedFrames.map((frameIndex) => metadataByFrame.get(frameIndex)!), ...(options.retainArtifacts ? { artifacts: orderedFrames.map((frameIndex) => artifactsByFrame.get(frameIndex)!) } : {}) };
  return { ok: true, plan, sequence };
}

export const unavailableVideoEncoder: VideoEncoderBackendV1 = { supports: () => false, encode: async (sequence) => { throw new Error(`no video encoder available for ${sequence.format}`); } };

export function serializeFrameSequence(sequence: CapturedFrameSequenceV1): string { return JSON.stringify({ ...sequence, artifacts: undefined }); }
