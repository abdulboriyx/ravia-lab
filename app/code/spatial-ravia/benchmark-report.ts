/**
 * F6-D: deterministic, renderer-independent benchmark result reporting.
 *
 * This contract reports evaluations supplied by a benchmark runner. It does
 * not define benchmark prompts, SceneSpec fields, UI, or production routing.
 */

export const benchmarkReportSchemaVersion = "1" as const;

export const benchmarkFailureCategories = [
  "semanticMismatch",
  "scientificInvalidity",
  "danglingReference",
  "capabilityMismatch",
  "supportPolicyMismatch",
  "fidelityProvenanceMismatch",
  "timelineMismatch",
  "teachingMismatch",
  "exportMismatch",
  "preservationRegression",
  "schemaVersionFailure",
] as const;
export type BenchmarkFailureCategory = (typeof benchmarkFailureCategories)[number];

export const benchmarkFailureSeverities = ["warning", "error", "blocker"] as const;
export type BenchmarkFailureSeverity = (typeof benchmarkFailureSeverities)[number];

/** A runner-owned, compact observable outcome. It deliberately is not a SceneSpec. */
export type BenchmarkOutcome = Readonly<{
  disposition: "accepted" | "rejected" | "unsupported" | "unresolved";
  summary: string;
}>;

export type BenchmarkFailure = Readonly<{
  category: BenchmarkFailureCategory;
  severity: BenchmarkFailureSeverity;
  detail: string;
}>;

export type BenchmarkCaseResult = Readonly<{
  caseId: string;
  /** Stable owner/family identifier supplied by the benchmark. */
  family: string;
  expected: BenchmarkOutcome;
  actual: BenchmarkOutcome;
  passed: boolean;
  failures: readonly BenchmarkFailure[];
}>;

export type BenchmarkFamilyCount = Readonly<{ family: string; total: number; passed: number; failed: number }>;
export type BenchmarkCategoryCount = Readonly<{ category: BenchmarkFailureCategory; count: number }>;

export type BenchmarkReport = Readonly<{
  schemaVersion: typeof benchmarkReportSchemaVersion;
  total: number;
  passed: number;
  failed: number;
  familyCounts: readonly BenchmarkFamilyCount[];
  categoryCounts: readonly BenchmarkCategoryCount[];
  failingCaseIds: readonly string[];
  results: readonly BenchmarkCaseResult[];
}>;

export type BenchmarkReportValidationIssue = Readonly<{ path: string; message: string }>;
export type BenchmarkReportValidationResult =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly BenchmarkReportValidationIssue[] }>;

const stableId = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const ordered = <T>(values: readonly T[], key: (value: T) => string) => [...values].sort((left, right) => key(left).localeCompare(key(right)));

function countFamilies(results: readonly BenchmarkCaseResult[]): BenchmarkFamilyCount[] {
  const counts = new Map<string, BenchmarkFamilyCount>();
  results.forEach((result) => {
    const previous = counts.get(result.family) ?? { family: result.family, total: 0, passed: 0, failed: 0 };
    counts.set(result.family, { ...previous, total: previous.total + 1, passed: previous.passed + Number(result.passed), failed: previous.failed + Number(!result.passed) });
  });
  return ordered([...counts.values()], (entry) => entry.family);
}

function countCategories(results: readonly BenchmarkCaseResult[]): BenchmarkCategoryCount[] {
  const counts = new Map<BenchmarkFailureCategory, number>(benchmarkFailureCategories.map((category) => [category, 0]));
  results.forEach((result) => result.failures.forEach((failure) => counts.set(failure.category, (counts.get(failure.category) ?? 0) + 1)));
  return benchmarkFailureCategories.map((category) => ({ category, count: counts.get(category) ?? 0 }));
}

/** Creates a canonical report: results/family counts/case IDs are sorted and no clock value is captured. */
export function createBenchmarkReport(results: readonly BenchmarkCaseResult[]): BenchmarkReport {
  const canonicalResults = ordered(results, (result) => `${result.family}\u0000${result.caseId}`);
  const passed = canonicalResults.filter((result) => result.passed).length;
  return {
    schemaVersion: benchmarkReportSchemaVersion,
    total: canonicalResults.length,
    passed,
    failed: canonicalResults.length - passed,
    familyCounts: countFamilies(canonicalResults),
    categoryCounts: countCategories(canonicalResults),
    failingCaseIds: canonicalResults.filter((result) => !result.passed).map((result) => result.caseId),
    results: canonicalResults,
  };
}

export function validateBenchmarkReport(report: BenchmarkReport): BenchmarkReportValidationResult {
  const issues: BenchmarkReportValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (report.schemaVersion !== benchmarkReportSchemaVersion) issue("report.schemaVersion", `must be ${benchmarkReportSchemaVersion}`);
  const caseIds = new Set<string>();
  report.results.forEach((result, index) => {
    const path = `report.results[${index}]`;
    if (!stableId.test(result.caseId)) issue(`${path}.caseId`, "must be a stable kebab-case ID");
    if (caseIds.has(result.caseId)) issue(`${path}.caseId`, "must be unique");
    caseIds.add(result.caseId);
    if (!nonEmpty(result.family)) issue(`${path}.family`, "must be non-empty");
    ["expected", "actual"].forEach((key) => {
      const outcome = result[key as "expected" | "actual"];
      if (!(["accepted", "rejected", "unsupported", "unresolved"] as const).includes(outcome.disposition)) issue(`${path}.${key}.disposition`, "is invalid");
      if (!nonEmpty(outcome.summary)) issue(`${path}.${key}.summary`, "must be non-empty");
    });
    if (result.passed && result.failures.length) issue(`${path}.failures`, "must be empty for a passing case");
    if (!result.passed && !result.failures.length) issue(`${path}.failures`, "must identify at least one failure for a failed case");
    result.failures.forEach((failure, failureIndex) => {
      if (!benchmarkFailureCategories.includes(failure.category)) issue(`${path}.failures[${failureIndex}].category`, "is invalid");
      if (!benchmarkFailureSeverities.includes(failure.severity)) issue(`${path}.failures[${failureIndex}].severity`, "is invalid");
      if (!nonEmpty(failure.detail)) issue(`${path}.failures[${failureIndex}].detail`, "must be non-empty");
    });
  });
  const expected = createBenchmarkReport(report.results);
  (["total", "passed", "failed"] as const).forEach((key) => { if (report[key] !== expected[key]) issue(`report.${key}`, "does not match results"); });
  if (JSON.stringify(report.familyCounts) !== JSON.stringify(expected.familyCounts)) issue("report.familyCounts", "must be canonical counts derived from results");
  if (JSON.stringify(report.categoryCounts) !== JSON.stringify(expected.categoryCounts)) issue("report.categoryCounts", "must include every failure category in canonical order");
  if (JSON.stringify(report.failingCaseIds) !== JSON.stringify(expected.failingCaseIds)) issue("report.failingCaseIds", "must be canonical failed case IDs derived from results");
  if (JSON.stringify(report.results) !== JSON.stringify(expected.results)) issue("report.results", "must be ordered by family then case ID");
  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}
