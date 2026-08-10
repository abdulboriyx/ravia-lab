export type ScientificSource = {
  id: string;
  title: string;
  authors: string;
  locator: string;
  note: string;
  urlOrDoi: string;
  publicationType: "textbook" | "review" | "database" | "primary-literature" | "documentation";
  accessDate: string;
  license?: string;
};

export type ScientificClaimProvenance = {
  sourceId: string;
  title: string;
  authorsOrInstitution: string;
  urlOrDoi: string;
  publicationType: ScientificSource["publicationType"];
  accessDate: string;
  confidence: number;
  supportedClaim: string;
  supportType: "direct-fact" | "model-assumption" | "interpretation";
  claimStatus: "verified" | "unverified" | "disputed";
  license?: string;
};

export type ScientificDataProviderId =
  | "rcsb-pdb"
  | "uniprot"
  | "reactome"
  | "biomodels"
  | "gene-ontology"
  | "chebi";

export type ScientificDataQuery = {
  text?: string;
  accession?: string;
  providerRecordId?: string;
  organismTaxonomyId?: string;
  entityType?: "structure" | "protein" | "pathway" | "model" | "ontology-term" | "chemical";
  limit?: number;
  useFixture?: boolean;
};

export type NormalizedScientificDataKind =
  | "structure"
  | "protein"
  | "pathway"
  | "quantitative-model"
  | "ontology-term"
  | "chemical";

export type NormalizedScientificDataRecord = {
  id: string;
  provider: ScientificDataProviderId;
  providerRecordId: string;
  kind: NormalizedScientificDataKind;
  canonicalName: string;
  aliases: string[];
  description: string;
  identifiers: {
    pdb?: string[];
    uniprot?: string[];
    reactome?: string[];
    biomodels?: string[];
    geneOntology?: string[];
    chebi?: string[];
    ncbiTaxonomy?: string[];
  };
  organism?: {
    label: string;
    ncbiTaxonomyId?: string;
  };
  evidence: {
    confidence: number;
    structuralDataAvailable: boolean;
    quantitativeDataAvailable: boolean;
    reviewed: boolean;
    experimental: boolean;
    predicted: boolean;
  };
  structure?: NormalizedStructureMetadata;
  provenance: ExternalDataProvenance;
  license: ProviderLicenseMetadata;
  version: ProviderVersionMetadata;
  rawResponse?: unknown;
};

export type NormalizedStructureMetadata = {
  method: string;
  resolutionAngstrom?: number;
  organism: string;
  biologicalAssemblyId?: string;
  biologicalAssemblyPreferred: boolean;
  chains: Array<{
    id: string;
    label: string;
    moleculeType: "protein" | "dna" | "rna" | "ligand" | "other";
  }>;
  ligands: Array<{
    id: string;
    name: string;
    native: boolean;
  }>;
  warnings: StructureWarning[];
};

export type StructureWarning = {
  code:
    | "missing-domains"
    | "engineered-construct"
    | "non-native-ligands"
    | "partial-complex"
    | "static-snapshot"
    | "unsuitable-structure";
  message: string;
};

export type ExternalDataProvenance = {
  sourceId: string;
  title: string;
  authorsOrInstitution: string;
  urlOrDoi: string;
  publicationType: ScientificSource["publicationType"];
  accessDate: string;
  supportedClaim: string;
  confidence: number;
  literalVersusInferred: "literal" | "inferred" | "curated-fixture";
};

export type ProviderLicenseMetadata = {
  label: string;
  url: string;
  requiresAttribution: boolean;
  commercialUse?: "allowed" | "restricted" | "unknown";
};

export type ProviderVersionMetadata = {
  adapterVersion: string;
  providerApiVersion: string;
  fixtureVersion?: string;
  retrievedAt: string;
};

export type ProviderRateLimit = {
  requestsPerMinute: number;
  burst: number;
};

export type ProviderCacheEntry<T> = {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
};

export type ProviderCache<T> = {
  get: (key: string) => T | undefined;
  set: (key: string, value: T, ttlMs?: number) => void;
  clear: () => void;
};

export type ScientificDataProviderErrorCode =
  | "invalid-query"
  | "rate-limited"
  | "network-error"
  | "not-found"
  | "normalization-error"
  | "provider-unavailable";

