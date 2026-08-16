import {
  canonicalRnaPair,
  canonicalRnaView,
  rnaMaterialPalette,
  sampleCanonicalRna,
  type RnaBase,
  type RnaPoint,
  type RnaResidueSample,
  type RnaTheme,
  type RnaTopologyState,
} from "./RnaVisualSystem.ts";
import { classifyRnaPair } from "./RnaPairingPresentation.ts";

export type RnaSecondaryStructureMotif =
  | "stem"
  | "hairpin"
  | "stemLoop"
  | "bulge"
  | "internalLoop"
  | "pairedUnpaired"
  | "multiStem";

export type RnaSecondaryStructureFoldingState = "extended" | "partiallyFolded" | "folded";
export type RnaSecondaryRegionKind = "stem" | "hairpin" | "loop" | "bulge" | "internalLoop" | "paired" | "unpaired" | "junction";

export type RnaSequenceRange = readonly [start: number, end: number];

export type RnaSecondaryStructureRegion = {
  id: string;
  kind: RnaSecondaryRegionKind;
  sequenceRange: RnaSequenceRange;
  residueIndices: readonly number[];
  side?: "left" | "right" | "central";
  label?: string;
};

export type RnaPairingRegion = {
  id: string;
  kind: "canonical" | "wobble";
  pairs: readonly {
    left: number;
    right: number;
    pair: "A-U" | "G-C" | "G-U-wobble";
  }[];
  leftRange: RnaSequenceRange;
  rightRange: RnaSequenceRange;
  sameChain: true;
  antiparallel: true;
};

export type RnaSecondaryStructureTopology = {
  motif: RnaSecondaryStructureMotif;
  sequence: readonly RnaBase[];
  regions: readonly RnaSecondaryStructureRegion[];
  pairingRegions: readonly RnaPairingRegion[];
  pairedResidues: readonly [number, number][];
  unpairedResidues: readonly number[];
  continuousChainIndices: readonly number[];
  foldingState: RnaSecondaryStructureFoldingState;
  deterministicKey: string;
};

export type RnaSecondaryStructureInteraction = {
  id: string;
  type: "hydrogenBond" | "wobblePair";
  participants: readonly [number, number];
  state: "present";
};

export type RnaSecondaryStructurePresentation = {
  motif: RnaSecondaryStructureMotif;
  representation: ReturnType<typeof canonicalRnaView>;
  topology: RnaSecondaryStructureTopology;
  topologyState: RnaTopologyState;
  samples: readonly RnaResidueSample[];
  interactions: readonly RnaSecondaryStructureInteraction[];
  backboneLinks: readonly { from: number; to: number; type: "continuous" }[];
  labels: readonly { text: string; regionId: string }[];
  visualGrammar: {
    paired: "partner-facing-with-interaction";
    unpaired: "open-backbone-without-interaction";
    chemistry: "RNA-ribose-2prime-oh-uracil";
  };
  camera: ReturnType<typeof canonicalRnaView>["camera"];
  materials: ReturnType<typeof rnaMaterialPalette>;
};

type BuildOptions = {
  stemPairs?: number;
  loopLength?: number;
  sequence?: readonly RnaBase[];
  foldingState?: RnaSecondaryStructureFoldingState;
  theme?: RnaTheme;
};

const complement = (base: RnaBase, wobble = false): RnaBase => {
  if (wobble && base === "G") return "U";
  if (base === "A") return "U";
  if (base === "U") return "A";
  if (base === "G") return "C";
  return "G";
};

const range = (start: number, end: number): number[] => Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
const asRange = (indices: readonly number[]): RnaSequenceRange => [indices[0] ?? 0, indices[indices.length - 1] ?? 0];

function region(id: string, kind: RnaSecondaryRegionKind, indices: readonly number[], side?: RnaSecondaryStructureRegion["side"], label?: string): RnaSecondaryStructureRegion {
  return { id, kind, sequenceRange: asRange(indices), residueIndices: indices, side, label };
}

function defaultStemBases(count: number, wobble = false): RnaBase[] {
  return Array.from({ length: count }, (_, index) => (["A", "G", "C", "U"] as const)[index % 4]).map((base) => wobble ? base : base);
}

function addPair(sequence: RnaBase[], pairs: { left: number; right: number; pair: "A-U" | "G-C" | "G-U-wobble" }[], left: number, right: number, wobble = false) {
  const leftBase = sequence[left] ?? "A";
  const rightBase = complement(leftBase, wobble);
  sequence[left] = leftBase;
  sequence[right] = rightBase;
  pairs.push({ left, right, pair: wobble ? "G-U-wobble" : leftBase === "A" ? "A-U" : "G-C" });
}

