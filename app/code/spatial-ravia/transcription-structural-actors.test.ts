import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { clearGroundedStructureCache, loadGroundedStructure } from "./biology-structure-loader.ts";
import { resolveTranscriptionStructureGrounding } from "./biology-transcription-structure-grounding.ts";
import {
  deriveTranscriptionActiveSiteFrame,
  frameTransform,
  isValidTranscriptionActiveSiteFrame,
  resolveTranscriptionStructuralActorPackage,
  sceneToStructural,
  structuralToScene,
  transcriptionLegacyCoordinateAudit,
  transcriptionStructuralScalePolicy,
  validateTranscriptionStructuralActorPackage,
} from "./transcription-structural-actors.ts";

async function load6alh() {
  const manifest = resolveTranscriptionStructureGrounding();
  assert.ok(manifest);
  clearGroundedStructureCache();
  return loadGroundedStructure(manifest, async () =>
    readFileSync(new URL("../../../public/spatial-ravia/structures/6ALH.pdb", import.meta.url), "utf8")
  );
}

test("6ALH package is explicit bacterial RNAP with DNA/RNA/hybrid selectors", () => {
  const value = resolveTranscriptionStructuralActorPackage();
  validateTranscriptionStructuralActorPackage(value);
  assert.equal(value.source.organism, "Escherichia coli K-12");
  assert.equal(value.source.polymeraseClass, "BACTERIAL_RNAP");
  assert.deepEqual(value.selectors.dnaChains, ["A", "B"]);
  assert.equal(value.selectors.rnaChain, "R");
  assert.deepEqual(value.selectors.polymeraseChains, ["G", "H", "I", "J", "K"]);
  assert.equal(value.selectors.hybrid.selectionBasis, "source-bounded-window");
  assert.equal(value.actors.promoter.semanticOnly, true);
});

test("grounded actor bounds and active-site frame are finite and orthogonal", async () => {
  const loaded = await load6alh();
  const value = resolveTranscriptionStructuralActorPackage(resolveTranscriptionStructureGrounding(), loaded.geometry);
  validateTranscriptionStructuralActorPackage(value);
  assert.ok(value.actors.dna.bounds);
  assert.ok(value.actors.polymerase.bounds);
  assert.ok(value.actors.rna.bounds);
  const frame = deriveTranscriptionActiveSiteFrame(value, loaded.geometry);
  assert.equal(isValidTranscriptionActiveSiteFrame(frame), true);
  assert.ok(frame.rnaExit);
  assert.ok(frame.rnaExitDirection);
});

test("structural and scene transforms round-trip with one shared scale", async () => {
  const loaded = await load6alh();
  const value = resolveTranscriptionStructuralActorPackage(resolveTranscriptionStructureGrounding(), loaded.geometry);
  const frame = deriveTranscriptionActiveSiteFrame(value, loaded.geometry);
  const transform = frameTransform(frame);
  const point = [frame.activeCenter[0] + frame.dnaAxis[0] * 12 + frame.normal[0] * 3, frame.activeCenter[1] + frame.dnaAxis[1] * 12 + frame.normal[1] * 3, frame.activeCenter[2] + frame.dnaAxis[2] * 12 + frame.normal[2] * 3] as const;
  const roundTrip = sceneToStructural(structuralToScene(point, transform), transform);
  assert.ok(roundTrip.every((coordinate, index) => Math.abs(coordinate - point[index]) < 1e-6));
  assert.equal(transform.scale, transcriptionStructuralScalePolicy.angstromToScene);
});

test("missing RNA exit remains explicitly unresolved and does not fabricate a direction", async () => {
  const loaded = await load6alh();
  const value = resolveTranscriptionStructuralActorPackage();
  const geometry = { ...loaded.geometry, anchors: loaded.geometry.anchors.filter((candidate) => candidate.id !== "rna-exit") };
  const frame = deriveTranscriptionActiveSiteFrame(value, geometry);
  assert.equal(frame.rnaExit, null);
  assert.equal(frame.rnaExitDirection, null);
  assert.equal(isValidTranscriptionActiveSiteFrame(frame), true);
});

test("legacy coordinate ownership is explicit and migration destinations are documented", () => {
  assert.ok(transcriptionLegacyCoordinateAudit.length >= 5);
  assert.ok(transcriptionLegacyCoordinateAudit.some((item) => item.name === "sceneXFromProgress" && item.classification === "MUST_BE_REPLACED_BY_STRUCTURAL_FRAME"));
  assert.ok(transcriptionLegacyCoordinateAudit.every((item) => item.migrationDestination.length > 0));
});

test("6ALH cannot be relabeled as eukaryotic Pol II", () => {
  const value = resolveTranscriptionStructuralActorPackage();
  const invalid = { ...value, source: { ...value.source, polymeraseClass: "EUKARYOTIC_POL_II" as const } };
  assert.throws(() => validateTranscriptionStructuralActorPackage(invalid), /BACTERIAL_RNAP/);
});

