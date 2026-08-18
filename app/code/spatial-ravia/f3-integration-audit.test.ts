import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { exportRequestFixture, scenePackageFixture } from "./scene-export-contract-fixtures.ts";
import { validateExportRequest, type ExportRequest } from "./scene-export-contract.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { timelineContextFromScene, validateScientificTimeline, type ScientificTimeline } from "./scientific-timeline.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { validateTeachingPlan, type TeachingPlan } from "./teaching-plan.ts";

function mechanismTimeline(sceneKey: "strand-separation" | "exonuclease-shortened", eventKind: "stateEntered" | "polymerShortened"): ScientificTimeline {
  const scene = scientificSceneSpecFixtures[sceneKey];
  const state = scene.states[0]!;
  const actors = state.actorIds.length > 0 ? state.actorIds : [scene.actors[0]!.actorId];
  return {
    schemaVersion: "1", timelineId: `timeline-${sceneKey}`, clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before",
    states: [{ mechanismStateId: "before", scientificStateId: state.stateId, kind: "before", actorIds: actors }], transitions: [],
    events: [{ eventId: "mechanism-event", at: 0.5, kind: eventKind, actorIds: actors, ...(eventKind === "polymerShortened" ? { amount: 1 } : { stateId: state.stateId }) }],
    tracks: [{ trackId: "scientific-change", category: "continuous", channel: "conformation", actorIds: [actors[0]!], keyframes: [{ at: 0, interpolation: "linear", value: { kind: "conformation", value: { parameter: "mechanismProgress", value: 0 } } }, { at: 1, interpolation: "linear", value: { kind: "conformation", value: { parameter: "mechanismProgress", value: 1 } } }] }],
    chapters: [{ chapterId: "mechanism", start: 0, end: 1, stateIds: [state.stateId], eventIds: ["mechanism-event"] }],
  };
}

test("F3 contracts compose for DNA/RNA mechanism timelines, teaching, and planned export formats", () => {
  const separation = scientificSceneSpecFixtures["strand-separation"];
  const shortening = scientificSceneSpecFixtures["exonuclease-shortened"];
  assert.equal(validateScientificTimeline(mechanismTimeline("strand-separation", "stateEntered"), timelineContextFromScene(separation)).valid, true);
  assert.equal(validateScientificTimeline(mechanismTimeline("exonuclease-shortened", "polymerShortened"), timelineContextFromScene(shortening)).valid, true);
  assert.equal(validateTeachingPlan(teachingPlanFixture, scientificSceneSpecFixtures["rna-dna-stability"]).valid, true);
  const misconception = structuredClone(teachingPlanFixture) as TeachingPlan;
  misconception.misconceptionCorrection = { misconception: "DNA has ribose right?", correction: "DNA has deoxyribose; RNA has the 2-prime hydroxyl.", chapterIds: ["observe-local-sugars"], evidence: [{ kind: "actor", actorId: actorId("dna-deoxyribose-1") }] };
  assert.equal(validateTeachingPlan(misconception, scientificSceneSpecFixtures["rna-dna-stability"]).valid, true);
  const mp4: ExportRequest = { ...exportRequestFixture, requestId: "rna-stability-mp4", format: "mp4", background: { mode: "opaque", color: "#ffffff" }, timeline: { mode: "range", startFrame: 0, endFrame: 60, fps: 30 } };
  const embed: ExportRequest = { ...exportRequestFixture, requestId: "rna-stability-embed", format: "embed", timeline: { mode: "range", startFrame: 0, endFrame: 60, fps: 30 } };
  assert.equal(validateExportRequest(exportRequestFixture, scenePackageFixture).valid, true);
  assert.equal(validateExportRequest(mp4, scenePackageFixture).valid, true);
  assert.equal(validateExportRequest(embed, scenePackageFixture).valid, true);
});
