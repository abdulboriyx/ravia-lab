import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("transcription production is backed by deposited geometry with derived kinematic motion", () => {
  const sceneSource = readFileSync(fileURLToPath(new URL("./GeneExpression3DScene.tsx", import.meta.url)), "utf8");
  const ownerSource = readFileSync(fileURLToPath(new URL("./CellularProductionOwnerView.tsx", import.meta.url)), "utf8");

  assert.match(sceneSource, /BakedTranscriptionMolecularActor/);
  assert.match(sceneSource, /resolveEukaryoticPolIIStructuralActorPackage/);
  assert.match(sceneSource, /data-nucleic-representation="MOLSTAR_POLYMER_TRACE_PLUS_LOCAL_ATOMISTIC"/);
  assert.match(sceneSource, /data-molecular-viewport-owner="r3f-structure-derived"/);
  assert.match(sceneSource, /data-camera-owner="r3f-structure-derived"/);
  assert.match(sceneSource, /data-camera-fit=\{roi \? "STRUCTURE_DERIVED_ACTIVE_SITE"/);
  assert.match(sceneSource, /data-motion-source="5FLM_STRUCTURE_DERIVED_KINEMATIC_TRANSLOCATION"/);
  assert.match(sceneSource, /data-hybrid-window="5FLM:O:7-20\+N:7-20"/);
  assert.match(sceneSource, /data-active-center="5FLM:R:active-mg"/);
  assert.doesNotMatch(sceneSource, /<TranscriptionDnaTemplate/);
  assert.match(sceneSource, /<Canvas\b/);
  assert.doesNotMatch(sceneSource, /<svg\b/);
  assert.doesNotMatch(sceneSource, /function PolIIComplex3D/);
  assert.doesNotMatch(sceneSource, /<TranscriptionRnapPresentation/);
  assert.match(sceneSource, /TRANSCRIPTION_PRESENTATION_STATE_INVALID/);
  assert.match(ownerSource, /<GeneExpression3DScene projection=\{projection\} presentation=\{presentation\} theme=\{theme\} selectedTarget=/);
  assert.match(ownerSource, /reduceExpertTranscriptionControl/);
  assert.match(ownerSource, /STEP_FORWARD_EVENT/);
  assert.match(ownerSource, /SELECT_TARGET/);
  assert.match(ownerSource, /SET_GEOMETRY_MODE/);
  assert.match(ownerSource, /RESET_SCENE/);
  assert.doesNotMatch(ownerSource, /TranscriptionMechanismDiagram/);
  assert.doesNotMatch(ownerSource, /<svg className="transcriptionDiagram"/);
});
