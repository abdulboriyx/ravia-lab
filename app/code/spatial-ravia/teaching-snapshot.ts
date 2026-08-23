/** A-E: pure exact-time evaluation of an already compiled teaching program. */
import type { MechanismSnapshotV1 } from "./p3-b-mechanism-state-kernel.ts";
import type { PresentationMechanismSnapshotV1 } from "./p3-e-presentation-synchronization.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { TeachingReference, TeachingPlan } from "./teaching-plan.ts";
import type { TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import type { AudienceTeachingProgramV1, AudienceTeachingProgramEntryV1, AudienceCorrectionStepV1, TeachingDetail } from "./teaching-audience-policy.ts";

export type TeachingCursorV1 = Readonly<{
  schemaVersion: "1";
  mode: "TIME_FOLLOWING" | "MANUAL_CHAPTER";
  chapterId?: string;
}>;

export type TeachingSnapshotV1 = Readonly<{
  schemaVersion: "1";
  teachingPlanId: string;
  teachingPlanVersion: TeachingPlan["schemaVersion"];
  chapterProgramId: string;
  audienceProgramVersion: "1";
  audience: AudienceTeachingProgramV1["audience"];
  requestMode: TeachingPlan["requestMode"];
  timeSeconds: number;
  activeChapterIds: readonly string[];
  completedChapterIds: readonly string[];
  pendingChapterIds: readonly string[];
  activeLearningObjective: string;
  activeDisclosure: Readonly<{
    primaryFocusRefs: readonly TeachingReference[];
    secondaryContextRefs: readonly TeachingReference[];
    suppressedContextRefs: readonly TeachingReference[];
    detail: TeachingDetail;
  }>;
  activeAnnotationIds: readonly string[];
  activeCausalStepIds: readonly string[];
  activeContrastIds: readonly string[];
  activeCorrectionIds: readonly string[];
  activeCorrectionStageIds: readonly AudienceCorrectionStepV1["stepId"][];
  activeFocusRefs: readonly TeachingReference[];
  activeContextRefs: readonly TeachingReference[];
  suppressedRefs: readonly TeachingReference[];
  detail: TeachingDetail;
  terminologyLevel: AudienceTeachingProgramV1["policy"]["terminologyLevel"];
  mechanismGranularity: AudienceTeachingProgramV1["policy"]["mechanismGranularity"];
  narrationCueIds: readonly string[];
  scientificTraceRefs: readonly TeachingReference[];
  timelineTraceRefs: readonly TeachingReference[];
  provenanceRefs: readonly TeachingReference[];
  support: Readonly<{ status: "SUPPORTED" | "UNAVAILABLE"; code?: TeachingSnapshotFailureCode; reasons: readonly string[] }>;
  cursor?: TeachingCursorV1;
}>;

export const teachingSnapshotFailureCodes = [
  "TEACHING_TIMELINE_REQUIRED", "TEACHING_TIME_INVALID", "TEACHING_CHAPTER_UNAVAILABLE",
  "TEACHING_CONTENT_REFERENCE_INVALID", "TEACHING_SNAPSHOT_UNAVAILABLE", "SCIENTIFIC_STATE_UNAVAILABLE",
  "FRAGMENTATION_UNGROUNDED",
] as const;
export type TeachingSnapshotFailureCode = typeof teachingSnapshotFailureCodes[number];
export type TeachingEvaluationResult = Readonly<{ ok: true; snapshot: TeachingSnapshotV1 } | { ok: false; code: TeachingSnapshotFailureCode; reasons: readonly string[] }>;

export type EvaluateTeachingAtTimeInput = Readonly<{
  teachingPlan: TeachingPlan;
  chapterProgram: TeachingChapterProgramV1;
  audienceProgram: AudienceTeachingProgramV1;
  scientificTimeline?: ScientificTimeline;
  mechanismSnapshot?: MechanismSnapshotV1;
  presentationSnapshot?: PresentationMechanismSnapshotV1;
  timeSeconds: number;
  cursor?: TeachingCursorV1;
  upstreamFailureCode?: "FRAGMENTATION_UNGROUNDED";
}>;

const refKey = (ref: TeachingReference) => JSON.stringify(ref);
const sortUnique = (values: readonly string[]) => [...new Set(values)].sort();
const uniqueRefs = (values: readonly TeachingReference[]) => [...values].sort((a, b) => refKey(a).localeCompare(refKey(b))).filter((ref, index, all) => index === all.findIndex((other) => refKey(other) === refKey(ref)));
const fail = (code: TeachingSnapshotFailureCode, ...reasons: string[]): TeachingEvaluationResult => ({ ok: false, code, reasons });
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((child) => freeze(child));
    Object.freeze(value);
  }
  return value;
};

