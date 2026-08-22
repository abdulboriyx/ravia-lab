/** P2-D: deterministic structure assembly/model authority, deliberately upstream of selectors and loaders. */
import type { ValidatedProvenanceSource } from "./scientific-source-provenance-resolver.ts";

export type StructureContextOutcome = "RESOLVED" | "AMBIGUOUS" | "UNSUPPORTED" | "INVALID_SOURCE";
export type StructureAssemblyInventory = { assemblyId: string; chainIds: readonly string[]; modelNumbers: readonly number[] };
export type StructureCoordinateInventory = {
  asymmetricUnit: { chainIds: readonly string[]; modelNumbers: readonly number[] };
  biologicalAssemblies: readonly StructureAssemblyInventory[];
  alternateLocationIds?: readonly string[];
  variants?: readonly string[];
};
export type StructureContextRequest = {
  assembly?: { kind: "biologicalAssembly"; assemblyId?: string } | { kind: "asymmetricUnit" };
  modelNumber?: number;
  chainIds?: readonly string[];
  variant?: string;
  alternateLocations?: { policy: "highestOccupancy" } | { policy: "specific"; locationId: string };
};
export type ResolvedStructureContext = {
  sourceId: ValidatedProvenanceSource["sourceId"];
  structureId: string;
  assembly: { kind: "biologicalAssembly"; assemblyId: string } | { kind: "asymmetricUnit" };
  modelNumber: number;
  chainIds: readonly string[];
  variant?: string;
  alternateLocationPolicy: "notApplicable" | "highestOccupancy" | { specific: string };
  rationale: readonly string[];
};
export type StructureContextResolution =
  | { outcome: "RESOLVED"; context: ResolvedStructureContext }
  | { outcome: "AMBIGUOUS"; reasons: readonly string[]; sourceId: ValidatedProvenanceSource["sourceId"] }
  | { outcome: "UNSUPPORTED"; reasons: readonly string[]; sourceId: ValidatedProvenanceSource["sourceId"] }
  | { outcome: "INVALID_SOURCE"; reasons: readonly string[]; sourceId?: ValidatedProvenanceSource["sourceId"] };

const unique = <T>(values: readonly T[]) => new Set<T>(values).size === values.length;
const unknownKeys = (value: unknown, allowed: readonly string[], path: string, problems: string[]) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) { problems.push(`${path} must be an object`); return; }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) problems.push(`${path}.${key} is not allowed`);
};
const sourceId = (source: ValidatedProvenanceSource) => source.sourceId;
const invalid = (source: ValidatedProvenanceSource, reasons: string[]): StructureContextResolution => ({ outcome: "INVALID_SOURCE", sourceId: source.sourceId, reasons });
const unsupported = (source: ValidatedProvenanceSource, reasons: string[]): StructureContextResolution => ({ outcome: "UNSUPPORTED", sourceId: source.sourceId, reasons });
const ambiguous = (source: ValidatedProvenanceSource, reasons: string[]): StructureContextResolution => ({ outcome: "AMBIGUOUS", sourceId: source.sourceId, reasons });

/**
 * Resolves only deposited-coordinate context. It never parses prompts, loads coordinates,
 * or produces molecular selectors. Multi-valued choices remain explicit ambiguity.
 */
