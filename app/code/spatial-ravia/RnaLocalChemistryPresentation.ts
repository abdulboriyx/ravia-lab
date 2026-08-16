import type { RnaSceneSpec } from "./rna-contract.ts";
import { canonicalRnaNucleotide, canonicalRnaView, type RnaAtom, type RnaBase, type RnaBond } from "./RnaVisualSystem.ts";

export type RnaLocalChemistryMode = "nucleotide" | "ribose" | "backbone" | "comparison" | "adjacentNucleotides";
export type RnaLocalChemistryFocus = "twoPrimeOH" | "ribose" | "phosphate" | "phosphodiesterLinkage" | "nucleotide" | "uracil" | "sugarPositions" | "rnaVsDnaComparison";
export type RnaLocalAnchorPosition = "1-prime" | "2-prime" | "3-prime" | "4-prime" | "5-prime";

export type RnaLocalChemistryAtom = RnaAtom & {
  nucleotideId: string;
  anchor?: RnaLocalAnchorPosition;
  label?: string;
};

export type RnaLocalChemistryBond = RnaBond & {
  state: "present" | "forming" | "breaking" | "absent";
};

export type RnaRiboseAnchor = {
  id: string;
  nucleotideId: string;
  position: RnaLocalAnchorPosition;
  attachedTo: string;
  label: string;
};

export type RnaPhosphodiesterBridge = {
  id: string;
  type: "phosphodiester";
  fromNucleotideId: string;
  toNucleotideId: string;
  threePrimeSide: string;
  phosphateId: string;
  fivePrimeSide: string;
  participants: readonly string[];
  state: "present" | "forming" | "breaking" | "absent";
};

export type RnaDnaLocalComparison = {
  sameScale: true;
  cameraIntent: "local-chemistry";
  rna: { sugar: "ribose"; hasTwoPrimeHydroxyl: true; base: RnaBase | "U" };
  dna: { sugar: "deoxyribose"; hasTwoPrimeHydroxyl: false; base: "T" | "A" | "G" | "C" };
  distinctions: readonly ["RNA has 2′-OH", "DNA lacks 2′-OH", "RNA uses uracil where DNA uses thymine"];
};

export type RnaLocalChemistryPresentation = {
  mode: RnaLocalChemistryMode;
  focus: RnaLocalChemistryFocus;
  representation: ReturnType<typeof canonicalRnaView>;
  atoms: readonly RnaLocalChemistryAtom[];
  bonds: readonly RnaLocalChemistryBond[];
  anchors: readonly RnaRiboseAnchor[];
  phosphodiesterBridges: readonly RnaPhosphodiesterBridge[];
  highlightedGroups: readonly string[];
  labels: readonly { text: string; anchorId: string }[];
  comparison?: RnaDnaLocalComparison;
  sameStrand: true;
  localScale: "local-chemistry";
};

const baseForSpec = (spec: RnaSceneSpec): RnaBase => spec.requiredEntities.includes("uracil") ? "U" : spec.requiredEntities.includes("guanine") ? "G" : spec.requiredEntities.includes("cytosine") ? "C" : "A";

function atom(id: string, nucleotideId: string, element: RnaAtom["element"], residue: RnaAtom["residue"], role: RnaAtom["role"], position: RnaAtom["position"], anchor?: RnaLocalAnchorPosition, label?: string): RnaLocalChemistryAtom {
  return { id, nucleotideId, element, residue, role, position, anchor, label };
}

function bond(id: string, from: string, to: string, type: RnaBond["type"] = "covalent", state: RnaLocalChemistryBond["state"] = "present"): RnaLocalChemistryBond {
  return { id, from, to, type, state };
}

