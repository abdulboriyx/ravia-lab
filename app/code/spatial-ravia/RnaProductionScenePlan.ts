import { rnaTopologyState, sampleCanonicalRna, type RnaBase, type RnaPoint, type RnaResidueSample } from "./RnaVisualSystem.ts";
import type { RnaPresentationRoute, RnaSharedSubstratePresentation } from "./RnaPresentationRouter.ts";
import type { NascentTranscriptPresentation } from "./RnaNascentTranscriptPresentation.ts";
import { createRnaLocalChemistryPresentation, type RnaLocalChemistryFocus, type RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import type { RnaTypeIdentity, RnaTypePresentation } from "./RnaTypePresentation.ts";
import { createRnaLocalPairFrame, transformRnaLocalPairPoint, type RnaPairingPresentation } from "./RnaPairingPresentation.ts";
import type { RnaSecondaryStructurePresentation } from "./RnaSecondaryStructurePresentation.ts";
import type { RnaProcessingPresentation } from "./RnaProcessingPresentation.ts";
import type { RnaDegradationPresentation } from "./RnaDegradationPresentation.ts";
import { getDnaLocalChemistryPlan } from "./DnaLocalChemistryRepresentation.ts";

export type RnaProductionStrand = {
  id: string;
  kind: "RNA" | "DNA";
  samples: readonly RnaResidueSample[];
  opacity?: number;
};

export type RnaProductionLabel = {
  text: string;
  position: RnaPoint;
  anchor: string;
  priority?: "primary" | "secondary" | "tertiary";
};

export type RnaProductionInteraction = {
  id: string;
  type: "hydrogenBond" | "wobblePair" | "phosphodiester" | "highlight" | "dnaPair";
  from: RnaPoint;
  to: RnaPoint;
};

export type RnaProductionAtom = {
  id: string;
  element: "C" | "N" | "O" | "P";
  role: string;
  position: RnaPoint;
  emphasis?: "primary" | "supporting";
};

export type RnaProductionBond = {
  id: string;
  from: RnaPoint;
  to: RnaPoint;
  type: "covalent" | "phosphodiester" | "hydrogenBond";
  emphasis?: "primary" | "supporting";
};

export type RnaProductionTerminalMarker = {
  id: string;
  kind: "fivePrimeCap" | "polyATail" | "exposedEnd";
  position: RnaPoint;
};

/** A contiguous processing identity band attached directly to one transcript. */
export type RnaProductionTranscriptSpan = {
  id: string;
  kind: "exon" | "intron";
  strandId: string;
  indices: readonly number[];
  attachedToTranscript: true;
};

export type RnaProductionBounds = { min: RnaPoint; max: RnaPoint; center: RnaPoint; width: number; height: number };

export type RnaProductionComparisonItem = {
  type: RnaTypeIdentity;
  presentation: RnaTypePresentation;
  topology: RnaTypePresentation["topology"];
  representationMode: RnaTypePresentation["representation"]["focus"];
  localBounds: RnaProductionBounds;
  strands: readonly RnaProductionStrand[];
};

export type RnaProductionComparisonLayout = {
  mode: "side-by-side" | "stacked";
  strands: readonly RnaProductionStrand[];
  items: readonly RnaProductionComparisonItem[];
  labels: readonly RnaProductionLabel[];
  interactions: readonly RnaProductionInteraction[];
  bounds: RnaProductionBounds;
};

export type RnaProductionComparison = {
  normalizedScale: true;
  identities: readonly string[];
  wide: RnaProductionComparisonLayout;
  portrait: RnaProductionComparisonLayout;
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
  transcriptSpans: readonly RnaProductionTranscriptSpan[];
  labels: readonly RnaProductionLabel[];
  highlightedIndices: readonly number[];
  localFocus?: RnaLocalChemistryFocus;
  comparison?: RnaProductionComparison;
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

function tRnaCloverleafLayout(samples: readonly RnaResidueSample[]): RnaResidueSample[] {
  if (samples.length < 20) return [...samples];
  const positions: RnaPoint[] = [
    [-0.55, 2.45, 0.08], [-0.45, 2.05, 0.08], [-0.45, 1.65, 0.08], [-0.55, 1.25, 0.08],
    [-0.72, 1.02, 0.04], [-1.05, 0.84, 0.04], [-1.05, 0.48, 0.04], [-0.72, 0.25, 0.04],
    [-0.56, -0.08, 0.04], [-0.44, -0.48, 0.04], [0.02, -0.72, 0.04], [0.42, -0.50, 0.04],
    [0.66, -0.08, 0.04], [1.04, 0.18, 0.04], [1.04, 0.54, 0.04], [0.72, 0.84, 0.04],
    [0.55, 1.25, 0.08], [0.45, 1.65, 0.08], [0.45, 2.05, 0.08], [0.55, 2.45, 0.08],
  ];
  const paired = new Map<number, number>([[0, 19], [1, 18], [2, 17], [3, 16], [4, 7], [8, 11], [12, 15], [19, 0], [18, 1], [17, 2], [16, 3], [7, 4], [11, 8], [15, 12]]);
  return samples.map((sample) => {
    const backbone = positions[sample.index] ?? sample.backbone;
    const partner = paired.get(sample.index);
    const partnerPosition = partner === undefined ? undefined : positions[partner];
    const basePosition = partnerPosition
      ? [backbone[0] + (partnerPosition[0] - backbone[0]) * 0.2, backbone[1] + (partnerPosition[1] - backbone[1]) * 0.2, backbone[2] + 0.2] as RnaPoint
      : [backbone[0] + (backbone[0] < 0 ? -0.2 : 0.2), backbone[1] + (backbone[1] < 0 ? -0.12 : 0.12), backbone[2] + 0.18] as RnaPoint;
    const ribose: RnaPoint = [backbone[0], backbone[1], backbone[2] + 0.12];
    return { ...sample, backbone, ribose, basePosition, pairedWith: partner, fivePrime: backbone, threePrime: backbone };
  });
}

function mrnaIdentityLayout(samples: readonly RnaResidueSample[]): RnaResidueSample[] {
  return samples.map((sample, index) => {
    const t = index / Math.max(1, samples.length - 1);
    const backbone: RnaPoint = [(t - 0.5) * 4.8, Math.sin(t * Math.PI * 2) * 0.16, (index % 3) * 0.035];
    const ribose: RnaPoint = [backbone[0], backbone[1] + 0.12, backbone[2] + 0.08];
    const basePosition: RnaPoint = [backbone[0], backbone[1] + 0.3, backbone[2] + 0.16];
    return { ...sample, backbone, ribose, basePosition, fivePrime: backbone, threePrime: backbone };
  });
}

function foldedRnaLayout(samples: readonly RnaResidueSample[]): RnaResidueSample[] {
  const positions: RnaPoint[] = [
    [-1.65, 1.35, 0.12], [-1.65, 1.02, 0.12], [-1.65, 0.69, 0.12], [-1.42, 0.36, 0.10], [-1.05, 0.16, 0.08], [-0.68, 0.16, 0.08],
    [-0.32, 0.35, 0.08], [-0.12, 0.74, 0.10], [0.22, 0.74, 0.10], [0.56, 0.74, 0.10], [0.88, 0.58, 0.08], [1.03, 0.28, 0.08],
    [0.98, -0.04, 0.08], [0.75, -0.30, 0.08], [0.42, -0.42, 0.08], [0.08, -0.28, 0.10], [-0.24, -0.02, 0.10], [-0.30, 0.30, 0.10],
    [-0.08, 0.56, 0.12], [0.18, 0.98, 0.12], [0.52, 1.24, 0.12], [0.82, 1.46, 0.12], [1.16, 1.46, 0.12], [1.50, 1.46, 0.12],
    [1.78, 1.28, 0.10], [1.92, 0.96, 0.10], [1.86, 0.64, 0.10], [1.62, 0.38, 0.10], [1.34, 0.20, 0.10], [1.16, -0.02, 0.10],
    [1.02, -0.34, 0.10], [1.02, -0.67, 0.10], [0.82, -0.98, 0.08], [0.50, -1.14, 0.08], [0.16, -1.14, 0.08], [-0.14, -1.00, 0.08],
    [-0.36, -0.76, 0.08], [-0.22, -0.52, 0.10], [0.06, -0.38, 0.10], [-0.26, 0.04, 0.12], [-0.62, 0.34, 0.12], [-0.98, 0.62, 0.12],
  ];
  return samples.map((sample, index) => {
    const backbone = positions[index] ?? sample.backbone;
    const ribose: RnaPoint = [backbone[0], backbone[1] + 0.12, backbone[2] + 0.08];
    const basePosition: RnaPoint = [backbone[0], backbone[1] + 0.3, backbone[2] + 0.16];
    return { ...sample, backbone, ribose, basePosition, fivePrime: backbone, threePrime: backbone };
  });
}

function boundsForStrands(strands: readonly RnaProductionStrand[]): RnaProductionBounds {
  const points = strands.flatMap((strand) => strand.samples.flatMap((sample) => [sample.backbone, sample.ribose, sample.basePosition]));
  const min: RnaPoint = [Math.min(...points.map((value) => value[0])), Math.min(...points.map((value) => value[1])), Math.min(...points.map((value) => value[2]))];
  const max: RnaPoint = [Math.max(...points.map((value) => value[0])), Math.max(...points.map((value) => value[1])), Math.max(...points.map((value) => value[2]))];
  return { min, max, center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], width: max[0] - min[0], height: max[1] - min[1] };
}

function normalizeStrands(strands: readonly RnaProductionStrand[], targetCenter: RnaPoint, targetExtent = 2.2): RnaProductionStrand[] {
  const source = boundsForStrands(strands);
  const scale = targetExtent / Math.max(source.width, source.height, 0.001);
  const translate = (value: RnaPoint): RnaPoint => [targetCenter[0] + (value[0] - source.center[0]) * scale, targetCenter[1] + (value[1] - source.center[1]) * scale, targetCenter[2] + (value[2] - source.center[2]) * scale];
  return strands.map((strand) => ({ ...strand, samples: strand.samples.map((sample) => ({ ...sample, backbone: translate(sample.backbone), ribose: translate(sample.ribose), basePosition: translate(sample.basePosition), fivePrime: translate(sample.fivePrime), threePrime: translate(sample.threePrime) })) }));
}

/**
 * Processing comparisons are a two-row figure, rather than an overlaid pair
 * of transcripts.  Normalize each row independently so the shorter mature
 * transcript remains legible while preserving the shared processing topology.
 */
function processingComparisonLayout(before: readonly RnaResidueSample[], after: readonly RnaResidueSample[]): RnaProductionStrand[] {
  const pre: RnaProductionStrand = { id: "pre-mrna-transcript", kind: "RNA", samples: [...before] };
  const mature: RnaProductionStrand = { id: "mature-mrna-transcript", kind: "RNA", samples: [...after] };
  return [
    ...normalizeStrands([pre], [0, 0.78, 0], 3.2),
    ...normalizeStrands([mature], [0, -0.78, 0], 3.2),
  ];
}

/** Keep an exonuclease before/after figure at one molecular scale while
 * centering the shortened retained fragment independently in the lower row. */
function degradationComparisonLayout(full: readonly RnaResidueSample[], retained: readonly RnaResidueSample[]): RnaProductionStrand[] {
  const source = boundsForStrands([{ id: "before", kind: "RNA", samples: [...full] }]);
  const scale = 3.2 / Math.max(source.width, source.height, 0.001);
  const transform = (samples: readonly RnaResidueSample[], rowY: number, centerX: number): RnaResidueSample[] => {
    const row = boundsForStrands([{ id: "row", kind: "RNA", samples: [...samples] }]);
    const move = (value: RnaPoint): RnaPoint => [centerX + (value[0] - row.center[0]) * scale, rowY + (value[1] - row.center[1]) * scale, (value[2] - row.center[2]) * scale];
    return samples.map((sample) => ({ ...sample, backbone: move(sample.backbone), ribose: move(sample.ribose), basePosition: move(sample.basePosition), fivePrime: move(sample.fivePrime), threePrime: move(sample.threePrime) }));
  };
  return [
    { id: "exonuclease-before", kind: "RNA", samples: transform(full, 0.78, 0) },
    { id: "exonuclease-after", kind: "RNA", samples: transform(retained, -0.78, 0) },
  ];
}

function typePresentationStrands(presentation: RnaTypePresentation): RnaProductionStrand[] {
  return presentation.strands.map((strand, index) => ({
    id: strand.id,
    kind: "RNA" as const,
    samples: presentation.type === "tRNA" ? tRnaCloverleafLayout(strand.samples) : presentation.type === "rRNA" ? foldedRnaLayout(strand.samples) : presentation.type === "mRNA" ? mrnaIdentityLayout(strand.samples) : index === 0 ? [...strand.samples] : offsetSamples(strand.samples, [0, 0, -0.7], -0.2),
  }));
}

function comparisonInteractions(items: readonly RnaProductionComparisonItem[]): RnaProductionInteraction[] {
  return items.flatMap((item) => item.topology.pairs.flatMap((pair) => {
    const leftStrand = item.strands.find((strand) => strand.id === pair.leftStrand) ?? item.strands[0];
    const rightStrand = item.strands.find((strand) => strand.id === pair.rightStrand) ?? item.strands[item.strands.length > 1 ? 1 : 0];
    const from = leftStrand?.samples[pair.left]?.basePosition;
    const to = rightStrand?.samples[pair.right]?.basePosition;
    return from && to ? [{ id: `${item.type}-${pair.left}-${pair.right}`, type: pair.pair === "G-U-wobble" ? "wobblePair" as const : "hydrogenBond" as const, from, to }] : [];
  }));
}

function comparisonLayout(objects: readonly RnaProductionComparisonItem[], mode: RnaProductionComparisonLayout["mode"]): RnaProductionComparisonLayout {
  const centers: RnaPoint[] = mode === "side-by-side" ? [[-1.65, 0, 0], [1.65, 0, 0]] : [[0, 1.35, 0], [0, -1.3, 0]];
  const items = objects.map((object, index) => ({ ...object, strands: normalizeStrands(object.strands, centers[index] ?? [0, 0, 0]) }));
  const strands = items.flatMap((item) => item.strands);
  const bounds = boundsForStrands(strands);
  const labels = items.map((item, index) => {
    const itemBounds = boundsForStrands(item.strands);
    return { text: item.type, position: [itemBounds.center[0], itemBounds.max[1] + (mode === "side-by-side" ? 0.35 : index === 0 ? 0.28 : -0.28), 0.32] as RnaPoint, anchor: `comparison-label-${index}` };
  });
  return { mode, strands, items, labels, interactions: comparisonInteractions(items), bounds };
}

function comparisonForRoute(route: RnaPresentationRoute): RnaProductionComparison | undefined {
  if (route.family !== "typesFunctions") return undefined;
  const typed = route.presentation as RnaTypePresentation;
  if (!typed.comparison) return undefined;
  const objects = [typed, typed.comparison.right].map((presentation) => ({
    type: presentation.type,
    presentation,
    topology: presentation.topology,
    representationMode: presentation.representation.focus,
    localBounds: boundsForStrands(typePresentationStrands(presentation)),
    strands: typePresentationStrands(presentation),
  }));
  return { normalizedScale: true, identities: objects.map((object) => object.type), wide: comparisonLayout(objects, "side-by-side"), portrait: comparisonLayout(objects, "stacked") };
}

function samplesForRoute(route: RnaPresentationRoute): RnaProductionStrand[] {
  const presentation = route.presentation;
  if (route.family === "nascentTranscript") {
    const nascent = presentation as unknown as NascentTranscriptPresentation;
    const rna: RnaProductionStrand = { id: "nascent-rna", kind: "RNA", samples: nascent.rna.samples, opacity: 1 };
    const dnaA: RnaProductionStrand = { id: "dna-template-a", kind: "DNA", opacity: nascent.dna.opacity, samples: nascent.dna.samples.map((sample) => ({ index: sample.index, base: (["A", "G", "C", "A"] as const)[sample.index % 4], backbone: sample.strandA, ribose: sample.strandA, basePosition: sample.basePairStart, fivePrime: sample.strandA, threePrime: sample.strandA })) };
    const dnaB: RnaProductionStrand = { id: "dna-template-b", kind: "DNA", opacity: nascent.dna.opacity, samples: nascent.dna.samples.map((sample) => ({ index: sample.index, base: (["C", "A", "G", "C"] as const)[sample.index % 4], backbone: sample.strandB, ribose: sample.strandB, basePosition: sample.basePairEnd, fivePrime: sample.strandB, threePrime: sample.strandB })) };
    return [dnaA, dnaB, rna];
  }
  if (route.family === "structure") {
    const shared = presentation as RnaSharedSubstratePresentation;
    if (route.family === "structure" && route.sourceSpec.scale.level === "nucleotide") {
      const state = rnaTopologyState("singleStrand", 1);
      return [{ id: "rna-nucleotide", kind: "RNA", samples: sampleCanonicalRna(1, { topology: "single-stranded", lod: 3, source: "canonical-procedural", topologyState: state }) }];
    }
    return [{ id: "rna-strand", kind: "RNA", samples: shared.samples }];
  }
  if (route.family === "typesFunctions") {
    const typed = presentation as RnaTypePresentation;
    return typePresentationStrands(typed);
  }
  if (route.family === "pairingHybridization") {
    const pairing = presentation as RnaPairingPresentation;
    // Consume the same pairing primitive used to place donor/acceptor anchors.
    // This replaces the generic overlapping-RNA fallback with a short,
    // antiparallel pair ladder for both RNA duplexes and RNA–DNA hybrids.
    return pairing.strands.map((strand, side) => ({
      id: strand.id,
      kind: strand.kind,
      samples: pairing.geometry.frames.map((pairFrame, index) => {
        const ribose = pairFrame.riboseCenters[side];
        const basePosition = pairFrame.baseCenters[side];
        const backbone: RnaPoint = [ribose[0], ribose[1] - 0.22, ribose[2] - 0.08];
        const direction = strand.direction === "5primeTo3prime" ? 1 : -1;
        return {
          index,
          base: strand.bases[index] as RnaBase,
          backbone,
          ribose,
          basePosition,
          fivePrime: [backbone[0], backbone[1] - direction * 0.24, backbone[2]] as RnaPoint,
          threePrime: [backbone[0], backbone[1] + direction * 0.24, backbone[2]] as RnaPoint,
          pairedWith: index,
          regionId: "pairing-ladder",
        };
      }),
    }));
  }
  if (route.family === "secondaryStructure") {
    const secondary = presentation as RnaSecondaryStructurePresentation;
    return [{ id: "rna-secondary-chain", kind: "RNA", samples: secondary.samples }];
  }
  if (route.family === "processing") {
    const processing = presentation as RnaProcessingPresentation;
    if (processing.mode === "comparison" && processing.comparison) {
      return processingComparisonLayout(processing.comparison.before.samples, processing.comparison.after.samples);
    }
    // Cap views are terminal close-ups, not whole-transcript scenes. Keep the
    // first few residues so the 5′ terminus remains physically attached while
    // the production camera fits the local feature.
    if (processing.mode === "cap") return [{ id: "mRNA-transcript", kind: "RNA", samples: processing.samples.slice(0, 5) }];
    return [{ id: "mRNA-transcript", kind: "RNA", samples: processing.samples }];
  }
  if (route.family === "degradationStability") {
    const degradation = presentation as RnaDegradationPresentation;
    // Stability is a matched local RNA/DNA chemistry comparison, never a
    // whole transcript. All other degradation states mount the authoritative
    // display fragments so an absent linkage cannot be reconnected by a
    // generic backbone path.
    if (degradation.stabilityComparison) return [];
    if (degradation.state === "terminallyDegraded") {
      const retained = degradation.displayFragments.find((fragment) => fragment.retained)?.samples ?? [];
      return degradationComparisonLayout(degradation.samples, retained);
    }
    return degradation.displayFragments
      .filter((fragment) => fragment.retained)
      .map((fragment) => ({ id: fragment.id, kind: "RNA" as const, samples: fragment.samples }));
  }
  return [];
}

function localChemistryData(route: RnaPresentationRoute): { atoms: RnaProductionAtom[]; bonds: RnaProductionBond[]; comparisonAtoms: RnaProductionAtom[]; comparisonBonds: RnaProductionBond[] } {
  const isStructureNucleotide = route.family === "structure" && route.sourceSpec.scale.level === "nucleotide";
  const degradation = route.family === "degradationStability" ? route.presentation as RnaDegradationPresentation : undefined;
  const stabilityChemistry = degradation?.stabilityComparison ? degradation.localChemistry : undefined;
  if (route.family !== "localChemistry" && !isStructureNucleotide && !stabilityChemistry) return { atoms: [], bonds: [], comparisonAtoms: [], comparisonBonds: [] };
  const chemistry = stabilityChemistry ?? (isStructureNucleotide
    ? createRnaLocalChemistryPresentation(route.sourceSpec, { mode: "nucleotide", focus: "nucleotide" })
    : route.presentation as RnaLocalChemistryPresentation);
  const linkage = chemistry.focus === "phosphodiesterLinkage" ? chemistry.phosphodiesterBridges[0] : undefined;
  const primaryAtomIds = new Set(linkage?.primaryPath ?? []);
  const atomIsSupporting = (atom: RnaLocalChemistryPresentation["atoms"][number]) => {
    if (!linkage) return undefined;
    // Keep both riboses present but visually subordinate to the O3′–P–O5′ path.
    return primaryAtomIds.has(atom.id) ? "primary" as const : "supporting" as const;
  };
  const stabilityRoles = new Set(["ribose", "onePrimeCarbon", "twoPrimeHydroxyl", "threePrimeCarbon", "fivePrimeCarbon", "phosphate", "fivePrimePhosphate", "base"]);
  const atoms = chemistry.atoms
    .filter((atom) => !stabilityChemistry || stabilityRoles.has(atom.role))
    .map((atom) => ({ id: atom.id, element: atom.element, role: atom.role, position: atom.position, emphasis: atomIsSupporting(atom) }));
  const byId = new Map(atoms.map((atom) => [atom.id, atom]));
  const bonds: RnaProductionBond[] = chemistry.bonds
    .filter((bond) => !linkage || (bond.type !== "phosphodiester" && (bond.from.includes("rna-nucleotide-1") || bond.from.includes("rna-nucleotide-2")) && (bond.to.includes("rna-nucleotide-1") || bond.to.includes("rna-nucleotide-2"))))
    .map((bond) => ({ id: bond.id, from: byId.get(bond.from)?.position ?? [0, 0, 0] as RnaPoint, to: byId.get(bond.to)?.position ?? [0, 0, 0] as RnaPoint, type: bond.type === "hydrogenBond" ? "hydrogenBond" as const : bond.type === "phosphodiester" ? "phosphodiester" as const : "covalent" as const, emphasis: linkage ? "supporting" as const : undefined }));
  if (linkage) {
    const [o3, phosphate, o5] = linkage.primaryPath;
    const path = [[o3, phosphate], [phosphate, o5]] as const;
    for (const [fromId, toId] of path) {
      const from = byId.get(fromId);
      const to = byId.get(toId);
      if (from && to) bonds.push({ id: `${linkage.id}-${fromId}-${toId}`, from: from.position, to: to.position, type: "phosphodiester", emphasis: "primary" });
    }
  }
  const comparisonAtoms: RnaProductionAtom[] = [];
  const comparisonBonds: RnaProductionBond[] = [];
  if (chemistry.comparison) {
    const dna = getDnaLocalChemistryPlan("nucleotide");
    comparisonAtoms.push(...dna.atoms.filter((atom) => !stabilityChemistry || stabilityRoles.has(atom.role) || atom.role === "sugar").map((atom) => ({ id: `dna-${atom.id}`, element: atom.element, role: atom.role, position: [atom.position[0] + 3.2, atom.position[1], atom.position[2]] as RnaPoint })));
    const dnaById = new Map(comparisonAtoms.map((atom) => [atom.id, atom]));
    comparisonBonds.push(...dna.bonds.flatMap((bond) => {
      const from = dnaById.get(`dna-${bond.from}`)?.position;
      const to = dnaById.get(`dna-${bond.to}`)?.position;
      return from && to ? [{ id: `dna-${bond.id}`, from, to, type: bond.kind === "hydrogen" ? "hydrogenBond" as const : "covalent" as const }] : [];
    }));
  }
  return { atoms, bonds, comparisonAtoms, comparisonBonds };
}

function localPairChemistryData(route: RnaPresentationRoute): { atoms: RnaProductionAtom[]; bonds: RnaProductionBond[]; interactions: RnaProductionInteraction[] } {
  if (route.family !== "pairingHybridization") return { atoms: [], bonds: [], interactions: [] };
  const pairing = route.presentation as RnaPairingPresentation;
  if (pairing.spec.mode !== "localPair") return { atoms: [], bonds: [], interactions: [] };
  const bases = pairing.classification.bases as readonly [RnaBase, RnaBase];
  const frame = createRnaLocalPairFrame();
  const atoms: RnaProductionAtom[] = [];
  const bonds: RnaProductionBond[] = [];
  const baseAnchors: RnaPoint[] = [];
  for (const [index, base] of bases.entries()) {
    const local = createRnaLocalChemistryPresentation(route.sourceSpec, { mode: "nucleotide", base });
    const prefix = index === 0 ? "pair-left" : "pair-right";
    const transform = (position: RnaPoint): RnaPoint => transformRnaLocalPairPoint(position, index as 0 | 1, frame);
    const byId = new Map<string, RnaProductionAtom>();
    for (const atom of local.atoms) {
      const mapped = { id: `${prefix}-${atom.id}`, element: atom.element, role: atom.role, position: transform(atom.position), emphasis: atom.role === "base" ? "primary" as const : "supporting" as const };
      atoms.push(mapped);
      byId.set(atom.id, mapped);
      if (atom.id.endsWith("base-anchor")) baseAnchors[index] = mapped.position;
    }
    for (const bond of local.bonds) {
      const from = byId.get(bond.from);
      const to = byId.get(bond.to);
      if (from && to) bonds.push({ id: `${prefix}-${bond.id}`, from: from.position, to: to.position, type: "covalent", emphasis: bond.from.includes("base") || bond.to.includes("base") ? "primary" : "supporting" });
    }
    const baseAnchor = baseAnchors[index];
    if (baseAnchor) {
      const ringSize = base === "A" || base === "G" ? 9 : 6;
      const ringAtoms: RnaProductionAtom[] = Array.from({ length: ringSize }, (_, ringIndex) => {
        const angle = (ringIndex / ringSize) * Math.PI * 2;
        return { id: `${prefix}-base-ring-${ringIndex}`, element: ringIndex % 3 === 0 ? "N" : "C", role: "baseRing", position: [baseAnchor[0] + Math.cos(angle) * 0.22, baseAnchor[1] + Math.sin(angle) * 0.22, baseAnchor[2] + 0.08] as RnaPoint, emphasis: "primary" as const };
      });
      atoms.push(...ringAtoms);
      ringAtoms.forEach((ringAtom, ringIndex) => {
        const next = ringAtoms[(ringIndex + 1) % ringAtoms.length];
        bonds.push({ id: `${prefix}-base-ring-bond-${ringIndex}`, from: ringAtom.position, to: next.position, type: "covalent", emphasis: "primary" });
      });
    }
  }
  const siteOffset = (site: string, side: number, interactionIndex: number): RnaPoint => {
    const base = baseAnchors[side] ?? [side === 0 ? -0.35 : 0.35, 0, 0];
    const row = interactionIndex - (pairing.classification.hydrogenBondCount - 1) / 2;
    return [base[0] + (side === 0 ? 0.24 : -0.24), base[1] + row * 0.16 + (site.includes("N2") || site.includes("O2") ? 0.03 : 0), base[2] + 0.05];
  };
  const interactions = pairing.interactions.map((interaction, index) => {
    const left = interaction.participants[0];
    const right = interaction.participants[1];
    const leftSide = left.strandId === pairing.strands[0].id ? 0 : 1;
    const rightSide = right.strandId === pairing.strands[0].id ? 0 : 1;
    return { id: interaction.id, type: pairing.classification.interactionType === "wobble" ? "wobblePair" as const : "hydrogenBond" as const, from: siteOffset(left.site, leftSide, index), to: siteOffset(right.site, rightSide, index) };
  });
  return { atoms, bonds, interactions };
}

function terminalMarkers(route: RnaPresentationRoute, strands: readonly RnaProductionStrand[]): RnaProductionTerminalMarker[] {
  const samples = strands[0]?.samples ?? [];
  if (route.family === "typesFunctions" && route.rnaType === "mRNA" && samples.length > 1) {
    const first = samples[0].backbone;
    const last = samples[samples.length - 1].backbone;
    return [
      { id: "mRNA-5-prime-cap", kind: "fivePrimeCap", position: [first[0] - 0.18, first[1] + 0.34, first[2] + 0.24] },
      { id: "mRNA-poly-a-tail", kind: "polyATail", position: [last[0] + 0.18, last[1] + 0.34, last[2] + 0.24] },
    ];
  }
  if (route.family === "processing") {
    const processing = route.presentation as RnaProcessingPresentation;
    if (processing.mode === "comparison") return [];
    return processing.terminalFeatures.map((feature) => ({ id: feature.id, kind: feature.kind, position: [samples[feature.attachedToDisplayIndex]?.backbone[0] ?? 0, (samples[feature.attachedToDisplayIndex]?.backbone[1] ?? 0) + 0.32, (samples[feature.attachedToDisplayIndex]?.backbone[2] ?? 0) + 0.28] as RnaPoint }));
  }
  if (route.family === "degradationStability") {
    const degradation = route.presentation as RnaDegradationPresentation;
    return degradation.exposedEnds.flatMap((end) => {
      const sample = strands.flatMap((strand) => strand.samples).find((candidate) => candidate.index === end.index);
      return sample ? [{ id: end.id, kind: "exposedEnd" as const, position: [sample.backbone[0], sample.backbone[1] + 0.28, sample.backbone[2] + 0.28] as RnaPoint }] : [];
    });
  }
  return [];
}

function overlayForRoute(route: RnaPresentationRoute, strands: readonly RnaProductionStrand[]): { interactions: RnaProductionInteraction[]; highlightedIndices: number[] } {
  const first = strands[0]?.samples ?? [];
  if (route.family === "pairingHybridization" && strands.length === 2) {
    const pairing = route.presentation as RnaPairingPresentation;
    return {
      interactions: pairing.interactions.map((interaction) => ({
        id: interaction.id,
        type: pairing.classification.interactionType === "wobble" ? "wobblePair" as const : "hydrogenBond" as const,
        from: interaction.anchors[0].position,
        to: interaction.anchors[1].position,
      })),
      highlightedIndices: [],
    };
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
  if (route.family === "typesFunctions" && route.rnaType === "tRNA") {
    const typed = route.presentation as RnaTypePresentation;
    return {
      interactions: typed.topology.pairs.flatMap((pair) => {
        const from = first[pair.left]?.basePosition;
        const to = first[pair.right]?.basePosition;
        return from && to ? [{ id: `tRNA-${pair.left}-${pair.right}`, type: "hydrogenBond" as const, from, to }] : [];
      }),
      highlightedIndices: typed.topology.pairs.flatMap((pair) => [pair.left, pair.right]),
    };
  }
  if (route.family === "typesFunctions" && route.rnaType === "rRNA") {
    const typed = route.presentation as RnaTypePresentation;
    return {
      interactions: typed.topology.pairs.flatMap((pair) => {
        const from = first[pair.left]?.basePosition;
        const to = first[pair.right]?.basePosition;
        return from && to ? [{ id: `rRNA-${pair.left}-${pair.right}`, type: pair.pair === "G-U-wobble" ? "wobblePair" as const : "hydrogenBond" as const, from, to }] : [];
      }),
      highlightedIndices: typed.topology.pairs.flatMap((pair) => [pair.left, pair.right]),
    };
  }
  if (route.family === "processing") {
    const processing = route.presentation as RnaProcessingPresentation;
    if (processing.mode === "comparison" || processing.mode === "cap") return { interactions: [], highlightedIndices: [] };
    return { interactions: processing.topology.spliceJunctions.map((junction) => ({ id: junction.id, type: "highlight" as const, from: first[junction.fromDisplayIndex]?.backbone ?? [0, 0, 0], to: first[junction.toDisplayIndex]?.backbone ?? [0, 0, 0] })), highlightedIndices: processing.topology.regions.flatMap((region) => region.displayIndices) };
  }
  if (route.family === "degradationStability") {
    const degradation = route.presentation as RnaDegradationPresentation;
    // A missing phosphodiester must remain a gap, not become a highlight line
    // across independently mounted fragments.
    return { interactions: [], highlightedIndices: degradation.fragments.filter((fragment) => fragment.retained).flatMap((fragment) => fragment.indices) };
  }
  return { interactions: [], highlightedIndices: [] };
}

function transcriptSpansForRoute(route: RnaPresentationRoute): readonly RnaProductionTranscriptSpan[] {
  if (route.family !== "processing") return [];
  const processing = route.presentation as RnaProcessingPresentation;
  if (processing.mode === "comparison" || processing.mode === "cap") return [];
  return processing.topology.regions.map((region) => ({
    id: `processing-span-${region.id}`,
    kind: region.kind,
    strandId: "mRNA-transcript",
    indices: region.displayIndices,
    attachedToTranscript: true,
  }));
}

function labelsForRoute(route: RnaPresentationRoute, strands: readonly RnaProductionStrand[], atoms: readonly RnaProductionAtom[]): RnaProductionLabel[] {
  const samples = strands[0]?.samples ?? [];
  if (route.family === "nascentTranscript") {
    const nascent = route.presentation as unknown as NascentTranscriptPresentation;
    const dnaPoints = nascent.dna.samples.flatMap((sample) => [sample.strandA, sample.strandB]);
    const centerSum = dnaPoints.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]] as RnaPoint, [0, 0, 0]);
    const divisor = Math.max(1, dnaPoints.length);
    const dnaCenter: RnaPoint = [centerSum[0] / divisor, centerSum[1] / divisor, centerSum[2] / divisor];
    return nascent.labels.map((label, index) => {
      const anchor = label.target === "nascent-rna" ? nascent.exit.position : label.target === "dna-template" ? dnaCenter : nascent.exit.position;
      return { text: label.text, position: [anchor[0] + (label.target === "nascent-rna" ? 0.34 : -0.34), anchor[1] + 0.32 + index * 0.14, anchor[2] + 0.3] as RnaPoint, anchor: `nascent-${label.target}`, priority: label.priority };
    });
  }
  if (route.family === "processing") {
    const processing = route.presentation as RnaProcessingPresentation;
    if (processing.mode === "comparison" && processing.comparison) {
      const pre = strands.find((strand) => strand.id === "pre-mrna-transcript");
      const mature = strands.find((strand) => strand.id === "mature-mrna-transcript");
      const preBounds = pre ? boundsForStrands([pre]) : undefined;
      const matureBounds = mature ? boundsForStrands([mature]) : undefined;
      const preY = preBounds?.max[1] ?? 0.78;
      const matureY = matureBounds?.min[1] ?? -0.78;
      return [
        { text: "pre-mRNA", position: [preBounds ? (preBounds.min[0] + preBounds.max[0]) / 2 : 0, preY + 0.3, 0.34] as RnaPoint, anchor: "processing-pre-mrna", priority: "primary" },
        { text: "mature mRNA", position: [matureBounds ? (matureBounds.min[0] + matureBounds.max[0]) / 2 : 0, matureY - 0.3, 0.34] as RnaPoint, anchor: "processing-mature-mrna", priority: "primary" },
      ];
    }
    if (processing.mode === "cap") {
      const first = strands[0]?.samples[0]?.backbone ?? [0, 0, 0] as RnaPoint;
      return [{ text: "5′ cap", position: [first[0] - 0.08, first[1] + 0.48, first[2] + 0.32], anchor: "processing-five-prime-cap", priority: "primary" }];
    }
    return (["exon", "intron"] as const).flatMap((kind, index) => {
      const region = processing.topology.regions.find((candidate) => candidate.kind === kind);
      if (!region) return [];
      const positions = region.displayIndices.map((residue) => samples[residue]?.backbone).filter((position): position is RnaPoint => Boolean(position));
      if (positions.length === 0) return [];
      const center: RnaPoint = [positions.reduce((sum, position) => sum + position[0], 0) / positions.length, positions.reduce((sum, position) => sum + position[1], 0) / positions.length, positions.reduce((sum, position) => sum + position[2], 0) / positions.length];
      const offset: RnaPoint = kind === "exon" ? [0, 0.38, 0.34] : [0, -0.34 - index * 0.02, 0.34];
      return [{ text: kind === "exon" ? "Exon" : "Intron", position: [center[0] + offset[0], center[1] + offset[1], center[2] + offset[2]] as RnaPoint, anchor: `processing-${region.id}` }];
    });
  }
  if (route.family === "structure" && route.sourceSpec.scale.level === "nucleotide") {
    const phosphate = atoms.find((atom) => atom.role === "phosphate")?.position ?? [0, 0, 0] as RnaPoint;
    const base = atoms.find((atom) => atom.role === "base")?.position ?? [0.6, 0, 0] as RnaPoint;
    const riboseAtoms = atoms.filter((atom) => ["ribose", "onePrimeCarbon", "threePrimeCarbon", "fivePrimeCarbon"].includes(atom.role));
    const ribose: RnaPoint = riboseAtoms.length > 0
      ? [riboseAtoms.reduce((sum, atom) => sum + atom.position[0], 0) / riboseAtoms.length, riboseAtoms.reduce((sum, atom) => sum + atom.position[1], 0) / riboseAtoms.length, riboseAtoms.reduce((sum, atom) => sum + atom.position[2], 0) / riboseAtoms.length]
      : [0, 0, 0];
    return [
      { text: "Phosphate", position: [phosphate[0] - 0.12, phosphate[1] + 0.3, phosphate[2] + 0.18] as RnaPoint, anchor: "nucleotide-phosphate" },
      { text: "Ribose", position: [ribose[0], ribose[1] - 0.42, ribose[2] + 0.22] as RnaPoint, anchor: "nucleotide-ribose" },
      { text: "Base", position: [base[0] + 0.24, base[1] + 0.28, base[2] + 0.2] as RnaPoint, anchor: "nucleotide-base" },
    ];
  }
  if (route.family === "localChemistry") {
    const chemistry = route.presentation as RnaLocalChemistryPresentation;
    const atomPositions = new Map(chemistry.atoms.map((atom) => [atom.id, atom.position]));
    const anchorPositions = new Map(chemistry.anchors.map((anchor) => [anchor.id, atomPositions.get(anchor.attachedTo) ?? [0, 0, 0] as RnaPoint]));
    if (chemistry.comparison) {
      const center = (positions: readonly RnaPoint[]): RnaPoint => {
        if (positions.length === 0) return [0, 0, 0];
        return [positions.reduce((sum, value) => sum + value[0], 0) / positions.length, positions.reduce((sum, value) => sum + value[1], 0) / positions.length, positions.reduce((sum, value) => sum + value[2], 0) / positions.length];
      };
      const rnaCenter = center(chemistry.atoms.map((atom) => atom.position));
      const dnaCenter = center(atoms.filter((atom) => atom.id.startsWith("dna-")).map((atom) => atom.position));
      return [
        { text: "RNA nucleotide", position: [rnaCenter[0], rnaCenter[1] + 0.52, rnaCenter[2] + 0.3], anchor: "comparison-rna-nucleotide", priority: "primary" },
        { text: "DNA nucleotide", position: [dnaCenter[0], dnaCenter[1] + 0.52, dnaCenter[2] + 0.3], anchor: "comparison-dna-nucleotide", priority: "primary" },
        { text: "2′-OH", position: [rnaCenter[0] + 0.32, rnaCenter[1] - 0.3, rnaCenter[2] + 0.3], anchor: "comparison-rna-2prime", priority: "secondary" },
        { text: "no 2′-OH", position: [dnaCenter[0] + 0.32, dnaCenter[1] - 0.3, dnaCenter[2] + 0.3], anchor: "comparison-dna-2prime", priority: "secondary" },
      ];
    }
    // Bridge labels are anchored to the central phosphate, never to the first
    // atom in the fragment. This keeps the semantic caption beside the actual
    // O3′–P–O5′ chemistry instead of at the fragment edge.
    for (const bridge of chemistry.phosphodiesterBridges) {
      const phosphate = atomPositions.get(bridge.phosphateId);
      if (phosphate) anchorPositions.set(bridge.id, phosphate);
    }
    const seen = new Set<string>();
    return chemistry.labels.flatMap((label, index) => {
      if (seen.has(`${label.text}:${label.anchorId}`)) return [];
      seen.add(`${label.text}:${label.anchorId}`);
      const target = anchorPositions.get(label.anchorId) ?? atomPositions.get(label.anchorId) ?? atoms[0]?.position ?? [0, 0, 0] as RnaPoint;
      const offset: RnaPoint = chemistry.focus === "phosphodiesterLinkage" ? [0, 0.48, 0.28] : chemistry.focus === "twoPrimeOH" ? [0.28, 0.22, 0.24] : [0.18, 0.18 + index * 0.08, 0.24];
      return [{ text: label.text, position: [target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]], anchor: `local-chemistry-${label.anchorId}` }];
    });
  }
  if (route.family === "degradationStability") {
    const degradation = route.presentation as RnaDegradationPresentation;
    if (degradation.state === "terminallyDegraded") {
      const before = strands.find((strand) => strand.id === "exonuclease-before");
      const after = strands.find((strand) => strand.id === "exonuclease-after");
      const bounds = (strand: RnaProductionStrand | undefined) => strand ? boundsForStrands([strand]) : undefined;
      const beforeBounds = bounds(before);
      const afterBounds = bounds(after);
      return [
        { text: "before", position: [beforeBounds?.center[0] ?? 0, (beforeBounds?.max[1] ?? 0.78) + 0.28, 0.34] as RnaPoint, anchor: "degradation-before", priority: "primary" },
        { text: "after", position: [afterBounds?.center[0] ?? 0, (afterBounds?.min[1] ?? -0.78) - 0.28, 0.34] as RnaPoint, anchor: "degradation-after", priority: "primary" },
      ];
    }
    if (degradation.stabilityComparison) {
      const rnaAtoms = atoms.filter((atom) => !atom.id.startsWith("dna-"));
      const dnaAtoms = atoms.filter((atom) => atom.id.startsWith("dna-"));
      const center = (items: readonly RnaProductionAtom[]): RnaPoint => {
        if (items.length === 0) return [0, 0, 0];
        const xs = items.map((atom) => atom.position[0]);
        const ys = items.map((atom) => atom.position[1]);
        const zs = items.map((atom) => atom.position[2]);
        return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
      };
      const rna = center(rnaAtoms);
      const dna = center(dnaAtoms);
      return [
        { text: "RNA", position: [rna[0], rna[1] + 0.72, rna[2] + 0.3], anchor: "stability-rna", priority: "primary" },
        { text: "DNA", position: [dna[0], dna[1] + 0.72, dna[2] + 0.3], anchor: "stability-dna", priority: "primary" },
        { text: "2′-OH", position: [rna[0] + 0.3, rna[1] - 0.48, rna[2] + 0.3], anchor: "stability-rna-2prime-oh", priority: "secondary" },
        { text: "no 2′-OH", position: [dna[0] + 0.3, dna[1] - 0.48, dna[2] + 0.3], anchor: "stability-dna-2prime", priority: "secondary" },
        { text: "2′-OH increases backbone susceptibility", position: [0, -1.25, 0.34], anchor: "stability-caption", priority: "tertiary" },
      ];
    }
  }
  if (route.family === "pairingHybridization" && (route.presentation as RnaPairingPresentation).spec.mode === "localPair") {
    const pairing = route.presentation as RnaPairingPresentation;
    const baseAtoms = atoms.filter((atom) => atom.role === "base");
    const labels = pairing.classification.bases.map((base, index) => ({
      text: index === 0 ? (base === "A" ? "Adenine" : base === "G" ? "Guanine" : String(base)) : (base === "U" ? "Uracil" : base === "C" ? "Cytosine" : String(base)),
      position: [baseAtoms[index]?.position[0] ?? (index === 0 ? -0.9 : 0.9), (baseAtoms[index]?.position[1] ?? 0) + 0.38, (baseAtoms[index]?.position[2] ?? 0) + 0.3] as RnaPoint,
      anchor: `pair-base-label-${index}`,
    }));
    return labels;
  }
  if (route.family === "typesFunctions" && route.rnaType === "tRNA") return [];
  if (route.family === "typesFunctions" && route.rnaType === "rRNA") {
    return [{ text: "rRNA multi-domain fold", position: [0, 1.92, 0.34], anchor: "rrna-identity-label" }];
  }
  if (route.family === "typesFunctions" && route.rnaType === "mRNA") {
    return [{ text: "mRNA coding region", position: [0, 0.78, 0.34], anchor: "mrna-identity-label" }];
  }
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
  const pairLocal = localPairChemistryData(route);
  const overlay = overlayForRoute(route, strands);
  const comparison = comparisonForRoute(route);
  const comparisonStrands = comparison?.wide.strands ?? strands;
  const chemistry = route.family === "localChemistry" ? route.presentation as RnaLocalChemistryPresentation : route.family === "degradationStability" ? (route.presentation as RnaDegradationPresentation).localChemistry : undefined;
  const atoms = pairLocal.atoms.length > 0 ? pairLocal.atoms : local.atoms;
  const bonds = pairLocal.bonds.length > 0 ? pairLocal.bonds : local.bonds;
  const nucleotideStructure = route.family === "structure" && route.sourceSpec.scale.level === "nucleotide";
  const nascent = route.family === "nascentTranscript" ? route.presentation as unknown as NascentTranscriptPresentation : undefined;
  const nascentInteractions = nascent ? nascent.dna.samples.map((sample) => ({ id: `nascent-dna-pair-${sample.index}`, type: "dnaPair" as const, from: sample.basePairStart as RnaPoint, to: sample.basePairEnd as RnaPoint })) : [];
  return { family: route.family, cameraIntent: route.cameraIntent, structuralMode: route.family === "localChemistry" || nucleotideStructure || Boolean((route.family === "degradationStability" ? (route.presentation as RnaDegradationPresentation).stabilityComparison : undefined)) ? "local-chemistry" : "procedural", strands: comparisonStrands, atoms, bonds, comparisonAtoms: local.comparisonAtoms, comparisonBonds: local.comparisonBonds, interactions: nascentInteractions.length > 0 ? nascentInteractions : comparison?.wide.interactions ?? (pairLocal.interactions.length > 0 ? pairLocal.interactions : overlay.interactions), terminalMarkers: terminalMarkers(route, comparisonStrands), transcriptSpans: transcriptSpansForRoute(route), labels: comparison?.wide.labels ?? labelsForRoute(route, comparisonStrands, [...atoms, ...local.comparisonAtoms]), highlightedIndices: overlay.highlightedIndices, localFocus: chemistry?.focus, comparison, metadata: { owner: route.owner, representationMode: route.representationMode, grounding: route.groundingStatus } };
}
