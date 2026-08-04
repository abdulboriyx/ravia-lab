import type { BiologicalProcessPack } from "./model.ts";
import { dnaReplicationPack } from "./dna-process.ts";
import { eukaryoticTranscriptionPack } from "./transcription-process.ts";

export type ProviderNeutralIdentifiers = {
  uniprot?: string[];
  geneOntology?: string[];
  chebi?: string[];
  reactome?: string[];
  ncbiTaxonomy?: string[];
  pdb?: string[];
  internalProcessPackIds: Array<{
    packId: string;
    entityId: string;
  }>;
};

export type CanonicalEntityProvenance = {
  source: "local-curated" | "external-adapter";
  sourceId: string;
  matchedAlias: string;
  normalizedAlias: string;
  note: string;
};

export type CanonicalBiologicalEntity = {
  id: string;
  canonicalName: string;
  broad: boolean;
  kind: "molecule" | "enzyme" | "protein" | "strand" | "fragment" | "process" | "complex";
  aliases: string[];
  identifiers: ProviderNeutralIdentifiers;
  organisms: Array<{
    label: string;
    ncbiTaxonomyId: string;
  }>;
  contexts: string[];
  provenance: CanonicalEntityProvenance[];
};

export type EntityResolutionCandidate = {
  entity: CanonicalBiologicalEntity;
  confidence: number;
  matchedAliases: string[];
  provenance: CanonicalEntityProvenance[];
  contextMatched: boolean;
  organismMatched: boolean;
};

export type EntityResolutionResult =
  | {
      status: "resolved";
      query: string;
      normalizedQuery: string;
      canonicalEntity: CanonicalBiologicalEntity;
      confidence: number;
      candidates: EntityResolutionCandidate[];
      ambiguity: string[];
      provenance: CanonicalEntityProvenance[];
    }
  | {
      status: "ambiguous";
      query: string;
      normalizedQuery: string;
      candidates: EntityResolutionCandidate[];
      ambiguity: string[];
      provenance: CanonicalEntityProvenance[];
    }
  | {
      status: "unresolved";
      query: string;
      normalizedQuery: string;
      candidates: EntityResolutionCandidate[];
      reason: string;
      provenance: CanonicalEntityProvenance[];
    };

export type EntityResolutionContext = {
  processPackId?: string;
  biologicalContext?: string;
  organismTaxonomyId?: string;
};

export type EntityResolverAdapter = {
  id: string;
  lookup: (
    normalizedQuery: string,
    context: EntityResolutionContext
  ) => Promise<CanonicalBiologicalEntity[]>;
};

export type EntityResolutionRegistry = {
  entries: CanonicalBiologicalEntity[];
  adapters: EntityResolverAdapter[];
};

const RESOLUTION_THRESHOLD = 0.72;
const AMBIGUITY_DELTA = 0.07;

const aliasTokenMap: Record<string, string> = {
  polymerases: "polymerase",
  pol: "polymerase",
  iii: "3",
  ii: "2",
  alpha: "alpha",
  copied: "copy",
  copying: "copy",
  strands: "strand",
  templates: "template",
  non: "non"
};

