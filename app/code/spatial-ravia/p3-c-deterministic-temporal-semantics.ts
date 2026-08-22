/** P3-C: compiled deterministic semantics for the frozen ScientificTimeline v1. */

import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, validateScientificTimeline, type ScientificTimeline, type TimedEvent, type Track, type Transition } from "./scientific-timeline.ts";
import { evaluateScientificTimeline, type MechanismEvaluationResult } from "./p3-b-mechanism-state-kernel.ts";

export const temporalFailureCodes = [
  "TEMPORAL_DEPENDENCY_CYCLE",
  "TEMPORAL_DEPENDENCY_MISSING",
  "TEMPORAL_CONSTRAINT_VIOLATION",
  "TRANSITION_CONFLICT",
  "TRACK_KEYFRAME_CONFLICT",
  "TIMELINE_REFERENCE_INVALID",
  "UNSUPPORTED_TEMPORAL_SEMANTIC",
] as const;
export type TemporalFailureCode = (typeof temporalFailureCodes)[number];
export type TemporalCompilationFailure = Readonly<{ ok: false; code: TemporalFailureCode; reasons: readonly string[] }>;

export type DeterministicTemporalProgramV1 = Readonly<{
  schemaVersion: "1";
  scientificScene: ScientificSceneSpec;
  timeline: ScientificTimeline;
  eventOrder: readonly string[];
  eventPrecedence: Readonly<Record<string, number>>;
}>;

export type TemporalCompilationResult = Readonly<{ ok: true; program: DeterministicTemporalProgramV1 } | TemporalCompilationFailure>;

/** This is lifecycle safety ordering only; it does not assert chemistry or topology. */
export const eventKindPrecedence: Readonly<Record<TimedEvent["kind"], number>> = {
  stateExited: 10,
  actorRemoved: 20,
  bondBroken: 30,
  topologyChanged: 40,
  polymerShortened: 50,
  polymerGrew: 50,
  bondFormed: 60,
  actorCreated: 70,
  stateEntered: 80,
};

const fail = (code: TemporalFailureCode, ...reasons: string[]): TemporalCompilationFailure => ({ ok: false, code, reasons });
const eventComparator = (left: TimedEvent, right: TimedEvent) => left.at - right.at || eventKindPrecedence[left.kind] - eventKindPrecedence[right.kind] || left.eventId.localeCompare(right.eventId);
const transitionComparator = (left: Transition, right: Transition) => left.start - right.start || left.end - right.end || left.transitionId.localeCompare(right.transitionId);
const trackComparator = (left: Track, right: Track) => left.trackId.localeCompare(right.trackId);

function addEdge(graph: Map<string, Set<string>>, from: string, to: string) {
  if (from !== to) graph.get(from)!.add(to);
}

function dependencyEdges(timeline: ScientificTimeline): { graph: Map<string, Set<string>>; reasons: string[] } {
  const eventIds = new Set(timeline.events.map((event) => event.eventId));
  const graph = new Map([...eventIds].map((eventId) => [eventId, new Set<string>()]));
  const reasons: string[] = [];
  for (const constraint of timeline.constraints ?? []) {
    if (constraint.kind === "orderedEvents" && constraint.eventIds) {
      for (let index = 1; index < constraint.eventIds.length; index += 1) {
        const from = constraint.eventIds[index - 1]!;
        const to = constraint.eventIds[index]!;
        if (!eventIds.has(from) || !eventIds.has(to)) reasons.push(`orderedEvents references a missing event: ${from} -> ${to}`);
        else addEdge(graph, from, to);
      }
    }
    if (constraint.beforeEventId !== undefined || constraint.afterEventId !== undefined) {
      const from = constraint.beforeEventId;
      const to = constraint.afterEventId;
      if (!from || !to || !eventIds.has(from) || !eventIds.has(to)) reasons.push("before/after constraint references a missing event");
      else addEdge(graph, from, to);
    }
  }
  return { graph, reasons };
}

function validateDependencyTimes(timeline: ScientificTimeline, graph: Map<string, Set<string>>): string[] {
  const times = new Map(timeline.events.map((event) => [event.eventId, event.at]));
  const reasons: string[] = [];
  for (const [from, targets] of graph) for (const to of targets) if (times.get(from)! > times.get(to)!) reasons.push(`dependency ${from} -> ${to} reverses event time`);
  return reasons;
}

