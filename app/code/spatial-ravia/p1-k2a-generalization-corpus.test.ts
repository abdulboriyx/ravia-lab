import assert from "node:assert/strict";
import test from "node:test";
import { p1K2aGeneralizationCorpus } from "./p1-k2a-generalization-corpus.ts";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";

test("P1-K2A generalized direction, ambiguity, entity, and mechanism cases", () => {
  assert.equal(p1K2aGeneralizationCorpus.length, 10);
  for (const entry of p1K2aGeneralizationCorpus) {
    const result = compilePromptIngress(entry.prompt);
    assert.equal(result.disposition === "CLARIFICATION_REQUIRED", "clarification" in entry && entry.clarification === true, entry.id);
    if ("direction" in entry) assert.equal(result.semanticIntent.requests.some((request) => request.direction?.biochemical === entry.direction), true, entry.id);
    if ("entities" in entry) for (const entity of entry.entities) assert.equal(result.semanticIntent.requests.some((request) => request.subjects.some((subject) => subject.resolvedId === entity)), true, `${entry.id}:${entity}`);
    if ("mechanisms" in entry) for (const mechanism of entry.mechanisms) assert.equal(result.semanticIntent.requests.some((request) => request.mechanism === mechanism), true, `${entry.id}:${mechanism}`);
    if ("phenomena" in entry) for (const phenomenon of entry.phenomena) assert.equal(result.semanticIntent.requests.some((request) => request.phenomenon === phenomenon), true, `${entry.id}:${phenomenon}`);
  }
});
