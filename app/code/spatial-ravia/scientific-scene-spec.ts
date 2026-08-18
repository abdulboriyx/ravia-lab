/** F2-E: ScientificSceneSpec v1 composes F2-A/B/C/D without renderer ownership. */

import { validateScientificActorScene, type ScientificActorScene } from "./scientific-actor.ts";
import { validatePresentationIntent, type PresentationIntent } from "./presentation-intent.ts";
import { validateScientificFidelityProvenance, type FidelityAttachmentContext, type ScientificClaimId, type ScientificFidelityProvenanceDocument } from "./scientific-fidelity-provenance.ts";
import { validateScientificTopologyModel, type ScientificConstraint, type ScientificState, type TopologyGraph } from "./scientific-topology.ts";

export const scientificSceneSpecSchemaVersion = "1" as const;

/**
 * Canonical, renderer-independent resolved scientific scene. F1 SemanticIntent
 * remains upstream and immutable; a future planner may create this value.
 */
export type ScientificSceneSpec = {
  schemaVersion: typeof scientificSceneSpecSchemaVersion;
  sceneId: string;
  actors: ScientificActorScene["actors"];
  groups: ScientificActorScene["groups"];
  topology: TopologyGraph;
  states: ScientificState[];
  constraints?: ScientificConstraint[];
  /** Placeholder IDs only; F2-E deliberately does not define a claim model or UI. */
  claimIds?: ScientificClaimId[];
  fidelityProvenance: ScientificFidelityProvenanceDocument;
  presentationIntent: PresentationIntent;
};

export type ScientificSceneSpecValidationIssue = { path: string; message: string };
export type ScientificSceneSpecValidationResult = { valid: true; issues: [] } | { valid: false; issues: ScientificSceneSpecValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const sceneIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function checkKeys(value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const known = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!known.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
}

/** Strictly validates F2-A/B/C/D composition and all cross-contract references. */
export function validateScientificSceneSpec(scene: ScientificSceneSpec): ScientificSceneSpecValidationResult {
  const issues: ScientificSceneSpecValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(scene, "scene", ["schemaVersion", "sceneId", "actors", "groups", "topology", "states", "constraints", "claimIds", "fidelityProvenance", "presentationIntent"], issue)) return { valid: false, issues };
  const value = scene as unknown as UnknownRecord;
  if (value.schemaVersion !== scientificSceneSpecSchemaVersion) issue("scene.schemaVersion", `must be ${scientificSceneSpecSchemaVersion}; unknown versions require a future migration`);
  if (typeof value.sceneId !== "string" || !sceneIdPattern.test(value.sceneId)) issue("scene.sceneId", "must be a stable kebab-case ID");
  if (value.claimIds !== undefined && !Array.isArray(value.claimIds)) issue("scene.claimIds", "must be an array of stable claim IDs");
  const claimIds = Array.isArray(value.claimIds) ? value.claimIds : [];
  const claimIdSet = new Set<string>();
  claimIds.forEach((claimId, index) => {
    if (typeof claimId !== "string" || !sceneIdPattern.test(claimId)) issue(`scene.claimIds[${index}]`, "must be a stable kebab-case claim ID");
    if (claimIdSet.has(String(claimId))) issue(`scene.claimIds[${index}]`, "must be unique");
    claimIdSet.add(String(claimId));
  });
  const actorScene: ScientificActorScene = { actors: Array.isArray(value.actors) ? value.actors as ScientificActorScene["actors"] : [], groups: Array.isArray(value.groups) ? value.groups as ScientificActorScene["groups"] : [] };
  const actorResult = validateScientificActorScene(actorScene);
  if (!actorResult.valid) issues.push(...actorResult.issues.map((entry) => ({ path: `scene.${entry.path}`, message: entry.message })));
  const topologyResult = validateScientificTopologyModel({ topology: value.topology as TopologyGraph, states: Array.isArray(value.states) ? value.states as ScientificState[] : [], constraints: value.constraints as ScientificConstraint[] | undefined }, actorScene);
  if (!topologyResult.valid) issues.push(...topologyResult.issues.map((entry) => ({ path: `scene.${entry.path}`, message: entry.message })));
  const context: FidelityAttachmentContext = {
    actorIds: actorScene.actors.map((actor) => actor.actorId),
    groupIds: actorScene.groups.map((group) => group.groupId),
    interactionIds: Array.isArray((value.topology as UnknownRecord | undefined)?.interactions) ? ((value.topology as UnknownRecord).interactions as UnknownRecord[]).map((interaction) => String(interaction.interactionId)) as unknown as FidelityAttachmentContext["interactionIds"] : [],
    claimIds: claimIds as ScientificClaimId[],
  };
  const fidelityResult = validateScientificFidelityProvenance(value.fidelityProvenance as ScientificFidelityProvenanceDocument, context);
  if (!fidelityResult.valid) issues.push(...fidelityResult.issues.map((entry) => ({ path: `scene.${entry.path}`, message: entry.message })));
  const presentationResult = validatePresentationIntent(value.presentationIntent as PresentationIntent, actorScene);
  if (!presentationResult.valid) issues.push(...presentationResult.issues.map((entry) => ({ path: `scene.${entry.path}`, message: entry.message })));
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

/** Canonical serialization: validate first, then recursively sort object keys; array order is semantic. */
export function serializeScientificSceneSpec(scene: ScientificSceneSpec): string {
  const result = validateScientificSceneSpec(scene);
  if (!result.valid) throw new Error(`Cannot serialize invalid ScientificSceneSpec: ${result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; ")}`);
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    return value;
  };
  return JSON.stringify(canonical(scene));
}

/** Presentation replacement is intentionally the only convenience operation; scientific fields are copied unchanged. */
export function withPresentationIntent(scene: ScientificSceneSpec, presentationIntent: PresentationIntent): ScientificSceneSpec {
  return { ...scene, presentationIntent };
}
