import assert from "node:assert/strict";
import test from "node:test";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";
import { p1K4BroadDevelopmentCorpus } from "./p1-k4-broad-dev-corpus.ts";

const unique = <T,>(values: T[]) => [...new Set(values)];
const requestValues = (result: ReturnType<typeof compilePromptIngress>) => [result.semanticIntent.requests, ...result.semanticIntent.alternatives.map(({ requests }) => requests)].flat();

test("P1-K4 broad development corpus is principle-driven and semantically robust", () => {
  assert.equal(p1K4BroadDevelopmentCorpus.length, 80);
  assert.equal(new Set(p1K4BroadDevelopmentCorpus.map(({ id }) => id)).size, 80);
  const results = p1K4BroadDevelopmentCorpus.map((entry) => {
    const result = compilePromptIngress(entry.prompt); const requests = requestValues(result); const entities = unique(requests.flatMap((request) => request.subjects.map((subject) => subject.resolvedId).filter(Boolean))); const phenomena = unique(requests.map((request) => request.phenomenon).filter(Boolean)); const mechanisms = unique(requests.map((request) => request.mechanism).filter(Boolean));
    const expected = entry.expected;
    const pass = (!expected.acts || expected.acts.every((act) => result.semanticIntent.acts.includes(act))) && (!expected.entities || expected.entities.every((entity) => entities.includes(entity))) && (!expected.phenomena || expected.phenomena.every((phenomenon) => phenomena.includes(phenomenon))) && (!expected.mechanisms || expected.mechanisms.every((mechanism) => mechanisms.includes(mechanism))) && (expected.clarification === undefined || result.clarification.required === expected.clarification);
    return { entry, pass, critical: !pass && Boolean(expected.acts?.some((act) => !result.semanticIntent.acts.includes(act))) };
  });
  const passed = results.filter(({ pass }) => pass).length; const critical = results.filter(({ critical }) => critical).length;
  assert.ok(passed >= 76, `P1-K4 broad development ${passed}/80`);
  assert.equal(critical, 0);
});
