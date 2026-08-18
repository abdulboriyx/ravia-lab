/** F3-A: renderer-independent mechanism timeline contract. */

import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificActorId } from "./scientific-actor.ts";
import type { ProvenanceSourceId, ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";

export const timelineSchemaVersion = "1" as const;
export type TimelineTime = number;
export type TimelineId = string;

export type TimelineReferenceContext = {
  actorIds: readonly ScientificActorId[];
  stateIds: readonly string[];
  interactionIds: readonly string[];
  topologyChangeIds: readonly string[];
  sourceIds: readonly ProvenanceSourceId[];
};

export function timelineContextFromScene(scene: ScientificSceneSpec): TimelineReferenceContext {
  return {
    actorIds: scene.actors.map((actor) => actor.actorId),
    stateIds: scene.states.map((state) => state.stateId),
    interactionIds: scene.topology.interactions.map((interaction) => interaction.interactionId),
    topologyChangeIds: (scene.topology.changes ?? []).map((change) => change.changeId),
    sourceIds: scene.fidelityProvenance.sources.map((source) => source.sourceId),
  };
}

export const mechanismStateKinds = ["before", "transition", "after", "intermediate"] as const;
export type MechanismStateKind = (typeof mechanismStateKinds)[number];

export type MechanismState = {
  mechanismStateId: string;
  scientificStateId: string;
  kind: MechanismStateKind;
  actorIds: ScientificActorId[];
  topologyChangeIds?: string[];
  label?: string;
};

export type TimelineFidelityReference = {
  fidelity: ScientificFidelityTier;
  sourceId: ProvenanceSourceId;
  note?: string;
};

export type Transition = {
  transitionId: string;
  fromMechanismStateId: string;
  toMechanismStateId: string;
  start: TimelineTime;
  end: TimelineTime;
  eventIds?: string[];
  fidelity?: TimelineFidelityReference;
};

export const timedEventKinds = [
  "bondFormed", "bondBroken", "actorCreated", "actorRemoved", "polymerGrew", "polymerShortened",
  "topologyChanged", "stateEntered", "stateExited",
] as const;
export type TimedEventKind = (typeof timedEventKinds)[number];

export type TimedEvent = {
  eventId: string;
  at: TimelineTime;
  duration?: TimelineTime;
  kind: TimedEventKind;
  actorIds: ScientificActorId[];
  interactionId?: string;
  topologyChangeId?: string;
  stateId?: string;
  amount?: number;
};

export const trackCategories = ["scientific", "continuous"] as const;
export type TrackCategory = (typeof trackCategories)[number];
export const trackChannels = [
  "coordinate", "morph", "conformation",
] as const;
export type TrackChannel = (typeof trackChannels)[number];
export const interpolationModes = ["step", "linear", "cubic", "discrete"] as const;
export type InterpolationMode = (typeof interpolationModes)[number];

export type CoordinateValue = { x: number; y: number; z: number };
export type MorphValue = { parameter: string; value: number };
export type ConformationValue = { parameter: string; value: number };
export type TimelineTrackValue =
  | { kind: "coordinate"; value: CoordinateValue }
  | { kind: "morph"; value: MorphValue }
  | { kind: "conformation"; value: ConformationValue };

export type TimelineKeyframe = {
  at: TimelineTime;
  interpolation: InterpolationMode;
  value: TimelineTrackValue;
};

export type Track = {
  trackId: string;
  category: TrackCategory;
  channel: TrackChannel;
  actorIds?: ScientificActorId[];
  interactionIds?: string[];
  keyframes: TimelineKeyframe[];
};

export const timelineConstraintKinds = ["orderedEvents", "requiresState", "noOverlap", "actorPersistence", "transitionBoundary"] as const;
export type TimelineConstraintKind = (typeof timelineConstraintKinds)[number];

export type TimelineConstraint = {
  constraintId: string;
  kind: TimelineConstraintKind;
  eventIds?: string[];
  stateIds?: string[];
  actorIds?: ScientificActorId[];
  beforeEventId?: string;
  afterEventId?: string;
};

export type Chapter = {
  chapterId: string;
  start: TimelineTime;
  end: TimelineTime;
  stateIds?: string[];
  transitionIds?: string[];
  eventIds?: string[];
};

export type TimelineClock = {
  duration: TimelineTime;
  unit: "seconds";
  timeStep?: number;
};

export type ScientificTimeline = {
  schemaVersion: typeof timelineSchemaVersion;
  timelineId: string;
  clock: TimelineClock;
  initialMechanismStateId: string;
  states: MechanismState[];
  transitions: Transition[];
  events: TimedEvent[];
  tracks: Track[];
  constraints?: TimelineConstraint[];
  chapters?: Chapter[];
};

export type ScientificTimelineValidationIssue = { path: string; message: string };
export type ScientificTimelineValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: ScientificTimelineValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const idPattern = /^[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const checkKeys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const keys = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!keys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
};
const uniqueIds = (values: unknown[], path: string, issue: (path: string, message: string) => void) => {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (typeof value !== "string" || !idPattern.test(value)) issue(`${path}[${index}]`, "must be a stable ID");
    if (seen.has(String(value))) issue(`${path}[${index}]`, "must be unique");
    seen.add(String(value));
  });
};

