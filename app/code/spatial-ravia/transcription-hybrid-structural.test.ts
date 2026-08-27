import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveTranscriptionStructuralActorPackage } from "./transcription-structural-actors.ts";

test("6ALH exposes deposited DNA, RNA, and bounded hybrid selectors", () => {
  const pkg = resolveTranscriptionStructuralActorPackage();
  assert.deepEqual(pkg.selectors.dnaChains, ["A", "B"]);
  assert.equal(pkg.selectors.rnaChain, "R");
  assert.deepEqual(pkg.selectors.hybrid.dna.map((item) => item.chainId), ["A", "B"]);
  assert.deepEqual(pkg.selectors.hybrid.rna.map((item) => item.chainId), ["R"]);
  assert.ok(pkg.selectors.hybrid.dna.every((item) => item.residueRange));
  assert.ok(pkg.selectors.hybrid.rna.every((item) => item.residueRange));
});

test("Mol* transcription path requests structural RNA and hybrid representations", () => {
  const source = readFileSync(new URL("./MolstarStructurePresentationAdapter.tsx", import.meta.url), "utf8");
  assert.match(source, /includeRna/);
  assert.match(source, /hybridWindow/);
  assert.match(source, /rna-nascent/);
  assert.match(source, /hybrid-rna/);
  assert.match(source, /type: "cartoon"/);
  assert.doesNotMatch(source, /CatmullRomCurve3/);
});

test("production transcription uses one shared structure-derived viewport", () => {
  const source = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.match(source, /BakedTranscriptionMolecularActor/);
  assert.match(source, /data-molecular-viewport-owner="r3f-structure-derived"/);
  assert.match(source, /data-structural-source=\{transcriptionVisualContract\.source\.structureId\}/);
  assert.match(source, /5FLM DEPOSITED GEOMETRY/);
  assert.match(source, /data-motion-source="5FLM_STRUCTURE_DERIVED_KINEMATIC_TRANSLOCATION"/);
  assert.doesNotMatch(source, /<MolecularNascentRNA3D/);
});
