/** A-C: deterministic pedagogical chapter/disclosure semantics; no time evaluation. */
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { validateTeachingPlan, type TeachingPlan, type TeachingReference } from "./teaching-plan.ts";

export const chapterRoles = ["IDENTIFY", "FOCUS", "CONNECT", "EXPLAIN", "CAUSE", "COMPARE", "CORRECT", "SUMMARIZE"] as const;
export const disclosureDetails = ["OVERVIEW", "STRUCTURAL", "MECHANISTIC", "MOLECULAR", "LOCAL_CHEMISTRY"] as const;
export type TeachingDisclosurePolicyV1 = {
  primaryFocusRefs: TeachingReference[];
  secondaryContextRefs: TeachingReference[];
  suppressedContextRefs: TeachingReference[];
  activeAnnotationIds: string[];
  activeCausalStepIds: string[];
  activeContrastIds: string[];
  activeCorrectionIds: string[];
  detail: typeof disclosureDetails[number];
};
export type TeachingChapterProgramEntryV1 = {
  chapterId: string;
  order: number;
  role: typeof chapterRoles[number];
  dependsOn: string[];
  timelineRefs: TeachingReference[];
  timelineMapping?: { chapterIds: string[]; eventIds: string[]; transitionIds: string[] };
  disclosure: TeachingDisclosurePolicyV1;
  provenanceRefs: TeachingReference[];
};
export type TeachingChapterProgramV1 = { schemaVersion: "1"; planId: string; sceneId: string; entries: TeachingChapterProgramEntryV1[] };
export type ChapterProgramFailureCode =
  | "TEACHING_CHAPTER_INVALID"
  | "TEACHING_CHAPTER_REFERENCE_MISSING"
  | "TEACHING_CHAPTER_DEPENDENCY_CYCLE"
  | "TEACHING_TIMELINE_MAPPING_INVALID"
  | "TEACHING_DISCLOSURE_CONFLICT";
export type ChapterProgramResult = { ok: true; program: TeachingChapterProgramV1 } | { ok: false; code: ChapterProgramFailureCode; reasons: string[] };

const stableKey = (value: TeachingReference) => JSON.stringify(value);
const sortRefs = (values: readonly TeachingReference[]) => [...values].sort((a, b) => stableKey(a).localeCompare(stableKey(b)));
const sortIds = (values: readonly string[]) => [...new Set(values)].sort();
const isTimeline = (value: TeachingReference) => value.kind.startsWith("timeline");
const isSource = (value: TeachingReference) => value.kind === "source";
const sameRef = (left: TeachingReference, right: TeachingReference) => stableKey(left) === stableKey(right);

function legacyRole(plan: TeachingPlan): typeof chapterRoles[number] {
  if (plan.requestMode === "compare") return "COMPARE";
  if (plan.requestMode === "misconceptionCorrection") return "CORRECT";
  if (plan.requestMode === "why") return "CAUSE";
  if (plan.requestMode === "explain") return "EXPLAIN";
  return "IDENTIFY";
}

function topologicalOrder(plan: TeachingPlan): number[] | undefined {
  const byId = new Map(plan.chapters.map((chapter) => [chapter.chapterId, chapter]));
  const indegree = new Map(plan.chapters.map((chapter) => [chapter.chapterId, 0]));
  const dependents = new Map<string, string[]>();
  for (const chapter of plan.chapters) {
    for (const dependency of chapter.dependsOnChapterIds ?? []) {
      if (!byId.has(dependency)) continue;
      indegree.set(chapter.chapterId, (indegree.get(chapter.chapterId) ?? 0) + 1);
      dependents.set(dependency, [...(dependents.get(dependency) ?? []), chapter.chapterId]);
    }
  }
  const ready = plan.chapters.filter((chapter) => indegree.get(chapter.chapterId) === 0).sort((a, b) => a.order - b.order || a.chapterId.localeCompare(b.chapterId));
  const result: string[] = [];
  while (ready.length) {
    const chapter = ready.shift()!;
    result.push(chapter.chapterId);
    for (const dependentId of [...(dependents.get(chapter.chapterId) ?? [])].sort()) {
      const next = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, next);
      if (next === 0) {
        ready.push(byId.get(dependentId)!);
        ready.sort((a, b) => a.order - b.order || a.chapterId.localeCompare(b.chapterId));
      }
    }
  }
  return result.length === plan.chapters.length ? result.map((id) => plan.chapters.findIndex((chapter) => chapter.chapterId === id)) : undefined;
}

function classifyValidationFailure(reasons: string[]): ChapterProgramFailureCode {
  if (reasons.some((reason) => reason.includes("dependency cycle"))) return "TEACHING_CHAPTER_DEPENDENCY_CYCLE";
  if (reasons.some((reason) => reason.includes("primary target conflicts"))) return "TEACHING_DISCLOSURE_CONFLICT";
  return "TEACHING_CHAPTER_REFERENCE_MISSING";
}

