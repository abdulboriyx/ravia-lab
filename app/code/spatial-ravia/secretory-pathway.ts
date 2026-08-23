/** D-D: bounded secretory-protein continuation of the canonical D-C program. */

import type { ScientificActor, ScientificActorId } from "./scientific-actor.ts";
import { actorId } from "./scientific-actor.ts";
import type { ScientificTimeline, MechanismState } from "./scientific-timeline.ts";
import { evaluateScientificTimeline, type MechanismSnapshotV1 } from "./p3-b-mechanism-state-kernel.ts";
import { validateCellularScientificScene, type CellularScientificSceneV1 } from "./cellular-localization.ts";
import { createCanonicalEukaryoticGeneExpressionProgram, evaluateGeneExpressionAtTime, type GeneExpressionProgramV1 } from "./cellular-gene-expression.ts";

export const secretoryPathwaySchemaVersion = "1" as const;
export const secretoryPathwaySpeciesScope = "EUKARYOTIC_SECRETORY" as const;
export const secretoryPathwayOwnerId = "SECRETORY_PATHWAY_CELLULAR_V1" as const;

export const secretoryEventKinds = [
  "SECRETORY_SIGNAL_RECOGNIZED", "SRP_BOUND", "ER_TARGETING_STARTED", "TRANSLOCON_ENGAGED",
  "COTRANSLATIONAL_TRANSLOCATION", "SIGNAL_PEPTIDE_CLEAVED", "ER_LUMEN_RELEASED",
  "ER_FOLDING_PARTIAL", "ER_FOLDING_COMPLETE", "ER_GLYCOSYLATED", "ER_QUALITY_PASS",
  "ER_EXIT_BUDDING", "ER_EXIT_VESICLE_FORMED", "ER_TO_GOLGI_TRANSPORT", "GOLGI_CIS_ENTRY",
  "GOLGI_MEDIAL_ENTRY", "GOLGI_TRANS_ENTRY", "GOLGI_PROCESSING", "CARGO_SORTED",
  "SECRETORY_VESICLE_FORMED", "VESICLE_DOCKED", "SNARE_COMPLEX_ASSEMBLED", "MEMBRANE_FUSION",
  "EXOCYTOSIS_COMPLETED",
] as const;
export type SecretoryEventKind = (typeof secretoryEventKinds)[number];

export type SecretoryActorsV1 = Readonly<{
  proteinId: ScientificActorId;
  signalPeptideRegionId: string;
  srpId: ScientificActorId;
  erMembraneId: ScientificActorId;
  transloconId: ScientificActorId;
  erChaperoneId: ScientificActorId;
  glycanModificationId: ScientificActorId;
  erExitVesicleId: ScientificActorId;
  secretoryVesicleId: ScientificActorId;
  vesicleMembraneId: ScientificActorId;
  vesicleLumenId: ScientificActorId;
  cisGolgiLumenId: ScientificActorId;
  medialGolgiLumenId: ScientificActorId;
  transGolgiLumenId: ScientificActorId;
  tgnId: ScientificActorId;
  plasmaMembraneId: ScientificActorId;
  extracellularSpaceId: string;
  ribosomeId: ScientificActorId;
}>;

export type SecretoryEventV1 = Readonly<{ eventId: string; timelineEventId: string; at: number; kind: SecretoryEventKind; actorIds: readonly ScientificActorId[]; dependsOnEventIds?: readonly string[]; amount?: number }>;
export type SecretoryOutcome = "SECRETED_PROTEIN" | "MEMBRANE_PROTEIN";
export type SecretoryLocalization = "CYTOSOL" | "ER_MEMBRANE_ASSOCIATED" | "TRANSLOCON" | "ER_LUMEN" | "ER_EXIT_VESICLE_LUMEN" | "CIS_GOLGI_LUMEN" | "MEDIAL_GOLGI_LUMEN" | "TRANS_GOLGI_LUMEN" | "SECRETORY_VESICLE_LUMEN" | "EXTRACELLULAR_SPACE";
export type SecretorySignalState = "UNRECOGNIZED" | "SIGNAL_RECOGNIZED" | "SRP_BOUND" | "TARGETING_ER" | "CLEAVED";
export type SecretoryFoldingState = "UNFOLDED" | "PARTIALLY_FOLDED" | "FOLDED" | "MISFOLDED";
export type SecretoryQualityState = "FOLDING" | "PASS" | "RETAINED" | "MISFOLDED";
export type SecretoryVesicleState = "NONE" | "BUDDING" | "INDEPENDENT_TRANSPORT" | "DOCKED" | "FUSED";

