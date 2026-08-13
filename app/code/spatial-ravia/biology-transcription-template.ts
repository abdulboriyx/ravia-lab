import { sampleCanonicalDna } from "./DnaVisualSystem.ts";
import type { DnaSceneFamily } from "./biology-dna-representation-contract.ts";

export type TranscriptionTemplateMode = "bubble-only" | "rnap-on-dna" | "dna-to-rna";

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
  rnap: { visible: boolean; opacity: number; framing: "local-context" | "none" };
  nascentRna: { visible: boolean; exit: "bubble-local" | "none" };
  camera: { framing: "bubble-centered"; excludesBroadComplex: true; fov: number };
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

  return {
    mode,
    dna: {
      basePairCount: 16,
      openCenter: 8,
      openBasePairs: 6,
      pairedOutsideBubble: true,
      templateStrand: "strandB",
    },
    rnap: { visible: input.hasRnap, opacity: 0.7, framing: input.hasRnap ? "local-context" : "none" },
    nascentRna: { visible: input.hasNascentRna, exit: input.hasNascentRna ? "bubble-local" : "none" },
    camera: { framing: "bubble-centered", excludesBroadComplex: true, fov: 30 },
    motion: "static-first",
  };
}

/** RNAP context is specific to the transcription family; DNA-only families cannot opt in. */
export function canUseTranscriptionRnapContext(family: DnaSceneFamily) {
  return family === "transcription";
}

export function sampleTranscriptionBubble(plan: TranscriptionTemplatePlan) {
  return sampleCanonicalDna(plan.dna.basePairCount, {
    topology: "locally-open",
    lod: "polymer",
    localState: "canonical",
    openCenter: plan.dna.openCenter,
    openBasePairs: plan.dna.openBasePairs,
  });
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
    && (!plan.rnap.visible || plan.rnap.framing === "local-context")
    && (!plan.nascentRna.visible || plan.nascentRna.exit === "bubble-local");
}
