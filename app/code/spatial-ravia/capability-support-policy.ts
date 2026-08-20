/** F5-D: deterministic capability support policy. Contract-only; no runtime routing. */

export const capabilitySupportStatuses = ["SUPPORTED", "PARTIALLY_SUPPORTED", "CLARIFICATION_REQUIRED", "UNSUPPORTED", "INVALID_SCIENTIFIC_REQUEST"] as const;
export type CapabilitySupportStatus = (typeof capabilitySupportStatuses)[number];

export const capabilityFidelities = ["canonical", "deposited", "hybrid", "schematic"] as const;
export type CapabilityFidelity = (typeof capabilityFidelities)[number];

export const capabilityOutputKinds = ["scene", "figure", "data", "export"] as const;
export type CapabilityOutputKind = (typeof capabilityOutputKinds)[number];
export type CapabilityExportFormat = "json" | "image" | "video" | "gltf" | "unknown";

export type CapabilityDescriptor = {
  capabilityId: string;
  requiredEntityIds?: string[];
  supportedFidelity: CapabilityFidelity;
  supportsStatic: boolean;
  supportsAnimation: boolean;
  supportedOutputKinds: CapabilityOutputKind[];
  supportedExportFormats?: CapabilityExportFormat[];
  composableWith?: string[];
  incompatibleWith?: string[];
  schematicDisclosure?: string;
};

export type CapabilityClause = {
  clauseId: string;
  capabilityId?: string;
  candidateCapabilityIds?: string[];
  requestedEntityIds?: string[];
  unresolvedEntityIds?: string[];
  ambiguousMechanism?: boolean;
  scientificValidity?: "valid" | "misconception" | "invalid";
  requestedFidelity?: CapabilityFidelity;
  requiresAnimation?: boolean;
  outputKind?: CapabilityOutputKind;
  exportFormat?: CapabilityExportFormat;
};

export type CapabilityPolicyRequest = {
  clauses: CapabilityClause[];
  allowSchematic: boolean;
  allowExplicitStaticSubstitution: boolean;
};

export type CapabilityPolicyClarification = {
  required: true;
  question: string;
  clauseIds: string[];
  candidateCapabilityIds: string[];
};

export type CapabilityPolicyDisclosure = {
  schematic: boolean;
  staticSubstitution: boolean;
  messages: string[];
};

export type CapabilityPolicyDecision = {
  status: CapabilitySupportStatus;
  compile: boolean;
  selectedCapabilityIds: string[];
  unresolvedClauseIds: string[];
  reason: string;
  clarification?: CapabilityPolicyClarification;
  disclosure?: CapabilityPolicyDisclosure;
};

export type CapabilityPolicyValidationIssue = { path: string; message: string };
export type CapabilityPolicyValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: CapabilityPolicyValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
const idPattern = /^[a-z][a-zA-Z0-9]*(?:[.-][a-zA-Z0-9]+)*$/;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const checkKeys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const keys = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!keys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
};
const uniqueStrings = (value: unknown, path: string, issue: (path: string, message: string) => void) => {
  if (!Array.isArray(value)) { issue(path, "must be an array"); return; }
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !idPattern.test(entry)) issue(`${path}[${index}]`, "must contain stable IDs");
    if (seen.has(String(entry))) issue(`${path}[${index}]`, "must not contain duplicates");
    seen.add(String(entry));
  });
};

