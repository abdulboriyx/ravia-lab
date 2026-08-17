import type { RnaSceneSpec, RnaProcessingState } from "./rna-contract.ts";
import { deriveRnaTypePresentation, type RnaTypePresentation } from "./RnaTypePresentation.ts";
import { canonicalRnaView, rnaCameraFor, rnaMaterialPalette, rnaTopologyState, sampleCanonicalRna, type RnaTheme, type RnaResidueSample } from "./RnaVisualSystem.ts";

export type RnaProcessingStage = "unprocessed" | "partiallyProcessed" | "mature";
export type RnaProcessingMode = "preMature" | "cap" | "polyA" | "comparison" | "splicing";
export type RnaProcessingRegionKind = "exon" | "intron";

export type RnaProcessingRegion = {
  id: string;
  kind: RnaProcessingRegionKind;
  sourceIndices: readonly number[];
  displayIndices: readonly number[];
  attachedToTranscript: true;
  label: "Exon" | "Intron";
  /** Inclusive spans in the source transcript and the rendered transcript. */
  sourceSpan: readonly [number, number];
  displaySpan: readonly [number, number];
};

export type RnaProcessingTerminalFeature = {
  id: string;
  kind: "fivePrimeCap" | "polyATail";
  terminus: "5prime" | "3prime";
  attachedToDisplayIndex: number;
  attachedToSourceIndex: number;
  units: readonly { id: string; displayIndex: number; base: "A" }[];
  anchoredToTranscript: true;
  /** Prevents terminal processing features from becoming free scene objects. */
  attachment: "exact-5prime-terminus" | "extends-from-3prime-terminus";
  chemistryClaim: "pedagogical-terminal-feature";
};

export type RnaSpliceJunction = {
  id: string;
  kind: "exonIntronBoundary" | "exonExonJunction";
  leftRegionId: string;
  rightRegionId: string;
  fromDisplayIndex: number;
  toDisplayIndex: number;
  attachedToTranscript: true;
};

export type RnaProcessingTopology = {
  stage: RnaProcessingStage;
  sourceLength: number;
  displayLength: number;
  sourceIndices: readonly number[];
  continuousChainIndices: readonly number[];
  regions: readonly RnaProcessingRegion[];
  backboneLinks: readonly { from: number; to: number; type: "continuous" }[];
  spliceJunctions: readonly RnaSpliceJunction[];
  deterministicKey: string;
  staticStateOnly: true;
};

export type RnaProcessingPresentation = {
  mode: RnaProcessingMode;
  stage: RnaProcessingStage;
  processingState: RnaProcessingState;
  transcriptIdentity: RnaTypePresentation;
  samples: readonly RnaResidueSample[];
  topology: RnaProcessingTopology;
  terminalFeatures: readonly RnaProcessingTerminalFeature[];
  labels: readonly { text: string; target: string }[];
  representation: ReturnType<typeof canonicalRnaView>;
  camera: ReturnType<typeof rnaCameraFor>;
  materials: ReturnType<typeof rnaMaterialPalette>;
  comparison?: { before: RnaProcessingPresentation; after: RnaProcessingPresentation; sharedTranscriptIdentity: true };
  spliceState?: "before" | "processing" | "after";
  noSpliceosomeMachinery: true;
  staticStateOnly: true;
};

type ProcessingOptions = {
  mode?: RnaProcessingMode;
  stage?: RnaProcessingStage;
  spliceState?: "before" | "processing" | "after";
  theme?: RnaTheme;
  tailLength?: number;
};

const sourceLength = 24;
const preExonSources = [[0, 1, 2, 3, 4], [9, 10, 11, 12, 13, 14, 15], [20, 21, 22, 23]] as const;
const preIntronSources = [[5, 6, 7, 8], [16, 17, 18, 19]] as const;
const flatten = (ranges: readonly (readonly number[])[]) => ranges.flat();
const range = (start: number, end: number): number[] => Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);

