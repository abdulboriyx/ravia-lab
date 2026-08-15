import { canonicalDnaView, dnaVisualSystem } from "./DnaVisualSystem.ts";
import {
  createDnaBackboneChemistrySpec,
  deriveDnaBackboneChemistryPresentation,
  type DnaBackboneAnchor,
} from "./DnaBackboneChemistryPresentation.ts";
import type { DnaMechanismSpec, DnaMolecularSelection } from "./dna-mechanism-contract.ts";
import type { DnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import type { DnaBackboneChemistryPresentation } from "./DnaBackboneChemistryPresentation.ts";

export type DnaPolarityPresentationMode = "duplexOverview" | "strandEnds" | "localBackbone";
export type DnaStrandDirection = "5primeTo3prime" | "3primeTo5prime";

export type DnaPolarityAnchor = Omit<DnaBackboneAnchor, "strand"> & {
  strand: "A" | "B";
  sourceAnchorId: string;
};

export type DnaDirectionArrow = {
  strand: "A" | "B";
  direction: DnaStrandDirection;
  fromAnchor: string;
  toAnchor: string;
  derivedFrom: "backbone-5prime-to-3prime-anchors";
};

export type DnaPolarityAntiparallelPresentation = {
  representationPlan: DnaMechanismRepresentationPlan;
  mode: DnaPolarityPresentationMode;
  localBackbone: DnaBackboneChemistryPresentation;
  anchors: { strandA: readonly DnaPolarityAnchor[]; strandB: readonly DnaPolarityAnchor[] };
  directions: readonly [{ strand: "A"; direction: "5primeTo3prime" }, { strand: "B"; direction: "3primeTo5prime" }];
  arrows: readonly [DnaDirectionArrow, DnaDirectionArrow];
  labels: readonly { text: "5′" | "3′"; strand: "A" | "B"; anchorId: string }[];
  sharedDuplexGeometry: {
    source: "existingDnaVisualSystem";
    basePairCount: number;
    basePairWidthAngstrom: number;
    complementaryBasesFace: "inward";
  };
  camera: ReturnType<typeof canonicalDnaView>;
};

const selection = (id: string, kind: DnaMolecularSelection["kind"], strand: "A" | "B" | "single", role?: DnaMolecularSelection["role"], label?: string): DnaMolecularSelection => ({ id, kind, strand, role, label, structuralAnchor: "existingDnaVisualSystem" });

export function polaritySelections(): DnaMolecularSelection[] {
  return [
    selection("duplex", "duplex", "single", undefined, "canonical duplex"),
    selection("strand-a", "strand", "A", "template", "strand A"),
    selection("strand-b", "strand", "B", "complementary", "strand B"),
    selection("a-five-prime", "strand", "A", "fivePrimeEnd", "5′"),
    selection("a-three-prime", "strand", "A", "threePrimeEnd", "3′"),
    selection("b-five-prime", "strand", "B", "fivePrimeEnd", "5′"),
    selection("b-three-prime", "strand", "B", "threePrimeEnd", "3′"),
    selection("a-one-prime", "deoxyribose", "A", "onePrimeCarbon", "1′ carbon"),
    selection("a-three-carbon", "deoxyribose", "A", "threePrimeCarbon", "3′ carbon / 3′-OH"),
    selection("a-five-carbon", "deoxyribose", "A", "fivePrimeCarbon", "5′ carbon / phosphate"),
    selection("b-one-prime", "deoxyribose", "B", "onePrimeCarbon", "1′ carbon"),
    selection("b-three-carbon", "deoxyribose", "B", "threePrimeCarbon", "3′ carbon / 3′-OH"),
    selection("b-five-carbon", "deoxyribose", "B", "fivePrimeCarbon", "5′ carbon / phosphate"),
    selection("a-backbone", "backbone", "A", undefined, "backbone A"),
    selection("b-backbone", "backbone", "B", undefined, "backbone B"),
  ];
}

export function polarityInteractions() {
  return [
    { id: "a-phosphodiester-direction", type: "phosphodiester" as const, participants: ["a-three-carbon", "a-backbone", "a-five-carbon"], role: "backboneLink" as const, state: "present" as const, evidence: "structural" as const },
    { id: "b-phosphodiester-direction", type: "phosphodiester" as const, participants: ["b-three-carbon", "b-backbone", "b-five-carbon"], role: "backboneLink" as const, state: "present" as const, evidence: "structural" as const },
  ];
}

export function createDnaPolarityMechanismSpec(mode: DnaPolarityPresentationMode = "duplexOverview"): DnaMechanismSpec {
  const local = mode === "localBackbone";
  return {
    family: "polarityAntiparallel",
    focus: mode === "strandEnds" ? "5′ and 3′ strand-end orientation" : local ? "local phosphodiester polarity anchors" : "antiparallel DNA backbone organization",
    scale: { level: local ? "localChemistry" : mode === "strandEnds" ? "strand" : "duplex", locality: local ? "local" : mode === "strandEnds" ? "regional" : "global" },
    requiredPrimitives: ["polarityOrientation", "molecularAssembly"],
    molecularSelections: polaritySelections(),
    participatingGroups: polaritySelections().map(({ id }) => id),
    interactions: polarityInteractions(),
    orientation: { strandDirections: ["5primeTo3prime", "3primeTo5prime"], fivePrime: "a-five-prime", threePrime: "a-three-prime", antiparallel: true, axisAnchor: "duplex-axis", atomOrGroupAnchors: ["a-five-prime", "a-three-prime", "b-five-prime", "b-three-prime"] },
    structuralState: "pairedDuplex",
    annotations: [],
    representation: { backbone: "canonicalDna", localResidueDetail: local ? "atomAndBond" : "residue", basePairRungs: true, grooveReadability: false, strandSeparation: false, atomColorGrammar: local },
    reaction: { required: false, steps: [] },
    structuralSubstrate: "existingDnaVisualSystem",
  };
}

export function deriveDnaPolarityAntiparallelPresentation(plan: DnaMechanismRepresentationPlan): DnaPolarityAntiparallelPresentation {
  const mode = plan.sourceSpec.scale.level === "localChemistry" ? "localBackbone" : plan.sourceSpec.scale.level === "strand" ? "strandEnds" : "duplexOverview";
  const localBackbone = deriveDnaBackboneChemistryPresentation(buildDnaMechanismRepresentationPlan(createDnaBackboneChemistrySpec()));
  const strandA = anchorsForStrand(localBackbone.anchors, "A");
  const strandB = anchorsForStrand(localBackbone.anchors, "B");
  const aFive = terminalAnchor(strandA, "5-prime");
  const aThree = terminalAnchor(strandA, "3-prime");
  const bFive = terminalAnchor(strandB, "5-prime");
  const bThree = terminalAnchor(strandB, "3-prime");
  return {
    representationPlan: plan,
    mode,
    localBackbone,
    anchors: { strandA, strandB },
    directions: [{ strand: "A", direction: "5primeTo3prime" }, { strand: "B", direction: "3primeTo5prime" }],
    arrows: [
      { strand: "A", direction: "5primeTo3prime", fromAnchor: aFive.id, toAnchor: aThree.id, derivedFrom: "backbone-5prime-to-3prime-anchors" },
      { strand: "B", direction: "3primeTo5prime", fromAnchor: bThree.id, toAnchor: bFive.id, derivedFrom: "backbone-5prime-to-3prime-anchors" },
    ],
    labels: [
      { text: "5′", strand: "A", anchorId: aFive.id }, { text: "3′", strand: "A", anchorId: aThree.id },
      { text: "5′", strand: "B", anchorId: bFive.id }, { text: "3′", strand: "B", anchorId: bThree.id },
    ],
    sharedDuplexGeometry: { source: "existingDnaVisualSystem", basePairCount: dnaVisualSystem.geometry.canonicalDuplexBasePairCount, basePairWidthAngstrom: dnaVisualSystem.geometry.basePairWidthAngstrom, complementaryBasesFace: "inward" },
    camera: mode === "duplexOverview" ? canonicalDnaView("whole-duplex") : mode === "strandEnds" ? canonicalDnaView("base-pair") : canonicalDnaView("local-chemistry"),
  };
}

function anchorsForStrand(anchors: readonly DnaBackboneAnchor[], strand: "A" | "B"): DnaPolarityAnchor[] {
  return anchors.map((anchor) => ({ ...anchor, id: `${strand.toLowerCase()}-${anchor.id}`, strand, sourceAnchorId: anchor.id }));
}

function terminalAnchor(anchors: readonly DnaPolarityAnchor[], position: DnaBackboneAnchor["position"]): DnaPolarityAnchor {
  const anchor = anchors.find((item) => item.position === position);
  if (!anchor) throw new Error(`Missing ${position} polarity anchor.`);
  return anchor;
}
