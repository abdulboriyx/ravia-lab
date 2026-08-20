/** F5-E: authoritative normalized capability registry. */

import { dnaCapabilityRegistry, dnaPresentationOwnerReferences, sceneSpecPrimitives, type DnaCapabilityRecord, type SceneSpecPrimitive } from "./dna-capability-registry.ts";
import { rnaCapabilityRegistry, rnaPresentationOwnerReferences, type RnaCapabilityRecord } from "./rna-capability-registry.ts";
import { scientificPrimitiveRegistry, type ScientificPrimitiveId } from "./scientific-primitive-registry.ts";
import { scientificFidelityTiers } from "./scientific-fidelity-provenance.ts";
import { resolveCapabilitySupport, type CapabilityDescriptor, type CapabilityPolicyDecision, type CapabilityPolicyRequest, type CapabilityFidelity } from "./capability-support-policy.ts";

export const capabilityRegistrySchemaVersion = "1" as const;
export const capabilityRegistryDomains = ["DNA", "RNA", "shared"] as const;
export type CapabilityRegistryDomain = (typeof capabilityRegistryDomains)[number];
export const registrySupportStatuses = ["SUPPORTED", "PARTIALLY_SUPPORTED", "UNSUPPORTED"] as const;
export type RegistrySupportStatus = (typeof registrySupportStatuses)[number];
export const capabilityOwnerReferences = [...dnaPresentationOwnerReferences, ...rnaPresentationOwnerReferences] as const;

export type SceneSpecCompatibility = {
  actors: boolean;
  topology: boolean;
  interactions: boolean;
  states: boolean;
  provenance: boolean;
  presentationIntent: boolean;
  timeline: "ready" | "staticOnly" | "notApplicable";
  teaching: "ready" | "partial";
  export: "compatible" | "partial" | "incompatible";
};

export type CapabilityRegistryRecord = {
  capabilityId: string;
  domain: CapabilityRegistryDomain;
  family: string;
  supportedActs: string[];
  requiredSemanticEntities: string[];
  phenomenon: string;
  mechanisms: string[];
  supportedScientificStates: string[];
  requiredSceneSpecPrimitives: SceneSpecPrimitive[];
  primitiveIds: ScientificPrimitiveId[];
  presentationOwner: string;
  fidelityRequirements: { minimum: string; provenanceRequired: boolean };
  readiness: { timeline: "ready" | "staticOnly" | "notApplicable"; teaching: "ready" | "partial"; export: "compatible" | "partial" | "incompatible" };
  supportStatus: RegistrySupportStatus;
  benchmarkReferences: string[];
  sceneSpecCompatibility: SceneSpecCompatibility;
  policyDescriptor: CapabilityDescriptor;
};

const primitiveMap: Record<string, ScientificPrimitiveId[]> = {
  "dna-canonical-structure": ["dna-duplex", "polymer-continuity"], "dna-sequence-regulation": ["dna-duplex"], "dna-replication": ["dna-duplex", "strand-opening", "polymer-continuity", "nucleotide"], "dna-transcription": ["dna-duplex", "strand-opening", "polymer-continuity", "rna-polymer"], "dna-damage-repair": ["dna-duplex", "local-chemistry-comparison"], "dna-packaging": ["dna-duplex"], "dna-local-chemistry": ["nucleotide", "phosphodiester-linkage"], "dna-base-pairing": ["base-pair", "hydrogen-bond-interaction"], "dna-phosphodiester-backbone": ["phosphodiester-linkage", "polymer-continuity"], "dna-antiparallel-polarity": ["dna-duplex", "polarity-endpoints"], "dna-helix-stabilization": ["dna-duplex", "stacking-interaction", "hydrogen-bond-interaction"], "dna-strand-separation": ["strand-opening", "polymer-continuity"], "dna-nucleotide-assembly": ["nucleotide", "phosphodiester-linkage"],
  "rna-generic-structure": ["rna-polymer", "polymer-continuity"], "rna-types-functions": ["rna-polymer"], "rna-nascent-transcript": ["rna-polymer", "dna-duplex", "strand-opening"], "rna-processing": ["rna-polymer", "exon-intron-region", "polymer-continuity"], "rna-secondary-structure": ["rna-polymer", "base-pair"], "rna-base-pairing": ["base-pair", "hydrogen-bond-interaction"], "rna-dna-hybridization": ["rna-polymer", "dna-duplex", "base-pair"], "rna-cleavage": ["cleavage-fragments", "phosphodiester-linkage"], "rna-exonuclease-degradation": ["terminal-shortening", "polymer-continuity"], "rna-chemical-stability": ["local-chemistry-comparison"], "rna-local-chemistry": ["nucleotide", "phosphodiester-linkage"], "rna-dna-chemistry-comparison": ["comparison-group", "local-chemistry-comparison"],
};

