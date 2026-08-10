import assert from "node:assert/strict";
import test from "node:test";
import {
  createRcsbPdbAdapter,
  createScientificDataProviders,
  normalizedRecordToClaimProvenance,
  normalizedRecordToScientificSource
} from "./scientific-data-providers.ts";
import type {
  ProviderHttpResponse,
  ProviderTransport,
  ScientificDataProvider
} from "./scientific-data-providers.ts";

test("scientific data provider registry exposes clean provider interfaces", () => {
  const providers = createScientificDataProviders();
  const providerList: ScientificDataProvider[] = [
    providers.rcsbPdb,
    providers.uniprot,
    providers.reactome,
    providers.biomodels,
    providers.geneOntology,
    providers.chebi
  ];

  assert.deepEqual(providerList.map((provider) => provider.id), [
    "rcsb-pdb",
    "uniprot",
    "reactome",
    "biomodels",
    "gene-ontology",
    "chebi"
  ]);

  for (const provider of providerList) {
    assert.equal(typeof provider.query, "function");
    assert.equal(typeof provider.normalize, "function");
    assert.equal(typeof provider.fixture, "function");
    assert.equal(typeof provider.cache.get, "function");
    assert.ok(provider.rateLimit.requestsPerMinute > 0);
    assert.ok(provider.license.label.length > 0);
    assert.ok(provider.license.url.startsWith("http"));
    assert.ok(provider.version.adapterVersion.length > 0);
    assert.ok(provider.version.providerApiVersion.length > 0);
  }
});

test("RCSB PDB adapter normalizes live-shaped responses before model use", async () => {
  let calls = 0;
  const transport: ProviderTransport = async () => {
    calls += 1;
    return jsonResponse({
      rcsb_id: "1BNA",
      struct: {
        title: "Structure of a B-DNA dodecamer"
      },
      struct_keywords: {
        pdbx_keywords: "DNA"
      },
      rcsb_primary_citation: {
        title: "Structure of a B-DNA dodecamer",
        pdbx_database_id_doi: "10.2210/pdb1bna/pdb",
        rcsb_authors: ["Drew", "Dickerson"]
      },
      rcsb_entry_container_identifiers: {
        reference_sequence_identifiers: [{ database_accession: "P03001" }]
      }
    });
  };
  const provider = createRcsbPdbAdapter({ transport });
  const first = await provider.query({ providerRecordId: "1BNA" });
  const second = await provider.query({ providerRecordId: "1BNA" });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(calls, 1);

  if (first.ok && second.ok) {
    assert.equal(first.fromCache, false);
    assert.equal(second.fromCache, true);
    assert.equal(first.fixtureUsed, false);
    assert.equal(first.records[0].provider, "rcsb-pdb");
    assert.equal(first.records[0].kind, "structure");
    assert.deepEqual(first.records[0].identifiers.pdb, ["1BNA"]);
    assert.equal(first.records[0].evidence.structuralDataAvailable, true);
    assert.equal(first.records[0].rawResponse !== undefined, true);
  }
});

test("RCSB PDB adapter returns typed errors for invalid query, 404, and provider rate limits", async () => {
  const provider = createRcsbPdbAdapter();
  const invalid = await provider.query({});
  assert.equal(invalid.ok, false);

  if (!invalid.ok) {
    assert.equal(invalid.error.code, "invalid-query");
  }

  const notFound = await createRcsbPdbAdapter({
    transport: async () => jsonResponse({ message: "not found" }, 404, false)
  }).query({ providerRecordId: "missing" });
  assert.equal(notFound.ok, false);

  if (!notFound.ok) {
    assert.equal(notFound.error.code, "not-found");
  }

  let nowMs = 0;
  const rateLimitedProvider = createRcsbPdbAdapter({
    now: () => new Date(nowMs),
    transport: async () => jsonResponse({
      rcsb_id: cryptoRandomRecordId(),
      struct: { title: "Synthetic structure response" }
    })
  });

  for (let index = 0; index < 5; index += 1) {
    const result = await rateLimitedProvider.query({ providerRecordId: `T${index}` });
    assert.equal(result.ok, true);
  }

  const limited = await rateLimitedProvider.query({ providerRecordId: "T6" });
  assert.equal(limited.ok, false);

  if (!limited.ok) {
    assert.equal(limited.error.code, "rate-limited");
    assert.ok((limited.error.retryAfterMs ?? 0) > 0);
  }
});

test("fixture-backed adapters return normalized records with provenance, license, and version metadata", async () => {
  const providers = createScientificDataProviders();
  const results = await Promise.all([
    providers.reactome.query({ text: "RNA Polymerase II" }),
    providers.biomodels.query({ text: "action potential model" }),
    providers.chebi.query({ text: "DNA" })
  ]);

  for (const result of results) {
    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.fixtureUsed, true);
      assert.ok(result.records.length > 0);
      const record = result.records[0];
      assert.ok(record.id.startsWith(`${record.provider}:`));
      assert.ok(record.provenance.sourceId.length > 0);
      assert.ok(record.license.requiresAttribution);
      assert.ok(record.version.fixtureVersion);
      assert.equal(record.rawResponse, undefined);
    }
  }
});

test("normalized external data can become internal provenance without exposing provider payloads", async () => {
  const provider = createRcsbPdbAdapter();
  const result = await provider.query({ providerRecordId: "5XOG", useFixture: true });

  assert.equal(result.ok, true);

  if (result.ok) {
    const source = normalizedRecordToScientificSource(result.records[0]);
    const provenance = normalizedRecordToClaimProvenance(
      result.records[0],
      "DNA structural data exists for this PDB entry."
    );

    assert.equal(source.id, result.records[0].provenance.sourceId);
    assert.equal(source.publicationType, "database");
    assert.equal(result.records[0].structure?.biologicalAssemblyPreferred, true);
    assert.equal(result.records[0].evidence.experimental, true);
    assert.equal(provenance.sourceId, source.id);
    assert.equal(provenance.supportType, "interpretation");
    assert.equal("rawResponse" in source, false);
    assert.equal("rawResponse" in provenance, false);
  }
});

function jsonResponse(
  body: unknown,
  status = 200,
  ok = true
): ProviderHttpResponse {
  return {
    ok,
    status,
    json: async () => body,
    headers: {
      get: () => null
    }
  };
}

function cryptoRandomRecordId() {
  return `T${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
