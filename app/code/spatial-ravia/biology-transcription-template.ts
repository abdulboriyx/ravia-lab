import { dnaVisualSystem, sampleCanonicalDna, type DnaHelixSample } from "./DnaVisualSystem.ts";
import type { DnaSceneFamily } from "./biology-dna-representation-contract.ts";

export type TranscriptionTemplateMode = "bubble-only" | "rnap-on-dna" | "dna-to-rna";

/** Canonical local-Z samples are shown along the RNAP's world-X DNA channel. */
export const transcriptionDnaTemplateTransform = {
  position: [0, 0, 0] as const,
  rotation: [0, Math.PI / 2, 0] as const,
  dominantAxis: "x" as const,
};

/** Visual calibration only: preserves canonical B-DNA outside a compact RNAP bubble. */
export const transcriptionDuplexCalibration = {
  basePairCount: 52,
  openBasePairs: 6,
  transitionBasePairs: 1.25,
  maximumOpenDisplacementAngstrom: 2,
  /** At least two canonical B-DNA turns remain visibly paired on each side. */
  minimumPairedFlankTurns: 2,
} as const;

export type TranscriptionTemplatePlan = {
  mode: TranscriptionTemplateMode;
  dna: {
    basePairCount: number;
    openCenter: number;
    openBasePairs: number;
    /** The two backbones remain paired outside this short local interval. */
    pairedOutsideBubble: true;
    templateStrand: "strandB";
  };
  rnap: { visible: boolean; opacity: number; scale: number; framing: "local-context" | "none" };
  nascentRna: { visible: boolean; exit: "bubble-local" | "none" };
  camera: { framing: "bubble-centered"; excludesBroadComplex: true; fov: number };
  presentation: { bubbleEmphasis: "primary" | "secondary"; pairedFlankOpacity: number };
  motion: "static-first";
};

export function deriveTranscriptionTemplatePlan(input: {
  hasRnap: boolean;
  hasNascentRna: boolean;
}): TranscriptionTemplatePlan {
  const mode: TranscriptionTemplateMode = input.hasNascentRna
    ? "dna-to-rna"
    : input.hasRnap
      ? "rnap-on-dna"
      : "bubble-only";
  const rnapPrimary = mode === "rnap-on-dna" || mode === "dna-to-rna";

  return {
    mode,
    dna: {
      // Keep more than two B-DNA turns visibly paired on each side of the
      // compact RNAP-bound opening.
      basePairCount: transcriptionDuplexCalibration.basePairCount,
      openCenter: transcriptionDuplexCalibration.basePairCount / 2,
      // A six-base-pair teaching bubble avoids replication-fork-like width.
      openBasePairs: transcriptionDuplexCalibration.openBasePairs,
      pairedOutsideBubble: true,
      templateStrand: "strandB",
    },
    // A bubble prompt still gets a restrained RNAP context. The same protein
    // becomes the primary visual actor only when the prompt asks for it.
    rnap: {
      visible: true,
      opacity: rnapPrimary ? 0.92 : 0.34,
      scale: rnapPrimary ? 2.25 : 1.55,
      framing: "local-context",
    },
    nascentRna: { visible: input.hasNascentRna, exit: input.hasNascentRna ? "bubble-local" : "none" },
    camera: { framing: "bubble-centered", excludesBroadComplex: true, fov: rnapPrimary ? 28 : 30 },
    presentation: {
      bubbleEmphasis: rnapPrimary ? "secondary" : "primary",
      pairedFlankOpacity: rnapPrimary ? 0.78 : 0.64,
    },
    motion: "static-first",
  };
}

/** RNAP context is specific to the transcription family; DNA-only families cannot opt in. */
export function canUseTranscriptionRnapContext(family: DnaSceneFamily) {
  return family === "transcription";
}

export function sampleTranscriptionBubble(plan: TranscriptionTemplatePlan) {
  return sampleTranscriptionDuplexGeometry(plan);
}

/**
 * The one authoritative DNA geometry for transcription.
 *
 * Start with one paired canonical B-DNA centerline/frame at every base pair,
 * then apply a bounded perpendicular displacement only in the bubble. The
 * strands are therefore never independent scene-wide trajectories.
 */
