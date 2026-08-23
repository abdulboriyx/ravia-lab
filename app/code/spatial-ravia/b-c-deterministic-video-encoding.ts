/** B-C: deterministic video packaging over P4 exact-frame PNG artifacts. */

import { spawn } from "node:child_process";
import { once } from "node:events";
import type { CompositeFrameArtifactV1 } from "./composite-teaching-frame.ts";
import { executeDeterministicFrameSequence, normalizeExactFrameSequencePlan, type FrameSequenceRuntimeV1, type VideoExportRequestV1 } from "./p4-f-deterministic-frame-sequence-export.ts";
import type { CapturedFrameArtifactV1 } from "./p4-e-deterministic-image-capture.ts";

export type VideoContainerV1 = "mp4" | "webm";
export type VideoFailureCodeV1 = "ENCODER_UNAVAILABLE" | "ENCODER_START_FAILED" | "ENCODER_FRAME_REJECTED" | "ENCODER_FAILED" | "ENCODER_CANCELLED" | "VIDEO_FORMAT_UNSUPPORTED" | "VIDEO_ALPHA_UNSUPPORTED" | "VIDEO_FRAME_SEQUENCE_INVALID" | "VIDEO_ARTIFACT_INVALID" | "FRAME_RENDER_FAILED" | "FRAME_CAPTURE_FAILED" | "FRAME_NOT_READY" | "STALE_FRAME_CAPTURE" | "FRAGMENTATION_UNGROUNDED" | "CAMERA_EXECUTION_UNSUPPORTED" | "EXPORT_CANCELLED";
export type VideoFailureV1 = Readonly<{ ok: false; code: VideoFailureCodeV1; frameIndex?: number; reasons: readonly string[] }>;

export type VideoExportRequestV2 = Readonly<Omit<VideoExportRequestV1, "schemaVersion"> & {
  schemaVersion: "2";
  sourceSurface: "SCENE_CANVAS" | "SCENE_WITH_TEACHING_OVERLAY";
  teaching?: Readonly<{ teachingPlanId: string; snapshotId: string; textBundleId: string; audience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; requestMode: "show" | "explain" | "compare" | "why" | "misconceptionCorrection" }>;
}>;

export type VideoEncodingContextV1 = Readonly<{
  format: VideoContainerV1;
  firstFrame: number;
  lastFrame: number;
  frameCount: number;
  fps: number;
  durationSeconds: number;
  width: number;
  height: number;
  sourceSurface: "SCENE_CANVAS" | "SCENE_WITH_TEACHING_OVERLAY";
  ownerId: string;
  timelineId?: string;
  teaching?: VideoExportRequestV2["teaching"];
  transparent: boolean;
}>;

export type VideoFrameInputV1 = Readonly<{
  frameIndex: number;
  timeSeconds: number;
  width: number;
  height: number;
  mimeType: "image/png";
  blob: Blob;
  ownerId: string;
  timelineId: string;
  sourceSurface: VideoEncodingContextV1["sourceSurface"];
  teachingTrace?: VideoExportRequestV2["teaching"];
}>;

export type VideoArtifactMetadataV1 = Readonly<{
  schemaVersion: "1";
  format: VideoContainerV1;
  mimeType: "video/mp4" | "video/webm";
  width: number;
  height: number;
  fps: number;
  firstFrame: number;
  lastFrame: number;
  frameCount: number;
  durationSeconds: number;
  sourceSurface: VideoEncodingContextV1["sourceSurface"];
  ownerId: string;
  timelineId?: string;
  teaching?: VideoExportRequestV2["teaching"];
  encoderBackend: string;
  encoderVersion: string;
  byteLength: number;
  checksum?: string;
  status: "COMPLETE";
}>;
export type VideoArtifactV1 = Readonly<{ metadata: VideoArtifactMetadataV1; bytes: Uint8Array }>;

