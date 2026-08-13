import assert from "node:assert/strict";
import test from "node:test";

import { detectBiologyContext } from "./biology-context.ts";
import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { chooseBiologyRenderer } from "./biology-renderer-router.ts";
import { transcriptionScene } from "./biology-scene-builders.ts";
import { validateBiologySceneConsistency } from "./biology-scene-validator.ts";
import { resolveSpatialPlacements } from "./biology-spatial-resolver.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";

function scene(prompt: string) {
  const result = parseBiologyScenePrompt(prompt);
  assert.equal(result.status, "supported", prompt);
  assert.equal(result.status, "supported");
  return result.scene;
}

function ids(sceneSpec: BiologySceneSpec) {
  return new Set(sceneSpec.entities.map((entity) => entity.id));
}

function assertEntities(sceneSpec: BiologySceneSpec, expected: string[]) {
  const actual = ids(sceneSpec);
  for (const entityId of expected) {
    assert.ok(actual.has(entityId), `${entityId} missing`);
  }
}

function assertAbsent(sceneSpec: BiologySceneSpec, forbidden: string[]) {
  const actual = ids(sceneSpec);
  for (const entityId of forbidden) {
    assert.equal(actual.has(entityId), false, `${entityId} should be absent`);
  }
}

function assertRelation(
  sceneSpec: BiologySceneSpec,
  subject: string,
  relation: string,
  object: string
) {
  assert.ok(
    sceneSpec.relations.some(
      (candidate) =>
        candidate.subject === subject &&
        candidate.relation === relation &&
        candidate.object === object
    ),
    `${subject}/${relation}/${object} missing`
  );
}

function assertAction(
  sceneSpec: BiologySceneSpec,
  actor: string,
  action: string,
  target?: string
) {
  assert.ok(
    sceneSpec.actions.some(
      (candidate) =>
        candidate.actor === actor &&
        candidate.action === action &&
        candidate.target === target
    ),
    `${actor}/${action}/${target ?? ""} missing`
  );
}

test("transcription mechanism paraphrases converge to RNA synthesis semantics", () => {
  for (const prompt of [
    "show RNA polymerase transcribing DNA",
    "show the enzyme making RNA from DNA",
    "show RNA synthesis from a DNA template",
    "show RNA polymerase transcribing a gene",
  ]) {
    const result = scene(prompt);
    assert.equal(chooseBiologyRenderer(result), "three");
    assertEntities(result, [
      "dna",
      "gene",
      "promoter",
      "rna-polymerase",
      "transcription-bubble",
      "rna-transcript",
    ]);
    assertAction(result, "rna-polymerase", "synthesizes", "rna-transcript");
    assertAction(result, "rna-polymerase", "locally_unwinds", "dna");
    assertRelation(result, "rna-transcript", "extends_from", "rna-polymerase");
  }
});

test("broad DNA to RNA transcription prompts use the canonical temporal mechanism", () => {
  const expectedPhases = ["initiation", "opening", "elongation", "termination"];

  for (const prompt of [
    "show DNA to RNA transcription",
    "show transcription from DNA to RNA",
    "show RNA being made from DNA",
    "show how DNA is transcribed into RNA",
    "visualize DNA information being copied into RNA",
    "show RNA polymerase transcribing DNA",
    "show RNA polymerase transcribing a gene",
    "show transcription elongation",
    "show transcription",
  ]) {
    const result = scene(prompt);
    assert.equal(chooseBiologyRenderer(result), "three");
    assertEntities(result, [
      "dna",
      "gene",
      "promoter",
      "rna-polymerase",
      "transcription-bubble",
      "rna-transcript",
    ]);
    assertAction(result, "rna-polymerase", "synthesizes", "rna-transcript");
    assertAction(result, "rna-polymerase", "locally_unwinds", "dna");
    assertRelation(result, "rna-polymerase", "positioned_at", "transcription-bubble");
    assert.deepEqual(
      result.temporal?.phases.map((phase) => phase.id),
      expectedPhases,
      `${prompt} should use the temporal transcription mechanism`
    );
  }
});

test("basic transcription prompts stay minimal", () => {
  const polymerase = scene("show RNA polymerase");
  assert.equal(polymerase.renderMode, "molecular-structure");
  assertEntities(polymerase, ["rna-polymerase"]);
  assertAbsent(polymerase, ["dna", "rna-transcript", "transcription-bubble"]);

  const gene = scene("show a gene on DNA");
  assertEntities(gene, ["dna", "gene"]);
  assertRelation(gene, "gene", "located_on", "dna");
  assertAbsent(gene, ["rna-polymerase", "rna-transcript"]);

  const promoter = scene("show a promoter");
  assertEntities(promoter, ["dna", "promoter"]);
  assertRelation(promoter, "promoter", "located_on", "dna");

  const transcript = scene("show RNA transcript");
  assertEntities(transcript, ["rna-transcript"]);
  assert.equal(Boolean(transcript.temporal), false);
});

