/** A-B: deterministic pedagogical-plan compiler. It consumes frozen science; it does not create it. */

import { validateSemanticIntent, type SemanticIntentV1 } from "./semantic-intent.ts";
import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, validateScientificTimeline, type ScientificTimeline } from "./scientific-timeline.ts";
import type { CapabilityRegistryRecord } from "./capability-registry.ts";
import { validateTeachingPlan, type TeachingAnnotation, type TeachingCausalStep, type TeachingChapter, type TeachingContrast, type TeachingPlan, type TeachingReference, type TeachingRequestMode } from "./teaching-plan.ts";

export const teachingCompileSchemaVersion = "1" as const;
export const teachingObjectiveKinds = ["IDENTIFY", "DESCRIBE", "EXPLAIN_MECHANISM", "EXPLAIN_CAUSE", "COMPARE", "CORRECT_MISCONCEPTION", "INSPECT_CHEMISTRY"] as const;
export type TeachingObjectiveKind = (typeof teachingObjectiveKinds)[number];
export const teachingCompileFailureCodes = ["TEACHING_TARGET_UNAVAILABLE", "TEACHING_TIMELINE_REQUIRED", "TEACHING_REFERENCE_INVALID", "TEACHING_MODE_UNSUPPORTED", "SCIENTIFIC_STATE_UNAVAILABLE", "UNSUPPORTED_TEACHING_CAPABILITY", "FRAGMENTATION_UNGROUNDED", "TEACHING_COMPILE_REQUEST_INVALID"] as const;
export type TeachingCompileFailureCode = (typeof teachingCompileFailureCodes)[number];

/** Bounded execution policy, not a second prompt or scientific semantic language. */
export type TeachingCompileRequestV1 = {
  schemaVersion: "1";
  requestMode?: TeachingRequestMode;
  audience: "beginner" | "intermediate" | "advanced";
  objectiveIntent?: TeachingObjectiveKind;
  focusActorIds?: string[];
  misconception?: { outcome: "CORRECTION_REQUIRED"; misconception: string; correction: string };
  upstreamFailureCode?: "FRAGMENTATION_UNGROUNDED";
};

export type TeachingCompileInput = { semanticIntent: SemanticIntentV1; scientificScene: ScientificSceneSpec; scientificTimeline?: ScientificTimeline; capability: CapabilityRegistryRecord; teachingRequest: TeachingCompileRequestV1 };
export type TeachingCompileResult = { ok: true; plan: TeachingPlan } | { ok: false; code: TeachingCompileFailureCode; reasons: readonly string[] };

type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const uniqueSorted = (values: readonly string[]) => [...new Set(values)].sort();
const ref = (kind: TeachingReference["kind"], id: string): TeachingReference => {
  switch (kind) {
    case "actor": return { kind, actorId: id as never };
    case "group": return { kind, groupId: id as never };
    case "claim": return { kind, claimId: id as never };
    case "source": return { kind, sourceId: id as never };
    case "scientificState": return { kind, stateId: id };
    case "interaction": return { kind, interactionId: id as never };
    case "topologyChange": return { kind, topologyChangeId: id };
    case "timelineChapter": return { kind, timelineChapterId: id };
    case "timelineEvent": return { kind, timelineEventId: id };
    case "timelineTransition": return { kind, timelineTransitionId: id };
    case "compartment": return { kind, compartmentId: id };
    case "localizationChange": return { kind, changeId: id };
    case "cellularLocalization": return { kind, actorId: id as never, compartmentId: id };
    default: throw new Error(`Unsupported teaching reference kind: ${String(kind)}`);
  }
};
const fail = (code: TeachingCompileFailureCode, ...reasons: string[]): TeachingCompileResult => ({ ok: false, code, reasons });

