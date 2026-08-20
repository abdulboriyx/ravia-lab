import assert from "node:assert/strict";
import test from "node:test";
import { foundationCapabilityBenchmarkCorpus, validateFoundationCapabilityBenchmarkCorpus, type FoundationCapabilityBenchmarkCase } from "./foundation-capability-benchmark-corpus.ts";

test("F6-B corpus deterministically covers all requested DNA/RNA capabilities and policy edge cases", () => {
  assert.deepEqual(validateFoundationCapabilityBenchmarkCorpus(), { valid: true, issues: [] });
  assert.equal(foundationCapabilityBenchmarkCorpus.length, 29);
  for (const id of ["dna-duplex", "dna-at-pair", "dna-gc-pair", "dna-polarity", "dna-phosphodiester", "dna-separation", "dna-replication", "dna-transcription", "dna-packaging", "dna-damage-repair", "rna-nucleotide", "rna-generic", "rna-hairpin", "rna-processing", "rna-pre-mature", "rna-au-pair", "rna-gc-pair", "rna-dna-hybrid", "rna-cleavage", "rna-exonuclease", "rna-stability"]) assert.ok(foundationCapabilityBenchmarkCorpus.some((entry) => entry.caseId === id));
});

test("F6-B rejects corpus expectations that drift from frozen policy or required SceneSpec invariants", () => {
  const invalid = structuredClone(foundationCapabilityBenchmarkCorpus) as FoundationCapabilityBenchmarkCase[];
  invalid[0]!.expectedCapabilityIds = ["rna-generic-structure"];
  invalid[0]!.requiredSceneSpecInvariants = ["not-a-frozen-primitive"];
  const result = validateFoundationCapabilityBenchmarkCorpus(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.path.includes("expectedCapabilityIds")) && result.issues.some((issue) => issue.path.includes("requiredSceneSpecInvariants")));
});
