import type { RnaSceneSpec } from "./rna-contract.ts";
import { createRnaLocalChemistryPresentation, type RnaLocalChemistryPresentation } from "./RnaLocalChemistryPresentation.ts";
import { canonicalRnaNucleotide, canonicalRnaView, rnaCameraFor, rnaDnaHybridPlan, rnaMaterialPalette, type DnaBase, type RnaBase, type RnaTheme } from "./RnaVisualSystem.ts";

export type RnaPairingKind = "A-U" | "G-C" | "G-U-wobble" | "A-T";
export type RnaPairingMode = "localPair" | "shortDuplex" | "hybrid";
export type RnaInteractionState = "unpaired" | "approaching" | "paired" | "separating";
export type RnaReactionState = "present" | "forming" | "breaking" | "absent";

/** Shared deterministic coordinate frame for every local RNA base pair. */
export type RnaLocalPairFrame = {
  center: readonly [number, number, number];
  pairAxis: readonly [number, number, number];
  leftOrigin: readonly [number, number, number];
  rightOrigin: readonly [number, number, number];
  sugarDirection: readonly [number, number, number];
};

export function createRnaLocalPairFrame(): RnaLocalPairFrame {
  // Keep the bases far enough apart that each noncovalent connector has a
  // clean silhouette; the sugars/backbone remain deliberately subordinate.
  return { center: [0, 0, 0], pairAxis: [1, 0, 0], leftOrigin: [-1.12, 0, 0], rightOrigin: [1.12, 0, 0], sugarDirection: [0, 1, 0] };
}

function length(a: readonly [number, number, number]) { return Math.hypot(a[0], a[1], a[2]); }
function unit(a: readonly [number, number, number]): [number, number, number] {
  const size = length(a);
  return size > 0 ? [a[0] / size, a[1] / size, a[2] / size] : [1, 0, 0];
}
function cross(a: readonly [number, number, number], b: readonly [number, number, number]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function transformRnaLocalPairPoint(position: readonly [number, number, number], side: 0 | 1, frame: RnaLocalPairFrame = createRnaLocalPairFrame()): [number, number, number] {
  const origin = side === 0 ? frame.leftOrigin : frame.rightOrigin;
  const axis = unit(frame.pairAxis);
  const sugar = unit(frame.sugarDirection);
  // The third axis is derived from the declared pair/sugar axes, so every
  // local unit remains in one reproducible plane even when a caller rotates
  // the pair frame.
  const depth = unit(cross(axis, sugar));
  const inward = side === 0 ? position[0] : -position[0];
  return [origin[0] + axis[0] * inward + sugar[0] * position[1] + depth[0] * position[2], origin[1] + axis[1] * inward + sugar[1] * position[1] + depth[1] * position[2], origin[2] + axis[2] * inward + sugar[2] * position[1] + depth[2] * position[2]];
}

export type RnaPairAnchor = { side: 0 | 1; base: RnaBase | "T"; site: string; role: "donor" | "acceptor"; position: readonly [number, number, number] };
export type RnaPairBounds = { min: readonly [number, number, number]; max: readonly [number, number, number]; center: readonly [number, number, number]; width: number; height: number; depth: number };
export type RnaPairFrameGeometry = { index: number; frame: RnaLocalPairFrame; baseCenters: readonly [RnaPoint, RnaPoint]; riboseCenters: readonly [RnaPoint, RnaPoint]; anchors: readonly RnaPairAnchor[] };
export type RnaPairGeometry = { frames: readonly RnaPairFrameGeometry[]; bounds: RnaPairBounds };

type RnaPoint = readonly [number, number, number];

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
  anchors: readonly [RnaPairAnchor, RnaPairAnchor];
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
  geometry: RnaPairGeometry;
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
  const requestedLength = Math.round(options.length ?? (mode === "localPair" ? 1 : mode === "hybrid" ? 6 : 5));
  // A hybrid is explanatory rather than genomic-scale: five to seven paired
  // residues show its antiparallel organization without overlapping strands.
  const length = mode === "hybrid" ? Math.min(7, Math.max(5, requestedLength)) : Math.max(1, requestedLength);
  return { mode, pair, interactionState: options.interactionState ?? (scene ? stateFromSpec(scene) : "paired"), strandCount: 2, hybrid: mode === "hybrid" || pair === "A-T", length, sameScale: true };
}

function reactionState(state: RnaInteractionState): RnaReactionState {
  if (state === "unpaired") return "absent";
  if (state === "approaching") return "forming";
  if (state === "separating") return "breaking";
  return "present";
}

