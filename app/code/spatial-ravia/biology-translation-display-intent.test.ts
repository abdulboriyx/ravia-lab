import assert from "node:assert/strict";
import test from "node:test";
import { translationScene } from "./biology-scene-builders.ts";
import { deriveTranslationDisplayIntent } from "./biology-translation-display-intent.ts";

test("translation display intent follows existing focused scene actions", () => {
  const context = { organism: "unspecified" as const };
  assert.equal(deriveTranslationDisplayIntent(translationScene("peptide-bond", context)), "transfer");
  assert.equal(deriveTranslationDisplayIntent(translationScene("codon-anticodon", context)), "recognition");
  assert.equal(deriveTranslationDisplayIntent(translationScene("translocation", context)), "translocation");
  assert.equal(deriveTranslationDisplayIntent(translationScene("charged-trna", context)), "entry");
  assert.equal(deriveTranslationDisplayIntent(translationScene("termination", context)), "termination");
  assert.equal(deriveTranslationDisplayIntent(translationScene("elongation", context)), "overview");
});
