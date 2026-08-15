import assert from "node:assert/strict";
import test from "node:test";
import { rnaV1Benchmark } from "./rna-benchmark.ts";
import { isRnaPresentationRoute, resolveRnaPresentation, routeRnaPresentation, rnaPresentationOwners } from "./RnaPresentationRouter.ts";

test("all 80 RNA benchmark prompts have deterministic family ownership routes", () => {
  assert.equal(rnaV1Benchmark.length, 80);
  for (const item of rnaV1Benchmark) {
    const route = resolveRnaPresentation(item.prompt);
    assert.ok(route, item.id);
    assert.equal(route.family, item.expectedFamily, item.id);
    assert.equal(route.owner, rnaPresentationOwners[item.expectedFamily], item.id);
    assert.equal(route.sourceSpec.family, item.expectedFamily, item.id);
    assert.ok(isRnaPresentationRoute(route), item.id);
    assert.ok(route.cameraIntent.length > 0, item.id);
    assert.ok(route.representationMode.length > 0, item.id);
  }
});

test("RNA golden prompts use authoritative family owners", () => {
  const expected: Array<[string, keyof typeof rnaPresentationOwners]> = [
    ["show the structure of RNA", "structure"],
    ["show the 2 prime OH in RNA", "localChemistry"],
    ["show an RNA hairpin", "secondaryStructure"],
    ["show a tRNA", "typesFunctions"],
    ["show how adenine pairs with uracil", "pairingHybridization"],
    ["show an RNA DNA hybrid", "pairingHybridization"],
    ["show introns and exons in pre mRNA", "processing"],
    ["compare pre mRNA and mature mRNA", "processing"],
    ["show RNA being cleaved", "degradationStability"],
    ["why is RNA less chemically stable than DNA", "degradationStability"],
    ["show RNA emerging from transcription", "nascentTranscript"],
    ["compare mRNA and tRNA", "typesFunctions"],
  ];
  for (const [prompt, family] of expected) assert.equal(resolveRnaPresentation(prompt)?.owner, rnaPresentationOwners[family], prompt);
});

test("RNA conflict guards beat generic and DNA fallthrough", () => {
  assert.equal(resolveRnaPresentation("show B-DNA"), undefined);
  assert.equal(resolveRnaPresentation("show an RNA hairpin")?.owner, rnaPresentationOwners.secondaryStructure);
  assert.equal(resolveRnaPresentation("show a tRNA")?.owner, rnaPresentationOwners.typesFunctions);
  assert.equal(resolveRnaPresentation("show the 2 prime OH in RNA")?.owner, rnaPresentationOwners.localChemistry);
  assert.equal(resolveRnaPresentation("show a phosphodiester bond in RNA")?.owner, rnaPresentationOwners.localChemistry);
  assert.equal(resolveRnaPresentation("show RNA being cleaved")?.owner, rnaPresentationOwners.degradationStability);
  assert.equal(resolveRnaPresentation("show the structure of mRNA")?.owner, rnaPresentationOwners.typesFunctions);
  assert.equal(resolveRnaPresentation("show RNA")?.owner, rnaPresentationOwners.structure);
  assert.equal(resolveRnaPresentation("show RNA emerging from transcription")?.owner, rnaPresentationOwners.nascentTranscript);
});

test("routing an already resolved spec does not recurse through prompt ownership", () => {
  const route = resolveRnaPresentation("show an RNA hairpin")!;
  const rerouted = routeRnaPresentation(route.sourceSpec);
  assert.deepEqual({ family: rerouted.family, owner: rerouted.owner, camera: rerouted.cameraIntent }, { family: route.family, owner: route.owner, camera: route.cameraIntent });
});
