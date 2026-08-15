/** Renderer-independent semantic contract for RNA v1. */

export const rnaFamilies = [
  "structure",
  "typesFunctions",
  "nascentTranscript",
  "processing",
  "secondaryStructure",
  "pairingHybridization",
  "degradationStability",
  "localChemistry",
] as const;
export type RnaFamily = (typeof rnaFamilies)[number];

export const rnaTypes = ["generic", "mRNA", "tRNA", "rRNA", "miRNA", "siRNA", "snRNA", "regulatorySmallRNA"] as const;
export type RnaType = (typeof rnaTypes)[number];

export const rnaEntities = [
  "ribose", "twoPrimeHydroxyl", "phosphate", "base", "adenine", "uracil", "guanine", "cytosine",
  "phosphodiesterLinkage", "fivePrimeEnd", "threePrimeEnd", "cap", "polyATail", "exon", "intron",
  "stem", "loop", "bulge", "pairedRegion", "unpairedRegion", "mRNA", "tRNA", "rRNA", "miRNA", "siRNA", "snRNA",
] as const;
export type RnaEntity = (typeof rnaEntities)[number];

export type RnaScale = "molecule" | "nucleotide" | "strand" | "transcript" | "secondaryStructure" | "hybrid" | "localChemistry";
export type RnaLocality = "local" | "regional" | "global";
export type RnaStructuralState = "singleStrand" | "folded" | "paired" | "hybrid" | "nascent" | "preMature" | "mature" | "cleaved" | "degrading" | "intact";
export type RnaPairingState = "none" | "paired" | "partiallyPaired" | "wobble" | "hybrid";

export type RnaProcessingState = "none" | "unprocessed" | "capped" | "polyadenylated" | "spliced" | "mature" | "comparePreMature";
export type RnaStabilityState = "unspecified" | "stable" | "cleaved" | "degrading" | "exposedEnd" | "hydrolysisContext";

export type RnaSecondaryStructureRequirements = {
  required: boolean;
  motifs: Array<"stem" | "hairpin" | "stemLoop" | "bulge" | "internalLoop" | "pairedRegion" | "unpairedRegion">;
};

export type RnaSceneSpec = {
  family: RnaFamily;
  focus: string;
  scale: { level: RnaScale; locality: RnaLocality };
  rnaType: RnaType;
  structuralState: RnaStructuralState;
  strandCount: number;
  pairingState: RnaPairingState;
  requiredEntities: RnaEntity[];
  annotations: string[];
  sequenceRequirements: { required: boolean; bases?: string[]; notation?: string };
  secondaryStructure: RnaSecondaryStructureRequirements;
  dnaContext: { required: boolean; role?: "template" | "hybridPartner" | "comparison" };
  processingState: RnaProcessingState;
  degradationState: RnaStabilityState;
  representation: { detail: "overview" | "residue" | "atomAndBond"; showBackbone: boolean; showBases: boolean; showAnnotations: boolean };
  supportExpectation: "renderer-ready" | "grounded-or-explanatory";
};

export type RnaIntent = {
  family: RnaFamily;
  confidence: number;
  matchedTerms: string[];
  spec: RnaSceneSpec;
};

export type RnaBenchmarkCase = {
  id: string;
  prompt: string;
  expectedFamily: RnaFamily;
  expectedScale: RnaScale;
  expectedRnaType: RnaType;
  importantEntities: RnaEntity[];
  expectedStructuralState: RnaStructuralState;
  expectedPairingState: RnaPairingState;
  expectedProcessingState: RnaProcessingState;
  dnaContextRequired: boolean;
  expectedSupportStatus: RnaSceneSpec["supportExpectation"];
};