export type SecretoryProgramV1 = Readonly<{
  schemaVersion: typeof secretoryPathwaySchemaVersion;
  programId: string;
  ownerId: typeof secretoryPathwayOwnerId;
  speciesScope: typeof secretoryPathwaySpeciesScope;
  geneExpression: GeneExpressionProgramV1;
  cellularScene: CellularScientificSceneV1;
  timeline: ScientificTimeline;
  actors: SecretoryActorsV1;
  outcome: SecretoryOutcome;
  signalPeptide: Readonly<{ regionId: string; startResidue: number; endResidue: number; proteinId: ScientificActorId }>;
  events: readonly SecretoryEventV1[];
  fidelity: "S2_SCHEMATIC";
}>;

export type SecretorySnapshotV1 = Readonly<{
  schemaVersion: typeof secretoryPathwaySchemaVersion;
  programId: string;
  timeSeconds: number;
  p3Snapshot: MechanismSnapshotV1;
  proteinId: ScientificActorId;
  proteinLocalization: SecretoryLocalization;
  proteinIdentityStage: "NASCENT_POLYPEPTIDE" | "ER_TARGETED_CHAIN" | "ER_LUMEN_PROTEIN" | "FOLDED_PROTEIN" | "MODIFIED_CARGO" | "GOLGI_CARGO" | "VESICULAR_CARGO" | "SECRETED_MATURE_PROTEIN";
  translatedResidueCount: number;
  cytosolicChainLength: number;
  translocatingChainLength: number;
  luminalChainLength: number;
  signalState: SecretorySignalState;
  srpState: "AVAILABLE" | "SIGNAL_BOUND" | "RIBOSOME_COMPLEX_BOUND" | "TARGETING_ER" | "RELEASED";
  transloconState: "AVAILABLE" | "ENGAGED" | "RELEASED";
  foldingState: SecretoryFoldingState;
  chaperoneState: "UNBOUND" | "ASSOCIATED" | "RELEASED";
  modificationState: "NONE" | "N_LINKED_GLYCAN_ADDED" | "GOLGI_PROCESSED";
  qualityState: SecretoryQualityState;
  vesicleId: ScientificActorId | null;
  vesicleState: SecretoryVesicleState;
  golgiCompartment: "NONE" | "CIS" | "MEDIAL" | "TRANS" | "TGN";
  cargoContained: boolean;
  dockingState: "NONE" | "DOCKED";
  snareState: "NONE" | "ASSEMBLED";
  membraneContinuity: "SEPARATE" | "FUSED";
  extracellular: boolean;
  appliedEventIds: readonly string[];
}>;

export type SecretoryFailure = Readonly<{ ok: false; code: string; reasons: readonly string[] }>;
export type SecretoryEvaluationResult = Readonly<{ ok: true; snapshot: SecretorySnapshotV1 } | SecretoryFailure>;
export type SecretoryValidationResult = { valid: true; issues: [] } | { valid: false; issues: Array<{ path: string; message: string }> };

const fail = (code: string, ...reasons: string[]): SecretoryEvaluationResult => ({ ok: false, code, reasons });
const sid = (id: string) => actorId(id);
const extraActor = (id: string, semanticTypeId: ScientificActor["semanticTypeId"], role: ScientificActor["role"], scope: ScientificActor["scope"] = "cellularContext"): ScientificActor => ({ actorId: sid(id), semanticTypeId, role, scope });

