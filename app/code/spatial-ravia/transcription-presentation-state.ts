import type { GeneExpressionProgramV1 } from "./cellular-gene-expression.ts";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production.ts";
import { deriveEukaryoticTranscriptionCausalStateAtTime, deriveEukaryoticTranscriptionVisualConsequences } from "./eukaryotic-transcription-causal-state.ts";

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
  const termination = program.events.find((event) => event.kind === "TRANSCRIPTION_TERMINATED")?.at ?? 2;
  const progressEnd = Math.max(termination, 0.5 + 0.001);
  const causal = deriveEukaryoticTranscriptionCausalStateAtTime(program, time);
  const visual = deriveEukaryoticTranscriptionVisualConsequences(causal);
  // The canonical projection still governs scientific event ordering. Between
  // those boundaries this presentation layer interpolates the visible opening
  // so scrubbing does not jump between binary geometry states.
  const bubbleOpenFraction = projection.dna.transcriptionBubble === "CLOSED" && time >= termination ? 0 : visual.localBubbleVisible;
  const nascentRnaVisualLength = Math.max(projection.transcription.visibleRnaLength, causal.rnaLength);

  return {
    schemaVersion: transcriptionPresentationStateSchemaVersion,
    exactTimeSeconds: projection.timeSeconds,
    normalizedProgress: clamp01(time / Math.max(0.001, progressEnd)),
    polymeraseGenePosition: causal.polymeraseAxisPosition,
    bubbleCenter: causal.polymeraseAxisPosition,
    bubbleOpenFraction,
    bubbleWidth: 0.075 + bubbleOpenFraction * 0.07,
    dnaRepairProgress: causal.bubbleClosure,
    nascentRnaVisualLength,
    nascentRnaAnchor: causal.polymeraseAxisPosition,
    polymeraseEngagement: causal.polymeraseEngagement,
    transcriptReleaseProgress: causal.transcriptRelease,
  };
}
