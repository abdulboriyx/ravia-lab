/** A-F: deterministic, grounded wording and narration/caption hooks. */
import type { ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { validateScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, validateScientificTimeline, type ScientificTimeline } from "./scientific-timeline.ts";
import type { TeachingReference, TeachingPlan, TeachingRequestMode, TeachingObjectiveTrace } from "./teaching-plan.ts";
import type { AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import type { TeachingSnapshotV1 } from "./teaching-snapshot.ts";

export const teachingTextSegmentKinds = ["OBJECTIVE", "IDENTIFICATION", "EXPLANATION", "CAUSAL", "COMPARISON", "CORRECTION", "ANNOTATION", "SUMMARY", "NARRATION", "CAPTION"] as const;
export type TeachingTextSegmentKind = typeof teachingTextSegmentKinds[number];
export const teachingTextLengthLimits = { LABEL: 96, ANNOTATION: 240, CAPTION: 320, NARRATION: 480, EXPLANATION: 640 } as const;

export type TeachingTextSegmentV1 = Readonly<{
  segmentId: string;
  kind: TeachingTextSegmentKind;
  text: string;
  targetRefs: readonly TeachingReference[];
  scientificClaimRefs: readonly TeachingReference[];
  provenanceRefs: readonly TeachingReference[];
  audience: AudienceTeachingProgramV1["audience"];
  chapterId: string;
  cueId?: string;
  emphasis?: "PRIMARY" | "SECONDARY" | "NONE";
  fidelityTiers?: readonly ScientificFidelityTier[];
}>;

export type TeachingTextBundleV1 = Readonly<{
  schemaVersion: "1";
  teachingPlanId: string;
  snapshotTrace: Readonly<{ chapterProgramId: string; timeSeconds: number; activeChapterIds: readonly string[] }>;
  audience: AudienceTeachingProgramV1["audience"];
  requestMode: TeachingRequestMode;
  chapterId: string;
  chapterTitle: string;
  learningObjectiveText: string;
  explanationSegments: readonly TeachingTextSegmentV1[];
  annotationText: readonly TeachingTextSegmentV1[];
  causalText: readonly TeachingTextSegmentV1[];
  contrastText: readonly TeachingTextSegmentV1[];
  correctionText: readonly TeachingTextSegmentV1[];
  terminology: Readonly<{ level: AudienceTeachingProgramV1["policy"]["terminologyLevel"]; explanationDepth: AudienceTeachingProgramV1["policy"]["explanationDepth"] }>;
  narrationSegments: readonly TeachingTextSegmentV1[];
  captionSegments: readonly CaptionSegmentV1[];
  segments: readonly TeachingTextSegmentV1[];
  provenanceRefs: readonly TeachingReference[];
  support: Readonly<{ status: "SUPPORTED" | "UNAVAILABLE"; code?: TeachingTextFailureCode; reasons: readonly string[] }>;
}>;

export type NarrationCueV1 = Readonly<{
  cueId: string;
  chapterId: string;
  segmentIds: readonly string[];
  purpose: "orient" | "explain" | "contrast" | "correct";
  targetRefs: readonly TeachingReference[];
  timelineRefs: readonly TeachingReference[];
  activation: Readonly<{ chapterId: string; startSeconds?: number; endSeconds?: number; timelineRefs: readonly TeachingReference[] }>;
  audience: AudienceTeachingProgramV1["audience"];
  priority: number;
  order: number;
  provenanceRefs: readonly TeachingReference[];
}>;

export type CaptionSegmentV1 = Readonly<{ segmentId: string; cueId: string; chapterId: string; text: string; activation: NarrationCueV1["activation"]; provenanceRefs: readonly TeachingReference[] }>;
export type NarrationCueProgramV1 = Readonly<{ schemaVersion: "1"; teachingPlanId: string; audience: AudienceTeachingProgramV1["audience"]; cues: readonly NarrationCueV1[]; captionSegments: readonly CaptionSegmentV1[] }>;

export const teachingTextFailureCodes = ["TEACHING_TEXT_UNSUPPORTED", "TEACHING_CLAIM_UNAVAILABLE", "TEACHING_WORDING_REFERENCE_INVALID", "NARRATION_CUE_INVALID", "MISCONCEPTION_EVIDENCE_UNAVAILABLE", "SCIENTIFIC_STATE_UNAVAILABLE", "FRAGMENTATION_UNGROUNDED"] as const;
export type TeachingTextFailureCode = typeof teachingTextFailureCodes[number];
export type TeachingTextResult = Readonly<{ ok: true; bundle: TeachingTextBundleV1; narration: NarrationCueProgramV1 } | { ok: false; code: TeachingTextFailureCode; reasons: readonly string[] }>;

export type TeachingTextContext = Readonly<{ scene?: ScientificSceneSpec; timeline?: ScientificTimeline }>;
export type BuildTeachingTextInput = Readonly<{ snapshot: TeachingSnapshotV1; teachingPlan: TeachingPlan; audienceProgram: AudienceTeachingProgramV1; context?: TeachingTextContext; upstreamFailureCode?: "FRAGMENTATION_UNGROUNDED" }>;

export type TeachingWordingProviderInputV1 = Readonly<{ segmentId: string; kind: TeachingTextSegmentKind; suppliedText: string; targetRefs: readonly TeachingReference[]; scientificClaimRefs: readonly TeachingReference[]; provenanceRefs: readonly TeachingReference[]; audience: AudienceTeachingProgramV1["audience"]; maxLength: number; terminologyLevel: AudienceTeachingProgramV1["policy"]["terminologyLevel"] }>;
export type TeachingWordingProviderOutputV1 = Readonly<{ segmentId: string; text: string; targetRefs: readonly TeachingReference[]; scientificClaimRefs: readonly TeachingReference[]; provenanceRefs: readonly TeachingReference[] }>;
export type TeachingWordingProviderV1 = Readonly<{ rewrite: (input: TeachingWordingProviderInputV1) => TeachingWordingProviderOutputV1 }>;

const fail = (code: TeachingTextFailureCode, ...reasons: string[]): TeachingTextResult => ({ ok: false, code, reasons });
const refKey = (ref: TeachingReference) => JSON.stringify(ref);
const uniqueRefs = (values: readonly TeachingReference[]) => [...values].sort((a, b) => refKey(a).localeCompare(refKey(b))).filter((ref, index, all) => index === all.findIndex((other) => refKey(other) === refKey(ref)));
const uniqueStrings = (values: readonly string[]) => [...new Set(values)].sort();
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const bounded = (value: string, limit: number) => { const text = clean(value); return text.length <= limit ? text : `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}…`; };
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const refId = (ref: TeachingReference) => ref.kind === "actor" ? ref.actorId : ref.kind === "group" ? ref.groupId : ref.kind === "claim" ? ref.claimId : ref.kind === "source" ? ref.sourceId : ref.kind === "scientificState" ? ref.stateId : ref.kind === "interaction" ? ref.interactionId : ref.kind === "topologyChange" ? ref.topologyChangeId : ref.kind === "timelineChapter" ? ref.timelineChapterId : ref.kind === "timelineEvent" ? ref.timelineEventId : ref.timelineTransitionId;

function labelFor(ref: TeachingReference, scene?: ScientificSceneSpec): string {
  if (scene) {
    if (ref.kind === "actor") { const actor = scene.actors.find((item) => item.actorId === ref.actorId); if (actor) return actor.scientificSubtype ? humanize(actor.scientificSubtype) : humanize(String(actor.semanticTypeId)); }
    if (ref.kind === "group") { const group = scene.groups.find((item) => item.groupId === ref.groupId); if (group) return group.label ?? humanize(String(group.kind)); }
    if (ref.kind === "scientificState") { const state = scene.states.find((item) => item.stateId === ref.stateId); if (state) return humanize(String(state.kind)); }
    if (ref.kind === "interaction") { const interaction = scene.topology.interactions.find((item) => item.interactionId === ref.interactionId); if (interaction) return humanize(String(interaction.type)); }
    if (ref.kind === "topologyChange") { const change = scene.topology.changes?.find((item) => item.changeId === ref.topologyChangeId); if (change) return humanize(String(change.kind)); }
  }
  return humanize(String(refId(ref)));
}

function objectiveKind(plan: TeachingPlan): NonNullable<TeachingObjectiveTrace>["objectiveKind"] {
  if (plan.objectiveTrace) return plan.objectiveTrace.objectiveKind;
  return plan.requestMode === "compare" ? "COMPARE" : plan.requestMode === "why" ? "EXPLAIN_CAUSE" : plan.requestMode === "misconceptionCorrection" ? "CORRECT_MISCONCEPTION" : plan.requestMode === "explain" ? "EXPLAIN_MECHANISM" : "IDENTIFY";
}

function objectiveText(plan: TeachingPlan, audience: AudienceTeachingProgramV1["audience"]): string {
  const noun = plan.objectiveTrace?.phenomenon ? humanize(plan.objectiveTrace.phenomenon) : "the grounded teaching target";
  const prefix = audience === "BEGINNER" ? "Learn to" : audience === "INTERMEDIATE" ? "Understand how to" : "Analyze";
  const kind = objectiveKind(plan);
  const action = kind === "IDENTIFY" ? "identify" : kind === "DESCRIBE" ? "describe" : kind === "EXPLAIN_MECHANISM" ? "explain" : kind === "EXPLAIN_CAUSE" ? "explain why" : kind === "COMPARE" ? "compare" : kind === "CORRECT_MISCONCEPTION" ? "correct a misconception about" : "inspect";
  return bounded(`${prefix} ${action} ${noun}.`, teachingTextLengthLimits.EXPLANATION);
}

function titleFor(entry: AudienceTeachingProgramV1["entries"][number], scene?: ScientificSceneSpec): string {
  const target = entry.disclosure.primaryFocusRefs[0];
  const label = target ? labelFor(target, scene) : humanize(entry.chapterId);
  return bounded(`${humanize(entry.role)}: ${label}`, teachingTextLengthLimits.LABEL);
}

function fidelityFor(refs: readonly TeachingReference[], scene?: ScientificSceneSpec): ScientificFidelityTier[] {
  if (!scene) return [];
  const sourceIds = new Set(refs.filter((ref) => ref.kind === "source").map((ref) => ref.sourceId));
  return [...new Set(scene.fidelityProvenance.attachments.filter((attachment) => sourceIds.has(attachment.provenanceSourceId)).map((attachment) => attachment.fidelity))].sort();
}

function segment(id: string, kind: TeachingTextSegmentKind, text: string, chapterId: string, audience: AudienceTeachingProgramV1["audience"], targetRefs: readonly TeachingReference[], provenanceRefs: readonly TeachingReference[], snapshot: TeachingSnapshotV1, scene?: ScientificSceneSpec, emphasis: TeachingTextSegmentV1["emphasis"] = "NONE"): TeachingTextSegmentV1 {
  const claims = targetRefs.filter((ref) => ref.kind === "claim");
  return { segmentId: id, kind, text: bounded(text, kind === "ANNOTATION" ? teachingTextLengthLimits.ANNOTATION : kind === "CAPTION" ? teachingTextLengthLimits.CAPTION : kind === "NARRATION" ? teachingTextLengthLimits.NARRATION : teachingTextLengthLimits.EXPLANATION), targetRefs: uniqueRefs(targetRefs), scientificClaimRefs: uniqueRefs(claims), provenanceRefs: uniqueRefs(provenanceRefs), audience, chapterId, emphasis, fidelityTiers: fidelityFor(provenanceRefs, scene), ...(snapshot.narrationCueIds.includes(id) ? { cueId: id } : {}) };
}

function activeEntries(input: BuildTeachingTextInput) {
  const ids = new Set(input.snapshot.activeChapterIds);
  return input.audienceProgram.entries.filter((entry) => ids.has(entry.chapterId)).sort((a, b) => a.order - b.order || a.chapterId.localeCompare(b.chapterId));
}

function timelineActivation(chapterId: string, refs: readonly TeachingReference[], timeline?: ScientificTimeline): NarrationCueV1["activation"] {
  const chapterRef = refs.find((ref) => ref.kind === "timelineChapter");
  const chapter = chapterRef && timeline?.chapters?.find((item) => item.chapterId === chapterRef.timelineChapterId);
  return { chapterId, ...(chapter ? { startSeconds: chapter.start, endSeconds: chapter.end } : {}), timelineRefs: uniqueRefs(refs.filter((ref) => ref.kind.startsWith("timeline"))) };
}

function purposeFor(mode: TeachingRequestMode): NarrationCueV1["purpose"] { return mode === "compare" ? "contrast" : mode === "misconceptionCorrection" ? "correct" : mode === "why" || mode === "explain" ? "explain" : "orient"; }

export function buildTeachingTextBundle(input: BuildTeachingTextInput): TeachingTextResult {
  if (input.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED" || input.snapshot.support.code === "FRAGMENTATION_UNGROUNDED") return fail("FRAGMENTATION_UNGROUNDED", "upstream fragmentation semantics are ungrounded");
  if (input.snapshot.support.status !== "SUPPORTED") return fail("SCIENTIFIC_STATE_UNAVAILABLE", ...input.snapshot.support.reasons);
  if (input.context?.scene) {
    const sceneValidation = validateScientificSceneSpec(input.context.scene);
    if (!sceneValidation.valid) return fail("SCIENTIFIC_STATE_UNAVAILABLE", ...sceneValidation.issues.map((issue) => `${issue.path}: ${issue.message}`));
    if (input.context.timeline) {
      const timelineValidation = validateScientificTimeline(input.context.timeline, timelineContextFromScene(input.context.scene));
      if (!timelineValidation.valid) return fail("SCIENTIFIC_STATE_UNAVAILABLE", ...timelineValidation.issues.map((issue) => `${issue.path}: ${issue.message}`));
    }
  }
  if (input.snapshot.teachingPlanId !== input.teachingPlan.planId || input.snapshot.audience !== input.audienceProgram.audience) return fail("TEACHING_WORDING_REFERENCE_INVALID", "snapshot and teaching programs do not identify the same plan and audience");
  const entries = activeEntries(input);
  if (!entries.length) return fail("TEACHING_TEXT_UNSUPPORTED", "snapshot has no active audience teaching chapter");
  const planChapterIds = new Set(input.teachingPlan.chapters.map((chapter) => chapter.chapterId));
  if (entries.some((entry) => !planChapterIds.has(entry.chapterId))) return fail("TEACHING_WORDING_REFERENCE_INVALID", "audience program contains a chapter absent from the TeachingPlan");
  const explanation: TeachingTextSegmentV1[] = [];
  const annotations: TeachingTextSegmentV1[] = [];
  const causal: TeachingTextSegmentV1[] = [];
  const comparison: TeachingTextSegmentV1[] = [];
  const correction: TeachingTextSegmentV1[] = [];
  const narration: TeachingTextSegmentV1[] = [];
  const activeRefs = input.snapshot.activeFocusRefs;
  const provenance = input.snapshot.provenanceRefs;
  const chapterId = entries[0]!.chapterId;
  const firstLabel = activeRefs[0] ? labelFor(activeRefs[0], input.context?.scene) : "the grounded target";
  const identityText = input.snapshot.requestMode === "show" ? `${firstLabel} is the current focus.` : `${firstLabel} is part of the grounded scene.`;
  explanation.push(segment(`${chapterId}:identity`, "IDENTIFICATION", identityText, chapterId, input.audienceProgram.audience, activeRefs, provenance, input.snapshot, input.context?.scene, "PRIMARY"));
  for (const entry of entries) {
    const chapter = input.teachingPlan.chapters.find((item) => item.chapterId === entry.chapterId)!;
    for (const annotationId of entry.disclosure.activeAnnotationIds.filter((id) => input.snapshot.activeAnnotationIds.includes(id))) {
      const annotation = input.teachingPlan.annotations?.find((item) => item.annotationId === annotationId);
      if (!annotation) return fail("TEACHING_WORDING_REFERENCE_INVALID", `missing annotation ${annotationId}`);
      annotations.push(segment(`${entry.chapterId}:annotation:${annotationId}`, "ANNOTATION", annotation.text, entry.chapterId, input.audienceProgram.audience, [annotation.target], provenance, input.snapshot, input.context?.scene, "SECONDARY"));
    }
    for (const stepId of entry.disclosure.activeCausalStepIds.filter((id) => input.snapshot.activeCausalStepIds.includes(id))) {
      const step = input.teachingPlan.causalSteps?.find((item) => item.stepId === stepId);
      if (!step) return fail("TEACHING_CLAIM_UNAVAILABLE", `missing causal step ${stepId}`);
      const refs = [step.cause, step.effect];
      if (input.snapshot.requestMode !== "show") causal.push(segment(`${entry.chapterId}:causal:${stepId}`, "CAUSAL", step.explanation, entry.chapterId, input.audienceProgram.audience, refs, provenance, input.snapshot, input.context?.scene));
    }
    for (const contrastId of entry.disclosure.activeContrastIds.filter((id) => input.snapshot.activeContrastIds.includes(id))) {
      const contrast = input.teachingPlan.contrasts?.find((item) => item.contrastId === contrastId);
      if (!contrast) return fail("TEACHING_CLAIM_UNAVAILABLE", `missing contrast ${contrastId}`);
      const refs = [contrast.left, contrast.right];
      comparison.push(segment(`${entry.chapterId}:contrast:${contrastId}`, "COMPARISON", contrast.distinction, entry.chapterId, input.audienceProgram.audience, refs, provenance, input.snapshot, input.context?.scene));
    }
    if (input.audienceProgram.correction && entry.disclosure.activeCorrectionIds.length && input.snapshot.activeCorrectionStageIds.length) {
      for (const stepId of input.snapshot.activeCorrectionStageIds) {
        const step = input.audienceProgram.correction.steps.find((item) => item.stepId === stepId);
        if (!step) return fail("MISCONCEPTION_EVIDENCE_UNAVAILABLE", `missing correction step ${stepId}`);
        if (!step.refs.length && step.kind !== "SURFACE_INCORRECT_MODEL") return fail("MISCONCEPTION_EVIDENCE_UNAVAILABLE", `correction step ${stepId} has no grounded refs`);
        const text = step.sourceText ?? (step.kind === "FOCUS_GROUNDED_EVIDENCE" ? "Review the grounded evidence." : step.kind === "STATE_CORRECT_MODEL" ? "Use the grounded model." : "Keep the grounded relation in view.");
        correction.push(segment(`${entry.chapterId}:correction:${stepId}`, "CORRECTION", text, entry.chapterId, input.audienceProgram.audience, step.refs, step.provenanceRefs, input.snapshot, input.context?.scene));
      }
    }
    if (chapter.chapterId !== chapterId && input.snapshot.requestMode !== "show") explanation.push(segment(`${entry.chapterId}:explanation`, "EXPLANATION", `${titleFor(entry, input.context?.scene)} is active in the grounded sequence.`, entry.chapterId, input.audienceProgram.audience, entry.disclosure.primaryFocusRefs, entry.provenanceRefs, input.snapshot, input.context?.scene));
  }
  const allContent = [...explanation, ...annotations, ...causal, ...comparison, ...correction];
  for (const item of allContent) { if (input.snapshot.requestMode === "show" && item.kind === "CAUSAL") continue; if (input.snapshot.requestMode === "why" && item.kind === "CAUSAL") narration.push({ ...item, kind: "NARRATION", text: bounded(item.text, teachingTextLengthLimits.NARRATION) }); else if (item.kind === "IDENTIFICATION" || item.kind === "EXPLANATION" || item.kind === "CORRECTION" || item.kind === "COMPARISON") narration.push({ ...item, kind: "NARRATION", text: bounded(item.text, teachingTextLengthLimits.NARRATION) }); }
  const objective = segment(`${chapterId}:objective`, "OBJECTIVE", objectiveText(input.teachingPlan, input.audienceProgram.audience), chapterId, input.audienceProgram.audience, input.snapshot.activeFocusRefs, provenance, input.snapshot, input.context?.scene, "PRIMARY");
  const captions = narration.map((item) => ({ ...item, kind: "CAPTION" as const, text: bounded(item.text, teachingTextLengthLimits.CAPTION) }));
  const title = titleFor(entries[0]!, input.context?.scene);
  const segments = [objective, ...allContent, ...narration, ...captions];
  const cues: NarrationCueV1[] = narration.map((item, index) => ({ cueId: item.cueId ?? `cue:${item.segmentId}`, chapterId: item.chapterId, segmentIds: [item.segmentId], purpose: purposeFor(input.snapshot.requestMode), targetRefs: item.targetRefs, timelineRefs: uniqueRefs(item.targetRefs.filter((ref) => ref.kind.startsWith("timeline"))), activation: timelineActivation(item.chapterId, input.snapshot.timelineTraceRefs, input.context?.timeline), audience: input.audienceProgram.audience, priority: item.emphasis === "PRIMARY" ? 0 : 1, order: index, provenanceRefs: item.provenanceRefs }));
  const captionSegments: CaptionSegmentV1[] = captions.map((caption, index) => ({ segmentId: caption.segmentId, cueId: cues[index]?.cueId ?? `cue:${caption.segmentId}`, chapterId: caption.chapterId, text: caption.text, activation: cues[index]?.activation ?? timelineActivation(caption.chapterId, input.snapshot.timelineTraceRefs, input.context?.timeline), provenanceRefs: caption.provenanceRefs }));
  const bundle: TeachingTextBundleV1 = { schemaVersion: "1", teachingPlanId: input.teachingPlan.planId, snapshotTrace: { chapterProgramId: input.snapshot.chapterProgramId, timeSeconds: input.snapshot.timeSeconds, activeChapterIds: input.snapshot.activeChapterIds }, audience: input.audienceProgram.audience, requestMode: input.snapshot.requestMode, chapterId, chapterTitle: title, learningObjectiveText: objective.text, explanationSegments: explanation, annotationText: annotations, causalText: causal, contrastText: comparison, correctionText: correction, terminology: { level: input.audienceProgram.policy.terminologyLevel, explanationDepth: input.audienceProgram.policy.explanationDepth }, narrationSegments: narration, captionSegments, segments, provenanceRefs: uniqueRefs(provenance), support: { status: "SUPPORTED", reasons: [] } };
  const narrationProgram: NarrationCueProgramV1 = { schemaVersion: "1", teachingPlanId: input.teachingPlan.planId, audience: input.audienceProgram.audience, cues, captionSegments };
  return { ok: true, bundle, narration: narrationProgram };
}

export function resolveNarrationAtSnapshot(snapshot: TeachingSnapshotV1, program: NarrationCueProgramV1): readonly NarrationCueV1[] {
  const active = new Set(snapshot.activeChapterIds);
  return program.cues.filter((cue) => active.has(cue.chapterId) && snapshot.timeSeconds >= (cue.activation.startSeconds ?? Number.NEGATIVE_INFINITY) && (cue.activation.endSeconds === undefined || snapshot.timeSeconds < cue.activation.endSeconds)).sort((a, b) => a.priority - b.priority || a.order - b.order || a.cueId.localeCompare(b.cueId));
}

export function validateTeachingWordingProviderOutput(input: TeachingWordingProviderInputV1, output: TeachingWordingProviderOutputV1): { valid: true } | { valid: false; code: "TEACHING_WORDING_REFERENCE_INVALID"; reasons: readonly string[] } {
  const allowed = new Set(input.targetRefs.map(refKey));
  const claimAllowed = new Set(input.scientificClaimRefs.map(refKey));
  const provenanceAllowed = new Set(input.provenanceRefs.map(refKey));
  const reasons: string[] = [];
  if (output.segmentId !== input.segmentId) reasons.push("provider changed segment identity");
  if (!clean(output.text) || output.text.length > input.maxLength) reasons.push("provider text is empty or exceeds the bounded length");
  if (output.targetRefs.some((ref) => !allowed.has(refKey(ref)))) reasons.push("provider introduced an unsupplied target ref");
  if (output.scientificClaimRefs.some((ref) => !claimAllowed.has(refKey(ref)))) reasons.push("provider introduced an unsupplied claim ref");
  if (output.provenanceRefs.some((ref) => !provenanceAllowed.has(refKey(ref)))) reasons.push("provider introduced an unsupplied provenance ref");
  return reasons.length ? { valid: false, code: "TEACHING_WORDING_REFERENCE_INVALID", reasons } : { valid: true };
}

export function serializeTeachingTextBundle(bundle: TeachingTextBundleV1): string { return JSON.stringify(bundle); }
export function serializeNarrationCueProgram(program: NarrationCueProgramV1): string { return JSON.stringify(program); }
export function deserializeTeachingTextBundle(serialized: string): TeachingTextBundleV1 { return JSON.parse(serialized) as TeachingTextBundleV1; }
export function deserializeNarrationCueProgram(serialized: string): NarrationCueProgramV1 { return JSON.parse(serialized) as NarrationCueProgramV1; }
