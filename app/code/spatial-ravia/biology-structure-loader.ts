import {
  StructureGroundingError,
  type LoadedGroundedStructure,
  type StructureManifestEntry,
} from "./biology-structure-grounding.ts";
import { applyCuratedChainEntityTypes, deriveStructureGeometry, expandStructureAssembly, parseMolecularStructureAsync, selectStructureChains } from "./biology-structure-parser.ts";

export type CoordinateTextLoader = (url: string) => Promise<string>;

const coordinateCache = new Map<string, Promise<LoadedGroundedStructure>>();

function cacheKey(entry: StructureManifestEntry) {
  return [entry.provider, entry.structureId, entry.assemblyId ?? "asym", entry.format, entry.selectedChains.join(",")].join(":");
}

export const fetchCoordinateText: CoordinateTextLoader = async (url) => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new StructureGroundingError("coordinate-load-failed", `Could not load coordinates from ${url}: ${String(cause)}`);
  }
  if (!response.ok) {
    throw new StructureGroundingError("coordinate-load-failed", `Could not load coordinates from ${url} (${response.status})`);
  }
  return response.text();
};

/** Loads a curated coordinate asset once, then performs deterministic chain selection and coarse geometry derivation. */
export function loadGroundedStructure(
  entry: StructureManifestEntry,
  loadText: CoordinateTextLoader = fetchCoordinateText
): Promise<LoadedGroundedStructure> {
  const key = cacheKey(entry);
  const cached = coordinateCache.get(key);
  if (cached) return cached;

  const load = loadText(entry.assetUrl)
    .then(async (text) => {
      const parsed = await parseMolecularStructureAsync({
        structureId: entry.structureId,
        source: entry.provider,
        format: entry.format,
        text,
        title: entry.title,
        organism: entry.organism,
        assemblyId: entry.assemblyId,
      });
      const requestedStructure = entry.format === "mmcif" && entry.assemblyId && parsed.assemblies?.some((assembly) => assembly.assemblyId === entry.assemblyId)
        ? expandStructureAssembly(parsed, entry.assemblyId)
        : parsed;
      const structure = applyCuratedChainEntityTypes(
        selectStructureChains(requestedStructure, entry.selectedChains),
        entry.chainEntityTypes
      );
      return {
        structure,
        geometry: deriveStructureGeometry(structure, entry),
        provenance: {
          role: entry.role,
          provider: entry.provider,
          structureId: entry.structureId,
          assemblyId: entry.assemblyId,
          selectedChains: entry.selectedChains,
          organism: entry.organism,
          title: entry.title,
          sourceUrl: entry.sourceUrl,
          format: entry.format,
          renderMode: entry.renderMode,
          groundingStatus: "structure-derived" as const,
        },
        groundingStatus: "structure-derived" as const,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof StructureGroundingError) throw error;
      throw new StructureGroundingError("parse-failed", `Could not normalize ${entry.structureId}: ${String(error)}`);
    });
  coordinateCache.set(key, load);
  return load;
}

export function clearGroundedStructureCache() {
  coordinateCache.clear();
}
