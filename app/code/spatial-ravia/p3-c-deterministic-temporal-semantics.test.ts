import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { compileDeterministicTemporalProgram, evaluateDeterministicTemporalProgram } from "./p3-c-deterministic-temporal-semantics.ts";

const scene = scientificSceneSpecFixtures.hairpin;
const actors = scene.actors.map((actor) => actor.actorId);
const state = { mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before" as const, actorIds: actors };

function timeline(events: ScientificTimeline["events"], constraints: ScientificTimeline["constraints"] = [], transitions: ScientificTimeline["transitions"] = [], tracks: ScientificTimeline["tracks"] = [], extraStates: ScientificTimeline["states"] = []): ScientificTimeline {
  return { schemaVersion: "1", timelineId: "p3-c-test", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "folded", states: [state, ...extraStates], transitions, events, tracks, constraints };
}

function separationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  return {
    ...base,
    states: [
      { stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] },
      { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] },
    ],
    topology: { ...base.topology, changes: [{ changeId: "change-separation", kind: "separation", actorIds: strands, interactionIds: ["opened-pair-1"] }] },
  };
}

function compile(input: ScientificTimeline) {
  const result = compileDeterministicTemporalProgram(scene, input);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("temporal compilation failed");
  return result.program;
}

test("P3-C gives independent same-time events a class-plus-ID total order", () => {
  const input = timeline([
    { eventId: "z-state-entry", at: 1, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
    { eventId: "a-state-exit", at: 1, kind: "stateExited", actorIds: actors, stateId: "hairpin-folded" },
  ]);
  const program = compile(input);
  assert.deepEqual(program.eventOrder, ["a-state-exit", "z-state-entry"]);
});

test("P3-C gives same-time dependencies priority over lexical order and ignores source array order", () => {
  const events: ScientificTimeline["events"] = [
    { eventId: "a-after", at: 1, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
    { eventId: "z-before", at: 1, kind: "stateExited", actorIds: actors, stateId: "hairpin-folded" },
  ];
  const constraints: ScientificTimeline["constraints"] = [{ constraintId: "dependency", kind: "orderedEvents", eventIds: ["z-before", "a-after"] }];
  const first = compile(timeline(events, constraints));
  const reversed = compile(timeline([...events].reverse(), constraints));
  assert.deepEqual(first.eventOrder, ["z-before", "a-after"]);
  assert.deepEqual(first.eventOrder, reversed.eventOrder);
  const at = evaluateDeterministicTemporalProgram(first, 1);
  const atReversed = evaluateDeterministicTemporalProgram(reversed, 1);
  assert.deepEqual(at, atReversed);
});

test("P3-C rejects missing dependencies and dependency cycles", () => {
  const missing = timeline([], [{ constraintId: "missing", kind: "orderedEvents", eventIds: ["missing-a", "missing-b"] }]);
  const missingResult = compileDeterministicTemporalProgram(scene, missing);
  assert.equal(missingResult.ok, false);
  if (!missingResult.ok) assert.equal(missingResult.code, "TEMPORAL_DEPENDENCY_MISSING");
  const cycle = timeline([
    { eventId: "event-a", at: 1, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
    { eventId: "event-b", at: 1, kind: "stateExited", actorIds: actors, stateId: "hairpin-folded" },
  ], [
    { constraintId: "a-before-b", kind: "orderedEvents", beforeEventId: "event-a", afterEventId: "event-b" },
    { constraintId: "b-before-a", kind: "orderedEvents", beforeEventId: "event-b", afterEventId: "event-a" },
  ]);
  const cycleResult = compileDeterministicTemporalProgram(scene, cycle);
  assert.equal(cycleResult.ok, false);
  if (!cycleResult.ok) assert.equal(cycleResult.code, "TEMPORAL_DEPENDENCY_CYCLE");
});

test("P3-C rejects impossible dependency times, transition conflicts, and zero-duration transitions", () => {
  const events: ScientificTimeline["events"] = [
    { eventId: "early", at: 0.5, kind: "stateExited", actorIds: actors, stateId: "hairpin-folded" },
    { eventId: "late", at: 1.5, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
  ];
  const impossible = timeline(events, [{ constraintId: "impossible", kind: "orderedEvents", beforeEventId: "late", afterEventId: "early" }]);
  const impossibleResult = compileDeterministicTemporalProgram(scene, impossible);
  assert.equal(impossibleResult.ok, false);
  if (!impossibleResult.ok) assert.equal(impossibleResult.code, "TEMPORAL_CONSTRAINT_VIOLATION");
  const conflict = timeline([], [], [
    { transitionId: "target-a", fromMechanismStateId: "folded", toMechanismStateId: "folded", start: 0, end: 1 },
    { transitionId: "target-b", fromMechanismStateId: "folded", toMechanismStateId: "other", start: 0.5, end: 1.5 },
  ], [], [{ mechanismStateId: "other", scientificStateId: "hairpin-folded", kind: "after", actorIds: actors }]);
  const conflictResult = compileDeterministicTemporalProgram(scene, conflict);
  assert.equal(conflictResult.ok, false);
  if (!conflictResult.ok) assert.equal(conflictResult.code, "TRANSITION_CONFLICT");
  const zero = timeline([], [], [{ transitionId: "zero", fromMechanismStateId: "folded", toMechanismStateId: "folded", start: 1, end: 1 }]);
  const zeroResult = compileDeterministicTemporalProgram(scene, zero);
  assert.equal(zeroResult.ok, false);
  if (!zeroResult.ok) assert.equal(zeroResult.code, "TIMELINE_REFERENCE_INVALID");
});

test("P3-C rejects duplicate keyframe times and preserves track composition", () => {
  const track: ScientificTimeline["tracks"][number] = { trackId: "track", category: "continuous", channel: "coordinate", actorIds: [actors[0]!], keyframes: [
    { at: 0, interpolation: "linear", value: { kind: "coordinate", value: { x: 0, y: 0, z: 0 } } },
    { at: 1, interpolation: "linear", value: { kind: "coordinate", value: { x: 1, y: 0, z: 0 } } },
  ] };
  const program = compile(timeline([{ eventId: "event", at: 1, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" }], [], [], [track]));
  const result = evaluateDeterministicTemporalProgram(program, 1);
  assert.equal(result.ok, true);
  const duplicate = { ...track, keyframes: [...track.keyframes, { ...track.keyframes[1]! }] };
  const duplicateResult = compileDeterministicTemporalProgram(scene, timeline([], [], [], [duplicate]));
  assert.equal(duplicateResult.ok, false);
  if (!duplicateResult.ok) assert.equal(duplicateResult.code, "TRACK_KEYFRAME_CONFLICT");
});

test("P3-C evaluates representable persistence, state, and transition-boundary constraints", () => {
  const valid = timeline([
    { eventId: "enter", at: 1, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
  ], [
    { constraintId: "state-required", kind: "requiresState", eventIds: ["enter"], stateIds: ["hairpin-folded"] },
    { constraintId: "boundary", kind: "transitionBoundary", eventIds: ["enter"] },
    { constraintId: "persistent", kind: "actorPersistence", actorIds: actors },
  ], [{ transitionId: "boundary-transition", fromMechanismStateId: "folded", toMechanismStateId: "folded", start: 0, end: 1 }]);
  assert.equal(compileDeterministicTemporalProgram(scene, valid).ok, true);
  const removed = timeline([{ eventId: "remove", at: 1, kind: "actorRemoved", actorIds: [actors[0]!] }], [{ constraintId: "persistent", kind: "actorPersistence", actorIds: [actors[0]!] }]);
  const removedResult = compileDeterministicTemporalProgram(scene, removed);
  assert.equal(removedResult.ok, false);
  if (!removedResult.ok) assert.equal(removedResult.code, "TEMPORAL_CONSTRAINT_VIOLATION");
});

test("P3-C keeps dense/sparse sampling, backward seek, and exact-frame evaluation equivalent", () => {
  const program = compile(timeline([
    { eventId: "event-04", at: 0.4, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
    { eventId: "event-05", at: 0.5, kind: "stateExited", actorIds: actors, stateId: "hairpin-folded" },
    { eventId: "event-06", at: 0.6, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" },
  ]));
  const dense = evaluateDeterministicTemporalProgram(program, 0.9);
  for (const time of [0, 0.4, 0.5, 0.6, 0.9, 1, 2]) evaluateDeterministicTemporalProgram(program, time);
  const sparse = evaluateDeterministicTemporalProgram(program, 0.9);
  assert.deepEqual(dense, sparse);
  const late = evaluateDeterministicTemporalProgram(program, 2);
  const backward = evaluateDeterministicTemporalProgram(program, 0.2);
  const direct = evaluateDeterministicTemporalProgram(program, 0.2);
  assert.deepEqual(backward, direct);
  assert.equal(late.ok && backward.ok && late.snapshot.appliedEventIds.length > backward.snapshot.appliedEventIds.length, true);
  for (const fps of [30, 60, 120]) {
    const atFrame = evaluateDeterministicTemporalProgram(program, 30 / fps);
    const directFrame = evaluateDeterministicTemporalProgram(program, 30 / fps);
    assert.deepEqual(atFrame, directFrame);
  }
});

test("P3-C compilation and evaluation do not mutate timeline or scene inputs", () => {
  const input = timeline([{ eventId: "event", at: 1, kind: "stateEntered", actorIds: actors, stateId: "hairpin-folded" }]);
  const sceneBefore = JSON.stringify(scene);
  const timelineBefore = JSON.stringify(input);
  const program = compile(input);
  evaluateDeterministicTemporalProgram(program, 1);
  assert.equal(JSON.stringify(scene), sceneBefore);
  assert.equal(JSON.stringify(input), timelineBefore);
});

test("P3-C preserves grounded DNA opening and separation order at arbitrary seeks", () => {
  const dnaScene = separationScene();
  const strands = dnaScene.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  const input: ScientificTimeline = {
    schemaVersion: "1", timelineId: "dna-separation-p3-c", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "before",
    states: [
      { mechanismStateId: "before", scientificStateId: "closed", kind: "before", actorIds: strands },
      { mechanismStateId: "after", scientificStateId: "open", kind: "after", actorIds: strands, topologyChangeIds: ["change-separation"] },
    ],
    transitions: [{ transitionId: "opening", fromMechanismStateId: "before", toMechanismStateId: "after", start: 0.5, end: 1.5 }],
    events: [{ eventId: "separation", at: 1.5, kind: "topologyChanged", actorIds: strands, topologyChangeId: "change-separation" }], tracks: [],
  };
  const programResult = compileDeterministicTemporalProgram(dnaScene, input);
  assert.equal(programResult.ok, true);
  if (!programResult.ok) throw new Error("DNA temporal compilation failed");
  const at = (timeSeconds: number) => evaluateDeterministicTemporalProgram(programResult.program, timeSeconds);
  const before = at(0.49); const during = at(0.5); const exact = at(1.5); const backward = at(0.49);
  assert.equal(before.ok && before.snapshot.groundedTopology.appliedTopologyChangeIds.length, 0);
  assert.equal(during.ok && during.snapshot.transitions[0]?.status, "active");
  assert.equal(exact.ok && exact.snapshot.groundedTopology.appliedTopologyChangeIds[0], "change-separation");
  assert.deepEqual(backward, before);
});

test("P3-C orders grounded RNA cleavage before shortening and supports backward seek", () => {
  const rnaScene = scientificSceneSpecFixtures.cleavage;
  const actors = rnaScene.actors.map((actor) => actor.actorId);
  const input: ScientificTimeline = {
    schemaVersion: "1", timelineId: "rna-cleavage-shortening-p3-c", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "intact",
    states: [
      { mechanismStateId: "intact", scientificStateId: "rna-cleaved", kind: "before", actorIds: actors },
      { mechanismStateId: "cleaved", scientificStateId: "rna-cleaved", kind: "intermediate", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] },
      { mechanismStateId: "shortened", scientificStateId: "rna-cleaved", kind: "after", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] },
    ],
    transitions: [
      { transitionId: "cleavage-transition", fromMechanismStateId: "intact", toMechanismStateId: "cleaved", start: 0.25, end: 0.5 },
      { transitionId: "shortening-transition", fromMechanismStateId: "cleaved", toMechanismStateId: "shortened", start: 0.8, end: 1.2 },
    ],
    events: [
      { eventId: "cleavage", at: 0.5, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-rna-cleavage" },
      { eventId: "shortening", at: 1.2, kind: "polymerShortened", actorIds: actors, topologyChangeId: "change-rna-cleavage", amount: 1 },
    ], tracks: [], constraints: [{ constraintId: "cleavage-before-shortening", kind: "orderedEvents", eventIds: ["cleavage", "shortening"] }],
  };
  const programResult = compileDeterministicTemporalProgram(rnaScene, input);
  assert.equal(programResult.ok, true);
  if (!programResult.ok) throw new Error("RNA temporal compilation failed");
  const at = (timeSeconds: number) => evaluateDeterministicTemporalProgram(programResult.program, timeSeconds);
  const before = at(0.49); const atCleavage = at(0.5); const between = at(0.9); const atShortening = at(1.2); const after = at(1.3);
  assert.equal(before.ok && before.snapshot.appliedEventIds.length, 0);
  assert.deepEqual(atCleavage.ok && atCleavage.snapshot.appliedEventIds, ["cleavage"]);
  assert.deepEqual(between.ok && between.snapshot.appliedEventIds, ["cleavage"]);
  assert.deepEqual(atShortening.ok && atShortening.snapshot.appliedEventIds, ["cleavage", "shortening"]);
  assert.deepEqual(after.ok && after.snapshot.appliedEventIds, ["cleavage", "shortening"]);
  assert.deepEqual(at(0.49), before);
});