export type ScientificDataProviderError = {
  code: ScientificDataProviderErrorCode;
  provider: ScientificDataProviderId;
  message: string;
  retryAfterMs?: number;
  cause?: unknown;
};

export type ScientificDataProviderResult =
  | {
      ok: true;
      provider: ScientificDataProviderId;
      records: NormalizedScientificDataRecord[];
      fromCache: boolean;
      fixtureUsed: boolean;
      warnings: string[];
    }
  | {
      ok: false;
      provider: ScientificDataProviderId;
      error: ScientificDataProviderError;
      fromCache: boolean;
      fixtureUsed: boolean;
      warnings: string[];
    };

export type ProviderHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  headers?: {
    get: (name: string) => string | null;
  };
};

export type ProviderTransport = (
  url: string,
  init?: {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<ProviderHttpResponse>;

export type ScientificDataProvider = {
  id: ScientificDataProviderId;
  label: string;
  endpoint: string;
  rateLimit: ProviderRateLimit;
  license: ProviderLicenseMetadata;
  version: Omit<ProviderVersionMetadata, "retrievedAt">;
  cache: ProviderCache<NormalizedScientificDataRecord[]>;
  query: (input: ScientificDataQuery) => Promise<ScientificDataProviderResult>;
  normalize: (raw: unknown, query: ScientificDataQuery) => NormalizedScientificDataRecord[];
  fixture: (query: ScientificDataQuery) => NormalizedScientificDataRecord[];
};

const defaultCacheTtlMs = 1000 * 60 * 60;
const adapterVersion = "0.1.0";

export function createMemoryProviderCache<T>(): ProviderCache<T> {
  const entries = new Map<string, ProviderCacheEntry<T>>();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttlMs = defaultCacheTtlMs) {
      entries.set(key, {
        key,
        value,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttlMs
      });
    },
    clear() {
      entries.clear();
    }
  };
}

export function createScientificDataProviders(options: {
  transport?: ProviderTransport;
  now?: () => Date;
} = {}) {
  return {
    rcsbPdb: createRcsbPdbAdapter(options),
    uniprot: createFixtureAdapter("uniprot", options),
    reactome: createFixtureAdapter("reactome", options),
    biomodels: createFixtureAdapter("biomodels", options),
    geneOntology: createFixtureAdapter("gene-ontology", options),
    chebi: createFixtureAdapter("chebi", options)
  };
}

