import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileSceneFromSession } from "./scene-compiler.ts";
import {
  createInitialSession,
  dispatchScientificSessionEvent
} from "./model.ts";
import { startSpatialWorkspaceFromPrompt } from "./dna-workspace.ts";

test("visible Spatial RAVIA shell starts transcription through the shared process engine", () => {
  const result = startSpatialWorkspaceFromPrompt(createInitialSession(), "Show transcription.");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "eukaryotic-transcription");
  assert.equal(result.session.activeModel?.process, "Eukaryotic transcription");
  assert.ok(scene);
  assert.equal(scene.title, "Eukaryotic transcription / RNA polymerase II");
});

test("visible Spatial RAVIA shell starts action potential through the shared process engine", () => {
  const result = startSpatialWorkspaceFromPrompt(createInitialSession(), "Show an action potential.");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "action-potential");
  assert.equal(result.session.activeModel?.process, "Action potential");
  assert.ok(scene);
  assert.equal(scene.title, "Action potential / synchronized mixed representation");
});

test("visible Spatial RAVIA shell starts two-body orbit through the shared process engine", () => {
  const result = startSpatialWorkspaceFromPrompt(createInitialSession(), "Show Earth orbit.");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "two-body-orbit");
  assert.equal(result.session.activeModel?.process, "Two-body orbit");
  assert.equal(result.session.activeModel?.phenomenonSpec?.views[0]?.renderer, "r3f");
  assert.ok(scene);
  assert.equal(scene.title, "Two-body orbit / Sun-Earth benchmark");
});

test("replication prompts are unsupported and do not create a scene", () => {
  const result = startSpatialWorkspaceFromPrompt(createInitialSession(), "Show a replication fork.");

  assert.ok(result.unsupportedReason);
  assert.equal(result.session.selectedProcessPackId, null);
  assert.equal(result.session.activeModel, null);
  assert.equal(compileSceneFromSession(result.session), null);
});

test("visible Spatial RAVIA shell refuses unsupported scope without discarding state", () => {
  const loaded = startSpatialWorkspaceFromPrompt(createInitialSession(), "Show Earth orbit.");
  const positioned = dispatchScientificSessionEvent(loaded.session, {
    type: "PLAYBACK_CHANGED",
    playback: { playing: false, timelinePosition: 0.4, speed: 0.5 }
  });
  const unsupported = startSpatialWorkspaceFromPrompt(positioned, "Plan an N-body spacecraft mission.");
  const scene = compileSceneFromSession(unsupported.session);

  assert.ok(unsupported.unsupportedReason);
  assert.match(unsupported.unsupportedReason, /two-body benchmark/i);
  assert.equal(unsupported.session.activeModel?.process, "Two-body orbit");
  assert.equal(unsupported.session.playback.timelinePosition, 0.4);
  assert.equal(unsupported.session.playback.speed, 0.5);
  assert.ok(scene);
});

test("visible Spatial RAVIA shell no longer exposes DNA replication scale controls", () => {
  const source = readFileSync(new URL("./prototype.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /DnaMolecularView/);
  assert.doesNotMatch(source, /DNA structure/);
  assert.doesNotMatch(source, /replication-fork structure/i);
  assert.match(source, /Show transcription, an action potential, or Earth orbit/);
  assert.match(source, /OrbitR3FView/);
  assert.match(source, /Spatial RAVIA process workspace/);
});
