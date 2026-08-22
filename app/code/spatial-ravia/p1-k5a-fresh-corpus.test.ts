import assert from "node:assert/strict";
import test from "node:test";
import { p1K5AFreshDevelopmentCorpus, p1K5AFreshDevelopmentMetadata } from "./p1-k5a-fresh-corpus.ts";

test("K5A fresh corpus is new, bounded, and balanced", () => {
  assert.equal(p1K5AFreshDevelopmentMetadata.count, 120);
  assert.equal(new Set(p1K5AFreshDevelopmentCorpus.map((entry) => entry.id)).size, 120);
  assert.equal(new Set(p1K5AFreshDevelopmentCorpus.map((entry) => entry.category)).size, 12);
  for (const category of new Set(p1K5AFreshDevelopmentCorpus.map((entry) => entry.category))) assert.equal(p1K5AFreshDevelopmentCorpus.filter((entry) => entry.category === category).length, 10);
  assert.ok(p1K5AFreshDevelopmentCorpus.every((entry) => entry.prompt.length > 20 && entry.expected.acts?.length));
  assert.equal(p1K5AFreshDevelopmentMetadata.holdout, false);
});
