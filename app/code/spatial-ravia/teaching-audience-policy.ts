/** A-D: deterministic audience policy over an already-grounded TeachingChapterProgramV1. */
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import { compileTeachingChapterProgram, disclosureDetails, type TeachingChapterProgramEntryV1, type TeachingChapterProgramV1 } from "./teaching-chapter-program.ts";
import { validateTeachingPlan, type TeachingPlan, type TeachingReference } from "./teaching-plan.ts";
import type { CellularScientificExtensionV1 } from "./cellular-localization.ts";

export const teachingAudiencePolicyLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type TeachingAudiencePolicyLevel = typeof teachingAudiencePolicyLevels[number];
export const presentationAudienceToTeachingAudience = { general: "BEGINNER", student: "INTERMEDIATE", expert: "ADVANCED" } as const;
export const semanticDetailToTeachingAudience = { beginner: "BEGINNER", intermediate: "INTERMEDIATE", advanced: "ADVANCED", auto: "INTERMEDIATE" } as const;
export function mapPresentationAudienceToTeachingAudience(audience: keyof typeof presentationAudienceToTeachingAudience): TeachingAudiencePolicyLevel { return presentationAudienceToTeachingAudience[audience]; }
export function mapSemanticDetailToTeachingAudience(detail: keyof typeof semanticDetailToTeachingAudience): TeachingAudiencePolicyLevel { return semanticDetailToTeachingAudience[detail]; }
export const terminologyLevels = ["CONCEPTUAL", "STANDARD_SCIENTIFIC", "TECHNICAL"] as const;
export const explanationDepths = ["CORE", "STRUCTURED", "EVIDENCE_RICH"] as const;
export const disclosureDepths = ["GRADUAL", "BALANCED", "FULL"] as const;
export const chemistryDepths = ["NONE", "CONCEPTUAL", "MOLECULAR", "LOCAL_CHEMISTRY"] as const;
export const mechanismGranularities = ["CORE", "STEPWISE", "FINE"] as const;
export const annotationDensities = ["LOW", "MEDIUM", "HIGH"] as const;
export const contextRetentions = ["BROAD", "MEANINGFUL", "MINIMAL"] as const;
export const causalDepths = ["CORE", "CHAIN", "TOPOLOGY"] as const;
export const misconceptionExplanationDepths = ["MINIMAL", "RELATIONAL", "CLAIM_LEVEL"] as const;
export type TeachingDetail = typeof disclosureDetails[number];

export type AudienceTeachingPolicyV1 = {
  terminologyLevel: typeof terminologyLevels[number];
  explanationDepth: typeof explanationDepths[number];
  disclosureDepth: typeof disclosureDepths[number];
  chemistryDepth: typeof chemistryDepths[number];
  mechanismGranularity: typeof mechanismGranularities[number];
  annotationDensity: typeof annotationDensities[number];
  contextRetention: typeof contextRetentions[number];
  causalDepth: typeof causalDepths[number];
  misconceptionExplanationDepth: typeof misconceptionExplanationDepths[number];
  maximumDetail: TeachingDetail;
};

export type AudienceCorrectionStepV1 = {
  stepId: "surface-incorrect-model" | "focus-grounded-evidence" | "state-correct-model" | "reinforce-grounded-relation";
  kind: "SURFACE_INCORRECT_MODEL" | "FOCUS_GROUNDED_EVIDENCE" | "STATE_CORRECT_MODEL" | "REINFORCE_GROUNDED_RELATION";
  sourceText?: string;
  refs: TeachingReference[];
  provenanceRefs: TeachingReference[];
};
export type AudienceTeachingProgramEntryV1 = TeachingChapterProgramEntryV1 & {
  authoritativeRefs: TeachingReference[];
  projectedDetail: TeachingDetail;
};
export type AudienceTeachingProgramV1 = {
  schemaVersion: "1";
  audience: TeachingAudiencePolicyLevel;
  planId: string;
  sceneId: string;
  requestMode: TeachingPlan["requestMode"];
  policy: AudienceTeachingPolicyV1;
  selectedChapterIds: string[];
  compressedChapterIds: string[];
  authoritativeRefs: TeachingReference[];
  entries: AudienceTeachingProgramEntryV1[];
  correction?: { misconception: string; correction: string; steps: AudienceCorrectionStepV1[] };
};
export type AudienceTeachingFailureCode =
  | "AUDIENCE_PROJECTION_UNSUPPORTED"
  | "AUDIENCE_DETAIL_UNAVAILABLE"
  | "MISCONCEPTION_EVIDENCE_UNAVAILABLE"
  | "TEACHING_DEPENDENCY_INVALID"
  | "SCIENTIFIC_STATE_UNAVAILABLE"
  | "FRAGMENTATION_UNGROUNDED";
