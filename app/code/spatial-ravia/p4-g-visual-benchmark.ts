/** P4-G: structural and semantic exact-frame visual benchmark. */

import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { createDnaPairingProductionMigration, createDnaSeparationProductionMigration, createRnaExonucleaseProductionMigration, createRnaHairpinProductionMigration, type ProductionTemporalMigrationV1 } from "./p3-g-production-temporal-migration.ts";
import { evaluateExactFrame, type ExactFrameRequestV1, type AppliedRenderStateV1 } from "./p4-b-exact-frame-runtime.ts";
import { ExactFrameRenderHost } from "./p4-c-renderer-state-reconstruction.ts";
import { resolveOwnerCamera, type CameraBoundsV1 } from "./p4-d-deterministic-camera-execution.ts";
import { captureExactFrame, type CanvasCaptureTargetV1 } from "./p4-e-deterministic-image-capture.ts";

export type VisualBenchmarkSplitV1 = "DEV" | "HOLDOUT";
export type VisualBenchmarkCaseV1 = Readonly<{ id: string; split: VisualBenchmarkSplitV1; ownerId: AppliedRenderStateV1["ownerId"]; request: ExactFrameRequestV1; expectedFailureCode?: string; boundsRequired?: boolean }>;
export type VisualBenchmarkCaseResultV1 = Readonly<{ id: string; split: VisualBenchmarkSplitV1; structural: "PASS" | "FAIL"; semantic: "PASS" | "FAIL"; pixel: "UNVERIFIED"; manual: "UNVERIFIED"; failureCode?: string; reasons: readonly string[] }>;
export type VisualBenchmarkReportV1 = Readonly<{ corpusVersion: "p4-g-visual-v1"; corpusHash: string; total: number; dev: { total: number; passed: number }; holdout: { total: number; passed: number }; criticalFailures: number; results: readonly VisualBenchmarkCaseResultV1[] }>;

const opaqueConfig = (ownerId: AppliedRenderStateV1["ownerId"], width: number, height: number, pixelRatio: number) => ({ schemaVersion: "1" as const, width, height, pixelRatio, background: { mode: "opaque" as const, color: "#ffffff" }, runtimeMode: "EXACT_FRAME" as const, ownerId });
const staticTimeline = (scene: ScientificSceneSpec, timelineId: string, stateId: string, duration = 4): ScientificTimeline => ({ schemaVersion: "1", timelineId, clock: { duration, unit: "seconds" }, initialMechanismStateId: stateId, states: [{ mechanismStateId: stateId, scientificStateId: stateId, kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] });

function separationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((item) => item.semanticTypeId === "strand").map((item) => item.actorId);
  return { ...base, topology: { ...base.topology, interactions: [{ ...base.topology.interactions[0]!, state: "present" }], continuities: [{ continuityId: "dna-backbone", strandActorId: strands[0]!, orderedActorIds: strands, state: "intact" }], changes: [{ changeId: "change-separation", kind: "separation", actorIds: [...strands, actorId("dna-1")], interactionIds: ["opened-pair-1"] }] }, states: [{ stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] }, { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] }] };
}

function separationTimeline(scene: ScientificSceneSpec, id: string): ScientificTimeline {
  return { schemaVersion: "1", timelineId: id, clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: scene.topology.actorIds }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: scene.topology.actorIds, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: scene.topology.actorIds, topologyChangeId: "change-separation" }], tracks: [] };
}

function requestFor(migration: ProductionTemporalMigrationV1, ownerId: AppliedRenderStateV1["ownerId"], timeSeconds: number, width: number, height: number, pixelRatio: number): ExactFrameRequestV1 {
  return { schemaVersion: "1", migration, timeSeconds, renderConfig: opaqueConfig(ownerId, width, height, pixelRatio) };
}

