/** D-F: bounded cytoskeletal transport and endocytosis over the D-D authority. */

import { actorId, type ScientificActor, type ScientificActorId } from "./scientific-actor.ts";
import { evaluateScientificTimeline, type MechanismSnapshotV1 } from "./p3-b-mechanism-state-kernel.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { validateCellularScientificScene, type CellularScientificSceneV1 } from "./cellular-localization.ts";
import { createCanonicalSecretoryPathwayProgram, evaluateSecretoryPathwayAtTime, type SecretoryProgramV1 } from "./secretory-pathway.ts";

export const intracellularTransportSchemaVersion = "1" as const;
export const intracellularTransportOwnerId = "INTRACELLULAR_TRANSPORT_CELLULAR_V1" as const;
export type FilamentType = "MICROTUBULE" | "ACTIN_FILAMENT";
export type FilamentPolarity = "PLUS_END" | "MINUS_END" | "BARBED_END" | "POINTED_END";
export type MotorClass = "KINESIN" | "CYTOPLASMIC_DYNEIN" | "MYOSIN";
export type TransportProgress = "DETACHED" | "ATTACHING" | "TRACK_BOUND" | "TRANSPORTING" | "PAUSED" | "ARRIVED" | "RELEASED";
export type EndocyticMembraneState = "SURFACE" | "COATED_PIT" | "INVAGINATING" | "SCISSION" | "INDEPENDENT_VESICLE" | "FUSED_EARLY_ENDOSOME";

export type CytoskeletalFilamentV1 = Readonly<{ filamentId: string; filamentType: FilamentType; polarity: FilamentPolarity; minusEndContext: "MTOC_ASSOCIATED" | "PERIPHERAL"; plusEndContext: "PERIPHERAL" | "MTOC_ASSOCIATED"; compartmentId: string; fidelity: "S2_SCHEMATIC"; provenanceRefs: readonly string[] }>;
export type MotorV1 = Readonly<{ motorId: ScientificActorId; motorClass: MotorClass; compatibleFilamentType: FilamentType; preferredDirection: FilamentPolarity; activity: "AVAILABLE" | "CARGO_BOUND" | "TRACK_BOUND" | "PROCESSIVE_TRANSPORT" | "RELEASED"; ATPRequirement: "ATP_DEPENDENT"; fidelity: "S2_SCHEMATIC" }>;
export type CargoAdaptorAssociationV1 = Readonly<{ cargoId: ScientificActorId; adaptorId: ScientificActorId; motorId: ScientificActorId; state: "UNBOUND" | "CARGO_BOUND" | "TRACK_BOUND" }>;
export type IntracellularTransportEventKind = "CARGO_ADAPTOR_ASSOCIATED" | "MOTOR_CARGO_BOUND" | "TRACK_BOUND" | "TRANSPORT_STARTED" | "TRANSPORT_ARRIVED" | "MOTOR_RELEASED" | "SURFACE_CARGO_PRESENT" | "COATED_PIT_FORMED" | "MEMBRANE_INVAGINATING" | "ENDOCYTIC_SCISSION" | "ENDOCYTIC_VESICLE_INDEPENDENT" | "ENDOCYTIC_VESICLE_DOCKED" | "ENDOCYTIC_FUSION" | "EARLY_ENDOSOME_ENTRY" | "ENDOSOMAL_SORTING";
export type IntracellularTransportEventV1 = Readonly<{ eventId: string; timelineEventId: string; at: number; kind: IntracellularTransportEventKind; actorIds: readonly ScientificActorId[]; dependsOnEventIds?: readonly string[] }>;

