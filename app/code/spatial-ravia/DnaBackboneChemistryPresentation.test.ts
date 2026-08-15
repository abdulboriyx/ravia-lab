import assert from "node:assert/strict";
import test from "node:test";
import {
  backboneChemistryInteractions,
  backboneChemistrySelections,
  createDnaBackboneChemistrySpec,
  deriveDnaBackboneChemistryPresentation,
} from "./DnaBackboneChemistryPresentation.ts";
import { getDnaLocalChemistryPlan, isValidDnaLocalChemistryPlan } from "./DnaLocalChemistryRepresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";

test("adjacent backbone nucleotide selections are explicit and same-strand", () => {
  const selections = backboneChemistrySelections("adjacentNucleotides");
  assert.ok(selections.some((selection) => selection.id === "nucleotide-1"));
  assert.ok(selections.some((selection) => selection.id === "nucleotide-2"));
  assert.ok(selections.every((selection) => selection.strand === "A"));
});

test("phosphate bridges 3-prime and 5-prime sugar-side anchors", () => {
  const interaction = backboneChemistryInteractions("adjacentNucleotides").find((item) => item.type === "phosphodiester");
  assert.deepEqual(interaction?.participants, ["three-prime-1", "phosphate-bridge", "five-prime-2"]);
  assert.equal(interaction?.type, "phosphodiester");
  assert.notEqual(interaction?.type, "hydrogenBond");
  const presentation = deriveDnaBackboneChemistryPresentation(buildDnaMechanismRepresentationPlan(createDnaBackboneChemistrySpec()));
  assert.deepEqual(presentation.orderedBackbone, ["sugar-1", "phosphate-bridge", "sugar-2"]);
  assert.equal(presentation.phosphateBridges[0]?.threePrimeSide, "three-prime-1");
  assert.equal(presentation.phosphateBridges[0]?.fivePrimeSide, "five-prime-2");
});

test("1-prime, 3-prime, and 5-prime anchors resolve to distinct groups", () => {
  const plan = buildDnaMechanismRepresentationPlan(createDnaBackboneChemistrySpec());
  const anchors = deriveDnaBackboneChemistryPresentation(plan).anchors;
  assert.deepEqual(new Set(anchors.map((anchor) => anchor.position)), new Set(["1-prime", "3-prime", "5-prime"]));
  assert.ok(anchors.find((anchor) => anchor.position === "1-prime")?.attachedTo.startsWith("base-"));
  assert.ok(plan.molecularGroups.some((group) => group.kind === "onePrimeCarbon"));
  assert.ok(plan.molecularGroups.some((group) => group.kind === "threePrimeCarbon"));
  assert.ok(plan.molecularGroups.some((group) => group.kind === "fivePrimeCarbon"));
});

test("local backbone chemistry preserves ordered sugar-phosphate covalent structure", () => {
  const local = getDnaLocalChemistryPlan("backbone-linkage");
  assert.equal(isValidDnaLocalChemistryPlan(local), true);
  assert.equal(local.atoms.filter((atom) => atom.role === "sugar").length >= 2, true);
  assert.equal(local.atoms.filter((atom) => atom.role === "phosphate").length, 3);
  assert.equal(local.bonds.filter((bond) => bond.kind === "hydrogen").length, 0);
  assert.ok(local.bonds.some((bond) => bond.id === "bb-phosphate-o3"));
  assert.ok(local.bonds.some((bond) => bond.id === "bb-phosphate-next"));
  assert.ok(local.atoms.some((atom) => atom.anchor === "onePrimeCarbon"));
  assert.ok(local.atoms.some((atom) => atom.anchor === "threePrimeHydroxyl"));
  assert.ok(local.atoms.some((atom) => atom.anchor === "fivePrimePhosphate"));
});

test("reaction-ready states retain the same phosphodiester participants", () => {
  const states = ["before", "transition", "after"] as const;
  const spec = createDnaBackboneChemistrySpec({ state: "absent" });
  const interaction = spec.interactions.find((item) => item.type === "phosphodiester")!;
  assert.deepEqual(spec.reaction?.steps.map((step) => step.id), states);
  assert.deepEqual(spec.reaction?.steps.map((step) => step.interactionStates[0]?.id), [interaction.id, interaction.id, interaction.id]);
  assert.deepEqual(spec.reaction?.steps.map((step) => step.interactionStates[0]?.state), ["absent", "forming", "present"]);
  assert.deepEqual(interaction.participants, ["three-prime-1", "phosphate-bridge", "five-prime-2"]);
});

test("backbone representation plans are deterministic", () => {
  const spec = createDnaBackboneChemistrySpec();
  const first = buildDnaMechanismRepresentationPlan(spec);
  const second = buildDnaMechanismRepresentationPlan(spec);
  assert.deepEqual(first, second);
  assert.equal(first.interactionDisplay.showPhosphodiesterLinks, true);
  assert.equal(first.interactionDisplay.showHydrogenBonds, false);
  assert.equal(first.cameraIntent, "localChemistry");
});
