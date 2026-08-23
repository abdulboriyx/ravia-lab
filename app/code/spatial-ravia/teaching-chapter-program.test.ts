import assert from "node:assert/strict";
import test from "node:test";
import { capabilityRegistryById } from "./capability-registry.ts";
import { compileTeachingPlan, type TeachingCompileInput } from "./teaching-compiler.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { compileTeachingChapterProgram, type TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";

const actor = (id: string): TeachingReference => ({ kind: "actor", actorId: id as never });
const state = (id: string): TeachingReference => ({ kind: "scientificState", stateId: id });
const interaction = (id: string): TeachingReference => ({ kind: "interaction", interactionId: id as never });
const change = (id: string): TeachingReference => ({ kind: "topologyChange", topologyChangeId: id });
const timelineChapter = (id: string): TeachingReference => ({ kind: "timelineChapter", timelineChapterId: id });
const event = (id: string): TeachingReference => ({ kind: "timelineEvent", timelineEventId: id });
const transition = (id: string): TeachingReference => ({ kind: "timelineTransition", timelineTransitionId: id });
const source = (id: string): TeachingReference => ({ kind: "source", sourceId: id as never });

function separationScene(): ScientificSceneSpec {
  const scene = structuredClone(scientificSceneSpecFixtures["strand-separation"]!);
  scene.topology.changes = [{ changeId: "change-separation", kind: "separation", actorIds: scene.states[0]!.actorIds, interactionIds: ["opened-pair-1"] }];
  scene.states = [
    { ...scene.states[0]!, stateId: "paired", kind: "paired", interactionIds: ["opened-pair-1"] },
    { ...scene.states[0]!, stateId: "separated", kind: "open", topologyChangeIds: ["change-separation"] },
  ];
  return scene;
}

function separationTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  const actors = scene.states[0]!.actorIds;
  return {
    schemaVersion: "1", timelineId: "timeline-dna-separation", clock: { duration: 4, unit: "seconds" }, initialMechanismStateId: "paired-mechanism",
    states: [
      { mechanismStateId: "paired-mechanism", scientificStateId: "paired", kind: "before", actorIds: actors },
      { mechanismStateId: "opening-mechanism", scientificStateId: "paired", kind: "transition", actorIds: actors },
      { mechanismStateId: "separated-mechanism", scientificStateId: "separated", kind: "after", actorIds: actors, topologyChangeIds: ["change-separation"] },
    ],
    transitions: [
      { transitionId: "opening-transition", fromMechanismStateId: "paired-mechanism", toMechanismStateId: "opening-mechanism", start: 1, end: 2, eventIds: ["opening-event"] },
      { transitionId: "separation-transition", fromMechanismStateId: "opening-mechanism", toMechanismStateId: "separated-mechanism", start: 2, end: 3, eventIds: ["separation-event"] },
    ],
    events: [
      { eventId: "opening-event", at: 1.5, kind: "topologyChanged", actorIds: actors, interactionId: "opened-pair-1" },
      { eventId: "separation-event", at: 2.5, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-separation" },
      { eventId: "separated-state-event", at: 3, kind: "stateEntered", actorIds: actors, stateId: "separated" },
    ], tracks: [],
    chapters: [
      { chapterId: "paired-chapter", start: 0, end: 1, stateIds: ["paired"] },
      { chapterId: "opening-chapter", start: 1, end: 2, stateIds: ["paired"], transitionIds: ["opening-transition"], eventIds: ["opening-event"] },
      { chapterId: "separation-chapter", start: 2, end: 3, stateIds: ["separated"], transitionIds: ["separation-transition"], eventIds: ["separation-event"] },
      { chapterId: "separated-chapter", start: 3, end: 4, stateIds: ["separated"], eventIds: ["separated-state-event"] },
    ],
  };
}