type SourceRecord = DnaCapabilityRecord | RnaCapabilityRecord;
const sourceDomain = (record: SourceRecord): CapabilityRegistryDomain => record.domain;
const mapFidelity = (minimum: string): CapabilityFidelity => minimum === "E0_DEPOSITED" ? "deposited" : minimum === "C0_COMPUTED" ? "canonical" : minimum === "S2_SCHEMATIC" ? "schematic" : "hybrid";
const mapStatus = (status: SourceRecord["supportStatus"]): RegistrySupportStatus => status === "full" ? "SUPPORTED" : status === "partial" ? "PARTIALLY_SUPPORTED" : "UNSUPPORTED";

function normalize(record: SourceRecord): CapabilityRegistryRecord {
  const primitives = primitiveMap[record.capabilityId] ?? [];
  const policyDescriptor: CapabilityDescriptor = { capabilityId: record.capabilityId, requiredEntityIds: record.requiredSemanticEntities, supportedFidelity: mapFidelity(record.fidelityRequirements.minimum), supportsStatic: true, supportsAnimation: record.readiness.timeline === "ready", supportedOutputKinds: ["scene", "figure"], supportedExportFormats: record.readiness.export === "compatible" ? ["json", "image", "video", "gltf"] : ["json"], composableWith: [], schematicDisclosure: record.fidelityRequirements.minimum === "S2_SCHEMATIC" ? "This capability is explicitly schematic." : undefined };
  return { capabilityId: record.capabilityId, domain: sourceDomain(record), family: record.family, supportedActs: record.supportedActs, requiredSemanticEntities: record.requiredSemanticEntities, phenomenon: record.phenomenon, mechanisms: record.mechanisms, supportedScientificStates: record.supportedScientificStates, requiredSceneSpecPrimitives: record.requiredSceneSpecPrimitives, primitiveIds: primitives, presentationOwner: record.presentationOwner, fidelityRequirements: record.fidelityRequirements, readiness: record.readiness, supportStatus: mapStatus(record.supportStatus), benchmarkReferences: record.benchmarkReferences, sceneSpecCompatibility: { actors: true, topology: true, interactions: record.requiredSceneSpecPrimitives.includes("interactions"), states: true, provenance: record.requiredSceneSpecPrimitives.includes("fidelityProvenance"), presentationIntent: record.requiredSceneSpecPrimitives.includes("presentationIntent"), timeline: record.readiness.timeline, teaching: record.readiness.teaching, export: record.readiness.export }, policyDescriptor };
}

export const capabilityRegistry: readonly CapabilityRegistryRecord[] = [...dnaCapabilityRegistry, ...rnaCapabilityRegistry].map(normalize);
export const capabilityRegistryById = new Map(capabilityRegistry.map((record) => [record.capabilityId, record]));
export const capabilityRegistryPolicyDescriptors: readonly CapabilityDescriptor[] = capabilityRegistry.map((record) => record.policyDescriptor);

export type CapabilityRegistryValidationIssue = { path: string; message: string };
export type CapabilityRegistryValidationResult = { valid: true; issues: [] } | { valid: false; issues: CapabilityRegistryValidationIssue[] };
const isRecord = <T>(value: T): value is T & Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const recordKeys = ["capabilityId", "domain", "family", "supportedActs", "requiredSemanticEntities", "phenomenon", "mechanisms", "supportedScientificStates", "requiredSceneSpecPrimitives", "primitiveIds", "presentationOwner", "fidelityRequirements", "readiness", "supportStatus", "benchmarkReferences", "sceneSpecCompatibility", "policyDescriptor"] as const;
const fidelityKeys = ["minimum", "provenanceRequired"] as const;
const readinessKeys = ["timeline", "teaching", "export"] as const;
const sceneCompatibilityKeys = ["actors", "topology", "interactions", "states", "provenance", "presentationIntent", "timeline", "teaching", "export"] as const;
const descriptorKeys = ["capabilityId", "requiredEntityIds", "supportedFidelity", "supportsStatic", "supportsAnimation", "supportedOutputKinds", "supportedExportFormats", "composableWith", "incompatibleWith", "schematicDisclosure"] as const;
const f2FidelityRank: Record<string, number> = { O_OVERLAY: 0, S2_SCHEMATIC: 1, S1_CONSTRAINED: 2, C0_COMPUTED: 3, E0_DEPOSITED: 4 };
const policyFidelityRank: Record<string, number> = { schematic: 1, hybrid: 2, canonical: 3, deposited: 4 };
const f2FidelityTiers = scientificFidelityTiers as readonly string[];
const policyFidelities = Object.keys(policyFidelityRank);
const benchmarkIds = new Set(["dna-family-v1", "dna-mechanism-v1", "rna-v1", "rna-runtime-ownership"]);
const outputKinds = new Set(["scene", "figure", "data", "export"]);
const exportFormats = new Set(["json", "image", "video", "gltf", "unknown"]);

