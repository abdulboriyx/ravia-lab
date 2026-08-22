import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import {
  advanceProductionTemporalCursor,
  createDnaPairingProductionMigration,
  createDnaSeparationProductionMigration,
  createProductionTemporalMigration,
  createProductionTemporalCursor,
  createRnaExonucleaseProductionMigration,
  createRnaHairpinProductionMigration,
  evaluateProductionTemporalFrame,
  restartProductionTemporalCursor,
  seekProductionTemporalCursor,
  setProductionTemporalRate,
} from "./p3-g-production-temporal-migration.ts";

function staticTimeline(scene: ScientificSceneSpec, timelineId: string, mechanismStateId: string, scientificStateId: string, duration = 2): ScientificTimeline {
  return { schemaVersion: "1", timelineId, clock: { duration, unit: "seconds" }, initialMechanismStateId: mechanismStateId, states: [{ mechanismStateId, scientificStateId, kind: "before", actorIds: scene.topology.actorIds }], transitions: [], events: [], tracks: [] };
}

function separationScene(): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["strand-separation"]);
  const strands = base.actors.filter((item) => item.semanticTypeId === "strand").map((item) => item.actorId);
  return { ...base, topology: { ...base.topology, interactions: [{ ...base.topology.interactions[0]!, state: "present" }], continuities: [{ continuityId: "dna-backbone", strandActorId: strands[0]!, orderedActorIds: strands, state: "intact" }], changes: [{ changeId: "change-separation", kind: "separation", actorIds: [...strands, actorId("dna-1")], interactionIds: ["opened-pair-1"] }] }, states: [{ stateId: "closed", kind: "closed", actorIds: strands, interactionIds: ["opened-pair-1"] }, { stateId: "open", kind: "open", actorIds: strands, interactionIds: ["opened-pair-1"], topologyChangeIds: ["change-separation"] }] };
}

function separationTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  const actors = scene.topology.actorIds;
  return { schemaVersion: "1", timelineId: "p3-g-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: actors }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
}

function frameAt(migration: Parameters<typeof evaluateProductionTemporalFrame>[0], timeSeconds: number) {
  const cursor = seekProductionTemporalCursor(createProductionTemporalCursor(migration), timeSeconds, migration.timeline.clock.duration);
  return evaluateProductionTemporalFrame(migration, cursor);
}

function separationInput(frame: ReturnType<typeof evaluateProductionTemporalFrame>) {
  assert.equal(frame.ok, true);
  if (!frame.ok || frame.ownerInput.ownerId !== "DnaStrandSeparationPresentation") throw new Error("DNA separation owner input unavailable");
  return frame.ownerInput;
}

