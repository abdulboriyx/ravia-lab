import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveBiologicalEntity,
  resolveBiologicalEntityLocal
} from "./entity-resolution.ts";

test("RNA polymerase II resolves to the transcription process-pack entity", async () => {
  const result = await resolveBiologicalEntity("Pol II", {
    processPackId: "eukaryotic-transcription",
    biologicalContext: "eukaryotic protein-coding gene transcription"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "rna-polymerase-ii");
    assert.ok(
      result.canonicalEntity.identifiers.internalProcessPackIds.some(
        (mapping) => mapping.packId === "eukaryotic-transcription" && mapping.entityId === "rna-polymerase-ii"
      )
    );
  }
});

test("template strand resolves in transcription context without replication mappings", () => {
  const result = resolveBiologicalEntityLocal("template strand", {
    processPackId: "eukaryotic-transcription"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "template-strand-transcription");
    assert.deepEqual(result.canonicalEntity.identifiers.internalProcessPackIds, [
      { packId: "eukaryotic-transcription", entityId: "template-strand" }
    ]);
  }
});