export function createRcsbPdbAdapter(options: {
  transport?: ProviderTransport;
  now?: () => Date;
} = {}): ScientificDataProvider {
  const now = options.now ?? (() => new Date());
  const cache = createMemoryProviderCache<NormalizedScientificDataRecord[]>();
  const rateLimiter = createRateLimiter({ requestsPerMinute: 30, burst: 5 });
  const transport = options.transport ?? defaultTransport;

  const provider: ScientificDataProvider = {
    id: "rcsb-pdb",
    label: "RCSB Protein Data Bank",
    endpoint: "https://data.rcsb.org/rest/v1/core/entry",
    rateLimit: { requestsPerMinute: 30, burst: 5 },
    license: {
      label: "CC0 1.0 / PDB archive data usage policy",
      url: "https://www.rcsb.org/pages/policies",
      requiresAttribution: true,
      commercialUse: "allowed"
    },
    version: {
      adapterVersion,
      providerApiVersion: "RCSB Data API v1"
    },
    cache,
    async query(input) {
      const validationError = validateProviderQuery("rcsb-pdb", input);
      if (validationError) {
        return providerError("rcsb-pdb", validationError, false, false);
      }

      const key = cacheKey("rcsb-pdb", input);
      const cached = cache.get(key);
      if (cached) {
        return providerOk("rcsb-pdb", cached, true, false, []);
      }

      if (input.useFixture) {
        const records = provider.fixture(input);
        cache.set(key, records);
        return providerOk("rcsb-pdb", records, false, true, ["Offline fixture was used by request."]);
      }

      const rate = rateLimiter.check(now().getTime());
      if (!rate.allowed) {
        return providerError("rcsb-pdb", {
          code: "rate-limited",
          provider: "rcsb-pdb",
          message: "RCSB PDB adapter rate limit reached.",
          retryAfterMs: rate.retryAfterMs
        }, false, false);
      }

      try {
        const recordId = encodeURIComponent((input.providerRecordId ?? input.accession ?? "").toUpperCase());
        const response = await transport(`${provider.endpoint}/${recordId}`);

        if (response.status === 404) {
          return providerError("rcsb-pdb", {
            code: "not-found",
            provider: "rcsb-pdb",
            message: `RCSB PDB record ${recordId} was not found.`
          }, false, false);
        }

        if (response.status === 429) {
          return providerError("rcsb-pdb", {
            code: "rate-limited",
            provider: "rcsb-pdb",
            message: "RCSB PDB returned HTTP 429.",
            retryAfterMs: retryAfterMs(response.headers?.get("retry-after"))
          }, false, false);
        }

        if (!response.ok) {
          return providerError("rcsb-pdb", {
            code: "network-error",
            provider: "rcsb-pdb",
            message: `RCSB PDB request failed with HTTP ${response.status}.`
          }, false, false);
        }

        const records = provider.normalize(await response.json(), input);
        cache.set(key, records);
        return providerOk("rcsb-pdb", records, false, false, []);
      } catch (error) {
        return providerError("rcsb-pdb", {
          code: "network-error",
          provider: "rcsb-pdb",
          message: "RCSB PDB request failed before normalization.",
          cause: error
        }, false, false);
      }
    },
    normalize(raw) {
      const data = raw as Partial<RcsbEntryResponse>;
      const entryId = data.rcsb_id ?? data.entry?.id;
      const title = data.struct?.title ?? data.rcsb_primary_citation?.title;

      if (!entryId || !title) {
        throw new Error("RCSB PDB response is missing entry id or title.");
      }

      const citation = data.rcsb_primary_citation;
      const organism = data.rcsb_entry_info?.polymer_entity_taxonomy_count && data.rcsb_entry_container_identifiers?.polymer_entity_ids?.length
        ? { label: "record organism", ncbiTaxonomyId: undefined }
        : undefined;

      return [{
        id: `rcsb-pdb:${entryId}`,
        provider: "rcsb-pdb",
        providerRecordId: entryId,
        kind: "structure",
        canonicalName: title,
        aliases: [entryId, ...(data.struct_keywords?.pdbx_keywords ? [data.struct_keywords.pdbx_keywords] : [])],
        description: title,
        identifiers: {
          pdb: [entryId],
          uniprot: data.rcsb_entry_container_identifiers?.reference_sequence_identifiers?.map((item) => item.database_accession) ?? []
        },
        organism,
        evidence: {
          confidence: 0.94,
          structuralDataAvailable: true,
          quantitativeDataAvailable: false,
          reviewed: true,
          experimental: true,
          predicted: false
        },
        structure: normalizeRcsbStructureMetadata(data),
        provenance: {
          sourceId: `rcsb-pdb-${entryId.toLowerCase()}`,
          title,
          authorsOrInstitution: citation?.rcsb_authors?.join(", ") ?? "RCSB PDB",
          urlOrDoi: citation?.pdbx_database_id_doi ?? `https://www.rcsb.org/structure/${entryId}`,
          publicationType: "database",
          accessDate: new Date().toISOString().slice(0, 10),
          supportedClaim: `RCSB PDB contains structural entry ${entryId}: ${title}`,
          confidence: 0.94,
          literalVersusInferred: "literal"
        },
        license: provider.license,
        version: {
          ...provider.version,
          retrievedAt: new Date().toISOString()
        },
        rawResponse: data
      }];
    },
    fixture(input) {
      return filterFixtureRecords("rcsb-pdb", input);
    }
  };

  return provider;
}

export function normalizedRecordToScientificSource(record: NormalizedScientificDataRecord): ScientificSource {
  return {
    id: record.provenance.sourceId,
    title: record.provenance.title,
    authors: record.provenance.authorsOrInstitution,
    locator: `${record.provider}:${record.providerRecordId}`,
    note: record.provenance.supportedClaim,
    urlOrDoi: record.provenance.urlOrDoi,
    publicationType: record.provenance.publicationType,
    accessDate: record.provenance.accessDate,
    license: record.license.label
  };
}

