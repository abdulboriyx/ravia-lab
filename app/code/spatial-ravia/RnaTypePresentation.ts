import type { RnaSceneSpec } from "./rna-contract.ts";
import {
  canonicalRnaView,
  rnaCameraFor,
  rnaDepositedCoordinatePlan,
  rnaMaterialPalette,
  sampleCanonicalRna,
  type RnaBase,
  type RnaCameraIntent,
  type RnaDepositedCoordinatePlan,
  type RnaResidueSample,
  type RnaTheme,
  type RnaTopologyState,
  type RnaVisualTopology,
} from "./RnaVisualSystem.ts";

export type RnaTypeIdentity = "generic" | "mRNA" | "tRNA" | "rRNA" | "miRNA" | "siRNA" | "snRNA" | "regulatorySmallRNA";
export type RnaTypeGrounding = "procedural" | "deposited";

export type RnaTypeRegion = {
  id: string;
  kind: "coding" | "untranslated" | "acceptorStem" | "anticodonLoop" | "DArm" | "TpsiCArm" | "stem" | "loop" | "regulatory" | "duplex" | "structuredRegion";
  residueIndices: readonly number[];
  label?: string;
};

export type RnaTypePair = {
  leftStrand: string;
  rightStrand: string;
  left: number;
  right: number;
  pair: "A-U" | "G-C" | "G-U-wobble";
};

export type RnaTypeTopology = {
  type: RnaTypeIdentity;
  topology: RnaVisualTopology;
  strandCount: number;
  sequences: readonly (readonly RnaBase[])[];
  regions: readonly RnaTypeRegion[];
  pairs: readonly RnaTypePair[];
  continuousChains: readonly (readonly number[])[];
  deterministicKey: string;
};

export type RnaTypeStrandPresentation = {
  id: string;
  samples: readonly RnaResidueSample[];
  direction: "5primeTo3prime";
};

export type RnaTypeGroundingInfo = {
  mode: RnaTypeGrounding;
  status: "experimentally-grounded" | "educational-procedural";
  deposited?: RnaDepositedCoordinatePlan;
};

export type RnaTypePresentationPolicy = {
  type: RnaTypeIdentity;
  topology: RnaVisualTopology;
  cameraIntent: RnaCameraIntent;
  view: ReturnType<typeof canonicalRnaView>["focus"];
  lod: 1 | 2 | 3;
  targetOccupancy: number;
};

export type RnaTypePresentation = {
  type: RnaTypeIdentity;
  topology: RnaTypeTopology;
  strands: readonly RnaTypeStrandPresentation[];
  representation: ReturnType<typeof canonicalRnaView>;
  policy: RnaTypePresentationPolicy;
  grounding: RnaTypeGroundingInfo;
  labels: readonly { text: string; regionId?: string }[];
  processingPlaceholders: readonly ("fivePrimeCap" | "polyATail")[];
  chemistry: "shared-rna-ribose-2prime-oh-uracil";
  materials: ReturnType<typeof rnaMaterialPalette>;
  comparison?: { left: RnaTypePresentation; right: RnaTypePresentation; sharedVisualGrammar: true };
};

type TypeOptions = {
  precursor?: boolean;
  deposited?: { structureId: string; chains: readonly string[]; residueSelection?: RnaDepositedCoordinatePlan["residueSelection"] };
  theme?: RnaTheme;
};

const bases = ["A", "U", "G", "C"] as const;
const range = (start: number, end: number): number[] => Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
const sequence = (length: number): RnaBase[] => Array.from({ length }, (_, index) => bases[index % bases.length]);
const complement = (base: RnaBase): RnaBase => base === "A" ? "U" : base === "U" ? "A" : base === "G" ? "C" : "G";

function pairedSequence(length: number): { left: RnaBase[]; right: RnaBase[]; pairs: RnaTypePair[] } {
  const left = sequence(length);
  const right = left.map(complement).reverse();
  const pairs = left.map((base, index) => ({ leftStrand: "rna-1", rightStrand: "rna-2", left: index, right: length - 1 - index, pair: base === "A" ? "A-U" as const : base === "G" ? "G-C" as const : base === "C" ? "G-C" as const : "A-U" as const }));
  return { left, right, pairs };
}

