import { resolveEukaryoticPolIIAssetManifest } from "./eukaryotic-pol-ii-asset-selection.ts";
import { resolveEukaryoticPolIIStructuralActorPackage, type StructuralResidueSelector } from "./transcription-structural-actors.ts";
import type { ExpertTranscriptionGeometryMode, ExpertTranscriptionTarget } from "./transcription-expert-controls.ts";

export const inspectableTranscriptionTargets = ["POL_II", "DNA", "RNA", "HYBRID", "MG"] as const;
export type InspectableTranscriptionTarget = (typeof inspectableTranscriptionTargets)[number];
export type TranscriptionProvenanceStatus = "DEPOSITED" | "DERIVED" | "MIXED";
export type TranscriptionProvenanceFidelity =
  | "E0_DEPOSITED"
  | "C0_COMPUTED_FROM_DEPOSITED_ATOMS"
  | "C0_COMPUTED_GAUSSIAN_SURFACE"
  | "S2_DERIVED_KINEMATIC";

export type InspectableTranscriptionProvenance = Readonly<{
  schemaVersion: "1";
  target: InspectableTranscriptionTarget;
  label: string;
  structureId: string;
  assemblyId: string;
  organism: string;
  chains: readonly string[];
  residueRange: string;
  sourceStatus: "DEPOSITED";
  displayStatus: TranscriptionProvenanceStatus;
  fidelity: readonly TranscriptionProvenanceFidelity[];
  experimentallyPresent: readonly string[];
  animatedOrInferred: readonly string[];
  knownLimitations: readonly string[];
  sourceUrl: string;
  sourceTitle: string;
  citation: string;
}>;

const commonLimitations = [
  "5FLM is a single cryo-EM elongation snapshot, not a time-resolved trajectory.",
  "The source is Bos taurus Pol II as a mammalian proxy; it is not a human sequence-identity claim.",
  "The deposited elongation complex does not provide a complete promoter/PIC or termination trajectory.",
] as const;

function selectorRange(selectors: readonly StructuralResidueSelector[]) {
  return selectors.map((selector) => {
    const range = selector.residueRange ? `${selector.residueRange.start}–${selector.residueRange.end}` : "selected chain";
    return `${selector.chainId}:${range}`;
  }).join("; ");
}

function selectorsChains(selectors: readonly StructuralResidueSelector[]) {
  return selectors.map((selector) => selector.chainId);
}

function displayStatus(target: InspectableTranscriptionTarget, geometryMode: ExpertTranscriptionGeometryMode): TranscriptionProvenanceStatus {
  return target === "POL_II" && geometryMode === "DERIVED" ? "DERIVED" : "MIXED";
}

function animatedOrInferred(target: InspectableTranscriptionTarget, geometryMode: ExpertTranscriptionGeometryMode): readonly string[] {
  const motion = geometryMode === "DERIVED"
    ? "Pol II translocation is interpolated along the structure-derived DNA axis; this is a kinematic inference, not a measured trajectory."
    : "No structure-derived translocation is applied; the deposited frame is held static.";
  switch (target) {
    case "POL_II": return [motion, "Protein is rendered as a computed Gaussian surface from selected deposited atoms."];
    case "DNA": return ["DNA visibility, cutaway, and highlighting are presentation controls; no DNA coordinates are moved.", "Nucleotide-block geometry is computed from deposited atom coordinates."];
    case "RNA": return ["Nascent RNA visibility/length is animated from the causal transcription state; residues beyond N:7–20 are not deposited in this asset.", "Nucleotide-block geometry is computed from deposited atom coordinates."];
    case "HYBRID": return ["The hybrid emphasis marker is a derived contact midpoint between selected DNA and RNA geometry.", "The hybrid window itself remains source-bounded to the selected deposited residues."];
    case "MG": return ["The Mg highlight is a derived marker placed at the structure-derived active-center anchor.", "Marker size, glow, and emphasis are presentation choices, not measured atomic radii."];
  }
}

