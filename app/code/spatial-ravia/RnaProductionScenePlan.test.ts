import assert from "node:assert/strict";
import test from "node:test";
import { rnaV1Benchmark } from "./rna-benchmark.ts";
import { resolveRnaPresentation, rnaPresentationOwners } from "./RnaPresentationRouter.ts";
import { deriveProductionRnaScenePlan } from "./RnaProductionScenePlan.ts";
import type { RnaTypePresentation } from "./RnaTypePresentation.ts";
import { createRnaSecondaryStructureSpec, deriveRnaSecondaryStructurePresentation, sampleRnaSecondaryStructure, validateRnaSecondaryStructureGeometry } from "./RnaSecondaryStructurePresentation.ts";

test("all eight RNA owners produce one shared production scene plan", () => {
  const families = new Set(rnaV1Benchmark.map((item) => item.expectedFamily));
  for (const family of families) {
    const route = resolveRnaPresentation(rnaV1Benchmark.find((item) => item.expectedFamily === family)!.prompt)!;
    const plan = deriveProductionRnaScenePlan(route);
    assert.equal(route.owner, rnaPresentationOwners[family]);
    assert.equal(plan.metadata.owner, route.owner);
    assert.ok(plan.cameraIntent.length > 0);
    assert.ok(plan.strands.length > 0 || plan.atoms.length > 0);
  }
  assert.equal(families.size, 8);
});

test("local chemistry uses atom/bond LOD without spawning a whole RNA backbone", () => {
  const route = resolveRnaPresentation("show the 2 prime OH in RNA")!;
  const plan = deriveProductionRnaScenePlan(route);
  assert.equal(plan.structuralMode, "local-chemistry");
  assert.ok(plan.atoms.some((atom) => atom.role === "twoPrimeHydroxyl"));
  assert.ok(plan.bonds.length > 0);
  assert.equal(plan.strands.length, 0);
});

test("RNA-DNA local chemistry comparison mounts the existing DNA chemistry plan beside RNA", () => {
  const route = resolveRnaPresentation("compare a DNA nucleotide and an RNA nucleotide")!;
  const plan = deriveProductionRnaScenePlan(route);
  assert.equal(plan.structuralMode, "local-chemistry");
  assert.ok(plan.atoms.length > 0);
  assert.ok(plan.comparisonAtoms.length > 0);
  assert.ok(plan.comparisonBonds.length > 0);
});

test("secondary structure and type routes retain structural strands", () => {
  const hairpin = deriveProductionRnaScenePlan(resolveRnaPresentation("show an RNA hairpin")!);
  const trna = deriveProductionRnaScenePlan(resolveRnaPresentation("show a tRNA")!);
  assert.equal(hairpin.strands.length, 1);
  assert.ok(hairpin.strands[0].samples.length > 1);
  assert.equal(trna.strands.length, 1);
  assert.ok(trna.strands[0].samples.length > 1);
});

test("tRNA production uses a continuous cloverleaf substrate with distinct arms and shared pair overlays", () => {
  const plan = deriveProductionRnaScenePlan(resolveRnaPresentation("show a tRNA")!);
  const samples = plan.strands[0].samples;
  assert.equal(samples.length, 20);
  assert.equal(plan.interactions.length, 7);
  assert.deepEqual(plan.labels, []);
  assert.ok(samples[0].backbone[0] < 0 && samples[19].backbone[0] > 0);
  assert.ok(samples[8].backbone[1] < samples[4].backbone[1]);
  assert.ok(samples[4].backbone[0] < 0 && samples[12].backbone[0] > 0);
  assert.ok(plan.interactions.every((interaction) => Math.abs(interaction.from[1] - interaction.to[1]) < 0.5 || Math.abs(interaction.from[0] - interaction.to[0]) < 0.8));
  const paired = new Set(plan.interactions.flatMap((interaction) => [interaction.from.join(","), interaction.to.join(",")]));
  assert.ok(plan.interactions.length > 0);
  assert.equal(samples.slice(0, 20).filter((sample) => sample.pairedWith === undefined).length, 6);
  assert.ok(paired.size > 0);
});