type PairSite = { side: 0 | 1; base: RnaBase | "T"; site: string; role: "donor" | "acceptor" };
function siteDefinitions(classification: RnaPairClassification): readonly [PairSite, PairSite][] {
  if (classification.pair === "A-U" || classification.pair === "A-T") return [[{ side: 0, base: "A", site: "A-N6", role: "donor" }, { side: 1, base: classification.bases[1], site: "U/T-O4", role: "acceptor" }], [{ side: 1, base: classification.bases[1], site: "U/T-N3", role: "donor" }, { side: 0, base: "A", site: "A-N1", role: "acceptor" }]];
  if (classification.pair === "G-C") return [[{ side: 0, base: "G", site: "G-N1", role: "acceptor" }, { side: 1, base: "C", site: "C-N3", role: "donor" }], [{ side: 0, base: "G", site: "G-N2", role: "donor" }, { side: 1, base: "C", site: "C-O2", role: "acceptor" }], [{ side: 1, base: "C", site: "C-N4", role: "donor" }, { side: 0, base: "G", site: "G-O6", role: "acceptor" }]];
  return [[{ side: 0, base: "G", site: "G-N1", role: "acceptor" }, { side: 1, base: "U", site: "U-O2", role: "donor" }], [{ side: 1, base: "U", site: "U-N3", role: "donor" }, { side: 0, base: "G", site: "G-O6", role: "acceptor" }]];
}

function participant(id: string, strandId: string, base: RnaBase | "T", role: "donor" | "acceptor", site: string): RnaPairParticipant {
  return { id, strandId, base, role, site };
}

function anchorPosition(frame: RnaLocalPairFrame, site: PairSite, row: number, wobble: boolean): RnaPoint {
  // These are pedagogical positions for the real donor/acceptor identities,
  // arranged as distinct Watson-Crick edge rows rather than a center line.
  const verticalBySite: Record<string, number> = {
    "A-N6": 0.22, "U/T-O4": 0.22,
    "U/T-N3": -0.22, "A-N1": -0.22,
    "G-N1": 0.27, "C-N3": 0.27,
    "G-N2": 0, "C-O2": 0,
    "C-N4": -0.27, "G-O6": -0.27,
    "U-O2": 0.16,
  };
  const vertical = verticalBySite[site.site] ?? (row - 1) * 0.18;
  const wobbleOffset = wobble ? (site.side === 0 ? -0.11 : 0.11) : 0;
  return transformRnaLocalPairPoint([0.62 + wobbleOffset, vertical, 0.12], site.side, frame);
}

function buildInteractions(classification: RnaPairClassification, state: RnaInteractionState, leftStrand: RnaPairStrand, rightStrand: RnaPairStrand, length: number, geometry: RnaPairGeometry): RnaPairInteraction[] {
  const reaction = reactionState(state);
  const sites = siteDefinitions(classification);
  return Array.from({ length }, (_, index) => sites.map(([firstSite, secondSite], siteIndex) => {
    const pairFrame = geometry.frames[index];
    const first = firstSite.side === 0 ? leftStrand : rightStrand;
    const second = secondSite.side === 0 ? leftStrand : rightStrand;
    const firstParticipant = participant(`${first.id}-${index}-${siteIndex}-${firstSite.side}`, first.id, first.bases[index], firstSite.role, firstSite.site);
    const secondParticipant = participant(`${second.id}-${index}-${siteIndex}-${secondSite.side}`, second.id, second.bases[index], secondSite.role, secondSite.site);
    const firstAnchor = { ...firstSite, position: anchorPosition(pairFrame.frame, firstSite, siteIndex, classification.interactionType === "wobble") };
    const secondAnchor = { ...secondSite, position: anchorPosition(pairFrame.frame, secondSite, siteIndex, classification.interactionType === "wobble") };
    return { id: `hbond-${index}-${siteIndex}`, type: "hydrogenBond" as const, state: reaction, participants: [firstParticipant, secondParticipant] as [RnaPairParticipant, RnaPairParticipant], anchors: [firstAnchor, secondAnchor] as [RnaPairAnchor, RnaPairAnchor] };
  })).flat();
}

