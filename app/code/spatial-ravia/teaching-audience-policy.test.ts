import assert from "node:assert/strict";
import test from "node:test";
import { capabilityRegistryById } from "./capability-registry.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { compileTeachingPlan } from "./teaching-compiler.ts";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { mapPresentationAudienceToTeachingAudience, mapSemanticDetailToTeachingAudience, projectTeachingForAudience, type TeachingAudiencePolicyLevel } from "./teaching-audience-policy.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

function compiled(scene: ScientificSceneSpec, capabilityId: string, mode: "show" | "explain" | "compare" | "why" | "misconceptionCorrection", timeline?: ScientificTimeline) {
  const capability = capabilityRegistryById.get(capabilityId); assert.ok(capability);
  const plan = compileTeachingPlan({ semanticIntent: { ...semanticIntentFixtures.rnaHairpin!, acts: [mode === "compare" ? "compare" : mode === "show" ? "show" : "explain"] }, scientificScene: scene, scientificTimeline: timeline, capability, teachingRequest: { schemaVersion: "1", requestMode: mode, audience: "intermediate", ...(mode === "misconceptionCorrection" ? { misconception: { outcome: "CORRECTION_REQUIRED", misconception: "incorrect model", correction: "grounded model" } } : {}) } });
  assert.ok(plan.ok); const program = compileTeachingChapterProgram(plan.plan, scene, timeline); assert.ok(program.ok); return { plan: plan.plan, program: program.program, scene, timeline };
}

