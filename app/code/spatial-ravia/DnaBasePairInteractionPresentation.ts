import { canonicalDnaView } from "./DnaVisualSystem.ts";
import type {
  DnaInteraction,
  DnaMechanismSpec,
  DnaMolecularSelection,
} from "./dna-mechanism-contract.ts";
import type { DnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";

export type DnaCanonicalBase = "A" | "T" | "G" | "C";
export type DnaCanonicalPair = "A-T" | "G-C";
export type DnaBasePairInteractionState = "present" | "forming" | "breaking" | "absent";

export type DnaBasePairSite = {
  id: string;
  base: DnaCanonicalBase;
  atom: string;
  role: "donor" | "acceptor";
  partnerId: string;
  strand: "A" | "B";
};

export type DnaBasePairInteractionPath = {
  id: string;
  donor: DnaBasePairSite;
  acceptor: DnaBasePairSite;
  state: DnaBasePairInteractionState;
  type: "hydrogenBond";
};

export type DnaBasePairComparisonEntry = {
  pair: DnaCanonicalPair;
  hydrogenBondCount: 2 | 3;
  purine: DnaCanonicalBase;
  pyrimidine: DnaCanonicalBase;
  scale: "common-local-scale";
};

export type DnaBasePairInteractionPresentation = {
  representationPlan: DnaMechanismRepresentationPlan;
  pair: DnaCanonicalPair;
  baseSelections: readonly string[];
  hydrogenBondPaths: readonly DnaBasePairInteractionPath[];
  donorAcceptorSites: readonly DnaBasePairSite[];
  comparison: readonly DnaBasePairComparisonEntry[];
  purinePyrimidineOverlay?: {
    normalWidth: "consistent";
    comparisonStates: readonly ["purine-purine-too-wide", "pyrimidine-pyrimidine-too-narrow"];
    specificityQualification: "geometry-supports-consistent-width-but-does-not-alone-determine-specificity";
  };
  backbonePreserved: boolean;
  camera: ReturnType<typeof canonicalDnaView>;
};

const site = (id: string, base: DnaCanonicalBase, atom: string, role: DnaBasePairSite["role"], partnerId: string, strand: "A" | "B"): DnaBasePairSite => ({ id, base, atom, role, partnerId, strand });

const canonicalSites: Record<DnaCanonicalPair, readonly DnaBasePairSite[]> = {
  "A-T": [
    site("a-n6", "A", "N6", "donor", "t-o4", "A"),
    site("t-o4", "T", "O4", "acceptor", "a-n6", "B"),
    site("t-n3", "T", "N3", "donor", "a-n1", "B"),
    site("a-n1", "A", "N1", "acceptor", "t-n3", "A"),
  ],
  "G-C": [
    site("c-n4", "C", "N4", "donor", "g-o6", "B"),
    site("g-o6", "G", "O6", "acceptor", "c-n4", "A"),
    site("g-n1", "G", "N1", "donor", "c-n3", "A"),
    site("c-n3", "C", "N3", "acceptor", "g-n1", "B"),
    site("g-n2", "G", "N2", "donor", "c-o2", "A"),
    site("c-o2", "C", "O2", "acceptor", "g-n2", "B"),
  ],
};

const pairBases: Record<DnaCanonicalPair, readonly [DnaCanonicalBase, DnaCanonicalBase]> = {
  "A-T": ["A", "T"],
  "G-C": ["G", "C"],
};

export function classifyDnaBase(base: DnaCanonicalBase): "purine" | "pyrimidine" {
  return base === "A" || base === "G" ? "purine" : "pyrimidine";
}

export function hydrogenBondCount(pair: DnaCanonicalPair): 2 | 3 {
  return pair === "A-T" ? 2 : 3;
}

export function canonicalBasePairSelections(pair: DnaCanonicalPair): DnaMolecularSelection[] {
  const [left, right] = pairBases[pair];
  const baseSelections: DnaMolecularSelection[] = [
    { id: left === "A" ? "adenine" : "guanine", kind: "base", residueNames: [left], strand: "A", role: classifyDnaBase(left), structuralAnchor: "existingDnaVisualSystem" },
    { id: right === "T" ? "thymine" : "cytosine", kind: "base", residueNames: [right], strand: "B", role: classifyDnaBase(right), structuralAnchor: "existingDnaVisualSystem" },
  ];
  const sites = canonicalSites[pair].map((item) => ({
    id: item.id,
    kind: "atom" as const,
    residueNames: [item.base],
    atomNames: [item.atom],
    strand: item.strand,
    role: item.role,
    structuralAnchor: "derivedLocalSelection" as const,
  }));
  return [...baseSelections, ...sites,
    { id: "sugar-a", kind: "deoxyribose", strand: "A", structuralAnchor: "existingDnaVisualSystem" },
    { id: "sugar-b", kind: "deoxyribose", strand: "B", structuralAnchor: "existingDnaVisualSystem" },
    { id: "neighboring-stack", kind: "base", role: "neighbor", structuralAnchor: "existingDnaVisualSystem" },
  ];
}

export function canonicalBasePairInteractions(pair: DnaCanonicalPair, state: DnaBasePairInteractionState = "present"): DnaInteraction[] {
  const sites = canonicalSites[pair];
  return Array.from({ length: hydrogenBondCount(pair) }, (_, index) => {
    const donor = sites[index * 2];
    const acceptor = sites[index * 2 + 1];
    return {
      id: `${pair.toLowerCase()}-hydrogen-bond-${index + 1}`,
      type: "hydrogenBond" as const,
      participants: [donor.id, acceptor.id],
      role: "donorAcceptor" as const,
      state,
      evidence: "structural" as const,
      order: index + 1,
    };
  });
}

export function createDnaBasePairMechanismSpec(pair: DnaCanonicalPair, state: DnaBasePairInteractionState = "present"): DnaMechanismSpec {
  const selections = canonicalBasePairSelections(pair);
  const interactions = canonicalBasePairInteractions(pair, state);
  return {
    family: "basePairing",
    focus: `${pair} Watson–Crick base-pair interface`,
    scale: { level: "localChemistry", locality: "local" },
    requiredPrimitives: ["bondingInteraction", "molecularAssembly", "stabilizationForces"],
    molecularSelections: selections,
    participatingGroups: selections.map(({ id }) => id),
    interactions,
    orientation: { strandDirections: ["5primeTo3prime", "3primeTo5prime"], antiparallel: true, atomOrGroupAnchors: ["base-pair-interface"] },
    structuralState: state === "absent" || state === "breaking" ? "separatedStrands" : "pairedDuplex",
    annotations: [],
    representation: { backbone: "canonicalDna", localResidueDetail: "atomAndBond", basePairRungs: true, grooveReadability: false, strandSeparation: false, atomColorGrammar: true },
    reaction: { required: state !== "present", steps: [] },
    structuralSubstrate: "existingDnaVisualSystem",
  };
}

export function deriveDnaBasePairInteractionPresentation(plan: DnaMechanismRepresentationPlan): DnaBasePairInteractionPresentation {
  const pair = pairFromPlan(plan);
  const sites = canonicalSites[pair];
  const interactions = plan.sourceSpec.interactions.filter((item) => item.type === "hydrogenBond");
  const hydrogenBondPaths = interactions.slice(0, hydrogenBondCount(pair)).map((interaction, index) => {
    const donor = sites[index * 2];
    const acceptor = sites[index * 2 + 1];
    return { id: interaction.id, donor, acceptor, state: interaction.state, type: "hydrogenBond" as const };
  });
  const comparison: DnaBasePairComparisonEntry[] = (["A-T", "G-C"] as const).map((entry) => ({ pair: entry, hydrogenBondCount: hydrogenBondCount(entry), purine: entry === "A-T" ? "A" : "G", pyrimidine: entry === "A-T" ? "T" : "C", scale: "common-local-scale" }));
  const wantsGeometry = plan.sourceSpec.focus.toLowerCase().includes("width") || plan.sourceSpec.focus.toLowerCase().includes("geometry") || plan.sourceSpec.molecularSelections.some((selection) => selection.role === "purine" || selection.role === "pyrimidine");
  return {
    representationPlan: plan,
    pair,
    baseSelections: plan.localSelection.filter((selection) => selection.canonicalRole === "complementaryBasePair").map((selection) => selection.sourceSelectionId),
    hydrogenBondPaths,
    donorAcceptorSites: hydrogenBondPaths.flatMap(({ donor, acceptor }) => [donor, acceptor]),
    comparison,
    purinePyrimidineOverlay: wantsGeometry ? { normalWidth: "consistent", comparisonStates: ["purine-purine-too-wide", "pyrimidine-pyrimidine-too-narrow"], specificityQualification: "geometry-supports-consistent-width-but-does-not-alone-determine-specificity" } : undefined,
    backbonePreserved: !plan.sourceSpec.interactions.some((interaction) => (interaction.type === "phosphodiester" || interaction.type === "covalent") && ["breaking", "absent"].includes(interaction.state)),
    camera: canonicalDnaView("base-pair"),
  };
}

function pairFromPlan(plan: DnaMechanismRepresentationPlan): DnaCanonicalPair {
  const residues = plan.sourceSpec.molecularSelections.flatMap((selection) => selection.residueNames ?? []).map((residue) => residue.toUpperCase());
  if (residues.includes("G") || residues.includes("C") || /G-C|guanine-cytosine/i.test(plan.sourceSpec.focus)) return "G-C";
  return "A-T";
}
