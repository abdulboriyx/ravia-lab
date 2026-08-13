import assert from "node:assert/strict";
import test from "node:test";
import { dnaFamilyBenchmark } from "./dna-family-benchmark.ts";
import { deriveDnaPromptSelection } from "./biology-dna-prompt-intent.ts";

test("DNA prompt selection identifies the semantic family and its focal view", () => {
  const cases = [
    ["show the DNA double helix", "structure", "nucleotide", "whole-molecule", "whole-helix"],
    ["show a promoter sequence before a gene", "sequence-regulation", "nucleotide", "sequence-region", "regulatory-region"],
    ["show helicase at a replication fork", "replication", "polymer", "fork", "fork"],
    ["show RNA polymerase transcribing DNA", "transcription", "polymer", "transcription-bubble", "transcription-bubble"],
    ["show a DNA lesion being repaired", "damage-repair", "residue", "lesion-or-repair-site", "repair-site"],
    ["show DNA wrapped around histones", "packaging", "polymer", "nucleosome-or-loop", "packaging-domain"],
    ["show atoms and bonds in a DNA base pair", "local-chemistry", "atom", "selected-base-pair-or-residue", "local-chemistry"],
  ] as const;

  for (const [prompt, family, detailLevel, focalKind, cameraIntent] of cases) {
    const selection = deriveDnaPromptSelection(prompt);
    assert.ok(selection, prompt);
    assert.equal(selection.family, family, prompt);
    assert.equal(selection.detailLevel, detailLevel, prompt);
    assert.equal(selection.focalRegion.kind, focalKind, prompt);
    assert.equal(selection.cameraIntent, cameraIntent, prompt);
  }
});

test("explicit semantic detail requests override only the requested detail level", () => {
  assert.equal(deriveDnaPromptSelection("show DNA at atomic detail")?.detailLevel, "atom");
  assert.equal(deriveDnaPromptSelection("show the replication fork backbone")?.detailLevel, "polymer");
  assert.equal(deriveDnaPromptSelection("show the whole DNA molecule")?.detailLevel, "context");
});

test("requested entities describe the biological cast rather than renderer primitives", () => {
  const transcription = deriveDnaPromptSelection("show RNA polymerase making a nascent RNA from DNA");
  assert.deepEqual(transcription?.requestedEntities, ["dna", "rna-polymerase", "nascent-rna"]);

  const repair = deriveDnaPromptSelection("show a repair enzyme fixing a DNA lesion");
  assert.deepEqual(repair?.requestedEntities, ["dna", "repair-machinery", "local-ligand-or-damage"]);
});

test("non-DNA prompts do not acquire a DNA presentation intent", () => {
  assert.equal(deriveDnaPromptSelection("show a ribosome translating mRNA"), undefined);
});

test("the frozen 100-prompt DNA benchmark selects the requested scene family", () => {
  assert.equal(dnaFamilyBenchmark.length, 100);

  for (const benchmarkCase of dnaFamilyBenchmark) {
    const selection = deriveDnaPromptSelection(benchmarkCase.prompt);
    if (!benchmarkCase.expected.supported) {
      assert.equal(selection, undefined, benchmarkCase.id);
      continue;
    }

    assert.ok(selection, benchmarkCase.id);
    assert.equal(selection.family, benchmarkCase.expected.sceneFamily, benchmarkCase.id);
    assert.ok(selection.focalRegion.kind, benchmarkCase.id);
    assert.ok(selection.cameraIntent, benchmarkCase.id);
    assert.ok(selection.requestedEntities.length > 0, benchmarkCase.id);
  }
});
