import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { createDnaPairingProductionMigration, createDnaSeparationProductionMigration, createRnaExonucleaseProductionMigration, createRnaHairpinProductionMigration } from "./p3-g-production-temporal-migration.ts";
import { applyRenderState, deriveRenderState, evaluateExactFrame, serializeAppliedRenderState, serializeExactFrameRequest, type ExactFrameRequestV1, type RenderConfigV1 } from "./p4-b-exact-frame-runtime.ts";

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
  return { schemaVersion: "1", timelineId: "p4-b-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: actors }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
}

const config = (ownerId: RenderConfigV1["ownerId"]): RenderConfigV1 => ({ schemaVersion: "1", width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId });

function request(migration: Parameters<typeof deriveRenderState>[0]["migration"], timeSeconds: number): ExactFrameRequestV1 {
  return { schemaVersion: "1", migration, timeSeconds, renderConfig: config(migration.ownerId) };
}

test("P4-B validates exact time and frame-index requests", () => {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  const timeline = staticTimeline(scene, "p4-b-pairing-validation", "paired", "paired-duplex");
  const migrationResult = createDnaPairingProductionMigration(scene, timeline, { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(migrationResult.ok, true);
  if (!migrationResult.ok) return;
  const byTime = evaluateExactFrame(request(migrationResult.migration, 0.5));
  const byFrame = evaluateExactFrame({ ...request(migrationResult.migration, 0), frameIndex: 15, timeSeconds: undefined, fps: 30 });
  assert.equal(byTime.ok, true);
  assert.equal(byFrame.ok, true);
  if (byTime.ok && byFrame.ok) assert.deepEqual(byTime.appliedState, byFrame.appliedState);
  const invalid = evaluateExactFrame({ ...request(migrationResult.migration, 0), frameIndex: 1, timeSeconds: 0.5, fps: 30 });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, "EXACT_FRAME_REQUEST_INVALID");
});

test("P4-B derives DNA separation frame 427 without prior frames and bypasses timer history", () => {
  const scene = separationScene();
  const timeline = separationTimeline(scene);
  const migrationResult = createDnaSeparationProductionMigration(scene, timeline, { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening");
  assert.equal(migrationResult.ok, true);
  if (!migrationResult.ok) return;
  const frame427 = evaluateExactFrame({ schemaVersion: "1", migration: migrationResult.migration, frameIndex: 427, fps: 240, renderConfig: config(migrationResult.migration.ownerId) });
  assert.equal(frame427.ok, true);
  if (frame427.ok) {
    assert.equal(frame427.appliedState.ownerState.ownerId, "DnaStrandSeparationPresentation");
    if (frame427.appliedState.ownerState.ownerId === "DnaStrandSeparationPresentation") {
      assert.equal(frame427.appliedState.ownerState.state, "separated");
      assert.equal(frame427.appliedState.ownerState.separationApplied, true);
      assert.equal(frame427.appliedState.ownerState.separationAmount, 1);
    }
  }
});

test("P4-B is invariant to out-of-order frames, repeats, and shared exact times", () => {
  const scene = separationScene(); const timeline = separationTimeline(scene);
  const migrationResult = createDnaSeparationProductionMigration(scene, timeline, { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening");
  assert.equal(migrationResult.ok, true);
  if (!migrationResult.ok) return;
  const at = (time: number) => evaluateExactFrame(request(migrationResult.migration, time));
  const first = at(0.75); at(1.4); at(0.2); at(1.9); const second = at(0.75);
  assert.equal(first.ok && second.ok, true);
  if (first.ok && second.ok) assert.deepEqual(first.appliedState, second.appliedState);
  const sharedTime = 0.5;
  const shared = at(sharedTime);
  for (const fps of [24, 30, 60]) {
    const frame = sharedTime * fps;
    const result = evaluateExactFrame({ schemaVersion: "1", migration: migrationResult.migration, frameIndex: frame, fps, renderConfig: config(migrationResult.migration.ownerId) });
    assert.equal(result.ok, true);
    if (result.ok && shared.ok) assert.deepEqual(result.appliedState, shared.appliedState);
  }
});

test("P4-B supports absolute static DNA pairing and RNA hairpin owner states", () => {
  const dna = scientificSceneSpecFixtures["canonical-duplex"];
  const dnaMigration = createDnaPairingProductionMigration(dna, staticTimeline(dna, "p4-b-dna-pair", "paired", "paired-duplex"), { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(dnaMigration.ok, true);
  if (dnaMigration.ok) {
    const result = deriveRenderState(request(dnaMigration.migration, 1), 1);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.appliedState.ownerState.ownerId, "DnaBasePairInteractionPresentation");
  }
  const rna = scientificSceneSpecFixtures.hairpin;
  const rnaMigration = createRnaHairpinProductionMigration(rna, staticTimeline(rna, "p4-b-hairpin", "folded", "hairpin-folded"), { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] });
  assert.equal(rnaMigration.ok, true);
  if (rnaMigration.ok) {
    const result = evaluateExactFrame(request(rnaMigration.migration, 1));
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.appliedState.ownerState.ownerId, "RnaSecondaryStructurePresentation");
  }
});

test("P4-B preserves FRAGMENTATION_UNGROUNDED for RNA exonuclease", () => {
  const scene = scientificSceneSpecFixtures["exonuclease-shortened"];
  const timeline: ScientificTimeline = { ...staticTimeline(scene, "p4-b-exonuclease", "before", "terminally-degraded", 1), events: [{ eventId: "shorten", at: 0.5, kind: "polymerShortened", actorIds: scene.topology.actorIds, topologyChangeId: "change-five-to-three-shortening", amount: 1 }] };
  const migrationResult = createRnaExonucleaseProductionMigration(scene, timeline, { rnaActorId: actorId("rna-1"), retainedActorId: actorId("retained-rna-1"), terminalShorteningInteractionId: "terminal-shortening", partiallyDegradedStateId: "terminally-degraded", continuityId: "missing-partition", topologyChangeId: "change-five-to-three-shortening" }, "shorten");
  assert.equal(migrationResult.ok, true);
  if (migrationResult.ok) {
    const result = evaluateExactFrame(request(migrationResult.migration, 0.5));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "FRAGMENTATION_UNGROUNDED");
  }
});

test("P4-B applies complete state through the owner contract and serializes it", () => {
  const scene = scientificSceneSpecFixtures.hairpin;
  const migrationResult = createRnaHairpinProductionMigration(scene, staticTimeline(scene, "p4-b-serialization", "folded", "hairpin-folded"), { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] });
  assert.equal(migrationResult.ok, true);
  if (!migrationResult.ok) return;
  const result = evaluateExactFrame(request(migrationResult.migration, 0));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  let applied = false;
  const target = { ownerId: result.appliedState.ownerId, setExactFrameState: (state: typeof result.appliedState) => { applied = state.timeSeconds === 0; } };
  const appliedResult = applyRenderState(target, result.appliedState);
  assert.equal(appliedResult.ok, true);
  assert.equal(applied, true);
  assert.deepEqual(JSON.parse(serializeExactFrameRequest(result.request)), JSON.parse(JSON.stringify(result.request)));
  assert.deepEqual(JSON.parse(serializeAppliedRenderState(result.appliedState)), result.appliedState);
  const incomplete = applyRenderState(target, { ...result.appliedState, renderConfig: { ...result.appliedState.renderConfig, width: 0 } });
  assert.equal(incomplete.ok, false);
  if (!incomplete.ok) assert.equal(incomplete.code, "RENDER_STATE_INCOMPLETE");
});
