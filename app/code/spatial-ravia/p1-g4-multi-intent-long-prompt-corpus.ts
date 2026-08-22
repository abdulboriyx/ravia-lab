/** P1-G4: compound-prompt corpus only. It does not add temporal semantics to F1. */

import type { IntentAct, MechanismId, PhenomenonId, SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import type { ScientificClaimOutcome } from "./semantic-misconception-policy.ts";

export type MultiIntentSharedContext = {
  entities: readonly SemanticEntityId[];
  phenomena?: readonly PhenomenonId[];
  mechanisms?: readonly MechanismId[];
};

export type MultiIntentLongPromptCase = {
  caseId: string;
  rawPrompt: string;
  expectedActs: readonly IntentAct[];
  expectedSharedContext: MultiIntentSharedContext;
  /** P1-F sub-intents reference this one shared F1 request set rather than copying it. */
  expectedRequestReferences: readonly (readonly number[])[];
  expectedConflictHandoff: readonly ("P1-D" | "P1-E")[];
  clarificationRequired: boolean;
  misconceptionOutcome: ScientificClaimOutcome;
  /** False only when the user requires temporal order that F1 v1 cannot encode. */
  sequenceRepresentableUnderF1V1: boolean;
  source: "synthetic" | "manual";
};

const accept = "ACCEPT" as const;
const one = [[0]] as const;
const twoActsOneRequest = [[0], [0]] as const;

export const multiIntentLongPromptCorpus: readonly MultiIntentLongPromptCase[] = [
  { caseId: "g4-001", rawPrompt: "show replication and explain helicase", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["dna", "helicase", "replicationFork"], phenomena: ["replication"], mechanisms: ["dnaReplication"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-002", rawPrompt: "compare DNA and RNA and animate strand separation", expectedActs: ["compare", "animate"], expectedSharedContext: { entities: ["dna", "rna", "strand"], phenomena: ["strandSeparation"], mechanisms: ["strandOpening"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-003", rawPrompt: "show the RNA hairpin and identify the loop", expectedActs: ["show", "inspect"], expectedSharedContext: { entities: ["rna"], phenomena: ["rnaSecondaryStructure"], mechanisms: ["rnaSecondaryFolding"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "synthetic" },
  { caseId: "g4-004", rawPrompt: "show helicase and polymerase at the replication fork", expectedActs: ["show"], expectedSharedContext: { entities: ["helicase", "polymerase", "replicationFork", "dna"], phenomena: ["replication"], mechanisms: ["dnaReplication"] }, expectedRequestReferences: one, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-005", rawPrompt: "show RNA cleavage and exonuclease degradation side by side", expectedActs: ["show", "compare"], expectedSharedContext: { entities: ["rna"], phenomena: ["cleavage", "exonucleaseDegradation"], mechanisms: ["rnaCleavage", "terminalExonucleaseAction"] }, expectedRequestReferences: [[0, 1], [0, 1]], expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "synthetic" },
  { caseId: "g4-006", rawPrompt: "show RNA intact and cleaved, then explain the cut", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["rna"], phenomena: ["cleavage"], mechanisms: ["rnaCleavage"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: ["P1-E"], clarificationRequired: false, misconceptionOutcome: "INVALID_SCIENTIFIC_REQUEST", sequenceRepresentableUnderF1V1: false, source: "manual" },
  { caseId: "g4-007", rawPrompt: "Hey, I am studying for an exam and keep mixing this up—could you show DNA base pairing, explain it simply, and ignore the history of Watson and Crick?", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["dna"], phenomena: ["basePairing"], mechanisms: ["hydrogenBonding"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-008", rawPrompt: "For a lesson, compare RNA and DNA chemistry; I do not need a quiz or a bibliography; animate the RNA 2′-OH context.", expectedActs: ["compare", "animate"], expectedSharedContext: { entities: ["rna", "dna", "riboseTwoPrimeHydroxyl"], phenomena: ["chemicalStabilityComparison"], mechanisms: ["riboseHydroxylSusceptibility"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "synthetic" },
  { caseId: "g4-009", rawPrompt: "show the hairpin, then explain why it forms", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["rna"], phenomena: ["rnaSecondaryStructure"], mechanisms: ["rnaSecondaryFolding"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: false, source: "manual" },
  { caseId: "g4-010", rawPrompt: "first show a DNA duplex, then compare it with an RNA hairpin", expectedActs: ["show", "compare"], expectedSharedContext: { entities: ["dna", "duplex", "rna"], phenomena: ["rnaSecondaryStructure"] }, expectedRequestReferences: [[0, 1], [0, 1]], expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: false, source: "synthetic" },
  { caseId: "g4-011", rawPrompt: "compare DNA base pairing with RNA base pairing and explain the differences", expectedActs: ["compare", "explain"], expectedSharedContext: { entities: ["dna", "rna"], phenomena: ["basePairing"], mechanisms: ["hydrogenBonding"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-012", rawPrompt: "show this strand and explain whether it is DNA or RNA", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["strand"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: ["P1-D"], clarificationRequired: true, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "synthetic" },
  { caseId: "g4-013", rawPrompt: "show the enzyme opening it, compare both possibilities, and explain the choice", expectedActs: ["show", "compare", "explain"], expectedSharedContext: { entities: ["dna", "helicase", "rnaPolymerase"], phenomena: ["strandSeparation", "transcription"], mechanisms: ["strandOpening", "transcriptionElongation"] }, expectedRequestReferences: [[0, 1], [0, 1], [0, 1]], expectedConflictHandoff: ["P1-D"], clarificationRequired: true, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-014", rawPrompt: "DNA has ribose; show the backbone and explain why", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["dna", "ribose", "phosphodiesterLinkage"], phenomena: ["backboneChemistry"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: ["P1-E"], clarificationRequired: false, misconceptionOutcome: "CLAIM_REQUIRES_GROUNDING", sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-015", rawPrompt: "show A-G canonical pairing and also animate RNA folding", expectedActs: ["show", "animate"], expectedSharedContext: { entities: ["adenine", "guanine", "rna"], phenomena: ["canonicalBasePairing", "rnaSecondaryStructure"], mechanisms: ["rnaSecondaryFolding"] }, expectedRequestReferences: [[0, 1], [0, 1]], expectedConflictHandoff: ["P1-E"], clarificationRequired: false, misconceptionOutcome: "INVALID_SCIENTIFIC_REQUEST", sequenceRepresentableUnderF1V1: true, source: "synthetic" },
  { caseId: "g4-016", rawPrompt: "Please show transcription, because my tutor said it matters, explain the nascent transcript, and skip any irrelevant protein details.", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["dna", "rna"], phenomena: ["transcription"], mechanisms: ["transcriptionElongation"] }, expectedRequestReferences: twoActsOneRequest, expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
  { caseId: "g4-017", rawPrompt: "show RNA processing: cap, splice, and poly-A; explain each", expectedActs: ["show", "explain"], expectedSharedContext: { entities: ["rna", "cap", "intron", "exon", "polyATail"], phenomena: ["rnaProcessing"], mechanisms: ["rnaCapping", "rnaSplicing"] }, expectedRequestReferences: [[0, 1], [0, 1]], expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "synthetic" },
  { caseId: "g4-018", rawPrompt: "I saw a movie about dinosaurs yesterday. Anyway, compare RNA cleavage with degradation and tell me which end is involved.", expectedActs: ["compare", "explain"], expectedSharedContext: { entities: ["rna"], phenomena: ["cleavage", "exonucleaseDegradation"], mechanisms: ["rnaCleavage", "terminalExonucleaseAction"] }, expectedRequestReferences: [[0, 1], [0, 1]], expectedConflictHandoff: [], clarificationRequired: false, misconceptionOutcome: accept, sequenceRepresentableUnderF1V1: true, source: "manual" },
];

export function validateMultiIntentLongPromptCorpus(corpus: readonly MultiIntentLongPromptCase[] = multiIntentLongPromptCorpus): string[] {
  const ids = new Set<string>();
  return corpus.flatMap((entry, index) => {
    const issues: string[] = [];
    if (!/^g4-\d{3}$/.test(entry.caseId)) issues.push(`${index}: invalid ID`);
    if (ids.has(entry.caseId)) issues.push(`${index}: duplicate ID`); ids.add(entry.caseId);
    if (!entry.rawPrompt.trim() || entry.expectedActs.length === 0 || entry.expectedSharedContext.entities.length === 0) issues.push(`${index}: incomplete semantic expectation`);
    if (entry.expectedRequestReferences.length !== entry.expectedActs.length) issues.push(`${index}: each act needs shared request references`);
    if (entry.clarificationRequired !== entry.expectedConflictHandoff.includes("P1-D")) issues.push(`${index}: clarification handoff mismatch`);
    if (entry.misconceptionOutcome !== accept && !entry.expectedConflictHandoff.includes("P1-E")) issues.push(`${index}: science-policy handoff missing`);
    return issues;
  });
}
