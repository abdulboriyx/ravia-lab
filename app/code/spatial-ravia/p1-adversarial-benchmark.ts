/** P1-G5 dev-only diagnostic runner. It refuses sealed-holdout evaluation. */

import { applyClarificationPolicy } from "./semantic-clarification-policy.ts";
import { decomposeSemanticIntent } from "./semantic-intent-decomposition.ts";
import { extractSemanticIntent } from "./semantic-extractor.ts";
import { evaluateScientificClaimPolicy } from "./semantic-misconception-policy.ts";
import { normalizeRawPrompt } from "./prompt-normalization.ts";
import { p1DevelopmentCorpus, type P1AdversarialCase } from "./p1-adversarial-corpus.ts";

export type P1DevBenchmarkResult = { total: number; passed: number; criticalFailures: number; byCategory: Record<string, { total: number; passed: number }>; byDifficulty: Record<string, { total: number; passed: number }> };
const add = (table: Record<string, { total: number; passed: number }>, key: string, passed: boolean) => { const value = table[key] ?? { total: 0, passed: 0 }; value.total += 1; if (passed) value.passed += 1; table[key] = value; };
const claimEquivalent = (expected: string, actual: string) => {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9′]+/g, " ").trim();
  const left = normalize(expected); const right = normalize(actual);
  return left === right || left.includes(right) || right.includes(left);
};

function score(entry: P1AdversarialCase) {
  if (entry.partition !== "development") throw new Error("P1-G5 refuses sealed-holdout evaluation before P1-K.");
  const intent = applyClarificationPolicy(extractSemanticIntent(normalizeRawPrompt(entry.rawPrompt)));
  const science = evaluateScientificClaimPolicy(intent); const decomposition = decomposeSemanticIntent(intent);
  const expected = entry.expectedSemanticIntent;
  const readings = [intent.requests, ...intent.alternatives.map(({ requests }) => requests)];
  const semantic = readings.some((requests) => {
    const actualEntities = new Set(requests.flatMap((request) => request.subjects.map((subject) => subject.resolvedId).filter(Boolean)));
    return (!expected.entities || expected.entities.every((id) => actualEntities.has(id))) && (!expected.phenomenon || requests.some(({ phenomenon }) => phenomenon === expected.phenomenon)) && (!expected.mechanism || requests.some(({ mechanism }) => mechanism === expected.mechanism));
  });
  const acts = !expected.acts || expected.acts.every((act) => intent.acts.includes(act));
  const directions = (!expected.biochemicalDirection || intent.requests.some(({ direction }) => direction?.biochemical === expected.biochemicalDirection)) && (!expected.screenDirection || intent.requests.some(({ direction }) => direction?.screen === expected.screenDirection));
  const claims = !expected.claims || expected.claims.every((claim) => intent.assertedClaims.some(({ rawText }) => claimEquivalent(claim, rawText)));
  const policy = intent.clarification.required === entry.expectedClarificationRequired && science.outcome === entry.expectedMisconceptionOutcome;
  const decompositionOk = !entry.expectedDecomposition || entry.expectedDecomposition.acts.every((act) => decomposition.subIntents.some((part) => part.act === act));
  const critical = (!entry.expectedClarificationRequired || intent.clarification.required) && !(entry.expectedMisconceptionOutcome === "ACCEPT" && science.outcome === "INVALID_SCIENTIFIC_REQUEST") && acts && claims && directions;
  return { passed: semantic && acts && directions && claims && policy && decompositionOk && critical, critical: !critical };
}

export function runP1DevelopmentBenchmark(corpus: readonly P1AdversarialCase[] = p1DevelopmentCorpus): P1DevBenchmarkResult {
  const byCategory: P1DevBenchmarkResult["byCategory"] = {}; const byDifficulty: P1DevBenchmarkResult["byDifficulty"] = {}; let passed = 0; let criticalFailures = 0;
  for (const entry of corpus) { const result = score(entry); if (result.passed) passed += 1; if (result.critical) criticalFailures += 1; add(byCategory, entry.category, result.passed); add(byDifficulty, entry.difficulty, result.passed); }
  return { total: corpus.length, passed, criticalFailures, byCategory, byDifficulty };
}
