/** B-B additive export request extension. Frozen v1 requests remain valid. */
import { validateExportRequest, type ExportRequest, type ExportValidationIssue, type ExportValidationResult } from "./scene-export-contract.ts";
import type { TeachingReference } from "./teaching-plan.ts";

export const exportSurfaceKindsV2 = ["SCENE_CANVAS", "SCENE_WITH_TEACHING_OVERLAY"] as const;
export type ExportSurfaceKindV2 = typeof exportSurfaceKindsV2[number];
export const teachingOverlayInclusionModesV2 = ["none", "text", "textAndAnchoredCallouts"] as const;
export type TeachingOverlayInclusionModeV2 = typeof teachingOverlayInclusionModesV2[number];

export type TeachingExportIdentityV2 = Readonly<{
  teachingPlanId: string;
  chapterProgramId: string;
  timeSeconds: number;
  activeChapterIds: readonly string[];
  audience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  requestMode: "show" | "explain" | "compare" | "why" | "misconceptionCorrection";
}>;

export type ExportRequestV2 = Readonly<ExportRequest & {
  schemaVersion: "2";
  surface: ExportSurfaceKindV2;
  teaching?: Readonly<{
    overlay: TeachingOverlayInclusionModeV2;
    includeProvenance?: boolean;
    includeCaptions?: boolean;
    captionPolicy?: "NONE" | "SIDECAR" | "BURNED_IN";
    snapshot: TeachingExportIdentityV2;
    textBundle: Readonly<{ teachingPlanId: string; chapterProgramId: string; timeSeconds: number; chapterId: string; audience: TeachingExportIdentityV2["audience"]; requestMode: TeachingExportIdentityV2["requestMode"] }>;
    provenanceRefs?: readonly TeachingReference[];
  }>;
}>;

const id = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const stable = (value: unknown): value is string => typeof value === "string" && id.test(value);
const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const issue = (path: string, message: string): ExportValidationIssue => ({ path, message });

/** Validates v2 without changing the frozen v1 validator or semantics. */
export function validateExportRequestV2(request: ExportRequestV2, scenePackage: Parameters<typeof validateExportRequest>[1]): ExportValidationResult {
  const issues: ExportValidationIssue[] = [];
  if (request.schemaVersion !== "2") issues.push(issue("request.schemaVersion", "must be 2"));
  if (!exportSurfaceKindsV2.includes(request.surface)) issues.push(issue("request.surface", "is unsupported"));
  if (request.surface === "SCENE_WITH_TEACHING_OVERLAY" && request.format !== "png" && request.format !== "pngTransparent") issues.push(issue("request.surface", "teaching overlay currently supports PNG formats only"));
  if (request.surface === "SCENE_CANVAS" && request.teaching !== undefined) issues.push(issue("request.teaching", "is not allowed for SCENE_CANVAS"));
  if (request.surface === "SCENE_WITH_TEACHING_OVERLAY" && !request.teaching) issues.push(issue("request.teaching", "is required for SCENE_WITH_TEACHING_OVERLAY"));
  const core: ExportRequest = { requestId: request.requestId, packageId: request.packageId, sceneVersion: request.sceneVersion, sceneHash: request.sceneHash, format: request.format, resolution: request.resolution, background: request.background, timeline: request.timeline, inclusion: request.inclusion };
  const base = validateExportRequest(core, scenePackage);
  if (!base.valid) issues.push(...base.issues);
  const teaching = request.teaching;
  if (teaching) {
    if (!teachingOverlayInclusionModesV2.includes(teaching.overlay)) issues.push(issue("request.teaching.overlay", "is unsupported"));
    if (teaching.includeProvenance !== undefined && typeof teaching.includeProvenance !== "boolean") issues.push(issue("request.teaching.includeProvenance", "must be a boolean"));
    if (teaching.includeCaptions !== undefined && typeof teaching.includeCaptions !== "boolean") issues.push(issue("request.teaching.includeCaptions", "must be a boolean"));
    if (teaching.captionPolicy !== undefined && !["NONE", "SIDECAR", "BURNED_IN"].includes(teaching.captionPolicy)) issues.push(issue("request.teaching.captionPolicy", "is unsupported"));
    const snapshot = teaching.snapshot;
    if (!stable(snapshot.teachingPlanId) || !stable(snapshot.chapterProgramId) || !finiteNonNegative(snapshot.timeSeconds) || !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(snapshot.audience) || !["show", "explain", "compare", "why", "misconceptionCorrection"].includes(snapshot.requestMode)) issues.push(issue("request.teaching.snapshot", "has invalid teaching identity fields"));
    if (snapshot.activeChapterIds.some((chapterId) => !stable(chapterId))) issues.push(issue("request.teaching.snapshot.activeChapterIds", "must contain stable IDs"));
    const text = teaching.textBundle;
    if (!stable(text.teachingPlanId) || !stable(text.chapterProgramId) || !finiteNonNegative(text.timeSeconds) || !stable(text.chapterId) || text.audience !== snapshot.audience || text.requestMode !== snapshot.requestMode) issues.push(issue("request.teaching.textBundle", "must identify the same bounded teaching state as snapshot"));
  }
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function serializeExportRequestV2(request: ExportRequestV2): string { return JSON.stringify(request); }
