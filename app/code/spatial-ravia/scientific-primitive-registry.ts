/**
 * F5-C: catalog of existing reusable scientific/scene primitives.
 *
 * This is deliberately a discovery registry, not a SceneSpec, renderer API, or
 * geometry factory. Entries point to the frozen F2 vocabulary and to existing
 * local presentation capabilities; a consuming scene still declares concrete
 * actors, topology, state, fidelity, and presentation intent through F2.
 */

import type { MolecularScope, ScientificActorRole, ScientificActorTypeId } from "./scientific-actor.ts";
import type { ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";
import type { ScientificStateKind, TopologyChange, TopologyInteractionType } from "./scientific-topology.ts";

export type ScientificPrimitiveId =
  | "dna-duplex"
  | "rna-polymer"
  | "nucleotide"
  | "base-pair"
  | "phosphodiester-linkage"
  | "polarity-endpoints"
  | "hydrogen-bond-interaction"
  | "stacking-interaction"
  | "polymer-continuity"
  | "strand-opening"
  | "comparison-group"
  | "exon-intron-region"
  | "cleavage-fragments"
  | "terminal-shortening"
  | "local-chemistry-comparison";

/** Requirement references, not concrete F2 actor/topology/state instances. */
export type ScientificPrimitiveRequirements = Readonly<{
  scientific: readonly string[];
  actors: Readonly<{
    semanticTypes: readonly ScientificActorTypeId[];
    roles: readonly ScientificActorRole[];
    scopes: readonly MolecularScope[];
  }>;
  topology: Readonly<{
    interactions: readonly TopologyInteractionType[];
    changes: readonly TopologyChange["kind"][];
  }>;
  states: readonly ScientificStateKind[];
  fidelity: Readonly<{
    allowedTiers: readonly ScientificFidelityTier[];
    requirements: readonly string[];
  }>;
}>;

export type ScientificPrimitiveRegistryEntry = Readonly<{
  id: ScientificPrimitiveId;
  label: string;
  requirements: ScientificPrimitiveRequirements;
  /** Existing capability names that may compose this primitive. */
  reusedBy: readonly string[];
  /** Existing implementation modules; never a geometry-construction instruction. */
  availableFrom: readonly string[];
}>;

const schematicAndConstrained = ["S1_CONSTRAINED", "S2_SCHEMATIC"] as const;
const chemicalTiers = ["C0_COMPUTED", "S1_CONSTRAINED", "S2_SCHEMATIC"] as const;

export const scientificPrimitiveRegistry: Readonly<Record<ScientificPrimitiveId, ScientificPrimitiveRegistryEntry>> = {
  "dna-duplex": {
    id: "dna-duplex", label: "DNA duplex",
    requirements: { scientific: ["Two complementary, antiparallel DNA strands remain paired outside any declared local opening."], actors: { semanticTypes: ["dna", "strand", "duplex"], roles: ["templateStrand", "codingStrand", "complementaryStrand"], scopes: ["polymer", "strand"] }, topology: { interactions: ["basePairing", "polymerContinuity"], changes: [] }, states: ["paired", "intact"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Preserve double-strand continuity and antiparallel pairing; do not infer atom-level coordinates."] } },
    reusedBy: ["dna-overview", "transcription-local-context", "strand-separation", "base-pairing"], availableFrom: ["DnaVisualSystem.ts"],
  },
  "rna-polymer": {
    id: "rna-polymer", label: "RNA polymer",
    requirements: { scientific: ["A single RNA chain has ordered nucleotide continuity and distinguishable termini."], actors: { semanticTypes: ["rna", "mRNA", "strand", "transcript"], roles: ["nascentTranscript", "product", "focus"], scopes: ["polymer", "strand"] }, topology: { interactions: ["polymerContinuity"], changes: [] }, states: ["intact", "nascent", "matureMRNA"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Keep one coherent transcript rather than disconnected residue symbols."] } },
    reusedBy: ["rna-overview", "nascent-rna", "rna-processing", "rna-degradation"], availableFrom: ["RnaVisualSystem.ts", "RnaNascentTranscriptPresentation.ts"],
  },
  nucleotide: {
    id: "nucleotide", label: "Nucleotide",
    requirements: { scientific: ["A base, sugar, and phosphate are represented as one nucleotide identity."], actors: { semanticTypes: ["nucleotide", "base", "phosphate", "ribose", "deoxyribose"], roles: ["focus", "comparisonLeft", "comparisonRight"], scopes: ["residue", "chemicalComponent", "atomGroup"] }, topology: { interactions: ["covalentBond"], changes: [] }, states: ["intact"], fidelity: { allowedTiers: chemicalTiers, requirements: ["Retain the chemical distinction between ribose and deoxyribose when relevant."] } },
    reusedBy: ["single-nucleotide", "rna-two-prime-oh", "dna-nucleotide", "nucleotide-comparison"], availableFrom: ["RnaVisualSystem.ts", "DnaLocalChemistryRepresentation.ts"],
  },
  "base-pair": {
    id: "base-pair", label: "Base pair",
    requirements: { scientific: ["Complementary bases are paired across two strands, not shown as an unconnected label pair."], actors: { semanticTypes: ["base", "strand", "dna", "rna"], roles: ["templateStrand", "complementaryStrand"], scopes: ["residue", "strand"] }, topology: { interactions: ["basePairing", "hydrogenBond"], changes: ["pairing"] }, states: ["paired", "unpaired"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Pairing is explicit and strand-attached; hydrogen bonds are explanatory unless chemistry is sourced."] } },
    reusedBy: ["dna-base-pairing", "rna-pairing", "secondary-structure"], availableFrom: ["DnaBasePairInteractionPresentation.ts", "RnaPairingPresentation.ts"],
  },
  "phosphodiester-linkage": {
    id: "phosphodiester-linkage", label: "Phosphodiester linkage",
    requirements: { scientific: ["Adjacent nucleotide units are covalently linked through the sugar-phosphate backbone."], actors: { semanticTypes: ["nucleotide", "phosphate", "strand", "phosphodiesterLinkage"], roles: ["focus", "context"], scopes: ["residue", "chemicalComponent", "atomGroup"] }, topology: { interactions: ["phosphodiesterLinkage", "polymerContinuity"], changes: ["cleavage"] }, states: ["intact", "cleaved"], fidelity: { allowedTiers: chemicalTiers, requirements: ["Do not substitute a generic proximity line for a covalent backbone claim."] } },
    reusedBy: ["dna-backbone-chemistry", "phosphodiester-view", "cleavage"], availableFrom: ["DnaBackboneChemistryPresentation.ts", "RnaLocalChemistryPresentation.ts"],
  },
  "polarity-endpoints": {
    id: "polarity-endpoints", label: "5′/3′ polarity endpoints",
    requirements: { scientific: ["5′ and 3′ termini are anchored to the actual polymer ends and preserve strand direction."], actors: { semanticTypes: ["strand", "dna", "rna", "fivePrimeCarbon", "threePrimeCarbon"], roles: ["templateStrand", "codingStrand", "focus"], scopes: ["polymer", "strand", "atomGroup"] }, topology: { interactions: ["polymerContinuity"], changes: [] }, states: ["intact"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Endpoint annotations may clarify polarity but must not create independent floating termini."] } },
    reusedBy: ["dna-antiparallel", "rna-termini", "rna-processing"], availableFrom: ["DnaPolarityAntiparallelPresentation.ts", "RnaProcessingPresentation.ts"],
  },
  "hydrogen-bond-interaction": {
    id: "hydrogen-bond-interaction", label: "Hydrogen-bond interaction",
    requirements: { scientific: ["A donor and acceptor are attached to scientifically compatible paired bases or groups."], actors: { semanticTypes: ["base", "hydrogenBondDonor", "hydrogenBondAcceptor"], roles: ["donor", "acceptor"], scopes: ["residue", "atomGroup"] }, topology: { interactions: ["hydrogenBond", "basePairing"], changes: ["pairing"] }, states: ["paired", "unpaired"], fidelity: { allowedTiers: chemicalTiers, requirements: ["Use an explanatory interaction only; it is not a covalent bond."] } },
    reusedBy: ["dna-base-pairing", "helix-stabilization", "rna-pairing"], availableFrom: ["DnaBasePairInteractionPresentation.ts", "DnaHelixStabilizationPresentation.ts", "RnaPairingPresentation.ts"],
  },
  "stacking-interaction": {
    id: "stacking-interaction", label: "Base-stacking interaction",
    requirements: { scientific: ["Adjacent base faces are ordered along a nucleic-acid strand or helix."], actors: { semanticTypes: ["base", "stackingFace", "strand"], roles: ["context", "focus"], scopes: ["residue", "atomGroup", "strand"] }, topology: { interactions: ["baseStacking", "polymerContinuity"], changes: [] }, states: ["intact", "paired"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Depict stacking as a noncovalent explanatory relation, not a base-pair substitute."] } },
    reusedBy: ["helix-stabilization", "dna-overview"], availableFrom: ["DnaHelixStabilizationPresentation.ts"],
  },
  "polymer-continuity": {
    id: "polymer-continuity", label: "Polymer continuity",
    requirements: { scientific: ["Ordered components belong to one persistent polymer identity across a static state or comparison."], actors: { semanticTypes: ["dna", "rna", "strand", "transcript"], roles: ["parentStrand", "nascentTranscript", "focus"], scopes: ["polymer", "strand"] }, topology: { interactions: ["polymerContinuity"], changes: ["cleavage", "fragmentation", "processing"] }, states: ["intact", "cleaved", "partiallyDegraded"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Breaks and removals must be represented as topology/state changes, never merely spacing changes."] } },
    reusedBy: ["rna-processing", "rna-degradation", "dna-backbone-chemistry", "strand-separation"], availableFrom: ["RnaVisualSystem.ts", "DnaVisualSystem.ts", "RnaDegradationPresentation.ts"],
  },
  "strand-opening": {
    id: "strand-opening", label: "Local strand opening",
    requirements: { scientific: ["A bounded region becomes unpaired while flanking duplex regions remain paired; it is not a replication fork by default."], actors: { semanticTypes: ["dna", "strand", "duplex", "transcriptionBubble"], roles: ["templateStrand", "codingStrand", "focus"], scopes: ["polymer", "strand"] }, topology: { interactions: ["basePairing", "polymerContinuity"], changes: ["separation"] }, states: ["open", "unpaired", "paired"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Bound the opening locally and preserve paired flanks."] } },
    reusedBy: ["transcription-bubble", "dna-strand-separation", "rnap-on-dna"], availableFrom: ["DnaVisualSystem.ts", "DnaStrandSeparationPresentation.ts", "TranscriptionDnaTemplate.tsx"],
  },
  "comparison-group": {
    id: "comparison-group", label: "Matched comparison group",
    requirements: { scientific: ["Two alternatives are explicitly matched on shared properties before their intended difference is highlighted."], actors: { semanticTypes: ["comparisonPair", "nucleotide", "dna", "rna"], roles: ["comparisonLeft", "comparisonRight"], scopes: ["chemicalComponent", "residue", "polymer"] }, topology: { interactions: ["chemicalComparison"], changes: [] }, states: ["intact"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Matched orientation, scale, and baseline composition prevent unrelated differences from confounding the comparison."] } },
    reusedBy: ["rna-dna-nucleotide-comparison", "local-chemistry-comparison"], availableFrom: ["RnaLocalChemistryPresentation.ts"],
  },
  "exon-intron-region": {
    id: "exon-intron-region", label: "Exon/intron transcript region",
    requirements: { scientific: ["Exons and introns are contiguous spans on one pre-mRNA transcript, with exon order retained after splicing."], actors: { semanticTypes: ["mRNA", "transcript", "exon", "intron"], roles: ["exon", "intron", "focus"], scopes: ["polymer", "strand", "residue"] }, topology: { interactions: ["exonSpan", "intronSpan", "polymerContinuity"], changes: ["processing"] }, states: ["preMRNA", "matureMRNA"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Regions must be attached transcript spans; after-splicing views omit introns and expose exon-exon junctions."] } },
    reusedBy: ["pre-mrna-regions", "mature-mrna", "rna-splicing-comparison"], availableFrom: ["RnaProcessingPresentation.ts"],
  },
  "cleavage-fragments": {
    id: "cleavage-fragments", label: "Cleavage fragments",
    requirements: { scientific: ["Fragments retain their parent polymer relationship and arise from an explicit cleavage or fragmentation event."], actors: { semanticTypes: ["rna", "strand", "cleavageFragment"], roles: ["substrate", "product", "focus"], scopes: ["polymer", "strand"] }, topology: { interactions: ["fragmentContinuity", "polymerContinuity"], changes: ["cleavage", "fragmentation"] }, states: ["cleaved", "partiallyDegraded"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["Show discontinuity and fragment provenance; do not use unrelated floating bars."] } },
    reusedBy: ["rna-cleavage", "rna-degradation"], availableFrom: ["RnaDegradationPresentation.ts"],
  },
  "terminal-shortening": {
    id: "terminal-shortening", label: "Terminal shortening",
    requirements: { scientific: ["Loss proceeds from a defined 5′ or 3′ polymer terminus while remaining polymer continuity stays explicit."], actors: { semanticTypes: ["rna", "strand", "nucleotide"], roles: ["substrate", "product", "focus"], scopes: ["polymer", "strand", "residue"] }, topology: { interactions: ["terminalDegradation", "polymerContinuity"], changes: ["cleavage", "fragmentation"] }, states: ["partiallyDegraded", "intact"], fidelity: { allowedTiers: schematicAndConstrained, requirements: ["The shortening direction and affected terminus must be scientifically explicit."] } },
    reusedBy: ["rna-exonuclease-degradation", "terminal-degradation"], availableFrom: ["RnaDegradationPresentation.ts"],
  },
  "local-chemistry-comparison": {
    id: "local-chemistry-comparison", label: "Local chemistry comparison",
    requirements: { scientific: ["A bounded chemical feature is compared between matched molecules while unrelated molecular differences are held constant."], actors: { semanticTypes: ["comparisonPair", "nucleotide", "ribose", "deoxyribose", "riboseTwoPrimeHydroxyl"], roles: ["comparisonLeft", "comparisonRight", "focus"], scopes: ["residue", "chemicalComponent", "atomGroup"] }, topology: { interactions: ["chemicalComparison", "covalentBond"], changes: [] }, states: ["intact"], fidelity: { allowedTiers: chemicalTiers, requirements: ["Use canonical local chemistry and clearly attach the RNA 2′-OH to ribose; the DNA counterpart lacks that hydroxyl."] } },
    reusedBy: ["rna-dna-nucleotide-comparison", "rna-two-prime-oh", "phosphodiester-view"], availableFrom: ["RnaLocalChemistryPresentation.ts", "DnaLocalChemistryRepresentation.ts"],
  },
};

export const scientificPrimitives = Object.values(scientificPrimitiveRegistry) as readonly ScientificPrimitiveRegistryEntry[];

export function getScientificPrimitive(id: ScientificPrimitiveId): ScientificPrimitiveRegistryEntry {
  return scientificPrimitiveRegistry[id];
}

/** Small structural guard for catalog consumers; it intentionally does not validate SceneSpec data. */
export function validateScientificPrimitiveRegistry(entries = scientificPrimitives): readonly string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (ids.has(entry.id)) problems.push(`${path}.id is duplicated`);
    ids.add(entry.id);
    if (!entry.label || !entry.requirements.scientific.length) problems.push(`${path} requires a label and scientific requirements`);
    if (!entry.requirements.actors.semanticTypes.length || !entry.requirements.actors.scopes.length) problems.push(`${path} requires actor and scope references`);
    if (!entry.requirements.states.length || !entry.requirements.fidelity.allowedTiers.length || !entry.requirements.fidelity.requirements.length) problems.push(`${path} requires state and fidelity references`);
    if (!entry.reusedBy.length || !entry.availableFrom.length) problems.push(`${path} must identify existing consumers and sources`);
  });
  return problems;
}