function addDDEvents(base: GeneExpressionProgramV1, actors: SecretoryActorsV1): SecretoryEventV1[] {
  const rows: Array<[string, number, SecretoryEventKind, readonly ScientificActorId[], string[]?]> = [
    ["secretory-signal-recognized", 9.2, "SECRETORY_SIGNAL_RECOGNIZED", [actors.proteinId]], ["srp-bound", 9.4, "SRP_BOUND", [actors.proteinId, actors.srpId], ["secretory-signal-recognized"]], ["er-targeting-started", 9.7, "ER_TARGETING_STARTED", [actors.proteinId, actors.srpId, base.actors.ribosomeId], ["srp-bound"]], ["translocon-engaged", 10, "TRANSLOCON_ENGAGED", [actors.proteinId, actors.transloconId, base.actors.ribosomeId], ["er-targeting-started"]], ["translocation-early", 10.5, "COTRANSLATIONAL_TRANSLOCATION", [actors.proteinId, actors.transloconId], ["translocon-engaged"]], ["translocation-complete", 11, "COTRANSLATIONAL_TRANSLOCATION", [actors.proteinId, actors.transloconId], ["translocation-early"]], ["signal-cleaved", 11.1, "SIGNAL_PEPTIDE_CLEAVED", [actors.proteinId], ["translocation-complete"]], ["er-lumen-released", 11.3, "ER_LUMEN_RELEASED", [actors.proteinId, actors.transloconId], ["signal-cleaved"]], ["folding-partial", 11.8, "ER_FOLDING_PARTIAL", [actors.proteinId, actors.erChaperoneId], ["er-lumen-released"]], ["folding-complete", 12, "ER_FOLDING_COMPLETE", [actors.proteinId, actors.erChaperoneId], ["folding-partial"]], ["er-glycosylated", 12.2, "ER_GLYCOSYLATED", [actors.proteinId, actors.glycanModificationId], ["folding-complete"]], ["er-quality-pass", 12.8, "ER_QUALITY_PASS", [actors.proteinId], ["er-glycosylated"]], ["er-exit-budding", 13.2, "ER_EXIT_BUDDING", [actors.proteinId, actors.erExitVesicleId], ["er-quality-pass"]], ["er-exit-vesicle-formed", 13.5, "ER_EXIT_VESICLE_FORMED", [actors.proteinId, actors.erExitVesicleId], ["er-exit-budding"]], ["er-to-golgi-transport", 13.7, "ER_TO_GOLGI_TRANSPORT", [actors.proteinId, actors.erExitVesicleId], ["er-exit-vesicle-formed"]], ["golgi-cis-entry", 14, "GOLGI_CIS_ENTRY", [actors.proteinId, actors.erExitVesicleId, actors.cisGolgiLumenId], ["er-to-golgi-transport"]], ["golgi-medial-entry", 14.4, "GOLGI_MEDIAL_ENTRY", [actors.proteinId, actors.medialGolgiLumenId], ["golgi-cis-entry"]], ["golgi-processing", 14.6, "GOLGI_PROCESSING", [actors.proteinId, actors.glycanModificationId], ["golgi-medial-entry"]], ["golgi-trans-entry", 14.8, "GOLGI_TRANS_ENTRY", [actors.proteinId, actors.transGolgiLumenId], ["golgi-processing"]], ["cargo-sorted", 15, "CARGO_SORTED", [actors.proteinId, actors.tgnId], ["golgi-trans-entry"]], ["secretory-vesicle-formed", 15.3, "SECRETORY_VESICLE_FORMED", [actors.proteinId, actors.secretoryVesicleId], ["cargo-sorted"]], ["vesicle-docked", 15.8, "VESICLE_DOCKED", [actors.proteinId, actors.secretoryVesicleId, actors.plasmaMembraneId], ["secretory-vesicle-formed"]], ["snare-assembled", 16, "SNARE_COMPLEX_ASSEMBLED", [actors.secretoryVesicleId, actors.plasmaMembraneId], ["vesicle-docked"]], ["membrane-fusion", 16.2, "MEMBRANE_FUSION", [actors.secretoryVesicleId, actors.plasmaMembraneId], ["snare-assembled"]], ["exocytosis-completed", 16.4, "EXOCYTOSIS_COMPLETED", [actors.proteinId, actors.secretoryVesicleId], ["membrane-fusion"]],
  ];
  return rows.map(([eventId, at, kind, actorIds, dependsOnEventIds]) => ({ eventId, timelineEventId: eventId, at, kind, actorIds, ...(dependsOnEventIds ? { dependsOnEventIds } : {}) }));
}

