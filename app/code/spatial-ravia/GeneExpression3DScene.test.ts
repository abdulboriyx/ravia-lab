import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("transcription production is backed by the R3F 3D mechanism scene", () => {
  const sceneSource = readFileSync(fileURLToPath(new URL("./GeneExpression3DScene.tsx", import.meta.url)), "utf8");
  const ownerSource = readFileSync(fileURLToPath(new URL("./CellularProductionOwnerView.tsx", import.meta.url)), "utf8");

  assert.match(sceneSource, /<Canvas\b/);
  assert.match(sceneSource, /<OrbitControls\b/);
  assert.match(sceneSource, /TranscriptionDnaTemplate/);
  assert.match(sceneSource, /TranscriptionRnapPresentation/);
  assert.match(sceneSource, /function NascentRNA3D/);
  assert.match(sceneSource, /bubbleOpen/);
  assert.match(sceneSource, /visibleRnaLength/);
  assert.doesNotMatch(sceneSource, /<svg\b/);
  assert.match(ownerSource, /<GeneExpression3DScene projection=\{projection\} \/>/);
  assert.doesNotMatch(ownerSource, /<svg className="transcriptionDiagram"/);
});