function cleavageTimeline(scene: ScientificSceneSpec): ScientificTimeline {
  const actors = scene.states[0]!.actorIds;
  return {
    schemaVersion: "1", timelineId: "timeline-rna-cleavage", clock: { duration: 4, unit: "seconds" }, initialMechanismStateId: "intact-mechanism",
    states: [
      { mechanismStateId: "intact-mechanism", scientificStateId: "rna-cleaved", kind: "before", actorIds: actors },
      { mechanismStateId: "cleavage-mechanism", scientificStateId: "rna-cleaved", kind: "transition", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] },
      { mechanismStateId: "broken-mechanism", scientificStateId: "rna-cleaved", kind: "after", actorIds: actors, topologyChangeIds: ["change-rna-cleavage"] },
    ],
    transitions: [{ transitionId: "cleavage-transition", fromMechanismStateId: "intact-mechanism", toMechanismStateId: "cleavage-mechanism", start: 1, end: 2, eventIds: ["cleavage-event"] }],
    events: [{ eventId: "cleavage-event", at: 2, kind: "topologyChanged", actorIds: actors, topologyChangeId: "change-rna-cleavage" }], tracks: [],
    chapters: [{ chapterId: "cleavage-chapter", start: 0, end: 4, stateIds: ["rna-cleaved"], transitionIds: ["cleavage-transition"], eventIds: ["cleavage-event"] }],
  };
}

function planFor(scene: ScientificSceneSpec, chapters: TeachingPlan["chapters"], extras: Partial<TeachingPlan> = {}): TeachingPlan {
  return {
    schemaVersion: "3", planId: `program-${scene.sceneId}`, sceneId: scene.sceneId, requestMode: "why", learningObjective: "Explain the grounded mechanism.",
    objectiveTrace: { objectiveKind: "EXPLAIN_CAUSE", capabilityId: "test-capability", targetActorIds: [scene.actors[0]!.actorId], requestMode: "why" },
    prerequisiteAssumptions: [], chapters,
    annotations: [{ annotationId: "annotation-grounded", kind: "causal", target: actor(scene.actors[0]!.actorId), text: "Grounded evidence." }],
    ...(scene.topology.changes?.[0] ? { causalSteps: [{ stepId: "cause-grounded", order: 1, cause: interaction(scene.topology.interactions[0]!.interactionId), effect: change(scene.topology.changes[0].changeId), explanation: "Grounded causal relationship." }] } : {}),
    contrasts: [{ contrastId: "contrast-grounded", left: actor(scene.actors[0]!.actorId), right: actor(scene.actors[1]!.actorId), distinction: "Grounded distinction." }],
    projections: (["beginner", "intermediate", "advanced"] as const).map((audience) => ({ audience, chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["annotation-grounded"] })),
    ...extras,
  };
}

function chapter(chapterId: string, order: number, primaryFocusRefs: TeachingReference[], options: Partial<NonNullable<TeachingPlan["chapters"][number]>> = {}): TeachingPlan["chapters"][number] {
  return {
    chapterId, order, title: chapterId, focus: primaryFocusRefs, chapterRole: "FOCUS", dependsOnChapterIds: order > 1 ? [`${order === 2 ? "paired" : order === 3 ? "opening" : "separation"}-chapter`] : [],
    disclosure: { primaryFocusRefs, secondaryContextRefs: [], suppressedContextRefs: [], detail: "STRUCTURAL" }, ...options,
  };
}

function realSeparationPlan(): { scene: ScientificSceneSpec; timeline: ScientificTimeline; plan: TeachingPlan } {
  const scene = separationScene(); const timeline = separationTimeline(scene); const actors = scene.states[0]!.actorIds;
  const plan = planFor(scene, [
    chapter("paired-chapter", 1, [state("paired"), actor(actors[0]!)], { chapterRole: "FOCUS", dependsOnChapterIds: [], disclosure: { primaryFocusRefs: [state("paired")], secondaryContextRefs: [actor(actors[0]!)], suppressedContextRefs: [], detail: "OVERVIEW" }, timelineMapping: { chapterIds: ["paired-chapter"], eventIds: [], transitionIds: [] } }),
    chapter("opening-chapter", 2, [interaction("opened-pair-1"), transition("opening-transition")], { chapterRole: "CAUSE", disclosure: { primaryFocusRefs: [interaction("opened-pair-1"), transition("opening-transition")], secondaryContextRefs: [state("paired")], suppressedContextRefs: [], detail: "MECHANISTIC" }, timelineMapping: { chapterIds: ["opening-chapter"], eventIds: ["opening-event"], transitionIds: ["opening-transition"] } }),
    chapter("separation-chapter", 3, [change("change-separation"), event("separation-event")], { chapterRole: "CAUSE", causalStepIds: ["cause-grounded"], disclosure: { primaryFocusRefs: [change("change-separation"), event("separation-event")], secondaryContextRefs: [state("paired")], suppressedContextRefs: [actor(actors[0]!)], detail: "MOLECULAR" }, timelineMapping: { chapterIds: ["separation-chapter"], eventIds: ["separation-event"], transitionIds: ["separation-transition"] } }),
    chapter("separated-chapter", 4, [state("separated")], { chapterRole: "SUMMARIZE", disclosure: { primaryFocusRefs: [state("separated")], secondaryContextRefs: [change("change-separation")], suppressedContextRefs: [], detail: "STRUCTURAL" }, timelineMapping: { chapterIds: ["separated-chapter"], eventIds: ["separated-state-event"], transitionIds: [] } }),
  ]);
  return { scene, timeline, plan };
}

