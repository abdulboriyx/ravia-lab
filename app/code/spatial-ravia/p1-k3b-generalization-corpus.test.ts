import assert from "node:assert/strict";
import test from "node:test";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";
import { p1K3bGeneralizationCorpus } from "./p1-k3b-generalization-corpus.ts";

const unique = <T,>(values: T[]) => [...new Set(values)];
const normalizeClaim = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9′]+/g, " ").trim();
const claimMatches = (expected: string, actual: string) => { const a = normalizeClaim(expected); const b = normalizeClaim(actual); return a === b || a.includes(b) || b.includes(a); };

test("P1-K3B corpus is fresh, structured, and semantically strong", () => {
  assert.equal(p1K3bGeneralizationCorpus.length, 32);
  assert.equal(new Set(p1K3bGeneralizationCorpus.map(({ id }) => id)).size, 32);
  const results = p1K3bGeneralizationCorpus.map((entry) => {
    const result = compilePromptIngress(entry.prompt); const expected = entry.expected;
    const requests = [result.semanticIntent.requests, ...result.semanticIntent.alternatives.map(({ requests: alternatives }) => alternatives)].flat();
    const entities = unique(requests.flatMap((request) => request.subjects.map((subject) => subject.resolvedId).filter(Boolean)));
    const phenomena = unique(requests.map((request) => request.phenomenon).filter(Boolean)); const mechanisms = unique(requests.map((request) => request.mechanism).filter(Boolean)); const states = unique(requests.flatMap((request) => request.states ?? []));
    const pass = expected.acts.every((act) => result.semanticIntent.acts.includes(act)) && (!expected.entities || expected.entities.every((entity) => entities.includes(entity))) && (!expected.phenomena || expected.phenomena.every((phenomenon) => phenomena.includes(phenomenon))) && (!expected.mechanisms || expected.mechanisms.every((mechanism) => mechanisms.includes(mechanism))) && (!expected.states || expected.states.every((state) => states.includes(state))) && (!expected.biochemicalDirection || result.semanticIntent.requests.some((request) => request.direction?.biochemical === expected.biochemicalDirection)) && (!expected.screenDirection || result.semanticIntent.requests.some((request) => request.direction?.screen === expected.screenDirection)) && (expected.clarification === undefined || result.clarification.required === expected.clarification) && (!expected.outcome || result.scientificValidity.outcome === expected.outcome) && (!expected.claims || expected.claims.every((claim) => result.semanticIntent.assertedClaims.some((actual) => claimMatches(claim.text, actual.rawText) && claim.status === actual.status))) && (!expected.preserve || (expected.preserve.acts.every((act) => result.semanticIntent.acts.includes(act)) && expected.preserve.mechanisms.every((mechanism) => mechanisms.includes(mechanism))));
    const critical = (expected.clarification === true && !result.clarification.required) || expected.acts.some((act) => !result.semanticIntent.acts.includes(act));
    return { entry, pass, critical };
  });
  const passed = results.filter(({ pass }) => pass).length; const critical = results.filter(({ critical: value }) => value).length; console.log(results.filter(({ pass }) => !pass).map(({ entry }) => { const r=compilePromptIngress(entry.prompt); return `${entry.id}:${r.semanticIntent.acts.join('+')}:${r.semanticIntent.requests.map(q=>q.subjects.map(s=>s.resolvedId).join(',')+'/'+q.mechanism).join('|')}:${r.clarification.required}:${r.scientificValidity.outcome}`; }).join('\n'));
  assert.ok(passed >= 29, `P1-K3B ${passed}/32`); assert.equal(critical, 0);
});
