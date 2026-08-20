/** F6-B: canonical, contract-only benchmark corpus over frozen F1–F5 capability records. */

import { capabilityRegistryById, resolveCapabilityRegistrySupport, type CapabilityRegistryRecord } from "./capability-registry.ts";
import type { CapabilityPolicyRequest, CapabilitySupportStatus } from "./capability-support-policy.ts";

export const foundationCapabilityBenchmarkSchemaVersion = "1" as const;
export type FoundationBenchmarkCaseKind = "capability" | "multiIntent" | "ambiguity" | "misconception" | "unsupportedRequest" | "staticOnlyAnimation" | "exportCompatibility";
export type FoundationCapabilityBenchmarkCase = {
  caseId: string;
  kind: FoundationBenchmarkCaseKind;
  prompt: string;
  expectedCapabilityIds: string[];
  expectedSupportPolicyOutcome: CapabilitySupportStatus;
  requiredSceneSpecInvariants: string[];
  policyRequest: CapabilityPolicyRequest;
};

const capability = (id: string): CapabilityRegistryRecord => {
  const value = capabilityRegistryById.get(id);
  if (!value) throw new Error(`Missing frozen capability: ${id}`);
  return value;
};
const requestFor = (id: string, overrides: Partial<CapabilityPolicyRequest["clauses"][number]> = {}, options: Pick<CapabilityPolicyRequest, "allowSchematic" | "allowExplicitStaticSubstitution"> = { allowSchematic: false, allowExplicitStaticSubstitution: false }): CapabilityPolicyRequest => {
  const record = capability(id);
  return { ...options, clauses: [{ clauseId: `clause-${id}`, capabilityId: id, requestedEntityIds: record.requiredSemanticEntities, ...overrides }] };
};
const supported = (caseId: string, prompt: string, capabilityId: string): FoundationCapabilityBenchmarkCase => {
  const record = capability(capabilityId);
  return { caseId, kind: "capability", prompt, expectedCapabilityIds: [capabilityId], expectedSupportPolicyOutcome: "SUPPORTED", requiredSceneSpecInvariants: record.primitiveIds, policyRequest: requestFor(capabilityId) };
};

export const foundationCapabilityBenchmarkCorpus: readonly FoundationCapabilityBenchmarkCase[] = [
  supported("dna-duplex", "show a canonical DNA duplex", "dna-canonical-structure"),
  supported("dna-at-pair", "show adenine pairing with thymine in DNA", "dna-base-pairing"),
  supported("dna-gc-pair", "show guanine pairing with cytosine in DNA", "dna-base-pairing"),
  supported("dna-polarity", "show antiparallel DNA polarity", "dna-antiparallel-polarity"),
  supported("dna-phosphodiester", "show a DNA phosphodiester linkage", "dna-phosphodiester-backbone"),
  supported("dna-separation", "show DNA strand separation", "dna-strand-separation"),
  supported("dna-replication", "show a DNA replication fork", "dna-replication"),
  supported("dna-transcription", "show transcription on DNA", "dna-transcription"),
  supported("dna-packaging", "show DNA packaged in a nucleosome", "dna-packaging"),
  supported("dna-damage-repair", "show DNA lesion repair context", "dna-damage-repair"),
  supported("dna-local-chemistry", "show a DNA nucleotide", "dna-local-chemistry"),
  supported("rna-nucleotide", "show an RNA nucleotide", "rna-local-chemistry"),
  supported("rna-generic", "show generic RNA", "rna-generic-structure"),
  supported("rna-hairpin", "show an RNA hairpin", "rna-secondary-structure"),
  supported("rna-processing", "show introns and exons in pre-mRNA", "rna-processing"),
  supported("rna-pre-mature", "compare pre-mRNA and mature mRNA", "rna-processing"),
  supported("rna-au-pair", "show A-U pairing in RNA", "rna-base-pairing"),
  supported("rna-gc-pair", "show G-C pairing in RNA", "rna-base-pairing"),
  supported("rna-dna-hybrid", "show an RNA-DNA hybrid", "rna-dna-hybridization"),
  supported("rna-cleavage", "show RNA being cleaved", "rna-cleavage"),
  supported("rna-exonuclease", "show 5-prime exonuclease degradation of RNA", "rna-exonuclease-degradation"),
  supported("rna-stability", "why is RNA less chemically stable than DNA", "rna-chemical-stability"),
  supported("rna-local-chemistry", "show the 2-prime OH in RNA", "rna-local-chemistry"),
  (() => { const left = capability("dna-base-pairing"); const right = capability("rna-base-pairing"); return { caseId: "multi-intent-dna-rna-pairing", kind: "multiIntent", prompt: "compare DNA and RNA base pairing", expectedCapabilityIds: [], expectedSupportPolicyOutcome: "UNSUPPORTED", requiredSceneSpecInvariants: [], policyRequest: { allowSchematic: false, allowExplicitStaticSubstitution: false, clauses: [{ clauseId: "clause-dna-pair", capabilityId: left.capabilityId, requestedEntityIds: left.requiredSemanticEntities }, { clauseId: "clause-rna-pair", capabilityId: right.capabilityId, requestedEntityIds: right.requiredSemanticEntities }] } }; })(),
  { caseId: "ambiguous-polymerase", kind: "ambiguity", prompt: "show polymerase action", expectedCapabilityIds: [], expectedSupportPolicyOutcome: "CLARIFICATION_REQUIRED", requiredSceneSpecInvariants: [], policyRequest: { allowSchematic: false, allowExplicitStaticSubstitution: false, clauses: [{ clauseId: "clause-polymerase", candidateCapabilityIds: ["dna-replication", "dna-transcription"], ambiguousMechanism: true }] } },
  { caseId: "misconception-dna-indestructible", kind: "misconception", prompt: "show that DNA is chemically indestructible", expectedCapabilityIds: [], expectedSupportPolicyOutcome: "INVALID_SCIENTIFIC_REQUEST", requiredSceneSpecInvariants: [], policyRequest: { allowSchematic: false, allowExplicitStaticSubstitution: false, clauses: [{ clauseId: "clause-dna-indestructible", capabilityId: "dna-local-chemistry", requestedEntityIds: capability("dna-local-chemistry").requiredSemanticEntities, scientificValidity: "misconception" }] } },
  { caseId: "unsupported-protein-folding", kind: "unsupportedRequest", prompt: "show protein folding", expectedCapabilityIds: [], expectedSupportPolicyOutcome: "UNSUPPORTED", requiredSceneSpecInvariants: [], policyRequest: { allowSchematic: false, allowExplicitStaticSubstitution: false, clauses: [{ clauseId: "clause-protein-folding", capabilityId: "protein-folding" }] } },
  { caseId: "static-only-animation", kind: "staticOnlyAnimation", prompt: "animate DNA helix stabilization", expectedCapabilityIds: [], expectedSupportPolicyOutcome: "UNSUPPORTED", requiredSceneSpecInvariants: capability("dna-helix-stabilization").primitiveIds, policyRequest: requestFor("dna-helix-stabilization", { requiresAnimation: true }) },
  { caseId: "export-compatible-image", kind: "exportCompatibility", prompt: "export an RNA hairpin as an image", expectedCapabilityIds: ["rna-secondary-structure"], expectedSupportPolicyOutcome: "SUPPORTED", requiredSceneSpecInvariants: capability("rna-secondary-structure").primitiveIds, policyRequest: requestFor("rna-secondary-structure", { exportFormat: "image" }) },
];