test("A-C static DNA, RNA hairpin, and DNA/RNA comparison require no timeline", () => {
  const inputs: TeachingCompileInput[] = [
    { semanticIntent: { ...semanticIntentFixtures.rnaHairpin!, acts: ["show"] }, scientificScene: scientificSceneSpecFixtures["canonical-duplex"]!, capability: capabilityRegistryById.get("dna-canonical-structure")!, teachingRequest: { schemaVersion: "1", requestMode: "show", audience: "intermediate" } },
    { semanticIntent: { ...semanticIntentFixtures.rnaHairpin!, acts: ["explain"] }, scientificScene: scientificSceneSpecFixtures.hairpin!, capability: capabilityRegistryById.get("rna-secondary-structure")!, teachingRequest: { schemaVersion: "1", requestMode: "explain", audience: "intermediate" } },
    { semanticIntent: { ...semanticIntentFixtures.rnaHairpin!, acts: ["compare"] }, scientificScene: scientificSceneSpecFixtures["rna-dna-stability"]!, capability: capabilityRegistryById.get("rna-dna-chemistry-comparison")!, teachingRequest: { schemaVersion: "1", requestMode: "compare", audience: "intermediate" } },
  ];
  for (const input of inputs) { const plan = compileTeachingPlan(input); assert.ok(plan.ok); if (plan.ok) { const program = compileTeachingChapterProgram(plan.plan, input.scientificScene); assert.ok(program.ok); if (program.ok) assert.ok(program.program.entries.every((entry) => entry.timelineRefs.length === 0)); } }
});

test("A-C DNA separation temporal chapters use authoritative states, events, transitions, topology, dependencies, and disclosure", () => {
  const { scene, timeline, plan } = realSeparationPlan(); const result = compileTeachingChapterProgram(plan, scene, timeline); assert.ok(result.ok); if (!result.ok) return;
  assert.deepEqual(result.program.entries.map((entry) => entry.chapterId), ["paired-chapter", "opening-chapter", "separation-chapter", "separated-chapter"]);
  assert.ok(result.program.entries.every((entry) => entry.timelineMapping)); assert.deepEqual(result.program.entries[2]!.dependsOn, ["opening-chapter"]);
  assert.ok(result.program.entries[2]!.timelineRefs.some((ref) => ref.kind === "timelineEvent")); assert.equal(result.program.entries[2]!.disclosure.suppressedContextRefs.length, 1);
});

test("A-C RNA cleavage temporal chapters remain authoritative and do not invent fragmentation", () => {
  const scene = scientificSceneSpecFixtures.cleavage!; const timeline = cleavageTimeline(scene); const actors = scene.states[0]!.actorIds;
  const plan = planFor(scene, [
    chapter("intact-chapter", 1, [actor(actors[0]!), state("rna-cleaved")], { chapterRole: "FOCUS", dependsOnChapterIds: [], timelineMapping: { chapterIds: ["cleavage-chapter"], eventIds: [], transitionIds: [] } }),
    chapter("cleavage-event-chapter", 2, [event("cleavage-event"), change("change-rna-cleavage")], { chapterRole: "CAUSE", dependsOnChapterIds: ["intact-chapter"], timelineMapping: { chapterIds: ["cleavage-chapter"], eventIds: ["cleavage-event"], transitionIds: ["cleavage-transition"] } }),
    chapter("broken-continuity-chapter", 3, [interaction("fragment-relation"), change("change-rna-cleavage")], { chapterRole: "EXPLAIN", dependsOnChapterIds: ["cleavage-event-chapter"], timelineMapping: { chapterIds: ["cleavage-chapter"], eventIds: ["cleavage-event"], transitionIds: [] } }),
    chapter("post-cleavage-chapter", 4, [state("rna-cleaved"), interaction("fragment-relation")], { chapterRole: "SUMMARIZE", dependsOnChapterIds: ["broken-continuity-chapter"], timelineMapping: { chapterIds: ["cleavage-chapter"], eventIds: [], transitionIds: [] } }),
  ]);
  const result = compileTeachingChapterProgram(plan, scene, timeline); assert.ok(result.ok); if (result.ok) assert.ok(result.program.entries.every((entry) => entry.disclosure.primaryFocusRefs.every((ref) => ref.kind !== "topologyChange" || ref.topologyChangeId === "change-rna-cleavage")));
});

