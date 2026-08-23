/** B-B: deterministic scene-canvas + teaching-DOM composite capture boundary. */
import type { AppliedRenderStateV1 } from "./p4-b-exact-frame-runtime.ts";
import type { RenderReadinessV1 } from "./p4-c-renderer-state-reconstruction.ts";
import type { ProductionTeachingViewV1 } from "./production-teaching-adapter.ts";
import type { TeachingSnapshotV1 } from "./teaching-snapshot.ts";
import type { TeachingTextBundleV1 } from "./teaching-text.ts";
import type { TeachingReference } from "./teaching-plan.ts";
import { exportSurfaceKindsV2, teachingOverlayInclusionModesV2, type ExportSurfaceKindV2, type TeachingOverlayInclusionModeV2 } from "./scene-export-contract-v2.ts";

export const compositeFrameSchemaVersion = "1" as const;
export type CompositeFailureCode = "COMPOSITE_CAPTURE_UNAVAILABLE" | "EXPORT_NOT_READY" | "FONT_NOT_READY" | "TEACHING_OVERLAY_UNAVAILABLE" | "CAPTURE_STALE_FRAME" | "EXPORT_SURFACE_UNSUPPORTED" | "CAPTURE_ENCODING_FAILED";
export type CompositeFailure = Readonly<{ ok: false; code: CompositeFailureCode; reasons: readonly string[] }>;

export type CompositeExactFrameIdentityV1 = Readonly<{
  applicationId: number;
  ownerId: string;
  timelineId: string;
  timeSeconds: number;
  frameIndex?: number;
  fps?: number;
  width: number;
  height: number;
  pixelRatio: number;
}>;

export type CompositeExportSurfaceV1 = Readonly<{
  schemaVersion: "1";
  exportSurface: ExportSurfaceKindV2;
  exactFrame: CompositeExactFrameIdentityV1;
  teachingSnapshot: Readonly<{ teachingPlanId: string; chapterProgramId: string; timeSeconds: number; activeChapterIds: readonly string[]; audience: TeachingSnapshotV1["audience"]; requestMode: TeachingSnapshotV1["requestMode"] }>;
  teachingText: Readonly<{ teachingPlanId: string; chapterProgramId: string; timeSeconds: number; chapterId: string; audience: TeachingTextBundleV1["audience"]; requestMode: TeachingTextBundleV1["requestMode"] }>;
  dimensions: Readonly<{ width: number; height: number; pixelRatio: number }>;
  background: AppliedRenderStateV1["renderConfig"]["background"];
  overlay: Readonly<{ inclusion: TeachingOverlayInclusionModeV2; includeProvenance: boolean; includeCaptions: boolean }>;
  provenanceRefs: readonly TeachingReference[];
}>;

export type CompositeReadinessV1 = Readonly<{
  schemaVersion: "1";
  status: "READY" | "NOT_READY" | "FAILED";
  applicationId: number;
  sceneReady: boolean;
  cameraReady: boolean;
  geometryReady: boolean;
  labelsReady: boolean;
  assetsReady: boolean;
  teachingDomReady: boolean;
  fontsReady: boolean;
  compositeLayoutReady: boolean;
  teachingSnapshotIdentityReady: boolean;
  textBundleIdentityReady: boolean;
  reasons: readonly string[];
}>;

export type CompositeFrameMetadataV1 = Readonly<{
  schemaVersion: "1";
  exportSurface: ExportSurfaceKindV2;
  format: "png" | "pngTransparent";
  mimeType: "image/png";
  width: number;
  height: number;
  pixelRatio: number;
  applicationId: number;
  ownerId: string;
  timelineId: string;
  timeSeconds: number;
  frameIndex?: number;
  fps?: number;
  teachingPlanId: string;
  chapterProgramId: string;
  teachingChapterId: string;
  audience: TeachingSnapshotV1["audience"];
  requestMode: TeachingSnapshotV1["requestMode"];
  provenanceRefs: readonly TeachingReference[];
  byteLength: number;
  checksum?: string;
  backend: string;
}>;
export type CompositeFrameArtifactV1 = Readonly<{ metadata: CompositeFrameMetadataV1; blob: Blob }>;

