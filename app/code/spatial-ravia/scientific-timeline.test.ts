import assert from "node:assert/strict";
import test from "node:test";
import { timelineFixture, timelineFixtureContext } from "./scientific-timeline-fixtures.ts";
import { validateScientificTimeline, type ScientificTimeline } from "./scientific-timeline.ts";

test("timeline fixture validates deterministic mechanism states, transitions, events, tracks, and chapters", () => {
  const result = validateScientificTimeline(timelineFixture, timelineFixtureContext);
  assert.equal(result.valid, true);
});

test("scientific state, topology events, and scientific tracks stay distinct", () => {
  assert.equal(timelineFixture.states[0]!.kind, "before");
  assert.equal(timelineFixture.events[0]!.kind, "bondBroken");
  assert.equal(timelineFixture.tracks[0]!.category, "continuous");
  assert.equal(timelineFixture.transitions[0]!.fidelity?.fidelity, "C0_COMPUTED");
});

test("strict validation rejects dangling refs, invalid ranges, duplicate IDs, and renderer fields", () => {
  const invalid = structuredClone(timelineFixture) as ScientificTimeline & Record<string, unknown>;
  invalid.renderer = "three";
  invalid.events[1]!.at = 0.4;
  invalid.events[2]!.eventId = invalid.events[0]!.eventId;
  invalid.events[0]!.interactionId = "missing-interaction";
  invalid.transitions[0]!.eventIds = ["missing-event"];
  invalid.tracks[0]!.keyframes[1]!.at = 0.1;
  const result = validateScientificTimeline(invalid, timelineFixtureContext);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path === "timeline.renderer"));
    assert.ok(result.issues.some((issue) => issue.message.includes("ordered")));
    assert.ok(result.issues.some((issue) => issue.message.includes("unique")));
    assert.ok(result.issues.some((issue) => issue.path.includes("interactionId") || issue.path.includes("eventIds")));
  }
});

test("invalid interpolation/value pairs and ambiguous topology events are rejected", () => {
  const invalid = structuredClone(timelineFixture) as ScientificTimeline;
  invalid.tracks[0]!.keyframes[0]!.value = { kind: "morph", value: { parameter: "x", value: 1 } };
  invalid.events.push({ eventId: "ambiguous-topology", at: 1.3, kind: "topologyChanged", actorIds: [], topologyChangeId: "missing-change" });
  const result = validateScientificTimeline(invalid, timelineFixtureContext);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path.includes("value.kind")));
    assert.ok(result.issues.some((issue) => issue.path.includes("topologyChangeId")));
  }
});

test("timeline values remain renderer-independent placeholders", () => {
  const serialized = JSON.stringify(timelineFixture);
  assert.equal(serialized.includes("THREE"), false);
  assert.equal(serialized.includes("mesh"), false);
  assert.equal(serialized.includes("cameraReference"), false);
});
