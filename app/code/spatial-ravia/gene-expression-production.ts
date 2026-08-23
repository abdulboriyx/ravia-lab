/** D-C2: one continuous production projection over the canonical D-C program. */

import type { ScientificActorId } from "./scientific-actor.ts";
import {
  evaluateGeneExpressionAtTime,
  type GeneExpressionProgramV1,
  type GeneExpressionSnapshotV1,
} from "./cellular-gene-expression.ts";
import { validateCellularScientificScene } from "./cellular-localization.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";

export const geneExpressionProductionOwnerId = "GENE_EXPRESSION_CELLULAR_V1" as const;
export const geneExpressionProductionSchemaVersion = "1" as const;

export type GeneExpressionProductionFocus =
  | "CELLULAR" | "NUCLEAR" | "MOLECULAR_TRANSCRIPTION" | "RNA_PROCESSING"
  | "CELLULAR_EXPORT" | "MOLECULAR_TRANSLATION";

export type GeneExpressionProductionProjectionV1 = Readonly<{
  schemaVersion: typeof geneExpressionProductionSchemaVersion;
  ownerId: typeof geneExpressionProductionOwnerId;
  programId: string;
  timelineId: string;
  timeSeconds: number;
  focus: GeneExpressionProductionFocus;
  fidelity: "S2_SCHEMATIC";
  compartments: Readonly<{ nucleus: "VISIBLE"; nucleoplasm: "VISIBLE"; nuclearEnvelope: "VISIBLE"; nuclearPore: "VISIBLE"; cytosol: "VISIBLE" }>;
  dna: Readonly<{ templateStrandId: ScientificActorId; nonTemplateStrandId: ScientificActorId; promoterId: ScientificActorId; transcriptionBubble: "OPEN" | "CLOSED" }>;
  transcription: Readonly<{ polymeraseState: GeneExpressionSnapshotV1["transcription"]["polymeraseState"]; rnaActorId: ScientificActorId; visibleRnaLength: number; transcriptState: GeneExpressionSnapshotV1["transcription"]["transcriptState"] }>;
  processing: Readonly<{ capPresent: boolean; exonIds: readonly string[]; intronIds: readonly string[]; removedIntronIds: readonly string[]; spliceosomeState: GeneExpressionSnapshotV1["processing"]["spliceosomeState"]; exonsJoined: boolean; polyATailAdded: boolean; mature: boolean }>;
  exportState: Readonly<{ mrnaActorId: ScientificActorId; localization: GeneExpressionSnapshotV1["exportState"]["localization"]; transport: "NONE" | "NUCLEAR_EXPORT" }>;
  translation: Readonly<{ state: GeneExpressionSnapshotV1["translation"]["state"]; mrnaActorId: ScientificActorId; activeCodonIndex: number | null; activeCodonId: string | null; siteOccupancy: GeneExpressionSnapshotV1["translation"]["siteOccupancy"]; peptideId: ScientificActorId; peptideLength: number; released: boolean }>;
  sourceEventIds: readonly string[];
}>;

export type GeneExpressionProductionResult =
  | Readonly<{ ok: true; projection: GeneExpressionProductionProjectionV1 }>
  | Readonly<{ ok: false; code: "GENE_EXPRESSION_PRODUCTION_INVALID" | "GENE_EXPRESSION_SCIENCE_UNAVAILABLE"; reasons: readonly string[] }>;

type GeneExpressionProductionFailureCode = "GENE_EXPRESSION_PRODUCTION_INVALID" | "GENE_EXPRESSION_SCIENCE_UNAVAILABLE";
const fail = (code: GeneExpressionProductionFailureCode, ...reasons: string[]): GeneExpressionProductionResult => ({ ok: false, code, reasons });
const event = (program: GeneExpressionProgramV1, id: string) => program.events.find((entry) => entry.eventId === id);

function focusFor(snapshot: GeneExpressionSnapshotV1): GeneExpressionProductionFocus {
  if (snapshot.translation.state !== "PRE_INITIATION") return snapshot.translation.state === "RELEASED" ? "CELLULAR" : "MOLECULAR_TRANSLATION";
  if (snapshot.exportState.localization !== "NUCLEOPLASM") return "CELLULAR_EXPORT";
  if (snapshot.processing.mature || snapshot.processing.threePrimeProcessed) return "RNA_PROCESSING";
  if (snapshot.transcription.rnaLength > 0 || snapshot.transcription.polymeraseState !== "AVAILABLE") return "MOLECULAR_TRANSCRIPTION";
  return "NUCLEAR";
}