export function compileTeachingChapterProgram(plan: TeachingPlan, scene: ScientificSceneSpec, timeline?: ScientificTimeline): ChapterProgramResult {
  const valid = validateTeachingPlan(plan, scene, timeline);
  if (!valid.valid) {
    const reasons = valid.issues.map((entry) => `${entry.path}: ${entry.message}`);
    return { ok: false, code: classifyValidationFailure(reasons), reasons };
  }
  const order = topologicalOrder(plan);
  if (!order) return { ok: false, code: "TEACHING_CHAPTER_DEPENDENCY_CYCLE", reasons: ["chapter dependencies contain a cycle"] };
  const annotationIds = new Set((plan.annotations ?? []).map((entry) => entry.annotationId));
  const causalIds = new Set((plan.causalSteps ?? []).map((entry) => entry.stepId));
  const contrastIds = new Set((plan.contrasts ?? []).map((entry) => entry.contrastId));
  const correctionChapterIds = new Set(plan.misconceptionCorrection?.chapterIds ?? []);
  const chaptersById = new Map(plan.chapters.map((chapter) => [chapter.chapterId, chapter]));
  const entries: TeachingChapterProgramEntryV1[] = [];
  for (const chapterIndex of order) {
    const chapter = plan.chapters[chapterIndex]!;
    const declared = chapter.disclosure;
    const primary = sortRefs(declared?.primaryFocusRefs ?? chapter.focus);
    const secondary = sortRefs(declared?.secondaryContextRefs ?? chapter.context ?? []);
    const suppressed = sortRefs(declared?.suppressedContextRefs ?? []);
    if (primary.some((ref) => secondary.some((other) => sameRef(ref, other))) || primary.some((ref) => suppressed.some((other) => sameRef(ref, other)))) {
      return { ok: false, code: "TEACHING_DISCLOSURE_CONFLICT", reasons: [`${chapter.chapterId}: primary disclosure target conflicts with context or suppression`] };
    }
    if (chapter.focus.some(isTimeline) && !timeline) return { ok: false, code: "TEACHING_TIMELINE_MAPPING_INVALID", reasons: [`${chapter.chapterId}: timeline reference requires ScientificTimeline`] };
    const activeAnnotationIds = chapter.annotationIds ?? [];
    const activeCausalStepIds = chapter.causalStepIds ?? [];
    const activeContrastIds = chapter.contrastIds ?? [];
    if (activeAnnotationIds.some((id) => !annotationIds.has(id)) || activeCausalStepIds.some((id) => !causalIds.has(id)) || activeContrastIds.some((id) => !contrastIds.has(id))) {
      return { ok: false, code: "TEACHING_CHAPTER_REFERENCE_MISSING", reasons: [`${chapter.chapterId}: chapter content reference is missing`] };
    }
    const mapping = chapter.timelineMapping
      ? { chapterIds: sortIds(chapter.timelineMapping.chapterIds ?? []), eventIds: sortIds(chapter.timelineMapping.eventIds ?? []), transitionIds: sortIds(chapter.timelineMapping.transitionIds ?? []) }
      : undefined;
    const timelineRefs = sortRefs([
      ...primary.filter(isTimeline),
      ...(mapping?.chapterIds ?? []).map((id) => ({ kind: "timelineChapter", timelineChapterId: id } as TeachingReference)),
      ...(mapping?.eventIds ?? []).map((id) => ({ kind: "timelineEvent", timelineEventId: id } as TeachingReference)),
      ...(mapping?.transitionIds ?? []).map((id) => ({ kind: "timelineTransition", timelineTransitionId: id } as TeachingReference)),
    ]).filter((ref, index, values) => index === values.findIndex((other) => sameRef(ref, other)));
    if (timelineRefs.length && !timeline) return { ok: false, code: "TEACHING_TIMELINE_MAPPING_INVALID", reasons: [`${chapter.chapterId}: timeline mapping requires ScientificTimeline`] };
    const provenanceRefs = sortRefs([...primary, ...secondary, ...suppressed].filter(isSource)).filter((ref, index, values) => index === values.findIndex((other) => sameRef(ref, other)));
    entries.push({
      chapterId: chapter.chapterId,
      order: chapter.order,
      role: chapter.chapterRole ?? legacyRole(plan),
      dependsOn: sortIds((chapter.dependsOnChapterIds ?? []).filter((id) => chaptersById.has(id))),
      timelineRefs,
      ...(mapping ? { timelineMapping: mapping } : {}),
      disclosure: {
        primaryFocusRefs: primary,
        secondaryContextRefs: secondary,
        suppressedContextRefs: suppressed,
        activeAnnotationIds: sortIds(activeAnnotationIds),
        activeCausalStepIds: sortIds(activeCausalStepIds),
        activeContrastIds: sortIds(activeContrastIds),
        activeCorrectionIds: correctionChapterIds.has(chapter.chapterId) ? ["misconception-correction"] : [],
        detail: declared?.detail ?? (plan.requestMode === "why" ? "MECHANISTIC" : "STRUCTURAL"),
      },
      provenanceRefs,
    });
  }
  return { ok: true, program: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries } };
}
