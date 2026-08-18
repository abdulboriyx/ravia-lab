/** F2-D: semantic display emphasis, independent of scientific state and render implementation. */

import type { ScientificActorId, ScientificActorScene, ScientificGroupId } from "./scientific-actor.ts";

export const presentationIntentModes = ["overview", "localFocus", "comparison", "mechanismFocus"] as const;
export type PresentationIntentMode = (typeof presentationIntentModes)[number];

export const contextSuppressionModes = ["none", "nonFocus", "allExceptContext"] as const;
export type ContextSuppressionMode = (typeof contextSuppressionModes)[number];

export const presentationMotionModes = ["static", "animated"] as const;
export type PresentationMotionMode = (typeof presentationMotionModes)[number];

export const presentationAudiences = ["general", "student", "expert"] as const;
export type PresentationAudience = (typeof presentationAudiences)[number];

export const presentationDetailProjections = ["overview", "standard", "molecular"] as const;
export type PresentationDetailProjection = (typeof presentationDetailProjections)[number];

/** A semantic reference; its target is resolved against a ScientificActorScene. */
export type PresentationReference =
  | { kind: "actor"; actorId: ScientificActorId }
  | { kind: "group"; groupId: ScientificGroupId }
  | { kind: "anchor"; actorId: ScientificActorId; anchorId: string };

export type PresentationComparison = {
  left: PresentationReference;
  right: PresentationReference;
};

/**
 * States what the user should attend to. It deliberately has no geometry,
 * camera, styling, renderer, or teaching-copy fields.
 */
export type PresentationIntent = {
  mode: PresentationIntentMode;
  focusActorIds: ScientificActorId[];
  contextActorIds: ScientificActorId[];
  contextSuppression: ContextSuppressionMode;
  regionOfInterest?: PresentationReference[];
  annotationPriority: PresentationReference[];
  comparison?: PresentationComparison;
  motion: PresentationMotionMode;
  audience: PresentationAudience;
  detail: PresentationDetailProjection;
};

