/** P3-B: canonical seconds-based, renderer-independent mechanism evaluation. */

import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import {
  timelineContextFromScene,
  validateScientificTimeline,
  type ScientificTimeline,
  type TimelineKeyframe,
  type TimelineTrackValue,
  type Track,
} from "./scientific-timeline.ts";

export const mechanismSnapshotSchemaVersion = "1" as const;
export const mechanismEvaluationFailureCodes = [
  "TIMELINE_INVALID",
  "SCIENTIFIC_REFERENCE_MISSING",
  "TIME_OUT_OF_RANGE",
  "TRACK_INVALID",
  "UNSUPPORTED_TIMELINE_FEATURE",
] as const;
export type MechanismEvaluationFailureCode = (typeof mechanismEvaluationFailureCodes)[number];

export type MechanismTime = number;

export type MechanismTransitionStatus = "pending" | "active" | "completed";
export type EvaluatedTransition = Readonly<{
  transitionId: string;
  fromMechanismStateId: string;
  toMechanismStateId: string;
  status: MechanismTransitionStatus;
  progress: number;
}>;

export type EvaluatedEvent = Readonly<{
  eventId: string;
  at: number;
  status: "pending" | "applied";
  order: number;
}>;

export type EvaluatedTrack = Readonly<{
  trackId: string;
  category: Track["category"];
  channel: Track["channel"];
  actorIds: readonly string[];
  interactionIds: readonly string[];
  normalizedProgress: number;
  value: TimelineTrackValue;
}>;

export type MechanismSnapshotV1 = Readonly<{
  schemaVersion: typeof mechanismSnapshotSchemaVersion;
  timelineId: string;
  timelineSchemaVersion: ScientificTimeline["schemaVersion"];
  timeSeconds: number;
  durationSeconds: number;
  activeMechanismStateIds: readonly string[];
  activeScientificStateIds: readonly string[];
  actorStateReferences: readonly Readonly<{ actorId: string; mechanismStateIds: readonly string[]; scientificStateIds: readonly string[] }>[];
  transitions: readonly EvaluatedTransition[];
  events: readonly EvaluatedEvent[];
  appliedEventIds: readonly string[];
  pendingEventIds: readonly string[];
  groundedTopology: Readonly<{
    interactionIds: readonly string[];
    continuityIds: readonly string[];
    topologyChangeIds: readonly string[];
    appliedTopologyChangeIds: readonly string[];
    status: "grounded";
  }>;
  tracks: readonly EvaluatedTrack[];
  fidelityReferences: readonly Readonly<{ transitionId: string; fidelity: string; sourceId: string }>[];
}>;

export type MechanismEvaluationFailure = Readonly<{
  ok: false;
  code: MechanismEvaluationFailureCode;
  reasons: readonly string[];
}>;
export type MechanismEvaluationResult = Readonly<
  | { ok: true; snapshot: MechanismSnapshotV1 }
  | MechanismEvaluationFailure
>;

export type EvaluateScientificTimelineInput = Readonly<{
  scientificScene: ScientificSceneSpec;
  timeline: ScientificTimeline;
  timeSeconds: number;
  /** Internal P3-C canonical event order; absent means derive the stable base order. */
  eventOrder?: readonly string[];
}>;

export type PlaybackCursorV1 = Readonly<{
  schemaVersion: "1";
  timelineId: string;
  timeSeconds: number;
  rate: number;
  playing: boolean;
}>;

const fail = (code: MechanismEvaluationFailureCode, ...reasons: string[]): MechanismEvaluationFailure => ({ ok: false, code, reasons });
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const isFailure = (value: EvaluatedTrack | MechanismEvaluationFailure): value is MechanismEvaluationFailure => "ok" in value && value.ok === false;

export function normalizeMechanismTime(timeSeconds: number, durationSeconds: number): number {
  if (!finite(timeSeconds) || !finite(durationSeconds) || durationSeconds <= 0) return Number.NaN;
  return timeSeconds / durationSeconds;
}

export function clampMechanismTime(timeSeconds: number, durationSeconds: number): number {
  if (!finite(timeSeconds) || !finite(durationSeconds) || durationSeconds <= 0) return Number.NaN;
  return Math.min(Math.max(timeSeconds, 0), durationSeconds);
}

