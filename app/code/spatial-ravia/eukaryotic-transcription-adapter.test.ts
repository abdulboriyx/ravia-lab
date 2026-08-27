import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression.ts";
import { adaptGeneExpressionProgramToEukaryoticTranscription } from "./eukaryotic-transcription-adapter.ts";

test("the D-C adapter preserves eukaryotic identity but exposes legacy incompatibilities", () => {
  const result = adaptGeneExpressionProgramToEukaryoticTranscription(createCanonicalEukaryoticGeneExpressionProgram());
  assert.equal(result.status, "INCOMPATIBLE");
  if (result.status === "INCOMPATIBLE") {
    assert.equal(result.code, "D_C_TRANSCRIPTION_ADAPTER_INCOMPATIBLE");
    assert.ok(result.reasons.some((reason) => reason.includes("TRANSCRIPTION_BUBBLE_OPENED")));
    assert.ok(result.reasons.some((reason) => reason.includes("nucleotide identity")));
  }
});

test("the adapter never fabricates a transition when grounding is absent", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const result = adaptGeneExpressionProgramToEukaryoticTranscription({ ...program, transcriptionGrounding: undefined });
  assert.equal(result.status, "INCOMPATIBLE");
  if (result.status === "INCOMPATIBLE") assert.ok(result.reasons.includes("transcriptionGrounding is required"));
});

