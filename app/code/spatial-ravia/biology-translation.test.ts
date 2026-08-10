import assert from "node:assert/strict";
import test from "node:test";

import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { chooseBiologyRenderer } from "./biology-renderer-router.ts";
import { translationScene } from "./biology-scene-builders.ts";
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

function assertRelation(sceneSpec: BiologySceneSpec, subject: string, relation: string, object: string) {
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

function assertAction(sceneSpec: BiologySceneSpec, actor: string, action: string, target?: string) {
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

test("translation elongation paraphrases resolve to ribosome protein synthesis", () => {
  for (const prompt of [
    "show a ribosome elongating a protein",
    "show a ribosome making protein from mRNA",
    "convert mRNA information into protein",
  ]) {
    const result = scene(prompt);
    assert.equal(chooseBiologyRenderer(result), "three");
    assertEntities(result, ["mrna", "ribosome", "a-site", "p-site", "e-site", "aminoacyl-trna", "trna", "polypeptide"]);
    assertAction(result, "ribosome", "synthesizes", "polypeptide");
    assertRelation(result, "aminoacyl-trna", "positioned_at", "a-site");
    assertRelation(result, "polypeptide", "extends_from", "ribosome");
  }
});

test("translation initiation places initiator tRNA at the start codon and P site", () => {
  for (const prompt of [
    "show translation initiation",
    "show the ribosome assembling on mRNA",
    "show the initiator tRNA at the start codon",
  ]) {
    const result = scene(prompt);
    assertEntities(result, ["mrna", "ribosome", "start-codon", "initiator-trna", "p-site"]);
    assertRelation(result, "initiator-trna", "positioned_at", "p-site");
    assertRelation(result, "initiator-trna", "paired_with", "start-codon");
  }
});

test("codon anticodon and charged tRNA scenes are minimal and relational", () => {
  const pairing = scene("show codon anticodon pairing");
  assertEntities(pairing, ["mrna", "codon", "trna", "anticodon"]);
  assertRelation(pairing, "codon", "located_on", "mrna");
  assertRelation(pairing, "anticodon", "part_of", "trna");
  assertRelation(pairing, "anticodon", "complementary_to", "codon");

  const charged = scene("show a charged tRNA entering the A site");
  assertEntities(charged, ["trna", "amino-acid", "aminoacyl-trna", "a-site"]);
  assertRelation(charged, "amino-acid", "attached_to", "trna");
  assertRelation(charged, "aminoacyl-trna", "positioned_at", "a-site");
});

test("peptide bond formation and translocation encode A/P/E logic", () => {
  const peptideBond = scene("show peptide bond formation");
  assertEntities(peptideBond, ["a-site", "p-site", "aminoacyl-trna", "trna", "polypeptide"]);
  assertAction(peptideBond, "ribosome", "forms_peptide_bond", "polypeptide");
  assertRelation(peptideBond, "polypeptide", "transferred_to", "aminoacyl-trna");

  const translocation = scene("show ribosome translocation");
  assertEntities(translocation, ["a-site", "p-site", "e-site", "trna"]);
  assertAction(translocation, "ribosome", "translocates", "mrna");
  assertAction(translocation, "ribosome", "advances_one_codon", "mrna");
});

test("translation directionality distinguishes mRNA and protein directions", () => {
  const result = scene("show translation from 5 prime to 3 prime");
  assertEntities(result, ["mrna-5-prime", "mrna-3-prime", "n-terminus", "c-terminus", "5-to-3", "n-to-c"]);
  assertRelation(result, "ribosome", "reads_direction", "5-to-3");
  assertRelation(result, "polypeptide", "direction", "n-to-c");
});

test("translation termination uses release factor rather than tRNA at stop codon", () => {
  for (const prompt of [
    "show translation termination",
    "show a release factor at a stop codon",
    "what happens when ribosome reaches a stop codon?",
  ]) {
    const result = scene(prompt);
    assertEntities(result, ["stop-codon", "release-factor", "polypeptide"]);
    assertRelation(result, "release-factor", "binds_to", "stop-codon");
    assertAction(result, "release-factor", "terminates", "polypeptide");
    assertAbsent(result, ["aminoacyl-trna"]);
  }
});

test("translation spatial resolver positions mRNA through A P E sites and peptide exit", () => {
  const result = scene("show a ribosome elongating a protein");
  const placements = resolveSpatialPlacements(result);
  const eSite = placements.find((placement) => placement.entityId === "e-site");
  const pSite = placements.find((placement) => placement.entityId === "p-site");
  const aSite = placements.find((placement) => placement.entityId === "a-site");
  const mrna = placements.find((placement) => placement.entityId === "mrna");
  const polypeptide = placements.find((placement) => placement.entityId === "polypeptide");

  assert.ok(eSite);
  assert.ok(pSite);
  assert.ok(aSite);
  assert.ok(mrna);
  assert.ok(polypeptide);
  assert.ok(eSite.position.x < pSite.position.x);
  assert.ok(pSite.position.x < aSite.position.x);
  assert.ok(polypeptide.position.y > aSite.position.y);
});

test("validator rejects cross-domain translation inconsistencies", () => {
  const invalid = validateBiologySceneConsistency(
    {
      intent: "mechanism",
      scale: "complex",
      entities: [
        { id: "ribosome", name: "ribosome", type: "complex" },
        { id: "rna-transcript", name: "RNA transcript", type: "rna" },
      ],
      relations: [],
      actions: [{ actor: "ribosome", action: "synthesizes", target: "rna-transcript" }],
      renderMode: "mechanistic-3d",
    },
    { organism: "unspecified" }
  );
  assert.equal(invalid.ok, false);

  const valid = validateBiologySceneConsistency(
    translationScene("termination", { organism: "unspecified" }),
    { organism: "unspecified" }
  );
  assert.equal(valid.ok, true);
});

test("three-domain prompts remain disambiguated", () => {
  const replication = scene("copy DNA into DNA");
  assertEntities(replication, ["polymerase", "daughter-leading-strand"]);
  assertAbsent(replication, ["rna-transcript", "ribosome"]);

  const transcription = scene("copy DNA information into RNA");
  assertEntities(transcription, ["rna-polymerase", "rna-transcript"]);
  assertAbsent(transcription, ["ribosome", "polypeptide"]);

  const translation = scene("make a protein from a transcript");
  assertEntities(translation, ["ribosome", "polypeptide"]);
  assertAbsent(translation, ["rna-polymerase", "daughter-leading-strand"]);

  const rnaPolymerase = scene("show RNA polymerase");
  assertAbsent(rnaPolymerase, ["ribosome"]);
});

test("ambiguous translation prompts remain unsupported", () => {
  for (const prompt of [
    "show the protein machine",
    "show something making protein",
    "show the RNA helper",
  ]) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "unsupported", prompt);
  }
});
