/** F1-C compatibility adapters: legacy semantic contracts → SemanticIntent v1. */

import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaPromptSelection } from "./biology-dna-prompt-intent.ts";
import type { DnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";
import type { DnaMechanismSpec, DnaInteractionType } from "./dna-mechanism-contract.ts";
import type { RnaSceneSpec } from "./rna-contract.ts";
import { semanticIntentSchemaVersion, type SemanticEntityMention, type SemanticIntentV1, type SemanticRequest } from "./semantic-intent.ts";
import { validateSemanticIntent } from "./semantic-intent.ts";
import type { BiologicalStateId, DetailLevel, MechanismId, PhenomenonId, SemanticEntityId, SemanticEntityRole } from "./foundation-semantic-vocabulary.ts";

export type LegacyFieldDisposition = "PRESENTATION_ONLY" | "RENDERER_ONLY" | "LEGACY_AMBIGUOUS" | "UNSUPPORTED_IN_V1" | "REDUNDANT";
export type LegacyMappingReport = {
  source: "BiologySceneSpec" | "RnaSceneSpec" | "DnaMechanismSpec" | "DnaPromptSelection" | "DnaVisualTemplate";
  mappedFields: string[];
  omittedFields: Array<{ field: string; disposition: LegacyFieldDisposition; reason: string }>;
};

export type LegacySemanticAdapterResult = { intent: SemanticIntentV1; report: LegacyMappingReport };

const mention = (rawText: string, resolvedId?: SemanticEntityId, role?: SemanticEntityRole): SemanticEntityMention => resolvedId ? { rawText, resolvedId, role } : { rawText };

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const validBiologicalStates = new Set<BiologicalStateId>(["unknown", "paired", "unpaired", "intact", "cleaved", "preMRNA", "matureMRNA", "folded", "unfolded", "open", "closed", "nascent", "partiallyDegraded", "hybridized", "capped", "uncapped", "forming", "breaking"]);

function stableEntityFor(value: string): SemanticEntityId | undefined {
  const text = normalize(value);
  if (text.includes("deoxyribose")) return "deoxyribose";
  if (text.includes("ribose")) return "ribose";
  if (text.includes("phosphodiester")) return "phosphodiesterLinkage";
  if (text.includes("phosphate")) return "phosphate";
  if (text.includes("adenine") || text === "a") return "adenine";
  if (text.includes("thymine") || text === "t") return "thymine";
  if (text.includes("uracil") || text === "u") return "uracil";
  if (text.includes("guanine") || text === "g") return "guanine";
  if (text.includes("cytosine") || text === "c") return "cytosine";
  if (text.includes("promoter")) return "promoter";
  if (text.includes("enhancer")) return "enhancer";
  if (text.includes("gene")) return "gene";
  if (text.includes("histone") || text.includes("nucleosome") || text.includes("chromatin")) return "regulatoryRegion";
  if (text.includes("helicase")) return "helicase";
  if (text.includes("rna polymerase") || text === "polymerase") return "rnaPolymerase";
  if (text.includes("replication fork")) return "replicationFork";
  if (text === "dna" || text.includes("dna")) return "dna";
  if (text === "rna" || text.includes("rna")) return "rna";
  if (text.includes("m rna") || text === "mrna") return "mRNA";
  if (text.includes("t rna") || text === "trna") return "tRNA";
  if (text.includes("r rna") || text === "rrna") return "rRNA";
  if (text.includes("exon")) return "exon";
  if (text.includes("intron")) return "intron";
  if (text.includes("cap")) return "cap";
  if (text.includes("2 oh") || text.includes("two prime hydroxyl")) return "riboseTwoPrimeHydroxyl";
  if (text.includes("5 prime oxygen")) return "fivePrimeOxygen";
  if (text.includes("3 prime oxygen")) return "threePrimeOxygen";
  if (text.includes("lesion") || text.includes("damage") || text.includes("mismatch")) return "lesion";
  if (text.includes("strand")) return "strand";
  if (text.includes("duplex") || text.includes("helix")) return "duplex";
  if (text.includes("nucleotide")) return "nucleotide";
  return undefined;
}

function actForBiology(spec: BiologySceneSpec): SemanticIntentV1["acts"] {
  const acts: SemanticIntentV1["acts"] = [];
  if (spec.intent === "comparison") acts.push("compare");
  else if (spec.intent === "mechanism" || spec.intent === "relation") acts.push("explain");
  else acts.push("show");
  if (spec.temporal || spec.intent === "process") acts.push("animate");
  return [...new Set(acts)];
}

function phenomenonForText(text: string): PhenomenonId | undefined {
  const value = normalize(text);
  if (value.includes("replic")) return "replication";
  if (value.includes("transcri") || value.includes("polymerase")) return "transcription";
  if (value.includes("process") || value.includes("splice") || value.includes("intron") || value.includes("exon")) return "rnaProcessing";
  if (value.includes("hairpin") || value.includes("bulge") || value.includes("loop")) return "rnaSecondaryStructure";
  if (value.includes("pair") || value.includes("hydrogen")) return "basePairing";
  if (value.includes("hybrid")) return "hybridization";
  if (value.includes("cleav") || value.includes("degrad")) return value.includes("degrad") ? "exonucleaseDegradation" : "cleavage";
  if (value.includes("phosphodiester") || value.includes("backbone")) return "backboneChemistry";
  if (value.includes("antiparallel") || value.includes("polarity")) return "backboneChemistry";
  if (value.includes("stability") || value.includes("2 oh")) return "chemicalStabilityComparison";
  return undefined;
}

function mechanismForText(text: string): MechanismId | undefined {
  const value = normalize(text);
  if (value.includes("hydrogen") || value.includes("pair")) return "hydrogenBonding";
  if (value.includes("phosphodiester")) return "phosphodiesterLinkage";
  if (value.includes("antiparallel") || value.includes("polarity")) return "antiparallelOrganization";
  if (value.includes("stack")) return "baseStacking";
  if (value.includes("strand") && (value.includes("separat") || value.includes("open"))) return "strandOpening";
  if (value.includes("reanneal")) return "strandReannealing";
  if (value.includes("replic")) return "dnaReplication";
  if (value.includes("transcri")) return "transcriptionElongation";
  if (value.includes("splice")) return "rnaSplicing";
  if (value.includes("cap")) return "rnaCapping";
  if (value.includes("cleav")) return "rnaCleavage";
  if (value.includes("exonuclease") || value.includes("degrad")) return "terminalExonucleaseAction";
  if (value.includes("stability") || value.includes("2 oh")) return "riboseHydroxylSusceptibility";
  if (value.includes("hybrid")) return "rnaDnaHybridFormation";
  if (value.includes("hairpin") || value.includes("fold")) return "rnaSecondaryFolding";
  return undefined;
}

function baseIntent(rawUtterance: string, canonicalGloss: string, acts: SemanticIntentV1["acts"], requests: SemanticRequest[], confidence = 1): SemanticIntentV1 {
  return { schemaVersion: semanticIntentSchemaVersion, rawUtterance, canonicalGloss, acts, requests, assertedClaims: [], alternatives: [], clarification: { required: false }, confidence };
}

function report(source: LegacyMappingReport["source"], mappedFields: string[], omittedFields: LegacyMappingReport["omittedFields"]): LegacyMappingReport {
  return { source, mappedFields, omittedFields };
}

export function adaptBiologySceneSpec(spec: BiologySceneSpec, rawUtterance: string): LegacySemanticAdapterResult {
  const subjects = spec.entities.map((item) => mention(item.name || item.id, stableEntityFor(item.id) ?? stableEntityFor(item.name)));
  const semanticText = [...spec.entities.map((item) => item.name), ...spec.relations.map((item) => `${item.relation} ${item.object}`), ...spec.actions.map((item) => item.action)].join(" ");
  const request: SemanticRequest = {
    subjects,
    phenomenon: phenomenonForText(semanticText),
    mechanism: mechanismForText(semanticText),
    focus: spec.scale === "atomic" ? "local" : spec.scale === "cellular" ? "overview" : "overview",
    detail: spec.scale === "atomic" ? "advanced" : spec.scale === "molecular" ? "intermediate" : "auto",
    outputPreferences: [spec.temporal ? "animated" : "static"],
    requestedOutput: "scientificFigure",
  };
  if (spec.dnaRegions?.length) request.subjects.push(...spec.dnaRegions.map((region) => mention(region.label ?? region.kind, stableEntityFor(region.kind))));
  const intent = baseIntent(rawUtterance, `Present the ${spec.intent} involving ${subjects.map((item) => item.rawText).join(", ")}.`, actForBiology(spec), [request]);
  return { intent, report: report("BiologySceneSpec", ["intent", "entities", "relations", "actions", "scale", "dnaRegions", "temporal meaning"], [
    { field: "renderMode", disposition: "PRESENTATION_ONLY", reason: "renderer selection is excluded from SemanticIntent" },
    { field: "temporal.phases[].durationMs", disposition: "PRESENTATION_ONLY", reason: "timing implementation is excluded" },
    { field: "temporal.phases[].states", disposition: "LEGACY_AMBIGUOUS", reason: "phase state strings require future typed timeline adaptation" },
  ]) };
}

const rnaEntityMap: Record<string, SemanticEntityId> = {
  ribose: "ribose", twoPrimeHydroxyl: "riboseTwoPrimeHydroxyl", phosphate: "phosphate", base: "base", adenine: "adenine", uracil: "uracil", guanine: "guanine", cytosine: "cytosine", phosphodiesterLinkage: "phosphodiesterLinkage", fivePrimeEnd: "fivePrimeOxygen", threePrimeEnd: "threePrimeOxygen", cap: "cap", polyATail: "polyATail", exon: "exon", intron: "intron", mRNA: "mRNA", tRNA: "tRNA", rRNA: "rRNA", miRNA: "miRNA", siRNA: "siRNA", snRNA: "snRNA", stem: "rna", loop: "rna", bulge: "rna", pairedRegion: "rna", unpairedRegion: "rna",
};

function rnaPhenomenon(spec: RnaSceneSpec): PhenomenonId {
  if (spec.family === "pairingHybridization") return spec.dnaContext.required ? "rnaDnaHybridization" : "canonicalBasePairing";
  if (spec.family === "processing") return "rnaProcessing";
  if (spec.family === "secondaryStructure") return "rnaSecondaryStructure";
  if (spec.family === "degradationStability") return spec.degradationState === "hydrolysisContext" ? "chemicalStabilityComparison" : spec.degradationState === "degrading" ? "exonucleaseDegradation" : spec.degradationState === "cleaved" ? "cleavage" : "chemicalStabilityComparison";
  if (spec.family === "nascentTranscript") return "transcription";
  if (spec.family === "localChemistry") return "backboneChemistry";
  return "rnaSecondaryStructure";
}

function rnaMechanism(spec: RnaSceneSpec): MechanismId | undefined {
  if (spec.family === "pairingHybridization") return spec.pairingState === "wobble" ? "hydrogenBonding" : spec.dnaContext.required ? "rnaDnaHybridFormation" : "hydrogenBonding";
  if (spec.family === "processing") return spec.processingState === "spliced" || spec.processingState === "comparePreMature" ? "rnaSplicing" : spec.processingState === "capped" ? "rnaCapping" : undefined;
  if (spec.family === "degradationStability") return spec.degradationState === "degrading" ? "terminalExonucleaseAction" : spec.degradationState === "hydrolysisContext" ? "riboseHydroxylSusceptibility" : "rnaCleavage";
  if (spec.family === "nascentTranscript") return "transcriptionElongation";
  if (spec.family === "localChemistry") return spec.requiredEntities.includes("phosphodiesterLinkage") ? "phosphodiesterLinkage" : spec.requiredEntities.includes("twoPrimeHydroxyl") ? "riboseHydroxylSusceptibility" : undefined;
  return spec.family === "secondaryStructure" ? "rnaSecondaryFolding" : undefined;
}

function rnaStates(spec: RnaSceneSpec): BiologicalStateId[] {
  const states: BiologicalStateId[] = [];
  const add = (state: BiologicalStateId) => { if (!states.includes(state)) states.push(state); };
  if (spec.structuralState === "paired" || spec.pairingState === "paired" || spec.pairingState === "hybrid") add(spec.pairingState === "hybrid" ? "hybridized" : "paired");
  if (spec.structuralState === "nascent") add("nascent");
  if (spec.structuralState === "cleaved" || spec.degradationState === "cleaved") add("cleaved");
  if (spec.structuralState === "folded") add("folded");
  if (spec.processingState === "capped") add("capped");
  if (spec.structuralState === "preMature" || spec.processingState === "comparePreMature") add("preMRNA");
  if (spec.processingState === "mature") add("matureMRNA");
  if (spec.degradationState === "degrading") add("partiallyDegraded");
  return states.length ? states : ["unknown"];
}

export function adaptRnaSceneSpec(spec: RnaSceneSpec, rawUtterance: string): LegacySemanticAdapterResult {
  const subjects = spec.requiredEntities.map((id) => mention(id, rnaEntityMap[id] ?? stableEntityFor(id)));
  if (spec.rnaType !== "generic" && !subjects.some((item) => item.resolvedId === spec.rnaType)) subjects.push(mention(spec.rnaType, rnaEntityMap[spec.rnaType]));
  if (spec.dnaContext.required) subjects.push(mention("DNA context", "dna", "context"));
  const request: SemanticRequest = {
    subjects,
    phenomenon: rnaPhenomenon(spec),
    mechanism: rnaMechanism(spec),
    states: rnaStates(spec),
    focus: spec.scale.locality === "local" ? "local" : spec.focus.toLowerCase().includes("termin") ? "terminus" : "overview",
    detail: spec.representation.detail === "atomAndBond" ? "advanced" : spec.representation.detail === "residue" ? "intermediate" : "auto",
    outputPreferences: [spec.scale.locality === "local" ? "localFocus" : "overview", "static"],
    requestedOutput: spec.dnaContext.role === "comparison" ? "comparisonFigure" : "scientificFigure",
  };
  const intent = baseIntent(rawUtterance, `Present ${spec.rnaType} RNA in the ${spec.family} context.`, [spec.family === "pairingHybridization" || spec.family === "degradationStability" ? "explain" : "show"], [request]);
  return { intent, report: report("RnaSceneSpec", ["family", "focus", "rnaType", "structuralState", "pairingState", "requiredEntities", "dnaContext", "processingState", "degradationState", "scale locality", "semantic detail"], [
    { field: "representation.showBackbone/showBases/showAnnotations", disposition: "PRESENTATION_ONLY", reason: "disclosure flags belong to presentation planning" },
    { field: "supportExpectation", disposition: "UNSUPPORTED_IN_V1", reason: "renderer support status is not user meaning" },
    { field: "strandCount", disposition: "REDUNDANT", reason: "structural state and subjects carry the semantic relationship" },
  ]) };
}

const dnaFamilyPhenomenon: Record<DnaMechanismSpec["family"], PhenomenonId> = { basePairing: "canonicalBasePairing", backboneChemistry: "backboneChemistry", polarityAntiparallel: "polarity", helixStabilization: "helixStabilization", strandSeparation: "strandSeparation", nucleotideAssembly: "nucleotideAssembly" };
const dnaInteractionMechanism: Record<DnaInteractionType, MechanismId> = { covalent: "phosphodiesterLinkage", phosphodiester: "phosphodiesterLinkage", hydrogenBond: "hydrogenBonding", baseStacking: "baseStacking", noncovalent: "baseStacking", lesionCrosslink: "strandOpening" };

function dnaEntityForSelection(kind: string): SemanticEntityId | undefined {
  return stableEntityFor(kind) ?? ({ base: "base", nucleotide: "nucleotide", phosphate: "phosphate", deoxyribose: "deoxyribose", backbone: "strand", strand: "strand", duplex: "duplex", groove: "majorGroove", atom: "atom", lesion: "lesion" } as Record<string, SemanticEntityId>)[kind];
}

export function adaptDnaMechanismSpec(spec: DnaMechanismSpec, rawUtterance: string): LegacySemanticAdapterResult {
  const subjects = spec.molecularSelections.map((selection) => mention(selection.label ?? selection.id, dnaEntityForSelection(selection.kind), selection.role === "template" ? "template" : selection.role === "donor" ? "donor" : selection.role === "acceptor" ? "acceptor" : undefined));
  const interactions = spec.interactions.map((interaction) => dnaInteractionMechanism[interaction.type]);
  const mechanism = spec.family === "polarityAntiparallel" ? "antiparallelOrganization" : interactions[0] ?? (spec.family === "strandSeparation" ? "strandOpening" : "nucleotideAddition");
  const states: BiologicalStateId[] = spec.structuralState === "pairedDuplex" ? ["paired"] : spec.structuralState === "locallyOpen" || spec.structuralState === "separatedStrands" ? ["open"] : spec.structuralState === "reannealing" ? ["forming"] : ["intact"];
  const request: SemanticRequest = { subjects, phenomenon: dnaFamilyPhenomenon[spec.family], mechanism, states, focus: spec.scale.locality === "local" ? "local" : "overview", detail: spec.scale.level === "localChemistry" ? "advanced" : spec.scale.level === "nucleotide" || spec.scale.level === "basePair" ? "intermediate" : "auto", outputPreferences: [spec.reaction?.required ? "animated" : "static", spec.scale.locality === "local" ? "localFocus" : "overview"], requestedOutput: "scientificFigure" };
  if (spec.orientation.antiparallel) request.direction = { biochemical: "strandRelative", meaning: "scientific" };
  const intent = baseIntent(rawUtterance, `Explain DNA ${spec.family} using the selected molecular interactions.`, [spec.reaction?.required ? "animate" : "explain"], [request]);
  return { intent, report: report("DnaMechanismSpec", ["family", "focus", "scale", "molecularSelections", "interaction types", "orientation", "structuralState", "reaction state"], [
    { field: "requiredPrimitives", disposition: "REDUNDANT", reason: "the selected mechanism and interactions carry semantic meaning" },
    { field: "representation", disposition: "PRESENTATION_ONLY", reason: "detail requirements are renderer planning data" },
    { field: "structuralSubstrate", disposition: "RENDERER_ONLY", reason: "substrate ownership is excluded" },
    { field: "annotations", disposition: "PRESENTATION_ONLY", reason: "annotation placement is not intent" },
  ]) };
}

const dnaSelectionPhenomenon: Record<DnaPromptSelection["family"], PhenomenonId> = { structure: "helixStabilization", "sequence-regulation": "regulation", replication: "replication", transcription: "transcription", "damage-repair": "damageRepair", packaging: "packaging", "local-chemistry": "backboneChemistry" };
const dnaRoleEntity: Record<string, SemanticEntityId> = { dna: "dna", "promoter-or-gene-region": "regulatoryRegion", "replication-machinery": "replicationActor", "rna-polymerase": "rnaPolymerase", "nascent-rna": "rna", "repair-machinery": "replicationActor", "histone-or-packaging-complex": "regulatoryRegion", "local-ligand-or-damage": "lesion" };

export function adaptDnaPromptSelection(selection: DnaPromptSelection, rawUtterance: string): LegacySemanticAdapterResult {
  const request: SemanticRequest = { subjects: selection.requestedEntities.map((role) => mention(role, dnaRoleEntity[role])), phenomenon: dnaSelectionPhenomenon[selection.family], focus: selection.focalRegion.kind === "whole-molecule" ? "overview" : "local", detail: selection.detailLevel === "atom" ? "advanced" : selection.detailLevel === "residue" ? "intermediate" : "auto", outputPreferences: ["static"], requestedOutput: "scientificFigure" };
  const intent = baseIntent(rawUtterance, `Present the ${selection.family} DNA view focused on ${selection.focalRegion.kind}.`, [selection.family === "structure" || selection.family === "packaging" ? "show" : "explain"], [request]);
  return { intent, report: report("DnaPromptSelection", ["family", "detailLevel", "focalRegion", "requestedEntities", "localChemistrySubject"], [
    { field: "cameraIntent", disposition: "PRESENTATION_ONLY", reason: "camera intent is excluded" },
  ]) };
}

export function adaptDnaVisualTemplate(template: DnaVisualTemplate, rawUtterance: string): LegacySemanticAdapterResult {
  const request: SemanticRequest = { subjects: template.importantEntities.map((id) => mention(id, dnaRoleEntity[id] ?? stableEntityFor(id))), phenomenon: template.family === "damageRepair" ? "damageRepair" : template.family === "regulation" ? "regulation" : template.family === "transcription" ? "transcription" : template.family === "replication" ? "replication" : template.family === "packaging" ? "packaging" : template.family === "localChemistry" ? "backboneChemistry" : "helixStabilization", focus: template.focus === "whole-molecule" ? "overview" : "local", detail: template.representationLevel === "atom" ? "advanced" : template.representationLevel === "residue" ? "intermediate" : "auto", outputPreferences: ["static"], requestedOutput: "scientificFigure" };
  const intent = baseIntent(rawUtterance, `Present the ${template.family} DNA capability focused on ${template.focus}.`, [template.family === "structure" || template.family === "packaging" ? "show" : "explain"], [request]);
  return { intent, report: report("DnaVisualTemplate", ["family", "templateId", "representationLevel", "focus", "importantEntities"], [
    { field: "cameraPreset", disposition: "PRESENTATION_ONLY", reason: "camera configuration is excluded" },
    { field: "useExperimentalCoordinates", disposition: "RENDERER_ONLY", reason: "coordinate source policy is excluded" },
    { field: "useCanonicalProceduralDNA", disposition: "RENDERER_ONLY", reason: "geometry source policy is excluded" },
    { field: "allowProteinContext/allowTranscriptionComplex/allowReplicationMachinery/allowBallAndStick", disposition: "RENDERER_ONLY", reason: "renderer capability flags are excluded" },
    { field: "labels/localChemistrySubject", disposition: "PRESENTATION_ONLY", reason: "annotation/detail payload is excluded from intent" },
  ]) };
}

export function assertLegacyAdapterResult(result: LegacySemanticAdapterResult): void {
  const validation = validateSemanticIntent(result.intent);
  if (!validation.valid) throw new Error(`Legacy adapter produced invalid SemanticIntent: ${validation.issues.map((item) => `${item.path} ${item.message}`).join("; ")}`);
}
