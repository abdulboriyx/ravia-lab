/** B-G: explicit Mol* Export v1 capability decision. */

import type { EmbedPackageV1, ScenePackageV1 } from "./b-f-embed-scene-package.ts";

export const molstarExportFailureCodesV1 = ["MOLSTAR_EXACT_FRAME_UNSUPPORTED", "MOLSTAR_CAMERA_UNSUPPORTED", "MOLSTAR_READY_UNSUPPORTED", "MOLSTAR_CAPTURE_UNSUPPORTED"] as const;
export type MolstarExportFailureCodeV1 = typeof molstarExportFailureCodesV1[number];
export type MolstarExportFailureV1 = Readonly<{ ok: false; code: MolstarExportFailureCodeV1; reasons: readonly string[] }>;
export type MolstarExportModeV1 = "SCIENTIFIC_FRAME" | "TEACHING_FRAME" | "VIDEO" | "SLIDES";
export type MolstarCapabilityMatrixV1 = Readonly<{ interactiveView: "SUPPORTED"; scenePackage: "SUPPORTED"; embed: "SUPPORTED"; scientificFrame: "UNSUPPORTED_V1"; teachingFrame: "UNSUPPORTED_V1"; video: "UNSUPPORTED_V1"; slides: "UNSUPPORTED_V1"; glb: "UNSUPPORTED_V1" }>;
export type MolstarDecisionV1 = Readonly<{ decision: "EXPLICIT_DEFER"; capability: MolstarCapabilityMatrixV1; gaps: Readonly<{ camera: "MOLSTAR_CAMERA_GAP"; readiness: "MOLSTAR_READY_BARRIER_GAP"; capture: "MOLSTAR_RENDER_CAPTURE_GAP" }>; reasons: readonly string[]; reopenConditions: readonly string[] }>;

export const molstarExportDecisionV1: MolstarDecisionV1 = {
  decision: "EXPLICIT_DEFER",
  capability: { interactiveView: "SUPPORTED", scenePackage: "SUPPORTED", embed: "SUPPORTED", scientificFrame: "UNSUPPORTED_V1", teachingFrame: "UNSUPPORTED_V1", video: "UNSUPPORTED_V1", slides: "UNSUPPORTED_V1", glb: "UNSUPPORTED_V1" },
  gaps: { camera: "MOLSTAR_CAMERA_GAP", readiness: "MOLSTAR_READY_BARRIER_GAP", capture: "MOLSTAR_RENDER_CAPTURE_GAP" },
  reasons: ["CAMERA_EXECUTION_UNSUPPORTED", "READY_BARRIER_UNSUPPORTED", "RENDER_CAPTURE_UNSUPPORTED"],
  reopenConditions: ["deterministic Mol* camera contract", "exact-frame readiness integration", "deterministic capture surface", "stale-work protection", "dedicated Mol* benchmark coverage"],
};

export function classifyMolstarExportRequest(mode: MolstarExportModeV1): MolstarExportFailureV1 {
  const code = mode === "SCIENTIFIC_FRAME" ? "MOLSTAR_CAMERA_UNSUPPORTED" : mode === "TEACHING_FRAME" ? "MOLSTAR_CAPTURE_UNSUPPORTED" : mode === "VIDEO" ? "MOLSTAR_EXACT_FRAME_UNSUPPORTED" : "MOLSTAR_CAPTURE_UNSUPPORTED";
  return { ok: false, code, reasons: [...molstarExportDecisionV1.reasons, `requested ${mode} requires an exact Mol* artifact`] };
}

export function validateMolstarPackageMetadata(pkg: ScenePackageV1 | EmbedPackageV1): MolstarExportFailureV1 | undefined {
  const scenePackage = "package" in pkg ? pkg.package : pkg;
  if (scenePackage.representation?.owner !== "MOLSTAR") return { ok: false, code: "MOLSTAR_EXACT_FRAME_UNSUPPORTED", reasons: ["package is not marked as a Mol* representation"] };
  if (scenePackage.representation.exactFrameExport !== "UNSUPPORTED_V1") return { ok: false, code: "MOLSTAR_EXACT_FRAME_UNSUPPORTED", reasons: ["Mol* package must preserve UNSUPPORTED_V1 export status"] };
  return undefined;
}

export function canEmitMolstarMetadataOnly(mode: "CAPTIONS" | "CHAPTERS" | "SCENE_PACKAGE" | "EMBED"): boolean { return ["CAPTIONS", "CHAPTERS", "SCENE_PACKAGE", "EMBED"].includes(mode); }
