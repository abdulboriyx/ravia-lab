/** F3-B: renderer-independent teaching sequencing over a frozen F2 scene. */

import type { ScientificActorId, ScientificGroupId } from "./scientific-actor.ts";
import type { ScientificClaimId, ProvenanceSourceId, ScientificInteractionId } from "./scientific-fidelity-provenance.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

export const teachingRequestModes = ["show", "explain", "compare", "why", "misconceptionCorrection"] as const;
export type TeachingRequestMode = (typeof teachingRequestModes)[number];
export const teachingAudienceLevels = ["beginner", "intermediate", "advanced"] as const;
export type TeachingAudienceLevel = (typeof teachingAudienceLevels)[number];
export const teachingAnnotationKinds = ["identity", "relationship", "causal", "contrast", "misconception"] as const;
export type TeachingAnnotationKind = (typeof teachingAnnotationKinds)[number];

/** F2 targets only; no geometry, styling, or renderer selectors are permitted. */
/**
 * V1 supported actor/group/claim/source references. V2 adds only identifiers
 * already owned by F2/F3; it deliberately adds no renderer anchor or geometry
 * target. V1 plans remain valid and cannot use the V2-only reference kinds.
 */
export type TeachingReference =
  | { kind: "actor"; actorId: ScientificActorId }
  | { kind: "group"; groupId: ScientificGroupId }
  | { kind: "claim"; claimId: ScientificClaimId }
  | { kind: "source"; sourceId: ProvenanceSourceId }
  | { kind: "scientificState"; stateId: string }
  | { kind: "interaction"; interactionId: ScientificInteractionId }
  | { kind: "topologyChange"; topologyChangeId: string }
  | { kind: "timelineChapter"; timelineChapterId: string }
  | { kind: "timelineEvent"; timelineEventId: string }
  | { kind: "timelineTransition"; timelineTransitionId: string };

export type TeachingAnnotation = {
  annotationId: string;
  kind: TeachingAnnotationKind;
  target: TeachingReference;
  text: string;
};

export type TeachingNarrationCue = { cueId: string; target: TeachingReference; purpose: "orient" | "explain" | "contrast" | "correct" };
export type TeachingCausalStep = { stepId: string; order: number; cause: TeachingReference; effect: TeachingReference; explanation: string };
export type TeachingContrast = { contrastId: string; left: TeachingReference; right: TeachingReference; distinction: string };
export type TeachingChapter = {
  chapterId: string;
  order: number;
  title: string;
  focus: TeachingReference[];
  context?: TeachingReference[];
  narrationCueIds?: string[];
  annotationIds?: string[];
  causalStepIds?: string[];
  contrastIds?: string[];
  /** V3 only: explicit pedagogical semantics; never renderer or scientific mutation. */
  chapterRole?: "IDENTIFY" | "FOCUS" | "CONNECT" | "EXPLAIN" | "CAUSE" | "COMPARE" | "CORRECT" | "SUMMARIZE";
  dependsOnChapterIds?: string[];
  disclosure?: { primaryFocusRefs: TeachingReference[]; secondaryContextRefs: TeachingReference[]; suppressedContextRefs: TeachingReference[]; detail: "OVERVIEW" | "STRUCTURAL" | "MECHANISTIC" | "MOLECULAR" | "LOCAL_CHEMISTRY" };
  timelineMapping?: { chapterIds?: string[]; eventIds?: string[]; transitionIds?: string[] };
};
export type MisconceptionCorrectionSequence = {
  misconception: string;
  correction: string;
  chapterIds: string[];
  evidence: TeachingReference[];
};
export type TeachingProjection = {
  audience: TeachingAudienceLevel;
  chapterIds: string[];
  revealedAnnotationIds: string[];
  suppressedAnnotationIds?: string[];
};
/** V2 compiler trace: structured provenance of the objective, never generated prose. */
export type TeachingObjectiveTrace = {
  objectiveKind: "IDENTIFY" | "DESCRIBE" | "EXPLAIN_MECHANISM" | "EXPLAIN_CAUSE" | "COMPARE" | "CORRECT_MISCONCEPTION" | "INSPECT_CHEMISTRY";
  capabilityId: string;
  phenomenon?: string;
  mechanism?: string;
  targetActorIds: ScientificActorId[];
  requestMode: TeachingRequestMode;
};

