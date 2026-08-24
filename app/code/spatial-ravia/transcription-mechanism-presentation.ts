import type { TranscriptionPresentationStateV1 } from "./transcription-presentation-state.ts";

export type TranscriptionMechanismStage = "START" | "INITIATION" | "ELONGATION" | "TERMINATION";
export type TranscriptionMechanismVisualState = Readonly<{
  stage: TranscriptionMechanismStage;
  polymeraseMode: "AVAILABLE" | "PROMOTER_ENGAGED" | "TRANSLOCATING" | "RELEASED";
  structuralCoreVisibility: number;
  bubbleVisibility: number;
  transcriptVisibility: number;
  teachingLabel: string;
}>;

export function deriveTranscriptionMechanismVisualState(state: Pick<TranscriptionPresentationStateV1, "exactTimeSeconds" | "polymeraseEngagement" | "bubbleOpenFraction" | "nascentRnaVisualLength" | "transcriptReleaseProgress">): TranscriptionMechanismVisualState {
  const time = state.exactTimeSeconds;
  const stage: TranscriptionMechanismStage = time <= 0.001 ? "START" : time <= 0.5 ? "INITIATION" : time < 2 ? "ELONGATION" : "TERMINATION";
  const polymeraseMode = stage === "START" ? "AVAILABLE" : stage === "INITIATION" ? "PROMOTER_ENGAGED" : stage === "ELONGATION" ? "TRANSLOCATING" : "RELEASED";
  return {
    stage,
    polymeraseMode,
    structuralCoreVisibility: stage === "START" ? 0.38 : stage === "TERMINATION" ? 0.52 * (1 - state.transcriptReleaseProgress * 0.5) : 1,
    bubbleVisibility: state.bubbleOpenFraction,
    transcriptVisibility: state.nascentRnaVisualLength > 0 ? 1 : 0,
    teachingLabel: stage === "START" ? "DNA closed · polymerase available" : stage === "INITIATION" ? "Promoter engaged · bubble opening" : stage === "ELONGATION" ? "Polymerase translocating · RNA growing" : "Transcription resolved · RNA released",
  };
}