export function validateTeachingCompileRequest(request: TeachingCompileRequestV1): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(request)) return ["request must be an object"];
  const allowed = new Set(["schemaVersion", "requestMode", "audience", "objectiveIntent", "focusActorIds", "misconception", "upstreamFailureCode"]);
  Object.keys(request).forEach((key) => { if (!allowed.has(key)) errors.push(`request.${key} is unknown`); });
  if (request.schemaVersion !== "1") errors.push("request.schemaVersion must be 1");
  if (request.requestMode !== undefined && !["show", "explain", "compare", "why", "misconceptionCorrection"].includes(request.requestMode)) errors.push("request.requestMode is invalid");
  if (!["beginner", "intermediate", "advanced"].includes(request.audience)) errors.push("request.audience is invalid");
  if (request.objectiveIntent !== undefined && !teachingObjectiveKinds.includes(request.objectiveIntent)) errors.push("request.objectiveIntent is invalid");
  if (request.focusActorIds !== undefined && (!Array.isArray(request.focusActorIds) || request.focusActorIds.some((id) => typeof id !== "string"))) errors.push("request.focusActorIds must be string IDs");
  if (request.misconception !== undefined && (!isRecord(request.misconception) || request.misconception.outcome !== "CORRECTION_REQUIRED" || typeof request.misconception.misconception !== "string" || !request.misconception.misconception || typeof request.misconception.correction !== "string" || !request.misconception.correction)) errors.push("request.misconception is invalid");
  if (request.upstreamFailureCode !== undefined && request.upstreamFailureCode !== "FRAGMENTATION_UNGROUNDED") errors.push("request.upstreamFailureCode is invalid");
  return errors;
}

function modeFor(intent: SemanticIntentV1, request: TeachingCompileRequestV1): TeachingRequestMode | undefined {
  if (request.requestMode) return request.requestMode;
  if (request.misconception) return "misconceptionCorrection";
  if (intent.acts.includes("compare")) return "compare";
  if (intent.acts.includes("explain")) return "explain";
  if (intent.acts.includes("show")) return "show";
  return undefined;
}
function objectiveFor(mode: TeachingRequestMode, capability: CapabilityRegistryRecord, request: TeachingCompileRequestV1): TeachingObjectiveKind {
  if (request.objectiveIntent) return request.objectiveIntent;
  if (mode === "compare") return "COMPARE";
  if (mode === "why") return "EXPLAIN_CAUSE";
  if (mode === "misconceptionCorrection") return "CORRECT_MISCONCEPTION";
  if (capability.primitiveIds.includes("nucleotide") || capability.primitiveIds.includes("phosphodiester-linkage") || capability.primitiveIds.includes("local-chemistry-comparison")) return "INSPECT_CHEMISTRY";
  return mode === "explain" ? "EXPLAIN_MECHANISM" : mode === "show" ? "IDENTIFY" : "DESCRIBE";
}
function objectiveText(kind: TeachingObjectiveKind, capability: CapabilityRegistryRecord): string {
  const noun = capability.phenomenon;
  return kind === "IDENTIFY" ? `Identify ${noun}.` : kind === "DESCRIBE" ? `Describe ${noun}.` : kind === "EXPLAIN_MECHANISM" ? `Explain ${noun} using the grounded scene.` : kind === "EXPLAIN_CAUSE" ? `Explain the grounded cause of ${noun}.` : kind === "COMPARE" ? `Compare the grounded forms of ${noun}.` : kind === "CORRECT_MISCONCEPTION" ? `Correct a misconception about ${noun}.` : `Inspect the grounded local chemistry of ${noun}.`;
}
const modeId = (mode: TeachingRequestMode) => mode === "misconceptionCorrection" ? "misconception-correction" : mode;
function chapterRoleFor(mode: TeachingRequestMode, chapterId: string): TeachingChapter["chapterRole"] {
  if (mode === "why") return chapterId === "identify-grounded-scene" ? "FOCUS" : "CAUSE";
  if (mode === "compare") return "COMPARE";
  if (mode === "misconceptionCorrection") return chapterId === "correction-identify-claim" ? "IDENTIFY" : "CORRECT";
  return chapterId === "identify-grounded-scene" ? "IDENTIFY" : "EXPLAIN";
}
function chapterDependencies(chapterId: string): string[] {
  const dependencies: Record<string, string[]> = {
    "connect-grounded-evidence": ["identify-grounded-scene"],
    "compare-focus-b": ["compare-focus-a"],
    "compare-commonality": ["compare-focus-b"],
    "compare-difference": ["compare-commonality"],
    "compare-synthesis": ["compare-difference"],
    "correction-evidence": ["correction-identify-claim"],
    "correction-present": ["correction-evidence"],
    "correction-reinforce": ["correction-present"],
  };
  return dependencies[chapterId] ?? [];
}

