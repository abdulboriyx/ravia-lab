import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTeachingAtTime, serializeTeachingSnapshot, type TeachingCursorV1 } from "./teaching-snapshot.ts";
import type { AudienceTeachingProgramV1, AudienceTeachingProgramEntryV1 } from "./teaching-audience-policy.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

const state = (id: string): TeachingReference => ({ kind: "scientificState", stateId: id });
const event = (id: string): TeachingReference => ({ kind: "timelineEvent", timelineEventId: id });
const transition = (id: string): TeachingReference => ({ kind: "timelineTransition", timelineTransitionId: id });
const chapterRef = (id: string): TeachingReference => ({ kind: "timelineChapter", timelineChapterId: id });
const source = (id: string): TeachingReference => ({ kind: "source", sourceId: id as never });

function basePlan(mode: TeachingPlan["requestMode"] = "show", correction?: TeachingPlan["misconceptionCorrection"]): TeachingPlan {
  return { schemaVersion: "3", planId: `plan-${mode}`, sceneId: "scene-teaching", requestMode: mode, learningObjective: "Understand the grounded structure", prerequisiteAssumptions: [], chapters: [], projections: [{ audience: "beginner", chapterIds: [], revealedAnnotationIds: [] }, { audience: "intermediate", chapterIds: [], revealedAnnotationIds: [] }, { audience: "advanced", chapterIds: [], revealedAnnotationIds: [] }], ...(correction ? { misconceptionCorrection: correction } : {}) };
}

function entry(chapterId: string, order: number, role: AudienceTeachingProgramEntryV1["role"], refs: TeachingReference[], mapping?: { chapterIds: string[]; eventIds?: string[]; transitionIds?: string[] }, dependsOn: string[] = [], content: Partial<AudienceTeachingProgramEntryV1["disclosure"]> = {}): AudienceTeachingProgramEntryV1 {
  const disclosure = { primaryFocusRefs: refs, secondaryContextRefs: [], suppressedContextRefs: [], activeAnnotationIds: [], activeCausalStepIds: [], activeContrastIds: [], activeCorrectionIds: [], detail: "STRUCTURAL" as const, ...content };
  return { chapterId, order, role, dependsOn, ...(mapping ? { timelineMapping: { chapterIds: mapping.chapterIds, eventIds: mapping.eventIds ?? [], transitionIds: mapping.transitionIds ?? [] } } : {}), timelineRefs: [...refs, ...(mapping?.chapterIds ?? []).map(chapterRef), ...(mapping?.eventIds ?? []).map(event), ...(mapping?.transitionIds ?? []).map(transition)], disclosure, provenanceRefs: [source("source-main")], authoritativeRefs: [...refs, ...disclosure.secondaryContextRefs, ...disclosure.suppressedContextRefs, ...((mapping?.chapterIds ?? []).map(chapterRef)), ...((mapping?.eventIds ?? []).map(event)), ...((mapping?.transitionIds ?? []).map(transition)), source("source-main")], projectedDetail: "STRUCTURAL" };
}

function audience(plan: TeachingPlan, entries: AudienceTeachingProgramEntryV1[], level: AudienceTeachingProgramV1["audience"] = "INTERMEDIATE", correction?: AudienceTeachingProgramV1["correction"]): AudienceTeachingProgramV1 {
  return { schemaVersion: "1", audience: level, planId: plan.planId, sceneId: plan.sceneId, requestMode: plan.requestMode, policy: { terminologyLevel: level === "BEGINNER" ? "CONCEPTUAL" : level === "INTERMEDIATE" ? "STANDARD_SCIENTIFIC" : "TECHNICAL", explanationDepth: "STRUCTURED", disclosureDepth: "BALANCED", chemistryDepth: "MOLECULAR", mechanismGranularity: level === "ADVANCED" ? "FINE" : "STEPWISE", annotationDensity: "MEDIUM", contextRetention: "MEANINGFUL", causalDepth: "CHAIN", misconceptionExplanationDepth: "RELATIONAL", maximumDetail: "MECHANISTIC" }, selectedChapterIds: entries.map((item) => item.chapterId), compressedChapterIds: [], authoritativeRefs: entries.flatMap((item) => item.authoritativeRefs), entries, ...(correction ? { correction } : {}) };
}

