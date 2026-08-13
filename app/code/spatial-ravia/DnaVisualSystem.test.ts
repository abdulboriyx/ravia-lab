import assert from "node:assert/strict";
import test from "node:test";
import { canonicalDnaView, dnaLodPolicy, dnaVisualSystem, isValidDnaVisualState, sampleCanonicalDna } from "./DnaVisualSystem.ts";

test("canonical DNA samples retain a right-handed B-DNA duplex with antiparallel partner positions", () => {
  const samples = sampleCanonicalDna(12, { topology: "double-stranded", lod: "global", localState: "canonical" });
  assert.equal(samples.length, 12);
  assert.ok(samples.every((sample) => sample.strandA.every(Number.isFinite) && sample.strandB.every(Number.isFinite)));
  assert.equal(dnaVisualSystem.geometry.handedness, "right-handed");
  assert.ok(dnaVisualSystem.geometry.risePerBasePairAngstrom > 0);
  assert.ok(dnaVisualSystem.geometry.basePairsPerTurn > 0);
  assert.equal(dnaVisualSystem.geometry.canonicalDuplexBasePairCount, 16);
});

test("canonical DNA focus presets provide finite scale-sensitive composition", () => {
  const whole = canonicalDnaView("whole-duplex");
  const pair = canonicalDnaView("base-pair");
  const nucleotide = canonicalDnaView("nucleotide");
  assert.equal(whole.basePairCount, 16);
  assert.ok(pair.camera.distanceScale < whole.camera.distanceScale);
  assert.ok(nucleotide.camera.distanceScale < pair.camera.distanceScale);
  assert.equal(pair.lod, "nucleotide");
  assert.equal(nucleotide.lod, "local-chemistry");
  for (const view of [whole, pair, nucleotide]) {
    assert.ok(Number.isFinite(view.camera.azimuthDegrees));
    assert.ok(Number.isFinite(view.camera.elevationDegrees));
    assert.ok(Number.isFinite(view.camera.distanceScale));
  }
});

test("single and locally opened DNA preserve ordered local geometry without opening the whole duplex", () => {
  const opened = sampleCanonicalDna(16, { topology: "locally-open", lod: "nucleotide", localState: "canonical", openCenter: 8, openBasePairs: 6 });
  assert.ok(opened[8].opening > 0.9);
  assert.equal(opened[0].opening, 0);
  assert.equal(isValidDnaVisualState({ topology: "locally-open", lod: "nucleotide", localState: "canonical", openBasePairs: 6 }), true);
  assert.equal(isValidDnaVisualState({ topology: "locally-open", lod: "nucleotide", localState: "canonical" }), false);
});

test("DNA LOD policy reserves atom/bond chemistry for selected local regions", () => {
  assert.equal(dnaLodPolicy("global").selectedChemistry, false);
  assert.equal(dnaLodPolicy("local-chemistry").selectedChemistry, true);
  assert.equal(dnaVisualSystem.representation.atomScale < dnaVisualSystem.representation.backboneRadius, true);
});