function buildCellular(base: GeneExpressionProgramV1, actors: SecretoryActorsV1): CellularScientificSceneV1 {
  const sourceId = base.cellularScene.scene.fidelityProvenance.sources[0]!.sourceId;
  const scene = base.cellularScene.scene;
  const extra = [actors.srpId, actors.erMembraneId, actors.transloconId, actors.erChaperoneId, actors.glycanModificationId, actors.erExitVesicleId, actors.secretoryVesicleId, actors.vesicleMembraneId, actors.vesicleLumenId, actors.cisGolgiLumenId, actors.medialGolgiLumenId, actors.transGolgiLumenId, actors.tgnId, actors.plasmaMembraneId].map((id) => String(id));
  const allActors = [...scene.actors, ...extra.map((id) => extraActor(id, ["srp-1", "translocon-1", "er-chaperone-bip", "glycan-1"].includes(id) ? "complex" : id.includes("vesicle") ? "vesicle" : id.includes("membrane") ? "membrane" : id.includes("golgi") || id === "tgn" ? "organelle" : "protein", id === String(actors.proteinId) ? "cargo" : "context"))];
  const compartments = [
    { compartmentId: "cytosol", type: "CYTOSOL" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "rough-er", type: "ER_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "er-lumen", type: "ER_LUMEN" as const, enclosingMembraneId: "rough-er", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "cis-golgi", type: "GOLGI_LUMEN" as const, enclosingMembraneId: "golgi-membrane", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "medial-golgi", type: "GOLGI_LUMEN" as const, enclosingMembraneId: "golgi-membrane", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "trans-golgi", type: "GOLGI_LUMEN" as const, enclosingMembraneId: "golgi-membrane", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "golgi-membrane", type: "GOLGI_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "tgn", type: "GOLGI_LUMEN" as const, enclosingMembraneId: "golgi-membrane", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "er-exit-vesicle-lumen", type: "VESICLE_LUMEN" as const, enclosingMembraneId: "er-exit-vesicle-membrane", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "er-exit-vesicle-membrane", type: "VESICLE_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "secretory-vesicle-lumen", type: "VESICLE_LUMEN" as const, enclosingMembraneId: "secretory-vesicle-membrane", fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "secretory-vesicle-membrane", type: "VESICLE_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "plasma-membrane", type: "PLASMA_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] }, { compartmentId: "extracellular-space", type: "EXTRACELLULAR_SPACE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [sourceId] },
  ];
  const relations = [{ relationId: "er-lumen-of-membrane", kind: "LUMEN_OF" as const, subjectId: "er-lumen", objectId: "rough-er", sourceIds: [sourceId] }, { relationId: "cis-golgi-lumen-of-membrane", kind: "LUMEN_OF" as const, subjectId: "cis-golgi", objectId: "golgi-membrane", sourceIds: [sourceId] }, { relationId: "medial-golgi-lumen-of-membrane", kind: "LUMEN_OF" as const, subjectId: "medial-golgi", objectId: "golgi-membrane", sourceIds: [sourceId] }, { relationId: "trans-golgi-lumen-of-membrane", kind: "LUMEN_OF" as const, subjectId: "trans-golgi", objectId: "golgi-membrane", sourceIds: [sourceId] }, { relationId: "tgn-lumen-of-membrane", kind: "LUMEN_OF" as const, subjectId: "tgn", objectId: "golgi-membrane", sourceIds: [sourceId] }, { relationId: "er-exit-lumen", kind: "LUMEN_OF" as const, subjectId: "er-exit-vesicle-lumen", objectId: "er-exit-vesicle-membrane", sourceIds: [sourceId] }, { relationId: "secretory-lumen", kind: "LUMEN_OF" as const, subjectId: "secretory-vesicle-lumen", objectId: "secretory-vesicle-membrane", sourceIds: [sourceId] }, { relationId: "cytosol-er-side", kind: "ADJACENT_TO" as const, subjectId: "cytosol", objectId: "rough-er", sourceIds: [sourceId] }, { relationId: "plasma-extracellular", kind: "ADJACENT_TO" as const, subjectId: "plasma-membrane", objectId: "extracellular-space", sourceIds: [sourceId] }];
  const protein = actors.proteinId;
  const localizations = [{ actorId: protein, compartmentId: "cytosol", localizationKind: "CYTOSOLIC" as const, sourceIds: [sourceId] }, { actorId: protein, compartmentId: "er-lumen", localizationKind: "LUMINAL" as const, membraneId: "rough-er", membraneSide: "LUMINAL" as const, sourceIds: [sourceId] }, { actorId: protein, compartmentId: "secretory-vesicle-lumen", localizationKind: "LUMINAL" as const, membraneId: "secretory-vesicle-membrane", membraneSide: "LUMINAL" as const, sourceIds: [sourceId] }, { actorId: protein, compartmentId: "extracellular-space", localizationKind: "IN_COMPARTMENT" as const, sourceIds: [sourceId] }, { actorId: actors.transloconId, compartmentId: "rough-er", localizationKind: "MEMBRANE_EMBEDDED" as const, membraneId: "rough-er", membraneSide: "CYTOSOLIC" as const, sourceIds: [sourceId] }, { actorId: actors.erMembraneId, compartmentId: "rough-er", localizationKind: "MEMBRANE_EMBEDDED" as const, membraneId: "rough-er", membraneSide: "CYTOSOLIC" as const, sourceIds: [sourceId] }];
  return { scene: { ...scene, actors: allActors, topology: { ...scene.topology, actorIds: allActors.map((item) => item.actorId) } }, cellular: { schemaVersion: "1", scale: "MULTI_COMPARTMENT", compartments, compartmentRelations: relations, localizations, localizationChanges: [], localities: [] } };
}

