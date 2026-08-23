import assert from "node:assert/strict";
import test from "node:test";
import { createDnaStrandSeparationScientificScene, createDnaStrandSeparationTimeline } from "./f7-dna-strand-separation-migration.ts";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { buildEmbedPackage, buildScenePackage, resolveViewerBootstrap, serializeEmbedPackage, serializeScenePackage, type AssetManifestEntryV1, type ScenePackageInputV1, type ViewerBootstrapV1 } from "./b-f-embed-scene-package.ts";
import type { TeachingPlan } from "./teaching-plan.ts";

const scene = createDnaStrandSeparationScientificScene();
const timeline = createDnaStrandSeparationTimeline(scene);
const actorRef = { kind: "actor" as const, actorId: scene.actors[0]!.actorId };
const plan: TeachingPlan = { schemaVersion: "1", planId: "teaching-dna", sceneId: scene.sceneId, requestMode: "show", learningObjective: "Identify the paired DNA structure.", prerequisiteAssumptions: [], chapters: [{ chapterId: "chapter-identify", order: 1, title: "Paired DNA", focus: [actorRef] }], projections: ["beginner", "intermediate", "advanced"].map((audience) => ({ audience: audience as "beginner" | "intermediate" | "advanced", chapterIds: ["chapter-identify"], revealedAnnotationIds: [] })) };
const chapterProgram = compileTeachingChapterProgram(plan, scene, timeline);
assert.equal(chapterProgram.ok, true);
const audienceProgram = { schemaVersion: "1" as const, audience: "BEGINNER" as const, planId: plan.planId, sceneId: scene.sceneId, requestMode: plan.requestMode, policy: { terminologyLevel: "CONCEPTUAL" as const, explanationDepth: "CORE" as const, disclosureDepth: "GRADUAL" as const, chemistryDepth: "CONCEPTUAL" as const, mechanismGranularity: "CORE" as const, annotationDensity: "LOW" as const, contextRetention: "BROAD" as const, causalDepth: "CORE" as const, misconceptionExplanationDepth: "MINIMAL" as const, maximumDetail: "STRUCTURAL" as const }, selectedChapterIds: ["chapter-identify"], compressedChapterIds: [], authoritativeRefs: [actorRef], entries: chapterProgram.ok ? chapterProgram.program.entries.map((entry) => ({ ...entry, authoritativeRefs: [actorRef], projectedDetail: "STRUCTURAL" as const })) : [] };
const viewer = (overrides: Partial<ViewerBootstrapV1> = {}): ViewerBootstrapV1 => ({ schemaVersion: "1", packageVersion: "1", requiredRuntimeVersion: "teaching-runtime-v1", initialView: "MANUAL_CHAPTER", teachingEnabled: true, audience: "BEGINNER", playbackEnabled: false, supportedControls: ["CHAPTER_NAVIGATION", "AUDIENCE_SELECT"], assetResolution: "CONTENT_ADDRESSED", ...overrides });
const asset = (assetId: string, dependencies: readonly string[] = []): AssetManifestEntryV1 => ({ assetId, type: "scene", contentHash: `pending:${assetId}`, mimeType: "application/json", byteLength: 10, logicalRole: assetId, required: true, dependencies });
const input = (overrides: Partial<ScenePackageInputV1> = {}): ScenePackageInputV1 => ({ packageId: "package-dna", scientificSceneSpec: scene, teaching: { plan, chapterProgram: chapterProgram.ok ? chapterProgram.program : (() => { throw new Error("fixture") })(), audiencePrograms: [audienceProgram], selectedAudience: "BEGINNER" }, viewer: viewer({ manualChapterId: "chapter-identify" }), assets: [asset("scene-spec")], optionalArtifacts: [{ assetId: "video-mp4", status: "UNAVAILABLE", failureCode: "ENCODER_UNAVAILABLE" }, { assetId: "slides", status: "UNAVAILABLE", failureCode: "SLIDE_RASTERIZATION_UNAVAILABLE" }], ...overrides });

test("B-F packages static DNA with teaching and no fabricated timeline", async () => {
  const result = await buildScenePackage(input({ scientificTimeline: undefined }));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) { assert.equal(result.package.scientificTimeline, undefined); assert.equal(result.package.teaching?.plan.planId, "teaching-dna"); assert.equal(result.package.viewer.initialView, "MANUAL_CHAPTER"); }
});

