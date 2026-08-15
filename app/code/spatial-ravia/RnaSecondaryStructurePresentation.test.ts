import assert from "node:assert/strict";
import test from "node:test";
import {
  createRnaSecondaryStructureSpec,
  deriveRnaSecondaryStructurePresentation,
  isValidRnaSecondaryStructurePresentation,
  sampleRnaSecondaryStructure,
} from "./RnaSecondaryStructurePresentation.ts";

test("hairpin remains one continuous RNA chain with a paired stem and unpaired loop", () => {
  const topology = createRnaSecondaryStructureSpec("hairpin", { stemPairs: 3, loopLength: 3 });
  const presentation = deriveRnaSecondaryStructurePresentation(topology);
  assert.deepEqual(topology.continuousChainIndices, Array.from({ length: topology.sequence.length }, (_, index) => index));
  assert.equal(topology.pairingRegions[0].antiparallel, true);
  assert.equal(topology.pairingRegions[0].sameChain, true);
  assert.equal(topology.regions.find((region) => region.kind === "hairpin")?.residueIndices.length, 3);
  assert.ok(topology.unpairedResidues.length >= 3);
  assert.equal(presentation.backboneLinks.length, topology.sequence.length - 1);
  assert.equal(isValidRnaSecondaryStructurePresentation(presentation), true);
});

test("stem uses canonical RNA A-U and G-C pairs without a disconnected loop", () => {
  const topology = createRnaSecondaryStructureSpec("stem", { stemPairs: 4 });
  const pairs = topology.pairingRegions.flatMap((region) => region.pairs.map((pair) => pair.pair));
  assert.ok(pairs.includes("A-U"));
  assert.ok(pairs.includes("G-C"));
  assert.equal(topology.unpairedResidues.length, 0);
  assert.ok(topology.regions.every((region) => region.kind === "stem"));
});

test("bulge and internal loop preserve paired stems while marking unpaired sides", () => {
  const bulge = createRnaSecondaryStructureSpec("bulge");
  const internal = createRnaSecondaryStructureSpec("internalLoop");
  assert.ok(bulge.regions.some((region) => region.kind === "bulge" && region.residueIndices.every((index) => bulge.unpairedResidues.includes(index))));
  const internalLoops = internal.regions.filter((region) => region.kind === "internalLoop");
  assert.equal(internalLoops.length, 2);
  assert.ok(internalLoops.every((region) => region.residueIndices.every((index) => internal.unpairedResidues.includes(index))));
  assert.ok(internal.pairingRegions[0].pairs.length >= 2);
});

test("G-U wobble is typed distinctly from canonical pairing", () => {
  const topology = createRnaSecondaryStructureSpec("multiStem");
  const wobble = topology.pairingRegions.flatMap((region) => region.pairs).find((pair) => pair.pair === "G-U-wobble");
  assert.ok(wobble);
  assert.equal(topology.sequence[wobble!.left], "G");
  assert.equal(topology.sequence[wobble!.right], "U");
  const presentation = deriveRnaSecondaryStructurePresentation(topology);
  assert.ok(presentation.interactions.some((interaction) => interaction.type === "wobblePair"));
});

test("secondary-structure sampling is finite and deterministic", () => {
  const first = createRnaSecondaryStructureSpec("internalLoop", { foldingState: "partiallyFolded" });
  const second = createRnaSecondaryStructureSpec("internalLoop", { foldingState: "partiallyFolded" });
  assert.deepEqual(first, second);
  assert.deepEqual(sampleRnaSecondaryStructure(first), sampleRnaSecondaryStructure(second));
  assert.ok(sampleRnaSecondaryStructure(first).every((sample) => [sample.backbone, sample.ribose, sample.basePosition].flat().every(Number.isFinite)));
});
