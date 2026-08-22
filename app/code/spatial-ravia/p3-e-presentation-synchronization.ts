/** P3-E: deterministic, non-authoritative projection into existing owners. */

import type { ScientificActorId } from "./scientific-actor.ts";
import type { DnaBasePairingOwnerView, DnaStrandSeparationOwnerView, RnaHairpinOwnerView, RnaExonucleaseOwnerView } from "./p2-j1-owner-scientific-views.ts";
import type { MechanismSnapshotV1, PlaybackCursorV1 } from "./p3-b-mechanism-state-kernel.ts";
import { advancePlaybackCursor, clampMechanismTime, createPlaybackCursor } from "./p3-b-mechanism-state-kernel.ts";
import type { MechanismTopologySnapshotV1 } from "./p3-d-grounded-topology-executor.ts";

export const presentationOwnerIds = [
  "DnaBasePairInteractionPresentation",
  "DnaStrandSeparationPresentation",
  "RnaSecondaryStructurePresentation",
  "RnaDegradationPresentation",
] as const;
export type PresentationOwnerId = (typeof presentationOwnerIds)[number];
export type PresentationEasing = "linear" | "smoothstep";

export type PresentationCameraCueV1 = Readonly<{
  kind: "focusActor" | "frameActors" | "overview" | "followActor" | "preserveCurrent";
  actorIds: readonly ScientificActorId[];
  transitionProgress: number;
  durationSeconds?: number;
}>;

export type PresentationPlanV1 = Readonly<{
  schemaVersion: "1";
  ownerId: PresentationOwnerId;
  sourceActorIds: readonly ScientificActorId[];
  sourceInteractionIds: readonly string[];
  sourceStateIds: readonly string[];
  sourceTopologyChangeIds: readonly string[];
  ownerReferenceId?: string;
  transitionId?: string;
  easing: PresentationEasing;
  cameraCue: PresentationCameraCueV1;
  labels: Readonly<{ showState: boolean; showEvents: boolean }>;
}>;

export type PresentationTraceV1 = Readonly<{
  sourceActorIds: readonly ScientificActorId[];
  sourceInteractionIds: readonly string[];
  sourceStateIds: readonly string[];
  sourceTopologyChangeIds: readonly string[];
  sourceEventIds: readonly string[];
}>;

export type PresentationActorStateV1 = Readonly<{ actorId: ScientificActorId; visible: boolean; emphasis: "primary" | "secondary" | "none"; sourceActorId: ScientificActorId }>;
export type PresentationMechanismSnapshotV1 = Readonly<{
  schemaVersion: "1";
  ownerId: PresentationOwnerId;
  timeSeconds: number;
  transitionProgress: number;
  easedProgress: number;
  actors: readonly PresentationActorStateV1[];
  interaction: Readonly<{ active: boolean; visible: boolean; sourceInteractionIds: readonly string[] }>;
  topology: Readonly<{ applied: boolean; sourceTopologyChangeIds: readonly string[] }>;
  visual: Readonly<{ separationAmount: number; bondVisibility: number; morphProgress: number; retainedFragmentVisibility: number; highlight: boolean }>;
  labels: Readonly<{ stateVisible: boolean; eventsVisible: boolean }>;
  cameraCue: PresentationCameraCueV1;
  trace: PresentationTraceV1;
}>;

export type PresentationEvaluationFailureCode = "PRESENTATION_OWNER_UNAVAILABLE" | "PRESENTATION_SCIENTIFIC_STATE_UNAVAILABLE" | "PRESENTATION_PLAN_INVALID" | "PRESENTATION_TEMPORAL_UNSUPPORTED";
export type PresentationEvaluationResult = Readonly<{ ok: true; snapshot: PresentationMechanismSnapshotV1 } | { ok: false; code: PresentationEvaluationFailureCode; reasons: readonly string[] }>;

