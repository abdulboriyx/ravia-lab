import type { RnaFamily, RnaIntent, RnaSceneSpec, RnaScale, RnaType, RnaEntity, RnaStructuralState, RnaPairingState, RnaProcessingState, RnaStabilityState } from "./rna-contract.ts";

type FamilyRule = { family: RnaFamily; terms: string[]; weight: number };
const rules: FamilyRule[] = [
  { family: "localChemistry", terms: ["2 prime oh", "2′-oh", "ribose", "phosphate group", "phosphodiester bond", "3 prime and 5 prime ends", "uracil", "nucleotide components", "local chemistry", "dna nucleotide", "chemical difference", "differs chemically"], weight: 6 },
  { family: "processing", terms: ["5 prime cap", "5′ cap", "poly a", "poly(a)", "intron", "exon", "splice", "splicing", "pre-mrna", "mature mrna"], weight: 6 },
  { family: "secondaryStructure", terms: ["hairpin", "stem", "stem loop", "stem-loop", "folded rna motif", "secondary structure", "bulge", "internal loop", "paired and unpaired", "paired region", "unpaired region", "unpaired bases"], weight: 6 },
  { family: "pairingHybridization", terms: ["pairs with uracil", "pairing", "g-c pairing", "g u wobble", "g-u wobble", "rna-dna hybrid", "complementary rna", "hybridization"], weight: 6 },
  { family: "degradationStability", terms: ["cleaved", "cleavage", "degradation", "rna stability", "less chemically stable", "less stable", "backbone is cut", "exposed rna end", "exposed end", "hydrolysis"], weight: 6 },
  { family: "nascentTranscript", terms: ["newly synthesized", "emerging from transcription", "nascent", "immediately after transcription", "rna polymerase", "transcript"], weight: 5 },
  { family: "typesFunctions", terms: ["mrna", "messenger rna", "trna", "transfer rna", "rrna", "ribosomal rna", "mirna", "sirna", "snrna", "regulatory small rna", "coding rna", "major rna types", "compare mrna and trna"], weight: 5 },
  { family: "structure", terms: ["structure of rna", "single rna", "single-stranded rna", "usually single stranded", "strand of rna", "compare rna", "rna backbone", "sugar phosphate", "ribonucleotide", "rna molecule"], weight: 3 },
];