function createCases(): VisualBenchmarkCaseV1[] {
  const cases: VisualBenchmarkCaseV1[] = [];
  const add = (id: string, ownerId: VisualBenchmarkCaseV1["ownerId"], request: ExactFrameRequestV1, expectedFailureCode?: string, boundsRequired = true) => cases.push({ id, split: cases.length < 30 ? "DEV" : "HOLDOUT", ownerId, request, ...(expectedFailureCode ? { expectedFailureCode } : {}), boundsRequired });
  const dna = scientificSceneSpecFixtures["canonical-duplex"];
  const pairing = createDnaPairingProductionMigration(dna, staticTimeline(dna, "p4-g-pair", "paired-duplex"), { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  if (!pairing.ok) throw new Error("P4-G DNA pairing fixture failed");
  for (let index = 0; index < 10; index += 1) add(`dna-pairing-${index + 1}`, "DnaBasePairInteractionPresentation", requestFor(pairing.migration, pairing.migration.ownerId, index % 2, index % 3 === 0 ? 320 : 640, index % 2 === 0 ? 180 : 640, index % 2 === 0 ? 1 : 2));
  const separation = separationScene();
  const separationMigration = createDnaSeparationProductionMigration(separation, separationTimeline(separation, "p4-g-separation"), { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening");
  if (!separationMigration.ok) throw new Error("P4-G DNA separation fixture failed");
  const separationTimes = [0, 0.49, 0.5, 0.75, 0.99, 1, 1.01, 1.5, 1.75, 1.99, 0.25, 1.25];
  separationTimes.forEach((time, index) => add(`dna-separation-${index + 1}`, "DnaStrandSeparationPresentation", requestFor(separationMigration.migration, separationMigration.migration.ownerId, time, index % 3 === 0 ? 320 : 640, index % 3 === 1 ? 640 : 360, index % 2 === 0 ? 1 : 2)));
  const hairpin = scientificSceneSpecFixtures.hairpin;
  const hairpinMigration = createRnaHairpinProductionMigration(hairpin, staticTimeline(hairpin, "p4-g-hairpin", "hairpin-folded"), { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] });
  if (!hairpinMigration.ok) throw new Error("P4-G RNA hairpin fixture failed");
  for (let index = 0; index < 8; index += 1) add(`rna-hairpin-${index + 1}`, "RnaSecondaryStructurePresentation", requestFor(hairpinMigration.migration, hairpinMigration.migration.ownerId, index % 2, index % 2 === 0 ? 480 : 640, index % 2 === 0 ? 480 : 360, index % 2 === 0 ? 1 : 2));
  const unsupported = scientificSceneSpecFixtures["exonuclease-shortened"];
  const exonuclease = createRnaExonucleaseProductionMigration(unsupported, { ...staticTimeline(unsupported, "p4-g-exonuclease", "terminally-degraded"), events: [{ eventId: "shorten", at: 0.5, kind: "polymerShortened", actorIds: unsupported.topology.actorIds, topologyChangeId: "change-five-to-three-shortening", amount: 1 }] }, { rnaActorId: actorId("rna-1"), retainedActorId: actorId("retained-rna-1"), terminalShorteningInteractionId: "terminal-shortening", partiallyDegradedStateId: "terminally-degraded", continuityId: "missing-partition", topologyChangeId: "change-five-to-three-shortening" }, "shorten");
  if (!exonuclease.ok) throw new Error("P4-G exonuclease fixture failed");
  for (let index = 0; index < 5; index += 1) add(`rna-exonuclease-unsupported-${index + 1}`, "RnaDegradationPresentation", requestFor(exonuclease.migration, exonuclease.migration.ownerId, 0.5, 640, 360, 1), "FRAGMENTATION_UNGROUNDED");
  const invalid = requestFor(pairing.migration, pairing.migration.ownerId, 0, 320, 180, 1);
  add("failure-invalid-render-config", "DnaBasePairInteractionPresentation", { ...invalid, renderConfig: { ...invalid.renderConfig, width: 0 } }, "EXACT_FRAME_REQUEST_INVALID", false);
  add("failure-camera-bounds", "DnaBasePairInteractionPresentation", invalid, "CAMERA_BOUNDS_PENDING", true);
  add("failure-renderer-not-ready", "DnaBasePairInteractionPresentation", invalid, "CAPTURE_NOT_READY", false);
  add("failure-owner-unavailable", "DnaBasePairInteractionPresentation", { ...invalid, renderConfig: { ...invalid.renderConfig, ownerId: "DnaStrandSeparationPresentation" as AppliedRenderStateV1["ownerId"] } }, "EXACT_FRAME_REQUEST_INVALID", false);
  add("failure-second-invalid-config", "DnaBasePairInteractionPresentation", { ...invalid, renderConfig: { ...invalid.renderConfig, height: 0 } }, "EXACT_FRAME_REQUEST_INVALID", false);
  return cases;
}

export const p4GVisualCorpus = createCases();

const ownerBounds: CameraBoundsV1 = { center: [0, 0, 0], halfExtent: [2, 1, 0.5], radius: 2.3 };
function canvasFor(width: number, height: number): CanvasCaptureTargetV1 { return { width, height, toBlob: (callback) => callback(new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" })) }; }
function hashCorpus(cases: readonly VisualBenchmarkCaseV1[]): string { let hash = 2166136261; for (const char of JSON.stringify(cases.map((item) => ({ id: item.id, ownerId: item.ownerId, time: item.request.timeSeconds, expectedFailureCode: item.expectedFailureCode })))) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`; }

export const p4GVisualCorpusHash = hashCorpus(p4GVisualCorpus);

function failureResult(item: VisualBenchmarkCaseV1, code: string, reasons: readonly string[]): VisualBenchmarkCaseResultV1 { const passed = item.expectedFailureCode === code; return { id: item.id, split: item.split, structural: passed ? "PASS" : "FAIL", semantic: passed ? "PASS" : "FAIL", pixel: "UNVERIFIED", manual: "UNVERIFIED", ...(code ? { failureCode: code } : {}), reasons }; }

export async function runP4GVisualBenchmark(split?: VisualBenchmarkSplitV1): Promise<VisualBenchmarkReportV1> {
  const selected = p4GVisualCorpus.filter((item) => split === undefined || item.split === split);
  const results: VisualBenchmarkCaseResultV1[] = [];
  for (const item of selected) {
    const evaluated = evaluateExactFrame(item.request);
    if (!evaluated.ok) { results.push(failureResult(item, evaluated.code, evaluated.reasons)); continue; }
    const state = evaluated.appliedState;
    const repeated = evaluateExactFrame(item.request);
    const semantic = repeated.ok && JSON.stringify(repeated.appliedState) === JSON.stringify(state);
    const camera = item.id === "failure-camera-bounds" ? resolveOwnerCamera(state.ownerId, state.cameraCue, { width: state.renderConfig.width, height: state.renderConfig.height, pixelRatio: state.renderConfig.pixelRatio }, null) : (item.boundsRequired || item.id === "failure-renderer-not-ready") ? resolveOwnerCamera(state.ownerId, state.cameraCue, { width: state.renderConfig.width, height: state.renderConfig.height, pixelRatio: state.renderConfig.pixelRatio }, ownerBounds) : { ok: false as const, code: "CAMERA_BOUNDS_PENDING" as const, reasons: ["bounds intentionally unavailable"] };
    if (!camera.ok) { results.push(failureResult(item, camera.code, camera.reasons)); continue; }
    const host = new ExactFrameRenderHost({ ownerId: state.ownerId, setExactFrameState: () => undefined, getReadiness: () => item.id === "failure-renderer-not-ready" ? ({ geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: false }) : ({ geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: true }) });
    const applied = host.apply(state);
    if (!applied.ok) { results.push(failureResult(item, applied.code, applied.reasons)); continue; }
    const capture = await captureExactFrame({ host, request: { schemaVersion: "1", exactFrameRequest: item.request, applicationId: applied.applicationId, format: "png", captureScope: "CANVAS_ONLY" }, canvas: canvasFor(state.renderConfig.width * state.renderConfig.pixelRatio, state.renderConfig.height * state.renderConfig.pixelRatio) });
    if (!capture.ok) { results.push(failureResult(item, capture.code, capture.reasons)); continue; }
    if (item.expectedFailureCode) { results.push(failureResult(item, "UNEXPECTED_SUCCESS", ["case expected an explicit failure"])); continue; }
    const structural = state.ownerId === item.ownerId && new Set(state.actorVisibility.map((entry) => entry.actorId)).size === state.actorVisibility.length && state.timeSeconds === item.request.timeSeconds && capture.artifact.metadata.byteLength > 0 && capture.artifact.metadata.width === state.renderConfig.width * state.renderConfig.pixelRatio;
    results.push({ id: item.id, split: item.split, structural: structural ? "PASS" : "FAIL", semantic: semantic ? "PASS" : "FAIL", pixel: "UNVERIFIED", manual: "UNVERIFIED", reasons: structural && semantic ? [] : ["structured exact-frame invariant failed"] });
  }
  const passed = results.filter((item) => item.structural === "PASS" && item.semantic === "PASS").length;
  const devResults = results.filter((item) => item.split === "DEV");
  const holdoutResults = results.filter((item) => item.split === "HOLDOUT");
  return { corpusVersion: "p4-g-visual-v1", corpusHash: p4GVisualCorpusHash, total: results.length, dev: { total: devResults.length, passed: devResults.filter((item) => item.structural === "PASS" && item.semantic === "PASS").length }, holdout: { total: holdoutResults.length, passed: holdoutResults.filter((item) => item.structural === "PASS" && item.semantic === "PASS").length }, criticalFailures: results.length - passed, results };
}
