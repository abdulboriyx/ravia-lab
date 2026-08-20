/** F6-A representative positive, negative, preservation, and cross-contract cases. */
import { capabilityRegistry } from "./capability-registry.ts";
import { exportManifestFixture, exportRequestFixture, scenePackageFixture } from "./scene-export-contract-fixtures.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { sceneSpecV1Fixtures } from "./scene-spec-v1-fixtures.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { teachingPlanFixture } from "./teaching-plan-fixtures.ts";
import { timelineFixture, timelineFixtureContext } from "./scientific-timeline-fixtures.ts";
import type { FoundationBenchmarkCase, FoundationBenchmarkInvariant } from "./foundation-benchmark-harness.ts";

export const foundationContractBenchmarkCases: readonly FoundationBenchmarkCase[] = [
  { schemaVersion: "1", caseId: "semantic-positive", family: "semanticIntent", benchmarkVersion: "f6-a-v1", kind: "positive", input: semanticIntentFixtures.rnaHairpin, expected: { valid: true, outcome: "valid", invariants: ["has-raw-utterance"] } },
  { schemaVersion: "1", caseId: "semantic-negative", family: "semanticIntent", benchmarkVersion: "f6-a-v1", kind: "negative", input: { ...semanticIntentFixtures.rnaHairpin, camera: { fov: 40 } }, expected: { valid: false, outcome: "invalid" }, failure: { category: "validation", reason: "Renderer-only fields are forbidden." } },
  { schemaVersion: "1", caseId: "scene-positive", family: "scientificSceneSpec", benchmarkVersion: "f6-a-v1", kind: "positive", input: scientificSceneSpecFixtures["rna-dna-stability"], expected: { valid: true, outcome: "valid" } },
  { schemaVersion: "1", caseId: "scene-negative", family: "scientificSceneSpec", benchmarkVersion: "f6-a-v1", kind: "negative", input: { ...scientificSceneSpecFixtures["rna-dna-stability"], camera: { fov: 40 } }, expected: { valid: false, outcome: "invalid" }, failure: { category: "validation", reason: "Scene geometry/camera is not part of F2." } },
  { schemaVersion: "1", caseId: "timeline-positive", family: "timeline", benchmarkVersion: "f6-a-v1", kind: "crossContract", input: { timeline: timelineFixture, context: timelineFixtureContext }, expected: { valid: true, outcome: "valid", invariants: ["has-context"] } },
  { schemaVersion: "1", caseId: "teaching-positive", family: "teachingPlan", benchmarkVersion: "f6-a-v1", kind: "crossContract", input: { plan: teachingPlanFixture, scene: scientificSceneSpecFixtures["rna-dna-stability"] }, expected: { valid: true, outcome: "valid", invariants: ["has-context"] } },
  { schemaVersion: "1", caseId: "export-package-positive", family: "export", benchmarkVersion: "f6-a-v1", kind: "positive", input: { kind: "scenePackage", value: scenePackageFixture }, expected: { valid: true, outcome: "valid" } },
  { schemaVersion: "1", caseId: "export-request-positive", family: "export", benchmarkVersion: "f6-a-v1", kind: "crossContract", input: { kind: "request", value: exportRequestFixture, scenePackage: scenePackageFixture }, expected: { valid: true, outcome: "valid", invariants: ["has-context"] } },
  { schemaVersion: "1", caseId: "export-manifest-positive", family: "export", benchmarkVersion: "f6-a-v1", kind: "crossContract", input: { kind: "manifest", value: exportManifestFixture, request: exportRequestFixture, scenePackage: scenePackageFixture }, expected: { valid: true, outcome: "valid", invariants: ["has-context"] } },
  { schemaVersion: "1", caseId: "scene-spec-positive", family: "sceneSpecV1", benchmarkVersion: "f6-a-v1", kind: "crossContract", input: sceneSpecV1Fixtures.rnaDnaStability, expected: { valid: true, outcome: "valid", invariants: ["has-context"] } },
  { schemaVersion: "1", caseId: "scene-spec-negative", family: "sceneSpecV1", benchmarkVersion: "f6-a-v1", kind: "negative", input: { ...sceneSpecV1Fixtures.rnaDnaStability, camera: { fov: 40 } }, expected: { valid: false, outcome: "invalid" }, failure: { category: "validation", reason: "SceneSpec rejects renderer leakage." } },
  { schemaVersion: "1", caseId: "capability-positive", family: "capabilityRegistry", benchmarkVersion: "f6-a-v1", kind: "preservation", input: { records: capabilityRegistry }, expected: { valid: true, outcome: "valid", invariants: ["has-capabilities"] } },
];

export const foundationContractBenchmarkInvariants: Readonly<Record<string, FoundationBenchmarkInvariant>> = {
  "has-raw-utterance": (input) => typeof (input as { rawUtterance?: unknown }).rawUtterance === "string",
  "has-context": (input) => typeof input === "object" && input !== null,
  "has-capabilities": (input) => Array.isArray((input as { records?: unknown }).records) && ((input as { records: unknown[] }).records).length === 25,
};
