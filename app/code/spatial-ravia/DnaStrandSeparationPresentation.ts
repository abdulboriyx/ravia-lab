import {
  canonicalBasePairInteractions,
  canonicalBasePairSelections,
  deriveDnaBasePairInteractionPresentation,
  type DnaBasePairInteractionPresentation,
  type DnaBasePairInteractionState,
  type DnaCanonicalPair,
} from "./DnaBasePairInteractionPresentation.ts";
import { dnaVisualSystem, sampleCanonicalDna, type DnaVisualState, type DnaHelixSample } from "./DnaVisualSystem.ts";
import type { DnaInteraction, DnaMechanismSpec, DnaMolecularSelection } from "./dna-mechanism-contract.ts";
import { buildDnaMechanismRepresentationPlan, type DnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";

export type DnaStrandSeparationState = "paired" | "opening" | "separated" | "reannealing";

export type DnaStrandSeparationPresentation = {
  representationPlan: DnaMechanismRepresentationPlan;
  pair: DnaCanonicalPair;
  state: DnaStrandSeparationState;
  basePairPresentation: DnaBasePairInteractionPresentation;
  visualState: DnaVisualState;
  samples: readonly DnaHelixSample[];
  localOpeningBasePairs: number;
  boundedByMaximumOpenBasePairs: boolean;
  hydrogenBondInteractionIds: readonly string[];
  stackingInteractionIds: readonly string[];
  phosphodiesterInteractionIds: readonly string[];
  backbonePreserved: boolean;
  strandConnectivityPreserved: boolean;
  polarityPreserved: boolean;
  canonicalPairingTarget: "pairedDuplex";
  canonicalDuplexRestoredLocally: boolean;
};

const stateToInteractionState: Record<DnaStrandSeparationState, DnaBasePairInteractionState> = {
  paired: "present",
  opening: "breaking",
  separated: "absent",
  reannealing: "forming",
};

const openingByState: Record<DnaStrandSeparationState, number> = {
  paired: 0,
  opening: 4,
  separated: 10,
  reannealing: 2,
};

const selection = (id: string, kind: DnaMolecularSelection["kind"], strand?: "A" | "B" | "single", role?: DnaMolecularSelection["role"], label?: string): DnaMolecularSelection => ({ id, kind, strand, role, label, structuralAnchor: "existingDnaVisualSystem" });

export function separationStateForPrompt(prompt: string): DnaStrandSeparationState {
  const text = prompt.toLowerCase();
  if (text.includes("reanneal") || text.includes("pair again") || text.includes("re-pair")) return "reannealing";
  if (text.includes("separated") || text.includes("separation") || text.includes("melt")) return "separated";
  if (text.includes("open") || text.includes("break") || text.includes("separat")) return "opening";
  return "paired";
}

export function separationPairForPrompt(prompt: string): DnaCanonicalPair {
  const text = prompt.toLowerCase();
  return text.includes("guanine") || text.includes("cytosine") || text.includes("g-c") ? "G-C" : "A-T";
}

export function strandSeparationSelections(pair: DnaCanonicalPair = "A-T"): DnaMolecularSelection[] {
  return [
    ...canonicalBasePairSelections(pair),
    selection("strand-a", "strand", "A", "template", "template strand"),
    selection("strand-b", "strand", "B", "complementary", "complementary strand"),
    selection("stacked-base-a-1", "base", "A", "neighbor", "adjacent base on strand A"),
    selection("stacked-base-a-2", "base", "A", "neighbor", "adjacent base on strand A"),
    selection("backbone-a", "backbone", "A", undefined, "intact backbone A"),
    selection("backbone-b", "backbone", "B", undefined, "intact backbone B"),
  ];
}

export function strandSeparationInteractions(pair: DnaCanonicalPair = "A-T", state: DnaStrandSeparationState = "opening"): DnaInteraction[] {
  const hydrogenBondState = stateToInteractionState[state];
  const stackingState = state === "paired" ? "present" : state === "reannealing" ? "forming" : state === "opening" ? "breaking" : "absent";
  return [
    ...canonicalBasePairInteractions(pair, hydrogenBondState),
    { id: "local-base-stacking", type: "baseStacking", participants: ["stacked-base-a-1", "stacked-base-a-2"], role: "stacking", state: stackingState as DnaInteraction["state"], evidence: "structural" },
    { id: "phosphodiester-a-intact", type: "phosphodiester", participants: ["backbone-a", "strand-a"], role: "backboneLink", state: "present", evidence: "structural" },
    { id: "phosphodiester-b-intact", type: "phosphodiester", participants: ["backbone-b", "strand-b"], role: "backboneLink", state: "present", evidence: "structural" },
  ];
}

export function createDnaStrandSeparationSpec(options: { pair?: DnaCanonicalPair; state?: DnaStrandSeparationState } = {}): DnaMechanismSpec {
  const pair = options.pair ?? "A-T";
  const state = options.state ?? "opening";
  const selections = strandSeparationSelections(pair);
  const interactions = strandSeparationInteractions(pair, state);
  const hydrogenIds = interactions.filter((item) => item.type === "hydrogenBond").map((item) => item.id);
  const stackingIds = interactions.filter((item) => item.type === "baseStacking").map((item) => item.id);
  const phosphodiesterIds = interactions.filter((item) => item.type === "phosphodiester").map((item) => item.id);
  const reaction = reactionPlan(interactions, state);
  return {
    family: "strandSeparation",
    focus: state === "reannealing" ? `${pair} complementary strand reannealing` : `${pair} local strand separation and intact backbone`,
    scale: { level: "duplex", locality: "regional" },
    requiredPrimitives: ["bondingInteraction", "stabilizationForces", "localConformationalChange", "reactionStateProgression", "polarityOrientation"],
    molecularSelections: selections,
    participatingGroups: selections.map(({ id }) => id),
    interactions,
    orientation: { strandDirections: ["5primeTo3prime", "3primeTo5prime"], antiparallel: true, axisAnchor: "duplex-axis", atomOrGroupAnchors: ["strand-a", "strand-b", "backbone-a", "backbone-b"] },
    structuralState: state === "paired" ? "pairedDuplex" : state === "opening" ? "locallyOpen" : state === "separated" ? "separatedStrands" : "reannealing",
    annotations: [],
    representation: { backbone: "canonicalDna", localResidueDetail: "residue", basePairRungs: true, grooveReadability: false, strandSeparation: true, atomColorGrammar: false },
    reaction,
    structuralSubstrate: "existingDnaVisualSystem",
  };
}

export function deriveDnaStrandSeparationPresentation(plan: DnaMechanismRepresentationPlan): DnaStrandSeparationPresentation {
  const pair = pairFromPlan(plan);
  const state = stateFromPlan(plan);
  const localOpeningBasePairs = openingByState[state];
  const visualState: DnaVisualState = {
    topology: state === "paired" ? "double-stranded" : "locally-open",
    lod: "nucleotide",
    localState: "canonical",
    openCenter: Math.ceil(dnaVisualSystem.geometry.canonicalDuplexBasePairCount / 2),
    openBasePairs: localOpeningBasePairs,
  };
  const samples = sampleCanonicalDna(dnaVisualSystem.geometry.canonicalDuplexBasePairCount, visualState);
  const basePairPresentation = deriveDnaBasePairInteractionPresentation(plan);
  const phosphodiesterInteractionIds = plan.sourceSpec.interactions.filter((item) => item.type === "phosphodiester").map((item) => item.id);
  return {
    representationPlan: plan,
    pair,
    state,
    basePairPresentation,
    visualState,
    samples,
    localOpeningBasePairs,
    boundedByMaximumOpenBasePairs: localOpeningBasePairs <= dnaVisualSystem.geometry.maximumOpenBasePairs,
    hydrogenBondInteractionIds: plan.sourceSpec.interactions.filter((item) => item.type === "hydrogenBond").map((item) => item.id),
    stackingInteractionIds: plan.sourceSpec.interactions.filter((item) => item.type === "baseStacking").map((item) => item.id),
    phosphodiesterInteractionIds,
    backbonePreserved: phosphodiesterInteractionIds.length > 0 && plan.sourceSpec.interactions.filter((item) => item.type === "phosphodiester").every((item) => item.state === "present"),
    strandConnectivityPreserved: true,
    polarityPreserved: plan.sourceSpec.orientation.strandDirections.length === 2,
    canonicalPairingTarget: "pairedDuplex",
    canonicalDuplexRestoredLocally: state === "paired" || state === "reannealing",
  };
}

function pairFromPlan(plan: DnaMechanismRepresentationPlan): DnaCanonicalPair {
  const residues = plan.sourceSpec.molecularSelections.flatMap((selection) => selection.residueNames ?? []).map((residue) => residue.toUpperCase());
  return residues.includes("G") || residues.includes("C") ? "G-C" : "A-T";
}

function stateFromPlan(plan: DnaMechanismRepresentationPlan): DnaStrandSeparationState {
  const state = plan.sourceSpec.structuralState;
  if (state === "pairedDuplex") return "paired";
  if (state === "locallyOpen") return "opening";
  if (state === "separatedStrands") return "separated";
  return "reannealing";
}

function reactionPlan(interactions: readonly DnaInteraction[], state: DnaStrandSeparationState): DnaMechanismSpec["reaction"] {
  if (state === "paired") return { required: false, steps: [] };
  const hydrogenAndStacking = interactions.filter((item) => item.type === "hydrogenBond" || item.type === "baseStacking");
  const beforeState = state === "reannealing" ? "absent" : "present";
  const transitionState = state === "reannealing" ? "forming" : "breaking";
  const afterState = state === "reannealing" ? "present" : "absent";
  return {
    required: true,
    steps: [
      { id: "before", label: state === "reannealing" ? "separated complementary strands" : "paired complementary strands", interactionStates: hydrogenAndStacking.map(({ id }) => ({ id, state: beforeState as DnaInteraction["state"] })) },
      { id: "transition", label: state === "reannealing" ? "reforming inter-strand interactions" : "breaking inter-strand interactions", interactionStates: hydrogenAndStacking.map(({ id }) => ({ id, state: transitionState as DnaInteraction["state"] })) },
      { id: "after", label: state === "reannealing" ? "canonical local pairing restored" : "strands locally separated", interactionStates: hydrogenAndStacking.map(({ id }) => ({ id, state: afterState as DnaInteraction["state"] })) },
    ],
  };
}