export type DnaBasePairingTemporalPresentationInput = Readonly<{ ownerId: "DnaBasePairInteractionPresentation"; actorIds: readonly [ScientificActorId, ScientificActorId]; interactionId: string; interactionActive: boolean; bondVisibility: number; sourceInteractionId: string }>;
export type DnaSeparationTemporalPresentationInput = Readonly<{ ownerId: "DnaStrandSeparationPresentation"; strandActorIds: readonly [ScientificActorId, ScientificActorId]; state: "paired" | "opening" | "separated"; openingProgress: number; bubbleProgress: number; separationApplied: boolean; sourceTopologyChangeId: string; sourceInteractionId: string }>;
export type RnaHairpinTemporalPresentationInput = Readonly<{ ownerId: "RnaSecondaryStructurePresentation"; rnaActorId: ScientificActorId; stemGroupId: string; paired: boolean; morphProgress: number; sourceInteractionIds: readonly string[] }>;
export type RnaExonucleaseTemporalPresentationInput = Readonly<{ ownerId: "RnaDegradationPresentation"; rnaActorId: ScientificActorId; retainedActorId: ScientificActorId; state: "intact" | "degrading" | "degraded"; retainedFragmentVisibility: number; sourceTopologyChangeId: string; sourceContinuityId: string }>;

export type PresentationOwnerInput = DnaBasePairingTemporalPresentationInput | DnaSeparationTemporalPresentationInput | RnaHairpinTemporalPresentationInput | RnaExonucleaseTemporalPresentationInput;
export type PresentationOwnerProjectionResult<T> = Readonly<{ ok: true; input: T; snapshot: PresentationMechanismSnapshotV1 } | { ok: false; code: PresentationEvaluationFailureCode; reasons: readonly string[] }>;

const fail = (code: PresentationEvaluationFailureCode, ...reasons: string[]) => ({ ok: false as const, code, reasons });
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const ease = (value: number, easing: PresentationEasing) => easing === "smoothstep" ? value * value * (3 - 2 * value) : value;
const transitionProgress = (scientific: MechanismSnapshotV1, plan: PresentationPlanV1) => plan.transitionId ? scientific.transitions.find((transition) => transition.transitionId === plan.transitionId)?.progress ?? 0 : 0;
const actorExists = (scientific: MechanismSnapshotV1, actorId: ScientificActorId) => scientific.actorStateReferences.some((item) => item.actorId === actorId);
const interactionKnown = (topology: MechanismTopologySnapshotV1, interactionId: string) => topology.activeInteractionIds.includes(interactionId) || topology.inactiveInteractionIds.includes(interactionId);

function validatePlan(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1): string[] {
  const reasons: string[] = [];
  if (!presentationOwnerIds.includes(plan.ownerId)) reasons.push("owner is not registered");
  if (plan.sourceActorIds.some((actorId) => !actorExists(scientific, actorId))) reasons.push("plan references a missing scientific actor");
  if (plan.sourceInteractionIds.some((interactionId) => !interactionKnown(topology, interactionId))) reasons.push("plan references a missing grounded interaction");
  if (plan.transitionId && !scientific.transitions.some((transition) => transition.transitionId === plan.transitionId)) reasons.push("plan references a missing transition");
  const knownTopologyChanges = new Set(scientific.groundedTopology.topologyChangeIds);
  if (plan.sourceTopologyChangeIds.some((changeId) => !knownTopologyChanges.has(changeId))) reasons.push("plan references a topology change not present in the grounded scene");
  if (plan.cameraCue.actorIds.some((actorId) => !actorExists(scientific, actorId))) reasons.push("camera cue references a missing actor");
  return reasons;
}

export function createDnaBasePairingTemporalPlan(view: DnaBasePairingOwnerView, interactionId: string, easing: PresentationEasing = "linear"): PresentationPlanV1 {
  return { schemaVersion: "1", ownerId: "DnaBasePairInteractionPresentation", sourceActorIds: view.actorIds, sourceInteractionIds: [interactionId], sourceStateIds: [], sourceTopologyChangeIds: [], easing, cameraCue: { kind: "frameActors", actorIds: view.actorIds, transitionProgress: 0 }, labels: { showState: true, showEvents: false } };
}

