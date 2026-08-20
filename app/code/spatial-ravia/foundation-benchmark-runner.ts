/** F6-E: one deterministic Foundation benchmark entry point over frozen F1–F5. */

import { capabilityRegistryById, resolveCapabilityRegistrySupport } from "./capability-registry.ts";
import { createBenchmarkReport, type BenchmarkCaseResult, type BenchmarkFailureCategory, type BenchmarkReport } from "./benchmark-report.ts";
import { foundationContractBenchmarkCases, foundationContractBenchmarkInvariants } from "./foundation-benchmark-fixtures.ts";
import { runFoundationContractBenchmark, validateFoundationBenchmarkCases, type FoundationBenchmarkCase } from "./foundation-benchmark-harness.ts";
import { foundationCapabilityBenchmarkCorpus, type FoundationCapabilityBenchmarkCase } from "./foundation-capability-benchmark-corpus.ts";
import { validateFoundationPreservation, type PreservationResult } from "./foundation-preservation-benchmarks.ts";
import { sceneSpecV1Fixtures } from "./scene-spec-v1-fixtures.ts";
import { validateSceneSpecV1 } from "./scene-spec-v1.ts";
import { validateScientificTimeline } from "./scientific-timeline.ts";
import { timelineFixture, timelineFixtureContext } from "./scientific-timeline-fixtures.ts";
import { validateTeachingPlan } from "./teaching-plan.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { validateExportRequest } from "./scene-export-contract.ts";
import { exportRequestFixture, scenePackageFixture } from "./scene-export-contract-fixtures.ts";

export const foundationBenchmarkRunnerVersion = "f6-e-v1" as const;
type RunnerOptions = { corpus?: readonly FoundationCapabilityBenchmarkCase[]; contractCases?: readonly FoundationBenchmarkCase[]; preservation?: () => PreservationResult };
const outcome = (disposition: "accepted" | "rejected" | "unsupported" | "unresolved", summary: string) => ({ disposition, summary } as const);
const failure = (category: BenchmarkFailureCategory, detail: string) => ({ category, severity: "error" as const, detail });
const policyDisposition = (status: string) => status === "SUPPORTED" || status === "PARTIALLY_SUPPORTED" ? "accepted" : status === "CLARIFICATION_REQUIRED" ? "unresolved" : status === "INVALID_SCIENTIFIC_REQUEST" ? "rejected" : "unsupported" as const;

function corpusResult(entry: FoundationCapabilityBenchmarkCase): BenchmarkCaseResult {
  const decision = resolveCapabilityRegistrySupport(entry.policyRequest);
  const failures = [] as ReturnType<typeof failure>[];
  if (decision.status !== entry.expectedSupportPolicyOutcome) failures.push(failure("supportPolicyMismatch", `Expected ${entry.expectedSupportPolicyOutcome}, received ${decision.status}.`));
  if (JSON.stringify(decision.selectedCapabilityIds) !== JSON.stringify(entry.expectedCapabilityIds)) failures.push(failure("capabilityMismatch", "Selected capability IDs differ from the canonical corpus."));
  const invariantCapabilityIds = entry.expectedCapabilityIds.length ? entry.expectedCapabilityIds : entry.policyRequest.clauses.flatMap((clause) => clause.capabilityId ? [clause.capabilityId] : []);
  const expectedPrimitives = new Set(invariantCapabilityIds.flatMap((id) => capabilityRegistryById.get(id)?.primitiveIds ?? []));
  entry.requiredSceneSpecInvariants.forEach((invariant) => { if (!expectedPrimitives.has(invariant as never)) failures.push(failure("capabilityMismatch", `Required SceneSpec invariant ${invariant} is not supplied by the selected capability.`)); });
  const expectedDisposition = entry.expectedSupportPolicyOutcome === "SUPPORTED" || entry.expectedSupportPolicyOutcome === "PARTIALLY_SUPPORTED" ? "accepted" : entry.expectedSupportPolicyOutcome === "CLARIFICATION_REQUIRED" ? "unresolved" : entry.expectedSupportPolicyOutcome === "INVALID_SCIENTIFIC_REQUEST" ? "rejected" : "unsupported";
  return { caseId: entry.caseId, family: `corpus-${entry.kind}`, expected: outcome(expectedDisposition, entry.expectedSupportPolicyOutcome), actual: outcome(policyDisposition(decision.status), decision.status), passed: failures.length === 0, failures };
}