function evaluate(entries: AudienceTeachingProgramEntryV1[], timeSeconds: number, options: { timeline?: ScientificTimeline; mode?: TeachingPlan["requestMode"]; cursor?: TeachingCursorV1; level?: AudienceTeachingProgramV1["audience"]; correction?: AudienceTeachingProgramV1["correction"] } = {}) {
  const plan = basePlan(options.mode ?? "show", options.correction ? { misconception: "wrong", correction: "right", chapterIds: entries.map((item) => item.chapterId), evidence: [state("evidence")] } : undefined);
  plan.chapters = entries.map((item) => ({ chapterId: item.chapterId, order: item.order, title: item.chapterId, focus: item.disclosure.primaryFocusRefs, narrationCueIds: [], annotationIds: [], causalStepIds: [], contrastIds: [], ...(item.role ? { chapterRole: item.role } : {}), ...(item.dependsOn.length ? { dependsOnChapterIds: item.dependsOn } : {}) }));
  plan.causalSteps = [...new Set(entries.flatMap((item) => item.disclosure.activeCausalStepIds))].map((stepId) => ({ stepId, order: 1, cause: state("cause"), effect: state("effect"), explanation: "grounded" }));
  plan.contrasts = [...new Set(entries.flatMap((item) => item.disclosure.activeContrastIds))].map((contrastId) => ({ contrastId, left: state("left"), right: state("right"), distinction: "grounded" }));
  plan.projections = [{ audience: "beginner", chapterIds: entries.map((item) => item.chapterId), revealedAnnotationIds: [] }, { audience: "intermediate", chapterIds: entries.map((item) => item.chapterId), revealedAnnotationIds: [] }, { audience: "advanced", chapterIds: entries.map((item) => item.chapterId), revealedAnnotationIds: [] }];
  return evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries }, audienceProgram: audience(plan, entries, options.level, options.correction), scientificTimeline: options.timeline, timeSeconds, cursor: options.cursor });
}

function makeTimeline(chapters: ScientificTimeline["chapters"], transitions: ScientificTimeline["transitions"] = [], events: ScientificTimeline["events"] = []): ScientificTimeline {
  return { schemaVersion: "1", timelineId: "timeline-teaching", clock: { duration: 4, unit: "seconds", timeStep: 1 / 60 }, initialMechanismStateId: "paired", states: [{ mechanismStateId: "paired", scientificStateId: "paired", kind: "before", actorIds: [] }, { mechanismStateId: "separated", scientificStateId: "separated", kind: "after", actorIds: [] }], transitions, events, tracks: [], chapters };
}

test("A-E static DNA, RNA hairpin, and comparison snapshots are reconstructable", () => {
  const staticEntries = [entry("identify", 1, "IDENTIFY", [state("dna-structure")]), entry("compare", 2, "COMPARE", [state("rna-structure")], undefined, ["identify"], { activeContrastIds: ["dna-rna"] })];
  const first = evaluate(staticEntries, 0);
  assert.equal(first.ok, true);
  if (first.ok) { assert.deepEqual(first.snapshot.activeChapterIds, ["identify"]); assert.equal(first.snapshot.timeSeconds, 0); assert.equal(first.snapshot.support.status, "SUPPORTED"); }
  const jumped = evaluate(staticEntries, 0, { mode: "compare", cursor: { schemaVersion: "1", mode: "MANUAL_CHAPTER", chapterId: "compare" } });
  assert.equal(jumped.ok, true); if (jumped.ok) assert.deepEqual(jumped.snapshot.activeContrastIds, ["dna-rna"]);
});

test("A-E static navigation is explicit, deterministic, and history-free", () => {
  const entries = [entry("one", 1, "IDENTIFY", [state("one")]), entry("two", 2, "FOCUS", [state("two")], undefined, ["one"]), entry("three", 3, "SUMMARIZE", [state("three")], undefined, ["two"])] as const;
  const cursor = (chapterId: string): TeachingCursorV1 => ({ schemaVersion: "1", mode: "MANUAL_CHAPTER", chapterId });
  const one = evaluate([...entries], 0, { cursor: cursor("one") }); const three = evaluate([...entries], 0, { cursor: cursor("three") }); const oneAgain = evaluate([...entries], 0, { cursor: cursor("one") }); const threeAgain = evaluate([...entries], 0, { cursor: cursor("three") });
  assert.equal(one.ok && three.ok && oneAgain.ok && threeAgain.ok, true); if (one.ok && three.ok && oneAgain.ok && threeAgain.ok) { assert.deepEqual(one.snapshot, oneAgain.snapshot); assert.deepEqual(three.snapshot, threeAgain.snapshot); assert.deepEqual(three.snapshot.activeChapterIds, ["one", "two", "three"]); }
});

