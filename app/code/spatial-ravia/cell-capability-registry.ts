/** D-B: first additive CELL records in the existing normalized registry. */

import type { CapabilityRegistryRecord } from "./capability-registry.ts";

export type CellularCapabilityRegistryRecord = Omit<CapabilityRegistryRecord, "domain" | "primitiveIds"> & { domain: "CELL"; primitiveIds: string[]; dependsOnCapabilityIds?: string[] };
export const cellularPrimitiveIds = ["cellular-compartment", "actor-localization", "membrane-sidedness", "localization-change", "vesicle-cargo-localization"] as const;
export const cellularSecretoryPrimitiveIds = ["secretory-signal", "srp-targeting", "translocon-engagement", "protein-folding", "protein-modification", "er-quality-control", "vesicle-budding", "golgi-transit", "cargo-sorting", "vesicle-docking", "membrane-fusion", "exocytosis"] as const;
export const cellularMembraneProteinPrimitiveIds = ["membrane-protein-insertion", "protein-topology", "topology-continuity", "disulfide-formation", "site-glycosylation", "modification-locality"] as const;
export const cellularGeneExpressionPrimitiveIds = ["transcription-core", "rna-processing", "nuclear-export", "translation-core", "peptide-growth", "polymer-continuity"] as const;
export const cellularTransportPrimitiveIds = ["microtubule-polarity", "motor-track-association", "cargo-adaptor-association", "vesicle-track-transport", "endocytic-budding", "endocytic-scission", "early-endosome-delivery", "endosomal-sorting"] as const;
export const cellularSignalingPrimitiveIds = ["ligand-receptor-binding", "receptor-activation", "protein-phosphorylation", "nucleotide-exchange", "kinase-cascade", "signaling-translocation", "target-response"] as const;

const foundationPrimitives = ["actors", "groups", "topology", "states", "constraints", "fidelityProvenance", "presentationIntent"] as const;

const record = (capabilityId: string, family: string, primitiveIds: string[], requiredSemanticEntities: string[], presentationOwner: string): CellularCapabilityRegistryRecord => ({
  capabilityId,
  domain: "CELL",
  family,
  supportedActs: ["show", "explain", "inspect", "export"],
  requiredSemanticEntities,
  phenomenon: "cellularLocalization",
  mechanisms: ["cellularLocalization"],
  supportedScientificStates: ["unknown"],
  requiredSceneSpecPrimitives: [...foundationPrimitives],
  primitiveIds,
  presentationOwner,
  fidelityRequirements: { minimum: "S2_SCHEMATIC", provenanceRequired: true },
  readiness: { timeline: "staticOnly", teaching: "partial", export: "partial" },
  supportStatus: "PARTIALLY_SUPPORTED",
  benchmarkReferences: ["cellular-localization-v1"],
  sceneSpecCompatibility: { actors: true, topology: true, interactions: false, states: true, provenance: true, presentationIntent: true, timeline: "staticOnly", teaching: "partial", export: "partial" },
  policyDescriptor: { capabilityId, requiredEntityIds: requiredSemanticEntities, supportedFidelity: "schematic", supportsStatic: true, supportsAnimation: false, supportedOutputKinds: ["scene", "figure", "data", "export"], supportedExportFormats: ["json", "image"], composableWith: [] },
});

const geneExpressionRecord = (capabilityId: string, family: string, primitiveIds: string[], requiredSemanticEntities: string[], presentationOwner: string): CellularCapabilityRegistryRecord => ({
  ...record(capabilityId, family, primitiveIds, requiredSemanticEntities, presentationOwner),
  readiness: { timeline: "ready", teaching: "partial", export: "partial" },
  sceneSpecCompatibility: { actors: true, topology: true, interactions: true, states: true, provenance: true, presentationIntent: true, timeline: "ready", teaching: "partial", export: "partial" },
  policyDescriptor: { ...record(capabilityId, family, primitiveIds, requiredSemanticEntities, presentationOwner).policyDescriptor, supportsAnimation: true, supportedOutputKinds: ["scene", "figure", "export"], supportedExportFormats: ["json", "image", "video"] },
  benchmarkReferences: ["cellular-gene-expression-v1"],
});
const secretoryRecord = (capabilityId: string, primitiveIds: string[], requiredSemanticEntities: string[], dependsOnCapabilityIds: string[] = []): CellularCapabilityRegistryRecord => ({
  ...geneExpressionRecord(capabilityId, "secretoryPathway", primitiveIds, requiredSemanticEntities, "secretory-pathway-cellular"),
  dependsOnCapabilityIds,
  benchmarkReferences: ["cellular-secretory-pathway-v1"],
});

