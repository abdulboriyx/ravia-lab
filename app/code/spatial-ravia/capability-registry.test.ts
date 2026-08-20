import assert from "node:assert/strict";
import test from "node:test";
import { capabilityRegistry, capabilityRegistryPolicyDescriptors, resolveCapabilityRegistrySupport, validateCapabilityRegistry } from "./capability-registry.ts";

test("CapabilityRegistry v1 is authoritative and has unique DNA/RNA IDs", () => {
  assert.equal(validateCapabilityRegistry(capabilityRegistry).valid, true);
  assert.equal(capabilityRegistry.length, 25);
  assert.equal(capabilityRegistry.filter((record) => record.domain === "DNA").length, 13);
  assert.equal(capabilityRegistry.filter((record) => record.domain === "RNA").length, 12);
  assert.equal(new Set(capabilityRegistry.map((record) => record.capabilityId)).size, capabilityRegistry.length);
});

test("every capability has SceneSpec compatibility and shared primitive reuse", () => {
  for (const record of capabilityRegistry) {
    assert.equal(record.sceneSpecCompatibility.actors, true);
    assert.equal(record.sceneSpecCompatibility.states, true);
    assert.equal(record.sceneSpecCompatibility.presentationIntent, true);
    assert.ok(record.primitiveIds.length > 0);
    assert.ok(record.requiredSceneSpecPrimitives.includes("fidelityProvenance"));
  }
});

test("registry support policy delegates deterministic supported and partial outcomes", () => {
  const supported = resolveCapabilityRegistrySupport({ clauses: [{ clauseId: "dna", capabilityId: "dna-canonical-structure", requestedEntityIds: ["dna", "duplex", "strand"] }], allowSchematic: false, allowExplicitStaticSubstitution: false });
  assert.equal(supported.status, "SUPPORTED");
  const staticOnly = resolveCapabilityRegistrySupport({ clauses: [{ clauseId: "rna", capabilityId: "rna-generic-structure", requestedEntityIds: ["rna", "ribose", "phosphate", "base"], requiresAnimation: true }], allowSchematic: false, allowExplicitStaticSubstitution: true });
  assert.equal(staticOnly.status, "PARTIALLY_SUPPORTED");
  assert.equal(staticOnly.disclosure?.staticSubstitution, true);
});

test("registry policy preserves clarification, unsupported, and invalid-science outcomes", () => {
  const clarification = resolveCapabilityRegistrySupport({ clauses: [{ clauseId: "open", candidateCapabilityIds: ["dna-transcription", "dna-replication"], ambiguousMechanism: true }], allowSchematic: false, allowExplicitStaticSubstitution: false });
  assert.equal(clarification.status, "CLARIFICATION_REQUIRED");
  const unsupported = resolveCapabilityRegistrySupport({ clauses: [{ clauseId: "export", capabilityId: "dna-canonical-structure", requestedEntityIds: ["dna", "duplex", "strand"], outputKind: "export", exportFormat: "unknown" }], allowSchematic: false, allowExplicitStaticSubstitution: false });
  assert.equal(unsupported.status, "UNSUPPORTED");
  const invalid = resolveCapabilityRegistrySupport({ clauses: [{ clauseId: "claim", capabilityId: "rna-generic-structure", scientificValidity: "misconception" }], allowSchematic: false, allowExplicitStaticSubstitution: false });
  assert.equal(invalid.status, "INVALID_SCIENTIFIC_REQUEST");
});

test("registry rejects duplicate IDs, primitive drift, dangling benchmarks, and contradictory status", () => {
  const invalid = structuredClone(capabilityRegistry) as typeof capabilityRegistry extends readonly (infer T)[] ? T[] : never;
  invalid[0]!.capabilityId = invalid[1]!.capabilityId;
  invalid[0]!.primitiveIds = ["not-a-primitive" as never];
  invalid[0]!.benchmarkReferences = ["missing-benchmark"];
  invalid[0]!.supportStatus = "UNSUPPORTED";
  const result = validateCapabilityRegistry(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.message.includes("unique")));
    assert.ok(result.issues.some((issue) => issue.path.includes("primitiveIds")));
    assert.ok(result.issues.some((issue) => issue.path.includes("benchmarkReferences")));
    assert.ok(result.issues.some((issue) => issue.path.includes("supportStatus")));
  }
});

test("policy descriptor count matches normalized capability count", () => {
  assert.equal(capabilityRegistryPolicyDescriptors.length, capabilityRegistry.length);
});

test("strict validation rejects unknown nested fields and malformed owner/readiness values", () => {
  const unknown = structuredClone(capabilityRegistry);
  (unknown[0] as Record<string, unknown>).injected = true;
  (unknown[0]!.readiness as Record<string, unknown>).camera = "preset";
  (unknown[0]!.policyDescriptor as Record<string, unknown>).renderer = "three";
  const result = validateCapabilityRegistry(unknown);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path.includes("injected")));
    assert.ok(result.issues.some((issue) => issue.path.includes("readiness.camera")));
    assert.ok(result.issues.some((issue) => issue.path.includes("policyDescriptor.renderer")));
  }
  const malformed = structuredClone(capabilityRegistry);
  malformed[0]!.presentationOwner = "arbitrary-module";
  malformed[0]!.readiness.timeline = "invalid" as never;
  malformed[0]!.readiness.teaching = "invalid" as never;
  malformed[0]!.readiness.export = "invalid" as never;
  const malformedResult = validateCapabilityRegistry(malformed);
  assert.equal(malformedResult.valid, false);
});

test("strict validation rejects impossible F2-C fidelity and policy mismatches", () => {
  const invalid = structuredClone(capabilityRegistry);
  invalid[0]!.fidelityRequirements.minimum = "E0_DEPOSITED";
  invalid[0]!.policyDescriptor.supportedFidelity = "hybrid";
  const result = validateCapabilityRegistry(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.path.includes("supportedFidelity")));
});
