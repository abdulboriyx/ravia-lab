import { sampleCanonicalDna, type DnaHelixSample } from "./DnaVisualSystem.ts";
import { rnaMaterialPalette, rnaTopologyState, sampleCanonicalRna, type RnaPoint, type RnaResidueSample, type RnaTheme } from "./RnaVisualSystem.ts";
import type { RnaSceneSpec } from "./rna-contract.ts";

export type NascentTranscriptChemistry = {
  kind: "RNA" | "DNA";
  sugar: "ribose" | "deoxyribose";
  hasTwoPrimeHydroxyl: boolean;
  bases: readonly string[];
};

export type NascentTranscriptLabel = {
  text: string;
  target: "nascent-rna" | "dna-template" | "rnap" | "transcription-exit";
  priority: "primary" | "secondary" | "tertiary";
};

export type NascentTranscriptPresentation = {
  family: "nascentTranscript";
  mode: "newly-synthesized" | "pre-mRNA";
  static: true;
  hierarchy: {
    primary: "nascent-rna";
    secondary: "dna-template";
    tertiary: "rnap" | "none";
  };
  rna: {
    id: "nascent-rna";
    samples: readonly RnaResidueSample[];
    chemistry: NascentTranscriptChemistry;
    visibleLength: number;
    emergingFrom: "transcription-exit";
  };
  dna: {
    id: "dna-template";
    samples: readonly DnaHelixSample[];
    chemistry: NascentTranscriptChemistry;
    opacity: number;
    localContextOnly: true;
    geometrySource: "canonical-dna-visual-system";
  };
  rnap: {
    id: "rnap";
    visible: boolean;
    opacity: number;
    role: "tertiary-context";
    localContextOnly: true;
  };
  exit: { id: "transcription-exit"; position: RnaPoint; direction: RnaPoint };
  labels: readonly NascentTranscriptLabel[];
  materials: ReturnType<typeof rnaMaterialPalette>;
};

export type NascentTranscriptOptions = {
  theme?: RnaTheme;
  length?: number;
  includeRnap?: boolean;
};

const rnaChemistry: NascentTranscriptChemistry = {
  kind: "RNA",
  sugar: "ribose",
  hasTwoPrimeHydroxyl: true,
  bases: ["A", "U", "G", "C"],
};

const dnaChemistry: NascentTranscriptChemistry = {
  kind: "DNA",
  sugar: "deoxyribose",
  hasTwoPrimeHydroxyl: false,
  bases: ["A", "T", "G", "C"],
};

function isPreMrna(spec: RnaSceneSpec) {
  return spec.rnaType === "mRNA" || spec.processingState === "unprocessed" || /pre[- ]?mrna/i.test(spec.focus);
}

function rnapRequested(spec: RnaSceneSpec, options: NascentTranscriptOptions) {
  return options.includeRnap ?? /rna polymerase|rnap/i.test(`${spec.focus} ${spec.annotations.join(" ")}`);
}

/** Place the shared RNA substrate with its newly synthesized 3′ end at the exit. */
function placeEmergingRna(samples: readonly RnaResidueSample[], exit: RnaPoint): RnaResidueSample[] {
  return samples.map((sample, index) => {
    const progress = (samples.length - 1 - index) / Math.max(1, samples.length - 1);
    const distance = progress * 1.7;
    const map = (point: RnaPoint, lift = 0): RnaPoint => [
      exit[0] - distance * 0.42 + point[1] * 0.08,
      exit[1] - distance * 0.58 + point[1] * 0.08 + lift,
      exit[2] + point[2] * 0.22 + 0.18,
    ];
    return { ...sample, backbone: map(sample.backbone), ribose: map(sample.ribose), basePosition: map(sample.basePosition, 0.03), fivePrime: map(sample.fivePrime), threePrime: map(sample.threePrime) };
  });
}

/** Reuse canonical DNA geometry as a quiet local template; no second DNA construction is introduced here. */
function placeLocalDna(samples: readonly DnaHelixSample[]): DnaHelixSample[] {
  return samples.map((sample) => {
    const map = (point: readonly [number, number, number]): [number, number, number] => [point[2] * 0.065 - 0.18, point[1] * 0.04 + 0.28, point[0] * 0.04 - 0.08];
    return { ...sample, strandA: map(sample.strandA), strandB: map(sample.strandB), basePairStart: map(sample.basePairStart), basePairEnd: map(sample.basePairEnd) };
  });
}

