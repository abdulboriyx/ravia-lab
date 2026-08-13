/**
 * Canonical DNA visualization contract for Spatial Ravia.
 *
 * This is deliberately declarative: it specifies the scientific visual
 * language a renderer must follow, without selecting a rendering engine or
 * changing biology/timeline state. Scene-family renderers consume this module
 * rather than inventing independent DNA styles.
 */

export const dnaSceneFamilies = [
  "structure",
  "sequence-regulation",
  "replication",
  "transcription",
  "damage-repair",
  "packaging",
  "local-chemistry",
] as const;

export type DnaSceneFamily = (typeof dnaSceneFamilies)[number];
export type DnaDetailLevel = "context" | "polymer" | "nucleotide" | "residue" | "atom";
export type DnaStrandState = "double-stranded" | "single-stranded" | "locally-open";
export type DnaCameraIntent = "whole-helix" | "regulatory-region" | "fork" | "transcription-bubble" | "repair-site" | "packaging-domain" | "local-chemistry";
export type DnaStructuralEvidenceSource = "idealized-b-dna" | "deposited-structure" | "grounded-complex" | "hybrid-evidence";
export type DnaLocalChemistryRequirement = "none" | "optional-selected-nucleotides" | "selected-nucleotides" | "selected-atoms-and-bonds";
export type DnaActorRole =
  | "dna"
  | "promoter-or-gene-region"
  | "replication-machinery"
  | "rna-polymerase"
  | "nascent-rna"
  | "repair-machinery"
  | "histone-or-packaging-complex"
  | "local-ligand-or-damage";

export type DnaFocalRegion = {
  kind: "whole-molecule" | "sequence-region" | "fork" | "transcription-bubble" | "lesion-or-repair-site" | "nucleosome-or-loop" | "selected-base-pair-or-residue";
  maxOpenBasePairs?: number;
  includesStrandDirection: boolean;
};

export type DnaAnnotationPolicy = {
  allowed: readonly ("5-prime" | "3-prime" | "promoter" | "gene" | "template" | "coding" | "lesion" | "repair" | "bubble" | "nucleosome" | "base-pair")[];
  maximumVisibleLabels: number;
  placement: "dna-attached" | "camera-aware-dna-attached" | "local-only";
};

export type DnaRepresentationSpecification = {
  family: DnaSceneFamily;
  representation: DnaDetailLevel;
  strandState: DnaStrandState;
  focalRegion: DnaFocalRegion;
  annotations: DnaAnnotationPolicy;
  relevantActors: readonly DnaActorRole[];
  cameraIntent: DnaCameraIntent;
  structuralEvidence: DnaStructuralEvidenceSource;
  localChemistry: DnaLocalChemistryRequirement;
};

export const dnaVisualGrammar = {
  bDna: {
    handedness: "right-handed" as const,
    risePerBasePairAngstrom: 3.4,
    basePairsPerTurn: 10.5,
    helixDiameterAngstrom: 20,
    backboneStyle: "paired-thin-backbones" as const,
    basePairStyle: "restrained-rungs" as const,
  },
  strands: {
    coding: "nucleicBackboneA",
    template: "nucleicBackboneB",
    singleStrandOpacity: 0.92,
    duplexOpacity: 0.86,
    locallyOpenState: "separate-only-within-focal-region" as const,
  },
  nucleotides: {
    distantDetail: "backbone-and-sparse-base-pairs" as const,
    focalDetail: "individual-nucleotide-or-base-glyphs" as const,
    selectedDetail: "residue-or-atom-detail" as const,
  },
  directionality: {
    convention: "5-prime-to-3-prime" as const,
    labels: "minimal-dna-attached" as const,
  },
  atomsAndBonds: {
    atomScale: "smaller-than-polymer-backbone" as const,
    bondScale: "smaller-than-atoms" as const,
    scope: "selected-local-residues-only" as const,
    coloring: "restrained-element-convention" as const,
  },
  annotations: {
    policy: "secondary-camera-aware-and-dna-attached" as const,
    detachedRegionBlocks: false,
  },
  themes: {
    light: { background: "near-white", labels: "dark", contextContrast: "subdued" },
    dark: { background: "near-black", labels: "light", contextContrast: "subdued" },
  },
} as const;

const attachedSequenceAnnotations: DnaAnnotationPolicy = {
  allowed: ["5-prime", "3-prime", "promoter", "gene", "template", "coding"],
  maximumVisibleLabels: 4,
  placement: "camera-aware-dna-attached",
};

