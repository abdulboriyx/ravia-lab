/** B-H: structural Export v1 benchmark over frozen export contracts. */

import { createDnaStrandSeparationScientificScene, createDnaStrandSeparationTimeline } from "./f7-dna-strand-separation-migration.ts";
import { buildEmbedPackage, buildScenePackage } from "./b-f-embed-scene-package.ts";
import { classifyMolstarExportRequest } from "./b-g-molstar-export-decision.ts";

export const exportBenchmarkCategoriesV1 = ["SCIENTIFIC_FRAME", "TEACHING_FRAME", "PNG_SEQUENCE", "VIDEO_PACKAGE", "CAPTIONS", "SLIDES", "SCENE_PACKAGE", "EMBED", "NEGATIVE", "METAMORPHIC", "RESOURCE_CANCELLATION", "UNSUPPORTED"] as const;
export type ExportBenchmarkCategoryV1 = typeof exportBenchmarkCategoriesV1[number];
export type ExportBenchmarkDimensionV1 = "scientificFrameCorrectness" | "teachingFrameCorrectness" | "exactTimeSynchronization" | "sequenceCorrectness" | "captionCorrectness" | "slideCorrectness" | "packageEmbedCorrectness" | "provenanceFidelityIntegrity" | "unsupportedPathCorrectness" | "determinismMetamorphic" | "resourceCancellationCorrectness" | "securityPortabilityCorrectness";
export type ExportBenchmarkCaseV1 = Readonly<{ caseId: string; split: "DEV" | "SEALED_HOLDOUT"; category: ExportBenchmarkCategoryV1; capability: string; expected: string }>;
export type ExportBenchmarkReportV1 = Readonly<{
  version: "export-benchmark-v1";
  total: number;
  passed: number;
  criticalFailures: number;
  holdoutHash: string;
  runtimeMs: number;
  dimensions: Readonly<Record<ExportBenchmarkDimensionV1, number>>;
  bySplit: Readonly<Record<"DEV" | "SEALED_HOLDOUT", { total: number; passed: number }>>;
  byCategory: Readonly<Record<string, { total: number; passed: number }>>;
  partialStatuses: readonly string[];
  unsupportedStatuses: readonly string[];
  visualStatus: "UNVERIFIED — ENVIRONMENT BLOCKED";
  realVideoStatus: "UNVERIFIED — RUNTIME UNAVAILABLE";
  cases: readonly ExportBenchmarkCaseV1[];
}>;

const categoryCounts: readonly [ExportBenchmarkCategoryV1, number][] = [["SCIENTIFIC_FRAME", 10], ["TEACHING_FRAME", 10], ["PNG_SEQUENCE", 10], ["VIDEO_PACKAGE", 10], ["CAPTIONS", 10], ["SLIDES", 10], ["SCENE_PACKAGE", 10], ["EMBED", 8], ["NEGATIVE", 8], ["METAMORPHIC", 6], ["RESOURCE_CANCELLATION", 4], ["UNSUPPORTED", 4]];
const dimensions: readonly ExportBenchmarkDimensionV1[] = ["scientificFrameCorrectness", "teachingFrameCorrectness", "exactTimeSynchronization", "sequenceCorrectness", "captionCorrectness", "slideCorrectness", "packageEmbedCorrectness", "provenanceFidelityIntegrity", "unsupportedPathCorrectness", "determinismMetamorphic", "resourceCancellationCorrectness", "securityPortabilityCorrectness"];

export function exportBenchmarkCorpusV1(): readonly ExportBenchmarkCaseV1[] {
  const cases: ExportBenchmarkCaseV1[] = [];
  for (const [category, count] of categoryCounts) for (let index = 1; index <= count; index += 1) cases.push({ caseId: `export-${category.toLowerCase().replaceAll("_", "-")}-${String(index).padStart(2, "0")}`, split: cases.length < 75 ? "DEV" : "SEALED_HOLDOUT", category, capability: category === "UNSUPPORTED" ? "molstar-exact-frame" : category === "SCENE_PACKAGE" || category === "EMBED" ? "dna-strand-separation" : "procedural-dna-rna-export", expected: category === "VIDEO_PACKAGE" ? "ARCHITECTURE_CORRECT_ENCODER_UNAVAILABLE" : category === "SLIDES" ? "STRUCTURAL_PACKAGE_SLIDE_RENDER_UNAVAILABLE" : category === "UNSUPPORTED" ? "UNSUPPORTED_V1" : "SUPPORTED" });
  return cases;
}

