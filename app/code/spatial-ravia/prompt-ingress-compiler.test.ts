import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";
import { validateSemanticIntent } from "./semantic-intent.ts";

test("P1-H composes one deterministic B→C→D→E→F ingress result", () => {
  const result = compilePromptIngress("show replication and explain helicase");
  assert.equal(validateSemanticIntent(result.semanticIntent).valid, true);
  assert.equal(result.disposition, "READY");
  assert.deepEqual(result.decomposition.subIntents.map(({ act }) => act), ["show", "explain"]);
  assert.deepEqual(result, compilePromptIngress("show replication and explain helicase"));
});

test("P1-H gives clarification precedence without losing claims or alternatives", () => {
  const result = compilePromptIngress("open the helix");
  assert.equal(result.disposition, "CLARIFICATION_REQUIRED");
  assert.equal(result.clarification.required, true);
  assert.equal(result.semanticIntent.alternatives.length, 2);
  const claim = compilePromptIngress("DNA has ribose right?");
  assert.equal(claim.disposition, "GROUNDING_REQUIRED");
  assert.equal(claim.semanticIntent.assertedClaims[0]?.rawText, "DNA has ribose");
});

test("P1-H contains no downstream raw-text parsing, production ownership, or scene logic", () => {
  const source = readFileSync(new URL("./prompt-ingress-compiler.ts", import.meta.url), "utf8");
  for (const forbidden of [".includes(", ".match(", "renderer", "router", "scene-spec", "capability-registry"]) assert.equal(source.includes(forbidden), false, forbidden);
});
