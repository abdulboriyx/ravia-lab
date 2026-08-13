import { getPhaseStartTimeMs, getPhaseDurationMs, type TemporalPlan } from "./biology-timeline.ts";
import type { TranslationDisplayIntent } from "./biology-translation-display-intent.ts";

export type FocusedTimelineWindow = { startMs: number; endMs: number; pauseAtEnd: boolean };

const phaseWindows: Record<Exclude<TranslationDisplayIntent, "overview">, readonly [string, string]> = {
  transfer: ["peptide-transfer", "peptide-transfer"],
  recognition: ["aminoacyl-trna-entry", "codon-recognition"],
  translocation: ["translocation", "translocation"],
  entry: ["aminoacyl-trna-entry", "codon-recognition"],
  termination: ["termination", "termination"],
};

export function deriveFocusedTimelineWindow(temporal: TemporalPlan | undefined, intent: TranslationDisplayIntent): FocusedTimelineWindow | undefined {
  if (!temporal || intent === "overview") return undefined;
  const [startPhase, endPhase] = phaseWindows[intent];
  const startMs = getPhaseStartTimeMs(temporal, startPhase);
  const endStartMs = getPhaseStartTimeMs(temporal, endPhase);
  const endPhaseDefinition = temporal.phases.find((phase) => phase.id === endPhase);
  if (startMs === null || endStartMs === null || !endPhaseDefinition) return undefined;
  // `getTemporalFrame` assigns an exact phase boundary to the next phase.
  // Keep the focused interval strictly inside its final intended phase so a
  // paused transfer view can never report the following translocation phase.
  return { startMs, endMs: Math.max(startMs, endStartMs + getPhaseDurationMs(endPhaseDefinition) - 1), pauseAtEnd: true };
}
