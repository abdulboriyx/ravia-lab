import type { TranscriptionActiveSiteFrame, TranscriptionStructuralActorPackage } from "./transcription-structural-actors.ts";

export type PolymeraseRepresentationStatus = "STRUCTURE_DERIVED_PRIMARY" | "STRUCTURAL_POLYMERASE_UNAVAILABLE";

export type PrimaryPolymeraseRepresentation = {
  schemaVersion: "1";
  status: PolymeraseRepresentationStatus;
  sourceId: string;
  structureId: string;
  polymeraseClass: "BACTERIAL_RNAP" | "EUKARYOTIC_POL_II";
  organism: string;
  chainIds: readonly string[];
  frameId: string;
  fidelity: "E0_DEPOSITED" | "S1_CONSTRAINED" | "S2_SCHEMATIC";
  fallbackDisclosure?: string;
};

/** Exact plumbing requirements for the future eukaryotic Pol II source. */
export const eukaryoticPolIIElongationSourceRequirements = {
  status: "NOT_CONFIGURED" as const,
  required: [
    "eukaryotic RNA polymerase II complex",
    "elongation state with DNA",
    "nascent RNA and/or RNA-DNA hybrid",
    "chain/entity metadata and active-center context",
    "deposited provenance and resolution suitable for surface/cartoon",
  ] as const,
  prohibition: "6ALH bacterial RNAP must never satisfy this source requirement",
};

export function resolvePrimaryPolymeraseRepresentation(
  packageValue: TranscriptionStructuralActorPackage,
  frame: TranscriptionActiveSiteFrame,
): PrimaryPolymeraseRepresentation {
  if (packageValue.source.polymeraseClass === "EUKARYOTIC_POL_II" && packageValue.source.structureId === "6ALH") {
    throw new Error("TRANSCRIPTION_SOURCE_CLASS_MISMATCH");
  }
  return {
    schemaVersion: "1",
    status: "STRUCTURE_DERIVED_PRIMARY",
    sourceId: packageValue.source.sourceId,
    structureId: packageValue.source.structureId,
    polymeraseClass: packageValue.source.polymeraseClass,
    organism: packageValue.source.organism,
    chainIds: packageValue.selectors.polymeraseChains,
    frameId: frame.frameId,
    fidelity: packageValue.source.fidelity,
  };
}

export function structuralPolymeraseUnavailable(sourceId: string, frameId: string): PrimaryPolymeraseRepresentation {
  return {
    schemaVersion: "1",
    status: "STRUCTURAL_POLYMERASE_UNAVAILABLE",
    sourceId,
    structureId: "unresolved",
    polymeraseClass: "BACTERIAL_RNAP",
    organism: "unresolved",
    chainIds: [],
    frameId,
    fidelity: "S2_SCHEMATIC",
    fallbackDisclosure: "Deposited polymerase geometry is unavailable; no deposited-looking body is mounted.",
  };
}

