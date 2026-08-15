import assert from "node:assert/strict";
import test from "node:test";
import { canUseTranscriptionRnapContext, deriveTranscriptionTemplatePlan, isValidTranscriptionTemplatePlan, partitionTranscriptionDuplex, sampleTranscriptionBubble, sampleTranscriptionDuplexGeometry, transcriptionDnaTemplateTransform, transcriptionDuplexCalibration } from "./biology-transcription-template.ts";
import { dnaVisualSystem } from "./DnaVisualSystem.ts";

test("transcription bubble is locally bounded and paired DNA remains outside it", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: false, hasNascentRna: false });
  const samples = sampleTranscriptionBubble(plan);
  const opened = samples.filter((sample) => sample.opening > 0.01);
  const paired = samples.filter((sample) => sample.opening <= 0.01);
  assert.ok(opened.length > 0 && opened.length < samples.length);
  assert.ok(paired.length > 0);
  assert.ok(paired.every((sample) => sample.opening === 0));
  assert.equal(isValidTranscriptionTemplatePlan(plan), true);
  assert.equal(plan.dna.openBasePairs, transcriptionDuplexCalibration.openBasePairs);
  assert.ok(plan.dna.basePairCount > plan.dna.openBasePairs * 2);
  const coreOpening = samples.filter((sample) => sample.opening > 0.5);
  assert.ok(coreOpening.length >= plan.dna.openBasePairs - 2);
  assert.ok(coreOpening.length <= plan.dna.openBasePairs + 2);
});

test("RNAP and RNA are local transcription-only context, never broad framing", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: true, hasNascentRna: true });
  assert.equal(plan.mode, "dna-to-rna");
  assert.equal(plan.rnap.framing, "local-context");
  assert.equal(plan.nascentRna.exit, "bubble-local");
  assert.equal(plan.rnap.opacity, 0.92);
  assert.equal(plan.rnap.scale, 2.25);
  assert.equal(plan.presentation.bubbleEmphasis, "secondary");
  assert.equal(plan.camera.excludesBroadComplex, true);
  assert.equal(plan.motion, "static-first");
  assert.equal(canUseTranscriptionRnapContext("transcription"), true);
  assert.equal(canUseTranscriptionRnapContext("replication"), false);
});

test("bubble-only transcription prioritizes the local opening while retaining quiet RNAP context", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: false, hasNascentRna: false });
  assert.equal(plan.mode, "bubble-only");
  assert.equal(plan.rnap.visible, true);
  assert.equal(plan.rnap.opacity, 0.34);
  assert.equal(plan.rnap.scale, 1.55);
  assert.equal(plan.presentation.bubbleEmphasis, "primary");
  assert.ok(plan.presentation.pairedFlankOpacity < 1);
  assert.ok(plan.camera.fov > 28);
});

test("canonical transcription DNA crosses the RNAP channel on one dominant scene axis", () => {
  assert.equal(transcriptionDnaTemplateTransform.dominantAxis, "x");
  assert.deepEqual(transcriptionDnaTemplateTransform.position, [0, 0, 0]);
  assert.equal(transcriptionDnaTemplateTransform.rotation[1], Math.PI / 2);
});

test("transcription rendering partitions one canonical duplex into paired flanks and one bounded opening", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: true, hasNascentRna: false });
  const { samples, upstream, bubble, downstream } = partitionTranscriptionDuplex(plan);

  assert.ok(upstream.length > 1);
  assert.ok(bubble.length > 1);
  assert.ok(downstream.length > 1);
  assert.equal(upstream[0].index, samples[0].index);
  assert.equal(downstream.at(-1)?.index, samples.at(-1)?.index);
  assert.ok(upstream.every((sample) => sample.index <= bubble[0].index + 1));
  assert.ok(downstream.every((sample) => sample.index >= bubble.at(-1)!.index - 1));
  assert.ok(bubble.some((sample) => sample.opening > 0.5));
  assert.ok(upstream.some((sample) => sample.opening === 0));
  assert.ok(downstream.some((sample) => sample.opening === 0));
});

test("shared transcription duplex preserves canonical pairing outside its single local bubble", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: true, hasNascentRna: false });
  const samples = sampleTranscriptionDuplexGeometry(plan);
  const canonicalSeparation = dnaVisualSystem.geometry.helixRadiusAngstrom * 2;
  const outside = samples.filter((sample) => sample.opening === 0);
  const inside = samples.filter((sample) => sample.opening > 0);

  assert.ok(outside.length > 0);
  assert.ok(inside.length > 0);
  for (const sample of outside) {
    assert.ok(Math.abs(distance(sample.strandA, sample.strandB) - canonicalSeparation) < 1e-8);
  }
  assert.ok(inside.some((sample) => distance(sample.strandA, sample.strandB) > canonicalSeparation));
  assert.equal(samples.filter((sample) => sample.opening === 0).length, outside.length);
  assert.ok(samples.every((sample) => sample.strandA.every(Number.isFinite) && sample.strandB.every(Number.isFinite)));
  assert.ok(samples.slice(1).every((sample, index) => sample.strandA[2] > samples[index].strandA[2]));
});

test("only the bounded bubble omits base-pair rungs", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: false, hasNascentRna: false });
  const samples = sampleTranscriptionDuplexGeometry(plan);
  const rungEligible = samples.filter((sample) => sample.opening === 0);
  const omittedInside = samples.filter((sample) => sample.opening > 0);

  assert.ok(rungEligible.length > 0);
  assert.ok(omittedInside.length > 0);
  assert.ok(omittedInside.some((sample) => sample.opening === 1));
  assert.ok(rungEligible.every((sample) => sample.index < omittedInside[0].index || sample.index > omittedInside.at(-1)!.index));
});

test("transcription calibration keeps at least two paired canonical turns on both bubble flanks", () => {
  const plan = deriveTranscriptionTemplatePlan({ hasRnap: true, hasNascentRna: false });
  const samples = sampleTranscriptionDuplexGeometry(plan);
  const firstOpen = samples.findIndex((sample) => sample.opening > 0);
  const lastOpen = samples.findLastIndex((sample) => sample.opening > 0);
  const pairedUpstream = samples.slice(0, firstOpen).filter((sample) => sample.opening === 0).length;
  const pairedDownstream = samples.slice(lastOpen + 1).filter((sample) => sample.opening === 0).length;
  const minimumPairedBasePairs = dnaVisualSystem.geometry.basePairsPerTurn * transcriptionDuplexCalibration.minimumPairedFlankTurns;

  assert.ok(pairedUpstream >= minimumPairedBasePairs);
  assert.ok(pairedDownstream >= minimumPairedBasePairs);
  assert.ok(transcriptionDuplexCalibration.maximumOpenDisplacementAngstrom < dnaVisualSystem.geometry.localOpenDisplacementAngstrom);
});

function distance(a: readonly number[], b: readonly number[]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
