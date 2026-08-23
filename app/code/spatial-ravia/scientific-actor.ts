/** F2-A: renderer-independent scientific actors and composition groups. */

import { entityIds, type SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import type { SemanticEntityMention } from "./semantic-intent.ts";

export const scientificActorTypeExtensions = ["complex", "histone", "nucleosome", "transcript", "cleavageFragment", "localReactionCenter", "comparisonPair", "compartment", "membrane", "organelle", "vesicle", "protein", "receptor", "transporter", "channel", "ribosome", "polymerase", "motorProtein", "functionalRegion", "nuclearPore", "aminoAcid", "tRNA", "cap", "polyATail", "transcriptionMachinery", "spliceosome", "releaseFactor"] as const;
export type ScientificActorTypeId = SemanticEntityId | (typeof scientificActorTypeExtensions)[number];
export const scientificActorTypeIds: readonly ScientificActorTypeId[] = [...entityIds, ...scientificActorTypeExtensions];

export const scientificActorRoles = [
  "templateStrand", "codingStrand", "nascentTranscript", "parentStrand", "daughterStrand", "leadingStrand", "laggingStrand",
  "enzyme", "substrate", "product", "exon", "intron", "cap", "comparisonLeft", "comparisonRight", "complementaryStrand",
  "donor", "acceptor", "lesion", "repairActor", "packagingComplex", "histoneComponent", "cargo", "context", "focus",
] as const;
export type ScientificActorRole = (typeof scientificActorRoles)[number];

export const molecularScopes = ["organismContext", "cellularContext", "molecularComplex", "polymer", "strand", "residue", "chemicalComponent", "atomGroup", "atom"] as const;
export type MolecularScope = (typeof molecularScopes)[number];

/** Stable scientific identity, independent of React keys, meshes, or renderer state. */
export type ScientificActorId = string & { readonly __scientificActorId: unique symbol };
export type ScientificGroupId = string & { readonly __scientificGroupId: unique symbol };

export type ScientificResidueRange = { start: number; end: number; namespace?: "sequence" | "label" | "auth" };
export type ScientificSelector = {
  sourceStructureId?: string;
  chainId?: string;
  entityId?: string;
  residueRange?: ScientificResidueRange;
  atomNames?: string[];
};

export type ScientificAnchor = {
  id: string;
  kind: "logical" | "sequence" | "terminus" | "atomGroup" | "activeSite" | "attachment";
  label?: string;
  selector?: ScientificSelector;
};

export type ScientificSourceReference = {
  /** Non-authoritative pointer only. F2-C owns all fidelity/provenance claims. */
  sourceId?: string;
  modelId?: string;
  selector?: ScientificSelector;
};

export type ScientificActor = {
  actorId: ScientificActorId;
  semanticTypeId: ScientificActorTypeId;
  scientificSubtype?: string;
  /** Stable biological instance identity; reuse it when representing later states. */
  instanceId?: string;
  role?: ScientificActorRole;
  parentActorId?: ScientificActorId;
  childActorIds?: ScientificActorId[];
  scope: MolecularScope;
  source?: ScientificSourceReference;
  selectors?: ScientificSelector[];
  anchors?: ScientificAnchor[];
};

export const scientificGroupKinds = ["basePair", "exonRegion", "cleavageFragment", "comparisonPair", "pairedStem", "localReactionCenter", "complexComposition"] as const;
export type ScientificGroupKind = (typeof scientificGroupKinds)[number];

export type ScientificGroup = {
  groupId: ScientificGroupId;
  kind: ScientificGroupKind;
  memberActorIds: ScientificActorId[];
  label?: string;
};

export type ScientificActorScene = {
  actors: ScientificActor[];
  groups: ScientificGroup[];
};

export type ScientificActorCandidate = {
  mention: SemanticEntityMention;
  candidateActorIds: ScientificActorId[];
  resolved: boolean;
};

const actorIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const groupIdPattern = /^group-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const knownTypes = new Set<string>(scientificActorTypeIds);
const knownRoles = new Set<string>(scientificActorRoles);
const knownScopes = new Set<string>(molecularScopes);
const knownGroupKinds = new Set<string>(scientificGroupKinds);

type UnknownRecord = Record<string, unknown>;
export type ScientificActorValidationIssue = { path: string; message: string };
export type ScientificActorValidationResult = { valid: true; issues: [] } | { valid: false; issues: ScientificActorValidationIssue[] };

const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const checkKeys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const keys = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!keys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
};

