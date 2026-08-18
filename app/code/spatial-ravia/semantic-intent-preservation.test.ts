import assert from "node:assert/strict";
import test from "node:test";
import { f1HostileContractFixtures, f1SemanticPreservationCases, runF1SemanticPreservationBenchmark } from "./semantic-intent-preservation.ts";
import { validateSemanticIntent } from "./semantic-intent.ts";

test("F1 preservation benchmark covers every current DNA/RNA semantic family and mechanism", () => {
  const result = runF1SemanticPreservationBenchmark();
  assert.equal(result.total, 25);
  assert.equal(result.passed, result.total, JSON.stringify(result.failures, null, 2));
  const ids = new Set(f1SemanticPreservationCases.map((item) => item.id));
  for (const required of ["dna-structure", "dna-regulation", "dna-replication", "dna-transcription", "dna-damage", "dna-packaging", "dna-local-chemistry", "dna-base-pairing", "dna-backbone", "dna-polarity", "dna-stabilization", "dna-separation", "dna-assembly", "rna-structure", "rna-types", "rna-nascent", "rna-processing", "rna-secondary", "rna-pairing", "rna-hybrid", "rna-degradation", "rna-stability", "rna-local", "comparison-dna-rna"]) assert.ok(ids.has(required), `missing ${required}`);
});

test("hostile contract fixtures preserve ambiguity, claims, multi-intent, and screen direction", () => {
  for (const fixture of f1HostileContractFixtures) assert.equal(validateSemanticIntent(fixture).valid, true);
  assert.equal(f1HostileContractFixtures[2]!.clarification.required, true);
  assert.equal(f1HostileContractFixtures[3]!.assertedClaims[0]!.status, "suspected");
  assert.deepEqual(f1HostileContractFixtures[4]!.acts, ["show", "explain"]);
  assert.equal(f1HostileContractFixtures[5]!.requests[0]!.direction?.screen, "screenLeft");
  assert.equal(f1HostileContractFixtures[5]!.requests[0]!.direction?.meaning, "presentational");
});

test("preservation benchmark is deterministic", () => {
  assert.deepEqual(runF1SemanticPreservationBenchmark(), runF1SemanticPreservationBenchmark());
});

test("F1 freeze contract rejects malformed inputs without scientific validation", () => {
  const fixture = structuredClone(f1HostileContractFixtures[0]!);
  fixture.rawUtterance = "";
  const result = validateSemanticIntent(fixture);
  assert.equal(result.valid, false);
});
