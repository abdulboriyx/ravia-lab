import type { GeneExpressionProgramV1, GeneExpressionEventV1 } from "./cellular-gene-expression.ts";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production.ts";

export const transcriptionPresentationStateSchemaVersion = "1" as const;

export type TranscriptionPresentationStateV1 = Readonly<{
  schemaVersion: typeof transcriptionPresentationStateSchemaVersion;
  exactTimeSeconds: number;
  normalizedProgress: number;
  polymeraseGenePosition: number;
  bubbleCenter: number;
  bubbleOpenFraction: number;
  bubbleWidth: number;
  dnaRepairProgress: number;
  nascentRnaVisualLength: number;
  nascentRnaAnchor: number;
  polymeraseEngagement: number;
  transcriptReleaseProgress: number;
}>;

const presentationNumericFields = [
  "exactTimeSeconds", "normalizedProgress", "polymeraseGenePosition", "bubbleCenter",
  "bubbleOpenFraction", "bubbleWidth", "dnaRepairProgress", "nascentRnaVisualLength",
  "nascentRnaAnchor", "polymeraseEngagement", "transcriptReleaseProgress",
] as const;

/** Runtime guard for data crossing the React/R3F boundary. */
export function isValidTranscriptionPresentationState(value: unknown): value is TranscriptionPresentationStateV1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== transcriptionPresentationStateSchemaVersion) return false;
  return presentationNumericFields.every((field) => typeof candidate[field] === "number" && Number.isFinite(candidate[field] as number))
    && ["normalizedProgress", "polymeraseGenePosition", "bubbleCenter", "bubbleOpenFraction", "bubbleWidth", "dnaRepairProgress", "nascentRnaAnchor", "polymeraseEngagement", "transcriptReleaseProgress"].every((field) => {
      const number = candidate[field] as number;
      return number >= 0 && number <= 1.5;
    })
    && (candidate.nascentRnaVisualLength as number) >= 0;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (start: number, end: number, value: number) => {
  if (end <= start) return value >= end ? 1 : 0;
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function eventAt(program: GeneExpressionProgramV1, kind: GeneExpressionEventV1["kind"], fallback: number) {
  return program.events.find((event) => event.kind === kind)?.at ?? fallback;
}

function fractionalRnaLength(program: GeneExpressionProgramV1, time: number) {
  const additions = program.events
    .filter((event) => event.kind === "RNA_NUCLEOTIDE_ADDED")
    .sort((a, b) => a.at - b.at || a.eventId.localeCompare(b.eventId));
  let length = 0;
  for (let index = 0; index < additions.length; index += 1) {
    const event = additions[index]!;
    const count = event.nucleotideCount ?? 1;
    if (time >= event.at) {
      length += count;
      continue;
    }
    const previous = additions[index - 1]?.at ?? Math.max(0, event.at - 0.5);
    length += count * clamp01((time - previous) / Math.max(0.001, event.at - previous));
    break;
  }
  return Math.max(0, length);
}

/**
 * Presentation-only projection. Scientific truth remains the exact-time
 * production projection; this function only supplies continuous coordinates
 * for the temporal illustration.
 */
export function deriveTranscriptionPresentationState(
  program: GeneExpressionProgramV1,
  projection: GeneExpressionProductionProjectionV1,
): TranscriptionPresentationStateV1 {
  const time = Math.max(0, Math.min(program.timeline.clock.duration, projection.timeSeconds));
  const initiation = eventAt(program, "TRANSCRIPTION_INITIATED", 0.5);
  const firstAddition = eventAt(program, "RNA_NUCLEOTIDE_ADDED", initiation + 0.5);
  const termination = eventAt(program, "TRANSCRIPTION_TERMINATED", 2);
  const release = eventAt(program, "RNA_TRANSCRIPT_RELEASED", termination + 0.35);
  const association = Math.max(0, Math.min(firstAddition, initiation - 0.25));
  const progressEnd = Math.max(termination, initiation + 0.001);
  const elongationProgress = smoothstep(initiation, progressEnd, time);
  const approach = smoothstep(association, initiation, time);
  const releaseProgress = smoothstep(termination, release, time);
  const polymeraseEngagement = clamp01(approach * (1 - releaseProgress * 0.85));
  const polymeraseGenePosition = clamp01(0.08 * approach + 0.84 * elongationProgress + 0.08 * releaseProgress);
  // The canonical projection still governs scientific event ordering. Between
  // those boundaries this presentation layer interpolates the visible opening
  // so scrubbing does not jump between binary geometry states.
  const interpolatedBubble = clamp01(smoothstep(association, initiation, time) * (1 - releaseProgress));
  const bubbleOpenFraction = projection.dna.transcriptionBubble === "CLOSED" && time >= termination ? 0 : interpolatedBubble;
  const nascentRnaVisualLength = Math.max(projection.transcription.visibleRnaLength, fractionalRnaLength(program, time));

  return {
    schemaVersion: transcriptionPresentationStateSchemaVersion,
    exactTimeSeconds: projection.timeSeconds,
    normalizedProgress: clamp01(time / Math.max(0.001, progressEnd)),
    polymeraseGenePosition,
    bubbleCenter: polymeraseGenePosition,
    bubbleOpenFraction,
    bubbleWidth: 0.075 + bubbleOpenFraction * 0.07,
    dnaRepairProgress: releaseProgress,
    nascentRnaVisualLength,
    nascentRnaAnchor: polymeraseGenePosition,
    polymeraseEngagement,
    transcriptReleaseProgress: releaseProgress,
  };
}
