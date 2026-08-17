import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { deriveRnaTypePresentation, isValidRnaTypePresentation, rnaTypeCameraIntent, rnaTypeRepresentationPolicy, rnaTypeTopology } from "./RnaTypePresentation.ts";

function spec(prompt: string) {
  const resolved = resolveRnaIntent(prompt);
  assert.ok(resolved, prompt);
  return resolved.spec;
}

test("mRNA defaults to a single-stranded identity without processing placeholders", () => {
  const presentation = deriveRnaTypePresentation(spec("show the structure of mRNA"));
  assert.equal(presentation.type, "mRNA");
  assert.equal(presentation.topology.topology, "single-stranded");
  assert.equal(presentation.topology.strandCount, 1);
  assert.deepEqual(presentation.processingPlaceholders, []);
  assert.equal(presentation.grounding.mode, "procedural");
});

test("tRNA exposes a continuous chain with acceptor, D, anticodon, and TΨC regions", () => {
  const topology = rnaTypeTopology("tRNA");
  assert.equal(topology.strandCount, 1);
  assert.deepEqual(topology.continuousChains[0], Array.from({ length: 20 }, (_, index) => index));
  assert.ok(topology.regions.some((region) => region.kind === "acceptorStem"));
  assert.ok(topology.regions.some((region) => region.kind === "anticodonLoop"));
  assert.ok(topology.regions.some((region) => region.kind === "DArm"));
  assert.ok(topology.regions.some((region) => region.kind === "TpsiCArm"));
  assert.ok(topology.pairs.length > 0);
  assert.deepEqual(topology.regions.find((region) => region.id === "d-loop")?.residueIndices, [5, 6]);
  assert.deepEqual(topology.regions.find((region) => region.id === "anticodon-loop")?.residueIndices, [9, 10]);
  assert.deepEqual(topology.regions.find((region) => region.id === "tpsi-c-loop")?.residueIndices, [13, 14]);
  assert.equal(topology.continuousChains[0].length, topology.sequences[0].length);
});

test("rRNA uses a folded multi-region identity", () => {
  const presentation = deriveRnaTypePresentation(spec("show rRNA"));
  assert.equal(presentation.type, "rRNA");
  assert.equal(presentation.topology.topology, "secondary-structure");
  assert.ok(presentation.topology.regions.filter((region) => region.kind === "stem").length >= 3);
  assert.ok(presentation.topology.pairs.length >= 10);
  assert.equal(rnaTypeCameraIntent("rRNA"), "secondary-structure");
});

test("mature miRNA is short and single-stranded, while precursor mode is a hairpin", () => {
  const mature = deriveRnaTypePresentation(spec("show miRNA"));
  const precursor = deriveRnaTypePresentation(spec("show a miRNA hairpin precursor"), { precursor: true });
  assert.equal(mature.topology.topology, "single-stranded");
  assert.equal(mature.topology.sequences[0].length, 8);
  assert.equal(precursor.topology.topology, "secondary-structure");
  assert.ok(precursor.topology.regions.some((region) => region.kind === "loop"));
});

test("siRNA uses two short paired RNA strands", () => {
  const presentation = deriveRnaTypePresentation(spec("show siRNA"));
  assert.equal(presentation.type, "siRNA");
  assert.equal(presentation.topology.strandCount, 2);
  assert.equal(presentation.strands.length, 2);
  assert.equal(presentation.topology.topology, "paired-region");
  assert.equal(presentation.topology.pairs.length, 12);
  assert.equal(presentation.strands[0].samples.length, 12);
  assert.equal(presentation.strands[1].samples.length, 12);
});

test("snRNA is represented as a small folded RNA", () => {
  const presentation = deriveRnaTypePresentation(spec("show snRNA"));
  assert.equal(presentation.type, "snRNA");
  assert.equal(presentation.topology.topology, "secondary-structure");
  assert.equal(presentation.topology.sequences[0].length, 18);
  assert.ok(presentation.topology.pairs.length >= 4);
});

test("comparison preserves type identities and shared visual grammar", () => {
  const presentation = deriveRnaTypePresentation(spec("compare mRNA and tRNA"));
  assert.equal(presentation.comparison?.sharedVisualGrammar, true);
  assert.equal(presentation.comparison?.left.type, "mRNA");
  assert.equal(presentation.comparison?.right.type, "tRNA");
  assert.equal(presentation.comparison?.scaling, "uniform-whole-object");
  assert.deepEqual(presentation.comparison?.labels, ["mRNA", "tRNA"]);
  assert.equal(presentation.comparison?.left.representation.focus, presentation.comparison?.right.representation.focus === "secondary-structure" ? "whole-rna" : presentation.comparison?.left.representation.focus);
});

test("type identity remains precise for standalone and comparison presentations", () => {
  const prompts = [
    ["show the structure of mRNA", "mRNA", "single-stranded"],
    ["show a tRNA", "tRNA", "secondary-structure"],
    ["show rRNA", "rRNA", "secondary-structure"],
    ["show miRNA", "miRNA", "single-stranded"],
    ["show siRNA", "siRNA", "paired-region"],
    ["show snRNA", "snRNA", "secondary-structure"],
  ] as const;
  for (const [prompt, type, topology] of prompts) {
    const presentation = deriveRnaTypePresentation(spec(prompt));
    assert.equal(presentation.type, type, prompt);
    assert.equal(presentation.topology.topology, topology, prompt);
    assert.equal(isValidRnaTypePresentation(presentation), true, prompt);
  }
  // Prompt resolution is intentionally owned by the RNA semantics layer.
  // The type presentation accepts the already-resolved comparison identity.
  const smallRnaComparison = deriveRnaTypePresentation(spec("show miRNA"), { compareWith: "siRNA" });
  assert.deepEqual([smallRnaComparison.comparison?.left.type, smallRnaComparison.comparison?.right.type], ["miRNA", "siRNA"]);
  assert.equal(smallRnaComparison.comparison?.left.topology.topology, "single-stranded");
  assert.equal(smallRnaComparison.comparison?.right.topology.topology, "paired-region");
});

test("deposited and procedural grounding are explicit and deterministic", () => {
  const procedural = deriveRnaTypePresentation(spec("show a tRNA"));
  const deposited = deriveRnaTypePresentation(spec("show a tRNA"), { deposited: { structureId: "1EH1", chains: ["A"] } });
  assert.equal(procedural.grounding.status, "educational-procedural");
  assert.equal(deposited.grounding.status, "experimentally-grounded");
  assert.equal(deposited.grounding.deposited?.provider, "Mol*");
  assert.equal(isValidRnaTypePresentation(procedural), true);
  assert.equal(isValidRnaTypePresentation(deposited), true);
  assert.deepEqual(rnaTypeRepresentationPolicy("mRNA"), rnaTypeRepresentationPolicy("mRNA"));
});