export function createDnaSeparationTemporalPlan(view: DnaStrandSeparationOwnerView, pairInteractionId: string, transitionId: string, easing: PresentationEasing = "smoothstep"): PresentationPlanV1 {
  return { schemaVersion: "1", ownerId: "DnaStrandSeparationPresentation", sourceActorIds: view.strandActorIds, sourceInteractionIds: [pairInteractionId], sourceStateIds: [view.closedStateId, view.openStateId], sourceTopologyChangeIds: [view.separationChangeId], transitionId, easing, cameraCue: { kind: "frameActors", actorIds: view.strandActorIds, transitionProgress: 0, durationSeconds: 1 }, labels: { showState: true, showEvents: true } };
}

export function createRnaHairpinTemporalPlan(view: RnaHairpinOwnerView, transitionId?: string, easing: PresentationEasing = "smoothstep"): PresentationPlanV1 {
  return { schemaVersion: "1", ownerId: "RnaSecondaryStructurePresentation", sourceActorIds: [view.rnaActorId], sourceInteractionIds: view.basePairingInteractionIds, sourceStateIds: [view.pairedStateId], sourceTopologyChangeIds: [], ownerReferenceId: view.pairedRegionGroupId, ...(transitionId ? { transitionId } : {}), easing, cameraCue: { kind: "focusActor", actorIds: [view.rnaActorId], transitionProgress: 0 }, labels: { showState: true, showEvents: false } };
}

export function createRnaExonucleaseTemporalPlan(view: RnaExonucleaseOwnerView, transitionId: string, easing: PresentationEasing = "linear"): PresentationPlanV1 {
  return { schemaVersion: "1", ownerId: "RnaDegradationPresentation", sourceActorIds: [view.rnaActorId, view.retainedActorId], sourceInteractionIds: [view.terminalShorteningInteractionId], sourceStateIds: [view.partiallyDegradedStateId], sourceTopologyChangeIds: [view.topologyChangeId], ownerReferenceId: view.continuityId, transitionId, easing, cameraCue: { kind: "frameActors", actorIds: [view.rnaActorId, view.retainedActorId], transitionProgress: 0 }, labels: { showState: true, showEvents: true } };
}