export type VideoEncoderSessionV1 = Readonly<{
  push: (frame: VideoFrameInputV1) => Promise<void>;
  finish: () => Promise<Uint8Array>;
  cancel: () => Promise<void>;
}>;
export type VideoEncoderBackendV1 = Readonly<{
  backendId: string;
  backendVersion: string;
  available: boolean;
  supports: (format: VideoContainerV1) => boolean;
  supportsAlpha: (format: VideoContainerV1) => boolean;
  start: (context: VideoEncodingContextV1) => Promise<VideoEncoderSessionV1>;
}>;

export type VideoProgressV1 = Readonly<{ phase: "CAPTURING" | "ENCODING" | "FINALIZING" | "COMPLETE"; plannedFrames: number; capturedFrames: number; encodedFrames: number; currentFrameIndex?: number }>;
export type VideoEncodingResultV1 = Readonly<{ ok: true; artifact: VideoArtifactV1; progress: VideoProgressV1 } | VideoFailureV1>;
export type VideoCancellationV1 = Readonly<{ aborted: boolean }>;

const fail = (code: VideoFailureCodeV1, reasons: readonly string[], frameIndex?: number): VideoFailureV1 => ({ ok: false, code, ...(frameIndex === undefined ? {} : { frameIndex }), reasons });
const mimeFor = (format: VideoContainerV1): VideoArtifactMetadataV1["mimeType"] => format === "mp4" ? "video/mp4" : "video/webm";
const isFinitePositive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
class VideoInputFailure extends Error {
  readonly failure: VideoFailureV1;
  constructor(failure: VideoFailureV1) { super(failure.reasons.join("; ")); this.failure = failure; }
}

class BoundedAsyncQueue<T> implements AsyncIterable<T> {
  private readonly values: T[] = [];
  private readonly consumers: Array<{ resolve: (result: IteratorResult<T>) => void; reject: (error: unknown) => void }> = [];
  private readonly producers: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];
  private closed = false;
  private failure: unknown;
  private readonly capacity: number;
  constructor(capacity = 1) { this.capacity = capacity; }
  async push(value: T): Promise<void> {
    if (this.failure) throw this.failure;
    if (this.closed) throw new Error("frame queue is closed");
    while (this.values.length >= this.capacity && !this.failure && !this.closed) await new Promise<void>((resolve, reject) => { this.producers.push({ resolve, reject }); });
    if (this.failure) throw this.failure;
    if (this.closed) throw new Error("frame queue is closed");
    const waiter = this.consumers.shift();
    if (waiter) waiter.resolve({ done: false, value }); else this.values.push(value);
  }
  close(): void {
    this.closed = true;
    while (this.consumers.length) this.consumers.shift()!.resolve({ done: true, value: undefined as never });
    while (this.producers.length) this.producers.shift()!.resolve();
  }
  fail(error: unknown): void {
    this.failure = error;
    while (this.consumers.length) this.consumers.shift()!.reject(error);
    while (this.producers.length) this.producers.shift()!.reject(error);
  }
  async next(): Promise<IteratorResult<T>> {
    if (this.failure) throw this.failure;
    const value = this.values.shift();
    if (value !== undefined) return { done: false, value };
    if (this.closed) return { done: true, value: undefined as never };
    const producer = this.producers.shift();
    if (producer) producer.resolve();
    return new Promise<IteratorResult<T>>((resolve, reject) => this.consumers.push({ resolve, reject }));
  }
  [Symbol.asyncIterator](): AsyncIterator<T> { return this; }
}