export const localBiologicalEntityRegistry: EntityResolutionRegistry = {
  entries: [
    canonicalEntity({
      id: "broad-polymerase",
      canonicalName: "Polymerase",
      broad: true,
      kind: "enzyme",
      aliases: ["polymerase", "polymerases"],
      identifiers: { geneOntology: ["GO:0034061"], internalProcessPackIds: [] },
      organisms: [
        organism("cellular organisms", "131567")
      ],
      contexts: ["general biology"],
      note: "Broad class; requires DNA/RNA type or organism/process context to resolve specifically."
    }),
    canonicalEntity({
      id: "dna-polymerase-general",
      canonicalName: "DNA polymerase",
      broad: true,
      kind: "enzyme",
      aliases: ["dna polymerase", "dna pol", "polymerase"],
      identifiers: {
        geneOntology: ["GO:0003887"],
        internalProcessPackIds: [{ packId: "dna-replication", entityId: "dna-polymerase" }]
      },
      organisms: [organism("cellular organisms", "131567")],
      contexts: ["general DNA replication", "bacterial chromosome replication", "eukaryotic chromosome replication"],
      note: "General DNA polymerase entity used by the DNA replication process pack."
    }),
    canonicalEntity({
      id: "bacterial-dna-polymerase-iii",
      canonicalName: "Bacterial DNA polymerase III holoenzyme",
      broad: false,
      kind: "complex",
      aliases: ["bacterial dna polymerase iii", "dna polymerase iii", "pol iii", "dna pol iii"],
      identifiers: {
        geneOntology: ["GO:0003887"],
        ncbiTaxonomy: ["2"],
        internalProcessPackIds: [{ packId: "dna-replication", entityId: "dna-polymerase" }]
      },
      organisms: [organism("Bacteria", "2"), organism("Escherichia coli", "562")],
      contexts: ["bacterial chromosome replication"],
      note: "Specific bacterial replication polymerase class mapped back to the pack's generic DNA polymerase entity."
    }),
    canonicalEntity({
      id: "eukaryotic-polymerase-alpha",
      canonicalName: "Eukaryotic DNA polymerase alpha-primase",
      broad: false,
      kind: "complex",
      aliases: ["eukaryotic polymerase alpha", "polymerase alpha", "dna polymerase alpha", "pol alpha", "pol α", "polymerase α"],
      identifiers: {
        geneOntology: ["GO:0003887"],
        ncbiTaxonomy: ["2759"],
        internalProcessPackIds: [
          { packId: "dna-replication", entityId: "dna-polymerase" },
          { packId: "dna-replication", entityId: "primase" }
        ]
      },
      organisms: [organism("Eukaryota", "2759")],
      contexts: ["eukaryotic chromosome replication"],
      note: "Specific eukaryotic polymerase alpha-primase complex represented schematically by generic replication polymerase and primase entities."
    }),
    canonicalEntity({
      id: "rna-polymerase-ii",
      canonicalName: "RNA polymerase II",
      broad: false,
      kind: "enzyme",
      aliases: ["rna polymerase ii", "rna pol ii", "pol ii", "polymerase ii"],
      identifiers: {
        geneOntology: ["GO:0003899", "GO:0006366"],
        ncbiTaxonomy: ["2759"],
        reactome: ["R-HSA-73776"],
        internalProcessPackIds: [{ packId: "eukaryotic-transcription", entityId: "rna-polymerase-ii" }]
      },
      organisms: [organism("Eukaryota", "2759"), organism("Homo sapiens", "9606")],
      contexts: ["eukaryotic protein-coding gene transcription", "general eukaryotic transcription"],
      note: "Specific eukaryotic transcription polymerase used by the transcription process pack."
    }),
    canonicalEntity({
      id: "promoter",
      canonicalName: "Promoter",
      broad: true,
      kind: "molecule",
      aliases: ["promoter", "core promoter", "promoter region"],
      identifiers: {
        geneOntology: ["GO:0006352"],
        internalProcessPackIds: [{ packId: "eukaryotic-transcription", entityId: "promoter" }]
      },
      organisms: [organism("Eukaryota", "2759")],
      contexts: ["eukaryotic protein-coding gene transcription", "general eukaryotic transcription"],
      note: "Regulatory DNA region represented schematically in the transcription process pack."
    }),
    canonicalEntity({
      id: "template-strand-transcription",
      canonicalName: "Template DNA strand",
      broad: false,
      kind: "strand",
      aliases: ["template strand", "antisense strand", "transcribed strand"],
      identifiers: {
        chebi: ["CHEBI:16991"],
        internalProcessPackIds: [
          { packId: "eukaryotic-transcription", entityId: "template-strand" },
          { packId: "dna-replication", entityId: "parental-strand-5to3" },
          { packId: "dna-replication", entityId: "parental-strand-3to5" }
        ]
      },
      organisms: [organism("cellular organisms", "131567")],
      contexts: [
        "general DNA replication",
        "bacterial chromosome replication",
        "eukaryotic chromosome replication",
        "eukaryotic protein-coding gene transcription",
        "general eukaryotic transcription"
      ],
      note: "Template-strand meaning depends on process context; provenance records all pack mappings."
    }),
    canonicalEntity({
      id: "coding-strand",
      canonicalName: "Coding DNA strand",
      broad: false,
      kind: "strand",
      aliases: ["coding strand", "sense strand", "non template strand", "non-template strand"],
      identifiers: {
        chebi: ["CHEBI:16991"],
        internalProcessPackIds: [{ packId: "eukaryotic-transcription", entityId: "coding-strand" }]
      },
      organisms: [organism("Eukaryota", "2759")],
      contexts: ["eukaryotic protein-coding gene transcription", "general eukaryotic transcription"],
      note: "Coding-strand concept in the transcription process pack."
    }),
    canonicalEntity({
      id: "rna-transcript",
      canonicalName: "Growing RNA transcript",
      broad: false,
      kind: "strand",
      aliases: ["growing rna", "growing rna transcript", "nascent rna", "rna transcript"],
      identifiers: {
        chebi: ["CHEBI:33697"],
        internalProcessPackIds: [{ packId: "eukaryotic-transcription", entityId: "growing-rna-transcript" }]
      },
      organisms: [organism("Eukaryota", "2759")],
      contexts: ["eukaryotic protein-coding gene transcription", "general eukaryotic transcription"],
      note: "Nascent transcript in the transcription process pack."
    }),
    canonicalEntity({
      id: "helicase",
      canonicalName: "DNA helicase",
      broad: true,
      kind: "enzyme",
      aliases: ["helicase", "dna helicase"],
      identifiers: {
        geneOntology: ["GO:0003678"],
        internalProcessPackIds: [{ packId: "dna-replication", entityId: "helicase" }]
      },
      organisms: [organism("cellular organisms", "131567")],
      contexts: ["general DNA replication", "bacterial chromosome replication", "eukaryotic chromosome replication"],
      note: "Generic DNA helicase represented in the replication pack."
    }),
    canonicalEntity({
      id: "dna-ligase",
      canonicalName: "DNA ligase",
      broad: true,
      kind: "enzyme",
      aliases: ["ligase", "dna ligase"],
      identifiers: {
        geneOntology: ["GO:0003909"],
        internalProcessPackIds: [{ packId: "dna-replication", entityId: "ligase" }]
      },
      organisms: [organism("cellular organisms", "131567")],
      contexts: ["general DNA replication", "bacterial chromosome replication", "eukaryotic chromosome replication"],
      note: "Generic DNA ligase represented in the replication pack."
    })
  ],
  adapters: []
};

