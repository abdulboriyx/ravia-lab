import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { deriveRnaProcessingPresentation, isValidRnaProcessingPresentation, rnaSplicingPresentation, rnaTerminalFeaturePresentation } from "./RnaProcessingPresentation.ts";

function spec(prompt: string) {
  const resolved = resolveRnaIntent(prompt);
  assert.ok(resolved, prompt);
  return resolved.spec;
}

test("pre-mRNA is one continuous transcript with attached exon and intron regions", () => {
  const presentation = deriveRnaProcessingPresentation(spec("show introns and exons in pre-mRNA"));
  assert.equal(presentation.stage, "unprocessed");
  assert.equal(presentation.topology.displayLength, 24);
  assert.equal(presentation.topology.continuousChainIndices.length, 24);
  assert.ok(presentation.topology.regions.some((region) => region.kind === "exon"));
  assert.ok(presentation.topology.regions.some((region) => region.kind === "intron"));
  assert.ok(presentation.topology.regions.every((region) => region.attachedToTranscript));
  assert.equal(isValidRnaProcessingPresentation(presentation), true);
});

test("5-prime cap is anchored only to the transcript 5-prime terminus", () => {
  const presentation = rnaTerminalFeaturePresentation(spec("show the 5 prime cap on mRNA"), "5primeCap");
  assert.equal(presentation.terminalFeatures.length, 1);
  const cap = presentation.terminalFeatures[0];
  assert.equal(cap.kind, "fivePrimeCap");
  assert.equal(cap.terminus, "5prime");
  assert.equal(cap.attachedToDisplayIndex, 0);
  assert.equal(cap.chemistryClaim, "pedagogical-terminal-feature");
});

test("poly(A) tail is a continuous 3-prime extension", () => {
  const presentation = rnaTerminalFeaturePresentation(spec("show a poly A tail"), "polyATail", { tailLength: 5 });
  const tail = presentation.terminalFeatures[0];
  assert.equal(tail.kind, "polyATail");
  assert.equal(tail.terminus, "3prime");
  assert.equal(tail.units.length, 5);
  assert.equal(tail.attachedToDisplayIndex, 23);
  assert.equal(presentation.topology.displayLength, 29);
  assert.equal(presentation.topology.backboneLinks.length, 28);
  assert.ok(tail.units.every((unit) => unit.base === "A"));
});

test("mature mRNA removes introns and preserves exon order with exon-exon junctions", () => {
  const presentation = deriveRnaProcessingPresentation(spec("compare pre-mRNA and mature mRNA"), { stage: "mature", mode: "preMature" });
  assert.equal(presentation.stage, "mature");
  assert.equal(presentation.topology.displayLength, 20);
  assert.equal(presentation.topology.regions.some((region) => region.kind === "intron"), false);
  assert.equal(presentation.topology.regions.filter((region) => region.kind === "exon").length, 3);
  assert.equal(presentation.topology.spliceJunctions.filter((junction) => junction.kind === "exonExonJunction").length, 2);
  assert.deepEqual(presentation.topology.regions.filter((region) => region.kind === "exon").map((region) => region.sourceIndices[0]), [0, 9, 20]);
});

test("comparison mode provides before and after states over one transcript identity", () => {
  const presentation = deriveRnaProcessingPresentation(spec("compare pre-mRNA and mature mRNA"));
  assert.equal(presentation.mode, "comparison");
  assert.equal(presentation.comparison?.sharedTranscriptIdentity, true);
  assert.equal(presentation.comparison?.before.stage, "unprocessed");
  assert.equal(presentation.comparison?.after.stage, "mature");
  assert.equal(presentation.comparison?.after.topology.regions.some((region) => region.kind === "intron"), false);
});

test("conceptual splicing exposes before, processing, and after static states", () => {
  const scene = spec("show RNA splicing conceptually");
  const before = rnaSplicingPresentation(scene, "before");
  const processing = rnaSplicingPresentation(scene, "processing");
  const after = rnaSplicingPresentation(scene, "after");
  assert.equal(before.spliceState, "before");
  assert.ok(before.topology.regions.some((region) => region.kind === "intron"));
  assert.equal(processing.spliceState, "processing");
  assert.ok(processing.topology.spliceJunctions.some((junction) => junction.kind === "exonIntronBoundary"));
  assert.equal(after.spliceState, "after");
  assert.ok(after.topology.spliceJunctions.some((junction) => junction.kind === "exonExonJunction"));
  assert.equal(after.noSpliceosomeMachinery, true);
});

test("generic RNA is not automatically capped or polyadenylated", () => {
  const presentation = deriveRnaProcessingPresentation(spec("show the structure of RNA"));
  assert.deepEqual(presentation.terminalFeatures, []);
});

test("processing presentation is deterministic and camera is processing-scale appropriate", () => {
  const scene = spec("show pre-mRNA before processing");
  const first = deriveRnaProcessingPresentation(scene);
  const second = deriveRnaProcessingPresentation(scene);
  assert.deepEqual(first, second);
  assert.equal(first.camera.intent, "whole-rna");
  assert.equal(isValidRnaProcessingPresentation(first), true);
});