export function validateCapabilityPolicyRequest(request: CapabilityPolicyRequest, descriptors: readonly CapabilityDescriptor[]): CapabilityPolicyValidationResult {
  const issues: CapabilityPolicyValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(request, "request", ["clauses", "allowSchematic", "allowExplicitStaticSubstitution"], issue)) return { valid: false, issues };
  if (typeof request.allowSchematic !== "boolean") issue("request.allowSchematic", "must be boolean");
  if (typeof request.allowExplicitStaticSubstitution !== "boolean") issue("request.allowExplicitStaticSubstitution", "must be boolean");
  if (!Array.isArray(request.clauses) || request.clauses.length === 0) issue("request.clauses", "must contain at least one clause");
  const descriptorIds = new Set(descriptors.map((descriptor) => descriptor.capabilityId));
  const clauseIds = new Set<string>();
  (Array.isArray(request.clauses) ? request.clauses : []).forEach((clause, index) => {
    const path = `request.clauses[${index}]`;
    if (!checkKeys(clause, path, ["clauseId", "capabilityId", "candidateCapabilityIds", "requestedEntityIds", "unresolvedEntityIds", "ambiguousMechanism", "scientificValidity", "requestedFidelity", "requiresAnimation", "outputKind", "exportFormat"], issue)) return;
    const value = clause as UnknownRecord;
    if (typeof value.clauseId !== "string" || !idPattern.test(value.clauseId)) issue(`${path}.clauseId`, "must be a stable ID");
    if (clauseIds.has(String(value.clauseId))) issue(`${path}.clauseId`, "must be unique");
    clauseIds.add(String(value.clauseId));
    if (value.capabilityId !== undefined && (typeof value.capabilityId !== "string" || !descriptorIds.has(value.capabilityId))) issue(`${path}.capabilityId`, "must reference a known capability");
    if (value.candidateCapabilityIds !== undefined) uniqueStrings(value.candidateCapabilityIds, `${path}.candidateCapabilityIds`, issue);
    if (value.requestedEntityIds !== undefined) uniqueStrings(value.requestedEntityIds, `${path}.requestedEntityIds`, issue);
    if (value.unresolvedEntityIds !== undefined) uniqueStrings(value.unresolvedEntityIds, `${path}.unresolvedEntityIds`, issue);
    if (value.ambiguousMechanism !== undefined && typeof value.ambiguousMechanism !== "boolean") issue(`${path}.ambiguousMechanism`, "must be boolean");
    if (value.scientificValidity !== undefined && !["valid", "misconception", "invalid"].includes(String(value.scientificValidity))) issue(`${path}.scientificValidity`, "is invalid");
    if (value.requestedFidelity !== undefined && !capabilityFidelities.includes(value.requestedFidelity as CapabilityFidelity)) issue(`${path}.requestedFidelity`, "is invalid");
    if (value.requiresAnimation !== undefined && typeof value.requiresAnimation !== "boolean") issue(`${path}.requiresAnimation`, "must be boolean");
    if (value.outputKind !== undefined && !capabilityOutputKinds.includes(value.outputKind as CapabilityOutputKind)) issue(`${path}.outputKind`, "is invalid");
    if (value.exportFormat !== undefined && !["json", "image", "video", "gltf", "unknown"].includes(String(value.exportFormat))) issue(`${path}.exportFormat`, "is invalid");
  });
  descriptors.forEach((descriptor, index) => {
    const path = `descriptors[${index}]`;
    if (!checkKeys(descriptor, path, ["capabilityId", "requiredEntityIds", "supportedFidelity", "supportsStatic", "supportsAnimation", "supportedOutputKinds", "supportedExportFormats", "composableWith", "incompatibleWith", "schematicDisclosure"], issue)) return;
    if (typeof descriptor.capabilityId !== "string" || !idPattern.test(descriptor.capabilityId)) issue(`${path}.capabilityId`, "must be a stable ID");
    if (descriptor.requiredEntityIds !== undefined) uniqueStrings(descriptor.requiredEntityIds, `${path}.requiredEntityIds`, issue);
    if (!capabilityFidelities.includes(descriptor.supportedFidelity)) issue(`${path}.supportedFidelity`, "is invalid");
    if (typeof descriptor.supportsStatic !== "boolean") issue(`${path}.supportsStatic`, "must be boolean");
    if (typeof descriptor.supportsAnimation !== "boolean") issue(`${path}.supportsAnimation`, "must be boolean");
    if (!Array.isArray(descriptor.supportedOutputKinds) || descriptor.supportedOutputKinds.some((kind) => !capabilityOutputKinds.includes(kind))) issue(`${path}.supportedOutputKinds`, "contains an invalid output kind");
    if (descriptor.supportedExportFormats !== undefined && (!Array.isArray(descriptor.supportedExportFormats) || descriptor.supportedExportFormats.some((format) => !["json", "image", "video", "gltf", "unknown"].includes(format)))) issue(`${path}.supportedExportFormats`, "contains an invalid export format");
    if (descriptor.composableWith !== undefined) uniqueStrings(descriptor.composableWith, `${path}.composableWith`, issue);
    if (descriptor.incompatibleWith !== undefined) uniqueStrings(descriptor.incompatibleWith, `${path}.incompatibleWith`, issue);
  });
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

function fidelityRank(fidelity: CapabilityFidelity): number { return { schematic: 0, hybrid: 1, canonical: 2, computed: 2, deposited: 3 }[fidelity]; }