function validateSelector(value: unknown, path: string, issue: (path: string, message: string) => void) {
  if (!checkKeys(value, path, ["sourceStructureId", "chainId", "entityId", "residueRange", "atomNames"], issue)) return;
  const selector = value as UnknownRecord;
  ["sourceStructureId", "chainId", "entityId"].forEach((key) => { if (selector[key] !== undefined && (typeof selector[key] !== "string" || selector[key] === "")) issue(`${path}.${key}`, "must be a non-empty string"); });
  if (selector.residueRange !== undefined) {
    if (!checkKeys(selector.residueRange, `${path}.residueRange`, ["start", "end", "namespace"], issue)) return;
    const range = selector.residueRange as UnknownRecord;
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || Number(range.start) > Number(range.end)) issue(`${path}.residueRange`, "must contain ordered integer start/end values");
    if (range.namespace !== undefined && !new Set(["sequence", "label", "auth"]).has(String(range.namespace))) issue(`${path}.residueRange.namespace`, "is invalid");
  }
  if (selector.atomNames !== undefined && (!Array.isArray(selector.atomNames) || selector.atomNames.length === 0 || selector.atomNames.some((name) => typeof name !== "string" || name.length === 0) || new Set(selector.atomNames).size !== selector.atomNames.length)) issue(`${path}.atomNames`, "must be a unique non-empty array of non-empty strings");
  if ([selector.sourceStructureId, selector.chainId, selector.entityId, selector.residueRange, selector.atomNames].every((item) => item === undefined)) issue(path, "must select at least one structure, chain, entity, residue range, or atom name");
  if (selector.residueRange !== undefined && selector.chainId === undefined && selector.entityId === undefined) issue(`${path}.residueRange`, "requires chainId or entityId");
  if (selector.atomNames !== undefined && selector.chainId === undefined && selector.entityId === undefined && selector.residueRange === undefined) issue(`${path}.atomNames`, "requires chainId, entityId, or residueRange");
}

