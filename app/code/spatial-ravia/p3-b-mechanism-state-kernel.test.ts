import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import {
  advancePlaybackCursor,
  createPlaybackCursor,
  deserializePlaybackCursor,
  evaluateScientificTimeline,
  serializePlaybackCursor,
} from "./p3-b-mechanism-state-kernel.ts";

function timelineFor(scene: ScientificSceneSpec, timelineId: string, initialMechanismStateId: string, states: ScientificTimeline["states"], transitions: ScientificTimeline["transitions"], events: ScientificTimeline["events"] = [], tracks: ScientificTimeline["tracks"] = []): ScientificTimeline {
  return { schemaVersion: "1", timelineId, clock: { duration: 2, unit: "seconds", timeStep: 1 / 60 }, initialMechanismStateId, states, transitions, events, tracks };
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

test("P3-B evaluates DNA separation before, during, at the boundary, and after", () => {
  const scene = separationScene();
  const actors = scene.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  const timeline = timelineFor(scene, "dna-separation-timeline", "before", [
    { mechanismStateId: "before", scientificStateId: "closed", kind: "before", actorIds: actors },
    { mechanismStateId: "during", scientificStateId: "closed", kind: "transition", actorIds: actors },
    { mechanismStateId: "after", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] },
  ], [{ transitionId: "separate", fromMechanismStateId: "before", toMechanismStateId: "after", start: 0.5, end: 1.5 }], [{ eventId: "separation-event", at: 1.5, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }]);
  const snapshotAt = (timeSeconds: number) => {
    const result = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds });
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("fixture evaluation failed");
    return result.snapshot;
  };
  assert.deepEqual(snapshotAt(0.49).activeScientificStateIds, ["closed"]);
  assert.equal(snapshotAt(0.5).transitions[0]!.status, "active");
  assert.equal(snapshotAt(1.5).transitions[0]!.status, "completed");
  assert.equal(snapshotAt(1.5).groundedTopology.appliedTopologyChangeIds[0], "change-separation");
  assert.deepEqual(snapshotAt(1.5).activeScientificStateIds, ["open"]);
});

test("P3-B evaluates RNA cleavage exactly at the grounded event boundary", () => {
  const scene = scientificSceneSpecFixtures.cleavage;
  const actors = scene.actors.map((actor) => actor.actorId);
  const timeline = timelineFor(scene, "rna-cleavage-timeline", "before", [
    { mechanismStateId: "before", scientificStateId: "rna-cleaved", kind: "before", actorIds: actors },
    { mechanismStateId: "after", scientificStateId: "rna-cleaved", kind: "after", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] },
  ], [{ transitionId: "cleavage", fromMechanismStateId: "before", toMechanismStateId: "after", start: 0.5, end: 1 }], [{ eventId: "cleavage-event", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-rna-cleavage" }]);
  const before = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 0.999 });
  const exact = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 1 });
  assert.equal(before.ok && before.snapshot.appliedEventIds.length, 0);
  assert.equal(exact.ok && exact.snapshot.appliedEventIds[0], "cleavage-event");
});

test("P3-B evaluates RNA exonuclease continuity and shortening without a renderer plan", () => {
  const scene = scientificSceneSpecFixtures["exonuclease-shortened"];
  const actors = scene.actors.map((actor) => actor.actorId);
  const timeline = timelineFor(scene, "rna-exonuclease-timeline", "intact", [
    { mechanismStateId: "intact", scientificStateId: "terminally-degraded", kind: "before", actorIds: actors },
    { mechanismStateId: "shortened", scientificStateId: "terminally-degraded", kind: "after", actorIds: actors, topologyChangeIds: ["change-five-to-three-shortening"] },
  ], [{ transitionId: "shortening", fromMechanismStateId: "intact", toMechanismStateId: "shortened", start: 0.75, end: 1.25 }], [{ eventId: "shorten", at: 1.25, kind: "polymerShortened", actorIds: actors, topologyChangeId: "change-five-to-three-shortening", amount: 1 }]);
  const result = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 1.25 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.snapshot.groundedTopology.continuityIds, []);
    assert.deepEqual(result.snapshot.groundedTopology.appliedTopologyChangeIds, ["change-five-to-three-shortening"]);
    assert.deepEqual(result.snapshot.activeScientificStateIds, ["terminally-degraded"]);
  }
});

