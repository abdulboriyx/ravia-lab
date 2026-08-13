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
  assert.ok(mapk.temporal, "broad RTK/MAPK signaling should be temporal");

  const nucleus = scene("show ERK signaling toward the nucleus");
  hasRelation(nucleus, "erk", "signals_to", "nucleus");
  hasRelation(nucleus, "cellular-response", "downstream_of", "erk");
});

test("broad signaling prompts route to canonical temporal signaling", () => {
  for (const prompt of [
    "show signaling",
    "show RTK signaling",
    "show receptor tyrosine kinase signaling",
    "show RTK signaling through Ras Raf MEK ERK",
    "show how a growth factor activates Ras",
    "show membrane signaling through Ras and ERK",
  ]) {
    const spec = scene(prompt);
    assert.deepEqual(
      spec.temporal?.phases.map((phase) => phase.id),
      [
        "resting",
        "ligand-approach",
        "ligand-binding",
        "dimerization",
        "receptor-activation",
        "adaptor-recruitment",
        "ras-activation",
        "raf-activation",
        "mek-activation",
        "erk-activation",
        "erk-translocation",
        "response-ready",
      ],
      prompt
    );
    hasEntity(spec, "ligand");
    hasEntity(spec, "receptor-dimer");
    hasEntity(spec, "sos");
    hasEntity(spec, "ras");
    hasEntity(spec, "raf");
    hasEntity(spec, "mek");
    hasEntity(spec, "erk");
    hasEntity(spec, "nucleus");
  }
});

test("focused signaling prompts stay focused", () => {
  const receptor = scene("show a receptor tyrosine kinase");
  assert.equal(receptor.temporal, undefined);
  assert.equal(receptor.entities.some((entity) => entity.id === "raf"), false);

  const ligand = scene("show a ligand activating a receptor tyrosine kinase");
  assert.equal(ligand.temporal, undefined);
  assert.equal(ligand.entities.some((entity) => entity.id === "raf"), false);

  const dimer = scene("show receptor dimerization");
  assert.equal(dimer.temporal, undefined);
  hasEntity(dimer, "receptor-dimer");
  assert.equal(dimer.entities.some((entity) => entity.id === "erk"), false);

  const ras = scene("show Ras switching from GDP to GTP");
  assert.equal(ras.temporal, undefined);
  hasEntity(ras, "ras-gdp");
  assert.equal(ras.entities.some((entity) => entity.id === "raf"), false);

  const mapk = scene("show Raf MEK ERK signaling");
  assert.equal(mapk.temporal, undefined);
  hasEntity(mapk, "raf");
  hasEntity(mapk, "mek");
  hasEntity(mapk, "erk");
  assert.equal(mapk.entities.some((entity) => entity.id === "nucleus"), false);

  const nucleus = scene("show ERK entering the nucleus");
  assert.equal(nucleus.temporal, undefined);
  hasEntity(nucleus, "nucleus");
});

test("resolver places signaling topology on correct sides", () => {
  const placements = resolveSpatialPlacements(signalingScene("canonical-rtk-mapk"));
  const ligand = placements.find((placement) => placement.entityId === "ligand");
  const receptor = placements.find((placement) => placement.entityId === "receptor-tyrosine-kinase");
  const phospho = placements.find((placement) => placement.entityId === "phosphotyrosine-site");
  const ras = placements.find((placement) => placement.entityId === "ras");
  const raf = placements.find((placement) => placement.entityId === "raf");
  const mek = placements.find((placement) => placement.entityId === "mek");
  const erk = placements.find((placement) => placement.entityId === "erk");
  const nucleus = placements.find((placement) => placement.entityId === "nucleus");
  assert.ok(ligand && ligand.position.y > 0);
  assert.ok(receptor && Math.abs(receptor.position.y) < 0.1);
  assert.ok(phospho && phospho.position.y < 0);
  assert.ok(ras && ras.position.y < 0 && ras.position.y > -0.8);
  assert.ok(raf && raf.position.y < -0.8);
  assert.ok(mek && mek.position.y < -0.8);
  assert.ok(erk && erk.position.y < -0.8);
  assert.ok(nucleus && nucleus.position.y > erk.position.y);
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
