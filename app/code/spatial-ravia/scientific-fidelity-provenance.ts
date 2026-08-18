/** F2-C: renderer-independent fidelity and provenance attachments for F2-A actors. */

import type { ScientificActorId, ScientificGroupId } from "./scientific-actor.ts";

export const scientificFidelityTiers = ["E0_DEPOSITED", "C0_COMPUTED", "S1_CONSTRAINED", "S2_SCHEMATIC", "O_OVERLAY"] as const;
export type ScientificFidelityTier = (typeof scientificFidelityTiers)[number];

export const provenanceSourceTypes = ["depositedStructure", "computedModel", "canonicalParameterSet", "chemicalReference", "literature", "curatedDataset", "educationalSchematic"] as const;
export type ProvenanceSourceType = (typeof provenanceSourceTypes)[number];
export const mechanismEvidenceLevels = ["direct", "supported", "inferred", "educational"] as const;
export type MechanismEvidenceLevel = (typeof mechanismEvidenceLevels)[number];
export const visualApproximationLevels = ["none", "minor", "constrained", "schematic", "overlay"] as const;
export type VisualApproximationLevel = (typeof visualApproximationLevels)[number];

export type ScientificInteractionId = string & { readonly __scientificInteractionId: unique symbol };
export type ScientificClaimId = string & { readonly __scientificClaimId: unique symbol };
export type ProvenanceSourceId = string & { readonly __provenanceSourceId: unique symbol };

export type StructureReference = {
  structureId: string;
  modelId?: string;
  assemblyId?: string;
  chainIds?: string[];
};

/** Catalog entry: the source itself, independent of a particular visual attachment. */
export type ScientificProvenanceSource = {
  sourceId: ProvenanceSourceId;
  sourceType: ProvenanceSourceType;
  accessionOrEntryId?: string;
  structure?: StructureReference;
  provider?: { id: string; version?: string };
  citationReference?: string;
  licenseReference?: string;
  /** Deliberately permits a stable future placeholder while content hashing is not implemented. */
  contentHash?: string;
  quality: { sourceConfidence: number; notes?: string[] };
};

/** Confidence dimensions are intentionally not collapsed into one score. */
export type ScientificConfidence = {
  sourceConfidence: number;
  groundingConfidence: number;
  mechanismEvidence: MechanismEvidenceLevel;
  visualApproximation: VisualApproximationLevel;
};

export type FidelityAttachmentTarget =
  | { kind: "actor"; actorId: ScientificActorId }
  | { kind: "group"; groupId: ScientificGroupId }
  | { kind: "interaction"; interactionId: ScientificInteractionId }
  /** Placeholder only: F2-C does not define a claim registry or claim UI. */
  | { kind: "claim"; claimId: ScientificClaimId };

/** Every visible scientific attachment declares a fidelity tier and a cataloged source. */
export type ScientificFidelityAttachment = {
  attachmentId: string;
  target: FidelityAttachmentTarget;
  fidelity: ScientificFidelityTier;
  provenanceSourceId: ProvenanceSourceId;
  confidence: ScientificConfidence;
  visible: boolean;
  note?: string;
};

export type FidelityAttachmentContext = {
  actorIds: readonly ScientificActorId[];
  groupIds: readonly ScientificGroupId[];
  interactionIds?: readonly ScientificInteractionId[];
  claimIds?: readonly ScientificClaimId[];
};

export type ScientificFidelityProvenanceDocument = {
  sources: ScientificProvenanceSource[];
  attachments: ScientificFidelityAttachment[];
};

export type FidelityProvenanceValidationIssue = { path: string; message: string };
export type FidelityProvenanceValidationResult = { valid: true; issues: [] } | { valid: false; issues: FidelityProvenanceValidationIssue[] };

const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const hashPattern = /^(?:sha256:[a-f0-9]{64}|pending:[a-z0-9][a-z0-9-]*)$/;
const sourceTypes = new Set<string>(provenanceSourceTypes);
const tiers = new Set<string>(scientificFidelityTiers);
const evidenceLevels = new Set<string>(mechanismEvidenceLevels);
const approximationLevels = new Set<string>(visualApproximationLevels);
type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);

function checkKeys(value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const known = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!known.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
}
function nonEmpty(value: unknown) { return typeof value === "string" && value.length > 0; }
function probability(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1; }

