import assert from "node:assert/strict";
import test from "node:test";
import { isFiniteRnapPresentation } from "./transcription-runtime-safety.ts";
import { normalizeScinaTheme } from "../../scina-theme.ts";

test("malformed grounded RNAP data falls back without throwing", () => {
  const cases: unknown[][] = [
    [undefined, undefined],
    [{ cleft: undefined, lobes: [] }, { position: undefined, quaternion: undefined, scale: 1 }],
    [{ cleft: { center: null, axis: { x: 0, y: 1, z: 0 }, length: 1, radius: 1 }, lobes: [] }, { position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 }, scale: 1 }],
    [{ cleft: { center: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 1, z: 0 }, length: 1, radius: 1 }, lobes: [{ center: undefined, radii: { x: 1, y: 1, z: 1 } }] }, { position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 }, scale: 1 }],
  ];
  for (const [presentation, transform] of cases) {
    assert.doesNotThrow(() => isFiniteRnapPresentation(presentation, transform));
    assert.equal(isFiniteRnapPresentation(presentation, transform), false);
  }
});

test("runtime themes always normalize to a supported presentation key", () => {
  assert.equal(normalizeScinaTheme("light"), "light");
  assert.equal(normalizeScinaTheme("dark"), "dark");
  assert.equal(normalizeScinaTheme("stale-theme"), "dark");
  assert.equal(normalizeScinaTheme(null), "dark");
});
