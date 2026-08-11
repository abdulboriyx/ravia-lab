import assert from "node:assert/strict";
import test from "node:test";
import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { actionPotentialScene } from "./biology-scene-builders.ts";
import { validateBiologySceneConsistency } from "./biology-scene-validator.ts";
import { detectBiologyContext } from "./biology-context.ts";
import { resolveSpatialPlacements } from "./biology-spatial-resolver.ts";

function supportedScene(prompt: string) {
  const result = parseBiologyScenePrompt(prompt);
  assert.equal(result.status, "supported", prompt);
  assert.equal(result.status, "supported");
  return result.scene;
}

function hasEntity(scene: ReturnType<typeof supportedScene>, id: string) {
  assert.ok(scene.entities.some((entity) => entity.id === id), id);
}

function hasRelation(
  scene: ReturnType<typeof supportedScene>,
  subject: string,
  relation: string,
  object: string
) {
  assert.ok(
    scene.relations.some(
      (candidate) =>
        candidate.subject === subject &&
        candidate.relation === relation &&
        candidate.object === object
    ),
    `${subject} ${relation} ${object}`
  );
}

test("action-potential prompts produce temporal membrane scenes", () => {
  for (const prompt of [
    "show how an action potential works",
    "show a neuronal spike",
    "show the nerve impulse locally",
  ]) {
    const scene = supportedScene(prompt);

    hasEntity(scene, "plasma-membrane");
    hasEntity(scene, "voltage-gated-sodium-channel");
    hasEntity(scene, "voltage-gated-potassium-channel");
    hasEntity(scene, "membrane-potential");
    assert.equal(scene.renderMode, "mechanistic-3d");
    assert.deepEqual(
      scene.temporal?.phases.map((phase) => phase.id),
      [
        "rest",
        "threshold",
        "depolarization",
        "peak",
        "repolarization",
        "hyperpolarization",
        "recovery",
      ]
    );
  }
});

test("resting threshold and recovery phases encode channel states", () => {
  const resting = supportedScene("show the resting membrane before an action potential");
  assert.equal(resting.temporal?.currentPhase, "rest");
  assert.equal(
    resting.temporal?.phases[0].states["voltage-gated-sodium-channel"],
    "closed-available"
  );

  const threshold = supportedScene("show what happens at threshold");
  assert.equal(threshold.temporal?.currentPhase, "threshold");
  assert.equal(
    threshold.temporal?.phases[1].states["voltage-gated-sodium-channel"],
    "opening"
  );

  const recovery = supportedScene("show recovery after an action potential");
  assert.equal(recovery.temporal?.currentPhase, "recovery");
});

test("depolarization peak repolarization and hyperpolarization are phase-correct", () => {
  const depolarization = supportedScene("show sodium entering during depolarization");
  assert.equal(depolarization.temporal?.currentPhase, "depolarization");
  hasRelation(depolarization, "sodium-current", "flows_into", "cytoplasm");

  const peak = supportedScene("show what happens at the peak of an action potential");
  assert.equal(peak.temporal?.currentPhase, "peak");
  const peakPhase = peak.temporal?.phases.find((phase) => phase.id === "peak");
  assert.equal(peakPhase?.states["voltage-gated-sodium-channel"], "inactivated");

  const repolarization = supportedScene("show potassium leaving during repolarization");
  assert.equal(repolarization.temporal?.currentPhase, "repolarization");
  hasRelation(repolarization, "potassium-current", "flows_out_to", "extracellular-space");

  const hyperpolarization = supportedScene("show hyperpolarization");
  assert.equal(hyperpolarization.temporal?.currentPhase, "hyperpolarization");
  const hyperpolarized = hyperpolarization.temporal?.phases.find(
    (phase) => phase.id === "hyperpolarization"
  );
  assert.equal(
    hyperpolarized?.states["voltage-gated-potassium-channel"],
    "still-open-closing"
  );
});

test("ion gradients and flux directions are represented explicitly", () => {
  const scene = supportedScene("show the sodium and potassium gradients during an action potential");

  hasRelation(scene, "sodium-ion", "higher_concentration_in", "extracellular-space");
  hasRelation(scene, "potassium-ion", "higher_concentration_in", "cytoplasm");
  hasRelation(scene, "sodium-current", "flows_into", "cytoplasm");
  hasRelation(scene, "potassium-current", "flows_out_to", "extracellular-space");
});

test("positive feedback and refractory prompts remain mechanistic but not quantitative", () => {
  const feedback = supportedScene("show why depolarization accelerates");
  hasEntity(feedback, "positive-feedback");
  hasRelation(feedback, "positive-feedback", "amplifies", "sodium-current");

  const refractory = supportedScene("show why the neuron cannot immediately fire again");
  hasEntity(refractory, "refractory-period");
  hasRelation(refractory, "refractory-period", "caused_by", "voltage-gated-sodium-channel");
});

test("action-potential spatial resolver reuses membrane topology", () => {
  const scene = actionPotentialScene("depolarization");
  const placements = resolveSpatialPlacements(scene);
  const sodium = placements.find((placement) => placement.entityId === "sodium-ion");
  const potassium = placements.find((placement) => placement.entityId === "potassium-ion");
  const sodiumChannel = placements.find(
    (placement) => placement.entityId === "voltage-gated-sodium-channel"
  );

  assert.ok(sodium && sodium.position.y > 0);
  assert.ok(potassium && potassium.position.y < 0);
  assert.ok(sodiumChannel && Math.abs(sodiumChannel.position.y) < 0.1);
});

test("validator rejects incorrect action-potential gradients and phase states", () => {
  const invalidGradient = actionPotentialScene("full");
  invalidGradient.relations = invalidGradient.relations.filter(
    (relation) => relation.subject !== "sodium-ion"
  );
  invalidGradient.relations.push({
    subject: "sodium-ion",
    relation: "higher_concentration_in",
    object: "cytoplasm",
  });
  assert.equal(
    validateBiologySceneConsistency(invalidGradient, detectBiologyContext("")).ok,
    false
  );

  const invalidPhase = actionPotentialScene("full");
  const peak = invalidPhase.temporal?.phases.find((phase) => phase.id === "peak");
  if (peak) {
    peak.states["voltage-gated-sodium-channel"] = "open";
  }
  assert.equal(
    validateBiologySceneConsistency(invalidPhase, detectBiologyContext("")).ok,
    false
  );
});

test("five-domain prompts remain disambiguated", () => {
  const ap = supportedScene("show sodium entering through a voltage-gated channel");
  hasEntity(ap, "voltage-gated-sodium-channel");

  const signaling = supportedScene("show ligand activating receptor tyrosine kinase");
  hasEntity(signaling, "receptor-tyrosine-kinase");
  assert.ok(!signaling.entities.some((entity) => entity.id === "voltage-gated-sodium-channel"));

  const translation = supportedScene("show protein synthesis");
  hasEntity(translation, "ribosome");

  const transcription = supportedScene("show RNA polymerase transcribing DNA");
  hasEntity(transcription, "rna-transcript");

  const replication = supportedScene("show DNA polymerase copying DNA");
  hasEntity(replication, "polymerase");
});

test("ambiguous ion and voltage prompts remain unsupported", () => {
  for (const prompt of ["show sodium", "show electricity in a cell", "make the neuron fire somehow"]) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "unsupported", prompt);
  }
});