export const dnaRepresentationRegistry: Readonly<Record<DnaSceneFamily, DnaRepresentationSpecification>> = {
  structure: {
    family: "structure",
    representation: "nucleotide",
    strandState: "double-stranded",
    focalRegion: { kind: "whole-molecule", includesStrandDirection: true },
    annotations: { allowed: ["5-prime", "3-prime", "base-pair"], maximumVisibleLabels: 3, placement: "camera-aware-dna-attached" },
    relevantActors: ["dna"],
    cameraIntent: "whole-helix",
    structuralEvidence: "idealized-b-dna",
    localChemistry: "optional-selected-nucleotides",
  },
  "sequence-regulation": {
    family: "sequence-regulation",
    representation: "nucleotide",
    strandState: "double-stranded",
    focalRegion: { kind: "sequence-region", includesStrandDirection: true },
    annotations: attachedSequenceAnnotations,
    relevantActors: ["dna", "promoter-or-gene-region"],
    cameraIntent: "regulatory-region",
    structuralEvidence: "hybrid-evidence",
    localChemistry: "selected-nucleotides",
  },
  replication: {
    family: "replication",
    representation: "polymer",
    strandState: "locally-open",
    focalRegion: { kind: "fork", maxOpenBasePairs: 12, includesStrandDirection: true },
    annotations: { allowed: ["5-prime", "3-prime"], maximumVisibleLabels: 4, placement: "dna-attached" },
    relevantActors: ["dna", "replication-machinery"],
    cameraIntent: "fork",
    structuralEvidence: "grounded-complex",
    localChemistry: "optional-selected-nucleotides",
  },
  transcription: {
    family: "transcription",
    representation: "polymer",
    strandState: "locally-open",
    focalRegion: { kind: "transcription-bubble", maxOpenBasePairs: 14, includesStrandDirection: true },
    annotations: { allowed: ["template", "coding", "bubble"], maximumVisibleLabels: 3, placement: "local-only" },
    relevantActors: ["dna", "rna-polymerase", "nascent-rna"],
    cameraIntent: "transcription-bubble",
    structuralEvidence: "grounded-complex",
    localChemistry: "selected-nucleotides",
  },
  "damage-repair": {
    family: "damage-repair",
    representation: "residue",
    strandState: "double-stranded",
    focalRegion: { kind: "lesion-or-repair-site", includesStrandDirection: true },
    annotations: { allowed: ["lesion", "repair", "base-pair"], maximumVisibleLabels: 3, placement: "local-only" },
    relevantActors: ["dna", "repair-machinery", "local-ligand-or-damage"],
    cameraIntent: "repair-site",
    structuralEvidence: "hybrid-evidence",
    localChemistry: "selected-atoms-and-bonds",
  },
  packaging: {
    family: "packaging",
    representation: "polymer",
    strandState: "double-stranded",
    focalRegion: { kind: "nucleosome-or-loop", includesStrandDirection: false },
    annotations: { allowed: ["nucleosome"], maximumVisibleLabels: 2, placement: "camera-aware-dna-attached" },
    relevantActors: ["dna", "histone-or-packaging-complex"],
    cameraIntent: "packaging-domain",
    structuralEvidence: "grounded-complex",
    localChemistry: "none",
  },
  "local-chemistry": {
    family: "local-chemistry",
    representation: "atom",
    strandState: "double-stranded",
    focalRegion: { kind: "selected-base-pair-or-residue", includesStrandDirection: true },
    annotations: { allowed: ["base-pair", "5-prime", "3-prime"], maximumVisibleLabels: 2, placement: "local-only" },
    relevantActors: ["dna", "local-ligand-or-damage"],
    cameraIntent: "local-chemistry",
    structuralEvidence: "deposited-structure",
    localChemistry: "selected-atoms-and-bonds",
  },
};

export function getDnaRepresentationSpecification(family: DnaSceneFamily): DnaRepresentationSpecification {
  return dnaRepresentationRegistry[family];
}

export function isValidDnaRepresentationSpecification(specification: DnaRepresentationSpecification): boolean {
  return specification.family in dnaRepresentationRegistry
    && specification.relevantActors.includes("dna")
    && specification.annotations.maximumVisibleLabels >= 0
    && (specification.strandState !== "locally-open" || (specification.focalRegion.maxOpenBasePairs ?? 0) > 0);
}
