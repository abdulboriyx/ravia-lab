import type {
  DnaInteraction,
  DnaMechanismFamily,
  DnaMechanismPrimitive,
  DnaMechanismScale,
  DnaMechanismSpec,
  DnaMolecularSelection,
} from "./dna-mechanism-contract.ts";
import { canonicalBasePairInteractions, canonicalBasePairSelections, type DnaCanonicalPair } from "./DnaBasePairInteractionPresentation.ts";
import { backboneChemistryInteractions, backboneChemistrySelections } from "./DnaBackboneChemistryPresentation.ts";
import { polarityInteractions, polaritySelections } from "./DnaPolarityAntiparallelPresentation.ts";
import { helixStabilizationInteractions, helixStabilizationSelections } from "./DnaHelixStabilizationPresentation.ts";
import { separationPairForPrompt, separationStateForPrompt, strandSeparationInteractions, strandSeparationSelections } from "./DnaStrandSeparationPresentation.ts";

export type DnaMechanismIntent = {
  family: DnaMechanismFamily;
  confidence: number;
  matchedTerms: string[];
  spec: DnaMechanismSpec;
};

type FamilyRule = { family: DnaMechanismFamily; terms: string[]; weight: number };

const familyRules: FamilyRule[] = [
  { family: "basePairing", terms: ["guanine", "cytosine", "adenine", "thymine", "g and c", "a and t", "g-c", "a-t", "base pair", "bases pair", "pairing", "donor", "acceptor", "purine", "pyrimidine", "complementary"], weight: 4 },
  { family: "backboneChemistry", terms: ["phosphodiester", "sugar phosphate", "phosphate sugar", "phosphate connect", "two sugars", "connect two sugars", "deoxyribose", "1 prime", "3 prime carbon", "5 prime carbon", "nucleotide connected", "nucleotides connected", "neighboring nucleotide", "links neighboring", "backbone", "carbon"], weight: 5 },
  { family: "polarityAntiparallel", terms: ["antiparallel", "5 prime", "3 prime", "5'", "3'", "polarity", "opposite orientation", "orientation of paired", "which way", "direction", "run"], weight: 5 },
  { family: "helixStabilization", terms: ["base stacking", "stacking", "major groove", "minor groove", "grooves", "holds the dna double helix", "stabilize", "stabilization", "consistent width", "bases inside", "backbone faces outward", "organization of the dna helix"], weight: 5 },
  { family: "strandSeparation", terms: ["separate", "separated", "separation", "melt", "melting", "reanneal", "reannealing", "open", "opening", "strands", "breaks when", "strand separation"], weight: 4 },
  { family: "nucleotideAssembly", terms: ["joining", "join", "add a nucleotide", "added to", "growing strand", "extension", "assembled", "organized from phosphate", "adjacent nucleotide", "nucleotide connectivity", "build a dna strand", "become part of dna"], weight: 5 },
];

export function resolveDnaMechanismFamily(prompt: string): { family: DnaMechanismFamily; confidence: number; matchedTerms: string[] } | undefined {
  const text = normalize(prompt);
  if (!text) return undefined;

  // High-specificity guards prevent broad “bond”, “strand”, and “DNA” words
  // from stealing ownership from the mechanism they actually describe.
  if (/(organized from phosphate|nucleotide is organized|dna is extended|nucleotide.*extension)/.test(text)) return scoreResult("nucleotideAssembly", text, familyRules);
  if (/(during assembly|free nucleotide|nucleotide in a strand|adjacent nucleotide|nucleotide connectivity)/.test(text)) return scoreResult("nucleotideAssembly", text, familyRules);
  if (/(phosphodiester|sugar phosphate|phosphate sugar|phosphate connect|two sugars|connect two sugars|deoxyribose|[135] prime carbon|nucleotides connected|neighboring nucleotide|links neighboring)/.test(text)) return scoreResult("backboneChemistry", text, familyRules);
  if (/(antiparallel|5 prime|3 prime|polarity|opposite orientation|orientation of paired|which way.*strand|direction.*strand)/.test(text)) return scoreResult("polarityAntiparallel", text, familyRules);
  if (/(base stacking|stacking|major groove|minor groove|grooves|holds the dna double helix|consistent width|bases inside|backbone faces outward|organization of the dna helix)/.test(text)) return scoreResult("helixStabilization", text, familyRules);
  if (/(reanneal|separate.*strand|strand separation|what breaks when.*strand|melt|dna bubble|opened dna|opening and closing)/.test(text)) return scoreResult("strandSeparation", text, familyRules);
  if (/(join|joining|add.*nucleotide|added to.*strand|growing strand|extension|organized from phosphate sugar and base|build.*dna strand|become part of dna)/.test(text)) return scoreResult("nucleotideAssembly", text, familyRules);
  if (/(guanine|cytosine|adenine|thymine|\bg\s*(?:-|and)\s*c\b|\ba\s*(?:-|and)\s*t\b|base pair|bases pair|pairing|donor|acceptor|purine|pyrimidine|complementary)/.test(text)) return scoreResult("basePairing", text, familyRules);

  const candidates = familyRules.map((rule) => ({
    rule,
    matches: rule.terms.filter((term) => text.includes(term)),
    score: rule.terms.reduce((sum, term) => sum + (text.includes(term) ? rule.weight : 0), 0),
  })).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best && best.score > 0 ? { family: best.rule.family, confidence: Math.min(1, best.score / 12), matchedTerms: best.matches } : undefined;
}