function contextFromRequest(request: VideoExportRequestV1 | VideoExportRequestV2, format: VideoContainerV1): VideoEncodingContextV1 | VideoFailureV1 {
  const normalized = normalizeExactFrameSequencePlan({ ...request, schemaVersion: "1", format: "pngSequence" } as VideoExportRequestV1);
  if (!normalized.ok) return fail("VIDEO_FRAME_SEQUENCE_INVALID", normalized.reasons);
  const plan = normalized.plan;
  if (request.baseExactFrameRequest.renderConfig.background.mode === "transparent") return fail("VIDEO_ALPHA_UNSUPPORTED", ["the selected video contract does not silently flatten transparent exact frames"]);
  const v2 = request.schemaVersion === "2" ? request : undefined;
  if (v2?.sourceSurface === "SCENE_WITH_TEACHING_OVERLAY" && !v2.teaching) return fail("VIDEO_FRAME_SEQUENCE_INVALID", ["teaching-overlay video requires teaching identity metadata"]);
  return { format, firstFrame: plan.firstFrame, lastFrame: plan.lastFrame, frameCount: plan.frameCount, fps: plan.fps, durationSeconds: plan.durationSeconds, width: plan.width * plan.pixelRatio, height: plan.height * plan.pixelRatio, sourceSurface: v2?.sourceSurface ?? "SCENE_CANVAS", ownerId: plan.ownerId, timelineId: request.baseExactFrameRequest.migration.timeline.timelineId, teaching: v2?.teaching, transparent: false };
}

function frameFromCaptured(artifact: CapturedFrameArtifactV1, context: VideoEncodingContextV1): VideoFrameInputV1 | VideoFailureV1 {
  const metadata = artifact.metadata;
  if (metadata.frameIndex === undefined) return fail("VIDEO_FRAME_SEQUENCE_INVALID", ["captured video frame is missing frameIndex"]);
  return { frameIndex: metadata.frameIndex, timeSeconds: metadata.timeSeconds, width: metadata.width, height: metadata.height, mimeType: metadata.mimeType, blob: artifact.blob, ownerId: metadata.ownerId, timelineId: metadata.timelineId, sourceSurface: context.sourceSurface, ...(context.teaching ? { teachingTrace: context.teaching } : {}) };
}

function frameFromComposite(artifact: CompositeFrameArtifactV1, context: VideoEncodingContextV1): VideoFrameInputV1 | VideoFailureV1 {
  const metadata = artifact.metadata;
  if (metadata.frameIndex === undefined) return fail("VIDEO_FRAME_SEQUENCE_INVALID", ["composite video frame is missing frameIndex"]);
  return { frameIndex: metadata.frameIndex, timeSeconds: metadata.timeSeconds, width: metadata.width, height: metadata.height, mimeType: metadata.mimeType, blob: artifact.blob, ownerId: metadata.ownerId, timelineId: metadata.timelineId, sourceSurface: "SCENE_WITH_TEACHING_OVERLAY", teachingTrace: context.teaching };
}