test("type comparison mounts independent normalized mRNA and tRNA objects", () => {
  const route = resolveRnaPresentation("compare mRNA and tRNA")!;
  const plan = deriveProductionRnaScenePlan(route);
  const typed = route.presentation as RnaTypePresentation;
  assert.ok(plan.comparison);
  assert.deepEqual(plan.comparison?.identities, ["mRNA", "tRNA"]);
  assert.equal(plan.comparison?.normalizedScale, true);
  assert.equal(plan.comparison?.wide.mode, "side-by-side");
  assert.equal(plan.comparison?.portrait.mode, "stacked");
  assert.equal(plan.comparison?.wide.strands.length, 2);
  assert.notDeepEqual(plan.comparison?.wide.strands[0].samples, plan.comparison?.wide.strands[1].samples);
  assert.equal(plan.comparison?.wide.items[0].type, "mRNA");
  assert.equal(plan.comparison?.wide.items[1].type, "tRNA");
  assert.equal(plan.comparison?.wide.items[1].presentation, typed.comparison?.right);
  assert.deepEqual(plan.comparison?.wide.items[1].topology.regions.filter((region) => ["acceptor-stem", "anticodon-arm", "d-arm", "tpsi-c-arm"].includes(region.id)).map((region) => region.id), ["acceptor-stem", "d-arm", "anticodon-arm", "tpsi-c-arm"]);
  assert.equal(plan.comparison?.wide.items[0].topology.regions.some((region) => region.kind === "acceptorStem"), false);
  assert.ok(plan.comparison?.wide.interactions.length >= 7);
  assert.ok((plan.comparison?.wide.bounds.width ?? 0) > 3);
  assert.ok(plan.comparison?.wide.labels.every((label) => label.text === "mRNA" || label.text === "tRNA"));
  assert.equal(plan.labels.some((label) => label.text === "Coding-region context"), false);
});

test("secondary-structure production carries shared pairing interactions across the stem", () => {
  const route = resolveRnaPresentation("show an RNA hairpin")!;
  const plan = deriveProductionRnaScenePlan(route);
  const samples = plan.strands[0].samples;
  assert.equal(plan.interactions.length, 3);
  assert.ok(plan.interactions.every((interaction) => interaction.type === "hydrogenBond"));
  assert.ok(plan.interactions.every((interaction) => interaction.from[0] < 0 && interaction.to[0] > 0));
  assert.ok(samples[0].pairedWith !== undefined);
  assert.equal(samples[samples[0].pairedWith!].pairedWith, 0);
});

test("unpaired loop residues remain interaction-free while the backbone stays continuous", () => {
  const topology = createRnaSecondaryStructureSpec("hairpin", { stemPairs: 3, loopLength: 3 });
  const presentation = deriveRnaSecondaryStructurePresentation(topology);
  const paired = new Set(presentation.interactions.flatMap((interaction) => interaction.participants));
  assert.ok(topology.unpairedResidues.every((index) => !paired.has(index)));
  assert.equal(presentation.backboneLinks.length, topology.sequence.length - 1);
});

test("secondary-structure labels are region-anchored and deduplicated", () => {
  const hairpin = deriveProductionRnaScenePlan(resolveRnaPresentation("show an RNA hairpin")!);
  assert.deepEqual(hairpin.labels.map((label) => label.text), ["Stem", "Loop"]);
  assert.equal(new Set(hairpin.labels.map((label) => label.text)).size, hairpin.labels.length);
  const pairedUnpaired = deriveProductionRnaScenePlan(resolveRnaPresentation("show paired and unpaired regions in RNA")!);
  assert.deepEqual(pairedUnpaired.labels.map((label) => label.text), ["Paired", "Unpaired"]);
});

test("internal-loop geometry preserves side ordering and has no backbone crossings", () => {
  const topology = createRnaSecondaryStructureSpec("internalLoop");
  const samples = sampleRnaSecondaryStructure(topology);
  const validation = validateRnaSecondaryStructureGeometry(topology, samples);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.crossingSegments, []);
  assert.deepEqual(validation.sideInversions, []);
  assert.ok(samples[0].backbone[0] < samples[11].backbone[0]);
  assert.ok(samples[4].backbone[0] < samples[7].backbone[0]);
  assert.ok(samples[2].backbone[1] < samples[3].backbone[1]);
  assert.ok(samples[8].backbone[1] > samples[9].backbone[1]);
});

