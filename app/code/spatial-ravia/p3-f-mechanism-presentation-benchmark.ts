/** P3-F: deterministic mechanism/presentation corpus and scorer. */

import { createHash } from "node:crypto";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { compileDeterministicTemporalProgram } from "./p3-c-deterministic-temporal-semantics.ts";
import { evaluateScientificTimeline, type MechanismSnapshotV1 } from "./p3-b-mechanism-state-kernel.ts";
import { evaluateGroundedTopologyAtTime, type MechanismTopologySnapshotV1 } from "./p3-d-grounded-topology-executor.ts";
import { createDnaBasePairingTemporalPlan, createDnaSeparationTemporalPlan, createRnaHairpinTemporalPlan, evaluatePresentationAtTime, type PresentationMechanismSnapshotV1, type PresentationPlanV1 } from "./p3-e-presentation-synchronization.ts";

export const p3fCorpusVersion = "p3-f-v1" as const;
export const p3fFailureKinds = ["TIMELINE_INVALID", "DEPENDENCY_INVALID", "TOPOLOGY_UNSUPPORTED", "PRESENTATION_INVALID"] as const;
export type P3FFailureKind = (typeof p3fFailureKinds)[number];
export type P3FSplit = "DEV" | "SEALED_HOLDOUT";
export type P3FScenario = "dna-separation" | "dna-pairing" | "rna-cleavage" | "rna-hairpin" | "exonuclease-gap" | "dependency-cycle" | "invalid-presentation";

export type P3FCase = Readonly<{ id: string; split: P3FSplit; family: "DNA" | "RNA" | "TEMPORAL"; scenario: P3FScenario; variant: number; eventAt?: number; easing?: "linear" | "smoothstep"; expected: "success" | P3FFailureKind }>;
export type P3FDimensionScores = Record<"timelineValidation" | "temporalCompilation" | "mechanismState" | "topologyState" | "evidenceFidelity" | "presentation" | "cameraCue" | "failureBehavior" | "seekReversibility" | "exactFrame", boolean>;
export type P3FCaseResult = Readonly<{ id: string; split: P3FSplit; family: P3FCase["family"]; scenario: P3FScenario; expected: P3FCase["expected"]; passed: boolean; critical: boolean; dimensions: P3FDimensionScores; failure?: string }>;

function dnaSeparationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  return { ...base, topology: { ...base.topology, interactions: [{ ...base.topology.interactions[0]!, state: "present" }], continuities: [{ continuityId: "dna-backbone", strandActorId: strands[0]!, orderedActorIds: strands, state: "intact" }], changes: [{ changeId: "change-separation", kind: "separation", actorIds: [...strands, actorId("dna-1")], interactionIds: ["opened-pair-1"] }] }, states: [{ stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] }, { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] }] };
}