async function encodeFrameStream(source: AsyncIterable<VideoFrameInputV1>, context: VideoEncodingContextV1, backend: VideoEncoderBackendV1, options: Readonly<{ signal?: VideoCancellationV1; checksum?: (bytes: Uint8Array) => Promise<string> | string; onProgress?: (progress: VideoProgressV1) => void }>): Promise<VideoEncodingResultV1> {
  if (!backend.available) return fail("ENCODER_UNAVAILABLE", [`${backend.backendId} is not available in this runtime`]);
  if (!backend.supports(context.format)) return fail("VIDEO_FORMAT_UNSUPPORTED", [`${backend.backendId} does not support ${context.format}`]);
  if (context.transparent && !backend.supportsAlpha(context.format)) return fail("VIDEO_ALPHA_UNSUPPORTED", [`${backend.backendId} does not support alpha for ${context.format}`]);
  let session: VideoEncoderSessionV1;
  try { session = await backend.start(context); } catch (error) { return fail("ENCODER_START_FAILED", [error instanceof Error ? error.message : String(error)]); }
  let expected = context.firstFrame;
  let capturedFrames = 0;
  const emit = (phase: VideoProgressV1["phase"], currentFrameIndex?: number) => options.onProgress?.({ phase, plannedFrames: context.frameCount, capturedFrames, encodedFrames: capturedFrames, ...(currentFrameIndex === undefined ? {} : { currentFrameIndex }) });
  try {
    for await (const frame of source) {
      if (options.signal?.aborted) { await session.cancel(); return fail("ENCODER_CANCELLED", ["video export was cancelled"], frame.frameIndex); }
      if (frame.frameIndex !== expected) { await session.cancel(); return fail("VIDEO_FRAME_SEQUENCE_INVALID", [`expected frame ${expected} but received ${frame.frameIndex}`], frame.frameIndex); }
      if (frame.timeSeconds !== frame.frameIndex / context.fps || frame.width !== context.width || frame.height !== context.height || frame.mimeType !== "image/png" || !isFinitePositive(frame.blob.size)) { await session.cancel(); return fail("ENCODER_FRAME_REJECTED", ["frame identity, timestamp, dimensions, format, or bytes are invalid"], frame.frameIndex); }
      if (frame.ownerId !== context.ownerId || (context.timelineId !== undefined && frame.timelineId !== context.timelineId)) { await session.cancel(); return fail("ENCODER_FRAME_REJECTED", ["frame source identity does not match the sequence"], frame.frameIndex); }
      emit("CAPTURING", frame.frameIndex);
      await session.push(frame);
      capturedFrames += 1;
      expected += 1;
      emit("ENCODING", frame.frameIndex);
    }
    if (capturedFrames !== context.frameCount || expected !== context.lastFrame + 1) { await session.cancel(); return fail("VIDEO_FRAME_SEQUENCE_INVALID", [`expected ${context.frameCount} frames but received ${capturedFrames}`]); }
    emit("FINALIZING");
    const bytes = await session.finish();
    if (bytes.byteLength === 0) return fail("VIDEO_ARTIFACT_INVALID", ["encoder returned an empty artifact"]);
    const checksum = options.checksum ? await options.checksum(bytes) : undefined;
    const metadata: VideoArtifactMetadataV1 = { schemaVersion: "1", format: context.format, mimeType: mimeFor(context.format), width: context.width, height: context.height, fps: context.fps, firstFrame: context.firstFrame, lastFrame: context.lastFrame, frameCount: context.frameCount, durationSeconds: context.durationSeconds, sourceSurface: context.sourceSurface, ownerId: context.ownerId, ...(context.timelineId ? { timelineId: context.timelineId } : {}), ...(context.teaching ? { teaching: context.teaching } : {}), encoderBackend: backend.backendId, encoderVersion: backend.backendVersion, byteLength: bytes.byteLength, ...(checksum ? { checksum } : {}), status: "COMPLETE" };
    const progress: VideoProgressV1 = { phase: "COMPLETE", plannedFrames: context.frameCount, capturedFrames, encodedFrames: capturedFrames };
    return { ok: true, artifact: { metadata, bytes }, progress };
  } catch (error) {
    await session.cancel().catch(() => undefined);
    if (error instanceof VideoInputFailure) return error.failure;
    if (options.signal?.aborted) return fail("ENCODER_CANCELLED", ["video export was cancelled"]);
    return fail("ENCODER_FAILED", [error instanceof Error ? error.message : String(error)]);
  }
}

export async function encodeCapturedFrameStream(source: AsyncIterable<CapturedFrameArtifactV1>, request: VideoExportRequestV1 | VideoExportRequestV2, backend: VideoEncoderBackendV1, options: Readonly<{ signal?: VideoCancellationV1; checksum?: (bytes: Uint8Array) => Promise<string> | string; onProgress?: (progress: VideoProgressV1) => void }> = {}): Promise<VideoEncodingResultV1> {
  if (request.format !== "mp4" && request.format !== "webm") return fail("VIDEO_FORMAT_UNSUPPORTED", ["a video container is required"]);
  const context = contextFromRequest(request, request.format);
  if ("ok" in context) return context;
  return encodeFrameStream((async function* () { for await (const artifact of source) { const frame = frameFromCaptured(artifact, context); if ("ok" in frame) throw new VideoInputFailure(frame); yield frame; } })(), context, backend, options);
}

