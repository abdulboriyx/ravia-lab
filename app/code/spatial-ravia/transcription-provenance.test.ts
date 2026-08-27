import assert from "node:assert/strict";
import test from "node:test";
import { resolveTranscriptionProvenance } from "./transcription-provenance.ts";

test("all selectable eukaryotic transcription targets resolve complete 5FLM provenance", () => {
  for (const target of ["POL_II", "DNA", "RNA", "HYBRID", "MG"] as const) {
    const record = resolveTranscriptionProvenance(target, "DEPOSITED");
    assert.ok(record);
    assert.equal(record.structureId, "5FLM");
    assert.equal(record.assemblyId, "1");
    assert.ok(record.chains.length > 0);
    assert.ok(record.residueRange.length > 0);
    assert.equal(record.sourceStatus, "DEPOSITED");
    assert.ok(record.experimentallyPresent.length > 0);
    assert.ok(record.animatedOrInferred.length > 0);
    assert.ok(record.knownLimitations.some((item) => item.includes("time-resolved trajectory")));
    assert.equal(record.sourceUrl, "https://www.rcsb.org/structure/5FLM");
  }
});

test("provenance ranges and chains are bound to the structural actor selectors", () => {
  assert.deepEqual(resolveTranscriptionProvenance("POL_II")?.chains, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
  assert.deepEqual(resolveTranscriptionProvenance("DNA")?.chains, ["M", "O"]);
  assert.equal(resolveTranscriptionProvenance("DNA")?.residueRange, "M:1–39; O:1–39");
  assert.equal(resolveTranscriptionProvenance("RNA")?.residueRange, "N:7–20");
  assert.equal(resolveTranscriptionProvenance("HYBRID")?.residueRange, "O:7–20; N:7–20");
  assert.match(resolveTranscriptionProvenance("MG")?.residueRange ?? "", /^R: active-center ligand/);
});

test("derived geometry is disclosed as derived motion without changing the deposited source identity", () => {
  const deposited = resolveTranscriptionProvenance("POL_II", "DEPOSITED");
  const derived = resolveTranscriptionProvenance("POL_II", "DERIVED");
  assert.equal(deposited?.sourceStatus, "DEPOSITED");
  assert.equal(deposited?.displayStatus, "MIXED");
  assert.equal(derived?.sourceStatus, "DEPOSITED");
  assert.equal(derived?.displayStatus, "DERIVED");
  assert.ok(derived?.fidelity.includes("S2_DERIVED_KINEMATIC"));
  assert.ok(derived?.animatedOrInferred.some((item) => item.includes("kinematic inference")));
});

test("no inspector record is returned when no object is selected", () => {
  assert.equal(resolveTranscriptionProvenance("NONE"), null);
});
