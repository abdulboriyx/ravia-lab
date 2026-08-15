import type { RnaSceneSpec, RnaStabilityState } from "./rna-contract.ts";
import { createRnaDnaLocalComparison, createRnaLocalChemistryPresentation, type RnaDnaLocalComparison, type RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import { createRnaSecondaryStructureSpec, type RnaSecondaryStructureMotif, type RnaSecondaryStructureTopology } from "./RnaSecondaryStructurePresentation.ts";
import { canonicalRnaView, rnaCameraFor, rnaMaterialPalette, rnaTopologyState, sampleCanonicalRna, type RnaTheme, type RnaResidueSample } from "./RnaVisualSystem.ts";

export type RnaDegradationPhase = "intact" | "cleavageReady" | "cleaved" | "partiallyDegraded" | "shortened";
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

export type RnaDegradationPresentation = {
  spec: RnaDegradationSpec;
  samples: readonly RnaResidueSample[];
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
    return { id: `phosphodiester-${leftIndex}-${rightIndex}`, type: "phosphodiester" as const, leftIndex, rightIndex, state: targeted && (degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded" || degradation.phase === "shortened") ? "absent" as const : retainedLink ? "present" as const : "absent" as const, targeted };
  });
}

function buildFragments(degradation: RnaDegradationSpec, retained: readonly number[]): RnaDegradationFragment[] {
  if (degradation.mode === "endonucleolytic" && (degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded")) return [{ id: "left-rna-fragment", indices: range(0, degradation.cleavageIndex), continuous: true, retained: true }, { id: "right-rna-fragment", indices: range(degradation.cleavageIndex + 1, degradation.length - 1), continuous: true, retained: true }];
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
    if (degradation.mode === "endonucleolytic") return [{ id: "native-five-prime-end", terminus: "5prime", index: 0, reason: "native", attachedToTranscript: true }, { id: "cleavage-three-prime-end", terminus: "3prime", index: degradation.cleavageIndex, reason: "cleavage-generated", attachedToTranscript: true }, { id: "cleavage-five-prime-end", terminus: "5prime", index: degradation.cleavageIndex + 1, reason: "cleavage-generated", attachedToTranscript: true }, { id: "native-three-prime-end", terminus: "3prime", index: degradation.length - 1, reason: "native", attachedToTranscript: true }];
    if (degradation.mode === "exonucleolytic") return [{ id: "retained-five-prime-end", terminus: "5prime", index: retained[0], reason: "shortening-generated", attachedToTranscript: true }, { id: "retained-three-prime-end", terminus: "3prime", index: retained[retained.length - 1], reason: "shortening-generated", attachedToTranscript: true }];
  }
  return [{ id: "native-five-prime-end", terminus: "5prime", index: 0, reason: "native", attachedToTranscript: true }, { id: "native-three-prime-end", terminus: "3prime", index: degradation.length - 1, reason: "native", attachedToTranscript: true }];
}

function secondaryContext(degradation: RnaDegradationSpec): RnaSecondaryStructureTopology | undefined {
  if (!degradation.structuredContext) return undefined;
  const motif: RnaSecondaryStructureMotif = "hairpin";
  return createRnaSecondaryStructureSpec(motif, { stemPairs: 3, loopLength: 3 });
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
  const highlightedGroups = degradation.phase === "cleavageReady" ? ["twoPrimeHydroxyl", "phosphate", "susceptiblePhosphodiester"] : degradation.phase === "cleaved" || degradation.phase === "partiallyDegraded" || degradation.phase === "shortened" ? ["cleavageSite", "exposedEnd"] : [];
  const labels = [{ text: degradation.phase === "cleavageReady" ? "reaction-ready linkage" : degradation.phase === "cleaved" ? "cleavage site" : degradation.mode === "exonucleolytic" ? "shortening direction" : "RNA", target: degradation.phase === "cleavageReady" ? "phosphodiester-0-1" : degradation.phase === "cleaved" ? `phosphodiester-${degradation.cleavageIndex}-${degradation.cleavageIndex + 1}` : "retained-rna" }];
  if (exposedEnds.some((end) => end.terminus === "5prime")) labels.push({ text: "5′ end", target: exposedEnds.find((end) => end.terminus === "5prime")!.id });
  if (exposedEnds.some((end) => end.terminus === "3prime")) labels.push({ text: "3′ end", target: exposedEnds.find((end) => end.terminus === "3prime")!.id });
  const representation = canonicalRnaView(stabilityComparison || localChemistry ? "local-chemistry" : "whole-rna");
  return { spec: degradation, samples: sampleCanonicalRna(degradation.length, { topology: "single-stranded", lod: representation.lod, source: "canonical-procedural", topologyState: rnaTopologyState("singleStrand", degradation.length) }), backboneLinks: links, fragments, exposedEnds, highlightedGroups, labels, representation, camera: rnaCameraFor(stabilityComparison || localChemistry ? "local-chemistry" : degradation.mode === "exonucleolytic" ? "nucleotide" : "whole-rna"), materials: rnaMaterialPalette(options.theme ?? "dark"), localChemistry, stabilityComparison, secondaryTopology: secondaryContext(degradation), noDegradationMachinery: true };
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
  return presentation.backboneLinks.every((link) => link.type === "phosphodiester" && link.leftIndex + 1 === link.rightIndex)
    && presentation.fragments.every((fragment) => fragment.continuous && fragment.indices.every((index) => index >= 0 && index < presentation.spec.length))
    && presentation.exposedEnds.every((end) => end.attachedToTranscript && end.index >= 0 && end.index < presentation.spec.length)
    && (presentation.spec.phase === "cleaved" || presentation.spec.phase === "partiallyDegraded" ? targeted.length <= 1 : true)
    && presentation.noDegradationMachinery;
}
