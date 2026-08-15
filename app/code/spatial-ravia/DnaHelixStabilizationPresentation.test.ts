import assert from "node:assert/strict";
import test from "node:test";
import {
  createDnaHelixStabilizationSpec,
  deriveDnaHelixStabilizationPresentation,
  helixStabilizationInteractions,
  helixStabilizationSelections,
} from "./DnaHelixStabilizationPresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { dnaVisualSystem } from "./DnaVisualSystem.ts";
import { resolveDnaMechanismIntent } from "./dna-mechanism-intent.ts";

test("stacking selects adjacent bases on one strand", () => {
  const selections = helixStabilizationSelections("localStacking");
  const first = selections.find((selection) => selection.id === "stacked-base-1");
  const second = selections.find((selection) => selection.id === "stacked-base-2");
  assert.equal(first?.kind, "base");
  assert.equal(second?.kind, "base");
  assert.equal(first?.strand, "A");
  assert.equal(second?.strand, "A");
  assert.equal(first?.role, "neighbor");
  assert.equal(second?.role, "neighbor");
});

test("stacking is typed as base-stacking, not covalent chemistry", () => {
  const stacking = helixStabilizationInteractions("localStacking");
  assert.equal(stacking.length, 1);
  assert.equal(stacking[0].type, "baseStacking");
  assert.equal(stacking[0].role, "stacking");
  assert.notEqual(stacking[0].type, "covalent");
  assert.notEqual(stacking[0].type, "phosphodiester");
});

test("groove locations are deterministic spaces between canonical backbones", () => {
  const first = deriveDnaHelixStabilizationPresentation(buildDnaMechanismRepresentationPlan(createDnaHelixStabilizationSpec("grooveFocus")));
  const second = deriveDnaHelixStabilizationPresentation(buildDnaMechanismRepresentationPlan(createDnaHelixStabilizationSpec("grooveFocus")));
  assert.deepEqual(first.grooves, second.grooves);
  assert.deepEqual(first.grooves.map((groove) => groove.id), ["major-groove", "minor-groove"]);
  assert.ok(first.grooves.every((groove) => groove.betweenBackbones && groove.derivedFrom === "canonical-b-dna-backbone-phase"));
  assert.notDeepEqual(first.grooves[0].center, first.grooves[1].center);
});

test("canonical geometry places bases inward from the backbone", () => {
  const presentation = deriveDnaHelixStabilizationPresentation(buildDnaMechanismRepresentationPlan(createDnaHelixStabilizationSpec()));
  assert.ok(presentation.basesInterior.baseRadialDistance < presentation.basesInterior.backboneRadialDistance);
  assert.equal(presentation.basesInterior.relation, "bases-inward-backbone-outward");
});

test("hydrogen-bond and stacking comparison keeps typed interactions distinct", () => {
  const plan = buildDnaMechanismRepresentationPlan(createDnaHelixStabilizationSpec("forceComparison"));
  const presentation = deriveDnaHelixStabilizationPresentation(plan);
  assert.ok(presentation.forceComparison);
  assert.equal(presentation.forceComparison?.hydrogenBondsActAcrossComplementaryBases, true);
  assert.equal(presentation.forceComparison?.stackingActsBetweenAdjacentSameStrandBases, true);
  assert.notDeepEqual(presentation.forceComparison?.hydrogenBondInteractionIds, presentation.forceComparison?.stackingInteractionIds);
  assert.equal(plan.interactionDisplay.showHydrogenBonds, true);
});

test("width explanation reuses canonical geometry without changing it", () => {
  const before = dnaVisualSystem.geometry.basePairWidthAngstrom;
  const presentation = deriveDnaHelixStabilizationPresentation(buildDnaMechanismRepresentationPlan(createDnaHelixStabilizationSpec("duplexOverview")));
  assert.equal(presentation.widthExplanation.basePairWidthAngstrom, before);
  assert.equal(presentation.widthExplanation.purinePyrimidineFit, "approximately-consistent");
  assert.equal(dnaVisualSystem.geometry.basePairWidthAngstrom, before);
  assert.equal(presentation.camera.basePairCount, dnaVisualSystem.geometry.canonicalDuplexBasePairCount);
});

test("helix stabilization prompt resolution uses the reusable selections", () => {
  const resolved = resolveDnaMechanismIntent("show base stacking in DNA");
  assert.equal(resolved?.family, "helixStabilization");
  assert.ok(resolved?.spec.molecularSelections.some((selection) => selection.id === "stacked-base-1" && selection.strand === "A"));
  assert.equal(resolved?.spec.interactions.find((interaction) => interaction.id === "base-stacking-contact")?.type, "baseStacking");
});
