/** F4: authoritative composition envelope; F1/F2/F3 remain the owners of their fields. */
import { validateSemanticIntent, type SemanticIntentV1 } from "./semantic-intent.ts";
import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, validateScientificTimeline, type ScientificTimeline } from "./scientific-timeline.ts";
import { validateTeachingPlan, type TeachingPlan } from "./teaching-plan.ts";
import { validateExportRequest, validateScenePackage, type ExportRequest, type ScenePackage } from "./scene-export-contract.ts";

export const sceneSpecV1SchemaVersion = "1" as const;
export type SceneSpecV1 = {
  schemaVersion: typeof sceneSpecV1SchemaVersion;
  sceneId: string;
  compatibility: { semanticIntent: "1"; scientificScene: "1"; timeline?: "1"; teaching?: "1"; exportPackage?: "1" };
  semanticIntent: SemanticIntentV1;
  scientificScene: ScientificSceneSpec;
  timeline?: ScientificTimeline;
  teachingPlan?: TeachingPlan;
  export?: { scenePackage: ScenePackage; requests?: ExportRequest[] };
};
export type SceneSpecV1ValidationIssue = { path: string; message: string };
export type SceneSpecV1ValidationResult = { valid: true; issues: [] } | { valid: false; issues: SceneSpecV1ValidationIssue[] };
type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const id = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const keys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => { if (!isRecord(value)) { issue(path, "must be an object"); return false; } const allowedKeys = new Set(allowed); Object.keys(value).forEach((key) => { if (!allowedKeys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); }); return true; };

/** Validates composition without copying, deriving, or mutating frozen F1/F2/F3 truth. */
export function validateSceneSpecV1(spec: SceneSpecV1): SceneSpecV1ValidationResult {
  const issues: SceneSpecV1ValidationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message });
  if (!keys(spec, "sceneSpec", ["schemaVersion", "sceneId", "compatibility", "semanticIntent", "scientificScene", "timeline", "teachingPlan", "export"], issue)) return { valid: false, issues };
  const value = spec as unknown as UnknownRecord;
  if (value.schemaVersion !== "1") issue("sceneSpec.schemaVersion", "must be SceneSpec v1");
  if (typeof value.sceneId !== "string" || !id.test(value.sceneId)) issue("sceneSpec.sceneId", "must be a stable kebab-case ID");
  if (keys(value.compatibility, "sceneSpec.compatibility", ["semanticIntent", "scientificScene", "timeline", "teaching", "exportPackage"], issue)) {
    const compatibility = value.compatibility as UnknownRecord;
    if (compatibility.semanticIntent !== "1" || compatibility.scientificScene !== "1") issue("sceneSpec.compatibility", "must declare compatible frozen F1/F2 versions");
    if (value.timeline !== undefined && compatibility.timeline !== "1") issue("sceneSpec.compatibility.timeline", "must declare timeline version 1 when timeline is present");
    if (value.teachingPlan !== undefined && compatibility.teaching !== "1") issue("sceneSpec.compatibility.teaching", "must declare teaching version 1 when teaching is present");
    if (value.export !== undefined && compatibility.exportPackage !== "1") issue("sceneSpec.compatibility.exportPackage", "must declare export package version 1 when export is present");
  }
  const semantic = validateSemanticIntent(value.semanticIntent as SemanticIntentV1); if (!semantic.valid) issues.push(...semantic.issues.map((entry) => ({ path: `semanticIntent.${entry.path}`, message: entry.message })));
  const scientific = value.scientificScene as ScientificSceneSpec;
  const science = validateScientificSceneSpec(scientific); if (!science.valid) issues.push(...science.issues.map((entry) => ({ path: `scientificScene.${entry.path}`, message: entry.message })));
  if (scientific?.schemaVersion !== "1" || scientific?.sceneId !== value.sceneId) issue("sceneSpec.sceneId", "must equal the frozen F2 scientific scene ID");
  if (value.timeline !== undefined) { const result = validateScientificTimeline(value.timeline as ScientificTimeline, timelineContextFromScene(scientific)); if (!result.valid) issues.push(...result.issues.map((entry) => ({ path: `timeline.${entry.path}`, message: entry.message }))); }
  if (value.teachingPlan !== undefined) { const result = validateTeachingPlan(value.teachingPlan as TeachingPlan, scientific); if (!result.valid) issues.push(...result.issues.map((entry) => ({ path: `teachingPlan.${entry.path}`, message: entry.message }))); }
  if (value.export !== undefined) {
    if (keys(value.export, "sceneSpec.export", ["scenePackage", "requests"], issue)) {
      const exportValue = value.export as UnknownRecord; const scenePackage = exportValue.scenePackage as ScenePackage;
      const packageResult = validateScenePackage(scenePackage); if (!packageResult.valid) issues.push(...packageResult.issues.map((entry) => ({ path: `export.${entry.path}`, message: entry.message })));
      if (scenePackage?.metadata?.sceneId !== value.sceneId) issue("sceneSpec.export.scenePackage.metadata.sceneId", "must equal the SceneSpec/F2 scene ID");
      const scientificSources = new Set(scientific?.fidelityProvenance?.sources.map((source) => String(source.sourceId)) ?? []);
      scenePackage?.provenanceSourceIds?.forEach((sourceId, index) => { if (!scientificSources.has(String(sourceId))) issue(`sceneSpec.export.scenePackage.provenanceSourceIds[${index}]`, "must reference an F2 provenance source"); });
      if (exportValue.requests !== undefined && !Array.isArray(exportValue.requests)) issue("sceneSpec.export.requests", "must be an array");
      if (Array.isArray(exportValue.requests)) exportValue.requests.forEach((request, index) => { const result = validateExportRequest(request as ExportRequest, scenePackage); if (!result.valid) issues.push(...result.issues.map((entry) => ({ path: `export.requests[${index}].${entry.path}`, message: entry.message }))); });
    }
  }
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}
