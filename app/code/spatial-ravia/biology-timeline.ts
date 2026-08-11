import type { BiologySceneSpec } from "./biology-scene-spec";

export const DEFAULT_PHASE_DURATION_MS = 2400;

export type TemporalPlan = NonNullable<BiologySceneSpec["temporal"]>;
export type TemporalPhase = TemporalPlan["phases"][number];

export type TemporalFrame = {
  timeMs: number;
  normalizedTime: number;
  phaseId: string;
  phaseLabel: string;
  phaseIndex: number;
  phaseProgress: number;
  phaseDurationMs: number;
  state: Record<string, string>;
  voltage?: string;
  dominantFlux?: string;
};

export function getOrderedPhases(temporal?: TemporalPlan): TemporalPhase[] {
  if (!temporal) {
    return [];
  }

  return [...temporal.phases].sort((left, right) => left.order - right.order);
}

export function getPhaseDurationMs(phase: TemporalPhase): number {
  return phase.durationMs ?? DEFAULT_PHASE_DURATION_MS;
}

export function getTotalDurationMs(temporal?: TemporalPlan): number {
  const total = getOrderedPhases(temporal).reduce(
    (sum, phase) => sum + getPhaseDurationMs(phase),
    0
  );

  return Math.max(total, 0);
}

export function clampTimeMs(temporal: TemporalPlan | undefined, timeMs: number) {
  const totalDurationMs = getTotalDurationMs(temporal);

  if (totalDurationMs <= 0) {
    return 0;
  }

  return Math.min(Math.max(timeMs, 0), totalDurationMs);
}

export function getTemporalFrame(
  temporal: TemporalPlan | undefined,
  timeMs: number
): TemporalFrame | null {
  const phases = getOrderedPhases(temporal);
  const totalDurationMs = getTotalDurationMs(temporal);

  if (!temporal || phases.length === 0 || totalDurationMs <= 0) {
    return null;
  }

  const clampedTimeMs = clampTimeMs(temporal, timeMs);
  let elapsedMs = 0;

  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index];
    const phaseDurationMs = getPhaseDurationMs(phase);
    const phaseStartMs = elapsedMs;
    const phaseEndMs = elapsedMs + phaseDurationMs;
    const isLastPhase = index === phases.length - 1;

    if (clampedTimeMs < phaseEndMs || isLastPhase) {
      const localTimeMs = Math.min(
        Math.max(clampedTimeMs - phaseStartMs, 0),
        phaseDurationMs
      );

      return {
        timeMs: clampedTimeMs,
        normalizedTime: totalDurationMs > 0 ? clampedTimeMs / totalDurationMs : 0,
        phaseId: phase.id,
        phaseLabel: phase.label,
        phaseIndex: index,
        phaseProgress:
          phaseDurationMs > 0 ? localTimeMs / phaseDurationMs : 1,
        phaseDurationMs,
        state: phase.states,
        voltage: phase.voltage,
        dominantFlux: phase.dominantFlux,
      };
    }

    elapsedMs = phaseEndMs;
  }

  return null;
}

export function getPhaseStartTimeMs(
  temporal: TemporalPlan | undefined,
  phaseId: string
): number | null {
  const phases = getOrderedPhases(temporal);
  let elapsedMs = 0;

  for (const phase of phases) {
    if (phase.id === phaseId) {
      return elapsedMs;
    }

    elapsedMs += getPhaseDurationMs(phase);
  }

  return null;
}

export function getInitialTimeMs(temporal: TemporalPlan | undefined): number {
  if (!temporal) {
    return 0;
  }

  return getPhaseStartTimeMs(temporal, temporal.currentPhase) ?? 0;
}
