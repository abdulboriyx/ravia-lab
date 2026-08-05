import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileSceneFromSession } from "./scene-compiler.ts";
import {
  createInitialSession,
  dispatchScientificSessionEvent
} from "./model.ts";
import { startDnaWorkspaceFromPrompt } from "./dna-workspace.ts";

test("DNA workspace starts DNA replication through the shared process engine", () => {
  const result = startDnaWorkspaceFromPrompt(createInitialSession(), "Show DNA replication");
  const scene = compileSceneFromSession(result.session);

  assert.equal(result.unsupportedReason, null);
  assert.equal(result.session.selectedProcessPackId, "dna-replication");
  assert.equal(result.session.activeModel?.process, "DNA replication");
  assert.ok(scene);
  assert.equal(scene.title, "DNA replication / replication fork");
  assert.ok(scene.nodes.some((node) => node.entityId === "helicase"));
});

test("DNA workspace preserves the last valid scene for unsupported prompts", () => {
  const loaded = startDnaWorkspaceFromPrompt(createInitialSession(), "Show DNA replication");
  const positioned = dispatchScientificSessionEvent(loaded.session, {
    type: "PLAYBACK_CHANGED",
    playback: { playing: false, timelinePosition: 0.64, speed: 2 }
  });
  const unsupported = startDnaWorkspaceFromPrompt(positioned, "Show protein folding");
  const scene = compileSceneFromSession(unsupported.session);

  assert.ok(unsupported.unsupportedReason);
  assert.equal(unsupported.session.activeModel?.process, "DNA replication");
  assert.equal(unsupported.session.playback.timelinePosition, 0.64);
  assert.equal(unsupported.session.playback.speed, 2);
  assert.equal(unsupported.session.playback.playing, false);
  assert.ok(scene);
  assert.equal(scene.title, "DNA replication / replication fork");
});

test("visible Spatial RAVIA shell keeps B-DNA as a secondary scale view", () => {
  const source = readFileSync(new URL("./prototype.tsx", import.meta.url), "utf8");

  assert.match(source, /Fork mechanism/);
  assert.match(source, /DNA structure/);
  assert.match(source, /DnaMolecularView/);
  assert.match(source, /compileSceneFromSession/);
  assert.match(source, /literal deposited PDB 1ZF5 coordinates; not a replication-fork structure/i);
});