function buildHairpin(options: BuildOptions): { sequence: RnaBase[]; regions: RnaSecondaryStructureRegion[]; pairingRegions: RnaPairingRegion[] } {
  const stemPairs = Math.max(2, Math.round(options.stemPairs ?? 3));
  const loopLength = Math.max(3, Math.round(options.loopLength ?? 3));
  const length = stemPairs * 2 + loopLength;
  const sequence = Array.from({ length }, (_, index) => options.sequence?.[index] ?? (defaultStemBases(stemPairs)[index % stemPairs] ?? "A"));
  const pairs: { left: number; right: number; pair: "A-U" | "G-C" | "G-U-wobble" }[] = [];
  for (let index = 0; index < stemPairs; index += 1) addPair(sequence, pairs, index, length - 1 - index);
  const left = range(0, stemPairs - 1);
  const loop = range(stemPairs, stemPairs + loopLength - 1);
  const right = range(stemPairs + loopLength, length - 1);
  return {
    sequence,
    regions: [region("stem-left", "stem", left, "left", "Stem"), region("hairpin-loop", "hairpin", loop, "central", "Loop"), region("stem-right", "stem", right, "right", "Stem")],
    pairingRegions: [{ id: "hairpin-stem-pairing", kind: "canonical", pairs, leftRange: asRange(left), rightRange: asRange(right), sameChain: true, antiparallel: true }],
  };
}

function buildStem(options: BuildOptions): { sequence: RnaBase[]; regions: RnaSecondaryStructureRegion[]; pairingRegions: RnaPairingRegion[] } {
  const stemPairs = Math.max(2, Math.round(options.stemPairs ?? 3));
  const length = stemPairs * 2;
  const sequence = Array.from({ length }, (_, index) => options.sequence?.[index] ?? (["A", "G", "C", "U"] as const)[index % 4]);
  const pairs: { left: number; right: number; pair: "A-U" | "G-C" | "G-U-wobble" }[] = [];
  for (let index = 0; index < stemPairs; index += 1) addPair(sequence, pairs, index, length - 1 - index);
  const left = range(0, stemPairs - 1);
  const right = range(stemPairs, length - 1);
  return { sequence, regions: [region("stem-left", "stem", left, "left", "Stem"), region("stem-right", "stem", right, "right", "Stem")], pairingRegions: [{ id: "stem-pairing", kind: "canonical", pairs, leftRange: asRange(left), rightRange: asRange(right), sameChain: true, antiparallel: true }] };
}

function buildBulge(options: BuildOptions): { sequence: RnaBase[]; regions: RnaSecondaryStructureRegion[]; pairingRegions: RnaPairingRegion[] } {
  const stemPairs = Math.max(2, Math.round(options.stemPairs ?? 3));
  const length = stemPairs * 2 + 3;
  const sequence = Array.from({ length }, (_, index) => options.sequence?.[index] ?? (["A", "G", "C", "U"] as const)[index % 4]);
  const pairs: { left: number; right: number; pair: "A-U" | "G-C" | "G-U-wobble" }[] = [];
  for (let index = 0; index < stemPairs; index += 1) addPair(sequence, pairs, index, length - 1 - index);
  const left = range(0, stemPairs - 1);
  const bulge = [stemPairs];
  const unpaired = [stemPairs + 1];
  const right = range(stemPairs + 2, length - 1);
  return {
    sequence,
    regions: [region("bulge-stem-left", "stem", left, "left", "Stem"), region("bulge-region", "bulge", bulge, "left", "Bulge"), region("bulge-unpaired-side", "unpaired", unpaired, "right", "Unpaired"), region("bulge-stem-right", "stem", right, "right", "Stem")],
    pairingRegions: [{ id: "bulge-stem-pairing", kind: "canonical", pairs, leftRange: asRange(left), rightRange: asRange(right), sameChain: true, antiparallel: true }],
  };
}

