import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Mol* is the sole interactive camera owner for the polymerase layer", () => {
  const adapter = readFileSync(new URL("./MolstarStructurePresentationAdapter.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../globals.css", import.meta.url), "utf8");
  assert.match(adapter, /focusObject\(\{ targets/);
  assert.match(adapter, /RESET VIEW/);
  assert.match(adapter, /minRadius: kind === "transcription" \? 10 : 20/);
  assert.match(adapter, /checkeredTransparentBackground: false/);
  assert.match(css, /\.geneExpressionMolecularLayer \{[\s\S]*pointer-events: auto/);
  assert.match(css, /\.geneExpressionMolecularLayer \.molstarStructurePresentation \{[\s\S]*pointer-events: auto/);
});

test("active-site focus includes polymerase and selected DNA, not the whole assembly", () => {
  const adapter = readFileSync(new URL("./MolstarStructurePresentationAdapter.tsx", import.meta.url), "utf8");
  assert.match(adapter, /focusPresentation\(viewer, \[proteinRepresentation, \.\.\.structuralDna\], 10\)/);
  assert.match(adapter, /options\?\.polymeraseOnly/);
});
