import type { RnaSceneSpec, RnaStabilityState } from "./rna-contract.ts";
import { createRnaDnaLocalComparison, createRnaLocalChemistryPresentation, type RnaDnaLocalComparison, type RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import { createRnaSecondaryStructureSpec, type RnaSecondaryStructureMotif, type RnaSecondaryStructureTopology } from "./RnaSecondaryStructurePresentation.ts";
import { canonicalRnaView, rnaCameraFor, rnaMaterialPalette, rnaTopologyState, sampleCanonicalRna, type RnaPoint, type RnaTheme, type RnaResidueSample } from "./RnaVisualSystem.ts";

export type RnaDegradationPhase = "intact" | "cleavageReady" | "cleaved" | "partiallyDegraded" | "shortened";
/** Stable, presentation-level states used by static degradation illustrations. */
export type RnaDegradationState = "intact" | "internallyCleaved" | "terminallyDegraded";
export type RnaDegradationMode = "endonucleolytic" | "exonucleolytic" | "chemicalHydrolysis" | "genericConceptual";
export type RnaCleavageLocation = "internal" | "fivePrimeTerminal" | "threePrimeTerminal";
export type RnaDegradationDirection = "fivePrimeToThreePrime" | "threePrimeToFivePrime";
export type RnaBackboneLinkState = "present" | "absent";

export type RnaDegradationSpec = {
  phase: RnaDegradationPhase;
  stabilityState: RnaStabilityState;
  mode: RnaDegradationMode;
  cleavageLocation: RnaCleavageLocation;
  direction?: RnaDegradationDirection;
  cleavageIndex: number;
  length: number;
  structuredContext: boolean;
};

export type RnaDegradationBackboneLink = {
  id: string;
  authoritativeBridgeId: string;
  type: "phosphodiester";
  leftIndex: number;
  rightIndex: number;
  state: RnaBackboneLinkState;
  targeted: boolean;
};

export type RnaDegradationFragment = {
  id: string;
  indices: readonly number[];
  continuous: true;
  retained: boolean;
};

export type RnaExposedEnd = {
  id: string;
  terminus: "5prime" | "3prime";
  index: number;
  reason: "native" | "cleavage-generated" | "shortening-generated";
  attachedToTranscript: true;
};

export type RnaStabilityComparison = {
  localChemistry: RnaDnaLocalComparison;
  sameScale: true;
  rna: { twoPrimeHydroxyl: "present"; susceptibleGroup: "2prime-oh-adjacent-phosphodiester" };
  dna: { twoPrimeHydroxyl: "absent"; susceptibleGroup: "no-equivalent-2prime-oh" };
};

export type RnaDegradationDisplayFragment = {
  id: string;
  sourceIndices: readonly number[];
  samples: readonly RnaResidueSample[];
  opacity: number;
  retained: boolean;
};

export type RnaDegradationPresentation = {
  spec: RnaDegradationSpec;
  state: RnaDegradationState;
  samples: readonly RnaResidueSample[];
  /** Separate continuous display paths; consumers must not reconnect fragments. */
  displayFragments: readonly RnaDegradationDisplayFragment[];
  cleavageCue?: { linkId: string; position: RnaPoint; gapWidth: number };
  terminalShortening?: { direction: RnaDegradationDirection; removedTerminus: "5prime" | "3prime"; retainedStart: number; retainedEnd: number };
  backboneLinks: readonly RnaDegradationBackboneLink[];
  fragments: readonly RnaDegradationFragment[];
  exposedEnds: readonly RnaExposedEnd[];
  highlightedGroups: readonly string[];
  labels: readonly { text: string; target: string }[];
  representation: ReturnType<typeof canonicalRnaView>;
  camera: ReturnType<typeof rnaCameraFor>;
  materials: ReturnType<typeof rnaMaterialPalette>;
  localChemistry?: RnaLocalChemistryPresentation;
  stabilityComparison?: RnaStabilityComparison;
  secondaryTopology?: RnaSecondaryStructureTopology;
  noDegradationMachinery: true;
};

type DegradationOptions = {
  phase?: RnaDegradationPhase;
  mode?: RnaDegradationMode;
  cleavageLocation?: RnaCleavageLocation;
  direction?: RnaDegradationDirection;
  cleavageIndex?: number;
  length?: number;
  theme?: RnaTheme;
};

const defaultLength = 16;
const clampIndex = (index: number, length: number) => Math.max(0, Math.min(Math.max(0, length - 2), Math.round(index)));
const range = (start: number, end: number): number[] => Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);