function stageFor(spec: RnaSceneSpec, options: ProcessingOptions): RnaProcessingStage {
  if (options.stage) return options.stage;
  if (spec.processingState === "mature" || spec.processingState === "spliced" || spec.structuralState === "mature") return "mature";
  if (spec.processingState === "capped" || spec.processingState === "polyadenylated" || spec.processingState === "comparePreMature") return "partiallyProcessed";
  return "unprocessed";
}

function modeFor(spec: RnaSceneSpec, options: ProcessingOptions): RnaProcessingMode {
  if (options.mode) return options.mode;
  if (spec.processingState === "comparePreMature") return "comparison";
  if (spec.processingState === "capped" || spec.requiredEntities.includes("cap")) return "cap";
  if (spec.processingState === "polyadenylated" || spec.requiredEntities.includes("polyATail")) return "polyA";
  if (spec.processingState === "spliced" || /splice/i.test(spec.focus)) return "splicing";
  return "preMature";
}

function processingStateFor(stage: RnaProcessingStage): RnaProcessingState {
  return stage === "mature" ? "mature" : stage === "partiallyProcessed" ? "capped" : "unprocessed";
}

function buildTopology(stage: RnaProcessingStage, includeTail: boolean, tailLength: number): RnaProcessingTopology {
  const exonSources = stage === "mature" ? preExonSources : preExonSources;
  const intronSources = stage === "mature" ? [] : preIntronSources;
  const sourceIndices = stage === "mature" ? flatten(exonSources) : range(0, sourceLength - 1);
  const regions: RnaProcessingRegion[] = [];
  let displayCursor = 0;
  for (let index = 0; index < exonSources.length; index += 1) {
    const source = exonSources[index];
    const display = range(displayCursor, displayCursor + source.length - 1);
    regions.push({ id: `exon-${index + 1}`, kind: "exon", sourceIndices: source, displayIndices: display, attachedToTranscript: true, label: "Exon", sourceSpan: [source[0], source[source.length - 1]], displaySpan: [display[0], display[display.length - 1]] });
    displayCursor += source.length;
    if (stage !== "mature" && index < intronSources.length) {
      const intron = intronSources[index];
      const intronDisplay = range(displayCursor, displayCursor + intron.length - 1);
      regions.push({ id: `intron-${index + 1}`, kind: "intron", sourceIndices: intron, displayIndices: intronDisplay, attachedToTranscript: true, label: "Intron", sourceSpan: [intron[0], intron[intron.length - 1]], displaySpan: [intronDisplay[0], intronDisplay[intronDisplay.length - 1]] });
      displayCursor += intron.length;
    }
  }
  const displayLength = displayCursor + (includeTail ? tailLength : 0);
  const chain = range(0, displayLength - 1);
  const spliceJunctions: RnaSpliceJunction[] = [];
  for (let index = 0; index < regions.length - 1; index += 1) {
    const left = regions[index];
    const right = regions[index + 1];
    spliceJunctions.push({ id: `${left.id}-${right.id}-boundary`, kind: left.kind === "exon" && right.kind === "intron" ? "exonIntronBoundary" : "exonIntronBoundary", leftRegionId: left.id, rightRegionId: right.id, fromDisplayIndex: left.displayIndices[left.displayIndices.length - 1], toDisplayIndex: right.displayIndices[0], attachedToTranscript: true });
  }
  if (stage === "mature") {
    const exons = regions.filter((region) => region.kind === "exon");
    for (let index = 0; index < exons.length - 1; index += 1) spliceJunctions.push({ id: `${exons[index].id}-${exons[index + 1].id}-junction`, kind: "exonExonJunction", leftRegionId: exons[index].id, rightRegionId: exons[index + 1].id, fromDisplayIndex: exons[index].displayIndices[exons[index].displayIndices.length - 1], toDisplayIndex: exons[index + 1].displayIndices[0], attachedToTranscript: true });
  }
  return { stage, sourceLength, displayLength, sourceIndices, continuousChainIndices: chain, regions, backboneLinks: chain.slice(1).map((index) => ({ from: index - 1, to: index, type: "continuous" as const })), spliceJunctions, deterministicKey: `mRNA-processing:${stage}:${includeTail ? tailLength : 0}`, staticStateOnly: true };
}

