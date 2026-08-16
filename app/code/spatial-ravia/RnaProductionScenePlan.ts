import { rnaTopologyState, sampleCanonicalRna, type RnaPoint, type RnaResidueSample } from "./RnaVisualSystem.ts";
import type { RnaPresentationRoute, RnaSharedSubstratePresentation } from "./RnaPresentationRouter.ts";
import type { RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import type { RnaTypePresentation } from "./RnaTypePresentation.ts";
import type { RnaPairingPresentation } from "./RnaPairingPresentation.ts";
import type { RnaSecondaryStructurePresentation } from "./RnaSecondaryStructurePresentation.ts";
import type { RnaProcessingPresentation } from "./RnaProcessingPresentation.ts";
import type { RnaDegradationPresentation } from "./RnaDegradationPresentation.ts";
import { getDnaLocalChemistryPlan } from "./DnaLocalChemistryRepresentation.ts";

export type RnaProductionStrand = {
  id: string;
  kind: "RNA" | "DNA";
  samples: readonly RnaResidueSample[];
};

export type RnaProductionLabel = {
  text: string;
  position: RnaPoint;
  anchor: string;
};

export type RnaProductionInteraction = {
  id: string;
  type: "hydrogenBond" | "wobblePair" | "phosphodiester" | "highlight";
  from: RnaPoint;
  to: RnaPoint;
};

export type RnaProductionAtom = {
  id: string;
  element: "C" | "N" | "O" | "P";
  role: string;
  position: RnaPoint;
};

export type RnaProductionBond = {
  id: string;
  from: RnaPoint;
  to: RnaPoint;
  type: "covalent" | "phosphodiester" | "hydrogenBond";
};

export type RnaProductionTerminalMarker = {
  id: string;
  kind: "fivePrimeCap" | "polyATail" | "exposedEnd";
  position: RnaPoint;
};

export type RnaProductionScenePlan = {
  family: RnaPresentationRoute["family"];
  cameraIntent: RnaPresentationRoute["cameraIntent"];
  structuralMode: "procedural" | "local-chemistry";
  strands: readonly RnaProductionStrand[];
  atoms: readonly RnaProductionAtom[];
  bonds: readonly RnaProductionBond[];
  comparisonAtoms: readonly RnaProductionAtom[];
  comparisonBonds: readonly RnaProductionBond[];
  interactions: readonly RnaProductionInteraction[];
  terminalMarkers: readonly RnaProductionTerminalMarker[];
  labels: readonly RnaProductionLabel[];
  highlightedIndices: readonly number[];
  metadata: { owner: string; representationMode: string; grounding: string };
};

function point(point: readonly number[]): RnaPoint {
  return [point[0] ?? 0, point[1] ?? 0, point[2] ?? 0];
}

function offsetSamples(samples: readonly RnaResidueSample[], offset: RnaPoint, baseDirection = 0): RnaResidueSample[] {
  return samples.map((sample) => {
    const translate = (value: RnaPoint, extra = 0): RnaPoint => [value[0] + offset[0], value[1] + offset[1], value[2] + offset[2] + extra];
    return { ...sample, backbone: translate(sample.backbone), ribose: translate(sample.ribose), basePosition: translate(sample.basePosition, baseDirection), fivePrime: translate(sample.fivePrime), threePrime: translate(sample.threePrime) };
  });
}

function compactTnucleotideLayout(samples: readonly RnaResidueSample[]): RnaResidueSample[] {
  if (samples.length < 12) return [...samples];
  return samples.map((sample, index) => {
    const arm = index < 5 ? 0 : index < 10 ? 1 : 2;
    const local = index - arm * 5;
    const angle = (local / 4) * Math.PI - Math.PI / 2 + arm * (Math.PI * 2 / 3);
    const radius = arm === 0 ? 1.25 : 0.92;
    const backbone: RnaPoint = [Math.cos(angle) * radius, Math.sin(angle) * radius, arm === 0 ? 0.12 : -0.08];
    const ribose: RnaPoint = [backbone[0] * 0.94, backbone[1] * 0.94, backbone[2] + 0.08];
    const basePosition: RnaPoint = [backbone[0] * 1.12, backbone[1] * 1.12, backbone[2] + 0.16];
    return { ...sample, backbone, ribose, basePosition, fivePrime: backbone, threePrime: backbone };
  });
}

function foldedRnaLayout(samples: readonly RnaResidueSample[]): RnaResidueSample[] {
  return samples.map((sample, index) => {
    const t = index / Math.max(1, samples.length - 1);
    const backbone: RnaPoint = [(t - 0.5) * 3.8, Math.sin(t * Math.PI * 3) * 0.62, Math.cos(t * Math.PI * 2) * 0.18];
    const ribose: RnaPoint = [backbone[0], backbone[1] + 0.12, backbone[2] + 0.08];
    const basePosition: RnaPoint = [backbone[0], backbone[1] + 0.3, backbone[2] + 0.16];
    return { ...sample, backbone, ribose, basePosition, fivePrime: backbone, threePrime: backbone };
  });
}

function samplesForRoute(route: RnaPresentationRoute): RnaProductionStrand[] {
  const presentation = route.presentation;
  if (route.family === "structure" || route.family === "nascentTranscript") {
    const shared = presentation as RnaSharedSubstratePresentation;
    return [{ id: "rna-strand", kind: "RNA", samples: shared.samples }];
  }
  if (route.family === "typesFunctions") {
    const typed = presentation as RnaTypePresentation;
    return typed.strands.map((strand, index) => ({ id: strand.id, kind: "RNA" as const, samples: route.rnaType === "tRNA" ? compactTnucleotideLayout(strand.samples) : route.rnaType === "rRNA" ? foldedRnaLayout(strand.samples) : index === 0 ? [...strand.samples] : offsetSamples(strand.samples, [0, 0, -0.7], -0.2) }));
  }
  if (route.family === "pairingHybridization") {
    const pairing = presentation as RnaPairingPresentation;
    const length = pairing.spec.length;
    const state = rnaTopologyState("pairedUnpaired", length);
    const baseSamples = sampleCanonicalRna(length, { topology: "secondary-structure", lod: 2, source: "canonical-procedural", topologyState: state });
    return pairing.strands.map((strand, index) => ({ id: strand.id, kind: strand.kind, samples: offsetSamples(baseSamples, [0, 0, index === 0 ? 0.72 : -0.72], index === 0 ? 0.16 : -0.16) }));
  }
  if (route.family === "secondaryStructure") {
    const secondary = presentation as RnaSecondaryStructurePresentation;
    return [{ id: "rna-secondary-chain", kind: "RNA", samples: secondary.samples }];
  }
  if (route.family === "processing") {
    const processing = presentation as RnaProcessingPresentation;
    return [{ id: "mRNA-transcript", kind: "RNA", samples: processing.samples }];
  }
  if (route.family === "degradationStability") {
    const degradation = presentation as RnaDegradationPresentation;
    return [{ id: "rna-degradation-chain", kind: "RNA", samples: degradation.samples }];
  }
  return [];
}

function localChemistryData(route: RnaPresentationRoute): { atoms: RnaProductionAtom[]; bonds: RnaProductionBond[]; comparisonAtoms: RnaProductionAtom[]; comparisonBonds: RnaProductionBond[] } {
  if (route.family !== "localChemistry") return { atoms: [], bonds: [], comparisonAtoms: [], comparisonBonds: [] };
  const chemistry = route.presentation as RnaLocalChemistryPresentation;
  const atoms = chemistry.atoms.map((atom) => ({ id: atom.id, element: atom.element, role: atom.role, position: atom.position }));
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const bonds = chemistry.bonds.map((bond) => ({ id: bond.id, from: byId.get(bond.from)?.position ?? [0, 0, 0] as RnaPoint, to: byId.get(bond.to)?.position ?? [0, 0, 0] as RnaPoint, type: bond.type === "hydrogenBond" ? "hydrogenBond" as const : bond.type === "phosphodiester" ? "phosphodiester" as const : "covalent" as const }));
  const comparisonAtoms: RnaProductionAtom[] = [];
  const comparisonBonds: RnaProductionBond[] = [];
  if (chemistry.comparison) {
    const dna = getDnaLocalChemistryPlan("nucleotide");
    comparisonAtoms.push(...dna.atoms.map((atom) => ({ id: `dna-${atom.id}`, element: atom.element, role: atom.role, position: [atom.position[0] + 3.2, atom.position[1], atom.position[2]] as RnaPoint })));
    const dnaById = new Map(comparisonAtoms.map((atom) => [atom.id, atom]));
    comparisonBonds.push(...dna.bonds.map((bond) => ({ id: `dna-${bond.id}`, from: dnaById.get(`dna-${bond.from}`)?.position ?? [3.2, 0, 0], to: dnaById.get(`dna-${bond.to}`)?.position ?? [3.2, 0, 0], type: bond.kind === "hydrogen" ? "hydrogenBond" as const : "covalent" as const })));
  }
  return { atoms, bonds, comparisonAtoms, comparisonBonds };
}

function terminalMarkers(route: RnaPresentationRoute, strands: readonly RnaProductionStrand[]): RnaProductionTerminalMarker[] {
  const samples = strands[0]?.samples ?? [];
  if (route.family === "processing") {
    const processing = route.presentation as RnaProcessingPresentation;
    return processing.terminalFeatures.map((feature) => ({ id: feature.id, kind: feature.kind, position: [samples[feature.attachedToDisplayIndex]?.backbone[0] ?? 0, (samples[feature.attachedToDisplayIndex]?.backbone[1] ?? 0) + 0.32, (samples[feature.attachedToDisplayIndex]?.backbone[2] ?? 0) + 0.28] as RnaPoint }));
  }
  if (route.family === "degradationStability") {
    const degradation = route.presentation as RnaDegradationPresentation;
    return degradation.exposedEnds.map((end) => ({ id: end.id, kind: "exposedEnd" as const, position: [samples[end.index]?.backbone[0] ?? 0, (samples[end.index]?.backbone[1] ?? 0) + 0.28, (samples[end.index]?.backbone[2] ?? 0) + 0.28] as RnaPoint }));
  }
  return [];
}

function overlayForRoute(route: RnaPresentationRoute, strands: readonly RnaProductionStrand[]): { interactions: RnaProductionInteraction[]; highlightedIndices: number[] } {
  const first = strands[0]?.samples ?? [];
  if (route.family === "pairingHybridization" && strands.length === 2) {
    const pairing = route.presentation as RnaPairingPresentation;
    return { interactions: pairing.interactions.map((interaction, index) => ({ id: interaction.id, type: pairing.classification.interactionType === "wobble" ? "wobblePair" as const : "hydrogenBond" as const, from: strands[0].samples[index % strands[0].samples.length].basePosition, to: strands[1].samples[index % strands[1].samples.length].basePosition })), highlightedIndices: [] };
  }
  if (route.family === "secondaryStructure") {
    const secondary = route.presentation as RnaSecondaryStructurePresentation;
    return {
      interactions: secondary.interactions.flatMap((interaction) => {
        const from = first[interaction.participants[0]]?.basePosition;
        const to = first[interaction.participants[1]]?.basePosition;
        return from && to ? [{ id: interaction.id, type: interaction.type, from, to }] : [];
      }),
      highlightedIndices: secondary.topology.pairedResidues.flat(),
    };
  }
  if (route.family === "processing") {
    const processing = route.presentation as RnaProcessingPresentation;
    return { interactions: processing.topology.spliceJunctions.map((junction) => ({ id: junction.id, type: "highlight" as const, from: first[junction.fromDisplayIndex]?.backbone ?? [0, 0, 0], to: first[junction.toDisplayIndex]?.backbone ?? [0, 0, 0] })), highlightedIndices: processing.topology.regions.flatMap((region) => region.displayIndices) };
  }
  if (route.family === "degradationStability") {
    const degradation = route.presentation as RnaDegradationPresentation;
    return { interactions: degradation.backboneLinks.filter((link) => link.targeted || link.state === "absent").map((link) => ({ id: link.id, type: "highlight" as const, from: first[link.leftIndex]?.backbone ?? [0, 0, 0], to: first[link.rightIndex]?.backbone ?? [0, 0, 0] })), highlightedIndices: degradation.fragments.filter((fragment) => fragment.retained).flatMap((fragment) => fragment.indices) };
  }
  return { interactions: [], highlightedIndices: [] };
}

function labelsForRoute(route: RnaPresentationRoute, strands: readonly RnaProductionStrand[], atoms: readonly RnaProductionAtom[]): RnaProductionLabel[] {
  const samples = strands[0]?.samples ?? [];
  if (route.family === "secondaryStructure") {
    const secondary = route.presentation as RnaSecondaryStructurePresentation;
    const requestedPairingLabels = route.sourceSpec.requiredEntities.includes("pairedRegion") || route.sourceSpec.requiredEntities.includes("unpairedRegion");
    const candidateRegions = secondary.topology.regions.filter((region) => region.label && region.label !== "Stem");
    const chosen = requestedPairingLabels
      ? [
        { text: "Paired", indices: secondary.topology.pairedResidues.flat() },
        { text: "Unpaired", indices: secondary.topology.unpairedResidues },
      ]
      : [{ text: "Stem", indices: secondary.topology.pairingRegions[0]?.pairs.flatMap((pair) => [pair.left, pair.right]) ?? [] }, ...candidateRegions.slice(0, 1).map((region) => ({ text: region.label ?? "Loop", indices: region.residueIndices }))];
    return chosen.map((label, index) => {
      const positions = label.indices.map((residue) => samples[residue]?.backbone).filter((position): position is RnaPoint => Boolean(position));
      const center = positions.reduce((sum, position) => [sum[0] + position[0], sum[1] + position[1], sum[2] + position[2]] as RnaPoint, [0, 0, 0]);
      const divisor = Math.max(1, positions.length);
      const averaged: RnaPoint = [center[0] / divisor, center[1] / divisor, center[2] / divisor];
      const offset: RnaPoint = label.text === "Stem" || label.text === "Paired" ? [-0.32, 0, 0.28] : [0, 0.22, 0.28];
      return { text: label.text, position: [averaged[0] + offset[0], averaged[1] + offset[1], averaged[2] + offset[2]], anchor: `secondary-label-${index}` };
    });
  }
  const anchor = samples[Math.floor(samples.length / 2)]?.backbone ?? atoms[0]?.position ?? [0, 0, 0];
  return route.labels.slice(0, 8).map((text, index) => ({ text, position: [anchor[0], anchor[1] + 0.35 + index * 0.18, anchor[2] + 0.3] as RnaPoint, anchor: `route-label-${index}` }));
}

export function deriveProductionRnaScenePlan(route: RnaPresentationRoute): RnaProductionScenePlan {
  const strands = samplesForRoute(route);
  const local = localChemistryData(route);
  const overlay = overlayForRoute(route, strands);
  return { family: route.family, cameraIntent: route.cameraIntent, structuralMode: route.family === "localChemistry" ? "local-chemistry" : "procedural", strands, atoms: local.atoms, bonds: local.bonds, comparisonAtoms: local.comparisonAtoms, comparisonBonds: local.comparisonBonds, interactions: overlay.interactions, terminalMarkers: terminalMarkers(route, strands), labels: labelsForRoute(route, strands, [...local.atoms, ...local.comparisonAtoms]), highlightedIndices: overlay.highlightedIndices, metadata: { owner: route.owner, representationMode: route.representationMode, grounding: route.groundingStatus } };
}
