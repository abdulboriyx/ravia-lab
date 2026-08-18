/** F2-B: renderer-independent topology, interactions, and scientific state. */

import type {
  ScientificActor,
  ScientificActorId,
  ScientificActorScene,
  ScientificAnchor,
} from "./scientific-actor.ts";

export const topologyInteractionKinds = ["covalent", "noncovalent", "semanticRelation"] as const;
export type TopologyInteractionKind = (typeof topologyInteractionKinds)[number];

export const topologyInteractionTypes = [
  "covalentBond",
  "phosphodiesterLinkage",
  "hydrogenBond",
  "baseStacking",
  "polymerContinuity",
  "basePairing",
  "hybridization",
  "exonSpan",
  "intronSpan",
  "fragmentContinuity",
  "terminalDegradation",
  "repairRecognition",
  "chemicalComparison",
] as const;
export type TopologyInteractionType = (typeof topologyInteractionTypes)[number];

/** The sole kind/type compatibility authority; visual appearance never infers chemistry. */
export const topologyInteractionCompatibility: Readonly<Record<TopologyInteractionKind, readonly TopologyInteractionType[]>> = {
  covalent: ["covalentBond", "phosphodiesterLinkage"],
  noncovalent: ["hydrogenBond", "baseStacking", "basePairing", "hybridization"],
  semanticRelation: ["polymerContinuity", "exonSpan", "intronSpan", "fragmentContinuity", "terminalDegradation", "repairRecognition", "chemicalComparison"],
};

export const interactionStates = ["present", "forming", "breaking", "absent"] as const;
export type InteractionState = (typeof interactionStates)[number];

export type TopologyEndpoint = {
  actorId: ScientificActorId;
  anchorId?: string;
};

export type ScientificInteraction = {
  interactionId: string;
  kind: TopologyInteractionKind;
  type: TopologyInteractionType;
  participants: TopologyEndpoint[];
  state: InteractionState;
  /** True when retained as an explanatory relation rather than a literal bond. */
  explanatory?: boolean;
};

export type ScientificContinuity = {
  continuityId: string;
  strandActorId: ScientificActorId;
  orderedActorIds: ScientificActorId[];
  state: "intact" | "cleaved" | "partial";
};

export type TopologyChange = {
  changeId: string;
  kind: "cleavage" | "fragmentation" | "pairing" | "separation" | "hybridization" | "processing";
  actorIds: ScientificActorId[];
  interactionIds?: string[];
  biochemicalDirection?: "fiveToThree" | "threeToFive";
};

export type TopologyGraph = {
  graphId: string;
  actorIds: ScientificActorId[];
  interactions: ScientificInteraction[];
  continuities?: ScientificContinuity[];
  changes?: TopologyChange[];
};

export const scientificStateKinds = [
  "paired", "unpaired", "intact", "cleaved", "preMRNA", "matureMRNA", "open", "closed",
  "nascent", "partiallyDegraded", "hybridized", "capped", "uncapped",
] as const;
export type ScientificStateKind = (typeof scientificStateKinds)[number];

export type ScientificState = {
  stateId: string;
  kind: ScientificStateKind;
  actorIds: ScientificActorId[];
  interactionIds?: string[];
  continuityIds?: string[];
  topologyChangeIds?: string[];
};

export const scientificConstraintKinds = [
  "requires",
  "forbids",
  "preservesContinuity",
  "requiresParticipant",
  "mutuallyExclusiveState",
] as const;
export type ScientificConstraintKind = (typeof scientificConstraintKinds)[number];

/** Declarative placeholder; interpretation belongs to later planning/state systems. */
export type ScientificConstraint = {
  constraintId: string;
  kind: ScientificConstraintKind;
  actorIds?: ScientificActorId[];
  interactionIds?: string[];
  stateIds?: string[];
  description?: string;
};

export type ScientificTopologyModel = {
  topology: TopologyGraph;
  states: ScientificState[];
  constraints?: ScientificConstraint[];
};

