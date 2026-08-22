import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { decomposeSemanticIntent } from "./semantic-intent-decomposition.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";

const entity = (rawText: string, resolvedId: string) => ({ rawText, resolvedId }) as SemanticIntentV1["requests"][number]["subjects"][number];
const multi = (acts: SemanticIntentV1["acts"], requests: SemanticIntentV1["requests"]): SemanticIntentV1 => ({
  ...semanticIntentFixtures.rnaHairpin, acts, requests, assertedClaims: [], alternatives: [], clarification: { required: false },
});

test("P1-F projects parallel acts over one shared context without duplicating its request", () => {
  const projection = decomposeSemanticIntent(semanticIntentFixtures.multiIntent);
  assert.deepEqual(projection.subIntents.map(({ act }) => act), ["show", "explain"]);
  assert.equal(projection.sharedContext.requests, semanticIntentFixtures.multiIntent.requests);
  assert.deepEqual(projection.subIntents.map(({ requestIndexes }) => requestIndexes), [[0], [0]]);
  assert.deepEqual(projection.ordering, { kind: "parallel" });
});

test("P1-F preserves comparison plus mechanism, repeated actors, and multiple actors by reference", () => {
  const intent = multi(["compare", "animate"], [{
    subjects: [entity("RNA", "rna"), entity("DNA", "dna"), entity("DNA strand", "strand")],
    phenomenon: "strandSeparation", mechanism: "strandOpening", states: ["open"], outputPreferences: ["comparison", "animated"],
  }]);
  const projection = decomposeSemanticIntent(intent);
  assert.deepEqual(projection.subIntents.map(({ act }) => act), ["compare", "animate"]);
  assert.equal(projection.sharedContext.requests[0].subjects.length, 3);
  assert.deepEqual(projection.subIntents[0].requestIndexes, projection.subIntents[1].requestIndexes);
});

test("P1-F does not manufacture an order from act or request array order", () => {
  const intent = multi(["show", "explain"], [
    { subjects: [entity("RNA hairpin", "rna")], phenomenon: "rnaSecondaryStructure" },
    { subjects: [entity("RNA hairpin", "rna")], mechanism: "rnaSecondaryFolding" },
  ]);
  const projection = decomposeSemanticIntent(intent);
  assert.deepEqual(projection.ordering, { kind: "parallel" });
  assert.deepEqual(projection.subIntents.map(({ requestIndexes }) => requestIndexes), [[0, 1], [0, 1]]);
});

test("P1-F flags policy handoffs and retains every sub-intent", () => {
  const requiresClarification = { ...semanticIntentFixtures.multiIntent, clarification: { required: true as const, reason: "multiplePlausibleMeanings" as const, questionPlaceholder: "Which mechanism?" } };
  const projection = decomposeSemanticIntent(requiresClarification);
  assert.equal(projection.subIntents.length, 2);
  assert.equal(projection.conflicts[0]?.handoff, "P1-D");
  const claimProjection = decomposeSemanticIntent({ ...semanticIntentFixtures.misconception, clarification: { required: false } });
  assert.equal(claimProjection.conflicts[0]?.handoff, "P1-E");
});

test("P1-F is deterministic and has no parser, renderer, scene, or scientific-planning dependency", () => {
  const intent = semanticIntentFixtures.multiIntent;
  assert.deepEqual(decomposeSemanticIntent(intent), decomposeSemanticIntent(intent));
  const source = readFileSync(new URL("./semantic-intent-decomposition.ts", import.meta.url), "utf8");
  for (const forbidden of ["normalizeRawPrompt", "extractSemanticIntent", "rawUtterance", "renderer", "scene-spec", "capability-registry", "grounding"]) assert.equal(source.includes(forbidden), false, forbidden);
});
