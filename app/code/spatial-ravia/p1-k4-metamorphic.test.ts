import assert from "node:assert/strict";
import test from "node:test";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";

const signature = (prompt: string) => { const result = compilePromptIngress(prompt); return { acts: result.semanticIntent.acts, requests: result.semanticIntent.requests.map((request) => ({ subjects: request.subjects.map((subject) => subject.resolvedId).filter(Boolean).sort(), phenomenon: request.phenomenon, mechanism: request.mechanism, direction: request.direction })) }; };
const has = (prompt: string, value: string) => { const result = compilePromptIngress(prompt); return result.semanticIntent.requests.some((request) => request.phenomenon === value || request.mechanism === value); };

test("punctuation and harmless spacing preserve semantic invariants", () => {
  assert.deepEqual(signature("show A-T base pairing"), signature("Show   A–T base pairing!!!"));
});

test("synonymous surface forms preserve the same mechanism", () => {
  assert.equal(has("unzip the DNA", "strandSeparation"), true);
  assert.equal(has("pull the two DNA strands apart", "strandSeparation"), true);
});

test("screen-left language never creates biochemical direction", () => {
  const result = compilePromptIngress("show RNA breaking from the left side of the page");
  assert.equal(result.semanticIntent.requests.some((request) => request.direction?.biochemical), false);
  assert.equal(result.semanticIntent.requests.some((request) => request.direction?.screen === "screenLeft"), true);
});

test("changing DNA to RNA changes entity identity", () => {
  const dna = signature("show DNA base pairing"); const rna = signature("show RNA base pairing");
  assert.equal(dna.requests.some((request) => request.subjects.includes("dna")), true);
  assert.equal(rna.requests.some((request) => request.subjects.includes("rna")), true);
});

test("adding a second act preserves the first act", () => {
  const result = compilePromptIngress("show replication and explain helicase");
  assert.deepEqual(result.semanticIntent.acts, ["show", "explain"]);
});

test("removing mechanism-specific wording yields ambiguity rather than a silent mechanism", () => {
  const result = compilePromptIngress("what happened to this polymer: was it cut internally or nibbled from an end?");
  assert.equal(result.clarification.required, true);
});

test("claim wording remains distinct from a neutral scientific question", () => {
  const claim = compilePromptIngress("DNA has ribose, right?");
  const question = compilePromptIngress("why does DNA use a different sugar from RNA?");
  assert.equal(claim.semanticIntent.assertedClaims.length > 0, true);
  assert.equal(question.semanticIntent.assertedClaims.length, 0);
});