test("template coding strand and transcription directionality are explicit", () => {
  const strands = scene("show template and coding strands");
  assertEntities(strands, ["dna", "template-strand", "coding-strand"]);
  assertRelation(strands, "template-strand", "part_of", "dna");
  assertRelation(strands, "coding-strand", "part_of", "dna");

  const direction = scene("show 5 prime to 3 prime RNA synthesis");
  assertEntities(direction, [
    "rna-transcript",
    "template-strand",
    "coding-strand",
    "rna-5-prime",
    "rna-3-prime",
    "3-to-5",
    "5-to-3",
  ]);
  assertRelation(direction, "rna-transcript", "direction", "5-to-3");
  assertRelation(direction, "rna-polymerase", "reads_direction", "3-to-5");
  assertRelation(direction, "coding-strand", "sequence_corresponds_to", "rna-transcript");
});

test("transcription bubble and termination resolve as process scenes", () => {
  const bubble = scene("show DNA opening around RNA polymerase");
  assertEntities(bubble, ["dna", "rna-polymerase", "transcription-bubble"]);
  assertAction(bubble, "rna-polymerase", "locally_unwinds", "dna");
  assertAbsent(bubble, ["helicase", "fork"]);

  const termination = scene("show transcription termination");
  assertEntities(termination, ["dna", "rna-polymerase", "rna-transcript", "terminator"]);
  assertAction(termination, "rna-polymerase", "terminates", "rna-transcript");
  assertRelation(termination, "terminator", "located_on", "dna");
});

test("organism-specific transcription machinery is conservative", () => {
  const bacterial = scene("show bacterial transcription");
  assertEntities(bacterial, ["bacterial-rna-polymerase"]);
  assertAbsent(bacterial, ["rna-polymerase-ii"]);

  const ecoli = scene("show transcription initiation in E. coli");
  assertEntities(ecoli, ["bacterial-rna-polymerase", "sigma-factor"]);
  assertRelation(ecoli, "sigma-factor", "associated_with", "bacterial-rna-polymerase");

  const human = scene("show RNA polymerase II transcribing a human gene");
  assertEntities(human, ["rna-polymerase-ii", "rna-transcript"]);
  assertAbsent(human, ["bacterial-rna-polymerase", "sigma-factor"]);
});

test("transcription spatial resolver places promoter, bubble, polymerase, RNA, and terminator", () => {
  const mechanism = scene("show RNA polymerase transcribing a gene");
  const placements = resolveSpatialPlacements(mechanism);

  const promoter = placements.find((placement) => placement.entityId === "promoter");
  const gene = placements.find((placement) => placement.entityId === "gene");
  const bubble = placements.find((placement) => placement.entityId === "transcription-bubble");
  const polymerase = placements.find((placement) => placement.entityId === "rna-polymerase");
  const transcript = placements.find((placement) => placement.entityId === "rna-transcript");

  assert.ok(promoter);
  assert.ok(gene);
  assert.ok(bubble);
  assert.ok(polymerase);
  assert.ok(transcript);
  assert.ok(promoter.position.x < gene.position.x);
  assert.ok(Math.abs(polymerase.position.x - bubble.position.x) < 0.05);

  const termination = scene("show transcription termination");
  const terminationPlacements = resolveSpatialPlacements(termination);
  const terminator = terminationPlacements.find((placement) => placement.entityId === "terminator");
  assert.ok(terminator);
  assert.ok(terminator.position.x > 0);
});

test("validation rejects obvious transcription organism mismatches", () => {
  const bacterialMismatch = validateBiologySceneConsistency(
    transcriptionScene("transcription", { organism: "eukaryotic" }),
    detectBiologyContext("bacterial transcription")
  );
  assert.equal(bacterialMismatch.ok, false);

  const eukaryoticMismatch = validateBiologySceneConsistency(
    transcriptionScene("initiation", { organism: "bacterial" }),
    detectBiologyContext("human transcription")
  );
  assert.equal(eukaryoticMismatch.ok, false);
});

test("replication and transcription prompts do not cross-contaminate semantics", () => {
  const replication = scene("show DNA polymerase copying DNA");
  assertEntities(replication, ["polymerase", "daughter-leading-strand"]);
  assertAbsent(replication, ["rna-transcript", "transcription-bubble"]);

  const transcription = scene("show RNA polymerase copying DNA into RNA");
  assertEntities(transcription, ["rna-polymerase", "rna-transcript"]);
  assertAbsent(transcription, [
    "daughter-leading-strand",
    "daughter-lagging-strand",
    "okazaki-fragment",
  ]);

  const stabilization = scene("what keeps exposed DNA strands apart during replication?");
  assertAbsent(stabilization, ["transcription-bubble", "rna-transcript"]);

  const localOpening = scene("show DNA opening around RNA polymerase");
  assertEntities(localOpening, ["transcription-bubble"]);
  assertAbsent(localOpening, ["helicase", "fork"]);
});
