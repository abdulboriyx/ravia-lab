import assert from "node:assert/strict";
import test from "node:test";
import { buildTeachingTextBundle, deserializeNarrationCueProgram, deserializeTeachingTextBundle, resolveNarrationAtSnapshot, serializeNarrationCueProgram, serializeTeachingTextBundle, validateTeachingWordingProviderOutput, type CaptionSegmentV1, type NarrationCueProgramV1 } from "./teaching-text.ts";
import type { AudienceTeachingProgramEntryV1, AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import { evaluateTeachingAtTime, type TeachingSnapshotV1 } from "./teaching-snapshot.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

const state = (id: string): TeachingReference => ({ kind: "scientificState", stateId: id });
const actor = (id: string): TeachingReference => ({ kind: "actor", actorId: id as never });
const source = (id: string): TeachingReference => ({ kind: "source", sourceId: id as never });
const event = (id: string): TeachingReference => ({ kind: "timelineEvent", timelineEventId: id });

function entry(id = "chapter-main", order = 1, refs: TeachingReference[] = [state("paired")], mode: "show" | "explain" | "why" | "compare" | "misconceptionCorrection" = "show"): AudienceTeachingProgramEntryV1 {
  return { chapterId: id, order, role: mode === "why" ? "CAUSE" : mode === "compare" ? "COMPARE" : mode === "misconceptionCorrection" ? "CORRECT" : mode === "explain" ? "EXPLAIN" : "IDENTIFY", dependsOn: [], timelineRefs: [], disclosure: { primaryFocusRefs: refs, secondaryContextRefs: [], suppressedContextRefs: [], activeAnnotationIds: mode === "show" ? ["annotation-main"] : [], activeCausalStepIds: mode === "why" ? ["cause-main"] : [], activeContrastIds: mode === "compare" ? ["contrast-main"] : [], activeCorrectionIds: mode === "misconceptionCorrection" ? ["misconception-correction"] : [], detail: "STRUCTURAL" }, provenanceRefs: [source("source-main")], authoritativeRefs: [...refs, source("source-main")], projectedDetail: "STRUCTURAL" };
}

function plan(mode: TeachingPlan["requestMode"] = "show", chapters: AudienceTeachingProgramEntryV1[] = [entry("chapter-main", 1, [state("paired")], mode)]): TeachingPlan {
  return { schemaVersion: "3", planId: `plan-${mode}`, sceneId: "scene-text", requestMode: mode, learningObjective: "Understand the grounded teaching target", objectiveTrace: { objectiveKind: mode === "why" ? "EXPLAIN_CAUSE" : mode === "compare" ? "COMPARE" : mode === "misconceptionCorrection" ? "CORRECT_MISCONCEPTION" : "IDENTIFY", capabilityId: "capability-text", phenomenon: "the grounded structure", targetActorIds: [], requestMode: mode }, prerequisiteAssumptions: [], chapters: chapters.map((item) => ({ chapterId: item.chapterId, order: item.order, title: item.chapterId, focus: item.disclosure.primaryFocusRefs, narrationCueIds: [`cue-${item.chapterId}`], annotationIds: item.disclosure.activeAnnotationIds, causalStepIds: item.disclosure.activeCausalStepIds, contrastIds: item.disclosure.activeContrastIds, chapterRole: item.role, ...(item.dependsOn.length ? { dependsOnChapterIds: item.dependsOn } : {}), ...(item.timelineMapping ? { timelineMapping: item.timelineMapping } : {}) })), annotations: [{ annotationId: "annotation-main", kind: "identity", target: state("paired"), text: "The paired state is the current grounded focus." }], causalSteps: [{ stepId: "cause-main", order: 1, cause: state("paired"), effect: state("opened"), explanation: "The grounded sequence links the paired state to the opening state." }], contrasts: [{ contrastId: "contrast-main", left: state("dna"), right: state("rna"), distinction: "The structured comparison records a difference between the two targets." }], projections: [{ audience: "beginner", chapterIds: chapters.map((item) => item.chapterId), revealedAnnotationIds: [] }, { audience: "intermediate", chapterIds: chapters.map((item) => item.chapterId), revealedAnnotationIds: [] }, { audience: "advanced", chapterIds: chapters.map((item) => item.chapterId), revealedAnnotationIds: [] }], ...(mode === "misconceptionCorrection" ? { misconceptionCorrection: { misconception: "The incorrect model", correction: "The grounded model", chapterIds: chapters.map((item) => item.chapterId), evidence: [state("evidence")] } } : {}) };
}

function audience(planValue: TeachingPlan, entries: AudienceTeachingProgramEntryV1[], level: AudienceTeachingProgramV1["audience"] = "INTERMEDIATE", correction?: AudienceTeachingProgramV1["correction"]): AudienceTeachingProgramV1 {
  return { schemaVersion: "1", audience: level, planId: planValue.planId, sceneId: planValue.sceneId, requestMode: planValue.requestMode, policy: { terminologyLevel: level === "BEGINNER" ? "CONCEPTUAL" : level === "INTERMEDIATE" ? "STANDARD_SCIENTIFIC" : "TECHNICAL", explanationDepth: level === "BEGINNER" ? "CORE" : level === "INTERMEDIATE" ? "STRUCTURED" : "EVIDENCE_RICH", disclosureDepth: "BALANCED", chemistryDepth: "MOLECULAR", mechanismGranularity: "STEPWISE", annotationDensity: "MEDIUM", contextRetention: "MEANINGFUL", causalDepth: "CHAIN", misconceptionExplanationDepth: "RELATIONAL", maximumDetail: "MECHANISTIC" }, selectedChapterIds: entries.map((item) => item.chapterId), compressedChapterIds: [], authoritativeRefs: entries.flatMap((item) => item.authoritativeRefs), entries, ...(correction ? { correction } : {}) };
}

function snapshotFor(mode: TeachingPlan["requestMode"] = "show", entries = [entry("chapter-main", 1, [state("paired")], mode)], level: AudienceTeachingProgramV1["audience"] = "INTERMEDIATE", timeline?: ScientificTimeline, correction?: AudienceTeachingProgramV1["correction"], timeSeconds = 0): { plan: TeachingPlan; audience: AudienceTeachingProgramV1; snapshot: TeachingSnapshotV1 } {
  const teachingPlan = plan(mode, entries); const audienceProgram = audience(teachingPlan, entries, level, correction); const evaluated = evaluateTeachingAtTime({ teachingPlan, chapterProgram: { schemaVersion: "1", planId: teachingPlan.planId, sceneId: teachingPlan.sceneId, entries }, audienceProgram, scientificTimeline: timeline, timeSeconds }); if (evaluated.ok) return { plan: teachingPlan, audience: audienceProgram, snapshot: evaluated.snapshot }; throw new Error("snapshot evaluation failed");
}

function build(value: ReturnType<typeof snapshotFor>): Extract<ReturnType<typeof buildTeachingTextBundle>, { ok: true }> { const result = buildTeachingTextBundle({ snapshot: value.snapshot, teachingPlan: value.plan, audienceProgram: value.audience }); if (result.ok) return result; throw new Error("text bundle failed"); }

test("A-F generates bounded DNA wording across all audiences with equivalent science refs", () => {
  const results = (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => build(snapshotFor("show", [entry("dna", 1, [actor("dna-strand")])], level)));
  assert.ok(results.every((result) => result.bundle.support.status === "SUPPORTED"));
  assert.notEqual(results[0]!.bundle.learningObjectiveText, results[2]!.bundle.learningObjectiveText);
  assert.deepEqual(results.map((result) => result.bundle.explanationSegments[0]!.targetRefs), [results[0]!.bundle.explanationSegments[0]!.targetRefs, results[1]!.bundle.explanationSegments[0]!.targetRefs, results[2]!.bundle.explanationSegments[0]!.targetRefs]);
});

test("A-F RNA hairpin wording includes deterministic title, annotation, and no unsupported causal claim", () => {
  const value = build(snapshotFor("show", [entry("hairpin", 1, [state("hairpin-folded")])]));
  assert.equal(value.bundle.chapterTitle, "IDENTIFY: Hairpin Folded"); assert.equal(value.bundle.annotationText.length, 1); assert.equal(value.bundle.causalText.length, 0); assert.ok(value.bundle.segments.every((segment) => segment.text.length <= 640));
});

test("A-F WHY wording exposes only active grounded causal content", () => {
  const value = build(snapshotFor("why", [entry("why", 1, [state("paired")], "why")]));
  assert.equal(value.bundle.causalText.length, 1); assert.match(value.bundle.causalText[0]!.text, /grounded sequence/); assert.ok(value.bundle.narrationSegments.some((segment) => segment.kind === "NARRATION"));
  const show = build(snapshotFor("show", [entry("show", 1, [state("paired")], "show")])); assert.equal(show.bundle.causalText.length, 0); assert.equal(show.bundle.requestMode, "show");
});

test("A-F DNA separation and RNA cleavage wording follows exact mapped stages", () => {
  const stages = [entry("paired", 1, [state("paired")], "why"), entry("opening", 2, [state("opening")], "why"), entry("separation", 3, [event("separation")], "why"), entry("separated", 4, [state("separated")], "why")];
  stages[0]!.timelineMapping = { chapterIds: ["paired"], eventIds: [], transitionIds: [] }; stages[1]!.timelineMapping = { chapterIds: ["opening"], eventIds: [], transitionIds: [] }; stages[2]!.timelineMapping = { chapterIds: ["separation"], eventIds: ["separation"], transitionIds: [] }; stages[3]!.timelineMapping = { chapterIds: ["separated"], eventIds: [], transitionIds: [] };
  stages[1]!.dependsOn = ["paired"]; stages[2]!.dependsOn = ["opening"]; stages[3]!.dependsOn = ["separation"]; stages[0]!.disclosure.activeCausalStepIds = []; stages[1]!.disclosure.activeCausalStepIds = []; stages[3]!.disclosure.activeCausalStepIds = [];
  const temporal: ScientificTimeline = { schemaVersion: "1", timelineId: "timeline-separation", clock: { duration: 4, unit: "seconds" }, initialMechanismStateId: "paired", states: [], transitions: [], events: [{ eventId: "separation", at: 2, kind: "topologyChanged", actorIds: [], topologyChangeId: "change-separation" }], tracks: [], chapters: [{ chapterId: "paired", start: 0, end: 1 }, { chapterId: "opening", start: 1, end: 2 }, { chapterId: "separation", start: 2, end: 2.1 }, { chapterId: "separated", start: 2.1, end: 4 }] };
  const before = snapshotFor("why", stages, "INTERMEDIATE", temporal, undefined, 0.5); const boundary = snapshotFor("why", stages, "INTERMEDIATE", temporal, undefined, 2); const after = snapshotFor("why", stages, "INTERMEDIATE", temporal, undefined, 3);
  const beforeText = buildTeachingTextBundle({ snapshot: before.snapshot, teachingPlan: before.plan, audienceProgram: before.audience, context: { timeline: temporal } }); const boundaryText = buildTeachingTextBundle({ snapshot: boundary.snapshot, teachingPlan: boundary.plan, audienceProgram: boundary.audience, context: { timeline: temporal } }); const afterText = buildTeachingTextBundle({ snapshot: after.snapshot, teachingPlan: after.plan, audienceProgram: after.audience, context: { timeline: temporal } });
  assert.equal(beforeText.ok && beforeText.bundle.causalText.length, 0); assert.equal(boundaryText.ok, true); assert.ok(afterText.ok && afterText.bundle.explanationSegments.some((segment) => segment.targetRefs.some((ref) => ref.kind === "scientificState" && ref.stateId === "separated")));
  const cleavage = entry("cleavage", 1, [event("cleavage")], "explain"); cleavage.timelineMapping = { chapterIds: ["cleavage"], eventIds: ["cleavage"], transitionIds: [] }; const cleavageTimeline: ScientificTimeline = { ...temporal, timelineId: "timeline-cleavage", events: [{ eventId: "cleavage", at: 1, kind: "topologyChanged", actorIds: [], topologyChangeId: "change-cleavage" }], chapters: [{ chapterId: "cleavage", start: 0, end: 4 }] }; const cleavageValue = snapshotFor("explain", [cleavage], "INTERMEDIATE", cleavageTimeline, undefined, 1); const cleavageText = buildTeachingTextBundle({ snapshot: cleavageValue.snapshot, teachingPlan: cleavageValue.plan, audienceProgram: cleavageValue.audience, context: { timeline: cleavageTimeline } }); assert.equal(cleavageText.ok, true);
});

test("A-F comparison wording derives from TeachingContrast and misconception wording uses all four stages", () => {
  const compare = build(snapshotFor("compare", [entry("compare", 1, [state("dna")], "compare")])); assert.equal(compare.bundle.contrastText.length, 1); assert.match(compare.bundle.contrastText[0]!.text, /structured comparison/);
  const correctionEntries = [entry("wrong", 1, [state("evidence")], "misconceptionCorrection"), entry("evidence", 2, [state("evidence")], "misconceptionCorrection"), entry("correct", 3, [state("correct")], "misconceptionCorrection"), entry("reinforce", 4, [state("correct")], "misconceptionCorrection")]; correctionEntries.forEach((item, index) => { item.dependsOn = index ? [correctionEntries[index - 1]!.chapterId] : []; });
  const correction = { misconception: "The incorrect model", correction: "The grounded model", steps: [{ stepId: "surface-incorrect-model", kind: "SURFACE_INCORRECT_MODEL", sourceText: "The incorrect model", refs: [], provenanceRefs: [] }, { stepId: "focus-grounded-evidence", kind: "FOCUS_GROUNDED_EVIDENCE", refs: [state("evidence")], provenanceRefs: [source("source-main")] }, { stepId: "state-correct-model", kind: "STATE_CORRECT_MODEL", sourceText: "The grounded model", refs: [state("correct")], provenanceRefs: [source("source-main")] }, { stepId: "reinforce-grounded-relation", kind: "REINFORCE_GROUNDED_RELATION", refs: [state("correct")], provenanceRefs: [source("source-main")] }] } as const;
  const value = snapshotFor("misconceptionCorrection", correctionEntries, "INTERMEDIATE", undefined, correction as never); const result = buildTeachingTextBundle({ snapshot: { ...value.snapshot, activeCorrectionStageIds: correction.steps.map((step) => step.stepId) }, teachingPlan: value.plan, audienceProgram: audience(value.plan, correctionEntries, "INTERMEDIATE", correction as never) }); assert.equal(result.ok, true); if (result.ok) { assert.equal(result.bundle.correctionText.length, 4); assert.deepEqual(result.bundle.correctionText.map((segment) => segment.provenanceRefs.length > 0), [false, true, true, true]); }
});

test("A-F narration cues and captions are exact-time activation hooks, not an audio engine", () => {
  const raw = snapshotFor("why", [entry("chapter", 1, [event("separation")], "why")]); const value = build(raw); assert.ok(value.narration.cues.length); assert.ok(value.narration.captionSegments.every((segment: CaptionSegmentV1) => segment.cueId));
  const active = resolveNarrationAtSnapshot(raw.snapshot, value.narration); assert.equal(active.length, value.narration.cues.length); assert.ok(active.every((cue) => cue.chapterId === "chapter"));
  assert.deepEqual(deserializeNarrationCueProgram(serializeNarrationCueProgram(value.narration)), value.narration); assert.deepEqual(deserializeTeachingTextBundle(serializeTeachingTextBundle(value.bundle)), value.bundle);
});

test("A-F provider boundary permits rewording only over supplied refs", () => {
  const value = build(snapshotFor()); const segment = value.bundle.explanationSegments[0]!; const input = { segmentId: segment.segmentId, kind: segment.kind, suppliedText: segment.text, targetRefs: segment.targetRefs, scientificClaimRefs: segment.scientificClaimRefs, provenanceRefs: segment.provenanceRefs, audience: value.bundle.audience, maxLength: 640, terminologyLevel: value.bundle.terminology.level } as const;
  assert.deepEqual(validateTeachingWordingProviderOutput(input, { segmentId: segment.segmentId, text: "A bounded rewrite.", targetRefs: segment.targetRefs, scientificClaimRefs: segment.scientificClaimRefs, provenanceRefs: segment.provenanceRefs }), { valid: true });
  const invalid = validateTeachingWordingProviderOutput(input, { segmentId: segment.segmentId, text: "Unsupported.", targetRefs: [actor("new-actor")], scientificClaimRefs: [], provenanceRefs: [] }); assert.equal(invalid.valid, false);
});

test("A-F unsupported upstream science produces no confident wording", () => {
  const value = snapshotFor(); const result = buildTeachingTextBundle({ snapshot: value.snapshot, teachingPlan: value.plan, audienceProgram: value.audience, upstreamFailureCode: "FRAGMENTATION_UNGROUNDED" }); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "FRAGMENTATION_UNGROUNDED");
});

test("A-F segment IDs and semantic ordering are invariant to source array order", () => {
  const value = snapshotFor("why", [entry("main", 1, [state("paired")], "why")]); const first = build(value); const reversedPlan = structuredClone(value.plan); reversedPlan.annotations!.reverse(); reversedPlan.causalSteps!.reverse(); const reversed = buildTeachingTextBundle({ snapshot: value.snapshot, teachingPlan: reversedPlan, audienceProgram: value.audience }); assert.equal(reversed.ok, true); if (reversed.ok) { assert.deepEqual(reversed.bundle.segments.map((segment) => segment.segmentId), first.bundle.segments.map((segment) => segment.segmentId)); assert.deepEqual(reversed.narration.cues.map((cue) => cue.cueId), first.narration.cues.map((cue) => cue.cueId)); }
});
