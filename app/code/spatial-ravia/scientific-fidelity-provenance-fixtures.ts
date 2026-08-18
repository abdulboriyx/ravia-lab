/** F2-C fixtures intentionally cover current DNA/RNA source classes without touching renderers. */
import { actorId, groupId } from "./scientific-actor.ts";
import { claimId, interactionId, provenanceSourceId, type FidelityAttachmentContext, type ScientificFidelityProvenanceDocument } from "./scientific-fidelity-provenance.ts";

export const fidelityFixtureContext: FidelityAttachmentContext = {
  actorIds: [actorId("dna-molecule-1"), actorId("rna-transcript-1"), actorId("rna-polymerase-1"), actorId("nucleosome-1")],
  groupIds: [groupId("group-gc-pair-1"), groupId("group-comparison-1")],
  interactionIds: [interactionId("gc-hydrogen-bond")],
  claimIds: [claimId("rna-two-prime-oh-susceptibility")],
};

export const fidelityProvenanceFixture: ScientificFidelityProvenanceDocument = {
  sources: [
    { sourceId: provenanceSourceId("canonical-b-dna-parameters"), sourceType: "canonicalParameterSet", citationReference: "canonical-b-dna", contentHash: "pending:canonical-b-dna-parameters", quality: { sourceConfidence: 0.9 } },
    { sourceId: provenanceSourceId("canonical-rna-parameters"), sourceType: "canonicalParameterSet", citationReference: "canonical-rna", contentHash: "pending:canonical-rna-parameters", quality: { sourceConfidence: 0.86 } },
    { sourceId: provenanceSourceId("pdb-6alh"), sourceType: "depositedStructure", accessionOrEntryId: "6ALH", structure: { structureId: "6ALH", assemblyId: "1", chainIds: ["A"] }, provider: { id: "RCSB-PDB", version: "current" }, citationReference: "pdb-6alh-primary", licenseReference: "rcsb-pdb-data-policy", contentHash: "pending:pdb-6alh", quality: { sourceConfidence: 0.96 } },
    { sourceId: provenanceSourceId("local-nucleic-chemistry"), sourceType: "chemicalReference", citationReference: "canonical-nucleic-chemistry", contentHash: "pending:local-nucleic-chemistry", quality: { sourceConfidence: 0.94 } },
    { sourceId: provenanceSourceId("pedagogical-nucleosome"), sourceType: "educationalSchematic", citationReference: "nucleosome-teaching-model", contentHash: "pending:pedagogical-nucleosome", quality: { sourceConfidence: 0.72 } },
  ],
  attachments: [
    { attachmentId: "canonical-dna-actor", target: { kind: "actor", actorId: actorId("dna-molecule-1") }, fidelity: "C0_COMPUTED", provenanceSourceId: provenanceSourceId("canonical-b-dna-parameters"), confidence: { sourceConfidence: 0.9, groundingConfidence: 0.78, mechanismEvidence: "supported", visualApproximation: "minor" }, visible: true },
    { attachmentId: "procedural-rna-actor", target: { kind: "actor", actorId: actorId("rna-transcript-1") }, fidelity: "C0_COMPUTED", provenanceSourceId: provenanceSourceId("canonical-rna-parameters"), confidence: { sourceConfidence: 0.86, groundingConfidence: 0.74, mechanismEvidence: "educational", visualApproximation: "constrained" }, visible: true },
    { attachmentId: "deposited-rnap-actor", target: { kind: "actor", actorId: actorId("rna-polymerase-1") }, fidelity: "E0_DEPOSITED", provenanceSourceId: provenanceSourceId("pdb-6alh"), confidence: { sourceConfidence: 0.96, groundingConfidence: 0.93, mechanismEvidence: "direct", visualApproximation: "minor" }, visible: true },
    { attachmentId: "hybrid-gc-interaction", target: { kind: "interaction", interactionId: interactionId("gc-hydrogen-bond") }, fidelity: "S1_CONSTRAINED", provenanceSourceId: provenanceSourceId("local-nucleic-chemistry"), confidence: { sourceConfidence: 0.94, groundingConfidence: 0.81, mechanismEvidence: "supported", visualApproximation: "constrained" }, visible: true, note: "Deposited RNAP context plus procedural local DNA chemistry." },
    { attachmentId: "local-chemistry-group", target: { kind: "group", groupId: groupId("group-gc-pair-1") }, fidelity: "C0_COMPUTED", provenanceSourceId: provenanceSourceId("local-nucleic-chemistry"), confidence: { sourceConfidence: 0.94, groundingConfidence: 0.9, mechanismEvidence: "direct", visualApproximation: "minor" }, visible: true },
    { attachmentId: "schematic-nucleosome", target: { kind: "actor", actorId: actorId("nucleosome-1") }, fidelity: "S2_SCHEMATIC", provenanceSourceId: provenanceSourceId("pedagogical-nucleosome"), confidence: { sourceConfidence: 0.72, groundingConfidence: 0.64, mechanismEvidence: "educational", visualApproximation: "schematic" }, visible: true },
    { attachmentId: "stability-claim-overlay", target: { kind: "claim", claimId: claimId("rna-two-prime-oh-susceptibility") }, fidelity: "O_OVERLAY", provenanceSourceId: provenanceSourceId("local-nucleic-chemistry"), confidence: { sourceConfidence: 0.94, groundingConfidence: 0.88, mechanismEvidence: "supported", visualApproximation: "overlay" }, visible: true },
  ],
};
