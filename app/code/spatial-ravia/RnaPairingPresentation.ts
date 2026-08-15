import type { RnaSceneSpec } from "./rna-contract.ts";
import { createRnaLocalChemistryPresentation, type RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import { canonicalRnaNucleotide, canonicalRnaView, rnaCameraFor, rnaDnaHybridPlan, rnaMaterialPalette, type DnaBase, type RnaBase, type RnaTheme } from "./RnaVisualSystem.ts";

export type RnaPairingKind = "A-U" | "G-C" | "G-U-wobble" | "A-T";
export type RnaPairingMode = "localPair" | "shortDuplex" | "hybrid";
export type RnaInteractionState = "unpaired" | "approaching" | "paired" | "separating";
export type RnaReactionState = "present" | "forming" | "breaking" | "absent";

export type RnaPairClassification = {
  pair: RnaPairingKind;
  bases: readonly [RnaBase | "T", RnaBase | "T"];
  interactionType: "canonical" | "wobble";
  hydrogenBondCount: number;
  specificityNote: "canonical-complementary" | "wobble-not-Watson-Crick" | "hybrid-canonical";
};

export type RnaPairParticipant = {
  id: string;
  strandId: string;
  base: RnaBase | "T";
  role: "donor" | "acceptor";
  site: string;
};

export type RnaPairInteraction = {
  id: string;
  type: "hydrogenBond";
  state: RnaReactionState;
  participants: readonly [RnaPairParticipant, RnaPairParticipant];
};

export type RnaBackboneInteraction = {
  id: string;
  type: "phosphodiester";
  strandId: string;
  participants: readonly [string, string];
  state: "present";
};

export type RnaPairStrand = {
  id: string;
  kind: "RNA" | "DNA";
  direction: "5primeTo3prime" | "3primeTo5prime";
  bases: readonly (RnaBase | DnaBase)[];
  chemistry: {
    sugar: "ribose" | "deoxyribose";
    hasTwoPrimeHydroxyl: boolean;
    canonicalBaseAlphabet: readonly string[];
  };
  nucleotideChemistry: ReturnType<typeof canonicalRnaNucleotide> | undefined;
};

export type RnaPairingSpec = {
  mode: RnaPairingMode;
  pair: RnaPairingKind;
  interactionState: RnaInteractionState;
  strandCount: 2;
  hybrid: boolean;
  length: number;
  sameScale: true;
};

export type RnaPairingPresentation = {
  spec: RnaPairingSpec;
  classification: RnaPairClassification;
  representation: ReturnType<typeof canonicalRnaView>;
  strands: readonly RnaPairStrand[];
  interactions: readonly RnaPairInteraction[];
  backboneInteractions: readonly RnaBackboneInteraction[];
  localChemistry?: RnaLocalChemistryPresentation;
  hybridPlan?: ReturnType<typeof rnaDnaHybridPlan>;
  labels: readonly { text: string; target: string }[];
  camera: ReturnType<typeof rnaCameraFor>;
  materials: ReturnType<typeof rnaMaterialPalette>;
  hydrogenBondsRemainDistinctFromBackbone: true;
};

type PairingOptions = {
  mode?: RnaPairingMode;
  pair?: RnaPairingKind;
  interactionState?: RnaInteractionState;
  length?: number;
  theme?: RnaTheme;
};

function pairFromSpec(spec: RnaSceneSpec): RnaPairingKind {
  if (spec.dnaContext.required) return spec.requiredEntities.includes("adenine") ? "A-T" : "G-C";
  if (spec.pairingState === "wobble" || (spec.requiredEntities.includes("guanine") && spec.requiredEntities.includes("uracil") && spec.focus.toLowerCase().includes("wobble"))) return "G-U-wobble";
  if (spec.requiredEntities.includes("guanine") && spec.requiredEntities.includes("cytosine")) return "G-C";
  return "A-U";
}

function modeFromSpec(spec: RnaSceneSpec): RnaPairingMode {
  if (spec.dnaContext.required || spec.scale.level === "hybrid") return "hybrid";
  if (spec.strandCount === 2 || /complementary|duplex|strands/i.test(spec.focus)) return "shortDuplex";
  return "localPair";
}

function stateFromSpec(spec: RnaSceneSpec): RnaInteractionState {
  return spec.pairingState === "none" ? "unpaired" : spec.pairingState === "wobble" ? "paired" : "paired";
}

export function classifyRnaPair(pair: RnaPairingKind): RnaPairClassification {
  if (pair === "A-U") return { pair, bases: ["A", "U"], interactionType: "canonical", hydrogenBondCount: 2, specificityNote: "canonical-complementary" };
  if (pair === "G-C") return { pair, bases: ["G", "C"], interactionType: "canonical", hydrogenBondCount: 3, specificityNote: "canonical-complementary" };
  if (pair === "G-U-wobble") return { pair, bases: ["G", "U"], interactionType: "wobble", hydrogenBondCount: 2, specificityNote: "wobble-not-Watson-Crick" };
  return { pair, bases: ["A", "T"], interactionType: "canonical", hydrogenBondCount: 2, specificityNote: "hybrid-canonical" };
}

export function createRnaPairingSpec(input: RnaSceneSpec | RnaPairingKind, options: PairingOptions = {}): RnaPairingSpec {
  const scene = typeof input === "string" ? undefined : input;
  const pair = options.pair ?? (typeof input === "string" ? input : pairFromSpec(input));
  const mode = options.mode ?? (scene ? modeFromSpec(scene) : pair === "A-T" ? "hybrid" : "localPair");
  return { mode, pair, interactionState: options.interactionState ?? (scene ? stateFromSpec(scene) : "paired"), strandCount: 2, hybrid: mode === "hybrid" || pair === "A-T", length: Math.max(1, Math.round(options.length ?? (mode === "localPair" ? 1 : 5))), sameScale: true };
}

function reactionState(state: RnaInteractionState): RnaReactionState {
  if (state === "unpaired") return "absent";
  if (state === "approaching") return "forming";
  if (state === "separating") return "breaking";
  return "present";
}

function siteDefinitions(classification: RnaPairClassification): readonly [string, string][] {
  if (classification.pair === "A-U" || classification.pair === "A-T") return [["A-N6", "U/T-O4"], ["U/T-N3", "A-N1"]];
  if (classification.pair === "G-C") return [["G-N1", "C-N3"], ["G-N2", "C-O2"], ["C-N4", "G-O6"]];
  return [["G-N1", "U-O2"], ["U-N3", "G-O6"]];
}

function participant(id: string, strandId: string, base: RnaBase | "T", role: "donor" | "acceptor", site: string): RnaPairParticipant {
  return { id, strandId, base, role, site };
}

function buildInteractions(classification: RnaPairClassification, state: RnaInteractionState, leftStrand: RnaPairStrand, rightStrand: RnaPairStrand, length: number): RnaPairInteraction[] {
  const reaction = reactionState(state);
  const sites = siteDefinitions(classification);
  return Array.from({ length }, (_, index) => sites.map(([leftSite, rightSite], siteIndex) => {
    const leftIsDonor = /N6|N2|N3$/.test(leftSite);
    const leftBase = leftStrand.bases[index];
    const rightBase = rightStrand.bases[index];
    const left = participant(`${leftStrand.id}-${index}-${siteIndex}-left`, leftStrand.id, leftBase, leftIsDonor ? "donor" : "acceptor", leftSite);
    const right = participant(`${rightStrand.id}-${index}-${siteIndex}-right`, rightStrand.id, rightBase, leftIsDonor ? "acceptor" : "donor", rightSite);
    return { id: `hbond-${index}-${siteIndex}`, type: "hydrogenBond" as const, state: reaction, participants: [left, right] as [RnaPairParticipant, RnaPairParticipant] };
  })).flat();
}

function buildBackbone(strand: RnaPairStrand): RnaBackboneInteraction[] {
  return strand.bases.slice(1).map((_, index) => ({ id: `${strand.id}-phosphodiester-${index}`, type: "phosphodiester" as const, strandId: strand.id, participants: [`${strand.id}-nucleotide-${index}`, `${strand.id}-nucleotide-${index + 1}`] as [string, string], state: "present" as const }));
}

function strand(id: string, kind: "RNA" | "DNA", bases: readonly (RnaBase | "T")[], direction: RnaPairStrand["direction"]): RnaPairStrand {
  const first = bases[0];
  return { id, kind, direction, bases, chemistry: kind === "RNA" ? { sugar: "ribose", hasTwoPrimeHydroxyl: true, canonicalBaseAlphabet: ["A", "U", "G", "C"] } : { sugar: "deoxyribose", hasTwoPrimeHydroxyl: false, canonicalBaseAlphabet: ["A", "T", "G", "C"] }, nucleotideChemistry: kind === "RNA" && first !== "T" ? canonicalRnaNucleotide(first as RnaBase) : undefined };
}

function basesFor(classification: RnaPairClassification, length: number, rightKind: "RNA" | "DNA"): { left: RnaBase[]; right: (RnaBase | "T")[] } {
  const leftBase = classification.bases[0] as RnaBase;
  const rightBase = classification.bases[1];
  return { left: Array.from({ length }, () => leftBase), right: Array.from({ length }, () => rightKind === "DNA" && rightBase === "U" ? "T" : rightBase) };
}

export function deriveRnaPairingPresentation(input: RnaSceneSpec | RnaPairingKind, options: PairingOptions = {}): RnaPairingPresentation {
  const spec = typeof input === "string" ? undefined : input;
  const pairingSpec = createRnaPairingSpec(input, options);
  const classification = classifyRnaPair(pairingSpec.pair);
  const length = pairingSpec.length;
  const leftKind: "RNA" = "RNA";
  const rightKind: "RNA" | "DNA" = pairingSpec.hybrid ? "DNA" : "RNA";
  const bases = basesFor(classification, length, rightKind);
  const left = strand("rna-strand-1", leftKind, bases.left, "5primeTo3prime");
  const right = strand(pairingSpec.hybrid ? "dna-strand-2" : "rna-strand-2", rightKind, bases.right, "3primeTo5prime");
  const strands = [left, right] as const;
  const localChemistry = leftKind === "RNA" && pairingSpec.mode === "localPair" && spec ? createRnaLocalChemistryPresentation(spec, { mode: "nucleotide", base: bases.left[0] }) : undefined;
  const representation = canonicalRnaView(pairingSpec.mode === "localPair" ? "base-pair" : "secondary-structure");
  const hbondInteractions = pairingSpec.interactionState === "unpaired" ? [] : buildInteractions(classification, pairingSpec.interactionState, left, right, length);
  const labels = pairingSpec.mode === "hybrid" ? [{ text: "RNA", target: left.id }, { text: "DNA", target: right.id }] : classification.interactionType === "wobble" ? [{ text: "G–U wobble", target: "hbond-0-0" }] : [{ text: classification.pair, target: "hbond-0-0" }];
  if (pairingSpec.mode !== "localPair" && classification.interactionType !== "wobble") labels.push({ text: `${classification.hydrogenBondCount} hydrogen bonds`, target: "hbond-0-0" });
  return { spec: pairingSpec, classification, representation, strands, interactions: hbondInteractions, backboneInteractions: strands.flatMap(buildBackbone), localChemistry, hybridPlan: pairingSpec.hybrid ? rnaDnaHybridPlan(left.id, right.id) : undefined, labels, camera: rnaCameraFor(pairingSpec.mode === "localPair" ? "local-chemistry" : pairingSpec.mode === "hybrid" ? "rna-dna-hybrid" : "secondary-structure"), materials: rnaMaterialPalette(options.theme ?? "dark"), hydrogenBondsRemainDistinctFromBackbone: true };
}

export function rnaPairInteractions(pair: RnaPairingKind, state: RnaInteractionState = "paired"): readonly RnaPairInteraction[] {
  return deriveRnaPairingPresentation(pair, { interactionState: state }).interactions;
}

export function rnaHybridPresentation(input: RnaSceneSpec | RnaPairingKind = "A-T", options: Omit<PairingOptions, "mode"> = {}): RnaPairingPresentation {
  return deriveRnaPairingPresentation(input, { ...options, mode: "hybrid", pair: options.pair ?? (typeof input === "string" ? input : undefined) });
}

export function isValidRnaPairingPresentation(presentation: RnaPairingPresentation): boolean {
  const participants = presentation.interactions.flatMap((interaction) => interaction.participants);
  return presentation.spec.strandCount === 2
    && presentation.strands.length === 2
    && presentation.interactions.every((interaction) => interaction.type === "hydrogenBond" && interaction.participants[0].strandId !== interaction.participants[1].strandId)
    && participants.every((item) => item.role === "donor" || item.role === "acceptor")
    && presentation.backboneInteractions.every((interaction) => interaction.type === "phosphodiester" && interaction.state === "present")
    && presentation.hydrogenBondsRemainDistinctFromBackbone;
}
