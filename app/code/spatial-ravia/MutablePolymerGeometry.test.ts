import assert from "node:assert/strict";
import test from "node:test";

import * as THREE from "three";
import {
  computeTubeFrames,
  createMutableTubeGeometry,
  getMutableTubeDrawCount,
  updateMutableTubeGeometry,
} from "./MutablePolymerGeometry.ts";

function makePath(offset = 0) {
  return Array.from({ length: 18 }, (_, index) => {
    const t = index / 17;
    return new THREE.Vector3(
      -1 + t * 2,
      Math.sin(t * Math.PI * 2 + offset) * 0.08,
      Math.cos(t * Math.PI * 2 + offset) * 0.06
    );
  });
}

test("mutable tube geometry keeps fixed buffer topology across updates", () => {
  const handle = createMutableTubeGeometry({
    sampleCount: 18,
    radialSegments: 8,
    radius: 0.05,
  });
  const positionBefore = handle.geometry.getAttribute("position");
  const normalBefore = handle.geometry.getAttribute("normal");
  const indexBefore = handle.geometry.getIndex();

  updateMutableTubeGeometry({ handle, points: makePath(0) });
  updateMutableTubeGeometry({ handle, points: makePath(0.4), activeSampleCount: 12 });

  assert.equal(handle.vertexCount, 18 * 8);
  assert.equal(handle.indexCount, (18 - 1) * 8 * 6);
  assert.equal(handle.geometry.getAttribute("position"), positionBefore);
  assert.equal(handle.geometry.getAttribute("normal"), normalBefore);
  assert.equal(handle.geometry.getIndex(), indexBefore);
});

test("mutable tube indices stay within fixed vertex bounds", () => {
  const handle = createMutableTubeGeometry({
    sampleCount: 10,
    radialSegments: 6,
    radius: 0.04,
  });
  const indices = handle.indexAttribute.array;

  for (const index of indices) {
    assert.ok(index >= 0);
    assert.ok(index < handle.vertexCount);
  }
});

test("mutable tube updates finite positions normals and bounded draw range", () => {
  const handle = createMutableTubeGeometry({
    sampleCount: 18,
    radialSegments: 8,
    radius: 0.05,
  });

  updateMutableTubeGeometry({ handle, points: makePath(), activeSampleCount: 9 });

  const positions = handle.positionAttribute.array;
  const normals = handle.normalAttribute.array;

  for (let index = 0; index < positions.length; index += 1) {
    assert.ok(Number.isFinite(positions[index]));
    assert.ok(Number.isFinite(normals[index]));
  }

  assert.equal(
    handle.geometry.drawRange.count,
    getMutableTubeDrawCount(handle, 9)
  );
  assert.ok(handle.geometry.drawRange.count >= 0);
  assert.ok(handle.geometry.drawRange.count <= handle.indexCount);
});

test("parallel transported tube frames remain orthogonal and finite", () => {
  const frames = computeTubeFrames(makePath(0.2));

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];

    assert.ok(Math.abs(frame.tangent.length() - 1) < 0.0001);
    assert.ok(Math.abs(frame.normal.length() - 1) < 0.0001);
    assert.ok(Math.abs(frame.binormal.length() - 1) < 0.0001);
    assert.ok(Math.abs(frame.tangent.dot(frame.normal)) < 0.0001);
    assert.ok(Math.abs(frame.tangent.dot(frame.binormal)) < 0.0001);

    if (index > 0) {
      assert.ok(frame.normal.dot(frames[index - 1].normal) > -0.95);
    }
  }
});
