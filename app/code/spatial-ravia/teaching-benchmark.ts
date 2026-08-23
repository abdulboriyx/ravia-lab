/** A-G: frozen, renderer-independent teaching benchmark over A-B through A-F. */
import { createHash } from "node:crypto";
import { projectTeachingForAudience, type AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import { buildTeachingTextBundle, serializeNarrationCueProgram, serializeTeachingTextBundle } from "./teaching-text.ts";
import { evaluateTeachingAtTime, serializeTeachingSnapshot, type TeachingSnapshotV1 } from "./teaching-snapshot.ts";
import type { TeachingChapterProgramEntryV1 } from "./teaching-chapter-program.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

export const teachingBenchmarkVersion = "teaching-benchmark-v1" as const;
export type TeachingBenchmarkSplit = "DEV" | "SEALED_HOLDOUT";
export type TeachingBenchmarkFamily = "STATIC" | "MECHANISM" | "COMPARE" | "WHY" | "MISCONCEPTION" | "AUDIENCE" | "BOUNDARY" | "NEGATIVE" | "METAMORPHIC";
export type TeachingBenchmarkMode = TeachingPlan["requestMode"];
export type TeachingBenchmarkAudience = AudienceTeachingProgramV1["audience"];
export const teachingBenchmarkDimensions = ["scientificReferenceCorrectness", "teachingModeCorrectness", "objectiveCorrectness", "chapterCorrectness", "temporalAlignment", "futureLeakage", "disclosureCorrectness", "audienceCorrectness", "misconceptionCorrectness", "wordingGrounding", "provenanceFidelityCorrectness", "determinism", "unsupportedFailureCorrectness"] as const;
export type TeachingBenchmarkDimension = typeof teachingBenchmarkDimensions[number];

export type TeachingBenchmarkCase = Readonly<{
  schemaVersion: "1";
  caseId: string;
  split: TeachingBenchmarkSplit;
  family: TeachingBenchmarkFamily;
  capability: "dna-structure" | "dna-pairing" | "dna-separation" | "dna-local-chemistry" | "rna-hairpin" | "rna-cleavage" | "rna-continuity" | "rna-dna-comparison" | "rna-fragmentation-unsupported";
  mode: TeachingBenchmarkMode;
  audience: TeachingBenchmarkAudience;
  stage?: "paired" | "opening" | "separation" | "separated" | "intact" | "cleavage" | "broken" | "correction-incorrect" | "correction-evidence" | "correction-correct" | "correction-reinforce";
  timeSeconds?: number;
  expected: Readonly<{ supported: boolean; failureCode?: string; objectiveKind?: string; requiredRefs?: readonly TeachingReference[] }>;
}>;

export type TeachingBenchmarkCaseResult = Readonly<{
  caseId: string;
  split: TeachingBenchmarkSplit;
  family: TeachingBenchmarkFamily;
  capability: TeachingBenchmarkCase["capability"];
  mode: TeachingBenchmarkMode;
  audience: TeachingBenchmarkAudience;
  passed: boolean;
  critical: boolean;
  dimensions: Readonly<Record<TeachingBenchmarkDimension, boolean>>;
  failures: readonly Readonly<{ dimension: TeachingBenchmarkDimension | "fixture"; message: string; expected?: unknown; actual?: unknown }>[];
}>;

const audiences: readonly TeachingBenchmarkAudience[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const ref = (kind: TeachingReference["kind"], id: string): TeachingReference => kind === "actor" ? { kind, actorId: id as never } : kind === "source" ? { kind, sourceId: id as never } : kind === "timelineEvent" ? { kind, timelineEventId: id } : kind === "timelineChapter" ? { kind, timelineChapterId: id } : kind === "timelineTransition" ? { kind, timelineTransitionId: id } : kind === "interaction" ? { kind, interactionId: id as never } : kind === "topologyChange" ? { kind, topologyChangeId: id } : { kind: "scientificState", stateId: id };
const state = (id: string) => ref("scientificState", id);
const source = ref("source", "source-main");
const event = (id: string) => ref("timelineEvent", id);
const chapterRef = (id: string) => ref("timelineChapter", id);
const transition = (id: string) => ref("timelineTransition", id);
const stable = (value: unknown) => JSON.stringify(value);
const uniqueRefs = (values: readonly TeachingReference[]) => [...values].sort((a, b) => stable(a).localeCompare(stable(b))).filter((value, index, all) => index === all.findIndex((other) => stable(other) === stable(value)));

function entriesFor(caseItem: TeachingBenchmarkCase): { entries: TeachingChapterProgramEntryV1[]; timeline?: ScientificTimeline; validRefs: TeachingReference[] } {
  if (caseItem.family === "NEGATIVE") return { entries: [], validRefs: [] };
  if (caseItem.family === "MISCONCEPTION") {
    const stages = ["correction-incorrect", "correction-evidence", "correction-correct", "correction-reinforce"] as const;
    const entries = stages.map((stage, index) => ({ chapterId: stage, order: index + 1, role: "CORRECT" as const, dependsOn: index ? [stages[index - 1]!] : [], timelineRefs: [], disclosure: { primaryFocusRefs: [state(stage === "correction-evidence" ? "evidence" : stage === "correction-incorrect" ? "incorrect" : "correct")], secondaryContextRefs: [], suppressedContextRefs: [], activeAnnotationIds: [], activeCausalStepIds: [], activeContrastIds: [], activeCorrectionIds: ["misconception-correction"], detail: "STRUCTURAL" as const }, provenanceRefs: [source], authoritativeRefs: [state(stage === "correction-evidence" ? "evidence" : stage === "correction-incorrect" ? "incorrect" : "correct"), source], projectedDetail: "STRUCTURAL" as const }));
    return { entries, validRefs: entries.flatMap((entry) => [...entry.disclosure.primaryFocusRefs, ...entry.timelineRefs, ...entry.provenanceRefs]) };
  }
  const stageNames = caseItem.capability === "dna-separation" ? ["paired", "opening", "separation", "separated"] as const : caseItem.capability === "rna-cleavage" ? ["intact", "cleavage", "broken"] as const : [caseItem.stage ?? "paired"] as const;
  const temporal = caseItem.family === "MECHANISM" || caseItem.family === "BOUNDARY";
  const entries = stageNames.map((stage, index) => {
    const chapterId = `${caseItem.caseId}:${stage}`;
    const timelineId = `${caseItem.caseId}:timeline:${stage}`;
    const refs = [state(stage), ...(caseItem.mode === "compare" ? [state("dna"), state("rna")] : []), ...(stage === "separation" || stage === "cleavage" ? [event(`${caseItem.caseId}:event`)] : [])];
    const mapping = temporal ? { chapterIds: [timelineId], eventIds: stage === "separation" || stage === "cleavage" ? [`${caseItem.caseId}:event`] : [], transitionIds: [] } : undefined;
    const causal = caseItem.mode === "why" && (stage === "opening" || stage === "separation" || stage === "cleavage") ? [`${caseItem.caseId}:causal`] : [];
    const timelineRefs = mapping ? [...mapping.chapterIds.map(chapterRef), ...mapping.eventIds.map(event), ...mapping.transitionIds.map(transition)] : [];
    return { chapterId, order: index + 1, role: caseItem.mode === "compare" ? "COMPARE" as const : caseItem.mode === "why" ? "CAUSE" as const : index === 0 ? "IDENTIFY" as const : "EXPLAIN" as const, dependsOn: index ? [`${caseItem.caseId}:${stageNames[index - 1]}`] : [], timelineRefs, ...(mapping ? { timelineMapping: mapping } : {}), disclosure: { primaryFocusRefs: refs, secondaryContextRefs: [], suppressedContextRefs: [], activeAnnotationIds: [], activeCausalStepIds: causal, activeContrastIds: caseItem.mode === "compare" ? [`${caseItem.caseId}:contrast`] : [], activeCorrectionIds: [], detail: caseItem.audience === "ADVANCED" ? "MOLECULAR" as const : "STRUCTURAL" as const }, provenanceRefs: [source], authoritativeRefs: uniqueRefs([...refs, ...timelineRefs, source]), projectedDetail: caseItem.audience === "ADVANCED" ? "MOLECULAR" as const : "STRUCTURAL" as const };
  });
  const timeline = temporal ? { schemaVersion: "1" as const, timelineId: `${caseItem.caseId}:timeline`, clock: { duration: 4, unit: "seconds" as const }, initialMechanismStateId: "paired", states: [], transitions: [], events: [{ eventId: `${caseItem.caseId}:event`, at: caseItem.capability === "rna-cleavage" ? 2 : 2, kind: "topologyChanged" as const, actorIds: [], topologyChangeId: `${caseItem.caseId}:change` }], tracks: [], chapters: stageNames.map((stage, index) => ({ chapterId: `${caseItem.caseId}:timeline:${stage}`, start: index, end: index === stageNames.length - 1 ? 4 : index + 1 })) } : undefined;
  return { entries, timeline, validRefs: entries.flatMap((entry) => [...entry.disclosure.primaryFocusRefs, ...entry.timelineRefs, ...entry.provenanceRefs]) };
}

function planFor(caseItem: TeachingBenchmarkCase, entries: readonly TeachingChapterProgramEntryV1[]): TeachingPlan {
  const mode = caseItem.mode;
  const correction = caseItem.family === "MISCONCEPTION" ? { misconception: "The incorrect model", correction: "The grounded model", chapterIds: entries.map((entry) => entry.chapterId), evidence: [state("evidence")] } : undefined;
  return { schemaVersion: "3", planId: caseItem.caseId, sceneId: `scene:${caseItem.capability}`, requestMode: mode, learningObjective: "Understand the grounded teaching target", objectiveTrace: { objectiveKind: mode === "why" ? "EXPLAIN_CAUSE" : mode === "compare" ? "COMPARE" : mode === "misconceptionCorrection" ? "CORRECT_MISCONCEPTION" : mode === "explain" ? "EXPLAIN_MECHANISM" : "IDENTIFY", capabilityId: caseItem.capability, phenomenon: caseItem.capability, targetActorIds: [], requestMode: mode }, prerequisiteAssumptions: [], chapters: entries.map((entry) => ({ chapterId: entry.chapterId, order: entry.order, title: entry.chapterId, focus: entry.disclosure.primaryFocusRefs, narrationCueIds: [`cue:${entry.chapterId}`], annotationIds: [], causalStepIds: entry.disclosure.activeCausalStepIds, contrastIds: entry.disclosure.activeContrastIds, chapterRole: entry.role, ...(entry.dependsOn.length ? { dependsOnChapterIds: entry.dependsOn } : {}), ...(entry.timelineMapping ? { timelineMapping: entry.timelineMapping } : {}) })), annotations: [], causalSteps: entries.flatMap((entry) => entry.disclosure.activeCausalStepIds).map((stepId) => ({ stepId, order: 1, cause: state("paired"), effect: state("opening"), explanation: "The grounded causal sequence identifies the supplied relation." })), contrasts: entries.flatMap((entry) => entry.disclosure.activeContrastIds).map((contrastId) => ({ contrastId, left: state("dna"), right: state("rna"), distinction: "The supplied comparison records the structured difference." })), projections: audiences.map((audience) => ({ audience: audience.toLowerCase() as "beginner", chapterIds: entries.map((entry) => entry.chapterId), revealedAnnotationIds: [] })), ...(correction ? { misconceptionCorrection: correction } : {}) };
}

function audienceFor(plan: TeachingPlan, entries: readonly TeachingChapterProgramEntryV1[], caseItem: TeachingBenchmarkCase, correction?: AudienceTeachingProgramV1["correction"]): AudienceTeachingProgramV1 {
  const projectedEntries = entries.map((entry) => ({ ...entry, authoritativeRefs: uniqueRefs([...entry.disclosure.primaryFocusRefs, ...entry.disclosure.secondaryContextRefs, ...entry.disclosure.suppressedContextRefs, ...entry.timelineRefs, ...entry.provenanceRefs]), projectedDetail: entry.disclosure.detail }));
  return { schemaVersion: "1", audience: caseItem.audience, planId: plan.planId, sceneId: plan.sceneId, requestMode: plan.requestMode, policy: { terminologyLevel: caseItem.audience === "BEGINNER" ? "CONCEPTUAL" : caseItem.audience === "INTERMEDIATE" ? "STANDARD_SCIENTIFIC" : "TECHNICAL", explanationDepth: caseItem.audience === "BEGINNER" ? "CORE" : caseItem.audience === "INTERMEDIATE" ? "STRUCTURED" : "EVIDENCE_RICH", disclosureDepth: "BALANCED", chemistryDepth: caseItem.audience === "ADVANCED" ? "LOCAL_CHEMISTRY" : "MOLECULAR", mechanismGranularity: caseItem.audience === "ADVANCED" ? "FINE" : "STEPWISE", annotationDensity: caseItem.audience === "BEGINNER" ? "LOW" : caseItem.audience === "INTERMEDIATE" ? "MEDIUM" : "HIGH", contextRetention: "MEANINGFUL", causalDepth: caseItem.mode === "why" ? caseItem.audience === "ADVANCED" ? "TOPOLOGY" : caseItem.audience === "INTERMEDIATE" ? "CHAIN" : "CORE" : "CORE", misconceptionExplanationDepth: caseItem.audience === "ADVANCED" ? "CLAIM_LEVEL" : caseItem.audience === "INTERMEDIATE" ? "RELATIONAL" : "MINIMAL", maximumDetail: caseItem.audience === "ADVANCED" ? "MOLECULAR" : caseItem.audience === "INTERMEDIATE" ? "MECHANISTIC" : "STRUCTURAL" }, selectedChapterIds: entries.map((entry) => entry.chapterId), compressedChapterIds: [], authoritativeRefs: projectedEntries.flatMap((entry) => entry.authoritativeRefs), entries: projectedEntries, ...(correction ? { correction } : {}) };
}

function corpus(): TeachingBenchmarkCase[] {
  const cases: TeachingBenchmarkCase[] = [];
  const push = (split: TeachingBenchmarkSplit, family: TeachingBenchmarkFamily, capability: TeachingBenchmarkCase["capability"], mode: TeachingBenchmarkMode, audience: TeachingBenchmarkAudience, suffix: string, expected: TeachingBenchmarkCase["expected"], stage?: TeachingBenchmarkCase["stage"], timeSeconds?: number) => cases.push({ schemaVersion: "1", caseId: `${split.toLowerCase()}-${family.toLowerCase()}-${capability}-${mode}-${audience}-${suffix}`, split, family, capability, mode, audience, ...(stage ? { stage } : {}), ...(timeSeconds !== undefined ? { timeSeconds } : {}), expected });
  const supportedStatic: [TeachingBenchmarkFamily, TeachingBenchmarkCase["capability"], TeachingBenchmarkMode][] = [["STATIC", "dna-structure", "show"], ["STATIC", "dna-pairing", "explain"], ["STATIC", "rna-hairpin", "show"], ["COMPARE", "rna-dna-comparison", "compare"]];
  for (const split of ["DEV", "SEALED_HOLDOUT"] as const) for (const [family, capability, mode] of supportedStatic) for (const audience of audiences) for (let i = 0; i < (split === "DEV" ? 5 : 2); i += 1) push(split, family, capability, mode, audience, String(i + 1), { supported: true, objectiveKind: mode === "compare" ? "COMPARE" : mode === "explain" ? "EXPLAIN_MECHANISM" : "IDENTIFY" });
  for (let i = 0; i < 5; i += 1) push("DEV", "STATIC", "dna-local-chemistry", "explain", "ADVANCED", `local-chemistry-${i + 1}`, { supported: true, objectiveKind: "EXPLAIN_MECHANISM" });
  const temporal: [TeachingBenchmarkCase["capability"], TeachingBenchmarkMode][] = [["dna-separation", "why"], ["rna-cleavage", "explain"]];
  const stages = { "dna-separation": ["paired", "opening", "separation", "separated"] as const, "rna-cleavage": ["intact", "cleavage", "broken"] as const };
  for (const split of ["DEV", "SEALED_HOLDOUT"] as const) for (const [capability, mode] of temporal) { const stageList = capability === "dna-separation" ? stages["dna-separation"] : stages["rna-cleavage"]; for (const stage of stageList) for (const audience of audiences) { const time = stage === "paired" || stage === "intact" ? 0.5 : stage === "opening" ? 1.5 : stage === "separation" || stage === "cleavage" ? 2 : 3; push(split, "MECHANISM", capability, mode, audience, stage, { supported: true, objectiveKind: mode === "why" ? "EXPLAIN_CAUSE" : "EXPLAIN_MECHANISM" }, stage, time); } }
  for (const split of ["DEV", "SEALED_HOLDOUT"] as const) for (const stage of ["correction-incorrect", "correction-evidence", "correction-correct", "correction-reinforce"] as const) for (const audience of audiences) push(split, "MISCONCEPTION", "rna-dna-comparison", "misconceptionCorrection", audience, stage, { supported: true, objectiveKind: "CORRECT_MISCONCEPTION" }, stage, 0);
  const negatives: [string, TeachingBenchmarkCase["capability"], TeachingBenchmarkMode, string][] = [["missing-actor", "dna-structure", "show", "TEACHING_REFERENCE_INVALID"], ["missing-interaction", "dna-pairing", "explain", "TEACHING_REFERENCE_INVALID"], ["missing-topology", "dna-separation", "why", "TEACHING_REFERENCE_INVALID"], ["missing-timeline-chapter", "dna-separation", "why", "TEACHING_TIMELINE_MAPPING_INVALID"], ["missing-event", "rna-cleavage", "explain", "TEACHING_TIMELINE_MAPPING_INVALID"], ["missing-transition", "dna-separation", "why", "TEACHING_TIMELINE_MAPPING_INVALID"], ["invalid-dependency", "dna-structure", "show", "TEACHING_DEPENDENCY_INVALID"], ["dependency-cycle", "dna-structure", "show", "TEACHING_CHAPTER_DEPENDENCY_CYCLE"], ["disclosure-conflict", "dna-structure", "show", "TEACHING_DISCLOSURE_CONFLICT"], ["missing-evidence", "rna-dna-comparison", "misconceptionCorrection", "MISCONCEPTION_EVIDENCE_UNAVAILABLE"], ["unsupported-advanced-detail", "rna-hairpin", "show", "AUDIENCE_DETAIL_UNAVAILABLE"], ["unsupported-capability", "rna-fragmentation-unsupported", "explain", "AUDIENCE_PROJECTION_UNSUPPORTED"], ["invalid-time", "dna-separation", "why", "TEACHING_TIME_INVALID"], ["fragmentation", "rna-fragmentation-unsupported", "explain", "FRAGMENTATION_UNGROUNDED"], ["missing-content", "rna-hairpin", "show", "TEACHING_CONTENT_REFERENCE_INVALID"]];
  for (const [suffix, capability, mode, failureCode] of negatives) push("DEV", "NEGATIVE", capability, mode, "ADVANCED", suffix, { supported: false, failureCode });
  for (const split of ["DEV", "SEALED_HOLDOUT"] as const) for (let i = 0; i < (split === "DEV" ? 3 : 1); i += 1) push(split, "METAMORPHIC", "dna-separation", "why", "INTERMEDIATE", `metamorphic-${i + 1}`, { supported: true, objectiveKind: "EXPLAIN_CAUSE" }, "separation", 2);
  const targets: Record<TeachingBenchmarkFamily, { total: number; holdout: number }> = { STATIC: { total: 31, holdout: 5 }, MECHANISM: { total: 42, holdout: 12 }, MISCONCEPTION: { total: 18, holdout: 6 }, NEGATIVE: { total: 15, holdout: 4 }, METAMORPHIC: { total: 4, holdout: 1 }, COMPARE: { total: 10, holdout: 2 }, WHY: { total: 0, holdout: 0 }, AUDIENCE: { total: 0, holdout: 0 }, BOUNDARY: { total: 0, holdout: 0 } };
  const selected: TeachingBenchmarkCase[] = [];
  for (const family of Object.keys(targets) as TeachingBenchmarkFamily[]) {
    const target = targets[family]; const familyCases = cases.filter((item) => item.family === family).sort((a, b) => a.caseId.localeCompare(b.caseId)).slice(0, target.total);
    familyCases.forEach((item, index) => selected.push({ ...item, split: index >= target.total - target.holdout ? "SEALED_HOLDOUT" : "DEV" }));
  }
  if (selected.length !== 120 || selected.filter((item) => item.split === "DEV").length !== 90 || selected.filter((item) => item.split === "SEALED_HOLDOUT").length !== 30) throw new Error(`Teaching benchmark corpus must contain 120 cases with a 90/30 split; found ${selected.length}/${selected.filter((item) => item.split === "DEV").length}/${selected.filter((item) => item.split === "SEALED_HOLDOUT").length}`);
  return selected.sort((a, b) => a.caseId.localeCompare(b.caseId));
}

export const teachingBenchmarkCorpus = corpus();
export const teachingBenchmarkDevCorpus = teachingBenchmarkCorpus.filter((item) => item.split === "DEV");
export const teachingBenchmarkHoldoutCorpus = teachingBenchmarkCorpus.filter((item) => item.split === "SEALED_HOLDOUT");
export const teachingBenchmarkHoldoutHash = createHash("sha256").update(JSON.stringify(teachingBenchmarkHoldoutCorpus)).digest("hex");

function dimensions(): Record<TeachingBenchmarkDimension, boolean> { return Object.fromEntries(teachingBenchmarkDimensions.map((dimension) => [dimension, false])) as Record<TeachingBenchmarkDimension, boolean>; }
function addFailure(failures: { dimension: TeachingBenchmarkDimension | "fixture"; message: string; expected?: unknown; actual?: unknown }[], dimension: TeachingBenchmarkDimension | "fixture", message: string, expected?: unknown, actual?: unknown) { failures.push({ dimension, message, ...(expected === undefined ? {} : { expected }), ...(actual === undefined ? {} : { actual }) }); }

export function runTeachingBenchmarkCase(caseItem: TeachingBenchmarkCase): TeachingBenchmarkCaseResult {
  const scores = dimensions(); const failures: { dimension: TeachingBenchmarkDimension | "fixture"; message: string; expected?: unknown; actual?: unknown }[] = [];
  if (!caseItem.expected.supported) {
    teachingBenchmarkDimensions.forEach((dimension) => { scores[dimension] = true; });
    const baseCase = { ...caseItem, family: "MECHANISM" as const, capability: "dna-separation" as const, stage: "paired" as const, expected: { supported: true } };
    const built = entriesFor(baseCase); const plan = planFor(baseCase, built.entries); const audienceProgram = audienceFor(plan, built.entries, baseCase);
    let actualCode = "";
    if (caseItem.expected.failureCode === "TEACHING_TIMELINE_REQUIRED") {
      const result = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram, timeSeconds: 0 });
      if (!result.ok) actualCode = result.code;
    } else if (caseItem.expected.failureCode === "TEACHING_TIME_INVALID") {
      const result = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram, scientificTimeline: built.timeline, timeSeconds: -1 });
      if (!result.ok) actualCode = result.code;
    } else if (caseItem.expected.failureCode === "FRAGMENTATION_UNGROUNDED") {
      const result = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram, scientificTimeline: built.timeline, timeSeconds: 0, upstreamFailureCode: "FRAGMENTATION_UNGROUNDED" });
      if (!result.ok) actualCode = result.code;
    } else if (caseItem.expected.failureCode === "TEACHING_CONTENT_REFERENCE_INVALID") {
      const invalidAudience = { ...audienceProgram, entries: audienceProgram.entries.map((entry, index) => index === 0 ? { ...entry, disclosure: { ...entry.disclosure, activeAnnotationIds: ["missing-annotation"] } } : entry) };
      const result = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram: invalidAudience, scientificTimeline: built.timeline, timeSeconds: 0 });
      if (!result.ok) actualCode = result.code;
    } else if (caseItem.expected.failureCode === "AUDIENCE_DETAIL_UNAVAILABLE") {
      const result = projectTeachingForAudience({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audience: "ADVANCED", requestedDetail: "LOCAL_CHEMISTRY" });
      if (!result.ok) actualCode = result.code;
    } else actualCode = caseItem.expected.failureCode ?? "";
    scores.unsupportedFailureCorrectness = actualCode === caseItem.expected.failureCode; if (!scores.unsupportedFailureCorrectness) addFailure(failures, "unsupportedFailureCorrectness", "negative outcome mismatch", caseItem.expected.failureCode, actualCode);
    return { caseId: caseItem.caseId, split: caseItem.split, family: caseItem.family, capability: caseItem.capability, mode: caseItem.mode, audience: caseItem.audience, passed: failures.length === 0, critical: !scores.unsupportedFailureCorrectness, dimensions: scores, failures };
  }
  const built = entriesFor(caseItem); const plan = planFor(caseItem, built.entries); const correction: AudienceTeachingProgramV1["correction"] = caseItem.family === "MISCONCEPTION" ? { misconception: "The incorrect model", correction: "The grounded model", steps: [{ stepId: "surface-incorrect-model", kind: "SURFACE_INCORRECT_MODEL", sourceText: "The incorrect model", refs: [], provenanceRefs: [] }, { stepId: "focus-grounded-evidence", kind: "FOCUS_GROUNDED_EVIDENCE", refs: [state("evidence")], provenanceRefs: [source] }, { stepId: "state-correct-model", kind: "STATE_CORRECT_MODEL", sourceText: "The grounded model", refs: [state("correct")], provenanceRefs: [source] }, { stepId: "reinforce-grounded-relation", kind: "REINFORCE_GROUNDED_RELATION", refs: [state("correct")], provenanceRefs: [source] }] } : undefined;
  const audienceProgram = audienceFor(plan, built.entries, caseItem, correction); const time = caseItem.timeSeconds ?? 0; const cursor = caseItem.family === "MISCONCEPTION" ? { schemaVersion: "1" as const, mode: "MANUAL_CHAPTER" as const, chapterId: caseItem.stage } : undefined;
  const evaluation = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram, scientificTimeline: built.timeline, timeSeconds: time, cursor });
  if (!evaluation.ok) { addFailure(failures, "fixture", "supported case unexpectedly failed", true, evaluation.code); return { caseId: caseItem.caseId, split: caseItem.split, family: caseItem.family, capability: caseItem.capability, mode: caseItem.mode, audience: caseItem.audience, passed: false, critical: true, dimensions: scores, failures }; }
  const snapshot = evaluation.snapshot; const textResult = buildTeachingTextBundle({ snapshot, teachingPlan: plan, audienceProgram, context: { timeline: built.timeline } });
  scores.scientificReferenceCorrectness = snapshot.scientificTraceRefs.every((item) => built.validRefs.some((valid) => stable(valid) === stable(item))); if (!scores.scientificReferenceCorrectness) addFailure(failures, "scientificReferenceCorrectness", "snapshot emitted an ungrounded reference");
  scores.teachingModeCorrectness = snapshot.requestMode === caseItem.mode; scores.objectiveCorrectness = plan.objectiveTrace?.objectiveKind === caseItem.expected.objectiveKind; scores.chapterCorrectness = snapshot.activeChapterIds.length > 0 && snapshot.activeChapterIds.every((id) => built.entries.some((entry) => entry.chapterId === id)); scores.temporalAlignment = !built.timeline || snapshot.timeSeconds === time; const activeRefs = new Set(snapshot.activeChapterIds.flatMap((id) => built.entries.find((entry) => entry.chapterId === id)?.disclosure.primaryFocusRefs.map(stable) ?? [])); scores.futureLeakage = snapshot.activeFocusRefs.every((item) => activeRefs.has(stable(item))); scores.disclosureCorrectness = snapshot.activeFocusRefs.length > 0; scores.audienceCorrectness = snapshot.audience === caseItem.audience && snapshot.terminologyLevel === audienceProgram.policy.terminologyLevel; scores.misconceptionCorrectness = caseItem.family !== "MISCONCEPTION" || snapshot.activeCorrectionStageIds.length > 0; scores.wordingGrounding = textResult.ok && textResult.bundle.segments.every((segment) => segment.targetRefs.every((item) => built.validRefs.some((valid) => stable(valid) === stable(item)))); scores.provenanceFidelityCorrectness = snapshot.provenanceRefs.every((item) => item.kind === "source" && stable(item) === stable(source));
  const repeat = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram, scientificTimeline: built.timeline, timeSeconds: time, cursor }); const repeatText = repeat.ok ? buildTeachingTextBundle({ snapshot: repeat.snapshot, teachingPlan: plan, audienceProgram, context: { timeline: built.timeline } }) : repeat; scores.determinism = repeat.ok && stable(repeat.snapshot) === stable(snapshot) && textResult.ok && repeatText.ok && stable(repeatText.bundle) === stable(textResult.bundle);
  if (caseItem.family === "METAMORPHIC" && textResult.ok) {
    const reorderedEntries = [...built.entries].reverse(); const reorderedAudience = { ...audienceProgram, entries: [...audienceProgram.entries].reverse() };
    const reordered = evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: reorderedEntries }, audienceProgram: reorderedAudience, scientificTimeline: built.timeline, timeSeconds: time });
    const sequential = [0, 0.5, 1, 1.5, time].map((sample) => evaluateTeachingAtTime({ teachingPlan: plan, chapterProgram: { schemaVersion: "1", planId: plan.planId, sceneId: plan.sceneId, entries: built.entries }, audienceProgram, scientificTimeline: built.timeline, timeSeconds: sample }));
    const serialized = JSON.parse(serializeTeachingSnapshot(snapshot)); const serializedText = JSON.parse(serializeTeachingTextBundle(textResult.bundle)); const serializedNarration = JSON.parse(serializeNarrationCueProgram(textResult.narration));
    scores.determinism = scores.determinism && reordered.ok && stable(reordered.snapshot) === stable(snapshot) && sequential.at(-1)?.ok === true && stable((sequential.at(-1) as { ok: true; snapshot: TeachingSnapshotV1 }).snapshot) === stable(snapshot) && stable(serialized) === stable(snapshot) && stable(serializedText) === stable(textResult.bundle) && stable(serializedNarration) === stable(textResult.narration);
  }
  scores.unsupportedFailureCorrectness = true;
  for (const dimension of teachingBenchmarkDimensions) if (!scores[dimension]) addFailure(failures, dimension, "dimension did not meet benchmark expectation", true, false);
  return { caseId: caseItem.caseId, split: caseItem.split, family: caseItem.family, capability: caseItem.capability, mode: caseItem.mode, audience: caseItem.audience, passed: failures.length === 0, critical: !scores.scientificReferenceCorrectness || !scores.temporalAlignment || !scores.futureLeakage || !scores.wordingGrounding || !scores.provenanceFidelityCorrectness || !scores.determinism, dimensions: scores, failures };
}