export function createCanonicalSecretoryPathwayProgram(): SecretoryProgramV1 {
  const geneExpression = createCanonicalEukaryoticGeneExpressionProgram();
  const actors: SecretoryActorsV1 = { proteinId: geneExpression.actors.nascentPeptideId, signalPeptideRegionId: "signal-peptide-1", srpId: sid("srp-1"), erMembraneId: sid("rough-er"), transloconId: sid("translocon-1"), erChaperoneId: sid("er-chaperone-bip"), glycanModificationId: sid("glycan-1"), erExitVesicleId: sid("er-exit-vesicle-1"), secretoryVesicleId: sid("secretory-vesicle-1"), vesicleMembraneId: sid("secretory-vesicle-membrane"), vesicleLumenId: sid("secretory-vesicle-lumen"), cisGolgiLumenId: sid("cis-golgi"), medialGolgiLumenId: sid("medial-golgi"), transGolgiLumenId: sid("trans-golgi"), tgnId: sid("tgn"), plasmaMembraneId: sid("plasma-membrane"), extracellularSpaceId: "extracellular-space", ribosomeId: geneExpression.actors.ribosomeId };
  const cellularScene = buildCellular(geneExpression, actors);
  const events = addDDEvents(geneExpression, actors);
  const baseTimeline = geneExpression.timeline;
  const state: MechanismState = { mechanismStateId: "secretory-start", scientificStateId: "gene-expression-initial", kind: "before", actorIds: cellularScene.scene.actors.map((item) => item.actorId) };
  const timeline: ScientificTimeline = { ...baseTimeline, timelineId: "secretory-pathway-timeline", clock: { ...baseTimeline.clock, duration: 17 }, states: [...baseTimeline.states, state], events: [...baseTimeline.events, ...events.map((entry) => ({ eventId: entry.timelineEventId, at: entry.at, kind: "stateEntered" as const, actorIds: [...entry.actorIds] }))], chapters: [...(baseTimeline.chapters ?? []), { chapterId: "secretory-pathway", start: 9, end: 17 }] };
  return { schemaVersion: "1", programId: "canonical-secretory-protein-pathway", ownerId: secretoryPathwayOwnerId, speciesScope: secretoryPathwaySpeciesScope, geneExpression, cellularScene, timeline, actors, outcome: "SECRETED_PROTEIN", signalPeptide: { regionId: actors.signalPeptideRegionId, startResidue: 1, endResidue: 6, proteinId: actors.proteinId }, events, fidelity: "S2_SCHEMATIC" };
}

