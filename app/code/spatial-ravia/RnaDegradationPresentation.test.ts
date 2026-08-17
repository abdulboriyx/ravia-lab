import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { createRnaDegradationSpec, deriveRnaDegradationPresentation, isValidRnaDegradationPresentation, rnaCleavagePresentation, rnaStabilityComparison, rnaTerminalDegradationPresentation } from "./RnaDegradationPresentation.ts";
import { resolveRnaPresentation, rnaPresentationOwners } from "./RnaPresentationRouter.ts";

function spec(prompt: string) {
  const resolved = resolveRnaIntent(prompt);
  assert.ok(resolved, prompt);
  return resolved.spec;
}

test("exonuclease prompt resolves to the degradation owner and terminal mode", () => {
  const route = resolveRnaPresentation("show exonuclease degradation of RNA");
  assert.ok(route);
  assert.equal(route.family, "degradationStability");
  assert.equal(route.owner, rnaPresentationOwners.degradationStability);
  const presentation = route.presentation;
  assert.equal("spec" in presentation, true);
  if ("spec" in presentation) {
    assert.equal(presentation.spec.mode, "exonucleolytic");
    assert.equal(presentation.spec.phase, "partiallyDegraded");
    assert.ok(presentation.spec.direction);
    assert.ok("exposedEnds" in presentation);
    if ("exposedEnds" in presentation) assert.ok(presentation.exposedEnds.some((end) => end.reason === "shortening-generated"));
  }
});

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
  assert.equal(targeted[0].authoritativeBridgeId, "rna-nucleotide-7-rna-nucleotide-8-phosphodiester");
  assert.equal(presentation.fragments.length, 2);
  assert.ok(presentation.fragments.every((fragment) => fragment.continuous));
  assert.equal(presentation.state, "internallyCleaved");
  assert.equal(presentation.displayFragments.length, 2);
  assert.ok(presentation.cleavageCue && presentation.cleavageCue.gapWidth > 0);
  assert.notDeepEqual(presentation.displayFragments[0].samples.at(-1)?.backbone, presentation.displayFragments[1].samples[0]?.backbone);
  const displayedSourceIndices = presentation.displayFragments.flatMap((fragment) => fragment.sourceIndices);
  assert.equal(displayedSourceIndices.includes(targeted[0].leftIndex) && displayedSourceIndices.includes(targeted[0].rightIndex), true);
  assert.equal(isValidRnaDegradationPresentation(presentation), true);
});

test("partial degradation cuts the RNA backbone once and retains two continuous pieces", () => {
  const presentation = deriveRnaDegradationPresentation(spec("show RNA degradation"), { phase: "partiallyDegraded", mode: "genericConceptual", cleavageIndex: 5 });
  assert.equal(presentation.backboneLinks.filter((link) => link.state === "absent").length, 1);
  assert.deepEqual(presentation.fragments.map((fragment) => fragment.indices), [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]]);
  assert.equal(isValidRnaDegradationPresentation(presentation), true);
});

test("5-prime exonucleolytic shortening starts at the 5-prime terminus", () => {
  const presentation = rnaTerminalDegradationPresentation(spec("show exonuclease degradation of RNA"), "fivePrimeToThreePrime", { length: 12 });
  const retained = presentation.fragments.find((fragment) => fragment.retained)!;
  assert.equal(presentation.spec.mode, "exonucleolytic");
  assert.ok(retained.indices[0] > 0);
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-five-prime-end")?.index, retained.indices[0]);
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-five-prime-end")?.reason, "shortening-generated");
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-three-prime-end")?.reason, "native");
  assert.equal(retained.continuous, true);
  assert.equal(presentation.state, "terminallyDegraded");
  assert.deepEqual(presentation.terminalShortening?.removedTerminus, "5prime");
  assert.equal(presentation.displayFragments.find((fragment) => fragment.retained)?.samples.length, retained.indices.length);
});

test("3-prime exonucleolytic shortening starts at the 3-prime terminus", () => {
  const presentation = rnaTerminalDegradationPresentation(spec("show exonuclease degradation of RNA"), "threePrimeToFivePrime", { length: 12 });
  const retained = presentation.fragments.find((fragment) => fragment.retained)!;
  assert.equal(retained.indices[retained.indices.length - 1] < 11, true);
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-three-prime-end")?.index, retained.indices[retained.indices.length - 1]);
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-three-prime-end")?.reason, "shortening-generated");
  assert.equal(presentation.exposedEnds.find((end) => end.id === "retained-five-prime-end")?.reason, "native");
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
  assert.equal(presentation.localChemistry?.phosphodiesterBridges[0]?.state, "breaking");
  assert.ok(presentation.localChemistry?.comparison);
  assert.deepEqual(presentation.labels.map((label) => label.text), ["RNA 2′-OH → greater backbone susceptibility", "DNA: no 2′-OH"]);
  assert.ok(presentation.highlightedGroups.includes("rnaTwoPrimeHydroxyl"));
  assert.ok(presentation.highlightedGroups.includes("dnaTwoPrimePosition"));
  assert.ok(presentation.highlightedGroups.includes("adjacentPhosphodiester"));
});

test("RNA-DNA stability comparison preserves comparable local chemistry scale", () => {
  const presentation = deriveRnaDegradationPresentation(spec("why is RNA less chemically stable than DNA"), { mode: "chemicalHydrolysis", phase: "cleavageReady" });
  assert.equal(presentation.stabilityComparison?.sameScale, true);
  assert.equal(presentation.stabilityComparison?.localChemistry.sameScale, true);
  assert.equal(presentation.stabilityComparison?.localChemistry.rna.sugar, "ribose");
  assert.equal(presentation.stabilityComparison?.localChemistry.dna.sugar, "deoxyribose");
  assert.equal(presentation.displayFragments.length, 1);
  assert.ok(presentation.localChemistry?.atoms.some((atom) => atom.role === "twoPrimeHydroxyl"));
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
