import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { createDnaPairingProductionMigration, createDnaSeparationProductionMigration, createRnaHairpinProductionMigration } from "./p3-g-production-temporal-migration.ts";
import { evaluateExactFrame, type AppliedRenderStateV1 } from "./p4-b-exact-frame-runtime.ts";
import { ExactFrameRenderHost, createExactFrameOwnerTarget, type RenderReadinessV1 } from "./p4-c-renderer-state-reconstruction.ts";

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
  return { schemaVersion: "1", timelineId: "p4-c-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "closed", states: [{ mechanismStateId: "closed", scientificStateId: "closed", kind: "before", actorIds: actors }, { mechanismStateId: "open", scientificStateId: "open", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "closed", toMechanismStateId: "open", start: 0.5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
}

function separationState(timeSeconds: number): AppliedRenderStateV1 {
  const scene = separationScene(); const migration = createDnaSeparationProductionMigration(scene, separationTimeline(scene), { strandActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")], closedStateId: "closed", openStateId: "open", separationChangeId: "change-separation" }, "opened-pair-1", "opening");
  assert.equal(migration.ok, true);
  if (!migration.ok) throw new Error("migration unavailable");
  const result = evaluateExactFrame({ schemaVersion: "1", migration: migration.migration, timeSeconds, renderConfig: { schemaVersion: "1", width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque", color: "#ffffff" }, runtimeMode: "EXACT_FRAME", ownerId: migration.migration.ownerId } });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("exact state unavailable");
  return result.appliedState;
}

test("P4-C applies complete DNA separation state and exposes camera-pending readiness", () => {
  let received: AppliedRenderStateV1 | null = null;
  const host = new ExactFrameRenderHost({ ownerId: "DnaStrandSeparationPresentation", setExactFrameState: (state) => { received = state; } });
  const state = separationState(1.4);
  const result = host.apply(state);
  assert.equal(result.ok, true);
  assert.equal(received, state);
  assert.equal(host.snapshot.readiness.status, "READY");
  assert.equal(host.snapshot.readiness.cameraReady, false);
  assert.equal(host.snapshot.readiness.reasons.includes("CAMERA_PENDING"), true);
  assert.equal(host.snapshot.appliedState?.ownerState.ownerId, "DnaStrandSeparationPresentation");
});

test("P4-C replaces late state with early state without stale owner values", () => {
  const received: AppliedRenderStateV1[] = [];
  const host = new ExactFrameRenderHost({ ownerId: "DnaStrandSeparationPresentation", setExactFrameState: (state) => { received.push(state); } });
  const late = host.apply(separationState(1.4));
  const early = host.apply(separationState(0.2));
  assert.equal(late.ok && early.ok, true);
  assert.equal(host.snapshot.appliedState?.timeSeconds, 0.2);
  if (host.snapshot.appliedState?.ownerState.ownerId === "DnaStrandSeparationPresentation") assert.equal(host.snapshot.appliedState.ownerState.state, "paired");
  assert.equal(received.length, 2);
});

test("P4-C rejects stale readiness completion and preserves current-frame identity", () => {
  const readinessState: { value: Partial<RenderReadinessV1> } = { value: { geometryReady: false, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: false } };
  const host = new ExactFrameRenderHost({ ownerId: "DnaStrandSeparationPresentation", setExactFrameState: () => undefined, getReadiness: () => readinessState.value });
  const first = host.apply(separationState(1.4));
  assert.equal(first.ok, true);
  const firstId = first.ok ? first.applicationId : 0;
  const second = host.apply(separationState(0.2));
  assert.equal(second.ok, true);
  const secondId = second.ok ? second.applicationId : 0;
  const stale = host.acceptReadiness(firstId, { geometryReady: true, assetsReady: true, labelsReady: true, layoutReady: true, molstarReady: true });
  assert.equal(stale.supersededWorkPending, true);
  assert.equal(host.snapshot.applicationId, secondId);
  assert.equal(host.snapshot.readiness.status, "NOT_READY");
  readinessState.value = { geometryReady: true, labelsReady: true, assetsReady: true, layoutReady: true, molstarReady: true, cameraReady: false };
  const current = host.refreshReadiness(secondId);
  assert.equal(current.status, "READY");
  assert.equal(current.applicationId, secondId);
});

test("P4-C supports fresh-mount and repeated same-frame owner application", () => {
  const state = separationState(0.75);
  const apply = () => {
    let received: AppliedRenderStateV1 | null = null;
    const host = new ExactFrameRenderHost({ ownerId: "DnaStrandSeparationPresentation", setExactFrameState: (value) => { received = value; } });
    const first = host.apply(state); const second = host.apply(state);
    assert.equal(first.ok && second.ok, true);
    assert.equal(received, state);
    return host.snapshot;
  };
  assert.deepEqual(apply().appliedState, apply().appliedState);
});

test("P4-C accepts static DNA pairing and RNA hairpin concrete owner contracts", () => {
  const dna = scientificSceneSpecFixtures["canonical-duplex"];
  const dnaMigration = createDnaPairingProductionMigration(dna, staticTimeline(dna, "p4-c-pair", "paired", "paired-duplex"), { actorIds: [actorId("adenine-1"), actorId("thymine-1")], pair: "A-T" }, "at-pair-1");
  assert.equal(dnaMigration.ok, true);
  const rna = scientificSceneSpecFixtures.hairpin;
  const rnaMigration = createRnaHairpinProductionMigration(rna, staticTimeline(rna, "p4-c-hairpin", "folded", "hairpin-folded"), { rnaActorId: actorId("rna-1"), pairedRegionGroupId: "group-hairpin", pairedStateId: "hairpin-folded", basePairingInteractionIds: ["hairpin-pair"] });
  assert.equal(rnaMigration.ok, true);
  if (!dnaMigration.ok || !rnaMigration.ok) return;
  const make = (migration: typeof dnaMigration.migration | typeof rnaMigration.migration) => evaluateExactFrame({ schemaVersion: "1", migration, timeSeconds: 0, renderConfig: { schemaVersion: "1", width: 640, height: 480, pixelRatio: 1, background: { mode: "opaque", color: "#000000" }, runtimeMode: "EXACT_FRAME", ownerId: migration.ownerId } });
  const dnaState = make(dnaMigration.migration); const rnaState = make(rnaMigration.migration);
  assert.equal(dnaState.ok && rnaState.ok, true);
  if (dnaState.ok && rnaState.ok) {
    const dnaHost = new ExactFrameRenderHost(createExactFrameOwnerTarget({ ownerId: dnaState.appliedState.ownerId, setExactFrameState: () => undefined }));
    const rnaHost = new ExactFrameRenderHost(createExactFrameOwnerTarget({ ownerId: rnaState.appliedState.ownerId, setExactFrameState: () => undefined }));
    assert.equal(dnaHost.apply(dnaState.appliedState).ok, true);
    assert.equal(rnaHost.apply(rnaState.appliedState).ok, true);
  }
});

test("P4-C reports owner mismatch and renderer application failure explicitly", () => {
  const state = separationState(0);
  const mismatch = new ExactFrameRenderHost({ ownerId: "DnaBasePairInteractionPresentation", setExactFrameState: () => undefined }).apply(state);
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) assert.equal(mismatch.code, "OWNER_UNAVAILABLE");
  const failed = new ExactFrameRenderHost({ ownerId: "DnaStrandSeparationPresentation", setExactFrameState: () => { throw new Error("geometry commit failed"); } }).apply(state);
  assert.equal(failed.ok, false);
  if (!failed.ok) assert.equal(failed.code, "RENDERER_STATE_APPLICATION_FAILED");
});
