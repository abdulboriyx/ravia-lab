import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { createRnaDnaLocalComparison, createRnaLocalChemistryPresentation, isValidRnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";

const intent = (prompt: string) => resolveRnaIntent(prompt)!.spec;

test("RNA local nucleotide contains ribose, explicit 2′-OH, and canonical uracil", () => {
  const plan = createRnaLocalChemistryPresentation(intent("show the 2 prime OH in RNA"), { mode: "ribose", base: "U" });
  assert.ok(isValidRnaLocalChemistryPresentation(plan));
  assert.ok(plan.atoms.some((atom) => atom.role === "twoPrimeHydroxyl"));
  assert.ok(plan.anchors.some((anchor) => anchor.position === "2-prime" && anchor.attachedTo.endsWith("o2-prime")));
  assert.ok(plan.labels.some((label) => label.text === "2′-OH"));
  assert.ok(plan.labels.some((label) => label.text === "Uracil"));
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
  assert.equal(plan.sameStrand, true);
});

test("RNA local comparison preserves ribose/2′-OH/U versus deoxyribose/no-2′-OH/T", () => {
  const comparison = createRnaDnaLocalComparison("U", "T");
  assert.equal(comparison.sameScale, true);
  assert.equal(comparison.rna.sugar, "ribose");
  assert.equal(comparison.rna.hasTwoPrimeHydroxyl, true);
  assert.equal(comparison.dna.sugar, "deoxyribose");
  assert.equal(comparison.dna.hasTwoPrimeHydroxyl, false);
  assert.equal(comparison.rna.base, "U");
  assert.equal(comparison.dna.base, "T");
});

test("local RNA chemistry presentation is deterministic and uses local scale", () => {
  const spec = intent("show the RNA sugar phosphate backbone");
  const first = createRnaLocalChemistryPresentation(spec, { mode: "backbone", base: "A" });
  const second = createRnaLocalChemistryPresentation(spec, { mode: "backbone", base: "A" });
  assert.deepEqual(first, second);
  assert.equal(first.localScale, "local-chemistry");
  assert.ok(first.highlightedGroups.includes("phosphodiesterLinkage"));
});