function has(events: readonly SecretoryEventV1[], kind: SecretoryEventKind, time: number) { return events.some((event) => event.kind === kind && event.at <= time); }
function atOrBefore(events: readonly SecretoryEventV1[], time: number) { return events.filter((event) => event.at <= time).sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId)); }

export function evaluateSecretoryPathwayAtTime(program: SecretoryProgramV1, timeSeconds: number): SecretoryEvaluationResult {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > program.timeline.clock.duration) return fail("SECRETORY_TIME_INVALID", "time is outside the canonical secretory timeline");
  const sceneCheck = validateCellularScientificScene(program.cellularScene, program.timeline);
  if (!sceneCheck.valid) return fail("SECRETORY_SCENE_INVALID", ...sceneCheck.issues.map((issue) => `${issue.path}: ${issue.message}`));
  const p3 = evaluateScientificTimeline({ scientificScene: program.cellularScene.scene, timeline: program.timeline, timeSeconds });
  if (!p3.ok) return fail("SECRETORY_P3_UNAVAILABLE", p3.code, ...p3.reasons);
  const geneTime = Math.min(timeSeconds, program.geneExpression.timeline.clock.duration);
  const gene = evaluateGeneExpressionAtTime(program.geneExpression, geneTime);
  if (!gene.ok) return fail("SECRETORY_GENE_EXPRESSION_UNAVAILABLE", ...gene.reasons);
  const translated = gene.snapshot.translation.peptideLength;
  const events = atOrBefore(program.events, timeSeconds);
  const signal = has(program.events, "SIGNAL_PEPTIDE_CLEAVED", timeSeconds) ? "CLEAVED" : has(program.events, "SRP_BOUND", timeSeconds) ? "SRP_BOUND" : has(program.events, "SECRETORY_SIGNAL_RECOGNIZED", timeSeconds) ? "SIGNAL_RECOGNIZED" : "UNRECOGNIZED";
  const srpState = has(program.events, "ER_TARGETING_STARTED", timeSeconds) ? "TARGETING_ER" : has(program.events, "SRP_BOUND", timeSeconds) ? "RIBOSOME_COMPLEX_BOUND" : has(program.events, "SECRETORY_SIGNAL_RECOGNIZED", timeSeconds) ? "SIGNAL_BOUND" : "AVAILABLE";
  const transloconState = has(program.events, "ER_LUMEN_RELEASED", timeSeconds) ? "RELEASED" : has(program.events, "TRANSLOCON_ENGAGED", timeSeconds) ? "ENGAGED" : "AVAILABLE";
  const translocationComplete = has(program.events, "ER_LUMEN_RELEASED", timeSeconds);
  const luminal = has(program.events, "translocation-complete" as never, timeSeconds) ? translated : has(program.events, "translocation-early" as never, timeSeconds) ? Math.min(1, translated) : 0;
  const foldingState = has(program.events, "ER_FOLDING_COMPLETE", timeSeconds) ? "FOLDED" : has(program.events, "ER_FOLDING_PARTIAL", timeSeconds) ? "PARTIALLY_FOLDED" : "UNFOLDED";
  const qualityState = has(program.events, "ER_QUALITY_PASS", timeSeconds) ? "PASS" : translocationComplete ? "FOLDING" : "FOLDING";
  const golgiCompartment = has(program.events, "CARGO_SORTED", timeSeconds) ? "TGN" : has(program.events, "GOLGI_TRANS_ENTRY", timeSeconds) ? "TRANS" : has(program.events, "GOLGI_MEDIAL_ENTRY", timeSeconds) ? "MEDIAL" : has(program.events, "GOLGI_CIS_ENTRY", timeSeconds) ? "CIS" : "NONE";
  const secretoryVesicle = has(program.events, "SECRETORY_VESICLE_FORMED", timeSeconds);
  const erVesicle = has(program.events, "ER_EXIT_VESICLE_FORMED", timeSeconds) && !has(program.events, "GOLGI_CIS_ENTRY", timeSeconds);
  const localization: SecretoryLocalization = has(program.events, "EXOCYTOSIS_COMPLETED", timeSeconds) ? "EXTRACELLULAR_SPACE" : secretoryVesicle ? "SECRETORY_VESICLE_LUMEN" : erVesicle ? "ER_EXIT_VESICLE_LUMEN" : golgiCompartment === "CIS" ? "CIS_GOLGI_LUMEN" : golgiCompartment === "MEDIAL" ? "MEDIAL_GOLGI_LUMEN" : golgiCompartment === "TRANS" || golgiCompartment === "TGN" ? "TRANS_GOLGI_LUMEN" : translocationComplete ? "ER_LUMEN" : has(program.events, "TRANSLOCON_ENGAGED", timeSeconds) ? "TRANSLOCON" : has(program.events, "ER_TARGETING_STARTED", timeSeconds) ? "ER_MEMBRANE_ASSOCIATED" : "CYTOSOL";
  const vesicleId = secretoryVesicle ? program.actors.secretoryVesicleId : erVesicle ? program.actors.erExitVesicleId : null;
  const stage = localization === "EXTRACELLULAR_SPACE" ? "SECRETED_MATURE_PROTEIN" : secretoryVesicle ? "VESICULAR_CARGO" : golgiCompartment !== "NONE" ? "GOLGI_CARGO" : qualityState === "PASS" ? "MODIFIED_CARGO" : foldingState === "FOLDED" ? "FOLDED_PROTEIN" : translocationComplete ? "ER_LUMEN_PROTEIN" : has(program.events, "SECRETORY_SIGNAL_RECOGNIZED", timeSeconds) ? "ER_TARGETED_CHAIN" : "NASCENT_POLYPEPTIDE";
  return { ok: true, snapshot: { schemaVersion: "1", programId: program.programId, timeSeconds, p3Snapshot: p3.snapshot, proteinId: program.actors.proteinId, proteinLocalization: localization, proteinIdentityStage: stage as SecretorySnapshotV1["proteinIdentityStage"], translatedResidueCount: translated, cytosolicChainLength: Math.max(0, translated - luminal), translocatingChainLength: localization === "TRANSLOCON" ? Math.min(1, translated) : 0, luminalChainLength: luminal, signalState: signal, srpState, transloconState, foldingState, chaperoneState: has(program.events, "ER_FOLDING_COMPLETE", timeSeconds) ? "RELEASED" : has(program.events, "ER_FOLDING_PARTIAL", timeSeconds) ? "ASSOCIATED" : "UNBOUND", modificationState: has(program.events, "GOLGI_PROCESSING", timeSeconds) ? "GOLGI_PROCESSED" : has(program.events, "ER_GLYCOSYLATED", timeSeconds) ? "N_LINKED_GLYCAN_ADDED" : "NONE", qualityState, vesicleId, vesicleState: has(program.events, "MEMBRANE_FUSION", timeSeconds) ? "FUSED" : has(program.events, "VESICLE_DOCKED", timeSeconds) ? "DOCKED" : secretoryVesicle || erVesicle ? "INDEPENDENT_TRANSPORT" : has(program.events, "ER_EXIT_BUDDING", timeSeconds) ? "BUDDING" : "NONE", golgiCompartment, cargoContained: secretoryVesicle || erVesicle, dockingState: has(program.events, "VESICLE_DOCKED", timeSeconds) ? "DOCKED" : "NONE", snareState: has(program.events, "SNARE_COMPLEX_ASSEMBLED", timeSeconds) ? "ASSEMBLED" : "NONE", membraneContinuity: has(program.events, "MEMBRANE_FUSION", timeSeconds) ? "FUSED" : "SEPARATE", extracellular: has(program.events, "EXOCYTOSIS_COMPLETED", timeSeconds), appliedEventIds: events.map((event) => event.eventId) } };
}