/** Boundary policy: start is active, end is completed, and the timeline end is valid. */
export function compareMechanismTime(left: number, right: number): -1 | 0 | 1 {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validateInput(input: EvaluateScientificTimelineInput): MechanismEvaluationFailure | null {
  const sceneResult = validateScientificSceneSpec(input.scientificScene);
  if (!sceneResult.valid) return fail("SCIENTIFIC_REFERENCE_MISSING", ...sceneResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  const timelineResult = validateScientificTimeline(input.timeline, timelineContextFromScene(input.scientificScene));
  if (!timelineResult.valid) return fail("TIMELINE_INVALID", ...timelineResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  if (!finite(input.timeSeconds) || input.timeSeconds < 0 || input.timeSeconds > input.timeline.clock.duration) return fail("TIME_OUT_OF_RANGE", `timeSeconds must be within [0, ${input.timeline.clock.duration}]`);
  return null;
}

function orderedEvents(timeline: ScientificTimeline, eventOrder?: readonly string[]) {
  const order = eventOrder ? new Map(eventOrder.map((eventId, index) => [eventId, index])) : undefined;
  return timeline.events.map((event, index) => ({ event, index })).sort((left, right) => order
    ? (order.get(left.event.eventId)! - order.get(right.event.eventId)!)
    : left.event.at - right.event.at || left.event.eventId.localeCompare(right.event.eventId) || left.index - right.index);
}

function transitionStatus(start: number, end: number, time: number): MechanismTransitionStatus {
  if (time < start) return "pending";
  if (time < end) return "active";
  return "completed";
}

function transitionProgress(start: number, end: number, time: number): number {
  if (time <= start) return 0;
  if (time >= end) return 1;
  return (time - start) / (end - start);
}

function numericValue(value: TimelineTrackValue): number | null {
  return value.kind === "coordinate" ? null : value.value.value;
}

function sameTrackShape(left: TimelineTrackValue, right: TimelineTrackValue): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "coordinate" && right.kind === "coordinate") return true;
  return "parameter" in left.value && "parameter" in right.value && left.value.parameter === right.value.parameter;
}

function interpolateValue(left: TimelineTrackValue, right: TimelineTrackValue, progress: number): TimelineTrackValue | null {
  if (!sameTrackShape(left, right)) return null;
  if (left.kind === "coordinate" && right.kind === "coordinate") {
    return { kind: "coordinate", value: { x: left.value.x + (right.value.x - left.value.x) * progress, y: left.value.y + (right.value.y - left.value.y) * progress, z: left.value.z + (right.value.z - left.value.z) * progress } };
  }
  if (!("parameter" in left.value) || !("parameter" in right.value)) return null;
  const parameter = left.value.parameter;
  const leftNumber = numericValue(left);
  const rightNumber = numericValue(right);
  if (leftNumber === null || rightNumber === null) return null;
  return { kind: left.kind, value: { parameter, value: leftNumber + (rightNumber - leftNumber) * progress } } as TimelineTrackValue;
}

function cubicProgress(keyframes: readonly TimelineKeyframe[], index: number, progress: number): number {
  const p0 = keyframes[Math.max(index - 1, 0)]!.value;
  const p1 = keyframes[index]!.value;
  const p2 = keyframes[index + 1]!.value;
  const p3 = keyframes[Math.min(index + 2, keyframes.length - 1)]!.value;
  const values = [numericValue(p0), numericValue(p1), numericValue(p2), numericValue(p3)];
  if (values.some((value) => value === null)) return progress;
  const [a, b, c, d] = values as number[];
  return clamp01(0.5 * ((2 * b) + (-a + c) * progress + (2 * a - 5 * b + 4 * c - d) * progress ** 2 + (-a + 3 * b - 3 * c + d) * progress ** 3));
}

function evaluateTrack(track: Track, time: number): EvaluatedTrack | MechanismEvaluationFailure {
  const keyframes = track.keyframes;
  let rightIndex = keyframes.findIndex((keyframe) => keyframe.at > time);
  if (rightIndex < 0) rightIndex = keyframes.length - 1;
  const leftIndex = rightIndex === 0 ? 0 : rightIndex - 1;
  const left = keyframes[leftIndex]!;
  const right = keyframes[rightIndex]!;
  const span = right.at - left.at;
  const progress = span <= 0 ? 0 : clamp01((time - left.at) / span);
  const effectiveProgress = rightIndex === leftIndex ? 1 : track.keyframes[leftIndex]!.interpolation === "step" || track.keyframes[leftIndex]!.interpolation === "discrete" ? (time >= right.at ? 1 : 0) : track.keyframes[leftIndex]!.interpolation === "cubic" ? cubicProgress(keyframes, leftIndex, progress) : progress;
  const value = interpolateValue(left.value, right.value, effectiveProgress);
  if (!value) return fail("TRACK_INVALID", `track ${track.trackId} has incompatible keyframe values`);
  return { trackId: track.trackId, category: track.category, channel: track.channel, actorIds: track.actorIds ?? [], interactionIds: track.interactionIds ?? [], normalizedProgress: effectiveProgress, value };
}

export function evaluateScientificTimeline(input: EvaluateScientificTimelineInput): MechanismEvaluationResult {
  const invalid = validateInput(input);
  if (invalid) return invalid;
  const { scientificScene, timeline, timeSeconds } = input;
  const orderedTransitions = timeline.transitions;
  const transitions = orderedTransitions.map((transition) => ({ transitionId: transition.transitionId, fromMechanismStateId: transition.fromMechanismStateId, toMechanismStateId: transition.toMechanismStateId, status: transitionStatus(transition.start, transition.end, timeSeconds), progress: transitionProgress(transition.start, transition.end, timeSeconds) }));
  const eventEntries = orderedEvents(timeline, input.eventOrder);
  const events = eventEntries.map(({ event }, order) => ({ eventId: event.eventId, at: event.at, status: event.at <= timeSeconds ? "applied" as const : "pending" as const, order }));
  const appliedEventIds = events.filter((event) => event.status === "applied").map((event) => event.eventId);
  const pendingEventIds = events.filter((event) => event.status === "pending").map((event) => event.eventId);
  const activeMechanismStateIds = new Set<string>([timeline.initialMechanismStateId]);
  for (const transition of transitions) {
    if (transition.status === "completed") { activeMechanismStateIds.delete(transition.fromMechanismStateId); activeMechanismStateIds.add(transition.toMechanismStateId); }
    else if (transition.status === "active") { activeMechanismStateIds.add(transition.fromMechanismStateId); activeMechanismStateIds.add(transition.toMechanismStateId); }
  }
  const mechanismStates = new Map(timeline.states.map((state) => [state.mechanismStateId, state]));
  const activeScientificStateIds = [...activeMechanismStateIds].map((id) => mechanismStates.get(id)?.scientificStateId).filter((id): id is string => Boolean(id));
  const actorStateReferences = scientificScene.actors.map((actor) => ({ actorId: actor.actorId, mechanismStateIds: [...activeMechanismStateIds].filter((mechanismStateId) => mechanismStates.get(mechanismStateId)?.actorIds.includes(actor.actorId)), scientificStateIds: activeScientificStateIds.filter((stateId) => scientificScene.states.find((state) => state.stateId === stateId)?.actorIds.includes(actor.actorId)) }));
  const tracks: EvaluatedTrack[] = [];
  for (const track of timeline.tracks) { const result = evaluateTrack(track, timeSeconds); if (isFailure(result)) return result; tracks.push(result); }
  const appliedTopologyChangeIds = timeline.events.filter((event) => event.at <= timeSeconds && event.topologyChangeId).map((event) => event.topologyChangeId!).filter((id, index, all) => all.indexOf(id) === index);
  return { ok: true, snapshot: { schemaVersion: mechanismSnapshotSchemaVersion, timelineId: timeline.timelineId, timelineSchemaVersion: timeline.schemaVersion, timeSeconds, durationSeconds: timeline.clock.duration, activeMechanismStateIds: [...activeMechanismStateIds], activeScientificStateIds: [...new Set(activeScientificStateIds)], actorStateReferences, transitions, events, appliedEventIds, pendingEventIds, groundedTopology: { interactionIds: scientificScene.topology.interactions.map((item) => item.interactionId), continuityIds: scientificScene.topology.continuities?.map((item) => item.continuityId) ?? [], topologyChangeIds: scientificScene.topology.changes?.map((item) => item.changeId) ?? [], appliedTopologyChangeIds, status: "grounded" }, tracks, fidelityReferences: timeline.transitions.flatMap((transition) => transition.fidelity ? [{ transitionId: transition.transitionId, fidelity: transition.fidelity.fidelity, sourceId: transition.fidelity.sourceId }] : []) } };
}

export function createPlaybackCursor(timelineId: string, timeSeconds = 0, rate = 1, playing = false): PlaybackCursorV1 {
  if (!finite(timeSeconds) || timeSeconds < 0 || !finite(rate) || rate < 0) throw new Error("Invalid playback cursor");
  return { schemaVersion: "1", timelineId, timeSeconds, rate, playing };
}

export function advancePlaybackCursor(cursor: PlaybackCursorV1, deltaSeconds: number, durationSeconds: number): PlaybackCursorV1 {
  if (!finite(deltaSeconds) || deltaSeconds < 0 || !finite(durationSeconds) || durationSeconds <= 0) throw new Error("Invalid playback advance");
  return { ...cursor, timeSeconds: clampMechanismTime(cursor.playing ? cursor.timeSeconds + deltaSeconds * cursor.rate : cursor.timeSeconds, durationSeconds), playing: cursor.playing && cursor.timeSeconds + deltaSeconds * cursor.rate < durationSeconds };
}

export function serializePlaybackCursor(cursor: PlaybackCursorV1): string { return JSON.stringify(cursor); }

export function deserializePlaybackCursor(serialized: string): PlaybackCursorV1 {
  const value = JSON.parse(serialized) as PlaybackCursorV1;
  if (value.schemaVersion !== "1" || typeof value.timelineId !== "string" || !finite(value.timeSeconds) || !finite(value.rate) || value.timeSeconds < 0 || value.rate < 0 || typeof value.playing !== "boolean") throw new Error("Invalid serialized playback cursor");
  return value;
}