/** Pure adapter: all biological values are copied from the canonical snapshot. */
export function projectGeneExpressionProductionAtTime(program: GeneExpressionProgramV1, timeSeconds: number): GeneExpressionProductionResult {
  const evaluated = evaluateGeneExpressionAtTime(program, timeSeconds);
  if (!evaluated.ok) return fail("GENE_EXPRESSION_SCIENCE_UNAVAILABLE", ...evaluated.reasons);
  const sceneCheck = validateCellularScientificScene(program.cellularScene, program.timeline);
  if (!sceneCheck.valid) return fail("GENE_EXPRESSION_PRODUCTION_INVALID", ...sceneCheck.issues.map((issue) => `${issue.path}: ${issue.message}`));
  const snapshot = evaluated.snapshot;
  const exons = program.transcriptRegions.filter((region) => region.kind === "EXON").map((region) => region.regionId);
  const introns = program.transcriptRegions.filter((region) => region.kind === "INTRON").map((region) => region.regionId);
  return { ok: true, projection: {
    schemaVersion: geneExpressionProductionSchemaVersion, ownerId: geneExpressionProductionOwnerId, programId: program.programId, timelineId: program.timeline.timelineId, timeSeconds, focus: focusFor(snapshot), fidelity: "S2_SCHEMATIC",
    compartments: { nucleus: "VISIBLE", nucleoplasm: "VISIBLE", nuclearEnvelope: "VISIBLE", nuclearPore: "VISIBLE", cytosol: "VISIBLE" },
    dna: { templateStrandId: program.actors.templateStrandId, nonTemplateStrandId: program.actors.nonTemplateStrandId, promoterId: program.actors.promoterId, transcriptionBubble: snapshot.transcription.bubbleOpen ? "OPEN" : "CLOSED" },
    transcription: { polymeraseState: snapshot.transcription.polymeraseState, rnaActorId: program.actors.transcriptId, visibleRnaLength: snapshot.transcription.rnaLength, transcriptState: snapshot.transcription.transcriptState },
    processing: { capPresent: snapshot.processing.capPresent, exonIds: exons, intronIds: introns, removedIntronIds: snapshot.processing.removedRegionIds, spliceosomeState: snapshot.processing.spliceosomeState, exonsJoined: snapshot.processing.exonsJoined, polyATailAdded: snapshot.processing.polyATailAdded, mature: snapshot.processing.mature },
    exportState: { mrnaActorId: program.actors.matureMrnaId, localization: snapshot.exportState.localization, transport: snapshot.exportState.exportStarted ? "NUCLEAR_EXPORT" : "NONE" },
    translation: { state: snapshot.translation.state, mrnaActorId: program.actors.matureMrnaId, activeCodonIndex: snapshot.translation.currentCodonIndex, activeCodonId: snapshot.translation.currentCodonId, siteOccupancy: snapshot.translation.siteOccupancy, peptideId: snapshot.translation.peptideId, peptideLength: snapshot.translation.peptideLength, released: snapshot.translation.state === "RELEASED" },
    sourceEventIds: snapshot.appliedEventIds,
  } };
}

export function validateGeneExpressionProductionProjection(program: GeneExpressionProgramV1, projection: GeneExpressionProductionProjectionV1): GeneExpressionProductionResult {
  const expected = projectGeneExpressionProductionAtTime(program, projection.timeSeconds);
  if (!expected.ok) return expected;
  if (JSON.stringify(expected.projection) !== JSON.stringify(projection)) return fail("GENE_EXPRESSION_PRODUCTION_INVALID", "projection contradicts canonical D-C state");
  return { ok: true, projection };
}

export function productionStateAtFrame(program: GeneExpressionProgramV1, frameIndex: number, fps: number): GeneExpressionProductionResult {
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || !Number.isInteger(fps) || fps <= 0) return fail("GENE_EXPRESSION_PRODUCTION_INVALID", "frameIndex and fps must be positive integers");
  return projectGeneExpressionProductionAtTime(program, frameIndex / fps);
}

const actor = (actorId: ScientificActorId): TeachingReference => ({ kind: "actor", actorId });
const compartment = (compartmentId: string): TeachingReference => ({ kind: "compartment", compartmentId });
const localization = (actorId: ScientificActorId, compartmentId: string): TeachingReference => ({ kind: "cellularLocalization", actorId, compartmentId });
const timelineEvent = (timelineEventId: string): TeachingReference => ({ kind: "timelineEvent", timelineEventId });