function validateTime(value: unknown, path: string, duration: number, issue: (path: string, message: string) => void) {
  if (!finite(value) || Number(value) < 0 || Number(value) > duration) issue(path, "must be finite and within timeline duration");
}

function validateVector(value: unknown, path: string, keys: readonly string[], issue: (path: string, message: string) => void) {
  if (!checkKeys(value, path, keys, issue)) return;
  const vector = value as UnknownRecord;
  keys.forEach((key) => { if (!finite(vector[key])) issue(`${path}.${key}`, "must be finite"); });
}

function validateTrackValue(value: unknown, path: string, channel: unknown, issue: (path: string, message: string) => void) {
  if (!isRecord(value) || typeof value.kind !== "string") { issue(path, "must contain a track value kind"); return; }
  if (value.kind !== channel) issue(`${path}.kind`, "must match track channel");
  switch (value.kind) {
    case "coordinate":
      if (checkKeys(value, path, ["kind", "value"], issue)) validateVector((value as UnknownRecord).value, `${path}.value`, ["x", "y", "z"], issue);
      break;
    case "morph":
    case "conformation": {
      if (!checkKeys(value, path, ["kind", "value"], issue) || !checkKeys(value.value, `${path}.value`, ["parameter", "value"], issue)) return;
      const payload = value.value as UnknownRecord;
      if (typeof payload.parameter !== "string" || payload.parameter.length === 0) issue(`${path}.value.parameter`, "must be non-empty");
      if (!finite(payload.value)) issue(`${path}.value.value`, "must be finite");
      break;
    }
    default:
      issue(`${path}.kind`, "is invalid");
  }
}

