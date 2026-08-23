import assert from "node:assert/strict";
import test from "node:test";
import { capabilityRegistryById } from "./capability-registry.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { compileTeachingPlan, validateTeachingCompileRequest, type TeachingCompileInput } from "./teaching-compiler.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

const capability = (id: string) => {
  const value = capabilityRegistryById.get(id);
  assert.ok(value, `missing capability ${id}`);
  return value;
};
const intent = (acts: TeachingCompileInput["semanticIntent"]["acts"]): TeachingCompileInput["semanticIntent"] => ({ ...semanticIntentFixtures.rnaHairpin!, acts, rawUtterance: "ignored by teaching compiler" });
function separationScene(): ScientificSceneSpec {
  const scene = structuredClone(scientificSceneSpecFixtures["strand-separation"]!);
  scene.topology.changes = [{ changeId: "change-strand-separation", kind: "separation", actorIds: scene.states[0]!.actorIds, interactionIds: ["opened-pair-1"] }];
  scene.states[0]!.topologyChangeIds = ["change-strand-separation"];
  return scene;
}
function mechanismTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  const state = scene.states[0]!;
  const interaction = scene.topology.interactions[0]!;
  const change = scene.topology.changes?.[0];
  return { schemaVersion: "1", timelineId: `timeline-${scene.sceneId}`, clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: state.stateId, kind: "before", actorIds: state.actorIds, ...(change ? { topologyChangeIds: [change.changeId] } : {}) }], transitions: [{ transitionId: "transition-grounded", fromMechanismStateId: "before", toMechanismStateId: "before", start: 0, end: 1, eventIds: ["event-grounded"] }], events: [{ eventId: "event-grounded", at: .5, kind: "topologyChanged", actorIds: state.actorIds, ...(change ? { topologyChangeId: change.changeId } : { interactionId: interaction.interactionId }) }], tracks: [], chapters: [{ chapterId: "chapter-grounded", start: 0, end: 1, stateIds: [state.stateId], transitionIds: ["transition-grounded"], eventIds: ["event-grounded"] }] };
}
function input(scene: ScientificSceneSpec, capabilityId: string, mode: "show" | "explain" | "compare" | "why" | "misconceptionCorrection", timeline?: ScientificTimeline): TeachingCompileInput {
  return { semanticIntent: intent(mode === "compare" ? ["compare"] : mode === "show" ? ["show"] : ["explain"]), scientificScene: scene, scientificTimeline: timeline, capability: capability(capabilityId), teachingRequest: { schemaVersion: "1", requestMode: mode, audience: "intermediate", ...(mode === "misconceptionCorrection" ? { misconception: { outcome: "CORRECTION_REQUIRED", misconception: "incorrect claim", correction: "grounded correction" } } : {}) } };
}

test("A-B compiles show DNA, explain RNA hairpin, and a grounded comparison", () => {
  const dna = compileTeachingPlan(input(scientificSceneSpecFixtures["canonical-duplex"]!, "dna-canonical-structure", "show"));
  const hairpin = compileTeachingPlan(input(scientificSceneSpecFixtures.hairpin!, "rna-secondary-structure", "explain"));
  const comparison = compileTeachingPlan(input(scientificSceneSpecFixtures["rna-dna-stability"]!, "rna-dna-chemistry-comparison", "compare"));
  assert.ok(dna.ok); assert.ok(hairpin.ok); assert.ok(comparison.ok);
  if (comparison.ok) { assert.equal(comparison.plan.contrasts?.length, 1); assert.deepEqual(comparison.plan.chapters.map((chapter) => chapter.chapterId), ["compare-focus-a", "compare-focus-b", "compare-commonality", "compare-difference", "compare-synthesis"]); }
});

test("A-B why strand separation uses grounded interaction, topology change, and timeline references", () => {
  const scene = separationScene(); const result = compileTeachingPlan(input(scene, "dna-strand-separation", "why", mechanismTimeline(scene)));
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.plan.objectiveTrace?.objectiveKind, "EXPLAIN_CAUSE");
    assert.ok(result.plan.causalSteps?.some((step) => step.cause.kind === "interaction" && step.effect.kind === "topologyChange"));
    assert.ok(result.plan.chapters[0]!.focus.some((target) => target.kind === "timelineChapter"));
  }
});

