/**
 * Foundation F1-A: the renderer-independent vocabulary shared by future
 * SemanticIntent contracts.  This file deliberately contains no parser,
 * renderer, camera, geometry, React, Three.js, or Mol* concepts.
 */

export const intentActs = ["show", "explain", "compare", "animate", "inspect", "export"] as const;
export type IntentAct = (typeof intentActs)[number];

export type IntentActDefinition = {
  meaning: string;
  excludes: string;
  mayCoexistWith: IntentAct[];
};

export const intentActDefinitions: Record<IntentAct, IntentActDefinition> = {
  show: { meaning: "Present a scientific object, relationship, or state.", excludes: "Does not request a causal explanation or time progression by itself.", mayCoexistWith: ["explain", "compare", "inspect"] },
  explain: { meaning: "Make a scientific relationship or mechanism understandable.", excludes: "Does not assert that animation is required.", mayCoexistWith: ["show", "compare", "inspect"] },
  compare: { meaning: "Present two or more scientifically matched alternatives.", excludes: "Does not mean that the alternatives are identical or that one is preferred.", mayCoexistWith: ["show", "explain", "inspect"] },
  animate: { meaning: "Request a change through a temporal sequence.", excludes: "Does not define the timing implementation or require a particular renderer.", mayCoexistWith: ["show", "explain", "inspect"] },
  inspect: { meaning: "Focus attention on a selected entity, group, relationship, or locality.", excludes: "Does not change the underlying scientific state.", mayCoexistWith: ["show", "explain", "compare"] },
  export: { meaning: "Request a reusable or downloadable representation of the result.", excludes: "Does not define a file format or serialization mechanism.", mayCoexistWith: ["show", "explain", "compare", "inspect"] },
};

export const entityIds = [
  "dna", "rna", "nucleotide", "nucleoside", "phosphate", "ribose", "deoxyribose", "base",
  "adenine", "thymine", "uracil", "guanine", "cytosine", "strand", "duplex", "gene", "promoter",
  "enhancer", "regulatoryRegion", "transcriptionBubble", "replicationFork", "polymerase", "rnaPolymerase",
  "helicase", "replicationActor", "mRNA", "tRNA", "rRNA", "miRNA", "siRNA", "snRNA", "smallRegulatoryRNA",
  "exon", "intron", "cap", "polyATail", "riboseTwoPrimeHydroxyl", "onePrimeCarbon", "threePrimeCarbon",
  "fivePrimeCarbon", "threePrimeOxygen", "fivePrimeOxygen", "phosphodiesterLinkage", "hydrogenBondDonor",
  "hydrogenBondAcceptor", "stackingFace", "majorGroove", "minorGroove", "atom", "residue", "lesion",
] as const;
export type SemanticEntityId = (typeof entityIds)[number];

export type SemanticEntityKind = "biopolymer" | "molecularComponent" | "functionalRegion" | "actor" | "chemicalGroup" | "atom" | "residue" | "structuralFeature";
export type SemanticEntityRole = "substrate" | "product" | "template" | "complement" | "donor" | "acceptor" | "catalyst" | "regulator" | "lesion" | "focus" | "context";

export type SemanticEntityRef = {
  /** Stable biological type ID; never a renderer object key. */
  id: SemanticEntityId;
  kind: SemanticEntityKind;
  /** Optional stable instance identity within a scene or selection. */
  instanceId?: string;
  role?: SemanticEntityRole;
  aliases?: string[];
};

export const phenomenonIds = [
  "basePairing", "backboneChemistry", "polarity", "helixStabilization", "strandSeparation", "nucleotideAssembly",
  "transcription", "replication", "rnaProcessing", "rnaSecondaryStructure", "hybridization", "cleavage",
  "exonucleaseDegradation", "chemicalStabilityComparison", "translation", "proteinSynthesis",
  "regulation", "damageRepair", "packaging", "chromatinOrganization", "canonicalBasePairing", "rnaDnaHybridization",
] as const;
export type PhenomenonId = (typeof phenomenonIds)[number];

export const mechanismIds = [
  "hydrogenBonding", "phosphodiesterLinkage", "antiparallelOrganization", "baseStacking", "grooveOrganization",
  "strandOpening", "strandReannealing", "nucleotideAddition", "transcriptionElongation", "dnaReplication",
  "rnaSplicing", "rnaCapping", "rnaCleavage", "terminalExonucleaseAction", "riboseHydroxylSusceptibility",
  "rnaDnaHybridFormation", "rnaSecondaryFolding", "translationElongation",
] as const;
export type MechanismId = (typeof mechanismIds)[number];

export const stateIds = [
  "unknown", "paired", "unpaired", "intact", "cleaved", "preMRNA", "matureMRNA", "folded", "unfolded",
  "open", "closed", "nascent", "partiallyDegraded", "hybridized", "capped", "uncapped", "forming", "breaking",
] as const;
export type BiologicalStateId = (typeof stateIds)[number];

export type BiochemicalDirection = "fiveToThree" | "threeToFive" | "strandRelative" | "sequenceDirection" | "molecularDirection" | "unknown";
export type ScreenDirection = "screenLeft" | "screenRight" | "screenTop" | "screenBottom";
export type DirectionMeaning = "scientific" | "presentational" | "ambiguous";

export type SemanticDirection = {
  biochemical?: BiochemicalDirection;
  screen?: ScreenDirection;
  meaning: DirectionMeaning;
  referenceEntity?: SemanticEntityRef;
};

export const detailLevels = ["beginner", "intermediate", "advanced", "auto"] as const;
export type DetailLevel = (typeof detailLevels)[number];

export type SemanticAmbiguity =
  | "unresolvedEntity"
  | "multiplePlausibleMeanings"
  | "materiallyEquivalentAlternatives"
  | "scienceChangingAmbiguity"
  | "unsupportedCapability";

export type AmbiguityAssessment = {
  kind: SemanticAmbiguity;
  candidates: SemanticEntityRef[];
  blocking: boolean;
};

export type MisconceptionStatus = "neutral" | "suspected" | "validated" | "corrected";
export type MisconceptionClaim = {
  status: MisconceptionStatus;
  statement?: string;
  correctedStatement?: string;
};

export type OutputPreference = "static" | "animated" | "comparison" | "localFocus" | "overview";
export type RequestedOutputType = "scientificFigure" | "interactiveScene" | "comparisonFigure" | "dataExport" | "unspecified";

export type SemanticVocabularyReference = {
  entity?: SemanticEntityRef;
  phenomenon?: PhenomenonId;
  mechanism?: MechanismId;
  states?: BiologicalStateId[];
  direction?: SemanticDirection;
  detail?: DetailLevel;
  preferences?: OutputPreference[];
  requestedOutput?: RequestedOutputType;
  ambiguity?: AmbiguityAssessment;
  misconception?: MisconceptionClaim;
};

/** Stable vocabulary facts used by contract tests and future adapters. */
export const foundationVocabulary = {
  intentActs,
  entityIds,
  phenomenonIds,
  mechanismIds,
  stateIds,
  detailLevels,
} as const;
