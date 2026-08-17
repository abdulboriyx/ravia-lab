import assert from "node:assert/strict";
import test from "node:test";
import { deriveRnaNascentTranscriptPresentation, isValidRnaNascentTranscriptPresentation } from "./RnaNascentTranscriptPresentation.ts";
import { resolveRnaPresentation } from "./RnaPresentationRouter.ts";

const route = (prompt: string) => resolveRnaPresentation(prompt)!.sourceSpec;

test("newly synthesized RNA is the primary, visibly emerging product", () => {
  const presentation = deriveRnaNascentTranscriptPresentation(route("show newly synthesized RNA"));
  assert.equal(presentation.hierarchy.primary, "nascent-rna");
  assert.equal(presentation.hierarchy.tertiary, "none");
  assert.equal(presentation.rna.emergingFrom, "transcription-exit");
  assert.ok(presentation.rna.samples.length >= 8);
  assert.ok(presentation.rna.samples.length <= 10);
  assert.equal(presentation.labels.length, 2);
  assert.ok(presentation.rna.samples.at(-1)!.backbone[1] > presentation.rna.samples[0].backbone[1]);
  assert.equal(isValidRnaNascentTranscriptPresentation(presentation), true);
});

test("RNA emerging from transcription retains local DNA context without a full mechanism", () => {
  const presentation = deriveRnaNascentTranscriptPresentation(route("show RNA emerging from transcription"));
  assert.equal(presentation.dna.localContextOnly, true);
  assert.equal(presentation.dna.geometrySource, "canonical-dna-visual-system");
  assert.equal(presentation.rnap.visible, false);
  assert.ok(presentation.dna.opacity < 0.6);
});

test("pre-mRNA is labeled as an unprocessed nascent transcript", () => {
  const presentation = deriveRnaNascentTranscriptPresentation(route("show pre-mRNA immediately after transcription"));
  assert.equal(presentation.mode, "pre-mRNA");
  assert.equal(presentation.labels[0].text, "pre-mRNA (unprocessed)");
  assert.equal(presentation.labels[0].priority, "primary");
});

test("DNA and nascent RNA expose distinct chemistry and RNA remains dominant", () => {
  const presentation = deriveRnaNascentTranscriptPresentation(route("show DNA and its nascent RNA transcript"));
  assert.equal(presentation.rna.chemistry.sugar, "ribose");
  assert.equal(presentation.rna.chemistry.hasTwoPrimeHydroxyl, true);
  assert.equal(presentation.dna.chemistry.sugar, "deoxyribose");
  assert.equal(presentation.dna.chemistry.hasTwoPrimeHydroxyl, false);
  assert.equal(presentation.hierarchy.secondary, "dna-template");
  assert.equal(presentation.labels.filter((label) => label.priority === "primary").length, 1);
  assert.equal(presentation.labels.length, 2);
});

test("RNAP is opt-in tertiary context when the prompt requires it", () => {
  const presentation = deriveRnaNascentTranscriptPresentation(route("show RNA emerging from transcription"), { includeRnap: true });
  assert.equal(presentation.rnap.visible, true);
  assert.equal(presentation.hierarchy.tertiary, "rnap");
  assert.ok(presentation.rnap.opacity < presentation.dna.opacity);
  assert.equal(presentation.labels.at(-1)?.priority, "tertiary");
});
