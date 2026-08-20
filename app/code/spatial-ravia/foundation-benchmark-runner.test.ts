import assert from "node:assert/strict";
import test from "node:test";
import { foundationCapabilityBenchmarkCorpus, type FoundationCapabilityBenchmarkCase } from "./foundation-capability-benchmark-corpus.ts";
import { runFoundationBenchmarkRunner, hasOnlyKnownFailureCategories } from "./foundation-benchmark-runner.ts";
import { foundationContractBenchmarkCases } from "./foundation-benchmark-fixtures.ts";
import type { FoundationBenchmarkCase } from "./foundation-benchmark-harness.ts";

test("F6-E creates one deterministic authoritative Foundation report", () => {
  const first = runFoundationBenchmarkRunner(); const second = runFoundationBenchmarkRunner();
  assert.deepEqual(first, second); assert.equal(first.failed, 0); assert.equal(first.total, 48); assert.equal(hasOnlyKnownFailureCategories(first), true);
  assert.ok(first.familyCounts.some((entry) => entry.family === "preservation"));
});

test("F6-E detects wrong capability, support outcome, and required SceneSpec invariant", () => {
  const wrongCapability = structuredClone(foundationCapabilityBenchmarkCorpus) as FoundationCapabilityBenchmarkCase[];
  wrongCapability[0]!.expectedCapabilityIds = ["rna-generic-structure"];
  const capabilityReport = runFoundationBenchmarkRunner({ corpus: wrongCapability });
  assert.ok(capabilityReport.categoryCounts.find((entry) => entry.category === "capabilityMismatch")!.count > 0);
  const wrongOutcome = structuredClone(foundationCapabilityBenchmarkCorpus) as FoundationCapabilityBenchmarkCase[];
  wrongOutcome[0]!.expectedSupportPolicyOutcome = "UNSUPPORTED";
  const outcomeReport = runFoundationBenchmarkRunner({ corpus: wrongOutcome });
  assert.ok(outcomeReport.categoryCounts.find((entry) => entry.category === "supportPolicyMismatch")!.count > 0);
  const wrongInvariant = structuredClone(foundationCapabilityBenchmarkCorpus) as FoundationCapabilityBenchmarkCase[];
  wrongInvariant[0]!.requiredSceneSpecInvariants = ["missing-primitive"];
  const invariantReport = runFoundationBenchmarkRunner({ corpus: wrongInvariant });
  assert.ok(invariantReport.categoryCounts.find((entry) => entry.category === "capabilityMismatch")!.count > 0);
});

test("F6-E catches dangling, fidelity, timeline, teaching, export, schema, and preservation failures", () => {
  const corrupt = (sourceId: string, caseId: string, mutate: (input: any) => void) => {
    const source = structuredClone(foundationContractBenchmarkCases.find((entry) => entry.caseId === sourceId)!) as FoundationBenchmarkCase;
    (source as any).caseId = caseId; mutate((source as any).input); return runFoundationBenchmarkRunner({ contractCases: [source] });
  };
  const dangling = corrupt("scene-positive", "dangling-scene", (input) => { input.topology.interactions[0]?.participants[0] && (input.topology.interactions[0].participants[0].actorId = "missing-actor"); });
  const fidelity = corrupt("scene-positive", "fidelity-scene", (input) => { input.fidelityProvenance.attachments[0].fidelity = "unknown"; });
  const timeline = corrupt("timeline-positive", "timeline-negative", (input) => { input.timeline.clock.duration = -1; });
  const teaching = corrupt("teaching-positive", "teaching-negative", (input) => { input.plan.projections[0].audience = "unknown"; });
  const exporting = corrupt("export-request-positive", "export-negative", (input) => { input.value.timeline.fps = 0; });
  const schema = corrupt("semantic-positive", "schema-negative", (input) => { input.schemaVersion = "2"; });
  for (const [report, category] of [[dangling, "danglingReference"], [fidelity, "fidelityProvenanceMismatch"], [timeline, "timelineMismatch"], [teaching, "teachingMismatch"], [exporting, "exportMismatch"], [schema, "schemaVersionFailure"]] as const) assert.ok(report.categoryCounts.find((entry) => entry.category === category)!.count > 0, category);
  const report = runFoundationBenchmarkRunner({ preservation: () => ({ valid: false, issues: [{ path: "rna[0]", message: "owner drift" }] }) });
  assert.equal(report.categoryCounts.find((entry) => entry.category === "preservationRegression")!.count, 1);
  assert.deepEqual(report.categoryCounts.map((entry) => entry.category), ["semanticMismatch", "scientificInvalidity", "danglingReference", "capabilityMismatch", "supportPolicyMismatch", "fidelityProvenanceMismatch", "timelineMismatch", "teachingMismatch", "exportMismatch", "preservationRegression", "schemaVersionFailure"]);
});
