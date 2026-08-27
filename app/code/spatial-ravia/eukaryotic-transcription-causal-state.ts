import type { GeneExpressionEventV1, GeneExpressionProgramV1 } from "./cellular-gene-expression.ts";

export const eukaryoticTranscriptionCausalStateSchemaVersion = "1" as const;
export const eukaryoticTranscriptionSourceStructure = "5FLM" as const;
export const eukaryoticTranscriptionPolymerase = "EUKARYOTIC_POL_II" as const;
export const depositedHybridWindowLength = 14;
export const eukaryoticTranscriptionActionTypes = [
  "OPEN_DNA_LOCALLY", "ENGAGE_POL_II", "DISENGAGE_POL_II", "TRANSLOCATE_POL_II",
  "EXTEND_RNA_5_TO_3", "MAINTAIN_RNA_DNA_HYBRID", "RELEASE_RNA", "CLOSE_BUBBLE",
] as const;

export type EukaryoticTranscriptionCausalState = Readonly<{
  schemaVersion: typeof eukaryoticTranscriptionCausalStateSchemaVersion;
  sourceStructure: typeof eukaryoticTranscriptionSourceStructure;
  polymerase: typeof eukaryoticTranscriptionPolymerase;
  dnaOpening: number;
  polymeraseEngagement: number;
  polymeraseAxisPosition: number;
  rnaLength: number;
  hybridLength: number;
  transcriptRelease: number;
  bubbleClosure: number;
  transcriptReleased: boolean;
}>;

export type EukaryoticTranscriptionAction =
  | Readonly<{ type: "OPEN_DNA_LOCALLY"; openingFraction?: number }>
  | Readonly<{ type: "ENGAGE_POL_II" }>
  | Readonly<{ type: "DISENGAGE_POL_II" }>
  | Readonly<{ type: "TRANSLOCATE_POL_II"; axisPosition: number }>
  | Readonly<{ type: "EXTEND_RNA_5_TO_3"; nucleotideCount: number }>
  | Readonly<{ type: "MAINTAIN_RNA_DNA_HYBRID"; hybridLength?: number }>
  | Readonly<{ type: "RELEASE_RNA" }>
  | Readonly<{ type: "CLOSE_BUBBLE" }>;

export type EukaryoticTranscriptionActionResult =
  | Readonly<{ ok: true; state: EukaryoticTranscriptionCausalState }>
  | Readonly<{ ok: false; state: EukaryoticTranscriptionCausalState; code: string; reason: string }>;