export function resolveCapabilitySupport(request: CapabilityPolicyRequest, descriptors: readonly CapabilityDescriptor[]): CapabilityPolicyDecision {
  const validation = validateCapabilityPolicyRequest(request, descriptors);
  if (!validation.valid) return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [], reason: "Invalid capability policy request." };
  const byId = new Map(descriptors.map((descriptor) => [descriptor.capabilityId, descriptor]));
  const selected: CapabilityDescriptor[] = [];
  const unresolved: string[] = [];
  const messages: string[] = [];
  let staticSubstitution = false;
  let schematic = false;
  for (const clause of request.clauses) {
    if (clause.scientificValidity === "invalid" || clause.scientificValidity === "misconception") return { status: "INVALID_SCIENTIFIC_REQUEST", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [clause.clauseId], reason: clause.scientificValidity === "misconception" ? "The request contains a suspected misconception; correct the claim before compilation." : "The requested scientific combination is invalid." };
    if (clause.unresolvedEntityIds?.length) { unresolved.push(clause.clauseId); continue; }
    if (clause.ambiguousMechanism || (!clause.capabilityId && (clause.candidateCapabilityIds?.length ?? 0) > 1)) { unresolved.push(clause.clauseId); continue; }
    const id = clause.capabilityId ?? clause.candidateCapabilityIds?.[0];
    const descriptor = id ? byId.get(id) : undefined;
    if (!descriptor) return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [clause.clauseId], reason: "No capability matches the requested scientific meaning." };
    const requestedEntities = new Set(clause.requestedEntityIds ?? []);
    const missing = (descriptor.requiredEntityIds ?? []).filter((entity) => !requestedEntities.has(entity));
    if (missing.length) { unresolved.push(clause.clauseId); continue; }
    if (clause.outputKind && !descriptor.supportedOutputKinds.includes(clause.outputKind)) return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [clause.clauseId], reason: "The requested output type is unsupported by the matched capability." };
    if (clause.exportFormat && (!descriptor.supportedExportFormats?.includes(clause.exportFormat))) return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [clause.clauseId], reason: "The requested export format is unsupported." };
    if (clause.requiresAnimation && !descriptor.supportsAnimation) {
      if (!request.allowExplicitStaticSubstitution || !descriptor.supportsStatic) return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [clause.clauseId], reason: "Animation was requested but only static capability is available." };
      staticSubstitution = true; messages.push(`${clause.clauseId}: static capability substituted explicitly for animation.`);
    }
    if (clause.requestedFidelity && fidelityRank(descriptor.supportedFidelity) < fidelityRank(clause.requestedFidelity)) {
      if (!request.allowSchematic || descriptor.supportedFidelity !== "schematic") return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [clause.clauseId], reason: "Required scientific fidelity is unavailable." };
      schematic = true; messages.push(`${clause.clauseId}: schematic capability disclosed.`);
    }
    selected.push(descriptor);
  }
  if (unresolved.length) return { status: "CLARIFICATION_REQUIRED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: unresolved, reason: "The request has unresolved entities or multiple plausible mechanisms.", clarification: { required: true, question: "Which scientific entity or mechanism should be shown?", clauseIds: unresolved, candidateCapabilityIds: [...new Set(unresolved.flatMap((clauseId) => request.clauses.find((clause) => clause.clauseId === clauseId)?.candidateCapabilityIds ?? []))] } };
  for (let leftIndex = 0; leftIndex < selected.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < selected.length; rightIndex += 1) {
    const left = selected[leftIndex]!; const right = selected[rightIndex]!;
    if (left.incompatibleWith?.includes(right.capabilityId) || right.incompatibleWith?.includes(left.capabilityId) || (left.composableWith && !left.composableWith.includes(right.capabilityId))) return { status: "UNSUPPORTED", compile: false, selectedCapabilityIds: [], unresolvedClauseIds: [], reason: "The requested capabilities cannot be composed scientifically." };
  }
  const disclosure = schematic || staticSubstitution ? { schematic, staticSubstitution, messages } : undefined;
  return { status: disclosure ? "PARTIALLY_SUPPORTED" : "SUPPORTED", compile: true, selectedCapabilityIds: selected.map((descriptor) => descriptor.capabilityId), unresolvedClauseIds: [], reason: disclosure ? "Capability compiles with explicit limitations." : "All requested capabilities are supported.", disclosure };
}