export type CompositeCaptureTargetV1 = Readonly<{ width: number; height: number; screenshot: (options: Readonly<{ background: "opaque" | "transparent" }>) => Promise<Blob> }>;
export type CompositeCaptureBackendV1 = Readonly<{ backendId: string; supports: (surface: CompositeExportSurfaceV1) => boolean; capture: (target: CompositeCaptureTargetV1, surface: CompositeExportSurfaceV1) => Promise<Blob> }>;
export type CompositeCaptureResult = Readonly<{ ok: true; artifact: CompositeFrameArtifactV1 } | CompositeFailure>;

const fail = (code: CompositeFailureCode, ...reasons: string[]): CompositeFailure => ({ ok: false, code, reasons });
const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const positiveFinite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

export type BuildCompositeSurfaceInput = Readonly<{ applicationId: number; appliedState: AppliedRenderStateV1; snapshot: TeachingSnapshotV1; textBundle: TeachingTextBundleV1; view: ProductionTeachingViewV1; overlay?: Partial<CompositeExportSurfaceV1["overlay"]> & { inclusion?: TeachingOverlayInclusionModeV2 }; frameIndex?: number; fps?: number }>;

export function buildCompositeExportSurface(input: BuildCompositeSurfaceInput): CompositeExportSurfaceV1 | CompositeFailure {
  const { appliedState, snapshot, textBundle, view } = input;
  const inclusion = input.overlay?.inclusion ?? "text";
  if (!exportSurfaceKindsV2.includes("SCENE_WITH_TEACHING_OVERLAY")) return fail("EXPORT_SURFACE_UNSUPPORTED", "teaching composite surface is not registered");
  if (!teachingOverlayInclusionModesV2.includes(inclusion)) return fail("EXPORT_SURFACE_UNSUPPORTED", "teaching overlay inclusion is unsupported");
  if (view.support.status !== "SUPPORTED") return fail("TEACHING_OVERLAY_UNAVAILABLE", ...(view.support.reasons.length ? view.support.reasons : ["production teaching view is unavailable"]));
  if (inclusion === "textAndAnchoredCallouts" && view.labelProjections.some((projection) => projection.anchorStatus !== "RESOLVED_EXPORT_ANCHOR")) return fail("TEACHING_OVERLAY_UNAVAILABLE", "one or more teaching annotations lack an exportable renderer anchor");
  const exactFrame: CompositeExactFrameIdentityV1 = { applicationId: input.applicationId, ownerId: appliedState.ownerId, timelineId: appliedState.trace.timelineId, timeSeconds: appliedState.timeSeconds, ...(input.frameIndex === undefined ? {} : { frameIndex: input.frameIndex }), ...(input.fps === undefined ? {} : { fps: input.fps }), width: appliedState.renderConfig.width, height: appliedState.renderConfig.height, pixelRatio: appliedState.renderConfig.pixelRatio };
  const teachingSnapshot = { teachingPlanId: snapshot.teachingPlanId, chapterProgramId: snapshot.chapterProgramId, timeSeconds: snapshot.timeSeconds, activeChapterIds: snapshot.activeChapterIds, audience: snapshot.audience, requestMode: snapshot.requestMode };
  const teachingText = { teachingPlanId: textBundle.teachingPlanId, chapterProgramId: textBundle.snapshotTrace.chapterProgramId, timeSeconds: textBundle.snapshotTrace.timeSeconds, chapterId: textBundle.chapterId, audience: textBundle.audience, requestMode: textBundle.requestMode };
  if (snapshot.timeSeconds !== appliedState.timeSeconds || textBundle.snapshotTrace.timeSeconds !== appliedState.timeSeconds || textBundle.snapshotTrace.chapterProgramId !== snapshot.chapterProgramId) return fail("CAPTURE_STALE_FRAME", "scene, teaching snapshot, and text bundle times/traces do not agree");
  if (snapshot.teachingPlanId !== textBundle.teachingPlanId || snapshot.audience !== textBundle.audience || snapshot.requestMode !== textBundle.requestMode) return fail("TEACHING_OVERLAY_UNAVAILABLE", "teaching snapshot and text bundle identify different teaching states");
  if (!snapshot.activeChapterIds.includes(textBundle.chapterId)) return fail("TEACHING_OVERLAY_UNAVAILABLE", "text bundle chapter is not active in the teaching snapshot");
  return { schemaVersion: compositeFrameSchemaVersion, exportSurface: "SCENE_WITH_TEACHING_OVERLAY", exactFrame, teachingSnapshot, teachingText, dimensions: { width: appliedState.renderConfig.width, height: appliedState.renderConfig.height, pixelRatio: appliedState.renderConfig.pixelRatio }, background: appliedState.renderConfig.background, overlay: { inclusion, includeProvenance: input.overlay?.includeProvenance ?? false, includeCaptions: input.overlay?.includeCaptions ?? false }, provenanceRefs: view.provenanceRefs };
}

