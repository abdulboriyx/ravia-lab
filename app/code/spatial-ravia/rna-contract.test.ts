import assert from "node:assert/strict";
import test from "node:test";
import { rnaFamilies, rnaEntities, rnaTypes } from "./rna-contract.ts";
import { rnaV1Benchmark } from "./rna-benchmark.ts";
import { resolveRnaFamily, resolveRnaIntent } from "./rna-intent.ts";

test("RNA v1 contract exposes eight families, RNA identities, and chemical vocabulary", () => {
  assert.deepEqual(rnaFamilies, ["structure", "typesFunctions", "nascentTranscript", "processing", "secondaryStructure", "pairingHybridization", "degradationStability", "localChemistry"]);
  assert.ok(rnaTypes.includes("mRNA") && rnaTypes.includes("tRNA") && rnaTypes.includes("rRNA") && rnaTypes.includes("miRNA"));
  for (const entity of ["ribose", "twoPrimeHydroxyl", "phosphate", "uracil", "phosphodiesterLinkage", "cap", "polyATail", "stem", "bulge"] as const) assert.ok(rnaEntities.includes(entity));
});

test("RNA benchmark contains exactly 80 cases and ten cases per family", () => {
  assert.equal(rnaV1Benchmark.length, 80);
  for (const family of rnaFamilies) assert.equal(rnaV1Benchmark.filter((item) => item.expectedFamily === family).length, 10, family);
  assert.equal(new Set(rnaV1Benchmark.map((item) => item.id)).size, 80);
});

test("all RNA benchmark prompts resolve to their declared semantic family", () => {
  for (const item of rnaV1Benchmark) assert.equal(resolveRnaFamily(item.prompt)?.family, item.expectedFamily, item.id);
});

test("resolved RNA intent preserves benchmark scale, type, states, entities, and DNA context", () => {
  for (const item of rnaV1Benchmark) {
    const intent = resolveRnaIntent(item.prompt);
    assert.ok(intent, item.id);
    assert.equal(intent.spec.scale.level, item.expectedScale, item.id);
    assert.equal(intent.spec.rnaType, item.expectedRnaType, item.id);
    assert.equal(intent.spec.structuralState, item.expectedStructuralState, item.id);
    assert.equal(intent.spec.pairingState, item.expectedPairingState, item.id);
    assert.equal(intent.spec.processingState, item.expectedProcessingState, item.id);
    assert.equal(intent.spec.dnaContext.required, item.dnaContextRequired, item.id);
    for (const entity of item.importantEntities) assert.ok(intent.spec.requiredEntities.includes(entity), `${item.id}: ${entity}`);
  }
});

test("RNA family conflict guards select the narrow semantic family", () => {
  assert.equal(resolveRnaFamily("show the 2′-OH in RNA")?.family, "localChemistry");
  assert.equal(resolveRnaFamily("show an RNA hairpin")?.family, "secondaryStructure");
  assert.equal(resolveRnaFamily("show mRNA with a poly(A) tail")?.family, "processing");
  assert.equal(resolveRnaFamily("show RNA emerging from RNA polymerase")?.family, "nascentTranscript");
  assert.equal(resolveRnaFamily("show A pairing with U")?.family, "pairingHybridization");
  assert.equal(resolveRnaFamily("show why RNA is less stable than DNA")?.family, "degradationStability");
});

test("non-RNA prompts do not acquire an RNA family", () => {
  assert.equal(resolveRnaFamily("show the structure of B-DNA"), undefined);
  assert.equal(resolveRnaFamily("show a ribosome making a peptide"), undefined);
});

