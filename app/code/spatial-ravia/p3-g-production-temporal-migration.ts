/** P3-G: production temporal migration seam for the registered owners. */

import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { DnaBasePairingOwnerView, DnaStrandSeparationOwnerView, RnaHairpinOwnerView, RnaExonucleaseOwnerView } from "./p2-j1-owner-scientific-views.ts";
import { compileDeterministicTemporalProgram, type DeterministicTemporalProgramV1 } from "./p3-c-deterministic-temporal-semantics.ts";
import { evaluateScientificTimeline, type MechanismSnapshotV1, type PlaybackCursorV1 } from "./p3-b-mechanism-state-kernel.ts";
import { evaluateGroundedTopologyAtTime, type MechanismTopologySnapshotV1 } from "./p3-d-grounded-topology-executor.ts";
import { advancePresentationCursor, createDnaBasePairingTemporalPlan, createDnaSeparationTemporalPlan, createPresentationPlaybackCursor, createRnaExonucleaseTemporalPlan, createRnaHairpinTemporalPlan, evaluatePresentationCursorFrame, projectDnaBasePairingOwnerInput, projectDnaSeparationOwnerInput, projectRnaExonucleaseOwnerInput, projectRnaHairpinOwnerInput, seekPresentationCursor, restartPresentationCursor, setPresentationPlaybackRate, type PresentationMechanismSnapshotV1, type PresentationOwnerInput, type PresentationOwnerProjectionResult, type PresentationPlanV1 } from "./p3-e-presentation-synchronization.ts";

export const productionTemporalOwnerRegistry = [
  { capabilityId: "dna-base-pairing", ownerId: "DnaBasePairInteractionPresentation" },
  { capabilityId: "dna-strand-separation", ownerId: "DnaStrandSeparationPresentation" },
  { capabilityId: "rna-secondary-structure", ownerId: "RnaSecondaryStructurePresentation" },
  { capabilityId: "rna-exonuclease-degradation", ownerId: "RnaDegradationPresentation" },
] as const;
export type ProductionTemporalCapabilityId = (typeof productionTemporalOwnerRegistry)[number]["capabilityId"];

export type ProductionTemporalOwnerView = DnaBasePairingOwnerView | DnaStrandSeparationOwnerView | RnaHairpinOwnerView | RnaExonucleaseOwnerView;
export type ProductionTemporalMigrationInput = Readonly<{
  capabilityId: ProductionTemporalCapabilityId;
  ownerView: ProductionTemporalOwnerView;
  scientificScene: ScientificSceneSpec;
  timeline: ScientificTimeline;
  presentationPlan: PresentationPlanV1;
}>;
export type ProductionTemporalMigrationV1 = Readonly<{
  schemaVersion: "1";
  capabilityId: ProductionTemporalCapabilityId;
  ownerId: (typeof productionTemporalOwnerRegistry)[number]["ownerId"];
  scientificScene: ScientificSceneSpec;
  timeline: ScientificTimeline;
  program: DeterministicTemporalProgramV1;
  presentationPlan: PresentationPlanV1;
}>;

export type ProductionTemporalFailureCode = "PRODUCTION_TEMPORAL_INVALID" | "PRODUCTION_TEMPORAL_OWNER_UNAVAILABLE" | "PRODUCTION_TEMPORAL_GROUNDING_FAILURE" | "PRODUCTION_TEMPORAL_PRESENTATION_FAILURE";
export type ProductionTemporalFailure = Readonly<{ ok: false; code: ProductionTemporalFailureCode; reasons: readonly string[] }>;
export type ProductionTemporalFrame = Readonly<{ ok: true; cursor: PlaybackCursorV1; mechanism: MechanismSnapshotV1; topology: MechanismTopologySnapshotV1; presentation: PresentationMechanismSnapshotV1; ownerInput: PresentationOwnerInput } | ProductionTemporalFailure>;
export type ProductionTemporalMigrationResult = Readonly<{ ok: true; migration: ProductionTemporalMigrationV1 } | ProductionTemporalFailure>;

const fail = (code: ProductionTemporalFailureCode, ...reasons: string[]): ProductionTemporalFailure => ({ ok: false, code, reasons });
const ownerForCapability = (capabilityId: ProductionTemporalCapabilityId) => productionTemporalOwnerRegistry.find((entry) => entry.capabilityId === capabilityId);

export function createProductionTemporalMigration(input: ProductionTemporalMigrationInput): ProductionTemporalMigrationResult {
  const registered = ownerForCapability(input.capabilityId);
  if (!registered || registered.ownerId !== input.presentationPlan.ownerId) return fail("PRODUCTION_TEMPORAL_OWNER_UNAVAILABLE", "capability has no matching registered temporal owner");
  const compiled = compileDeterministicTemporalProgram(input.scientificScene, input.timeline);
  if (!compiled.ok) return fail("PRODUCTION_TEMPORAL_INVALID", compiled.code, ...compiled.reasons);
  return { ok: true, migration: { schemaVersion: "1", capabilityId: input.capabilityId, ownerId: registered.ownerId, scientificScene: input.scientificScene, timeline: input.timeline, program: compiled.program, presentationPlan: input.presentationPlan } };
}

