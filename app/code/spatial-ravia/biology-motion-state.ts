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

export type ReplicationMotionState = {
  forkProgress: number;
  forkX: number;
  forkOpenAmount: number;
  leadingProgress: number;
  laggingCycleIndex: number;
  laggingCycleProgress: number;
  completedFragments: number;
  activePrimerProgress: number;
  activeFragmentProgress: number;
  ligationProgress: number;
};

export type TranslationSiteOccupancy = {
  occupied: boolean;
  trna: "none" | "incoming" | "aminoacyl" | "peptidyl" | "deacylated" | "initiator" | "release-factor";
  carriesAminoAcid: boolean;
  carriesPeptide: boolean;
  exiting: boolean;
};

export type TranslationMotionState = {
  overallProgress: number;
  phaseId: string;
  cycleIndex: number;
  cycleProgress: number;
  completedCycles: number;
  peptideLength: number;
  mrnaOffset: number;
  incomingTrnaProgress: number;
  recognitionProgress: number;
  peptideTransferProgress: number;
  translocationProgress: number;
  exitingTrnaProgress: number;
  terminationProgress: number;
  releaseFactorProgress: number;
  polypeptideReleaseProgress: number;
  aSiteOccupancy: TranslationSiteOccupancy;
  pSiteOccupancy: TranslationSiteOccupancy;
  eSiteOccupancy: TranslationSiteOccupancy;
};

export type RasSwitchState = "gdp" | "exchanging" | "gtp";
export type SignalingResponseState = "absent" | "primed" | "ready";