export function sampleTranscriptionDuplexGeometry(plan: TranscriptionTemplatePlan): DnaHelixSample[] {
  const canonical = sampleCanonicalDna(plan.dna.basePairCount, {
    topology: "double-stranded",
    lod: "polymer",
    localState: "canonical",
  });
  const canonicalHalfSeparation = dnaVisualSystem.geometry.helixRadiusAngstrom;
  const baseHalfWidth = dnaVisualSystem.geometry.basePairWidthAngstrom / 2;
  const bubbleHalfLength = plan.dna.openBasePairs / 2;
  const transitionBasePairs = transcriptionDuplexCalibration.transitionBasePairs;

  return canonical.map((sample) => {
    const center = midpoint(sample.strandA, sample.strandB);
    const frameNormal = normalize(subtract(sample.strandA, center));
    const distanceFromBubbleCenter = Math.abs(sample.index - plan.dna.openCenter);
    const opening = smoothBubbleEnvelope(distanceFromBubbleCenter, bubbleHalfLength, transitionBasePairs);
    const halfSeparation = canonicalHalfSeparation + opening * transcriptionDuplexCalibration.maximumOpenDisplacementAngstrom;
    const halfBaseWidth = baseHalfWidth + opening * transcriptionDuplexCalibration.maximumOpenDisplacementAngstrom * 0.55;

    return {
      index: sample.index,
      strandA: addScaled(center, frameNormal, halfSeparation),
      strandB: addScaled(center, frameNormal, -halfSeparation),
      basePairStart: addScaled(center, frameNormal, halfBaseWidth),
      basePairEnd: addScaled(center, frameNormal, -halfBaseWidth),
      opening,
    };
  });
}

/**
 * Partition the canonical duplex into its paired flanks and the one local
 * transcription opening. Rendering these regions independently prevents a
 * local opening from reading as two globally free DNA curves.
 */
export function partitionTranscriptionDuplex(plan: TranscriptionTemplatePlan) {
  const samples = sampleTranscriptionBubble(plan);
  const openingIndices = samples
    .filter((sample) => sample.opening > 0.01)
    .map((sample) => sample.index);
  const firstOpen = openingIndices[0];
  const lastOpen = openingIndices.at(-1);

  if (firstOpen === undefined || lastOpen === undefined) {
    return { samples, upstream: samples, bubble: [], downstream: [] };
  }

  // Share one sample at either transition so each locally rendered section is
  // geometrically continuous, while only the bubble contains separated DNA.
  return {
    samples,
    upstream: samples.slice(0, firstOpen + 1),
    bubble: samples.slice(Math.max(0, firstOpen - 1), Math.min(samples.length, lastOpen + 2)),
    downstream: samples.slice(lastOpen),
  };
}

export function isValidTranscriptionTemplatePlan(plan: TranscriptionTemplatePlan) {
  const samples = sampleTranscriptionBubble(plan);
  const opened = samples.filter((sample) => sample.opening > 0.01);
  const paired = samples.filter((sample) => sample.opening <= 0.01);
  return plan.dna.openBasePairs > 0
    && plan.dna.openBasePairs < plan.dna.basePairCount
    && opened.length > 0
    && paired.length > 0
    && plan.camera.excludesBroadComplex
    && plan.motion === "static-first"
    && (!plan.rnap.visible || (plan.rnap.framing === "local-context" && plan.rnap.scale > 0 && plan.rnap.opacity > 0))
    && (!plan.nascentRna.visible || plan.nascentRna.exit === "bubble-local");
}

function midpoint(a: readonly [number, number, number], b: readonly [number, number, number]): [number, number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function subtract(a: readonly [number, number, number], b: readonly [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(value: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(value[0], value[1], value[2]);
  return length > 0 ? [value[0] / length, value[1] / length, value[2] / length] : [1, 0, 0];
}

function addScaled(
  origin: readonly [number, number, number],
  direction: readonly [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    origin[0] + direction[0] * amount,
    origin[1] + direction[1] * amount,
    origin[2] + direction[2] * amount,
  ];
}

/** Zero outside the bounded interval; C1-like smooth entry and exit. */
function smoothBubbleEnvelope(distance: number, halfLength: number, transition: number) {
  if (distance <= halfLength) return 1;
  if (distance >= halfLength + transition) return 0;
  const t = 1 - (distance - halfLength) / transition;
  return t * t * (3 - 2 * t);
}