export function validateSecretoryPathwayProgram(program: SecretoryProgramV1): SecretoryValidationResult {
  const issues: Array<{ path: string; message: string }> = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (program.schemaVersion !== "1" || program.ownerId !== secretoryPathwayOwnerId || program.speciesScope !== secretoryPathwaySpeciesScope) issue("program", "unsupported D-D program identity");
  if (program.outcome !== "SECRETED_PROTEIN") issue("outcome", "D-D v1 canonical fixture is a soluble secreted protein");
  if (program.signalPeptide.proteinId !== program.actors.proteinId || program.signalPeptide.startResidue !== 1 || program.signalPeptide.endResidue < program.signalPeptide.startResidue) issue("signalPeptide", "signal peptide must be a bounded region on the persistent protein actor");
  const ids = new Set<string>();
  for (const event of program.events) { if (ids.has(event.eventId)) issue("events", "event IDs must be unique"); ids.add(event.eventId); for (const dependency of event.dependsOnEventIds ?? []) { const prior = program.events.find((candidate) => candidate.eventId === dependency); if (!prior || prior.at > event.at) issue(`events.${event.eventId}`, "dependency is missing or occurs after dependent event"); } }
  const before = (kind: SecretoryEventKind) => program.events.find((event) => event.kind === kind);
  const requires = (after: SecretoryEventKind, prior: SecretoryEventKind) => { const a = before(after); const b = before(prior); if (a && (!b || a.at <= b.at)) issue(`events.${after}`, `must follow ${prior}`); };
  requires("TRANSLOCON_ENGAGED", "ER_TARGETING_STARTED"); requires("ER_QUALITY_PASS", "ER_GLYCOSYLATED"); requires("ER_EXIT_BUDDING", "ER_QUALITY_PASS"); requires("GOLGI_CIS_ENTRY", "ER_EXIT_VESICLE_FORMED"); requires("CARGO_SORTED", "GOLGI_TRANS_ENTRY"); requires("VESICLE_DOCKED", "SECRETORY_VESICLE_FORMED"); requires("MEMBRANE_FUSION", "VESICLE_DOCKED"); requires("EXOCYTOSIS_COMPLETED", "MEMBRANE_FUSION");
  const scene = validateCellularScientificScene(program.cellularScene, program.timeline); if (!scene.valid) scene.issues.forEach((entry) => issue(entry.path, entry.message));
  const check = evaluateSecretoryPathwayAtTime(program, 16.4); if (!check.ok) issue("evaluation", `${check.code}: ${check.reasons.join("; ")}`);
  if (issues.length) return { valid: false, issues }; return { valid: true, issues: [] };
}

export function serializeSecretoryPathwayProgram(program: SecretoryProgramV1): string { return JSON.stringify(program); }
export function serializeSecretorySnapshot(snapshot: SecretorySnapshotV1): string { return JSON.stringify(snapshot); }