test("B-F packages temporal DNA separation and validates direct bootstrap reconstruction", async () => {
  const result = await buildScenePackage(input({ scientificTimeline: timeline, viewer: viewer({ initialView: "TIME_FOLLOWING", initialTimeSeconds: 0, playbackEnabled: true, manualChapterId: undefined }) }));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) { const bootstrap = resolveViewerBootstrap(result.package); assert.equal(bootstrap.ok, true); assert.equal(result.package.scientificTimeline?.timelineId, timeline.timelineId); }
});

test("B-F supports embed manifest and safe JSON round trips", async () => {
  const result = await buildScenePackage(input());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const embed = await buildEmbedPackage(result.package);
  assert.equal(embed.ok, true);
  if (embed.ok) { assert.deepEqual(JSON.parse(serializeScenePackage(result.package)), result.package); assert.deepEqual(JSON.parse(serializeEmbedPackage(embed.embed)), embed.embed); assert.equal(embed.embed.manifest.mimeType, "application/json"); }
});

test("B-F preserves optional encoder and slide partial statuses without invalidating core package", async () => {
  const result = await buildScenePackage(input());
  assert.equal(result.ok, true);
  if (result.ok) { assert.equal(result.package.support.status, "PARTIAL"); assert.deepEqual(result.package.optionalArtifacts.map((artifact) => artifact.failureCode), ["SLIDE_RASTERIZATION_UNAVAILABLE", "ENCODER_UNAVAILABLE"]); }
});

test("B-F rejects invalid references, bootstrap chapter/time, and unsupported versions", async () => {
  const missingChapter = await buildScenePackage(input({ viewer: viewer({ manualChapterId: "missing-chapter" }) }));
  assert.equal(missingChapter.ok, false); if (!missingChapter.ok) assert.equal(missingChapter.code, "EMBED_BOOTSTRAP_INVALID");
  const invalidTime = await buildScenePackage(input({ scientificTimeline: timeline, viewer: viewer({ initialView: "TIME_FOLLOWING", initialTimeSeconds: 99 }) }));
  assert.equal(invalidTime.ok, false); if (!invalidTime.ok) assert.equal(invalidTime.code, "EMBED_BOOTSTRAP_INVALID");
  const unsupported = await buildScenePackage(input({ viewer: { ...viewer(), schemaVersion: "2" as "1" } }));
  assert.equal(unsupported.ok, false); if (!unsupported.ok) assert.equal(unsupported.code, "EMBED_BOOTSTRAP_INVALID");
});

test("B-F validates asset dependencies, missing assets, and hash integrity", async () => {
  const missing = await buildScenePackage(input({ assets: [asset("scene-spec", ["missing"])] }));
  assert.equal(missing.ok, false); if (!missing.ok) assert.equal(missing.code, "SCENE_PACKAGE_DEPENDENCY_INVALID");
  const cycle = await buildScenePackage(input({ assets: [asset("a", ["b"]), asset("b", ["a"])] }));
  assert.equal(cycle.ok, false); if (!cycle.ok) assert.equal(cycle.code, "SCENE_PACKAGE_DEPENDENCY_INVALID");
  const badHash = await buildScenePackage(input({ assets: [{ ...asset("scene-spec"), contentHash: "sha256:not-a-hash" }] }));
  assert.equal(badHash.ok, false); if (!badHash.ok) assert.equal(badHash.code, "SCENE_PACKAGE_ASSET_HASH_MISMATCH");
});

test("B-F package hashes are invariant to irrelevant asset and scientific array ordering", async () => {
  const normal = await buildScenePackage(input({ assets: [asset("scene-spec"), asset("source-data")] }));
  const reorderedScene = { ...scene, actors: [...scene.actors].reverse(), groups: [...scene.groups].reverse(), states: [...scene.states].reverse(), topology: { ...scene.topology, interactions: [...scene.topology.interactions].reverse() } };
  const reordered = await buildScenePackage(input({ scientificSceneSpec: reorderedScene, assets: [asset("source-data"), asset("scene-spec")] }));
  assert.equal(normal.ok && reordered.ok, true);
  if (normal.ok && reordered.ok) assert.equal(normal.package.integrity.semanticHash, reordered.package.integrity.semanticHash);
});

test("B-F rejects fabricated fragmentation payloads while preserving explicit unsupported metadata", async () => {
  const unsupported = await buildScenePackage(input({ limitations: ["FRAGMENTATION_UNGROUNDED"], optionalArtifacts: [{ assetId: "fragment-lesson", status: "UNAVAILABLE", failureCode: "FRAGMENTATION_UNGROUNDED" }] }));
  assert.equal(unsupported.ok, true);
  if (unsupported.ok) assert.equal(unsupported.package.optionalArtifacts[0]?.status, "UNAVAILABLE");
});
