import assert from "node:assert/strict";
import test from "node:test";
import { fidelityFixtureContext, fidelityProvenanceFixture } from "./scientific-fidelity-provenance-fixtures.ts";
import { validateScientificFidelityProvenance, type ScientificFidelityProvenanceDocument } from "./scientific-fidelity-provenance.ts";

test("F2-C models deposited, computed, constrained, schematic, and overlay fidelity explicitly", () => {
  const result = validateScientificFidelityProvenance(fidelityProvenanceFixture, fidelityFixtureContext);
  assert.equal(result.valid, true);
  assert.deepEqual(new Set(fidelityProvenanceFixture.attachments.map((attachment) => attachment.fidelity)), new Set(["E0_DEPOSITED", "C0_COMPUTED", "S1_CONSTRAINED", "S2_SCHEMATIC", "O_OVERLAY"]));
});

test("F2-C keeps source, grounding, mechanism evidence, and visual approximation separate", () => {
  const deposited = fidelityProvenanceFixture.attachments.find((attachment) => attachment.fidelity === "E0_DEPOSITED")!;
  assert.equal(deposited.confidence.sourceConfidence, 0.96);
  assert.equal(deposited.confidence.groundingConfidence, 0.93);
  assert.equal(deposited.confidence.mechanismEvidence, "direct");
  assert.equal(deposited.confidence.visualApproximation, "minor");
});

test("F2-C accepts actor, group, interaction, and claim attachments", () => {
  assert.deepEqual(new Set(fidelityProvenanceFixture.attachments.map((attachment) => attachment.target.kind)), new Set(["actor", "group", "interaction", "claim"]));
});

test("F2-C rejects fake deposited status, missing references, invalid tier approximation, and unknown keys", () => {
  const invalid = structuredClone(fidelityProvenanceFixture) as unknown as ScientificFidelityProvenanceDocument & Record<string, unknown>;
  invalid.extra = true;
  invalid.sources[2]!.sourceType = "computedModel";
  invalid.sources[2]!.provider = undefined;
  invalid.attachments[2]!.provenanceSourceId = "missing-source" as typeof invalid.attachments[2]["provenanceSourceId"];
  invalid.attachments[3]!.confidence.visualApproximation = "minor";
  const result = validateScientificFidelityProvenance(invalid, fidelityFixtureContext);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path === "document.extra"));
    assert.ok(result.issues.some((issue) => issue.message.includes("depositedStructure")));
    assert.ok(result.issues.some((issue) => issue.message.includes("missing provenance source")));
    assert.ok(result.issues.some((issue) => issue.message.includes("S1_CONSTRAINED")));
  }
});

test("E0 deposited provenance requires deposited identity, structure, and repository provider", () => {
  const invalid = structuredClone(fidelityProvenanceFixture) as ScientificFidelityProvenanceDocument;
  invalid.sources.find((source) => source.sourceId === "pdb-6alh")!.provider = undefined;
  const result = validateScientificFidelityProvenance(invalid, fidelityFixtureContext);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.message.includes("provider.id")));
});
