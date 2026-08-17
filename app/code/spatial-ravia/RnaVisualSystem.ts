import { getDnaSceneCameraContract, type DnaSceneCameraContract } from "./DnaSceneCamera.ts";

export type RnaBase = "A" | "U" | "G" | "C";
export type DnaBase = "A" | "T" | "G" | "C";
export type RnaVisualTopology = "single-stranded" | "secondary-structure" | "paired-region" | "rna-dna-hybrid";
export type RnaVisualSource = "canonical-procedural" | "deposited-coordinates";
export type RnaLodLevel = 1 | 2 | 3 | 4;
export type RnaTheme = "light" | "dark";

export type RnaTopologyRegion = {
  id: string;
  kind: "paired" | "unpaired" | "stem" | "hairpin" | "internalLoop" | "bulge";
  residueIndices: readonly number[];
  partnerIndices?: readonly number[];
};

export type RnaTopologyState = {
  topology: RnaVisualTopology;
  regions: readonly RnaTopologyRegion[];
  pairedResidues: readonly [number, number][];
  unpairedResidues: readonly number[];
  deterministicKey: string;
};

export type RnaVisualState = {
  topology: RnaVisualTopology;
  lod: RnaLodLevel;
  source: RnaVisualSource;
  topologyState?: RnaTopologyState;
  curvature?: number;
  selectedResidues?: readonly number[];
};

export type RnaPoint = readonly [number, number, number];
export type RnaResidueSample = {
  index: number;
  base: RnaBase;
  backbone: RnaPoint;
  ribose: RnaPoint;
  basePosition: RnaPoint;
  fivePrime: RnaPoint;
  threePrime: RnaPoint;
  pairedWith?: number;
  regionId?: string;
};

export type RnaAtom = {
  id: string;
  element: "C" | "N" | "O" | "P";
  residue: RnaBase | "ribose" | "phosphate";
  role: "base" | "baseRing" | "ribose" | "twoPrimeHydroxyl" | "phosphate" | "onePrimeCarbon" | "threePrimeCarbon" | "fivePrimeCarbon" | "fivePrimePhosphate";
  position: RnaPoint;
};

export type RnaBond = {
  id: string;
  from: string;
  to: string;
  type: "covalent" | "phosphodiester" | "hydrogenBond";
};

export type RnaNucleotideChemistry = {
  kind: "RNA";
  base: RnaBase;
  sugar: "ribose";
  hasTwoPrimeHydroxyl: true;
  fivePrimeSide: "phosphate";
  threePrimeSide: "hydroxyl";
  atoms: readonly RnaAtom[];
  bonds: readonly RnaBond[];
};

export type DnaNucleotideChemistry = {
  kind: "DNA";
  base: DnaBase;
  sugar: "deoxyribose";
  hasTwoPrimeHydroxyl: false;
  atoms: readonly RnaAtom[];
  bonds: readonly RnaBond[];
};

export type RnaDnaHybridPlan = {
  mode: "rna-dna-hybrid";
  rna: { strandId: string; chemistry: "ribose-2prime-oh-uracil"; direction: "5primeTo3prime" };
  dna: { strandId: string; chemistry: "deoxyribose-canonical-dna"; direction: "3primeTo5prime" };
  sharedPairing: "hybrid-base-pairs";
  distinctChemistries: true;
};

export type RnaPairKind = "A-U" | "G-C" | "G-U-wobble";
export type RnaPairGeometry = { pair: RnaPairKind; bases: readonly [RnaBase, RnaBase]; interactionType: "canonical" | "wobble"; width: "consistent" | "wobble-adjusted" };

export type RnaDepositedCoordinatePlan = {
  source: "deposited-coordinates";
  provider: "Mol*";
  structureId: string;
  chains: readonly string[];
  residueSelection: readonly { chain: string; residueNumber: number }[];
  representations: readonly ["nucleic-acid-cartoon", "backbone", "nucleotide-ring-block", "local-ball-and-stick"];
  chemistryRemainsRNA: true;
};

