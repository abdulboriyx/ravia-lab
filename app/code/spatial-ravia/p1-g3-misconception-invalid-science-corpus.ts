/** P1-G3: P1-E adversarial data only. Claims remain verbatim user assertions. */

import type { MisconceptionStatus } from "./foundation-semantic-vocabulary.ts";
import type { ScientificClaimOutcome } from "./semantic-misconception-policy.ts";

export type ScienceErrorCorpusCase = {
  caseId: string;
  rawPrompt: string;
  /** Exact user claim(s), never a rewritten scientific correction. */
  preservedClaims: readonly { rawText: string; status: MisconceptionStatus }[];
  expectedOutcome: ScientificClaimOutcome;
  category: "wrongSugarOrBase" | "invalidBasePair" | "wrongDirection" | "impossibleMechanism" | "contradictoryState" | "uncertainty" | "unusualValid" | "requiresGrounding" | "mixedRequest";
  source: "synthetic" | "manual";
};

export const misconceptionInvalidScienceCorpus: readonly ScienceErrorCorpusCase[] = [
  { caseId: "g3-001", rawPrompt: "DNA has ribose right?", preservedClaims: [{ rawText: "DNA has ribose", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "wrongSugarOrBase", source: "manual" },
  { caseId: "g3-002", rawPrompt: "RNA uses thymine instead of uracil.", preservedClaims: [{ rawText: "RNA uses thymine instead of uracil", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "wrongSugarOrBase", source: "synthetic" },
  { caseId: "g3-003", rawPrompt: "A pairs with G", preservedClaims: [{ rawText: "A pairs with G", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "invalidBasePair", source: "manual" },
  { caseId: "g3-004", rawPrompt: "Show canonical A-G pairing in DNA", preservedClaims: [{ rawText: "canonical A-G pairing", status: "suspected" }], expectedOutcome: "INVALID_SCIENTIFIC_REQUEST", category: "invalidBasePair", source: "synthetic" },
  { caseId: "g3-005", rawPrompt: "DNA strands run in the same 5′→3′ direction", preservedClaims: [{ rawText: "DNA strands run in the same 5′→3′ direction", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "wrongDirection", source: "manual" },
  { caseId: "g3-006", rawPrompt: "Degrade this exact RNA from both 5′→3′ and 3′→5′", preservedClaims: [], expectedOutcome: "INVALID_SCIENTIFIC_REQUEST", category: "wrongDirection", source: "synthetic" },
  { caseId: "g3-007", rawPrompt: "Helicase ligates two strands while it unwinds them", preservedClaims: [{ rawText: "Helicase ligates two strands while it unwinds them", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "impossibleMechanism", source: "manual" },
  { caseId: "g3-008", rawPrompt: "Show an RNA molecule that is intact and cleaved", preservedClaims: [], expectedOutcome: "INVALID_SCIENTIFIC_REQUEST", category: "contradictoryState", source: "synthetic" },
  { caseId: "g3-009", rawPrompt: "Show DNA both closed and open in the same state", preservedClaims: [], expectedOutcome: "INVALID_SCIENTIFIC_REQUEST", category: "contradictoryState", source: "manual" },
  { caseId: "g3-010", rawPrompt: "Can RNA form a G-U wobble pair?", preservedClaims: [], expectedOutcome: "ACCEPT", category: "uncertainty", source: "manual" },
  { caseId: "g3-011", rawPrompt: "Is this an RNA-DNA hybrid or ordinary pairing?", preservedClaims: [], expectedOutcome: "ACCEPT", category: "uncertainty", source: "synthetic" },
  { caseId: "g3-012", rawPrompt: "Show an RNA-DNA hybrid with RNA on the left", preservedClaims: [], expectedOutcome: "ACCEPT", category: "unusualValid", source: "manual" },
  { caseId: "g3-013", rawPrompt: "Show a G-U wobble pair in RNA", preservedClaims: [], expectedOutcome: "ACCEPT", category: "unusualValid", source: "synthetic" },
  { caseId: "g3-014", rawPrompt: "DNA is more stable than RNA", preservedClaims: [{ rawText: "DNA is more stable than RNA", status: "neutral" }], expectedOutcome: "ACCEPT", category: "requiresGrounding", source: "manual" },
  { caseId: "g3-015", rawPrompt: "A validated review found that DNA contains ribose", preservedClaims: [{ rawText: "DNA contains ribose", status: "validated" }], expectedOutcome: "CORRECTION_REQUIRED", category: "wrongSugarOrBase", source: "synthetic" },
  { caseId: "g3-016", rawPrompt: "DNA has ribose; show its backbone", preservedClaims: [{ rawText: "DNA has ribose", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "mixedRequest", source: "manual" },
  { caseId: "g3-017", rawPrompt: "A pairs with G; animate RNA folding", preservedClaims: [{ rawText: "A pairs with G", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "mixedRequest", source: "synthetic" },
  { caseId: "g3-018", rawPrompt: "Does DNA really have a 2′-OH?", preservedClaims: [{ rawText: "DNA really have a 2′-OH", status: "suspected" }], expectedOutcome: "CLAIM_REQUIRES_GROUNDING", category: "wrongSugarOrBase", source: "manual" },
  { caseId: "g3-019", rawPrompt: "Show RNA paired and unpaired in one molecular state", preservedClaims: [], expectedOutcome: "INVALID_SCIENTIFIC_REQUEST", category: "contradictoryState", source: "synthetic" },
  { caseId: "g3-020", rawPrompt: "Could an exonuclease act from a named terminus?", preservedClaims: [], expectedOutcome: "ACCEPT", category: "uncertainty", source: "manual" },
];

export function validateMisconceptionInvalidScienceCorpus(corpus: readonly ScienceErrorCorpusCase[] = misconceptionInvalidScienceCorpus): string[] {
  const ids = new Set<string>();
  return corpus.flatMap((entry, index) => {
    const issues: string[] = [];
    if (!/^g3-\d{3}$/.test(entry.caseId)) issues.push(`${index}: invalid ID`);
    if (ids.has(entry.caseId)) issues.push(`${index}: duplicate ID`); ids.add(entry.caseId);
    if (!entry.rawPrompt.trim()) issues.push(`${index}: empty prompt`);
    if (entry.expectedOutcome === "CORRECTION_REQUIRED" && !entry.preservedClaims.some(({ status }) => status === "validated")) issues.push(`${index}: correction requires validated claim status`);
    if (entry.expectedOutcome === "CLAIM_REQUIRES_GROUNDING" && entry.preservedClaims.length === 0) issues.push(`${index}: claim outcome requires preserved claim`);
    if (entry.preservedClaims.some(({ rawText }) => !rawText.trim())) issues.push(`${index}: empty preserved claim`);
    return issues;
  });
}