export const cellCapabilityRegistry: readonly CellularCapabilityRegistryRecord[] = [
  record("cell-compartmentalization", "compartment", ["cellular-compartment"], ["compartment", "organelle"], "cell-compartmentalization"),
  record("actor-localization", "localization", ["cellular-compartment", "actor-localization"], ["actor", "compartment"], "actor-localization"),
  record("membrane-association", "membrane", ["cellular-compartment", "membrane-sidedness"], ["membrane", "protein"], "membrane-association"),
  record("membrane-sidedness", "membrane", ["cellular-compartment", "membrane-sidedness"], ["membrane", "receptor"], "membrane-sidedness"),
  record("localization-change", "transport", ["actor-localization", "localization-change"], ["actor", "compartment"], "localization-change"),
  record("nuclear-transport", "transport", ["cellular-compartment", "actor-localization", "localization-change"], ["nucleus", "nuclearPore", "actor"], "nuclear-transport"),
  record("er-translocation-context", "transport", ["cellular-compartment", "actor-localization", "membrane-sidedness", "localization-change"], ["protein", "translocon", "erLumen"], "er-translocation-context"),
  record("vesicle-cargo-localization", "transport", ["cellular-compartment", "actor-localization", "vesicle-cargo-localization"], ["vesicle", "cargo"], "vesicle-cargo-localization"),
  geneExpressionRecord("transcription-initiation", "geneExpression", ["cellular-compartment", "actor-localization", "transcription-core"], ["DNA", "promoter", "RNA_polymerase_II", "nucleus"], "transcription-initiation"),
  geneExpressionRecord("transcription-elongation", "geneExpression", ["transcription-core", "polymer-continuity"], ["DNA", "RNA", "RNA_polymerase_II"], "transcription-elongation"),
  geneExpressionRecord("rna-capping", "geneExpression", ["rna-processing", "transcription-core"], ["pre_mRNA", "five_prime_cap"], "rna-capping"),
  geneExpressionRecord("mrna-splicing", "geneExpression", ["rna-processing", "polymer-continuity"], ["pre_mRNA", "spliceosome", "exon", "intron"], "mrna-splicing"),
  geneExpressionRecord("mrna-polyadenylation", "geneExpression", ["rna-processing", "polymer-continuity"], ["mature_mRNA", "polyA_tail"], "mrna-polyadenylation"),
  geneExpressionRecord("mrna-nuclear-export", "transport", ["cellular-compartment", "actor-localization", "localization-change", "nuclear-export"], ["mature_mRNA", "nuclearPore", "cytosol"], "mrna-nuclear-export"),
  geneExpressionRecord("translation-initiation", "geneExpression", ["cellular-compartment", "actor-localization", "translation-core"], ["mRNA", "ribosome", "tRNA", "start_codon"], "translation-initiation"),
  geneExpressionRecord("translation-elongation", "geneExpression", ["translation-core", "peptide-growth"], ["mRNA", "ribosome", "tRNA", "codon", "polypeptide"], "translation-elongation"),
  geneExpressionRecord("translation-termination", "geneExpression", ["translation-core", "peptide-growth"], ["mRNA", "ribosome", "release_factor", "stop_codon", "polypeptide"], "translation-termination"),
];

