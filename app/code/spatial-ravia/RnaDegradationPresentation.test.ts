import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { createRnaDegradationSpec, deriveRnaDegradationPresentation, isValidRnaDegradationPresentation, rnaCleavagePresentation, rnaStabilityComparison, rnaTerminalDegradationPresentation } from "./RnaDegradationPresentation.ts";

function spec(prompt: string) {
  const resolved = resolveRnaIntent(prompt);
  assert.ok(resolved, prompt);
  return resolved.spec;
}

test("intact RNA has a continuous phosphodiester backbone", () => {
  const degradation = createRnaDegradationSpec({ phase: "intact", mode: "genericConceptual", length: 10 });
  const presentation = deriveRnaDegradationPresentation(degradation);
  assert.equal(presentation.backboneLinks.length, 9);
  assert.ok(presentation.backboneLinks.every((link) => link.state === "present" && !link.targeted));
  assert.equal(presentation.fragments.length, 1);
  assert.equal(presentation.fragments[0].continuous, true);
});

test("endonucleolytic cleavage removes only the targeted phosphodiester linkage", () => {
  const presentation = rnaCleavagePresentation(spec("show RNA being cleaved"), { cleavageIndex: 6 });
  const targeted = presentation.backboneLinks.filter((link) => link.targeted);
  assert.equal(targeted.length, 1);
  assert.equal(targeted[0].state, "absent");
  assert.equal(targeted[0].leftIndex, 6);
  assert.equal(presentation.fragments.length, 2);
  assert.ok(presentation.fragments.every((fragment) => fragment.continuous));
  assert.equal(isValidRnaDegradationPresentation(presentation), true);
});

test("5-prime exonucleolytic shortening starts at the 5-prime terminus", () => {
  const presentation = rnaTerminalDegradationPresentation(spec("show exonuclease degradation of RNA"), "fivePrimeToThreePrime", { length: 12 });
  const retained = presentation.fragments.find((fragment) => fragment.retained)!;
  assert.equal(presentation.spec.mode, "exonucleolytic");
  assert.ok(retained.indices[0] > 0);
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-five-prime-end")?.index, retained.indices[0]);
  assert.equal(retained.continuous, true);
});

test("3-prime exonucleolytic shortening starts at the 3-prime terminus", () => {
  const presentation = rnaTerminalDegradationPresentation(spec("show exonuclease degradation of RNA"), "threePrimeToFivePrime", { length: 12 });
  const retained = presentation.fragments.find((fragment) => fragment.retained)!;
  assert.equal(retained.indices[retained.indices.length - 1] < 11, true);
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-three-prime-end")?.index, retained.indices[retained.indices.length - 1]);
  assert.equal(presentation.backboneLinks.filter((link) => link.state === "present").every((link) => retained.indices.includes(link.leftIndex) && retained.indices.includes(link.rightIndex)), true);
});

test("RNA instability highlights 2-prime OH and an adjacent phosphodiester context", () => {
  const presentation = rnaStabilityComparison();
  assert.equal(presentation.spec.phase, "cleavageReady");
  assert.ok(presentation.highlightedGroups.includes("twoPrimeHydroxyl"));
  assert.ok(presentation.highlightedGroups.includes("susceptiblePhosphodiester"));
  assert.ok(presentation.localChemistry);
  assert.equal(presentation.stabilityComparison?.rna.twoPrimeHydroxyl, "present");
  assert.equal(presentation.stabilityComparison?.dna.twoPrimeHydroxyl, "absent");
});

test("RNA-DNA stability comparison preserves comparable local chemistry scale", () => {
  const presentation = deriveRnaDegradationPresentation(spec("why is RNA less chemically stable than DNA"), { mode: "chemicalHydrolysis", phase: "cleavageReady" });
  assert.equal(presentation.stabilityComparison?.sameScale, true);
  assert.equal(presentation.stabilityComparison?.localChemistry.sameScale, true);
  assert.equal(presentation.stabilityComparison?.localChemistry.rna.sugar, "ribose");
  assert.equal(presentation.stabilityComparison?.localChemistry.dna.sugar, "deoxyribose");
});

test("structured RNA context is retained away from a local cleavage site", () => {
  const presentation = rnaCleavagePresentation(spec("show an RNA hairpin"), { cleavageIndex: 4 });
  assert.ok(presentation.secondaryTopology);
  assert.equal(presentation.secondaryTopology?.motif, "hairpin");
  assert.equal(presentation.spec.structuredContext, true);
  assert.equal(presentation.noDegradationMachinery, true);
});

test("degradation presentations are deterministic and do not add machinery", () => {
  const scene = spec("show a partially degraded RNA molecule");
  const first = deriveRnaDegradationPresentation(scene, { phase: "partiallyDegraded", mode: "genericConceptual" });
  const second = deriveRnaDegradationPresentation(scene, { phase: "partiallyDegraded", mode: "genericConceptual" });
  assert.deepEqual(first, second);
  assert.equal(first.noDegradationMachinery, true);
  assert.equal(isValidRnaDegradationPresentation(first), true);
});