function topologicalEventOrder(timeline: ScientificTimeline, graph: Map<string, Set<string>>): { order?: string[]; cycle?: string[] } {
  const events = new Map(timeline.events.map((event) => [event.eventId, event]));
  const indegree = new Map([...events].map(([id]) => [id, 0]));
  for (const targets of graph.values()) for (const target of targets) indegree.set(target, indegree.get(target)! + 1);
  const ready = [...events.values()].filter((event) => indegree.get(event.eventId) === 0).sort(eventComparator);
  const order: string[] = [];
  while (ready.length > 0) {
    const event = ready.shift()!;
    order.push(event.eventId);
    for (const target of graph.get(event.eventId)!) {
      indegree.set(target, indegree.get(target)! - 1);
      if (indegree.get(target) === 0) ready.push(events.get(target)!);
    }
    ready.sort(eventComparator);
  }
  if (order.length !== events.size) return { cycle: [...events.keys()].filter((eventId) => !order.includes(eventId)).sort() };
  return { order };
}

function validateNoOverlap(timeline: ScientificTimeline): string[] {
  const reasons: string[] = [];
  for (const constraint of timeline.constraints ?? []) {
    if (constraint.kind !== "noOverlap" || !constraint.eventIds) continue;
    const events = constraint.eventIds.map((id) => timeline.events.find((event) => event.eventId === id)).filter((event): event is TimedEvent => Boolean(event));
    for (let left = 0; left < events.length; left += 1) for (let right = left + 1; right < events.length; right += 1) {
      const first = events[left]!; const second = events[right]!;
      const firstEnd = first.at + (first.duration ?? 0); const secondEnd = second.at + (second.duration ?? 0);
      if (first.duration !== undefined && second.duration !== undefined && first.at < secondEnd && second.at < firstEnd) reasons.push(`noOverlap constraint is violated by ${first.eventId} and ${second.eventId}`);
    }
  }
  return reasons;
}

function validateRepresentableConstraints(timeline: ScientificTimeline): string[] {
  const reasons: string[] = [];
  const events = new Map(timeline.events.map((event) => [event.eventId, event]));
  const boundaryTimes = new Set(timeline.transitions.flatMap((transition) => [transition.start, transition.end]));
  for (const constraint of timeline.constraints ?? []) {
    if (constraint.kind === "requiresState" && constraint.eventIds && constraint.stateIds) {
      for (const eventId of constraint.eventIds) {
        const event = events.get(eventId);
        if (event && (!event.stateId || !constraint.stateIds.includes(event.stateId))) reasons.push(`requiresState constraint ${constraint.constraintId} is not satisfied by ${eventId}`);
      }
    }
    if (constraint.kind === "actorPersistence" && constraint.actorIds) {
      for (const event of timeline.events) {
        if (event.kind === "actorRemoved" && event.actorIds.some((actorId) => constraint.actorIds!.includes(actorId))) reasons.push(`actorPersistence constraint ${constraint.constraintId} is violated by ${event.eventId}`);
      }
    }
    if (constraint.kind === "transitionBoundary" && constraint.eventIds) {
      for (const eventId of constraint.eventIds) {
        const event = events.get(eventId);
        if (event && !boundaryTimes.has(event.at)) reasons.push(`transitionBoundary constraint ${constraint.constraintId} is not satisfied by ${eventId}`);
      }
    }
  }
  return reasons;
}

function validateTransitionConflicts(timeline: ScientificTimeline): string[] {
  const reasons: string[] = [];
  for (let left = 0; left < timeline.transitions.length; left += 1) for (let right = left + 1; right < timeline.transitions.length; right += 1) {
    const first = timeline.transitions[left]!; const second = timeline.transitions[right]!;
    const overlaps = first.start < second.end && second.start < first.end;
    if (overlaps && first.fromMechanismStateId === second.fromMechanismStateId && first.toMechanismStateId !== second.toMechanismStateId) reasons.push(`overlapping transitions ${first.transitionId} and ${second.transitionId} have conflicting targets`);
    if (overlaps && first.eventIds?.some((eventId) => second.eventIds?.includes(eventId))) reasons.push(`overlapping transitions duplicate event reference ${first.transitionId}/${second.transitionId}`);
  }
  return reasons;
}