export type EukaryoticTranscriptionVisualConsequences = Readonly<{
  dnaPairing: number;
  localBubbleVisible: number;
  polymeraseVisible: number;
  polymeraseTranslocating: boolean;
  nascentRnaVisible: number;
  hybridVisible: number;
  activeCenterVisible: number;
  transcriptDetached: boolean;
}>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (start: number, end: number, value: number) => {
  if (end <= start) return value >= end ? 1 : 0;
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function createInitialEukaryoticTranscriptionState(): EukaryoticTranscriptionCausalState {
  return {
    schemaVersion: eukaryoticTranscriptionCausalStateSchemaVersion,
    sourceStructure: eukaryoticTranscriptionSourceStructure,
    polymerase: eukaryoticTranscriptionPolymerase,
    dnaOpening: 0,
    polymeraseEngagement: 0,
    polymeraseAxisPosition: 0,
    rnaLength: 0,
    hybridLength: 0,
    transcriptRelease: 0,
    bubbleClosure: 0,
    transcriptReleased: false,
  };
}

function failure(state: EukaryoticTranscriptionCausalState, code: string, reason: string): EukaryoticTranscriptionActionResult {
  return { ok: false, state, code, reason };
}

function validFraction(value: number | undefined, fallback: number) {
  return value === undefined ? fallback : Number.isFinite(value) && value > 0 && value <= 1 ? value : null;
}

/**
 * The only discrete mutation boundary for the eukaryotic transcription mechanism.
 * Invalid actions return the unchanged state and an explicit reason.
 */
export function reduceEukaryoticTranscriptionAction(state: EukaryoticTranscriptionCausalState, action: EukaryoticTranscriptionAction): EukaryoticTranscriptionActionResult {
  if (state.transcriptReleased && action.type !== "CLOSE_BUBBLE") return failure(state, "TRANSCRIPTION_ALREADY_RELEASED", "released RNA cannot be extended or re-engaged");
  switch (action.type) {
    case "OPEN_DNA_LOCALLY": {
      const opening = validFraction(action.openingFraction, 1);
      if (opening === null) return failure(state, "DNA_OPENING_OUT_OF_RANGE", "openingFraction must be finite and in (0, 1]");
      return { ok: true, state: { ...state, dnaOpening: Math.max(state.dnaOpening, opening), bubbleClosure: 0 } };
    }
    case "ENGAGE_POL_II":
      if (state.dnaOpening <= 0) return failure(state, "POL_II_REQUIRES_OPEN_DNA", "Pol II engagement requires a local DNA opening");
      return { ok: true, state: { ...state, polymeraseEngagement: 1 } };
    case "DISENGAGE_POL_II":
      return { ok: true, state: { ...state, polymeraseEngagement: 0 } };
    case "TRANSLOCATE_POL_II":
      if (state.polymeraseEngagement <= 0) return failure(state, "TRANSLOCATION_REQUIRES_ENGAGEMENT", "Pol II must be engaged before translocation");
      if (!Number.isFinite(action.axisPosition) || action.axisPosition < state.polymeraseAxisPosition || action.axisPosition > 1) return failure(state, "TRANSLOCATION_OUT_OF_ORDER", "axisPosition must be finite, bounded, and monotonic");
      return { ok: true, state: { ...state, polymeraseAxisPosition: action.axisPosition } };
    case "EXTEND_RNA_5_TO_3":
      if (state.polymeraseEngagement <= 0) return failure(state, "RNA_EXTENSION_REQUIRES_ENGAGEMENT", "RNA extension requires engaged Pol II");
      if (!Number.isInteger(action.nucleotideCount) || action.nucleotideCount <= 0) return failure(state, "RNA_EXTENSION_COUNT_INVALID", "nucleotideCount must be a positive integer");
      return { ok: true, state: { ...state, rnaLength: state.rnaLength + action.nucleotideCount } };
    case "MAINTAIN_RNA_DNA_HYBRID": {
      if (state.polymeraseEngagement <= 0 || state.rnaLength <= 0) return failure(state, "HYBRID_REQUIRES_ACTIVE_RNA", "the hybrid requires engaged Pol II and a nascent RNA");
      const requested = action.hybridLength ?? Math.min(depositedHybridWindowLength, state.rnaLength);
      if (!Number.isInteger(requested) || requested <= 0 || requested > depositedHybridWindowLength) return failure(state, "HYBRID_LENGTH_OUT_OF_RANGE", "hybridLength must be a positive integer within the deposited hybrid window");
      return { ok: true, state: { ...state, hybridLength: Math.max(state.hybridLength, Math.min(requested, state.rnaLength)) } };
    }
    case "RELEASE_RNA":
      if (state.polymeraseEngagement <= 0 || state.rnaLength <= 0) return failure(state, "RELEASE_REQUIRES_ACTIVE_TRANSCRIPTION", "RNA release requires an engaged polymerase and transcript");
      if (state.polymeraseAxisPosition < 0.95) return failure(state, "RELEASE_REQUIRES_TERMINAL_POSITION", "RNA release requires Pol II to reach the terminal DNA-axis position");
      return { ok: true, state: { ...state, polymeraseEngagement: 0, transcriptRelease: 1, transcriptReleased: true, hybridLength: 0 } };
    case "CLOSE_BUBBLE":
      if (!state.transcriptReleased) return failure(state, "BUBBLE_CLOSE_REQUIRES_RELEASE", "the bubble closes after RNA release");
      return { ok: true, state: { ...state, dnaOpening: 0, bubbleClosure: 1, hybridLength: 0 } };
  }
}

export function validateEukaryoticTranscriptionCausalState(state: EukaryoticTranscriptionCausalState): readonly string[] {
  const issues: string[] = [];
  if (state.schemaVersion !== eukaryoticTranscriptionCausalStateSchemaVersion) issues.push("schemaVersion");
  if (state.sourceStructure !== eukaryoticTranscriptionSourceStructure) issues.push("sourceStructure");
  if (state.polymerase !== eukaryoticTranscriptionPolymerase) issues.push("polymerase");
  for (const [name, rawValue] of Object.entries(state).filter(([name]) => ["dnaOpening", "polymeraseEngagement", "polymeraseAxisPosition", "transcriptRelease", "bubbleClosure"].includes(name))) {
    const value = rawValue as number;
    if (!Number.isFinite(value) || value < 0 || value > 1) issues.push(name);
  }
  if (!Number.isFinite(state.rnaLength) || state.rnaLength < 0) issues.push("rnaLength");
  if (!Number.isInteger(state.hybridLength) || state.hybridLength < 0 || state.hybridLength > Math.min(depositedHybridWindowLength, state.rnaLength)) issues.push("hybridLength");
  if (state.polymeraseEngagement > 0 && state.dnaOpening <= 0) issues.push("engagement-without-opening");
  if (state.transcriptReleased && (state.transcriptRelease !== 1 || state.polymeraseEngagement !== 0)) issues.push("released-state");
  if (state.bubbleClosure === 1 && (state.dnaOpening !== 0 || !state.transcriptReleased)) issues.push("closed-bubble-state");
  return issues;
}

export function deriveEukaryoticTranscriptionVisualConsequences(state: EukaryoticTranscriptionCausalState): EukaryoticTranscriptionVisualConsequences {
  return {
    dnaPairing: 1 - state.dnaOpening,
    localBubbleVisible: state.dnaOpening * (1 - state.bubbleClosure),
    polymeraseVisible: state.polymeraseEngagement > 0 ? 1 : state.transcriptReleased ? 0.65 : 0.35,
    polymeraseTranslocating: state.polymeraseEngagement > 0 && state.polymeraseAxisPosition > 0,
    nascentRnaVisible: state.rnaLength > 0 ? 1 : 0,
    hybridVisible: state.hybridLength > 0 ? 1 : 0,
    activeCenterVisible: 1,
    transcriptDetached: state.transcriptReleased,
  };
}

function eventAt(program: GeneExpressionProgramV1, kind: GeneExpressionEventV1["kind"], fallback: number) {
  return program.events.find((event) => event.kind === kind)?.at ?? fallback;
}

function fractionalRnaLength(program: GeneExpressionProgramV1, time: number) {
  const additions = program.events.filter((event) => event.kind === "RNA_NUCLEOTIDE_ADDED").sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId));
  let length = 0;
  for (let index = 0; index < additions.length; index += 1) {
    const event = additions[index]!;
    const count = event.nucleotideCount ?? 1;
    if (time >= event.at) { length += count; continue; }
    const previous = additions[index - 1]?.at ?? Math.max(0, event.at - 0.5);
    length += count * clamp01((time - previous) / Math.max(0.001, event.at - previous));
    break;
  }
  return Math.max(0, length);
}