function nucleotideUnit(nucleotideId: string, base: RnaBase, offset: number): { atoms: RnaLocalChemistryAtom[]; bonds: RnaLocalChemistryBond[]; anchors: RnaRiboseAnchor[] } {
  const chemistry = canonicalRnaNucleotide(base, [offset, 0, 0]);
  const byRole = new Map(chemistry.atoms.map((item) => [item.role, item]));
  const c1 = byRole.get("onePrimeCarbon")!;
  const c3 = byRole.get("threePrimeCarbon")!;
  const c5 = byRole.get("fivePrimeCarbon")!;
  const o2 = byRole.get("twoPrimeHydroxyl")!;
  const phosphate = byRole.get("phosphate")!;
  const atoms: RnaLocalChemistryAtom[] = chemistry.atoms.map((item) => atom(`${nucleotideId}-${item.id}`, nucleotideId, item.element, item.residue, item.role, item.position, undefined, item.role === "twoPrimeHydroxyl" ? "2′-OH" : undefined));
  // Agent B supplies the canonical atom/bond grammar; this local presentation
  // adds the explicit C2′ and C4′ explanatory anchors without changing it.
  const c2Position: RnaAtom["position"] = [c3.position[0] + 0.2, c3.position[1] - 0.2, c3.position[2]];
  const c4Position: RnaAtom["position"] = [c5.position[0] + 0.28, c5.position[1] - 0.18, c5.position[2]];
  atoms.push(
    atom(`${nucleotideId}-c2-prime`, nucleotideId, "C", "ribose", "ribose", c2Position, "2-prime", "2′ carbon"),
    atom(`${nucleotideId}-c4-prime`, nucleotideId, "C", "ribose", "ribose", c4Position, "4-prime", "4′ carbon"),
    atom(`${nucleotideId}-o3-prime`, nucleotideId, "O", "ribose", "threePrimeCarbon", [c3.position[0] - 0.24, c3.position[1] - 0.22, c3.position[2]], "3-prime", "3′-OH side"),
    atom(`${nucleotideId}-o5-prime`, nucleotideId, "O", "phosphate", "fivePrimePhosphate", [c5.position[0] - 0.28, c5.position[1] + 0.16, c5.position[2]], "5-prime", "5′ phosphate side"),
  );
  const bonds: RnaLocalChemistryBond[] = chemistry.bonds.map((item) => bond(`${nucleotideId}-${item.id}`, `${nucleotideId}-${item.from}`, `${nucleotideId}-${item.to}`, item.type));
  bonds.push(
    bond(`${nucleotideId}-c1-c2`, `${nucleotideId}-c1-prime`, `${nucleotideId}-c2-prime`),
    bond(`${nucleotideId}-c2-o2`, `${nucleotideId}-c2-prime`, `${nucleotideId}-o2-prime`),
    bond(`${nucleotideId}-c2-c3`, `${nucleotideId}-c2-prime`, `${nucleotideId}-c3-prime`),
    bond(`${nucleotideId}-c3-c4`, `${nucleotideId}-c3-prime`, `${nucleotideId}-c4-prime`),
    bond(`${nucleotideId}-c4-c5`, `${nucleotideId}-c4-prime`, `${nucleotideId}-c5-prime`),
    bond(`${nucleotideId}-c3-o3`, `${nucleotideId}-c3-prime`, `${nucleotideId}-o3-prime`),
    bond(`${nucleotideId}-c5-o5`, `${nucleotideId}-c5-prime`, `${nucleotideId}-o5-prime`),
  );
  const anchors: RnaRiboseAnchor[] = [
    { id: `${nucleotideId}-1-prime`, nucleotideId, position: "1-prime", attachedTo: `${nucleotideId}-base-anchor`, label: "1′ carbon / base attachment" },
    { id: `${nucleotideId}-2-prime`, nucleotideId, position: "2-prime", attachedTo: `${nucleotideId}-o2-prime`, label: "2′-OH" },
    { id: `${nucleotideId}-3-prime`, nucleotideId, position: "3-prime", attachedTo: `${nucleotideId}-o3-prime`, label: "3′-OH side" },
    { id: `${nucleotideId}-4-prime`, nucleotideId, position: "4-prime", attachedTo: `${nucleotideId}-c4-prime`, label: "4′ carbon" },
    { id: `${nucleotideId}-5-prime`, nucleotideId, position: "5-prime", attachedTo: `${nucleotideId}-o5-prime`, label: "5′ phosphate side" },
  ];
  // Keep these variables as explicit validation points for future adapters.
  void c1; void phosphate; void o2;
  return { atoms, bonds, anchors };
}

function bridge(left: string, right: string, state: RnaPhosphodiesterBridge["state"] = "present"): RnaPhosphodiesterBridge {
  return { id: `${left}-${right}-phosphodiester`, type: "phosphodiester", fromNucleotideId: left, toNucleotideId: right, threePrimeSide: `${left}-o3-prime`, phosphateId: `${right}-phosphate`, fivePrimeSide: `${right}-o5-prime`, participants: [`${left}-o3-prime`, `${right}-phosphate`, `${right}-o5-prime`], state };
}

function modeForSpec(spec: RnaSceneSpec): RnaLocalChemistryMode {
  if (spec.focus === "phosphodiesterLinkage") return "backbone";
  if (spec.focus === "rnaVsDnaComparison") return "comparison";
  if (spec.requiredEntities.includes("twoPrimeHydroxyl") || spec.requiredEntities.includes("uracil")) return "ribose";
  if (spec.requiredEntities.includes("phosphodiesterLinkage") && spec.requiredEntities.includes("ribose")) return "backbone";
  return "nucleotide";
}