test("A-E DNA separation follows authoritative timeline chapters and P3 boundary categories", () => {
  const entries = [entry("paired", 1, "IDENTIFY", [state("paired")], { chapterIds: ["paired"] }), entry("opening", 2, "CONNECT", [transition("opening")], { chapterIds: ["opening"], transitionIds: ["opening"] }, ["paired"]), entry("separation", 3, "CAUSE", [event("separation")], { chapterIds: ["separation"], eventIds: ["separation"] }, ["opening"]), entry("separated", 4, "SUMMARIZE", [state("separated")], { chapterIds: ["separated"] }, ["separation"] )];
  const tl = makeTimeline([{ chapterId: "paired", start: 0, end: 0.5 }, { chapterId: "opening", start: 0.5, end: 1 }, { chapterId: "separation", start: 1, end: 1.01 }, { chapterId: "separated", start: 1.01, end: 4 }], [{ transitionId: "opening", fromMechanismStateId: "paired", toMechanismStateId: "separated", start: 0.5, end: 1.5 }], [{ eventId: "separation", at: 1, kind: "topologyChanged", actorIds: [], topologyChangeId: "change-separation" }]);
  const at = (timeSeconds: number) => { const result = evaluate(entries, timeSeconds, { timeline: tl }); if (result.ok) return result.snapshot; throw new Error("evaluation failed"); };
  assert.deepEqual(at(0).activeChapterIds, ["paired"]);
  assert.deepEqual(at(0.75).activeChapterIds, ["paired", "opening"]);
  assert.deepEqual(at(1).activeChapterIds, ["paired", "opening", "separation"]);
  assert.deepEqual(at(2).activeChapterIds, ["paired", "opening", "separation", "separated"]);
  assert.deepEqual(at(1).timelineTraceRefs.filter((ref) => ref.kind === "timelineEvent"), [event("separation")]);
});

test("A-E RNA cleavage freezes before, event boundary, and after without fragmentation invention", () => {
  const entries = [entry("intact", 1, "IDENTIFY", [state("intact")], { chapterIds: ["intact"] }), entry("cleavage", 2, "CAUSE", [event("cleavage")], { chapterIds: ["cleavage"], eventIds: ["cleavage"] }, ["intact"]), entry("broken", 3, "SUMMARIZE", [state("broken-continuity")], { chapterIds: ["broken" ] }, ["cleavage"] )];
  const tl = makeTimeline([{ chapterId: "intact", start: 0, end: 1 }, { chapterId: "cleavage", start: 1, end: 1.01 }, { chapterId: "broken", start: 1.01, end: 4 }], [], [{ eventId: "cleavage", at: 1, kind: "topologyChanged", actorIds: [], topologyChangeId: "change-cleavage" }]);
  const before = evaluate(entries, 0.999, { timeline: tl }); const boundary = evaluate(entries, 1, { timeline: tl }); const after = evaluate(entries, 2, { timeline: tl });
  assert.equal(before.ok && before.snapshot.activeChapterIds.includes("cleavage"), false); assert.equal(boundary.ok && boundary.snapshot.activeChapterIds.includes("cleavage"), true); assert.equal(after.ok && after.snapshot.activeChapterIds.includes("broken"), true);
});

test("A-E audience, SHOW, WHY, COMPARE, and correction stages remain projected semantics", () => {
  const entries = [entry("wrong", 1, "CORRECT", [state("evidence")], undefined, [], { activeCorrectionIds: ["misconception-correction"], activeCausalStepIds: ["cause"] }), entry("evidence", 2, "CORRECT", [state("evidence")], undefined, ["wrong"], { activeCorrectionIds: ["misconception-correction"] }), entry("correct", 3, "CORRECT", [state("correct")], undefined, ["evidence"], { activeCorrectionIds: ["misconception-correction"] }), entry("reinforce", 4, "CORRECT", [state("correct")], undefined, ["correct"], { activeCorrectionIds: ["misconception-correction"] })];
  const correction = { misconception: "wrong", correction: "correct", steps: [{ stepId: "surface-incorrect-model", kind: "SURFACE_INCORRECT_MODEL", refs: [], provenanceRefs: [] }, { stepId: "focus-grounded-evidence", kind: "FOCUS_GROUNDED_EVIDENCE", refs: [state("evidence")], provenanceRefs: [source("source-main")] }, { stepId: "state-correct-model", kind: "STATE_CORRECT_MODEL", refs: [state("correct")], provenanceRefs: [source("source-main")] }, { stepId: "reinforce-grounded-relation", kind: "REINFORCE_GROUNDED_RELATION", refs: [state("correct")], provenanceRefs: [source("source-main")] }] } as const;
  const correctionResult = evaluate(entries, 0, { mode: "misconceptionCorrection", correction: correction as never }); assert.equal(correctionResult.ok, true); if (correctionResult.ok) assert.deepEqual(correctionResult.snapshot.activeCorrectionStageIds, ["surface-incorrect-model"]);
  const audiences = (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => evaluate([entry("show", 1, "IDENTIFY", [state("same")])], 0, { level }));
  assert.ok(audiences.every((result) => result.ok)); if (audiences.every((result): result is Extract<typeof result, { ok: true }> => result.ok)) assert.deepEqual(audiences.map((result) => result.snapshot.scientificTraceRefs), [audiences[0]!.snapshot.scientificTraceRefs, audiences[1]!.snapshot.scientificTraceRefs, audiences[2]!.snapshot.scientificTraceRefs]);
});

