import assert from "node:assert/strict";
import test from "node:test";
import {
  createDnaStrandSeparationSpec,
  deriveDnaStrandSeparationPresentation,
  separationStateForPrompt,
  strandSeparationInteractions,
  strandSeparationSelections,
} from "./DnaStrandSeparationPresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { resolveDnaMechanismIntent } from "./dna-mechanism-intent.ts";
import { dnaVisualSystem } from "./DnaVisualSystem.ts";

test("hydrogen bonds break while phosphodiester interactions remain present", () => {
  const plan = buildDnaMechanismRepresentationPlan(createDnaStrandSeparationSpec({ pair: "G-C", state: "opening" }));
  const presentation = deriveDnaStrandSeparationPresentation(plan);
  assert.equal(presentation.basePairPresentation.pair, "G-C");
  assert.equal(presentation.basePairPresentation.hydrogenBondPaths.length, 3);
  assert.ok(presentation.basePairPresentation.hydrogenBondPaths.every((path) => path.state === "breaking"));
  assert.ok(presentation.phosphodiesterInteractionIds.length > 0);
  assert.equal(presentation.backbonePreserved, true);
  assert.ok(plan.sourceSpec.interactions.filter((item) => item.type === "phosphodiester").every((item) => item.state === "present"));
});

test("separated state preserves strand connectivity and local polarity", () => {
  const plan = buildDnaMechanismRepresentationPlan(createDnaStrandSeparationSpec({ pair: "A-T", state: "separated" }));
  const presentation = deriveDnaStrandSeparationPresentation(plan);
  assert.equal(presentation.state, "separated");
  assert.equal(presentation.basePairPresentation.hydrogenBondPaths.length, 2);
  assert.ok(presentation.basePairPresentation.hydrogenBondPaths.every((path) => path.state === "absent"));
  assert.equal(presentation.strandConnectivityPreserved, true);
  assert.equal(presentation.polarityPreserved, true);
  assert.equal(presentation.visualState.topology, "locally-open");
});

test("reannealing restores complementary pairing toward canonical duplex state", () => {
  const plan = buildDnaMechanismRepresentationPlan(createDnaStrandSeparationSpec({ pair: "A-T", state: "reannealing" }));
  const presentation = deriveDnaStrandSeparationPresentation(plan);
  assert.equal(presentation.state, "reannealing");
  assert.equal(presentation.basePairPresentation.pair, "A-T");
  assert.ok(presentation.basePairPresentation.hydrogenBondPaths.every((path) => path.state === "forming"));
  assert.equal(presentation.canonicalPairingTarget, "pairedDuplex");
  assert.equal(presentation.canonicalDuplexRestoredLocally, true);
  assert.ok(presentation.localOpeningBasePairs < 4);
});

test("local deformation is bounded by canonical opening limits", () => {
  for (const state of ["paired", "opening", "separated", "reannealing"] as const) {
    const presentation = deriveDnaStrandSeparationPresentation(buildDnaMechanismRepresentationPlan(createDnaStrandSeparationSpec({ state })));
    assert.equal(presentation.boundedByMaximumOpenBasePairs, true);
    assert.ok(presentation.localOpeningBasePairs <= dnaVisualSystem.geometry.maximumOpenBasePairs);
    assert.ok(presentation.samples.every((sample) => Number.isFinite(sample.strandA[0]) && Number.isFinite(sample.strandB[0])));
  }
});

test("complementary identities remain explicit and no machinery enters the presentation", () => {
  const selections = strandSeparationSelections("G-C");
  assert.ok(selections.some((selection) => selection.id === "guanine" && selection.strand === "A"));
  assert.ok(selections.some((selection) => selection.id === "cytosine" && selection.strand === "B"));
  assert.ok(selections.every((selection) => !["polymerase", "helicase", "replication-fork", "transcription-complex"].includes(selection.id)));
  const interactions = strandSeparationInteractions("G-C", "separated");
  assert.ok(interactions.filter((item) => item.type === "baseStacking").every((item) => item.state === "absent"));
  assert.ok(interactions.filter((item) => item.type === "phosphodiester").every((item) => item.state === "present"));
});

test("reaction states preserve participant identities", () => {
  const spec = createDnaStrandSeparationSpec({ state: "opening" });
  const hydrogenIds = spec.interactions.filter((item) => item.type === "hydrogenBond").map((item) => item.id);
  assert.deepEqual(spec.reaction?.steps.map((step) => step.id), ["before", "transition", "after"]);
  for (const step of spec.reaction?.steps ?? []) assert.deepEqual(step.interactionStates.map(({ id }) => id).filter((id) => hydrogenIds.includes(id)), hydrogenIds);
  assert.deepEqual(spec.interactions.filter((item) => item.type === "phosphodiester").map((item) => item.participants), [["backbone-a", "strand-a"], ["backbone-b", "strand-b"]]);
});

test("separation prompt resolution selects the reusable presentation substrate", () => {
  assert.equal(separationStateForPrompt("show DNA reannealing"), "reannealing");
  const resolved = resolveDnaMechanismIntent("what breaks when DNA strands separate");
  assert.equal(resolved?.family, "strandSeparation");
  assert.ok(resolved?.spec.molecularSelections.some((selection) => selection.id === "backbone-a"));
  assert.ok(resolved?.spec.interactions.some((interaction) => interaction.type === "phosphodiester" && interaction.state === "present"));
});