export function validateScientificTimeline(timeline: ScientificTimeline, context: TimelineReferenceContext): ScientificTimelineValidationResult {
  const issues: ScientificTimelineValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(timeline, "timeline", ["schemaVersion", "timelineId", "clock", "initialMechanismStateId", "states", "transitions", "events", "tracks", "constraints", "chapters"], issue)) return { valid: false, issues };
  const value = timeline as unknown as UnknownRecord;
  if (value.schemaVersion !== timelineSchemaVersion) issue("timeline.schemaVersion", "unknown timeline schema version");
  if (typeof value.timelineId !== "string" || !idPattern.test(value.timelineId)) issue("timeline.timelineId", "must be a stable ID");
  if (!checkKeys(value.clock, "timeline.clock", ["duration", "unit", "timeStep"], issue)) return { valid: false, issues };
  const clock = value.clock as UnknownRecord;
  if (!finite(clock.duration) || Number(clock.duration) <= 0) issue("timeline.clock.duration", "must be a positive finite duration");
  if (clock.unit !== "seconds") issue("timeline.clock.unit", "must be seconds");
  if (clock.timeStep !== undefined && (!finite(clock.timeStep) || Number(clock.timeStep) <= 0)) issue("timeline.clock.timeStep", "must be positive and finite");
  const duration = finite(clock.duration) ? clock.duration : 0;
  const actorIds = new Set(context.actorIds as readonly string[]);
  const stateIds = new Set(context.stateIds);
  const interactionIds = new Set(context.interactionIds);
  const changeIds = new Set(context.topologyChangeIds);
  const sourceIds = new Set<string>(context.sourceIds.map(String));
  const mechanismStates = Array.isArray(value.states) ? value.states : [];
  const mechanismStateIds = new Set<string>();
  if (!Array.isArray(value.states)) issue("timeline.states", "must be an array");
  mechanismStates.forEach((state, index) => {
    const path = `timeline.states[${index}]`;
    if (!checkKeys(state, path, ["mechanismStateId", "scientificStateId", "kind", "actorIds", "topologyChangeIds", "label"], issue)) return;
    const item = state as UnknownRecord;
    if (typeof item.mechanismStateId !== "string" || !idPattern.test(item.mechanismStateId)) issue(`${path}.mechanismStateId`, "must be a stable ID");
    if (mechanismStateIds.has(String(item.mechanismStateId))) issue(`${path}.mechanismStateId`, "must be unique");
    mechanismStateIds.add(String(item.mechanismStateId));
    if (typeof item.scientificStateId !== "string" || !stateIds.has(item.scientificStateId)) issue(`${path}.scientificStateId`, "must reference a scientific state");
    if (!mechanismStateKinds.includes(item.kind as MechanismStateKind)) issue(`${path}.kind`, "is invalid");
    if (!Array.isArray(item.actorIds) || item.actorIds.length === 0) issue(`${path}.actorIds`, "must contain actors");
    else item.actorIds.forEach((id, actorIndex) => { if (typeof id !== "string" || !actorIds.has(id)) issue(`${path}.actorIds[${actorIndex}]`, "must reference an actor"); });
    if (item.topologyChangeIds !== undefined && (!Array.isArray(item.topologyChangeIds) || item.topologyChangeIds.some((id) => !changeIds.has(String(id))))) issue(`${path}.topologyChangeIds`, "must reference topology changes");
  });
  if (typeof value.initialMechanismStateId !== "string" || !mechanismStateIds.has(String(value.initialMechanismStateId))) issue("timeline.initialMechanismStateId", "must reference a mechanism state");
  const transitions = Array.isArray(value.transitions) ? value.transitions : [];
  const transitionIds = new Set<string>();
  if (!Array.isArray(value.transitions)) issue("timeline.transitions", "must be an array");
  transitions.forEach((transition, index) => {
    const path = `timeline.transitions[${index}]`;
    if (!checkKeys(transition, path, ["transitionId", "fromMechanismStateId", "toMechanismStateId", "start", "end", "eventIds", "fidelity"], issue)) return;
    const item = transition as UnknownRecord;
    if (typeof item.transitionId !== "string" || !idPattern.test(item.transitionId)) issue(`${path}.transitionId`, "must be a stable ID");
    if (transitionIds.has(String(item.transitionId))) issue(`${path}.transitionId`, "must be unique");
    transitionIds.add(String(item.transitionId));
    if (!mechanismStateIds.has(String(item.fromMechanismStateId)) || !mechanismStateIds.has(String(item.toMechanismStateId))) issue(`${path}`, "must reference mechanism states");
    if (!finite(item.start) || !finite(item.end) || Number(item.start) >= Number(item.end)) issue(`${path}`, "must have start < end");
    validateTime(item.start, `${path}.start`, duration, issue); validateTime(item.end, `${path}.end`, duration, issue);
    if (item.eventIds !== undefined && (!Array.isArray(item.eventIds) || item.eventIds.some((id) => typeof id !== "string"))) issue(`${path}.eventIds`, "must contain event IDs");
    if (item.fidelity !== undefined) {
      if (!checkKeys(item.fidelity, `${path}.fidelity`, ["fidelity", "sourceId", "note"], issue)) return;
      const fidelity = item.fidelity as UnknownRecord;
      if (!["E0_DEPOSITED", "C0_COMPUTED", "S1_CONSTRAINED", "S2_SCHEMATIC", "O_OVERLAY"].includes(String(fidelity.fidelity))) issue(`${path}.fidelity.fidelity`, "must reference an F2-C fidelity tier");
      if (typeof fidelity.sourceId !== "string" || !sourceIds.has(fidelity.sourceId)) issue(`${path}.fidelity.sourceId`, "must reference an F2-C provenance source");
    }
  });
  const events = Array.isArray(value.events) ? value.events : [];
  const eventIds = new Set<string>();
  if (!Array.isArray(value.events)) issue("timeline.events", "must be an array");
  let previousEventTime = -Infinity;
  events.forEach((event, index) => {
    const path = `timeline.events[${index}]`;
    if (!checkKeys(event, path, ["eventId", "at", "duration", "kind", "actorIds", "interactionId", "topologyChangeId", "stateId", "amount"], issue)) return;
    const item = event as UnknownRecord;
    if (typeof item.eventId !== "string" || !idPattern.test(item.eventId)) issue(`${path}.eventId`, "must be a stable ID");
    if (eventIds.has(String(item.eventId))) issue(`${path}.eventId`, "must be unique");
    eventIds.add(String(item.eventId));
    if (!finite(item.at)) issue(`${path}.at`, "must be finite");
    validateTime(item.at, `${path}.at`, duration, issue);
    if (Number(item.at) < previousEventTime) issue(path, "events must be ordered by time");
    previousEventTime = Number(item.at);
    if (item.duration !== undefined && (!finite(item.duration) || Number(item.duration) < 0 || Number(item.at) + Number(item.duration) > duration)) issue(`${path}.duration`, "must fit within timeline duration");
    if (!timedEventKinds.includes(item.kind as TimedEventKind)) issue(`${path}.kind`, "is invalid");
    if (!Array.isArray(item.actorIds)) issue(`${path}.actorIds`, "must be an array");
    else item.actorIds.forEach((id, actorIndex) => { if (typeof id !== "string" || !actorIds.has(id)) issue(`${path}.actorIds[${actorIndex}]`, "must reference an actor"); });
    if (item.interactionId !== undefined && !interactionIds.has(String(item.interactionId))) issue(`${path}.interactionId`, "must reference an interaction");
    if (item.topologyChangeId !== undefined && !changeIds.has(String(item.topologyChangeId))) issue(`${path}.topologyChangeId`, "must reference a topology change");
    if (item.stateId !== undefined && !stateIds.has(String(item.stateId))) issue(`${path}.stateId`, "must reference a scientific state");
    if (["bondFormed", "bondBroken"].includes(String(item.kind)) && typeof item.interactionId !== "string") issue(`${path}.interactionId`, "is required for bond events");
    if (item.kind === "topologyChanged" && typeof item.topologyChangeId !== "string") issue(`${path}.topologyChangeId`, "is required for topology events");
    if (["polymerGrew", "polymerShortened"].includes(String(item.kind)) && (!finite(item.amount) || Number(item.amount) <= 0)) issue(`${path}.amount`, "must be positive for polymer events");
  });
  const tracks = Array.isArray(value.tracks) ? value.tracks : [];
  const trackIds = new Set<string>();
  if (!Array.isArray(value.tracks)) issue("timeline.tracks", "must be an array");
  tracks.forEach((track, index) => {
    const path = `timeline.tracks[${index}]`;
    if (!checkKeys(track, path, ["trackId", "category", "channel", "actorIds", "interactionIds", "keyframes"], issue)) return;
    const item = track as UnknownRecord;
    if (typeof item.trackId !== "string" || !idPattern.test(item.trackId)) issue(`${path}.trackId`, "must be a stable ID");
    if (trackIds.has(String(item.trackId))) issue(`${path}.trackId`, "must be unique");
    trackIds.add(String(item.trackId));
    if (!trackCategories.includes(item.category as TrackCategory)) issue(`${path}.category`, "is invalid");
    if (!trackChannels.includes(item.channel as TrackChannel)) issue(`${path}.channel`, "is invalid");
    if (item.actorIds !== undefined && (!Array.isArray(item.actorIds) || item.actorIds.some((id) => !actorIds.has(String(id))))) issue(`${path}.actorIds`, "must reference actors");
    if (item.interactionIds !== undefined && (!Array.isArray(item.interactionIds) || item.interactionIds.some((id) => !interactionIds.has(String(id))))) issue(`${path}.interactionIds`, "must reference interactions");
    if (!Array.isArray(item.keyframes) || item.keyframes.length === 0) { issue(`${path}.keyframes`, "must contain keyframes"); return; }
    let previous = -Infinity;
    item.keyframes.forEach((keyframe, keyIndex) => {
      const keyPath = `${path}.keyframes[${keyIndex}]`;
      if (!checkKeys(keyframe, keyPath, ["at", "interpolation", "value"], issue)) return;
      const key = keyframe as UnknownRecord;
      validateTime(key.at, `${keyPath}.at`, duration, issue);
      if (Number(key.at) < previous) issue(keyPath, "keyframes must be ordered by time");
      previous = Number(key.at);
      if (!interpolationModes.includes(key.interpolation as InterpolationMode)) issue(`${keyPath}.interpolation`, "is invalid");
      validateTrackValue(key.value, `${keyPath}.value`, item.channel, issue);
    });
  });
  const constraints = Array.isArray(value.constraints) ? value.constraints : [];
  if (value.constraints !== undefined && !Array.isArray(value.constraints)) issue("timeline.constraints", "must be an array");
  const constraintIds = new Set<string>();
  constraints.forEach((constraint, index) => {
    const path = `timeline.constraints[${index}]`;
    if (!checkKeys(constraint, path, ["constraintId", "kind", "eventIds", "stateIds", "actorIds", "beforeEventId", "afterEventId"], issue)) return;
    const item = constraint as UnknownRecord;
    if (typeof item.constraintId !== "string" || !idPattern.test(item.constraintId)) issue(`${path}.constraintId`, "must be a stable ID");
    if (constraintIds.has(String(item.constraintId))) issue(`${path}.constraintId`, "must be unique");
    constraintIds.add(String(item.constraintId));
    if (!timelineConstraintKinds.includes(item.kind as TimelineConstraintKind)) issue(`${path}.kind`, "is invalid");
    if (item.eventIds !== undefined && (!Array.isArray(item.eventIds) || item.eventIds.some((id) => !eventIds.has(String(id))))) issue(`${path}.eventIds`, "must reference events");
    if (item.stateIds !== undefined && (!Array.isArray(item.stateIds) || item.stateIds.some((id) => !stateIds.has(String(id))))) issue(`${path}.stateIds`, "must reference scientific states");
    if (item.actorIds !== undefined && (!Array.isArray(item.actorIds) || item.actorIds.some((id) => !actorIds.has(String(id))))) issue(`${path}.actorIds`, "must reference actors");
    if (item.beforeEventId !== undefined && !eventIds.has(String(item.beforeEventId))) issue(`${path}.beforeEventId`, "must reference an event");
    if (item.afterEventId !== undefined && !eventIds.has(String(item.afterEventId))) issue(`${path}.afterEventId`, "must reference an event");
  });
  const chapters = Array.isArray(value.chapters) ? value.chapters : [];
  if (value.chapters !== undefined && !Array.isArray(value.chapters)) issue("timeline.chapters", "must be an array");
  const chapterIds = new Set<string>();
  chapters.forEach((chapter, index) => {
    const path = `timeline.chapters[${index}]`;
    if (!checkKeys(chapter, path, ["chapterId", "start", "end", "stateIds", "transitionIds", "eventIds"], issue)) return;
    const item = chapter as UnknownRecord;
    if (typeof item.chapterId !== "string" || !idPattern.test(item.chapterId)) issue(`${path}.chapterId`, "must be a stable ID");
    if (chapterIds.has(String(item.chapterId))) issue(`${path}.chapterId`, "must be unique");
    chapterIds.add(String(item.chapterId));
    if (!finite(item.start) || !finite(item.end) || Number(item.start) >= Number(item.end)) issue(path, "must have start < end");
    validateTime(item.start, `${path}.start`, duration, issue); validateTime(item.end, `${path}.end`, duration, issue);
    if (item.stateIds !== undefined && (!Array.isArray(item.stateIds) || item.stateIds.some((id) => !stateIds.has(String(id))))) issue(`${path}.stateIds`, "must reference scientific states");
    if (item.transitionIds !== undefined && (!Array.isArray(item.transitionIds) || item.transitionIds.some((id) => !transitionIds.has(String(id))))) issue(`${path}.transitionIds`, "must reference transitions");
    if (item.eventIds !== undefined && (!Array.isArray(item.eventIds) || item.eventIds.some((id) => !eventIds.has(String(id))))) issue(`${path}.eventIds`, "must reference events");
  });
  transitions.forEach((transition, index) => {
    const item = transition as UnknownRecord;
    if (Array.isArray(item.eventIds)) item.eventIds.forEach((id, eventIndex) => { if (!eventIds.has(String(id))) issue(`timeline.transitions[${index}].eventIds[${eventIndex}]`, "must reference an event"); });
    if (Array.isArray(item.eventIds) && finite(item.start) && finite(item.end)) item.eventIds.forEach((id) => { const event = events.find((candidate) => isRecord(candidate) && candidate.eventId === id) as UnknownRecord | undefined; if (event && (Number(event.at) < Number(item.start) || Number(event.at) > Number(item.end))) issue(`timeline.transitions[${index}].eventIds`, "event must fall inside transition range"); });
  });
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}
