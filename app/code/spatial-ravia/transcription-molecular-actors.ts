import type { TranscriptionPresentationStateV1 } from "./transcription-presentation-state.ts";

export type RnaBase = "A" | "U" | "G" | "C";

export type TranscriptionRnaUnit = {
  index: number;
  base: RnaBase;
  position: readonly [number, number, number];
  ribose: readonly [number, number, number];
  phosphate: readonly [number, number, number];
  basePosition: readonly [number, number, number];
  inHybrid: boolean;
};

export type TranscriptionHybridPair = {
  rnaUnitIndex: number;
  dnaPosition: readonly [number, number, number];
  rnaPosition: readonly [number, number, number];
};

export type TranscriptionMolecularRna = {
  units: TranscriptionRnaUnit[];
  backboneSegments: Array<{ from: readonly [number, number, number]; to: readonly [number, number, number] }>;
  hybridPairs: TranscriptionHybridPair[];
  growingThreePrime: readonly [number, number, number] | null;
  fivePrime: readonly [number, number, number] | null;
  exitAnchor: readonly [number, number, number];
  tangent: readonly [number, number, number];
};

const bases: readonly RnaBase[] = ["A", "U", "G", "C"];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const sceneXFromProgress = (progress: number) => -2.8 + clamp01(progress) * 5.6;

/**
 * Deterministic molecular teaching geometry for the short transcript at the
 * active site. Index order is 5′→3′; the final unit is always the growing 3′
 * end and remains anchored at the polymerase active-site frame.
 */
export function sampleTranscriptionMolecularRna(
  presentation: Pick<TranscriptionPresentationStateV1, "nascentRnaVisualLength" | "nascentRnaAnchor" | "bubbleOpenFraction">,
): TranscriptionMolecularRna {
  const count = Math.max(0, Math.min(12, Math.ceil(presentation.nascentRnaVisualLength)));
  const anchorX = sceneXFromProgress(presentation.nascentRnaAnchor);
  const exitAnchor: readonly [number, number, number] = [anchorX, -0.22, 0.18];
  const hybridCount = Math.min(3, count);
  const units = Array.from({ length: count }, (_, index) => {
    const distance = count - 1 - index;
    const position: readonly [number, number, number] = [
      anchorX + distance * 0.2,
      -0.28 - distance * 0.12,
      0.2 + Math.min(0.18, distance * 0.025),
    ];
    return {
      index,
      base: bases[index % bases.length]!,
      position,
      ribose: position,
      phosphate: [position[0] + 0.13, position[1] - 0.08, position[2] - 0.015] as const,
      basePosition: [position[0], position[1] + 0.14, position[2] + 0.03] as const,
      inHybrid: index >= count - hybridCount && presentation.bubbleOpenFraction > 0.05,
    } satisfies TranscriptionRnaUnit;
  });
  const backboneSegments = units.slice(0, -1).map((unit, index) => ({
    from: unit.phosphate,
    to: units[index + 1]!.ribose,
  }));
  const hybridPairs = units.filter((unit) => unit.inHybrid).map((unit) => ({
    rnaUnitIndex: unit.index,
    rnaPosition: unit.basePosition,
    dnaPosition: [unit.basePosition[0], 0.02, unit.basePosition[2] - 0.02] as const,
  }));
  return {
    units,
    backboneSegments,
    hybridPairs,
    growingThreePrime: units.at(-1)?.basePosition ?? null,
    fivePrime: units[0]?.basePosition ?? null,
    exitAnchor,
    tangent: [1, 0, 0],
  };
}