export type IntracellularTransportProgramV1 = Readonly<{
  schemaVersion: typeof intracellularTransportSchemaVersion;
  programId: string;
  ownerId: typeof intracellularTransportOwnerId;
  secretoryProgram: SecretoryProgramV1;
  cellularScene: CellularScientificSceneV1;
  timeline: ScientificTimeline;
  filaments: readonly CytoskeletalFilamentV1[];
  motors: readonly MotorV1[];
  associations: readonly CargoAdaptorAssociationV1[];
  events: readonly IntracellularTransportEventV1[];
  endocytosis: Readonly<{ receptorId: ScientificActorId; ligandId: ScientificActorId; coatId: ScientificActorId; vesicleId: ScientificActorId; earlyEndosomeMembraneId: string; earlyEndosomeLumenId: string; sortingOutcome: "RECYCLING" | "DEGRADATIVE_ROUTE_DOWNSTREAM_UNSUPPORTED_D_V1" }>;
  fidelity: "S2_SCHEMATIC";
}>;

export type IntracellularTransportSnapshotV1 = Readonly<{
  schemaVersion: "1"; programId: string; timeSeconds: number; p3Snapshot: MechanismSnapshotV1;
  secretoryVesicleId: ScientificActorId; trackId: string | null; trackPolarity: FilamentPolarity | null; motorId: ScientificActorId | null; motorClass: MotorClass | null;
  cargoId: ScientificActorId | null; adaptorId: ScientificActorId | null; transportProgress: TransportProgress; transportDirection: FilamentPolarity | null; sourceLocalization: string | null; destinationLocalization: string | null;
  endocyticMembraneState: EndocyticMembraneState; receptorId: ScientificActorId; receptorDomainSide: { extracellularDomain: "EXTRACELLULAR_FACE" | "LUMINAL"; cytosolicDomain: "CYTOSOLIC" }; endocyticVesicleId: ScientificActorId | null; earlyEndosomeLocalization: boolean; sortingOutcome: "NONE" | "RECYCLING" | "DEGRADATIVE_ROUTE_DOWNSTREAM_UNSUPPORTED_D_V1"; appliedEventIds: readonly string[];
}>;
export type IntracellularTransportResult = Readonly<{ ok: true; snapshot: IntracellularTransportSnapshotV1 }> | Readonly<{ ok: false; code: string; reasons: readonly string[] }>;
export type IntracellularTransportValidation = { valid: true; issues: [] } | { valid: false; issues: Array<{ path: string; message: string }> };

const sid = (value: string) => actorId(value);
const event = (eventId: string, at: number, kind: IntracellularTransportEventKind, actorIds: readonly ScientificActorId[], dependsOnEventIds?: readonly string[]): IntracellularTransportEventV1 => ({ eventId, timelineEventId: eventId, at, kind, actorIds, ...(dependsOnEventIds ? { dependsOnEventIds } : {}) });
const extraActor = (id: string, semanticTypeId: ScientificActor["semanticTypeId"], role: ScientificActor["role"] = "context", scope: ScientificActor["scope"] = "cellularContext"): ScientificActor => ({ actorId: sid(id), semanticTypeId, role, scope });

