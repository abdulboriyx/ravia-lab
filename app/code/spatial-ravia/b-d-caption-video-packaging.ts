/** B-D: deterministic caption, chapter, and video sidecar packaging. */

import type { TeachingReference } from "./teaching-plan.ts";
import type { NarrationCueProgramV1, CaptionSegmentV1, TeachingTextBundleV1 } from "./teaching-text.ts";
import type { TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { ExactFrameSequencePlanV1 } from "./p4-f-deterministic-frame-sequence-export.ts";
import type { VideoArtifactMetadataV1, VideoExportRequestV2 } from "./b-c-deterministic-video-encoding.ts";

export const captionInclusionPoliciesV1 = ["NONE", "SIDECAR", "BURNED_IN"] as const;
export type CaptionInclusionPolicyV1 = typeof captionInclusionPoliciesV1[number];
export type CaptionPackagingFailureCodeV1 = "CAPTION_TRACK_INVALID" | "CAPTION_TIMING_REQUIRED" | "CAPTION_TIMING_INVALID" | "CAPTION_TEXT_INVALID" | "CHAPTER_TRACK_INVALID" | "VIDEO_PACKAGE_INVALID" | "CAPTION_REFERENCE_INVALID" | "FRAGMENTATION_UNGROUNDED" | "ENCODER_UNAVAILABLE";
export type CaptionPackagingFailureV1 = Readonly<{ ok: false; code: CaptionPackagingFailureCodeV1; reasons: readonly string[] }>;

export type CaptionCueV1 = Readonly<{
  cueId: string;
  segmentId: string;
  chapterId: string;
  startSeconds: number;
  endSeconds: number;
  startFrame?: number;
  endFrame?: number;
  text: string;
  timelineRefs: readonly TeachingReference[];
  targetRefs: readonly TeachingReference[];
  provenanceRefs: readonly TeachingReference[];
}>;
export type CaptionTrackV1 = Readonly<{
  schemaVersion: "1";
  trackId: string;
  language: string;
  teachingPlanId: string;
  chapterProgramId: string;
  audience: NarrationCueProgramV1["audience"];
  requestMode: "show" | "explain" | "compare" | "why" | "misconceptionCorrection";
  timelineId?: string;
  sequence?: Readonly<{ firstFrame: number; lastFrame: number; fps: number }>;
  cues: readonly CaptionCueV1[];
}>;

export type ChapterMarkerV1 = Readonly<{
  chapterId: string;
  title: string;
  learningObjectiveText?: string;
  startSeconds?: number;
  endSeconds?: number;
  startFrame?: number;
  representativeFrame?: number;
  timelineRefs: readonly TeachingReference[];
  provenanceRefs: readonly TeachingReference[];
}>;
export type ChapterTrackV1 = Readonly<{
  schemaVersion: "1";
  trackId: string;
  mode: "TEMPORAL" | "STATIC_PRESENTATION";
  teachingPlanId: string;
  chapterProgramId: string;
  audience: NarrationCueProgramV1["audience"];
  requestMode: CaptionTrackV1["requestMode"];
  timelineId?: string;
  markers: readonly ChapterMarkerV1[];
}>;

export type VideoPackageManifestV1 = Readonly<{
  schemaVersion: "1";
  manifestId: string;
  packageStatus: "READY" | "VIDEO_UNAVAILABLE";
  encoderStatus: "AVAILABLE" | "ENCODER_UNAVAILABLE";
  videoArtifact?: VideoArtifactMetadataV1;
  sequence: Readonly<{ firstFrame: number; lastFrame: number; frameCount: number; fps: number; durationSeconds: number; width: number; height: number; sourceSurface: "SCENE_CANVAS" | "SCENE_WITH_TEACHING_OVERLAY"; ownerId: string }>;
  teachingPlanId: string;
  chapterProgramId: string;
  audience: NarrationCueProgramV1["audience"];
  requestMode: CaptionTrackV1["requestMode"];
  exportSurface: "SCENE_CANVAS" | "SCENE_WITH_TEACHING_OVERLAY";
  captionPolicy: CaptionInclusionPolicyV1;
  captionTracks: readonly CaptionTrackV1[];
  chapterTrack: ChapterTrackV1;
  provenanceRefs: readonly TeachingReference[];
  fidelityTiers?: readonly string[];
}>;

export type CaptionPackagingInputV1 = Readonly<{
  manifestId: string;
  trackId: string;
  language?: string;
  narrationProgram: NarrationCueProgramV1;
  teachingText?: TeachingTextBundleV1;
  chapterProgram: TeachingChapterProgramV1;
  timeline?: ScientificTimeline;
  sequence?: ExactFrameSequencePlanV1;
  videoArtifact?: VideoArtifactMetadataV1;
  staticChapterTiming?: Readonly<Record<string, Readonly<{ startSeconds: number; endSeconds: number; representativeFrame?: number }>>>;
  chapterTitles?: Readonly<Record<string, string>>;
  chapterObjectives?: Readonly<Record<string, string>>;
  captionPolicy?: CaptionInclusionPolicyV1;
  exportRequest?: VideoExportRequestV2;
  provenanceRefs?: readonly TeachingReference[];
  fidelityTiers?: readonly string[];
  upstreamFailureCode?: "FRAGMENTATION_UNGROUNDED";
}>;

export type CaptionTrackResultV1 = Readonly<{ ok: true; track: CaptionTrackV1 } | CaptionPackagingFailureV1>;
export type ChapterTrackResultV1 = Readonly<{ ok: true; track: ChapterTrackV1 } | CaptionPackagingFailureV1>;
export type VideoPackageResultV1 = Readonly<{ ok: true; manifest: VideoPackageManifestV1 } | CaptionPackagingFailureV1>;

const fail = (code: CaptionPackagingFailureCodeV1, ...reasons: string[]): CaptionPackagingFailureV1 => ({ ok: false, code, reasons });
const refKey = (ref: TeachingReference) => JSON.stringify(ref);
const uniqueRefs = (refs: readonly TeachingReference[]) => [...refs].sort((a, b) => refKey(a).localeCompare(refKey(b))).filter((ref, index, values) => index === values.findIndex((other) => refKey(other) === refKey(ref)));
const sorted = <T>(values: readonly T[], key: (value: T) => string) => [...values].sort((a, b) => key(a).localeCompare(key(b)));
const frameCeil = (seconds: number, fps: number) => { const value = Math.ceil((seconds * fps) - 1e-9); return Object.is(value, -0) ? 0 : value; };
const frameTime = (frame: number, fps: number) => frame / fps;
const quantize = (seconds: number, fps?: number) => { const value = fps === undefined ? seconds : frameTime(frameCeil(seconds, fps), fps); return Object.is(value, -0) ? 0 : value; };
const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const textSafe = (value: string) => value.replace(/\r\n?/g, "\n").replace(/[<>]/g, (character) => character === "<" ? "&lt;" : "&gt;").replace(/&(?!(?:lt|gt|amp);)/g, "&amp;").trim();
const serialMilliseconds = (seconds: number) => Math.max(0, Math.round(seconds * 1000));

function formatTimestamp(seconds: number, separator: "." | ","): string {
  const milliseconds = serialMilliseconds(seconds);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const remainder = milliseconds % 60_000;
  const wholeSeconds = Math.floor(remainder / 1000);
  const millis = remainder % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`;
}

function activationFor(segment: CaptionSegmentV1, cue: NarrationCueProgramV1["cues"][number], input: CaptionPackagingInputV1): { startSeconds: number; endSeconds: number; startFrame?: number; endFrame?: number } | CaptionPackagingFailureV1 {
  let start = cue.activation.startSeconds;
  let end = cue.activation.endSeconds;
  if (start === undefined || end === undefined) {
    const staticTiming = input.staticChapterTiming?.[segment.chapterId];
    if (!staticTiming) return fail("CAPTION_TIMING_REQUIRED", `caption ${segment.segmentId} has no scientific interval; provide explicit static chapter timing`);
    start ??= staticTiming.startSeconds;
    end ??= staticTiming.endSeconds;
  }
  if (!finiteNonNegative(start) || !finiteNonNegative(end) || end <= start) return fail("CAPTION_TIMING_INVALID", `caption ${segment.segmentId} has an invalid interval`);
  const fps = input.sequence?.fps;
  const quantizedStart = quantize(start, fps);
  const quantizedEnd = quantize(end, fps);
  if (quantizedEnd <= quantizedStart) return fail("CAPTION_TIMING_INVALID", `caption ${segment.segmentId} collapses after frame quantization`);
  return { startSeconds: quantizedStart, endSeconds: quantizedEnd, ...(fps === undefined ? {} : { startFrame: frameCeil(start, fps), endFrame: frameCeil(end, fps) }) };
}

function validatePolicy(input: CaptionPackagingInputV1): CaptionPackagingFailureV1 | undefined {
  const policy = input.captionPolicy ?? "SIDECAR";
  if (!captionInclusionPoliciesV1.includes(policy)) return fail("VIDEO_PACKAGE_INVALID", "unknown caption inclusion policy");
  if (policy === "BURNED_IN" && input.exportRequest?.sourceSurface !== "SCENE_WITH_TEACHING_OVERLAY") return fail("VIDEO_PACKAGE_INVALID", "BURNED_IN captions require the B-B teaching-overlay surface");
  if (input.teachingText && (input.teachingText.teachingPlanId !== input.narrationProgram.teachingPlanId || input.teachingText.audience !== input.narrationProgram.audience)) return fail("VIDEO_PACKAGE_INVALID", "teaching text and narration program identities do not agree");
  return undefined;
}

export function buildCaptionTrack(input: CaptionPackagingInputV1): CaptionTrackResultV1 {
  if (input.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", "caption packaging cannot describe ungrounded fragmentation");
  const policyFailure = validatePolicy(input);
  if (policyFailure) return policyFailure;
  const cuesById = new Map(input.narrationProgram.cues.map((cue) => [cue.cueId, cue]));
  const chapterIds = new Set(input.chapterProgram.entries.map((entry) => entry.chapterId));
  const seen = new Set<string>();
  const cues: CaptionCueV1[] = [];
  for (const segment of input.narrationProgram.captionSegments) {
    if (seen.has(segment.cueId)) return fail("CAPTION_TRACK_INVALID", `duplicate caption cue ${segment.cueId}`);
    seen.add(segment.cueId);
    if (!chapterIds.has(segment.chapterId)) return fail("CAPTION_REFERENCE_INVALID", `caption ${segment.segmentId} references an unknown chapter ${segment.chapterId}`);
    const cue = cuesById.get(segment.cueId);
    if (!cue || cue.chapterId !== segment.chapterId) return fail("CAPTION_REFERENCE_INVALID", `caption ${segment.segmentId} does not reference a matching narration cue`);
    const text = textSafe(segment.text);
    if (!text || text.length > 320) return fail("CAPTION_TEXT_INVALID", `caption ${segment.segmentId} is empty or exceeds the bounded length`);
    const activation = activationFor(segment, cue, input);
    if ("ok" in activation) return activation;
    cues.push({ cueId: segment.cueId, segmentId: segment.segmentId, chapterId: segment.chapterId, ...activation, text, timelineRefs: uniqueRefs(cue.timelineRefs), targetRefs: uniqueRefs(cue.targetRefs), provenanceRefs: uniqueRefs(segment.provenanceRefs) });
  }
  cues.sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds || a.chapterId.localeCompare(b.chapterId) || a.cueId.localeCompare(b.cueId));
  return { ok: true, track: { schemaVersion: "1", trackId: input.trackId, language: input.language ?? "und", teachingPlanId: input.narrationProgram.teachingPlanId, chapterProgramId: input.chapterProgram.planId, audience: input.narrationProgram.audience, requestMode: input.teachingText?.requestMode ?? input.exportRequest?.teaching?.requestMode ?? "explain", ...(input.timeline ? { timelineId: input.timeline.timelineId } : {}), ...(input.sequence ? { sequence: { firstFrame: input.sequence.firstFrame, lastFrame: input.sequence.lastFrame, fps: input.sequence.fps } } : {}), cues } };
}

function chapterInterval(entry: TeachingChapterProgramV1["entries"][number], input: CaptionPackagingInputV1): { startSeconds: number; endSeconds: number; representativeFrame?: number } | undefined {
  const staticTiming = input.staticChapterTiming?.[entry.chapterId];
  if (staticTiming) return staticTiming;
  if (!input.timeline || !entry.timelineMapping) return undefined;
  const mappedChapters = (input.timeline.chapters ?? []).filter((chapter) => entry.timelineMapping!.chapterIds.includes(chapter.chapterId));
  if (mappedChapters.length) return { startSeconds: Math.min(...mappedChapters.map((chapter) => chapter.start)), endSeconds: Math.max(...mappedChapters.map((chapter) => chapter.end)) };
  const transitions = input.timeline.transitions.filter((transition) => entry.timelineMapping!.transitionIds.includes(transition.transitionId));
  if (transitions.length) return { startSeconds: Math.min(...transitions.map((transition) => transition.start)), endSeconds: Math.max(...transitions.map((transition) => transition.end)) };
  const events = input.timeline.events.filter((event) => entry.timelineMapping!.eventIds.includes(event.eventId));
  if (events.length) return { startSeconds: Math.min(...events.map((event) => event.at)), endSeconds: Math.min(input.timeline.clock.duration, Math.min(...events.map((event) => event.at)) + 1 / (input.sequence?.fps ?? 1)) };
  return undefined;
}

export function buildChapterTrack(input: CaptionPackagingInputV1): ChapterTrackResultV1 {
  if (input.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", "chapter packaging cannot describe ungrounded fragmentation");
  const markers: ChapterMarkerV1[] = [];
  const temporal = Boolean(input.timeline);
  for (const entry of sorted(input.chapterProgram.entries, (item) => `${String(item.order).padStart(8, "0")}:${item.chapterId}`)) {
    const interval = chapterInterval(entry, input);
    if (temporal && entry.timelineMapping && !interval) return fail("CHAPTER_TRACK_INVALID", `chapter ${entry.chapterId} has no resolvable timeline interval`);
    const start = interval ? quantize(interval.startSeconds, input.sequence?.fps) : undefined;
    const end = interval ? quantize(interval.endSeconds, input.sequence?.fps) : undefined;
    if (start !== undefined && end !== undefined && end <= start) return fail("CHAPTER_TRACK_INVALID", `chapter ${entry.chapterId} has an invalid interval`);
    markers.push({ chapterId: entry.chapterId, title: input.chapterTitles?.[entry.chapterId] ?? entry.chapterId, ...(input.chapterObjectives?.[entry.chapterId] ? { learningObjectiveText: input.chapterObjectives[entry.chapterId] } : {}), ...(start === undefined ? {} : { startSeconds: start }), ...(end === undefined ? {} : { endSeconds: end }), ...(input.sequence && start !== undefined ? { startFrame: frameCeil(start, input.sequence.fps) } : {}), ...(interval?.representativeFrame === undefined ? {} : { representativeFrame: interval.representativeFrame }), timelineRefs: uniqueRefs(entry.timelineRefs), provenanceRefs: uniqueRefs(entry.provenanceRefs) });
  }
  return { ok: true, track: { schemaVersion: "1", trackId: `${input.trackId}:chapters`, mode: temporal ? "TEMPORAL" : "STATIC_PRESENTATION", teachingPlanId: input.narrationProgram.teachingPlanId, chapterProgramId: input.chapterProgram.planId, audience: input.narrationProgram.audience, requestMode: input.teachingText?.requestMode ?? input.exportRequest?.teaching?.requestMode ?? "explain", ...(input.timeline ? { timelineId: input.timeline.timelineId } : {}), markers } };
}

function parseCueTime(value: string, separator: "." | ","): number | undefined {
  const match = new RegExp(`^(\\d{2}):(\\d{2}):(\\d{2})\\${separator}(\\d{3})$`).exec(value);
  if (!match) return undefined;
  const [, hours, minutes, seconds, milliseconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000;
}

export function serializeWebVtt(track: CaptionTrackV1): string {
  const lines = ["WEBVTT", "", `NOTE track=${track.trackId}`];
  for (const cue of track.cues) lines.push("", cue.cueId, `${formatTimestamp(cue.startSeconds, ".")} --> ${formatTimestamp(cue.endSeconds, ".")}`, cue.text);
  return `${lines.join("\n")}\n`;
}

export function serializeSrt(track: CaptionTrackV1): string {
  const blocks = track.cues.map((cue, index) => `${index + 1}\n${formatTimestamp(cue.startSeconds, ",")} --> ${formatTimestamp(cue.endSeconds, ",")}\n${cue.text}`);
  return blocks.length ? `${blocks.join("\n\n")}\n` : "";
}

export function parseSerializedCaptionTimestamp(value: string, format: "vtt" | "srt"): number | undefined { return parseCueTime(value, format === "vtt" ? "." : ","); }

export function buildVideoPackageManifest(input: CaptionPackagingInputV1): VideoPackageResultV1 {
  const policyFailure = validatePolicy(input);
  if (policyFailure) return policyFailure;
  const policy = input.captionPolicy ?? "SIDECAR";
  const captions = policy === "NONE" ? undefined : buildCaptionTrack(input);
  if (captions && !captions.ok) return captions;
  const chapters = buildChapterTrack(input);
  if (!chapters.ok) return chapters;
  const sequence = input.sequence;
  if (!sequence) return fail("VIDEO_PACKAGE_INVALID", "a canonical exact-frame sequence is required for a video package manifest");
  const surface = input.exportRequest?.sourceSurface ?? "SCENE_CANVAS";
  if (input.videoArtifact && (input.videoArtifact.width !== sequence.width * sequence.pixelRatio || input.videoArtifact.height !== sequence.height * sequence.pixelRatio || input.videoArtifact.fps !== sequence.fps || input.videoArtifact.frameCount !== sequence.frameCount || input.videoArtifact.sourceSurface !== surface)) return fail("VIDEO_PACKAGE_INVALID", "video artifact metadata does not match the canonical sequence");
  const encoderStatus = input.videoArtifact ? "AVAILABLE" : "ENCODER_UNAVAILABLE";
  return { ok: true, manifest: { schemaVersion: "1", manifestId: input.manifestId, packageStatus: input.videoArtifact ? "READY" : "VIDEO_UNAVAILABLE", encoderStatus, ...(input.videoArtifact ? { videoArtifact: input.videoArtifact } : {}), sequence: { firstFrame: sequence.firstFrame, lastFrame: sequence.lastFrame, frameCount: sequence.frameCount, fps: sequence.fps, durationSeconds: sequence.durationSeconds, width: sequence.width * sequence.pixelRatio, height: sequence.height * sequence.pixelRatio, sourceSurface: surface, ownerId: sequence.ownerId }, teachingPlanId: input.narrationProgram.teachingPlanId, chapterProgramId: input.chapterProgram.planId, audience: input.narrationProgram.audience, requestMode: input.teachingText?.requestMode ?? input.exportRequest?.teaching?.requestMode ?? "explain", exportSurface: surface, captionPolicy: policy, captionTracks: captions ? [captions.track] : [], chapterTrack: chapters.track, provenanceRefs: uniqueRefs(input.provenanceRefs ?? []), ...(input.fidelityTiers ? { fidelityTiers: [...input.fidelityTiers].sort() } : {}) } };
}

export function serializeCaptionTrack(track: CaptionTrackV1): string { return JSON.stringify(track); }
export function serializeChapterTrack(track: ChapterTrackV1): string { return JSON.stringify(track); }
export function serializeVideoPackageManifest(manifest: VideoPackageManifestV1): string { return JSON.stringify(manifest); }