function projectOwner(migration: ProductionTemporalMigrationV1, mechanism: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1, timeSeconds: number): PresentationOwnerProjectionResult<PresentationOwnerInput> {
  switch (migration.ownerId) {
    case "DnaBasePairInteractionPresentation": return projectDnaBasePairingOwnerInput(mechanism, topology, migration.presentationPlan, timeSeconds);
    case "DnaStrandSeparationPresentation": return projectDnaSeparationOwnerInput(mechanism, topology, migration.presentationPlan, timeSeconds);
    case "RnaSecondaryStructurePresentation": return projectRnaHairpinOwnerInput(mechanism, topology, migration.presentationPlan, timeSeconds);
    case "RnaDegradationPresentation": return projectRnaExonucleaseOwnerInput(mechanism, topology, migration.presentationPlan, timeSeconds);
  }
}

export function evaluateProductionTemporalFrame(migration: ProductionTemporalMigrationV1, cursor: PlaybackCursorV1): ProductionTemporalFrame {
  const timeSeconds = cursor.timeSeconds;
  const mechanism = evaluateScientificTimeline({ scientificScene: migration.scientificScene, timeline: migration.program.timeline, timeSeconds, eventOrder: migration.program.eventOrder });
  if (!mechanism.ok) return fail("PRODUCTION_TEMPORAL_GROUNDING_FAILURE", mechanism.code, ...mechanism.reasons);
  const topology = evaluateGroundedTopologyAtTime(migration.program, timeSeconds);
  if (!topology.ok) return fail("PRODUCTION_TEMPORAL_GROUNDING_FAILURE", topology.code, ...topology.reasons);
  const owner = projectOwner(migration, mechanism.snapshot, topology.snapshot, timeSeconds);
  if (!owner.ok) return fail("PRODUCTION_TEMPORAL_PRESENTATION_FAILURE", owner.code, ...owner.reasons);
  const presentation = evaluatePresentationCursorFrame(cursor, mechanism.snapshot, topology.snapshot, migration.presentationPlan);
  if (!presentation.ok) return fail("PRODUCTION_TEMPORAL_PRESENTATION_FAILURE", presentation.code, ...presentation.reasons);
  return { ok: true, cursor, mechanism: mechanism.snapshot, topology: topology.snapshot, presentation: presentation.snapshot, ownerInput: owner.input };
}

export function createProductionTemporalCursor(migration: ProductionTemporalMigrationV1): PlaybackCursorV1 { return createPresentationPlaybackCursor(migration.timeline.timelineId, migration.timeline.clock.duration); }
export function advanceProductionTemporalCursor(cursor: PlaybackCursorV1, deltaSeconds: number, durationSeconds: number): PlaybackCursorV1 { return advancePresentationCursor(cursor, deltaSeconds, durationSeconds); }
export function seekProductionTemporalCursor(cursor: PlaybackCursorV1, timeSeconds: number, durationSeconds: number): PlaybackCursorV1 { return seekPresentationCursor(cursor, timeSeconds, durationSeconds); }
export function restartProductionTemporalCursor(cursor: PlaybackCursorV1): PlaybackCursorV1 { return restartPresentationCursor(cursor); }
export function setProductionTemporalRate(cursor: PlaybackCursorV1, rate: number): PlaybackCursorV1 { return setPresentationPlaybackRate(cursor, rate); }

export function createDnaPairingProductionMigration(scene: ScientificSceneSpec, timeline: ScientificTimeline, view: DnaBasePairingOwnerView, interactionId: string): ProductionTemporalMigrationResult {
  return createProductionTemporalMigration({ capabilityId: "dna-base-pairing", ownerView: view, scientificScene: scene, timeline, presentationPlan: createDnaBasePairingTemporalPlan(view, interactionId) });
}
export function createDnaSeparationProductionMigration(scene: ScientificSceneSpec, timeline: ScientificTimeline, view: DnaStrandSeparationOwnerView, interactionId: string, transitionId: string): ProductionTemporalMigrationResult {
  return createProductionTemporalMigration({ capabilityId: "dna-strand-separation", ownerView: view, scientificScene: scene, timeline, presentationPlan: createDnaSeparationTemporalPlan(view, interactionId, transitionId) });
}
export function createRnaHairpinProductionMigration(scene: ScientificSceneSpec, timeline: ScientificTimeline, view: RnaHairpinOwnerView): ProductionTemporalMigrationResult {
  return createProductionTemporalMigration({ capabilityId: "rna-secondary-structure", ownerView: view, scientificScene: scene, timeline, presentationPlan: createRnaHairpinTemporalPlan(view) });
}
export function createRnaExonucleaseProductionMigration(scene: ScientificSceneSpec, timeline: ScientificTimeline, view: RnaExonucleaseOwnerView, transitionId: string): ProductionTemporalMigrationResult {
  return createProductionTemporalMigration({ capabilityId: "rna-exonuclease-degradation", ownerView: view, scientificScene: scene, timeline, presentationPlan: createRnaExonucleaseTemporalPlan(view, transitionId) });
}