export function evaluatePresentationAtTime(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1, timeSeconds: number): PresentationEvaluationResult {
  if (!Number.isFinite(timeSeconds) || timeSeconds !== scientific.timeSeconds || timeSeconds !== topology.timeSeconds) return fail("PRESENTATION_TEMPORAL_UNSUPPORTED", "scientific, topology, and presentation times must be the same finite canonical time");
  const reasons = validatePlan(scientific, topology, plan);
  if (reasons.length > 0) return fail("PRESENTATION_PLAN_INVALID", ...reasons);
  const progress = clamp01(transitionProgress(scientific, plan));
  const easedProgress = ease(progress, plan.easing);
  const activeInteraction = plan.sourceInteractionIds.length > 0 && plan.sourceInteractionIds.every((interactionId) => topology.activeInteractionIds.includes(interactionId));
  const appliedTopology = plan.sourceTopologyChangeIds.length > 0 && plan.sourceTopologyChangeIds.every((changeId) => topology.activeTopologyChangeIds.includes(changeId) || topology.separationChangeIds.includes(changeId));
  const actorStates = plan.sourceActorIds.map((actorId, index) => ({ actorId, visible: scientific.actorStateReferences.find((item) => item.actorId === actorId)?.mechanismStateIds.length !== 0, emphasis: index === 0 ? "primary" as const : "secondary" as const, sourceActorId: actorId }));
  const separation = plan.ownerId === "DnaStrandSeparationPresentation" ? (appliedTopology ? 1 : easedProgress) : 0;
  const bondVisibility = plan.ownerId === "DnaBasePairInteractionPresentation" ? (activeInteraction ? 1 : 0) : plan.ownerId === "DnaStrandSeparationPresentation" ? (activeInteraction ? 1 - easedProgress : 0) : activeInteraction ? 1 : 0;
  const retained = plan.ownerId === "RnaDegradationPresentation" ? (appliedTopology ? 1 : easedProgress) : 0;
  const morph = plan.ownerId === "RnaSecondaryStructurePresentation" ? easedProgress : 0;
  const sourceEventIds = scientific.events.filter((event) => event.status === "applied" && event.at <= timeSeconds).map((event) => event.eventId);
  return { ok: true, snapshot: { schemaVersion: "1", ownerId: plan.ownerId, timeSeconds, transitionProgress: progress, easedProgress, actors: actorStates, interaction: { active: activeInteraction, visible: activeInteraction, sourceInteractionIds: plan.sourceInteractionIds }, topology: { applied: appliedTopology, sourceTopologyChangeIds: plan.sourceTopologyChangeIds }, visual: { separationAmount: separation, bondVisibility, morphProgress: morph, retainedFragmentVisibility: retained, highlight: progress > 0 && progress < 1 }, labels: { stateVisible: plan.labels.showState, eventsVisible: plan.labels.showEvents }, cameraCue: { ...plan.cameraCue, transitionProgress: easedProgress }, trace: { sourceActorIds: plan.sourceActorIds, sourceInteractionIds: plan.sourceInteractionIds, sourceStateIds: plan.sourceStateIds, sourceTopologyChangeIds: plan.sourceTopologyChangeIds, sourceEventIds } } };
}

export function projectPresentationOwnerInput(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1, timeSeconds: number): PresentationEvaluationResult {
  return evaluatePresentationAtTime(scientific, topology, plan, timeSeconds);
}

export function projectDnaBasePairingOwnerInput(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1, timeSeconds: number): PresentationOwnerProjectionResult<DnaBasePairingTemporalPresentationInput> {
  const result = evaluatePresentationAtTime(scientific, topology, plan, timeSeconds);
  if (!result.ok) return result;
  if (plan.ownerId !== "DnaBasePairInteractionPresentation" || plan.sourceActorIds.length !== 2 || plan.sourceInteractionIds.length !== 1) return fail("PRESENTATION_OWNER_UNAVAILABLE", "plan is not a DNA base-pair owner plan");
  return { ok: true, snapshot: result.snapshot, input: { ownerId: plan.ownerId, actorIds: [plan.sourceActorIds[0]!, plan.sourceActorIds[1]!] as const, interactionId: plan.sourceInteractionIds[0]!, interactionActive: result.snapshot.interaction.active, bondVisibility: result.snapshot.visual.bondVisibility, sourceInteractionId: plan.sourceInteractionIds[0]! } };
}

export function projectDnaSeparationOwnerInput(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1, timeSeconds: number): PresentationOwnerProjectionResult<DnaSeparationTemporalPresentationInput> {
  const result = evaluatePresentationAtTime(scientific, topology, plan, timeSeconds);
  if (!result.ok) return result;
  if (plan.ownerId !== "DnaStrandSeparationPresentation" || plan.sourceActorIds.length !== 2 || plan.sourceInteractionIds.length !== 1 || plan.sourceTopologyChangeIds.length !== 1) return fail("PRESENTATION_OWNER_UNAVAILABLE", "plan is not a DNA separation owner plan");
  const state = result.snapshot.topology.applied ? "separated" : result.snapshot.transitionProgress > 0 ? "opening" : "paired";
  return { ok: true, snapshot: result.snapshot, input: { ownerId: plan.ownerId, strandActorIds: [plan.sourceActorIds[0]!, plan.sourceActorIds[1]!] as const, state, openingProgress: result.snapshot.transitionProgress, bubbleProgress: result.snapshot.visual.separationAmount, separationApplied: result.snapshot.topology.applied, sourceTopologyChangeId: plan.sourceTopologyChangeIds[0]!, sourceInteractionId: plan.sourceInteractionIds[0]! } };
}