export type RnaCameraIntent = "whole-rna" | "nucleotide" | "local-chemistry" | "secondary-structure" | "rna-dna-hybrid" | "processing-region";
export type RnaCameraContract = {
  intent: RnaCameraIntent;
  dnaInfrastructure: DnaSceneCameraContract;
  targetOccupancy: number;
  framing: "global" | "regional" | "local";
};

export const rnaVisualSystem = {
  chemistry: {
    sugar: "ribose" as const,
    hasTwoPrimeHydroxyl: true as const,
    canonicalBases: ["A", "U", "G", "C"] as const,
    fivePrimeSide: "phosphate" as const,
    threePrimeSide: "hydroxyl" as const,
  },
  geometry: {
    backboneSpacing: 1.25,
    riboseOffset: 0.34,
    baseOffset: 0.7,
    basePairWidth: 1.55,
    loopRadius: 1.8,
    bulgeOffset: 0.42,
  },
  representation: {
    backboneRadius: 0.12,
    riboseScale: 0.24,
    baseScale: 0.3,
    atomRadius: 0.11,
    bondRadius: 0.055,
    pairedOpacity: 0.95,
    unpairedOpacity: 0.72,
  },
  colors: {
    backbone: 0x2d8295,
    ribose: 0x8f79b8,
    adenine: 0x4d8db7,
    uracil: 0xc87573,
    guanine: 0xd19a44,
    cytosine: 0x65a477,
    paired: 0xd7c890,
    unpaired: 0x8fa9ad,
    dnaContrast: 0x9b78b7,
  },
  themes: {
    light: { background: 0xf6f8f7, label: 0x17242b },
    dark: { background: 0x020305, label: 0xe5eff2 },
  },
} as const;

export function canonicalRnaView(focus: "whole-rna" | "nucleotide" | "base-pair" | "local-chemistry" | "secondary-structure") {
  const lod: RnaLodLevel = focus === "whole-rna" ? 1 : focus === "secondary-structure" || focus === "base-pair" ? 2 : focus === "nucleotide" ? 3 : 4;
  return {
    focus,
    topology: focus === "base-pair" ? "paired-region" as const : focus === "secondary-structure" ? "secondary-structure" as const : "single-stranded" as const,
    lod,
    source: "canonical-procedural" as const,
    camera: rnaCameraFor(focus === "base-pair" ? "secondary-structure" : focus),
  };
}

export function rnaLodPolicy(level: RnaLodLevel) {
  if (level === 1) return { level, backbone: "clean" as const, nucleotideDetail: "restrained" as const, secondaryStructure: false, localChemistry: false, labels: "termini" as const };
  if (level === 2) return { level, backbone: "clean" as const, nucleotideDetail: "residue" as const, secondaryStructure: true, localChemistry: false, labels: "regions" as const };
  if (level === 3) return { level, backbone: "explicit" as const, nucleotideDetail: "phosphate-ribose-base" as const, secondaryStructure: true, localChemistry: false, labels: "selected" as const };
  return { level, backbone: "explicit" as const, nucleotideDetail: "atom-and-bond" as const, secondaryStructure: true, localChemistry: true, labels: "chemical-sites" as const };
}

