/** F5-B: deterministic registry of the currently supported RNA capability surface. */
import { entityIds, mechanismIds, phenomenonIds, stateIds, type BiologicalStateId, type IntentAct, type MechanismId, type PhenomenonId, type SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import { scientificFidelityTiers, type ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";
import { sceneSpecPrimitives, type CapabilityReadiness, type SceneSpecPrimitive } from "./dna-capability-registry.ts";

export const rnaCapabilityFamilies = ["structure", "typesFunctions", "nascentTranscript", "processing", "secondaryStructure", "pairing", "hybridization", "degradation", "stability", "localChemistry", "comparison"] as const;
export type RnaCapabilityFamily = (typeof rnaCapabilityFamilies)[number];
export const rnaCapabilityStatuses = ["full", "partial", "unsupported"] as const;
export type RnaCapabilityStatus = (typeof rnaCapabilityStatuses)[number];
export const rnaPresentationOwnerReferences = ["RnaVisualSystem", "RnaTypePresentation", "RnaNascentTranscriptPresentation", "RnaProcessingPresentation", "RnaSecondaryStructurePresentation", "RnaPairingPresentation", "RnaDegradationPresentation", "RnaLocalChemistryPresentation"] as const;
export type RnaPresentationOwnerReference = (typeof rnaPresentationOwnerReferences)[number];
export type RnaCapabilityRecord = {
  capabilityId: string;
  domain: "RNA";
  family: RnaCapabilityFamily;
  supportedActs: IntentAct[];
  requiredSemanticEntities: SemanticEntityId[];
  phenomenon: PhenomenonId;
  mechanisms: MechanismId[];
  supportedScientificStates: BiologicalStateId[];
  requiredSceneSpecPrimitives: SceneSpecPrimitive[];
  presentationOwner: RnaPresentationOwnerReference;
  fidelityRequirements: { minimum: ScientificFidelityTier; provenanceRequired: boolean };
  readiness: CapabilityReadiness;
  supportStatus: RnaCapabilityStatus;
  benchmarkReferences: string[];
};
const basePrimitives: SceneSpecPrimitive[] = ["actors", "topology", "states", "fidelityProvenance", "presentationIntent"];
const record = (capabilityId: string, family: RnaCapabilityFamily, entities: SemanticEntityId[], phenomenon: PhenomenonId, mechanisms: MechanismId[], states: BiologicalStateId[], presentationOwner: RnaPresentationOwnerReference, requiredSceneSpecPrimitives = basePrimitives, readiness: CapabilityReadiness = { timeline: "staticOnly", teaching: "ready", export: "compatible" }): RnaCapabilityRecord => ({ capabilityId, domain: "RNA", family, supportedActs: ["show", "explain", "inspect"], requiredSemanticEntities: entities, phenomenon, mechanisms, supportedScientificStates: states, requiredSceneSpecPrimitives, presentationOwner, fidelityRequirements: { minimum: "S1_CONSTRAINED", provenanceRequired: true }, readiness, supportStatus: "full", benchmarkReferences: ["rna-v1", "rna-runtime-ownership"] });

/** Stable record order is part of registry determinism. */
export const rnaCapabilityRegistry: readonly RnaCapabilityRecord[] = [
  record("rna-generic-structure", "structure", ["rna", "ribose", "phosphate", "base"], "backboneChemistry", ["phosphodiesterLinkage"], ["intact", "unpaired"], "RnaVisualSystem"),
  record("rna-types-functions", "typesFunctions", ["mRNA", "tRNA", "rRNA", "miRNA", "siRNA", "snRNA"], "translation", ["translationElongation"], ["intact", "folded"], "RnaTypePresentation"),
  record("rna-nascent-transcript", "nascentTranscript", ["rna", "dna", "rnaPolymerase"], "transcription", ["transcriptionElongation"], ["nascent", "forming"], "RnaNascentTranscriptPresentation", ["actors", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-processing", "processing", ["mRNA", "exon", "intron", "cap", "polyATail"], "rnaProcessing", ["rnaSplicing", "rnaCapping"], ["preMRNA", "matureMRNA", "capped"], "RnaProcessingPresentation", ["actors", "groups", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-secondary-structure", "secondaryStructure", ["rna", "strand", "base"], "rnaSecondaryStructure", ["rnaSecondaryFolding", "hydrogenBonding"], ["folded", "paired", "unpaired"], "RnaSecondaryStructurePresentation", ["actors", "groups", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-base-pairing", "pairing", ["adenine", "uracil", "guanine", "cytosine", "hydrogenBondDonor", "hydrogenBondAcceptor"], "basePairing", ["hydrogenBonding"], ["paired", "unpaired"], "RnaPairingPresentation", ["actors", "groups", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-dna-hybridization", "hybridization", ["rna", "dna", "strand"], "rnaDnaHybridization", ["rnaDnaHybridFormation"], ["hybridized", "paired"], "RnaPairingPresentation", ["actors", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-cleavage", "degradation", ["rna", "phosphodiesterLinkage", "threePrimeOxygen"], "cleavage", ["rnaCleavage", "phosphodiesterLinkage"], ["intact", "cleaved"], "RnaDegradationPresentation", ["actors", "groups", "topology", "interactions", "states", "constraints", "fidelityProvenance", "presentationIntent"], { timeline: "ready", teaching: "ready", export: "compatible" }),
  record("rna-exonuclease-degradation", "degradation", ["rna", "strand", "phosphodiesterLinkage", "fivePrimeCarbon", "threePrimeCarbon"], "exonucleaseDegradation", ["terminalExonucleaseAction"], ["intact", "partiallyDegraded"], "RnaDegradationPresentation", ["actors", "topology", "interactions", "states", "constraints", "fidelityProvenance", "presentationIntent"], { timeline: "ready", teaching: "ready", export: "compatible" }),
  record("rna-chemical-stability", "stability", ["rna", "ribose", "riboseTwoPrimeHydroxyl", "phosphodiesterLinkage"], "chemicalStabilityComparison", ["riboseHydroxylSusceptibility"], ["intact", "cleaved", "partiallyDegraded"], "RnaDegradationPresentation", ["actors", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-local-chemistry", "localChemistry", ["rna", "nucleotide", "ribose", "phosphate", "uracil", "riboseTwoPrimeHydroxyl"], "backboneChemistry", ["phosphodiesterLinkage"], ["intact"], "RnaLocalChemistryPresentation", ["actors", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
  record("rna-dna-chemistry-comparison", "comparison", ["rna", "dna", "ribose", "deoxyribose", "riboseTwoPrimeHydroxyl"], "chemicalStabilityComparison", ["riboseHydroxylSusceptibility"], ["intact"], "RnaLocalChemistryPresentation", ["actors", "groups", "topology", "interactions", "states", "fidelityProvenance", "presentationIntent"]),
];

export type RnaCapabilityRegistryValidationIssue = { path: string; message: string };
export type RnaCapabilityRegistryValidationResult = { valid: true; issues: [] } | { valid: false; issues: RnaCapabilityRegistryValidationIssue[] };
type UnknownRecord = Record<string, unknown>; const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value); const id = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const keys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => { if (!isRecord(value)) { issue(path, "must be an object"); return false; } const allowedKeys = new Set(allowed); Object.keys(value).forEach((key) => { if (!allowedKeys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); }); return true; };
const knownList = (value: unknown, path: string, known: readonly string[], issue: (path: string, message: string) => void) => { if (!Array.isArray(value) || value.length === 0) { issue(path, "must be a non-empty array"); return; } const seen = new Set<string>(); value.forEach((entry, index) => { if (!known.includes(String(entry))) issue(`${path}[${index}]`, "is invalid"); if (seen.has(String(entry))) issue(`${path}[${index}]`, "must be unique"); seen.add(String(entry)); }); };
export function validateRnaCapabilityRegistry(registry: readonly RnaCapabilityRecord[]): RnaCapabilityRegistryValidationResult {
  const issues: RnaCapabilityRegistryValidationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message }); const ids = new Set<string>();
  registry.forEach((item, index) => { const path = `registry[${index}]`; if (!keys(item, path, ["capabilityId", "domain", "family", "supportedActs", "requiredSemanticEntities", "phenomenon", "mechanisms", "supportedScientificStates", "requiredSceneSpecPrimitives", "presentationOwner", "fidelityRequirements", "readiness", "supportStatus", "benchmarkReferences"], issue)) return; const value = item as unknown as UnknownRecord;
    if (typeof value.capabilityId !== "string" || !id.test(value.capabilityId)) issue(`${path}.capabilityId`, "must be a stable kebab-case ID"); if (ids.has(String(value.capabilityId))) issue(`${path}.capabilityId`, "must be unique"); ids.add(String(value.capabilityId)); if (value.domain !== "RNA") issue(`${path}.domain`, "must be RNA"); if (!rnaCapabilityFamilies.includes(value.family as RnaCapabilityFamily)) issue(`${path}.family`, "is invalid"); knownList(value.supportedActs, `${path}.supportedActs`, ["show", "explain", "compare", "animate", "inspect", "export"], issue); knownList(value.requiredSemanticEntities, `${path}.requiredSemanticEntities`, entityIds, issue); if (!phenomenonIds.includes(value.phenomenon as PhenomenonId)) issue(`${path}.phenomenon`, "is invalid"); knownList(value.mechanisms, `${path}.mechanisms`, mechanismIds, issue); knownList(value.supportedScientificStates, `${path}.supportedScientificStates`, stateIds, issue); knownList(value.requiredSceneSpecPrimitives, `${path}.requiredSceneSpecPrimitives`, sceneSpecPrimitives, issue); if (!rnaPresentationOwnerReferences.includes(value.presentationOwner as RnaPresentationOwnerReference)) issue(`${path}.presentationOwner`, "is invalid");
    if (keys(value.fidelityRequirements, `${path}.fidelityRequirements`, ["minimum", "provenanceRequired"], issue)) { const fidelity = value.fidelityRequirements as UnknownRecord; if (!scientificFidelityTiers.includes(fidelity.minimum as ScientificFidelityTier)) issue(`${path}.fidelityRequirements.minimum`, "is invalid"); if (typeof fidelity.provenanceRequired !== "boolean") issue(`${path}.fidelityRequirements.provenanceRequired`, "must be boolean"); }
    if (keys(value.readiness, `${path}.readiness`, ["timeline", "teaching", "export"], issue)) { const readiness = value.readiness as UnknownRecord; if (!["ready", "staticOnly", "notApplicable"].includes(String(readiness.timeline))) issue(`${path}.readiness.timeline`, "is invalid"); if (!["ready", "partial"].includes(String(readiness.teaching))) issue(`${path}.readiness.teaching`, "is invalid"); if (!["compatible", "partial", "incompatible"].includes(String(readiness.export))) issue(`${path}.readiness.export`, "is invalid"); }
    if (!rnaCapabilityStatuses.includes(value.supportStatus as RnaCapabilityStatus)) issue(`${path}.supportStatus`, "is invalid"); if (!Array.isArray(value.benchmarkReferences) || value.benchmarkReferences.length === 0 || value.benchmarkReferences.some((reference) => typeof reference !== "string" || reference.length === 0)) issue(`${path}.benchmarkReferences`, "must be non-empty benchmark IDs");
  }); return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}