function mappedActivity(entry: AudienceTeachingProgramEntryV1, timeline: ScientificTimeline, time: number): "active" | "completed" | "pending" | "none" {
  const mapping = entry.timelineMapping;
  if (!mapping) return "none";
  const chapters = mapping.chapterIds.map((id) => timeline.chapters?.find((candidate) => candidate.chapterId === id)).filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter));
  if (chapters.some((chapter) => time >= chapter.start && (time < chapter.end || (time === timeline.clock.duration && chapter.end === timeline.clock.duration)))) return "active";
  if (chapters.length && chapters.every((chapter) => time >= chapter.end)) return "completed";
  const transitions = mapping.transitionIds.map((id) => timeline.transitions.find((candidate) => candidate.transitionId === id)).filter((transition): transition is NonNullable<typeof transition> => Boolean(transition));
  if (transitions.some((transition) => time >= transition.start && time < transition.end)) return "active";
  if (transitions.length && transitions.every((transition) => time >= transition.end)) return "completed";
  const events = mapping.eventIds.map((id) => timeline.events.find((candidate) => candidate.eventId === id)).filter((event): event is NonNullable<typeof event> => Boolean(event));
  if (events.some((event) => time === event.at)) return "active";
  if (events.length && events.every((event) => time > event.at)) return "completed";
  if (chapters.length || transitions.length || events.length) return "pending";
  return "none";
}

function dependencyClosure(entries: readonly AudienceTeachingProgramEntryV1[], selected: Set<string>): Set<string> {
  const byId = new Map(entries.map((entry) => [entry.chapterId, entry]));
  const result = new Set(selected);
  const visit = (id: string) => { for (const dependency of byId.get(id)?.dependsOn ?? []) if (!result.has(dependency)) { result.add(dependency); visit(dependency); } };
  [...result].forEach(visit);
  return result;
}

function correctionStages(plan: TeachingPlan, audience: AudienceTeachingProgramV1, activeIds: readonly string[]): AudienceCorrectionStepV1["stepId"][] {
  if (!audience.correction) return [];
  const chapterIds = plan.misconceptionCorrection?.chapterIds ?? [];
  const steps = audience.correction.steps;
  return activeIds.flatMap((chapterId) => {
    const index = chapterIds.indexOf(chapterId);
    return index >= 0 && steps[index] ? [steps[index]!.stepId as AudienceCorrectionStepV1["stepId"]] : [];
  });
}

function validateContent(input: EvaluateTeachingAtTimeInput): string[] {
  const plan = input.teachingPlan;
  const annotationIds = new Set((plan.annotations ?? []).map((item) => item.annotationId));
  const causalIds = new Set((plan.causalSteps ?? []).map((item) => item.stepId));
  const contrastIds = new Set((plan.contrasts ?? []).map((item) => item.contrastId));
  const correctionIds = new Set<string>(input.audienceProgram.correction?.steps.map((step) => step.stepId) ?? []);
  return input.audienceProgram.entries.flatMap((entry) => [
    ...entry.disclosure.activeAnnotationIds.filter((id) => !annotationIds.has(id)).map((id) => `${entry.chapterId}: missing annotation ${id}`),
    ...entry.disclosure.activeCausalStepIds.filter((id) => !causalIds.has(id)).map((id) => `${entry.chapterId}: missing causal step ${id}`),
    ...entry.disclosure.activeContrastIds.filter((id) => !contrastIds.has(id)).map((id) => `${entry.chapterId}: missing contrast ${id}`),
    ...entry.disclosure.activeCorrectionIds.filter((id) => id !== "misconception-correction" && !correctionIds.has(id)).map((id) => `${entry.chapterId}: missing correction ${id}`),
  ]);
}

