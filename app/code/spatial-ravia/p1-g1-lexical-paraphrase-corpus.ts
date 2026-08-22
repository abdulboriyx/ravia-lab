/** P1-G1: adversarial corpus data only. It is intentionally not an extractor test. */

import type { IntentAct, MechanismId, PhenomenonId, SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import type { ScientificClaimOutcome } from "./semantic-misconception-policy.ts";

export const lexicalParaphraseCorpusVersion = "1" as const;
export type LexicalDifficulty = "easy" | "surfaceNoise" | "unicode" | "typo" | "slang" | "shorthand" | "colloquial" | "indirect" | "malformed";
export type LexicalSource = "synthetic" | "manual";
export type DecompositionShape = { acts: readonly IntentAct[]; compound?: boolean; ordering: "parallel" | "unspecified" };
export type LexicalSemanticInvariants = {
  entities?: readonly SemanticEntityId[];
  phenomenon?: PhenomenonId;
  mechanism?: MechanismId;
  screenDirection?: "screenLeft" | "screenRight";
  biochemicalDirection?: "fiveToThree" | "threeToFive";
  preservesClaim?: boolean;
};
export type LexicalParaphraseCase = {
  caseId: string;
  rawPrompt: string;
  expectedSemanticIntent: LexicalSemanticInvariants;
  expectedClarificationRequired: boolean;
  expectedMisconceptionOutcome: ScientificClaimOutcome;
  expectedDecomposition?: DecompositionShape;
  difficulty: LexicalDifficulty;
  source: LexicalSource;
};

const accept = "ACCEPT" as const;
const no = false as const;

export const lexicalParaphraseCorpus: readonly LexicalParaphraseCase[] = [
  { caseId: "g1-dna-001", rawPrompt: "  SHOW   dna   DUPLEX  ", expectedSemanticIntent: { entities: ["dna", "duplex"] }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "surfaceNoise", source: "synthetic" },
  { caseId: "g1-dna-002", rawPrompt: "DNA??? base-pairing!!!", expectedSemanticIntent: { entities: ["dna"], phenomenon: "basePairing", mechanism: "hydrogenBonding" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "surfaceNoise", source: "synthetic" },
  { caseId: "g1-dna-003", rawPrompt: "show DNA 5′→3′ polarity", expectedSemanticIntent: { entities: ["dna"], phenomenon: "polarity", mechanism: "antiparallelOrganization", biochemicalDirection: "fiveToThree" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "unicode", source: "manual" },
  { caseId: "g1-dna-004", rawPrompt: "show dna 3' -> 5' polarity", expectedSemanticIntent: { entities: ["dna"], phenomenon: "polarity", mechanism: "antiparallelOrganization", biochemicalDirection: "threeToFive" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "unicode", source: "synthetic" },
  { caseId: "g1-dna-005", rawPrompt: "unzip the dna pls", expectedSemanticIntent: { entities: ["dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "colloquial", source: "manual" },
  { caseId: "g1-dna-006", rawPrompt: "pull the two DNA rails apart", expectedSemanticIntent: { entities: ["dna", "strand"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "indirect", source: "synthetic" },
  { caseId: "g1-dna-007", rawPrompt: "show the copy-fork thing", expectedSemanticIntent: { entities: ["replicationFork"], phenomenon: "replication", mechanism: "dnaReplication" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "colloquial", source: "manual" },
  { caseId: "g1-dna-008", rawPrompt: "replicatn DNA at the fork", expectedSemanticIntent: { entities: ["dna", "replicationFork"], phenomenon: "replication", mechanism: "dnaReplication" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "typo", source: "synthetic" },
  { caseId: "g1-dna-009", rawPrompt: "make the DNA message into RNA", expectedSemanticIntent: { entities: ["dna", "rna"], phenomenon: "transcription", mechanism: "transcriptionElongation" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "indirect", source: "manual" },
  { caseId: "g1-dna-010", rawPrompt: "dna got a boo-boo; repair it", expectedSemanticIntent: { entities: ["dna", "lesion"], phenomenon: "damageRepair" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "slang", source: "synthetic" },
  { caseId: "g1-dna-011", rawPrompt: "pack DNA round histones", expectedSemanticIntent: { entities: ["dna", "regulatoryRegion"], phenomenon: "packaging" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "malformed", source: "manual" },
  { caseId: "g1-dna-012", rawPrompt: "zoom in on the sugar-phosphate chain", expectedSemanticIntent: { entities: ["phosphate", "phosphodiesterLinkage"], phenomenon: "backboneChemistry", mechanism: "phosphodiesterLinkage" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "indirect", source: "synthetic" },
  { caseId: "g1-dna-013", rawPrompt: "why does the helix stay stacked?", expectedSemanticIntent: { entities: ["duplex"], phenomenon: "helixStabilization", mechanism: "baseStacking" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "colloquial", source: "manual" },
  { caseId: "g1-rna-001", rawPrompt: "rna pls", expectedSemanticIntent: { entities: ["rna"] }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "shorthand", source: "manual" },
  { caseId: "g1-rna-002", rawPrompt: "SHOW an RNA hair-pin", expectedSemanticIntent: { entities: ["rna"], phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "surfaceNoise", source: "synthetic" },
  { caseId: "g1-rna-003", rawPrompt: "show the little RNA loop bit", expectedSemanticIntent: { entities: ["rna"], phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "colloquial", source: "manual" },
  { caseId: "g1-rna-004", rawPrompt: "pre mRNA: intron gone, exon joined", expectedSemanticIntent: { entities: ["mRNA", "intron", "exon"], phenomenon: "rnaProcessing", mechanism: "rnaSplicing" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "shorthand", source: "manual" },
  { caseId: "g1-rna-005", rawPrompt: "cap the 5-prime end of this transcript", expectedSemanticIntent: { entities: ["cap", "rna"], phenomenon: "rnaProcessing", mechanism: "rnaCapping" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "unicode", source: "synthetic" },
  { caseId: "g1-rna-006", rawPrompt: "A-U pair in rna", expectedSemanticIntent: { entities: ["adenine", "uracil", "rna"], phenomenon: "basePairing", mechanism: "hydrogenBonding" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "shorthand", source: "manual" },
  { caseId: "g1-rna-007", rawPrompt: "rna + dna hybrid, show it", expectedSemanticIntent: { entities: ["rna", "dna"], phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "malformed", source: "synthetic" },
  { caseId: "g1-rna-008", rawPrompt: "snip the RNA", expectedSemanticIntent: { entities: ["rna"], phenomenon: "cleavage", mechanism: "rnaCleavage" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "colloquial", source: "manual" },
  { caseId: "g1-rna-009", rawPrompt: "rna getting chewed from 5′", expectedSemanticIntent: { entities: ["rna"], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", biochemicalDirection: "fiveToThree" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "colloquial", source: "manual" },
  { caseId: "g1-rna-010", rawPrompt: "why rna fall apart easier than dna", expectedSemanticIntent: { entities: ["rna", "dna"], phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "malformed", source: "manual" },
  { caseId: "g1-rna-011", rawPrompt: "point at the 2′-OH", expectedSemanticIntent: { entities: ["riboseTwoPrimeHydroxyl"], phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "unicode", source: "synthetic" },
  { caseId: "g1-multi-001", rawPrompt: "show replication + explain helicase", expectedSemanticIntent: { entities: ["replicationFork", "helicase"], phenomenon: "replication", mechanism: "dnaReplication" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, expectedDecomposition: { acts: ["show", "explain"], compound: true, ordering: "parallel" }, difficulty: "shorthand", source: "manual" },
  { caseId: "g1-multi-002", rawPrompt: "DNA v RNA — compare, then animate opening", expectedSemanticIntent: { entities: ["dna", "rna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, expectedDecomposition: { acts: ["compare", "animate"], compound: true, ordering: "parallel" }, difficulty: "unicode", source: "synthetic" },
  { caseId: "g1-amb-001", rawPrompt: "open this helix??", expectedSemanticIntent: { phenomenon: "strandSeparation", mechanism: "strandOpening" }, expectedClarificationRequired: true, expectedMisconceptionOutcome: accept, difficulty: "indirect", source: "manual" },
  { caseId: "g1-screen-001", rawPrompt: "break RNA from the left...", expectedSemanticIntent: { entities: ["rna"], phenomenon: "cleavage", mechanism: "rnaCleavage", screenDirection: "screenLeft" }, expectedClarificationRequired: no, expectedMisconceptionOutcome: accept, difficulty: "surfaceNoise", source: "synthetic" },
];

export function validateLexicalParaphraseCorpus(corpus: readonly LexicalParaphraseCase[] = lexicalParaphraseCorpus): string[] {
  const ids = new Set<string>();
  return corpus.flatMap((entry, index) => {
    const errors: string[] = [];
    if (!/^g1-[a-z]+-\d{3}$/.test(entry.caseId)) errors.push(`${index}: invalid case ID`);
    if (ids.has(entry.caseId)) errors.push(`${index}: duplicate case ID`); ids.add(entry.caseId);
    if (!entry.rawPrompt.trim()) errors.push(`${index}: empty prompt`);
    if (!entry.difficulty || !entry.source) errors.push(`${index}: missing provenance`);
    if (entry.expectedDecomposition?.compound && entry.expectedDecomposition.acts.length < 2) errors.push(`${index}: compound shape requires multiple acts`);
    return errors;
  });
}
