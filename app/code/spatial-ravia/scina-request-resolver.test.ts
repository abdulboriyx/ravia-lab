import assert from "node:assert/strict";
import test from "node:test";
import { resolveScinaRequest } from "./scina-request-resolver.ts";

test("canonical resolver gives explicit DNA prompts one owner and preserves DNA identity", () => {
  const cases = [
    ["show A-T base pairing", "DNA", "dna-base-pairing", "DnaBasePairInteractionPresentation"],
    ["show G-C base pairing", "DNA", "dna-base-pairing", "DnaBasePairInteractionPresentation"],
    ["show phosphodiester bond in DNA", "DNA", "dna-phosphodiester-backbone", "DnaBackboneChemistryPresentation"],
  ] as const;
  for (const [prompt, domain, capabilityId, owner] of cases) {
    const resolved = resolveScinaRequest(prompt);
    assert.equal(resolved.request.domain, domain, prompt);
    assert.equal(resolved.request.capabilityId, capabilityId, prompt);
    assert.equal(resolved.request.owner.production, owner, prompt);
    assert.equal(resolved.route.kind, "dna-mechanism", prompt);
  }
});

test("DNA wording cannot be stolen by RNA's broad pairing and chemistry rules", () => {
  const dna = resolveScinaRequest("show phosphodiester bond in DNA");
  const rna = resolveScinaRequest("show phosphodiester bond in RNA");
  assert.equal(dna.request.domain, "DNA");
  assert.equal(rna.request.domain, "RNA");
  assert.equal(rna.route.kind, "rna");
});

test("eukaryotic transcription is identity-frozen and resolves to the Pol II owner", () => {
  for (const prompt of ["show eukaryotic RNA polymerase II transcribing DNA", "show RNA polymerase transcribing DNA"]) {
    const resolved = resolveScinaRequest(prompt);
    assert.equal(resolved.request.organism, "EUKARYOTIC_NUCLEAR", prompt);
    assert.equal(resolved.request.identity.polymeraseClass, "EUKARYOTIC_POL_II", prompt);
    assert.equal(resolved.request.identity.sourceAvailability, "AVAILABLE", prompt);
    assert.equal(resolved.route.kind, "cellular", prompt);
    assert.equal(resolved.request.renderer, "GeneExpressionProductionView", prompt);
  }
});

test("canonical DNA scene routing carries renderer and fidelity together", () => {
  const resolved = resolveScinaRequest("show a promoter sequence before a gene");
  assert.equal(resolved.route.kind, "dna-scene");
  assert.equal(resolved.request.domain, "DNA");
  assert.equal(resolved.request.capabilityId, "dna-sequence-regulation");
  assert.equal(resolved.request.renderer, "dna-template");
  assert.equal(resolved.request.fidelity, "C0_COMPUTED");
});
