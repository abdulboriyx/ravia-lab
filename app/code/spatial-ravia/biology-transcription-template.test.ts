import assert from "node:assert/strict";
import test from "node:test";
import { canUseTranscriptionRnapContext, deriveTranscriptionTemplatePlan, isValidTranscriptionTemplatePlan, sampleTranscriptionBubble } from "./biology-transcription-template.ts";

test("transcription bubble is locally bounded and paired DNA remains outside it", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: false, hasNascentRna: false });
  const samples = sampleTranscriptionBubble(plan);
  const opened = samples.filter((sample) => sample.opening > 0.01);
  const paired = samples.filter((sample) => sample.opening <= 0.01);
  assert.ok(opened.length > 0 && opened.length < samples.length);
  assert.ok(paired.length > 0);
  assert.ok(paired.every((sample) => sample.opening === 0));
  assert.equal(isValidTranscriptionTemplatePlan(plan), true);
});

test("RNAP and RNA are local transcription-only context, never broad framing", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: true, hasNascentRna: true });
  assert.equal(plan.mode, "dna-to-rna");
  assert.equal(plan.rnap.framing, "local-context");
  assert.equal(plan.nascentRna.exit, "bubble-local");
  assert.equal(plan.camera.excludesBroadComplex, true);
  assert.equal(plan.motion, "static-first");
  assert.equal(canUseTranscriptionRnapContext("transcription"), true);
  assert.equal(canUseTranscriptionRnapContext("replication"), false);
});
