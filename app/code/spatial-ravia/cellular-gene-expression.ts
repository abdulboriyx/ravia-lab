/**
 * D-C: one bounded eukaryotic nuclear gene-expression program. The program
 * composes CellularScientificSceneV1 and ScientificTimeline v1. It adds
 * typed biology payloads; P3 remains the clock and exact-time authority.
 */

import type { ScientificActorId, ScientificActor } from "./scientific-actor.ts";
import { actorId } from "./scientific-actor.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { timelineContextFromScene, validateScientificTimeline, type MechanismState } from "./scientific-timeline.ts";
import { evaluateScientificTimeline, type MechanismSnapshotV1 } from "./p3-b-mechanism-state-kernel.ts";
import { validateCellularScientificScene, type CellularScientificSceneV1 } from "./cellular-localization.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";

export const geneExpressionSchemaVersion = "1" as const;
export const geneExpressionSpeciesScope = "EUKARYOTIC_NUCLEAR" as const;

export const geneExpressionEventKinds = [
  "TRANSCRIPTION_MACHINERY_ASSOCIATED", "TRANSCRIPTION_BUBBLE_OPENED", "TRANSCRIPTION_INITIATED", "RNA_NUCLEOTIDE_ADDED", "TRANSCRIPTION_TERMINATED", "RNA_TRANSCRIPT_RELEASED",
  "CAP_ADDED", "SPLICEOSOME_ASSEMBLED", "INTRON_REMOVED", "EXONS_JOINED",
  "THREE_PRIME_PROCESSED", "MATURE_MRNA_DECLARED", "NUCLEAR_EXPORT_STARTED",
  "MRNA_CYTOSOLIC", "RIBOSOME_ASSEMBLED", "TRANSLATION_INITIATED", "CODON_ANTICODON_PAIRED", "TRNA_SITE_UPDATED",
  "PEPTIDE_BOND_FORMED", "RIBOSOME_TRANSLOCATED", "STOP_CODON_RECOGNIZED",
  "TRANSLATION_TERMINATED", "POLYPEPTIDE_RELEASED",
] as const;
export type GeneExpressionEventKind = (typeof geneExpressionEventKinds)[number];

export const polymeraseStates = ["AVAILABLE", "PROMOTER_ASSOCIATED", "INITIATING", "ELONGATING", "TERMINATING_OR_RELEASING"] as const;
export type PolymeraseState = (typeof polymeraseStates)[number];
export const spliceosomeStates = ["AVAILABLE", "ASSEMBLED_ON_PRE_MRNA", "CATALYTIC", "RELEASED"] as const;
export type SpliceosomeState = (typeof spliceosomeStates)[number];
export const translationStates = ["PRE_INITIATION", "ASSEMBLED", "ELONGATING", "STOP_RECOGNIZED", "TERMINATED", "RELEASED"] as const;
export type TranslationState = (typeof translationStates)[number];
export const translationSites = ["A", "P", "E"] as const;
export type TranslationSite = (typeof translationSites)[number];
export type NucleotideDirection = "FIVE_PRIME_TO_THREE_PRIME";
export type PeptideDirection = "N_TO_C";

export type GeneExpressionActorsV1 = Readonly<{
  templateStrandId: ScientificActorId;
  nonTemplateStrandId: ScientificActorId;
  promoterId: ScientificActorId;
  rnaPolymeraseIIId: ScientificActorId;
  transcriptionMachineryId: ScientificActorId;
  transcriptId: ScientificActorId;
  preMrnaId: ScientificActorId;
  matureMrnaId: ScientificActorId;
  capId: ScientificActorId;
  spliceosomeId: ScientificActorId;
  polyATailId: ScientificActorId;
  nuclearPoreId: ScientificActorId;
  ribosomeSmallSubunitId: ScientificActorId;
  ribosomeLargeSubunitId: ScientificActorId;
  ribosomeId: ScientificActorId;
  trnaIds: readonly ScientificActorId[];
  aminoAcidIds: readonly ScientificActorId[];
  releaseFactorId: ScientificActorId;
  nascentPeptideId: ScientificActorId;
  releasedPolypeptideId: ScientificActorId;
}>;

export type TranscriptRegionV1 = Readonly<{
  regionId: string;
  kind: "EXON" | "INTRON";
  order: number;
}>;

export type CodonV1 = Readonly<{
  codonId: string;
  index: number;
  bases: string;
  aminoAcidId?: ScientificActorId;
  isStart?: boolean;
  isStop?: boolean;
}>;

export type TranscriptionGroundingV1 = Readonly<{
  templateStrandId: ScientificActorId;
  nonTemplateStrandId: ScientificActorId;
  promoterId: ScientificActorId;
  transcriptionStartRelation: "PROMOTER_TO_TEMPLATE_3_PRIME";
  templatePolarity: "THREE_PRIME_TO_FIVE_PRIME";
  nonTemplatePolarity: "FIVE_PRIME_TO_THREE_PRIME";
}>;

export type TRNASpecV1 = Readonly<{
  tRNAId: ScientificActorId;
  anticodon: string;
  aminoAcidId?: ScientificActorId;
  aminoacylState: "UNCHARGED_TRNA" | "AMINOACYL_TRNA";
}>;

