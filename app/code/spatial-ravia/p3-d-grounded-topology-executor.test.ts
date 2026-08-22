import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { actorId } from "./scientific-actor.ts";
import { compileDeterministicTemporalProgram } from "./p3-c-deterministic-temporal-semantics.ts";
import { composeMechanismSnapshotWithTopology, evaluateGroundedTopologyAtTime, serializeMechanismTopologySnapshot } from "./p3-d-grounded-topology-executor.ts";
import { evaluateScientificTimeline } from "./p3-b-mechanism-state-kernel.ts";

function separationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  return {
    ...base,
    topology: { ...base.topology, interactions: [{ ...base.topology.interactions[0]!, state: "present" }], continuities: [{ continuityId: "dna-backbone", strandActorId: strands[0]!, orderedActorIds: strands, state: "intact" }], changes: [{ changeId: "change-separation", kind: "separation", actorIds: [...strands, actorId("dna-1")], interactionIds: ["opened-pair-1"] }] },
    states: [{ stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] }, { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] }],
  };
}

function compile(scene: ScientificSceneSpec, timeline: ScientificTimeline) {
  const result = compileDeterministicTemporalProgram(scene, timeline);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("temporal compilation failed");
  return result.program;
}

function separationTimeline(scene: ScientificSceneSpec, eventAt = 1): ScientificTimeline {
  const actors = scene.topology.actorIds;
  return { schemaVersion: "1", timelineId: "p3-d-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: actors }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: eventAt, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
}

test("P3-D derives initial grounded topology and applies DNA separation only at its event", () => {
  const scene = separationScene();
  const program = compile(scene, separationTimeline(scene, 1));
  const before = evaluateGroundedTopologyAtTime(program, 0.99);
  const exact = evaluateGroundedTopologyAtTime(program, 1);
  assert.equal(before.ok && before.snapshot.activeInteractionIds.includes("opened-pair-1"), true);
  assert.equal(before.ok && before.snapshot.activeContinuityIds.includes("dna-backbone"), true);
  assert.equal(exact.ok && exact.snapshot.inactiveInteractionIds.includes("opened-pair-1"), true);
  assert.equal(exact.ok && exact.snapshot.activeContinuityIds.includes("dna-backbone"), true);
  assert.equal(exact.ok && exact.snapshot.separationChangeIds[0], "change-separation");
  assert.equal(exact.ok && exact.snapshot.evidence[0]?.changeId, "change-separation");
  assert.deepEqual(evaluateGroundedTopologyAtTime(program, 0.99), before);
});

test("P3-D applies RNA cleavage, restores it on backward seek, and preserves evidence", () => {
  const source = structuredClone(scientificSceneSpecFixtures.cleavage);
  source.topology.interactions = source.topology.interactions.map((interaction) => interaction.interactionId === "cleaved-link" ? { ...interaction, state: "present" } : interaction);
  source.topology.continuities = source.topology.continuities?.map((continuity) => ({ ...continuity, state: "intact" }));
  const actors = source.topology.actorIds;
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-d-cleavage", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "rna-cleaved", kind: "before", actorIds: actors }, { mechanismStateId: "after", scientificStateId: "rna-cleaved", kind: "after", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] }], transitions: [], events: [{ eventId: "cleave", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-rna-cleavage" }], tracks: [] };
  const program = compile(source, timeline);
  const before = evaluateGroundedTopologyAtTime(program, 0.9);
  const after = evaluateGroundedTopologyAtTime(program, 1);
  assert.equal(before.ok && before.snapshot.activeContinuityIds.includes("continuity-before-cleavage"), true);
  assert.equal(after.ok && after.snapshot.brokenContinuityIds.includes("continuity-before-cleavage"), true);
  assert.equal(after.ok && after.snapshot.inactiveInteractionIds.includes("cleaved-link"), true);
  assert.equal(after.ok && after.snapshot.evidence[0]?.attachmentIds.length! > 0, true);
  assert.deepEqual(evaluateGroundedTopologyAtTime(program, 0.9), before);
});