function canonicalizeTracks(tracks: readonly Track[]): TemporalCompilationFailure | Track[] {
  const canonical: Track[] = [];
  for (const track of tracks) {
    const keyframes = [...track.keyframes].sort((left, right) => left.at - right.at);
    for (let index = 1; index < keyframes.length; index += 1) if (keyframes[index - 1]!.at === keyframes[index]!.at) return fail("TRACK_KEYFRAME_CONFLICT", `track ${track.trackId} has duplicate keyframe time ${keyframes[index]!.at}`);
    canonical.push({ ...track, actorIds: track.actorIds ? [...track.actorIds].sort() : undefined, interactionIds: track.interactionIds ? [...track.interactionIds].sort() : undefined, keyframes });
  }
  return canonical.sort(trackComparator);
}

export function compileDeterministicTemporalProgram(scientificScene: ScientificSceneSpec, timeline: ScientificTimeline): TemporalCompilationResult {
  const sceneResult = validateScientificSceneSpec(scientificScene);
  if (!sceneResult.valid) return fail("TIMELINE_REFERENCE_INVALID", ...sceneResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  const prevalidatedDependencies = dependencyEdges(timeline);
  if (prevalidatedDependencies.reasons.length > 0) return fail("TEMPORAL_DEPENDENCY_MISSING", ...prevalidatedDependencies.reasons);
  const validationTimeline: ScientificTimeline = {
    ...timeline,
    events: [...timeline.events].sort(eventComparator),
    tracks: timeline.tracks.map((track) => ({ ...track, keyframes: [...track.keyframes].sort((left, right) => left.at - right.at) })),
  };
  const timelineResult = validateScientificTimeline(validationTimeline, timelineContextFromScene(scientificScene));
  if (!timelineResult.valid) return fail("TIMELINE_REFERENCE_INVALID", ...timelineResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  const { graph } = prevalidatedDependencies;
  const timeReasons = validateDependencyTimes(timeline, graph);
  if (timeReasons.length > 0) return fail("TEMPORAL_CONSTRAINT_VIOLATION", ...timeReasons);
  const noOverlapReasons = validateNoOverlap(timeline);
  if (noOverlapReasons.length > 0) return fail("TEMPORAL_CONSTRAINT_VIOLATION", ...noOverlapReasons);
  const constraintReasons = validateRepresentableConstraints(timeline);
  if (constraintReasons.length > 0) return fail("TEMPORAL_CONSTRAINT_VIOLATION", ...constraintReasons);
  const conflictReasons = validateTransitionConflicts(timeline);
  if (conflictReasons.length > 0) return fail("TRANSITION_CONFLICT", ...conflictReasons);
  const topo = topologicalEventOrder(timeline, graph);
  if (topo.cycle) return fail("TEMPORAL_DEPENDENCY_CYCLE", `event dependency cycle: ${topo.cycle.join(", ")}`);
  const tracks = canonicalizeTracks(timeline.tracks);
  if (!Array.isArray(tracks)) return tracks;
  const canonicalTimeline: ScientificTimeline = {
    ...timeline,
    events: [...timeline.events].sort(eventComparator),
    transitions: [...timeline.transitions].sort(transitionComparator),
    tracks,
    constraints: timeline.constraints ? [...timeline.constraints].sort((left, right) => left.constraintId.localeCompare(right.constraintId)) : undefined,
  };
  const eventPrecedence = Object.fromEntries(canonicalTimeline.events.map((event) => [event.eventId, eventKindPrecedence[event.kind]]));
  return { ok: true, program: { schemaVersion: "1", scientificScene, timeline: canonicalTimeline, eventOrder: topo.order!, eventPrecedence } };
}

export function evaluateDeterministicTemporalProgram(program: DeterministicTemporalProgramV1, timeSeconds: number): MechanismEvaluationResult {
  return evaluateScientificTimeline({ scientificScene: program.scientificScene, timeline: program.timeline, timeSeconds, eventOrder: program.eventOrder });
}