test("A-C show and why preserve scientific truth while changing pedagogy", () => {
  const { scene, timeline, plan } = realSeparationPlan();
  const show = compileTeachingChapterProgram({ ...plan, requestMode: "show", chapters: [plan.chapters[0]!], projections: plan.projections.map((projection) => ({ ...projection, chapterIds: [plan.chapters[0]!.chapterId] })) }, scene, timeline);
  const why = compileTeachingChapterProgram(plan, scene, timeline); assert.ok(show.ok); assert.ok(why.ok); if (show.ok && why.ok) { assert.equal(show.program.sceneId, why.program.sceneId); assert.notDeepEqual(show.program.entries.map((entry) => entry.role), why.program.entries.map((entry) => entry.role)); assert.deepEqual(show.program.entries[0]!.disclosure.primaryFocusRefs, why.program.entries[0]!.disclosure.primaryFocusRefs); }
});

test("A-C progressive disclosure preserves suppressed science and activates content IDs", () => {
  const { scene, timeline, plan } = realSeparationPlan(); const result = compileTeachingChapterProgram({ ...plan, misconceptionCorrection: { misconception: "The strands disappear.", correction: "The strands persist while pairing changes.", chapterIds: ["separated-chapter"], evidence: [source("canonical-model")] } }, scene, timeline); assert.ok(result.ok); if (result.ok) { const entry = result.program.entries[3]!; assert.deepEqual(entry.disclosure.suppressedContextRefs, []); assert.deepEqual(entry.disclosure.activeCorrectionIds, ["misconception-correction"]); assert.ok(result.program.entries[2]!.disclosure.suppressedContextRefs.length > 0); }
});

test("A-C dependency graph is explicit, non-linear, topologically deterministic, and cycle-safe", () => {
  const scene = scientificSceneSpecFixtures.hairpin!; const base = planFor(scene, [chapter("foundation", 1, [actor(scene.actors[0]!.actorId)], { chapterRole: "IDENTIFY", dependsOnChapterIds: [] }), chapter("cause", 2, [state(scene.states[0]!.stateId)], { chapterRole: "CAUSE", dependsOnChapterIds: ["foundation"] }), chapter("evidence", 3, [actor(scene.actors[1]!.actorId)], { chapterRole: "EXPLAIN", dependsOnChapterIds: ["foundation"] }), chapter("synthesis", 4, [state(scene.states[0]!.stateId)], { chapterRole: "SUMMARIZE", dependsOnChapterIds: ["cause", "evidence"] })]);
  const result = compileTeachingChapterProgram(base, scene); assert.ok(result.ok); if (result.ok) assert.deepEqual(result.program.entries.map((entry) => entry.chapterId), ["foundation", "cause", "evidence", "synthesis"]);
  const cycle = structuredClone(base); cycle.chapters[0]!.dependsOnChapterIds = ["synthesis"]; const failed = compileTeachingChapterProgram(cycle, scene); assert.equal(failed.ok, false); if (!failed.ok) assert.equal(failed.code, "TEACHING_CHAPTER_DEPENDENCY_CYCLE");
});

test("A-C disclosure conflict and missing scientific/timeline/content targets fail explicitly", () => {
  const { scene, timeline, plan } = realSeparationPlan();
  const conflict = structuredClone(plan); conflict.chapters[2]!.disclosure!.suppressedContextRefs = [conflict.chapters[2]!.disclosure!.primaryFocusRefs[0]!]; const conflictResult = compileTeachingChapterProgram(conflict, scene, timeline); assert.equal(conflictResult.ok, false); if (!conflictResult.ok) assert.equal(conflictResult.code, "TEACHING_DISCLOSURE_CONFLICT");
  for (const [label, ref] of [["actor", actor("missing-actor")], ["state", state("missing-state")], ["interaction", interaction("missing-interaction")], ["topology", change("missing-change")], ["timeline chapter", timelineChapter("missing-chapter")], ["event", event("missing-event")], ["transition", transition("missing-transition")]] as const) {
    const invalid = structuredClone(plan); invalid.chapters[0]!.focus = [ref]; invalid.chapters[0]!.disclosure!.primaryFocusRefs = [ref]; const result = compileTeachingChapterProgram(invalid, scene, timeline); assert.equal(result.ok, false, label);
  }
  const missingContent = structuredClone(plan); missingContent.chapters[0]!.annotationIds = ["missing-annotation"]; const contentResult = compileTeachingChapterProgram(missingContent, scene, timeline); assert.equal(contentResult.ok, false);
});

