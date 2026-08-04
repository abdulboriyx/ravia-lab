import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalEntityProcessPacks,
  localBiologicalEntityRegistry,
  normalizeEntityAlias,
  registryEntriesForPacks,
  resolveBiologicalEntity,
  resolveBiologicalEntityLocal
} from "./entity-resolution.ts";

test("alias normalization canonicalizes Greek letters, roman numerals, and punctuation", () => {
  assert.equal(normalizeEntityAlias("Eukaryotic polymerase α"), "eukaryotic polymerase alpha");
  assert.equal(normalizeEntityAlias("RNA Pol II"), "rna polymerase 2");
  assert.equal(normalizeEntityAlias("DNA-polymerase III"), "dna polymerase 3");
});

test("broad polymerase is ambiguous without process or organism context", async () => {
  const result = await resolveBiologicalEntity("polymerase");

  assert.equal(result.status, "ambiguous");
  assert.ok(result.candidates.length >= 3);
  assert.ok(result.ambiguity.some((item) => item.includes("broad term")));
});

test("DNA polymerase remains broad but maps to the DNA replication process-pack entity", () => {
  const result = resolveBiologicalEntityLocal("DNA polymerase", {
    processPackId: "dna-replication",
    biologicalContext: "general DNA replication"
  });

  assert.equal(result.status, "ambiguous");
  assert.equal(result.candidates[0].entity.id, "dna-polymerase-general");
  assert.ok(
    result.candidates[0].entity.identifiers.internalProcessPackIds.some(
      (mapping) => mapping.packId === "dna-replication" && mapping.entityId === "dna-polymerase"
    )
  );
});

test("bacterial DNA polymerase III resolves under bacterial context", async () => {
  const result = await resolveBiologicalEntity("bacterial DNA polymerase III", {
    processPackId: "dna-replication",
    biologicalContext: "bacterial chromosome replication",
    organismTaxonomyId: "562"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "bacterial-dna-polymerase-iii");
    assert.ok(result.canonicalEntity.identifiers.ncbiTaxonomy?.includes("2"));
    assert.ok(result.provenance.length > 0);
  }
});

test("eukaryotic polymerase alpha resolves under eukaryotic replication context", async () => {
  const result = await resolveBiologicalEntity("eukaryotic polymerase alpha", {
    processPackId: "dna-replication",
    biologicalContext: "eukaryotic chromosome replication",
    organismTaxonomyId: "2759"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "eukaryotic-polymerase-alpha");
    assert.ok(result.canonicalEntity.identifiers.internalProcessPackIds.length >= 2);
  }
});

test("RNA polymerase II resolves to the transcription process-pack entity", async () => {
  const result = await resolveBiologicalEntity("RNA polymerase II", {
    processPackId: "eukaryotic-transcription",
    biologicalContext: "eukaryotic protein-coding gene transcription",
    organismTaxonomyId: "9606"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "rna-polymerase-ii");
    assert.ok(
      result.canonicalEntity.identifiers.internalProcessPackIds.some(
        (mapping) => mapping.packId === "eukaryotic-transcription" && mapping.entityId === "rna-polymerase-ii"
      )
    );
    assert.ok(result.canonicalEntity.identifiers.geneOntology?.includes("GO:0003899"));
  }
});

test("organism context distinguishes polymerase alpha from bacterial polymerase III", async () => {
  const result = await resolveBiologicalEntity("polymerase alpha", {
    biologicalContext: "eukaryotic chromosome replication",
    organismTaxonomyId: "2759"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "eukaryotic-polymerase-alpha");
  }
});

test("ambiguous template strand records multiple process-pack mappings", async () => {
  const result = await resolveBiologicalEntity("template strand");

  assert.equal(result.status, "ambiguous");
  assert.ok(result.candidates[0].entity.identifiers.internalProcessPackIds.length > 1);
  assert.ok(result.provenance.length > 0);
});

test("transcription context resolves template strand to the shared canonical template concept", async () => {
  const result = await resolveBiologicalEntity("template strand", {
    processPackId: "eukaryotic-transcription",
    biologicalContext: "eukaryotic protein-coding gene transcription"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "template-strand-transcription");
    assert.ok(
      result.canonicalEntity.identifiers.internalProcessPackIds.some(
        (mapping) => mapping.packId === "eukaryotic-transcription" && mapping.entityId === "template-strand"
      )
    );
  }
});

test("coding strand resolves in eukaryotic transcription context", async () => {
  const result = await resolveBiologicalEntity("sense strand", {
    processPackId: "eukaryotic-transcription",
    biologicalContext: "general eukaryotic transcription"
  });

  assert.equal(result.status, "resolved");

  if (result.status === "resolved") {
    assert.equal(result.canonicalEntity.id, "coding-strand");
  }
});

test("unresolved entity returns provenance-safe unresolved state", async () => {
  const result = await resolveBiologicalEntity("ribosome exit tunnel", {
    processPackId: "dna-replication"
  });

  assert.equal(result.status, "unresolved");

  if (result.status === "unresolved") {
    assert.equal(result.provenance.length, 0);
    assert.ok(result.reason.includes("threshold"));
  }
});

test("registry can be filtered to entries mapped to current process packs", () => {
  const entries = registryEntriesForPacks(canonicalEntityProcessPacks);

  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => entry.identifiers.internalProcessPackIds.length > 0));
});

test("future external adapters can contribute validated candidates", async () => {
  const result = await resolveBiologicalEntity(
    "external kinase",
    {},
    {
      entries: [],
      adapters: [
        {
          id: "mock-adapter",
          lookup: async () => [
            {
              id: "external-kinase",
              canonicalName: "External kinase",
              broad: false,
              kind: "enzyme",
              aliases: ["external kinase"],
              identifiers: {
                uniprot: ["P00000"],
                geneOntology: ["GO:0016301"],
                internalProcessPackIds: []
              },
              organisms: [{ label: "cellular organisms", ncbiTaxonomyId: "131567" }],
              contexts: ["external"],
              provenance: [{
                source: "external-adapter",
                sourceId: "mock-adapter",
                matchedAlias: "external kinase",
                normalizedAlias: "external kinase",
                note: "Mock external adapter result."
              }]
            }
          ]
        }
      ]
    }
  );

  assert.equal(result.status, "resolved");
});

test("local registry exposes provider-neutral identifier fields", () => {
  for (const entry of localBiologicalEntityRegistry.entries) {
    assert.ok("uniprot" in entry.identifiers || entry.identifiers.uniprot === undefined);
    assert.ok("geneOntology" in entry.identifiers || entry.identifiers.geneOntology === undefined);
    assert.ok("chebi" in entry.identifiers || entry.identifiers.chebi === undefined);
    assert.ok("reactome" in entry.identifiers || entry.identifiers.reactome === undefined);
    assert.ok("ncbiTaxonomy" in entry.identifiers || entry.identifiers.ncbiTaxonomy === undefined);
    assert.ok("pdb" in entry.identifiers || entry.identifiers.pdb === undefined);
    assert.ok(Array.isArray(entry.identifiers.internalProcessPackIds));
    assert.ok(entry.provenance.length > 0);
  }
});