export type GeneExpressionEventV1 = Readonly<{
  eventId: string;
  timelineEventId: string;
  at: number;
  kind: GeneExpressionEventKind;
  actorIds: readonly ScientificActorId[];
  dependsOnEventIds?: readonly string[];
  nucleotideCount?: number;
  codonIndex?: number;
  peptideLength?: number;
  tRNAId?: ScientificActorId;
  anticodon?: string;
  aminoAcidId?: ScientificActorId;
  site?: TranslationSite;
  charged?: boolean;
}>;

export type GeneExpressionProgramV1 = Readonly<{
  schemaVersion: typeof geneExpressionSchemaVersion;
  programId: string;
  speciesScope: typeof geneExpressionSpeciesScope;
  cellularScene: CellularScientificSceneV1;
  timeline: ScientificTimeline;
  actors: GeneExpressionActorsV1;
  transcriptRegions: readonly TranscriptRegionV1[];
  codons: readonly CodonV1[];
  transcriptionGrounding?: TranscriptionGroundingV1;
  trnaSpecs?: readonly TRNASpecV1[];
  events: readonly GeneExpressionEventV1[];
  directionality: Readonly<{ rnaSynthesis: NucleotideDirection; templateRead: "THREE_PRIME_TO_FIVE_PRIME"; peptideGrowth: PeptideDirection; mrnaRead: NucleotideDirection }>;
  lariatPolicy: "NOT_REPRESENTED_BOUNDED_SPLICING_ABSTRACTION";
}>;

export type GeneExpressionSnapshotV1 = Readonly<{
  schemaVersion: typeof geneExpressionSchemaVersion;
  programId: string;
  timeSeconds: number;
  p3Snapshot: MechanismSnapshotV1;
  transcription: Readonly<{ polymeraseState: PolymeraseState; bubbleOpen: boolean; rnaLength: number; transcriptState: "NASCENT" | "PRE_MRNA" | "MATURE_MRNA"; localization: "NUCLEOPLASM" | "NUCLEAR_PORE_TRANSIT" | "CYTOSOL" }>;
  processing: Readonly<{ capPresent: boolean; spliceosomeState: SpliceosomeState; intronRemoved: boolean; exonsJoined: boolean; threePrimeProcessed: boolean; mature: boolean; polyATailAdded: boolean; retainedRegionIds: readonly string[]; removedRegionIds: readonly string[]; lariatRepresented: false }>;
  exportState: Readonly<{ localization: "NUCLEOPLASM" | "NUCLEAR_PORE_TRANSIT" | "CYTOSOL"; exportStarted: boolean }>;
  translation: Readonly<{ state: TranslationState; currentCodonIndex: number | null; currentCodonId: string | null; siteOccupancy: Readonly<{ A: ScientificActorId | null; P: ScientificActorId | null; E: ScientificActorId | null }>; peptideLength: number; peptideId: ScientificActorId; readDirection: NucleotideDirection; growthDirection: PeptideDirection }>;
  appliedEventIds: readonly string[];
}>;

export type GeneExpressionValidationIssue = { path: string; message: string };
export type GeneExpressionValidationResult = { valid: true; issues: [] } | { valid: false; issues: GeneExpressionValidationIssue[] };
export type GeneExpressionEvaluationResult = { ok: true; snapshot: GeneExpressionSnapshotV1 } | { ok: false; code: string; reasons: readonly string[] };

type UnknownRecord = Record<string, unknown>;
const idPattern = /^[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const stableId = (value: unknown): value is string => typeof value === "string" && idPattern.test(value);
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const fail = (code: string, ...reasons: string[]): GeneExpressionEvaluationResult => ({ ok: false, code, reasons });

function sceneActorIds(program: GeneExpressionProgramV1): Set<string> { return new Set(program.cellularScene.scene.actors.map((item) => String(item.actorId))); }
function eventMap(program: GeneExpressionProgramV1): Map<string, GeneExpressionEventV1> { return new Map(program.events.map((event) => [event.eventId, event])); }
const canonicalEvents = (events: readonly GeneExpressionEventV1[]) => [...events].sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId));
const canonicalTimeline = (timeline: ScientificTimeline): ScientificTimeline => ({ ...timeline, events: [...timeline.events].sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId)) });
function hasKind(events: readonly GeneExpressionEventV1[], kind: GeneExpressionEventKind, time: number) { return events.some((event) => event.kind === kind && event.at <= time); }
function complement(base: string): string { return ({ A: "U", U: "A", G: "C", C: "G" } as Record<string, string>)[base] ?? "?"; }
// Anticodons are stored in the displayed 3′→5′ pairing order for this bounded fixture.
function anticodonFor(codon: string): string { return [...codon].map(complement).join(""); }

function validateActors(actors: GeneExpressionActorsV1, actorIds: Set<string>, issue: (path: string, message: string) => void) {
  const fields = Object.entries(actors).flatMap(([key, value]) => Array.isArray(value) ? value.map((entry) => [key, entry] as const) : [[key, value] as const]);
  fields.forEach(([key, value]) => { if (typeof value !== "string" || !actorIds.has(value)) issue(`actors.${key}`, "must reference a cellular-scene actor"); });
  if (!unique(actors.trnaIds.map(String))) issue("actors.trnaIds", "must not contain duplicates");
  if (!unique(actors.aminoAcidIds.map(String))) issue("actors.aminoAcidIds", "must not contain duplicates");
  if (actors.transcriptId !== actors.preMrnaId || actors.preMrnaId !== actors.matureMrnaId) issue("actors", "transcript, pre-mRNA, and mature mRNA must preserve one actor identity");
  if (actors.nascentPeptideId !== actors.releasedPolypeptideId) issue("actors", "nascent and released polypeptide must preserve one actor identity");
}

