import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeRawPrompt } from "./prompt-normalization.ts";
import { extractSemanticIntent } from "./semantic-extractor.ts";
import { applyClarificationPolicy } from "./semantic-clarification-policy.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";

const extract = (raw: string) => extractSemanticIntent(normalizeRawPrompt(raw));
const withAlternatives = (alternatives: SemanticIntentV1["alternatives"]): SemanticIntentV1 => ({ ...extract("show RNA"), alternatives });

test("P1-D asks one minimum-distinction question for materially different helix readings", () => {
  const result = applyClarificationPolicy(extract("open the helix"));
  assert.equal(result.clarification.required, true);
  assert.equal(result.clarification.questionPlaceholder, "Does the helix refer to a DNA duplex or RNA secondary structure?");
  assert.equal(result.alternatives.length, 2);
});

test("P1-D distinguishes explicit RNA cleavage from cleavage-versus-degradation ambiguity", () => {
  assert.equal(applyClarificationPolicy(extract("break the RNA")).clarification.required, false);
  const result = applyClarificationPolicy(withAlternatives([
    { id: "cleavage", description: "RNA cleavage", requests: [{ subjects: [{ rawText: "RNA", resolvedId: "rna" }], mechanism: "rnaCleavage" }], confidence: 0.5 },
    { id: "degradation", description: "RNA exonuclease degradation", requests: [{ subjects: [{ rawText: "RNA", resolvedId: "rna" }], mechanism: "terminalExonucleaseAction" }], confidence: 0.5 },
  ]));
  assert.equal(result.clarification.required, true);
  assert.equal(result.clarification.questionPlaceholder, "Do you mean RNA cleavage or exonuclease degradation?");
});

test("P1-D asks entity and actor questions only when candidate meanings remain", () => {
  const strand = { ...extract("show this strand"), requests: [{ subjects: [{ rawText: "this strand", candidateIds: ["dna", "rna"] }] }], alternatives: [] } as SemanticIntentV1;
  assert.equal(applyClarificationPolicy(strand).clarification.questionPlaceholder, "Does this refer to DNA or RNA?");
  const actor = { ...extract("show this actor"), requests: [{ subjects: [{ rawText: "this actor", candidateIds: ["helicase", "rnaPolymerase"] }] }], alternatives: [] } as SemanticIntentV1;
  assert.equal(applyClarificationPolicy(actor).clarification.questionPlaceholder, "Do you mean helicase or RNA polymerase?");
});

test("P1-D does not clarify screen direction, confident paraphrases, multi-acts, or claims", () => {
  for (const raw of ["RNA breaking from left", "unzip the DNA", "show replication and explain helicase", "DNA has ribose right?"]) {
    assert.equal(applyClarificationPolicy(extract(raw)).clarification.required, false, raw);
  }
});

test("P1-D still resolves material ambiguity when a preserved claim coexists", () => {
  const ambiguousClaim = {
    ...extract("open the helix"),
    assertedClaims: [{ rawText: "DNA has ribose", status: "suspected" as const }],
  };
  const result = applyClarificationPolicy(ambiguousClaim);
  assert.equal(result.clarification.required, true);
  assert.equal(result.assertedClaims[0]?.rawText, "DNA has ribose");
});

test("P1-D clarifies scientifically consequential ambiguous direction and incompatible states", () => {
  const directional = { ...extract("open DNA"), requests: [{ subjects: [{ rawText: "DNA", resolvedId: "dna" }], mechanism: "strandOpening", direction: { meaning: "ambiguous" as const } }], alternatives: [] } as SemanticIntentV1;
  assert.equal(applyClarificationPolicy(directional).clarification.questionPlaceholder, "Should the biochemical direction be 5′→3′ or 3′→5′?");
  const states = applyClarificationPolicy(withAlternatives([
    { id: "open", description: "open DNA", requests: [{ subjects: [{ rawText: "DNA", resolvedId: "dna" }], states: ["open"] }], confidence: 0.5 },
    { id: "closed", description: "closed DNA", requests: [{ subjects: [{ rawText: "DNA", resolvedId: "dna" }], states: ["closed"] }], confidence: 0.5 },
  ]));
  assert.equal(states.clarification.questionPlaceholder, "Should the structure be open or closed?");
});

test("P1-D is deterministic and has no raw-prompt, capability, or production dependency", () => {
  const intent = extract("open the helix");
  assert.deepEqual(applyClarificationPolicy(intent), applyClarificationPolicy(intent));
  const source = readFileSync(new URL("./semantic-clarification-policy.ts", import.meta.url), "utf8");
  for (const forbidden of ["rawUtterance", "normalizedText", "subject.rawText", "capability-registry", "scene-spec", "renderer", "router", "biology-"]) assert.equal(source.includes(forbidden), false, forbidden);
});