export type ScientificTopologyValidationIssue = { path: string; message: string };
export type ScientificTopologyValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: ScientificTopologyValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const checkKeys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const keys = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!keys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
};
const nonEmptyId = (value: unknown): value is string => typeof value === "string" && /^[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/.test(value);

function validateEndpoint(value: unknown, path: string, actorMap: Map<string, ScientificActor>, issue: (path: string, message: string) => void) {
  if (!checkKeys(value, path, ["actorId", "anchorId"], issue)) return;
  const endpoint = value as UnknownRecord;
  if (typeof endpoint.actorId !== "string" || !actorMap.has(endpoint.actorId)) issue(`${path}.actorId`, "must reference an actor");
  if (endpoint.anchorId !== undefined) {
    if (typeof endpoint.anchorId !== "string" || endpoint.anchorId.length === 0) issue(`${path}.anchorId`, "must be a non-empty anchor ID");
    else {
      const actor = actorMap.get(String(endpoint.actorId));
      const anchors = actor?.anchors ?? [];
      if (!anchors.some((anchor: ScientificAnchor) => anchor.id === endpoint.anchorId)) issue(`${path}.anchorId`, "does not exist on the referenced actor");
    }
  }
}

export function validateScientificTopologyModel(model: ScientificTopologyModel, actorScene: ScientificActorScene): ScientificTopologyValidationResult {
  const issues: ScientificTopologyValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(model, "model", ["topology", "states", "constraints"], issue)) return { valid: false, issues };
  if (!checkKeys(model.topology, "topology", ["graphId", "actorIds", "interactions", "continuities", "changes"], issue)) return { valid: false, issues };
  if (!Array.isArray(model.states)) issue("states", "must be an array");
  const actors = new Map(actorScene.actors.map((actor) => [actor.actorId as string, actor]));
  const topology = model.topology as UnknownRecord;
  const graphId = topology.graphId;
  if (!nonEmptyId(graphId)) issue("topology.graphId", "must be a stable ID");
  const graphActorIds = Array.isArray(topology.actorIds) ? topology.actorIds : [];
  const graphActorSet = new Set<string>();
  if (!Array.isArray(topology.actorIds)) issue("topology.actorIds", "must be an array");
  graphActorIds.forEach((id, index) => {
    if (typeof id !== "string" || !actors.has(id)) issue(`topology.actorIds[${index}]`, "must reference an actor");
    if (graphActorSet.has(String(id))) issue(`topology.actorIds[${index}]`, "must be unique");
    graphActorSet.add(String(id));
  });
  const interactionIds = new Set<string>();
  const interactions = Array.isArray(topology.interactions) ? topology.interactions : [];
  if (!Array.isArray(topology.interactions)) issue("topology.interactions", "must be an array");
  interactions.forEach((interaction, index) => {
    const path = `topology.interactions[${index}]`;
    if (!checkKeys(interaction, path, ["interactionId", "kind", "type", "participants", "state", "explanatory"], issue)) return;
    const value = interaction as UnknownRecord;
    const id = value.interactionId;
    if (!nonEmptyId(id)) issue(`${path}.interactionId`, "must be a stable ID");
    if (interactionIds.has(String(id))) issue(`${path}.interactionId`, "must be unique");
    interactionIds.add(String(id));
    if (!topologyInteractionKinds.includes(value.kind as TopologyInteractionKind)) issue(`${path}.kind`, "is invalid");
    if (!topologyInteractionTypes.includes(value.type as TopologyInteractionType)) issue(`${path}.type`, "is invalid");
    else if (!topologyInteractionCompatibility[value.kind as TopologyInteractionKind]?.includes(value.type as TopologyInteractionType)) issue(`${path}.type`, "is incompatible with interaction kind");
    if (!interactionStates.includes(value.state as InteractionState)) issue(`${path}.state`, "is invalid");
    if (!Array.isArray(value.participants) || value.participants.length < 2) issue(`${path}.participants`, "must contain at least two endpoints");
    else value.participants.forEach((endpoint, endpointIndex) => validateEndpoint(endpoint, `${path}.participants[${endpointIndex}]`, actors, issue));
    const isCovalent = value.kind === "covalent";
    if (isCovalent && value.state !== "absent" && Array.isArray(value.participants)) {
      const endpointKey = value.participants.map((endpoint) => {
        const item = endpoint as UnknownRecord;
        return `${String(item.actorId)}:${String(item.anchorId ?? "")}`;
      }).sort().join("|");
      const duplicate = interactions.slice(0, index).some((previous) => {
        if (!isRecord(previous) || previous.kind !== "covalent" || previous.state === "absent" || !Array.isArray(previous.participants)) return false;
        return previous.participants.map((endpoint) => `${String((endpoint as UnknownRecord).actorId)}:${String((endpoint as UnknownRecord).anchorId ?? "")}`).sort().join("|") === endpointKey;
      });
      if (duplicate) issue(`${path}.participants`, "duplicates an existing covalent link");
    }
  });

  const continuityIds = new Set<string>();
  const continuities = Array.isArray(topology.continuities) ? topology.continuities : [];
  if (topology.continuities !== undefined && !Array.isArray(topology.continuities)) issue("topology.continuities", "must be an array");
  continuities.forEach((continuity, index) => {
    const path = `topology.continuities[${index}]`;
    if (!checkKeys(continuity, path, ["continuityId", "strandActorId", "orderedActorIds", "state"], issue)) return;
    const value = continuity as UnknownRecord;
    if (!nonEmptyId(value.continuityId)) issue(`${path}.continuityId`, "must be a stable ID");
    if (continuityIds.has(String(value.continuityId))) issue(`${path}.continuityId`, "must be unique");
    continuityIds.add(String(value.continuityId));
    if (typeof value.strandActorId !== "string" || !actors.has(value.strandActorId)) issue(`${path}.strandActorId`, "must reference an actor");
    if (!Array.isArray(value.orderedActorIds) || value.orderedActorIds.length < 2) issue(`${path}.orderedActorIds`, "must contain at least two actors");
    else {
      const ordered = value.orderedActorIds as unknown[];
      const seen = new Set<string>();
      ordered.forEach((id, childIndex) => {
        if (typeof id !== "string" || !actors.has(id)) issue(`${path}.orderedActorIds[${childIndex}]`, "must reference an actor");
        if (seen.has(String(id))) issue(`${path}.orderedActorIds[${childIndex}]`, "must not repeat an actor");
        seen.add(String(id));
      });
    }
    if (!["intact", "cleaved", "partial"].includes(String(value.state))) issue(`${path}.state`, "is invalid");
  });

  const states = Array.isArray(model.states) ? model.states : [];
  const stateIds = new Set<string>();
  states.forEach((state, index) => {
    const path = `states[${index}]`;
    if (!checkKeys(state, path, ["stateId", "kind", "actorIds", "interactionIds", "continuityIds", "topologyChangeIds"], issue)) return;
    const value = state as UnknownRecord;
    if (!nonEmptyId(value.stateId)) issue(`${path}.stateId`, "must be a stable ID");
    if (stateIds.has(String(value.stateId))) issue(`${path}.stateId`, "must be unique");
    stateIds.add(String(value.stateId));
    if (!scientificStateKinds.includes(value.kind as ScientificStateKind)) issue(`${path}.kind`, "is invalid");
    if (!Array.isArray(value.actorIds) || value.actorIds.length === 0) issue(`${path}.actorIds`, "must contain actors");
    else value.actorIds.forEach((id, actorIndex) => { if (typeof id !== "string" || !actors.has(id)) issue(`${path}.actorIds[${actorIndex}]`, "must reference an actor"); });
    if (value.interactionIds !== undefined && (!Array.isArray(value.interactionIds) || value.interactionIds.some((id) => !interactionIds.has(String(id))))) issue(`${path}.interactionIds`, "must reference interactions");
    if (value.continuityIds !== undefined && (!Array.isArray(value.continuityIds) || value.continuityIds.some((id) => !continuityIds.has(String(id))))) issue(`${path}.continuityIds`, "must reference continuities");
  });

  if (topology.changes !== undefined && !Array.isArray(topology.changes)) issue("topology.changes", "must be an array");
  const changes = Array.isArray(topology.changes) ? topology.changes : [];
  const changeIds = new Set<string>();
  changes.forEach((change, index) => {
    const path = `topology.changes[${index}]`;
    if (!checkKeys(change, path, ["changeId", "kind", "actorIds", "interactionIds", "biochemicalDirection"], issue)) return;
    const value = change as UnknownRecord;
    if (!nonEmptyId(value.changeId)) issue(`${path}.changeId`, "must be a stable ID");
    if (changeIds.has(String(value.changeId))) issue(`${path}.changeId`, "must be unique");
    changeIds.add(String(value.changeId));
    if (!["cleavage", "fragmentation", "pairing", "separation", "hybridization", "processing"].includes(String(value.kind))) issue(`${path}.kind`, "is invalid");
    if (!Array.isArray(value.actorIds) || value.actorIds.some((id) => !actors.has(String(id)))) issue(`${path}.actorIds`, "must reference actors");
    if (value.interactionIds !== undefined && (!Array.isArray(value.interactionIds) || value.interactionIds.some((id) => !interactionIds.has(String(id))))) issue(`${path}.interactionIds`, "must reference interactions");
    if (value.biochemicalDirection !== undefined && !["fiveToThree", "threeToFive"].includes(String(value.biochemicalDirection))) issue(`${path}.biochemicalDirection`, "is invalid");
  });

  if (model.constraints !== undefined && !Array.isArray(model.constraints)) issue("constraints", "must be an array");
  const constraints = Array.isArray(model.constraints) ? model.constraints : [];
  const constraintIds = new Set<string>();
  constraints.forEach((constraint, index) => {
    const path = `constraints[${index}]`;
    if (!checkKeys(constraint, path, ["constraintId", "kind", "actorIds", "interactionIds", "stateIds", "description"], issue)) return;
    const value = constraint as UnknownRecord;
    if (!nonEmptyId(value.constraintId)) issue(`${path}.constraintId`, "must be a stable ID");
    if (constraintIds.has(String(value.constraintId))) issue(`${path}.constraintId`, "must be unique");
    constraintIds.add(String(value.constraintId));
    if (!scientificConstraintKinds.includes(value.kind as ScientificConstraintKind)) issue(`${path}.kind`, "is invalid");
    if (value.actorIds !== undefined && (!Array.isArray(value.actorIds) || value.actorIds.some((id) => !actors.has(String(id))))) issue(`${path}.actorIds`, "must reference actors");
    if (value.interactionIds !== undefined && (!Array.isArray(value.interactionIds) || value.interactionIds.some((id) => !interactionIds.has(String(id))))) issue(`${path}.interactionIds`, "must reference interactions");
    if (value.stateIds !== undefined && (!Array.isArray(value.stateIds) || value.stateIds.some((id) => !stateIds.has(String(id))))) issue(`${path}.stateIds`, "must reference states");
  });
  states.forEach((state, index) => {
    const value = state as UnknownRecord;
    if (Array.isArray(value.topologyChangeIds)) value.topologyChangeIds.forEach((id, changeIndex) => { if (!changeIds.has(String(id))) issue(`states[${index}].topologyChangeIds[${changeIndex}]`, "must reference a topology change"); });
  });
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}
