/** B-E: deterministic chapter-to-image-slide packaging. */

import type { AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import type { TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";
import type { TeachingSnapshotV1 } from "./teaching-snapshot.ts";
import type { TeachingTextBundleV1 } from "./teaching-text.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { ExactFrameSequencePlanV1 } from "./p4-f-deterministic-frame-sequence-export.ts";
import type { CompositeFrameArtifactV1 } from "./composite-teaching-frame.ts";
import type { CapturedFrameArtifactV1 } from "./p4-e-deterministic-image-capture.ts";

export const slideLayoutKindsV1 = ["TITLE", "FOCUS_IMAGE", "IMAGE_TEXT", "COMPARISON", "CORRECTION", "SUMMARY"] as const;
export type SlideLayoutKindV1 = typeof slideLayoutKindsV1[number];
export type SlideFailureCodeV1 = "SLIDE_RENDER_UNAVAILABLE" | "SLIDE_CONTENT_OVERFLOW" | "SLIDE_FRAME_UNAVAILABLE" | "SLIDE_LAYOUT_UNSUPPORTED" | "SLIDE_ARTIFACT_INVALID" | "SLIDE_PACKAGE_INVALID" | "TEACHING_OVERLAY_UNAVAILABLE" | "FRAGMENTATION_UNGROUNDED";
export type SlideFailureV1 = Readonly<{ ok: false; code: SlideFailureCodeV1; reasons: readonly string[] }>;

export type SlideFrameRefV1 = Readonly<{ sourceSurface: "SCENE_CANVAS" | "SCENE_WITH_TEACHING_OVERLAY"; frameIndex?: number; timeSeconds?: number; artifactId?: string; selectionReason: "TIMELINE_EVENT" | "TRANSITION_MIDPOINT" | "CHAPTER_START" | "STATIC_MANUAL_STATE" }>; 
export type SlidePlanV1 = Readonly<{
  slideId: string;
  chapterId: string;
  chapterRole: TeachingChapterProgramV1["entries"][number]["role"];
  title: string;
  learningObjectiveText?: string;
  frame: SlideFrameRefV1;
  additionalFrames: readonly SlideFrameRefV1[];
  explanationSegmentIds: readonly string[];
  annotationSegmentIds: readonly string[];
  causalSegmentIds: readonly string[];
  contrastSegmentIds: readonly string[];
  correctionSegmentIds: readonly string[];
  provenanceRefs: readonly TeachingReference[];
  fidelityRefs: readonly TeachingReference[];
  layout: SlideLayoutKindV1;
  sourceTrace: Readonly<{ teachingPlanId: string; chapterProgramId: string; audience: AudienceTeachingProgramV1["audience"]; requestMode: TeachingTextBundleV1["requestMode"] }>;
}>;
export type SlideDeckPlanV1 = Readonly<{
  schemaVersion: "1";
  deckId: string;
  title: string;
  sceneId: string;
  capabilityId?: string;
  audience: AudienceTeachingProgramV1["audience"];
  requestMode: TeachingTextBundleV1["requestMode"];
  slideIds: readonly string[];
  teachingPlanId: string;
  chapterProgramId: string;
  exportSurface: SlideFrameRefV1["sourceSurface"];
  dimensions: Readonly<{ width: number; height: number; aspectRatio: "16:9" | "4:3" }>;
  provenancePolicy: "NONE" | "REFERENCES";
  themeVersion: "1";
  layoutVersion: "1";
  slides: readonly SlidePlanV1[];
}>;
export type SlideArtifactMetadataV1 = Readonly<{ schemaVersion: "1"; slideId: string; format: "png"; width: number; height: number; byteLength: number; checksum?: string; sourceFrame: SlideFrameRefV1; teachingPlanId: string; chapterProgramId: string; provenanceRefs: readonly TeachingReference[]; layoutVersion: "1"; backend: string }>;
export type SlideArtifactV1 = Readonly<{ metadata: SlideArtifactMetadataV1; blob: Blob }>;
export type SlidePackageManifestV1 = Readonly<{ schemaVersion: "1"; deck: Omit<SlideDeckPlanV1, "slides">; slideIds: readonly string[]; artifacts: readonly SlideArtifactMetadataV1[]; artifactStatus: "AVAILABLE" | "SLIDE_RENDER_UNAVAILABLE"; provenanceRefs: readonly TeachingReference[]; fidelityRefs: readonly TeachingReference[]; pptxStatus: "NOT_IMPLEMENTED"; pdfStatus: "NOT_IMPLEMENTED" }>;

export type SlideFrameInputV1 = Readonly<{ sourceSurface: SlideFrameRefV1["sourceSurface"]; frameIndex?: number; timeSeconds?: number; artifactId?: string; artifact?: CapturedFrameArtifactV1 | CompositeFrameArtifactV1 }>;
export type SlideExportInputV1 = Readonly<{
  deckId: string;
  title: string;
  teachingPlan: TeachingPlan;
  chapterProgram: TeachingChapterProgramV1;
  audienceProgram: AudienceTeachingProgramV1;
  snapshots?: Readonly<Record<string, TeachingSnapshotV1>>;
  textBundles: Readonly<Record<string, TeachingTextBundleV1>>;
  timeline?: ScientificTimeline;
  sequence?: ExactFrameSequencePlanV1;
  frameByChapterId: Readonly<Record<string, SlideFrameInputV1>>;
  exportSurface: SlideFrameRefV1["sourceSurface"];
  dimensions?: Readonly<{ width: number; height: number; aspectRatio: "16:9" | "4:3" }>;
  provenancePolicy?: "NONE" | "REFERENCES";
  fidelityRefs?: readonly TeachingReference[];
  chapterTitles?: Readonly<Record<string, string>>;
  capabilityId?: string;
  upstreamFailureCode?: "FRAGMENTATION_UNGROUNDED";
}>;
export type SlidePlanResultV1 = Readonly<{ ok: true; plan: SlideDeckPlanV1 } | SlideFailureV1>;
export type SlideManifestResultV1 = Readonly<{ ok: true; manifest: SlidePackageManifestV1 } | SlideFailureV1>;

const fail = (code: SlideFailureCodeV1, ...reasons: string[]): SlideFailureV1 => ({ ok: false, code, reasons });
const refKey = (ref: TeachingReference) => JSON.stringify(ref);
const uniqueRefs = (refs: readonly TeachingReference[]) => [...refs].sort((a, b) => refKey(a).localeCompare(refKey(b))).filter((ref, index, values) => index === values.findIndex((other) => refKey(other) === refKey(ref)));
const stableId = (input: SlideExportInputV1, chapterId: string) => `slide:${input.deckId}:${input.audienceProgram.audience.toLowerCase()}:${input.teachingPlan.requestMode}:${chapterId}`;
const layoutFor = (role: SlidePlanV1["chapterRole"], mode: TeachingTextBundleV1["requestMode"]): SlideLayoutKindV1 => mode === "compare" ? "COMPARISON" : mode === "misconceptionCorrection" || role === "CORRECT" ? "CORRECTION" : role === "SUMMARIZE" ? "SUMMARY" : role === "IDENTIFY" ? "FOCUS_IMAGE" : "IMAGE_TEXT";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const textLength = (bundle: TeachingTextBundleV1, ids: readonly string[]) => ids.reduce((total, id) => total + (bundle.segments.find((segment) => segment.segmentId === id)?.text.length ?? 0), 0);

function resolveTemporalFrame(entry: TeachingChapterProgramV1["entries"][number], timeline: ScientificTimeline, sequence?: ExactFrameSequencePlanV1): SlideFrameRefV1 | SlideFailureV1 {
  if (!entry.timelineMapping) return fail("SLIDE_FRAME_UNAVAILABLE", `chapter ${entry.chapterId} has no explicit timeline mapping`);
  const event = timeline.events.find((candidate) => entry.timelineMapping!.eventIds.includes(candidate.eventId));
  const transition = timeline.transitions.find((candidate) => entry.timelineMapping!.transitionIds.includes(candidate.transitionId));
  const chapter = (timeline.chapters ?? []).find((candidate) => entry.timelineMapping!.chapterIds.includes(candidate.chapterId));
  const selection = event ? { timeSeconds: event.at, selectionReason: "TIMELINE_EVENT" as const } : transition ? { timeSeconds: (transition.start + transition.end) / 2, selectionReason: "TRANSITION_MIDPOINT" as const } : chapter ? { timeSeconds: chapter.start, selectionReason: "CHAPTER_START" as const } : undefined;
  if (!selection) return fail("SLIDE_FRAME_UNAVAILABLE", `chapter ${entry.chapterId} has no resolvable timeline frame`);
  if (!finite(selection.timeSeconds) || selection.timeSeconds < 0) return fail("SLIDE_FRAME_UNAVAILABLE", `chapter ${entry.chapterId} has an invalid frame time`);
  const frameIndex = sequence ? Math.round(selection.timeSeconds * sequence.fps) : undefined;
  return { sourceSurface: "SCENE_CANVAS", ...(frameIndex === undefined ? {} : { frameIndex }), timeSeconds: selection.timeSeconds, selectionReason: selection.selectionReason };
}

function chapterFrame(entry: TeachingChapterProgramV1["entries"][number], input: SlideExportInputV1): SlideFrameRefV1 | SlideFailureV1 {
  const supplied = input.frameByChapterId[entry.chapterId];
  if (input.timeline) {
    const resolved = resolveTemporalFrame(entry, input.timeline, input.sequence);
    if (!resolved || "ok" in resolved) return resolved ?? fail("SLIDE_FRAME_UNAVAILABLE", `chapter ${entry.chapterId} has no frame`);
    if (!supplied) return fail("SLIDE_FRAME_UNAVAILABLE", `no exact frame artifact supplied for ${entry.chapterId}`);
    if (resolved.frameIndex !== undefined && supplied.frameIndex !== resolved.frameIndex) return fail("SLIDE_FRAME_UNAVAILABLE", `supplied frame does not match canonical selection for ${entry.chapterId}`);
    return { ...supplied, timeSeconds: resolved.timeSeconds, frameIndex: resolved.frameIndex, selectionReason: resolved.selectionReason };
  }
  if (!supplied) return fail("SLIDE_FRAME_UNAVAILABLE", `no static frame supplied for ${entry.chapterId}`);
  return { ...supplied, selectionReason: "STATIC_MANUAL_STATE" };
}

export function buildSlideDeckPlan(input: SlideExportInputV1): SlidePlanResultV1 {
  if (input.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", "slide export cannot describe ungrounded fragmentation");
  if (input.exportSurface === "SCENE_WITH_TEACHING_OVERLAY" && Object.values(input.frameByChapterId).some((frame) => frame.sourceSurface !== "SCENE_WITH_TEACHING_OVERLAY")) return fail("TEACHING_OVERLAY_UNAVAILABLE", "requested teaching slides require teaching composite frame artifacts");
  const byId = new Map(input.chapterProgram.entries.map((entry) => [entry.chapterId, entry]));
  const entries = [...input.chapterProgram.entries].sort((a, b) => a.order - b.order || a.chapterId.localeCompare(b.chapterId));
  const seen = new Set<string>();
  const slides: SlidePlanV1[] = [];
  for (const entry of entries) {
    if (seen.has(entry.chapterId)) return fail("SLIDE_PACKAGE_INVALID", `duplicate chapter ${entry.chapterId}`);
    seen.add(entry.chapterId);
    if (entry.dependsOn.some((dependency) => !byId.has(dependency))) return fail("SLIDE_PACKAGE_INVALID", `chapter ${entry.chapterId} has a missing dependency`);
    if (entry.dependsOn.some((dependency) => (byId.get(dependency)?.order ?? Number.MAX_SAFE_INTEGER) >= entry.order)) return fail("SLIDE_PACKAGE_INVALID", `chapter ${entry.chapterId} dependency order is not deterministic`);
    const bundle = input.textBundles[entry.chapterId];
    if (!bundle) return fail("SLIDE_PACKAGE_INVALID", `missing TeachingTextBundle for chapter ${entry.chapterId}`);
    const frame = chapterFrame(entry, input);
    if ("ok" in frame) return frame;
    const explanationSegmentIds = bundle.explanationSegments.filter((segment) => segment.chapterId === entry.chapterId).map((segment) => segment.segmentId);
    const annotationSegmentIds = bundle.annotationText.filter((segment) => segment.chapterId === entry.chapterId).map((segment) => segment.segmentId);
    const causalSegmentIds = bundle.causalText.filter((segment) => segment.chapterId === entry.chapterId).map((segment) => segment.segmentId);
    const contrastSegmentIds = bundle.contrastText.filter((segment) => segment.chapterId === entry.chapterId).map((segment) => segment.segmentId);
    const correctionSegmentIds = bundle.correctionText.filter((segment) => segment.chapterId === entry.chapterId).map((segment) => segment.segmentId);
    if (textLength(bundle, [...explanationSegmentIds, ...annotationSegmentIds, ...causalSegmentIds, ...contrastSegmentIds, ...correctionSegmentIds]) > 1400) return fail("SLIDE_CONTENT_OVERFLOW", `chapter ${entry.chapterId} exceeds the bounded slide content limit`);
    slides.push({ slideId: stableId(input, entry.chapterId), chapterId: entry.chapterId, chapterRole: entry.role, title: input.chapterTitles?.[entry.chapterId] ?? bundle.chapterTitle, ...(bundle.learningObjectiveText ? { learningObjectiveText: bundle.learningObjectiveText } : {}), frame, additionalFrames: [], explanationSegmentIds, annotationSegmentIds, causalSegmentIds, contrastSegmentIds, correctionSegmentIds, provenanceRefs: input.provenancePolicy === "NONE" ? [] : uniqueRefs([...entry.provenanceRefs, ...bundle.provenanceRefs]), fidelityRefs: uniqueRefs(input.fidelityRefs ?? []), layout: layoutFor(entry.role, bundle.requestMode), sourceTrace: { teachingPlanId: input.teachingPlan.planId, chapterProgramId: input.chapterProgram.planId, audience: input.audienceProgram.audience, requestMode: bundle.requestMode } });
  }
  const firstBundle = input.textBundles[entries[0]?.chapterId ?? ""];
  const dimensions = input.dimensions ?? { width: 1280, height: 720, aspectRatio: "16:9" as const };
  const plan: SlideDeckPlanV1 = { schemaVersion: "1", deckId: input.deckId, title: input.title, sceneId: input.teachingPlan.sceneId, ...(input.capabilityId ? { capabilityId: input.capabilityId } : {}), audience: input.audienceProgram.audience, requestMode: firstBundle?.requestMode ?? input.teachingPlan.requestMode, slideIds: slides.map((slide) => slide.slideId), teachingPlanId: input.teachingPlan.planId, chapterProgramId: input.chapterProgram.planId, exportSurface: input.exportSurface, dimensions, provenancePolicy: input.provenancePolicy ?? "REFERENCES", themeVersion: "1", layoutVersion: "1", slides };
  return { ok: true, plan };
}

export type SlideCaptureBackendV1 = Readonly<{ backendId: string; available: boolean; capture: (slide: SlidePlanV1, dimensions: SlideDeckPlanV1["dimensions"]) => Promise<Blob> }>;
export async function rasterizeSlides(plan: SlideDeckPlanV1, backend: SlideCaptureBackendV1, options: Readonly<{ checksum?: (blob: Blob) => Promise<string> | string }> = {}): Promise<Readonly<{ ok: true; artifacts: readonly SlideArtifactV1[] } | SlideFailureV1>> {
  if (!backend.available) return fail("SLIDE_RENDER_UNAVAILABLE", `${backend.backendId} is unavailable in this environment`);
  const artifacts: SlideArtifactV1[] = [];
  for (const slide of plan.slides) {
    let blob: Blob;
    try { blob = await backend.capture(slide, plan.dimensions); } catch (error) { return fail("SLIDE_RENDER_UNAVAILABLE", error instanceof Error ? error.message : String(error)); }
    if (!blob || blob.type !== "image/png" || blob.size <= 0) return fail("SLIDE_ARTIFACT_INVALID", `slide ${slide.slideId} returned an invalid PNG artifact`);
    const checksum = options.checksum ? await options.checksum(blob) : undefined;
    artifacts.push({ metadata: { schemaVersion: "1", slideId: slide.slideId, format: "png", width: plan.dimensions.width, height: plan.dimensions.height, byteLength: blob.size, ...(checksum ? { checksum } : {}), sourceFrame: slide.frame, teachingPlanId: slide.sourceTrace.teachingPlanId, chapterProgramId: slide.sourceTrace.chapterProgramId, provenanceRefs: slide.provenanceRefs, layoutVersion: plan.layoutVersion, backend: backend.backendId }, blob });
  }
  return { ok: true, artifacts };
}

export function buildSlidePackageManifest(plan: SlideDeckPlanV1, artifacts: readonly SlideArtifactV1[] = []): SlideManifestResultV1 {
  const expected = new Set(plan.slideIds);
  if (artifacts.some((artifact) => !expected.has(artifact.metadata.slideId) || artifact.metadata.teachingPlanId !== plan.teachingPlanId || artifact.metadata.chapterProgramId !== plan.chapterProgramId)) return fail("SLIDE_ARTIFACT_INVALID", "slide artifact identity does not match the deck plan");
  if (new Set(artifacts.map((artifact) => artifact.metadata.slideId)).size !== artifacts.length) return fail("SLIDE_ARTIFACT_INVALID", "duplicate slide artifact");
  const { slides: _slides, ...deck } = plan;
  return { ok: true, manifest: { schemaVersion: "1", deck, slideIds: plan.slideIds, artifacts: artifacts.map((artifact) => artifact.metadata), artifactStatus: artifacts.length === plan.slides.length ? "AVAILABLE" : "SLIDE_RENDER_UNAVAILABLE", provenanceRefs: uniqueRefs(plan.slides.flatMap((slide) => slide.provenanceRefs)), fidelityRefs: uniqueRefs(plan.slides.flatMap((slide) => slide.fidelityRefs)), pptxStatus: "NOT_IMPLEMENTED", pdfStatus: "NOT_IMPLEMENTED" } };
}

export function serializeSlideDeckPlan(plan: SlideDeckPlanV1): string { return JSON.stringify(plan); }
export function serializeSlidePlan(plan: SlidePlanV1): string { return JSON.stringify(plan); }
export function serializeSlidePackageManifest(manifest: SlidePackageManifestV1): string { return JSON.stringify(manifest); }
