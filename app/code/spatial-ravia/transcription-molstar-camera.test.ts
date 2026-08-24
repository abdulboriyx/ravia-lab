import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("transcription uses one R3F molecular viewport and camera owner", () => {
  const adapter = readFileSync(new URL("./MolstarStructurePresentationAdapter.tsx", import.meta.url), "utf8");
  const scene = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /data-molecular-viewport-owner="r3f"/);
  assert.match(scene, /data-camera-owner="r3f"/);
  assert.match(scene, /<OrbitControls/);
  assert.doesNotMatch(scene, /MolstarStructurePresentationAdapter/);
  assert.match(scene, /angstromToScene/);
  assert.match(adapter, /kind === "translation"/);
});

test("transcription does not mount a second structural camera or viewport", () => {
  const scene = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.equal((scene.match(/<Canvas\b/g) ?? []).length, 1);
  assert.doesNotMatch(scene, /geneExpressionMolecularLayer/);
});
