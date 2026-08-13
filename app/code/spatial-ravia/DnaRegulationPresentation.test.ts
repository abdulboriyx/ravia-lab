import assert from "node:assert/strict";
import test from "node:test";
import { deriveDnaRegulationPresentation, isValidDnaRegulationPresentation } from "./DnaRegulationPresentation.ts";
import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { dnaTemplateUsesLegacyMechanism, resolveDnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";

test("regulatory regions remain DNA-attached and promoter precedes gene", () => {
  const plan = deriveDnaRegulationPresentation("show a promoter and gene on DNA");
  assert.equal(isValidDnaRegulationPresentation(plan), true);
  const promoter = plan.regions.find((region) => region.id === "promoter")!;
  const gene = plan.regions.find((region) => region.id === "gene")!;
  assert.equal(promoter.visible, true);
  assert.equal(gene.visible, true);
  assert.ok(promoter.end < gene.start);
});

test("enhancer and gene use independent canonical DNA spans", () => {
  const plan = deriveDnaRegulationPresentation("show an enhancer and gene");
  assert.deepEqual(plan.selectedLabels, ["ENHANCER", "GENE"]);
  assert.equal(plan.regions.find((region) => region.id === "promoter")?.visible, false);
  assert.ok(plan.regions.find((region) => region.id === "enhancer")!.end < plan.regions.find((region) => region.id === "gene")!.start);
});

test("regulation presentation cannot hand ownership to a transcription renderer", () => {
  const result = parseBiologyScenePrompt("show a regulatory region on DNA");
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  const template = resolveDnaVisualTemplate(result.scene, result.dnaSelection);
  assert.ok(template);
  assert.equal(template.family, "regulation");
  assert.equal(dnaTemplateUsesLegacyMechanism(template), false);
  assert.equal(template.allowTranscriptionComplex, false);
});