function buildInternalLoop(options: BuildOptions): { sequence: RnaBase[]; regions: RnaSecondaryStructureRegion[]; pairingRegions: RnaPairingRegion[] } {
  const sequence = Array.from({ length: 12 }, (_, index) => options.sequence?.[index] ?? (["A", "G", "C", "U"] as const)[index % 4]);
  const pairs: { left: number; right: number; pair: "A-U" | "G-C" | "G-U-wobble" }[] = [];
  for (const [left, right] of [[0, 11], [1, 10], [4, 7], [5, 6]] as const) addPair(sequence, pairs, left, right);
  const upperLeft = [0, 1];
  const leftLoop = [2, 3];
  const lowerLeft = [4, 5];
  const lowerRight = [6, 7];
  const rightLoop = [8, 9];
  const upperRight = [10, 11];
  return {
    sequence,
    regions: [region("internal-upper-left", "stem", upperLeft, "left", "Stem"), region("internal-loop-left", "internalLoop", leftLoop, "left", "Internal loop"), region("internal-lower-left", "stem", lowerLeft, "left", "Stem"), region("internal-lower-right", "stem", lowerRight, "right", "Stem"), region("internal-loop-right", "internalLoop", rightLoop, "right", "Internal loop"), region("internal-upper-right", "stem", upperRight, "right", "Stem")],
    pairingRegions: [{ id: "internal-upper-and-lower-stems", kind: "canonical", pairs, leftRange: [0, 5], rightRange: [6, 11], sameChain: true, antiparallel: true }],
  };
}

function buildPairedUnpaired(options: BuildOptions) {
  const built = buildHairpin(options);
  return { ...built, regions: [...built.regions, region("unpaired-region", "unpaired", built.regions.find((item) => item.kind === "hairpin")?.residueIndices ?? [], "central", "Unpaired")] };
}

function buildMultiStem(options: BuildOptions): { sequence: RnaBase[]; regions: RnaSecondaryStructureRegion[]; pairingRegions: RnaPairingRegion[] } {
  const sequence = Array.from({ length: 18 }, (_, index) => options.sequence?.[index] ?? (["A", "G", "C", "U"] as const)[index % 4]);
  const pairs: { left: number; right: number; pair: "A-U" | "G-C" | "G-U-wobble" }[] = [];
  sequence[8] = "G";
  for (const [left, right] of [[0, 17], [1, 16], [4, 13], [5, 12], [8, 9]] as const) addPair(sequence, pairs, left, right, left === 8);
  const regions = [region("stem-one", "stem", [0, 1, 16, 17], undefined, "Stem"), region("junction", "junction", [2, 3, 14, 15], "central", "Junction"), region("stem-two", "stem", [4, 5, 12, 13], undefined, "Stem"), region("stem-three", "stem", [8, 9], undefined, "Stem")];
  return { sequence, regions, pairingRegions: [{ id: "multi-stem-pairing", kind: "wobble", pairs, leftRange: [0, 8], rightRange: [9, 17], sameChain: true, antiparallel: true }] };
}

function buildTopology(motif: RnaSecondaryStructureMotif, options: BuildOptions): RnaSecondaryStructureTopology {
  const built = motif === "stem" ? buildStem(options) : motif === "bulge" ? buildBulge(options) : motif === "internalLoop" ? buildInternalLoop(options) : motif === "multiStem" ? buildMultiStem(options) : motif === "pairedUnpaired" ? buildPairedUnpaired(options) : buildHairpin(options);
  const pairedResidues = built.pairingRegions.flatMap((region) => region.pairs.map(({ left, right }) => [left, right] as [number, number]));
  const paired = new Set(pairedResidues.flat());
  const unpairedResidues = built.sequence.map((_, index) => index).filter((index) => !paired.has(index));
  return { motif, sequence: built.sequence, regions: built.regions, pairingRegions: built.pairingRegions, pairedResidues, unpairedResidues, continuousChainIndices: built.sequence.map((_, index) => index), foldingState: options.foldingState ?? "folded", deterministicKey: `${motif}:${built.sequence.join("")}:${options.foldingState ?? "folded"}` };
}

function toAgentBTopology(topology: RnaSecondaryStructureTopology): RnaTopologyState {
  return { topology: "secondary-structure", regions: topology.regions.map((item) => ({ id: item.id, kind: item.kind === "loop" ? "unpaired" : item.kind === "junction" ? "unpaired" : item.kind, residueIndices: item.residueIndices, partnerIndices: item.kind === "stem" ? topology.pairedResidues.flat() : undefined })), pairedResidues: topology.pairedResidues, unpairedResidues: topology.unpairedResidues, deterministicKey: topology.deterministicKey };
}

