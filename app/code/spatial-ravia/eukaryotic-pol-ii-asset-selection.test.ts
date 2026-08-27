import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { clearGroundedStructureCache, loadGroundedStructure } from "./biology-structure-loader.ts";
import { resolveEukaryoticPolIIStructureGrounding } from "./biology-transcription-structure-grounding.ts";
import { deriveTranscriptionActiveSiteFrame, isValidTranscriptionActiveSiteFrame, resolveEukaryoticPolIIStructuralActorPackage, validateTranscriptionStructuralActorPackage } from "./transcription-structural-actors.ts";
import {
  eukaryoticPolIIAssetSelection,
  resolveEukaryoticPolIIAssetManifest,
  validateEukaryoticPolIIAssetManifest,
} from "./eukaryotic-pol-ii-asset-selection.ts";

test("selected Pol II asset is explicit and mounted in the eukaryotic renderer", () => {
  const entry = resolveEukaryoticPolIIAssetManifest();
  assert.equal(eukaryoticPolIIAssetSelection.status, "MOUNTED");
  assert.equal(entry.structureId, "5FLM");
  assert.equal(entry.format, "mmcif");
  assert.deepEqual(entry.selectedChains, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "R"]);
  assert.equal(entry.chainEntityTypes?.M, "dna");
  assert.equal(entry.chainEntityTypes?.N, "rna");
  assert.equal(entry.chainEntityTypes?.O, "dna");
  assert.equal(entry.chainEntityTypes?.R, "ligand");
  assert.deepEqual(resolveEukaryoticPolIIStructureGrounding(), entry);
});

test("5FLM manifest validation rejects bacterial identity or incomplete chain roles", () => {
  const entry = resolveEukaryoticPolIIAssetManifest();
  const bacterial = { ...entry, structureId: "6ALH" };
  const invalid = validateEukaryoticPolIIAssetManifest(bacterial);
  assert.equal(invalid.valid, false);
  assert.match(invalid.issues.join(" "), /6ALH/);
  const missingRna = { ...entry, chainEntityTypes: { ...entry.chainEntityTypes, N: "protein" as const } };
  const missingRnaResult = validateEukaryoticPolIIAssetManifest(missingRna);
  assert.equal(missingRnaResult.valid, false);
  assert.match(missingRnaResult.issues.join(" "), /chain N/);
});

test("deposited 5FLM coordinates resolve the declared Pol II, DNA, RNA, and active-center roles", async () => {
  const entry = resolveEukaryoticPolIIAssetManifest();
  clearGroundedStructureCache();
  const loaded = await loadGroundedStructure(entry, async () =>
    readFileSync(new URL("../../../public/spatial-ravia/structures/5FLM.cif", import.meta.url), "utf8")
  );
  const chain = (chainId: string) => loaded.structure.chains.find((candidate) => candidate.id === chainId || candidate.sourceChainId === chainId || candidate.labelAsymId === chainId);
  for (const chainId of entry.selectedChains) assert.ok(chain(chainId), `missing chain ${chainId}`);
  assert.equal(chain("M")?.entityType, "dna");
  assert.equal(chain("N")?.entityType, "rna");
  assert.equal(chain("O")?.entityType, "dna");
  assert.equal(chain("R")?.entityType, "ligand");
  assert.ok(loaded.geometry.residuePoints.length > 1000);
  for (const anchorId of ["upstream-dna", "downstream-dna", "rna-exit", "active-center"]) {
    const anchor = loaded.geometry.anchors.find((candidate) => candidate.id === anchorId);
    assert.ok(anchor, `missing anchor ${anchorId}`);
    assert.ok(anchor!.point.toArray().every(Number.isFinite), `non-finite anchor ${anchorId}`);
  }
});

test("5FLM builds a validated eukaryotic Pol II actor package without a fabricated promoter coordinate", async () => {
  const entry = resolveEukaryoticPolIIAssetManifest();
  clearGroundedStructureCache();
  const loaded = await loadGroundedStructure(entry, async () =>
    readFileSync(new URL("../../../public/spatial-ravia/structures/5FLM.cif", import.meta.url), "utf8")
  );
  const packageValue = resolveEukaryoticPolIIStructuralActorPackage(entry, loaded.geometry);
  validateTranscriptionStructuralActorPackage(packageValue);
  assert.equal(packageValue.source.polymeraseClass, "EUKARYOTIC_POL_II");
  assert.deepEqual(packageValue.selectors.dnaChains, ["M", "O"]);
  assert.equal(packageValue.selectors.rnaChain, "N");
  assert.deepEqual(packageValue.selectors.polymeraseChains, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
  assert.deepEqual(packageValue.selectors.hybrid.dna[0]?.residueRange, { start: 7, end: 20 });
  assert.deepEqual(packageValue.selectors.hybrid.rna[0]?.residueRange, { start: 7, end: 20 });
  assert.equal(packageValue.actors.promoter.semanticOnly, true);
  assert.equal(packageValue.actors.promoter.sourceSelector, undefined);
  assert.ok(packageValue.actors.polymerase.bounds);
  assert.ok(packageValue.actors.dna.bounds);
  assert.ok(packageValue.actors.rna.bounds);
  const frame = deriveTranscriptionActiveSiteFrame(packageValue, loaded.geometry);
  assert.equal(isValidTranscriptionActiveSiteFrame(frame), true);
  assert.equal(frame.sourceId, packageValue.source.sourceId);
});