function topologyFor(type: RnaTypeIdentity, options: TypeOptions = {}): RnaTypeTopology {
  if (type === "siRNA") {
    const duplex = pairedSequence(12);
    return { type, topology: "paired-region", strandCount: 2, sequences: [duplex.left, duplex.right], regions: [{ id: "siRNA-duplex", kind: "duplex", residueIndices: range(0, 11), label: "siRNA duplex" }], pairs: duplex.pairs, continuousChains: [range(0, 11), range(0, 11)], deterministicKey: "siRNA:duplex:12" };
  }
  if (type === "tRNA") {
    const basesForTrna = sequence(20);
    const pairs: RnaTypePair[] = [[0, 19], [1, 18], [2, 17], [3, 16], [5, 14], [6, 13], [8, 11], [9, 10]].map(([left, right]) => ({ leftStrand: "tRNA", rightStrand: "tRNA", left, right, pair: basesForTrna[left] === "A" ? "A-U" : "G-C" }));
    return { type, topology: "secondary-structure", strandCount: 1, sequences: [basesForTrna], regions: [{ id: "acceptor-stem", kind: "acceptorStem", residueIndices: [0, 1, 2, 3, 16, 17, 18, 19], label: "Acceptor stem" }, { id: "d-arm", kind: "DArm", residueIndices: [4, 5, 6, 7], label: "D arm" }, { id: "anticodon-loop", kind: "anticodonLoop", residueIndices: [8, 9, 10, 11], label: "Anticodon loop" }, { id: "tpsi-c-arm", kind: "TpsiCArm", residueIndices: [12, 13, 14, 15], label: "TΨC arm" }], pairs, continuousChains: [range(0, 19)], deterministicKey: "tRNA:cloverleaf:20" };
  }
  if (type === "rRNA") {
    const rna = sequence(30);
    const pairs: RnaTypePair[] = [[0, 29], [1, 28], [5, 24], [6, 23], [12, 17], [13, 16]].map(([left, right]) => ({ leftStrand: "rRNA", rightStrand: "rRNA", left, right, pair: rna[left] === "A" ? "A-U" : "G-C" }));
    return { type, topology: "secondary-structure", strandCount: 1, sequences: [rna], regions: [{ id: "rrna-folded-region-1", kind: "structuredRegion", residueIndices: [0, 1, 2, 3, 4, 24, 25, 26, 27, 28, 29], label: "Folded rRNA region" }, { id: "rrna-folded-region-2", kind: "structuredRegion", residueIndices: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], label: "Folded rRNA region" }], pairs, continuousChains: [range(0, 29)], deterministicKey: "rRNA:multi-stem:30" };
  }
  if (type === "miRNA" && options.precursor) {
    const hairpin = sequence(18);
    const pairs: RnaTypePair[] = range(0, 6).map((left) => ({ leftStrand: "miRNA-precursor", rightStrand: "miRNA-precursor", left, right: 17 - left, pair: hairpin[left] === "A" ? "A-U" : "G-C" }));
    return { type, topology: "secondary-structure", strandCount: 1, sequences: [hairpin], regions: [{ id: "mirna-precursor-stem", kind: "stem", residueIndices: [0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 17], label: "Pre-miRNA stem" }, { id: "mirna-precursor-loop", kind: "loop", residueIndices: [7, 8, 9, 10], label: "Pre-miRNA loop" }], pairs, continuousChains: [range(0, 17)], deterministicKey: "miRNA:precursor-hairpin:18" };
  }
  const length = type === "mRNA" ? 24 : type === "snRNA" ? 16 : type === "miRNA" || type === "regulatorySmallRNA" ? 8 : 14;
  const kind = type === "mRNA" ? "coding" : type === "miRNA" || type === "regulatorySmallRNA" ? "regulatory" : "structuredRegion";
  return { type, topology: type === "snRNA" ? "secondary-structure" : "single-stranded", strandCount: 1, sequences: [sequence(length)], regions: [{ id: `${type}-primary-region`, kind, residueIndices: range(0, length - 1), label: type === "mRNA" ? "Coding-region context" : undefined }], pairs: [], continuousChains: [range(0, length - 1)], deterministicKey: `${type}:${length}:${type === "mRNA" ? "single-stranded" : "small-rna"}` };
}

export function rnaTypeTopology(type: RnaTypeIdentity, options: TypeOptions = {}): RnaTypeTopology {
  return topologyFor(type, options);
}

export function rnaTypeRepresentationPolicy(type: RnaTypeIdentity, options: { precursor?: boolean } = {}): RnaTypePresentationPolicy {
  if (type === "mRNA") return { type, topology: "single-stranded", cameraIntent: "whole-rna", view: "whole-rna", lod: 1, targetOccupancy: 0.58 };
  if (type === "siRNA") return { type, topology: "paired-region", cameraIntent: "secondary-structure", view: "base-pair", lod: 2, targetOccupancy: 0.52 };
  if (type === "miRNA" && !options.precursor) return { type, topology: "single-stranded", cameraIntent: "nucleotide", view: "nucleotide", lod: 3, targetOccupancy: 0.44 };
  if (type === "rRNA") return { type, topology: "secondary-structure", cameraIntent: "secondary-structure", view: "secondary-structure", lod: 2, targetOccupancy: 0.6 };
  if (type === "tRNA" || type === "snRNA" || (type === "miRNA" && options.precursor)) return { type, topology: "secondary-structure", cameraIntent: "secondary-structure", view: "secondary-structure", lod: 2, targetOccupancy: 0.54 };
  return { type, topology: "single-stranded", cameraIntent: "whole-rna", view: "whole-rna", lod: 1, targetOccupancy: 0.5 };
}

export function rnaTypeCameraIntent(type: RnaTypeIdentity, options: { precursor?: boolean } = {}): RnaCameraIntent {
  return rnaTypeRepresentationPolicy(type, options).cameraIntent;
}

