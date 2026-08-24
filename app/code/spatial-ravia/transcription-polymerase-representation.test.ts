import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadGroundedStructure, clearGroundedStructureCache } from "./biology-structure-loader.ts";
import { resolveTranscriptionStructureGrounding } from "./biology-transcription-structure-grounding.ts";
import { deriveTranscriptionActiveSiteFrame, resolveTranscriptionStructuralActorPackage } from "./transcription-structural-actors.ts";
import { eukaryoticPolIIElongationSourceRequirements, resolvePrimaryPolymeraseRepresentation, structuralPolymeraseUnavailable } from "./transcription-polymerase-representation.ts";

async function groundedFrame() {
  const entry = resolveTranscriptionStructureGrounding();
  assert.ok(entry);
  clearGroundedStructureCache();
  const loaded = await loadGroundedStructure(entry, async () => readFileSync(new URL("../../../public/spatial-ravia/structures/6ALH.pdb", import.meta.url), "utf8"));
  const packageValue = resolveTranscriptionStructuralActorPackage(entry, loaded.geometry);
  return { packageValue, frame: deriveTranscriptionActiveSiteFrame(packageValue, loaded.geometry) };
}

test("primary polymerase representation is deposited and frame-bound", async () => {
  const { packageValue, frame } = await groundedFrame();
  const representation = resolvePrimaryPolymeraseRepresentation(packageValue, frame);
  assert.equal(representation.status, "STRUCTURE_DERIVED_PRIMARY");
  assert.equal(representation.fidelity, "E0_DEPOSITED");
  assert.equal(representation.polymeraseClass, "BACTERIAL_RNAP");
  assert.deepEqual(representation.chainIds, ["G", "H", "I", "J", "K"]);
  assert.equal(representation.frameId, frame.frameId);
});

test("6ALH is rejected if relabeled as eukaryotic Pol II", async () => {
  const { packageValue, frame } = await groundedFrame();
  const invalid = { ...packageValue, source: { ...packageValue.source, polymeraseClass: "EUKARYOTIC_POL_II" as const } };
  assert.throws(() => resolvePrimaryPolymeraseRepresentation(invalid, frame), /SOURCE_CLASS_MISMATCH/);
});

test("future eukaryotic Pol II source requirements are explicit and not satisfied by 6ALH", () => {
  assert.equal(eukaryoticPolIIElongationSourceRequirements.status, "NOT_CONFIGURED");
  assert.match(eukaryoticPolIIElongationSourceRequirements.prohibition, /6ALH/);
});

test("structural failure is explicitly downgraded instead of masquerading as deposited", () => {
  const fallback = structuralPolymeraseUnavailable("rcsb-pdb:6ALH", "frame-1");
  assert.equal(fallback.status, "STRUCTURAL_POLYMERASE_UNAVAILABLE");
  assert.equal(fallback.fidelity, "S2_SCHEMATIC");
  assert.match(fallback.fallbackDisclosure ?? "", /unavailable/);
});

test("live production scene mounts the shared structure-derived actor in the single R3F viewport", () => {
  const source = readFileSync(new URL("./GeneExpression3DScene.tsx", import.meta.url), "utf8");
  assert.match(source, /StructureDerivedPrimitive/);
  assert.match(source, /data-camera-owner="r3f"/);
  assert.doesNotMatch(source, /<TranscriptionRnapPresentation/);
  assert.doesNotMatch(source, /<derived-lobe/);
});
