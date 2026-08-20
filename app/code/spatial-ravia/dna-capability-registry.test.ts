import assert from "node:assert/strict";
import test from "node:test";
import { dnaCapabilityRegistry, validateDnaCapabilityRegistry, type DnaCapabilityRecord } from "./dna-capability-registry.ts";

test("F5-A registers all supported DNA families and named mechanism capabilities deterministically", () => {
  assert.deepEqual(validateDnaCapabilityRegistry(dnaCapabilityRegistry), { valid: true, issues: [] });
  assert.equal(dnaCapabilityRegistry.length, 13);
  for (const capabilityId of ["dna-canonical-structure", "dna-sequence-regulation", "dna-replication", "dna-transcription", "dna-damage-repair", "dna-packaging", "dna-local-chemistry", "dna-base-pairing", "dna-phosphodiester-backbone", "dna-antiparallel-polarity", "dna-helix-stabilization", "dna-strand-separation", "dna-nucleotide-assembly"]) assert.ok(dnaCapabilityRegistry.some((record) => record.capabilityId === capabilityId));
});

test("F5-A rejects invalid capability IDs, frozen-vocabulary drift, renderer owners, and malformed readiness", () => {
  const invalid = structuredClone(dnaCapabilityRegistry) as DnaCapabilityRecord[];
  invalid[0]!.capabilityId = invalid[1]!.capabilityId;
  invalid[0]!.requiredSemanticEntities = ["renderer-mesh" as never];
  invalid[0]!.presentationOwner = "three-scene" as never;
  invalid[0]!.readiness.timeline = "camera-driven" as never;
  const result = validateDnaCapabilityRegistry(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.message.includes("unique")) && result.issues.some((issue) => issue.path.includes("requiredSemanticEntities")) && result.issues.some((issue) => issue.path.includes("presentationOwner")) && result.issues.some((issue) => issue.path.includes("readiness.timeline")));
});