const chapterDefinitions = [
  ["gene-promoter-context", "Gene and promoter context", "transcription-initiated"], ["transcription-initiation", "Transcription initiation", "transcription-initiated"], ["transcription-elongation", "Transcription elongation", "rna-add-1"], ["pre-mrna", "Nascent pre-mRNA", "rna-add-2"], ["five-prime-capping", "5′ capping", "cap-added"], ["splicing", "Spliceosome and intron removal", "intron-removed"], ["exon-joining", "Exon joining", "exons-joined"], ["polyadenylation", "3′ processing and poly(A)", "three-prime-processed"], ["mature-mrna", "Mature mRNA", "mature-mrna"], ["nuclear-export", "Nuclear export", "export-started"], ["translation", "Cytosolic translation", "translation-initiated"], ["termination-release", "Termination and release", "polypeptide-released"],
] as const;

/** A compiled-runtime-ready plan; it contains only canonical scientific refs. */
export function createGeneExpressionTeachingPlan(program: GeneExpressionProgramV1, requestMode: TeachingPlan["requestMode"] = "explain"): TeachingPlan {
  const source = program.cellularScene.scene.fidelityProvenance.sources[0]!.sourceId;
  const common = [actor(program.actors.transcriptId), compartment("nucleoplasm"), compartment("cytosol")];
  const chapters = chapterDefinitions.map(([chapterId, title, eventId], index) => ({ chapterId, order: index + 1, title, focus: [...common, timelineEvent(eventId)], context: [actor(program.actors.rnaPolymeraseIIId), actor(program.actors.ribosomeId)], chapterRole: index === 0 ? "IDENTIFY" as const : index === chapterDefinitions.length - 1 ? "SUMMARIZE" as const : "EXPLAIN" as const, ...(index ? { dependsOnChapterIds: [chapterDefinitions[index - 1]![0]] } : {}), disclosure: { primaryFocusRefs: [timelineEvent(eventId), index < 10 ? compartment("nucleoplasm") : compartment("cytosol")], secondaryContextRefs: [actor(program.actors.rnaPolymeraseIIId), actor(program.actors.ribosomeId)], suppressedContextRefs: [], detail: index < 2 ? "STRUCTURAL" as const : "MECHANISTIC" as const }, timelineMapping: { eventIds: [eventId], chapterIds: [chapterId], transitionIds: [] }, narrationCueIds: [`cue-${chapterId}`] }));
  const refs = [...common, actor(program.actors.promoterId), actor(program.actors.rnaPolymeraseIIId), actor(program.actors.spliceosomeId), actor(program.actors.ribosomeId), actor(program.actors.nascentPeptideId), localization(program.actors.transcriptId, "nucleoplasm"), localization(program.actors.transcriptId, "cytosol"), { kind: "localizationChange" as const, changeId: "mrna-export" }, compartment("nuclear-pore")];
  return { schemaVersion: "3", planId: "gene-expression-production-teaching", sceneId: program.cellularScene.scene.sceneId, requestMode, learningObjective: "Trace one gene from nuclear transcription through processing, export, and cytosolic translation.", objectiveTrace: { objectiveKind: requestMode === "why" ? "EXPLAIN_CAUSE" : requestMode === "misconceptionCorrection" ? "CORRECT_MISCONCEPTION" : "EXPLAIN_MECHANISM", capabilityId: "transcription-initiation", phenomenon: "gene expression", mechanism: "nuclear gene expression", targetActorIds: [program.actors.transcriptId], requestMode }, prerequisiteAssumptions: [], chapters, narrationCues: chapters.map((chapter) => ({ cueId: `cue-${chapter.chapterId}`, target: chapter.focus[0]!, purpose: requestMode === "why" ? "explain" as const : requestMode === "misconceptionCorrection" ? "correct" as const : "orient" as const })), annotations: [{ annotationId: "gene-expression-focus", kind: "identity", target: actor(program.actors.transcriptId), text: "The same RNA actor persists through transcription, processing, export, and translation." }], causalSteps: [{ stepId: "nuclear-before-cytosolic", order: 1, cause: compartment("nucleoplasm"), effect: compartment("cytosol"), explanation: "The processed mature mRNA is exported before cytosolic translation begins." }], ...(requestMode === "misconceptionCorrection" ? { misconceptionCorrection: { misconception: "Ribosomes read DNA directly.", correction: "RNA polymerase makes pre-mRNA in the nucleus; ribosomes read mature mRNA in the cytosol.", chapterIds: chapters.map((chapter) => chapter.chapterId), evidence: refs } } : {}), projections: [{ audience: "beginner", chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["gene-expression-focus"] }, { audience: "intermediate", chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["gene-expression-focus"] }, { audience: "advanced", chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["gene-expression-focus"] }], };
}

export function serializeGeneExpressionProductionProjection(projection: GeneExpressionProductionProjectionV1): string { return JSON.stringify(projection); }