export function resolveDnaMechanismIntent(prompt: string): DnaMechanismIntent | undefined {
  const resolved = resolveDnaMechanismFamily(prompt);
  if (!resolved) return undefined;
  const spec = buildMechanismSpec(normalize(prompt), resolved.family);
  return { ...resolved, spec };
}

export function normalizeDnaMechanismPrompt(prompt: string) {
  return prompt.toLowerCase().replace(/[′’]/g, " prime ").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function normalize(prompt: string) {
  return normalizeDnaMechanismPrompt(prompt).replace(/\b5\s*prime\b/g, "5 prime").replace(/\b3\s*prime\b/g, "3 prime");
}

function scoreResult(family: DnaMechanismFamily, text: string, rules: FamilyRule[]) {
  const rule = rules.find((candidate) => candidate.family === family)!;
  const matchedTerms = rule.terms.filter((term) => text.includes(term));
  return { family, confidence: Math.min(1, Math.max(0.75, matchedTerms.length * rule.weight / 12)), matchedTerms };
}

const primitiveProfiles: Record<DnaMechanismFamily, DnaMechanismPrimitive[]> = {
  basePairing: ["bondingInteraction", "molecularAssembly", "stabilizationForces"],
  backboneChemistry: ["bondingInteraction", "molecularAssembly", "localConformationalChange"],
  polarityAntiparallel: ["polarityOrientation", "molecularAssembly"],
  helixStabilization: ["stabilizationForces", "molecularAssembly", "bondingInteraction"],
  strandSeparation: ["bondingInteraction", "stabilizationForces", "localConformationalChange", "reactionStateProgression", "polarityOrientation"],
  nucleotideAssembly: ["molecularAssembly", "bondingInteraction", "localConformationalChange", "reactionStateProgression"],
};

function buildMechanismSpec(text: string, family: DnaMechanismFamily): DnaMechanismSpec {
  const scale = scaleFor(text, family);
  const selections = selectionsFor(text, family);
  const interactions = interactionsFor(text, family, selections);
  const duplex = family !== "nucleotideAssembly" || !/single nucleotide|one nucleotide/.test(text);
  const reactionRequired = /separat|reanneal|join|add|formation|extend|growing|build|opening and closing/.test(text);
  return {
    family,
    focus: focusFor(text, family),
    scale: { level: scale, locality: scale === "duplex" ? "regional" : scale === "strand" ? "regional" : "local" },
    requiredPrimitives: [...primitiveProfiles[family]],
    molecularSelections: selections,
    participatingGroups: selections.map((selection) => selection.id),
    interactions,
    orientation: {
      strandDirections: duplex ? ["5primeTo3prime", "3primeTo5prime"] : ["5primeTo3prime"],
      antiparallel: duplex,
      atomOrGroupAnchors: ["dna-axis", "strand-direction"],
    },
    structuralState: family === "strandSeparation" ? (text.includes("reanneal") ? "reannealing" : text.includes("separated") || text.includes("melt") ? "separatedStrands" : "locallyOpen") : family === "helixStabilization" ? "stackedDuplex" : family === "nucleotideAssembly" ? "assembledNucleotide" : duplex ? "pairedDuplex" : "singleStrand",
    annotations: [],
    representation: {
      backbone: "canonicalDna",
      localResidueDetail: scale === "localChemistry" ? "atomAndBond" : scale === "basePair" || scale === "nucleotide" ? "residue" : "none",
      basePairRungs: family !== "backboneChemistry" || scale === "duplex",
      grooveReadability: family === "helixStabilization",
      strandSeparation: family === "strandSeparation",
      atomColorGrammar: scale === "localChemistry",
    },
    reaction: {
      required: reactionRequired,
      steps: reactionRequired ? [
        { id: "before", label: "before", interactionStates: interactions.map(({ id }) => ({ id, state: "absent" as const })) },
        { id: "transition", label: "transition", interactionStates: interactions.map(({ id }) => ({ id, state: "forming" as const })) },
        { id: "after", label: "after", interactionStates: interactions.map(({ id }) => ({ id, state: "present" as const })) },
      ] : [],
    },
    structuralSubstrate: "existingDnaVisualSystem",
  };
}

function scaleFor(text: string, family: DnaMechanismFamily): DnaMechanismScale {
  if (/individual|one nucleotide|phosphate sugar and base|1 prime carbon|3 prime carbon|5 prime carbon|phosphodiester|hydrogen bond|donor|acceptor|stacking forces/.test(text)) return "localChemistry";
  if (/base pair|guanine.*cytosine|adenine.*thymine|purine.*pyrimidine|pairing/.test(text)) return "basePair";
  if (family === "polarityAntiparallel" || family === "helixStabilization" || family === "strandSeparation") return "duplex";
  return family === "backboneChemistry" || family === "nucleotideAssembly" ? "nucleotide" : "strand";
}

function focusFor(text: string, family: DnaMechanismFamily) {
  if (family === "basePairing") return /guanine|cytosine/.test(text) ? "guanine-cytosine base-pair interface" : /adenine|thymine/.test(text) ? "adenine-thymine base-pair interface" : "complementary base-pair geometry";
  if (family === "backboneChemistry") return text.includes("phosphodiester") ? "phosphodiester linkage" : "sugar-phosphate nucleotide backbone";
  if (family === "polarityAntiparallel") return "5′/3′ antiparallel strand organization";
  if (family === "helixStabilization") return text.includes("groove") ? "major/minor groove organization" : "helix stabilization and base stacking";
  if (family === "strandSeparation") return text.includes("reanneal") ? "complementary strand reannealing" : "local DNA strand separation";
  return "nucleotide and neighboring-strand assembly";
}

function selectionsFor(text: string, family: DnaMechanismFamily): DnaMolecularSelection[] {
  if (family === "basePairing") {
    if (/purine|pyrimidine/.test(text) && !/guanine|cytosine|adenine|thymine/.test(text)) return [selection("purine", "base", "purine"), selection("pyrimidine", "base", "pyrimidine")];
    return canonicalBasePairSelections(pairForText(text));
  }
  if (family === "backboneChemistry") return backboneChemistrySelections(/two|adjacent|neighbor|connects|connect two|phosphodiester|backbone/.test(text) ? "adjacentNucleotides" : "singleNucleotide");
  if (family === "polarityAntiparallel") return polaritySelections();
  if (family === "helixStabilization") return helixStabilizationSelections(text.includes("groove") ? "grooveFocus" : text.includes("hydrogen") || text.includes("stacking") && text.includes("compare") ? "forceComparison" : text.includes("stacking") ? "localStacking" : "duplexOverview");
  if (family === "strandSeparation") return strandSeparationSelections(separationPairForPrompt(text));
  return [selection("incoming-nucleotide", "nucleotide"), selection("growing-strand", "strand", "threePrimeEnd"), selection("neighbor", "nucleotide", "neighbor")];
}

function selection(id: string, kind: DnaMolecularSelection["kind"], role?: DnaMolecularSelection["role"]): DnaMolecularSelection {
  return { id, kind, role, structuralAnchor: "existingDnaVisualSystem" };
}

function interactionsFor(text: string, family: DnaMechanismFamily, selections: DnaMolecularSelection[]): DnaInteraction[] {
  const ids = selections.map((selection) => selection.id);
  if (family === "basePairing") {
    if (ids.includes("adenine") || ids.includes("guanine")) return canonicalBasePairInteractions(ids.includes("guanine") ? "G-C" : "A-T");
    return [{ id: "pair-width", type: "noncovalent", participants: ids.slice(0, 2), role: "stabilization", state: "present", evidence: "explanatory" }];
  }
  if (family === "backboneChemistry") return backboneChemistryInteractions(ids.includes("nucleotide-2") ? "adjacentNucleotides" : "singleNucleotide");
  if (family === "polarityAntiparallel") return polarityInteractions();
  if (family === "helixStabilization") return helixStabilizationInteractions(text.includes("groove") ? "grooveFocus" : text.includes("hydrogen") || text.includes("stacking") && text.includes("compare") ? "forceComparison" : text.includes("stacking") ? "localStacking" : "duplexOverview");
  if (family === "nucleotideAssembly") return [{ id: "backbone-interaction", type: "phosphodiester", participants: ids, role: "backboneLink", state: "present", evidence: "explanatory" }];
  if (family === "strandSeparation") return strandSeparationInteractions(separationPairForPrompt(text), separationStateForPrompt(text));
  return [];
}

function pairForText(text: string): DnaCanonicalPair {
  return /guanine|cytosine/.test(text) ? "G-C" : "A-T";
}
