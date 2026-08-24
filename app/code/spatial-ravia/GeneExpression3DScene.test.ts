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
  assert.match(sceneSource, /function PolymeraseHero3D/);
  assert.match(sceneSource, /function BubbleEnvelope3D/);
  assert.match(sceneSource, /<icosahedronGeometry/);
  assert.match(sceneSource, /<torusGeometry/);
  assert.match(sceneSource, /camera=\{\{ position: \[3\.6, 2\.25, 4\.7\]/);
  assert.match(sceneSource, /function NascentRNA3D/);
  assert.match(sceneSource, /bubbleOpen/);
  assert.match(sceneSource, /nascentRnaVisualLength/);
  assert.match(sceneSource, /TRANSCRIPTION_PRESENTATION_STATE_INVALID/);
  assert.doesNotMatch(sceneSource, /gl=\{\{ alpha: true \}\}/);
  assert.doesNotMatch(sceneSource, /<svg\b/);
  assert.match(ownerSource, /<GeneExpression3DScene projection=\{projection\} presentation=\{presentation\} theme=\{theme\} \/>/);
  assert.doesNotMatch(ownerSource, /<svg className="transcriptionDiagram"/);
});