export async function encodeCompositeFrameSequence(artifacts: readonly CompositeFrameArtifactV1[], request: VideoExportRequestV2, backend: VideoEncoderBackendV1, options: Readonly<{ signal?: VideoCancellationV1; checksum?: (bytes: Uint8Array) => Promise<string> | string; onProgress?: (progress: VideoProgressV1) => void }> = {}): Promise<VideoEncodingResultV1> {
  if (request.format !== "mp4" && request.format !== "webm") return fail("VIDEO_FORMAT_UNSUPPORTED", ["a video container is required"]);
  const context = contextFromRequest(request, request.format);
  if ("ok" in context) return context;
  const ordered = [...artifacts].sort((left, right) => (left.metadata.frameIndex ?? Number.MAX_SAFE_INTEGER) - (right.metadata.frameIndex ?? Number.MAX_SAFE_INTEGER));
  return encodeFrameStream((async function* () { for (const artifact of ordered) { const frame = frameFromComposite(artifact, context); if ("ok" in frame) throw new VideoInputFailure(frame); yield frame; } })(), context, backend, options);
}

export async function executeDeterministicVideoExport(request: VideoExportRequestV1, runtime: FrameSequenceRuntimeV1, backend: VideoEncoderBackendV1, options: Readonly<{ signal?: VideoCancellationV1; checksum?: (bytes: Uint8Array) => Promise<string> | string; onProgress?: (progress: VideoProgressV1) => void }> = {}): Promise<VideoEncodingResultV1> {
  if (request.format !== "mp4" && request.format !== "webm") return fail("VIDEO_FORMAT_UNSUPPORTED", ["a video container is required"]);
  const context = contextFromRequest(request, request.format);
  if ("ok" in context) return context;
  if (!backend.available) return fail("ENCODER_UNAVAILABLE", [`${backend.backendId} is not available in this runtime`]);
  const queue = new BoundedAsyncQueue<CapturedFrameArtifactV1>(1);
  const encoding = encodeCapturedFrameStream(queue, request, backend, options).then((result) => { if (!result.ok) queue.fail(new VideoInputFailure(result)); return result; });
  const captureRequest: VideoExportRequestV1 = { ...request, schemaVersion: "1", format: "pngSequence" };
  let captured;
  try {
    captured = await executeDeterministicFrameSequence(captureRequest, { ...runtime, onFrame: async (artifact, frameIndex) => { await queue.push(artifact); await runtime.onFrame?.(artifact, frameIndex); } }, { signal: options.signal, onProgress: () => undefined });
  } catch (error) {
    queue.fail(error);
    const encoded = await encoding;
    return encoded.ok ? fail("FRAME_CAPTURE_FAILED", [error instanceof Error ? error.message : String(error)]) : encoded;
  }
  if (!captured.ok) queue.fail(new VideoInputFailure(fail(captured.code === "EXPORT_CANCELLED" ? "EXPORT_CANCELLED" : captured.code === "FRAME_NOT_READY" ? "FRAME_NOT_READY" : captured.code === "STALE_FRAME_CAPTURE" ? "STALE_FRAME_CAPTURE" : captured.code === "FRAGMENTATION_UNGROUNDED" ? "FRAGMENTATION_UNGROUNDED" : captured.code === "CAMERA_EXECUTION_UNSUPPORTED" ? "CAMERA_EXECUTION_UNSUPPORTED" : "FRAME_CAPTURE_FAILED", captured.reasons, captured.frameIndex)));
  else queue.close();
  const result = await encoding;
  if (!captured.ok) return fail(captured.code === "EXPORT_CANCELLED" ? "EXPORT_CANCELLED" : captured.code === "FRAME_NOT_READY" ? "FRAME_NOT_READY" : captured.code === "STALE_FRAME_CAPTURE" ? "STALE_FRAME_CAPTURE" : captured.code === "FRAGMENTATION_UNGROUNDED" ? "FRAGMENTATION_UNGROUNDED" : captured.code === "CAMERA_EXECUTION_UNSUPPORTED" ? "CAMERA_EXECUTION_UNSUPPORTED" : "FRAME_CAPTURE_FAILED", captured.reasons, captured.frameIndex);
  return result;
}

