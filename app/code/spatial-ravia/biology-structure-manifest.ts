import {
  type StructureGroundingProvenance,
  type StructureManifestEntry,
} from "./biology-structure-grounding.ts";

export const canonicalReplicationSystem =
  "structure-grounded bacterial replication fork V1";

export const structureManifest: StructureManifestEntry[] = [
  {
    role: "replicative-helicase",
    semanticEntityIds: ["helicase"],
    provider: "rcsb-pdb",
    structureId: "9DLS",
    assetUrl: "/spatial-ravia/structures/9DLS.pdb",
    format: "pdb",
    assemblyId: "1",
    title: "Vibrio cholerae DnaB bound to ssDNA",
    canonicalSystem: canonicalReplicationSystem,
    organism: "Vibrio cholerae O1",
    sourceUrl: "https://www.rcsb.org/structure/9DLS",
    selectedChains: ["A", "B", "C", "D", "E", "F", "G"],
    renderMode: "residue-centroid-cloud",
    coarseGrainStride: 2,
    anchors: [
      { id: "channel-center", kind: "chain-centroid", chainIds: ["G"] },
      { id: "duplex-entry", kind: "nucleic-axis", chainId: "G", at: "start", sampleWindow: 2 },
      { id: "ssdna-exit", kind: "nucleic-axis", chainId: "G", at: "end", sampleWindow: 2 },
    ],
    fallback: {
      status: "structure-guided",
      reason: "Fall back to the prior explanatory helicase if coordinate loading fails.",
    },
  },
  {
    role: "dna-polymerase",
    semanticEntityIds: ["polymerase"],
    provider: "rcsb-pdb",
    structureId: "3BDP",
    assetUrl: "/spatial-ravia/structures/3BDP.pdb",
    format: "pdb",
    assemblyId: "1",
    title: "DNA polymerase I / DNA complex",
    canonicalSystem: canonicalReplicationSystem,
    organism: "Geobacillus stearothermophilus",
    sourceUrl: "https://www.rcsb.org/structure/3BDP",
    selectedChains: ["A", "P", "T"],
    renderMode: "residue-centroid-cloud",
    coarseGrainStride: 1,
    anchors: [
      { id: "active-center", kind: "residue-range-centroid", chainId: "A", startResidue: 610, endResidue: 650 },
      { id: "template-entry", kind: "nucleic-axis", chainId: "T", at: "start", sampleWindow: 1 },
      { id: "product-exit", kind: "nucleic-axis", chainId: "P", at: "end", sampleWindow: 1 },
      { id: "dna-center", kind: "chain-centroid", chainIds: ["P", "T"] },
    ],
    fallback: {
      status: "structure-guided",
      reason: "Fall back to the prior explanatory polymerase if coordinate loading fails.",
    },
  },
  {
    role: "rna-polymerase",
    semanticEntityIds: ["rna-polymerase"],
    provider: "rcsb-pdb",
    structureId: "6ALH",
    assetUrl: "/spatial-ravia/structures/6ALH.pdb",
    format: "pdb",
    assemblyId: "1",
    title: "E. coli RNA polymerase elongation complex",
    canonicalSystem: "structure-grounded bacterial transcription V1",
    organism: "Escherichia coli K-12",
    sourceUrl: "https://www.rcsb.org/structure/6ALH",
    selectedChains: ["A", "B", "R", "G", "H", "I", "J", "K"],
    chainEntityTypes: { A: "dna", B: "dna", R: "rna", G: "protein", H: "protein", I: "protein", J: "protein", K: "protein" },
    renderMode: "residue-centroid-cloud",
    coarseGrainStride: 2,
    anchors: [
      { id: "upstream-dna", kind: "nucleic-axis", chainId: "A", at: "start", sampleWindow: 2 },
      { id: "downstream-dna", kind: "nucleic-axis", chainId: "B", at: "end", sampleWindow: 2 },
      { id: "rna-exit", kind: "nucleic-axis", chainId: "R", at: "end", sampleWindow: 1 },
      { id: "active-center", kind: "chain-centroid", chainIds: ["A", "B", "R"] },
    ],
    fallback: {
      status: "structure-guided",
      reason: "Fall back to the existing explanatory RNAP and procedural DNA/RNA if coordinates fail.",
    },
  },
  {
    role: "ribosome-example",
    semanticEntityIds: ["ribosome"],
    provider: "rcsb-pdb",
    structureId: "4V6F",
    assetUrl: "/spatial-ravia/structures/4V6F.pdb",
    format: "pdb",
    title: "Example ribosome manifest shape",
    canonicalSystem: "example translation manifest",
    organism: "Thermus thermophilus",
    sourceUrl: "https://www.rcsb.org/structure/4V6F",
    selectedChains: ["A", "B"],
    renderMode: "residue-centroid-cloud",
    coarseGrainStride: 4,
    anchors: [
      { id: "mrna-entry", kind: "residue-range-centroid", chainId: "A", startResidue: 500, endResidue: 520 },
      { id: "peptide-exit", kind: "residue-range-centroid", chainId: "B", startResidue: 50, endResidue: 70 },
    ],
    fallback: {
      status: "procedural",
      reason: "Example manifest only; translation is not migrated yet.",
    },
  },
];

export function resolveStructureManifest(role: string) {
  return structureManifest.find((entry) => entry.role === role) ?? null;
}

export function getStructureGroundingProvenance(
  roles: string[],
  groundingStatus: StructureGroundingProvenance["groundingStatus"] = "structure-derived"
) {
  return roles.flatMap((role) => {
    const entry = resolveStructureManifest(role);
    return entry
      ? [{
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
          groundingStatus,
        }]
      : [];
  });
}