test("A-C timeline and scientific array order do not affect chapter semantics", () => {
  const { scene, timeline, plan } = realSeparationPlan(); const first = compileTeachingChapterProgram(plan, scene, timeline); assert.ok(first); const reorderedScene = structuredClone(scene); reorderedScene.actors.reverse(); reorderedScene.topology.interactions.reverse(); reorderedScene.fidelityProvenance.sources.reverse(); const reorderedTimeline = structuredClone(timeline); reorderedTimeline.states.reverse(); reorderedTimeline.events.reverse(); reorderedTimeline.transitions.reverse(); reorderedTimeline.chapters?.reverse(); const second = compileTeachingChapterProgram(plan, reorderedScene, reorderedTimeline); assert.deepEqual(second, first);
});

test("A-C chapter IDs, roles, dependencies, mappings, disclosure, active content, and serialization are deterministic", () => {
  const { scene, timeline, plan } = realSeparationPlan(); const one = compileTeachingChapterProgram(plan, scene, timeline); const two = compileTeachingChapterProgram(structuredClone(plan), structuredClone(scene), structuredClone(timeline)); assert.deepEqual(two, one); assert.ok(one.ok); if (one.ok) { const roundTrip = JSON.parse(JSON.stringify(one.program)) as TeachingChapterProgramV1; assert.deepEqual(roundTrip, one.program); assert.ok(roundTrip.entries.every((entry) => entry.provenanceRefs)); }
});

test("A-C comparison and misconception disclosure use existing structured content without reinference", () => {
  const scene = scientificSceneSpecFixtures["rna-dna-stability"]!; const comparison = compileTeachingPlan({ semanticIntent: { ...semanticIntentFixtures.rnaHairpin!, acts: ["compare"] }, scientificScene: scene, capability: capabilityRegistryById.get("rna-dna-chemistry-comparison")!, teachingRequest: { schemaVersion: "1", requestMode: "compare", audience: "intermediate" } }); assert.ok(comparison.ok); if (comparison.ok) { const program = compileTeachingChapterProgram(comparison.plan, scene); assert.ok(program.ok); if (program.ok) assert.ok(program.program.entries.some((entry) => entry.disclosure.activeContrastIds.includes("contrast-grounded-comparison"))); }
  const correction = compileTeachingPlan({ semanticIntent: { ...semanticIntentFixtures.rnaHairpin!, acts: ["explain"] }, scientificScene: scene, capability: capabilityRegistryById.get("rna-dna-chemistry-comparison")!, teachingRequest: { schemaVersion: "1", requestMode: "misconceptionCorrection", audience: "intermediate", misconception: { outcome: "CORRECTION_REQUIRED", misconception: "DNA is indestructible.", correction: "DNA remains chemically reactive." } } }); assert.ok(correction.ok); if (correction.ok) { const program = compileTeachingChapterProgram(correction.plan, scene); assert.ok(program.ok); if (program.ok) assert.ok(program.program.entries.some((entry) => entry.disclosure.activeCorrectionIds.length > 0)); }
});

test("A-C supports every bounded detail vocabulary and keeps scientific plans unchanged", () => {
  const { scene, timeline, plan } = realSeparationPlan(); for (const detail of ["OVERVIEW", "STRUCTURAL", "MECHANISTIC", "MOLECULAR", "LOCAL_CHEMISTRY"] as const) { const copy = structuredClone(plan); copy.chapters[0]!.disclosure!.detail = detail; const result = compileTeachingChapterProgram(copy, scene, timeline); assert.ok(result.ok, detail); if (result.ok) assert.equal(result.program.entries[0]!.disclosure.detail, detail); } const before = JSON.stringify(plan); compileTeachingChapterProgram(plan, scene, timeline); assert.equal(JSON.stringify(plan), before);
});
