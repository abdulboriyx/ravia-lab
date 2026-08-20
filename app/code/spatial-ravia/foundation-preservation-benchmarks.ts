/** F6-C: adapter assertions over frozen benchmarks; no prompt routing or expectation ownership. */
import { dnaCapabilityRegistry } from "./dna-capability-registry.ts";
import { dnaFamilyBenchmark } from "./dna-family-benchmark.ts";
import { dnaMechanismBenchmark } from "./dna-mechanism-benchmark.ts";
import { rnaCapabilityRegistry } from "./rna-capability-registry.ts";
import { rnaV1Benchmark } from "./rna-benchmark.ts";
import { rnaPresentationOwners } from "./RnaPresentationRouter.ts";

export type PreservationIssue = { path: string; message: string };
export type PreservationResult = { valid: true; issues: [] } | { valid: false; issues: PreservationIssue[] };
const dnaFamilyByCapability: Record<string, string> = {
  "dna-canonical-structure": "structure", "dna-sequence-regulation": "sequence-regulation", "dna-replication": "replication", "dna-transcription": "transcription", "dna-damage-repair": "damage-repair", "dna-packaging": "packaging", "dna-local-chemistry": "local-chemistry",
};
const dnaMechanismByCapability: Record<string, string> = {
  "dna-base-pairing": "basePairing", "dna-phosphodiester-backbone": "backboneChemistry", "dna-antiparallel-polarity": "polarityAntiparallel", "dna-helix-stabilization": "helixStabilization", "dna-strand-separation": "strandSeparation", "dna-nucleotide-assembly": "nucleotideAssembly",
};
const rnaBenchmarkFamilyByCapability: Record<string, string> = {
  "rna-generic-structure": "structure", "rna-types-functions": "typesFunctions", "rna-nascent-transcript": "nascentTranscript", "rna-processing": "processing", "rna-secondary-structure": "secondaryStructure", "rna-base-pairing": "pairingHybridization", "rna-dna-hybridization": "pairingHybridization", "rna-cleavage": "degradationStability", "rna-exonuclease-degradation": "degradationStability", "rna-chemical-stability": "degradationStability", "rna-local-chemistry": "localChemistry", "rna-dna-chemistry-comparison": "localChemistry",
};
const rnaOwnerByCapability: Record<string, string> = {
  "rna-generic-structure": rnaPresentationOwners.structure, "rna-types-functions": rnaPresentationOwners.typesFunctions, "rna-nascent-transcript": rnaPresentationOwners.nascentTranscript, "rna-processing": rnaPresentationOwners.processing, "rna-secondary-structure": rnaPresentationOwners.secondaryStructure, "rna-base-pairing": rnaPresentationOwners.pairingHybridization, "rna-dna-hybridization": rnaPresentationOwners.pairingHybridization, "rna-cleavage": rnaPresentationOwners.degradationStability, "rna-exonuclease-degradation": rnaPresentationOwners.degradationStability, "rna-chemical-stability": rnaPresentationOwners.degradationStability, "rna-local-chemistry": rnaPresentationOwners.localChemistry, "rna-dna-chemistry-comparison": rnaPresentationOwners.localChemistry,
};

/** Ensures Foundation support claims stay within accepted frozen benchmark coverage. */
export function validateFoundationPreservation(): PreservationResult {
  const issues: PreservationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message });
  const dnaFamilies = new Set(dnaFamilyBenchmark.filter((entry) => entry.expected.supported).map((entry) => entry.expected.sceneFamily));
  const dnaMechanisms = new Set(dnaMechanismBenchmark.map((entry) => entry.family));
  dnaCapabilityRegistry.forEach((record, index) => {
    const family = dnaFamilyByCapability[record.capabilityId]; const mechanism = dnaMechanismByCapability[record.capabilityId];
    if (!family && !mechanism) issue(`dna[${index}]`, "has no frozen benchmark correspondence");
    if (family && !dnaFamilies.has(family as never)) issue(`dna[${index}]`, "claims unsupported DNA family behavior");
    if (mechanism && !dnaMechanisms.has(mechanism as never)) issue(`dna[${index}]`, "claims unsupported DNA mechanism behavior");
    if (!record.benchmarkReferences.every((reference) => reference === "dna-family-v1" || reference === "dna-mechanism-v1")) issue(`dna[${index}].benchmarkReferences`, "must reference frozen DNA benchmark IDs only");
  });
  const rnaFamilies = new Set(rnaV1Benchmark.map((entry) => entry.expectedFamily));
  rnaCapabilityRegistry.forEach((record, index) => {
    const family = rnaBenchmarkFamilyByCapability[record.capabilityId];
    if (!family || !rnaFamilies.has(family as never)) issue(`rna[${index}]`, "claims RNA behavior outside frozen semantic benchmark coverage");
    if (rnaOwnerByCapability[record.capabilityId] !== record.presentationOwner) issue(`rna[${index}].presentationOwner`, "does not match frozen runtime ownership");
    if (!record.benchmarkReferences.every((reference) => reference === "rna-v1" || reference === "rna-runtime-ownership")) issue(`rna[${index}].benchmarkReferences`, "must reference frozen RNA benchmark IDs only");
  });
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}
