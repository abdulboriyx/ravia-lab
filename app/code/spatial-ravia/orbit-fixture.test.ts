import assert from "node:assert/strict";
import test from "node:test";
import {
  jplHorizonsEarthSunVectors,
  maxOrbitBenchmarkPositionErrorAu,
  orbitBenchmarkMetadata,
  orbitBenchmarkPoints,
  orbitPositionAtProgress,
  twoBodyOrbitVectors
} from "./orbit-fixture.ts";
import { orbitPack } from "./orbit-process.ts";
import {
  createInitialSession,
  dispatchScientificSessionEvent,
  startSessionFromPrompt,
  validatePhenomenonPack
} from "./model.ts";
import { processPacks } from "./process-registry.ts";
import { compileSceneFromSession } from "./scene-compiler.ts";

test("two-body orbit fixture declares physical units and ordered benchmark epochs", () => {
  assert.equal(orbitBenchmarkMetadata.units.position, "AU");
  assert.equal(orbitBenchmarkMetadata.units.velocity, "AU/day");
  assert.equal(orbitBenchmarkMetadata.units.gravitationalParameter, "AU^3/day^2");
  assert.equal(orbitBenchmarkMetadata.timeScale, "TDB");
  assert.equal(jplHorizonsEarthSunVectors.length, twoBodyOrbitVectors.length);
  assert.ok(jplHorizonsEarthSunVectors.length >= 6);

  for (let index = 1; index < jplHorizonsEarthSunVectors.length; index += 1) {
    assert.ok(jplHorizonsEarthSunVectors[index].day > jplHorizonsEarthSunVectors[index - 1].day);
    assert.equal(jplHorizonsEarthSunVectors[index].day, twoBodyOrbitVectors[index].day);
  }
});

test("two-body orbit fixture stays within declared JPL position tolerance", () => {
  assert.ok(orbitBenchmarkPoints.every((point) => point.positionErrorAu <= orbitBenchmarkMetadata.maximumPositionErrorAu));
  assert.ok(maxOrbitBenchmarkPositionErrorAu() > 0);
  assert.ok(maxOrbitBenchmarkPositionErrorAu() <= orbitBenchmarkMetadata.maximumPositionErrorAu);
});

test("two-body orbit pack validates through the PhenomenonPack contract", () => {
  const validation = validatePhenomenonPack(orbitPack);

  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(orbitPack.phenomenonSpec?.modelClass, "simulation");
  assert.equal(orbitPack.phenomenonSpec?.timeline.basis, "physical");
  assert.equal(orbitPack.phenomenonSpec?.views[0]?.renderer, "r3f");
  assert.equal(orbitPack.phenomenonSpec?.views[0]?.evidenceMode, "derived");
});

test("orbit prompt resolves and compiled scene exposes selectable core components", () => {
  const session = startSessionFromPrompt(createInitialSession(), "Show a two-body orbit.", processPacks);
  const scene = compileSceneFromSession(session);

  assert.equal(session.selectedProcessPackId, "two-body-orbit");
  assert.ok(scene);
  assert.ok(scene.nodes.some((node) => node.entityId === "earth" && node.selectable));
  assert.ok(scene.nodes.some((node) => node.entityId === "sun" && node.selectable));
  assert.ok(scene.nodes.some((node) => node.entityId === "gravity-vector" && node.selectable));
});

test("orbit selection, hide, isolate, labels, and directionality alter compiled scene", () => {
  const session = startSessionFromPrompt(createInitialSession(), "Show Earth orbit.", processPacks);
  const selected = dispatchScientificSessionEvent(session, {
    type: "ENTITY_SELECTED",
    entityIds: ["earth"]
  });
  const hidden = dispatchScientificSessionEvent(selected, {
    type: "ENTITY_HIDDEN",
    entityIds: ["jpl-benchmark"]
  });
  const isolated = dispatchScientificSessionEvent(hidden, {
    type: "ENTITY_ISOLATED",
    entityId: "gravity-vector",
    entityIds: ["gravity-vector", "earth", "sun"]
  });
  const toggled = dispatchScientificSessionEvent(isolated, {
    type: "PLAYBACK_CHANGED",
    playback: { showLabels: false, showDirectionality: false, timelinePosition: 0.8 }
  });
  const scene = compileSceneFromSession(toggled);

  assert.ok(scene);
  assert.equal(scene.timeline.activeStageId, "epoch-5");
  assert.ok(scene.nodes.find((node) => node.entityId === "earth")?.selected);
  assert.equal(scene.nodes.find((node) => node.entityId === "jpl-benchmark")?.visible, false);
  assert.equal(scene.labels.find((label) => label.text === "Acceleration toward Sun")?.visible, false);
  assert.ok(scene.labels.every((label) => !label.visible || label.text !== "Earth"));
});

test("orbit position interpolation follows playback progress", () => {
  const start = orbitPositionAtProgress(0);
  const mid = orbitPositionAtProgress(0.5);
  const end = orbitPositionAtProgress(1);

  assert.equal(start.day, 0);
  assert.equal(end.day, 5);
  assert.equal(mid.day, 2.5);
  assert.notEqual(start.xAu, mid.xAu);
  assert.notEqual(mid.xAu, end.xAu);
});