function validateSource(source: unknown, path: string, issue: (path: string, message: string) => void) {
  if (!checkKeys(source, path, ["sourceId", "sourceType", "accessionOrEntryId", "structure", "provider", "citationReference", "licenseReference", "contentHash", "quality"], issue)) return;
  const value = source as UnknownRecord;
  if (!nonEmpty(value.sourceId) || !idPattern.test(String(value.sourceId))) issue(`${path}.sourceId`, "must be a stable kebab-case ID");
  if (!sourceTypes.has(String(value.sourceType))) issue(`${path}.sourceType`, "is invalid");
  ["accessionOrEntryId", "citationReference", "licenseReference"].forEach((key) => { if (value[key] !== undefined && !nonEmpty(value[key])) issue(`${path}.${key}`, "must be a non-empty string"); });
  if (value.contentHash !== undefined && (!nonEmpty(value.contentHash) || !hashPattern.test(String(value.contentHash)))) issue(`${path}.contentHash`, "must be sha256:<64 lowercase hex> or pending:<stable-id>");
  if (value.structure !== undefined) {
    if (checkKeys(value.structure, `${path}.structure`, ["structureId", "modelId", "assemblyId", "chainIds"], issue)) {
      const structure = value.structure as UnknownRecord;
      ["structureId", "modelId", "assemblyId"].forEach((key) => { if (key === "structureId" || structure[key] !== undefined) if (!nonEmpty(structure[key])) issue(`${path}.structure.${key}`, "must be a non-empty string"); });
      if (structure.chainIds !== undefined && (!Array.isArray(structure.chainIds) || structure.chainIds.some((chain) => !nonEmpty(chain)))) issue(`${path}.structure.chainIds`, "must be an array of non-empty strings");
    }
  }
  if (value.provider !== undefined && checkKeys(value.provider, `${path}.provider`, ["id", "version"], issue)) {
    const provider = value.provider as UnknownRecord;
    if (!nonEmpty(provider.id)) issue(`${path}.provider.id`, "must be a non-empty string");
    if (provider.version !== undefined && !nonEmpty(provider.version)) issue(`${path}.provider.version`, "must be a non-empty string");
  }
  if (!checkKeys(value.quality, `${path}.quality`, ["sourceConfidence", "notes"], issue)) return;
  const quality = value.quality as UnknownRecord;
  if (!probability(quality.sourceConfidence)) issue(`${path}.quality.sourceConfidence`, "must be a finite number from 0 to 1");
  if (quality.notes !== undefined && (!Array.isArray(quality.notes) || quality.notes.some((note) => !nonEmpty(note)))) issue(`${path}.quality.notes`, "must be an array of non-empty strings");
  if (value.sourceType === "depositedStructure" && (!nonEmpty(value.accessionOrEntryId) || value.structure === undefined || !nonEmpty((value.structure as UnknownRecord).structureId) || !isRecord(value.provider) || !nonEmpty((value.provider as UnknownRecord).id))) issue(path, "depositedStructure requires accessionOrEntryId, structure.structureId, and provider.id");
  if (value.sourceType !== "depositedStructure" && value.structure !== undefined) issue(`${path}.structure`, "structure references are reserved for depositedStructure sources");
}

function validateAttachment(attachment: unknown, path: string, sourceIds: Set<string>, context: FidelityAttachmentContext, issue: (path: string, message: string) => void) {
  if (!checkKeys(attachment, path, ["attachmentId", "target", "fidelity", "provenanceSourceId", "confidence", "visible", "note"], issue)) return;
  const value = attachment as UnknownRecord;
  if (!nonEmpty(value.attachmentId) || !idPattern.test(String(value.attachmentId))) issue(`${path}.attachmentId`, "must be a stable kebab-case ID");
  if (!tiers.has(String(value.fidelity))) issue(`${path}.fidelity`, "is invalid");
  if (!sourceIds.has(String(value.provenanceSourceId))) issue(`${path}.provenanceSourceId`, "references a missing provenance source");
  if (typeof value.visible !== "boolean") issue(`${path}.visible`, "must be a boolean");
  if (value.note !== undefined && !nonEmpty(value.note)) issue(`${path}.note`, "must be a non-empty string");
  if (checkKeys(value.target, `${path}.target`, ["kind", "actorId", "groupId", "interactionId", "claimId"], issue)) {
    const target = value.target as UnknownRecord;
    const kinds = ["actor", "group", "interaction", "claim"];
    if (!kinds.includes(String(target.kind))) issue(`${path}.target.kind`, "is invalid");
    const expected = target.kind === "actor" ? "actorId" : target.kind === "group" ? "groupId" : target.kind === "interaction" ? "interactionId" : target.kind === "claim" ? "claimId" : undefined;
    ["actorId", "groupId", "interactionId", "claimId"].forEach((key) => { if (key !== expected && target[key] !== undefined) issue(`${path}.target.${key}`, "does not match target kind"); });
    if (!expected || !nonEmpty(target[expected])) issue(`${path}.target`, "must include exactly one ID matching target kind");
    if (expected === "actorId" && !context.actorIds.includes(target.actorId as ScientificActorId)) issue(`${path}.target.actorId`, "references a missing actor");
    if (expected === "groupId" && !context.groupIds.includes(target.groupId as ScientificGroupId)) issue(`${path}.target.groupId`, "references a missing group");
    if (expected === "interactionId" && !(context.interactionIds ?? []).includes(target.interactionId as ScientificInteractionId)) issue(`${path}.target.interactionId`, "references a missing interaction placeholder");
    if (expected === "claimId" && !(context.claimIds ?? []).includes(target.claimId as ScientificClaimId)) issue(`${path}.target.claimId`, "references a missing claim placeholder");
  }
  if (!checkKeys(value.confidence, `${path}.confidence`, ["sourceConfidence", "groundingConfidence", "mechanismEvidence", "visualApproximation"], issue)) return;
  const confidence = value.confidence as UnknownRecord;
  ["sourceConfidence", "groundingConfidence"].forEach((key) => { if (!probability(confidence[key])) issue(`${path}.confidence.${key}`, "must be a finite number from 0 to 1"); });
  if (!evidenceLevels.has(String(confidence.mechanismEvidence))) issue(`${path}.confidence.mechanismEvidence`, "is invalid");
  if (!approximationLevels.has(String(confidence.visualApproximation))) issue(`${path}.confidence.visualApproximation`, "is invalid");
}

