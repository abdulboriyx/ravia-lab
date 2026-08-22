/** P1-G2: adversarial ambiguity data only; no parser or policy implementation. */

import type { BiochemicalDirection, MechanismId, PhenomenonId, ScreenDirection, SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import type { ScientificClaimOutcome } from "./semantic-misconception-policy.ts";

export type AmbiguityAlternative = {
  id: string;
  entities?: readonly SemanticEntityId[];
  phenomenon?: PhenomenonId;
  mechanism?: MechanismId;
};

export type AmbiguityDirectionConflictCase = {
  caseId: string;
  rawPrompt: string;
  expectedAlternatives: readonly AmbiguityAlternative[];
  clarificationRequired: boolean;
  /** The smallest semantic distinction a question may request, never a raw-text paraphrase. */
  minimumClarificationTarget?: string;
  biochemicalDirection?: BiochemicalDirection;
  screenDirection?: ScreenDirection;
  expectedPolicyOutcome: ScientificClaimOutcome;
  source: "synthetic" | "manual";
};

const accept = "ACCEPT" as const;

export const ambiguityDirectionConflictCorpus: readonly AmbiguityDirectionConflictCase[] = [
  { caseId: "g2-001", rawPrompt: "open this helix", expectedAlternatives: [{ id: "dna-duplex-opening", entities: ["dna", "duplex"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, { id: "rna-secondary-unfolding", entities: ["rna"], phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding" }], clarificationRequired: true, minimumClarificationTarget: "DNA duplex or RNA secondary structure", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-002", rawPrompt: "show this strand", expectedAlternatives: [{ id: "dna-strand", entities: ["dna", "strand"] }, { id: "rna-strand", entities: ["rna", "strand"] }], clarificationRequired: true, minimumClarificationTarget: "DNA or RNA", expectedPolicyOutcome: accept, source: "synthetic" },
  { caseId: "g2-003", rawPrompt: "what is it doing to the chain?", expectedAlternatives: [{ id: "rna-cleavage", entities: ["rna"], phenomenon: "cleavage", mechanism: "rnaCleavage" }, { id: "rna-exonuclease", entities: ["rna"], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction" }], clarificationRequired: true, minimumClarificationTarget: "cleavage or exonuclease degradation", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-004", rawPrompt: "show the enzyme opening it", expectedAlternatives: [{ id: "helicase", entities: ["helicase", "dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, { id: "rna-polymerase", entities: ["rnaPolymerase", "dna"], phenomenon: "transcription", mechanism: "transcriptionElongation" }], clarificationRequired: true, minimumClarificationTarget: "helicase or RNA polymerase", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-005", rawPrompt: "break the RNA", expectedAlternatives: [{ id: "rna-cleavage", entities: ["rna"], phenomenon: "cleavage", mechanism: "rnaCleavage" }], clarificationRequired: false, expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-006", rawPrompt: "RNA getting eaten", expectedAlternatives: [{ id: "rna-exonuclease", entities: ["rna"], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction" }], clarificationRequired: false, expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-007", rawPrompt: "separate the DNA strands", expectedAlternatives: [{ id: "dna-strand-separation", entities: ["dna", "strand"], phenomenon: "strandSeparation", mechanism: "strandOpening" }], clarificationRequired: false, expectedPolicyOutcome: accept, source: "synthetic" },
  { caseId: "g2-008", rawPrompt: "bind RNA to DNA", expectedAlternatives: [{ id: "rna-dna-hybrid", entities: ["rna", "dna"], phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation" }, { id: "generic-binding", entities: ["rna", "dna"] }], clarificationRequired: true, minimumClarificationTarget: "RNA-DNA hybridization or a different binding relationship", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-009", rawPrompt: "pair these bases", expectedAlternatives: [{ id: "dna-base-pairing", entities: ["dna"], phenomenon: "basePairing", mechanism: "hydrogenBonding" }, { id: "rna-base-pairing", entities: ["rna"], phenomenon: "basePairing", mechanism: "hydrogenBonding" }], clarificationRequired: true, minimumClarificationTarget: "DNA or RNA base pairing", expectedPolicyOutcome: accept, source: "synthetic" },
  { caseId: "g2-010", rawPrompt: "break RNA from the left", expectedAlternatives: [{ id: "rna-cleavage-left", entities: ["rna"], phenomenon: "cleavage", mechanism: "rnaCleavage" }], clarificationRequired: false, screenDirection: "screenLeft", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-011", rawPrompt: "degrade RNA from the 5′ end", expectedAlternatives: [{ id: "rna-five-to-three-degradation", entities: ["rna"], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction" }], clarificationRequired: false, biochemicalDirection: "fiveToThree", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-012", rawPrompt: "degrade RNA from the 3′ end", expectedAlternatives: [{ id: "rna-three-to-five-degradation", entities: ["rna"], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction" }], clarificationRequired: false, biochemicalDirection: "threeToFive", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-013", rawPrompt: "open DNA left to right", expectedAlternatives: [{ id: "dna-opening-screen", entities: ["dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }], clarificationRequired: false, screenDirection: "screenLeft", expectedPolicyOutcome: accept, source: "synthetic" },
  { caseId: "g2-014", rawPrompt: "open DNA with ambiguous direction", expectedAlternatives: [{ id: "dna-opening-five-to-three", entities: ["dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, { id: "dna-opening-three-to-five", entities: ["dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }], clarificationRequired: true, minimumClarificationTarget: "5′→3′ or 3′→5′", expectedPolicyOutcome: accept, source: "synthetic" },
  { caseId: "g2-015", rawPrompt: "show upstream of the promoter", expectedAlternatives: [{ id: "upstream-regulation", entities: ["promoter", "regulatoryRegion"], phenomenon: "regulation" }], clarificationRequired: false, biochemicalDirection: "sequenceDirection", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-016", rawPrompt: "show DNA opening 5′→3′ and 3′→5′", expectedAlternatives: [{ id: "opposite-direction-1", entities: ["dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, { id: "opposite-direction-2", entities: ["dna"], phenomenon: "strandSeparation", mechanism: "strandOpening" }], clarificationRequired: false, expectedPolicyOutcome: "INVALID_SCIENTIFIC_REQUEST", source: "synthetic" },
  { caseId: "g2-017", rawPrompt: "show RNA both intact and cleaved", expectedAlternatives: [{ id: "intact-rna", entities: ["rna"] }, { id: "cleaved-rna", entities: ["rna"], phenomenon: "cleavage", mechanism: "rnaCleavage" }], clarificationRequired: false, expectedPolicyOutcome: "INVALID_SCIENTIFIC_REQUEST", source: "manual" },
  { caseId: "g2-018", rawPrompt: "show paired and unpaired RNA at once", expectedAlternatives: [{ id: "paired-rna", entities: ["rna"], phenomenon: "basePairing" }, { id: "unpaired-rna", entities: ["rna"], phenomenon: "rnaSecondaryStructure" }], clarificationRequired: false, expectedPolicyOutcome: "INVALID_SCIENTIFIC_REQUEST", source: "synthetic" },
  { caseId: "g2-019", rawPrompt: "show a closed helix and open it", expectedAlternatives: [{ id: "closed-duplex", entities: ["dna", "duplex"] }, { id: "open-duplex", entities: ["dna", "duplex"], phenomenon: "strandSeparation", mechanism: "strandOpening" }], clarificationRequired: true, minimumClarificationTarget: "initial state versus requested final state", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-020", rawPrompt: "it pairs with this", expectedAlternatives: [{ id: "dna-pairing", entities: ["dna"], phenomenon: "basePairing" }, { id: "rna-pairing", entities: ["rna"], phenomenon: "basePairing" }, { id: "rna-dna-hybrid", entities: ["rna", "dna"], phenomenon: "rnaDnaHybridization" }], clarificationRequired: true, minimumClarificationTarget: "pairing participants and molecular context", expectedPolicyOutcome: accept, source: "manual" },
  { caseId: "g2-021", rawPrompt: "show replication and transcription on this polymerase", expectedAlternatives: [{ id: "replication-polymerase", entities: ["polymerase", "dna"], phenomenon: "replication", mechanism: "dnaReplication" }, { id: "transcription-polymerase", entities: ["rnaPolymerase", "dna"], phenomenon: "transcription", mechanism: "transcriptionElongation" }], clarificationRequired: true, minimumClarificationTarget: "replication or transcription polymerase", expectedPolicyOutcome: accept, source: "synthetic" },
  { caseId: "g2-022", rawPrompt: "DNA has ribose; open this helix", expectedAlternatives: [{ id: "dna-duplex-opening", entities: ["dna", "duplex"], phenomenon: "strandSeparation", mechanism: "strandOpening" }, { id: "rna-secondary-unfolding", entities: ["rna"], phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding" }], clarificationRequired: true, minimumClarificationTarget: "DNA duplex or RNA secondary structure", expectedPolicyOutcome: "CLAIM_REQUIRES_GROUNDING", source: "manual" },
];

export function validateAmbiguityDirectionConflictCorpus(corpus: readonly AmbiguityDirectionConflictCase[] = ambiguityDirectionConflictCorpus): string[] {
  const ids = new Set<string>();
  return corpus.flatMap((entry, index) => {
    const issues: string[] = [];
    if (!/^g2-\d{3}$/.test(entry.caseId)) issues.push(`${index}: invalid ID`);
    if (ids.has(entry.caseId)) issues.push(`${index}: duplicate ID`); ids.add(entry.caseId);
    if (!entry.rawPrompt.trim() || entry.expectedAlternatives.length === 0) issues.push(`${index}: missing prompt or alternatives`);
    if (entry.clarificationRequired !== Boolean(entry.minimumClarificationTarget)) issues.push(`${index}: clarification target mismatch`);
    if (entry.screenDirection && entry.biochemicalDirection) issues.push(`${index}: screen and biochemical directions must remain separate cases`);
    return issues;
  });
}
