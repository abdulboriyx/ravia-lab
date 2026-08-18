/** F3-C: portable package/export declarations. No renderer or encoding implementation. */
import type { ProvenanceSourceId } from "./scientific-fidelity-provenance.ts";

export const exportFormats = ["png", "pngTransparent", "mp4", "webm", "slidePackage", "embed", "glbSubset", "sceneJson"] as const;
export type ExportFormat = (typeof exportFormats)[number];
export const exportAssetKinds = ["image", "video", "slideImage", "slideManifest", "embedManifest", "model", "scene"] as const;
export type ExportAssetKind = (typeof exportAssetKinds)[number];
export const provenanceInclusionModes = ["none", "references", "full"] as const;
export type ProvenanceInclusionMode = (typeof provenanceInclusionModes)[number];
export const labelInclusionModes = ["none", "requested", "all"] as const;
export type LabelInclusionMode = (typeof labelInclusionModes)[number];

export type ScenePackageMetadata = {
  schemaVersion: "1";
  packageId: string;
  sceneId: string;
  sceneVersion: string;
  sceneHash: string;
  /** Placeholders identify a reproducible runtime without carrying live objects. */
  runtime: { rendererVersion: string; runtimeVersion: string };
};
export type CitationReference = { citationId: string; text: string; sourceId?: string };
export type LicenseReference = { licenseId: string; label: string; url?: string; requiresAttribution: boolean };
export type ScenePackage = {
  metadata: ScenePackageMetadata;
  provenanceSourceIds: ProvenanceSourceId[];
  citations: CitationReference[];
  licenses: LicenseReference[];
};

/** Content-addressed package asset; uri is package-relative, never a live renderer handle. */
export type ExportAssetReference = {
  assetId: string;
  kind: ExportAssetKind;
  packagePath: string;
  contentHash: string;
  citationIds?: string[];
  licenseIds?: string[];
};
export type ExportResolution = { width: number; height: number; aspectRatio?: string };
export type ExportBackground = { mode: "opaque" | "transparent"; color?: string };
export type ExportTimelineSelection =
  | { mode: "frame"; frame: number; fps: number }
  | { mode: "range"; startFrame: number; endFrame: number; fps: number };
export type ExportInclusion = { labels: LabelInclusionMode; provenance: ProvenanceInclusionMode; citations: "none" | "included"; licenses: "none" | "included" };
export type ExportRequest = {
  requestId: string;
  packageId: string;
  sceneVersion: string;
  sceneHash: string;
  format: ExportFormat;
  resolution: ExportResolution;
  background: ExportBackground;
  timeline: ExportTimelineSelection;
  inclusion: ExportInclusion;
};
export type OutputCapability = { format: ExportFormat; supportsTransparency: boolean; supportsTimelineRange: boolean; assetKinds: ExportAssetKind[] };
export type ExportOmission = { category: "animation" | "alpha" | "labels" | "provenance" | "asset"; reason: string };
export type ExportManifest = {
  manifestVersion: "1";
  requestId: string;
  packageId: string;
  sceneVersion: string;
  sceneHash: string;
  format: ExportFormat;
  assets: ExportAssetReference[];
  provenanceInclusion: ProvenanceInclusionMode;
  omissions: ExportOmission[];
};

export const plannedOutputCapabilities: readonly OutputCapability[] = [
  { format: "png", supportsTransparency: false, supportsTimelineRange: false, assetKinds: ["image"] },
  { format: "pngTransparent", supportsTransparency: true, supportsTimelineRange: false, assetKinds: ["image"] },
  { format: "mp4", supportsTransparency: false, supportsTimelineRange: true, assetKinds: ["video"] },
  { format: "webm", supportsTransparency: true, supportsTimelineRange: true, assetKinds: ["video"] },
  { format: "slidePackage", supportsTransparency: true, supportsTimelineRange: false, assetKinds: ["slideImage", "slideManifest"] },
  { format: "embed", supportsTransparency: true, supportsTimelineRange: true, assetKinds: ["embedManifest"] },
  { format: "glbSubset", supportsTransparency: true, supportsTimelineRange: false, assetKinds: ["model"] },
  { format: "sceneJson", supportsTransparency: true, supportsTimelineRange: true, assetKinds: ["scene"] },
] as const;