export function normalizeRnaPrompt(prompt: string) {
  return prompt.toLowerCase().replace(/[′’]/g, "′").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

export function resolveRnaFamily(prompt: string): { family: RnaFamily; confidence: number; matchedTerms: string[] } | undefined {
  const text = normalizeRnaPrompt(prompt);
  if (!text) return undefined;
  if (/^(show|explain|visualize|what is)?\s*(the\s+)?rna$/.test(text)) return scored("structure", text);
  if (/(pairs with uracil|g-c pairing|g ?-?u wobble|rna[ -]?dna hybrid|complementary rna|hybridization)/.test(text)) return scored("pairingHybridization", text);
  // Exonuclease is a degradation mechanism, not an exon/intron processing
  // request. This guard must precede the broad `exon` processing vocabulary.
  if (/exonuclease|exonucleolytic|exonucleo/.test(text)) return scored("degradationStability", text);
  // Specific chemistry and processing guards must precede broad “RNA”/“transcript” matches.
  if (/(2 ?prime ?-?oh|2′-?oh|\bribose\b|phosphate group|phosphodiester bond|3 prime and 5 prime ends|\buracil\b|nucleotide components|local chemistry|dna nucleotide|chemical difference|differs chemically)/.test(text) && !/single rna nucleotide|ribonucleotide/.test(text)) return scored("localChemistry", text);
  if (/(5 ?prime cap|5′ cap|poly ?\(?a\)? tail|intron|exon|splice|pre-mrna|mature mrna|processing of a primary)/.test(text) && !/(immediately after transcription|pre-mrna before processing)/.test(text)) return scored("processing", text);
  if (/(newly synthesized|newly made|emerging from transcription|immediately after transcription|nascent|rna polymerase|pre-mrna before processing|dna to rna production)/.test(text)) return scored("nascentTranscript", text);
  if (/(hairpin|stem ?-?loop|bulge|internal loop|paired and unpaired|paired region|unpaired region)/.test(text)) return scored("secondaryStructure", text);
  if (/(pairs with uracil|g-c pairing|g ?-?u wobble|rna-?dna hybrid|complementary rna|hybridization)/.test(text)) return scored("pairingHybridization", text);
  if (/(cleav|degrad|less (?:chemically )?stable|backbone is cut|exposed (?:rna )?end|hydrolysis)/.test(text)) return scored("degradationStability", text);
  if (/(newly synthesized|emerging from transcription|nascent|immediately after transcription|rna polymerase|rna transcript)/.test(text)) return scored("nascentTranscript", text);
  if (/(compare mrna and trna|messenger rna|transfer rna|ribosomal rna|\bmrna\b|\btrna\b|\brrna\b|\bmirna\b|\bsirna\b|\bsnrna\b)/.test(text)) return scored("typesFunctions", text);
  const candidates = rules.map((rule) => ({ rule, matches: rule.terms.filter((term) => text.includes(term)), score: rule.terms.filter((term) => text.includes(term)).length * rule.weight })).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best && best.score > 0 ? { family: best.rule.family, confidence: Math.min(1, best.score / 12), matchedTerms: best.matches } : undefined;
}

function scored(family: RnaFamily, text: string) {
  const rule = rules.find((candidate) => candidate.family === family)!;
  const matches = rule.terms.filter((term) => text.includes(term));
  return { family, confidence: Math.min(1, Math.max(0.8, matches.length * rule.weight / 12)), matchedTerms: matches };
}

export function resolveRnaIntent(prompt: string): RnaIntent | undefined {
  const resolved = resolveRnaFamily(prompt);
  if (!resolved) return undefined;
  const text = normalizeRnaPrompt(prompt);
  return { ...resolved, spec: buildRnaSceneSpec(text, resolved.family) };
}

function buildRnaSceneSpec(text: string, family: RnaFamily): RnaSceneSpec {
  const rnaType = inferRnaType(text);
  const scale = inferScale(text, family);
  const pairingState = inferPairing(text, family);
  const processingState = inferProcessing(text, family);
  const degradationState = inferStability(text, family);
  const structuralState = inferStructuralState(text, family, processingState, degradationState);
  const entities = inferEntities(text, family, rnaType, pairingState, processingState, degradationState);
  const secondary = inferSecondary(text, family);
  const dnaContext = /rna[ -]?dna hybrid|dna nucleotide|compare a dna nucleotide|dna and its nascent|less chemically stable than dna|differs chemically from dna/.test(text)
    ? { required: true, role: text.includes("hybrid") ? "hybridPartner" as const : "comparison" as const }
    : { required: family === "nascentTranscript" && /dna and|dna to/.test(text), role: "template" as const };
  return {
    family, focus: focusFor(text, family), scale: { level: scale, locality: scale === "localChemistry" ? "local" : scale === "molecule" ? "global" : "regional" }, rnaType,
    structuralState, strandCount: pairingState === "hybrid" || /complementary rna strands/.test(text) ? 2 : 1, pairingState, requiredEntities: entities,
    annotations: family === "degradationStability" && /exonuclease|exonucleolytic|exonucleo/.test(text) ? ["exonuclease"] : [], sequenceRequirements: { required: /adenine|uracil|g-c|g-u|complementary/.test(text), bases: /adenine|uracil/.test(text) ? ["A", "U"] : undefined }, secondaryStructure: secondary,
    dnaContext, processingState, degradationState, representation: { detail: scale === "localChemistry" ? "atomAndBond" : scale === "secondaryStructure" ? "residue" : "overview", showBackbone: true, showBases: true, showAnnotations: true }, supportExpectation: "grounded-or-explanatory",
  };
}

function inferRnaType(text: string): RnaType {
  if (/coding rna|regulatory small rna/.test(text)) return "regulatorySmallRNA";
  if (/poly ?\(?a\)?|5 prime cap|intron|exon|splic|pre-mrna|mature mrna/.test(text)) return "mRNA";
  if (/\bmrna\b|messenger/.test(text)) return "mRNA";
  if (/\btrna\b|transfer/.test(text)) return "tRNA";
  if (/\brrna\b|ribosomal/.test(text)) return "rRNA";
  if (/\bmirna\b/.test(text)) return "miRNA";
  if (/\bsirna\b/.test(text)) return "siRNA";
  if (/\bsnrna\b/.test(text)) return "snRNA";
  if (/regulatory|small rna/.test(text)) return "regulatorySmallRNA";
  return "generic";
}
function inferScale(text: string, family: RnaFamily): RnaScale {
  if (family === "localChemistry" && /nucleotide components/.test(text)) return "nucleotide";
  if (family === "localChemistry" || /2′-oh|2 prime oh|phosphodiester|\bribose\b/.test(text)) return "localChemistry";
  if (family === "secondaryStructure") return "secondaryStructure";
  if (family === "pairingHybridization") return /hybrid|strands/.test(text) ? "hybrid" : "nucleotide";
  if (family === "nascentTranscript") return "transcript";
  if (family === "typesFunctions") return /compare mrna and trna/.test(text) ? "strand" : /\btrna\b|\brrna\b|major rna types/.test(text) ? "molecule" : "strand";
  if (family === "degradationStability" && /less chemically stable|hydrolysis|backbone is cut/.test(text)) return "localChemistry";
  if (family === "processing" && /where is|added to/.test(text)) return "localChemistry";
  if (family === "processing" || family === "degradationStability") return "strand";
  return /single .*nucleotide|ribonucleotide/.test(text) ? "nucleotide" : /rna backbone|sugar phosphate|single stranded|strand of rna/.test(text) ? "strand" : family === "structure" ? "molecule" : "strand";
}
function inferPairing(text: string, family: RnaFamily): RnaPairingState {
  if (family !== "pairingHybridization" && family !== "secondaryStructure") return "none";
  if (/wobble/.test(text)) return "wobble";
  if (/rna[ -]?dna hybrid/.test(text)) return "hybrid";
  if (/unpaired|bulge|internal loop|secondary structure/.test(text)) return "partiallyPaired";
  return "paired";
}
function inferProcessing(text: string, family: RnaFamily): RnaProcessingState {
  if (family === "nascentTranscript" && /pre-mrna/.test(text)) return "unprocessed";
  if (family !== "processing") return "none";
  if (/pre[- ]?mrna.*mature[- ]?mrna|mature[- ]?mrna.*pre[- ]?mrna/.test(text)) return "comparePreMature";
  if (/processing of a primary|primary mrna transcript/.test(text)) return "mature";
  if (/splic|exon joining|during rna processing/.test(text)) return "spliced";
  if (/poly ?\(?a\)?/.test(text)) return "polyadenylated";
  if (/cap/.test(text)) return "capped";
  return "unprocessed";
}
function inferStability(text: string, family: RnaFamily): RnaStabilityState {
  if (family !== "degradationStability") return "unspecified";
  if (/rna stability|less chemically stable/.test(text)) return "unspecified";
  if (/hydrolysis|less chemically stable|less stable/.test(text)) return "hydrolysisContext";
  if (/cleav|backbone is cut/.test(text)) return "cleaved";
  if (/exposed/.test(text)) return "exposedEnd";
  return "degrading";
}
function inferStructuralState(text: string, family: RnaFamily, processing: RnaProcessingState, stability: RnaStabilityState): RnaStructuralState {
  if (family === "nascentTranscript") return "nascent";
  if (family === "typesFunctions") return /compare mrna and trna/.test(text) ? "singleStrand" : /trna|rrna|major rna types/.test(text) ? "folded" : "singleStrand";
  if (family === "processing") return processing === "mature" || processing === "spliced" || /change mrna/.test(text) ? "mature" : processing === "comparePreMature" ? "preMature" : "preMature";
  if (family === "secondaryStructure") return "folded";
  if (family === "pairingHybridization") return inferPairing(text, family) === "hybrid" ? "hybrid" : "paired";
  if (family === "degradationStability") return stability === "cleaved" ? "cleaved" : stability === "degrading" || stability === "hydrolysisContext" ? "degrading" : "intact";
  return family === "structure" ? "singleStrand" : "intact";
}
function inferSecondary(text: string, family: RnaFamily) {
  const motifs: RnaSceneSpec["secondaryStructure"]["motifs"] = [];
  if (/stem/.test(text)) motifs.push("stem");
  if (/hairpin|stem ?-?loop/.test(text)) motifs.push("hairpin", "stemLoop");
  if (/bulge/.test(text)) motifs.push("bulge");
  if (/internal loop/.test(text)) motifs.push("internalLoop");
  if (/paired/.test(text)) motifs.push("pairedRegion");
  if (/unpaired/.test(text)) motifs.push("unpairedRegion");
  return { required: family === "secondaryStructure", motifs: [...new Set(motifs)] };
}
function inferEntities(text: string, family: RnaFamily, type: RnaType, pairing: RnaPairingState, processing: RnaProcessingState, stability: RnaStabilityState): RnaEntity[] {
  const entities = new Set<RnaEntity>(["ribose", "phosphate", "base"]);
  if (family === "localChemistry") { entities.add("twoPrimeHydroxyl"); entities.add("phosphodiesterLinkage"); }
  if (family === "localChemistry" && /3 prime and 5 prime ends/.test(text)) { entities.add("threePrimeEnd"); entities.add("fivePrimeEnd"); }
  if (/adenine|a-u|a u|complementary rna/.test(text)) entities.add("adenine"); if (/uracil|pairs with uracil|a-u|a u|g-u|g u|wobble|complementary rna|differs chemically/.test(text)) entities.add("uracil"); if (/g-c|g c|g-u|g u|guanine|wobble/.test(text)) entities.add("guanine"); if (/g-c|g c|cytosine/.test(text)) entities.add("cytosine");
  if (family === "processing") { if (/cap|compare pre-mrna|processing of a primary/.test(text)) { entities.add("cap"); entities.add("fivePrimeEnd"); } if (/poly ?\(?a\)?|compare pre-mrna|processing of a primary/.test(text)) { entities.add("polyATail"); entities.add("threePrimeEnd"); } if (/intron|compare pre-mrna|pre-mrna|splic|exon joining|processing of a primary/.test(text)) entities.add("intron"); if (/exon|compare pre-mrna|pre-mrna|splic|exon joining|processing of a primary/.test(text)) entities.add("exon"); }
  if (family === "secondaryStructure") { if (/stem|hairpin|bulge|internal loop|secondary structure|folded rna motif/.test(text)) entities.add("stem"); if (/loop|hairpin|internal loop|secondary structure|folded rna motif/.test(text)) entities.add("loop"); if (/bulge/.test(text)) entities.add("bulge"); if (/paired|stem form|secondary structure|folded rna motif/.test(text)) entities.add("pairedRegion"); if (/unpaired|secondary structure/.test(text)) entities.add("unpairedRegion"); }
  if (family === "pairingHybridization") { if (pairing === "paired" || pairing === "wobble" || pairing === "hybrid") entities.add("pairedRegion"); }
  if (family === "degradationStability") { entities.add("phosphodiesterLinkage"); if (/less chemically stable|hydrolysis/.test(text)) { entities.add("ribose"); entities.add("twoPrimeHydroxyl"); } if (stability === "exposedEnd" || stability === "cleaved") { entities.add("fivePrimeEnd"); entities.add("threePrimeEnd"); } }
  if (type !== "generic") entities.add(type === "regulatorySmallRNA" ? "miRNA" : type);
  if (/\btrna\b|transfer rna/.test(text)) entities.add("tRNA");
  if (/\brrna\b|ribosomal rna/.test(text)) entities.add("rRNA");
  if (/\bmrna\b|messenger rna/.test(text)) entities.add("mRNA");
  if (/major rna types/.test(text)) { entities.add("mRNA"); entities.add("tRNA"); entities.add("rRNA"); entities.add("miRNA"); }
  if (family === "nascentTranscript" && /pre-mrna/.test(text)) { entities.add("intron"); entities.add("exon"); }
  return [...entities];
}
function focusFor(text: string, family: RnaFamily) {
  if (family === "localChemistry") {
    if (/2 ?prime ?-?oh|2′-?oh/.test(text)) return "twoPrimeOH";
    if (/phosphodiester bond/.test(text)) return "phosphodiesterLinkage";
    if (/\buracil\b/.test(text)) return "uracil";
    if (/\bribose\b/.test(text)) return "ribose";
    if (/3 prime and 5 prime ends|1 prime.*2 prime.*3 prime.*5 prime/.test(text)) return "sugarPositions";
    if (/dna nucleotide|chemical difference|differs chemically/.test(text)) return "rnaVsDnaComparison";
    return "nucleotide";
  }
  return family === "typesFunctions" ? `${inferRnaType(text)} identity and function` : family === "processing" ? "RNA processing state" : family === "secondaryStructure" ? "RNA secondary-structure motif" : family === "pairingHybridization" ? "RNA base pairing or hybridization" : family === "degradationStability" ? "RNA cleavage and stability" : family === "nascentTranscript" ? "nascent RNA transcript" : "RNA molecular structure";
}
