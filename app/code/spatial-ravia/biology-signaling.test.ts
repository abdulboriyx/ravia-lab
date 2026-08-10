import assert from "node:assert/strict";
import test from "node:test";

import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { signalingScene } from "./biology-scene-builders.ts";
import { validateBiologySceneConsistency } from "./biology-scene-validator.ts";
import { resolveSpatialPlacements } from "./biology-spatial-resolver.ts";
import { chooseBiologyRenderer } from "./biology-renderer-router.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";

function scene(prompt: string) {
  const result = parseBiologyScenePrompt(prompt);
  assert.equal(result.status, "supported", prompt);
  return result.scene;
}

function hasEntity(spec: BiologySceneSpec, id: string) {
  assert.ok(spec.entities.some((entity) => entity.id === id), `missing ${id}`);
}

function hasRelation(spec: BiologySceneSpec, subject: string, relation: string, object: string) {
  assert.ok(
    spec.relations.some((candidate) => candidate.subject === subject && candidate.relation === relation && candidate.object === object),
    `missing ${subject}/${relation}/${object}`
  );
}

function hasAction(spec: BiologySceneSpec, actor: string, action: string, target?: string) {
  assert.ok(
    spec.actions.some((candidate) => candidate.actor === actor && candidate.action === action && candidate.target === target),
    `missing ${actor}/${action}/${target ?? ""}`
  );
}

test("membrane receptor prompts produce minimal topology", () => {
  const spec = scene("show a membrane receptor");
  hasEntity(spec, "plasma-membrane");
  hasEntity(spec, "receptor-tyrosine-kinase");
  hasRelation(spec, "receptor-tyrosine-kinase", "embedded_in", "plasma-membrane");
  assert.equal(chooseBiologyRenderer(spec), "three");
  assert.equal(spec.entities.some((entity) => entity.id === "raf"), false);
});

test("ligand binding and RTK activation preserve outside-inside topology", () => {
  for (const prompt of [
    "show a ligand activating a receptor tyrosine kinase",
    "show a growth factor binding its receptor",
    "what happens when a ligand binds an RTK?",
  ]) {
    const spec = scene(prompt);
    hasEntity(spec, "ligand");
    hasRelation(spec, "ligand", "located_in", "extracellular-space");
    hasRelation(spec, "receptor-tyrosine-kinase", "embedded_in", "plasma-membrane");
    hasAction(spec, "ligand", "binds", "receptor-tyrosine-kinase");
  }
});

test("RTK dimerization and autophosphorylation encode state", () => {
  const dimer = scene("show receptor dimerization");
  hasEntity(dimer, "receptor-monomer-a");
  hasEntity(dimer, "receptor-monomer-b");
  hasRelation(dimer, "receptor-monomer-a", "dimerizes_with", "receptor-monomer-b");

  const phospho = scene("show RTK autophosphorylation");
  hasEntity(phospho, "phosphotyrosine-site");
  hasEntity(phospho, "phosphate-group");
  hasRelation(phospho, "receptor-dimer", "state", "phosphorylated-state");
  hasRelation(phospho, "phosphotyrosine-site", "cytoplasmic_side_of", "receptor-dimer");
  hasAction(phospho, "receptor-dimer", "phosphorylates", "phosphotyrosine-site");
});

test("adaptor recruitment and Ras activation stay cytoplasmic and membrane-associated", () => {
  const adaptor = scene("show Grb2 binding to an activated receptor");
  hasEntity(adaptor, "grb2");
  hasEntity(adaptor, "phosphotyrosine-site");
  hasRelation(adaptor, "grb2", "binds_to", "phosphotyrosine-site");

  const ras = scene("show Ras switching from GDP to GTP");
  hasRelation(ras, "ras", "associated_with_surface", "plasma-membrane");
  hasRelation(ras, "ras-gdp", "transitions_to", "ras-gtp");
  hasAction(ras, "ras-gdp", "exchanges_for", "ras-gtp");
});

test("MAPK and nuclear signaling preserve cascade order", () => {
  const mapk = scene("show RTK signaling through Ras Raf MEK ERK");
  hasRelation(mapk, "ras-gtp", "activates", "raf");
  hasRelation(mapk, "raf", "activates", "mek");
  hasRelation(mapk, "mek", "activates", "erk");
  hasAction(mapk, "raf", "phosphorylates", "mek");
  hasAction(mapk, "mek", "phosphorylates", "erk");

  const nucleus = scene("show ERK signaling toward the nucleus");
  hasRelation(nucleus, "erk", "signals_to", "nucleus");
  hasRelation(nucleus, "cellular-response", "downstream_of", "erk");
});

test("resolver places signaling topology on correct sides", () => {
  const placements = resolveSpatialPlacements(signalingScene("ras-activation"));
  const ligand = placements.find((placement) => placement.entityId === "ligand");
  const receptor = placements.find((placement) => placement.entityId === "receptor-tyrosine-kinase");
  const phospho = placements.find((placement) => placement.entityId === "phosphotyrosine-site");
  const ras = placements.find((placement) => placement.entityId === "ras");
  assert.ok(ligand && ligand.position.y > 0);
  assert.ok(receptor && Math.abs(receptor.position.y) < 0.1);
  assert.ok(phospho && phospho.position.y < 0);
  assert.ok(ras && ras.position.y < 0 && ras.position.y > -0.8);
});

test("validator rejects incorrect signaling topology and cross-domain effectors", () => {
  const invalidLigand = signalingScene("ligand-binding");
  invalidLigand.relations = invalidLigand.relations.filter(
    (relation) => !(relation.subject === "ligand" && relation.relation === "located_in")
  );
  assert.equal(validateBiologySceneConsistency(invalidLigand, { organism: "unspecified" }).ok, false);

  const invalidRibosome = signalingScene("phosphorylation");
  invalidRibosome.entities.push({ id: "ribosome", name: "ribosome", type: "complex" });
  invalidRibosome.actions.push({ actor: "ribosome", action: "phosphorylates", target: "phosphotyrosine-site" });
  assert.equal(validateBiologySceneConsistency(invalidRibosome, { organism: "unspecified" }).ok, false);
});

test("four-domain prompts remain disambiguated", () => {
  hasEntity(scene("show DNA polymerase copying DNA"), "daughter-leading-strand");
  hasEntity(scene("show RNA polymerase transcribing DNA"), "rna-transcript");
  hasEntity(scene("show ribosome making protein"), "polypeptide");
  hasEntity(scene("show a ligand binding a membrane receptor"), "receptor-tyrosine-kinase");

  assert.equal(parseBiologyScenePrompt("show a protein binding DNA").status, "unsupported");
  assert.equal(parseBiologyScenePrompt("show protein phosphorylation").status, "unsupported");
});
