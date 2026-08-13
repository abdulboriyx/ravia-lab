import assert from "node:assert/strict";
import test from "node:test";

import { dnaFamilyBenchmark } from "./dna-family-benchmark.ts";

test("DNA family benchmark has 100 complete, balanced cases", () => {
  assert.equal(dnaFamilyBenchmark.length, 100);

  const expectedCounts = {
    structure: 15,
    "sequence-regulation": 15,
    replication: 20,
    transcription: 15,
    "damage-repair": 15,
    packaging: 10,
    "local-chemistry": 10,
  };
  const actualCounts = Object.fromEntries(
    Object.keys(expectedCounts).map((family) => [
      family,
      dnaFamilyBenchmark.filter((testCase) => testCase.expected.sceneFamily === family).length,
    ])
  );
  assert.deepEqual(actualCounts, expectedCounts);

  for (const testCase of dnaFamilyBenchmark) {
    assert.ok(testCase.id.length > 0);
    assert.ok(testCase.prompt.length > 0);
    assert.ok(testCase.expected.focus.length > 0);
    assert.ok(testCase.expected.importantEntities.length > 0);
    assert.equal(typeof testCase.expected.supported, "boolean");
  }
});