test("P3-B evaluates static RNA hairpin identically at arbitrary times", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const actorIds = scene.actors.map((actor) => actor.actorId);
  const timeline = timelineFor(scene, "static-hairpin-timeline", "folded", [{ mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before", actorIds }], []);
  const first = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 0 });
  const last = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 2 });
  assert.equal(first.ok && last.ok, true);
  if (first.ok && last.ok) {
    assert.deepEqual({ ...first.snapshot, timeSeconds: 0 }, { ...last.snapshot, timeSeconds: 0 });
  }
});

test("P3-B evaluates continuous tracks with deterministic canonical interpolation", () => {
  const scene = scientificSceneSpecFixtures.cleavage;
  const actorId = scene.actors[0]!.actorId;
  const timeline = timelineFor(scene, "track-timeline", "state", [{ mechanismStateId: "state", scientificStateId: "rna-cleaved", kind: "before", actorIds: [actorId] }], [], [], [{ trackId: "coordinate-track", category: "continuous", channel: "coordinate", actorIds: [actorId], keyframes: [{ at: 0, interpolation: "linear", value: { kind: "coordinate", value: { x: 0, y: 0, z: 0 } } }, { at: 2, interpolation: "linear", value: { kind: "coordinate", value: { x: 2, y: 4, z: 6 } } }] }]);
  const result = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 1 });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.snapshot.tracks[0]!.value, { kind: "coordinate", value: { x: 1, y: 2, z: 3 } });
});

test("P3-B orders same-time events by stable event ID", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const actorIds = scene.actors.map((actor) => actor.actorId);
  const timeline = timelineFor(scene, "same-time-events", "folded", [{ mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before", actorIds }], [], [
    { eventId: "event-z", at: 1, kind: "stateEntered", actorIds, stateId: "hairpin-folded" },
    { eventId: "event-a", at: 1, kind: "stateExited", actorIds, stateId: "hairpin-folded" },
  ]);
  const result = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 1 });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.snapshot.events.map((event) => event.eventId), ["event-a", "event-z"]);
});

test("P3-B rejects invalid scientific references and out-of-range time", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const timeline = timelineFor(scene, "invalid-timeline", "missing-state", [{ mechanismStateId: "state", scientificStateId: "missing-scientific-state", kind: "before", actorIds: [] }], []);
  const invalid = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 0 });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, "TIMELINE_INVALID");
  const valid = timelineFor(scene, "range-timeline", "folded", [{ mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before", actorIds: scene.actors.map((actor) => actor.actorId) }], []);
  const outOfRange = evaluateScientificTimeline({ scientificScene: scene, timeline: valid, timeSeconds: 2.1 });
  assert.equal(outOfRange.ok, false);
  if (!outOfRange.ok) assert.equal(outOfRange.code, "TIME_OUT_OF_RANGE");
});

test("P3-B is seekable, reversible, frame-rate independent, and serializable", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const timeline = timelineFor(scene, "determinism-timeline", "folded", [{ mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before", actorIds: scene.actors.map((actor) => actor.actorId) }], []);
  const direct = evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 0.7 });
  const sequence = [0, 0.4, 0.7, 0.2].map((timeSeconds) => evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds }));
  assert.deepEqual(sequence[2], direct);
  for (const fps of [30, 60, 120]) {
    const samples = Array.from({ length: fps * 2 + 1 }, (_, index) => index / fps);
    const final = samples.map((timeSeconds) => evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds })).at(-1);
    assert.deepEqual(final, evaluateScientificTimeline({ scientificScene: scene, timeline, timeSeconds: 2 }));
  }
  const cursor = advancePlaybackCursor(createPlaybackCursor(timeline.timelineId, 0, 1, true), 0.5, timeline.clock.duration);
  assert.equal(cursor.timeSeconds, 0.5);
  assert.deepEqual(deserializePlaybackCursor(serializePlaybackCursor(cursor)), cursor);
});