export function validateCompositeExportSurface(surface: CompositeExportSurfaceV1): CompositeFailure | { ok: true } {
  if (surface.schemaVersion !== compositeFrameSchemaVersion || surface.exportSurface !== "SCENE_WITH_TEACHING_OVERLAY") return fail("EXPORT_SURFACE_UNSUPPORTED", "composite surface schema or surface kind is unsupported");
  if (!finiteNonNegative(surface.exactFrame.timeSeconds) || !positiveFinite(surface.exactFrame.width) || !positiveFinite(surface.exactFrame.height) || !positiveFinite(surface.exactFrame.pixelRatio)) return fail("EXPORT_SURFACE_UNSUPPORTED", "composite surface has invalid frame dimensions or time");
  if (surface.dimensions.width !== surface.exactFrame.width || surface.dimensions.height !== surface.exactFrame.height || surface.dimensions.pixelRatio !== surface.exactFrame.pixelRatio) return fail("EXPORT_SURFACE_UNSUPPORTED", "composite dimensions do not match exact-frame dimensions");
  if (surface.teachingSnapshot.timeSeconds !== surface.exactFrame.timeSeconds || surface.teachingText.timeSeconds !== surface.exactFrame.timeSeconds) return fail("CAPTURE_STALE_FRAME", "teaching traces do not match exact-frame time");
  if (surface.teachingSnapshot.teachingPlanId !== surface.teachingText.teachingPlanId || surface.teachingSnapshot.audience !== surface.teachingText.audience || surface.teachingSnapshot.requestMode !== surface.teachingText.requestMode) return fail("TEACHING_OVERLAY_UNAVAILABLE", "snapshot and text bundle identity fields do not agree");
  if (!surface.teachingSnapshot.activeChapterIds.includes(surface.teachingText.chapterId)) return fail("TEACHING_OVERLAY_UNAVAILABLE", "text bundle chapter is not active in the snapshot");
  return { ok: true };
}

export type CompositeReadinessInputV1 = Readonly<{ p4Readiness: RenderReadinessV1; fontsReady: boolean; teachingDomReady: boolean; compositeLayoutReady: boolean; teachingSnapshotIdentityReady: boolean; textBundleIdentityReady: boolean; reasons?: readonly string[] }>;
export function buildCompositeReadiness(input: CompositeReadinessInputV1): CompositeReadinessV1 {
  const p4 = input.p4Readiness;
  const reasons = [...(input.reasons ?? []), ...p4.reasons];
  if (!input.fontsReady) reasons.push("FONT_NOT_READY");
  if (!input.teachingDomReady) reasons.push("TEACHING_DOM_NOT_READY");
  if (!input.compositeLayoutReady) reasons.push("COMPOSITE_LAYOUT_NOT_READY");
  if (!input.teachingSnapshotIdentityReady) reasons.push("TEACHING_SNAPSHOT_IDENTITY_NOT_READY");
  if (!input.textBundleIdentityReady) reasons.push("TEXT_BUNDLE_IDENTITY_NOT_READY");
  const normalized = [...new Set(reasons)];
  const dimensions = { sceneReady: p4.status === "READY" && p4.stateApplied, cameraReady: p4.cameraReady, geometryReady: p4.geometryReady, labelsReady: p4.labelsReady, assetsReady: p4.assetsReady, teachingDomReady: input.teachingDomReady, fontsReady: input.fontsReady, compositeLayoutReady: input.compositeLayoutReady, teachingSnapshotIdentityReady: input.teachingSnapshotIdentityReady, textBundleIdentityReady: input.textBundleIdentityReady };
  const ready = Object.values(dimensions).every(Boolean) && !p4.supersededWorkPending;
  return { schemaVersion: "1", status: ready ? "READY" : p4.status === "FAILED" ? "FAILED" : "NOT_READY", applicationId: p4.applicationId, ...dimensions, reasons: normalized };
}