export function normalizedRecordToClaimProvenance(
  record: NormalizedScientificDataRecord,
  supportedClaim: string
): ScientificClaimProvenance {
  return {
    sourceId: record.provenance.sourceId,
    title: record.provenance.title,
    authorsOrInstitution: record.provenance.authorsOrInstitution,
    urlOrDoi: record.provenance.urlOrDoi,
    publicationType: record.provenance.publicationType,
    accessDate: record.provenance.accessDate,
    confidence: record.provenance.confidence,
    supportedClaim,
    supportType: record.provenance.literalVersusInferred === "literal" ? "direct-fact" : "interpretation",
    claimStatus: "verified",
    license: record.license.label
  };
}

function createFixtureAdapter(
  id: Exclude<ScientificDataProviderId, "rcsb-pdb">,
  options: { now?: () => Date } = {}
): ScientificDataProvider {
  const cache = createMemoryProviderCache<NormalizedScientificDataRecord[]>();
  const now = options.now ?? (() => new Date());

  return {
    id,
    label: providerMetadata[id].label,
    endpoint: providerMetadata[id].endpoint,
    rateLimit: providerMetadata[id].rateLimit,
    license: providerMetadata[id].license,
    version: {
      adapterVersion,
      providerApiVersion: providerMetadata[id].apiVersion,
      fixtureVersion: "2026-08-05-local"
    },
    cache,
    async query(input) {
      const key = cacheKey(id, input);
      const cached = cache.get(key);
      if (cached) {
        return providerOk(id, cached, true, true, []);
      }

      const records = filterFixtureRecords(id, input).map((record) => ({
        ...record,
        version: {
          ...record.version,
          retrievedAt: now().toISOString()
        }
      }));
      cache.set(key, records);

      return providerOk(
        id,
        records,
        false,
        true,
        [`${providerMetadata[id].label} adapter is fixture-backed until live integration is enabled.`]
      );
    },
    normalize(raw) {
      if (!Array.isArray(raw)) {
        throw new Error(`${id} fixture adapter expects normalized fixture arrays.`);
      }
      return raw as NormalizedScientificDataRecord[];
    },
    fixture(input) {
      return filterFixtureRecords(id, input);
    }
  };
}

function validateProviderQuery(
  provider: ScientificDataProviderId,
  query: ScientificDataQuery
): ScientificDataProviderError | null {
  if (provider === "rcsb-pdb" && !query.providerRecordId && !query.accession) {
    return {
      code: "invalid-query",
      provider,
      message: "RCSB PDB queries require providerRecordId or accession."
    };
  }

  return null;
}

function providerOk(
  provider: ScientificDataProviderId,
  records: NormalizedScientificDataRecord[],
  fromCache: boolean,
  fixtureUsed: boolean,
  warnings: string[]
): ScientificDataProviderResult {
  return { ok: true, provider, records, fromCache, fixtureUsed, warnings };
}

function providerError(
  provider: ScientificDataProviderId,
  error: ScientificDataProviderError,
  fromCache: boolean,
  fixtureUsed: boolean
): ScientificDataProviderResult {
  return { ok: false, provider, error, fromCache, fixtureUsed, warnings: [] };
}

function createRateLimiter(limit: ProviderRateLimit) {
  const timestamps: number[] = [];

  return {
    check(nowMs: number) {
      const windowStart = nowMs - 60_000;
      while (timestamps.length > 0 && timestamps[0] < windowStart) {
        timestamps.shift();
      }

      if (timestamps.length >= limit.requestsPerMinute || timestamps.length >= limit.burst) {
        return {
          allowed: false,
          retryAfterMs: Math.max(1, 60_000 - (nowMs - timestamps[0]))
        };
      }

      timestamps.push(nowMs);
      return { allowed: true, retryAfterMs: 0 };
    }
  };
}

async function defaultTransport(url: string, init?: Parameters<ProviderTransport>[1]) {
  if (typeof fetch !== "function") {
    throw new Error("No fetch implementation is available.");
  }

  return fetch(url, init) as Promise<ProviderHttpResponse>;
}

function cacheKey(provider: ScientificDataProviderId, query: ScientificDataQuery) {
  return `${provider}:${JSON.stringify(query, Object.keys(query).sort())}`;
}

