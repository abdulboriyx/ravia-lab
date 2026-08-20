/** F6-A: renderer-independent benchmark harness for frozen Foundation contracts. */
import { validateSemanticIntent, type SemanticIntentV1 } from "./semantic-intent.ts";
import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import { timelineContextFromScene, validateScientificTimeline, type ScientificTimeline, type TimelineReferenceContext } from "./scientific-timeline.ts";
import { validateTeachingPlan, type TeachingPlan } from "./teaching-plan.ts";
import { validateExportManifest, validateExportRequest, validateScenePackage, type ExportManifest, type ExportRequest, type ScenePackage } from "./scene-export-contract.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import { capabilityRegistry, validateCapabilityRegistry, type CapabilityRegistryRecord } from "./capability-registry.ts";

export const foundationBenchmarkSchemaVersion = "1" as const;
export const foundationBenchmarkFamilies = ["semanticIntent", "scientificSceneSpec", "timeline", "teachingPlan", "export", "sceneSpecV1", "capabilityRegistry"] as const;
export type FoundationBenchmarkFamily = (typeof foundationBenchmarkFamilies)[number];
export const foundationBenchmarkKinds = ["positive", "negative", "preservation", "crossContract"] as const;
export type FoundationBenchmarkKind = (typeof foundationBenchmarkKinds)[number];
export const foundationBenchmarkFailureCategories = ["validation", "reference", "invariant", "outcome", "fixture"] as const;
export type FoundationBenchmarkFailureCategory = (typeof foundationBenchmarkFailureCategories)[number];

export type FoundationBenchmarkExpected = {
  valid: boolean;
  outcome?: string;
  references?: readonly string[];
  invariants?: readonly string[];
};

export type FoundationBenchmarkFailure = {
  category: FoundationBenchmarkFailureCategory;
  reason: string;
};

export type FoundationBenchmarkCase = {
  schemaVersion: typeof foundationBenchmarkSchemaVersion;
  caseId: string;
  family: FoundationBenchmarkFamily;
  benchmarkVersion: string;
  kind: FoundationBenchmarkKind;
  input: unknown;
  expected: FoundationBenchmarkExpected;
  failure?: FoundationBenchmarkFailure;
};

export type FoundationBenchmarkValidation = {
  valid: boolean;
  outcome?: string;
  references?: readonly string[];
};

export type FoundationBenchmarkContext = {
  benchmarkCase: FoundationBenchmarkCase;
  cases: readonly FoundationBenchmarkCase[];
};

export type FoundationBenchmarkValidator = (input: unknown, context: FoundationBenchmarkContext) => FoundationBenchmarkValidation;
export type FoundationBenchmarkInvariant = (input: unknown, validation: FoundationBenchmarkValidation, context: FoundationBenchmarkContext) => boolean;

export type FoundationBenchmarkFailureResult = FoundationBenchmarkFailure & { caseId: string };
export type FoundationBenchmarkCaseResult = {
  caseId: string;
  passed: boolean;
  validation: FoundationBenchmarkValidation;
  failures: readonly FoundationBenchmarkFailureResult[];
};
export type FoundationBenchmarkRunResult = {
  schemaVersion: typeof foundationBenchmarkSchemaVersion;
  total: number;
  passed: number;
  failed: number;
  cases: readonly FoundationBenchmarkCaseResult[];
};

export type FoundationBenchmarkIntegrityIssue = { path: string; message: string };
export type FoundationBenchmarkIntegrityResult = { valid: true; issues: [] } | { valid: false; issues: readonly FoundationBenchmarkIntegrityIssue[] };

const fail = (caseId: string, category: FoundationBenchmarkFailureCategory, reason: string): FoundationBenchmarkFailureResult => ({ caseId, category, reason });
const equalList = (left: readonly string[] | undefined, right: readonly string[] | undefined) => JSON.stringify([...(left ?? [])].sort()) === JSON.stringify([...(right ?? [])].sort());

/** Validates benchmark metadata before executing contract validators. */
export function validateFoundationBenchmarkCases(cases: readonly FoundationBenchmarkCase[]): FoundationBenchmarkIntegrityResult {
  const issues: FoundationBenchmarkIntegrityIssue[] = [];
  const ids = new Set<string>();
  const issue = (path: string, message: string) => issues.push({ path, message });
  cases.forEach((benchmarkCase, index) => {
    const path = `cases[${index}]`;
    if (benchmarkCase.schemaVersion !== foundationBenchmarkSchemaVersion) issue(`${path}.schemaVersion`, "must be benchmark schema version 1");
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(benchmarkCase.caseId)) issue(`${path}.caseId`, "must be a stable kebab-case ID");
    if (ids.has(benchmarkCase.caseId)) issue(`${path}.caseId`, "must be unique");
    ids.add(benchmarkCase.caseId);
    if (!foundationBenchmarkFamilies.includes(benchmarkCase.family)) issue(`${path}.family`, "is invalid");
    if (typeof benchmarkCase.benchmarkVersion !== "string" || benchmarkCase.benchmarkVersion.length === 0) issue(`${path}.benchmarkVersion`, "is required");
    if (!foundationBenchmarkKinds.includes(benchmarkCase.kind)) issue(`${path}.kind`, "is invalid");
    if (typeof benchmarkCase.expected.valid !== "boolean") issue(`${path}.expected.valid`, "must be boolean");
    for (const reference of benchmarkCase.expected.references ?? []) if (typeof reference !== "string" || reference.length === 0) issue(`${path}.expected.references`, "must contain non-empty strings");
    for (const invariant of benchmarkCase.expected.invariants ?? []) if (typeof invariant !== "string" || invariant.length === 0) issue(`${path}.expected.invariants`, "must contain non-empty strings");
    if (!benchmarkCase.expected.valid && (!benchmarkCase.failure || !foundationBenchmarkFailureCategories.includes(benchmarkCase.failure.category) || benchmarkCase.failure.reason.trim().length === 0)) issue(`${path}.failure`, "negative cases require a failure category and reason");
  });
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

