import assert from "node:assert/strict";
import test from "node:test";
import {
  dnaRepresentationRegistry,
  dnaSceneFamilies,
  dnaVisualGrammar,
  getDnaRepresentationSpecification,
  isValidDnaRepresentationSpecification,
} from "./biology-dna-representation-contract.ts";

test("canonical DNA representation registry covers each supported DNA scene family", () => {
  assert.deepEqual(Object.keys(dnaRepresentationRegistry).sort(), [...dnaSceneFamilies].sort());
  for (const family of dnaSceneFamilies) {
    const specification = getDnaRepresentationSpecification(family);
    assert.equal(specification.family, family);
    assert.equal(isValidDnaRepresentationSpecification(specification), true);
  }
});

test("DNA opening remains local to fork and transcription families", () => {
  assert.equal(dnaRepresentationRegistry.replication.strandState, "locally-open");
  assert.equal(dnaRepresentationRegistry.transcription.strandState, "locally-open");
  assert.ok((dnaRepresentationRegistry.replication.focalRegion.maxOpenBasePairs ?? 0) > 0);
  assert.ok((dnaRepresentationRegistry.transcription.focalRegion.maxOpenBasePairs ?? 0) > 0);
  assert.equal(dnaRepresentationRegistry.structure.strandState, "double-stranded");
  assert.equal(dnaRepresentationRegistry.packaging.strandState, "double-stranded");
});

test("the shared DNA visual grammar preserves B-DNA and local-only chemistry conventions", () => {
  assert.equal(dnaVisualGrammar.bDna.handedness, "right-handed");
  assert.ok(dnaVisualGrammar.bDna.risePerBasePairAngstrom > 0);
  assert.ok(dnaVisualGrammar.bDna.basePairsPerTurn > 0);
  assert.equal(dnaVisualGrammar.atomsAndBonds.scope, "selected-local-residues-only");
  assert.equal(dnaVisualGrammar.annotations.detachedRegionBlocks, false);
  assert.notEqual(dnaVisualGrammar.themes.light.labels, dnaVisualGrammar.themes.dark.labels);
});