export type FoundationCapabilityBenchmarkValidationIssue = { path: string; message: string };
export type FoundationCapabilityBenchmarkValidationResult = { valid: true; issues: [] } | { valid: false; issues: FoundationCapabilityBenchmarkValidationIssue[] };
const id = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const kinds = new Set<FoundationBenchmarkCaseKind>(["capability", "multiIntent", "ambiguity", "misconception", "unsupportedRequest", "staticOnlyAnimation", "exportCompatibility"]);

export function validateFoundationCapabilityBenchmarkCorpus(corpus: readonly FoundationCapabilityBenchmarkCase[] = foundationCapabilityBenchmarkCorpus): FoundationCapabilityBenchmarkValidationResult {
  const issues: FoundationCapabilityBenchmarkValidationIssue[] = []; const issue = (path: string, message: string) => issues.push({ path, message }); const ids = new Set<string>();
  corpus.forEach((entry, index) => {
    const path = `corpus[${index}]`;
    if (!id.test(entry.caseId)) issue(`${path}.caseId`, "must be a stable kebab-case ID"); if (ids.has(entry.caseId)) issue(`${path}.caseId`, "must be unique"); ids.add(entry.caseId);
    if (!kinds.has(entry.kind)) issue(`${path}.kind`, "is invalid"); if (!entry.prompt) issue(`${path}.prompt`, "must be non-empty");
    const expected = resolveCapabilityRegistrySupport(entry.policyRequest);
    if (expected.status !== entry.expectedSupportPolicyOutcome) issue(`${path}.expectedSupportPolicyOutcome`, `does not match deterministic policy result ${expected.status}`);
    if (expected.selectedCapabilityIds.join("|") !== entry.expectedCapabilityIds.join("|")) issue(`${path}.expectedCapabilityIds`, "does not match deterministic policy selection");
    const validInvariants = new Set<string>(entry.expectedCapabilityIds.flatMap((capabilityId) => capability(capabilityId).primitiveIds));
    entry.requiredSceneSpecInvariants.forEach((invariant, invariantIndex) => { if (!validInvariants.has(invariant) && entry.expectedCapabilityIds.length > 0) issue(`${path}.requiredSceneSpecInvariants[${invariantIndex}]`, "is not required by expected capability"); });
    if (["ambiguity", "misconception", "unsupportedRequest"].includes(entry.kind) && entry.expectedCapabilityIds.length) issue(`${path}.expectedCapabilityIds`, "must be empty for non-compiling cases");
  });
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}