export type ExportValidationIssue = { path: string; message: string };
export type ExportValidationResult = { valid: true; issues: [] } | { valid: false; issues: ExportValidationIssue[] };
type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const id = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const hash = /^(?:sha256:[a-f0-9]{64}|pending:[a-z0-9][a-z0-9-]*)$/;
const nonEmpty = (value: unknown) => typeof value === "string" && value.length > 0;
const positiveInt = (value: unknown) => Number.isInteger(value) && Number(value) > 0;
const checkKeys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const keys = new Set(allowed); Object.keys(value).forEach((key) => { if (!keys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); }); return true;
};
const validateStableId = (value: unknown, path: string, issue: (path: string, message: string) => void) => { if (!nonEmpty(value) || !id.test(String(value))) issue(path, "must be a stable kebab-case ID"); };
const validateHash = (value: unknown, path: string, issue: (path: string, message: string) => void) => { if (!nonEmpty(value) || !hash.test(String(value))) issue(path, "must be sha256:<64 lowercase hex> or pending:<stable-id>"); };

export function validateScenePackage(scenePackage: ScenePackage): ExportValidationResult {
  const issues: ExportValidationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(scenePackage, "package", ["metadata", "provenanceSourceIds", "citations", "licenses"], issue)) return { valid: false, issues };
  const value = scenePackage as unknown as RecordValue;
  if (checkKeys(value.metadata, "package.metadata", ["schemaVersion", "packageId", "sceneId", "sceneVersion", "sceneHash", "runtime"], issue)) {
    const metadata = value.metadata as RecordValue;
    if (metadata.schemaVersion !== "1") issue("package.metadata.schemaVersion", "must be 1");
    ["packageId", "sceneId"].forEach((key) => validateStableId(metadata[key], `package.metadata.${key}`, issue));
    if (!nonEmpty(metadata.sceneVersion)) issue("package.metadata.sceneVersion", "is required"); validateHash(metadata.sceneHash, "package.metadata.sceneHash", issue);
    if (checkKeys(metadata.runtime, "package.metadata.runtime", ["rendererVersion", "runtimeVersion"], issue)) ["rendererVersion", "runtimeVersion"].forEach((key) => { if (!nonEmpty((metadata.runtime as RecordValue)[key])) issue(`package.metadata.runtime.${key}`, "is required"); });
  }
  const citations = Array.isArray(value.citations) ? value.citations : (issue("package.citations", "must be an array"), []);
  const sources = Array.isArray(value.provenanceSourceIds) ? value.provenanceSourceIds : (issue("package.provenanceSourceIds", "must be an array"), []);
  const sourceIds = new Set<string>(); sources.forEach((sourceId, index) => { validateStableId(sourceId, `package.provenanceSourceIds[${index}]`, issue); if (sourceIds.has(String(sourceId))) issue(`package.provenanceSourceIds[${index}]`, "must be unique"); sourceIds.add(String(sourceId)); });
  const licenses = Array.isArray(value.licenses) ? value.licenses : (issue("package.licenses", "must be an array"), []);
  const seenCitations = new Set<string>(); citations.forEach((citation, index) => { const path = `package.citations[${index}]`; if (!checkKeys(citation, path, ["citationId", "text", "sourceId"], issue)) return; const item = citation as RecordValue; validateStableId(item.citationId, `${path}.citationId`, issue); if (seenCitations.has(String(item.citationId))) issue(`${path}.citationId`, "must be unique"); seenCitations.add(String(item.citationId)); if (!nonEmpty(item.text)) issue(`${path}.text`, "is required"); if (item.sourceId !== undefined && !sourceIds.has(String(item.sourceId))) issue(`${path}.sourceId`, "must reference a declared F2 provenance source"); });
  const seenLicenses = new Set<string>(); licenses.forEach((license, index) => { const path = `package.licenses[${index}]`; if (!checkKeys(license, path, ["licenseId", "label", "url", "requiresAttribution"], issue)) return; const item = license as RecordValue; validateStableId(item.licenseId, `${path}.licenseId`, issue); if (seenLicenses.has(String(item.licenseId))) issue(`${path}.licenseId`, "must be unique"); seenLicenses.add(String(item.licenseId)); if (!nonEmpty(item.label)) issue(`${path}.label`, "is required"); if (item.url !== undefined && (!nonEmpty(item.url) || !/^https?:\/\//.test(String(item.url)))) issue(`${path}.url`, "must be an http(s) URL"); if (typeof item.requiresAttribution !== "boolean") issue(`${path}.requiresAttribution`, "must be a boolean"); });
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function validateExportRequest(request: ExportRequest, scenePackage: ScenePackage, capabilities = plannedOutputCapabilities): ExportValidationResult {
  const issues: ExportValidationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message });
  const packageResult = validateScenePackage(scenePackage); if (!packageResult.valid) issues.push(...packageResult.issues.map((entry) => ({ ...entry, path: `scenePackage.${entry.path}` })));
  if (!checkKeys(request, "request", ["requestId", "packageId", "sceneVersion", "sceneHash", "format", "resolution", "background", "timeline", "inclusion"], issue)) return { valid: false, issues };
  const value = request as unknown as RecordValue; validateStableId(value.requestId, "request.requestId", issue);
  const metadata = scenePackage.metadata;
  if (value.packageId !== metadata.packageId || value.sceneVersion !== metadata.sceneVersion || value.sceneHash !== metadata.sceneHash) issue("request", "must reference the package ID, scene version, and scene hash exactly");
  const capability = capabilities.find((candidate) => candidate.format === value.format); if (!capability) issue("request.format", "is unsupported");
  if (checkKeys(value.resolution, "request.resolution", ["width", "height", "aspectRatio"], issue)) { const resolution = value.resolution as RecordValue; if (!positiveInt(resolution.width) || Number(resolution.width) > 16384) issue("request.resolution.width", "must be an integer from 1 to 16384"); if (!positiveInt(resolution.height) || Number(resolution.height) > 16384) issue("request.resolution.height", "must be an integer from 1 to 16384"); if (resolution.aspectRatio !== undefined && (!nonEmpty(resolution.aspectRatio) || !/^\d+:\d+$/.test(String(resolution.aspectRatio)))) issue("request.resolution.aspectRatio", "must be a ratio such as 16:9"); }
  if (checkKeys(value.background, "request.background", ["mode", "color"], issue)) { const background = value.background as RecordValue; if (!["opaque", "transparent"].includes(String(background.mode))) issue("request.background.mode", "is invalid"); if (background.mode === "transparent" && background.color !== undefined) issue("request.background.color", "is not valid with transparent background"); if (background.mode === "opaque" && background.color !== undefined && (!nonEmpty(background.color) || !/^#[0-9a-fA-F]{6}$/.test(String(background.color)))) issue("request.background.color", "must be a #RRGGBB color"); if (background.mode === "transparent" && capability && !capability.supportsTransparency) issue("request.background", "is unsupported by this format"); }
  if (checkKeys(value.timeline, "request.timeline", ["mode", "frame", "startFrame", "endFrame", "fps"], issue)) { const timeline = value.timeline as RecordValue; if (!["frame", "range"].includes(String(timeline.mode))) issue("request.timeline.mode", "is invalid"); if (!positiveInt(timeline.fps) || Number(timeline.fps) > 240) issue("request.timeline.fps", "must be an integer from 1 to 240"); if (timeline.mode === "frame" && (!Number.isInteger(timeline.frame) || Number(timeline.frame) < 0 || timeline.startFrame !== undefined || timeline.endFrame !== undefined)) issue("request.timeline", "frame mode requires one non-negative frame"); if (timeline.mode === "range" && (!Number.isInteger(timeline.startFrame) || !Number.isInteger(timeline.endFrame) || Number(timeline.startFrame) < 0 || Number(timeline.endFrame) < Number(timeline.startFrame) || timeline.frame !== undefined)) issue("request.timeline", "range mode requires ordered non-negative start/end frames"); if (timeline.mode === "range" && capability && !capability.supportsTimelineRange) issue("request.timeline", "range is unsupported by this format"); }
  if (checkKeys(value.inclusion, "request.inclusion", ["labels", "provenance", "citations", "licenses"], issue)) { const inclusion = value.inclusion as RecordValue; if (!labelInclusionModes.includes(inclusion.labels as LabelInclusionMode)) issue("request.inclusion.labels", "is invalid"); if (!provenanceInclusionModes.includes(inclusion.provenance as ProvenanceInclusionMode)) issue("request.inclusion.provenance", "is invalid"); if (!["none", "included"].includes(String(inclusion.citations)) || !["none", "included"].includes(String(inclusion.licenses))) issue("request.inclusion", "has invalid citation or license mode"); if (inclusion.provenance === "full" && (inclusion.citations !== "included" || inclusion.licenses !== "included")) issue("request.inclusion", "full provenance requires citations and licenses"); if (scenePackage.licenses.some((license) => license.requiresAttribution) && inclusion.licenses !== "included") issue("request.inclusion.licenses", "must include required-attribution licenses"); }
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function validateExportManifest(manifest: ExportManifest, request: ExportRequest, scenePackage: ScenePackage): ExportValidationResult {
  const issues: ExportValidationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(manifest, "manifest", ["manifestVersion", "requestId", "packageId", "sceneVersion", "sceneHash", "format", "assets", "provenanceInclusion", "omissions"], issue)) return { valid: false, issues };
  const value = manifest as unknown as RecordValue; if (value.manifestVersion !== "1") issue("manifest.manifestVersion", "must be 1"); if (value.requestId !== request.requestId || value.packageId !== scenePackage.metadata.packageId || value.sceneVersion !== scenePackage.metadata.sceneVersion || value.sceneHash !== scenePackage.metadata.sceneHash || value.format !== request.format) issue("manifest", "must exactly identify its request and scene package");
  if (!provenanceInclusionModes.includes(value.provenanceInclusion as ProvenanceInclusionMode)) issue("manifest.provenanceInclusion", "is invalid");
  const citations = new Set(scenePackage.citations.map((citation) => citation.citationId)); const licenses = new Set(scenePackage.licenses.map((license) => license.licenseId));
  const assets = Array.isArray(value.assets) ? value.assets : (issue("manifest.assets", "must be an array"), []); const assetIds = new Set<string>(); assets.forEach((asset, index) => { const path = `manifest.assets[${index}]`; if (!checkKeys(asset, path, ["assetId", "kind", "packagePath", "contentHash", "citationIds", "licenseIds"], issue)) return; const item = asset as RecordValue; validateStableId(item.assetId, `${path}.assetId`, issue); if (assetIds.has(String(item.assetId))) issue(`${path}.assetId`, "must be unique"); assetIds.add(String(item.assetId)); if (!exportAssetKinds.includes(item.kind as ExportAssetKind)) issue(`${path}.kind`, "is invalid"); if (!nonEmpty(item.packagePath) || String(item.packagePath).startsWith("/") || String(item.packagePath).includes("..")) issue(`${path}.packagePath`, "must be a safe package-relative path"); validateHash(item.contentHash, `${path}.contentHash`, issue); ["citationIds", "licenseIds"].forEach((key) => { if (item[key] !== undefined && (!Array.isArray(item[key]) || (item[key] as unknown[]).some((ref) => typeof ref !== "string" || !(key === "citationIds" ? citations : licenses).has(ref)))) issue(`${path}.${key}`, "contains an invalid provenance or license reference"); }); });
  const omissions = Array.isArray(value.omissions) ? value.omissions : (issue("manifest.omissions", "must be an array"), []); omissions.forEach((omission, index) => { const path = `manifest.omissions[${index}]`; if (!checkKeys(omission, path, ["category", "reason"], issue)) return; const item = omission as RecordValue; if (!["animation", "alpha", "labels", "provenance", "asset"].includes(String(item.category))) issue(`${path}.category`, "is invalid"); if (!nonEmpty(item.reason)) issue(`${path}.reason`, "is required"); });
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}