function topologyStateFor(topology: RnaTypeTopology): RnaTopologyState | undefined {
  if (topology.topology === "single-stranded") return undefined;
  return { topology: topology.topology, regions: topology.regions.map((region) => ({ id: region.id, kind: region.kind === "loop" ? "hairpin" : region.kind === "duplex" ? "paired" : "stem", residueIndices: region.residueIndices, partnerIndices: topology.pairs.map((pair) => pair.left) })), pairedResidues: topology.pairs.map((pair) => [pair.left, pair.right] as [number, number]), unpairedResidues: topology.continuousChains[0].filter((index) => !topology.pairs.some((pair) => pair.left === index || pair.right === index)), deterministicKey: topology.deterministicKey };
}

function strandSamples(topology: RnaTypeTopology, strandIndex: number): RnaTypeStrandPresentation {
  const sequenceForStrand = topology.sequences[strandIndex] ?? topology.sequences[0];
  const state = topologyStateFor(topology);
  const samples = sampleCanonicalRna(sequenceForStrand.length, { topology: topology.topology, lod: topology.topology === "single-stranded" ? 1 : 2, source: "canonical-procedural", topologyState: state }, sequenceForStrand);
  return { id: topology.type === "siRNA" ? `siRNA-strand-${strandIndex + 1}` : topology.type, samples, direction: "5primeTo3prime" };
}

function groundingFor(options: TypeOptions): RnaTypeGroundingInfo {
  if (!options.deposited) return { mode: "procedural", status: "educational-procedural" };
  return { mode: "deposited", status: "experimentally-grounded", deposited: rnaDepositedCoordinatePlan(options.deposited.structureId, options.deposited.chains, options.deposited.residueSelection ?? []) };
}

function labelsFor(topology: RnaTypeTopology): RnaTypePresentation["labels"] {
  return topology.regions.filter((region) => region.label).map((region) => ({ text: region.label!, regionId: region.id }));
}

function placeholdersFor(spec: RnaSceneSpec): RnaTypePresentation["processingPlaceholders"] {
  const placeholders: ("fivePrimeCap" | "polyATail")[] = [];
  if (spec.requiredEntities.includes("cap") || spec.processingState === "capped") placeholders.push("fivePrimeCap");
  if (spec.requiredEntities.includes("polyATail") || spec.processingState === "polyadenylated") placeholders.push("polyATail");
  return placeholders;
}

function createSinglePresentation(type: RnaTypeIdentity, spec: RnaSceneSpec, options: TypeOptions): RnaTypePresentation {
  const precursor = type === "miRNA" && (options.precursor ?? (spec.structuralState === "preMature" || spec.secondaryStructure.motifs.includes("hairpin")));
  const topology = topologyFor(type, { ...options, precursor });
  const policy = rnaTypeRepresentationPolicy(type, { precursor });
  const representation = canonicalRnaView(policy.view);
  return { type, topology, strands: topology.sequences.map((_, index) => strandSamples(topology, index)), representation, policy, grounding: groundingFor(options), labels: labelsFor(topology), processingPlaceholders: placeholdersFor(spec), chemistry: "shared-rna-ribose-2prime-oh-uracil", materials: rnaMaterialPalette(options.theme ?? "dark") };
}

function inferredComparisonType(spec: RnaSceneSpec, primary: RnaTypeIdentity): RnaTypeIdentity | undefined {
  const entities = new Set(spec.requiredEntities);
  if (primary === "mRNA" && entities.has("tRNA")) return "tRNA";
  if (primary === "miRNA" && entities.has("siRNA")) return "siRNA";
  if (primary === "siRNA" && entities.has("miRNA")) return "miRNA";
  if (primary === "tRNA" && entities.has("mRNA")) return "mRNA";
  return undefined;
}

export function deriveRnaTypePresentation(spec: RnaSceneSpec, options: TypeOptions & { compareWith?: RnaTypeIdentity } = {}): RnaTypePresentation {
  const type = spec.rnaType as RnaTypeIdentity;
  const presentation = createSinglePresentation(type, spec, options);
  const compareWith = options.compareWith ?? inferredComparisonType(spec, type);
  if (!compareWith) return presentation;
  const rightSpec: RnaSceneSpec = { ...spec, rnaType: compareWith };
  const right = createSinglePresentation(compareWith, rightSpec, options);
  return { ...presentation, comparison: { left: presentation, right, sharedVisualGrammar: true } };
}

export function isValidRnaTypePresentation(presentation: RnaTypePresentation): boolean {
  return presentation.chemistry === "shared-rna-ribose-2prime-oh-uracil"
    && presentation.strands.length === presentation.topology.strandCount
    && presentation.topology.continuousChains.length === presentation.topology.strandCount
    && presentation.strands.every((strand) => strand.samples.every((sample) => [sample.backbone, sample.ribose, sample.basePosition].flat().every(Number.isFinite)))
    && (presentation.grounding.mode === "procedural" ? presentation.grounding.status === "educational-procedural" : Boolean(presentation.grounding.deposited));
}
