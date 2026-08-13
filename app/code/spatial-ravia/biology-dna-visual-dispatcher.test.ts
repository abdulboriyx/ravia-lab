import assert from "node:assert/strict";
import test from "node:test";

import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { resolveDnaTemplateRendererOwner, resolveDnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";

const cases = [
  ["show the structure of B-DNA", "structure"],
  ["show an individual DNA nucleotide", "localChemistry"],
  ["show a promoter and gene on DNA", "regulation"],
  ["show an enhancer and gene", "regulation"],
  ["show a DNA replication fork", "replication"],
  ["show helicase unwinding DNA", "replication"],
  ["show RNA polymerase on DNA", "transcription"],
  ["show a transcription bubble on DNA", "transcription"],
  ["show a thymine dimer in DNA", "damageRepair"],
  ["show mismatch repair on DNA", "damageRepair"],
  ["show DNA wrapped around a nucleosome", "packaging"],
  ["show chromatin packing", "packaging"],
] as const;

test("DNA visual dispatcher selects one authoritative template for every family", () => {
  for (const [prompt, family] of cases) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "supported", prompt);
    if (result.status !== "supported") continue;
    const template = resolveDnaVisualTemplate(result.scene, result.dnaSelection);
    assert.ok(template, prompt);
    assert.equal(template.family, family, prompt);
  }
});

test("template guards prevent unrelated complex ownership", () => {
  for (const [prompt] of cases) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "supported", prompt);
    if (result.status !== "supported") continue;
    const template = resolveDnaVisualTemplate(result.scene, result.dnaSelection)!;
    assert.equal(template.allowTranscriptionComplex, template.family === "transcription", prompt);
    assert.equal(template.allowReplicationMachinery, template.family === "replication", prompt);
    if (["structure", "regulation", "damageRepair", "packaging", "localChemistry"].includes(template.family)) {
      assert.equal(template.allowTranscriptionComplex, false, prompt);
      assert.equal(template.allowReplicationMachinery, false, prompt);
    }
  }
});

test("DNA templates use scale-appropriate static composition", () => {
  const structure = parseBiologyScenePrompt("show the structure of B-DNA");
  const local = parseBiologyScenePrompt("show an individual DNA nucleotide");
  assert.equal(structure.status, "supported");
  assert.equal(local.status, "supported");
  if (structure.status !== "supported" || local.status !== "supported") return;
  const broad = resolveDnaVisualTemplate(structure.scene, structure.dnaSelection)!;
  const close = resolveDnaVisualTemplate(local.scene, local.dnaSelection)!;
  assert.ok(close.cameraPreset.distanceUnits < broad.cameraPreset.distanceUnits);
  assert.equal(close.allowBallAndStick, true);
});

test("each DNA family has exactly one mounted renderer owner", () => {
  const owners = new Map<string, string>();
  for (const [prompt] of cases) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "supported", prompt);
    if (result.status !== "supported") continue;
    const template = resolveDnaVisualTemplate(result.scene, result.dnaSelection)!;
    owners.set(template.family, resolveDnaTemplateRendererOwner(template));
  }
  assert.deepEqual(Object.fromEntries(owners), {
    structure: "molecular-view",
    localChemistry: "local-chemistry",
    regulation: "molecular-view",
    replication: "mechanistic-dna",
    transcription: "mechanistic-dna",
    damageRepair: "local-chemistry",
    packaging: "packaging",
  });
});

test("local chemistry subject is carried through DNA selection rather than renderer text matching", () => {
  for (const [prompt, expected] of [
    ["show G-C hydrogen bonding in DNA", "gc-base-pair"],
    ["show an individual DNA nucleotide", "nucleotide"],
    ["show a thymine dimer in DNA", "thymine-dimer"],
    ["show mismatch repair on DNA", "mismatch"],
  ] as const) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "supported", prompt);
    if (result.status !== "supported") continue;
    const template = resolveDnaVisualTemplate(result.scene, result.dnaSelection)!;
    assert.equal(template.localChemistrySubject, expected, prompt);
  }
});
