/**
 * Renderer-independent contract for DNA molecular mechanisms.
 *
 * This layer describes what a mechanism means and what evidence/detail it
 * needs. It intentionally references the existing DNA visual system by role;
 * it does not create geometry or depend on a rendering library.
 */

export const dnaMechanismFamilies = [
  "basePairing",
  "backboneChemistry",
  "polarityAntiparallel",
  "helixStabilization",
  "strandSeparation",
  "nucleotideAssembly",
] as const;
export type DnaMechanismFamily = (typeof dnaMechanismFamilies)[number];

export const dnaMechanismPrimitives = [
  "bondingInteraction",
  "polarityOrientation",
  "molecularAssembly",
  "localConformationalChange",
  "stabilizationForces",
  "reactionStateProgression",
] as const;
export type DnaMechanismPrimitive = (typeof dnaMechanismPrimitives)[number];

export type DnaMechanismScale = "duplex" | "strand" | "nucleotide" | "basePair" | "localChemistry";
export type DnaMechanismLocality = "global" | "regional" | "local";

export type DnaEntityKind =
  | "base"
  | "nucleotide"
  | "phosphate"
  | "deoxyribose"
  | "backbone"
  | "strand"
  | "duplex"
  | "groove"
  | "atom"
  | "lesion";

export type DnaEntityRole =
  | "purine"
  | "pyrimidine"
  | "donor"
  | "acceptor"
  | "fivePrimeEnd"
  | "threePrimeEnd"
  | "onePrimeCarbon"
  | "threePrimeCarbon"
  | "fivePrimeCarbon"
  | "template"
  | "complementary"
  | "neighbor"
  | "damaged"
  | "mismatch";

export type DnaMolecularSelection = {
  id: string;
  kind: DnaEntityKind;
  label?: string;
  residueNames?: string[];
  atomNames?: string[];
  strand?: "A" | "B" | "single";
  role?: DnaEntityRole;
  structuralAnchor: "existingDnaVisualSystem" | "depositedCoordinates" | "derivedLocalSelection";
};

export type DnaInteractionType =
  | "covalent"
  | "phosphodiester"
  | "hydrogenBond"
  | "baseStacking"
  | "noncovalent"
  | "lesionCrosslink";

export type DnaInteractionState = "present" | "forming" | "breaking" | "absent";

export type DnaInteraction = {
  id: string;
  type: DnaInteractionType;
  participants: string[];
  role: "backboneLink" | "basePair" | "donorAcceptor" | "stacking" | "stabilization" | "lesion";
  state: DnaInteractionState;
  evidence: "structural" | "explanatory";
  order?: number;
};

export type DnaOrientation = {
  strandDirections: Array<"5primeTo3prime" | "3primeTo5prime">;
  fivePrime?: string;
  threePrime?: string;
  antiparallel: boolean;
  axisAnchor?: string;
  atomOrGroupAnchors: string[];
};

export type DnaStructuralState =
  | "pairedDuplex"
  | "singleStrand"
  | "locallyOpen"
  | "separatedStrands"
  | "reannealing"
  | "assembledNucleotide"
  | "stackedDuplex";

export type DnaMechanismAnnotation = {
  id: string;
  text: string;
  anchor: string;
  priority: "essential" | "supporting";
};

export type DnaRepresentationRequirements = {
  backbone: "canonicalDna" | "groundedCoordinates";
  localResidueDetail: "none" | "residue" | "atomAndBond";
  basePairRungs: boolean;
  grooveReadability: boolean;
  strandSeparation: boolean;
  atomColorGrammar: boolean;
};

export type DnaReactionStep = {
  id: "before" | "transition" | "after";
  label: string;
  interactionStates: Array<Pick<DnaInteraction, "id" | "state">>;
};

export type DnaReactionPlan = {
  required: boolean;
  steps: DnaReactionStep[];
};

export type DnaMechanismSpec = {
  family: DnaMechanismFamily;
  focus: string;
  scale: { level: DnaMechanismScale; locality: DnaMechanismLocality };
  requiredPrimitives: DnaMechanismPrimitive[];
  molecularSelections: DnaMolecularSelection[];
  participatingGroups: string[];
  interactions: DnaInteraction[];
  orientation: DnaOrientation;
  structuralState: DnaStructuralState;
  annotations: DnaMechanismAnnotation[];
  representation: DnaRepresentationRequirements;
  reaction?: DnaReactionPlan;
  structuralSubstrate: "existingDnaVisualSystem";
};

export type DnaMechanismBenchmarkCase = {
  id: string;
  prompt: string;
  family: DnaMechanismFamily;
  spec: DnaMechanismSpec;
  supportExpectation: "renderer-ready" | "grounded-or-explanatory";
};
