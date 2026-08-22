import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { compileDeterministicTemporalProgram } from "./p3-c-deterministic-temporal-semantics.ts";
import { evaluateScientificTimeline } from "./p3-b-mechanism-state-kernel.ts";
import { evaluateGroundedTopologyAtTime } from "./p3-d-grounded-topology-executor.ts";
import { createDnaBasePairingTemporalPlan, createDnaSeparationTemporalPlan, createPresentationPlaybackCursor, createRnaHairpinTemporalPlan, evaluatePresentationAtTime, evaluatePresentationCursorFrame, restartPresentationCursor, seekPresentationCursor, serializePresentationSnapshot, setPresentationPlaybackRate } from "./p3-e-presentation-synchronization.ts";

function separationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  return { ...base, topology: { ...base.topology, interactions: [{ ...base.topology.interactions[0]!, state: "present" }], continuities: [{ continuityId: "dna-backbone", strandActorId: strands[0]!, orderedActorIds: strands, state: "intact" }], changes: [{ changeId: "change-separation", kind: "separation", actorIds: [...strands, actorId("dna-1")], interactionIds: ["opened-pair-1"] }] }, states: [{ stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] }, { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] }] };
}

function separationTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  const actors = scene.topology.actorIds;
  return { schemaVersion: "1", timelineId: "p3-e-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: actors }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
}

function pipeline(scene: ScientificSceneSpec, timeline: ScientificTimeline, timeSeconds: number) {
  const programResult = compileDeterministicTemporalProgram(scene, timeline);
  assert.equal(programResult.ok, true);
  if (!programResult.ok) throw new Error("temporal compilation failed");
  const scientificResult = evaluateScientificTimeline({ scientificScene: scene, timeline: programResult.program.timeline, timeSeconds, eventOrder: programResult.program.eventOrder });
  const topologyResult = evaluateGroundedTopologyAtTime(programResult.program, timeSeconds);
  assert.equal(scientificResult.ok && topologyResult.ok, true);
  if (!scientificResult.ok || !topologyResult.ok) throw new Error("scientific pipeline failed");
  return { scientific: scientificResult.snapshot, topology: topologyResult.snapshot };
}

test("P3-E derives DNA separation presentation from canonical scientific/topology time", () => {
  const scene = separationScene(); const timeline = separationTimeline(scene);
  const view = { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")] as const, closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" };
  const plan = createDnaSeparationTemporalPlan(view, "opened-pair-1", "opening");
  const before = evaluatePresentationAtTime(pipeline(scene, timeline, 0.49).scientific, pipeline(scene, timeline, 0.49).topology, plan, 0.49);
  const opening = pipeline(scene, timeline, 0.75); const openingPresentation = evaluatePresentationAtTime(opening.scientific, opening.topology, plan, 0.75);
  const separated = pipeline(scene, timeline, 1); const separatedPresentation = evaluatePresentationAtTime(separated.scientific, separated.topology, plan, 1);
  assert.equal(before.ok && before.snapshot.visual.separationAmount, 0);
  assert.equal(openingPresentation.ok && openingPresentation.snapshot.visual.separationAmount > 0, true);
  assert.equal(separatedPresentation.ok && separatedPresentation.snapshot.topology.applied, true);
  assert.equal(separatedPresentation.ok && separatedPresentation.snapshot.visual.separationAmount, 1);
  const backward = pipeline(scene, timeline, 0.49); const backwardPresentation = evaluatePresentationAtTime(backward.scientific, backward.topology, plan, 0.49);
  assert.deepEqual(backwardPresentation, before);
});

