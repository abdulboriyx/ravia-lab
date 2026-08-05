import type { SpatialSessionState } from "./model.ts";
import {
  createRcsbPdbAdapter,
  normalizedRecordToClaimProvenance
} from "./scientific-data-providers.ts";
import type {
  NormalizedScientificDataRecord,
  StructureWarning
} from "./scientific-data-providers.ts";

export type CuratedStructureMapping = {
  processPackId: string;
  entityId: string;
  pdbId: string;
  entityLabel: string;
  assemblyId: string;
  useBiologicalAssembly: boolean;
  suitability: "suitable-with-warnings" | "unsuitable";
  selectionRationale: string;
};

export type ResolvedStructureView =
  | {
      supported: true;
      mapping: CuratedStructureMapping;
      record: NormalizedScientificDataRecord;
      viewerUrl: string;
      warnings: StructureWarning[];
    }
  | {
      supported: false;
      reason: string;
      warnings: StructureWarning[];
    };

const curatedStructureMappings: CuratedStructureMapping[] = [
  {
    processPackId: "eukaryotic-transcription",
    entityId: "rna-polymerase-ii",
    entityLabel: "RNA polymerase II",
    pdbId: "5XOG",
    assemblyId: "1",
    useBiologicalAssembly: true,
    suitability: "suitable-with-warnings",
    selectionRationale:
      "Experimentally determined RNA polymerase II elongation complex with DNA/RNA chains and author-assigned biological assembly metadata."
  }
];

export function resolveStructureForSession(session: SpatialSessionState): ResolvedStructureView {
  const model = session.activeModel;

  if (!model || !session.selectedProcessPackId) {
    return unsupportedStructure("Load a supported process before requesting molecular structure.");
  }

  const selectedEntityIds = session.selectedEntities.length > 0
    ? session.selectedEntities
    : model.entities.map((entity) => entity.id);
  const mapping = curatedStructureMappings.find((item) =>
    item.processPackId === session.selectedProcessPackId &&
    selectedEntityIds.includes(item.entityId)
  ) ?? curatedStructureMappings.find((item) =>
    item.processPackId === session.selectedProcessPackId &&
    model.entities.some((entity) => entity.id === item.entityId)
  );

  if (!mapping) {
    return unsupportedStructure(
      "No reviewed PDB structure has been curated for the selected process entity yet."
    );
  }

  const record = createRcsbPdbAdapter()
    .fixture({ providerRecordId: mapping.pdbId })[0];

  if (!record?.structure || !record.evidence.structuralDataAvailable) {
    return unsupportedStructure(
      `The curated PDB mapping for ${mapping.entityLabel} is missing usable normalized structure metadata.`
    );
  }

  if (mapping.suitability === "unsuitable") {
    return {
      supported: false,
      reason: "The curated structure exists but is not suitable for this representation.",
      warnings: [
        ...record.structure.warnings,
        { code: "unsuitable-structure", message: "The structure was marked unsuitable by the curated registry." }
      ]
    };
  }

  return {
    supported: true,
    mapping,
    record: {
      ...record,
      provenance: {
        ...record.provenance,
        supportedClaim: mapping.selectionRationale
      }
    },
    viewerUrl: molstarViewerUrl(mapping.pdbId, mapping.assemblyId),
    warnings: record.structure.warnings
  };
}

export function molstarViewerUrl(pdbId: string, assemblyId = "1") {
  const params = new URLSearchParams({
    pdb: pdbId.toLowerCase(),
    assemblyId
  });

  return `https://molstar.org/viewer/?${params.toString()}`;
}

export function structureClaimProvenance(view: Extract<ResolvedStructureView, { supported: true }>) {
  return normalizedRecordToClaimProvenance(
    view.record,
    `${view.mapping.entityLabel} is represented by PDB ${view.mapping.pdbId} biological assembly ${view.mapping.assemblyId}.`
  );
}

function unsupportedStructure(reason: string): ResolvedStructureView {
  return {
    supported: false,
    reason,
    warnings: [{
      code: "unsuitable-structure",
      message: reason
    }]
  };
}