function retryAfterMs(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

function filterFixtureRecords(
  provider: ScientificDataProviderId,
  input: ScientificDataQuery
) {
  const normalizedText = [input.text, input.accession, input.providerRecordId]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const records = offlineFixtures.filter((record) => record.provider === provider);

  if (!normalizedText) {
    return records.slice(0, input.limit ?? 5);
  }

  return records
    .filter((record) =>
      [
        record.providerRecordId,
        record.canonicalName,
        record.description,
        ...record.aliases,
        ...Object.values(record.identifiers).flatMap((value) => value ?? [])
      ].join(" ").toLowerCase().includes(normalizedText) ||
      normalizedText.split(/\s+/).some((token) =>
        token.length > 3 && record.canonicalName.toLowerCase().includes(token)
      )
    )
    .slice(0, input.limit ?? 5);
}

const providerMetadata: Record<Exclude<ScientificDataProviderId, "rcsb-pdb">, {
  label: string;
  endpoint: string;
  apiVersion: string;
  rateLimit: ProviderRateLimit;
  license: ProviderLicenseMetadata;
}> = {
  uniprot: {
    label: "UniProt",
    endpoint: "https://rest.uniprot.org",
    apiVersion: "UniProt REST API",
    rateLimit: { requestsPerMinute: 60, burst: 10 },
    license: {
      label: "CC BY 4.0",
      url: "https://www.uniprot.org/help/license",
      requiresAttribution: true,
      commercialUse: "allowed"
    }
  },
  reactome: {
    label: "Reactome",
    endpoint: "https://reactome.org/ContentService",
    apiVersion: "Reactome Content Service",
    rateLimit: { requestsPerMinute: 60, burst: 10 },
    license: {
      label: "CC BY 4.0",
      url: "https://reactome.org/license",
      requiresAttribution: true,
      commercialUse: "allowed"
    }
  },
  biomodels: {
    label: "BioModels",
    endpoint: "https://www.ebi.ac.uk/biomodels",
    apiVersion: "BioModels REST",
    rateLimit: { requestsPerMinute: 30, burst: 5 },
    license: {
      label: "Provider-specific model licenses",
      url: "https://www.ebi.ac.uk/biomodels/",
      requiresAttribution: true,
      commercialUse: "unknown"
    }
  },
  "gene-ontology": {
    label: "Gene Ontology",
    endpoint: "https://api.geneontology.org/api",
    apiVersion: "GO API",
    rateLimit: { requestsPerMinute: 60, burst: 10 },
    license: {
      label: "CC BY 4.0",
      url: "https://geneontology.org/docs/go-citation-policy/",
      requiresAttribution: true,
      commercialUse: "allowed"
    }
  },
  chebi: {
    label: "ChEBI",
    endpoint: "https://www.ebi.ac.uk/chebi",
    apiVersion: "ChEBI web services",
    rateLimit: { requestsPerMinute: 30, burst: 5 },
    license: {
      label: "CC BY 4.0",
      url: "https://www.ebi.ac.uk/chebi/aboutChebiForward.do",
      requiresAttribution: true,
      commercialUse: "allowed"
    }
  }
};

const offlineFixtures: NormalizedScientificDataRecord[] = [
  fixtureRecord({
    provider: "rcsb-pdb",
    providerRecordId: "1ZF5",
    kind: "structure",
    canonicalName: "B-DNA dodecamer crystal structure",
    aliases: ["B-DNA", "DNA double helix", "1ZF5"],
    description: "Reviewed fixture for the deposited B-DNA structure used by the Spatial Ravia molecular viewer.",
    identifiers: { pdb: ["1ZF5"], chebi: ["CHEBI:16991"] },
    structuralDataAvailable: true,
    quantitativeDataAvailable: false,
    structure: {
      method: "X-RAY DIFFRACTION",
      resolutionAngstrom: 1.55,
      organism: "Synthetic DNA construct",
      biologicalAssemblyId: "1",
      biologicalAssemblyPreferred: true,
      chains: [
        { id: "A", label: "DNA strand A", moleculeType: "dna" },
        { id: "B", label: "DNA strand B", moleculeType: "dna" }
      ],
      ligands: [],
      warnings: [
        { code: "static-snapshot", message: "The structure is a static experimental snapshot and does not represent DNA dynamics." },
        { code: "static-snapshot", message: "The deposited coordinates are a short B-DNA construct, not a full chromosome." }
      ]
    },
    sourceTitle: "RCSB PDB entry 1ZF5",
    urlOrDoi: "https://doi.org/10.2210/pdb1ZF5/pdb",
    license: {
      label: "CC0 1.0 / PDB archive data usage policy",
      url: "https://www.rcsb.org/pages/policies",
      requiresAttribution: true,
      commercialUse: "allowed"
    }
  }),
  fixtureRecord({
    provider: "chebi",
    providerRecordId: "CHEBI:16991",
    kind: "chemical",
    canonicalName: "Deoxyribonucleic acid",
    aliases: ["DNA", "deoxyribonucleic acid"],
    description: "Chemical entity fixture for DNA.",
    identifiers: { chebi: ["CHEBI:16991"] },
    structuralDataAvailable: false,
    quantitativeDataAvailable: false,
    sourceTitle: "ChEBI CHEBI:16991",
    urlOrDoi: "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:16991",
    license: providerMetadata.chebi.license
  })
];

function fixtureRecord(input: {
  provider: ScientificDataProviderId;
  providerRecordId: string;
  kind: NormalizedScientificDataKind;
  canonicalName: string;
  aliases: string[];
  description: string;
  identifiers: NormalizedScientificDataRecord["identifiers"];
  structuralDataAvailable: boolean;
  quantitativeDataAvailable: boolean;
  sourceTitle: string;
  urlOrDoi: string;
  license: ProviderLicenseMetadata;
  structure?: NormalizedStructureMetadata;
}): NormalizedScientificDataRecord {
  const sourceId = `${input.provider}-${input.providerRecordId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return {
    id: `${input.provider}:${input.providerRecordId}`,
    provider: input.provider,
    providerRecordId: input.providerRecordId,
    kind: input.kind,
    canonicalName: input.canonicalName,
    aliases: input.aliases,
    description: input.description,
    identifiers: input.identifiers,
    evidence: {
      confidence: 0.86,
      structuralDataAvailable: input.structuralDataAvailable,
      quantitativeDataAvailable: input.quantitativeDataAvailable,
      reviewed: true,
      experimental: input.structuralDataAvailable,
      predicted: false
    },
    structure: input.structure,
    provenance: {
      sourceId,
      title: input.sourceTitle,
      authorsOrInstitution: providerLabel(input.provider),
      urlOrDoi: input.urlOrDoi,
      publicationType: "database",
      accessDate: "2026-08-05",
      supportedClaim: input.description,
      confidence: 0.86,
      literalVersusInferred: "curated-fixture"
    },
    license: input.license,
    version: {
      adapterVersion,
      providerApiVersion: providerApiVersion(input.provider),
      fixtureVersion: "2026-08-05-local",
      retrievedAt: "2026-08-05T00:00:00.000Z"
    }
  };
}

function providerLabel(provider: ScientificDataProviderId) {
  if (provider === "rcsb-pdb") {
    return "RCSB PDB";
  }

  return providerMetadata[provider].label;
}

function providerApiVersion(provider: ScientificDataProviderId) {
  if (provider === "rcsb-pdb") {
    return "RCSB Data API v1";
  }

  return providerMetadata[provider].apiVersion;
}

type RcsbEntryResponse = {
  rcsb_id?: string;
  entry?: {
    id?: string;
  };
  struct?: {
    title?: string;
  };
  struct_keywords?: {
    pdbx_keywords?: string;
  };
  rcsb_primary_citation?: {
    title?: string;
    pdbx_database_id_doi?: string;
    rcsb_authors?: string[];
  };
  rcsb_entry_info?: {
    polymer_entity_taxonomy_count?: number;
    experimental_method?: string;
    resolution_combined?: number[];
  };
  exptl?: Array<{
    method?: string;
  }>;
  rcsb_entry_container_identifiers?: {
    polymer_entity_ids?: string[];
    reference_sequence_identifiers?: Array<{
      database_accession: string;
    }>;
  };
};

function normalizeRcsbStructureMetadata(data: Partial<RcsbEntryResponse>): NormalizedStructureMetadata {
  return {
    method: data.exptl?.[0]?.method ?? data.rcsb_entry_info?.experimental_method ?? "experimental structure",
    resolutionAngstrom: data.rcsb_entry_info?.resolution_combined?.[0],
    organism: "reported by RCSB entry",
    biologicalAssemblyId: "1",
    biologicalAssemblyPreferred: true,
    chains: [],
    ligands: [],
    warnings: [{
      code: "static-snapshot",
      message: "A PDB entry is a static structural snapshot and does not represent full process dynamics."
    }]
  };
}