/** D-D is additive; D-B's five-record foundation remains unchanged. */
export const secretoryCapabilityRegistry: readonly CellularCapabilityRegistryRecord[] = [
  secretoryRecord("secretory-signal-recognition", ["cellular-compartment", "actor-localization", "secretory-signal", "srp-targeting"], ["polypeptide", "signal_peptide", "SRP"], ["translation-initiation"]),
  secretoryRecord("er-targeting", ["cellular-compartment", "actor-localization", "membrane-sidedness", "srp-targeting", "localization-change"], ["ribosome", "ER_membrane", "translocon"], ["secretory-signal-recognition"]),
  secretoryRecord("er-translocation", ["membrane-sidedness", "translocon-engagement", "localization-change"], ["polypeptide", "translocon", "ER_lumen"], ["er-targeting"]),
  secretoryRecord("er-protein-folding", ["protein-folding", "actor-localization"], ["protein", "ER_lumen", "chaperone"], ["er-translocation"]),
  secretoryRecord("er-protein-modification", ["protein-modification", "actor-localization"], ["protein", "glycan", "ER_lumen"], ["er-protein-folding"]),
  secretoryRecord("er-quality-control", ["er-quality-control", "protein-folding"], ["protein", "ER_quality_state"], ["er-protein-modification"]),
  secretoryRecord("er-exit-vesicle-formation", ["vesicle-budding", "vesicle-cargo-localization", "localization-change"], ["ER_lumen", "vesicle", "cargo"], ["er-quality-control"]),
  secretoryRecord("golgi-cis-trans-processing", ["golgi-transit", "protein-modification", "localization-change"], ["cis_Golgi", "medial_Golgi", "trans_Golgi", "cargo"], ["er-exit-vesicle-formation"]),
  secretoryRecord("secretory-cargo-sorting", ["cargo-sorting", "vesicle-cargo-localization"], ["TGN", "secretory_vesicle", "cargo"], ["golgi-cis-trans-processing"]),
  secretoryRecord("vesicle-docking-fusion", ["vesicle-docking", "membrane-fusion", "membrane-sidedness"], ["secretory_vesicle", "plasma_membrane", "SNARE"], ["secretory-cargo-sorting"]),
  secretoryRecord("exocytosis", ["exocytosis", "localization-change", "membrane-fusion"], ["secretory_vesicle", "extracellular_space", "cargo"], ["vesicle-docking-fusion"]),
];

export const membraneProteinCapabilityRegistry: readonly CellularCapabilityRegistryRecord[] = [
  { ...secretoryRecord("membrane-protein-er-insertion", ["cellular-compartment", "membrane-protein-insertion", "translocon-engagement", "membrane-sidedness"], ["membrane_protein", "translocon", "ER_membrane"], ["er-targeting"]), capabilityId: "membrane-protein-er-insertion", benchmarkReferences: ["cellular-membrane-protein-v1"] },
  { ...secretoryRecord("membrane-protein-topology", ["membrane-sidedness", "protein-topology", "topology-continuity"], ["membrane_protein", "transmembrane_segment", "luminal_domain", "cytosolic_domain"], ["membrane-protein-er-insertion"]), capabilityId: "membrane-protein-topology", benchmarkReferences: ["cellular-membrane-protein-v1"] },
  { ...secretoryRecord("membrane-protein-trafficking", ["topology-continuity", "vesicle-cargo-localization", "membrane-fusion"], ["membrane_protein", "ER", "Golgi", "plasma_membrane"], ["membrane-protein-topology"]), capabilityId: "membrane-protein-trafficking", benchmarkReferences: ["cellular-membrane-protein-v1"] },
  { ...secretoryRecord("protein-disulfide-formation", ["protein-folding", "disulfide-formation", "modification-locality"], ["protein", "disulfide_bond", "ER_lumen"], ["er-protein-folding"]), capabilityId: "protein-disulfide-formation", benchmarkReferences: ["cellular-membrane-protein-v1"] },
  { ...secretoryRecord("protein-glycosylation", ["protein-modification", "site-glycosylation", "modification-locality"], ["protein", "glycan_site", "ER_lumen", "Golgi_lumen"], ["er-protein-modification"]), capabilityId: "protein-glycosylation", benchmarkReferences: ["cellular-membrane-protein-v1"] },
  { ...secretoryRecord("er-protein-quality-control", ["er-quality-control", "protein-topology", "modification-locality"], ["protein", "ER_quality_state", "export_gate"], ["er-quality-control"]), capabilityId: "er-protein-quality-control", benchmarkReferences: ["cellular-membrane-protein-v1"] },
];

