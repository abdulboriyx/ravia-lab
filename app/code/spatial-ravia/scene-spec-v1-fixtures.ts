import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";
import type { ExportRequest, ScenePackage } from "./scene-export-contract.ts";
import { provenanceSourceId } from "./scientific-fidelity-provenance.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, type ScientificTimeline } from "./scientific-timeline.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";

const hash = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
function timeline(scene: ScientificSceneSpec, animated: boolean): ScientificTimeline | undefined {
  if (!animated) return undefined;
  const state = scene.states[0]!; const actorIds = state.actorIds;
  return { schemaVersion: "1", timelineId: `timeline-${scene.sceneId}`, clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: state.stateId, kind: "before", actorIds }], transitions: [], events: [{ eventId: "state-entry", at: 0.5, kind: "stateEntered", actorIds, stateId: state.stateId }], tracks: [], chapters: [{ chapterId: "chapter-main", start: 0, end: 1, stateIds: [state.stateId], eventIds: ["state-entry"] }] };
}
function scenePackage(scene: ScientificSceneSpec): ScenePackage { const sourceId = scene.fidelityProvenance.sources[0]!.sourceId; return { metadata: { schemaVersion: "1", packageId: `package-${scene.sceneId}`, sceneId: scene.sceneId, sceneVersion: "1.0.0", sceneHash: hash, runtime: { rendererVersion: "unresolved", runtimeVersion: "unresolved" } }, provenanceSourceIds: [sourceId], citations: [{ citationId: `citation-${scene.sceneId}`, text: "Scientific provenance", sourceId }], licenses: [] }; }
function make(scene: ScientificSceneSpec, semanticKey: string, options: { animated?: boolean; teaching?: boolean; format?: "png" | "mp4" } = {}): SceneSpecV1 {
  const pkg = scenePackage(scene); const format = options.format;
  const request: ExportRequest | undefined = format ? { requestId: `export-${scene.sceneId}`, packageId: pkg.metadata.packageId, sceneVersion: pkg.metadata.sceneVersion, sceneHash: pkg.metadata.sceneHash, format, resolution: { width: 1280, height: 720, aspectRatio: "16:9" }, background: { mode: "opaque", color: "#ffffff" }, timeline: format === "mp4" ? { mode: "range", startFrame: 0, endFrame: 30, fps: 30 } : { mode: "frame", frame: 0, fps: 30 }, inclusion: { labels: "requested", provenance: "references", citations: "included", licenses: "included" } } : undefined;
  return { schemaVersion: "1", sceneId: scene.sceneId, compatibility: { semanticIntent: "1", scientificScene: "1", ...(options.animated ? { timeline: "1" as const } : {}), ...(options.teaching ? { teaching: "1" as const } : {}), ...(format ? { exportPackage: "1" as const } : {}) }, semanticIntent: semanticIntentFixtures[semanticKey]!, scientificScene: scene, ...(options.animated ? { timeline: timeline(scene, true) } : {}), ...(options.teaching ? { teachingPlan: teachingPlanFixture } : {}), ...(format ? { export: { scenePackage: pkg, requests: [request!] } } : {}) }; }
export const sceneSpecV1Fixtures = {
  dnaAntiparallel: make(scientificSceneSpecFixtures["antiparallel-polarity"], "multiIntent"),
  dnaStrandSeparation: make(scientificSceneSpecFixtures["strand-separation"], "incompleteAnaphoric", { animated: true }),
  rnaExonuclease: make(scientificSceneSpecFixtures["exonuclease-shortened"], "rnaHairpin", { animated: true }),
  rnaDnaStability: make(scientificSceneSpecFixtures["rna-dna-stability"], "dnaRnaComparison", { teaching: true }),
  preVsMature: make(scientificSceneSpecFixtures["pre-vs-mature"], "rnaHairpin"),
  rnaDnaHybrid: make(scientificSceneSpecFixtures["rna-dna-hybrid"], "rnaHairpin"),
  pngExport: make(scientificSceneSpecFixtures["antiparallel-polarity"], "multiIntent", { format: "png" }),
  mp4Export: make(scientificSceneSpecFixtures["exonuclease-shortened"], "rnaHairpin", { animated: true, format: "mp4" }),
} as const;
void provenanceSourceId; void timelineContextFromScene;