export async function resolveBiologicalEntity(
  query: string,
  context: EntityResolutionContext = {},
  registry = localBiologicalEntityRegistry
): Promise<EntityResolutionResult> {
  const normalizedQuery = normalizeEntityAlias(query);

  if (!normalizedQuery) {
    return {
      status: "unresolved",
      query,
      normalizedQuery,
      candidates: [],
      reason: "No entity text was provided.",
      provenance: []
    };
  }

  const localCandidates = scoreEntities(normalizedQuery, registry.entries, context);
  const adapterEntries = (await Promise.all(
    registry.adapters.map((adapter) => adapter.lookup(normalizedQuery, context))
  )).flat();
  const adapterCandidates = scoreEntities(normalizedQuery, adapterEntries, context);
  const candidates = [...localCandidates, ...adapterCandidates]
    .filter((candidate) => candidate.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
  const provenance = candidates.flatMap((candidate) => candidate.provenance);
  const top = candidates[0];
  const second = candidates[1];

  if (!top || top.confidence < RESOLUTION_THRESHOLD) {
    return {
      status: "unresolved",
      query,
      normalizedQuery,
      candidates,
      reason: "No canonical entity exceeded the resolution confidence threshold.",
      provenance
    };
  }

  const ambiguity = [
    ...ambiguityReasons(top, second),
    ...crossProcessAmbiguityReasons(top, context)
  ];

  if (ambiguity.length > 0 || top.entity.broad) {
    return {
      status: "ambiguous",
      query,
      normalizedQuery,
      candidates,
      ambiguity: top.entity.broad
        ? [...ambiguity, `"${top.entity.canonicalName}" is a broad term and needs process, organism, or molecular subtype context.`]
        : ambiguity,
      provenance
    };
  }

  return {
    status: "resolved",
    query,
    normalizedQuery,
    canonicalEntity: top.entity,
    confidence: top.confidence,
    candidates,
    ambiguity: [],
    provenance: top.provenance
  };
}

export function resolveBiologicalEntityLocal(
  query: string,
  context: EntityResolutionContext = {},
  registry = localBiologicalEntityRegistry
) {
  const normalizedQuery = normalizeEntityAlias(query);
  const candidates = scoreEntities(normalizedQuery, registry.entries, context)
    .filter((candidate) => candidate.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
  const top = candidates[0];
  const second = candidates[1];
  const provenance = candidates.flatMap((candidate) => candidate.provenance);

  if (!top || top.confidence < RESOLUTION_THRESHOLD) {
    return {
      status: "unresolved" as const,
      query,
      normalizedQuery,
      candidates,
      reason: "No canonical entity exceeded the resolution confidence threshold.",
      provenance
    };
  }

  const ambiguity = [
    ...ambiguityReasons(top, second),
    ...crossProcessAmbiguityReasons(top, context)
  ];

  if (ambiguity.length > 0 || top.entity.broad) {
    return {
      status: "ambiguous" as const,
      query,
      normalizedQuery,
      candidates,
      ambiguity: top.entity.broad
        ? [...ambiguity, `"${top.entity.canonicalName}" is a broad term and needs process, organism, or molecular subtype context.`]
        : ambiguity,
      provenance
    };
  }

  return {
    status: "resolved" as const,
    query,
    normalizedQuery,
    canonicalEntity: top.entity,
    confidence: top.confidence,
    candidates,
    ambiguity: [],
    provenance: top.provenance
  };
}

export function normalizeEntityAlias(value: string) {
  return value
    .toLowerCase()
    .replace(/[α]/g, "alpha")
    .replace(/[β]/g, "beta")
    .replace(/[γ]/g, "gamma")
    .replace(/[′’`]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => aliasTokenMap[token] ?? token)
    .join(" ");
}

export function registryEntriesForPacks(
  packs: BiologicalProcessPack[],
  registry = localBiologicalEntityRegistry
) {
  const packIds = new Set(packs.map((pack) => pack.id));

  return registry.entries.filter((entry) =>
    entry.identifiers.internalProcessPackIds.some((mapping) => packIds.has(mapping.packId))
  );
}

function scoreEntities(
  normalizedQuery: string,
  entries: CanonicalBiologicalEntity[],
  context: EntityResolutionContext
): EntityResolutionCandidate[] {
  return entries.map((entity) => {
    const aliasScores = entity.aliases.map((alias) => ({
      alias,
      normalizedAlias: normalizeEntityAlias(alias),
      score: aliasScore(normalizedQuery, normalizeEntityAlias(alias))
    }));
    const bestAlias = aliasScores.sort((a, b) => b.score - a.score)[0];
    const contextMatched = matchesContext(entity, context);
    const organismMatched = matchesOrganism(entity, context);
    const processMatched = matchesProcess(entity, context);
    let confidence = bestAlias?.score ?? 0;

    if (confidence > 0) {
      confidence += contextMatched ? 0.08 : 0;
      confidence += organismMatched ? 0.08 : 0;
      confidence += processMatched ? 0.08 : 0;
      confidence -= entity.broad && !context.biologicalContext && !context.organismTaxonomyId && !context.processPackId ? 0.12 : 0;
    }

    confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(3))));

    return {
      entity,
      confidence,
      matchedAliases: bestAlias?.score ? [bestAlias.alias] : [],
      provenance: bestAlias?.score
        ? [{
            source: "local-curated" as const,
            sourceId: entity.id,
            matchedAlias: bestAlias.alias,
            normalizedAlias: bestAlias.normalizedAlias,
            note: entity.provenance[0]?.note ?? "Local curated entity mapping."
          }]
        : [],
      contextMatched,
      organismMatched
    };
  });
}

function aliasScore(query: string, alias: string) {
  if (!query || !alias) {
    return 0;
  }

  if (query === alias) {
    return 0.92;
  }

  if (query.includes(alias) || alias.includes(query)) {
    const shorter = Math.min(query.length, alias.length);
    const longer = Math.max(query.length, alias.length);
    return Math.max(0.62, shorter / longer * 0.9);
  }

  const queryTokens = query.split(" ");
  const aliasTokens = alias.split(" ");
  const overlap = aliasTokens.filter((token) => queryTokens.includes(token)).length;

  if (overlap === 0) {
    return 0;
  }

  return overlap / aliasTokens.length * 0.72;
}

function matchesContext(entity: CanonicalBiologicalEntity, context: EntityResolutionContext) {
  return Boolean(
    context.biologicalContext &&
    entity.contexts.map(normalizeEntityAlias).includes(normalizeEntityAlias(context.biologicalContext))
  );
}

function matchesOrganism(entity: CanonicalBiologicalEntity, context: EntityResolutionContext) {
  if (!context.organismTaxonomyId) {
    return false;
  }

  return entity.organisms.some((organismItem) =>
    organismItem.ncbiTaxonomyId === context.organismTaxonomyId ||
    organismItem.ncbiTaxonomyId === "131567"
  );
}

function matchesProcess(entity: CanonicalBiologicalEntity, context: EntityResolutionContext) {
  return Boolean(
    context.processPackId &&
    entity.identifiers.internalProcessPackIds.some((mapping) => mapping.packId === context.processPackId)
  );
}

function ambiguityReasons(
  top: EntityResolutionCandidate,
  second: EntityResolutionCandidate | undefined
) {
  if (!second) {
    return [];
  }

  if (top.confidence - second.confidence <= AMBIGUITY_DELTA) {
    return [
      `Ambiguous between "${top.entity.canonicalName}" and "${second.entity.canonicalName}".`
    ];
  }

  return [];
}

function crossProcessAmbiguityReasons(
  top: EntityResolutionCandidate,
  context: EntityResolutionContext
) {
  const mappedPacks = new Set(
    top.entity.identifiers.internalProcessPackIds.map((mapping) => mapping.packId)
  );

  if (!context.processPackId && mappedPacks.size > 1) {
    return [
      `"${top.entity.canonicalName}" maps to multiple process packs; provide process context to resolve the internal entity.`
    ];
  }

  return [];
}

function canonicalEntity(input: Omit<CanonicalBiologicalEntity, "provenance"> & { note: string }): CanonicalBiologicalEntity {
  return {
    ...input,
    aliases: Array.from(new Set([input.canonicalName, ...input.aliases])),
    identifiers: {
      ...input.identifiers,
      internalProcessPackIds: input.identifiers.internalProcessPackIds
    },
    provenance: [{
      source: "local-curated",
      sourceId: input.id,
      matchedAlias: input.canonicalName,
      normalizedAlias: normalizeEntityAlias(input.canonicalName),
      note: input.note
    }]
  };
}

function organism(label: string, ncbiTaxonomyId: string) {
  return { label, ncbiTaxonomyId };
}

export const canonicalEntityProcessPacks = [
  dnaReplicationPack,
  eukaryoticTranscriptionPack
];
