import { lerpNumber, smoothstep } from "./biology-interpolation.ts";
import type { TemporalFrame } from "./biology-timeline.ts";

export type TranscriptionMotionState = {
  polymeraseX: number;
  polymeraseY: number;
  bubbleCenterX: number;
  bubbleRadius: number;
  bubbleOpenAmount: number;
  rnaLength: number;
  rnaReleaseProgress: number;
  rnaOpacity: number;
};

export type ActionPotentialMotionState = {
  voltageMv: number;
  voltageNormalized: number;
  sodiumChannelState: string;
  potassiumChannelState: string;
  sodiumChannelOpenAmount: number;
  potassiumChannelOpenAmount: number;
  sodiumFluxActivity: number;
  potassiumFluxActivity: number;
  fluxProgress: number;
};

function voltageToNormalized(voltageMv: number): number {
  return (voltageMv + 90) / 130;
}

export function getTranscriptionMotionState(
  frame: TemporalFrame | null
): TranscriptionMotionState {
  if (!frame) {
    return {
      polymeraseX: -1.65,
      polymeraseY: 0.18,
      bubbleCenterX: -1.65,
      bubbleRadius: 0,
      bubbleOpenAmount: 0,
      rnaLength: 0,
      rnaReleaseProgress: 0,
      rnaOpacity: 0,
    };
  }

  const progress = smoothstep(frame.phaseProgress);

  if (frame.phaseId === "initiation") {
    const polymeraseX = lerpNumber(-2.25, -1.7, progress);
    return {
      polymeraseX,
      polymeraseY: lerpNumber(0.72, 0.18, progress),
      bubbleCenterX: polymeraseX,
      bubbleRadius: 0.32,
      bubbleOpenAmount: 0,
      rnaLength: 0,
      rnaReleaseProgress: 0,
      rnaOpacity: 0,
    };
  }

  if (frame.phaseId === "opening") {
    return {
      polymeraseX: -1.45,
      polymeraseY: 0.18,
      bubbleCenterX: -1.45,
      bubbleRadius: lerpNumber(0.26, 0.58, progress),
      bubbleOpenAmount: progress,
      rnaLength: lerpNumber(0, 0.18, progress),
      rnaReleaseProgress: 0,
      rnaOpacity: progress,
    };
  }

  if (frame.phaseId === "elongation") {
    const polymeraseX = lerpNumber(-1.35, 1.5, progress);
    return {
      polymeraseX,
      polymeraseY: 0.18,
      bubbleCenterX: polymeraseX,
      bubbleRadius: 0.56,
      bubbleOpenAmount: 1,
      rnaLength: lerpNumber(0.18, 2.35, progress),
      rnaReleaseProgress: 0,
      rnaOpacity: 1,
    };
  }

  if (frame.phaseId === "termination") {
    const releaseProgress = progress;
    return {
      polymeraseX: lerpNumber(1.5, 1.95, progress),
      polymeraseY: lerpNumber(0.18, 0.72, progress),
      bubbleCenterX: 1.5,
      bubbleRadius: 0.56,
      bubbleOpenAmount: 1 - progress,
      rnaLength: 2.35,
      rnaReleaseProgress: releaseProgress,
      rnaOpacity: 1,
    };
  }

  return {
    polymeraseX: -1.45,
    polymeraseY: 0.18,
    bubbleCenterX: -1.45,
    bubbleRadius: 0.48,
    bubbleOpenAmount: 1,
    rnaLength: 0.4,
    rnaReleaseProgress: 0,
    rnaOpacity: 1,
  };
}

export function getActionPotentialMotionState(
  frame: TemporalFrame | null
): ActionPotentialMotionState {
  if (!frame) {
    return {
      voltageMv: -70,
      voltageNormalized: voltageToNormalized(-70),
      sodiumChannelState: "closed",
      potassiumChannelState: "closed",
      sodiumChannelOpenAmount: 0,
      potassiumChannelOpenAmount: 0,
      sodiumFluxActivity: 0,
      potassiumFluxActivity: 0,
      fluxProgress: 0,
    };
  }

  const progress = smoothstep(frame.phaseProgress);
  const sodiumChannelState =
    frame.state["voltage-gated-sodium-channel"] ?? "closed";
  const potassiumChannelState =
    frame.state["voltage-gated-potassium-channel"] ?? "closed";

  let voltageMv = -70;
  let sodiumChannelOpenAmount = 0;
  let potassiumChannelOpenAmount = 0;
  let sodiumFluxActivity = 0;
  let potassiumFluxActivity = 0;

  if (frame.phaseId === "rest") {
    voltageMv = -70;
  } else if (frame.phaseId === "threshold") {
    voltageMv = lerpNumber(-70, -55, progress);
    sodiumChannelOpenAmount = lerpNumber(0.05, 0.35, progress);
    sodiumFluxActivity = lerpNumber(0, 0.25, progress);
  } else if (frame.phaseId === "depolarization") {
    voltageMv = lerpNumber(-55, 30, progress);
    sodiumChannelOpenAmount = 1;
    potassiumChannelOpenAmount = lerpNumber(0.05, 0.25, progress);
    sodiumFluxActivity = 1;
  } else if (frame.phaseId === "peak") {
    voltageMv = lerpNumber(30, 20, progress);
    sodiumChannelOpenAmount = lerpNumber(0.7, 0.15, progress);
    potassiumChannelOpenAmount = lerpNumber(0.35, 0.8, progress);
    sodiumFluxActivity = lerpNumber(0.5, 0.05, progress);
    potassiumFluxActivity = lerpNumber(0.35, 0.75, progress);
  } else if (frame.phaseId === "repolarization") {
    voltageMv = lerpNumber(20, -70, progress);
    sodiumChannelOpenAmount = 0.05;
    potassiumChannelOpenAmount = 1;
    potassiumFluxActivity = 1;
  } else if (frame.phaseId === "hyperpolarization") {
    voltageMv = lerpNumber(-70, -80, progress);
    potassiumChannelOpenAmount = lerpNumber(0.85, 0.35, progress);
    potassiumFluxActivity = lerpNumber(0.8, 0.35, progress);
  } else if (frame.phaseId === "recovery") {
    voltageMv = lerpNumber(-80, -70, progress);
    sodiumChannelOpenAmount = 0;
    potassiumChannelOpenAmount = lerpNumber(0.25, 0, progress);
    potassiumFluxActivity = lerpNumber(0.25, 0, progress);
  }

  return {
    voltageMv,
    voltageNormalized: voltageToNormalized(voltageMv),
    sodiumChannelState,
    potassiumChannelState,
    sodiumChannelOpenAmount,
    potassiumChannelOpenAmount,
    sodiumFluxActivity,
    potassiumFluxActivity,
    fluxProgress: frame.phaseProgress,
  };
}