/** Strict validation of a standalone F2-C document against the frozen F2-A IDs. */
export function validateScientificFidelityProvenance(document: ScientificFidelityProvenanceDocument, context: FidelityAttachmentContext): FidelityProvenanceValidationResult {
  const issues: FidelityProvenanceValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(document, "document", ["sources", "attachments"], issue)) return { valid: false, issues };
  if (!Array.isArray(document.sources)) issue("sources", "must be an array");
  if (!Array.isArray(document.attachments)) issue("attachments", "must be an array");
  const sources = Array.isArray(document.sources) ? document.sources : [];
  const attachments = Array.isArray(document.attachments) ? document.attachments : [];
  const sourceIds = new Set<string>();
  sources.forEach((source, index) => {
    validateSource(source, `sources[${index}]`, issue);
    const sourceId = String((source as UnknownRecord).sourceId ?? "");
    if (sourceIds.has(sourceId)) issue(`sources[${index}].sourceId`, "must be unique");
    sourceIds.add(sourceId);
  });
  const attachmentIds = new Set<string>();
  attachments.forEach((attachment, index) => {
    validateAttachment(attachment, `attachments[${index}]`, sourceIds, context, issue);
    const attachmentId = String((attachment as UnknownRecord).attachmentId ?? "");
    if (attachmentIds.has(attachmentId)) issue(`attachments[${index}].attachmentId`, "must be unique");
    attachmentIds.add(attachmentId);
    const source = sources.find((candidate) => String((candidate as UnknownRecord).sourceId) === String((attachment as UnknownRecord).provenanceSourceId)) as UnknownRecord | undefined;
    const tier = (attachment as UnknownRecord).fidelity;
    const approximation = ((attachment as UnknownRecord).confidence as UnknownRecord | undefined)?.visualApproximation;
    if (tier === "E0_DEPOSITED" && source?.sourceType !== "depositedStructure") issue(`attachments[${index}].fidelity`, "E0_DEPOSITED requires a depositedStructure source");
    if (tier === "C0_COMPUTED" && !["computedModel", "canonicalParameterSet", "chemicalReference"].includes(String(source?.sourceType))) issue(`attachments[${index}].fidelity`, "C0_COMPUTED requires computed, canonical, or chemical-reference provenance");
    if (tier === "S1_CONSTRAINED" && approximation !== "constrained") issue(`attachments[${index}].confidence.visualApproximation`, "S1_CONSTRAINED requires constrained visual approximation");
    if (tier === "S2_SCHEMATIC" && approximation !== "schematic") issue(`attachments[${index}].confidence.visualApproximation`, "S2_SCHEMATIC requires schematic visual approximation");
    if (tier === "O_OVERLAY" && approximation !== "overlay") issue(`attachments[${index}].confidence.visualApproximation`, "O_OVERLAY requires overlay visual approximation");
  });
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

export const interactionId = (value: string): ScientificInteractionId => {
  if (!idPattern.test(value)) throw new Error(`Invalid scientific interaction ID: ${value}`);
  return value as ScientificInteractionId;
};
export const claimId = (value: string): ScientificClaimId => {
  if (!idPattern.test(value)) throw new Error(`Invalid scientific claim ID: ${value}`);
  return value as ScientificClaimId;
};
export const provenanceSourceId = (value: string): ProvenanceSourceId => {
  if (!idPattern.test(value)) throw new Error(`Invalid provenance source ID: ${value}`);
  return value as ProvenanceSourceId;
};