/** Continuous exact-time projection used by the renderer; the reducer above remains the discrete action authority. */
export function deriveEukaryoticTranscriptionCausalStateAtTime(program: GeneExpressionProgramV1, timeSeconds: number): EukaryoticTranscriptionCausalState {
  const time = Math.max(0, Math.min(program.timeline.clock.duration, timeSeconds));
  const initiation = eventAt(program, "TRANSCRIPTION_INITIATED", 0.5);
  const firstAddition = eventAt(program, "RNA_NUCLEOTIDE_ADDED", initiation + 0.5);
  const termination = eventAt(program, "TRANSCRIPTION_TERMINATED", 2);
  const release = eventAt(program, "RNA_TRANSCRIPT_RELEASED", termination + 0.35);
  const association = Math.max(0, Math.min(firstAddition, initiation - 0.25));
  const progressEnd = Math.max(termination, initiation + 0.001);
  const elongationProgress = smoothstep(initiation, progressEnd, time);
  const approach = smoothstep(association, initiation, time);
  const releaseProgress = smoothstep(termination, release, time);
  const dnaOpening = clamp01(smoothstep(association, initiation, time) * (1 - releaseProgress));
  const rnaLength = fractionalRnaLength(program, time);
  return {
    ...createInitialEukaryoticTranscriptionState(),
    dnaOpening,
    polymeraseEngagement: clamp01(approach * (1 - releaseProgress)),
    polymeraseAxisPosition: clamp01(0.08 * approach + 0.84 * elongationProgress + 0.08 * releaseProgress),
    rnaLength,
    hybridLength: Math.min(depositedHybridWindowLength, Math.floor(rnaLength)),
    transcriptRelease: releaseProgress,
    bubbleClosure: releaseProgress,
    transcriptReleased: releaseProgress >= 1,
  };
}