function extendScene(base: CellularScientificSceneV1, sourceId: string): CellularScientificSceneV1 {
  const actors = [...base.scene.actors, extraActor("microtubule-1", "functionalRegion"), extraActor("kinesin-1", "motorProtein", "enzyme", "molecularComplex"), extraActor("dynein-1", "motorProtein", "enzyme", "molecularComplex"), extraActor("secretory-adaptor-1", "complex", "context", "molecularComplex"), extraActor("endocytic-receptor-1", "receptor", "cargo"), extraActor("endocytic-ligand-1", "protein", "cargo"), extraActor("clathrin-coat-1", "complex", "context", "molecularComplex"), extraActor("endocytic-vesicle-1", "vesicle", "cargo"), extraActor("early-endosome-membrane", "membrane"), extraActor("early-endosome-lumen", "compartment")];
  const compartments = [...base.cellular.compartments, { compartmentId: "early-endosome-membrane", type: "EARLY_ENDOSOME_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const }, { compartmentId: "early-endosome-lumen", type: "EARLY_ENDOSOME_LUMEN" as const, enclosingMembraneId: "early-endosome-membrane", fidelity: "S2_SCHEMATIC" as const }];
  const compartmentRelations = [...base.cellular.compartmentRelations, { relationId: "early-endosome-lumen-of", kind: "LUMEN_OF" as const, subjectId: "early-endosome-lumen", objectId: "early-endosome-membrane" }, { relationId: "early-endosome-cytosol", kind: "ADJACENT_TO" as const, subjectId: "early-endosome-membrane", objectId: "cytosol" }];
  const localizations = [...base.cellular.localizations, { actorId: sid("microtubule-1"), compartmentId: "cytosol", localizationKind: "IN_COMPARTMENT" as const }, { actorId: sid("endocytic-receptor-1"), compartmentId: "plasma-membrane", localizationKind: "MEMBRANE_EMBEDDED" as const, membraneId: "plasma-membrane", membraneSide: "CYTOSOLIC" as const }, { actorId: sid("endocytic-receptor-1"), compartmentId: "extracellular-space", localizationKind: "EXTRACELLULAR_FACE" as const, membraneId: "plasma-membrane", membraneSide: "EXTRACELLULAR" as const }, { actorId: sid("endocytic-vesicle-1"), compartmentId: "cytosol", localizationKind: "MEMBRANE_ASSOCIATED" as const, membraneId: "early-endosome-membrane", membraneSide: "CYTOSOLIC" as const }, { actorId: sid("early-endosome-lumen"), compartmentId: "early-endosome-lumen", localizationKind: "IN_COMPARTMENT" as const }];
  return { scene: { ...base.scene, actors, topology: { ...base.scene.topology, actorIds: actors.map((item) => item.actorId) } }, cellular: { ...base.cellular, compartments, compartmentRelations, localizations } };
}

export function createCanonicalIntracellularTransportProgram(): IntracellularTransportProgramV1 {
  const secretoryProgram = createCanonicalSecretoryPathwayProgram();
  const sourceId = secretoryProgram.cellularScene.scene.fidelityProvenance.sources[0]!.sourceId;
  const events = [
    event("surface-cargo-present", 2, "SURFACE_CARGO_PRESENT", [sid("endocytic-receptor-1"), sid("endocytic-ligand-1")]), event("coated-pit-formed", 2.3, "COATED_PIT_FORMED", [sid("endocytic-receptor-1"), sid("clathrin-coat-1")], ["surface-cargo-present"]), event("membrane-invaginating", 2.7, "MEMBRANE_INVAGINATING", [sid("endocytic-receptor-1"), sid("clathrin-coat-1")], ["coated-pit-formed"]), event("endocytic-scission", 3, "ENDOCYTIC_SCISSION", [sid("endocytic-receptor-1"), sid("endocytic-vesicle-1")], ["membrane-invaginating"]), event("endocytic-vesicle-independent", 3.2, "ENDOCYTIC_VESICLE_INDEPENDENT", [sid("endocytic-vesicle-1"), sid("endocytic-receptor-1")], ["endocytic-scission"]), event("endocytic-vesicle-docked", 4.6, "ENDOCYTIC_VESICLE_DOCKED", [sid("endocytic-vesicle-1"), sid("early-endosome-membrane")], ["endocytic-vesicle-independent"]), event("endocytic-fusion", 4.8, "ENDOCYTIC_FUSION", [sid("endocytic-vesicle-1"), sid("early-endosome-membrane")], ["endocytic-vesicle-docked"]), event("early-endosome-entry", 4.9, "EARLY_ENDOSOME_ENTRY", [sid("endocytic-receptor-1"), sid("early-endosome-lumen")], ["endocytic-fusion"]), event("endosomal-sorting", 5.2, "ENDOSOMAL_SORTING", [sid("endocytic-receptor-1"), sid("early-endosome-membrane")], ["early-endosome-entry"]),
    event("cargo-adaptor-associated", 15.35, "CARGO_ADAPTOR_ASSOCIATED", [secretoryProgram.actors.secretoryVesicleId, sid("secretory-adaptor-1")]), event("motor-cargo-bound", 15.45, "MOTOR_CARGO_BOUND", [secretoryProgram.actors.secretoryVesicleId, sid("kinesin-1"), sid("secretory-adaptor-1")], ["cargo-adaptor-associated"]), event("secretory-track-bound", 15.5, "TRACK_BOUND", [secretoryProgram.actors.secretoryVesicleId, sid("kinesin-1"), sid("microtubule-1")], ["motor-cargo-bound"]), event("secretory-transport-started", 15.55, "TRANSPORT_STARTED", [secretoryProgram.actors.secretoryVesicleId, sid("kinesin-1"), sid("microtubule-1")], ["secretory-track-bound"]), event("secretory-transport-arrived", 15.7, "TRANSPORT_ARRIVED", [secretoryProgram.actors.secretoryVesicleId, sid("microtubule-1")], ["secretory-transport-started"]), event("motor-released", 15.75, "MOTOR_RELEASED", [secretoryProgram.actors.secretoryVesicleId, sid("kinesin-1")], ["secretory-transport-arrived"]),
  ];
  const baseEvents = secretoryProgram.timeline.events;
  const timelineEvents = [...baseEvents, ...events.map((item) => ({ eventId: item.timelineEventId, at: item.at, kind: "stateEntered" as const, actorIds: [...item.actorIds] }))].sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId));
  const timeline: ScientificTimeline = { ...secretoryProgram.timeline, timelineId: "intracellular-transport-timeline", clock: { ...secretoryProgram.timeline.clock, duration: 17 }, events: timelineEvents };
  const cellularScene = extendScene(secretoryProgram.cellularScene, sourceId);
  return { schemaVersion: "1", programId: "canonical-intracellular-transport", ownerId: intracellularTransportOwnerId, secretoryProgram, cellularScene, timeline, filaments: [{ filamentId: "microtubule-1", filamentType: "MICROTUBULE", polarity: "PLUS_END", minusEndContext: "MTOC_ASSOCIATED", plusEndContext: "PERIPHERAL", compartmentId: "cytosol", fidelity: "S2_SCHEMATIC", provenanceRefs: [sourceId] }, { filamentId: "microtubule-2", filamentType: "MICROTUBULE", polarity: "MINUS_END", minusEndContext: "PERIPHERAL", plusEndContext: "MTOC_ASSOCIATED", compartmentId: "cytosol", fidelity: "S2_SCHEMATIC", provenanceRefs: [sourceId] }], motors: [{ motorId: sid("kinesin-1"), motorClass: "KINESIN", compatibleFilamentType: "MICROTUBULE", preferredDirection: "PLUS_END", activity: "AVAILABLE", ATPRequirement: "ATP_DEPENDENT", fidelity: "S2_SCHEMATIC" }, { motorId: sid("dynein-1"), motorClass: "CYTOPLASMIC_DYNEIN", compatibleFilamentType: "MICROTUBULE", preferredDirection: "MINUS_END", activity: "AVAILABLE", ATPRequirement: "ATP_DEPENDENT", fidelity: "S2_SCHEMATIC" }], associations: [{ cargoId: secretoryProgram.actors.secretoryVesicleId, adaptorId: sid("secretory-adaptor-1"), motorId: sid("kinesin-1"), state: "UNBOUND" }], events, endocytosis: { receptorId: sid("endocytic-receptor-1"), ligandId: sid("endocytic-ligand-1"), coatId: sid("clathrin-coat-1"), vesicleId: sid("endocytic-vesicle-1"), earlyEndosomeMembraneId: "early-endosome-membrane", earlyEndosomeLumenId: "early-endosome-lumen", sortingOutcome: "RECYCLING" }, fidelity: "S2_SCHEMATIC" };
}

