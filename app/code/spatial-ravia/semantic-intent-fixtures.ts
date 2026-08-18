import type { SemanticIntentV1 } from "./semantic-intent.ts";

const entity = (rawText: string, resolvedId?: SemanticIntentV1["requests"][number]["subjects"][number]["resolvedId"], candidateIds?: SemanticIntentV1["requests"][number]["subjects"][number]["candidateIds"]) => ({ rawText, resolvedId, candidateIds });

export const semanticIntentFixtures: Record<string, SemanticIntentV1> = {
  rnaHairpin: {
    schemaVersion: "1", rawUtterance: "show an RNA hairpin", canonicalGloss: "Present an RNA hairpin secondary structure.", acts: ["show"],
    requests: [{ subjects: [entity("RNA", "rna")], phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding", states: ["folded"], focus: "overview", detail: "auto", outputPreferences: ["static"], requestedOutput: "scientificFigure" }],
    assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 0.98,
  },
  dnaRnaComparison: {
    schemaVersion: "1", rawUtterance: "compare DNA and RNA nucleotides", canonicalGloss: "Compare matched DNA and RNA nucleotide chemistry.", acts: ["compare"],
    requests: [{ subjects: [entity("DNA", "dna"), entity("RNA", "rna"), entity("nucleotides", "nucleotide")], phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "relationship", detail: "intermediate", outputPreferences: ["comparison", "static"], requestedOutput: "comparisonFigure" }],
    assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 0.97,
  },
  badGrammar: {
    schemaVersion: "1", rawUtterance: "why dna dont have 2 oh", canonicalGloss: "Explain the asserted absence of a 2′ hydroxyl in DNA.", acts: ["explain"],
    requests: [{ subjects: [entity("dna", "dna"), entity("2 oh", "riboseTwoPrimeHydroxyl")], phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "local", detail: "beginner", outputPreferences: ["static", "localFocus"], requestedOutput: "scientificFigure" }],
    assertedClaims: [{ rawText: "dna dont have 2 oh", status: "neutral", correctedInterpretation: "DNA uses deoxyribose and lacks the ribose 2′-OH group." }], alternatives: [], clarification: { required: false }, confidence: 0.88,
  },
  slang: {
    schemaVersion: "1", rawUtterance: "how the hell A sticks to T", canonicalGloss: "Explain how adenine pairs with thymine.", acts: ["explain"],
    requests: [{ subjects: [entity("A", "adenine"), entity("T", "thymine")], phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", detail: "auto", outputPreferences: ["static"], requestedOutput: "scientificFigure" }],
    assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 0.94,
  },
  incompleteAnaphoric: {
    schemaVersion: "1", rawUtterance: "show that thing that opens dna", canonicalGloss: "Show the molecular actor responsible for opening DNA, pending disambiguation.", acts: ["show"],
    requests: [{ subjects: [entity("that thing", undefined, ["helicase", "rnaPolymerase"])], phenomenon: "strandSeparation", mechanism: "strandOpening", focus: "activeSite", detail: "auto", outputPreferences: ["static", "localFocus"], requestedOutput: "scientificFigure" }],
    assertedClaims: [], alternatives: [{ id: "helicase", description: "DNA replication-associated helicase opening DNA", requests: [{ subjects: [entity("opening actor", "helicase")], phenomenon: "replication", mechanism: "strandOpening" }], confidence: 0.5 }, { id: "transcription", description: "RNA polymerase-associated transcription opening", requests: [{ subjects: [entity("opening actor", "rnaPolymerase")], phenomenon: "transcription", mechanism: "transcriptionElongation" }], confidence: 0.5 }], clarification: { required: true, reason: "scienceChangingAmbiguity", questionPlaceholder: "Do you mean helicase during replication or RNA polymerase during transcription?" }, confidence: 0.42,
  },
  misconception: {
    schemaVersion: "1", rawUtterance: "DNA has ribose right?", canonicalGloss: "Assess the user's claim that DNA contains ribose.", acts: ["explain"],
    requests: [{ subjects: [entity("DNA", "dna"), entity("ribose", "ribose")], phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "relationship", detail: "beginner", outputPreferences: ["static"], requestedOutput: "scientificFigure" }],
    assertedClaims: [{ rawText: "DNA has ribose right?", status: "suspected", correctedInterpretation: "DNA contains deoxyribose rather than ribose." }], alternatives: [], clarification: { required: false }, confidence: 0.86,
  },
  multiIntent: {
    schemaVersion: "1", rawUtterance: "show DNA strands going opposite and explain why", canonicalGloss: "Show and explain antiparallel DNA strand directions.", acts: ["show", "explain"],
    requests: [{ subjects: [entity("DNA strands", "strand"), entity("DNA", "duplex")], phenomenon: "polarity", mechanism: "antiparallelOrganization", states: ["paired"], focus: "relationship", direction: { biochemical: "fiveToThree", meaning: "scientific" }, spatialFrame: "strandRelative", detail: "auto", outputPreferences: ["static", "overview"], requestedOutput: "scientificFigure" }],
    assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 0.96,
  },
};
