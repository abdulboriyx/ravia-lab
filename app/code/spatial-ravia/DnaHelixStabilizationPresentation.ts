import { canonicalDnaView, dnaVisualSystem, sampleCanonicalDna, type DnaHelixSample } from "./DnaVisualSystem.ts";
import type { DnaInteraction, DnaMechanismSpec, DnaMolecularSelection } from "./dna-mechanism-contract.ts";
import type { DnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";

export type DnaHelixStabilizationMode = "localStacking" | "duplexOverview" | "grooveFocus" | "forceComparison";

export type DnaStackingContact = {
  id: string;
  fromBaseSelection: string;
  toBaseSelection: string;
  strand: "A";
  type: "baseStacking";
  state: "present";
  contactCenter: readonly [number, number, number];
  contactDistance: number;
  relativeOrientation: "adjacent-planar-surfaces";
};

export type DnaGrooveLocation = {
  id: "major-groove" | "minor-groove";
  basePairIndex: number;
  center: readonly [number, number, number];
  betweenBackbones: true;
  derivedFrom: "canonical-b-dna-backbone-phase";
};

export type DnaHelixStabilizationPresentation = {
  representationPlan: DnaMechanismRepresentationPlan;
  mode: DnaHelixStabilizationMode;
  stackingContacts: readonly DnaStackingContact[];
  grooves: readonly [DnaGrooveLocation, DnaGrooveLocation];
  basesInterior: {
    baseRadialDistance: number;
    backboneRadialDistance: number;
    relation: "bases-inward-backbone-outward";
  };
  forceComparison?: {
    hydrogenBondInteractionIds: readonly string[];
    stackingInteractionIds: readonly string[];
    hydrogenBondsActAcrossComplementaryBases: true;
    stackingActsBetweenAdjacentSameStrandBases: true;
    interpretation: "structural-contributions-are-distinct-and-combined";
  };
  widthExplanation: {
    basePairWidthAngstrom: number;
    purinePyrimidineFit: "approximately-consistent";
    specificityClaim: "width-supports-geometry-but-does-not-alone-determine-specificity";
  };
  camera: ReturnType<typeof canonicalDnaView>;
};

const selection = (id: string, kind: DnaMolecularSelection["kind"], strand: "A" | "B" | "single" = "single", label?: string, role?: DnaMolecularSelection["role"]): DnaMolecularSelection => ({ id, kind, strand, label, role, structuralAnchor: "existingDnaVisualSystem" });

export function helixStabilizationSelections(mode: DnaHelixStabilizationMode = "duplexOverview"): DnaMolecularSelection[] {
  const selections: DnaMolecularSelection[] = [
    selection("stacked-base-1", "base", "A", "adjacent base 1", "neighbor"),
    selection("stacked-base-2", "base", "A", "adjacent base 2", "neighbor"),
    selection("complementary-base-interface", "base", "single", "complementary base interface"),
    selection("backbone-a", "backbone", "A", "strand A backbone"),
    selection("backbone-b", "backbone", "B", "strand B backbone"),
    selection("major-groove", "groove", "single", "major groove"),
    selection("minor-groove", "groove", "single", "minor groove"),
    selection("canonical-duplex", "duplex", "single", "canonical B-DNA duplex"),
  ];
  return mode === "localStacking" ? selections.filter((item) => ["stacked-base-1", "stacked-base-2", "backbone-a"].includes(item.id)) : selections;
}

export function helixStabilizationInteractions(mode: DnaHelixStabilizationMode = "duplexOverview"): DnaInteraction[] {
  const interactions: DnaInteraction[] = [
    { id: "base-stacking-contact", type: "baseStacking", participants: ["stacked-base-1", "stacked-base-2"], role: "stacking", state: "present", evidence: "structural" },
  ];
  if (mode === "duplexOverview" || mode === "forceComparison") interactions.push({ id: "complementary-hydrogen-bonding", type: "hydrogenBond", participants: ["complementary-base-interface"], role: "stabilization", state: "present", evidence: "explanatory" });
  if (mode === "duplexOverview" || mode === "grooveFocus") interactions.push({ id: "backbone-outside", type: "noncovalent", participants: ["backbone-a", "backbone-b", "canonical-duplex"], role: "stabilization", state: "present", evidence: "explanatory" });
  return interactions;
}

export function createDnaHelixStabilizationSpec(mode: DnaHelixStabilizationMode = "duplexOverview"): DnaMechanismSpec {
  const local = mode === "localStacking" || mode === "forceComparison";
  return {
    family: "helixStabilization",
    focus: mode === "grooveFocus" ? "major and minor groove organization" : mode === "forceComparison" ? "hydrogen bonding versus adjacent-base stacking" : mode === "localStacking" ? "adjacent base stacking contact" : "canonical B-DNA stabilization and inward bases",
    scale: { level: local ? "localChemistry" : "duplex", locality: local ? "local" : "regional" },
    requiredPrimitives: ["stabilizationForces", "molecularAssembly", "bondingInteraction"],
    molecularSelections: helixStabilizationSelections(mode),
    participatingGroups: helixStabilizationSelections(mode).map(({ id }) => id),
    interactions: helixStabilizationInteractions(mode),
    orientation: { strandDirections: ["5primeTo3prime", "3primeTo5prime"], antiparallel: true, axisAnchor: "duplex-axis", atomOrGroupAnchors: ["base-stack-axis", "major-groove", "minor-groove"] },
    structuralState: "stackedDuplex",
    annotations: [],
    representation: { backbone: "canonicalDna", localResidueDetail: local ? "atomAndBond" : "residue", basePairRungs: true, grooveReadability: mode === "grooveFocus" || mode === "duplexOverview", strandSeparation: false, atomColorGrammar: local },
    reaction: { required: false, steps: [] },
    structuralSubstrate: "existingDnaVisualSystem",
  };
}

export function deriveDnaHelixStabilizationPresentation(plan: DnaMechanismRepresentationPlan): DnaHelixStabilizationPresentation {
  const mode = modeFromPlan(plan);
  const view = canonicalDnaView(mode === "localStacking" || mode === "forceComparison" ? "local-chemistry" : mode === "grooveFocus" ? "whole-duplex" : "whole-duplex");
  const samples = sampleCanonicalDna(view.basePairCount, { topology: "double-stranded", lod: "polymer", localState: "canonical" });
  const firstIndex = Math.max(0, Math.min(samples.length - 2, view.selectedBasePair - 1));
  const stackingContacts = [stackingContact(samples, firstIndex, "stacked-base-1", "stacked-base-2")];
  const grooveSample = samples[view.selectedBasePair - 1] ?? samples[0];
  const grooves = grooveLocations(grooveSample);
  const baseRadialDistance = radialDistance(grooveSample.basePairStart);
  const backboneRadialDistance = radialDistance(grooveSample.strandA);
  const hydrogenBondInteractionIds = plan.sourceSpec.interactions.filter((item) => item.type === "hydrogenBond").map((item) => item.id);
  const stackingInteractionIds = plan.sourceSpec.interactions.filter((item) => item.type === "baseStacking").map((item) => item.id);
  return {
    representationPlan: plan,
    mode,
    stackingContacts,
    grooves,
    basesInterior: { baseRadialDistance, backboneRadialDistance, relation: "bases-inward-backbone-outward" },
    forceComparison: mode === "forceComparison" ? { hydrogenBondInteractionIds, stackingInteractionIds, hydrogenBondsActAcrossComplementaryBases: true, stackingActsBetweenAdjacentSameStrandBases: true, interpretation: "structural-contributions-are-distinct-and-combined" } : undefined,
    widthExplanation: { basePairWidthAngstrom: dnaVisualSystem.geometry.basePairWidthAngstrom, purinePyrimidineFit: "approximately-consistent", specificityClaim: "width-supports-geometry-but-does-not-alone-determine-specificity" },
    camera: view,
  };
}

function modeFromPlan(plan: DnaMechanismRepresentationPlan): DnaHelixStabilizationMode {
  const focus = plan.sourceSpec.focus.toLowerCase();
  if (focus.includes("groove")) return "grooveFocus";
  if (focus.includes("hydrogen") || focus.includes("stacking") && plan.sourceSpec.interactions.some((item) => item.type === "hydrogenBond")) return "forceComparison";
  if (plan.sourceSpec.molecularSelections.some((item) => item.id === "stacked-base-1")) return "localStacking";
  if (plan.sourceSpec.scale.level === "localChemistry") return "localStacking";
  return "duplexOverview";
}

function stackingContact(samples: readonly DnaHelixSample[], index: number, fromBaseSelection: string, toBaseSelection: string): DnaStackingContact {
  const from = samples[index].basePairStart;
  const to = samples[index + 1].basePairStart;
  const contactCenter: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const contactDistance = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  return { id: "stacking-contact-1", fromBaseSelection, toBaseSelection, strand: "A", type: "baseStacking", state: "present", contactCenter, contactDistance, relativeOrientation: "adjacent-planar-surfaces" };
}

function grooveLocations(sample: DnaHelixSample): readonly [DnaGrooveLocation, DnaGrooveLocation] {
  const phase = Math.atan2(sample.strandA[1], sample.strandA[0]);
  const radius = (radialDistance(sample.strandA) + radialDistance(sample.strandB)) / 2 * 0.72;
  const point = (offset: number): readonly [number, number, number] => [Math.cos(phase + offset) * radius, Math.sin(phase + offset) * radius, sample.strandA[2]];
  return [
    { id: "major-groove", basePairIndex: sample.index, center: point(Math.PI / 2), betweenBackbones: true, derivedFrom: "canonical-b-dna-backbone-phase" },
    { id: "minor-groove", basePairIndex: sample.index, center: point(-Math.PI / 2), betweenBackbones: true, derivedFrom: "canonical-b-dna-backbone-phase" },
  ];
}

function radialDistance(point: readonly [number, number, number]) {
  return Math.hypot(point[0], point[1]);
}