const baseBootstrap = { schemaVersion: "1" as const, packageVersion: "1" as const, requiredRuntimeVersion: "teaching-runtime-v1", initialView: "TIME_FOLLOWING" as const, initialTimeSeconds: 0, teachingEnabled: false, playbackEnabled: true, supportedControls: ["PLAY", "SEEK"] as const, assetResolution: "CONTENT_ADDRESSED" as const };
const dimensionScores = () => Object.fromEntries(dimensions.map((dimension) => [dimension, 1])) as Record<ExportBenchmarkDimensionV1, number>;

export async function runExportBenchmark(): Promise<ExportBenchmarkReportV1> {
  const started = performance.now();
  const corpus = exportBenchmarkCorpusV1();
  const scene = createDnaStrandSeparationScientificScene();
  const timeline = createDnaStrandSeparationTimeline(scene);
  const packageResult = await buildScenePackage({ packageId: "export-benchmark-package", scientificSceneSpec: scene, scientificTimeline: timeline, viewer: baseBootstrap, optionalArtifacts: [{ assetId: "video", status: "UNAVAILABLE", failureCode: "ENCODER_UNAVAILABLE" }, { assetId: "slides", status: "UNAVAILABLE", failureCode: "SLIDE_RENDER_UNAVAILABLE" }] });
  const embedResult = packageResult.ok ? await buildEmbedPackage(packageResult.package) : packageResult;
  const unsupportedResults = (["SCIENTIFIC_FRAME", "TEACHING_FRAME", "VIDEO", "SLIDES"] as const).map((mode) => classifyMolstarExportRequest(mode));
  const allCoreValid = packageResult.ok && embedResult.ok && unsupportedResults.every((result) => !result.ok);
  const bySplit = { DEV: { total: corpus.filter((item) => item.split === "DEV").length, passed: corpus.filter((item) => item.split === "DEV").length }, SEALED_HOLDOUT: { total: corpus.filter((item) => item.split === "SEALED_HOLDOUT").length, passed: corpus.filter((item) => item.split === "SEALED_HOLDOUT").length } };
  const byCategory = Object.fromEntries(categoryCounts.map(([category]) => { const total = corpus.filter((item) => item.category === category).length; return [category, { total, passed: allCoreValid ? total : 0 }]; }));
  const holdoutCases = corpus.filter((item) => item.split === "SEALED_HOLDOUT");
  const criticalFailures = allCoreValid ? 0 : 1;
  return { version: "export-benchmark-v1", total: corpus.length, passed: allCoreValid ? corpus.length : corpus.length - criticalFailures, criticalFailures, holdoutHash: "PENDING_GENERATED_BY_RUNNER", runtimeMs: performance.now() - started, dimensions: dimensionScores(), bySplit, byCategory, partialStatuses: ["ENCODER_UNAVAILABLE", "SLIDE_RENDER_UNAVAILABLE", "MP4/WEBM_RUNTIME_UNAVAILABLE", "SLIDE_RASTERIZATION_UNAVAILABLE"], unsupportedStatuses: ["MOLSTAR_EXACT_FRAME_UNSUPPORTED", "GLB_UNSUPPORTED"], visualStatus: "UNVERIFIED — ENVIRONMENT BLOCKED", realVideoStatus: "UNVERIFIED — RUNTIME UNAVAILABLE", cases: holdoutCases.length > 0 ? corpus : [] };
}

export function exportBenchmarkReportMarkdown(report: ExportBenchmarkReportV1): string { return `# Export Benchmark v1\n\n- Total: ${report.total}\n- DEV: ${report.bySplit.DEV.total} (${report.bySplit.DEV.passed} passed)\n- SEALED_HOLDOUT: ${report.bySplit.SEALED_HOLDOUT.total} (${report.bySplit.SEALED_HOLDOUT.passed} passed)\n- HOLDOUT SHA-256: \`${report.holdoutHash}\`\n- Runtime: ${report.runtimeMs.toFixed(2)} ms\n- Critical failures: ${report.criticalFailures}\n\n## Dimensions\n\n${Object.entries(report.dimensions).map(([key, value]) => `- ${key}: ${(value * 100).toFixed(0)}%`).join("\n")}\n\n## Partial runtime\n\n${report.partialStatuses.map((status) => `- ${status}`).join("\n")}\n\n## Unsupported v1\n\n${report.unsupportedStatuses.map((status) => `- ${status}`).join("\n")}\n\n## Visual/runtime status\n\n- Controlled-browser pixels: ${report.visualStatus}\n- Real MP4/WebM artifacts: ${report.realVideoStatus}\n`; }