test("P3-D orders cleavage to grounded shortening and reports fragment topology", () => {
  const scene = structuredClone(scientificSceneSpecFixtures.cleavage);
  scene.topology.interactions = scene.topology.interactions.map((interaction) => interaction.interactionId === "cleaved-link" ? { ...interaction, state: "present" } : interaction);
  scene.topology.continuities = scene.topology.continuities?.map((continuity) => ({ ...continuity, state: "intact" }));
  scene.topology.changes = [...(scene.topology.changes ?? []), { changeId: "change-shortening", kind: "fragmentation", actorIds: [scene.topology.actorIds[0]!, scene.topology.actorIds[1]!], interactionIds: ["fragment-relation"] }];
  const actors = scene.topology.actorIds;
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-d-cleavage-shortening", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "rna-cleaved", kind: "before", actorIds: actors }, { mechanismStateId: "after", scientificStateId: "rna-cleaved", kind: "after", actorIds: actors, topologyChangeIds: ["change-rna-cleavage", "change-shortening"] }], transitions: [], events: [{ eventId: "cleave", at: 0.5, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-rna-cleavage" }, { eventId: "shorten", at: 1.2, kind: "polymerShortened", actorIds: actors, topologyChangeId: "change-shortening", amount: 1 }], tracks: [], constraints: [{ constraintId: "cleavage-before-shortening", kind: "orderedEvents", eventIds: ["cleave", "shorten"] }] };
  const program = compile(scene, timeline);
  const middle = evaluateGroundedTopologyAtTime(program, 0.9);
  const after = evaluateGroundedTopologyAtTime(program, 1.2);
  assert.equal(middle.ok && middle.snapshot.activeTopologyChangeIds.includes("change-rna-cleavage"), true);
  assert.equal(middle.ok && !middle.snapshot.activeTopologyChangeIds.includes("change-shortening"), true);
  assert.equal(after.ok && after.snapshot.fragmentation.some((item) => item.changeId === "change-shortening"), true);
  assert.deepEqual(evaluateGroundedTopologyAtTime(program, 0.9), middle);
});

test("P3-D supports grounded interaction formation and static topology", () => {
  const scene = structuredClone(scientificSceneSpecFixtures.hairpin);
  scene.topology.interactions = scene.topology.interactions.map((interaction) => ({ ...interaction, state: "absent" }));
  scene.topology.changes = [{ changeId: "change-pairing", kind: "pairing", actorIds: [scene.topology.interactions[0]!.participants[0]!.actorId, scene.topology.interactions[0]!.participants[1]!.actorId, actorId("rna-1")], interactionIds: ["hairpin-pair"] }];
  const actors = scene.topology.actorIds;
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-d-pairing", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "hairpin-folded", kind: "before", actorIds: actors }], transitions: [], events: [{ eventId: "form", at: 1, kind: "bondFormed", actorIds: actors, interactionId: "hairpin-pair", topologyChangeId: "change-pairing" }], tracks: [] };
  const program = compile(scene, timeline);
  const staticScene = structuredClone(scientificSceneSpecFixtures.hairpin);
  const staticTimeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-d-static", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "static", states: [{ mechanismStateId: "static", scientificStateId: "hairpin-folded", kind: "before", actorIds: staticScene.topology.actorIds }], transitions: [], events: [], tracks: [] };
  const staticProgram = compile(staticScene, staticTimeline);
  const static0 = evaluateGroundedTopologyAtTime(staticProgram, 0); const static2 = evaluateGroundedTopologyAtTime(staticProgram, 2);
  assert.deepEqual(static0.ok && static2.ok ? { ...static0.snapshot, timeSeconds: 0 } : static0, static2.ok ? { ...static2.snapshot, timeSeconds: 0 } : static2);
  const formed = evaluateGroundedTopologyAtTime(program, 1);
  assert.equal(formed.ok && formed.snapshot.activeInteractionIds.includes("hairpin-pair"), true);
});

test("P3-D rejects conflicts, missing evidence, and ungrounded shortening", () => {
  const scene = separationScene();
  const actors = scene.topology.actorIds;
  const conflictTimeline = separationTimeline(scene);
  conflictTimeline.events.push({ eventId: "form-same-time", at: 1, kind: "bondFormed", actorIds: actors, interactionId: "opened-pair-1" });
  const conflict = compile(scene, conflictTimeline);
  const conflictResult = evaluateGroundedTopologyAtTime(conflict, 1);
  assert.equal(conflictResult.ok, false);
  if (!conflictResult.ok) assert.equal(conflictResult.code, "TOPOLOGY_CONFLICT");
  const noEvidenceScene = separationScene();
  noEvidenceScene.topology.changes = [{ changeId: "change-separation", kind: "separation", actorIds: [actorId("separation-site-1")], interactionIds: ["opened-pair-1"] }];
  const noEvidence = evaluateGroundedTopologyAtTime(compile(noEvidenceScene, separationTimeline(noEvidenceScene)), 1);
  assert.equal(noEvidence.ok, false);
  if (!noEvidence.ok) assert.equal(noEvidence.code, "TOPOLOGY_EVIDENCE_INVALID");
  const missingTimeline = separationTimeline(scene);
  missingTimeline.events[0]!.topologyChangeId = "not-grounded";
  const missingProgram = compileDeterministicTemporalProgram(scene, missingTimeline);
  assert.equal(missingProgram.ok, false);
  const unsupportedScene = structuredClone(scientificSceneSpecFixtures["exonuclease-shortened"]);
  const unsupportedTimeline: ScientificTimeline = { schemaVersion: "1", timelineId: "p3-d-unsupported-shortening", clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "terminally-degraded", kind: "before", actorIds: unsupportedScene.topology.actorIds }], transitions: [], events: [{ eventId: "shorten", at: 0.5, kind: "polymerShortened", actorIds: unsupportedScene.topology.actorIds, topologyChangeId: "change-five-to-three-shortening", amount: 1 }], tracks: [] };
  const unsupported = evaluateGroundedTopologyAtTime(compile(unsupportedScene, unsupportedTimeline), 0.5);
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.equal(unsupported.code, "FRAGMENTATION_UNGROUNDED");
});