test("internal-loop pairing resumes above and below the unpaired opening", () => {
  const topology = createRnaSecondaryStructureSpec("internalLoop");
  const presentation = deriveRnaSecondaryStructurePresentation(topology);
  const paired = new Set(presentation.interactions.flatMap((interaction) => interaction.participants));
  assert.deepEqual(topology.unpairedResidues, [2, 3, 8, 9]);
  assert.ok(topology.pairedResidues.filter(([left]) => left < 2).length > 0);
  assert.ok(topology.pairedResidues.filter(([left]) => left > 3 && left < 6).length > 0);
  assert.ok(topology.unpairedResidues.every((index) => !paired.has(index)));
});

test("bulge deforms one side while the opposite paired stem stays on its frame", () => {
  const topology = createRnaSecondaryStructureSpec("bulge");
  const samples = sampleRnaSecondaryStructure(topology);
  const validation = validateRnaSecondaryStructureGeometry(topology, samples);
  assert.equal(validation.valid, true);
  assert.deepEqual(topology.unpairedResidues, [1]);
  assert.equal(samples[1].backbone[0] < samples[0].backbone[0], true);
  assert.ok(samples[4].backbone[0] > 0 && samples[5].backbone[0] > 0 && samples[6].backbone[0] > 0);
  assert.deepEqual(validation.crossingSegments, []);
});

test("bulge pairing resumes around the unmatched residue without diagonal connectors", () => {
  const topology = createRnaSecondaryStructureSpec("bulge", { stemPairs: 4, bulgeLength: 1 });
  const presentation = deriveRnaSecondaryStructurePresentation(topology);
  const paired = new Set(presentation.interactions.flatMap((interaction) => interaction.participants));
  assert.equal(topology.unpairedResidues.length, 1);
  assert.equal(paired.has(topology.unpairedResidues[0]), false);
  assert.ok(presentation.interactions.every((interaction) => Math.abs(presentation.samples[interaction.participants[0]].basePosition[1] - presentation.samples[interaction.participants[1]].basePosition[1]) < 0.3));
});

test("left and right multi-residue bulges share the same frame and remain bounded", () => {
  for (const side of ["left", "right"] as const) {
    const topology = createRnaSecondaryStructureSpec("bulge", { stemPairs: 4, bulgeSide: side, bulgeLength: 2 });
    const samples = sampleRnaSecondaryStructure(topology);
    const validation = validateRnaSecondaryStructureGeometry(topology, samples);
    assert.equal(validation.valid, true);
    assert.equal(topology.unpairedResidues.length, 2);
    assert.deepEqual(validation.crossingSegments, []);
    const bulgeRegion = topology.regions.find((region) => region.kind === "bulge")!;
    const bulgeXs = bulgeRegion.residueIndices.map((index) => samples[index].backbone[0]);
    assert.ok(side === "left" ? bulgeXs.every((x) => x < -1.08) : bulgeXs.every((x) => x > 1.08));
  }
});

test("pairing and hybrid routes mount paired strands and interaction overlays", () => {
  const pair = deriveProductionRnaScenePlan(resolveRnaPresentation("show how adenine pairs with uracil")!);
  const hybrid = deriveProductionRnaScenePlan(resolveRnaPresentation("show an RNA DNA hybrid")!);
  assert.equal(pair.strands.length, 2);
  assert.ok(pair.interactions.length > 0);
  assert.equal(hybrid.strands.length, 2);
  assert.deepEqual(hybrid.strands.map((strand) => strand.kind), ["RNA", "DNA"]);
});

test("processing, degradation, and nascent routes retain RNA-centered overlays", () => {
  const processing = deriveProductionRnaScenePlan(resolveRnaPresentation("show introns and exons in pre mRNA")!);
  const degradation = deriveProductionRnaScenePlan(resolveRnaPresentation("show RNA being cleaved")!);
  const nascent = deriveProductionRnaScenePlan(resolveRnaPresentation("show RNA emerging from transcription")!);
  assert.equal(processing.strands.length, 1);
  assert.ok(processing.highlightedIndices.length > 0);
  assert.equal(degradation.strands.length, 1);
  assert.ok(degradation.interactions.length > 0);
  assert.equal(nascent.family, "nascentTranscript");
  assert.equal(nascent.strands.length, 1);
});

test("generic B-DNA bypasses the RNA production renderer", () => {
  assert.equal(resolveRnaPresentation("show B-DNA"), undefined);
});