function separationInput() {
  const scene = structuredClone(scientificSceneSpecFixtures["strand-separation"]!);
  scene.topology.changes = [{ changeId: "change-separation", kind: "separation", actorIds: scene.states[0]!.actorIds, interactionIds: ["opened-pair-1"] }];
  scene.states[0]!.topologyChangeIds = ["change-separation"];
  const actors = scene.states[0]!.actorIds;
  const timeline: ScientificTimeline = { schemaVersion: "1", timelineId: "audience-separation", clock: { duration: 2, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: scene.states[0]!.stateId, kind: "before", actorIds: actors }, { mechanismStateId: "after", scientificStateId: scene.states[0]!.stateId, kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] }], transitions: [{ transitionId: "opening", fromMechanismStateId: "before", toMechanismStateId: "after", start: .5, end: 1.5 }], events: [{ eventId: "separate", at: 1, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" }], tracks: [] };
  return { scene, timeline };
}

function project(value: ReturnType<typeof compiled>, audience: TeachingAudiencePolicyLevel, requestedDetail?: "OVERVIEW" | "STRUCTURAL" | "MECHANISTIC" | "MOLECULAR" | "LOCAL_CHEMISTRY") {
  const result = projectTeachingForAudience({ teachingPlan: value.plan, chapterProgram: value.program, audience, scene: value.scene, timeline: value.timeline, requestedDetail }); assert.ok(result.ok); return result.program;
}

test("A-D uses one canonical uppercase audience boundary over existing TeachingPlan projections", () => {
  const value = compiled(scientificSceneSpecFixtures["canonical-duplex"]!, "dna-canonical-structure", "show");
  for (const audience of ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const) assert.equal(project(value, audience).audience, audience);
  assert.equal(project(value, "ADVANCED").policy.terminologyLevel, "TECHNICAL");
  assert.equal(project(value, "BEGINNER").policy.terminologyLevel, "CONCEPTUAL");
  assert.equal(mapPresentationAudienceToTeachingAudience("expert"), "ADVANCED"); assert.equal(mapPresentationAudienceToTeachingAudience("student"), "INTERMEDIATE"); assert.equal(mapSemanticDetailToTeachingAudience("auto"), "INTERMEDIATE");
});

test("A-D static DNA, RNA hairpin, and comparison preserve science across audiences", () => {
  for (const value of [compiled(scientificSceneSpecFixtures["canonical-duplex"]!, "dna-canonical-structure", "show"), compiled(scientificSceneSpecFixtures.hairpin!, "rna-secondary-structure", "explain"), compiled(scientificSceneSpecFixtures["rna-dna-stability"]!, "rna-dna-chemistry-comparison", "compare")]) {
    const programs = (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((audience) => project(value, audience));
    assert.deepEqual(programs.map((program) => program.authoritativeRefs), [programs[0]!.authoritativeRefs, programs[1]!.authoritativeRefs, programs[2]!.authoritativeRefs]);
    assert.ok(programs[0]!.entries.every((entry) => entry.projectedDetail !== "LOCAL_CHEMISTRY"));
  }
});

test("A-D detail ceiling never upgrades unsupported detail and rejects explicit unavailable requests", () => {
  const value = compiled(scientificSceneSpecFixtures.hairpin!, "rna-secondary-structure", "explain");
  assert.equal(project(value, "ADVANCED").entries[0]!.projectedDetail, "STRUCTURAL");
  const result = projectTeachingForAudience({ teachingPlan: value.plan, chapterProgram: value.program, audience: "ADVANCED", requestedDetail: "LOCAL_CHEMISTRY" }); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "AUDIENCE_DETAIL_UNAVAILABLE");
});

test("A-D annotation density and causal depth vary without changing mode", () => {
  const { scene, timeline } = separationInput(); const value = compiled(scene, "dna-strand-separation", "why", timeline);
  const beginner = project(value, "BEGINNER"); const intermediate = project(value, "INTERMEDIATE"); const advanced = project(value, "ADVANCED");
  assert.equal(beginner.requestMode, "why"); assert.equal(intermediate.requestMode, "why"); assert.equal(advanced.requestMode, "why");
  assert.equal(beginner.policy.causalDepth, "CORE"); assert.equal(intermediate.policy.causalDepth, "CHAIN"); assert.equal(advanced.policy.causalDepth, "TOPOLOGY"); assert.ok(advanced.entries[0]!.authoritativeRefs.length >= beginner.entries[0]!.authoritativeRefs.length);
});

test("A-D temporal DNA separation and RNA cleavage preserve timeline IDs for all audiences", () => {
  const separation = separationInput(); const dna = compiled(separation.scene, "dna-strand-separation", "why", separation.timeline);
  for (const audience of ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const) { const result = project(dna, audience); assert.deepEqual(result.authoritativeRefs.filter((ref) => ref.kind.startsWith("timeline")), project(dna, "ADVANCED").authoritativeRefs.filter((ref) => ref.kind.startsWith("timeline"))); }
  const cleavageScene = scientificSceneSpecFixtures.cleavage!; const cleavageTimeline: ScientificTimeline = { schemaVersion: "1", timelineId: "audience-cleavage", clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before", states: [{ mechanismStateId: "before", scientificStateId: "rna-cleaved", kind: "before", actorIds: cleavageScene.states[0]!.actorIds }, { mechanismStateId: "after", scientificStateId: "rna-cleaved", kind: "after", actorIds: cleavageScene.states[0]!.actorIds, topologyChangeIds: ["change-rna-cleavage"] }], transitions: [{ transitionId: "cleavage-transition", fromMechanismStateId: "before", toMechanismStateId: "after", start: .2, end: .8 }], events: [{ eventId: "cleavage-event", at: .5, kind: "topologyChanged", actorIds: cleavageScene.states[0]!.actorIds, topologyChangeId: "change-rna-cleavage" }], tracks: [] };
  const cleavage = compiled(cleavageScene, "rna-cleavage", "explain", cleavageTimeline); for (const audience of ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const) assert.ok(project(cleavage, audience).authoritativeRefs.some((ref) => ref.kind === "timelineEvent"));
});

test("A-D SHOW stays identification-focused while WHY and COMPARE retain their modes", () => {
  const separation = separationInput(); const show = compiled(separation.scene, "dna-strand-separation", "show", separation.timeline); const why = compiled(separation.scene, "dna-strand-separation", "why", separation.timeline); assert.equal(project(show, "ADVANCED").requestMode, "show"); assert.equal(project(why, "ADVANCED").requestMode, "why");
  const comparison = compiled(scientificSceneSpecFixtures["rna-dna-stability"]!, "rna-dna-chemistry-comparison", "compare"); assert.equal(project(comparison, "BEGINNER").requestMode, "compare"); assert.equal(project(comparison, "ADVANCED").requestMode, "compare");
});

test("A-D misconception correction is structured, grounded, and audience-depth-specific", () => {
  const value = compiled(scientificSceneSpecFixtures["rna-dna-stability"]!, "rna-dna-chemistry-comparison", "misconceptionCorrection");
  const beginner = project(value, "BEGINNER"); const intermediate = project(value, "INTERMEDIATE"); const advanced = project(value, "ADVANCED");
  assert.deepEqual(beginner.correction?.steps.map((step) => step.kind), ["SURFACE_INCORRECT_MODEL", "FOCUS_GROUNDED_EVIDENCE", "STATE_CORRECT_MODEL", "REINFORCE_GROUNDED_RELATION"]);
  assert.equal(beginner.policy.misconceptionExplanationDepth, "MINIMAL"); assert.equal(intermediate.policy.misconceptionExplanationDepth, "RELATIONAL"); assert.equal(advanced.policy.misconceptionExplanationDepth, "CLAIM_LEVEL"); assert.ok(advanced.correction?.steps[1]!.provenanceRefs.length);
});

test("A-D correction safety preserves unsupported evidence and upstream fragmentation outcomes", () => {
  const value = compiled(scientificSceneSpecFixtures["rna-dna-stability"]!, "rna-dna-chemistry-comparison", "misconceptionCorrection"); const missing = structuredClone(value.plan); missing.misconceptionCorrection!.evidence = [{ kind: "source", sourceId: "missing-source" as never }]; const result = projectTeachingForAudience({ teachingPlan: missing, chapterProgram: value.program, audience: "BEGINNER" }); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "MISCONCEPTION_EVIDENCE_UNAVAILABLE");
  const fragmented = projectTeachingForAudience({ teachingPlan: value.plan, chapterProgram: value.program, audience: "BEGINNER", upstreamFailureCode: "FRAGMENTATION_UNGROUNDED" }); assert.equal(fragmented.ok, false); if (!fragmented.ok) assert.equal(fragmented.code, "FRAGMENTATION_UNGROUNDED");
});

test("A-D preserves dependencies, timeline, provenance, determinism, array invariance, and JSON serialization", () => {
  const separation = separationInput(); const value = compiled(separation.scene, "dna-strand-separation", "why", separation.timeline); const first = project(value, "ADVANCED"); const second = project({ ...value, plan: structuredClone(value.plan), program: structuredClone(value.program), scene: structuredClone(value.scene), timeline: structuredClone(value.timeline) }, "ADVANCED"); assert.deepEqual(second, first); const roundTrip = JSON.parse(JSON.stringify(first)); assert.deepEqual(roundTrip, first); assert.ok(first.entries.every((entry) => entry.dependsOn.every((dependency) => first.selectedChapterIds.includes(dependency)))); assert.ok(first.authoritativeRefs.some((ref) => ref.kind === "source"));
  const reorderedScene = structuredClone(separation.scene); reorderedScene.actors.reverse(); reorderedScene.topology.interactions.reverse(); reorderedScene.fidelityProvenance.sources.reverse(); const reorderedTimeline = structuredClone(separation.timeline); reorderedTimeline.states.reverse(); reorderedTimeline.events.reverse(); reorderedTimeline.transitions.reverse(); const reordered = compiled(reorderedScene, "dna-strand-separation", "why", reorderedTimeline); assert.deepEqual(project(reordered, "ADVANCED"), first);
});

test("A-D invalid dependency graphs return explicit failure", () => {
  const value = compiled(scientificSceneSpecFixtures.hairpin!, "rna-secondary-structure", "explain"); const invalid = structuredClone(value.program); invalid.entries[0]!.dependsOn = ["missing-chapter"]; const result = projectTeachingForAudience({ teachingPlan: value.plan, chapterProgram: invalid, audience: "BEGINNER" }); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "TEACHING_DEPENDENCY_INVALID");
});
