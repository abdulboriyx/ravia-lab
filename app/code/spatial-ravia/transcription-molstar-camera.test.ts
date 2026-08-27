import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("transcription uses one structure-derived molecular viewport and camera owner", () => {
  const adapter = readFileSync(new URL("./MolstarStructurePresentationAdapter.tsx", import.meta.url), "utf8");
  const scene = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /data-molecular-viewport-owner="r3f-structure-derived"/);
  assert.match(scene, /data-camera-owner="r3f-structure-derived"/);
  assert.match(scene, /<BakedTranscriptionMolecularActor/);
  assert.match(scene, /data-camera-fit=\{roi \? "STRUCTURE_DERIVED_ACTIVE_SITE"/);
  assert.match(adapter, /kind === "translation"/);
});

test("transcription does not mount a second structural viewport", () => {
  const scene = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.equal((scene.match(/<Canvas\b/g) ?? []).length, 1);
  assert.match(scene, /<BakedTranscriptionMolecularActor/);
  assert.doesNotMatch(scene, /geneExpressionMolecularLayer/);
});