export function resolveStructureContext(source: ValidatedProvenanceSource, inventory: StructureCoordinateInventory, request: StructureContextRequest = {}): StructureContextResolution {
  const problems: string[] = [];
  unknownKeys(inventory, ["asymmetricUnit", "biologicalAssemblies", "alternateLocationIds", "variants"], "inventory", problems);
  unknownKeys(inventory.asymmetricUnit, ["chainIds", "modelNumbers"], "inventory.asymmetricUnit", problems);
  inventory.biologicalAssemblies.forEach((assembly, index) => unknownKeys(assembly, ["assemblyId", "chainIds", "modelNumbers"], `inventory.biologicalAssemblies[${index}]`, problems));
  unknownKeys(request, ["assembly", "modelNumber", "chainIds", "variant", "alternateLocations"], "request", problems);
  if (request.assembly) unknownKeys(request.assembly, ["kind", "assemblyId"], "request.assembly", problems);
  if (request.alternateLocations) unknownKeys(request.alternateLocations, request.alternateLocations.policy === "specific" ? ["policy", "locationId"] : ["policy"], "request.alternateLocations", problems);
  if (source.__p2BValidated !== true || source.sourceType !== "depositedStructure" || !source.structure?.structureId || !source.accessionOrEntryId || !source.provider?.id || !source.citationReference || !source.licenseReference) problems.push("source must be a fully validated P2-B deposited provenance record");
  if (!unique(inventory.asymmetricUnit.chainIds) || !unique(inventory.asymmetricUnit.modelNumbers) || inventory.asymmetricUnit.chainIds.length === 0 || inventory.asymmetricUnit.modelNumbers.length === 0) problems.push("asymmetric-unit inventory must have unique non-empty chains and models");
  if (inventory.biologicalAssemblies.some((assembly) => !assembly.assemblyId || !unique(assembly.chainIds) || !unique(assembly.modelNumbers) || assembly.chainIds.length === 0 || assembly.modelNumbers.length === 0) || !unique(inventory.biologicalAssemblies.map((assembly) => assembly.assemblyId))) problems.push("biological-assembly inventory must contain unique valid assembly IDs, chains, and models");
  if (inventory.alternateLocationIds && (!unique(inventory.alternateLocationIds) || inventory.alternateLocationIds.length === 0)) problems.push("alternate-location inventory must be unique and non-empty when supplied");
  if (inventory.variants && (!unique(inventory.variants) || inventory.variants.length === 0)) problems.push("variant inventory must be unique and non-empty when supplied");
  if (problems.length) return invalid(source, problems);

  const structure = source.structure;
  if (!structure) return invalid(source, ["source structure reference is missing"]);
  const preferredAssemblyId = structure.assemblyId;
  let assembly: ResolvedStructureContext["assembly"];
  let availableChains: readonly string[];
  let availableModels: readonly number[];
  const rationale: string[] = [];
  if (request.assembly?.kind === "asymmetricUnit") {
    assembly = { kind: "asymmetricUnit" }; availableChains = inventory.asymmetricUnit.chainIds; availableModels = inventory.asymmetricUnit.modelNumbers; rationale.push("asymmetric unit explicitly requested");
  } else {
    const requestedId = request.assembly?.assemblyId ?? preferredAssemblyId;
    const candidates = requestedId ? inventory.biologicalAssemblies.filter((candidate) => candidate.assemblyId === requestedId) : inventory.biologicalAssemblies;
    if (candidates.length === 0) return unsupported(source, [`biological assembly ${requestedId ?? "(unspecified)"} is unavailable`]);
    if (candidates.length > 1) return ambiguous(source, ["multiple biological assemblies are available; specify an assembly ID"]);
    const selected = candidates[0]!;
    assembly = { kind: "biologicalAssembly", assemblyId: selected.assemblyId }; availableChains = selected.chainIds; availableModels = selected.modelNumbers;
    rationale.push(request.assembly?.assemblyId ? "biological assembly explicitly requested" : preferredAssemblyId ? "P2-B source record declares the biological assembly" : "only available biological assembly selected");
  }
  const modelCandidates = request.modelNumber === undefined ? availableModels : availableModels.filter((model) => model === request.modelNumber);
  if (modelCandidates.length === 0) return unsupported(source, [`model ${request.modelNumber} is unavailable in the selected assembly context`]);
  if (modelCandidates.length > 1) return ambiguous(source, ["multiple models are available; specify modelNumber"]);
  const modelNumber = modelCandidates[0]!; rationale.push(request.modelNumber === undefined ? "only available model selected" : "model explicitly requested");
  const chainIds = request.chainIds ? [...request.chainIds] : [...availableChains];
  if (!unique(chainIds) || chainIds.length === 0) return invalid(source, ["requested chain set must be unique and non-empty"]);
  if (chainIds.some((chain) => !availableChains.includes(chain))) return unsupported(source, ["requested chain is not available in the selected assembly/model context"]);
  if (!request.chainIds && chainIds.length > 1) return ambiguous(source, ["multiple chains are available; specify chainIds"]);
  rationale.push(request.chainIds ? "chain set explicitly requested" : "only available chain selected");
  let variant: string | undefined;
  if (inventory.variants?.length) {
    if (!request.variant && inventory.variants.length > 1) return ambiguous(source, ["multiple structure variants are available; specify variant"]);
    variant = request.variant ?? inventory.variants[0]!;
    if (!inventory.variants.includes(variant)) return unsupported(source, [`variant ${variant} is unavailable`]);
    rationale.push(request.variant ? "variant explicitly requested" : "only available variant selected");
  } else if (request.variant) return unsupported(source, [`variant ${request.variant} is unavailable`]);
  let alternateLocationPolicy: ResolvedStructureContext["alternateLocationPolicy"] = "notApplicable";
  if (inventory.alternateLocationIds?.length) {
    if (!request.alternateLocations) return ambiguous(source, ["alternate locations are available; specify an alternate-location policy"]);
    if (request.alternateLocations.policy !== "specific" && request.alternateLocations.policy !== "highestOccupancy") return invalid(source, ["alternate-location policy is invalid"]);
    if (request.alternateLocations.policy === "specific") {
      if (!inventory.alternateLocationIds.includes(request.alternateLocations.locationId)) return unsupported(source, [`alternate location ${request.alternateLocations.locationId} is unavailable`]);
      alternateLocationPolicy = { specific: request.alternateLocations.locationId };
    } else alternateLocationPolicy = "highestOccupancy";
    rationale.push(`alternate-location policy: ${request.alternateLocations.policy}`);
  } else if (request.alternateLocations) return unsupported(source, ["alternate-location policy was requested but no alternate locations are available"]);
  return { outcome: "RESOLVED", context: { sourceId: sourceId(source), structureId: structure.structureId, assembly, modelNumber, chainIds, ...(variant ? { variant } : {}), alternateLocationPolicy, rationale } };
}
