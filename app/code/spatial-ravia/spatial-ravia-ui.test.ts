import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const dockSource = readFileSync(
  new URL("./SpatialPromptDock.tsx", import.meta.url),
  "utf8"
);
const molecularViewSource = readFileSync(
  new URL("./DnaMolecularView.tsx", import.meta.url),
  "utf8"
);
const mechanismSource = readFileSync(
  new URL("./MechanisticScene.tsx", import.meta.url),
  "utf8"
);
const timelineSource = readFileSync(
  new URL("./SpatialTimelineControls.tsx", import.meta.url),
  "utf8"
);
const structurePrimitiveSource = readFileSync(
  new URL("./StructureDerivedPrimitive.tsx", import.meta.url),
  "utf8"
);
const themeSource = readFileSync(
  new URL("./spatial-ravia-theme.ts", import.meta.url),
  "utf8"
);
const globalCssSource = readFileSync(
  new URL("../../globals.css", import.meta.url),
  "utf8"
);

test("Spatial Ravia route uses one bottom command dock instead of the old top prompt form", () => {
  assert.match(pageSource, /SpatialPromptDock/);
  assert.equal(pageSource.match(/<SpatialPromptDock/g)?.length, 1);
  assert.doesNotMatch(pageSource, /Describe what you want to see/);
  assert.doesNotMatch(pageSource, /margin:\s*"28px auto 18px"/);
});

test("Spatial prompt dock supports collapse, expand, and keyboard reopening", () => {
  assert.match(dockSource, /data-state="expanded"/);
  assert.match(dockSource, /data-state="collapsed"/);
  assert.match(dockSource, /Collapse Spatial Ravia prompt/);
  assert.match(dockSource, /Open Spatial Ravia prompt/);
  assert.match(dockSource, /event\.key === "\/"/);
  assert.match(dockSource, /event\.key === "Escape"/);
});

test("Spatial prompt dock is bottom centered and responsive", () => {
  assert.match(globalCssSource, /\.spatialPromptDock\s*{[\s\S]*?position:\s*fixed/);
  assert.match(globalCssSource, /\.spatialPromptDock\s*{[\s\S]*?bottom:/);
  assert.match(globalCssSource, /\.spatialPromptDock\s*{[\s\S]*?left:\s*50%/);
  assert.match(globalCssSource, /\.spatialPromptDock\s*{[\s\S]*?width:\s*min\(850px, calc\(100vw - 32px\)\)/);
  assert.match(globalCssSource, /@media \(max-width: 560px\)[\s\S]*\.spatialPromptDock/);
});

test("embedded Molstar view does not render a second Spatial Ravia prompt", () => {
  assert.match(molecularViewSource, /!\s*embedded\s*\?/);
  assert.match(molecularViewSource, /structurePromptBar/);
  assert.match(pageSource, /<DnaMolecularView embedded theme=\{theme\} \/>/);
});

test("temporal scenes use a separate compact timeline controller", () => {
  assert.match(mechanismSource, /useBiologyTimeline/);
  assert.match(mechanismSource, /timeline\.hasTemporal/);
  assert.match(mechanismSource, /<SpatialTimelineControls/);
  assert.match(timelineSource, /aria-label="Mechanism timeline"/);
  assert.match(timelineSource, /aria-label="Mechanism time"/);
  assert.match(timelineSource, /aria-label="Playback speed"/);
  assert.doesNotMatch(pageSource, /SpatialTimelineControls/);
});

test("timeline controls are positioned separately from the bottom prompt dock", () => {
  assert.match(globalCssSource, /\.spatialTimelineControls\s*{[\s\S]*?position:\s*fixed/);
  assert.match(globalCssSource, /\.spatialTimelineControls\s*{[\s\S]*?bottom:\s*calc\(92px/);
  assert.match(globalCssSource, /\.spatialTimelineControls\s*{[\s\S]*?left:\s*16px/);
  assert.match(globalCssSource, /@media \(max-width: 560px\)[\s\S]*\.spatialTimelineControls/);
});

test("grounded structure loading is not restarted by an inline resolution callback", () => {
  assert.match(structurePrimitiveSource, /const onResolvedRef = useRef\(onResolved\)/);
  assert.match(structurePrimitiveSource, /onResolvedRef\.current\?\.\(next\)/);
  assert.match(structurePrimitiveSource, /\}, \[entry\]\);/);
  assert.doesNotMatch(structurePrimitiveSource, /\}, \[entry, onResolved\]\);/);
});

test("mechanistic canvas fills the visualization surface", () => {
  assert.match(globalCssSource, /\.mechanisticSceneSurface > canvas\s*{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%/);
});

test("Spatial Ravia owns one persistent workspace light and dark background preference", () => {
  assert.match(pageSource, /spatialRaviaThemeStorageKey/);
  assert.match(pageSource, /localStorage\.getItem/);
  assert.match(pageSource, /localStorage\.setItem/);
  assert.match(pageSource, /data-spatial-theme=\{theme\}/);
  assert.match(pageSource, /Switch to dark background/);
  assert.match(pageSource, /Switch to light background/);
  assert.match(themeSource, /canvasBackground/);
  assert.match(mechanismSource, /spatialRaviaThemePresentation\[theme\]\.canvasBackground/);
  assert.match(molecularViewSource, /theme=\{theme\}/);
});