export function captureCompositeFrame(input: Readonly<{ surface: CompositeExportSurfaceV1; readiness: CompositeReadinessV1; currentApplicationId: number; target: CompositeCaptureTargetV1; backend: CompositeCaptureBackendV1; checksum?: (blob: Blob) => Promise<string> | string }>): Promise<CompositeCaptureResult> {
  const { surface, readiness } = input;
  const surfaceValidation = validateCompositeExportSurface(surface);
  if (!surfaceValidation.ok) return Promise.resolve(surfaceValidation);
  if (readiness.applicationId !== surface.exactFrame.applicationId || input.currentApplicationId !== surface.exactFrame.applicationId) return Promise.resolve(fail("CAPTURE_STALE_FRAME", "composite application identity is stale"));
  if (readiness.status !== "READY") return Promise.resolve(fail(readiness.reasons.includes("FONT_NOT_READY") ? "FONT_NOT_READY" : "EXPORT_NOT_READY", ...readiness.reasons));
  if (!input.backend.supports(surface)) return Promise.resolve(fail("COMPOSITE_CAPTURE_UNAVAILABLE", "capture backend does not support the requested surface"));
  if (input.target.width !== surface.exactFrame.width * surface.exactFrame.pixelRatio || input.target.height !== surface.exactFrame.height * surface.exactFrame.pixelRatio) return Promise.resolve(fail("COMPOSITE_CAPTURE_UNAVAILABLE", "export target dimensions do not match exact-frame DPR dimensions"));
  return input.backend.capture(input.target, surface).then(async (blob) => {
    if (!blob || blob.size <= 0) return fail("CAPTURE_ENCODING_FAILED", "composite backend returned an empty artifact");
    const checksum = input.checksum ? await input.checksum(blob) : undefined;
    const metadata: CompositeFrameMetadataV1 = { schemaVersion: "1", exportSurface: surface.exportSurface, format: surface.background.mode === "transparent" ? "pngTransparent" : "png", mimeType: "image/png", width: surface.exactFrame.width * surface.exactFrame.pixelRatio, height: surface.exactFrame.height * surface.exactFrame.pixelRatio, pixelRatio: surface.exactFrame.pixelRatio, applicationId: surface.exactFrame.applicationId, ownerId: surface.exactFrame.ownerId, timelineId: surface.exactFrame.timelineId, timeSeconds: surface.exactFrame.timeSeconds, ...(surface.exactFrame.frameIndex === undefined ? {} : { frameIndex: surface.exactFrame.frameIndex }), ...(surface.exactFrame.fps === undefined ? {} : { fps: surface.exactFrame.fps }), teachingPlanId: surface.teachingSnapshot.teachingPlanId, chapterProgramId: surface.teachingSnapshot.chapterProgramId, teachingChapterId: surface.teachingText.chapterId, audience: surface.teachingSnapshot.audience, requestMode: surface.teachingSnapshot.requestMode, provenanceRefs: surface.provenanceRefs, byteLength: blob.size, ...(checksum ? { checksum } : {}), backend: input.backend.backendId };
    return { ok: true as const, artifact: { metadata, blob } };
  }).catch((error) => fail("CAPTURE_ENCODING_FAILED", error instanceof Error ? error.message : String(error)));
}

export const controlledElementScreenshotBackend: CompositeCaptureBackendV1 = { backendId: "controlled-element-screenshot", supports: (surface) => surface.exportSurface === "SCENE_WITH_TEACHING_OVERLAY" && (surface.background.mode === "opaque" || surface.background.mode === "transparent"), capture: (target, surface) => target.screenshot({ background: surface.background.mode }) };

export function serializeCompositeSurface(surface: CompositeExportSurfaceV1): string { return JSON.stringify(surface); }
export function serializeCompositeReadiness(readiness: CompositeReadinessV1): string { return JSON.stringify(readiness); }
export function serializeCompositeMetadata(metadata: CompositeFrameMetadataV1): string { return JSON.stringify(metadata); }
