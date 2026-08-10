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
  assert.match(pageSource, /<DnaMolecularView embedded \/>/);
});
