/** P1-G5: authoritative P1 corpus manifest. Data normalization only; no prompt parsing. */

import type { IntentAct, MechanismId, PhenomenonId, SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import type { ScientificClaimOutcome } from "./semantic-misconception-policy.ts";
import { lexicalParaphraseCorpus } from "./p1-g1-lexical-paraphrase-corpus.ts";
import { ambiguityDirectionConflictCorpus } from "./p1-g2-ambiguity-direction-conflict-corpus.ts";
import { misconceptionInvalidScienceCorpus } from "./p1-g3-misconception-invalid-science-corpus.ts";
import { multiIntentLongPromptCorpus } from "./p1-g4-multi-intent-long-prompt-corpus.ts";

export const p1AdversarialCorpusVersion = "1" as const;
export type P1Partition = "development" | "sealedHoldout";
export type P1Difficulty = "EASY" | "MEDIUM" | "HARD" | "ADVERSARIAL";
export type P1Domain = "DNA" | "RNA" | "CROSS_DOMAIN";
export type P1SemanticInvariants = { entities?: readonly SemanticEntityId[]; phenomenon?: PhenomenonId; mechanism?: MechanismId; acts?: readonly IntentAct[]; biochemicalDirection?: string; screenDirection?: string; claims?: readonly string[] };
export type P1DecompositionInvariants = { acts: readonly IntentAct[]; requestReferences?: readonly (readonly number[])[]; conflictHandoff?: readonly ("P1-D" | "P1-E")[]; sequenceRepresentableUnderF1V1?: boolean };
export type P1AdversarialCase = {
  caseId: string; rawPrompt: string; category: string; subcategory: string; difficulty: P1Difficulty; domain: P1Domain;
  expectedSemanticIntent: P1SemanticInvariants; expectedClarificationRequired: boolean; expectedMisconceptionOutcome: ScientificClaimOutcome;
  expectedDecomposition?: P1DecompositionInvariants; source: "synthetic" | "manual"; partition: P1Partition;
};

const difficulty = (value: string): P1Difficulty => value === "easy" ? "EASY" : ["surfaceNoise", "unicode", "colloquial", "shorthand"].includes(value) ? "MEDIUM" : ["typo", "indirect", "malformed"].includes(value) ? "HARD" : "ADVERSARIAL";
const domain = (entities: readonly SemanticEntityId[] = []): P1Domain => entities.includes("dna") && entities.includes("rna") ? "CROSS_DOMAIN" : entities.some((id) => ["rna", "mRNA", "tRNA", "rRNA", "cap", "polyATail", "riboseTwoPrimeHydroxyl"].includes(id)) ? "RNA" : "DNA";
const hash = (value: string) => [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);
const partition = (caseId: string): P1Partition => hash(caseId) % 5 === 0 ? "sealedHoldout" : "development";

const g1 = lexicalParaphraseCorpus
  // G2 retains the stronger explicit ambiguity/screen-direction versions.
  .filter(({ caseId }) => !["g1-amb-001", "g1-screen-001"].includes(caseId))
  .map((entry): P1AdversarialCase => ({ caseId: entry.caseId, rawPrompt: entry.rawPrompt, category: "lexical", subcategory: entry.difficulty, difficulty: difficulty(entry.difficulty), domain: domain(entry.expectedSemanticIntent.entities), expectedSemanticIntent: { ...entry.expectedSemanticIntent, acts: entry.expectedDecomposition?.acts }, expectedClarificationRequired: entry.expectedClarificationRequired, expectedMisconceptionOutcome: entry.expectedMisconceptionOutcome, expectedDecomposition: entry.expectedDecomposition && { acts: entry.expectedDecomposition.acts, sequenceRepresentableUnderF1V1: entry.expectedDecomposition.ordering !== "parallel" ? false : true }, source: entry.source, partition: partition(entry.caseId) }));
const g2 = ambiguityDirectionConflictCorpus.map((entry): P1AdversarialCase => {
  const primary = entry.expectedAlternatives[0]; const entities = primary?.entities ?? [];
  return { caseId: entry.caseId, rawPrompt: entry.rawPrompt, category: "ambiguity", subcategory: entry.clarificationRequired ? "blocking" : entry.expectedPolicyOutcome === "INVALID_SCIENTIFIC_REQUEST" ? "conflict" : "direction", difficulty: entry.expectedAlternatives.length > 2 || entry.expectedPolicyOutcome !== "ACCEPT" ? "ADVERSARIAL" : entry.clarificationRequired ? "HARD" : "MEDIUM", domain: domain(entities), expectedSemanticIntent: { entities, phenomenon: primary?.phenomenon, mechanism: primary?.mechanism, biochemicalDirection: entry.biochemicalDirection, screenDirection: entry.screenDirection }, expectedClarificationRequired: entry.clarificationRequired, expectedMisconceptionOutcome: entry.expectedPolicyOutcome, expectedDecomposition: undefined, source: entry.source, partition: partition(entry.caseId) };
});
const g3 = misconceptionInvalidScienceCorpus.map((entry): P1AdversarialCase => ({ caseId: entry.caseId, rawPrompt: entry.rawPrompt, category: "scienceError", subcategory: entry.category, difficulty: entry.expectedOutcome === "ACCEPT" ? "MEDIUM" : entry.expectedOutcome === "CLAIM_REQUIRES_GROUNDING" ? "HARD" : "ADVERSARIAL", domain: entry.rawPrompt.includes("RNA") && entry.rawPrompt.includes("DNA") ? "CROSS_DOMAIN" : entry.rawPrompt.includes("RNA") ? "RNA" : "DNA", expectedSemanticIntent: { claims: entry.preservedClaims.map(({ rawText }) => rawText) }, expectedClarificationRequired: false, expectedMisconceptionOutcome: entry.expectedOutcome, source: entry.source, partition: partition(entry.caseId) }));
const g4 = multiIntentLongPromptCorpus.map((entry): P1AdversarialCase => ({ caseId: entry.caseId, rawPrompt: entry.rawPrompt, category: "multiIntent", subcategory: entry.sequenceRepresentableUnderF1V1 ? "compound" : "explicitSequenceLimit", difficulty: entry.expectedConflictHandoff.length || !entry.sequenceRepresentableUnderF1V1 ? "ADVERSARIAL" : entry.rawPrompt.length > 100 ? "HARD" : "MEDIUM", domain: domain(entry.expectedSharedContext.entities), expectedSemanticIntent: { entities: entry.expectedSharedContext.entities, phenomenon: entry.expectedSharedContext.phenomena?.[0], mechanism: entry.expectedSharedContext.mechanisms?.[0], acts: entry.expectedActs }, expectedClarificationRequired: entry.clarificationRequired, expectedMisconceptionOutcome: entry.misconceptionOutcome, expectedDecomposition: { acts: entry.expectedActs, requestReferences: entry.expectedRequestReferences, conflictHandoff: entry.expectedConflictHandoff, sequenceRepresentableUnderF1V1: entry.sequenceRepresentableUnderF1V1 }, source: entry.source, partition: partition(entry.caseId) }));

export const p1AdversarialCorpus: readonly P1AdversarialCase[] = [...g1, ...g2, ...g3, ...g4];
export const p1DevelopmentCorpus = p1AdversarialCorpus.filter(({ partition: value }) => value === "development");
/** Sealed: never import into a P1-H tuning runner or report per-case outcomes before P1-K. */
export const p1SealedHoldoutCorpus = p1AdversarialCorpus.filter(({ partition: value }) => value === "sealedHoldout");

export const p1ScoringContract = {
  exactMatch: ["clarification.required", "misconception outcome", "acts", "scientific direction", "screen direction"],
  invariantMatch: ["required entity/phenomenon/mechanism/state membership", "claim preservation", "shared request references", "allowed semantic alternatives"],
  partialCredit: "Each scored dimension is binary. A case score is the fraction of applicable non-critical dimensions; critical error yields case score 0.",
  criticalErrors: ["DNA/RNA identity substitution", "screen direction converted to biochemical direction", "claim rewritten or lost", "required clarification omitted", "valid request marked invalid science", "explicit act lost", "invented unsupported meaning"],
} as const;

export function validateP1AdversarialCorpus(corpus: readonly P1AdversarialCase[] = p1AdversarialCorpus): string[] {
  const ids = new Set<string>();
  return corpus.flatMap((entry, index) => {
    const issues: string[] = [];
    if (!/^g[1-4]-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.caseId)) issues.push(`${index}: invalid stable ID`);
    if (ids.has(entry.caseId)) issues.push(`${index}: duplicate ID`); ids.add(entry.caseId);
    if (!entry.rawPrompt.trim() || !entry.category || !entry.subcategory) issues.push(`${index}: malformed metadata`);
    if (!entry.expectedSemanticIntent || typeof entry.expectedClarificationRequired !== "boolean") issues.push(`${index}: malformed expectation`);
    if (entry.expectedDecomposition && entry.expectedDecomposition.acts.length === 0) issues.push(`${index}: empty decomposition acts`);
    if (entry.expectedDecomposition?.sequenceRepresentableUnderF1V1 === false && !entry.rawPrompt.toLowerCase().includes("then") && !entry.rawPrompt.toLowerCase().includes("first")) issues.push(`${index}: sequence limit without explicit sequence`);
    return issues;
  });
}

/** Structural leakage guard: no raw-normalized wording template is shared across partitions. */
export function validateP1HoldoutSealing(corpus: readonly P1AdversarialCase[] = p1AdversarialCorpus): string[] {
  const skeleton = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(dna|rna|helicase|polymerase|strand|helix)\b/g, "ENTITY").replace(/\s+/g, " ");
  const dev = new Set(corpus.filter(({ partition: value }) => value === "development").map(({ rawPrompt }) => skeleton(rawPrompt)));
  return corpus.filter(({ partition: value, rawPrompt }) => value === "sealedHoldout" && dev.has(skeleton(rawPrompt))).map(({ caseId }) => `${caseId}: duplicate wording template across split`);
}
