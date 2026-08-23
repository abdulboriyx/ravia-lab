import assert from "node:assert/strict";
import test from "node:test";
import { createDnaStrandSeparationScientificScene } from "./f7-dna-strand-separation-migration.ts";
import { buildEmbedPackage, buildScenePackage, type ViewerBootstrapV1 } from "./b-f-embed-scene-package.ts";
import { canEmitMolstarMetadataOnly, classifyMolstarExportRequest, molstarExportDecisionV1, validateMolstarPackageMetadata } from "./b-g-molstar-export-decision.ts";

const scene = createDnaStrandSeparationScientificScene();
const viewer: ViewerBootstrapV1 = { schemaVersion: "1", packageVersion: "1", requiredRuntimeVersion: "molstar-interactive-runtime", initialView: "STATIC", teachingEnabled: false, playbackEnabled: false, supportedControls: ["SEEK"], assetResolution: "CONTENT_ADDRESSED" };
const input = { packageId: "molstar-package", scientificSceneSpec: scene, viewer, representation: { owner: "MOLSTAR" as const, interactiveView: "SUPPORTED" as const, exactFrameExport: "UNSUPPORTED_V1" as const, limitationReasons: ["MOLSTAR_CAMERA_GAP", "MOLSTAR_READY_BARRIER_GAP", "MOLSTAR_RENDER_CAPTURE_GAP"], runtimeRequirement: "molstar-interactive-runtime" } };

test("B-G freezes explicit defer and separates all three Mol* gaps", () => {
  assert.equal(molstarExportDecisionV1.decision, "EXPLICIT_DEFER");
  assert.deepEqual(molstarExportDecisionV1.reasons, ["CAMERA_EXECUTION_UNSUPPORTED", "READY_BARRIER_UNSUPPORTED", "RENDER_CAPTURE_UNSUPPORTED"]);
  assert.deepEqual(molstarExportDecisionV1.capability, { interactiveView: "SUPPORTED", scenePackage: "SUPPORTED", embed: "SUPPORTED", scientificFrame: "UNSUPPORTED_V1", teachingFrame: "UNSUPPORTED_V1", video: "UNSUPPORTED_V1", slides: "UNSUPPORTED_V1", glb: "UNSUPPORTED_V1" });
});

test("B-G packages and embeds Mol* metadata without fake artifacts or owner substitution", async () => {
  const result = await buildScenePackage(input);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(validateMolstarPackageMetadata(result.package), undefined);
  assert.equal(result.package.representation?.owner, "MOLSTAR");
  const embed = await buildEmbedPackage(result.package);
  assert.equal(embed.ok, true);
  if (embed.ok) { assert.equal(embed.embed.bootstrap.requiredRuntimeVersion, "molstar-interactive-runtime"); assert.equal(validateMolstarPackageMetadata(embed.embed), undefined); }
});

test("B-G rejects every Mol* exact visual artifact request before encoder/capture", () => {
  for (const mode of ["SCIENTIFIC_FRAME", "TEACHING_FRAME", "VIDEO", "SLIDES"] as const) { const result = classifyMolstarExportRequest(mode); assert.equal(result.ok, false); assert.ok(result.reasons.includes("CAMERA_EXECUTION_UNSUPPORTED")); }
});

test("B-G allows metadata-only captions, chapters, packages, and embeds", () => {
  assert.equal(canEmitMolstarMetadataOnly("CAPTIONS"), true); assert.equal(canEmitMolstarMetadataOnly("CHAPTERS"), true); assert.equal(canEmitMolstarMetadataOnly("SCENE_PACKAGE"), true); assert.equal(canEmitMolstarMetadataOnly("EMBED"), true);
});

test("B-G preserves GLB unsupported boundary and explicit Mol* limitation", () => {
  assert.equal(molstarExportDecisionV1.capability.glb, "UNSUPPORTED_V1");
  assert.deepEqual(molstarExportDecisionV1.reopenConditions.length, 5);
});