function modeFor(spec: RnaSceneSpec, options: DegradationOptions): RnaDegradationMode {
  if (options.mode) return options.mode;
  const text = `${spec.focus} ${spec.annotations.join(" ")}`.toLowerCase();
  if (/exonuclease|exonucleolytic|exonucleo/.test(text)) return "exonucleolytic";
  if (/endonuclease|endonucleolytic|endonucleo/.test(text)) return "endonucleolytic";
  if (spec.degradationState === "hydrolysisContext") return "chemicalHydrolysis";
  return "genericConceptual";
}

function phaseFor(spec: RnaSceneSpec, options: DegradationOptions): RnaDegradationPhase {
  if (options.phase) return options.phase;
  if (spec.degradationState === "cleaved") return "cleaved";
  if (spec.degradationState === "degrading") return "partiallyDegraded";
  if (spec.degradationState === "hydrolysisContext") return "cleavageReady";
  return "intact";
}

function locationFor(spec: RnaSceneSpec, options: DegradationOptions): RnaCleavageLocation {
  if (options.cleavageLocation) return options.cleavageLocation;
  const text = `${spec.focus} ${spec.annotations.join(" ")}`.toLowerCase();
  if (/5.?prime|5′/.test(text)) return "fivePrimeTerminal";
  if (/3.?prime|3′/.test(text)) return "threePrimeTerminal";
  return "internal";
}

function directionFor(spec: RnaSceneSpec, options: DegradationOptions, mode: RnaDegradationMode): RnaDegradationDirection | undefined {
  if (options.direction) return options.direction;
  if (mode !== "exonucleolytic") return undefined;
  const text = `${spec.focus} ${spec.annotations.join(" ")}`.toLowerCase();
  return /3.?to.?5|3′.?to.?5′/.test(text) ? "threePrimeToFivePrime" : "fivePrimeToThreePrime";
}

function structuredContextFor(spec: RnaSceneSpec): boolean {
  return spec.secondaryStructure.required || spec.pairingState === "paired" || spec.pairingState === "partiallyPaired";
}

export function createRnaDegradationSpec(input: RnaSceneSpec | Partial<DegradationOptions> = {}, options: DegradationOptions = {}): RnaDegradationSpec {
  const spec = typeof input === "object" && "family" in input ? input as RnaSceneSpec : undefined;
  const merged = spec ? options : { ...(input as Partial<DegradationOptions>), ...options };
  const length = Math.max(3, Math.round(merged.length ?? defaultLength));
  const mode = spec ? modeFor(spec, merged) : merged.mode ?? "genericConceptual";
  const phase = spec ? phaseFor(spec, merged) : merged.phase ?? "intact";
  const cleavageLocation = spec ? locationFor(spec, merged) : merged.cleavageLocation ?? "internal";
  const direction = spec ? directionFor(spec, merged, mode) : merged.direction;
  return { phase, stabilityState: phase === "intact" ? "stable" : phase === "cleavageReady" ? "hydrolysisContext" : phase === "shortened" || phase === "partiallyDegraded" ? "degrading" : "cleaved", mode, cleavageLocation, direction, cleavageIndex: clampIndex(merged.cleavageIndex ?? Math.floor(length / 2) - 1, length), length, structuredContext: spec ? structuredContextFor(spec) : false };
}

function retainedIndices(degradation: RnaDegradationSpec): number[] {
  if (degradation.phase !== "shortened" && degradation.phase !== "partiallyDegraded") return range(0, degradation.length - 1);
  if (degradation.mode !== "exonucleolytic") return range(0, degradation.length - 1);
  const removeCount = Math.max(1, Math.min(degradation.length - 2, Math.floor(degradation.length / 4)));
  return degradation.direction === "threePrimeToFivePrime" ? range(0, degradation.length - removeCount - 1) : range(removeCount, degradation.length - 1);
}