export function rnaTopologyState(kind: "singleStrand" | "stem" | "hairpin" | "internalLoop" | "bulge" | "pairedUnpaired", length: number): RnaTopologyState {
  const count = Math.max(1, Math.round(length));
  const midpoint = Math.floor(count / 2);
  const pairCount = kind === "singleStrand" ? 0 : Math.max(0, Math.floor(Math.min(count / 2, kind === "bulge" ? count / 2 - 1 : count / 2)));
  const pairedResidues: [number, number][] = [];
  for (let index = 0; index < pairCount; index += 1) pairedResidues.push([index, count - 1 - index]);
  const pairedSet = new Set(pairedResidues.flat());
  const unpairedResidues = Array.from({ length: count }, (_, index) => index).filter((index) => !pairedSet.has(index));
  const regions: RnaTopologyRegion[] = kind === "singleStrand"
    ? [{ id: "unpaired-region", kind: "unpaired", residueIndices: Array.from({ length: count }, (_, index) => index) }]
    : [{ id: "stem-region", kind: kind === "pairedUnpaired" ? "paired" : kind === "hairpin" ? "stem" : kind, residueIndices: pairedResidues.flat(), partnerIndices: pairedResidues.flatMap(([a, b]) => [a, b]) }];
  if (kind === "hairpin") regions.push({ id: "hairpin-loop", kind: "hairpin", residueIndices: [midpoint] });
  if (kind === "internalLoop") regions.push({ id: "internal-loop", kind: "internalLoop", residueIndices: unpairedResidues });
  if (kind === "bulge") regions.push({ id: "bulge-region", kind: "bulge", residueIndices: unpairedResidues });
  if (kind === "pairedUnpaired") regions.push({ id: "unpaired-region", kind: "unpaired", residueIndices: unpairedResidues });
  return { topology: kind === "singleStrand" ? "single-stranded" : "secondary-structure", regions, pairedResidues, unpairedResidues, deterministicKey: `${kind}:${count}` };
}

export function sampleCanonicalRna(length: number, state: RnaVisualState, sequence?: readonly RnaBase[]): RnaResidueSample[] {
  const count = Math.max(1, Math.round(length));
  const topology = state.topologyState ?? rnaTopologyState(state.topology === "single-stranded" ? "singleStrand" : "pairedUnpaired", count);
  const regionByResidue = new Map(topology.regions.flatMap((region) => region.residueIndices.map((index) => [index, region.id] as const)));
  const pairByResidue = new Map(topology.pairedResidues.flatMap(([a, b]) => [[a, b], [b, a]] as const));
  const curvature = Math.max(0, state.curvature ?? 0.16);
  return Array.from({ length: count }, (_, index) => {
    const t = index / Math.max(1, count - 1);
    const x = (index - (count - 1) / 2) * rnaVisualSystem.geometry.backboneSpacing;
    const y = Math.sin(t * Math.PI * 1.35) * curvature * 2.4 + Math.sin(t * Math.PI * 2.2) * 0.12;
    const bulge = topology.regions.some((region) => region.kind === "bulge" && region.residueIndices.includes(index)) ? rnaVisualSystem.geometry.bulgeOffset : 0;
    const backbone: RnaPoint = [x, y + bulge, 0];
    const ribose: RnaPoint = [x, y + bulge + rnaVisualSystem.geometry.riboseOffset, 0.08];
    const basePosition: RnaPoint = [x, y + bulge + rnaVisualSystem.geometry.baseOffset, 0.16];
    const pairedWith = pairByResidue.get(index);
    return { index, base: sequence?.[index] ?? (["A", "U", "G", "C"] as const)[index % 4], backbone, ribose, basePosition, fivePrime: backbone, threePrime: backbone, pairedWith, regionId: regionByResidue.get(index) };
  });
}