export function projectRnaHairpinOwnerInput(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1, timeSeconds: number): PresentationOwnerProjectionResult<RnaHairpinTemporalPresentationInput> {
  const result = evaluatePresentationAtTime(scientific, topology, plan, timeSeconds);
  if (!result.ok) return result;
  if (plan.ownerId !== "RnaSecondaryStructurePresentation" || plan.sourceActorIds.length !== 1) return fail("PRESENTATION_OWNER_UNAVAILABLE", "plan is not an RNA hairpin owner plan");
  return { ok: true, snapshot: result.snapshot, input: { ownerId: plan.ownerId, rnaActorId: plan.sourceActorIds[0]!, stemGroupId: plan.ownerReferenceId ?? "", paired: result.snapshot.interaction.active, morphProgress: result.snapshot.visual.morphProgress, sourceInteractionIds: plan.sourceInteractionIds } };
}

export function projectRnaExonucleaseOwnerInput(scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1, timeSeconds: number): PresentationOwnerProjectionResult<RnaExonucleaseTemporalPresentationInput> {
  const result = evaluatePresentationAtTime(scientific, topology, plan, timeSeconds);
  if (!result.ok) return result;
  if (plan.ownerId !== "RnaDegradationPresentation" || plan.sourceActorIds.length !== 2 || plan.sourceTopologyChangeIds.length !== 1) return fail("PRESENTATION_OWNER_UNAVAILABLE", "plan is not an RNA exonuclease owner plan");
  return { ok: true, snapshot: result.snapshot, input: { ownerId: plan.ownerId, rnaActorId: plan.sourceActorIds[0]!, retainedActorId: plan.sourceActorIds[1]!, state: result.snapshot.topology.applied ? "degraded" : result.snapshot.transitionProgress > 0 ? "degrading" : "intact", retainedFragmentVisibility: result.snapshot.visual.retainedFragmentVisibility, sourceTopologyChangeId: plan.sourceTopologyChangeIds[0]!, sourceContinuityId: plan.ownerReferenceId ?? "" } };
}

export function createPresentationPlaybackCursor(timelineId: string, durationSeconds: number): PlaybackCursorV1 { return createPlaybackCursor(timelineId, 0, 1, false); }
export function advancePresentationCursor(cursor: PlaybackCursorV1, deltaSeconds: number, durationSeconds: number): PlaybackCursorV1 { return advancePlaybackCursor(cursor, deltaSeconds, durationSeconds); }
export function seekPresentationCursor(cursor: PlaybackCursorV1, timeSeconds: number, durationSeconds: number): PlaybackCursorV1 { return { ...cursor, timeSeconds: clampMechanismTime(timeSeconds, durationSeconds), playing: false }; }
export function restartPresentationCursor(cursor: PlaybackCursorV1): PlaybackCursorV1 { return { ...cursor, timeSeconds: 0, playing: true }; }
export function setPresentationPlaybackRate(cursor: PlaybackCursorV1, rate: number): PlaybackCursorV1 { if (!Number.isFinite(rate) || rate < 0) throw new Error("Invalid presentation playback rate"); return { ...cursor, rate }; }
/** Wall-clock adapters call this after advancing the cursor; no event is applied here. */
export function evaluatePresentationCursorFrame(cursor: PlaybackCursorV1, scientific: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, plan: PresentationPlanV1): PresentationEvaluationResult {
  return evaluatePresentationAtTime(scientific, topology, plan, cursor.timeSeconds);
}
export function serializePresentationSnapshot(snapshot: PresentationMechanismSnapshotV1): string { return JSON.stringify(snapshot); }