export const intracellularTransportCapabilityRegistry: readonly CellularCapabilityRegistryRecord[] = [
  geneExpressionRecord("microtubule-directed-transport", "cytoskeletalTransport", ["cellular-compartment", "microtubule-polarity", "motor-track-association"], ["microtubule", "plus_end", "minus_end"], "intracellular-transport-cellular"),
  geneExpressionRecord("kinesin-cargo-transport", "cytoskeletalTransport", ["microtubule-polarity", "motor-track-association", "cargo-adaptor-association", "vesicle-track-transport"], ["kinesin", "vesicle", "cargo_adaptor"], "intracellular-transport-cellular"),
  geneExpressionRecord("dynein-cargo-transport", "cytoskeletalTransport", ["microtubule-polarity", "motor-track-association", "cargo-adaptor-association", "vesicle-track-transport"], ["cytoplasmic_dynein", "vesicle", "cargo_adaptor"], "intracellular-transport-cellular"),
  geneExpressionRecord("endocytic-budding-scission", "endocytosis", ["endocytic-budding", "endocytic-scission", "membrane-sidedness"], ["plasma_membrane", "coated_pit", "endocytic_vesicle"], "intracellular-transport-cellular"),
  geneExpressionRecord("early-endosome-delivery", "endocytosis", ["endocytic-scission", "early-endosome-delivery", "membrane-fusion"], ["endocytic_vesicle", "early_endosome"], "intracellular-transport-cellular"),
  geneExpressionRecord("endosomal-sorting", "endocytosis", ["early-endosome-delivery", "endosomal-sorting"], ["early_endosome", "receptor"], "intracellular-transport-cellular"),
];

export const cellularSignalingCapabilityRegistry: readonly CellularCapabilityRegistryRecord[] = [
  geneExpressionRecord("receptor-ligand-binding", "cellularSignaling", ["cellular-compartment", "ligand-receptor-binding", "membrane-sidedness"], ["ligand", "receptor", "extracellular_space"], "cellular-signaling-rtk-mapk"),
  geneExpressionRecord("receptor-activation", "cellularSignaling", ["ligand-receptor-binding", "receptor-activation", "membrane-sidedness"], ["receptor", "active_receptor", "plasma_membrane"], "cellular-signaling-rtk-mapk"),
  geneExpressionRecord("protein-phosphorylation", "cellularSignaling", ["receptor-activation", "protein-phosphorylation"], ["kinase", "phosphosite", "phosphorylated_protein"], "cellular-signaling-rtk-mapk"),
  geneExpressionRecord("small-gtpase-activation", "cellularSignaling", ["nucleotide-exchange", "protein-phosphorylation"], ["SOS", "Ras", "GDP", "GTP"], "cellular-signaling-rtk-mapk"),
  geneExpressionRecord("kinase-cascade", "cellularSignaling", ["receptor-activation", "protein-phosphorylation", "kinase-cascade"], ["Raf", "MEK", "ERK"], "cellular-signaling-rtk-mapk"),
  geneExpressionRecord("signaling-nuclear-translocation", "cellularSignaling", ["signaling-translocation", "cellular-compartment", "localization-change"], ["ERK", "nucleus", "nuclear_pore"], "cellular-signaling-rtk-mapk"),
  geneExpressionRecord("signal-regulated-transcription", "cellularSignaling", ["target-response", "signaling-translocation", "transcription-core"], ["transcription_factor", "target_gene", "D-C"], "cellular-signaling-rtk-mapk"),
];