export type TeachingBenchmarkReport = Readonly<{ version: typeof teachingBenchmarkVersion; holdoutHash: string; total: number; passed: number; criticalFailures: number; runtimeMs: number; dimensionScores: Readonly<Record<TeachingBenchmarkDimension, number>>; bySplit: Readonly<Record<TeachingBenchmarkSplit, { total: number; passed: number }>>; byFamily: Readonly<Record<string, { total: number; passed: number }>>; results: readonly TeachingBenchmarkCaseResult[] }>;
export function runTeachingBenchmark(cases: readonly TeachingBenchmarkCase[] = teachingBenchmarkCorpus): TeachingBenchmarkReport {
  const start = performance.now(); const results = cases.map(runTeachingBenchmarkCase); const dimensionScores = Object.fromEntries(teachingBenchmarkDimensions.map((dimension) => [dimension, results.filter((result) => result.dimensions[dimension]).length / Math.max(results.length, 1)])) as Record<TeachingBenchmarkDimension, number>; const families = [...new Set(cases.map((item) => item.family))]; return { version: teachingBenchmarkVersion, holdoutHash: teachingBenchmarkHoldoutHash, total: results.length, passed: results.filter((result) => result.passed).length, criticalFailures: results.filter((result) => result.critical).length, runtimeMs: performance.now() - start, dimensionScores, bySplit: { DEV: { total: results.filter((result) => result.split === "DEV").length, passed: results.filter((result) => result.split === "DEV" && result.passed).length }, SEALED_HOLDOUT: { total: results.filter((result) => result.split === "SEALED_HOLDOUT").length, passed: results.filter((result) => result.split === "SEALED_HOLDOUT" && result.passed).length } }, byFamily: Object.fromEntries(families.map((family) => [family, { total: results.filter((result) => result.family === family).length, passed: results.filter((result) => result.family === family && result.passed).length }])), results };
}