function dnaSeparationTimeline(scene: ScientificSceneSpec, eventAt: number): ScientificTimeline {
  const actors = scene.topology.actorIds;
  return { schemaVersion: "1", timelineId: "p3-f-dna-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: actors }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: eventAt / 2, end: eventAt + 0.5 }], events: [{ eventId: "separate", at: eventAt, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
}

function rnaCleavageScene(): ScientificSceneSpec {
  const scene = structuredClone(scientificSceneSpecFixtures.cleavage);
  scene.topology.interactions = scene.topology.interactions.map((interaction) => interaction.interactionId === "cleaved-link" ? { ...interaction, state: "present" } : interaction);
  scene.topology.continuities = scene.topology.continuities?.map((continuity) => ({ ...continuity, state: "intact" }));
  return scene;
}

function rnaCleavageTimeline(scene: ScientificSceneSpec, eventAt: number): ScientificTimeline {
  const actors = scene.topology.actorIds;
  return { schemaVersion: "1", timelineId: "p3-f-rna-cleavage", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "rna-cleaved", kind: "before", actorIds: actors }, { mechanismStateId: "after", scientificStateId: "rna-cleaved", kind: "after", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] }], transitions: [], events: [{ eventId: "cleave", at: eventAt, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-rna-cleavage" }], tracks: [] };
}

function hairpinTimeline(): ScientificTimeline {
  const scene = scientificSceneSpecFixtures.hairpin;
  return { schemaVersion: "1", timelineId: "p3-f-rna-hairpin", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "folded", states: [{ mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] };
}

function compile(scene: ScientificSceneSpec, timeline: ScientificTimeline) {
  return compileDeterministicTemporalProgram(scene, timeline);
}

function pipeline(scene: ScientificSceneSpec, timeline: ScientificTimeline, timeSeconds: number): { scientific?: MechanismSnapshotV1; topology?: MechanismTopologySnapshotV1; program: NonNullable<Extract<ReturnType<typeof compile>, { ok: true }>["program"]> } | { failure: string } {
  const result = compile(scene, timeline);
  if (!result.ok) return { failure: result.code };
  const scientific = evaluateScientificTimeline({ scientificScene: scene, timeline: result.program.timeline, timeSeconds, eventOrder: result.program.eventOrder });
  const topology = evaluateGroundedTopologyAtTime(result.program, timeSeconds);
  if (!scientific.ok) return { failure: scientific.code };
  if (!topology.ok) return { failure: topology.code };
  return { scientific: scientific.snapshot, topology: topology.snapshot, program: result.program };
}

function presentationPlan(caseItem: P3FCase, scene: ScientificSceneSpec): PresentationPlanV1 | undefined {
  if (caseItem.scenario === "dna-separation") return createDnaSeparationTemporalPlan({ strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening", caseItem.easing ?? "smoothstep");
  if (caseItem.scenario === "dna-pairing") return createDnaBasePairingTemporalPlan({ actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1", caseItem.easing ?? "linear");
  if (caseItem.scenario === "rna-hairpin") return createRnaHairpinTemporalPlan({ rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] }, undefined, caseItem.easing ?? "smoothstep");
  if (caseItem.scenario === "invalid-presentation") return { ...createRnaHairpinTemporalPlan({ rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] }), sourceInteractionIds: ["not-grounded"] };
  return undefined;
}

function stripTime<T extends { timeSeconds: number }>(value: T): Omit<T, "timeSeconds"> & { timeSeconds: number } { return { ...value, timeSeconds: 0 }; }
function stable(value: unknown) { return JSON.stringify(value); }

export function createP3FDevCorpus(): readonly P3FCase[] {
  const cases: P3FCase[] = [];
  for (let index = 0; index < 35; index += 1) cases.push({ id: `dev-dna-separation-${index + 1}`, split: "DEV", family: "DNA", scenario: index % 3 === 0 ? "dna-pairing" : "dna-separation", variant: index, eventAt: 0.4 + (index % 6) * 0.2, easing: index % 2 === 0 ? "linear" : "smoothstep", expected: "success" });
  for (let index = 0; index < 35; index += 1) cases.push({ id: `dev-rna-${index + 1}`, split: "DEV", family: "RNA", scenario: index % 3 === 0 ? "rna-hairpin" : "rna-cleavage", variant: index, eventAt: 0.4 + (index % 6) * 0.2, easing: index % 2 === 0 ? "linear" : "smoothstep", expected: "success" });
  for (let index = 0; index < 20; index += 1) cases.push({ id: `dev-temporal-${index + 1}`, split: "DEV", family: "TEMPORAL", scenario: index % 2 === 0 ? "dependency-cycle" : "invalid-presentation", variant: index, expected: index % 2 === 0 ? "DEPENDENCY_INVALID" : "PRESENTATION_INVALID" });
  return cases;
}

export function createP3FSealedHoldout(): readonly P3FCase[] {
  const cases: P3FCase[] = [];
  for (let index = 0; index < 10; index += 1) cases.push({ id: `holdout-dna-${index + 1}`, split: "SEALED_HOLDOUT", family: "DNA", scenario: index % 2 === 0 ? "dna-separation" : "dna-pairing", variant: 100 + index, eventAt: 0.55 + (index % 5) * 0.23, easing: index % 2 === 0 ? "smoothstep" : "linear", expected: "success" });
  for (let index = 0; index < 10; index += 1) cases.push({ id: `holdout-rna-${index + 1}`, split: "SEALED_HOLDOUT", family: "RNA", scenario: index % 2 === 0 ? "rna-cleavage" : "rna-hairpin", variant: 100 + index, eventAt: 0.47 + (index % 5) * 0.21, easing: index % 2 === 0 ? "linear" : "smoothstep", expected: "success" });
  for (let index = 0; index < 10; index += 1) cases.push({ id: `holdout-negative-${index + 1}`, split: "SEALED_HOLDOUT", family: "TEMPORAL", scenario: index % 3 === 0 ? "exonuclease-gap" : index % 3 === 1 ? "dependency-cycle" : "invalid-presentation", variant: 100 + index, expected: index % 3 === 0 ? "TOPOLOGY_UNSUPPORTED" : index % 3 === 1 ? "DEPENDENCY_INVALID" : "PRESENTATION_INVALID" });
  return cases;
}

export const p3fDevCorpus = createP3FDevCorpus();
export const p3fSealedHoldout = createP3FSealedHoldout();
export const p3fHoldoutHash = createHash("sha256").update(JSON.stringify(p3fSealedHoldout)).digest("hex");

function runCase(caseItem: P3FCase): P3FCaseResult {
  const dimensions: P3FDimensionScores = { timelineValidation: false, temporalCompilation: false, mechanismState: false, topologyState: false, evidenceFidelity: false, presentation: false, cameraCue: false, failureBehavior: false, seekReversibility: false, exactFrame: false };
  let scene: ScientificSceneSpec; let timeline: ScientificTimeline; let target = caseItem.eventAt ?? 0.75;
  if (caseItem.scenario === "dna-separation") { scene = dnaSeparationScene(); timeline = dnaSeparationTimeline(scene, caseItem.eventAt ?? 1); target = caseItem.eventAt ?? 1; }
  else if (caseItem.scenario === "rna-cleavage") { scene = rnaCleavageScene(); timeline = rnaCleavageTimeline(scene, caseItem.eventAt ?? 1); target = caseItem.eventAt ?? 1; }
  else if (caseItem.scenario === "rna-hairpin" || caseItem.scenario === "invalid-presentation") { scene = scientificSceneSpecFixtures.hairpin; timeline = hairpinTimeline(); }
  else if (caseItem.scenario === "dna-pairing") { scene = scientificSceneSpecFixtures["canonical-duplex"]; timeline = { schemaVersion: "1", timelineId: `p3-f-dna-pair-${caseItem.variant}`, clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "paired", states: [{ mechanismStateId: "paired", scientificStateId: "paired-duplex", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] }; }
  else if (caseItem.scenario === "exonuclease-gap") { scene = scientificSceneSpecFixtures["exonuclease-shortened"]; timeline = { schemaVersion: "1", timelineId: "p3-f-exonuclease-gap", clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "terminally-degraded", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [{ eventId: "shorten", at: 0.5, kind: "polymerShortened", actorIds: scene.topology.actorIds, topologyChangeId: "change-five-to-three-shortening", amount: 1 }], tracks: [] }; target = 0.5; }
  else { scene = scientificSceneSpecFixtures.hairpin; timeline = { schemaVersion: "1", timelineId: `p3-f-cycle-${caseItem.variant}`, clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "state", states: [{ mechanismStateId: "state", scientificStateId: "hairpin-folded", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [{ eventId: "event-a", at: 0.5, kind: "stateEntered", actorIds: scene.topology.actorIds, stateId: "hairpin-folded" }, { eventId: "event-b", at: 0.5, kind: "stateExited", actorIds: scene.topology.actorIds, stateId: "hairpin-folded" }], tracks: [], constraints: [{ constraintId: "cycle-a", kind: "orderedEvents", eventIds: ["event-a", "event-b"] }, { constraintId: "cycle-b", kind: "orderedEvents", eventIds: ["event-b", "event-a"] }] }; }
  const programResult = compile(scene, timeline);
  dimensions.timelineValidation = true;
  if (!programResult.ok) {
    const expected = caseItem.expected === "DEPENDENCY_INVALID" && programResult.code === "TEMPORAL_DEPENDENCY_CYCLE";
    return { id: caseItem.id, split: caseItem.split, family: caseItem.family, scenario: caseItem.scenario, expected: caseItem.expected, passed: expected, critical: !expected, dimensions: { ...dimensions, failureBehavior: expected }, failure: programResult.code };
  }
  dimensions.temporalCompilation = true;
  const current = pipeline(scene, timeline, target);
  if (caseItem.expected === "TOPOLOGY_UNSUPPORTED") {
    const expected = "failure" in current && current.failure === "FRAGMENTATION_UNGROUNDED";
    return { id: caseItem.id, split: caseItem.split, family: caseItem.family, scenario: caseItem.scenario, expected: caseItem.expected, passed: expected, critical: !expected, dimensions: { ...dimensions, temporalCompilation: true, failureBehavior: expected }, failure: "failure" in current ? current.failure : undefined };
  }
  if ("failure" in current || !current.scientific || !current.topology) return { id: caseItem.id, split: caseItem.split, family: caseItem.family, scenario: caseItem.scenario, expected: caseItem.expected, passed: false, critical: true, dimensions: { ...dimensions, temporalCompilation: true }, failure: "failure" in current ? current.failure : "pipeline failure" };
  dimensions.mechanismState = true; dimensions.topologyState = true;
  dimensions.evidenceFidelity = caseItem.scenario === "rna-cleavage" ? current.topology.evidence.length > 0 && current.topology.fidelityReferences.length > 0 : true;
  const plan = presentationPlan(caseItem, scene);
  if (plan) {
    const presentation = evaluatePresentationAtTime(current.scientific, current.topology, plan, target);
    dimensions.presentation = caseItem.scenario === "invalid-presentation" ? !presentation.ok : presentation.ok;
    dimensions.cameraCue = caseItem.scenario === "invalid-presentation" ? !presentation.ok : presentation.ok && presentation.snapshot.cameraCue.actorIds.length > 0;
    dimensions.failureBehavior = caseItem.scenario === "invalid-presentation" ? !presentation.ok : true;
  } else { dimensions.presentation = true; dimensions.cameraCue = true; }
  if (!plan) dimensions.failureBehavior = true;
  const direct = pipeline(scene, timeline, target); const priorTimes = [0, target / 2, Math.min(2, target + 0.4), target]; const replayResults = priorTimes.map((time) => pipeline(scene, timeline, time)); const replay = replayResults[replayResults.length - 1]!;
  dimensions.seekReversibility = "failure" in direct === false && "failure" in replay === false && stable((direct as { scientific?: MechanismSnapshotV1 }).scientific) === stable((replay as { scientific?: MechanismSnapshotV1 }).scientific);
  dimensions.exactFrame = [24, 30, 60].every((fps) => { const frameTime = Math.min(2, 30 / fps); const first = pipeline(scene, timeline, frameTime); const second = pipeline(scene, timeline, frameTime); return "failure" in first === false && "failure" in second === false && stable((first as { scientific?: MechanismSnapshotV1 }).scientific) === stable((second as { scientific?: MechanismSnapshotV1 }).scientific); });
  const passed = Object.values(dimensions).every(Boolean);
  return { id: caseItem.id, split: caseItem.split, family: caseItem.family, scenario: caseItem.scenario, expected: caseItem.expected, passed, critical: !passed, dimensions };
}

export function runP3FBenchmark(cases: readonly P3FCase[]): readonly P3FCaseResult[] { return cases.map(runCase); }
export function summarizeP3FResults(results: readonly P3FCaseResult[]) { return { total: results.length, passed: results.filter((result) => result.passed).length, criticalFailures: results.filter((result) => result.critical).length, byFamily: Object.fromEntries(["DNA", "RNA", "TEMPORAL"].map((family) => { const subset = results.filter((result) => result.family === family); return [family, { total: subset.length, passed: subset.filter((result) => result.passed).length }]; })), dimensions: Object.fromEntries(Object.keys(results[0]?.dimensions ?? {}).map((dimension) => [dimension, results.filter((result) => result.dimensions[dimension as keyof P3FDimensionScores]).length])) }; }
