import type { TranslationMotionState } from "./biology-motion-state.ts";

export type TranslationVisualState = {
  activeSites: { a: number; p: number; e: number };
  recognition: boolean;
  peptideTransfer: boolean;
  exiting: boolean;
  incomingCharged: boolean;
  peptidylOnA: boolean;
  peptidylOnP: boolean;
  codonStep: number;
};

export function deriveTranslationVisualState(motion: TranslationMotionState): TranslationVisualState {
  const phase = motion.phaseId;
  const recognition = phase === "codon-recognition" || motion.recognitionProgress > 0 && phase !== "translocation";
  const peptideTransfer = phase === "peptide-transfer" || motion.peptideTransferProgress > 0 && motion.peptideTransferProgress < 1;
  const exiting = phase === "trna-exit" || motion.exitingTrnaProgress > 0;
  const translocation = phase === "translocation" || motion.translocationProgress > 0;
  return {
    activeSites: peptideTransfer ? { a: 1, p: 1, e: 0.25 } : exiting ? { a: 0.25, p: 0.52, e: 1 } : translocation ? { a: 0.9, p: 0.9, e: 0.72 } : recognition || phase === "aminoacyl-trna-entry" ? { a: 1, p: 0.58, e: 0.2 } : { a: 0.45, p: 0.82, e: 0.25 },
    recognition,
    peptideTransfer,
    exiting,
    incomingCharged: motion.aSiteOccupancy.carriesAminoAcid,
    peptidylOnA: motion.aSiteOccupancy.carriesPeptide,
    peptidylOnP: motion.pSiteOccupancy.carriesPeptide,
    codonStep: Math.max(0, Math.floor(motion.mrnaOffset)),
  };
}