const contractCategory = (benchmarkCase: FoundationBenchmarkCase): BenchmarkFailureCategory => {
  if (benchmarkCase.caseId.includes("fidelity")) return "fidelityProvenanceMismatch";
  if (benchmarkCase.caseId.includes("dangling")) return "danglingReference";
  return benchmarkCase.family === "timeline" ? "timelineMismatch" : benchmarkCase.family === "teachingPlan" ? "teachingMismatch" : benchmarkCase.family === "export" ? "exportMismatch" : benchmarkCase.family === "scientificSceneSpec" ? "scientificInvalidity" : benchmarkCase.family === "sceneSpecV1" || benchmarkCase.family === "semanticIntent" ? "schemaVersionFailure" : "capabilityMismatch";
};
function contractResults(cases: readonly FoundationBenchmarkCase[]): BenchmarkCaseResult[] {
  const integrity = validateFoundationBenchmarkCases(cases);
  const run = runFoundationContractBenchmark(cases, foundationContractBenchmarkInvariants);
  return run.cases.map((result) => {
    const benchmarkCase = cases.find((entry) => entry.caseId === result.caseId)!;
    const failures = result.failures.map((entry) => failure(contractCategory(benchmarkCase), entry.reason));
    if (!integrity.valid) failures.push(failure("schemaVersionFailure", "Contract benchmark metadata is invalid."));
    return { caseId: result.caseId, family: `contract-${benchmarkCase.family}`, expected: outcome(benchmarkCase.expected.valid ? "accepted" : "rejected", benchmarkCase.expected.outcome ?? "validation"), actual: outcome(result.validation.valid ? "accepted" : "rejected", result.validation.outcome ?? "validation"), passed: failures.length === 0, failures };
  });
}

function crossContractResults(): BenchmarkCaseResult[] {
  const staticPartial = resolveCapabilityRegistrySupport({ allowSchematic: false, allowExplicitStaticSubstitution: true, clauses: [{ clauseId: "explicit-static", capabilityId: "dna-helix-stabilization", requestedEntityIds: capabilityRegistryById.get("dna-helix-stabilization")!.requiredSemanticEntities, requiresAnimation: true }] });
  const checks: readonly [string, string, boolean, BenchmarkFailureCategory][] = [
    ["semantic-capability", "cross-semantic-capability", capabilityRegistryById.has("dna-base-pairing"), "capabilityMismatch"],
    ["scene-spec-references", "cross-scene-spec", validateSceneSpecV1(sceneSpecV1Fixtures.rnaDnaStability).valid, "danglingReference"],
    ["scientific-timeline", "cross-timeline", validateScientificTimeline(timelineFixture, timelineFixtureContext).valid, "timelineMismatch"],
    ["scientific-teaching", "cross-teaching", validateTeachingPlan(teachingPlanFixture, scientificSceneSpecFixtures["rna-dna-stability"]).valid, "teachingMismatch"],
    ["provenance-export", "cross-export", validateExportRequest(exportRequestFixture, scenePackageFixture).valid, "exportMismatch"],
    ["explicit-static-substitution", "cross-static-animation", staticPartial.status === "PARTIALLY_SUPPORTED" && staticPartial.disclosure?.staticSubstitution === true, "supportPolicyMismatch"],
  ];
  return checks.map(([caseId, family, passed, category]) => ({ caseId, family, expected: outcome("accepted", "valid cross-contract composition"), actual: outcome(passed ? "accepted" : "rejected", passed ? "valid" : "invalid"), passed, failures: passed ? [] : [failure(category, "Cross-contract invariant failed.")] }));
}

/** Canonical entry point. Same frozen inputs produce byte-identical reports. */
export function runFoundationBenchmarkRunner(options: RunnerOptions = {}): BenchmarkReport {
  const corpus = options.corpus ?? foundationCapabilityBenchmarkCorpus;
  const contracts = options.contractCases ?? foundationContractBenchmarkCases;
  const preservation = (options.preservation ?? validateFoundationPreservation)();
  const results = [...corpus.map(corpusResult), ...contractResults(contracts), ...crossContractResults()];
  results.push({ caseId: "preservation-cross-check", family: "preservation", expected: outcome("accepted", "frozen benchmark behavior preserved"), actual: outcome(preservation.valid ? "accepted" : "rejected", preservation.valid ? "preserved" : "drift"), passed: preservation.valid, failures: preservation.valid ? [] : preservation.issues.map((entry) => failure("preservationRegression", `${entry.path}: ${entry.message}`)) });
  return createBenchmarkReport(results);
}

/** Typed taxonomy guard used by negative self-tests and report consumers. */
export function hasOnlyKnownFailureCategories(report: BenchmarkReport) {
  const known: readonly BenchmarkFailureCategory[] = ["semanticMismatch", "scientificInvalidity", "danglingReference", "capabilityMismatch", "supportPolicyMismatch", "fidelityProvenanceMismatch", "timelineMismatch", "teachingMismatch", "exportMismatch", "preservationRegression", "schemaVersionFailure"];
  return report.results.every((result) => result.failures.every((entry) => known.includes(entry.category)));
}