function temporalTrace(entries: readonly AudienceTeachingProgramEntryV1[]): TeachingReference[] {
  return uniqueRefs(entries.flatMap((entry) => [...entry.timelineRefs, ...(entry.timelineMapping?.chapterIds ?? []).map((id) => ({ kind: "timelineChapter", timelineChapterId: id } as TeachingReference)), ...(entry.timelineMapping?.eventIds ?? []).map((id) => ({ kind: "timelineEvent", timelineEventId: id } as TeachingReference)), ...(entry.timelineMapping?.transitionIds ?? []).map((id) => ({ kind: "timelineTransition", timelineTransitionId: id } as TeachingReference))]));
}

export function evaluateTeachingAtTime(input: EvaluateTeachingAtTimeInput): TeachingEvaluationResult {
  if (input.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", "upstream fragmentation semantics are ungrounded");
  if (!Number.isFinite(input.timeSeconds) || input.timeSeconds < 0 || (input.scientificTimeline && input.timeSeconds > input.scientificTimeline.clock.duration)) return fail("TEACHING_TIME_INVALID", "timeSeconds must be finite, non-negative, and within the supplied timeline duration");
  const contentIssues = validateContent(input);
  if (contentIssues.length) return fail("TEACHING_CONTENT_REFERENCE_INVALID", ...contentIssues);
  const entries = [...input.audienceProgram.entries].sort((a, b) => a.order - b.order || a.chapterId.localeCompare(b.chapterId));
  const temporal = entries.some((entry) => Boolean(entry.timelineMapping));
  if (temporal && !input.scientificTimeline) return fail("TEACHING_TIMELINE_REQUIRED", "temporal teaching entries require ScientificTimeline");
  if (input.mechanismSnapshot && input.mechanismSnapshot.timeSeconds !== input.timeSeconds) return fail("SCIENTIFIC_STATE_UNAVAILABLE", "mechanism snapshot time does not equal requested exact time");
  if (input.presentationSnapshot && input.presentationSnapshot.timeSeconds !== input.timeSeconds) return fail("SCIENTIFIC_STATE_UNAVAILABLE", "presentation snapshot time does not equal requested exact time");
  const ids = new Set(entries.map((entry) => entry.chapterId));
  if (input.cursor?.chapterId && !ids.has(input.cursor.chapterId)) return fail("TEACHING_CHAPTER_UNAVAILABLE", `cursor references missing chapter ${input.cursor.chapterId}`);
  const status = new Map<string, "active" | "completed" | "pending" | "none">();
  if (input.scientificTimeline) entries.forEach((entry) => status.set(entry.chapterId, mappedActivity(entry, input.scientificTimeline!, input.timeSeconds)));
  const selected = input.cursor?.mode === "MANUAL_CHAPTER" && input.cursor.chapterId
    ? new Set([input.cursor.chapterId])
    : temporal ? new Set(entries.filter((entry) => status.get(entry.chapterId) === "active").map((entry) => entry.chapterId)) : new Set([entries[0]?.chapterId].filter((id): id is string => Boolean(id)));
  const activeIds = [...dependencyClosure(entries, selected)].filter((id) => ids.has(id)).sort((a, b) => (entries.find((entry) => entry.chapterId === a)!.order - entries.find((entry) => entry.chapterId === b)!.order) || a.localeCompare(b));
  const completedIds = input.scientificTimeline ? entries.filter((entry) => status.get(entry.chapterId) === "completed" && !activeIds.includes(entry.chapterId)).map((entry) => entry.chapterId) : [];
  const pendingIds = input.scientificTimeline ? entries.filter((entry) => !activeIds.includes(entry.chapterId) && !completedIds.includes(entry.chapterId)).map((entry) => entry.chapterId) : entries.map((entry) => entry.chapterId).filter((id) => !activeIds.includes(id));
  const activeEntries = entries.filter((entry) => activeIds.includes(entry.chapterId));
  if (!activeEntries.length) return fail("TEACHING_CHAPTER_UNAVAILABLE", temporal ? "no teaching chapter maps to the requested exact time" : "no teaching chapter is available");
  const focus = uniqueRefs(activeEntries.flatMap((entry) => entry.disclosure.primaryFocusRefs));
  const context = uniqueRefs(activeEntries.flatMap((entry) => entry.disclosure.secondaryContextRefs));
  const suppressed = uniqueRefs(activeEntries.flatMap((entry) => entry.disclosure.suppressedContextRefs));
  const detail = activeEntries[activeEntries.length - 1]!.projectedDetail;
  const timelineRefs = input.scientificTimeline ? temporalTrace(activeEntries) : [];
  const snapshot: TeachingSnapshotV1 = {
    schemaVersion: "1", teachingPlanId: input.teachingPlan.planId, teachingPlanVersion: input.teachingPlan.schemaVersion,
    chapterProgramId: `${input.chapterProgram.planId}:chapters`, audienceProgramVersion: input.audienceProgram.schemaVersion,
    audience: input.audienceProgram.audience, requestMode: input.teachingPlan.requestMode, timeSeconds: input.timeSeconds,
    activeChapterIds: activeIds, completedChapterIds: sortUnique(completedIds), pendingChapterIds: sortUnique(pendingIds),
    activeLearningObjective: input.teachingPlan.learningObjective, activeDisclosure: { primaryFocusRefs: focus, secondaryContextRefs: context, suppressedContextRefs: suppressed, detail },
    activeAnnotationIds: sortUnique(activeEntries.flatMap((entry) => entry.disclosure.activeAnnotationIds)), activeCausalStepIds: sortUnique(activeEntries.flatMap((entry) => entry.disclosure.activeCausalStepIds)), activeContrastIds: sortUnique(activeEntries.flatMap((entry) => entry.disclosure.activeContrastIds)),
    activeCorrectionIds: sortUnique(activeEntries.flatMap((entry) => entry.disclosure.activeCorrectionIds)), activeCorrectionStageIds: correctionStages(input.teachingPlan, input.audienceProgram, activeIds).filter((id, index, all) => all.indexOf(id) === index),
    activeFocusRefs: focus, activeContextRefs: context, suppressedRefs: suppressed, detail, terminologyLevel: input.audienceProgram.policy.terminologyLevel, mechanismGranularity: input.audienceProgram.policy.mechanismGranularity,
    narrationCueIds: sortUnique(activeEntries.flatMap((entry) => input.teachingPlan.chapters.find((chapter) => chapter.chapterId === entry.chapterId)?.narrationCueIds ?? [])),
    scientificTraceRefs: uniqueRefs(activeEntries.flatMap((entry) => entry.authoritativeRefs)), timelineTraceRefs: timelineRefs, provenanceRefs: uniqueRefs(activeEntries.flatMap((entry) => entry.provenanceRefs)),
    support: { status: "SUPPORTED", reasons: [] }, ...(input.cursor ? { cursor: input.cursor } : {}),
  };
  return { ok: true, snapshot: freeze(snapshot) };
}

export function serializeTeachingSnapshot(snapshot: TeachingSnapshotV1): string { return JSON.stringify(snapshot); }
export function deserializeTeachingSnapshot(serialized: string): TeachingSnapshotV1 { return JSON.parse(serialized) as TeachingSnapshotV1; }