export type AudienceTeachingProjectionResult = { ok: true; program: AudienceTeachingProgramV1 } | { ok: false; code: AudienceTeachingFailureCode; reasons: string[] };
export type ProjectTeachingForAudienceInput = {
  teachingPlan: TeachingPlan;
  chapterProgram: TeachingChapterProgramV1;
  audience: TeachingAudiencePolicyLevel;
  scene?: ScientificSceneSpec;
  timeline?: ScientificTimeline;
  cellular?: CellularScientificExtensionV1;
  requestedDetail?: TeachingDetail;
  upstreamFailureCode?: "FRAGMENTATION_UNGROUNDED";
};

const detailRank: Record<TeachingDetail, number> = { OVERVIEW: 0, STRUCTURAL: 1, MECHANISTIC: 2, MOLECULAR: 3, LOCAL_CHEMISTRY: 4 };
const detailByRank: TeachingDetail[] = ["OVERVIEW", "STRUCTURAL", "MECHANISTIC", "MOLECULAR", "LOCAL_CHEMISTRY"];
const lowerAudience: Record<TeachingAudiencePolicyLevel, TeachingPlan["projections"][number]["audience"]> = { BEGINNER: "beginner", INTERMEDIATE: "intermediate", ADVANCED: "advanced" };
const key = (ref: TeachingReference) => JSON.stringify(ref);
const sortIds = (values: readonly string[]) => [...new Set(values)].sort();
const uniqueRefs = (values: readonly TeachingReference[]) => [...values].sort((a, b) => key(a).localeCompare(key(b))).filter((ref, index, all) => index === all.findIndex((other) => key(other) === key(ref)));
const authoritativeRefsForEntry = (entry: TeachingChapterProgramEntryV1) => uniqueRefs([...entry.disclosure.primaryFocusRefs, ...entry.disclosure.secondaryContextRefs, ...entry.disclosure.suppressedContextRefs, ...entry.timelineRefs, ...entry.provenanceRefs]);

export const audiencePolicyFor = (audience: TeachingAudiencePolicyLevel, mode: TeachingPlan["requestMode"]): AudienceTeachingPolicyV1 => {
  if (audience === "BEGINNER") return { terminologyLevel: "CONCEPTUAL", explanationDepth: "CORE", disclosureDepth: "GRADUAL", chemistryDepth: "CONCEPTUAL", mechanismGranularity: "CORE", annotationDensity: "LOW", contextRetention: "BROAD", causalDepth: mode === "why" ? "CORE" : "CORE", misconceptionExplanationDepth: "MINIMAL", maximumDetail: "STRUCTURAL" };
  if (audience === "INTERMEDIATE") return { terminologyLevel: "STANDARD_SCIENTIFIC", explanationDepth: "STRUCTURED", disclosureDepth: "BALANCED", chemistryDepth: "MOLECULAR", mechanismGranularity: "STEPWISE", annotationDensity: "MEDIUM", contextRetention: "MEANINGFUL", causalDepth: mode === "why" ? "CHAIN" : "CORE", misconceptionExplanationDepth: "RELATIONAL", maximumDetail: "MECHANISTIC" };
  return { terminologyLevel: "TECHNICAL", explanationDepth: "EVIDENCE_RICH", disclosureDepth: "FULL", chemistryDepth: "LOCAL_CHEMISTRY", mechanismGranularity: "FINE", annotationDensity: "HIGH", contextRetention: "MINIMAL", causalDepth: mode === "why" ? "TOPOLOGY" : "CHAIN", misconceptionExplanationDepth: "CLAIM_LEVEL", maximumDetail: "LOCAL_CHEMISTRY" };
};

function validateProgramShape(program: TeachingChapterProgramV1): string[] {
  const issues: string[] = [];
  const ids = new Set(program.entries.map((entry) => entry.chapterId));
  const visit = (id: string, stack: Set<string>, seen: Set<string>) => {
    if (stack.has(id)) { issues.push("chapter dependency cycle"); return; }
    if (seen.has(id)) return;
    seen.add(id); stack.add(id);
    const entry = program.entries.find((candidate) => candidate.chapterId === id);
    for (const dependency of entry?.dependsOn ?? []) { if (!ids.has(dependency)) issues.push(`${id} depends on missing ${dependency}`); else visit(dependency, stack, seen); }
    stack.delete(id);
  };
  for (const entry of program.entries) visit(entry.chapterId, new Set(), new Set());
  return issues;
}