export function validateScientificActorScene(scene: ScientificActorScene): ScientificActorValidationResult {
  const issues: ScientificActorValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(scene, "scene", ["actors", "groups"], issue)) return { valid: false, issues };
  if (!Array.isArray(scene.actors)) issue("actors", "must be an array");
  if (!Array.isArray(scene.groups)) issue("groups", "must be an array");
  const actors = Array.isArray(scene.actors) ? scene.actors : [];
  const groups = Array.isArray(scene.groups) ? scene.groups : [];
  const actorIds = new Set<string>();
  const instanceIds = new Set<string>();
  const groupIds = new Set<string>();
  const parentByActor = new Map<string, string | undefined>();

  actors.forEach((actor, index) => {
    const path = `actors[${index}]`;
    if (!checkKeys(actor, path, ["actorId", "semanticTypeId", "scientificSubtype", "instanceId", "role", "parentActorId", "childActorIds", "scope", "source", "selectors", "anchors"], issue)) return;
    const value = actor as UnknownRecord;
    const actorId = String(value.actorId ?? "");
    if (!actorIdPattern.test(actorId)) issue(`${path}.actorId`, "must be a stable kebab-case ID");
    if (actorIds.has(actorId)) issue(`${path}.actorId`, "must be unique");
    actorIds.add(actorId);
    if (!knownTypes.has(String(value.semanticTypeId))) issue(`${path}.semanticTypeId`, "is not a valid scientific actor type ID");
    if (value.instanceId !== undefined) {
      if (typeof value.instanceId !== "string" || !actorIdPattern.test(value.instanceId)) issue(`${path}.instanceId`, "must be a stable kebab-case instance ID");
      else if (instanceIds.has(value.instanceId)) issue(`${path}.instanceId`, "must be unique within the actor scene");
      else instanceIds.add(value.instanceId);
    }
    if (value.role !== undefined && !knownRoles.has(String(value.role))) issue(`${path}.role`, "is not a valid scientific actor role");
    if (!knownScopes.has(String(value.scope))) issue(`${path}.scope`, "is not a valid molecular scope");
    if (value.parentActorId !== undefined && typeof value.parentActorId !== "string") issue(`${path}.parentActorId`, "must reference an actor ID");
    parentByActor.set(actorId, value.parentActorId as string | undefined);
    if (value.childActorIds !== undefined && (!Array.isArray(value.childActorIds) || value.childActorIds.some((id) => typeof id !== "string"))) issue(`${path}.childActorIds`, "must be an array of actor IDs");
    if (value.source !== undefined) {
      if (!checkKeys(value.source, `${path}.source`, ["sourceId", "modelId", "selector"], issue)) return;
      const source = value.source as UnknownRecord;
      if (source.sourceId !== undefined && (typeof source.sourceId !== "string" || source.sourceId.length === 0)) issue(`${path}.source.sourceId`, "must be a non-empty source ID");
      if (source.modelId !== undefined && (typeof source.modelId !== "string" || source.modelId.length === 0)) issue(`${path}.source.modelId`, "must be a non-empty model ID");
      if (source.selector !== undefined) validateSelector(source.selector, `${path}.source.selector`, issue);
    }
    if (value.selectors !== undefined) {
      if (!Array.isArray(value.selectors)) issue(`${path}.selectors`, "must be an array");
      else value.selectors.forEach((selector, selectorIndex) => validateSelector(selector, `${path}.selectors[${selectorIndex}]`, issue));
    }
    if (value.anchors !== undefined) {
      if (!Array.isArray(value.anchors)) issue(`${path}.anchors`, "must be an array");
      else value.anchors.forEach((anchor, anchorIndex) => {
        const anchorPath = `${path}.anchors[${anchorIndex}]`;
        if (!checkKeys(anchor, anchorPath, ["id", "kind", "label", "selector"], issue)) return;
        const anchorValue = anchor as UnknownRecord;
        if (typeof anchorValue.id !== "string" || anchorValue.id.length === 0) issue(`${anchorPath}.id`, "is required");
        else if ((value.anchors as unknown[]).slice(0, anchorIndex).some((previous: unknown) => isRecord(previous) && previous.id === anchorValue.id)) issue(`${anchorPath}.id`, "must be unique within the actor");
        if (!new Set(["logical", "sequence", "terminus", "atomGroup", "activeSite", "attachment"]).has(String(anchorValue.kind))) issue(`${anchorPath}.kind`, "is invalid");
        if (anchorValue.selector !== undefined) validateSelector(anchorValue.selector, `${anchorPath}.selector`, issue);
      });
    }
  });

  actors.forEach((actor, index) => {
    const value = actor as UnknownRecord;
    if (value.parentActorId !== undefined && !actorIds.has(String(value.parentActorId))) issue(`actors[${index}].parentActorId`, "references a missing actor");
    if (value.parentActorId !== undefined && actorIds.has(String(value.parentActorId))) {
      const parent = actors.find((candidate) => isRecord(candidate) && candidate.actorId === value.parentActorId) as UnknownRecord | undefined;
      if (!Array.isArray(parent?.childActorIds) || !parent.childActorIds.includes(value.actorId)) issue(`actors[${index}].parentActorId`, "parent must reciprocally include this actor in childActorIds");
    }
    if (Array.isArray(value.childActorIds)) {
      const children = new Set<string>();
      value.childActorIds.forEach((id, childIndex) => {
        if (!actorIds.has(String(id))) issue(`actors[${index}].childActorIds[${childIndex}]`, "references a missing actor");
        if (children.has(String(id))) issue(`actors[${index}].childActorIds[${childIndex}]`, "must not repeat a child actor");
        children.add(String(id));
        const child = actors.find((candidate) => isRecord(candidate) && candidate.actorId === id) as UnknownRecord | undefined;
        if (child && child.parentActorId !== value.actorId) issue(`actors[${index}].childActorIds[${childIndex}]`, "child must reciprocally reference this actor as parentActorId");
      });
    }
  });
  for (const actorId of actorIds) {
    const seen = new Set<string>();
    let current: string | undefined = actorId;
    while (current) {
      if (seen.has(current)) { issue(`actors[${actorId}]`, "hierarchy contains a cycle"); break; }
      seen.add(current);
      current = parentByActor.get(current);
    }
  }

  groups.forEach((group, index) => {
    const path = `groups[${index}]`;
    if (!checkKeys(group, path, ["groupId", "kind", "memberActorIds", "label"], issue)) return;
    const value = group as UnknownRecord;
    const groupId = String(value.groupId ?? "");
    if (!groupIdPattern.test(groupId)) issue(`${path}.groupId`, "must be a stable group-* ID");
    if (groupIds.has(groupId)) issue(`${path}.groupId`, "must be unique");
    groupIds.add(groupId);
    if (!knownGroupKinds.has(String(value.kind))) issue(`${path}.kind`, "is not a valid scientific group kind");
    if (!Array.isArray(value.memberActorIds) || value.memberActorIds.length === 0) issue(`${path}.memberActorIds`, "must contain actor IDs");
    else value.memberActorIds.forEach((id, memberIndex) => { if (!actorIds.has(String(id))) issue(`${path}.memberActorIds[${memberIndex}]`, "references a missing actor"); });
  });

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

export function actorId(value: string): ScientificActorId {
  if (!actorIdPattern.test(value)) throw new Error(`Invalid scientific actor ID: ${value}`);
  return value as ScientificActorId;
}

export function groupId(value: string): ScientificGroupId {
  if (!groupIdPattern.test(value)) throw new Error(`Invalid scientific group ID: ${value}`);
  return value as ScientificGroupId;
}

export function candidateFromSemanticMention(mention: SemanticEntityMention, candidateActorIds: ScientificActorId[]): ScientificActorCandidate {
  return { mention, candidateActorIds: [...candidateActorIds], resolved: candidateActorIds.length === 1 && Boolean(mention.resolvedId) };
}