test("P3-G routes DNA pairing through the canonical production seam", () => {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  const timeline = staticTimeline(scene, "p3-g-pairing", "paired", "paired-duplex");
  const result = createDnaPairingProductionMigration(scene, timeline, { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const frame = frameAt(result.migration, 0);
  assert.equal(frame.ok, true);
  if (frame.ok) {
    assert.equal(frame.ownerInput.ownerId, "DnaBasePairInteractionPresentation");
    assert.equal(frame.ownerInput.interactionActive, true);
    assert.equal(frame.ownerInput.sourceInteractionId, "at-pair-1");
    assert.equal(frame.mechanism.timelineId, "p3-g-pairing");
  }
});

test("P3-G drives DNA separation, seek, dropped-frame, and exact-frame behavior", () => {
  const scene = separationScene();
  const timeline = separationTimeline(scene);
  const result = createDnaSeparationProductionMigration(scene, timeline, { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const before = frameAt(result.migration, 0.2);
  const opening = frameAt(result.migration, 0.75);
  const jumped = frameAt(result.migration, 1.4);
  assert.equal(separationInput(before).state, "paired");
  assert.equal(separationInput(opening).state, "opening");
  assert.equal(separationInput(opening).bubbleProgress > 0, true);
  assert.equal(separationInput(jumped).state, "separated");
  assert.equal(jumped.ok && jumped.topology.activeTopologyChangeIds.includes("change-separation"), true);
  const backward = frameAt(result.migration, 0.2);
  assert.equal(separationInput(backward).state, "paired");
  const cursor = restartProductionTemporalCursor(createProductionTemporalCursor(result.migration));
  const dropped = evaluateProductionTemporalFrame(result.migration, advanceProductionTemporalCursor(cursor, 1.4, 2));
  assert.equal(separationInput(dropped).state, "separated");
  const rated = setProductionTemporalRate(cursor, 2);
  assert.equal(advanceProductionTemporalCursor(rated, 0.5, 2).timeSeconds, 1);
  for (const fps of [24, 30, 60]) {
    const exact = frameAt(result.migration, 24 / fps);
    const repeat = frameAt(result.migration, 24 / fps);
    assert.deepEqual(exact, repeat);
  }
  const serialized = JSON.parse(JSON.stringify(jumped));
  assert.deepEqual(serialized, jumped);
});

test("P3-G keeps the RNA hairpin owner static and grounded", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const timeline = staticTimeline(scene, "p3-g-hairpin", "folded", "hairpin-folded");
  const result = createRnaHairpinProductionMigration(scene, timeline, { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const first = frameAt(result.migration, 0);
  const last = frameAt(result.migration, 2);
  assert.equal(first.ok && first.ownerInput.ownerId, "RnaSecondaryStructurePresentation");
  assert.equal(first.ok && last.ok, true);
  if (first.ok && last.ok) assert.deepEqual({ ...first.ownerInput, timeSeconds: 0 }, { ...last.ownerInput, timeSeconds: 0 });
});

test("P3-G propagates RNA exonuclease FRAGMENTATION_UNGROUNDED", () => {
  const scene = scientificSceneSpecFixtures["exonuclease-shortened"];
  const timeline: ScientificTimeline = { ...staticTimeline(scene, "p3-g-exonuclease", "before", "terminally-degraded", 1), events: [{ eventId: "shorten", at: 0.5, kind: "polymerShortened", actorIds: scene.topology.actorIds, topologyChangeId: "change-five-to-three-shortening", amount: 1 }] };
  const result = createRnaExonucleaseProductionMigration(scene, timeline, { rnaActorId: actorId("rna-1"), retainedActorId: actorId("retained-rna-1"), terminalShorteningInteractionId: "terminal-shortening", partiallyDegradedStateId: "terminally-degraded", continuityId: "missing-partition", topologyChangeId: "change-five-to-three-shortening" }, "shorten");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const frame = frameAt(result.migration, 0.5);
  assert.equal(frame.ok, false);
  if (!frame.ok) assert.equal(frame.reasons.includes("FRAGMENTATION_UNGROUNDED"), true);
});

test("P3-G rejects an unavailable owner and keeps controls cursor-only", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const timeline = staticTimeline(scene, "p3-g-owner", "folded", "hairpin-folded");
  const unavailable = createProductionTemporalMigration({ capabilityId: "dna-base-pairing", ownerView: { actorIds: [actorId("hairpin-left-1"), actorId("hairpin-right-1")], pair: "A-T" }, scientificScene: scene, timeline, presentationPlan: { schemaVersion: "1", ownerId: "RnaSecondaryStructurePresentation", sourceActorIds: [], sourceInteractionIds: [], sourceStateIds: [], sourceTopologyChangeIds: [], easing: "linear", cameraCue: { kind: "preserveCurrent", actorIds: [], transitionProgress: 0 }, labels: { showState: false, showEvents: false } } });
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) assert.equal(unavailable.code, "PRODUCTION_TEMPORAL_OWNER_UNAVAILABLE");
  const valid = createRnaHairpinProductionMigration(scene, timeline, { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    const cursor = setProductionTemporalRate(restartProductionTemporalCursor(createProductionTemporalCursor(valid.migration)), 2);
    assert.equal(advanceProductionTemporalCursor(cursor, 0.25, 2).timeSeconds, 0.5);
    assert.equal(seekProductionTemporalCursor(cursor, 1.25, 2).timeSeconds, 1.25);
  }
});
