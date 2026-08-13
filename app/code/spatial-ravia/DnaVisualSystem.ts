/**
 * Engine-neutral visual system for every Spatial Ravia DNA representation.
 * Mol* consumers map these values to representation props; procedural
 * consumers map them to generated coordinates and materials.
 */

export type DnaTopology = "double-stranded" | "single-stranded" | "locally-open";
export type DnaVisualLod = "global" | "polymer" | "nucleotide" | "local-chemistry";
export type DnaLocalState = "canonical" | "mismatch" | "damaged";
export type DnaTheme = "light" | "dark";
export type DnaStructureFocus = "whole-duplex" | "base-pair" | "nucleotide" | "local-chemistry";

export type DnaVisualState = {
  topology: DnaTopology;
  lod: DnaVisualLod;
  localState: DnaLocalState;
  openCenter?: number;
  openBasePairs?: number;
  curvature?: number;
};

export const dnaVisualSystem = {
  // Canonical right-handed B-DNA geometry in Å.
  geometry: {
    handedness: "right-handed" as const,
    helixRadiusAngstrom: 10,
    risePerBasePairAngstrom: 3.4,
    basePairsPerTurn: 10.5,
    basePairWidthAngstrom: 10.8,
    backboneRadiusAngstrom: 1.15,
    baseThicknessAngstrom: 0.55,
    phosphateGlyphRadiusAngstrom: 1.35,
    localOpenDisplacementAngstrom: 5.4,
    maximumOpenBasePairs: 14,
    packagingBendRadiusAngstrom: 42,
    /** Long enough to show more than one B-DNA turn without becoming a rod. */
    canonicalDuplexBasePairCount: 16,
  },
  representation: {
    backboneRadius: 0.46,
    nucleotideRingScale: 0.42,
    nucleotideBlockScale: 0.38,
    basePairRungRadius: 0.09,
    selectedNucleotideScale: 0.26,
    atomScale: 0.16,
    bondScale: 0.34,
    globalContextOpacity: 0.86,
    localContextOpacity: 0.28,
  },
  colors: {
    strandA: 0x4d8db7,
    strandB: 0x9b78b7,
    basePair: 0xd7c890,
    mismatch: 0xcb7a77,
    damage: 0xc77956,
    phosphate: 0xc98b45,
    sugar: 0x8b7bb8,
    atomCarbon: 0x596673,
  },
  themes: {
    light: { background: 0xf6f8f7, label: 0x17242b, contextOpacityMultiplier: 1 },
    dark: { background: 0x020305, label: 0xe5eff2, contextOpacityMultiplier: 1.08 },
  },
} as const;

export type CanonicalDnaView = {
  focus: DnaStructureFocus;
  basePairCount: number;
  selectedBasePair: number;
  topology: DnaTopology;
  lod: DnaVisualLod;
  camera: { azimuthDegrees: number; elevationDegrees: number; distanceScale: number };
};

/** Stable renderer-neutral presets; downstream DNA families must not infer mesh details. */
export function canonicalDnaView(focus: DnaStructureFocus): CanonicalDnaView {
  const basePairCount = dnaVisualSystem.geometry.canonicalDuplexBasePairCount;
  const selectedBasePair = Math.ceil(basePairCount / 2);
  if (focus === "base-pair") {
    return { focus, basePairCount, selectedBasePair, topology: "double-stranded", lod: "nucleotide", camera: { azimuthDegrees: 30, elevationDegrees: 16, distanceScale: 0.32 } };
  }
  if (focus === "nucleotide" || focus === "local-chemistry") {
    return { focus, basePairCount, selectedBasePair, topology: "double-stranded", lod: "local-chemistry", camera: { azimuthDegrees: 26, elevationDegrees: 12, distanceScale: 0.22 } };
  }
  return { focus, basePairCount, selectedBasePair, topology: "double-stranded", lod: "global", camera: { azimuthDegrees: 42, elevationDegrees: 18, distanceScale: 0.72 } };
}

export type DnaHelixSample = {
  index: number;
  strandA: readonly [number, number, number];
  strandB: readonly [number, number, number];
  basePairStart: readonly [number, number, number];
  basePairEnd: readonly [number, number, number];
  opening: number;
};

export function sampleCanonicalDna(length: number, state: DnaVisualState): DnaHelixSample[] {
  const count = Math.max(1, Math.round(length));
  const geometry = dnaVisualSystem.geometry;
  const center = state.openCenter ?? (count - 1) / 2;
  const requestedOpen = state.topology === "locally-open" ? state.openBasePairs ?? 6 : 0;
  const halfOpen = Math.min(geometry.maximumOpenBasePairs, Math.max(0, requestedOpen)) / 2;
  const curvature = Math.max(0, state.curvature ?? 0);

  return Array.from({ length: count }, (_, index) => {
    const angle = (index * 2 * Math.PI) / geometry.basePairsPerTurn;
    const axial = (index - (count - 1) / 2) * geometry.risePerBasePairAngstrom;
    const openDistance = Math.abs(index - center);
    const opening = state.topology === "locally-open"
      ? smooth01(1 - Math.max(0, openDistance - halfOpen) / 1.4)
      : state.topology === "single-stranded" ? 1 : 0;
    const outward = opening * geometry.localOpenDisplacementAngstrom;
    const bend = curvature * axial * axial / (2 * geometry.packagingBendRadiusAngstrom * Math.max(count, 1));
    const aRadius = geometry.helixRadiusAngstrom + outward;
    const bRadius = geometry.helixRadiusAngstrom + outward;
    const a: [number, number, number] = [Math.cos(angle) * aRadius + bend, Math.sin(angle) * aRadius, axial];
    const b: [number, number, number] = [Math.cos(angle + Math.PI) * bRadius - bend, Math.sin(angle + Math.PI) * bRadius, axial];
    const baseRadius = geometry.basePairWidthAngstrom / 2 + opening * geometry.localOpenDisplacementAngstrom * 0.55;
    const basePairStart: [number, number, number] = [Math.cos(angle) * baseRadius + bend, Math.sin(angle) * baseRadius, axial];
    const basePairEnd: [number, number, number] = [Math.cos(angle + Math.PI) * baseRadius - bend, Math.sin(angle + Math.PI) * baseRadius, axial];
    return { index, strandA: a, strandB: b, basePairStart, basePairEnd, opening };
  });
}

export function dnaLodPolicy(lod: DnaVisualLod) {
  if (lod === "global") return { backbone: true, basePairs: "sparse" as const, selectedChemistry: false, labels: "termini" as const };
  if (lod === "polymer") return { backbone: true, basePairs: "restrained" as const, selectedChemistry: false, labels: "termini" as const };
  if (lod === "nucleotide") return { backbone: true, basePairs: "individual" as const, selectedChemistry: true, labels: "selected" as const };
  return { backbone: true, basePairs: "selected" as const, selectedChemistry: true, labels: "selected" as const };
}

export function isValidDnaVisualState(state: DnaVisualState) {
  return Number.isFinite(state.openCenter ?? 0)
    && Number.isFinite(state.openBasePairs ?? 0)
    && Number.isFinite(state.curvature ?? 0)
    && (state.topology !== "locally-open" || (state.openBasePairs ?? 0) > 0);
}

function smooth01(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}