export type SignalingMotionState = {
  overallProgress: number;
  phaseId: string;
  ligandApproachProgress: number;
  ligandBound: boolean;
  dimerizationProgress: number;
  receptorActivationProgress: number;
  adaptorRecruitmentProgress: number;
  sosRecruitmentProgress: number;
  rasActivationProgress: number;
  rasState: RasSwitchState;
  rafActivationProgress: number;
  mekActivationProgress: number;
  erkActivationProgress: number;
  erkTranslocationProgress: number;
  responseState: SignalingResponseState;
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

export function getReplicationMotionState(
  frame: TemporalFrame | null
): ReplicationMotionState {
  if (!frame) {
    return {
      forkProgress: 0,
      forkX: -1.45,
      forkOpenAmount: 0,
      leadingProgress: 0,
      laggingCycleIndex: 0,
      laggingCycleProgress: 0,
      completedFragments: 0,
      activePrimerProgress: 0,
      activeFragmentProgress: 0,
      ligationProgress: 0,
    };
  }

  const progress = smoothstep(frame.phaseProgress);
  let forkProgress = 0;
  let forkOpenAmount = 0;
  let leadingProgress = 0;
  let laggingOverallProgress = 0;
  let ligationProgress = 0;

  if (frame.phaseId === "setup") {
    forkProgress = 0;
    forkOpenAmount = 0;
  } else if (frame.phaseId === "fork-opening") {
    forkProgress = lerpNumber(0, 0.12, progress);
    forkOpenAmount = progress;
    leadingProgress = lerpNumber(0, 0.08, progress);
    laggingOverallProgress = lerpNumber(0, 0.05, progress);
  } else if (frame.phaseId === "primer-placement") {
    forkProgress = lerpNumber(0.12, 0.24, progress);
    forkOpenAmount = 1;
    leadingProgress = lerpNumber(0.08, 0.22, progress);
    laggingOverallProgress = lerpNumber(0.05, 0.18, progress);
  } else if (frame.phaseId === "elongation") {
    forkProgress = lerpNumber(0.24, 0.72, progress);
    forkOpenAmount = 1;
    leadingProgress = lerpNumber(0.22, 0.72, progress);
    laggingOverallProgress = lerpNumber(0.18, 0.68, progress);
  } else if (frame.phaseId === "lagging-fragment-cycle") {
    forkProgress = lerpNumber(0.72, 0.86, progress);
    forkOpenAmount = 1;
    leadingProgress = lerpNumber(0.72, 0.86, progress);
    laggingOverallProgress = lerpNumber(0.68, 0.86, progress);
  } else if (frame.phaseId === "ligation") {
    forkProgress = lerpNumber(0.86, 0.94, progress);
    forkOpenAmount = 1;
    leadingProgress = lerpNumber(0.86, 0.96, progress);
    laggingOverallProgress = 0.9;
    ligationProgress = progress;
  } else if (frame.phaseId === "completion") {
    forkProgress = 1;
    forkOpenAmount = lerpNumber(1, 0.72, progress);
    leadingProgress = 1;
    laggingOverallProgress = 1;
    ligationProgress = 1;
  }

  const cycleCount = 4;
  const rawCycle = Math.min(laggingOverallProgress * cycleCount, cycleCount - 0.0001);
  const laggingCycleIndex = Math.floor(Math.max(rawCycle, 0));
  const laggingCycleProgress = rawCycle - laggingCycleIndex;
  const completedFragments = Math.min(
    cycleCount,
    Math.floor(laggingOverallProgress * cycleCount)
  );

  return {
    forkProgress,
    forkX: lerpNumber(-1.45, 1.45, forkProgress),
    forkOpenAmount,
    leadingProgress,
    laggingCycleIndex,
    laggingCycleProgress,
    completedFragments,
    activePrimerProgress: smoothstep(Math.min(laggingCycleProgress * 2.6, 1)),
    activeFragmentProgress: smoothstep(
      Math.max(Math.min((laggingCycleProgress - 0.28) / 0.72, 1), 0)
    ),
    ligationProgress,
  };
}

function emptyTranslationSite(): TranslationSiteOccupancy {
  return {
    occupied: false,
    trna: "none",
    carriesAminoAcid: false,
    carriesPeptide: false,
    exiting: false,
  };
}

function translationSite(
  trna: TranslationSiteOccupancy["trna"],
  options: Partial<Omit<TranslationSiteOccupancy, "trna" | "occupied">> = {}
): TranslationSiteOccupancy {
  return {
    occupied: trna !== "none",
    trna,
    carriesAminoAcid: options.carriesAminoAcid ?? trna === "aminoacyl",
    carriesPeptide: options.carriesPeptide ?? trna === "peptidyl",
    exiting: options.exiting ?? false,
  };
}

export function getTranslationMotionState(
  frame: TemporalFrame | null
): TranslationMotionState {
  const phaseId = frame?.phaseId ?? "aminoacyl-trna-entry";
  const progress = smoothstep(frame?.phaseProgress ?? 0);
  let cycleIndex = 0;
  let cycleProgress = 0;
  let completedCycles = 0;
  let peptideLength = 0.18;
  let mrnaOffset = 0;
  let incomingTrnaProgress = 0;
  let recognitionProgress = 0;
  let peptideTransferProgress = 0;
  let translocationProgress = 0;
  let exitingTrnaProgress = 0;
  let terminationProgress = 0;
  let releaseFactorProgress = 0;
  let polypeptideReleaseProgress = 0;
  let aSiteOccupancy = emptyTranslationSite();
  let pSiteOccupancy = translationSite("peptidyl", { carriesPeptide: true });
  let eSiteOccupancy = emptyTranslationSite();

  if (phaseId === "initiation") {
    peptideLength = lerpNumber(0.08, 0.18, progress);
    pSiteOccupancy = translationSite("initiator", { carriesPeptide: true });
  } else if (phaseId === "aminoacyl-trna-entry") {
    incomingTrnaProgress = progress;
    peptideLength = 0.22;
    aSiteOccupancy =
      progress > 0.08
        ? translationSite("incoming", { carriesAminoAcid: true })
        : emptyTranslationSite();
  } else if (phaseId === "codon-recognition") {
    incomingTrnaProgress = 1;
    recognitionProgress = progress;
    peptideLength = 0.24;
    aSiteOccupancy = translationSite("aminoacyl", { carriesAminoAcid: true });
  } else if (phaseId === "peptide-transfer") {
    incomingTrnaProgress = 1;
    recognitionProgress = 1;
    peptideTransferProgress = progress;
    peptideLength = lerpNumber(0.24, 0.36, progress);
    aSiteOccupancy = translationSite("aminoacyl", {
      carriesAminoAcid: progress < 0.45,
      carriesPeptide: progress >= 0.45,
    });
    pSiteOccupancy = translationSite("peptidyl", {
      carriesPeptide: progress < 0.55,
    });
  } else if (phaseId === "translocation") {
    incomingTrnaProgress = 1;
    recognitionProgress = 1;
    peptideTransferProgress = 1;
    translocationProgress = progress;
    peptideLength = 0.38;
    mrnaOffset = progress;
    aSiteOccupancy = translationSite("peptidyl", { carriesPeptide: true });
    pSiteOccupancy = translationSite("deacylated");
    eSiteOccupancy = progress > 0.55 ? translationSite("deacylated") : emptyTranslationSite();
  } else if (phaseId === "trna-exit") {
    cycleIndex = 1;
    completedCycles = 1;
    exitingTrnaProgress = progress;
    peptideLength = 0.42;
    mrnaOffset = 1;
    pSiteOccupancy = translationSite("peptidyl", { carriesPeptide: true });
    eSiteOccupancy = translationSite("deacylated", { exiting: true });
  } else if (phaseId === "elongation-cycle") {
    const visibleCycleCount = 4;
    const rawCycle = Math.min(progress * visibleCycleCount, visibleCycleCount - 0.0001);
    cycleIndex = Math.floor(rawCycle) + 1;
    cycleProgress = rawCycle - Math.floor(rawCycle);
    completedCycles = Math.floor(rawCycle) + 1;
    peptideLength = lerpNumber(0.42, 1.35, progress);
    mrnaOffset = lerpNumber(1, 5, progress);

    incomingTrnaProgress = smoothstep(Math.min(cycleProgress * 3, 1));
    recognitionProgress = smoothstep(
      Math.max(Math.min((cycleProgress - 0.18) / 0.18, 1), 0)
    );
    peptideTransferProgress = smoothstep(
      Math.max(Math.min((cycleProgress - 0.36) / 0.22, 1), 0)
    );
    translocationProgress = smoothstep(
      Math.max(Math.min((cycleProgress - 0.58) / 0.24, 1), 0)
    );
    exitingTrnaProgress = smoothstep(
      Math.max(Math.min((cycleProgress - 0.78) / 0.22, 1), 0)
    );

    aSiteOccupancy =
      cycleProgress < 0.78
        ? translationSite(
            peptideTransferProgress > 0.5 ? "peptidyl" : "aminoacyl",
            {
              carriesAminoAcid: peptideTransferProgress <= 0.5,
              carriesPeptide: peptideTransferProgress > 0.5,
            }
          )
        : emptyTranslationSite();
    pSiteOccupancy = translationSite("peptidyl", {
      carriesPeptide: peptideTransferProgress <= 0.5 || translocationProgress > 0.35,
    });
    eSiteOccupancy =
      translocationProgress > 0.45
        ? translationSite("deacylated", { exiting: exitingTrnaProgress > 0 })
        : emptyTranslationSite();
  } else if (phaseId === "termination") {
    cycleIndex = 5;
    completedCycles = 5;
    peptideLength = 1.35;
    mrnaOffset = 5;
    terminationProgress = progress;
    releaseFactorProgress = smoothstep(Math.min(progress * 2.2, 1));
    polypeptideReleaseProgress = smoothstep(
      Math.max(Math.min((progress - 0.42) / 0.58, 1), 0)
    );
    aSiteOccupancy = translationSite("release-factor");
    pSiteOccupancy = translationSite("peptidyl", {
      carriesPeptide: polypeptideReleaseProgress < 0.6,
    });
  }

  return {
    overallProgress: frame?.normalizedTime ?? 0,
    phaseId,
    cycleIndex,
    cycleProgress,
    completedCycles,
    peptideLength,
    mrnaOffset,
    incomingTrnaProgress,
    recognitionProgress,
    peptideTransferProgress,
    translocationProgress,
    exitingTrnaProgress,
    terminationProgress,
    releaseFactorProgress,
    polypeptideReleaseProgress,
    aSiteOccupancy,
    pSiteOccupancy,
    eSiteOccupancy,
  };
}

function completedProgress(frame: TemporalFrame | null, phaseId: string): number {
  if (!frame) return 0;
  if (frame.phaseId === phaseId) return smoothstep(frame.phaseProgress);
  return frame.phaseIndex > signalingPhaseIndex[phaseId] ? 1 : 0;
}

const signalingPhaseIndex: Record<string, number> = {
  resting: 0,
  "ligand-approach": 1,
  "ligand-binding": 2,
  dimerization: 3,
  "receptor-activation": 4,
  "adaptor-recruitment": 5,
  "ras-activation": 6,
  "raf-activation": 7,
  "mek-activation": 8,
  "erk-activation": 9,
  "erk-translocation": 10,
  "response-ready": 11,
};

export function getSignalingMotionState(
  frame: TemporalFrame | null
): SignalingMotionState {
  const phaseId = frame?.phaseId ?? "resting";
  const ligandApproachProgress = completedProgress(frame, "ligand-approach");
  const rasActivationProgress = completedProgress(frame, "ras-activation");
  const responseState: SignalingResponseState =
    completedProgress(frame, "response-ready") > 0
      ? "ready"
      : completedProgress(frame, "erk-translocation") > 0
      ? "primed"
      : "absent";

  return {
    overallProgress: frame?.normalizedTime ?? 0,
    phaseId,
    ligandApproachProgress,
    ligandBound: completedProgress(frame, "ligand-binding") > 0,
    dimerizationProgress: completedProgress(frame, "dimerization"),
    receptorActivationProgress: completedProgress(frame, "receptor-activation"),
    adaptorRecruitmentProgress: completedProgress(frame, "adaptor-recruitment"),
    sosRecruitmentProgress: completedProgress(frame, "adaptor-recruitment"),
    rasActivationProgress,
    rasState:
      rasActivationProgress >= 1
        ? "gtp"
        : rasActivationProgress > 0
        ? "exchanging"
        : "gdp",
    rafActivationProgress: completedProgress(frame, "raf-activation"),
    mekActivationProgress: completedProgress(frame, "mek-activation"),
    erkActivationProgress: completedProgress(frame, "erk-activation"),
    erkTranslocationProgress: completedProgress(frame, "erk-translocation"),
    responseState,
  };
}
