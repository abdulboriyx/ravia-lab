/** B-F: portable canonical scene/teaching package and viewer bootstrap. */

import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { validateScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { timelineContextFromScene, validateScientificTimeline } from "./scientific-timeline.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";
import { validateTeachingPlan } from "./teaching-plan.ts";
import type { TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import type { TeachingSnapshotV1 } from "./teaching-snapshot.ts";
import type { TeachingTextBundleV1, NarrationCueProgramV1 } from "./teaching-text.ts";
import { validateCellularScientificScene, type CellularScientificExtensionV1 } from "./cellular-localization.ts";
import { validateMembraneProteinTopologyContract, type MembraneProteinTopologyV1 } from "./membrane-protein-topology.ts";
import { validateIntracellularTransportProgram, type IntracellularTransportProgramV1 } from "./intracellular-transport.ts";
import { validateCellularSignalingProgram, type CellularSignalingProgramV1 } from "./cellular-signaling.ts";

export type PackageFailureCodeV1 = "SCENE_PACKAGE_INVALID" | "SCENE_PACKAGE_VERSION_UNSUPPORTED" | "SCENE_PACKAGE_REFERENCE_MISSING" | "SCENE_PACKAGE_ASSET_MISSING" | "SCENE_PACKAGE_ASSET_HASH_MISMATCH" | "SCENE_PACKAGE_DEPENDENCY_INVALID" | "EMBED_BOOTSTRAP_INVALID" | "EMBED_RUNTIME_INCOMPATIBLE" | "PACKAGE_SIZE_LIMIT_EXCEEDED";
export type PackageFailureV1 = Readonly<{ ok: false; code: PackageFailureCodeV1; reasons: readonly string[] }>;

export type AssetManifestEntryV1 = Readonly<{ assetId: string; type: "scene" | "timeline" | "teaching" | "text" | "caption" | "chapter" | "png" | "slideManifest" | "video" | "font" | "source"; contentHash: string; mimeType: string; byteLength?: number; logicalRole: string; required: boolean; dependencies?: readonly string[]; provenanceRefs?: readonly TeachingReference[] }>;
export type AssetManifestV1 = Readonly<{ schemaVersion: "1"; assets: readonly AssetManifestEntryV1[] }>;
export type PackageArtifactRefV1 = Readonly<{ assetId: string; status: "AVAILABLE" | "UNAVAILABLE"; failureCode?: string }>;
export type RepresentationCapabilityV1 = Readonly<{ owner: "PROCEDURAL" | "MOLSTAR"; interactiveView: "SUPPORTED" | "UNSUPPORTED"; exactFrameExport: "SUPPORTED" | "UNSUPPORTED_V1"; limitationReasons?: readonly string[]; runtimeRequirement?: string }>;
export type PackageProvenanceManifestV1 = Readonly<{ sourceRefs: readonly TeachingReference[]; fidelityRefs: readonly TeachingReference[]; citationRefs: readonly string[]; licenseRefs: readonly string[] }>;
export type PackageCompatibilityV1 = Readonly<{ sceneSpec: "1"; scientificTimeline: "1"; teachingPlan: readonly ("1" | "2" | "3")[]; teachingRuntime: "1"; exportPackage: "1"; requiredRuntimeVersion: string }>;
export type ScenePackageV1 = Readonly<{
  schemaVersion: "1";
  packageId: string;
  packageVersion: "1";
  sceneId: string;
  capabilityId?: string;
  ownerId?: string;
  representation?: RepresentationCapabilityV1;
  scientificSceneSpec: ScientificSceneSpec;
  /** Additive cellular payload; ScientificSceneSpec v1 remains the base contract. */
  cellularScientificExtension?: CellularScientificExtensionV1;
  membraneProteinTopology?: MembraneProteinTopologyV1;
  intracellularTransportProgram?: IntracellularTransportProgramV1;
  cellularSignalingProgram?: CellularSignalingProgramV1;
  scientificTimeline?: ScientificTimeline;
  teaching?: Readonly<{ plan: TeachingPlan; chapterProgram: TeachingChapterProgramV1; audiencePrograms: readonly AudienceTeachingProgramV1[]; selectedAudience?: AudienceTeachingProgramV1["audience"]; selectedSnapshot?: TeachingSnapshotV1; textBundles?: readonly TeachingTextBundleV1[]; narration?: NarrationCueProgramV1 }>;
  viewer: ViewerBootstrapV1;
  provenance: PackageProvenanceManifestV1;
  assets: AssetManifestV1;
  optionalArtifacts: readonly PackageArtifactRefV1[];
  compatibility: PackageCompatibilityV1;
  support: Readonly<{ status: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED"; limitations: readonly string[] }>;
  integrity: Readonly<{ semanticHash: string; canonicalPayloadHash: string }>;
}>;
export type ViewerBootstrapV1 = Readonly<{ schemaVersion: "1"; packageVersion: "1"; requiredRuntimeVersion: string; sceneOwner?: string; capabilityId?: string; initialView: "STATIC" | "TIME_FOLLOWING" | "MANUAL_CHAPTER"; initialTimeSeconds?: number; initialFrameIndex?: number; teachingEnabled: boolean; audience?: AudienceTeachingProgramV1["audience"]; manualChapterId?: string; playbackEnabled: boolean; theme?: "LIGHT" | "DARK"; background?: "OPAQUE" | "TRANSPARENT"; supportedControls: readonly ("PLAY" | "SEEK" | "CHAPTER_NAVIGATION" | "AUDIENCE_SELECT")[]; assetResolution: "BUNDLED" | "CONTENT_ADDRESSED" }>;
export type EmbedPackageV1 = Readonly<{ schemaVersion: "1"; package: ScenePackageV1; bootstrap: ViewerBootstrapV1; manifest: Readonly<{ packageId: string; packageHash: string; runtimeVersion: string; mimeType: "application/json"; byteLength?: number }> }>;
export type ScenePackageInputV1 = Readonly<{
  packageId: string;
  scientificSceneSpec: ScientificSceneSpec;
  cellularScientificExtension?: CellularScientificExtensionV1;
  membraneProteinTopology?: MembraneProteinTopologyV1;
  intracellularTransportProgram?: IntracellularTransportProgramV1;
  cellularSignalingProgram?: CellularSignalingProgramV1;
  scientificTimeline?: ScientificTimeline;
  teaching?: ScenePackageV1["teaching"];
  viewer: ViewerBootstrapV1;
  capabilityId?: string;
  ownerId?: string;
  representation?: RepresentationCapabilityV1;
  provenance?: Partial<PackageProvenanceManifestV1>;
  assets?: readonly AssetManifestEntryV1[];
  optionalArtifacts?: readonly PackageArtifactRefV1[];
  requiredRuntimeVersion?: string;
  limitations?: readonly string[];
}>;

const fail = (code: PackageFailureCodeV1, ...reasons: string[]): PackageFailureV1 => ({ ok: false, code, reasons });
const id = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const hash = /^(?:sha256:[a-f0-9]{64}|pending:[a-z0-9][a-z0-9-]*)$/;
const mime = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i;
const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const refKey = (value: unknown) => JSON.stringify(value);
const uniqueStrings = (values: readonly string[]) => [...new Set(values)].sort();
const uniqueRefs = (values: readonly TeachingReference[]) => [...values].sort((a, b) => refKey(a).localeCompare(refKey(b))).filter((value, index, all) => index === all.findIndex((other) => refKey(other) === refKey(value)));

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    const sorted = value.map(canonical);
    return sorted.sort((a, b) => {
      const key = (item: unknown) => { if (!item || typeof item !== "object") return JSON.stringify(item); const record = item as Record<string, unknown>; const candidate = Object.entries(record).find(([name]) => name === "id" || name.endsWith("Id")); return candidate ? `${candidate[0]}:${String(candidate[1])}` : JSON.stringify(item); };
      return key(a).localeCompare(key(b));
    });
  }
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
  return value;
}
function canonicalJson(value: unknown): string { return JSON.stringify(canonical(value)); }
async function digest(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const bytes = await subtle.digest("SHA-256", new TextEncoder().encode(value));
    return `sha256:${[...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  let hashValue = 2166136261;
  for (const char of value) hashValue = Math.imul(hashValue ^ char.charCodeAt(0), 16777619);
  return `pending:semantic-${(hashValue >>> 0).toString(16)}`;
}

function validateAssets(manifest: AssetManifestV1): PackageFailureV1 | undefined {
  const seen = new Set<string>();
  for (const asset of manifest.assets) {
    if (!id.test(asset.assetId) || seen.has(asset.assetId)) return fail("SCENE_PACKAGE_ASSET_MISSING", `asset ${asset.assetId} is missing or duplicated`);
    seen.add(asset.assetId);
    if (!hash.test(asset.contentHash)) return fail("SCENE_PACKAGE_ASSET_HASH_MISMATCH", `asset ${asset.assetId} has an invalid content hash`);
    if (!mime.test(asset.mimeType) || !asset.logicalRole || (asset.byteLength !== undefined && (!Number.isInteger(asset.byteLength) || asset.byteLength < 0))) return fail("SCENE_PACKAGE_INVALID", `asset ${asset.assetId} metadata is invalid`);
    for (const dependency of asset.dependencies ?? []) if (!manifest.assets.some((candidate) => candidate.assetId === dependency)) return fail("SCENE_PACKAGE_DEPENDENCY_INVALID", `asset ${asset.assetId} depends on missing ${dependency}`);
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (assetId: string): boolean => { if (visiting.has(assetId)) return false; if (visited.has(assetId)) return true; visiting.add(assetId); const asset = manifest.assets.find((candidate) => candidate.assetId === assetId); for (const dependency of asset?.dependencies ?? []) if (!visit(dependency)) return false; visiting.delete(assetId); visited.add(assetId); return true; };
  if (manifest.assets.some((asset) => !visit(asset.assetId))) return fail("SCENE_PACKAGE_DEPENDENCY_INVALID", "asset dependency cycle");
  return undefined;
}

export function validateViewerBootstrap(bootstrap: ViewerBootstrapV1, scene: ScientificSceneSpec, timeline?: ScientificTimeline, teaching?: ScenePackageV1["teaching"]): PackageFailureV1 | undefined {
  if (bootstrap.schemaVersion !== "1" || bootstrap.packageVersion !== "1") return fail("EMBED_BOOTSTRAP_INVALID", "unsupported bootstrap schema");
  if (!bootstrap.requiredRuntimeVersion || !["STATIC", "TIME_FOLLOWING", "MANUAL_CHAPTER"].includes(bootstrap.initialView)) return fail("EMBED_BOOTSTRAP_INVALID", "invalid viewer bootstrap");
  if (bootstrap.initialTimeSeconds !== undefined && (!finiteNonNegative(bootstrap.initialTimeSeconds) || (timeline && bootstrap.initialTimeSeconds > timeline.clock.duration))) return fail("EMBED_BOOTSTRAP_INVALID", "initial time is outside the canonical timeline");
  if (bootstrap.initialFrameIndex !== undefined && (!Number.isInteger(bootstrap.initialFrameIndex) || bootstrap.initialFrameIndex < 0)) return fail("EMBED_BOOTSTRAP_INVALID", "initial frame is invalid");
  if (bootstrap.initialView === "TIME_FOLLOWING" && !timeline) return fail("EMBED_BOOTSTRAP_INVALID", "TIME_FOLLOWING requires ScientificTimeline");
  if (bootstrap.manualChapterId && !teaching?.chapterProgram.entries.some((entry) => entry.chapterId === bootstrap.manualChapterId)) return fail("EMBED_BOOTSTRAP_INVALID", "manual chapter is missing");
  if (bootstrap.sceneOwner && !id.test(bootstrap.sceneOwner)) return fail("EMBED_BOOTSTRAP_INVALID", "scene owner is invalid");
  if (bootstrap.capabilityId && !id.test(bootstrap.capabilityId)) return fail("EMBED_BOOTSTRAP_INVALID", "capability is invalid");
  if (!scene.sceneId) return fail("SCENE_PACKAGE_INVALID", "scene ID is missing");
  return undefined;
}

export function validateScenePackage(pkg: ScenePackageV1): PackageFailureV1 | undefined {
  if (pkg.schemaVersion !== "1" || pkg.packageVersion !== "1") return fail("SCENE_PACKAGE_VERSION_UNSUPPORTED", "unsupported ScenePackage version");
  const sceneResult = validateScientificSceneSpec(pkg.scientificSceneSpec);
  if (!sceneResult.valid) return fail("SCENE_PACKAGE_INVALID", ...sceneResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  if (pkg.cellularScientificExtension) {
    const cellularResult = validateCellularScientificScene({ scene: pkg.scientificSceneSpec, cellular: pkg.cellularScientificExtension }, pkg.scientificTimeline);
    if (!cellularResult.valid) return fail("SCENE_PACKAGE_INVALID", ...cellularResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  }
  if (pkg.membraneProteinTopology) { const topologyResult = validateMembraneProteinTopologyContract(pkg.membraneProteinTopology); if (!topologyResult.valid) return fail("SCENE_PACKAGE_INVALID", ...topologyResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (pkg.intracellularTransportProgram) { const transportResult = validateIntracellularTransportProgram(pkg.intracellularTransportProgram); if (!transportResult.valid) return fail("SCENE_PACKAGE_INVALID", ...transportResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (pkg.cellularSignalingProgram) { const signalingResult = validateCellularSignalingProgram(pkg.cellularSignalingProgram); if (!signalingResult.valid) return fail("SCENE_PACKAGE_INVALID", ...signalingResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (pkg.scientificSceneSpec.sceneId !== pkg.sceneId) return fail("SCENE_PACKAGE_REFERENCE_MISSING", "package sceneId does not match ScientificSceneSpec");
  if (pkg.scientificTimeline) { const timelineResult = validateScientificTimeline(pkg.scientificTimeline, timelineContextFromScene(pkg.scientificSceneSpec)); if (!timelineResult.valid) return fail("SCENE_PACKAGE_INVALID", ...timelineResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (pkg.teaching) {
    if (pkg.teaching.plan.sceneId !== pkg.sceneId || pkg.teaching.chapterProgram.sceneId !== pkg.sceneId || pkg.teaching.chapterProgram.planId !== pkg.teaching.plan.planId) return fail("SCENE_PACKAGE_REFERENCE_MISSING", "teaching contracts do not identify the packaged scene/plan");
    const planResult = validateTeachingPlan(pkg.teaching.plan, pkg.scientificSceneSpec, pkg.scientificTimeline, pkg.cellularScientificExtension);
    if (!planResult.valid) return fail("SCENE_PACKAGE_INVALID", ...planResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
    if (pkg.teaching.audiencePrograms.some((program) => program.planId !== pkg.teaching!.plan.planId || program.sceneId !== pkg.sceneId)) return fail("SCENE_PACKAGE_REFERENCE_MISSING", "audience program does not identify the packaged plan");
    if (pkg.teaching.selectedAudience && !pkg.teaching.audiencePrograms.some((program) => program.audience === pkg.teaching!.selectedAudience)) return fail("SCENE_PACKAGE_REFERENCE_MISSING", "selected audience is not packaged");
    if (pkg.teaching.textBundles?.some((bundle) => bundle.teachingPlanId !== pkg.teaching!.plan.planId)) return fail("SCENE_PACKAGE_REFERENCE_MISSING", "text bundle does not identify the packaged plan");
  }
  const assetsFailure = validateAssets(pkg.assets); if (assetsFailure) return assetsFailure;
  const bootstrapFailure = validateViewerBootstrap(pkg.viewer, pkg.scientificSceneSpec, pkg.scientificTimeline, pkg.teaching); if (bootstrapFailure) return bootstrapFailure;
  if (!hash.test(pkg.integrity.semanticHash) || !hash.test(pkg.integrity.canonicalPayloadHash)) return fail("SCENE_PACKAGE_INVALID", "package integrity hashes are invalid");
  return undefined;
}

export async function buildScenePackage(input: ScenePackageInputV1): Promise<Readonly<{ ok: true; package: ScenePackageV1 } | PackageFailureV1>> {
  if (!id.test(input.packageId)) return fail("SCENE_PACKAGE_INVALID", "packageId must be a stable ID");
  const sceneResult = validateScientificSceneSpec(input.scientificSceneSpec); if (!sceneResult.valid) return fail("SCENE_PACKAGE_INVALID", ...sceneResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  if (input.cellularScientificExtension) { const cellularResult = validateCellularScientificScene({ scene: input.scientificSceneSpec, cellular: input.cellularScientificExtension }, input.scientificTimeline); if (!cellularResult.valid) return fail("SCENE_PACKAGE_INVALID", ...cellularResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (input.membraneProteinTopology) { const topologyResult = validateMembraneProteinTopologyContract(input.membraneProteinTopology); if (!topologyResult.valid) return fail("SCENE_PACKAGE_INVALID", ...topologyResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (input.intracellularTransportProgram) { const transportResult = validateIntracellularTransportProgram(input.intracellularTransportProgram); if (!transportResult.valid) return fail("SCENE_PACKAGE_INVALID", ...transportResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (input.cellularSignalingProgram) { const signalingResult = validateCellularSignalingProgram(input.cellularSignalingProgram); if (!signalingResult.valid) return fail("SCENE_PACKAGE_INVALID", ...signalingResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  if (input.scientificTimeline) { const timelineResult = validateScientificTimeline(input.scientificTimeline, timelineContextFromScene(input.scientificSceneSpec)); if (!timelineResult.valid) return fail("SCENE_PACKAGE_INVALID", ...timelineResult.issues.map((issue) => `${issue.path}: ${issue.message}`)); }
  const assets: AssetManifestV1 = { schemaVersion: "1", assets: [...(input.assets ?? [])].sort((a, b) => a.assetId.localeCompare(b.assetId)) };
  const assetFailure = validateAssets(assets); if (assetFailure) return assetFailure;
  const runtime = input.requiredRuntimeVersion ?? "teaching-runtime-v1";
  const optionalArtifacts = [...(input.optionalArtifacts ?? [])].sort((a, b) => a.assetId.localeCompare(b.assetId));
  const limitations = [...(input.limitations ?? [])].sort();
  const partial = limitations.length > 0 || optionalArtifacts.some((artifact) => artifact.status === "UNAVAILABLE");
  const packageWithoutIntegrity = { schemaVersion: "1" as const, packageId: input.packageId, packageVersion: "1" as const, sceneId: input.scientificSceneSpec.sceneId, ...(input.capabilityId ? { capabilityId: input.capabilityId } : {}), ...(input.ownerId ? { ownerId: input.ownerId } : {}), ...(input.representation ? { representation: input.representation } : {}), scientificSceneSpec: input.scientificSceneSpec, ...(input.cellularScientificExtension ? { cellularScientificExtension: input.cellularScientificExtension } : {}), ...(input.membraneProteinTopology ? { membraneProteinTopology: input.membraneProteinTopology } : {}), ...(input.intracellularTransportProgram ? { intracellularTransportProgram: input.intracellularTransportProgram } : {}), ...(input.cellularSignalingProgram ? { cellularSignalingProgram: input.cellularSignalingProgram } : {}), ...(input.scientificTimeline ? { scientificTimeline: input.scientificTimeline } : {}), ...(input.teaching ? { teaching: input.teaching } : {}), viewer: input.viewer, provenance: { sourceRefs: uniqueRefs(input.provenance?.sourceRefs ?? []), fidelityRefs: uniqueRefs(input.provenance?.fidelityRefs ?? []), citationRefs: uniqueStrings(input.provenance?.citationRefs ?? []), licenseRefs: uniqueStrings(input.provenance?.licenseRefs ?? []) }, assets, optionalArtifacts, compatibility: { sceneSpec: "1" as const, scientificTimeline: "1" as const, teachingPlan: ["1", "2", "3"] as const, teachingRuntime: "1" as const, exportPackage: "1" as const, requiredRuntimeVersion: runtime }, support: { status: partial ? "PARTIAL" as const : "SUPPORTED" as const, limitations } };
  const payload = canonicalJson(packageWithoutIntegrity);
  const semanticHash = await digest(payload);
  const pkg: ScenePackageV1 = { ...packageWithoutIntegrity, integrity: { semanticHash, canonicalPayloadHash: await digest(payload) } };
  const failure = validateScenePackage(pkg); return failure ?? { ok: true, package: pkg };
}

export function resolveViewerBootstrap(pkg: ScenePackageV1): Readonly<{ ok: true; bootstrap: ViewerBootstrapV1 } | PackageFailureV1> { const failure = validateScenePackage(pkg); return failure ? failure : { ok: true, bootstrap: pkg.viewer }; }
export async function buildEmbedPackage(pkg: ScenePackageV1): Promise<Readonly<{ ok: true; embed: EmbedPackageV1 } | PackageFailureV1>> { const failure = validateScenePackage(pkg); if (failure) return failure; const packageHash = pkg.integrity.semanticHash; const embed: EmbedPackageV1 = { schemaVersion: "1", package: pkg, bootstrap: pkg.viewer, manifest: { packageId: pkg.packageId, packageHash, runtimeVersion: pkg.compatibility.requiredRuntimeVersion, mimeType: "application/json" } }; return { ok: true, embed }; }
export function serializeScenePackage(pkg: ScenePackageV1): string { return JSON.stringify(pkg); }
export function serializeEmbedPackage(pkg: EmbedPackageV1): string { return JSON.stringify(pkg); }
