import assert from "node:assert/strict";
import test from "node:test";
import { bottomDockInsetPx, boundsFromPoints, cameraForBounds, layoutRnaLabels } from "./RnaProductionComposition.ts";

test("RNA camera uses post-transform world bounds and finite framing", () => {
  const bounds = boundsFromPoints([[-4, -1, 0], [4, 1, 0], [0, 3, 0]]);
  assert.ok(bounds);
  const frame = cameraForBounds(bounds!, { aspect: 2, fov: 42, bottomInsetPx: 120, viewportHeightPx: 800 });
  assert.ok(frame.distance > 0 && frame.position.every(Number.isFinite) && frame.target.every(Number.isFinite));
  assert.ok(frame.target[1] < bounds!.center[1]);
});

test("portrait and landscape framing are deterministic", () => {
  const bounds = boundsFromPoints([[-2, -2, 0], [2, 2, 0]])!;
  const portrait = cameraForBounds(bounds, { aspect: 0.6, fov: 40 });
  const landscape = cameraForBounds(bounds, { aspect: 1.8, fov: 40 });
  assert.ok(portrait.distance > landscape.distance);
  assert.deepEqual(portrait, cameraForBounds(bounds, { aspect: 0.6, fov: 40 }));
});

test("prompt dock inset is measured in canvas pixels and never exceeds the canvas", () => {
  assert.equal(bottomDockInsetPx(100, 900, 760), 152);
  assert.equal(bottomDockInsetPx(100, 900, 20), 800);
  assert.equal(bottomDockInsetPx(100, 900, 1200), 0);
});

test("label layout clamps, prioritizes, and deduplicates deterministically", () => {
  const bounds = boundsFromPoints([[-1, -1, 0], [1, 1, 0]])!;
  const labels = layoutRnaLabels([
    { text: "primary", anchor: "focus", position: [0, 0, 0], priority: "primary" },
    { text: "primary", anchor: "focus", position: [0, 0, 0], priority: "primary" },
    { text: "optional", anchor: "optional", position: [0, 0, 0], priority: "tertiary" },
  ], bounds);
  assert.equal(labels.filter((label) => label.anchor === "focus").length, 1);
  assert.ok(labels.every((label) => label.position[0] >= bounds.min[0] && label.position[0] <= bounds.max[0] && label.position[1] >= bounds.min[1] && label.position[1] <= bounds.max[1]));
});