export function validateCapabilityRegistry(records: readonly CapabilityRegistryRecord[] = capabilityRegistry): CapabilityRegistryValidationResult {
  const issues: CapabilityRegistryValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!Array.isArray(records)) return { valid: false, issues: [{ path: "registry", message: "must be an array" }] };
  Object.keys(records).filter((key) => key !== "length" && !/^\d+$/.test(key)).forEach((key) => issue(`registry.${key}`, "unknown field is not allowed"));
  const ids = new Set<string>(); const primitiveIds = new Set(Object.keys(scientificPrimitiveRegistry));
  records.forEach((record, index) => {
    const path = `records[${index}]`;
    if (!isRecord(record)) { issue(path, "must be an object"); return; }
    const allowed = new Set(recordKeys); Object.keys(record).forEach((key) => { if (!allowed.has(key as typeof recordKeys[number])) issue(`${path}.${key}`, "unknown field is not allowed"); });
    if (typeof record.capabilityId !== "string" || !idPattern.test(record.capabilityId)) issue(`${path}.capabilityId`, "must be a stable ID");
    if (ids.has(record.capabilityId)) issue(`${path}.capabilityId`, "must be unique across DNA and RNA"); ids.add(record.capabilityId);
    if (!capabilityRegistryDomains.includes(record.domain)) issue(`${path}.domain`, "is invalid");
    if (!Array.isArray(record.supportedActs) || record.supportedActs.length === 0 || record.supportedActs.some((act: unknown) => !["show", "explain", "compare", "animate", "inspect", "export"].includes(String(act)))) issue(`${path}.supportedActs`, "contains invalid acts");
    for (const field of ["requiredSemanticEntities", "mechanisms", "supportedScientificStates", "requiredSceneSpecPrimitives", "primitiveIds", "benchmarkReferences"] as const) if (!Array.isArray(record[field])) issue(`${path}.${field}`, "must be an array");
    if (Array.isArray(record.requiredSceneSpecPrimitives) && record.requiredSceneSpecPrimitives.some((primitive: unknown) => !sceneSpecPrimitives.includes(String(primitive) as SceneSpecPrimitive))) issue(`${path}.requiredSceneSpecPrimitives`, "contains an invalid SceneSpec primitive");
    if (!Array.isArray(record.primitiveIds) || !record.primitiveIds.length || record.primitiveIds.some((primitive: unknown) => !primitiveIds.has(String(primitive)))) issue(`${path}.primitiveIds`, "must reference shared primitives");
    if (Array.isArray(record.primitiveIds) && record.primitiveIds.some((primitive: unknown, primitiveIndex: number) => record.primitiveIds.indexOf(primitive as ScientificPrimitiveId) !== primitiveIndex)) issue(`${path}.primitiveIds`, "must not duplicate primitives");
    if (!Array.isArray(record.benchmarkReferences) || !record.benchmarkReferences.length || record.benchmarkReferences.some((benchmark: unknown) => !benchmarkIds.has(String(benchmark)))) issue(`${path}.benchmarkReferences`, "contains a dangling benchmark reference");
    if (!capabilityOwnerReferences.includes(record.presentationOwner as typeof capabilityOwnerReferences[number])) issue(`${path}.presentationOwner`, "is not an allowed semantic owner reference");
    if (!registrySupportStatuses.includes(record.supportStatus)) issue(`${path}.supportStatus`, "is invalid");
    if (!isRecord(record.fidelityRequirements)) issue(`${path}.fidelityRequirements`, "must be an object");
    else {
      Object.keys(record.fidelityRequirements).forEach((key) => { if (!fidelityKeys.includes(key as typeof fidelityKeys[number])) issue(`${path}.fidelityRequirements.${key}`, "unknown field is not allowed"); });
      if (!f2FidelityTiers.includes(record.fidelityRequirements.minimum)) issue(`${path}.fidelityRequirements.minimum`, "is invalid");
      if (typeof record.fidelityRequirements.provenanceRequired !== "boolean") issue(`${path}.fidelityRequirements.provenanceRequired`, "must be boolean");
      if (record.fidelityRequirements.provenanceRequired && (!Array.isArray(record.requiredSceneSpecPrimitives) || !record.requiredSceneSpecPrimitives.includes("fidelityProvenance"))) issue(`${path}.fidelityRequirements`, "requires the SceneSpec provenance primitive");
    }
    if (!isRecord(record.readiness)) issue(`${path}.readiness`, "must be an object");
    else {
      Object.keys(record.readiness).forEach((key) => { if (!readinessKeys.includes(key as typeof readinessKeys[number])) issue(`${path}.readiness.${key}`, "unknown field is not allowed"); });
      if (!["ready", "staticOnly", "notApplicable"].includes(record.readiness.timeline)) issue(`${path}.readiness.timeline`, "is invalid");
      if (!["ready", "partial"].includes(record.readiness.teaching)) issue(`${path}.readiness.teaching`, "is invalid");
      if (!["compatible", "partial", "incompatible"].includes(record.readiness.export)) issue(`${path}.readiness.export`, "is invalid");
      if (record.readiness.timeline === "ready" && !record.policyDescriptor?.supportsAnimation) issue(`${path}.readiness.timeline`, "ready contradicts a static-only policy descriptor");
      if (record.readiness.timeline === "staticOnly" && record.policyDescriptor?.supportsAnimation) issue(`${path}.readiness.timeline`, "staticOnly contradicts an animated policy descriptor");
      if (record.readiness.export === "compatible" && (!Array.isArray(record.policyDescriptor?.supportedExportFormats) || record.policyDescriptor.supportedExportFormats.length === 0)) issue(`${path}.readiness.export`, "compatible requires an export format");
      if (record.readiness.export === "incompatible" && Array.isArray(record.policyDescriptor?.supportedExportFormats) && record.policyDescriptor.supportedExportFormats.length > 0) issue(`${path}.readiness.export`, "incompatible contradicts supported export formats");
    }
    if (!isRecord(record.sceneSpecCompatibility)) issue(`${path}.sceneSpecCompatibility`, "must be an object");
    else {
      Object.keys(record.sceneSpecCompatibility).forEach((key) => { if (!sceneCompatibilityKeys.includes(key as typeof sceneCompatibilityKeys[number])) issue(`${path}.sceneSpecCompatibility.${key}`, "unknown field is not allowed"); });
      for (const field of ["actors", "topology", "interactions", "states", "provenance", "presentationIntent"] as const) if (typeof record.sceneSpecCompatibility[field] !== "boolean") issue(`${path}.sceneSpecCompatibility.${field}`, "must be boolean");
    }
    const descriptor = record.policyDescriptor;
    if (!isRecord(descriptor)) issue(`${path}.policyDescriptor`, "must be an object");
    else {
      Object.keys(descriptor).forEach((key) => { if (!descriptorKeys.includes(key as typeof descriptorKeys[number])) issue(`${path}.policyDescriptor.${key}`, "unknown field is not allowed"); });
      if (descriptor.capabilityId !== record.capabilityId) issue(`${path}.policyDescriptor.capabilityId`, "must match capability ID");
      if (!policyFidelities.includes(descriptor.supportedFidelity)) issue(`${path}.policyDescriptor.supportedFidelity`, "is invalid");
      if (typeof descriptor.supportsStatic !== "boolean" || typeof descriptor.supportsAnimation !== "boolean") issue(`${path}.policyDescriptor`, "static/animation support must be boolean");
      if (!Array.isArray(descriptor.supportedOutputKinds) || descriptor.supportedOutputKinds.some((kind: unknown) => !outputKinds.has(String(kind)))) issue(`${path}.policyDescriptor.supportedOutputKinds`, "contains an invalid output kind");
      if (descriptor.supportedExportFormats !== undefined && (!Array.isArray(descriptor.supportedExportFormats) || descriptor.supportedExportFormats.some((format: unknown) => !exportFormats.has(String(format))))) issue(`${path}.policyDescriptor.supportedExportFormats`, "contains an invalid export format");
      const minimum = f2FidelityRank[record.fidelityRequirements.minimum]; const supported = policyFidelityRank[descriptor.supportedFidelity];
      if (minimum !== undefined && supported !== undefined && supported < minimum) issue(`${path}.policyDescriptor.supportedFidelity`, "does not satisfy declared F2-C minimum fidelity");
      if (record.supportStatus === "UNSUPPORTED" && descriptor.supportsStatic) issue(`${path}.supportStatus`, "contradicts a static supported policy descriptor");
      if (record.supportStatus === "SUPPORTED" && !descriptor.supportsStatic) issue(`${path}.supportStatus`, "requires a supported static or animated policy");
    }
  });
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function resolveCapabilityRegistrySupport(request: CapabilityPolicyRequest): CapabilityPolicyDecision {
  return resolveCapabilitySupport(request, capabilityRegistryPolicyDescriptors);
}