function referenceBytes(context: VideoEncodingContextV1, frames: number[]): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ reference: true, format: context.format, fps: context.fps, width: context.width, height: context.height, firstFrame: context.firstFrame, lastFrame: context.lastFrame, frames }));
}

/** Test/reference seam only. It is not a playable MP4/WebM encoder. */
export const referenceVideoEncoderBackend: VideoEncoderBackendV1 = {
  backendId: "reference-test-encoder",
  backendVersion: "1",
  available: true,
  supports: () => true,
  supportsAlpha: () => false,
  start: async (context) => {
    const frames: number[] = [];
    return { push: async (frame) => { frames.push(frame.frameIndex); }, finish: async () => referenceBytes(context, frames), cancel: async () => { frames.length = 0; } };
  },
};

export const unavailableVideoEncoderBackend: VideoEncoderBackendV1 = { backendId: "ffmpeg-unavailable", backendVersion: "unknown", available: false, supports: () => false, supportsAlpha: () => false, start: async () => { throw new Error("encoder unavailable"); } };

type FfmpegOptionsV1 = Readonly<{ executable?: string; available?: boolean; maxOutputBytes?: number }>;

function ffmpegArgs(context: VideoEncodingContextV1): string[] {
  const common = ["-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(context.fps), "-i", "pipe:0", "-frames:v", String(context.frameCount)];
  return context.format === "mp4" ? [...common, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-f", "" + "mp4", "pipe:1"] : [...common, "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-f", "webm", "pipe:1"];
}

export function createFfmpegVideoEncoderBackend(options: FfmpegOptionsV1 = {}): VideoEncoderBackendV1 {
  const executable = options.executable ?? "ffmpeg";
  const maxOutputBytes = options.maxOutputBytes ?? 512 * 1024 * 1024;
  return { backendId: "ffmpeg", backendVersion: executable, available: options.available ?? false, supports: (format) => format === "mp4" || format === "webm", supportsAlpha: () => false, start: async (context) => {
    if (!options.available) throw new Error(`${executable} is not available`);
    const child = spawn(executable, ffmpegArgs(context), { stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let outputBytes = 0;
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { outputBytes += chunk.byteLength; if (outputBytes <= maxOutputBytes) chunks.push(chunk); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString("utf8")}`.slice(-4096); });
    const error = new Promise<never>((_, reject) => child.once("error", reject));
    let expected = context.firstFrame;
    return { push: async (frame) => { if (frame.frameIndex !== expected) throw new Error(`ffmpeg frame order expected ${expected} but received ${frame.frameIndex}`); expected += 1; const bytes = Buffer.from(await frame.blob.arrayBuffer()); if (!child.stdin.write(bytes)) await once(child.stdin, "drain"); }, finish: async () => { child.stdin.end(); const result = await Promise.race([once(child, "close"), error]); const exitCode = Array.isArray(result) ? result[0] : null; if (exitCode !== 0) throw new Error(stderr || `ffmpeg exited with ${String(exitCode)}`); if (outputBytes > maxOutputBytes) throw new Error("encoded video exceeded the configured output bound"); return new Uint8Array(Buffer.concat(chunks)); }, cancel: async () => { child.stdin.destroy(); child.kill("SIGTERM"); await Promise.race([once(child, "close"), new Promise((resolve) => setTimeout(resolve, 1000))]); } };
  } };
}

export async function detectFfmpegVideoEncoderBackend(options: Omit<FfmpegOptionsV1, "available"> = {}): Promise<VideoEncoderBackendV1> {
  const executable = options.executable ?? "ffmpeg";
  const available = await new Promise<boolean>((resolve) => { const child = spawn(executable, ["-version"], { stdio: "ignore" }); child.once("error", () => resolve(false)); child.once("close", (code) => resolve(code === 0)); });
  return createFfmpegVideoEncoderBackend({ ...options, available });
}

export function serializeVideoArtifactMetadata(metadata: VideoArtifactMetadataV1): string { return JSON.stringify(metadata); }
