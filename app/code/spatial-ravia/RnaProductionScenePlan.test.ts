import assert from "node:assert/strict";
import test from "node:test";
import { rnaV1Benchmark } from "./rna-benchmark.ts";
import { resolveRnaPresentation, rnaPresentationOwners } from "./RnaPresentationRouter.ts";
import { deriveProductionRnaScenePlan } from "./RnaProductionScenePlan.ts";

test("all eight RNA owners produce one shared production scene plan", () => {
  const families = new Set(rnaV1Benchmark.map((item) => item.expectedFamily));
  for (const family of families) {
    const route = resolveRnaPresentation(rnaV1Benchmark.find((item) => item.expectedFamily === family)!.prompt)!;
    const plan = deriveProductionRnaScenePlan(route);
    assert.equal(route.owner, rnaPresentationOwners[family]);
    assert.equal(plan.metadata.owner, route.owner);
    assert.ok(plan.cameraIntent.length > 0);
    assert.ok(plan.strands.length > 0 || plan.atoms.length > 0);
  }
  assert.equal(families.size, 8);
});

test("local chemistry uses atom/bond LOD without spawning a whole RNA backbone", () => {
  const route = resolveRnaPresentation("show the 2 prime OH in RNA")!;
  const plan = deriveProductionRnaScenePlan(route);
  assert.equal(plan.structuralMode, "local-chemistry");
  assert.ok(plan.atoms.some((atom) => atom.role === "twoPrimeHydroxyl"));
  assert.ok(plan.bonds.length > 0);
  assert.equal(plan.strands.length, 0);
});

test("RNA-DNA local chemistry comparison mounts the existing DNA chemistry plan beside RNA", () => {
  const route = resolveRnaPresentation("compare a DNA nucleotide and an RNA nucleotide")!;
  const plan = deriveProductionRnaScenePlan(route);
  assert.equal(plan.structuralMode, "local-chemistry");
  assert.ok(plan.atoms.length > 0);
  assert.ok(plan.comparisonAtoms.length > 0);
  assert.ok(plan.comparisonBonds.length > 0);
});

test("secondary structure and type routes retain structural strands", () => {
  const hairpin = deriveProductionRnaScenePlan(resolveRnaPresentation("show an RNA hairpin")!);
  const trna = deriveProductionRnaScenePlan(resolveRnaPresentation("show a tRNA")!);
  assert.equal(hairpin.strands.length, 1);
  assert.ok(hairpin.strands[0].samples.length > 1);
  assert.equal(trna.strands.length, 1);
  assert.ok(trna.strands[0].samples.length > 1);
});

test("pairing and hybrid routes mount paired strands and interaction overlays", () => {
  const pair = deriveProductionRnaScenePlan(resolveRnaPresentation("show how adenine pairs with uracil")!);
  const hybrid = deriveProductionRnaScenePlan(resolveRnaPresentation("show an RNA DNA hybrid")!);
  assert.equal(pair.strands.length, 2);
  assert.ok(pair.interactions.length > 0);
  assert.equal(hybrid.strands.length, 2);
  assert.deepEqual(hybrid.strands.map((strand) => strand.kind), ["RNA", "DNA"]);
});

test("processing, degradation, and nascent routes retain RNA-centered overlays", () => {
  const processing = deriveProductionRnaScenePlan(resolveRnaPresentation("show introns and exons in pre mRNA")!);
  const degradation = deriveProductionRnaScenePlan(resolveRnaPresentation("show RNA being cleaved")!);
  const nascent = deriveProductionRnaScenePlan(resolveRnaPresentation("show RNA emerging from transcription")!);
  assert.equal(processing.strands.length, 1);
  assert.ok(processing.highlightedIndices.length > 0);
  assert.equal(degradation.strands.length, 1);
  assert.ok(degradation.interactions.length > 0);
  assert.equal(nascent.family, "nascentTranscript");
  assert.equal(nascent.strands.length, 1);
});

test("generic B-DNA bypasses the RNA production renderer", () => {
  assert.equal(resolveRnaPresentation("show B-DNA"), undefined);
});