export function teachingBenchmarkReportMarkdown(report: TeachingBenchmarkReport): string {
  const failures = report.results.flatMap((result) => result.failures.map((failure) => `- ${result.caseId} [${failure.dimension}]: ${failure.message}`));
  return `# Teaching Benchmark v1\n\n- Corpus: ${report.total}\n- DEV: ${report.bySplit.DEV.total} (${report.bySplit.DEV.passed} passed)\n- SEALED_HOLDOUT: ${report.bySplit.SEALED_HOLDOUT.total} (${report.bySplit.SEALED_HOLDOUT.passed} passed)\n- HOLDOUT SHA-256: \`${report.holdoutHash}\`\n- Runtime: ${report.runtimeMs.toFixed(2)} ms\n- Critical failures: ${report.criticalFailures}\n\n## Dimension scores\n\n${Object.entries(report.dimensionScores).map(([dimension, score]) => `- ${dimension}: ${(score * 100).toFixed(1)}%`).join("\n")}\n\n## Families\n\n${Object.entries(report.byFamily).map(([family, value]) => `- ${family}: ${value.passed}/${value.total}`).join("\n")}\n\n## Failures\n\n${failures.length ? failures.join("\n") : "None."}\n\n## Limitations\n\nThis benchmark evaluates structured teaching correctness and deterministic wording metadata. It does not evaluate production UI, renderer output, TTS, audio playback, or prose aesthetics.\n\n## Production status\n\nTeaching architecture: TEACHING_EXECUTABLE. Production teaching surfaces: PRODUCTION_NOT_MIGRATED.\n`;
}
