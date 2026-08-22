/**
 * P2-B: the single source/provenance boundary for grounding.
 *
 * This module only catalogs source identity and attaches it to an already
 * identified scientific target.  It deliberately does not select chains,
 * residues, assemblies, or infer interactions.
 */
import {
  claimId,
  interactionId,
  provenanceSourceId,
  type FidelityAttachmentContext,
  type ProvenanceSourceType,
  type ScientificFidelityProvenanceDocument,
  type ScientificFidelityTier,
  type ScientificProvenanceSource,
  type FidelityAttachmentTarget,
  validateScientificFidelityProvenance,
} from "./scientific-fidelity-provenance.ts";
import { actorId, groupId } from "./scientific-actor.ts";

/** Bounded source-provider vocabulary. Provider identity is not a renderer identity. */
export const sourceResolverProviderIds = [
  "rcsb-pdb", "RCSB-PDB", "uniprot", "reactome", "biomodels",
  "gene-ontology", "chebi", "canonical-ravia", "local-curated", "literature",
] as const;
export type SourceResolverProviderId = (typeof sourceResolverProviderIds)[number];

type Evidence = "direct" | "supported" | "inferred" | "educational";
type Approximation = "none" | "minor" | "constrained" | "schematic" | "overlay";
type ResolverTarget =
  | { kind: "actor"; id: string }
  | { kind: "group"; id: string }
  | { kind: "interaction"; id: string }
  | { kind: "claim"; id: string };

export type SourceProvenanceResolverInput = {
  sourceId: string;
  sourceType: ProvenanceSourceType;
  fidelity: ScientificFidelityTier;
  provider?: { id: string; version?: string };
  accessionOrEntryId?: string;
  structure?: { structureId: string; modelId?: string; assemblyId?: string; chainIds?: string[] };
  citationReference?: string;
  licenseReference?: string;
  contentHash?: string;
  sourceConfidence: number;
  groundingConfidence: number;
  mechanismEvidence: Evidence;
  visualApproximation: Approximation;
  attachmentId: string;
  target: ResolverTarget;
  visible?: boolean;
  note?: string;
};

export type SourceProvenanceResolutionIssue = { path: string; message: string };
export type ValidatedProvenanceSource = ScientificProvenanceSource & { readonly __p2BValidated: true };
export type SourceProvenanceResolution =
  | { ok: true; document: ScientificFidelityProvenanceDocument; source: ValidatedProvenanceSource }
  | { ok: false; issues: SourceProvenanceResolutionIssue[] };

const providers = new Set<string>(sourceResolverProviderIds);
const sourceTypes = new Set(["depositedStructure", "computedModel", "canonicalParameterSet", "chemicalReference", "literature", "curatedDataset", "educationalSchematic"]);
const tiers = new Set(["E0_DEPOSITED", "C0_COMPUTED", "S1_CONSTRAINED", "S2_SCHEMATIC", "O_OVERLAY"]);
const evidence = new Set(["direct", "supported", "inferred", "educational"]);
const approximations = new Set(["none", "minor", "constrained", "schematic", "overlay"]);
const stableId = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const probability = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function keys(value: unknown, allowed: readonly string[], path: string, issues: SourceProvenanceResolutionIssue[]) {
  if (!record(value)) { issues.push({ path, message: "must be an object" }); return false; }
  const set = new Set(allowed);
  for (const key of Object.keys(value)) if (!set.has(key)) issues.push({ path: `${path}.${key}`, message: "unknown field is not allowed" });
  return true;
}

function targetFor(target: ResolverTarget, issue: SourceProvenanceResolutionIssue): FidelityAttachmentTarget | undefined {
  const targetIssues: SourceProvenanceResolutionIssue[] = [];
  keys(target, ["kind", "id"], "target", targetIssues);
  if (targetIssues.length > 0) { issue.path = targetIssues[0]!.path; issue.message = targetIssues[0]!.message; return undefined; }
  if (!record(target) || !["actor", "group", "interaction", "claim"].includes(target.kind) || !stableId.test(target.id)) {
    issue.path = "target"; issue.message = "target must have a valid kind and stable ID"; return undefined;
  }
  if (target.kind === "actor") return { kind: "actor", actorId: actorId(target.id) };
  if (target.kind === "group") return { kind: "group", groupId: groupId(target.id) };
  if (target.kind === "interaction") return { kind: "interaction", interactionId: interactionId(target.id) };
  return { kind: "claim", claimId: claimId(target.id) };
}

