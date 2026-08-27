import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { transcriptionVisualContract, transcriptionVisualLayer, validateTranscriptionVisualContract } from "./transcription-visual-contract.ts";

test("visual contract freezes 5FLM as a single elongation snapshot", () => {
  assert.equal(transcriptionVisualContract.source.structureId, "5FLM");
  assert.equal(transcriptionVisualContract.source.temporalCoverage, "SINGLE_ELONGATION_SNAPSHOT");
  assert.equal(transcriptionVisualContract.source.resolutionAngstrom, 3.4);
  assert.deepEqual(validateTranscriptionVisualContract(), []);
});

test("visual modes require explicit source, computed, and inferred layers", () => {
  assert.ok(transcriptionVisualContract.modes.OVERVIEW.requiredLayers.includes("COMPUTED_PROTEIN_ENVELOPE"));
  assert.ok(transcriptionVisualContract.modes.MECHANISM.requiredLayers.includes("INFERRED_MOTION"));
  assert.ok(transcriptionVisualContract.modes.ATOMIC_DETAIL.requiredLayers.includes("DEPOSITED_COORDINATES"));
  assert.equal(transcriptionVisualLayer("INFERRED_MOTION").status, "INFERRED");
  assert.equal(transcriptionVisualLayer("LOCAL_ATOMISTIC_DETAIL").status, "COMPUTED");
});

test("contract forbids presenting inferred motion as experimental trajectory", () => {
  assert.ok(transcriptionVisualLayer("INFERRED_MOTION").forbiddenClaims.some((claim) => claim.includes("experimental movie")));
  assert.ok(transcriptionVisualLayer("DEPOSITED_COORDINATES").forbiddenClaims.some((claim) => claim.includes("animated trajectory")));
  assert.ok(transcriptionVisualLayer("ANNOTATION_OVERLAY").forbiddenClaims.some((claim) => claim.includes("deposited molecular geometry")));
});

test("renderer consumes the frozen visual contract", () => {
  const scene = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  const actor = readFileSync(new URL("./BakedTranscriptionMolecularActor.tsx", import.meta.url), "utf8");
  assert.match(scene, /transcriptionVisualContract/);
  assert.match(scene, /data-visual-contract-version/);
  assert.match(actor, /transcriptionVisualLayer/);
  assert.match(actor, /motionFidelity/);
});