/** Runs cases without knowing anything about renderers, geometry, or runtime ownership. */
export function runFoundationBenchmark(
  cases: readonly FoundationBenchmarkCase[],
  validators: Readonly<Partial<Record<FoundationBenchmarkFamily, FoundationBenchmarkValidator>>>,
  invariants: Readonly<Record<string, FoundationBenchmarkInvariant>> = {},
): FoundationBenchmarkRunResult {
  const results = cases.map((benchmarkCase) => {
    const failures: FoundationBenchmarkFailureResult[] = [];
    const validator = validators[benchmarkCase.family];
    const context: FoundationBenchmarkContext = { benchmarkCase, cases };
    const validation = validator ? validator(benchmarkCase.input, context) : { valid: false, outcome: "missing-validator" };
    if (!validator) failures.push(fail(benchmarkCase.caseId, "fixture", `No validator registered for ${benchmarkCase.family}.`));
    if (validation.valid !== benchmarkCase.expected.valid) failures.push(fail(benchmarkCase.caseId, "validation", `Expected valid=${benchmarkCase.expected.valid}, received valid=${validation.valid}.`));
    if (benchmarkCase.expected.outcome !== undefined && validation.outcome !== benchmarkCase.expected.outcome) failures.push(fail(benchmarkCase.caseId, "outcome", `Expected outcome ${benchmarkCase.expected.outcome}, received ${validation.outcome ?? "<none>"}.`));
    if (benchmarkCase.expected.references !== undefined && !equalList(validation.references, benchmarkCase.expected.references)) failures.push(fail(benchmarkCase.caseId, "reference", "Resolved references do not match the expected references."));
    for (const invariantId of benchmarkCase.expected.invariants ?? []) {
      const invariant = invariants[invariantId];
      if (!invariant) failures.push(fail(benchmarkCase.caseId, "fixture", `No invariant registered for ${invariantId}.`));
      else if (!invariant(benchmarkCase.input, validation, context)) failures.push(fail(benchmarkCase.caseId, "invariant", `Invariant ${invariantId} failed.`));
    }
    return { caseId: benchmarkCase.caseId, passed: failures.length === 0, validation, failures } satisfies FoundationBenchmarkCaseResult;
  });
  return { schemaVersion: foundationBenchmarkSchemaVersion, total: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, cases: results };
}

export type ExportBenchmarkInput =
  | { kind: "scenePackage"; value: ScenePackage }
  | { kind: "request"; value: ExportRequest; scenePackage: ScenePackage }
  | { kind: "manifest"; value: ExportManifest; request: ExportRequest; scenePackage: ScenePackage };
export type TimelineBenchmarkInput = { timeline: ScientificTimeline; context: TimelineReferenceContext };
export type TeachingBenchmarkInput = { plan: TeachingPlan; scene: ScientificSceneSpec };
export type SceneSpecBenchmarkInput = SceneSpecV1;
export type CapabilityBenchmarkInput = { records?: readonly CapabilityRegistryRecord[] };

const valid = (outcome: string, references?: readonly string[]): FoundationBenchmarkValidation => ({ valid: true, outcome, references });
const invalid = (outcome: string): FoundationBenchmarkValidation => ({ valid: false, outcome });

/** Adapters for the frozen validators; each adapter keeps its contract's own validation authority. */
export const foundationContractValidators: Readonly<Record<FoundationBenchmarkFamily, FoundationBenchmarkValidator>> = {
  semanticIntent: (input) => validateSemanticIntent(input as SemanticIntentV1).valid ? valid("valid") : invalid("invalid"),
  scientificSceneSpec: (input) => validateScientificSceneSpec(input as ScientificSceneSpec).valid ? valid("valid") : invalid("invalid"),
  timeline: (input) => { const value = input as TimelineBenchmarkInput; return validateScientificTimeline(value.timeline, value.context).valid ? valid("valid") : invalid("invalid"); },
  teachingPlan: (input) => { const value = input as TeachingBenchmarkInput; return validateTeachingPlan(value.plan, value.scene).valid ? valid("valid") : invalid("invalid"); },
  export: (input) => { const value = input as ExportBenchmarkInput; if (value.kind === "scenePackage") return validateScenePackage(value.value).valid ? valid("valid") : invalid("invalid"); if (value.kind === "request") return validateExportRequest(value.value, value.scenePackage).valid ? valid("valid") : invalid("invalid"); return validateExportManifest(value.value, value.request, value.scenePackage).valid ? valid("valid") : invalid("invalid"); },
  sceneSpecV1: (input) => validateSceneSpecV1(input as SceneSpecV1).valid ? valid("valid") : invalid("invalid"),
  capabilityRegistry: (input) => { const value = input as CapabilityBenchmarkInput; return validateCapabilityRegistry(value.records ?? capabilityRegistry).valid ? valid("valid") : invalid("invalid"); },
};

export function runFoundationContractBenchmark(cases: readonly FoundationBenchmarkCase[], invariants: Readonly<Record<string, FoundationBenchmarkInvariant>> = {}): FoundationBenchmarkRunResult {
  return runFoundationBenchmark(cases, foundationContractValidators, invariants);
}

export function timelineBenchmarkInput(timeline: ScientificTimeline, scene: ScientificSceneSpec): TimelineBenchmarkInput {
  return { timeline, context: timelineContextFromScene(scene) };
}