/**
 * A teaching overlay: it may order attention and selectively reveal scientific
 * detail, but has no field capable of mutating F2 actors, topology, state, or provenance.
 */
export type TeachingPlan = {
  /** V2 is additive: it permits validated F2 state/topology and F3 timeline references. */
  schemaVersion: "1" | "2" | "3";
  planId: string;
  sceneId: string;
  requestMode: TeachingRequestMode;
  learningObjective: string;
  /** Required for compiler-produced V2 plans; absent from frozen V1 plans. */
  objectiveTrace?: TeachingObjectiveTrace;
  prerequisiteAssumptions: string[];
  chapters: TeachingChapter[];
  narrationCues?: TeachingNarrationCue[];
  annotations?: TeachingAnnotation[];
  causalSteps?: TeachingCausalStep[];
  contrasts?: TeachingContrast[];
  misconceptionCorrection?: MisconceptionCorrectionSequence;
  projections: TeachingProjection[];
};

export type TeachingPlanValidationIssue = { path: string; message: string };
export type TeachingPlanValidationResult = { valid: true; issues: [] } | { valid: false; issues: TeachingPlanValidationIssue[] };
type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const keys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const allowedKeys = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!allowedKeys.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
};
const validId = (value: unknown): value is string => typeof value === "string" && idPattern.test(value);
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;

type ReferenceContext = { actors: Set<string>; groups: Set<string>; claims: Set<string>; sources: Set<string>; states: Set<string>; interactions: Set<string>; topologyChanges: Set<string>; timelineChapters: Set<string>; timelineEvents: Set<string>; timelineTransitions: Set<string>; allowExtended: boolean };
function validateReference(value: unknown, path: string, context: ReferenceContext, issue: (path: string, message: string) => void): void {
  if (!keys(value, path, ["kind", "actorId", "groupId", "claimId", "sourceId", "stateId", "interactionId", "topologyChangeId", "timelineChapterId", "timelineEventId", "timelineTransitionId"], issue)) return;
  const ref = value as UnknownRecord;
  const expected = ref.kind === "actor" ? "actorId" : ref.kind === "group" ? "groupId" : ref.kind === "claim" ? "claimId" : ref.kind === "source" ? "sourceId" : ref.kind === "scientificState" ? "stateId" : ref.kind === "interaction" ? "interactionId" : ref.kind === "topologyChange" ? "topologyChangeId" : ref.kind === "timelineChapter" ? "timelineChapterId" : ref.kind === "timelineEvent" ? "timelineEventId" : ref.kind === "timelineTransition" ? "timelineTransitionId" : undefined;
  if (!expected) { issue(`${path}.kind`, "must be a supported teaching reference kind"); return; }
  if (!context.allowExtended && !["actor", "group", "claim", "source"].includes(String(ref.kind))) issue(`${path}.kind`, "requires TeachingPlan schemaVersion 2");
  ["actorId", "groupId", "claimId", "sourceId", "stateId", "interactionId", "topologyChangeId", "timelineChapterId", "timelineEventId", "timelineTransitionId"].forEach((key) => { if (key !== expected && ref[key] !== undefined) issue(`${path}.${key}`, "does not match reference kind"); });
  if (!text(ref[expected])) { issue(`${path}.${expected}`, "is required"); return; }
  const collection = expected === "actorId" ? context.actors : expected === "groupId" ? context.groups : expected === "claimId" ? context.claims : expected === "sourceId" ? context.sources : expected === "stateId" ? context.states : expected === "interactionId" ? context.interactions : expected === "topologyChangeId" ? context.topologyChanges : expected === "timelineChapterId" ? context.timelineChapters : expected === "timelineEventId" ? context.timelineEvents : context.timelineTransitions;
  if (!collection.has(String(ref[expected]))) issue(`${path}.${expected}`, "references a missing F2 target");
}
function list(value: unknown, path: string, issue: (path: string, message: string) => void): unknown[] {
  if (!Array.isArray(value)) { issue(path, "must be an array"); return []; }
  return value;
}
function ids(values: unknown[], path: string, known: Set<string>, issue: (path: string, message: string) => void) {
  const seen = new Set<string>();
  values.forEach((value, index) => { if (!validId(value)) issue(`${path}[${index}]`, "must be a stable ID"); else if (seen.has(value)) issue(`${path}[${index}]`, "must be unique"); else { seen.add(value); if (!known.has(value)) issue(`${path}[${index}]`, "references a missing item"); } });
}