/** Resolve one source and one attachment, delegating final document validity to frozen F2-C. */
export function resolveScientificSourceProvenance(input: SourceProvenanceResolverInput, context: FidelityAttachmentContext): SourceProvenanceResolution {
  const issues: SourceProvenanceResolutionIssue[] = [];
  if (!keys(input, ["sourceId", "sourceType", "fidelity", "provider", "accessionOrEntryId", "structure", "citationReference", "licenseReference", "contentHash", "sourceConfidence", "groundingConfidence", "mechanismEvidence", "visualApproximation", "attachmentId", "target", "visible", "note"], "input", issues)) return { ok: false, issues };
  if (!stableId.test(input.sourceId)) issues.push({ path: "sourceId", message: "must be a stable kebab-case ID" });
  if (!sourceTypes.has(input.sourceType)) issues.push({ path: "sourceType", message: "unknown source type" });
  if (!tiers.has(input.fidelity)) issues.push({ path: "fidelity", message: "unknown fidelity tier" });
  if (!probability(input.sourceConfidence) || !probability(input.groundingConfidence)) issues.push({ path: "confidence", message: "confidence values must be between 0 and 1" });
  if (!evidence.has(input.mechanismEvidence)) issues.push({ path: "mechanismEvidence", message: "unknown evidence level" });
  if (!approximations.has(input.visualApproximation)) issues.push({ path: "visualApproximation", message: "unknown visual approximation" });
  if (!stableId.test(input.attachmentId)) issues.push({ path: "attachmentId", message: "must be a stable kebab-case ID" });
  if (input.visible !== undefined && typeof input.visible !== "boolean") issues.push({ path: "visible", message: "must be boolean" });
  const optionalText: Array<keyof SourceProvenanceResolverInput> = ["accessionOrEntryId", "citationReference", "licenseReference", "contentHash", "note"];
  for (const name of optionalText) if (input[name] !== undefined && !nonEmpty(input[name])) issues.push({ path: name, message: "must be a non-empty string" });
  if (input.provider !== undefined && keys(input.provider, ["id", "version"], "provider", issues)) {
    if (!providers.has(input.provider.id)) issues.push({ path: "provider.id", message: "unknown provider" });
    if (input.provider.version !== undefined && !nonEmpty(input.provider.version)) issues.push({ path: "provider.version", message: "must be non-empty; no version is fabricated" });
  }
  if (input.structure !== undefined && keys(input.structure, ["structureId", "modelId", "assemblyId", "chainIds"], "structure", issues)) {
    if (!nonEmpty(input.structure.structureId)) issues.push({ path: "structure.structureId", message: "must be non-empty" });
    for (const name of ["modelId", "assemblyId"] as const) if (input.structure[name] !== undefined && !nonEmpty(input.structure[name])) issues.push({ path: `structure.${name}`, message: "must be non-empty" });
    if (input.structure.chainIds !== undefined && (!Array.isArray(input.structure.chainIds) || input.structure.chainIds.some((v) => !nonEmpty(v)))) issues.push({ path: "structure.chainIds", message: "must be non-empty strings" });
  }
  const targetIssue = { path: "target", message: "invalid target" };
  const attachmentTarget = targetFor(input.target, targetIssue);
  if (!attachmentTarget) issues.push(targetIssue);
  if (input.sourceType === "depositedStructure") {
    if (!input.provider || !providers.has(input.provider.id)) issues.push({ path: "provider", message: "deposited source requires an allowed provider" });
    if (!nonEmpty(input.accessionOrEntryId)) issues.push({ path: "accessionOrEntryId", message: "deposited source requires accession; none is fabricated" });
    if (!input.structure || !nonEmpty(input.structure.structureId)) issues.push({ path: "structure", message: "deposited source requires structure identity" });
    if (!nonEmpty(input.citationReference) || !nonEmpty(input.licenseReference)) issues.push({ path: "provenance", message: "deposited source requires citation and license references" });
  }
  if (input.fidelity === "E0_DEPOSITED" && input.sourceType !== "depositedStructure") issues.push({ path: "fidelity", message: "deposited fidelity requires deposited provenance" });
  if (input.fidelity === "S2_SCHEMATIC" && input.sourceType !== "educationalSchematic") issues.push({ path: "fidelity", message: "schematic fidelity requires educational schematic provenance" });
  if (input.fidelity === "C0_COMPUTED" && !["computedModel", "canonicalParameterSet", "chemicalReference"].includes(input.sourceType)) issues.push({ path: "fidelity", message: "computed fidelity conflicts with source type" });
  if (input.fidelity === "S1_CONSTRAINED" && input.visualApproximation !== "constrained") issues.push({ path: "visualApproximation", message: "constrained fidelity requires constrained approximation" });
  if (input.fidelity === "S2_SCHEMATIC" && input.visualApproximation !== "schematic") issues.push({ path: "visualApproximation", message: "schematic fidelity requires schematic approximation" });
  if (input.fidelity === "O_OVERLAY" && input.visualApproximation !== "overlay") issues.push({ path: "visualApproximation", message: "overlay fidelity requires overlay approximation" });
  if (issues.length || !attachmentTarget) return { ok: false, issues };

  const source: ScientificProvenanceSource = {
    sourceId: provenanceSourceId(input.sourceId), sourceType: input.sourceType,
    ...(input.accessionOrEntryId === undefined ? {} : { accessionOrEntryId: input.accessionOrEntryId }),
    ...(input.structure === undefined ? {} : { structure: input.structure }),
    ...(input.provider === undefined ? {} : { provider: input.provider }),
    ...(input.citationReference === undefined ? {} : { citationReference: input.citationReference }),
    ...(input.licenseReference === undefined ? {} : { licenseReference: input.licenseReference }),
    ...(input.contentHash === undefined ? {} : { contentHash: input.contentHash }),
    quality: { sourceConfidence: input.sourceConfidence },
  };
  const document: ScientificFidelityProvenanceDocument = {
    sources: [source],
    attachments: [{ attachmentId: input.attachmentId, target: attachmentTarget, fidelity: input.fidelity, provenanceSourceId: source.sourceId, confidence: { sourceConfidence: input.sourceConfidence, groundingConfidence: input.groundingConfidence, mechanismEvidence: input.mechanismEvidence, visualApproximation: input.visualApproximation }, visible: input.visible ?? true, ...(input.note === undefined ? {} : { note: input.note }) }],
  };
  const validation = validateScientificFidelityProvenance(document, context);
  if (!validation.valid) return { ok: false, issues: validation.issues };
  Object.defineProperty(source, "__p2BValidated", { value: true, enumerable: false });
  return { ok: true, document, source: source as ValidatedProvenanceSource };
}
