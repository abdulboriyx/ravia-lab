import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeRawPrompt, normalizedPromptSchemaVersion } from "./prompt-normalization.ts";

test("P1-B preserves raw text and records a stable lexical normalization trace", () => {
  const result = normalizeRawPrompt("  **Show**   `RNA`  5′→3′!!!  ");
  assert.equal(result.schemaVersion, normalizedPromptSchemaVersion);
  assert.equal(result.raw.rawText, "  **Show**   `RNA`  5′→3′!!!  ");
  assert.equal(result.normalizedText, "Show RNA 5-prime -> 3-prime!");
  assert.deepEqual(result.operations.map((operation) => operation.kind), ["formattingResidueRemoved", "whitespaceNormalized", "primeNotationNormalized", "arrowNormalized", "repeatedPunctuationCollapsed"]);
});

test("P1-B normalizes Unicode, quotes, dashes, duplicated separators, and harmless Markdown residue", () => {
  const result = normalizeRawPrompt("\uFEFF```bio\n“RNA—DNA”,, 3’ end\n```");
  assert.equal(result.normalizedText, '"RNA-DNA", 3-prime end');
  assert.deepEqual(result.operations.map((operation) => operation.kind), ["formattingResidueRemoved", "whitespaceNormalized", "primeNotationNormalized", "quoteNormalized", "dashNormalized", "repeatedPunctuationCollapsed"]);
});

test("P1-B intentionally preserves case and spelling because they are not universally representation-only", () => {
  assert.equal(normalizeRawPrompt("SHOW DNA and rna; unzippng").normalizedText, "SHOW DNA and rna; unzippng");
});

test("P1-B is structurally idempotent for text, raw trace, and operations", () => {
  const first = normalizeRawPrompt("  RNA  5′ → 3′??  ");
  assert.deepEqual(normalizeRawPrompt(first), first);
  assert.deepEqual(normalizeRawPrompt(first.normalizedText), normalizeRawPrompt(first.normalizedText));
});

test("P1-B preserves hostile semantic distinctions without classification or correction", () => {
  const cases: ReadonlyArray<[string, string]> = [
    ["DNA opens left", "DNA opens left"],
    ["DNA opens 5′ to 3′", "DNA opens 5-prime to 3-prime"],
    ["RNA breaking from left", "RNA breaking from left"],
    ["is this DNA or RNA?", "is this DNA or RNA?"],
    ["A pairs with G", "A pairs with G"],
    ["show replication and explain helicase", "show replication and explain helicase"],
    ["cut vs degrade", "cut vs degrade"],
    ["upstream vs left", "upstream vs left"],
  ];
  for (const [raw, expected] of cases) {
    const result = normalizeRawPrompt(raw);
    assert.equal(result.normalizedText, expected, raw);
    assert.equal(result.normalizedText.includes("strand separation"), false, raw);
    assert.equal(result.normalizedText.includes("cleavage"), false, raw);
  }
});

test("P1-B does not import or consult semantic, capability, or production authorities", () => {
  const source = readFileSync(new URL("./prompt-normalization.ts", import.meta.url), "utf8");
  for (const forbidden of ["semantic-intent", "capability-registry", "scene-spec", "router", "renderer", "grounding"]) assert.equal(source.includes(forbidden), false, forbidden);
});