test("P3-E keeps static DNA/RNA owner projections stable and traceable", () => {
  const scene = scientificSceneSpecFixtures.hairpin; const actors = scene.topology.actorIds;
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-e-static-hairpin", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "folded", states: [{ mechanismStateId: "folded", scientificStateId: "hairpin-folded", kind: "before", actorIds: actors }], transitions: [], events: [], tracks: [] };
  const view = { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] };
  const plan = createRnaHairpinTemporalPlan(view);
  const zero = pipeline(scene, timeline, 0); const end = pipeline(scene, timeline, 2);
  const first = evaluatePresentationAtTime(zero.scientific, zero.topology, plan, 0); const last = evaluatePresentationAtTime(end.scientific, end.topology, plan, 2);
  assert.equal(first.ok && last.ok, true);
  if (first.ok && last.ok) assert.deepEqual({ ...first.snapshot, timeSeconds: 0 }, { ...last.snapshot, timeSeconds: 0 });
  assert.equal(first.ok && first.snapshot.trace.sourceInteractionIds[0], "hairpin-pair");
  const dnaPairPlan = createDnaBasePairingTemporalPlan({ actorIds: [actorId("hairpin-left-1"), actorId("hairpin-right-1")], pair: "A-T" }, "hairpin-pair");
  const pair = evaluatePresentationAtTime(zero.scientific, zero.topology, dnaPairPlan, 0);
  assert.equal(pair.ok && pair.snapshot.visual.bondVisibility, 1);
});

test("P3-E preserves ungrounded exonuclease partition failure", () => {
  const scene = scientificSceneSpecFixtures["exonuclease-shortened"];
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-e-exonuclease", clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "terminally-degraded", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [{ eventId: "shorten", at: 0.5, kind: "polymerShortened", actorIds: scene.topology.actorIds, topologyChangeId: "change-five-to-three-shortening", amount: 1 }], tracks: [] };
  const programResult = compileDeterministicTemporalProgram(scene, timeline); assert.equal(programResult.ok, true);
  if (!programResult.ok) throw new Error("compilation failed");
  const topology = evaluateGroundedTopologyAtTime(programResult.program, 0.5);
  assert.equal(topology.ok, false);
  if (!topology.ok) assert.equal(topology.code, "FRAGMENTATION_UNGROUNDED");
});

test("P3-E camera cues, easing, cursor controls, and exact-frame evaluation are deterministic", () => {
  const scene = separationScene(); const timeline = separationTimeline(scene); const view = { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")] as const, closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }; const plan = createDnaSeparationTemporalPlan(view, "opened-pair-1", "opening", "smoothstep");
  const at = pipeline(scene, timeline, 0.75); const first = evaluatePresentationAtTime(at.scientific, at.topology, plan, 0.75); const second = evaluatePresentationAtTime(at.scientific, at.topology, plan, 0.75);
  assert.deepEqual(first, second); assert.equal(first.ok && first.snapshot.cameraCue.kind, "frameActors"); assert.equal(first.ok && first.snapshot.easedProgress !== first.snapshot.transitionProgress, true);
  const cursor = createPresentationPlaybackCursor("p3-e-separation", 2); const playing = restartPresentationCursor(cursor); const rated = setPresentationPlaybackRate(playing, 2); const sought = seekPresentationCursor(rated, 0.75, 2); assert.equal(sought.timeSeconds, 0.75); assert.equal(sought.rate, 2); assert.deepEqual(evaluatePresentationCursorFrame(sought, at.scientific, at.topology, plan), first);
  assert.deepEqual(JSON.parse(serializePresentationSnapshot(first.ok ? first.snapshot : (() => { throw new Error("presentation failed"); })())), first.ok ? first.snapshot : undefined);
  assert.equal(30 / 30, 1); assert.equal(30 / 60, 0.5); assert.equal(30 / 120, 0.25);
});

test("P3-E rejects missing scientific references without fallback", () => {
  const scene = scientificSceneSpecFixtures.hairpin; const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-e-invalid", clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "state", states: [{ mechanismStateId: "state", scientificStateId: "hairpin-folded", kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] }; const current = pipeline(scene, timeline, 0);
  const invalidPlan = { ...createRnaHairpinTemporalPlan({ rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] }), sourceInteractionIds: ["not-grounded"] };
  const result = evaluatePresentationAtTime(current.scientific, current.topology, invalidPlan, 0);
  assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "PRESENTATION_PLAN_INVALID");
});
