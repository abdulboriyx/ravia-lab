import test from "node:test";
import assert from "node:assert/strict";
import {
  assertFiniteCameraPreset,
  spatialRaviaMaterialDefaults,
  spatialRaviaScale,
} from "./SpatialRaviaVisualSystem.ts";

test("Spatial Ravia visual scale values are positive", () => {
  for (const value of Object.values(spatialRaviaScale)) {
    assert.ok(Number.isFinite(value));
    assert.ok(value > 0);
  }
});

test("Spatial Ravia material defaults are physically valid", () => {
  for (const material of Object.values(spatialRaviaMaterialDefaults)) {
    assert.ok(material.roughness >= 0 && material.roughness <= 1);
    assert.ok(material.metalness >= 0 && material.metalness <= 1);
  }
});

test("Spatial Ravia camera presets are finite", () => {
  for (const name of ["transcription", "replication", "translation", "membrane", "default"] as const) {
    assert.equal(assertFiniteCameraPreset(name), true);
  }
});