function foldedPosition(topology: RnaSecondaryStructureTopology, index: number): RnaPoint {
  const stem = topology.pairingRegions[0];
  const pairCount = stem?.pairs.length ?? 0;
  const loopRegion = topology.regions.find((item) => item.kind === "hairpin" || item.kind === "internalLoop" || item.kind === "bulge");
  const left = stem?.pairs.findIndex((pair) => pair.left === index) ?? -1;
  const right = stem?.pairs.findIndex((pair) => pair.right === index) ?? -1;
  if (left >= 0) return [-1.08, left * 0.64, 0];
  if (right >= 0) return [1.08, right * 0.64, 0];
  if (loopRegion?.residueIndices.includes(index)) {
    const local = loopRegion.residueIndices.indexOf(index);
    const count = Math.max(1, loopRegion.residueIndices.length - 1);
    const angle = Math.PI - (local / count) * Math.PI;
    return [Math.cos(angle) * 1.08, pairCount * 0.64 + Math.sin(angle) * 0.78, 0];
  }
  const x = topology.unpairedResidues.indexOf(index) % 2 === 0 ? -1.45 : 1.45;
  return [x, (topology.unpairedResidues.indexOf(index) + 1) * 0.64, 0.05];
}

function samplesFor(topology: RnaSecondaryStructureTopology): RnaResidueSample[] {
  const state: RnaTopologyState = toAgentBTopology(topology);
  const samples = sampleCanonicalRna(topology.sequence.length, { topology: "secondary-structure", lod: 2, source: "canonical-procedural", topologyState: state }, topology.sequence);
  const backboneByIndex = new Map(samples.map((sample) => [sample.index, foldedPosition(topology, sample.index)]));
  return samples.map((sample) => {
    const backbone = backboneByIndex.get(sample.index) ?? [0, 0, 0];
    const partner = sample.pairedWith === undefined ? undefined : backboneByIndex.get(sample.pairedWith);
    const basePosition: RnaPoint = partner
      ? [backbone[0] + (partner[0] - backbone[0]) * 0.18, backbone[1] + (partner[1] - backbone[1]) * 0.08, backbone[2] + 0.18]
      : [backbone[0] + (backbone[0] < 0 ? 0.18 : -0.18), backbone[1] + 0.18, backbone[2] + 0.16];
    const ribose: RnaPoint = [backbone[0], backbone[1] + 0.12, backbone[2] + 0.08];
    return { ...sample, backbone, ribose, basePosition, fivePrime: backbone, threePrime: backbone };
  });
}

export function createRnaSecondaryStructureSpec(motif: RnaSecondaryStructureMotif, options: BuildOptions = {}): RnaSecondaryStructureTopology {
  return buildTopology(motif, options);
}

export function sampleRnaSecondaryStructure(topology: RnaSecondaryStructureTopology): readonly RnaResidueSample[] {
  return samplesFor(topology);
}

export function deriveRnaSecondaryStructurePresentation(topology: RnaSecondaryStructureTopology, theme: RnaTheme = "dark"): RnaSecondaryStructurePresentation {
  const topologyState = toAgentBTopology(topology);
  const samples = samplesFor(topology);
  const interactions = topology.pairingRegions.flatMap((pairing) => pairing.pairs.map((pair, index) => {
    const classification = classifyRnaPair(pair.pair);
    return { id: `${pairing.id}-${index}`, type: classification.interactionType === "wobble" ? "wobblePair" as const : "hydrogenBond" as const, participants: [pair.left, pair.right] as [number, number], state: "present" as const };
  }));
  const labels = topology.regions.filter((item) => item.label).map((item) => ({ text: item.label!, regionId: item.id }));
  return { motif: topology.motif, representation: canonicalRnaView("secondary-structure"), topology, topologyState, samples, interactions, backboneLinks: topology.continuousChainIndices.slice(1).map((index) => ({ from: index - 1, to: index, type: "continuous" as const })), labels, visualGrammar: { paired: "partner-facing-with-interaction", unpaired: "open-backbone-without-interaction", chemistry: "RNA-ribose-2prime-oh-uracil" }, camera: canonicalRnaView("secondary-structure").camera, materials: rnaMaterialPalette(theme) };
}

export function isValidRnaSecondaryStructurePresentation(presentation: RnaSecondaryStructurePresentation): boolean {
  const { topology } = presentation;
  const expected = topology.sequence.map((_, index) => index);
  const allPairs = topology.pairingRegions.flatMap((item) => item.pairs);
  return presentation.representation.focus === "secondary-structure"
    && topology.continuousChainIndices.every((index, position) => index === expected[position])
    && presentation.backboneLinks.length === Math.max(0, topology.sequence.length - 1)
    && topology.regions.every((item) => item.residueIndices.every((index) => index >= 0 && index < topology.sequence.length))
    && allPairs.every((pair) => pair.left !== pair.right && pair.left >= 0 && pair.right < topology.sequence.length)
    && presentation.samples.every((sample) => [sample.backbone, sample.ribose, sample.basePosition].flat().every(Number.isFinite));
}

export { canonicalRnaPair };