function buildBackbone(degradation: RnaDegradationSpec, retained: readonly number[]): RnaDegradationBackboneLink[] {
  const retainedSet = new Set(retained);
  return range(0, degradation.length - 2).map((leftIndex) => {
    const rightIndex = leftIndex + 1;
    const targeted = degradation.phase !== "intact" && degradation.cleavageLocation === "internal" && leftIndex === degradation.cleavageIndex;
    const retainedLink = retainedSet.has(leftIndex) && retainedSet.has(rightIndex);
    return { id: `phosphodiester-${leftIndex}-${rightIndex}`, authoritativeBridgeId: `rna-nucleotide-${leftIndex + 1}-rna-nucleotide-${rightIndex + 1}-phosphodiester`, type: "phosphodiester" as const, leftIndex, rightIndex, state: targeted && (degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded" || degradation.phase === "shortened") ? "absent" as const : retainedLink ? "present" as const : "absent" as const, targeted };
  });
}

function buildFragments(degradation: RnaDegradationSpec, retained: readonly number[]): RnaDegradationFragment[] {
  if (degradation.mode !== "exonucleolytic" && degradation.cleavageLocation === "internal" && (degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded")) return [{ id: "left-rna-fragment", indices: range(0, degradation.cleavageIndex), continuous: true, retained: true }, { id: "right-rna-fragment", indices: range(degradation.cleavageIndex + 1, degradation.length - 1), continuous: true, retained: true }];
  if (degradation.mode === "exonucleolytic" && (degradation.phase === "shortened" || degradation.phase === "partiallyDegraded")) {
    const removed = degradation.direction === "threePrimeToFivePrime" ? range(retained.length, degradation.length - 1) : range(0, retained[0] - 1);
    const fragments: RnaDegradationFragment[] = [{ id: "retained-rna", indices: retained, continuous: true, retained: true }];
    if (removed.length) fragments.push({ id: "removed-terminal-region", indices: removed, continuous: true, retained: false });
    return fragments;
  }
  return [{ id: "intact-rna", indices: retained, continuous: true, retained: true }];
}

function buildEnds(degradation: RnaDegradationSpec, retained: readonly number[]): RnaExposedEnd[] {
  if (degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded" || degradation.phase === "shortened") {
    if (degradation.mode !== "exonucleolytic") return [{ id: "native-five-prime-end", terminus: "5prime", index: 0, reason: "native", attachedToTranscript: true }, { id: "cleavage-three-prime-end", terminus: "3prime", index: degradation.cleavageIndex, reason: "cleavage-generated", attachedToTranscript: true }, { id: "cleavage-five-prime-end", terminus: "5prime", index: degradation.cleavageIndex + 1, reason: "cleavage-generated", attachedToTranscript: true }, { id: "native-three-prime-end", terminus: "3prime", index: degradation.length - 1, reason: "native", attachedToTranscript: true }];
    if (degradation.mode === "exonucleolytic") return [
      { id: "retained-five-prime-end", terminus: "5prime", index: retained[0], reason: degradation.direction === "fivePrimeToThreePrime" ? "shortening-generated" : "native", attachedToTranscript: true },
      { id: "retained-three-prime-end", terminus: "3prime", index: retained[retained.length - 1], reason: degradation.direction === "threePrimeToFivePrime" ? "shortening-generated" : "native", attachedToTranscript: true },
    ];
  }
  return [{ id: "native-five-prime-end", terminus: "5prime", index: 0, reason: "native", attachedToTranscript: true }, { id: "native-three-prime-end", terminus: "3prime", index: degradation.length - 1, reason: "native", attachedToTranscript: true }];
}

function secondaryContext(degradation: RnaDegradationSpec): RnaSecondaryStructureTopology | undefined {
  if (!degradation.structuredContext) return undefined;
  const motif: RnaSecondaryStructureMotif = "hairpin";
  return createRnaSecondaryStructureSpec(motif, { stemPairs: 3, loopLength: 3 });
}

function stateFor(degradation: RnaDegradationSpec): RnaDegradationState {
  if (degradation.mode === "exonucleolytic" && (degradation.phase === "partiallyDegraded" || degradation.phase === "shortened")) return "terminallyDegraded";
  if (degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded") return "internallyCleaved";
  return "intact";
}

function translateSample(sample: RnaResidueSample, offset: RnaPoint): RnaResidueSample {
  const move = (point: RnaPoint): RnaPoint => [point[0] + offset[0], point[1] + offset[1], point[2] + offset[2]];
  return { ...sample, backbone: move(sample.backbone), ribose: move(sample.ribose), basePosition: move(sample.basePosition), fivePrime: move(sample.fivePrime), threePrime: move(sample.threePrime) };
}

function buildDisplayFragments(degradation: RnaDegradationSpec, fragments: readonly RnaDegradationFragment[], samples: readonly RnaResidueSample[]): RnaDegradationDisplayFragment[] {
  return fragments.map((fragment, index) => {
    // A fixed gap makes an absent internal phosphodiester visually legible.
    // Terminal loss never becomes random internal fragmentation.
    const offset: RnaPoint = degradation.mode !== "exonucleolytic" && fragment.id === "right-rna-fragment" ? [0.76, 0.18, 0] : [0, 0, 0];
    return { id: fragment.id, sourceIndices: fragment.indices, samples: fragment.indices.map((sourceIndex) => translateSample(samples[sourceIndex]!, offset)), opacity: fragment.retained ? 1 : 0.2, retained: fragment.retained };
  });
}

export function deriveRnaDegradationPresentation(input: RnaSceneSpec | RnaDegradationSpec, options: DegradationOptions = {}): RnaDegradationPresentation {
  const degradation = "phase" in input && "length" in input ? input : createRnaDegradationSpec(input, options);
  const retained = retainedIndices(degradation);
  const links = buildBackbone(degradation, retained);
  const fragments = buildFragments(degradation, retained);
  const exposedEnds = buildEnds(degradation, retained);
  const scene = "family" in input ? input : undefined;
  const localChemistry = degradation.mode === "chemicalHydrolysis" || degradation.phase === "cleavageReady" || degradation.cleavageLocation === "internal" ? createRnaLocalChemistryPresentation(scene ?? ({ family: "localChemistry", focus: "RNA phosphodiester linkage", scale: { level: "localChemistry", locality: "local" }, rnaType: "generic", structuralState: "intact", strandCount: 1, pairingState: "none", requiredEntities: ["ribose", "twoPrimeHydroxyl", "phosphate", "phosphodiesterLinkage"], annotations: [], sequenceRequirements: { required: false }, secondaryStructure: { required: false, motifs: [] }, dnaContext: { required: false }, processingState: "none", degradationState: "hydrolysisContext", representation: { detail: "atomAndBond", showBackbone: true, showBases: true, showAnnotations: true }, supportExpectation: "grounded-or-explanatory" }), { mode: "backbone" }) : undefined;
  const stabilityComparison = degradation.mode === "chemicalHydrolysis" || (scene?.dnaContext.required ?? false) ? { localChemistry: createRnaDnaLocalComparison(), sameScale: true as const, rna: { twoPrimeHydroxyl: "present" as const, susceptibleGroup: "2prime-oh-adjacent-phosphodiester" as const }, dna: { twoPrimeHydroxyl: "absent" as const, susceptibleGroup: "no-equivalent-2prime-oh" as const } } : undefined;
  const authoritativeBridge = localChemistry?.phosphodiesterBridges[0];
  const localChemistryWithState = localChemistry && authoritativeBridge ? {
    ...localChemistry,
    comparison: stabilityComparison?.localChemistry,
    phosphodiesterBridges: localChemistry.phosphodiesterBridges.map((bridge) => ({ ...bridge, state: degradation.phase === "cleavageReady" ? "breaking" : degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded" ? "absent" : bridge.state })),
    bonds: localChemistry.bonds.map((bond) => bond.id.startsWith(authoritativeBridge.id) ? { ...bond, state: degradation.phase === "cleavageReady" ? "breaking" as const : degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded" ? "absent" as const : bond.state } : bond),
  } : localChemistry;
  const representation = canonicalRnaView(stabilityComparison || localChemistry ? "local-chemistry" : "whole-rna");
  const samples = sampleCanonicalRna(degradation.length, { topology: "single-stranded", lod: representation.lod, source: "canonical-procedural", topologyState: rnaTopologyState("singleStrand", degradation.length) });
  const state = stateFor(degradation);
  const displayFragments = buildDisplayFragments(degradation, fragments, samples);
  const targetedLink = links.find((link) => link.targeted);
  const cuePoint = targetedLink ? samples[targetedLink.leftIndex]!.backbone : undefined;
  const cleavageCue = state === "internallyCleaved" && targetedLink && cuePoint ? { linkId: targetedLink.id, position: cuePoint, gapWidth: 0.76 } : undefined;
  const retainedFragment = fragments.find((fragment) => fragment.retained);
  const terminalShortening = state === "terminallyDegraded" && degradation.direction && retainedFragment ? { direction: degradation.direction, removedTerminus: degradation.direction === "fivePrimeToThreePrime" ? "5prime" as const : "3prime" as const, retainedStart: retainedFragment.indices[0]!, retainedEnd: retainedFragment.indices[retainedFragment.indices.length - 1]! } : undefined;
  const highlightedGroups = stabilityComparison ? ["twoPrimeHydroxyl", "susceptiblePhosphodiester", "rnaTwoPrimeHydroxyl", "dnaTwoPrimePosition", "adjacentPhosphodiester"] : degradation.phase === "cleavageReady" ? ["twoPrimeHydroxyl", "phosphate", "susceptiblePhosphodiester"] : state === "internallyCleaved" ? ["cleavageSite"] : state === "terminallyDegraded" ? ["terminalShortening"] : [];
  const labels = stabilityComparison
    ? [{ text: "RNA 2′-OH → greater backbone susceptibility", target: "twoPrimeHydroxyl" }, { text: "DNA: no 2′-OH", target: "dna-two-prime-position" }]
    : state === "internallyCleaved"
      ? [{ text: "cleavage site", target: targetedLink?.id ?? "cleavage-site" }]
      : state === "terminallyDegraded"
        ? [{ text: `${degradation.direction === "threePrimeToFivePrime" ? "3′→5′" : "5′→3′"} terminal shortening`, target: "retained-rna" }]
        : [{ text: degradation.phase === "cleavageReady" ? "reaction-ready linkage" : "RNA", target: degradation.phase === "cleavageReady" ? links[0].id : "intact-rna" }];
  return { spec: degradation, state, samples, displayFragments, cleavageCue, terminalShortening, backboneLinks: links, fragments, exposedEnds, highlightedGroups, labels, representation, camera: rnaCameraFor(stabilityComparison || localChemistry ? "local-chemistry" : degradation.mode === "exonucleolytic" ? "nucleotide" : "whole-rna"), materials: rnaMaterialPalette(options.theme ?? "dark"), localChemistry: localChemistryWithState, stabilityComparison, secondaryTopology: secondaryContext(degradation), noDegradationMachinery: true };
}

export function rnaCleavagePresentation(input: RnaSceneSpec | RnaDegradationSpec, options: DegradationOptions = {}): RnaDegradationPresentation {
  return deriveRnaDegradationPresentation(input, { ...options, mode: options.mode ?? "endonucleolytic", phase: options.phase ?? "cleaved", cleavageLocation: options.cleavageLocation ?? "internal" });
}

export function rnaTerminalDegradationPresentation(input: RnaSceneSpec | RnaDegradationSpec, direction: RnaDegradationDirection, options: DegradationOptions = {}): RnaDegradationPresentation {
  return deriveRnaDegradationPresentation(input, { ...options, mode: "exonucleolytic", phase: options.phase ?? "shortened", direction, cleavageLocation: direction === "fivePrimeToThreePrime" ? "fivePrimeTerminal" : "threePrimeTerminal" });
}

export function rnaStabilityComparison(input: RnaSceneSpec | Partial<RnaDegradationSpec> = { phase: "cleavageReady", mode: "chemicalHydrolysis", length: defaultLength }): RnaDegradationPresentation {
  const resolved = "family" in input ? input : createRnaDegradationSpec(input, { mode: "chemicalHydrolysis", phase: "cleavageReady" });
  return deriveRnaDegradationPresentation(resolved, { mode: "chemicalHydrolysis", phase: "cleavageReady" });
}

export function isValidRnaDegradationPresentation(presentation: RnaDegradationPresentation): boolean {
  const targeted = presentation.backboneLinks.filter((link) => link.targeted);
  const absent = presentation.backboneLinks.filter((link) => link.state === "absent");
  const retained = presentation.fragments.filter((fragment) => fragment.retained);
  const retainedIndices = new Set(retained.flatMap((fragment) => fragment.indices));
  return presentation.backboneLinks.every((link) => link.type === "phosphodiester" && link.leftIndex + 1 === link.rightIndex)
    && presentation.backboneLinks.every((link) => link.authoritativeBridgeId === `rna-nucleotide-${link.leftIndex + 1}-rna-nucleotide-${link.rightIndex + 1}-phosphodiester`)
    && presentation.fragments.every((fragment) => fragment.continuous && fragment.indices.every((index) => index >= 0 && index < presentation.spec.length))
    && retained.every((fragment) => fragment.indices.every((index, position, indices) => position === 0 || indices[position - 1] + 1 === index))
    && absent.every((link) => link.targeted || !retainedIndices.has(link.leftIndex) || !retainedIndices.has(link.rightIndex))
    && presentation.exposedEnds.every((end) => end.attachedToTranscript && end.index >= 0 && end.index < presentation.spec.length)
    && presentation.displayFragments.every((fragment) => fragment.samples.length === fragment.sourceIndices.length && fragment.samples.every((sample) => [sample.backbone, sample.ribose, sample.basePosition].flat().every(Number.isFinite)))
    && (presentation.state !== "internallyCleaved" || Boolean(presentation.cleavageCue) && presentation.displayFragments.length === 2)
    && (presentation.state !== "terminallyDegraded" || Boolean(presentation.terminalShortening) && presentation.displayFragments.filter((fragment) => fragment.retained).length === 1)
    && (presentation.spec.phase === "cleaved" || presentation.spec.phase === "partiallyDegraded" ? targeted.length === 1 : true)
    && presentation.noDegradationMachinery;
}