function focusForPresentation(spec: RnaSceneSpec, mode: RnaLocalChemistryMode, requested?: RnaLocalChemistryFocus): RnaLocalChemistryFocus {
  if (requested) return requested;
  if (mode === "comparison") return "rnaVsDnaComparison";
  if (spec.focus === "twoPrimeOH" || spec.focus === "ribose" || spec.focus === "phosphodiesterLinkage" || spec.focus === "uracil" || spec.focus === "sugarPositions") return spec.focus;
  if (spec.focus === "rnaVsDnaComparison") return "rnaVsDnaComparison";
  if (mode === "backbone" || mode === "adjacentNucleotides") return "phosphodiesterLinkage";
  if (spec.requiredEntities.includes("twoPrimeHydroxyl")) return "twoPrimeOH";
  if (spec.requiredEntities.includes("uracil")) return "uracil";
  if (mode === "ribose") return "ribose";
  return "nucleotide";
}

export function createRnaLocalChemistryPresentation(spec: RnaSceneSpec, options: { mode?: RnaLocalChemistryMode; focus?: RnaLocalChemistryFocus; base?: RnaBase; comparisonBase?: "A" | "T" | "G" | "C" } = {}): RnaLocalChemistryPresentation {
  const mode = options.mode ?? modeForSpec(spec);
  const focus = focusForPresentation(spec, mode, options.focus);
  const base = options.base ?? baseForSpec(spec);
  const comparison = mode === "comparison" ? createRnaDnaLocalComparison(base, options.comparisonBase ?? "T") : undefined;
  const count = mode === "adjacentNucleotides" || mode === "backbone" ? 2 : 1;
  const units = Array.from({ length: count }, (_, index) => nucleotideUnit(`rna-nucleotide-${index + 1}`, base, index * 2.5));
  const atoms = units.flatMap((unit) => unit.atoms);
  const bonds = units.flatMap((unit) => unit.bonds);
  const bridges = count === 2 ? [bridge("rna-nucleotide-1", "rna-nucleotide-2")] : [];
  for (const item of bridges) bonds.push(bond(item.id, item.participants[0], item.participants[1], "phosphodiester", item.state));
  const anchors = units.flatMap((unit) => unit.anchors);
  const labelFilter = focus === "twoPrimeOH" ? new Set(["2-prime"]) : focus === "ribose" || focus === "uracil" || focus === "phosphate" ? new Set<string>() : focus === "phosphodiesterLinkage" ? new Set(["3-prime", "5-prime"]) : focus === "sugarPositions" ? new Set(["1-prime", "2-prime", "3-prime", "4-prime", "5-prime"]) : new Set(["2-prime"]);
  const labels = anchors.filter((item) => labelFilter.has(item.position) && (focus !== "phosphodiesterLinkage" || item.nucleotideId === "rna-nucleotide-1")).map((item) => ({ text: item.label, anchorId: item.id }));
  if (focus === "ribose") labels.unshift({ text: "Ribose", anchorId: "rna-nucleotide-1-1-prime" });
  if (focus === "phosphodiesterLinkage") labels.push({ text: "Phosphodiester linkage", anchorId: bridges[0]?.id ?? anchors[0].id });
  if (focus === "uracil" || (focus === "nucleotide" && base === "U")) labels.push({ text: "Uracil", anchorId: "rna-nucleotide-1-base-anchor" });
  const uniqueLabels = [...new Map(labels.map((label) => [`${label.text}:${label.anchorId}`, label])).values()];
  const highlightedGroups = focus === "twoPrimeOH" ? ["ribose", "twoPrimeHydroxyl"] : focus === "phosphodiesterLinkage" ? ["ribose", "phosphate", "phosphodiesterLinkage"] : focus === "uracil" ? ["base"] : ["ribose", "twoPrimeHydroxyl", "base"];
  return { mode, focus, representation: canonicalRnaView(mode === "ribose" || mode === "comparison" ? "local-chemistry" : "nucleotide"), atoms, bonds, anchors, phosphodiesterBridges: bridges, highlightedGroups, labels: uniqueLabels, comparison, sameStrand: true, localScale: "local-chemistry" };
}

export function createRnaDnaLocalComparison(rnaBase: RnaBase = "U", dnaBase: "T" | "A" | "G" | "C" = "T"): RnaDnaLocalComparison {
  return { sameScale: true, cameraIntent: "local-chemistry", rna: { sugar: "ribose", hasTwoPrimeHydroxyl: true, base: rnaBase }, dna: { sugar: "deoxyribose", hasTwoPrimeHydroxyl: false, base: dnaBase }, distinctions: ["RNA has 2′-OH", "DNA lacks 2′-OH", "RNA uses uracil where DNA uses thymine"] };
}

export function isValidRnaLocalChemistryPresentation(plan: RnaLocalChemistryPresentation) {
  const atomIds = new Set(plan.atoms.map((item) => item.id));
  return plan.sameStrand
    && plan.localScale === "local-chemistry"
    && plan.atoms.every((item) => item.nucleotideId.length > 0 && item.position.every(Number.isFinite))
    && plan.bonds.every((item) => atomIds.has(item.from) && atomIds.has(item.to))
    && plan.phosphodiesterBridges.every((item) => item.type === "phosphodiester" && item.participants.length === 3);
}