function focusActors(scene: ScientificSceneSpec, request: TeachingCompileRequestV1): string[] {
  const known = new Set(scene.actors.map((actor) => String(actor.actorId)));
  const requested = request.focusActorIds ? uniqueSorted(request.focusActorIds) : [];
  if (requested.length) return requested.filter((id) => known.has(id));
  const presented = uniqueSorted(scene.presentationIntent.focusActorIds.map(String));
  return presented.length ? presented : uniqueSorted(scene.actors.map((actor) => String(actor.actorId)));
}
function referencesFor(ids: readonly string[]): TeachingReference[] { return ids.map((id) => ref("actor", id)); }
function sourceEvidence(scene: ScientificSceneSpec): TeachingReference[] { return uniqueSorted(scene.fidelityProvenance.sources.map((source) => String(source.sourceId))).map((id) => ref("source", id)); }

/** Pure compiler. It consumes structured semantic/scientific inputs only. */
export function compileTeachingPlan(input: TeachingCompileInput): TeachingCompileResult {
  const requestErrors = validateTeachingCompileRequest(input.teachingRequest);
  if (requestErrors.length) return fail("TEACHING_COMPILE_REQUEST_INVALID", ...requestErrors);
  if (input.teachingRequest.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", "Upstream fragmentation is ungrounded; fragment teaching content is unavailable.");
  if (!validateSemanticIntent(input.semanticIntent).valid || !validateScientificSceneSpec(input.scientificScene).valid) return fail("TEACHING_REFERENCE_INVALID", "Compiler requires validated SemanticIntent and ScientificSceneSpec.");
  if (input.scientificTimeline && !validateScientificTimeline(input.scientificTimeline, timelineContextFromScene(input.scientificScene)).valid) return fail("TEACHING_REFERENCE_INVALID", "Supplied ScientificTimeline does not validate against the scientific scene.");
  if (input.capability.supportStatus === "UNSUPPORTED") return fail("UNSUPPORTED_TEACHING_CAPABILITY", `Capability ${input.capability.capabilityId} is unsupported.`);
  const mode = modeFor(input.semanticIntent, input.teachingRequest);
  if (!mode) return fail("TEACHING_MODE_UNSUPPORTED", "Validated semantic acts do not map to a teaching mode.");
  const actors = focusActors(input.scientificScene, input.teachingRequest);
  if (!actors.length || (input.teachingRequest.focusActorIds?.length && actors.length !== uniqueSorted(input.teachingRequest.focusActorIds).length)) return fail("TEACHING_TARGET_UNAVAILABLE", "Requested teaching focus actor is unavailable in the scientific scene.");
  const objectiveKind = objectiveFor(mode, input.capability, input.teachingRequest);
  const interactions = uniqueSorted(input.scientificScene.topology.interactions.map((item) => item.interactionId));
  const states = uniqueSorted(input.scientificScene.states.map((state) => state.stateId));
  const changes = uniqueSorted((input.scientificScene.topology.changes ?? []).map((change) => change.changeId));
  if (mode === "why" && (!interactions.length || !changes.length)) return fail("SCIENTIFIC_STATE_UNAVAILABLE", "Why-mode requires grounded interactions and topology changes.");
  if ((mode === "why" || input.scientificTimeline) && !input.scientificTimeline && mode === "why") return fail("TEACHING_TIMELINE_REQUIRED", "Why-mode mechanism teaching requires a ScientificTimeline.");
  const focus = referencesFor(actors);
  const annotations: TeachingAnnotation[] = [{ annotationId: "annotation-focus", kind: mode === "compare" ? "contrast" : mode === "why" ? "causal" : "identity", target: focus[0]!, text: input.capability.phenomenon }];
  const causalSteps: TeachingCausalStep[] = mode === "why" ? [{ stepId: "cause-grounded-change", order: 1, cause: ref("interaction", interactions[0]!), effect: ref("topologyChange", changes[0]!), explanation: "Grounded interaction and topology-change relationship." }] : [];
  const contrasts: TeachingContrast[] = mode === "compare" ? (() => {
    const comparison = input.scientificScene.presentationIntent.comparison;
    if (!comparison || comparison.left.kind !== "actor" || comparison.right.kind !== "actor") return [];
    return [{ contrastId: "contrast-grounded-comparison", left: ref("actor", String(comparison.left.actorId)), right: ref("actor", String(comparison.right.actorId)), distinction: input.capability.phenomenon }];
  })() : [];
  if (mode === "compare" && !contrasts.length) return fail("TEACHING_TARGET_UNAVAILABLE", "Compare-mode requires a grounded actor comparison.");
  const timelineRefs: TeachingReference[] = input.scientificTimeline ? [
    ...uniqueSorted((input.scientificTimeline.chapters ?? []).map((chapter) => chapter.chapterId)).map((id) => ref("timelineChapter", id)),
    ...uniqueSorted(input.scientificTimeline.events.map((event) => event.eventId)).map((id) => ref("timelineEvent", id)),
    ...uniqueSorted(input.scientificTimeline.transitions.map((transition) => transition.transitionId)).map((id) => ref("timelineTransition", id)),
  ] : [];
  const chapterFocus = [...focus, ...states.map((id) => ref("scientificState", id)), ...(mode === "why" ? [ref("interaction", interactions[0]!), ref("topologyChange", changes[0]!)] : []), ...timelineRefs];
  const chapters: TeachingChapter[] = [{ chapterId: "identify-grounded-scene", order: 1, title: mode === "why" ? "Observe the grounded mechanism" : mode === "compare" ? "Observe the grounded comparison" : "Identify the grounded target", focus: chapterFocus, annotationIds: ["annotation-focus"], ...(causalSteps.length ? { causalStepIds: causalSteps.map((step) => step.stepId) } : {}), ...(contrasts.length ? { contrastIds: contrasts.map((contrast) => contrast.contrastId) } : {}) }];
  if (mode === "explain" || mode === "why" || mode === "misconceptionCorrection") chapters.push({ chapterId: "connect-grounded-evidence", order: 2, title: mode === "why" ? "Connect cause and change" : mode === "misconceptionCorrection" ? "Correct with grounded evidence" : "Connect the grounded evidence", focus: mode === "why" ? [ref("interaction", interactions[0]!), ref("topologyChange", changes[0]!)] : sourceEvidence(input.scientificScene), context: focus, ...(causalSteps.length ? { causalStepIds: causalSteps.map((step) => step.stepId) } : {}) });
  const misconception = mode === "misconceptionCorrection" ? input.teachingRequest.misconception : undefined;
  if (mode === "misconceptionCorrection" && !misconception) return fail("TEACHING_MODE_UNSUPPORTED", "Misconception-correction mode requires structured correction policy input.");
  const pedagogicalChapters: TeachingChapter[] = mode === "compare" && contrasts.length
    ? [
      { chapterId: "compare-focus-a", order: 1, title: "Focus target A", focus: [contrasts[0]!.left], annotationIds: ["annotation-focus"] },
      { chapterId: "compare-focus-b", order: 2, title: "Focus target B", focus: [contrasts[0]!.right], annotationIds: ["annotation-focus"] },
      { chapterId: "compare-commonality", order: 3, title: "Connect the common ground", focus: [contrasts[0]!.left, contrasts[0]!.right], annotationIds: ["annotation-focus"] },
      { chapterId: "compare-difference", order: 4, title: "Make the grounded distinction", focus: [contrasts[0]!.left, contrasts[0]!.right], contrastIds: [contrasts[0]!.contrastId], annotationIds: ["annotation-focus"] },
      { chapterId: "compare-synthesis", order: 5, title: "Synthesize the comparison", focus: [contrasts[0]!.left, contrasts[0]!.right], contrastIds: [contrasts[0]!.contrastId], annotationIds: ["annotation-focus"] },
    ]
    : mode === "misconceptionCorrection" && misconception
      ? [
        { chapterId: "correction-identify-claim", order: 1, title: "Identify the incorrect claim", focus, annotationIds: ["annotation-focus"] },
        { chapterId: "correction-evidence", order: 2, title: "Focus grounded evidence", focus: sourceEvidence(input.scientificScene), context: focus, annotationIds: ["annotation-focus"] },
        { chapterId: "correction-present", order: 3, title: "Present the correction", focus: sourceEvidence(input.scientificScene), context: focus, annotationIds: ["annotation-focus"] },
        { chapterId: "correction-reinforce", order: 4, title: "Reinforce the correct model", focus: chapterFocus, annotationIds: ["annotation-focus"] },
      ]
      : chapters;
  const v3Chapters: TeachingChapter[] = pedagogicalChapters.map((chapter) => ({ ...chapter, chapterRole: chapterRoleFor(mode, chapter.chapterId), dependsOnChapterIds: chapterDependencies(chapter.chapterId), disclosure: { primaryFocusRefs: chapter.focus, secondaryContextRefs: chapter.context ?? [], suppressedContextRefs: [], detail: mode === "why" ? "MECHANISTIC" : "STRUCTURAL" }, ...(input.scientificTimeline ? { timelineMapping: { chapterIds: uniqueSorted((input.scientificTimeline.chapters ?? []).map(x=>x.chapterId)), eventIds: uniqueSorted(input.scientificTimeline.events.map(x=>x.eventId)), transitionIds: uniqueSorted(input.scientificTimeline.transitions.map(x=>x.transitionId)) } } : {}) }));
  const plan: TeachingPlan = {
    schemaVersion: "3", planId: `teaching-${input.capability.capabilityId}-${modeId(mode)}`, sceneId: input.scientificScene.sceneId, requestMode: mode,
    learningObjective: objectiveText(objectiveKind, input.capability), objectiveTrace: { objectiveKind, capabilityId: input.capability.capabilityId, phenomenon: input.capability.phenomenon, mechanism: uniqueSorted(input.capability.mechanisms)[0], targetActorIds: actors as never, requestMode: mode },
    prerequisiteAssumptions: [], chapters: v3Chapters, annotations, ...(causalSteps.length ? { causalSteps } : {}), ...(contrasts.length ? { contrasts } : {}),
    ...(misconception ? { misconceptionCorrection: { misconception: misconception.misconception, correction: misconception.correction, chapterIds: pedagogicalChapters.map((chapter) => chapter.chapterId), evidence: sourceEvidence(input.scientificScene) } } : {}),
    projections: [
      { audience: "beginner", chapterIds: [pedagogicalChapters[0]!.chapterId], revealedAnnotationIds: ["annotation-focus"] },
      { audience: "intermediate", chapterIds: pedagogicalChapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["annotation-focus"] },
      { audience: "advanced", chapterIds: pedagogicalChapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["annotation-focus"] },
    ],
  };
  const validation = validateTeachingPlan(plan, input.scientificScene, input.scientificTimeline);
  return validation.valid ? { ok: true, plan } : fail("TEACHING_REFERENCE_INVALID", ...validation.issues.map((issue) => `${issue.path}: ${issue.message}`));
}
