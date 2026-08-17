import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { createRnaDnaLocalComparison, createRnaLocalChemistryPresentation, isValidRnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";

const intent = (prompt: string) => resolveRnaIntent(prompt)!.spec;

test("RNA local nucleotide contains ribose and an explicitly focused 2′-OH", () => {
  const plan = createRnaLocalChemistryPresentation(intent("show the 2 prime OH in RNA"), { mode: "ribose", base: "U" });
  assert.ok(isValidRnaLocalChemistryPresentation(plan));
  assert.ok(plan.atoms.some((atom) => atom.role === "twoPrimeHydroxyl"));
  assert.ok(plan.anchors.some((anchor) => anchor.position === "2-prime" && anchor.attachedTo.endsWith("o2-prime")));
  assert.ok(plan.labels.some((label) => label.text === "2′-OH"));
  assert.deepEqual(plan.labels.map((label) => label.text), ["2′-OH"]);
  assert.equal(plan.focus, "twoPrimeOH");
});

test("local RNA nucleotide detail exposes a compact base ring attached through 1′", () => {
  const plan = createRnaLocalChemistryPresentation(intent("show uracil in RNA"), { mode: "nucleotide", base: "U" });
  const ring = plan.atoms.filter((atom) => atom.label === "U ring");
  assert.equal(ring.length, 6);
  assert.ok(plan.bonds.some((bond) => bond.id.endsWith("base-ring-attachment") && bond.from.endsWith("c1-prime")));
  assert.ok(ring.every((atom) => atom.residue === "U" && atom.position.every(Number.isFinite)));
});

test("ribose exposes anchored 1′, 2′, 3′, 4′, and 5′ positions", () => {
  const plan = createRnaLocalChemistryPresentation(intent("show ribose in RNA"), { mode: "ribose" });
  assert.deepEqual(plan.anchors.map((anchor) => anchor.position), ["1-prime", "2-prime", "3-prime", "4-prime", "5-prime"]);
  assert.ok(plan.anchors.every((anchor) => plan.atoms.some((atom) => atom.id === anchor.attachedTo)));
});

test("RNA phosphodiester bridge connects adjacent same-strand ribose units", () => {
  const plan = createRnaLocalChemistryPresentation(intent("show a phosphodiester bond in RNA"), { mode: "adjacentNucleotides" });
  assert.equal(plan.phosphodiesterBridges.length, 1);
  const bridge = plan.phosphodiesterBridges[0];
  assert.equal(bridge.type, "phosphodiester");
  assert.equal(bridge.fromNucleotideId, "rna-nucleotide-1");
  assert.equal(bridge.toNucleotideId, "rna-nucleotide-2");
  assert.ok(plan.bonds.some((bond) => bond.id === bridge.id && bond.type === "phosphodiester"));
  assert.deepEqual(bridge.primaryPath, [bridge.threePrimeSide, bridge.phosphateId, bridge.fivePrimeSide]);
  assert.equal(plan.bonds.filter((bond) => bond.type === "phosphodiester").length, 2);
  assert.equal(plan.sameStrand, true);
});

test("RNA/DNA local comparison uses matched bases and a normalized side-by-side layout", () => {
  const comparison = createRnaDnaLocalComparison("A");
  assert.equal(comparison.sameScale, true);
  assert.deepEqual(comparison.layout, {
    mode: "side-by-side",
    orientation: "matched",
    scale: "matched",
    left: { identity: "RNA nucleotide", translation: [-1.6, 0, 0] },
    right: { identity: "DNA nucleotide", translation: [1.6, 0, 0] },
    usefulViewportOccupancy: [0.45, 0.65],
    overlap: false,
  });
  assert.equal(comparison.rna.sugar, "ribose");
  assert.equal(comparison.rna.hasTwoPrimeHydroxyl, true);
  assert.equal(comparison.dna.sugar, "deoxyribose");
  assert.equal(comparison.dna.hasTwoPrimeHydroxyl, false);
  assert.equal(comparison.rna.base, "A");
  assert.equal(comparison.dna.base, "A");
  assert.equal(comparison.baseComparison, "matched-base");
  assert.deepEqual(comparison.labels, ["RNA nucleotide", "DNA nucleotide", "2′-OH", "no 2′-OH"]);
  assert.deepEqual(comparison.distinctions, ["RNA has 2′-OH", "DNA lacks 2′-OH"]);
});

test("uracil/thymine is secondary and opt-in to the nucleotide comparison", () => {
  const comparison = createRnaDnaLocalComparison("U");
  assert.equal(comparison.baseComparison, "uracil-thymine");
  assert.equal(comparison.dna.base, "T");
  assert.ok(comparison.distinctions.includes("RNA uses uracil where DNA uses thymine"));
});

test("comparison prompt defaults to a matched base so the 2′ sugar difference is primary", () => {
  const plan = createRnaLocalChemistryPresentation(intent("compare a DNA nucleotide and an RNA nucleotide"));
  assert.equal(plan.mode, "comparison");
  assert.equal(plan.comparison?.baseComparison, "matched-base");
  assert.equal(plan.comparison?.rna.base, plan.comparison?.dna.base);
  assert.ok(isValidRnaLocalChemistryPresentation(plan));
});

test("local RNA chemistry presentation is deterministic and uses local scale", () => {
  const spec = intent("show the RNA sugar phosphate backbone");
  const first = createRnaLocalChemistryPresentation(spec, { mode: "backbone", base: "A" });
  const second = createRnaLocalChemistryPresentation(spec, { mode: "backbone", base: "A" });
  assert.deepEqual(first, second);
  assert.equal(first.localScale, "local-chemistry");
  assert.ok(first.highlightedGroups.includes("phosphodiesterLinkage"));
});

test("local chemistry focus filters labels and preserves requested primary anchors", () => {
  const twoPrime = createRnaLocalChemistryPresentation(intent("show the 2 prime OH in RNA"), { mode: "ribose", focus: "twoPrimeOH" });
  assert.equal(twoPrime.labels.filter((label) => label.text === "2′-OH").length, 1);
  assert.equal(twoPrime.labels.some((label) => label.text === "Phosphodiester linkage"), false);
  assert.equal(twoPrime.labels.some((label) => label.text.includes("5′") || label.text.includes("3′")), false);
  assert.deepEqual(twoPrime.highlightedGroups, ["ribose", "twoPrimeHydroxyl"]);

  const ribose = createRnaLocalChemistryPresentation(intent("show ribose in RNA"), { mode: "ribose", focus: "ribose" });
  assert.deepEqual(ribose.labels.map((label) => label.text), ["Ribose"]);

  const linkage = createRnaLocalChemistryPresentation(intent("show a phosphodiester bond in RNA"), { mode: "adjacentNucleotides", focus: "phosphodiesterLinkage" });
  assert.ok(linkage.labels.some((label) => label.text === "Phosphodiester linkage"));
  assert.deepEqual(linkage.labels.map((label) => label.text), ["Phosphodiester linkage"]);
  assert.equal(linkage.labels.some((label) => label.text === "2′-OH"), false);

  const uracil = createRnaLocalChemistryPresentation(intent("show uracil in RNA"), { mode: "ribose", focus: "uracil", base: "U" });
  assert.deepEqual(uracil.labels.map((label) => label.text), ["Uracil"]);
});
