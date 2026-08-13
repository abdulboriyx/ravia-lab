import assert from "node:assert/strict";
import test from "node:test";
import {
  boundsForDnaCamera,
  deriveDnaSceneCameraFrame,
  getDnaSceneCameraContract,
  isFiniteDnaSceneCameraFrame,
} from "./DnaSceneCamera.ts";

const localPoints = [[-2.3, -0.55, 0], [2.3, 0.55, 0]] as const;
const duplexPoints = [[-3.2, -2, -8], [3.2, 2, 8]] as const;

test("DNA family camera contracts produce finite deterministic geometry-owned frames", () => {
  for (const family of ["structure", "regulation", "replication", "transcription", "damageRepair", "packaging", "localChemistry"] as const) {
    const bounds = boundsForDnaCamera(family === "localChemistry" || family === "damageRepair" ? localPoints : duplexPoints);
    const frame = deriveDnaSceneCameraFrame(getDnaSceneCameraContract(family), bounds, 16 / 9);
    assert.equal(isFiniteDnaSceneCameraFrame(frame), true);
    assert.equal(frame.target[0], bounds.center[0]);
    assert.equal(frame.target[2], bounds.center[2]);
  }
});

test("regional and whole-duplex framing differ without inherited generic defaults", () => {
  const bounds = boundsForDnaCamera(duplexPoints);
  const structure = deriveDnaSceneCameraFrame(getDnaSceneCameraContract("structure"), bounds, 16 / 9);
  const regulation = deriveDnaSceneCameraFrame(getDnaSceneCameraContract("regulation"), bounds, 16 / 9);
  assert.notEqual(structure.distance, regulation.distance);
  assert.ok(regulation.distance < structure.distance);
});

test("local chemistry is centered from its own atom bounds rather than a previous scene", () => {
  const bounds = boundsForDnaCamera(localPoints);
  const frame = deriveDnaSceneCameraFrame(getDnaSceneCameraContract("localChemistry"), bounds, 16 / 9);
  assert.deepEqual(frame.bounds.center, [0, 0, 0]);
  assert.ok(frame.distance >= getDnaSceneCameraContract("localChemistry").minDistance);
});