function closure(entriesById: Map<string, TeachingChapterProgramEntryV1>, selected: Set<string>): Set<string> {
  const result = new Set(selected);
  const addDependencies = (id: string) => { for (const dependency of entriesById.get(id)?.dependsOn ?? []) if (!result.has(dependency)) { result.add(dependency); addDependencies(dependency); } };
  for (const id of [...result]) addDependencies(id);
  return result;
}

function projectedDetail(source: TeachingDetail, maximum: TeachingDetail): TeachingDetail {
  return detailByRank[Math.min(detailRank[source], detailRank[maximum])]!;
}

function projectedEntry(entry: TeachingChapterProgramEntryV1, audience: TeachingAudiencePolicyLevel, policy: AudienceTeachingPolicyV1): AudienceTeachingProgramEntryV1 {
  const allPrimary = entry.disclosure.primaryFocusRefs;
  const primary = audience === "BEGINNER" ? allPrimary.slice(0, 1) : allPrimary;
  const secondary = audience === "BEGINNER" ? uniqueRefs([...entry.disclosure.secondaryContextRefs, ...allPrimary.slice(1)]) : entry.disclosure.secondaryContextRefs;
  const keep = audience === "BEGINNER" ? 1 : audience === "INTERMEDIATE" ? 2 : Number.MAX_SAFE_INTEGER;
  const authoritativeRefs = uniqueRefs([...entry.disclosure.primaryFocusRefs, ...entry.disclosure.secondaryContextRefs, ...entry.disclosure.suppressedContextRefs, ...entry.timelineRefs, ...entry.provenanceRefs]);
  return {
    ...entry,
    authoritativeRefs,
    projectedDetail: projectedDetail(entry.disclosure.detail, policy.maximumDetail),
    disclosure: {
      ...entry.disclosure,
      primaryFocusRefs: primary,
      secondaryContextRefs: secondary,
      activeAnnotationIds: entry.disclosure.activeAnnotationIds.slice(0, keep),
      activeCausalStepIds: audience === "BEGINNER" ? entry.disclosure.activeCausalStepIds.slice(0, 1) : entry.disclosure.activeCausalStepIds,
      activeContrastIds: audience === "BEGINNER" ? entry.disclosure.activeContrastIds.slice(0, 1) : entry.disclosure.activeContrastIds,
      detail: projectedDetail(entry.disclosure.detail, policy.maximumDetail),
    },
  };
}

