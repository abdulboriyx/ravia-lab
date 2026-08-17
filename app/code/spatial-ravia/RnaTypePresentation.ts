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
  comparison?: {
    left: RnaTypePresentation;
    right: RnaTypePresentation;
    sharedVisualGrammar: true;
    /** Comparators may resize an object, but must never reshape its topology. */
    scaling: "uniform-whole-object";
    labels: readonly string[];
  };
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
    const pairs: RnaTypePair[] = [[0, 19], [1, 18], [2, 17], [3, 16], [4, 7], [8, 11], [12, 15]].map(([left, right]) => ({ leftStrand: "tRNA", rightStrand: "tRNA", left, right, pair: basesForTrna[left] === "A" ? "A-U" : "G-C" }));
    return {
      type,
      topology: "secondary-structure",
      strandCount: 1,
      sequences: [basesForTrna],
      regions: [
        { id: "acceptor-stem", kind: "acceptorStem", residueIndices: [0, 1, 2, 3, 16, 17, 18, 19], label: "Acceptor stem" },
        { id: "d-arm", kind: "DArm", residueIndices: [4, 5, 6, 7], label: "D arm" },
        { id: "d-loop", kind: "loop", residueIndices: [5, 6], label: "D loop" },
        { id: "anticodon-arm", kind: "anticodonLoop", residueIndices: [8, 9, 10, 11], label: "Anticodon arm" },
        { id: "anticodon-loop", kind: "loop", residueIndices: [9, 10], label: "Anticodon loop" },
        { id: "tpsi-c-arm", kind: "TpsiCArm", residueIndices: [12, 13, 14, 15], label: "TΨC arm" },
        { id: "tpsi-c-loop", kind: "loop", residueIndices: [13, 14], label: "TΨC loop" },
      ],
      pairs,
      continuousChains: [range(0, 19)],
      deterministicKey: "tRNA:cloverleaf:20",
    };
  }
  if (type === "rRNA") {
    const rna = sequence(42);
    const stems = [[0, 41], [1, 40], [2, 39], [7, 17], [8, 16], [9, 15], [21, 31], [22, 30], [23, 29], [33, 37], [34, 36]] as const;
    const pairs: RnaTypePair[] = stems.map(([left, right]) => ({ leftStrand: "rRNA", rightStrand: "rRNA", left, right, pair: rna[left] === "A" || rna[left] === "U" ? "A-U" : "G-C" }));
    return {
      type, topology: "secondary-structure", strandCount: 1, sequences: [rna],
      regions: [
        { id: "rrna-core-stem", kind: "structuredRegion", residueIndices: [0, 1, 2, 3, 4, 5, 6, 38, 39, 40, 41], label: "rRNA core" },
        { id: "rrna-stem-a", kind: "stem", residueIndices: [7, 8, 9, 15, 16, 17], label: "Stem A" },
        { id: "rrna-stem-b", kind: "stem", residueIndices: [21, 22, 23, 29, 30, 31], label: "Stem B" },
        { id: "rrna-stem-c", kind: "stem", residueIndices: [33, 34, 36, 37], label: "Stem C" },
        { id: "rrna-loop-a", kind: "loop", residueIndices: [10, 11, 12, 13, 14] },
        { id: "rrna-loop-b", kind: "loop", residueIndices: [24, 25, 26, 27, 28] },
      ], pairs, continuousChains: [range(0, 41)], deterministicKey: "rRNA:multi-stem:42",
    };
  }
  if (type === "miRNA" && options.precursor) {
    const hairpin = sequence(18);
    const pairs: RnaTypePair[] = range(0, 6).map((left) => ({ leftStrand: "miRNA-precursor", rightStrand: "miRNA-precursor", left, right: 17 - left, pair: hairpin[left] === "A" ? "A-U" : "G-C" }));
    return { type, topology: "secondary-structure", strandCount: 1, sequences: [hairpin], regions: [{ id: "mirna-precursor-stem", kind: "stem", residueIndices: [0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 17], label: "Pre-miRNA stem" }, { id: "mirna-precursor-loop", kind: "loop", residueIndices: [7, 8, 9, 10], label: "Pre-miRNA loop" }], pairs, continuousChains: [range(0, 17)], deterministicKey: "miRNA:precursor-hairpin:18" };
  }
  if (type === "snRNA") {
    const rna = sequence(18);
    const pairs: RnaTypePair[] = [[0, 17], [1, 16], [2, 15], [6, 11], [7, 10]].map(([left, right]) => ({ leftStrand: "snRNA", rightStrand: "snRNA", left, right, pair: rna[left] === "A" || rna[left] === "U" ? "A-U" : "G-C" }));
    return { type, topology: "secondary-structure", strandCount: 1, sequences: [rna], regions: [{ id: "snrna-main-stem", kind: "stem", residueIndices: [0, 1, 2, 15, 16, 17], label: "snRNA fold" }, { id: "snrna-internal-stem", kind: "stem", residueIndices: [6, 7, 10, 11] }, { id: "snrna-loop", kind: "loop", residueIndices: [3, 4, 5, 12, 13, 14] }], pairs, continuousChains: [range(0, 17)], deterministicKey: "snRNA:compact-fold:18" };
  }
  const length = type === "mRNA" ? 36 : type === "miRNA" || type === "regulatorySmallRNA" ? 8 : 14;
  const kind = type === "mRNA" ? "coding" : type === "miRNA" || type === "regulatorySmallRNA" ? "regulatory" : "structuredRegion";
  return { type, topology: "single-stranded", strandCount: 1, sequences: [sequence(length)], regions: [{ id: `${type}-primary-region`, kind, residueIndices: range(0, length - 1), label: type === "mRNA" ? "mRNA coding region" : undefined }], pairs: [], continuousChains: [range(0, length - 1)], deterministicKey: `${type}:${length}:${type === "mRNA" ? "extended-transcript" : "small-rna"}` };
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
  const labelCap = topology.type === "tRNA" ? 2 : 1;
  return topology.regions.filter((region) => region.label).slice(0, labelCap).map((region) => ({ text: region.label!, regionId: region.id }));
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
  return { ...presentation, comparison: deriveRnaTypeComparison(presentation, right) };
}

/** Reuses fully derived standalone objects; comparison code may only scale them uniformly. */
export function deriveRnaTypeComparison(left: RnaTypePresentation, right: RnaTypePresentation): NonNullable<RnaTypePresentation["comparison"]> {
  return { left, right, sharedVisualGrammar: true, scaling: "uniform-whole-object", labels: [left.type, right.type] };
}

export function isValidRnaTypePresentation(presentation: RnaTypePresentation): boolean {
  return presentation.chemistry === "shared-rna-ribose-2prime-oh-uracil"
    && presentation.strands.length === presentation.topology.strandCount
    && presentation.topology.continuousChains.length === presentation.topology.strandCount
    && presentation.strands.every((strand) => strand.samples.every((sample) => [sample.backbone, sample.ribose, sample.basePosition].flat().every(Number.isFinite)))
    && (!presentation.comparison || (presentation.comparison.left.type !== presentation.comparison.right.type && presentation.comparison.scaling === "uniform-whole-object" && presentation.comparison.labels.length === 2))
    && (presentation.grounding.mode === "procedural" ? presentation.grounding.status === "educational-procedural" : Boolean(presentation.grounding.deposited));
}