function experimentallyPresent(target: InspectableTranscriptionTarget, packageData: ReturnType<typeof resolveEukaryoticPolIIStructuralActorPackage>): readonly string[] {
  switch (target) {
    case "POL_II": return ["Transcribing mammalian RNA polymerase II complex", `Protein chains ${packageData.selectors.polymeraseChains.join(", ")} in deposited 5FLM coordinates.`];
    case "DNA": return ["DNA substrate in the deposited elongation scaffold", `DNA selectors ${selectorRange(packageData.actors.dna.selectors)}.`];
    case "RNA": return ["Nascent RNA present in the deposited elongation scaffold", `RNA selector ${selectorRange(packageData.actors.rna.selectors)}.`];
    case "HYBRID": return ["A deposited DNA–RNA elongation window", `DNA ${selectorRange(packageData.selectors.hybrid.dna)} plus RNA ${selectorRange(packageData.selectors.hybrid.rna)}.`];
    case "MG": return ["The curated active-center ligand record associated with chain R", "The manifest identifies R as the active-center magnesium ligand; the highlight is anchored to its deposited centroid."];
  }
}

function fidelity(target: InspectableTranscriptionTarget, geometryMode: ExpertTranscriptionGeometryMode): readonly TranscriptionProvenanceFidelity[] {
  switch (target) {
    case "POL_II": return geometryMode === "DERIVED" ? ["E0_DEPOSITED", "C0_COMPUTED_GAUSSIAN_SURFACE", "S2_DERIVED_KINEMATIC"] : ["E0_DEPOSITED", "C0_COMPUTED_GAUSSIAN_SURFACE"];
    case "DNA":
    case "RNA": return ["E0_DEPOSITED", "C0_COMPUTED_FROM_DEPOSITED_ATOMS"];
    case "HYBRID":
    case "MG": return ["E0_DEPOSITED", "C0_COMPUTED_FROM_DEPOSITED_ATOMS"];
  }
}

/**
 * Resolves the inspector from the same manifest and structural actor package
 * used by the renderer. `null` means that no expert object is selected.
 */
export function resolveTranscriptionProvenance(
  target: ExpertTranscriptionTarget,
  geometryMode: ExpertTranscriptionGeometryMode = "DEPOSITED",
): InspectableTranscriptionProvenance | null {
  if (!inspectableTranscriptionTargets.includes(target as InspectableTranscriptionTarget)) return null;
  const manifest = resolveEukaryoticPolIIAssetManifest();
  const packageData = resolveEukaryoticPolIIStructuralActorPackage(manifest);
  const selectedTarget = target as InspectableTranscriptionTarget;
  const actor = selectedTarget === "POL_II" ? packageData.actors.polymerase
    : selectedTarget === "DNA" ? packageData.actors.dna
      : selectedTarget === "RNA" ? packageData.actors.rna
        : selectedTarget === "HYBRID" ? packageData.actors.hybrid
          : null;
  const chains = selectedTarget === "POL_II" ? packageData.selectors.polymeraseChains
    : selectedTarget === "DNA" ? selectorsChains(packageData.actors.dna.selectors)
      : selectedTarget === "RNA" ? selectorsChains(packageData.actors.rna.selectors)
        : selectedTarget === "HYBRID" ? [...selectorsChains(packageData.selectors.hybrid.dna), ...selectorsChains(packageData.selectors.hybrid.rna)]
          : ["R"];
  const residueRange = selectedTarget === "POL_II" ? "A–L: selected protein chains (full actor selection)"
    : selectedTarget === "MG" ? "R: active-center ligand (residue range not applicable)"
      : actor ? selectorRange(actor.selectors) : "R: active-center ligand";
  const label = selectedTarget === "POL_II" ? "Eukaryotic RNA polymerase II" : selectedTarget === "DNA" ? "DNA" : selectedTarget === "RNA" ? "Nascent RNA" : selectedTarget === "HYBRID" ? "RNA–DNA hybrid" : "Active-center Mg";
  return {
    schemaVersion: "1",
    target: selectedTarget,
    label,
    structureId: manifest.structureId,
    assemblyId: manifest.assemblyId ?? "1",
    organism: manifest.organism,
    chains: [...new Set(chains)],
    residueRange,
    sourceStatus: "DEPOSITED",
    displayStatus: displayStatus(selectedTarget, geometryMode),
    fidelity: fidelity(selectedTarget, geometryMode),
    experimentallyPresent: experimentallyPresent(selectedTarget, packageData),
    animatedOrInferred: animatedOrInferred(selectedTarget, geometryMode),
    knownLimitations: [...commonLimitations, "Displayed geometry is a computed visual representation; thickness, opacity, markers, and cutaways are not deposited measurements."],
    sourceUrl: manifest.sourceUrl,
    sourceTitle: manifest.title,
    citation: packageData.source.citation,
  };
}