function featureFlags(spec: RnaSceneSpec, stage: RnaProcessingStage, mode: RnaProcessingMode): { cap: boolean; tail: boolean } {
  const explicitCap = spec.requiredEntities.includes("cap") || spec.processingState === "capped";
  const explicitTail = spec.requiredEntities.includes("polyATail") || spec.processingState === "polyadenylated";
  return { cap: explicitCap || mode === "cap", tail: explicitTail || mode === "polyA" || (stage === "mature" && explicitTail) };
}

function terminalFeatures(flags: { cap: boolean; tail: boolean }, topology: RnaProcessingTopology, tailLength: number): RnaProcessingTerminalFeature[] {
  const features: RnaProcessingTerminalFeature[] = [];
  if (flags.cap) features.push({ id: "five-prime-cap", kind: "fivePrimeCap", terminus: "5prime", attachedToDisplayIndex: 0, attachedToSourceIndex: topology.sourceIndices[0] ?? 0, units: [], anchoredToTranscript: true, attachment: "exact-5prime-terminus", chemistryClaim: "pedagogical-terminal-feature" });
  if (flags.tail) {
    const tailStart = topology.displayLength - tailLength;
    features.push({ id: "poly-a-tail", kind: "polyATail", terminus: "3prime", attachedToDisplayIndex: Math.max(0, tailStart - 1), attachedToSourceIndex: topology.sourceIndices[topology.sourceIndices.length - 1] ?? sourceLength - 1, units: range(tailStart, topology.displayLength - 1).map((displayIndex, index) => ({ id: `poly-a-${index + 1}`, displayIndex, base: "A" as const })), anchoredToTranscript: true, attachment: "extends-from-3prime-terminus", chemistryClaim: "pedagogical-terminal-feature" });
  }
  return features;
}

function samplesFor(topology: RnaProcessingTopology) {
  const topologyState = rnaTopologyState("singleStrand", topology.displayLength);
  return sampleCanonicalRna(topology.displayLength, { topology: "single-stranded", lod: 1, source: "canonical-procedural", topologyState });
}

function createPresentation(spec: RnaSceneSpec, options: ProcessingOptions, mode: RnaProcessingMode, stage: RnaProcessingStage, spliceState?: "before" | "processing" | "after"): RnaProcessingPresentation {
  const flags = featureFlags(spec, stage, mode);
  const tailLength = flags.tail ? Math.max(1, Math.round(options.tailLength ?? 4)) : 0;
  const topology = buildTopology(stage, flags.tail, tailLength);
  const transcriptIdentity = deriveRnaTypePresentation({ ...spec, rnaType: "mRNA" }, { theme: options.theme });
  const representation = canonicalRnaView(mode === "cap" || mode === "polyA" ? "local-chemistry" : "whole-rna");
  // Labels name region classes, not every individual span, keeping a single
  // RNA transcript readable without detached bar-like annotations.
  const labels: { text: string; target: string }[] = [];
  if (topology.regions.some((region) => region.kind === "exon")) labels.push({ text: "Exons", target: "exon-1" });
  if (topology.regions.some((region) => region.kind === "intron")) labels.push({ text: "Introns", target: "intron-1" });
  if (flags.cap) labels.push({ text: "5′ cap", target: "five-prime-cap" });
  if (flags.tail) labels.push({ text: "poly(A) tail", target: "poly-a-tail" });
  if (stage === "mature") labels.push({ text: "Mature mRNA", target: "mature-transcript" });
  return { mode, stage, processingState: processingStateFor(stage), transcriptIdentity, samples: samplesFor(topology), topology, terminalFeatures: terminalFeatures(flags, topology, tailLength), labels: labels.slice(0, 3), representation, camera: rnaCameraFor(mode === "cap" ? "local-chemistry" : mode === "polyA" ? "local-chemistry" : mode === "splicing" ? "secondary-structure" : "whole-rna"), materials: rnaMaterialPalette(options.theme ?? "dark"), spliceState, noSpliceosomeMachinery: true, staticStateOnly: true };
}