function pairFrameAt(index: number, length: number, wobble: boolean): RnaPairFrameGeometry {
  const center: [number, number, number] = [0, (index - (length - 1) / 2) * 0.82, wobble ? 0.03 : 0];
  const frame: RnaLocalPairFrame = { center, pairAxis: [1, 0, wobble ? 0.06 : 0], leftOrigin: [-1.12, center[1], center[2]], rightOrigin: [1.12, center[1], center[2]], sugarDirection: [0, 1, 0] };
  const baseCenters: [RnaPoint, RnaPoint] = [transformRnaLocalPairPoint([0.68, 0, 0.16], 0, frame), transformRnaLocalPairPoint([0.68, 0, 0.16], 1, frame)];
  const riboseCenters: [RnaPoint, RnaPoint] = [transformRnaLocalPairPoint([0, 0, 0.08], 0, frame), transformRnaLocalPairPoint([0, 0, 0.08], 1, frame)];
  return { index, frame, baseCenters, riboseCenters, anchors: [] };
}

function boundsForGeometry(frames: readonly RnaPairFrameGeometry[]): RnaPairBounds {
  const points = frames.flatMap((item) => [...item.baseCenters, ...item.riboseCenters, ...item.anchors.map((anchor) => anchor.position)]);
  const xs = points.map((point) => point[0]); const ys = points.map((point) => point[1]); const zs = points.map((point) => point[2]);
  const min: [number, number, number] = [Math.min(...xs) - 0.18, Math.min(...ys) - 0.18, Math.min(...zs) - 0.12];
  const max: [number, number, number] = [Math.max(...xs) + 0.18, Math.max(...ys) + 0.18, Math.max(...zs) + 0.12];
  return { min, max, center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], width: max[0] - min[0], height: max[1] - min[1], depth: max[2] - min[2] };
}

function buildGeometry(classification: RnaPairClassification, length: number): RnaPairGeometry {
  const frames = Array.from({ length }, (_, index) => pairFrameAt(index, length, classification.interactionType === "wobble"));
  const sites = siteDefinitions(classification);
  const withAnchors = frames.map((item) => ({ ...item, anchors: sites.flatMap(([first, second], siteIndex) => [
    { ...first, position: anchorPosition(item.frame, first, siteIndex, classification.interactionType === "wobble") },
    { ...second, position: anchorPosition(item.frame, second, siteIndex, classification.interactionType === "wobble") },
  ]) }));
  return { frames: withAnchors, bounds: boundsForGeometry(withAnchors) };
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
  const geometry = buildGeometry(classification, length);
  const localChemistry = leftKind === "RNA" && pairingSpec.mode === "localPair" && spec ? createRnaLocalChemistryPresentation(spec, { mode: "nucleotide", base: bases.left[0] }) : undefined;
  const representation = canonicalRnaView(pairingSpec.mode === "localPair" ? "base-pair" : "secondary-structure");
  const hbondInteractions = pairingSpec.interactionState === "unpaired" ? [] : buildInteractions(classification, pairingSpec.interactionState, left, right, length, geometry);
  const labels = pairingSpec.mode === "hybrid" ? [{ text: "RNA", target: left.id }, { text: "DNA", target: right.id }] : classification.interactionType === "wobble" ? [{ text: "G–U wobble", target: "hbond-0-0" }] : [{ text: classification.pair, target: "hbond-0-0" }];
  if (pairingSpec.mode === "shortDuplex" && classification.interactionType !== "wobble") labels.push({ text: `${classification.hydrogenBondCount} hydrogen bonds`, target: "hbond-0-0" });
  return { spec: pairingSpec, classification, representation, strands, interactions: hbondInteractions, backboneInteractions: strands.flatMap(buildBackbone), localChemistry, hybridPlan: pairingSpec.hybrid ? rnaDnaHybridPlan(left.id, right.id) : undefined, labels, camera: rnaCameraFor(pairingSpec.mode === "localPair" ? "local-chemistry" : pairingSpec.mode === "hybrid" ? "rna-dna-hybrid" : "secondary-structure"), materials: rnaMaterialPalette(options.theme ?? "dark"), geometry, hydrogenBondsRemainDistinctFromBackbone: true };
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
    && presentation.interactions.every((interaction) => interaction.anchors.length === 2 && interaction.anchors[0].position.every(Number.isFinite) && interaction.anchors[1].position.every(Number.isFinite) && new Set([interaction.anchors[0].role, interaction.anchors[1].role]).size === 2)
    && presentation.geometry.frames.length === presentation.spec.length
    && presentation.geometry.frames.every((frame) => frame.baseCenters.every((point) => point.every(Number.isFinite)) && frame.riboseCenters.every((point) => point.every(Number.isFinite)))
    && [presentation.geometry.bounds.min, presentation.geometry.bounds.max, presentation.geometry.bounds.center].flat().every(Number.isFinite)
    && presentation.backboneInteractions.every((interaction) => interaction.type === "phosphodiester" && interaction.state === "present")
    && presentation.hydrogenBondsRemainDistinctFromBackbone;
}
