import { canonicalDnaView } from "./DnaVisualSystem.ts";
import type { DnaInteraction, DnaMechanismSpec, DnaMolecularSelection } from "./dna-mechanism-contract.ts";
import type { DnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { getDnaLocalChemistryPlan, type DnaLocalChemistryPlan } from "./DnaLocalChemistryRepresentation.ts";

export type DnaBackbonePresentationMode = "singleNucleotide" | "adjacentNucleotides";
export type DnaBackboneReactionState = "present" | "forming" | "breaking" | "absent";

export type DnaBackboneAnchor = {
  id: string;
  nucleotideId: string;
  position: "1-prime" | "3-prime" | "5-prime";
  groupId: string;
  attachedTo: string;
  strand: "A";
};

export type DnaPhosphodiesterBridge = {
  id: string;
  phosphateId: string;
  threePrimeSide: string;
  fivePrimeSide: string;
  interactionId: string;
  type: "phosphodiester";
  state: DnaBackboneReactionState;
};

export type DnaBackboneChemistryPresentation = {
  representationPlan: DnaMechanismRepresentationPlan;
  mode: DnaBackbonePresentationMode;
  localChemistry: DnaLocalChemistryPlan;
  orderedBackbone: readonly string[];
  phosphateBridges: readonly DnaPhosphodiesterBridge[];
  anchors: readonly DnaBackboneAnchor[];
  labels: readonly { text: "1′ carbon" | "3′ carbon / 3′-OH" | "5′ carbon / 5′ phosphate"; anchorId: string }[];
  sameStrand: true;
  baseAttachmentInteractionIds: readonly string[];
  camera: ReturnType<typeof canonicalDnaView>;
};

const selection = (id: string, kind: DnaMolecularSelection["kind"], role?: DnaMolecularSelection["role"], label?: string): DnaMolecularSelection => ({ id, kind, role, label, strand: "A", structuralAnchor: "existingDnaVisualSystem" });

export function backboneChemistrySelections(mode: DnaBackbonePresentationMode = "adjacentNucleotides"): DnaMolecularSelection[] {
  const first = [
    selection("nucleotide-1", "nucleotide", "neighbor", "first nucleotide"),
    selection("sugar-1", "deoxyribose", undefined, "first deoxyribose"),
    selection("base-1", "base", undefined, "first base"),
    selection("one-prime-1", "deoxyribose", "onePrimeCarbon", "1′ carbon"),
    selection("three-prime-1", "deoxyribose", "threePrimeCarbon", "3′ carbon / 3′-OH"),
    selection("five-prime-1", "deoxyribose", "fivePrimeCarbon", "5′ carbon"),
  ];
  if (mode === "singleNucleotide") return [...first, selection("phosphate-1", "phosphate", undefined, "5′ phosphate")];
  return [
    ...first,
    selection("phosphate-bridge", "phosphate", undefined, "bridging phosphate"),
    selection("nucleotide-2", "nucleotide", "neighbor", "second nucleotide"),
    selection("sugar-2", "deoxyribose", undefined, "second deoxyribose"),
    selection("base-2", "base", undefined, "second base"),
    selection("one-prime-2", "deoxyribose", "onePrimeCarbon", "1′ carbon"),
    selection("three-prime-2", "deoxyribose", "threePrimeCarbon", "3′ carbon / 3′-OH"),
    selection("five-prime-2", "deoxyribose", "fivePrimeCarbon", "5′ carbon / 5′ phosphate"),
  ];
}

export function backboneChemistryInteractions(mode: DnaBackbonePresentationMode = "adjacentNucleotides", state: DnaBackboneReactionState = "present"): DnaInteraction[] {
  const interactions: DnaInteraction[] = [
    { id: "glycosidic-1", type: "covalent", participants: ["one-prime-1", "base-1"], role: "backboneLink", state: "present", evidence: "structural" },
  ];
  if (mode === "singleNucleotide") return interactions;
  interactions.push(
    { id: "glycosidic-2", type: "covalent", participants: ["one-prime-2", "base-2"], role: "backboneLink", state: "present", evidence: "structural" },
    { id: "phosphodiester-bridge", type: "phosphodiester", participants: ["three-prime-1", "phosphate-bridge", "five-prime-2"], role: "backboneLink", state, evidence: "structural" },
  );
  return interactions;
}

export function createDnaBackboneChemistrySpec(options: { mode?: DnaBackbonePresentationMode; state?: DnaBackboneReactionState } = {}): DnaMechanismSpec {
  const mode = options.mode ?? "adjacentNucleotides";
  const state = options.state ?? "present";
  const selections = backboneChemistrySelections(mode);
  const interactions = backboneChemistryInteractions(mode, state);
  const phosphodiester = interactions.find((interaction) => interaction.type === "phosphodiester");
  return {
    family: "backboneChemistry",
    focus: mode === "singleNucleotide" ? "DNA nucleotide components and sugar anchors" : "same-strand sugar-phosphate phosphodiester linkage",
    scale: { level: mode === "singleNucleotide" ? "nucleotide" : "localChemistry", locality: "local" },
    requiredPrimitives: ["bondingInteraction", "molecularAssembly", "localConformationalChange"],
    molecularSelections: selections,
    participatingGroups: selections.map(({ id }) => id),
    interactions,
    orientation: { strandDirections: ["5primeTo3prime"], antiparallel: false, atomOrGroupAnchors: ["backbone-axis", "sugar-phosphate-axis"] },
    structuralState: "assembledNucleotide",
    annotations: [],
    representation: { backbone: "canonicalDna", localResidueDetail: "atomAndBond", basePairRungs: false, grooveReadability: false, strandSeparation: false, atomColorGrammar: true },
    reaction: mode === "adjacentNucleotides" && phosphodiester ? {
      required: true,
      steps: [
        { id: "before", label: "unlinked 3′-OH and 5′ phosphate sides", interactionStates: [{ id: phosphodiester.id, state: "absent" }] },
        { id: "transition", label: "forming phosphodiester linkage", interactionStates: [{ id: phosphodiester.id, state: "forming" }] },
        { id: "after", label: "covalent phosphodiester linkage present", interactionStates: [{ id: phosphodiester.id, state: "present" }] },
      ],
    } : { required: false, steps: [] },
    structuralSubstrate: "existingDnaVisualSystem",
  };
}

export function deriveDnaBackboneChemistryPresentation(plan: DnaMechanismRepresentationPlan): DnaBackboneChemistryPresentation {
  const mode: DnaBackbonePresentationMode = plan.sourceSpec.molecularSelections.some((item) => item.id === "nucleotide-2" || item.id === "phosphate-bridge") ? "adjacentNucleotides" : "singleNucleotide";
  const phosphateInteraction = plan.sourceSpec.interactions.find((item) => item.type === "phosphodiester");
  const anchors = plan.sourceSpec.molecularSelections.flatMap((item) => {
    const position: DnaBackboneAnchor["position"] | undefined = item.role === "onePrimeCarbon" ? "1-prime" : item.role === "threePrimeCarbon" ? "3-prime" : item.role === "fivePrimeCarbon" ? "5-prime" : undefined;
    if (!position) return [];
    const nucleotideId = item.id.endsWith("-1") ? "nucleotide-1" : "nucleotide-2";
    const attachedTo = position === "1-prime"
      ? `base-${nucleotideId.endsWith("1") ? "1" : "2"}`
      : position === "3-prime"
        ? (mode === "adjacentNucleotides" ? "phosphate-bridge" : "three-prime-oh")
        : (mode === "adjacentNucleotides" ? "phosphate-bridge" : "phosphate-1");
    return [{ id: item.id, nucleotideId, position, groupId: `group-${item.id}-${item.role}`, attachedTo, strand: "A" as const }];
  });
  const phosphateBridges = phosphateInteraction ? [{ id: "phosphodiester-bridge", phosphateId: "phosphate-bridge", threePrimeSide: "three-prime-1", fivePrimeSide: "five-prime-2", interactionId: phosphateInteraction.id, type: "phosphodiester" as const, state: phosphateInteraction.state }] : [];
  const localChemistry = getDnaLocalChemistryPlan("backbone-linkage");
  return {
    representationPlan: plan,
    mode,
    localChemistry,
    orderedBackbone: mode === "singleNucleotide" ? ["sugar-1", "phosphate-1"] : ["sugar-1", "phosphate-bridge", "sugar-2"],
    phosphateBridges,
    anchors,
    labels: anchors.filter((anchor) => anchor.position !== "1-prime" || plan.sourceSpec.focus.includes("1")).map((anchor) => ({ text: anchor.position === "1-prime" ? "1′ carbon" : anchor.position === "3-prime" ? "3′ carbon / 3′-OH" : "5′ carbon / 5′ phosphate", anchorId: anchor.id })),
    sameStrand: true,
    baseAttachmentInteractionIds: plan.sourceSpec.interactions.filter((item) => item.type === "covalent" && item.participants.some((participant) => participant.startsWith("one-prime"))).map((item) => item.id),
    camera: canonicalDnaView(mode === "singleNucleotide" ? "nucleotide" : "local-chemistry"),
  };
}