const before = (program: IntracellularTransportProgramV1, kind: IntracellularTransportEventKind, t: number) => program.events.some((item) => item.kind === kind && item.at <= t);
const atOrBefore = (program: IntracellularTransportProgramV1, t: number) => program.events.filter((item) => item.at <= t).sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId));

export function evaluateIntracellularTransportAtTime(program: IntracellularTransportProgramV1, timeSeconds: number): IntracellularTransportResult {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > program.timeline.clock.duration) return { ok: false, code: "TRANSPORT_TIME_INVALID", reasons: ["time is outside the transport timeline"] };
  const scene = validateCellularScientificScene(program.cellularScene, program.timeline); if (!scene.valid) return { ok: false, code: "TRANSPORT_SCENE_INVALID", reasons: scene.issues.map((item) => `${item.path}: ${item.message}`) };
  const p3 = evaluateScientificTimeline({ scientificScene: program.cellularScene.scene, timeline: program.timeline, timeSeconds }); if (!p3.ok) return { ok: false, code: "TRANSPORT_P3_UNAVAILABLE", reasons: p3.reasons };
  const secretory = evaluateSecretoryPathwayAtTime(program.secretoryProgram, Math.min(timeSeconds, program.secretoryProgram.timeline.clock.duration)); if (!secretory.ok) return { ok: false, code: "TRANSPORT_SECRETORY_UNAVAILABLE", reasons: secretory.reasons };
  const transportActive = before(program, "TRANSPORT_STARTED", timeSeconds) && !before(program, "MOTOR_RELEASED", timeSeconds);
  const arrived = before(program, "TRANSPORT_ARRIVED", timeSeconds); const bound = before(program, "TRACK_BOUND", timeSeconds);
  const progress: TransportProgress = before(program, "MOTOR_RELEASED", timeSeconds) ? "RELEASED" : arrived ? "ARRIVED" : transportActive ? "TRANSPORTING" : bound ? "TRACK_BOUND" : before(program, "MOTOR_CARGO_BOUND", timeSeconds) ? "ATTACHING" : "DETACHED";
  const independent = before(program, "ENDOCYTIC_VESICLE_INDEPENDENT", timeSeconds); const fused = before(program, "ENDOCYTIC_FUSION", timeSeconds); const sorting = before(program, "ENDOSOMAL_SORTING", timeSeconds);
  const endocyticMembraneState: EndocyticMembraneState = sorting || fused ? "FUSED_EARLY_ENDOSOME" : independent ? "INDEPENDENT_VESICLE" : before(program, "ENDOCYTIC_SCISSION", timeSeconds) ? "SCISSION" : before(program, "MEMBRANE_INVAGINATING", timeSeconds) ? "INVAGINATING" : before(program, "COATED_PIT_FORMED", timeSeconds) ? "COATED_PIT" : "SURFACE";
  const applied = atOrBefore(program, timeSeconds).map((item) => item.eventId);
  return { ok: true, snapshot: { schemaVersion: "1", programId: program.programId, timeSeconds, p3Snapshot: p3.snapshot, secretoryVesicleId: program.secretoryProgram.actors.secretoryVesicleId, trackId: bound ? "microtubule-1" : null, trackPolarity: bound ? "PLUS_END" : null, motorId: bound ? sid("kinesin-1") : null, motorClass: bound ? "KINESIN" : null, cargoId: before(program, "MOTOR_CARGO_BOUND", timeSeconds) ? program.secretoryProgram.actors.secretoryVesicleId : null, adaptorId: before(program, "CARGO_ADAPTOR_ASSOCIATED", timeSeconds) ? sid("secretory-adaptor-1") : null, transportProgress: progress, transportDirection: bound ? "PLUS_END" : null, sourceLocalization: bound ? "GOLGI_REGION" : null, destinationLocalization: arrived ? "PLASMA_MEMBRANE_REGION" : bound ? "CELL_PERIPHERY" : null, endocyticMembraneState, receptorId: program.endocytosis.receptorId, receptorDomainSide: { extracellularDomain: fused ? "LUMINAL" : "EXTRACELLULAR_FACE", cytosolicDomain: "CYTOSOLIC" }, endocyticVesicleId: independent ? program.endocytosis.vesicleId : null, earlyEndosomeLocalization: fused, sortingOutcome: sorting ? program.endocytosis.sortingOutcome : "NONE", appliedEventIds: applied } };
}