export function validateTeachingPlan(plan: TeachingPlan, scene: ScientificSceneSpec, timeline?: ScientificTimeline): TeachingPlanValidationResult {
  const issues: TeachingPlanValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!keys(plan, "plan", ["schemaVersion", "planId", "sceneId", "requestMode", "learningObjective", "objectiveTrace", "prerequisiteAssumptions", "chapters", "narrationCues", "annotations", "causalSteps", "contrasts", "misconceptionCorrection", "projections"], issue)) return { valid: false, issues };
  const value = plan as unknown as UnknownRecord;
  if (value.schemaVersion !== "1" && value.schemaVersion !== "2" && value.schemaVersion !== "3") issue("plan.schemaVersion", "must be 1, 2, or 3");
  if (!validId(value.planId)) issue("plan.planId", "must be a stable kebab-case ID");
  if (value.sceneId !== scene.sceneId) issue("plan.sceneId", "must reference the supplied F2 scene");
  if (!teachingRequestModes.includes(value.requestMode as TeachingRequestMode)) issue("plan.requestMode", "is unsupported");
  if (!text(value.learningObjective)) issue("plan.learningObjective", "must be non-empty");
  if (value.schemaVersion === "1" && value.objectiveTrace !== undefined) issue("plan.objectiveTrace", "requires TeachingPlan schemaVersion 2");
  if (value.schemaVersion === "2") {
    if (!keys(value.objectiveTrace, "plan.objectiveTrace", ["objectiveKind", "capabilityId", "phenomenon", "mechanism", "targetActorIds", "requestMode"], issue)) issue("plan.objectiveTrace", "is required for schemaVersion 2");
    else {
      const trace = value.objectiveTrace as UnknownRecord;
      if (!["IDENTIFY", "DESCRIBE", "EXPLAIN_MECHANISM", "EXPLAIN_CAUSE", "COMPARE", "CORRECT_MISCONCEPTION", "INSPECT_CHEMISTRY"].includes(String(trace.objectiveKind))) issue("plan.objectiveTrace.objectiveKind", "is invalid");
      if (!validId(trace.capabilityId)) issue("plan.objectiveTrace.capabilityId", "must be a stable ID");
      if (trace.phenomenon !== undefined && !text(trace.phenomenon)) issue("plan.objectiveTrace.phenomenon", "must be non-empty");
      if (trace.mechanism !== undefined && !text(trace.mechanism)) issue("plan.objectiveTrace.mechanism", "must be non-empty");
      if (!teachingRequestModes.includes(trace.requestMode as TeachingRequestMode)) issue("plan.objectiveTrace.requestMode", "is invalid");
      const actorIds = new Set(scene.actors.map((actor) => String(actor.actorId)));
      const targets = list(trace.targetActorIds, "plan.objectiveTrace.targetActorIds", issue);
      if (!targets.length) issue("plan.objectiveTrace.targetActorIds", "must not be empty");
      targets.forEach((id, index) => { if (!actorIds.has(String(id))) issue(`plan.objectiveTrace.targetActorIds[${index}]`, "references a missing actor"); });
    }
  }
  list(value.prerequisiteAssumptions, "plan.prerequisiteAssumptions", issue).forEach((entry, index) => { if (!text(entry)) issue(`plan.prerequisiteAssumptions[${index}]`, "must be non-empty"); });
  const context: ReferenceContext = { actors: new Set(scene.actors.map((actor) => String(actor.actorId))), groups: new Set(scene.groups.map((group) => String(group.groupId))), claims: new Set((scene.claimIds ?? []).map(String)), sources: new Set(scene.fidelityProvenance.sources.map((source) => String(source.sourceId))), states: new Set(scene.states.map((state) => state.stateId)), interactions: new Set(scene.topology.interactions.map((interaction) => interaction.interactionId)), topologyChanges: new Set((scene.topology.changes ?? []).map((change) => change.changeId)), timelineChapters: new Set((timeline?.chapters ?? []).map((chapter) => chapter.chapterId)), timelineEvents: new Set((timeline?.events ?? []).map((event) => event.eventId)), timelineTransitions: new Set((timeline?.transitions ?? []).map((transition) => transition.transitionId)), allowExtended: value.schemaVersion === "2" || value.schemaVersion === "3" };
  const chapters = list(value.chapters, "plan.chapters", issue);
  const chapterIds = new Set<string>();
  chapters.forEach((chapter, index) => {
    const path = `plan.chapters[${index}]`;
    if (!keys(chapter, path, ["chapterId", "order", "title", "focus", "context", "narrationCueIds", "annotationIds", "causalStepIds", "contrastIds", "chapterRole", "dependsOnChapterIds", "disclosure", "timelineMapping"], issue)) return;
    const chapterValue = chapter as UnknownRecord;
    if (!validId(chapterValue.chapterId)) issue(`${path}.chapterId`, "must be a stable ID");
    else if (chapterIds.has(chapterValue.chapterId)) issue(`${path}.chapterId`, "must be unique"); else chapterIds.add(chapterValue.chapterId);
    if (!Number.isInteger(chapterValue.order) || Number(chapterValue.order) !== index + 1) issue(`${path}.order`, "must be consecutive and match chapter order");
    if (!text(chapterValue.title)) issue(`${path}.title`, "must be non-empty");
    const focus = list(chapterValue.focus, `${path}.focus`, issue); if (focus.length === 0) issue(`${path}.focus`, "must not be empty"); focus.forEach((ref, refIndex) => validateReference(ref, `${path}.focus[${refIndex}]`, context, issue));
    if (chapterValue.context !== undefined) list(chapterValue.context, `${path}.context`, issue).forEach((ref, refIndex) => validateReference(ref, `${path}.context[${refIndex}]`, context, issue));
    if (value.schemaVersion !== "3" && (chapterValue.chapterRole !== undefined || chapterValue.dependsOnChapterIds !== undefined || chapterValue.disclosure !== undefined || chapterValue.timelineMapping !== undefined)) issue(path, "chapter metadata requires TeachingPlan schemaVersion 3");
    if (value.schemaVersion === "3") {
      if (!['IDENTIFY','FOCUS','CONNECT','EXPLAIN','CAUSE','COMPARE','CORRECT','SUMMARIZE'].includes(String(chapterValue.chapterRole))) issue(`${path}.chapterRole`, "is required and invalid");
      if (chapterValue.dependsOnChapterIds !== undefined) { const deps=list(chapterValue.dependsOnChapterIds,`${path}.dependsOnChapterIds`,issue); const seen=new Set<string>(); deps.forEach((dep,j)=>{if(!validId(dep)||seen.has(String(dep)))issue(`${path}.dependsOnChapterIds[${j}]`,`must be unique stable ID`); if(dep===chapterValue.chapterId)issue(`${path}.dependsOnChapterIds[${j}]`,`must not self-depend`);seen.add(String(dep));}); }
      if (!keys(chapterValue.disclosure,`${path}.disclosure`,['primaryFocusRefs','secondaryContextRefs','suppressedContextRefs','detail'],issue)) issue(`${path}.disclosure`,`is required`); else { const d=chapterValue.disclosure as UnknownRecord; const all=['primaryFocusRefs','secondaryContextRefs','suppressedContextRefs'] as const; const sets=new Map<string,Set<string>>(); all.forEach(k=>{const vals=list(d[k],`${path}.disclosure.${k}`,issue);sets.set(k,new Set(vals.map(x=>JSON.stringify(x))));vals.forEach((x,j)=>validateReference(x,`${path}.disclosure.${k}[${j}]`,context,issue));}); for(const k of ['secondaryContextRefs','suppressedContextRefs']) for(const x of sets.get('primaryFocusRefs')??[]) if(sets.get(k)?.has(x)) issue(`${path}.disclosure`,`primary target conflicts with ${k}`); if(!['OVERVIEW','STRUCTURAL','MECHANISTIC','MOLECULAR','LOCAL_CHEMISTRY'].includes(String(d.detail)))issue(`${path}.disclosure.detail`,`is invalid`); }
      if (chapterValue.timelineMapping !== undefined) { if(!keys(chapterValue.timelineMapping,`${path}.timelineMapping`,['chapterIds','eventIds','transitionIds'],issue)){} else { const m=chapterValue.timelineMapping as UnknownRecord; ids(list(m.chapterIds??[],`${path}.timelineMapping.chapterIds`,issue),`${path}.timelineMapping.chapterIds`,context.timelineChapters,issue);ids(list(m.eventIds??[],`${path}.timelineMapping.eventIds`,issue),`${path}.timelineMapping.eventIds`,context.timelineEvents,issue);ids(list(m.transitionIds??[],`${path}.timelineMapping.transitionIds`,issue),`${path}.timelineMapping.transitionIds`,context.timelineTransitions,issue); } }
    }
  });
  if (value.schemaVersion === "3") { const graph=new Map(chapters.map((c:any)=>[String(c.chapterId),new Set<string>((c.dependsOnChapterIds??[]).map(String))])); graph.forEach((deps,id)=>deps.forEach(dep=>{if(!graph.has(dep))issue(`plan.chapters.${id}.dependsOnChapterIds`,`references a missing chapter`);})); const visit=(id:string,seen:Set<string>,stack:Set<string>)=>{if(stack.has(id)){issue('plan.chapters','contains dependency cycle');return;}if(seen.has(id))return;seen.add(id);stack.add(id);graph.get(id)?.forEach(d=>visit(d,seen,stack));stack.delete(id)};graph.forEach((_v,id)=>visit(id,new Set(),new Set())); }
  const annotations = list(value.annotations ?? [], "plan.annotations", issue); const annotationIds = new Set<string>();
  annotations.forEach((annotation, index) => { const path = `plan.annotations[${index}]`; if (!keys(annotation, path, ["annotationId", "kind", "target", "text"], issue)) return; const entry = annotation as UnknownRecord; if (!validId(entry.annotationId) || annotationIds.has(String(entry.annotationId))) issue(`${path}.annotationId`, "must be a unique stable ID"); annotationIds.add(String(entry.annotationId)); if (!teachingAnnotationKinds.includes(entry.kind as TeachingAnnotationKind)) issue(`${path}.kind`, "is invalid"); validateReference(entry.target, `${path}.target`, context, issue); if (!text(entry.text)) issue(`${path}.text`, "must be non-empty"); });
  const narration = list(value.narrationCues ?? [], "plan.narrationCues", issue); const narrationIds = new Set<string>();
  narration.forEach((cue, index) => { const path = `plan.narrationCues[${index}]`; if (!keys(cue, path, ["cueId", "target", "purpose"], issue)) return; const entry = cue as UnknownRecord; if (!validId(entry.cueId) || narrationIds.has(String(entry.cueId))) issue(`${path}.cueId`, "must be a unique stable ID"); narrationIds.add(String(entry.cueId)); validateReference(entry.target, `${path}.target`, context, issue); if (!["orient", "explain", "contrast", "correct"].includes(String(entry.purpose))) issue(`${path}.purpose`, "is invalid"); });
  const causal = list(value.causalSteps ?? [], "plan.causalSteps", issue); const causalIds = new Set<string>();
  causal.forEach((step, index) => { const path = `plan.causalSteps[${index}]`; if (!keys(step, path, ["stepId", "order", "cause", "effect", "explanation"], issue)) return; const entry = step as UnknownRecord; if (!validId(entry.stepId) || causalIds.has(String(entry.stepId))) issue(`${path}.stepId`, "must be a unique stable ID"); causalIds.add(String(entry.stepId)); if (!Number.isInteger(entry.order) || Number(entry.order) !== index + 1) issue(`${path}.order`, "must be consecutive"); validateReference(entry.cause, `${path}.cause`, context, issue); validateReference(entry.effect, `${path}.effect`, context, issue); if (!text(entry.explanation)) issue(`${path}.explanation`, "must be non-empty"); });
  const contrasts = list(value.contrasts ?? [], "plan.contrasts", issue); const contrastIds = new Set<string>();
  contrasts.forEach((contrast, index) => { const path = `plan.contrasts[${index}]`; if (!keys(contrast, path, ["contrastId", "left", "right", "distinction"], issue)) return; const entry = contrast as UnknownRecord; if (!validId(entry.contrastId) || contrastIds.has(String(entry.contrastId))) issue(`${path}.contrastId`, "must be a unique stable ID"); contrastIds.add(String(entry.contrastId)); validateReference(entry.left, `${path}.left`, context, issue); validateReference(entry.right, `${path}.right`, context, issue); if (!text(entry.distinction)) issue(`${path}.distinction`, "must be non-empty"); });
  const projections = list(value.projections, "plan.projections", issue); const audiences = new Set<string>();
  projections.forEach((projection, index) => { const path = `plan.projections[${index}]`; if (!keys(projection, path, ["audience", "chapterIds", "revealedAnnotationIds", "suppressedAnnotationIds"], issue)) return; const entry = projection as UnknownRecord; if (!teachingAudienceLevels.includes(entry.audience as TeachingAudienceLevel)) issue(`${path}.audience`, "is unsupported"); else if (audiences.has(String(entry.audience))) issue(`${path}.audience`, "must have one projection"); else audiences.add(String(entry.audience)); ids(list(entry.chapterIds, `${path}.chapterIds`, issue), `${path}.chapterIds`, chapterIds, issue); ids(list(entry.revealedAnnotationIds, `${path}.revealedAnnotationIds`, issue), `${path}.revealedAnnotationIds`, annotationIds, issue); if (entry.suppressedAnnotationIds !== undefined) ids(list(entry.suppressedAnnotationIds, `${path}.suppressedAnnotationIds`, issue), `${path}.suppressedAnnotationIds`, annotationIds, issue); });
  if (audiences.size !== teachingAudienceLevels.length) issue("plan.projections", "must provide beginner, intermediate, and advanced projections");
  if (value.misconceptionCorrection !== undefined) { const correction = value.misconceptionCorrection as UnknownRecord; if (!keys(correction, "plan.misconceptionCorrection", ["misconception", "correction", "chapterIds", "evidence"], issue)) return { valid: false, issues }; if (!text(correction.misconception) || !text(correction.correction)) issue("plan.misconceptionCorrection", "requires misconception and correction text"); ids(list(correction.chapterIds, "plan.misconceptionCorrection.chapterIds", issue), "plan.misconceptionCorrection.chapterIds", chapterIds, issue); const evidence = list(correction.evidence, "plan.misconceptionCorrection.evidence", issue); if (evidence.length === 0) issue("plan.misconceptionCorrection.evidence", "must not be empty"); evidence.forEach((ref, index) => validateReference(ref, `plan.misconceptionCorrection.evidence[${index}]`, context, issue)); }
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}
