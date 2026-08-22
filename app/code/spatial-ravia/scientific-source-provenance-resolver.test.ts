import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { resolveScientificSourceProvenance } from "./scientific-source-provenance-resolver.ts";

const context = { actorIds: [actorId("rna-1")], groupIds: [] as never[] };
const base = {
  sourceId: "pdb-6alh", sourceType: "depositedStructure" as const, fidelity: "E0_DEPOSITED" as const,
  provider: { id: "RCSB-PDB", version: "2026" }, accessionOrEntryId: "6ALH",
  structure: { structureId: "6ALH", modelId: "1", assemblyId: "1" }, citationReference: "doi:example",
  licenseReference: "rcsb-policy", contentHash: "pending:pdb-6alh", sourceConfidence: .98,
  groundingConfidence: .94, mechanismEvidence: "direct" as const, visualApproximation: "none" as const,
  attachmentId: "rna-attachment", target: { kind: "actor" as const, id: "rna-1" }, visible: true,
};

test("resolves deposited identity without changing source metadata", () => {
  const result = resolveScientificSourceProvenance(base, context);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.source.accessionOrEntryId, "6ALH");
    assert.equal(result.source.structure?.assemblyId, "1");
    assert.equal(result.document.attachments[0]?.fidelity, "E0_DEPOSITED");
  }
});

test("supports computed, constrained schematic, schematic, and overlay sources", () => {
  const cases = [
    { sourceType: "canonicalParameterSet", fidelity: "C0_COMPUTED", visualApproximation: "minor", provider: { id: "canonical-ravia" } },
    { sourceType: "curatedDataset", fidelity: "S1_CONSTRAINED", visualApproximation: "constrained", provider: { id: "local-curated" } },
    { sourceType: "educationalSchematic", fidelity: "S2_SCHEMATIC", visualApproximation: "schematic", provider: { id: "local-curated" } },
    { sourceType: "literature", fidelity: "O_OVERLAY", visualApproximation: "overlay", provider: { id: "literature" } },
  ] as const;
  for (const [index, item] of cases.entries()) {
    const result = resolveScientificSourceProvenance({ ...base, ...item, structure: undefined, accessionOrEntryId: undefined, licenseReference: undefined, sourceId: `source-${index}`, attachmentId: `attachment-${index}`, citationReference: "ref" }, context);
    assert.equal(result.ok, true, JSON.stringify(result));
  }
});

test("rejects unknown providers, injected fields, and missing deposited metadata", () => {
  const unknown = { ...base, provider: { id: "Mol*" } };
  const result = resolveScientificSourceProvenance(unknown, context);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.issues.some((issue) => issue.path === "provider.id"));
  const missing = { ...base, accessionOrEntryId: undefined, extra: true } as unknown as typeof base & { extra: boolean };
  const missingResult = resolveScientificSourceProvenance(missing, context);
  assert.equal(missingResult.ok, false);
  if (!missingResult.ok) {
    assert.ok(missingResult.issues.some((issue) => issue.path === "input.extra"));
    assert.ok(missingResult.issues.some((issue) => issue.path === "accessionOrEntryId"));
  }
});

test("rejects contradictory fidelity and source claims, and unknown targets", () => {
  const contradiction = resolveScientificSourceProvenance({ ...base, sourceType: "educationalSchematic", fidelity: "E0_DEPOSITED", provider: { id: "local-curated" }, accessionOrEntryId: undefined, structure: undefined, licenseReference: undefined }, context);
  assert.equal(contradiction.ok, false);
  const target = resolveScientificSourceProvenance({ ...base, target: { kind: "actor", id: "missing-actor" } }, context);
  assert.equal(target.ok, false);
  if (!target.ok) assert.ok(target.issues.some((issue) => issue.message.includes("missing actor")));
  const injected = resolveScientificSourceProvenance({ ...base, target: { kind: "actor", id: "rna-1", mesh: "not-allowed" } } as never, context);
  assert.equal(injected.ok, false);
});

test("does not invent accession or provider versions for computed sources", () => {
  const result = resolveScientificSourceProvenance({ ...base, sourceId: "canonical-rna", sourceType: "canonicalParameterSet", fidelity: "C0_COMPUTED", provider: { id: "canonical-ravia" }, accessionOrEntryId: undefined, structure: undefined, licenseReference: undefined, visualApproximation: "minor" }, context);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.source.provider?.version, undefined);
});
