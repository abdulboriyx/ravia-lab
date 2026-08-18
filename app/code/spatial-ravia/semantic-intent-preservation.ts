/** F1-D semantic preservation benchmark. Renderer-independent and production-neutral. */

import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaPromptSelection } from "./biology-dna-prompt-intent.ts";
import type { DnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";
import type { DnaMechanismSpec } from "./dna-mechanism-contract.ts";
import type { RnaSceneSpec } from "./rna-contract.ts";
import { adaptBiologySceneSpec, adaptDnaMechanismSpec, adaptDnaPromptSelection, adaptDnaVisualTemplate, adaptRnaSceneSpec, type LegacySemanticAdapterResult } from "./semantic-intent-legacy-adapters.ts";
import { semanticIntentFixtures } from "./semantic-intent-fixtures.ts";
import { validateSemanticIntent, type SemanticIntentV1 } from "./semantic-intent.ts";

export type PreservationSource = "BiologySceneSpec" | "RnaSceneSpec" | "DnaMechanismSpec" | "DnaPromptSelection" | "DnaVisualTemplate";

export type SemanticExpectation = {
  acts?: string[];
  subjectIds?: string[];
  phenomenon?: string;
  mechanism?: string;
  states?: string[];
  direction?: string;
  spatialFrame?: string;
  output?: string;
  claimStatuses?: string[];
  clarificationRequired?: boolean;
};

export type SemanticPreservationCase = {
  id: string;
  source: PreservationSource;
  rawUtterance: string;
  adapt: () => LegacySemanticAdapterResult;
  expected: SemanticExpectation;
};

const mention = (id: string, name = id) => ({ id, name, type: id === "dna" ? "dna" as const : id === "rna" ? "rna" as const : id.includes("polymerase") || id === "helicase" || id === "histone" ? "protein" as const : "other" as const });

const biologySpec = (intent: BiologySceneSpec["intent"], entities: BiologySceneSpec["entities"], actions: BiologySceneSpec["actions"] = [], relations: BiologySceneSpec["relations"] = [], temporal?: BiologySceneSpec["temporal"], dnaRegions?: BiologySceneSpec["dnaRegions"]): BiologySceneSpec => ({ intent, scale: "molecular", entities, relations, actions, renderMode: intent === "structure" ? "molecular-structure" : "mechanistic-3d", temporal, dnaRegions });

const simpleRna = (overrides: Partial<RnaSceneSpec>): RnaSceneSpec => ({
  family: "structure", focus: "RNA", scale: { level: "molecule", locality: "global" }, rnaType: "generic", structuralState: "singleStrand", strandCount: 1, pairingState: "none", requiredEntities: ["mRNA"], annotations: [], sequenceRequirements: { required: false }, secondaryStructure: { required: false, motifs: [] }, dnaContext: { required: false }, processingState: "none", degradationState: "unspecified", representation: { detail: "overview", showBackbone: true, showBases: true, showAnnotations: false }, supportExpectation: "renderer-ready", ...overrides,
});

const dnaMechanism = (family: DnaMechanismSpec["family"], focus: string, structuralState: DnaMechanismSpec["structuralState"], mechanismType: DnaMechanismSpec["interactions"][number]["type"]): DnaMechanismSpec => ({
  family, focus, scale: { level: family === "basePairing" ? "basePair" : "localChemistry", locality: "local" }, requiredPrimitives: ["bondingInteraction"], molecularSelections: [{ id: "a", kind: family === "backboneChemistry" ? "phosphate" : "base", label: "selected DNA group", strand: "A", structuralAnchor: "existingDnaVisualSystem" }, { id: "b", kind: "base", label: "paired DNA group", strand: "B", structuralAnchor: "existingDnaVisualSystem" }], participatingGroups: ["selected DNA groups"], interactions: [{ id: "interaction", type: mechanismType, participants: ["a", "b"], role: mechanismType === "hydrogenBond" ? "donorAcceptor" : "stabilization", state: "present", evidence: "explanatory" }], orientation: { strandDirections: ["5primeTo3prime", "3primeTo5prime"], antiparallel: family === "polarityAntiparallel", atomOrGroupAnchors: ["a", "b"] }, structuralState, annotations: [], representation: { backbone: "canonicalDna", localResidueDetail: "atomAndBond", basePairRungs: family === "basePairing", grooveReadability: family === "helixStabilization", strandSeparation: family === "strandSeparation", atomColorGrammar: true }, structuralSubstrate: "existingDnaVisualSystem",
});

const selection = (family: DnaPromptSelection["family"], detailLevel: DnaPromptSelection["detailLevel"], focalRegion: DnaPromptSelection["focalRegion"], requestedEntities: DnaPromptSelection["requestedEntities"]): DnaPromptSelection => ({ family, detailLevel, focalRegion, cameraIntent: focalRegion.kind === "fork" ? "fork" : focalRegion.kind === "transcription-bubble" ? "transcription-bubble" : focalRegion.kind === "whole-molecule" ? "whole-helix" : "local-chemistry", requestedEntities });

const template = (family: DnaVisualTemplate["family"], focus: string, importantEntities: string[]): DnaVisualTemplate => ({ family, templateId: `dna-${family}-template`, representationLevel: "polymer", focus, scale: "molecular", importantEntities, cameraPreset: {} as never, useExperimentalCoordinates: false, useCanonicalProceduralDNA: true, allowProteinContext: false, allowTranscriptionComplex: family === "transcription", allowReplicationMachinery: family === "replication", allowBallAndStick: false, labels: [] });

export const f1SemanticPreservationCases: SemanticPreservationCase[] = [
  { id: "dna-structure", source: "BiologySceneSpec", rawUtterance: "show the structure of B-DNA", adapt: () => adaptBiologySceneSpec(biologySpec("structure", [mention("dna", "B-DNA")]), "show the structure of B-DNA"), expected: { acts: ["show"], subjectIds: ["dna"] } },
  { id: "dna-regulation", source: "BiologySceneSpec", rawUtterance: "show a promoter and gene on DNA", adapt: () => adaptBiologySceneSpec(biologySpec("relation", [mention("dna"), mention("promoter"), mention("gene")], [], [], undefined, [{ id: "p", kind: "promoter" }, { id: "g", kind: "gene" }]), "show a promoter and gene on DNA"), expected: { acts: ["explain"], subjectIds: ["dna", "promoter", "gene"] } },
  { id: "dna-regulation-selection", source: "DnaPromptSelection", rawUtterance: "show a regulatory region on DNA", adapt: () => adaptDnaPromptSelection(selection("sequence-regulation", "polymer", { kind: "sequence-region", includesStrandDirection: false }, ["dna", "promoter-or-gene-region"]), "show a regulatory region on DNA"), expected: { phenomenon: "regulation", subjectIds: ["dna", "regulatoryRegion"] } },
  { id: "dna-replication", source: "DnaPromptSelection", rawUtterance: "show a DNA replication fork", adapt: () => adaptDnaPromptSelection(selection("replication", "polymer", { kind: "fork", includesStrandDirection: true }, ["dna", "replication-machinery"]), "show a DNA replication fork"), expected: { acts: ["explain"], subjectIds: ["dna", "replicationActor"], phenomenon: "replication", spatialFrame: undefined } },
  { id: "dna-transcription", source: "DnaVisualTemplate", rawUtterance: "show RNA polymerase on DNA", adapt: () => adaptDnaVisualTemplate(template("transcription", "transcription-bubble", ["dna", "rna-polymerase"]), "show RNA polymerase on DNA"), expected: { acts: ["explain"], subjectIds: ["dna", "rnaPolymerase"], phenomenon: "transcription" } },
  { id: "dna-damage", source: "DnaPromptSelection", rawUtterance: "show a thymine dimer in DNA", adapt: () => adaptDnaPromptSelection(selection("damage-repair", "atom", { kind: "lesion-or-repair-site", includesStrandDirection: false }, ["dna", "local-ligand-or-damage"]), "show a thymine dimer in DNA"), expected: { subjectIds: ["dna", "lesion"], phenomenon: "damageRepair" } },
  { id: "dna-packaging", source: "DnaVisualTemplate", rawUtterance: "show DNA wrapped around a nucleosome", adapt: () => adaptDnaVisualTemplate(template("packaging", "nucleosome-or-loop", ["dna", "histone-or-packaging-complex"]), "show DNA wrapped around a nucleosome"), expected: { acts: ["show"], subjectIds: ["dna", "regulatoryRegion"], phenomenon: "packaging" } },
  { id: "dna-local-chemistry", source: "DnaPromptSelection", rawUtterance: "show a phosphodiester bond in DNA", adapt: () => adaptDnaPromptSelection(selection("local-chemistry", "atom", { kind: "selected-base-pair-or-residue", includesStrandDirection: true }, ["dna", "local-ligand-or-damage"]), "show a phosphodiester bond in DNA"), expected: { subjectIds: ["dna", "lesion"], phenomenon: "backboneChemistry" } },
  { id: "dna-base-pairing", source: "DnaMechanismSpec", rawUtterance: "show how guanine bonds with cytosine", adapt: () => adaptDnaMechanismSpec(dnaMechanism("basePairing", "G-C pairing", "pairedDuplex", "hydrogenBond"), "show how guanine bonds with cytosine"), expected: { acts: ["explain"], phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"] } },
  { id: "dna-backbone", source: "DnaMechanismSpec", rawUtterance: "show a phosphodiester bond in DNA", adapt: () => adaptDnaMechanismSpec(dnaMechanism("backboneChemistry", "phosphodiester", "pairedDuplex", "phosphodiester"), "show a phosphodiester bond in DNA"), expected: { phenomenon: "backboneChemistry", mechanism: "phosphodiesterLinkage" } },
  { id: "dna-polarity", source: "DnaMechanismSpec", rawUtterance: "why are DNA strands antiparallel", adapt: () => adaptDnaMechanismSpec(dnaMechanism("polarityAntiparallel", "antiparallel strands", "pairedDuplex", "noncovalent"), "why are DNA strands antiparallel"), expected: { phenomenon: "polarity", mechanism: "antiparallelOrganization", direction: "strandRelative" } },
  { id: "dna-stabilization", source: "DnaMechanismSpec", rawUtterance: "show base stacking in DNA", adapt: () => adaptDnaMechanismSpec(dnaMechanism("helixStabilization", "base stacking", "stackedDuplex", "baseStacking"), "show base stacking in DNA"), expected: { phenomenon: "helixStabilization", mechanism: "baseStacking" } },
  { id: "dna-separation", source: "DnaMechanismSpec", rawUtterance: "show DNA strands separating", adapt: () => adaptDnaMechanismSpec(dnaMechanism("strandSeparation", "strand separation", "separatedStrands", "hydrogenBond"), "show DNA strands separating"), expected: { phenomenon: "strandSeparation", mechanism: "hydrogenBonding", states: ["open"] } },
  { id: "dna-assembly", source: "DnaMechanismSpec", rawUtterance: "show one nucleotide joining another", adapt: () => adaptDnaMechanismSpec(dnaMechanism("nucleotideAssembly", "nucleotide assembly", "assembledNucleotide", "covalent"), "show one nucleotide joining another"), expected: { phenomenon: "nucleotideAssembly", mechanism: "phosphodiesterLinkage", states: ["intact"] } },
  { id: "rna-structure", source: "RnaSceneSpec", rawUtterance: "show the structure of RNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "structure" }), "show the structure of RNA"), expected: { acts: ["show"], subjectIds: ["mRNA"] } },
  { id: "rna-types", source: "RnaSceneSpec", rawUtterance: "show a tRNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "typesFunctions", rnaType: "tRNA", requiredEntities: ["tRNA"] }), "show a tRNA"), expected: { subjectIds: ["tRNA"] } },
  { id: "rna-nascent", source: "RnaSceneSpec", rawUtterance: "show newly synthesized RNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "nascentTranscript", structuralState: "nascent", requiredEntities: ["mRNA"], dnaContext: { required: true, role: "template" } }), "show newly synthesized RNA"), expected: { phenomenon: "transcription", mechanism: "transcriptionElongation", states: ["nascent"], subjectIds: ["mRNA", "dna"] } },
  { id: "rna-processing", source: "RnaSceneSpec", rawUtterance: "show introns and exons in pre mRNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "processing", rnaType: "mRNA", requiredEntities: ["mRNA", "exon", "intron"], structuralState: "preMature", processingState: "unprocessed" }), "show introns and exons in pre mRNA"), expected: { phenomenon: "rnaProcessing", states: ["preMRNA"] } },
  { id: "rna-secondary", source: "RnaSceneSpec", rawUtterance: "show an RNA hairpin", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "secondaryStructure", structuralState: "folded", requiredEntities: ["stem", "loop"] }), "show an RNA hairpin"), expected: { phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding", states: ["folded"] } },
  { id: "rna-pairing", source: "RnaSceneSpec", rawUtterance: "show how adenine pairs with uracil", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "pairingHybridization", requiredEntities: ["adenine", "uracil"], structuralState: "paired", pairingState: "paired" }), "show how adenine pairs with uracil"), expected: { phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"] } },
  { id: "rna-hybrid", source: "RnaSceneSpec", rawUtterance: "show an RNA DNA hybrid", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "pairingHybridization", requiredEntities: ["mRNA"], structuralState: "hybrid", pairingState: "hybrid", dnaContext: { required: true, role: "hybridPartner" } }), "show an RNA DNA hybrid"), expected: { phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation", states: ["hybridized"], subjectIds: ["mRNA", "dna"] } },
  { id: "rna-degradation", source: "RnaSceneSpec", rawUtterance: "show exonuclease degradation of RNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "degradationStability", structuralState: "degrading", degradationState: "degrading" }), "show exonuclease degradation of RNA"), expected: { phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["partiallyDegraded"] } },
  { id: "rna-stability", source: "RnaSceneSpec", rawUtterance: "why is RNA less chemically stable than DNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "degradationStability", requiredEntities: ["ribose", "twoPrimeHydroxyl"], degradationState: "hydrolysisContext" }), "why is RNA less chemically stable than DNA"), expected: { phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility" } },
  { id: "rna-local", source: "RnaSceneSpec", rawUtterance: "show a phosphodiester bond in RNA", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "localChemistry", requiredEntities: ["phosphodiesterLinkage", "phosphate", "ribose"] }), "show a phosphodiester bond in RNA"), expected: { phenomenon: "backboneChemistry", mechanism: "phosphodiesterLinkage" } },
  { id: "comparison-dna-rna", source: "RnaSceneSpec", rawUtterance: "compare a DNA nucleotide and an RNA nucleotide", adapt: () => adaptRnaSceneSpec(simpleRna({ family: "degradationStability", requiredEntities: ["ribose"], dnaContext: { required: true, role: "comparison" }, degradationState: "hydrolysisContext" }), "compare a DNA nucleotide and an RNA nucleotide"), expected: { output: "comparisonFigure", subjectIds: ["ribose", "dna"] } },
];

export type SemanticMismatch = { field: string; expected: unknown; actual: unknown };

const sorted = (values: readonly unknown[] | undefined) => [...(values ?? [])].map(String).sort();

export function compareSemanticMeaning(intent: SemanticIntentV1, expected: SemanticExpectation): SemanticMismatch[] {
  const mismatches: SemanticMismatch[] = [];
  const request = intent.requests[0];
  if (!request) return [{ field: "requests", expected: "at least one", actual: [] }];
  if (expected.acts && JSON.stringify(sorted(intent.acts)) !== JSON.stringify(sorted(expected.acts))) mismatches.push({ field: "acts", expected: sorted(expected.acts), actual: sorted(intent.acts) });
  if (expected.subjectIds) {
    const actual: string[] = request.subjects.flatMap((subject) => subject.resolvedId ? [subject.resolvedId] : []).sort();
    const expectedIds = [...expected.subjectIds].sort();
    if (!expectedIds.every((id) => actual.includes(id))) mismatches.push({ field: "subjectIds", expected: expectedIds, actual });
  }
  for (const [field, value] of [["phenomenon", expected.phenomenon], ["mechanism", expected.mechanism], ["spatialFrame", expected.spatialFrame]] as const) {
    if (value !== undefined && request[field] !== value) mismatches.push({ field, expected: value, actual: request[field] });
  }
  if (expected.states && JSON.stringify(sorted(request.states)) !== JSON.stringify(sorted(expected.states))) mismatches.push({ field: "states", expected: sorted(expected.states), actual: sorted(request.states) });
  if (expected.output && request.requestedOutput !== expected.output) mismatches.push({ field: "requestedOutput", expected: expected.output, actual: request.requestedOutput });
  if (expected.claimStatuses && JSON.stringify(sorted(intent.assertedClaims.map((claim) => claim.status))) !== JSON.stringify(sorted(expected.claimStatuses))) mismatches.push({ field: "claimStatuses", expected: expected.claimStatuses, actual: intent.assertedClaims.map((claim) => claim.status) });
  if (expected.clarificationRequired !== undefined && intent.clarification.required !== expected.clarificationRequired) mismatches.push({ field: "clarification.required", expected: expected.clarificationRequired, actual: intent.clarification.required });
  return mismatches;
}

export type PreservationBenchmarkResult = { total: number; passed: number; failures: Array<{ id: string; source: PreservationSource; mismatches: SemanticMismatch[]; validationIssues: string[] }> };

export function runF1SemanticPreservationBenchmark(cases = f1SemanticPreservationCases): PreservationBenchmarkResult {
  const failures: PreservationBenchmarkResult["failures"] = [];
  for (const testCase of cases) {
    const result = testCase.adapt();
    const validation = validateSemanticIntent(result.intent);
    const mismatches = compareSemanticMeaning(result.intent, testCase.expected);
    if (!validation.valid || mismatches.length > 0) failures.push({ id: testCase.id, source: testCase.source, mismatches, validationIssues: validation.valid ? [] : validation.issues.map((issue) => `${issue.path}: ${issue.message}`) });
  }
  return { total: cases.length, passed: cases.length - failures.length, failures };
}

export const f1HostileContractFixtures: SemanticIntentV1[] = [
  semanticIntentFixtures.badGrammar,
  semanticIntentFixtures.slang,
  semanticIntentFixtures.incompleteAnaphoric,
  semanticIntentFixtures.misconception,
  semanticIntentFixtures.multiIntent,
  { schemaVersion: "1", rawUtterance: "rna breaking from left", canonicalGloss: "Represent RNA cleavage with screen-relative left direction only.", acts: ["show"], requests: [{ subjects: [{ rawText: "RNA", resolvedId: "rna" }], phenomenon: "cleavage", mechanism: "rnaCleavage", focus: "local", direction: { screen: "screenLeft", meaning: "presentational" }, spatialFrame: "screen", outputPreferences: ["static"], requestedOutput: "scientificFigure" }], assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 0.8 },
] as SemanticIntentV1[];