export function rnaProcessingState(spec: RnaSceneSpec, options: ProcessingOptions = {}): RnaProcessingState {
  return processingStateFor(stageFor(spec, options));
}

export function rnaProcessingRegions(spec: RnaSceneSpec, options: ProcessingOptions = {}): readonly RnaProcessingRegion[] {
  const stage = stageFor(spec, options);
  const flags = featureFlags(spec, stage, modeFor(spec, options));
  return buildTopology(stage, flags.tail, flags.tail ? Math.max(1, Math.round(options.tailLength ?? 4)) : 0).regions;
}

export function deriveRnaProcessingPresentation(spec: RnaSceneSpec, options: ProcessingOptions = {}): RnaProcessingPresentation {
  const mode = modeFor(spec, options);
  const stage = stageFor(spec, options);
  if (mode !== "comparison") return createPresentation(spec, options, mode, stage, mode === "splicing" ? options.spliceState ?? (stage === "mature" ? "after" : "before") : undefined);
  const before = createPresentation(spec, options, "preMature", "unprocessed", "before");
  const after = createPresentation(spec, options, "preMature", "mature", "after");
  return { ...before, mode: "comparison", comparison: { before, after, sharedTranscriptIdentity: true } };
}

export function rnaTerminalFeaturePresentation(spec: RnaSceneSpec, terminal: "5primeCap" | "polyATail", options: ProcessingOptions = {}): RnaProcessingPresentation {
  return deriveRnaProcessingPresentation(spec, { ...options, mode: terminal === "5primeCap" ? "cap" : "polyA" });
}

export function rnaSplicingPresentation(spec: RnaSceneSpec, state: "before" | "processing" | "after" = "before", options: Omit<ProcessingOptions, "mode" | "spliceState"> = {}): RnaProcessingPresentation {
  return deriveRnaProcessingPresentation(spec, { ...options, mode: "splicing", spliceState: state, stage: state === "after" ? "mature" : "unprocessed" });
}

export function isValidRnaProcessingPresentation(presentation: RnaProcessingPresentation): boolean {
  const { topology } = presentation;
  const regionIndices = topology.regions.flatMap((region) => region.displayIndices);
  const sourceExpected = topology.stage === "mature" ? flatten(preExonSources) : range(0, sourceLength - 1);
  const capIsTerminal = presentation.terminalFeatures.filter((feature) => feature.kind === "fivePrimeCap")
    .every((feature) => feature.attachedToDisplayIndex === 0 && feature.attachment === "exact-5prime-terminus");
  const tailsAreContiguous = presentation.terminalFeatures.filter((feature) => feature.kind === "polyATail")
    .every((feature) => feature.attachment === "extends-from-3prime-terminus"
      && feature.attachedToDisplayIndex === feature.units[0]!.displayIndex - 1
      && feature.units.every((unit, index) => unit.displayIndex === feature.attachedToDisplayIndex + index + 1));
  return topology.continuousChainIndices.every((index, position) => index === position)
    && topology.backboneLinks.length === Math.max(0, topology.displayLength - 1)
    && topology.regions.every((region) => region.attachedToTranscript && region.displayIndices.every((index) => index >= 0 && index < topology.displayLength) && region.sourceSpan[0] === region.sourceIndices[0] && region.sourceSpan[1] === region.sourceIndices[region.sourceIndices.length - 1] && region.displaySpan[0] === region.displayIndices[0] && region.displaySpan[1] === region.displayIndices[region.displayIndices.length - 1])
    && presentation.terminalFeatures.every((feature) => feature.anchoredToTranscript && (feature.kind === "fivePrimeCap" ? feature.terminus === "5prime" : feature.terminus === "3prime"))
    && new Set(regionIndices).size === regionIndices.length
    && topology.sourceIndices.join(",") === sourceExpected.join(",")
    && capIsTerminal
    && tailsAreContiguous
    && presentation.labels.length <= 3
    && presentation.noSpliceosomeMachinery
    && presentation.staticStateOnly
    && topology.staticStateOnly;
}