test("A-B show and why preserve identical scientific inputs while changing pedagogy", () => {
  const scene = separationScene(); const timeline = mechanismTimeline(scene);
  const show = compileTeachingPlan(input(scene, "dna-strand-separation", "show", timeline));
  const why = compileTeachingPlan(input(scene, "dna-strand-separation", "why", timeline));
  assert.ok(show.ok); assert.ok(why.ok);
  if (show.ok && why.ok) { assert.equal(show.plan.sceneId, why.plan.sceneId); assert.notEqual(show.plan.learningObjective, why.plan.learningObjective); assert.notDeepEqual(show.plan.chapters, why.plan.chapters); }
});

test("A-B compiles RNA cleavage mechanism and structured misconception correction", () => {
  const cleavage = scientificSceneSpecFixtures.cleavage!;
  const mechanism = compileTeachingPlan(input(cleavage, "rna-cleavage", "explain", mechanismTimeline(cleavage)));
  const correction = compileTeachingPlan(input(scientificSceneSpecFixtures["rna-dna-stability"]!, "rna-dna-chemistry-comparison", "misconceptionCorrection"));
  assert.ok(mechanism.ok); assert.ok(correction.ok);
  if (mechanism.ok) assert.ok(mechanism.plan.chapters[0]!.focus.some((target) => target.kind === "scientificState"));
  if (correction.ok) { assert.ok(correction.plan.misconceptionCorrection); assert.deepEqual(correction.plan.chapters.map((chapter) => chapter.chapterId), ["correction-identify-claim", "correction-evidence", "correction-present", "correction-reinforce"]); }
});

test("A-B returns explicit unavailable and ungrounded failures", () => {
  const missingActor = input(scientificSceneSpecFixtures.hairpin!, "rna-secondary-structure", "show");
  missingActor.teachingRequest.focusActorIds = ["missing-actor"];
  const whyNoChange = compileTeachingPlan(input(scientificSceneSpecFixtures["strand-separation"]!, "dna-strand-separation", "why"));
  const fragmented = input(scientificSceneSpecFixtures["exonuclease-shortened"]!, "rna-exonuclease-degradation", "explain"); fragmented.teachingRequest.upstreamFailureCode = "FRAGMENTATION_UNGROUNDED";
  assert.deepEqual(compileTeachingPlan(missingActor).ok, false);
  assert.equal(whyNoChange.ok ? "ok" : whyNoChange.code, "SCIENTIFIC_STATE_UNAVAILABLE");
  const fragmentationResult = compileTeachingPlan(fragmented);
  assert.equal(fragmentationResult.ok ? "ok" : fragmentationResult.code, "FRAGMENTATION_UNGROUNDED");
});

test("A-B compiler is deterministic and invariant to irrelevant scene array ordering", () => {
  const scene = separationScene(); const timeline = mechanismTimeline(scene); const value = input(scene, "dna-strand-separation", "why", timeline);
  const first = compileTeachingPlan(value); const second = compileTeachingPlan(structuredClone(value));
  assert.deepEqual(first, second);
  const reordered = structuredClone(value); reordered.scientificScene.actors.reverse(); reordered.scientificScene.topology.interactions.reverse(); reordered.scientificScene.fidelityProvenance.sources.reverse(); reordered.scientificTimeline!.events.reverse(); reordered.scientificTimeline!.transitions.reverse();
  assert.deepEqual(compileTeachingPlan(reordered), first);
});

test("A-B request validation rejects unknown keys and unsupported mode", () => {
  assert.ok(validateTeachingCompileRequest({ schemaVersion: "1", audience: "intermediate", unknown: true } as unknown as TeachingCompileInput["teachingRequest"]).length > 0);
  const invalid = input(scientificSceneSpecFixtures.hairpin!, "rna-secondary-structure", "show"); invalid.teachingRequest.requestMode = "nope" as never;
  assert.equal(compileTeachingPlan(invalid).ok, false);
});
