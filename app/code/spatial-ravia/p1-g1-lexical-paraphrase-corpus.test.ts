import assert from "node:assert/strict";
import test from "node:test";
import { lexicalParaphraseCorpus, validateLexicalParaphraseCorpus } from "./p1-g1-lexical-paraphrase-corpus.ts";

test("P1-G1 lexical corpus is structurally valid, diverse, and corpus-only", () => {
  assert.deepEqual(validateLexicalParaphraseCorpus(), []);
  assert.ok(lexicalParaphraseCorpus.length >= 25);
  assert.ok(new Set(lexicalParaphraseCorpus.map(({ difficulty }) => difficulty)).size >= 6);
  assert.ok(new Set(lexicalParaphraseCorpus.map(({ source }) => source)).size === 2);
  assert.ok(lexicalParaphraseCorpus.some(({ expectedSemanticIntent }) => expectedSemanticIntent.entities?.includes("dna")));
  assert.ok(lexicalParaphraseCorpus.some(({ expectedSemanticIntent }) => expectedSemanticIntent.entities?.includes("rna")));
});