export function projectTeachingForAudience(input: ProjectTeachingForAudienceInput): AudienceTeachingProjectionResult {
  if (input.upstreamFailureCode === "FRAGMENTATION_UNGROUNDED") return { ok: false, code: "FRAGMENTATION_UNGROUNDED", reasons: ["upstream fragmentation semantics are ungrounded"] };
  if (!teachingAudiencePolicyLevels.includes(input.audience)) return { ok: false, code: "AUDIENCE_PROJECTION_UNSUPPORTED", reasons: ["audience is not a canonical teaching audience"] };
  const shapeIssues = validateProgramShape(input.chapterProgram);
  if (shapeIssues.length) return { ok: false, code: "TEACHING_DEPENDENCY_INVALID", reasons: shapeIssues };
  if (input.scene) {
    const planValidation = validateTeachingPlan(input.teachingPlan, input.scene, input.timeline, input.cellular);
    if (!planValidation.valid) return { ok: false, code: "AUDIENCE_PROJECTION_UNSUPPORTED", reasons: planValidation.issues.map((issue) => `${issue.path}: ${issue.message}`) };
    const rebuilt = compileTeachingChapterProgram(input.teachingPlan, input.scene, input.timeline, input.cellular);
    if (!rebuilt.ok) return { ok: false, code: "AUDIENCE_PROJECTION_UNSUPPORTED", reasons: rebuilt.reasons };
  }
  if (input.requestedDetail && !disclosureDetails.includes(input.requestedDetail)) return { ok: false, code: "AUDIENCE_DETAIL_UNAVAILABLE", reasons: ["requested detail is outside the bounded TeachingPlan v3 vocabulary"] };
  const planProjection = input.teachingPlan.projections.find((projection) => projection.audience === lowerAudience[input.audience]);
  if (!planProjection) return { ok: false, code: "AUDIENCE_PROJECTION_UNSUPPORTED", reasons: ["TeachingPlan has no compatible audience projection"] };
  const entriesById = new Map(input.chapterProgram.entries.map((entry) => [entry.chapterId, entry]));
  const missingChapterIds = planProjection.chapterIds.filter((id) => !entriesById.has(id));
  if (missingChapterIds.length) return { ok: false, code: "TEACHING_DEPENDENCY_INVALID", reasons: missingChapterIds.map((id) => `projection references missing chapter ${id}`) };
  const policy = audiencePolicyFor(input.audience, input.teachingPlan.requestMode);
  const sceneProvenanceRefs: TeachingReference[] = input.scene ? input.scene.fidelityProvenance.sources.map((source) => ({ kind: "source", sourceId: source.sourceId })) : [];
  const candidateIds = new Set(planProjection.chapterIds);
  const selectedIds = new Set(input.audience === "BEGINNER" ? [...candidateIds].filter((id) => {
    const role = entriesById.get(id)!.role;
    return role === "IDENTIFY" || role === "FOCUS" || role === "CAUSE" || role === "SUMMARIZE" || candidateIds.size <= 3;
  }) : candidateIds);
  if (!selectedIds.size) selectedIds.add([...candidateIds][0]!);
  let preservedIds = closure(entriesById, selectedIds);
  const correctionEvidence = input.teachingPlan.misconceptionCorrection?.evidence ?? [];
  if (correctionEvidence.length) {
    const evidenceKeys = new Set(correctionEvidence.map(key));
    for (const entry of input.chapterProgram.entries) if (authoritativeRefsForEntry(entry).some((ref) => evidenceKeys.has(key(ref)))) preservedIds.add(entry.chapterId);
    preservedIds = closure(entriesById, preservedIds);
  }
  const selectedEntries = input.chapterProgram.entries.filter((entry) => preservedIds.has(entry.chapterId)).sort((a, b) => a.order - b.order || a.chapterId.localeCompare(b.chapterId));
  const maxSupportedRank = Math.max(...selectedEntries.map((entry) => detailRank[entry.disclosure.detail]), 0);
  if (input.requestedDetail && detailRank[input.requestedDetail] > maxSupportedRank) return { ok: false, code: "AUDIENCE_DETAIL_UNAVAILABLE", reasons: [`${input.requestedDetail} is not grounded by the selected chapter program`] };
  const entries = selectedEntries.map((entry) => ({ ...projectedEntry(entry, input.audience, policy), dependsOn: entry.dependsOn.filter((dependency) => preservedIds.has(dependency)) }));
  const compressedChapterIds = input.chapterProgram.entries.map((entry) => entry.chapterId).filter((id) => !preservedIds.has(id));
  let correction: AudienceTeachingProgramV1["correction"];
  if (input.teachingPlan.requestMode === "misconceptionCorrection" || input.teachingPlan.misconceptionCorrection) {
    const sequence = input.teachingPlan.misconceptionCorrection;
    if (!sequence || !sequence.evidence.length) return { ok: false, code: "MISCONCEPTION_EVIDENCE_UNAVAILABLE", reasons: ["structured correction requires grounded evidence references"] };
    const authoritative = new Set(entries.flatMap((entry) => entry.authoritativeRefs.map(key)));
    if (sequence.evidence.some((ref) => !authoritative.has(key(ref)))) return { ok: false, code: "MISCONCEPTION_EVIDENCE_UNAVAILABLE", reasons: ["correction evidence is not present in authoritative chapter refs"] };
    const evidence = uniqueRefs(sequence.evidence);
    const provenance = uniqueRefs([...entries.flatMap((entry) => entry.provenanceRefs), ...sceneProvenanceRefs]);
    const reinforcement = uniqueRefs(entries.flatMap((entry) => entry.disclosure.primaryFocusRefs));
    correction = {
      misconception: sequence.misconception,
      correction: sequence.correction,
      steps: [
        { stepId: "surface-incorrect-model", kind: "SURFACE_INCORRECT_MODEL", sourceText: sequence.misconception, refs: [], provenanceRefs: [] },
        { stepId: "focus-grounded-evidence", kind: "FOCUS_GROUNDED_EVIDENCE", refs: evidence, provenanceRefs: provenance },
        { stepId: "state-correct-model", kind: "STATE_CORRECT_MODEL", sourceText: sequence.correction, refs: evidence, provenanceRefs: provenance },
        { stepId: "reinforce-grounded-relation", kind: "REINFORCE_GROUNDED_RELATION", refs: reinforcement, provenanceRefs: provenance },
      ],
    };
  }
  return { ok: true, program: { schemaVersion: "1", audience: input.audience, planId: input.teachingPlan.planId, sceneId: input.teachingPlan.sceneId, requestMode: input.teachingPlan.requestMode, policy, selectedChapterIds: entries.map((entry) => entry.chapterId), compressedChapterIds, authoritativeRefs: uniqueRefs([...input.chapterProgram.entries.flatMap((entry) => [...entry.disclosure.primaryFocusRefs, ...entry.disclosure.secondaryContextRefs, ...entry.disclosure.suppressedContextRefs, ...entry.timelineRefs, ...entry.provenanceRefs]), ...sceneProvenanceRefs]), entries, ...(correction ? { correction } : {}) } };
}