export type PresentationIntentValidationIssue = { path: string; message: string };
export type PresentationIntentValidationResult = { valid: true; issues: [] } | { valid: false; issues: PresentationIntentValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const known = (values: readonly string[], value: unknown) => typeof value === "string" && values.includes(value);

function checkKeys(value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const allowedKeys = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!allowedKeys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
}

function referenceKey(reference: PresentationReference) {
  return reference.kind === "group" ? `group:${reference.groupId}` : reference.kind === "actor" ? `actor:${reference.actorId}` : `anchor:${reference.actorId}:${reference.anchorId}`;
}

function validateReference(value: unknown, path: string, actorIds: Set<string>, groupIds: Set<string>, anchorsByActor: Map<string, Set<string>>, issue: (path: string, message: string) => void): value is PresentationReference {
  if (!checkKeys(value, path, ["kind", "actorId", "groupId", "anchorId"], issue)) return false;
  const reference = value as UnknownRecord;
  if (reference.kind === "actor") {
    if (Object.prototype.hasOwnProperty.call(reference, "groupId") || Object.prototype.hasOwnProperty.call(reference, "anchorId")) issue(path, "actor references may contain only kind and actorId");
    if (typeof reference.actorId !== "string" || !actorIds.has(reference.actorId)) issue(`${path}.actorId`, "references a missing actor");
    return true;
  }
  if (reference.kind === "group") {
    if (Object.prototype.hasOwnProperty.call(reference, "actorId") || Object.prototype.hasOwnProperty.call(reference, "anchorId")) issue(path, "group references may contain only kind and groupId");
    if (typeof reference.groupId !== "string" || !groupIds.has(reference.groupId)) issue(`${path}.groupId`, "references a missing group");
    return true;
  }
  if (reference.kind === "anchor") {
    if (Object.prototype.hasOwnProperty.call(reference, "groupId")) issue(path, "anchor references may not contain groupId");
    if (typeof reference.actorId !== "string" || !actorIds.has(reference.actorId)) issue(`${path}.actorId`, "references a missing actor");
    else if (typeof reference.anchorId !== "string" || !anchorsByActor.get(reference.actorId)?.has(reference.anchorId)) issue(`${path}.anchorId`, "references a missing actor anchor");
    return true;
  }
  issue(`${path}.kind`, "must be actor, group, or anchor");
  return false;
}

function validateActorIdList(value: unknown, path: string, actorIds: Set<string>, issue: (path: string, message: string) => void) {
  if (!Array.isArray(value)) { issue(path, "must be an array of actor IDs"); return []; }
  const values = value as unknown[];
  const seen = new Set<string>();
  values.forEach((actorId, index) => {
    if (typeof actorId !== "string" || !actorIds.has(actorId)) issue(`${path}[${index}]`, "references a missing actor");
    if (seen.has(String(actorId))) issue(`${path}[${index}]`, "must not contain duplicate actors");
    seen.add(String(actorId));
  });
  return values.map(String);
}

export function validatePresentationIntent(intent: PresentationIntent, actors: ScientificActorScene): PresentationIntentValidationResult {
  const issues: PresentationIntentValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(intent, "intent", ["mode", "focusActorIds", "contextActorIds", "contextSuppression", "regionOfInterest", "annotationPriority", "comparison", "motion", "audience", "detail"], issue)) return { valid: false, issues };
  const actorIds = new Set(actors.actors.map((actor) => String(actor.actorId)));
  const groupIds = new Set(actors.groups.map((group) => String(group.groupId)));
  const anchorsByActor = new Map(actors.actors.map((actor) => [String(actor.actorId), new Set((actor.anchors ?? []).map((anchor) => anchor.id))]));
  const value = intent as unknown as UnknownRecord;
  if (!known(presentationIntentModes, value.mode)) issue("intent.mode", "is invalid");
  const focusActorIds = validateActorIdList(value.focusActorIds, "intent.focusActorIds", actorIds, issue);
  const contextActorIds = validateActorIdList(value.contextActorIds, "intent.contextActorIds", actorIds, issue);
  const focusSet = new Set(focusActorIds);
  contextActorIds.forEach((actorId, index) => { if (focusSet.has(actorId)) issue(`intent.contextActorIds[${index}]`, "must not also be a focus actor"); });
  if (!known(contextSuppressionModes, value.contextSuppression)) issue("intent.contextSuppression", "is invalid");
  if (!known(presentationMotionModes, value.motion)) issue("intent.motion", "is invalid");
  if (!known(presentationAudiences, value.audience)) issue("intent.audience", "is invalid");
  if (!known(presentationDetailProjections, value.detail)) issue("intent.detail", "is invalid");

  const validateReferences = (references: unknown, path: string, required: boolean) => {
    if (references === undefined && !required) return [] as PresentationReference[];
    if (!Array.isArray(references) || (required && references.length === 0)) { issue(path, "must be a non-empty array of references"); return [] as PresentationReference[]; }
    const seen = new Set<string>();
    return references.filter((reference, index) => {
      const valid = validateReference(reference, `${path}[${index}]`, actorIds, groupIds, anchorsByActor, issue);
      if (valid) {
        const key = referenceKey(reference as PresentationReference);
        if (seen.has(key)) issue(`${path}[${index}]`, "must not contain duplicate references");
        seen.add(key);
      }
      return valid;
    }) as PresentationReference[];
  };
  const roi = validateReferences(value.regionOfInterest, "intent.regionOfInterest", false);
  validateReferences(value.annotationPriority, "intent.annotationPriority", true);

  if (value.mode === "localFocus" && (focusActorIds.length === 0 || roi.length === 0)) issue("intent", "localFocus requires focus actors and a region of interest");
  if (value.mode === "mechanismFocus" && focusActorIds.length === 0) issue("intent.focusActorIds", "mechanismFocus requires at least one focus actor");
  if (value.contextSuppression === "allExceptContext" && contextActorIds.length === 0) issue("intent.contextActorIds", "allExceptContext requires context actors");
  if (value.mode === "comparison") {
    if (!checkKeys(value.comparison, "intent.comparison", ["left", "right"], issue)) issue("intent.comparison", "is required for comparison mode");
    else {
      const comparison = value.comparison as UnknownRecord;
      const left = validateReference(comparison.left, "intent.comparison.left", actorIds, groupIds, anchorsByActor, issue);
      const right = validateReference(comparison.right, "intent.comparison.right", actorIds, groupIds, anchorsByActor, issue);
      if (left && right && referenceKey(comparison.left as PresentationReference) === referenceKey(comparison.right as PresentationReference)) issue("intent.comparison", "left and right must be distinct");
    }
  } else if (value.comparison !== undefined) issue("intent.comparison", "is only valid for comparison mode");
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}