export function validateIntracellularTransportProgram(program: IntracellularTransportProgramV1): IntracellularTransportValidation {
  const issues: Array<{ path: string; message: string }> = []; const issue = (path: string, message: string) => issues.push({ path, message });
  if (program.schemaVersion !== "1" || program.ownerId !== intracellularTransportOwnerId) issue("program", "unsupported D-F program identity");
  if (program.filaments.some((item) => item.polarity !== "PLUS_END" && item.polarity !== "MINUS_END" && item.polarity !== "BARBED_END" && item.polarity !== "POINTED_END")) issue("filaments", "filament polarity is invalid");
  for (const motor of program.motors) { const track = program.filaments.find((item) => item.filamentType === motor.compatibleFilamentType && item.polarity === motor.preferredDirection); if (!track) issue(`motors.${motor.motorId}`, "motor has no compatible explicitly polarized track"); }
  for (const association of program.associations) { const motor = program.motors.find((item) => item.motorId === association.motorId); if (!motor) issue(`associations.${association.cargoId}`, "association references a missing motor"); else if (association.motorId === sid("kinesin-1") && motor.preferredDirection !== "PLUS_END") issue(`associations.${association.cargoId}`, "canonical secretory cargo association requires plus-end kinesin transport"); }
  const byId = new Map(program.events.map((item) => [item.eventId, item])); for (const item of program.events) for (const dependency of item.dependsOnEventIds ?? []) { if (!byId.has(dependency) || byId.get(dependency)!.at > item.at) issue(`events.${item.eventId}`, "dependency is missing or occurs after event"); }
  const requires = (a: IntracellularTransportEventKind, b: IntracellularTransportEventKind) => { const first = program.events.find((item) => item.kind === a); const prior = program.events.find((item) => item.kind === b); if (first && (!prior || first.at <= prior.at)) issue(`events.${a}`, `must follow ${b}`); };
  requires("COATED_PIT_FORMED", "SURFACE_CARGO_PRESENT"); requires("ENDOCYTIC_SCISSION", "MEMBRANE_INVAGINATING"); requires("ENDOCYTIC_VESICLE_INDEPENDENT", "ENDOCYTIC_SCISSION"); requires("ENDOCYTIC_FUSION", "ENDOCYTIC_VESICLE_DOCKED"); requires("EARLY_ENDOSOME_ENTRY", "ENDOCYTIC_FUSION"); requires("ENDOSOMAL_SORTING", "EARLY_ENDOSOME_ENTRY"); requires("MOTOR_CARGO_BOUND", "CARGO_ADAPTOR_ASSOCIATED"); requires("TRACK_BOUND", "MOTOR_CARGO_BOUND"); requires("TRANSPORT_STARTED", "TRACK_BOUND"); requires("TRANSPORT_ARRIVED", "TRANSPORT_STARTED");
  const scene = validateCellularScientificScene(program.cellularScene, program.timeline); if (!scene.valid) scene.issues.forEach((item) => issue(item.path, item.message));
  const final = evaluateIntracellularTransportAtTime(program, program.timeline.clock.duration); if (!final.ok) issue("evaluation", `${final.code}: ${final.reasons.join("; ")}`); else if (final.snapshot.receptorDomainSide.extracellularDomain !== "LUMINAL" || !final.snapshot.earlyEndosomeLocalization) issue("evaluation", "endocytic topology did not reach early endosome lumen");
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function serializeIntracellularTransportProgram(program: IntracellularTransportProgramV1): string { return JSON.stringify(program); }
export function serializeIntracellularTransportSnapshot(snapshot: IntracellularTransportSnapshotV1): string { return JSON.stringify(snapshot); }