test("P3-D topology snapshots serialize and compose with P3-B snapshots", () => {
  const scene = separationScene();
  const program = compile(scene, separationTimeline(scene));
  const topology = evaluateGroundedTopologyAtTime(program, 1);
  assert.equal(topology.ok, true);
  if (!topology.ok) throw new Error("topology evaluation failed");
  const mechanism = evaluateScientificTimeline({ scientificScene: scene, timeline: program.timeline, timeSeconds: 1, eventOrder: program.eventOrder });
  assert.equal(mechanism.ok, true);
  if (!mechanism.ok) throw new Error("mechanism evaluation failed");
  const composed = composeMechanismSnapshotWithTopology(mechanism.snapshot, topology.snapshot);
  assert.equal(composed.topologyState.activeTopologyChangeIds[0], "change-separation");
  assert.deepEqual(JSON.parse(serializeMechanismTopologySnapshot(topology.snapshot)), topology.snapshot);
});

test("P3-D preserves same-time ordering, duplicate-change idempotence, and sparse sampling", () => {
  const scene = structuredClone(scientificSceneSpecFixtures.hairpin);
  const first = scene.topology.interactions[0]!;
  const second = { ...first, interactionId: "hairpin-pair-2", state: "present" as const };
  scene.topology.interactions = [first, second];
  scene.topology.changes = [
    { changeId: "change-separation-a", kind: "separation", actorIds: [actorId("rna-1")], interactionIds: [first.interactionId] },
    { changeId: "change-separation-b", kind: "separation", actorIds: [actorId("rna-1")], interactionIds: [second.interactionId] },
  ];
  const actors = scene.topology.actorIds;
  const makeTimeline = (events: ScientificTimeline["events"]): ScientificTimeline => ({ schemaVersion: "1", timelineId: "p3-d-multi", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "state", states: [{ mechanismStateId: "state", scientificStateId: "hairpin-folded", kind: "before", actorIds: actors }], transitions: [], events, tracks: [] });
  const events: ScientificTimeline["events"] = [
    { eventId: "separation-b", at: 0.5, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation-b" },
    { eventId: "separation-a", at: 0.5, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation-a" },
    { eventId: "separation-a-again", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation-a" },
  ];
  const firstProgram = compile(scene, makeTimeline(events));
  const reversedProgram = compile(scene, makeTimeline([...events].reverse()));
  const firstResult = evaluateGroundedTopologyAtTime(firstProgram, 2);
  const reversedResult = evaluateGroundedTopologyAtTime(reversedProgram, 2);
  assert.equal(firstResult.ok && reversedResult.ok, true);
  if (firstResult.ok && reversedResult.ok) assert.deepEqual({ ...firstResult.snapshot, timeSeconds: 0 }, { ...reversedResult.snapshot, timeSeconds: 0 });
  const dense = evaluateGroundedTopologyAtTime(firstProgram, 2);
  for (const time of [0, 0.5, 1, 1.5, 2]) evaluateGroundedTopologyAtTime(firstProgram, time);
  const sparse = evaluateGroundedTopologyAtTime(firstProgram, 2);
  assert.deepEqual(dense, sparse);
  for (const fps of [30, 60, 120]) {
    const frame = evaluateGroundedTopologyAtTime(firstProgram, 30 / fps);
    const direct = evaluateGroundedTopologyAtTime(firstProgram, 30 / fps);
    assert.deepEqual(frame, direct);
  }
});
