import type { TranscriptionActiveSiteFrame } from "./transcription-structural-actors.ts";
import { buildRnaVisualStrand, type RnaBaseIdentity, type RnaPoint, type RnaVisualStrand } from "./rna-canonical-visual.ts";

export const depositedRnaBoundaryV1 = {
  sourceId: "rcsb-pdb:6ALH:assembly-1:model-1",
  chainId: "R",
  residueId: 11,
  selector: { structureId: "6ALH", chainId: "R", residueRange: { start: 11, end: 11 } },
  fidelity: "E0_DEPOSITED" as const,
  continuationFidelity: "S2_SCHEMATIC" as const,
};

export type FreeRnaContinuation = {
  fidelity: "S2_SCHEMATIC";
  exitEvidence: "GROUNDED" | "UNRESOLVED_S2_FALLBACK";
  structuralBoundary: typeof depositedRnaBoundaryV1;
  tailCount: number;
  positions: readonly RnaPoint[];
  strand: RnaVisualStrand | null;
  threePrimeAtBoundary: boolean;
};

const clampCount = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
const sixAlhRnaIdentity: readonly RnaBaseIdentity[] = ["G", "C", "A", "U", "U", "C", "A", "A", "A", "G", "C", "G", "G", "A", "G", "A", "G", "G", "U", "A"];

/**
 * Builds only the post-boundary continuation. The final tail unit is the
 * active 3′ end nearest the structural exit; older 5′ units extend outward.
 */
export function deriveFreeRnaContinuation(options: {
  canonicalVisibleLength: number;
  structuralResidueCount?: number;
  exitAnchor: RnaPoint;
  exitDirection: RnaPoint;
  exitFrame?: TranscriptionActiveSiteFrame;
  sequence?: readonly RnaBaseIdentity[];
}): FreeRnaContinuation {
  const structuralResidueCount = options.structuralResidueCount ?? depositedRnaBoundaryV1.residueId;
  const tailCount = Math.max(0, clampCount(options.canonicalVisibleLength) - structuralResidueCount);
  const direction = options.exitDirection;
  const magnitude = Math.hypot(direction[0], direction[1], direction[2]);
  const exitEvidence = options.exitFrame && magnitude > 1e-8 ? "GROUNDED" : "UNRESOLVED_S2_FALLBACK";
  const unit = magnitude > 1e-8 ? [direction[0] / magnitude, direction[1] / magnitude, direction[2] / magnitude] as const : [1, 0, 0] as const;
  const positions = Array.from({ length: tailCount }, (_, index) => {
    const distance = (tailCount - index) * 0.2;
    return [options.exitAnchor[0] + unit[0] * distance, options.exitAnchor[1] + unit[1] * distance, options.exitAnchor[2] + unit[2] * distance] as const;
  });
  const sequence = options.sequence ?? sixAlhRnaIdentity;
  const strand = tailCount > 0
    ? buildRnaVisualStrand({ sequence: sequence.slice(0, tailCount), positions, direction: "5-to-3", visibleCount: tailCount })
    : null;
  return { fidelity: "S2_SCHEMATIC", exitEvidence, structuralBoundary: depositedRnaBoundaryV1, tailCount, positions, strand, threePrimeAtBoundary: true };
}