test("A-E direct, sequential, backward, restart, fps, and dropped-frame evaluation are equivalent", () => {
  const entries = [entry("a", 1, "IDENTIFY", [state("a")], { chapterIds: ["a"] }), entry("b", 2, "CAUSE", [state("b")], { chapterIds: ["b"] }, ["a"]), entry("c", 3, "SUMMARIZE", [state("c")], { chapterIds: ["c"] }, ["b"])];
  const tl = makeTimeline([{ chapterId: "a", start: 0, end: 1 }, { chapterId: "b", start: 1, end: 2 }, { chapterId: "c", start: 2, end: 4 }]);
  const snap = (timeSeconds: number) => { const result = evaluate(entries, timeSeconds, { timeline: tl }); if (result.ok) return result.snapshot; throw new Error("evaluation failed"); };
  const direct = snap(2.5); void snap(0.5); void snap(1.5); const replay = snap(2.5); assert.deepEqual(replay, direct); assert.deepEqual(snap(0.5), snap(0.5)); assert.deepEqual(snap(4), snap(4));
  for (const fps of [30, 60, 120]) { const t = 2.5; const samples = Array.from({ length: Math.floor(t * fps) + 1 }, (_, index) => index / fps); const sampled = snap(samples[samples.length - 1]!); assert.deepEqual(sampled, direct); }
  assert.deepEqual(snap(2.5), snap(2.5));
});

test("A-E failure outcomes cover missing timelines, invalid time, unsupported science, and content refs", () => {
  const temporalEntry = entry("temporal", 1, "CAUSE", [state("state")], { chapterIds: ["missing-chapter"] });
  const noTimeline = evaluate([temporalEntry], 0); assert.equal(noTimeline.ok, false); if (!noTimeline.ok) assert.equal(noTimeline.code, "TEACHING_TIMELINE_REQUIRED");
  const tl = makeTimeline([{ chapterId: "missing-chapter", start: 0, end: 1 }]); const invalid = evaluate([temporalEntry], Number.NaN, { timeline: tl }); assert.equal(invalid.ok, false); if (!invalid.ok) assert.equal(invalid.code, "TEACHING_TIME_INVALID");
  const fragmented = evaluate([entry("static", 1, "IDENTIFY", [state("state")])], 0); const fragmentedWithCode = evaluateTeachingAtTime({ teachingPlan: basePlan(), chapterProgram: { schemaVersion: "1", planId: "plan-show", sceneId: "scene-teaching", entries: [entry("static", 1, "IDENTIFY", [state("state")])] }, audienceProgram: audience(basePlan(), [entry("static", 1, "IDENTIFY", [state("state")])]), timeSeconds: 0, upstreamFailureCode: "FRAGMENTATION_UNGROUNDED" }); assert.equal(fragmented.ok, true); assert.equal(fragmentedWithCode.ok, false); if (!fragmentedWithCode.ok) assert.equal(fragmentedWithCode.code, "FRAGMENTATION_UNGROUNDED");
  const invalidContent = evaluate([{ ...entry("bad", 1, "IDENTIFY", [state("state")]), disclosure: { ...entry("bad", 1, "IDENTIFY", [state("state")]).disclosure, activeAnnotationIds: ["missing"] } }], 0); assert.equal(invalidContent.ok, false); if (!invalidContent.ok) assert.equal(invalidContent.code, "TEACHING_CONTENT_REFERENCE_INVALID");
  const outOfRange = evaluate([entry("x", 1, "IDENTIFY", [state("x")])], -1); assert.equal(outOfRange.ok, false); if (!outOfRange.ok) assert.equal(outOfRange.code, "TEACHING_TIME_INVALID");
});

test("A-E snapshots preserve provenance/trace refs, serialize, and ignore source array order", () => {
  const entries = [entry("one", 1, "IDENTIFY", [state("one"), source("source-main")])]; const result = evaluate(entries, 0); assert.equal(result.ok, true); if (!result.ok) return;
  assert.ok(result.snapshot.provenanceRefs.some((ref) => ref.kind === "source")); assert.ok(result.snapshot.scientificTraceRefs.some((ref) => ref.kind === "scientificState")); assert.deepEqual(JSON.parse(serializeTeachingSnapshot(result.snapshot)), result.snapshot);
  const reversed = evaluate([{ ...entries[0]!, authoritativeRefs: [...entries[0]!.authoritativeRefs].reverse(), disclosure: { ...entries[0]!.disclosure, primaryFocusRefs: [...entries[0]!.disclosure.primaryFocusRefs].reverse() } }], 0); assert.equal(reversed.ok, true); if (reversed.ok) assert.deepEqual(reversed.snapshot, result.snapshot);
});