export function canonicalRnaNucleotide(base: RnaBase, origin: RnaPoint = [0, 0, 0]): RnaNucleotideChemistry {
  const [x, y, z] = origin;
  const atom = (id: string, element: RnaAtom["element"], role: RnaAtom["role"], dx: number, dy: number, dz = 0): RnaAtom => ({ id, element, residue: role === "base" ? base : role === "phosphate" || role === "fivePrimePhosphate" ? "phosphate" : "ribose", role, position: [x + dx, y + dy, z + dz] });
  const atoms: RnaAtom[] = [atom("c1-prime", "C", "onePrimeCarbon", 0, 0), atom("c3-prime", "C", "threePrimeCarbon", -0.18, -0.38), atom("c5-prime", "C", "fivePrimeCarbon", -0.2, 0.42), atom("o2-prime", "O", "twoPrimeHydroxyl", 0.22, -0.42), atom("o3-prime", "O", "threePrimeCarbon", -0.5, -0.48), atom("o5-prime", "O", "fivePrimePhosphate", -0.48, 0.5), atom("phosphate", "P", "phosphate", -0.85, 0.5), atom("base-anchor", base === "A" || base === "G" ? "N" : "C", "base", 0.55, 0.1)];
  const bonds: RnaBond[] = [
    { id: "ribose-ring", from: "c1-prime", to: "c3-prime", type: "covalent" },
    { id: "ribose-2prime-oh", from: "c3-prime", to: "o2-prime", type: "covalent" },
    { id: "base-attachment", from: "c1-prime", to: "base-anchor", type: "covalent" },
    { id: "five-prime-phosphate", from: "c5-prime", to: "phosphate", type: "phosphodiester" },
  ];
  return { kind: "RNA", base, sugar: "ribose", hasTwoPrimeHydroxyl: true, fivePrimeSide: "phosphate", threePrimeSide: "hydroxyl", atoms, bonds };
}

export function canonicalRnaPair(pair: RnaPairKind): RnaPairGeometry {
  if (pair === "A-U") return { pair, bases: ["A", "U"], interactionType: "canonical", width: "consistent" };
  if (pair === "G-C") return { pair, bases: ["G", "C"], interactionType: "canonical", width: "consistent" };
  return { pair, bases: ["G", "U"], interactionType: "wobble", width: "wobble-adjusted" };
}

export function rnaDnaHybridPlan(rnaStrandId = "rna-strand", dnaStrandId = "dna-strand"): RnaDnaHybridPlan {
  return { mode: "rna-dna-hybrid", rna: { strandId: rnaStrandId, chemistry: "ribose-2prime-oh-uracil", direction: "5primeTo3prime" }, dna: { strandId: dnaStrandId, chemistry: "deoxyribose-canonical-dna", direction: "3primeTo5prime" }, sharedPairing: "hybrid-base-pairs", distinctChemistries: true };
}

export function rnaDepositedCoordinatePlan(structureId: string, chains: readonly string[], residueSelection: RnaDepositedCoordinatePlan["residueSelection"] = []): RnaDepositedCoordinatePlan {
  return { source: "deposited-coordinates", provider: "Mol*", structureId, chains, residueSelection, representations: ["nucleic-acid-cartoon", "backbone", "nucleotide-ring-block", "local-ball-and-stick"], chemistryRemainsRNA: true };
}

export function rnaCameraFor(intent: RnaCameraIntent): RnaCameraContract {
  const family = intent === "local-chemistry" || intent === "nucleotide" ? "localChemistry" : intent === "secondary-structure" ? "structure" : intent === "rna-dna-hybrid" ? "transcription" : intent === "processing-region" ? "regulation" : "structure";
  const framing = intent === "whole-rna" ? "global" : intent === "local-chemistry" || intent === "nucleotide" ? "local" : "regional";
  return { intent, dnaInfrastructure: getDnaSceneCameraContract(family), targetOccupancy: framing === "global" ? 0.54 : framing === "local" ? 0.45 : 0.62, framing };
}

export function rnaMaterialPalette(theme: RnaTheme) {
  const base = rnaVisualSystem.themes[theme];
  return { ...base, backbone: rnaVisualSystem.colors.backbone, ribose: rnaVisualSystem.colors.ribose, bases: { A: rnaVisualSystem.colors.adenine, U: rnaVisualSystem.colors.uracil, G: rnaVisualSystem.colors.guanine, C: rnaVisualSystem.colors.cytosine }, dnaContrast: rnaVisualSystem.colors.dnaContrast };
}

export function isFiniteRnaSample(sample: RnaResidueSample) {
  return [sample.backbone, sample.ribose, sample.basePosition, sample.fivePrime, sample.threePrime].flat().every(Number.isFinite);
}