export function validateGeneExpressionProgram(program: GeneExpressionProgramV1): GeneExpressionValidationResult {
  const issues: GeneExpressionValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (program.schemaVersion !== geneExpressionSchemaVersion) issue("program.schemaVersion", "unknown gene-expression schema version");
  if (!stableId(program.programId)) issue("program.programId", "must be a stable ID");
  if (program.speciesScope !== geneExpressionSpeciesScope) issue("program.speciesScope", "D-C v1 is eukaryotic nuclear gene expression");
  const normalizedTimeline = canonicalTimeline(program.timeline);
  const sceneResult = validateCellularScientificScene(program.cellularScene, normalizedTimeline);
  if (!sceneResult.valid) sceneResult.issues.forEach((entry) => issue(entry.path, entry.message));
  const timelineResult = validateScientificTimeline(normalizedTimeline, timelineContextFromScene(program.cellularScene.scene));
  if (!timelineResult.valid) timelineResult.issues.forEach((entry) => issue(entry.path, entry.message));
  const actorIds = sceneActorIds(program);
  validateActors(program.actors, actorIds, issue);
  const grounding = program.transcriptionGrounding;
  if (grounding && (grounding.templateStrandId !== program.actors.templateStrandId || grounding.nonTemplateStrandId !== program.actors.nonTemplateStrandId || grounding.promoterId !== program.actors.promoterId || grounding.transcriptionStartRelation !== "PROMOTER_TO_TEMPLATE_3_PRIME" || grounding.templatePolarity !== "THREE_PRIME_TO_FIVE_PRIME" || grounding.nonTemplatePolarity !== "FIVE_PRIME_TO_THREE_PRIME")) issue("transcriptionGrounding", "must preserve explicit template/non-template strand and promoter semantics");
  if (program.directionality.rnaSynthesis !== "FIVE_PRIME_TO_THREE_PRIME" || program.directionality.templateRead !== "THREE_PRIME_TO_FIVE_PRIME" || program.directionality.peptideGrowth !== "N_TO_C" || program.directionality.mrnaRead !== "FIVE_PRIME_TO_THREE_PRIME") issue("directionality", "canonical D-C directions are invalid");
  if (program.lariatPolicy !== "NOT_REPRESENTED_BOUNDED_SPLICING_ABSTRACTION") issue("lariatPolicy", "must use the bounded D-C abstraction");

  const regions = [...program.transcriptRegions].sort((a, b) => a.order - b.order);
  if (regions.length < 3) issue("transcriptRegions", "must contain at least two exons and one intron");
  if (!unique(regions.map((region) => region.regionId))) issue("transcriptRegions", "region IDs must be unique");
  regions.forEach((region, index) => { if (!stableId(region.regionId)) issue(`transcriptRegions[${index}].regionId`, "must be stable"); if (region.order !== index + 1) issue(`transcriptRegions[${index}].order`, "must be consecutive"); });
  if (regions.filter((region) => region.kind === "EXON").length < 2) issue("transcriptRegions", "must contain at least two exons");
  if (!regions.some((region) => region.kind === "INTRON")) issue("transcriptRegions", "must contain an intron");
  const codons = [...program.codons].sort((a, b) => a.index - b.index);
  if (!codons.length || codons.some((codon, index) => codon.index !== index)) issue("codons", "codon indices must be consecutive");
  if (codons[0]?.isStart !== true) issue("codons[0]", "first codon must be the explicit start codon");
  if (codons.filter((codon) => codon.isStop).length !== 1 || codons[codons.length - 1]?.isStop !== true) issue("codons", "must have exactly one terminal stop codon");
  codons.forEach((codon, index) => { if (!stableId(codon.codonId)) issue(`codons[${index}].codonId`, "must be stable"); if (!/^[AUGC]{3}$/.test(codon.bases)) issue(`codons[${index}].bases`, "must be a three-base RNA codon"); if (!codon.isStop && typeof codon.aminoAcidId !== "string") issue(`codons[${index}].aminoAcidId`, "non-stop codons require an amino-acid actor"); });
  const trnaSpecs = new Map((program.trnaSpecs ?? []).map((spec) => [String(spec.tRNAId), spec]));
  for (const spec of program.trnaSpecs ?? []) {
    if (!program.actors.trnaIds.includes(spec.tRNAId)) issue("trnaSpecs", "must reference declared tRNAs");
    if (!/^[AUGC]{3}$/.test(spec.anticodon) || (spec.aminoacylState === "AMINOACYL_TRNA" && !spec.aminoAcidId)) issue("trnaSpecs", "requires a valid anticodon and aminoacyl identity");
  }

  const timelineEventIds = new Set(normalizedTimeline.events.map((event) => event.eventId));
  const events = canonicalEvents(program.events);
  const ids = new Set<string>();
  let previousAt = -Infinity;
  events.forEach((event, index) => {
    const path = `events[${index}]`;
    if (!stableId(event.eventId) || ids.has(event.eventId)) issue(`${path}.eventId`, "must be a unique stable ID"); ids.add(event.eventId);
    if (!timelineEventIds.has(event.timelineEventId)) issue(`${path}.timelineEventId`, "must reference the P3 timeline");
    if (!finite(event.at) || event.at < 0 || event.at > program.timeline.clock.duration || event.at < previousAt) issue(`${path}.at`, "must be ordered and within the timeline"); previousAt = event.at;
    if (!geneExpressionEventKinds.includes(event.kind)) issue(`${path}.kind`, "is invalid");
    if (!Array.isArray(event.actorIds) || event.actorIds.some((id) => !actorIds.has(String(id)))) issue(`${path}.actorIds`, "must reference scene actors");
    for (const dependency of event.dependsOnEventIds ?? []) { const prior = events.find((candidate) => candidate.eventId === dependency); if (!prior) issue(`${path}.dependsOnEventIds`, "references a missing event"); else if (prior.at > event.at) issue(`${path}.dependsOnEventIds`, "dependency occurs after dependent event"); }
    if (event.kind === "RNA_NUCLEOTIDE_ADDED" && (!Number.isInteger(event.nucleotideCount) || Number(event.nucleotideCount) <= 0)) issue(`${path}.nucleotideCount`, "must be a positive count");
    if (["PEPTIDE_BOND_FORMED", "TRNA_SITE_UPDATED"].includes(event.kind) && event.tRNAId !== undefined && !program.actors.trnaIds.includes(event.tRNAId)) issue(`${path}.tRNAId`, "must reference a declared tRNA");
    if (event.site !== undefined && !translationSites.includes(event.site)) issue(`${path}.site`, "must be A, P, or E");
    if (event.kind === "PEPTIDE_BOND_FORMED" && (!Number.isInteger(event.codonIndex) || !Number.isInteger(event.peptideLength))) issue(path, "peptide bond requires codonIndex and peptideLength");
    if (event.anticodon && !/^[AUGC]{3}$/.test(event.anticodon)) issue(`${path}.anticodon`, "must be a three-base RNA anticodon");
  });
  const kinds = (kind: GeneExpressionEventKind) => events.filter((event) => event.kind === kind);
  const first = (kind: GeneExpressionEventKind) => kinds(kind)[0];
  const mustFollow = (after: GeneExpressionEventKind, before: GeneExpressionEventKind) => { const a = first(after); const b = first(before); if (a && (!b || a.at <= b.at)) issue(`events.${after}`, `must occur after ${before}`); };
  mustFollow("CAP_ADDED", "RNA_NUCLEOTIDE_ADDED"); mustFollow("SPLICEOSOME_ASSEMBLED", "TRANSCRIPTION_TERMINATED"); mustFollow("INTRON_REMOVED", "SPLICEOSOME_ASSEMBLED"); mustFollow("EXONS_JOINED", "INTRON_REMOVED"); mustFollow("THREE_PRIME_PROCESSED", "EXONS_JOINED"); mustFollow("MATURE_MRNA_DECLARED", "THREE_PRIME_PROCESSED"); mustFollow("NUCLEAR_EXPORT_STARTED", "MATURE_MRNA_DECLARED"); mustFollow("MRNA_CYTOSOLIC", "NUCLEAR_EXPORT_STARTED"); mustFollow("TRANSLATION_INITIATED", "MRNA_CYTOSOLIC"); mustFollow("STOP_CODON_RECOGNIZED", "PEPTIDE_BOND_FORMED"); mustFollow("TRANSLATION_TERMINATED", "STOP_CODON_RECOGNIZED"); mustFollow("POLYPEPTIDE_RELEASED", "TRANSLATION_TERMINATED");
  if (first("MATURE_MRNA_DECLARED") && !(first("CAP_ADDED") && first("INTRON_REMOVED") && first("EXONS_JOINED") && first("THREE_PRIME_PROCESSED"))) issue("events.MATURE_MRNA_DECLARED", "mature mRNA requires cap, intron removal, exon joining, and 3-prime processing");
  let expectedPeptide = 1;
  events.filter((event) => event.kind === "PEPTIDE_BOND_FORMED").forEach((event) => { if (event.peptideLength !== expectedPeptide) issue(`events.${event.eventId}.peptideLength`, "must increase by one per codon incorporation"); if (event.codonIndex !== expectedPeptide - 1) issue(`events.${event.eventId}.codonIndex`, "must follow codon order"); expectedPeptide += 1; });
  events.filter((event) => event.kind === "STOP_CODON_RECOGNIZED").forEach((event) => { if (event.codonIndex !== codons.length - 1) issue(`events.${event.eventId}.codonIndex`, "must identify the terminal stop codon"); });
  events.filter((event) => event.kind === "TRNA_SITE_UPDATED").forEach((event) => { if (!event.tRNAId || !event.site || event.charged !== true) issue(`events.${event.eventId}`, "tRNA site updates used by D-C must identify a charged tRNA and site"); });
  events.filter((event) => event.kind === "PEPTIDE_BOND_FORMED").forEach((event) => { if (!event.tRNAId || event.charged !== true) issue(`events.${event.eventId}`, "peptide bond formation requires a charged tRNA"); });
  events.filter((event) => event.kind === "CODON_ANTICODON_PAIRED" || event.kind === "TRNA_SITE_UPDATED" || event.kind === "PEPTIDE_BOND_FORMED").forEach((event) => { if (event.codonIndex !== undefined && event.tRNAId && trnaSpecs.size) { const spec = trnaSpecs.get(String(event.tRNAId)); const codon = codons.find((entry) => entry.index === event.codonIndex); if (!spec || !codon || spec.anticodon !== anticodonFor(codon.bases) || (event.anticodon && event.anticodon !== spec.anticodon)) issue(`events.${event.eventId}`, "CODON_ANTICODON_MISMATCH"); if (event.kind === "PEPTIDE_BOND_FORMED" && spec?.aminoacylState !== "AMINOACYL_TRNA") issue(`events.${event.eventId}`, "TRNA_UNCHARGED"); } });
  if (events.some((event) => event.kind === "PEPTIDE_BOND_FORMED" && event.codonIndex === codons.length - 1)) issue("events", "ordinary peptide bonds cannot incorporate the stop codon");
  const occupancyBySite: Partial<Record<TranslationSite, string>> = {};
  for (const event of events.filter((candidate) => candidate.kind === "TRNA_SITE_UPDATED" && candidate.site)) {
    if (event.tRNAId && Object.entries(occupancyBySite).some(([site, tRNAId]) => site !== event.site && tRNAId === String(event.tRNAId))) issue(`events.${event.eventId}`, "RIBOSOME_SITE_STATE_INVALID: one tRNA cannot occupy two sites");
    if (event.site) occupancyBySite[event.site] = event.tRNAId ? String(event.tRNAId) : undefined;
  }
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

function localizationAt(program: GeneExpressionProgramV1, time: number): "NUCLEOPLASM" | "NUCLEAR_PORE_TRANSIT" | "CYTOSOL" {
  if (hasKind(program.events, "MRNA_CYTOSOLIC", time)) return "CYTOSOL";
  if (hasKind(program.events, "NUCLEAR_EXPORT_STARTED", time)) return "NUCLEAR_PORE_TRANSIT";
  return "NUCLEOPLASM";
}

export function evaluateGeneExpressionAtTime(program: GeneExpressionProgramV1, timeSeconds: number): GeneExpressionEvaluationResult {
  const validation = validateGeneExpressionProgram(program);
  if (!validation.valid) return fail("GENE_EXPRESSION_STATE_INVALID", ...validation.issues.map((entry) => `${entry.path}: ${entry.message}`));
  if (!finite(timeSeconds) || timeSeconds < 0 || timeSeconds > program.timeline.clock.duration) return fail("TIME_OUT_OF_RANGE", "timeSeconds must be within the P3 timeline");
  const events = canonicalEvents(program.events);
  const timeline = canonicalTimeline(program.timeline);
  const p3 = evaluateScientificTimeline({ scientificScene: program.cellularScene.scene, timeline, timeSeconds });
  if (!p3.ok) return fail("GENE_EXPRESSION_STATE_INVALID", ...p3.reasons);
  const applied = events.filter((event) => event.at <= timeSeconds);
  const rnaLength = applied.filter((event) => event.kind === "RNA_NUCLEOTIDE_ADDED").reduce((total, event) => total + (event.nucleotideCount ?? 0), 0);
  const transcriptionDone = hasKind(program.events, "TRANSCRIPTION_TERMINATED", timeSeconds);
  const polymeraseState: PolymeraseState = transcriptionDone ? "TERMINATING_OR_RELEASING" : rnaLength > 0 ? "ELONGATING" : hasKind(program.events, "TRANSCRIPTION_INITIATED", timeSeconds) ? "INITIATING" : "AVAILABLE";
  const capPresent = hasKind(program.events, "CAP_ADDED", timeSeconds);
  const spliceAssembly = hasKind(program.events, "SPLICEOSOME_ASSEMBLED", timeSeconds);
  const intronRemoved = hasKind(program.events, "INTRON_REMOVED", timeSeconds);
  const exonsJoined = hasKind(program.events, "EXONS_JOINED", timeSeconds);
  const threePrimeProcessed = hasKind(program.events, "THREE_PRIME_PROCESSED", timeSeconds);
  const mature = hasKind(program.events, "MATURE_MRNA_DECLARED", timeSeconds);
  const translationInitiated = hasKind(program.events, "TRANSLATION_INITIATED", timeSeconds);
  const stopRecognized = hasKind(program.events, "STOP_CODON_RECOGNIZED", timeSeconds);
  const terminated = hasKind(program.events, "TRANSLATION_TERMINATED", timeSeconds);
  const released = hasKind(program.events, "POLYPEPTIDE_RELEASED", timeSeconds);
  const peptideEvents = applied.filter((event) => event.kind === "PEPTIDE_BOND_FORMED");
  const latestBond = peptideEvents.at(-1);
  const latestSiteEvents = applied.filter((event) => event.kind === "TRNA_SITE_UPDATED" && event.site);
  const occupancy: { A: ScientificActorId | null; P: ScientificActorId | null; E: ScientificActorId | null } = { A: null, P: null, E: null };
  latestSiteEvents.forEach((event) => { if (event.site) occupancy[event.site] = event.tRNAId ?? null; });
  const latestCodonEvent = applied.filter((event) => event.codonIndex !== undefined && ["CODON_ANTICODON_PAIRED", "TRNA_SITE_UPDATED", "PEPTIDE_BOND_FORMED", "STOP_CODON_RECOGNIZED"].includes(event.kind)).at(-1);
  const currentCodonIndex = latestCodonEvent?.codonIndex ?? (translationInitiated ? 0 : null);
  const codon = currentCodonIndex === null ? null : program.codons.find((candidate) => candidate.index === currentCodonIndex);
  const translationState: TranslationState = released ? "RELEASED" : terminated ? "TERMINATED" : stopRecognized ? "STOP_RECOGNIZED" : peptideEvents.length ? "ELONGATING" : translationInitiated ? "ASSEMBLED" : "PRE_INITIATION";
  const retainedRegionIds = mature ? program.transcriptRegions.filter((region) => region.kind === "EXON").map((region) => region.regionId) : [];
  const removedRegionIds = intronRemoved ? program.transcriptRegions.filter((region) => region.kind === "INTRON").map((region) => region.regionId) : [];
  return { ok: true, snapshot: { schemaVersion: geneExpressionSchemaVersion, programId: program.programId, timeSeconds, p3Snapshot: p3.snapshot, transcription: { polymeraseState, bubbleOpen: hasKind(events, "TRANSCRIPTION_INITIATED", timeSeconds) && !transcriptionDone, rnaLength, transcriptState: mature ? "MATURE_MRNA" : rnaLength > 0 ? "PRE_MRNA" : "NASCENT", localization: localizationAt(program, timeSeconds) }, processing: { capPresent, spliceosomeState: intronRemoved ? "RELEASED" : spliceAssembly ? "CATALYTIC" : "AVAILABLE", intronRemoved, exonsJoined, threePrimeProcessed, mature, polyATailAdded: threePrimeProcessed, retainedRegionIds, removedRegionIds, lariatRepresented: false }, exportState: { localization: localizationAt(program, timeSeconds), exportStarted: hasKind(program.events, "NUCLEAR_EXPORT_STARTED", timeSeconds) }, translation: { state: translationState, currentCodonIndex: codon?.index ?? null, currentCodonId: codon?.codonId ?? null, siteOccupancy: occupancy, peptideLength: latestBond?.peptideLength ?? 0, peptideId: program.actors.nascentPeptideId, readDirection: "FIVE_PRIME_TO_THREE_PRIME", growthDirection: "N_TO_C" }, appliedEventIds: applied.map((event) => event.eventId) } };
}

/** JSON boundary for ScenePackage/EmbedPackage consumers; never stores renderer state. */
export function serializeGeneExpressionProgram(program: GeneExpressionProgramV1): string {
  const result = validateGeneExpressionProgram(program);
  if (!result.valid) throw new Error(`Cannot serialize invalid D-C program: ${result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; ")}`);
  const canonical = { ...program, events: canonicalEvents(program.events), codons: [...program.codons].sort((a, b) => a.index - b.index), transcriptRegions: [...program.transcriptRegions].sort((a, b) => a.order - b.order), trnaSpecs: program.trnaSpecs ? [...program.trnaSpecs].sort((a, b) => String(a.tRNAId).localeCompare(String(b.tRNAId))) : undefined };
  return JSON.stringify(canonical);
}

export function deserializeGeneExpressionProgram(serialized: string): GeneExpressionProgramV1 {
  const program = JSON.parse(serialized) as GeneExpressionProgramV1;
  const result = validateGeneExpressionProgram(program);
  if (!result.valid) throw new Error(`Cannot deserialize invalid D-C program: ${result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; ")}`);
  return program;
}

function actor(id: string, semanticTypeId: ScientificActor["semanticTypeId"], scope: ScientificActor["scope"], role?: ScientificActor["role"]): ScientificActor { return { actorId: actorId(id), semanticTypeId, scope, ...(role ? { role } : {}) }; }

/** Small, deterministic D-C fixture used by focused tests and later D-H seeds. */
export function createCanonicalEukaryoticGeneExpressionProgram(): GeneExpressionProgramV1 {
  const base = scientificSceneSpecFixtures["generic-rna"];
  const ids = ["dna-template", "dna-non-template", "promoter", "pol2", "transcription-machinery", "spliceosome", "cap", "poly-a-tail", "nuclear-pore", "ribosome-small", "ribosome-large", "ribosome", "trna-1", "trna-2", "amino-acid-met", "amino-acid-ala", "release-factor", "nascent-peptide"];
  const extra = [
    actor("dna-template", "strand", "strand", "templateStrand"), actor("dna-non-template", "strand", "strand", "codingStrand"), actor("promoter", "functionalRegion", "molecularComplex"), actor("pol2", "polymerase", "molecularComplex", "enzyme"), actor("transcription-machinery", "transcriptionMachinery", "molecularComplex"), actor("spliceosome", "spliceosome", "molecularComplex"), actor("cap", "cap", "chemicalComponent"), actor("poly-a-tail", "polyATail", "polymer"), actor("nuclear-pore", "nuclearPore", "molecularComplex"), actor("ribosome-small", "ribosome", "molecularComplex"), actor("ribosome-large", "ribosome", "molecularComplex"), actor("ribosome", "ribosome", "molecularComplex"), actor("trna-1", "tRNA", "polymer"), actor("trna-2", "tRNA", "polymer"), actor("amino-acid-met", "aminoAcid", "chemicalComponent"), actor("amino-acid-ala", "aminoAcid", "chemicalComponent"), actor("release-factor", "releaseFactor", "molecularComplex"), actor("nascent-peptide", "protein", "polymer")
  ];
  const allActors = [...base.actors, ...extra];
  const scene = { ...base, sceneId: "canonical-eukaryotic-gene-expression", actors: allActors, topology: { ...base.topology, graphId: "graph-gene-expression", actorIds: allActors.map((item) => item.actorId) }, states: [...base.states, { stateId: "gene-expression-initial", kind: "intact" as const, actorIds: allActors.map((item) => item.actorId) }] };
  const source = base.fidelityProvenance.sources[0]!.sourceId;
  const compartments = [
    { compartmentId: "nucleus", type: "NUCLEUS" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [source] }, { compartmentId: "nucleoplasm", type: "NUCLEOPLASM" as const, parentCompartmentId: "nucleus", enclosingMembraneId: "nuclear-envelope", fidelity: "S2_SCHEMATIC" as const, sourceIds: [source] }, { compartmentId: "nuclear-envelope", type: "NUCLEAR_ENVELOPE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [source] }, { compartmentId: "nuclear-pore", type: "NUCLEAR_PORE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [source] }, { compartmentId: "cytosol", type: "CYTOSOL" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [source] }, { compartmentId: "plasma-membrane", type: "PLASMA_MEMBRANE" as const, fidelity: "S2_SCHEMATIC" as const, sourceIds: [source] },
  ];
  const cellular: CellularScientificSceneV1["cellular"] = { schemaVersion: "1", scale: "MULTI_COMPARTMENT", compartments, compartmentRelations: [{ relationId: "nucleoplasm-in-nucleus", kind: "CONTAINED_IN", subjectId: "nucleoplasm", objectId: "nucleus", sourceIds: [source] }, { relationId: "nucleus-boundary", kind: "HAS_BOUNDARY", subjectId: "nucleus", objectId: "nuclear-envelope", sourceIds: [source] }, { relationId: "nucleoplasm-lumen", kind: "LUMEN_OF", subjectId: "nucleoplasm", objectId: "nuclear-envelope", sourceIds: [source] }, { relationId: "nucleus-pore", kind: "CONNECTED_VIA", subjectId: "nucleus", objectId: "nuclear-pore", sourceIds: [source] }], localizations: [{ actorId: actorId("rna-1"), compartmentId: "nucleoplasm", localizationKind: "NUCLEAR", sourceIds: [source] }, { actorId: actorId("rna-1"), compartmentId: "cytosol", localizationKind: "CYTOSOLIC", sourceIds: [source] }, { actorId: actorId("pol2"), compartmentId: "nucleoplasm", localizationKind: "NUCLEAR", sourceIds: [source] }], localizationChanges: [{ changeId: "mrna-export", actorId: actorId("rna-1"), from: { actorId: actorId("rna-1"), compartmentId: "nucleoplasm", localizationKind: "NUCLEAR", sourceIds: [source] }, to: { actorId: actorId("rna-1"), compartmentId: "cytosol", localizationKind: "CYTOSOLIC", sourceIds: [source] }, transportKind: "NUCLEAR_EXPORT", timelineEventId: "mrna-cytosolic", sourceIds: [source] }], localities: [] };
  const times: Array<[string, number]> = [["transcription-initiated", .5], ["rna-add-1", 1], ["rna-add-2", 1.5], ["transcription-terminated", 2], ["cap-added", 2.5], ["spliceosome-assembled", 3], ["intron-removed", 3.5], ["exons-joined", 4], ["three-prime-processed", 4.5], ["mature-mrna", 5], ["export-started", 5.5], ["mrna-cytosolic", 6], ["translation-initiated", 6.5], ["trna-a-1", 7], ["peptide-bond-1", 7.2], ["translocated-1", 7.4], ["trna-a-2", 7.7], ["peptide-bond-2", 7.9], ["stop-recognized", 8.2], ["translation-terminated", 8.5], ["polypeptide-released", 9]];
  const eventActors = actorId("rna-1");
  const eventKinds: Record<string, GeneExpressionEventKind> = { "transcription-initiated": "TRANSCRIPTION_INITIATED", "rna-add-1": "RNA_NUCLEOTIDE_ADDED", "rna-add-2": "RNA_NUCLEOTIDE_ADDED", "transcription-terminated": "TRANSCRIPTION_TERMINATED", "cap-added": "CAP_ADDED", "spliceosome-assembled": "SPLICEOSOME_ASSEMBLED", "intron-removed": "INTRON_REMOVED", "exons-joined": "EXONS_JOINED", "three-prime-processed": "THREE_PRIME_PROCESSED", "mature-mrna": "MATURE_MRNA_DECLARED", "export-started": "NUCLEAR_EXPORT_STARTED", "mrna-cytosolic": "MRNA_CYTOSOLIC", "translation-initiated": "TRANSLATION_INITIATED", "trna-a-1": "TRNA_SITE_UPDATED", "peptide-bond-1": "PEPTIDE_BOND_FORMED", "translocated-1": "RIBOSOME_TRANSLOCATED", "trna-a-2": "TRNA_SITE_UPDATED", "peptide-bond-2": "PEPTIDE_BOND_FORMED", "stop-recognized": "STOP_CODON_RECOGNIZED", "translation-terminated": "TRANSLATION_TERMINATED", "polypeptide-released": "POLYPEPTIDE_RELEASED" };
  const events: GeneExpressionEventV1[] = times.map(([eventId, at]) => ({ eventId, timelineEventId: eventId, at, kind: eventKinds[eventId]!, actorIds: [eventActors] }));
  const byId = new Map(events.map((event) => [event.eventId, event]));
  const patch = (id: string, value: Partial<GeneExpressionEventV1>) => { const event = byId.get(id)!; Object.assign(event, value); };
  patch("rna-add-1", { nucleotideCount: 3 }); patch("rna-add-2", { nucleotideCount: 3 }); patch("trna-a-1", { tRNAId: actorId("trna-1"), site: "A", charged: true, codonIndex: 0, anticodon: "UAC" }); patch("peptide-bond-1", { tRNAId: actorId("trna-1"), site: "P", charged: true, codonIndex: 0, peptideLength: 1, anticodon: "UAC" }); patch("trna-a-2", { tRNAId: actorId("trna-2"), site: "A", charged: true, codonIndex: 1, anticodon: "CGG" }); patch("peptide-bond-2", { tRNAId: actorId("trna-2"), site: "P", charged: true, codonIndex: 1, peptideLength: 2, anticodon: "CGG" }); patch("stop-recognized", { codonIndex: 2 });
  const timelineEvents = times.map(([eventId, at]) => ({ eventId, at, kind: "stateEntered" as const, actorIds: [eventActors] }));
  const initialState: MechanismState = { mechanismStateId: "gene-start", scientificStateId: "gene-expression-initial", kind: "before", actorIds: allActors.map((item) => item.actorId) };
  const chapters = [["gene-promoter-context", 0, .5], ["transcription-initiation", .5, 1], ["transcription-elongation", 1, 2], ["pre-mrna", 2, 2.5], ["five-prime-capping", 2.5, 3], ["splicing", 3, 3.5], ["exon-joining", 3.5, 4], ["polyadenylation", 4, 4.5], ["mature-mrna", 4.5, 5], ["nuclear-export", 5, 6], ["translation", 6, 8.5], ["termination-release", 8.5, 10]] as const;
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "gene-expression-timeline", clock: { duration: 10, unit: "seconds" }, initialMechanismStateId: "gene-start", states: [initialState], transitions: [], events: timelineEvents, tracks: [], chapters: chapters.map(([chapterId, start, end]) => ({ chapterId, start, end })) };
  return { schemaVersion: "1", programId: "canonical-eukaryotic-gene-expression", speciesScope: geneExpressionSpeciesScope, cellularScene: { scene, cellular }, timeline, actors: { templateStrandId: actorId("dna-template"), nonTemplateStrandId: actorId("dna-non-template"), promoterId: actorId("promoter"), rnaPolymeraseIIId: actorId("pol2"), transcriptionMachineryId: actorId("transcription-machinery"), transcriptId: actorId("rna-1"), preMrnaId: actorId("rna-1"), matureMrnaId: actorId("rna-1"), capId: actorId("cap"), spliceosomeId: actorId("spliceosome"), polyATailId: actorId("poly-a-tail"), nuclearPoreId: actorId("nuclear-pore"), ribosomeSmallSubunitId: actorId("ribosome-small"), ribosomeLargeSubunitId: actorId("ribosome-large"), ribosomeId: actorId("ribosome"), trnaIds: [actorId("trna-1"), actorId("trna-2")], aminoAcidIds: [actorId("amino-acid-met"), actorId("amino-acid-ala")], releaseFactorId: actorId("release-factor"), nascentPeptideId: actorId("nascent-peptide"), releasedPolypeptideId: actorId("nascent-peptide") }, transcriptRegions: [{ regionId: "exon-1", kind: "EXON", order: 1 }, { regionId: "intron-1", kind: "INTRON", order: 2 }, { regionId: "exon-2", kind: "EXON", order: 3 }], codons: [{ codonId: "codon-start", index: 0, bases: "AUG", aminoAcidId: actorId("amino-acid-met"), isStart: true }, { codonId: "codon-two", index: 1, bases: "GCC", aminoAcidId: actorId("amino-acid-ala") }, { codonId: "codon-stop", index: 2, bases: "UAA", isStop: true }], transcriptionGrounding: { templateStrandId: actorId("dna-template"), nonTemplateStrandId: actorId("dna-non-template"), promoterId: actorId("promoter"), transcriptionStartRelation: "PROMOTER_TO_TEMPLATE_3_PRIME", templatePolarity: "THREE_PRIME_TO_FIVE_PRIME", nonTemplatePolarity: "FIVE_PRIME_TO_THREE_PRIME" }, trnaSpecs: [{ tRNAId: actorId("trna-1"), anticodon: "UAC", aminoAcidId: actorId("amino-acid-met"), aminoacylState: "AMINOACYL_TRNA" }, { tRNAId: actorId("trna-2"), anticodon: "CGG", aminoAcidId: actorId("amino-acid-ala"), aminoacylState: "AMINOACYL_TRNA" }], events, directionality: { rnaSynthesis: "FIVE_PRIME_TO_THREE_PRIME", templateRead: "THREE_PRIME_TO_FIVE_PRIME", peptideGrowth: "N_TO_C", mrnaRead: "FIVE_PRIME_TO_THREE_PRIME" }, lariatPolicy: "NOT_REPRESENTED_BOUNDED_SPLICING_ABSTRACTION" };
}
