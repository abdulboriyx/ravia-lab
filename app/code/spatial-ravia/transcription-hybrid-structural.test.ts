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

test("production transcription opts into the deposited RNA/hybrid path", () => {
  const source = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.match(source, /includeRna: true/);
  assert.match(source, /hybridWindow: structuralPackage\.selectors\.hybrid/);
  assert.match(source, /data-rna-chain/);
  assert.match(source, /STRUCTURAL SNAPSHOT · 6ALH · BACTERIAL RNAP/);
  assert.doesNotMatch(source, /<MolecularNascentRNA3D/);
});