export function deriveRnaNascentTranscriptPresentation(spec: RnaSceneSpec, options: NascentTranscriptOptions = {}): NascentTranscriptPresentation {
  // Nascent RNA is intentionally a short product at the transcription site.
  // Longer shared-RNA samples read as a mature transcript and create loops in
  // the small teaching composition.
  const length = Math.max(8, Math.round(options.length ?? (isPreMrna(spec) ? 12 : 10)));
  const exit: RnaPoint = [0.42, 0.06, 0.12];
  const sharedRna = sampleCanonicalRna(length, {
    topology: "single-stranded",
    lod: 2,
    source: "canonical-procedural",
    topologyState: rnaTopologyState("singleStrand", length),
  });
  const sharedDna = sampleCanonicalDna(8, { topology: "locally-open", lod: "polymer", localState: "canonical", openCenter: 3.5, openBasePairs: 3 });
  const showRnap = rnapRequested(spec, options);
  const dnaOpacity = spec.dnaContext.required ? 0.58 : 0.28;
  const mode = isPreMrna(spec) ? "pre-mRNA" : "newly-synthesized";
  // Keep captions sparse.  A DNA-inclusive request gets one label per
  // substrate; RNA-only requests get a product + emergence cue.  This avoids
  // the former three-caption pile-up over the exit site.
  const labels: NascentTranscriptLabel[] = spec.dnaContext.required
    ? [
      { text: "DNA template", target: "dna-template", priority: "secondary" },
      { text: mode === "pre-mRNA" ? "pre-mRNA (unprocessed)" : "Nascent RNA", target: "nascent-rna", priority: "primary" },
      ...(showRnap ? [{ text: "RNA polymerase", target: "rnap" as const, priority: "tertiary" as const }] : []),
    ]
    : [
      { text: mode === "pre-mRNA" ? "pre-mRNA (unprocessed)" : "Nascent RNA", target: "nascent-rna", priority: "primary" },
      { text: "RNA exit", target: "transcription-exit", priority: "secondary" },
      ...(showRnap ? [{ text: "RNA polymerase", target: "rnap" as const, priority: "tertiary" as const }] : []),
    ];
  return {
    family: "nascentTranscript",
    mode,
    static: true,
    hierarchy: { primary: "nascent-rna", secondary: "dna-template", tertiary: showRnap ? "rnap" : "none" },
    rna: { id: "nascent-rna", samples: placeEmergingRna(sharedRna, exit), chemistry: rnaChemistry, visibleLength: length, emergingFrom: "transcription-exit" },
    dna: { id: "dna-template", samples: placeLocalDna(sharedDna), chemistry: dnaChemistry, opacity: dnaOpacity, localContextOnly: true, geometrySource: "canonical-dna-visual-system" },
    rnap: { id: "rnap", visible: showRnap, opacity: showRnap ? Math.min(0.22, dnaOpacity * 0.7) : 0, role: "tertiary-context", localContextOnly: true },
    exit: { id: "transcription-exit", position: exit, direction: [0.18, -0.34, 0] },
    labels,
    materials: rnaMaterialPalette(options.theme ?? "dark"),
  };
}

export function isValidRnaNascentTranscriptPresentation(presentation: NascentTranscriptPresentation) {
  const rna = presentation.rna.samples;
  const dna = presentation.dna.samples;
  const direction = presentation.exit.direction;
  return presentation.family === "nascentTranscript"
    && presentation.static
    && presentation.hierarchy.primary === "nascent-rna"
    && presentation.hierarchy.secondary === "dna-template"
    && rna.length >= 8
    && dna.length > 0
    && presentation.rna.visibleLength === rna.length
    && rna.every((sample) => [...sample.backbone, ...sample.ribose, ...sample.basePosition].every(Number.isFinite))
    && dna.every((sample) => [...sample.strandA, ...sample.strandB].every(Number.isFinite))
    && rna.at(-1)!.backbone[1] > rna[0].backbone[1]
    && Math.abs(direction[0]) > 0
    && presentation.rna.chemistry.kind !== presentation.dna.chemistry.kind
    && presentation.rna.chemistry.hasTwoPrimeHydroxyl
    && !presentation.dna.chemistry.hasTwoPrimeHydroxyl
    && presentation.dna.geometrySource === "canonical-dna-visual-system"
    && presentation.labels.some((label) => label.target === "nascent-rna" && label.priority === "primary")
    && presentation.labels.every((label) => label.priority !== "tertiary" || presentation.rnap.visible);
}
