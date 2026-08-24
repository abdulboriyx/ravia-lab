import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizeScinaTheme, scinaThemePresentation } from "./scina-theme";

const pageSource = readFileSync(new URL("./code/spatial-ravia/page.tsx", import.meta.url), "utf8");
const transcriptionSource = readFileSync(new URL("./code/spatial-ravia/GeneExpression3DScene.tsx", import.meta.url), "utf8");

test("Scina light and dark presentation tokens are complete and distinct", () => {
  const required = ["pageBackground", "surfaceBackground", "elevatedSurface", "primaryText", "secondaryText", "border", "controlBackground", "controlSelected", "canvasBackground", "canvasFog", "sceneAmbient", "sceneKey", "sceneFill", "labelPrimary", "labelSecondary"] as const;
  for (const token of required) {
    assert.ok(scinaThemePresentation.light[token].length > 0);
    assert.ok(scinaThemePresentation.dark[token].length > 0);
  }
  assert.notEqual(scinaThemePresentation.light.canvasBackground, scinaThemePresentation.dark.canvasBackground);
  assert.notEqual(scinaThemePresentation.light.primaryText, scinaThemePresentation.dark.primaryText);
});

test("Scina normalizes only supported theme values", () => {
  assert.equal(normalizeScinaTheme("light"), "light");
  assert.equal(normalizeScinaTheme("dark"), "dark");
  assert.equal(normalizeScinaTheme("other"), "dark");
});

test("the Scina workspace and transcription canvas share the same theme input", () => {
  assert.match(pageSource, /applyScinaTheme\(next, true\)/);
  assert.match(pageSource, /data-spatial-theme=\{theme\}/);
  assert.match(pageSource, /<CellularProductionOwnerView route=\{productionRoute\} theme=\{theme\} \/>/);
  assert.match(transcriptionSource, /spatialRaviaThemePresentation\[theme\]/);
  assert.match(transcriptionSource, /<color attach="background" args=\{\[colors\.canvasBackground\]\}/);
  assert.match(transcriptionSource, /<fog attach="fog" args=\{\[colors\.canvasFog, 6\.2, 13\]\}/);
  assert.doesNotMatch(transcriptionSource, /#050b13/);
});
