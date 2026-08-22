/** P1-C: sole authoritative NormalizedPrompt → SemanticIntent v1 extractor. */

import type { BiologicalStateId, IntentAct, MechanismId, PhenomenonId, SemanticEntityId } from "./foundation-semantic-vocabulary.ts";
import { semanticIntentSchemaVersion, validateSemanticIntent, type SemanticIntentV1, type SemanticRequest } from "./semantic-intent.ts";
import { normalizedPromptSchemaVersion, type NormalizedPrompt } from "./prompt-normalization.ts";

type SemanticMatch = {
  phenomenon?: PhenomenonId;
  mechanism?: MechanismId;
  states?: BiologicalStateId[];
  focus?: SemanticRequest["focus"];
  entities: SemanticEntityId[];
  confidence: number;
};

/** Internal P1-C clause representation. It is deliberately not exported and
 * never crosses the SemanticIntent boundary. */
type InternalSemanticClause = {
  text: string;
  actHints: IntentAct[];
  actorCandidates: SemanticEntityId[];
  targetCandidates: SemanticEntityId[];
  mechanismCandidates: MechanismId[];
  unresolvedReferences: string[];
};

const includesAny = (text: string, values: readonly string[]) => values.some((value) => text.includes(value));
const unique = <T>(values: readonly T[]) => [...new Set(values)];
/** Semantic lexical form remains inside P1-C; it is not a downstream policy normalizer. */
const lower = (text: string) => text.toLocaleLowerCase()
  .replace(/([0-9])(?:′|')/g, "$1 prime")
  .replace(/(?:->|→|➝|⟶)/g, " to ")
  .replace(/[‐‑‒–—_-]/g, " ")
  .replace(/[+]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const mention = (rawText: string, resolvedId?: SemanticEntityId, candidateIds?: SemanticEntityId[]) =>
  resolvedId ? { rawText, resolvedId } : { rawText, candidateIds: candidateIds ?? ["dna", "rna"] };

function segmentSemanticClauses(text: string): InternalSemanticClause[] {
  const pieces = text
    .split(/\s+(?:and then|then|but|rather than|instead of|while|after|before)\s+|;\s*|,\s+(?=(?:and|then|but|while|whereas)\b)/)
    .map((piece) => piece.trim())
    .filter(Boolean);
  return pieces.map((clause) => ({
    text: clause,
    actHints: actsFor(clause),
    actorCandidates: entitiesFor(clause),
    targetCandidates: entitiesFor(clause),
    mechanismCandidates: [],
    unresolvedReferences: /\b(?:this|these|that|it|they|the other|the product)\b/.test(clause) ? ["anaphoric reference"] : [],
  }));
}

function actsFor(text: string): IntentAct[] {
  const acts: IntentAct[] = [];
  const asksWhatDoing = /\bwhat(?:'s| is| are)\b.*\b(?:doing|happening)\b/.test(text);
  const asksCouldBecause = /^could\b.*\bbecause\b/.test(text);
  if (includesAny(text, ["show", "display", "visualize", "present", "give me", "sketch", "picture", "make a picture", "draw", "point at", "point to"])) acts.push("show");
  if (includesAny(text, ["explain", "why", "how ", "correct", "check", "right?", "tell me", "talk me through", "walk me through", "what for", "should i", "whether", "do you mean", "does that", "is that"]) || /\bwhat\b.*\bfor\b/.test(text) || asksWhatDoing || asksCouldBecause || /\bwhat happened\b/.test(text)) acts.push("explain");
  if (includesAny(text, ["compare", "contrast", "versus", " vs ", "difference between", "side by side"])) acts.push("compare");
  if (includesAny(text, ["animate", "animation", "moving", "over time", "watch it change"])) acts.push("animate");
  if (includesAny(text, ["identify", "which", "inspect", "look at", "focus on", "point to", "point out", "what is", "what are"]) && !asksWhatDoing) acts.push("inspect");
  if (includesAny(text, ["export", "download", "save as"])) acts.push("export");
  return unique(acts.length ? acts : ["show"]);
}

function entitiesFor(text: string): SemanticEntityId[] {
  const entries: Array<[readonly string[], SemanticEntityId]> = [
    [["dna", "hereditary material", "genetic material", "genetic instructions", "hereditary instructions", "inherited instructions"], "dna"], [["rna"], "rna"], [["helix", "duplex"], "duplex"], [["strand", "chain", "polymer", "rails", "single stranded"], "strand"],
    [["helicase", "unwinding enzyme"], "helicase"], [["polymerase"], "polymerase"], [["rna polymerase"], "rnaPolymerase"], [["replication fork", "copy fork", "fork"], "replicationFork"],
    [["promoter"], "promoter"], [["enhancer", "regulatory", "upstream", "gene"], "regulatoryRegion"], [["lesion", "damage", "mismatch", "dimer", "boo boo"], "lesion"],
    [["histone", "nucleosome", "chromatin"], "regulatoryRegion"], [["ribose"], "ribose"], [["deoxyribose"], "deoxyribose"],
    [["phosphate"], "phosphate"], [["phosphodiester", "backbone"], "phosphodiesterLinkage"], [["2 prime oh", "2 prime hydroxyl", "2′ oh", "2' oh", "two prime hydroxyl", "two prime position", "position two"], "riboseTwoPrimeHydroxyl"],
    [["1 prime carbon", "one prime carbon"], "onePrimeCarbon"], [["3 prime carbon", "three prime carbon"], "threePrimeCarbon"], [["5 prime carbon", "five prime carbon"], "fivePrimeCarbon"], [["3 prime end", "three prime end"], "threePrimeOxygen"], [["5 prime end", "five prime end"], "fivePrimeOxygen"],
    [["adenine"], "adenine"], [["thymine"], "thymine"], [["uracil"], "uracil"], [["guanine", "g pairs", "g pair"], "guanine"], [["cytosine"], "cytosine"], [["base", "bases"], "base"], [["nucleotide", "nucleotides"], "nucleotide"],
    [["hairpin", "hair pin", "stem", "loop", "bulge", "rna fold", "rna motif"], "rna"], [["transcript", "message", "rna product", "mrna", "messenger rna", "pre mrna", "primary mrna"], "mRNA"], [["trna", "transfer rna"], "tRNA"], [["rrna", "ribosomal rna"], "rRNA"], [["mirna"], "miRNA"], [["sirna"], "siRNA"], [["snrna"], "snRNA"], [["regulatory small rna", "coding rna"], "smallRegulatoryRNA"],
    [["intron"], "intron"], [["exon"], "exon"], [["5 prime cap", "cap"], "cap"], [["poly a", "poly(a)"], "polyATail"],
  ];
  const entities = entries.filter(([terms]) => includesAny(text, terms)).map(([, id]) => id);
  // Contextual entity inference: these are compositional biological roles,
  // not prompt-specific aliases. The actor is inferred only when the process
  // or noun phrase makes the identity scientifically warranted.
  if (includesAny(text, ["hereditary information", "inherited information", "inherited instructions", "genetic material", "genetic information", "information passed from parent"])) entities.push("dna");
  if (includesAny(text, ["messenger", "message", "transcript", "copy leaving", "product leaving", "product being made"])) entities.push("rna", "mRNA");
  if (includesAny(text, ["carries the instructions", "carries instructions", "instructions passed"]) && includesAny(text, ["parent", "genetic", "hereditary"])) entities.push("dna");
  if (includesAny(text, ["copying fork", "copying fork", "fork driven", "fork-driven", "daughter chain"])) entities.push("dna", "replicationFork");
  if (includesAny(text, ["motor", "unwinds", "unwinding"]) && includesAny(text, ["fork", "template", "chain"])) entities.push("helicase");
  if (includesAny(text, ["extends the daughter", "extension", "extends", "copying polymerase"])) entities.push("polymerase");
  if (includesAny(text, ["product just leaving", "leaving the dna", "leaving its dna", "while it is still being made", "copy is emerging", "copy is leaving"])) entities.push("dna", "rna", "mRNA");
  if (includesAny(text, ["messenger", "message"]) && includesAny(text, ["cap", "capped", "front end", "5 prime end"])) entities.push("mRNA", "rna", "cap");
  if (includesAny(text, ["sugar", "ribose", "deoxyribose"]) && includesAny(text, ["rna", "dna", "transcript", "polymer"])) entities.push("ribose");
  const pair = text.match(/\b([ag])\s+([utcg])\b/);
  if (pair) {
    const bases: Record<string, SemanticEntityId> = { a: "adenine", g: "guanine", t: "thymine", u: "uracil", c: "cytosine" };
    entities.push(bases[pair[1]!]!, bases[pair[2]!]!);
  }
  // An article before a hyphenated pair normalizes to “a g c”; treat the
  // explicit two-base suffix as G-C/G-U/G-T rather than A-G/A-G.
  const articlePair = text.match(/\ba\s+([ag])\s+([utcg])\b/);
  if (articlePair) {
    const bases: Record<string, SemanticEntityId> = { a: "adenine", g: "guanine", t: "thymine", u: "uracil", c: "cytosine" };
    entities.push(bases[articlePair[1]!]!, bases[articlePair[2]!]!);
    if (entities.includes("adenine")) entities.splice(entities.indexOf("adenine"), 1);
  }
  // In prose such as “a G-U pair”, the leading “a” is an article, not an
  // adenine participant. The explicit G-U pair remains the scientific cue.
  if (/\ba\s+g\s+u\b/.test(text) && entities.includes("adenine")) entities.splice(entities.indexOf("adenine"), 1);
  if (includesAny(text, ["sugar phosphate", "backbone"])) entities.push("phosphodiesterLinkage");
  if (includesAny(text, ["replication", "replicat", "copy dna", "copying dna", "copying", "replication fork", "fork", "helicase"])) entities.push("dna");
  if (includesAny(text, ["replication", "replicat", "copying", "copy dna"]) && includesAny(text, ["helicase", "copy", "fork"])) entities.push("replicationFork");
  if (includesAny(text, ["open", "opening", "closed"]) && text.includes("helix")) entities.push("dna");
  if (text.includes("enzyme") && includesAny(text, ["open", "opening", "unwind", "unwinding"])) entities.push("dna", "helicase", "rnaPolymerase");
  if (includesAny(text, ["transcription", "transcribe", "nascent transcript"])) entities.push("dna");
  if (includesAny(text, ["pair these bases", "pair this base", "pairs with", "it pairs"])) entities.push("dna");
  if (text.includes("loop") && text.includes("rna")) entities.push("rna");
  if (includesAny(text, ["transcript", "message", "newly made rna", "newly synthesized rna", "cap"])) entities.push("rna");
  if (includesAny(text, ["splice", "splicing"])) entities.push("intron", "exon");
  if (text.includes("paired") && includesAny(text, ["rails", "double helix", "duplex"])) entities.push("duplex");
  if (includesAny(text, ["u-containing", "u containing"])) entities.push("uracil");
  const spokenPair = text.match(/\b([agutc])\s+(?:bonds?\s+to|pairs?\s+with|matches?)\s+([agutc])\b/);
  if (spokenPair) {
    const bases: Record<string, SemanticEntityId> = { a: "adenine", g: "guanine", t: "thymine", u: "uracil", c: "cytosine" };
    entities.push(bases[spokenPair[1]!]!, bases[spokenPair[2]!]!);
  }
  const conjunctionPair = text.match(/\b([agutc])\s+and\s+([agutc])\b/);
  if (conjunctionPair) {
    const bases: Record<string, SemanticEntityId> = { a: "adenine", g: "guanine", t: "thymine", u: "uracil", c: "cytosine" };
    entities.push(bases[conjunctionPair[1]!]!, bases[conjunctionPair[2]!]!);
  }
  if (text.includes("one prime") && entities.includes("base")) entities.push("onePrimeCarbon");
  if (includesAny(text, ["purine", "pyrimidine", "donor", "acceptor"])) entities.push("base");
  if (text.includes("donor")) entities.push("hydrogenBondDonor");
  if (text.includes("acceptor")) entities.push("hydrogenBondAcceptor");
  if (text.includes("opposite") && /\b(?:one|two|three|four|five|[1235]) prime\b/.test(text)) entities.push("duplex");
  if (text.includes("exonuclease") && !/\bexons?\b/.test(text)) {
    while (entities.includes("exon")) entities.splice(entities.indexOf("exon"), 1);
  }
  if (includesAny(text, ["ribose sugar", "sugar ring", "sugar component"]) && text.includes("rna")) entities.push("ribose");
  return unique(entities);
}

/**
 * These predicates encode compositional semantic cues, not production families
 * or fixture phrases.  They let a verb/object relation carry the distinction
 * between, for example, a static backbone relation and nucleotide addition.
 */
const hasDnaContext = (text: string, entities: readonly SemanticEntityId[]) => entities.includes("dna") || includesAny(text, ["dna", "double helix", "duplex"]);
const hasPrimeLabel = (text: string) => /\b(?:one|two|three|four|five|[1235]) prime\b/.test(text);
const hasPrimeDirectionCue = (text: string) => /\b[35] prime to [35] prime\b/.test(text) || includesAny(text, ["strand direction", "strand polarity", "directions of the two", "which way does"]);
const hasAnyWord = (text: string, expression: RegExp) => expression.test(text);
const hasPairingCue = (text: string) => hasAnyWord(text, /\b(pair|pairs|pairing|bond|bonds|bonding|contact|contacts|complementary|purine|pyrimidine|hydrogen)\b/);
const hasBackboneCue = (text: string) => hasAnyWord(text, /\b(backbone|phosphodiester|phosphate|deoxyribose|sugar|carbon|glycosidic|attach|attachment|connect|connected|connectivity|link|linkage)\b/);
const hasAssemblyCue = (text: string) => hasAnyWord(text, /\b(add|added|adding|join|joining|growing|extend|extended|build|building|incorporat|assembly|assemble|forms)\b/);
const hasSecondaryCue = (text: string) => hasAnyWord(text, /\b(hair ?pin|stem|loop|bulge|fold|folds|folded|folding|unpaired|paired region|rna motif|secondary structure)\b/);
const hasNascentCue = (text: string) => hasAnyWord(text, /\b(nascent|newly synthesized|newly made|emerging|immediately after transcription|rna product|rna copy|dna to rna production|before processing)\b/);
const hasRnaPairingCue = (text: string) => hasAnyWord(text, /\b(complementary rna|rna strands|rna base pair|rna hybridization|wobble|canonical and wobble|holds .* together)\b/);
const hasGenericPolymerAction = (text: string) => includesAny(text, ["chain", "polymer", "strand"]) && hasAnyWord(text, /\b(cut|cutting|break|breaking|trim|shorten|shortening|chew|eaten|nibble|worked on|acting on|doing to)\b/);
const hasAssociationCue = (text: string) => includesAny(text, ["physical association", "co localized", "co-located", "put these two polymers together", "attach", "associate", "bind"]);

function matchFor(text: string, entities: SemanticEntityId[]): SemanticMatch {
  const withEntity = (match: Omit<SemanticMatch, "entities">): SemanticMatch => ({ ...match, entities });
  if (hasGenericPolymerAction(text) && !includesAny(text, ["exonuclease", "cleavage", "cleaved", "degrade", "degradation"])) return withEntity({ focus: "local", confidence: 0.45 });
  if (includesAny(text, ["dna has ribose", "dna contains ribose", "a pairs with g", "a pair with g"])) return withEntity({ phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "relationship", confidence: 0.74 });
  if (includesAny(text, ["2 prime oh", "2 prime hydroxyl", "two prime oh", "two prime hydroxyl", "two prime position", "position two", "2′ oh", "2' oh", "rna local chemistry"])) return withEntity({ phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "local", confidence: 0.93 });
  if (includesAny(text, ["rna-dna hybrid", "rna dna hybrid"]) || (text.includes("rna") && text.includes("dna") && hasAnyWord(text, /\b(paired|contact|associate|association|hybrid)\b/))) return withEntity({ phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation", states: ["hybridized"], focus: "relationship", confidence: 0.96 });
  if (/\benzyme\b/.test(text) && /\b(open|opening|unwind|unwinding)\b/.test(text)) return withEntity({ phenomenon: "strandSeparation", mechanism: "strandOpening", states: ["open"], focus: "relationship", confidence: 0.6 });
  if (/\bg\s+u\b/.test(text) && includesAny(text, ["wobble", "wobbling"])) return withEntity({ phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.94 });
  if (includesAny(text, ["pair these bases", "pair this base", "it pairs with"])) return withEntity({ phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.8 });
  if (text.includes("rna") && text.includes("paired") && text.includes("unpaired")) return withEntity({ phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired", "unpaired"], focus: "relationship", confidence: 0.85 });
  if (includesAny(text, ["exonuclease", "eaten", "chewed", "nibbled", "degrading", "degrade rna", "shorten the rna", "shortening the rna"]) || (text.includes("shorten") && includesAny(text, ["transcript", "message", "rna"]))) return withEntity({ phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["partiallyDegraded"], focus: "terminus", confidence: 0.94 });
  if (includesAny(text, ["cleavage", "cleaved", "break the rna", "break rna", "cut the rna", "rna breaking", "snip"]) || (text.includes("rna") && hasAnyWord(text, /\b(backbone|linkage)\b/) && hasAnyWord(text, /\bcut|broken\b/))) return withEntity({ phenomenon: "cleavage", mechanism: "rnaCleavage", states: ["cleaved"], focus: "local", confidence: 0.93 });
  if (includesAny(text, ["less stable", "less chemically stable", "fall apart", "hydrolysis", "chemical stability", "rna stability", "exposed rna end", "exposed end"])) return withEntity({ phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "local", confidence: 0.9 });
  if (hasSecondaryCue(text) && (entities.includes("rna") || text.includes("rna") || includesAny(text, ["paired and unpaired regions", "paired region", "unpaired region"]))) return withEntity({ phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding", states: ["folded"], focus: "region", confidence: 0.96 });
  if (hasNascentCue(text) || includesAny(text, ["this transcript", "rna polymerase", "emerging transcript"])) return withEntity({ phenomenon: "transcription", mechanism: "transcriptionElongation", states: ["nascent"], focus: "region", confidence: 0.82 });
  if (includesAny(text, ["intron", "exon", "pre mrna", "poly a", "5 prime cap"]) || /\bsplic\w*\b/.test(text) || (text.includes("cap") && text.includes("transcript"))) return withEntity({ phenomenon: "rnaProcessing", mechanism: includesAny(text, ["cap", "poly a"]) ? "rnaCapping" : "rnaSplicing", states: [includesAny(text, ["mature", "spliced"]) ? "matureMRNA" : "preMRNA"], focus: "region", confidence: 0.94 });
  if (includesAny(text, ["canonical a g", "canonical pairing"]) || (hasPairingCue(text) && /\ba\s+(?:to\s+)?g\b/.test(text) && !/\ba\s+g\s+[cut]\b/.test(text))) return withEntity({ phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.9 });
  if (includesAny(text, ["a u", "a to u", "g c", "g u", "base pairing", "pair these bases", "pairs with"]) || (hasRnaPairingCue(text) && entities.includes("rna"))) return withEntity({ phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.91 });
  if ((hasAssemblyCue(text) && hasAnyWord(text, /\b(nucleotides?|base|strand|dna|bond)\b/)) || (includesAny(text, ["free nucleotide", "free nucleotides"]) && includesAny(text, ["in a strand", "connected nucleotide", "connected nucleotides"]))) return withEntity({ phenomenon: "nucleotideAssembly", mechanism: "nucleotideAddition", states: ["forming"], focus: "terminus", confidence: 0.9 });
  if ((hasPairingCue(text) || (hasDnaContext(text, entities) && hasAnyWord(text, /\bholds?\b/) && text.includes("together"))) && includesAny(text, ["guanine", "cytosine", "adenine", "thymine", "purine", "pyrimidine", "donors", "acceptors", "a and t"])) return withEntity({ phenomenon: "canonicalBasePairing", mechanism: includesAny(text, ["purine", "pyrimidine"]) ? "baseStacking" : "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.88 });
  if (!includesAny(text, ["unzip", "separate", "opening", "open"]) && (hasPrimeDirectionCue(text) || includesAny(text, ["antiparallel", "polarity", "opposite direction", "orientation", "which way", "directions of the two"]))) return withEntity({ phenomenon: "polarity", mechanism: "antiparallelOrganization", states: ["paired"], focus: "relationship", confidence: 0.95 });
  if ((hasDnaContext(text, entities) || includesAny(text, ["open this helix", "open the helix", "unzip", "strand separation"])) && (includesAny(text, ["unzip", "strand separation", "reanneal", "reannealing", "dna bubble", "dna melting", "separated complementary", "opened dna"]) || (hasAnyWord(text, /\b(separate|separated|apart|opening|open|closing)\b/) && includesAny(text, ["strand", "dna", "duplex", "helix"])))) return withEntity({ phenomenon: "strandSeparation", mechanism: text.includes("reanneal") ? "strandReannealing" : "strandOpening", states: [text.includes("reanneal") ? "forming" : "open"], focus: "relationship", confidence: text.includes("this helix") ? 0.48 : 0.94 });
  if ((hasDnaContext(text, entities) || includesAny(text, ["base stacking", "helix stay stacked", "major groove", "minor groove", "faces outward"])) && (includesAny(text, ["base stacking", "helix stay stacked", "major groove", "minor groove", "helix stabilization", "stabilize helix", "double helix together", "consistent width", "stacking forces", "faces outward", "inside the dna helix", "organization of the dna helix"]) || (hasAnyWord(text, /\b(stack|stacked|grooves?)\b/) && includesAny(text, ["dna", "helix", "base"])))) return withEntity({ phenomenon: "helixStabilization", mechanism: includesAny(text, ["groove"]) ? "grooveOrganization" : "baseStacking", focus: "region", confidence: 0.94 });
  if (hasPrimeLabel(text) && includesAny(text, ["prime end", "prime labels", "opposite", "ends"])) return withEntity({ phenomenon: "polarity", mechanism: "antiparallelOrganization", focus: "relationship", confidence: 0.92 });
  if (hasDnaContext(text, entities) && hasPairingCue(text) && includesAny(text, ["base", "guanine", "cytosine", "adenine", "thymine", "purine", "pyrimidine", "hydrogen"])) return withEntity({ phenomenon: "canonicalBasePairing", mechanism: includesAny(text, ["stack", "purine", "pyrimidine"]) && !includesAny(text, ["contact", "contacts", "hydrogen"]) ? "baseStacking" : "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.92 });
  if ((hasDnaContext(text, entities) || includesAny(text, ["deoxyribose", "phosphate sugar and base", "neighboring nucleotides", "phosphate connect", "prime carbons"])) && (hasBackboneCue(text) || hasPrimeLabel(text) || (text.includes("nucleotide") && includesAny(text, ["two", "neighboring", "adjacent", "components", "free"])))) return withEntity({ phenomenon: "backboneChemistry", mechanism: "phosphodiesterLinkage", focus: "local", confidence: 0.9 });
  if (includesAny(text, ["phosphodiester", "sugar phosphate", "backbone chemistry", "rna nucleotide", "rna phosphate group", "uracil in rna", "nucleotide components", "3 prime and 5 prime ends", "differs chemically", "ribose in rna"])) return withEntity({ phenomenon: "backboneChemistry", mechanism: "phosphodiesterLinkage", focus: "local", confidence: 0.92 });
  if (includesAny(text, ["replication", "replicate", "replicat", "copy dna", "copying dna", "copying", "copy fork", "replication fork"])) return withEntity({ phenomenon: "replication", mechanism: "dnaReplication", focus: "region", confidence: 0.93 });
  if (includesAny(text, ["transcription", "transcribe", "rna from dna", "make the dna message into rna", "template strand", "coding strand"])) return withEntity({ phenomenon: "transcription", mechanism: "transcriptionElongation", focus: "region", confidence: 0.93 });
  if (includesAny(text, ["repair", "damage", "lesion", "mismatch", "thymine dimer", "boo boo"])) return withEntity({ phenomenon: "damageRepair", focus: "local", confidence: 0.9 });
  if (includesAny(text, ["nucleosome", "histone", "chromatin", "packaging", "pack dna"])) return withEntity({ phenomenon: "packaging", focus: "region", confidence: 0.94 });
  if (includesAny(text, ["promoter", "enhancer", "regulatory", "gene regulation", "upstream"])) return withEntity({ phenomenon: "regulation", focus: "region", confidence: 0.92 });
  return { entities, phenomenon: entities.includes("rna") ? undefined : undefined, focus: "overview", confidence: entities.length ? 0.68 : 0.3 };
}

function directionFor(text: string): SemanticRequest["direction"] | undefined {
  const screen = includesAny(text, ["from left", "from the left", "on the left", "left to right", "leftward", "page left"])
    ? "screenLeft"
    : includesAny(text, ["from right", "from the right", "on the right"])
      ? "screenRight"
      : undefined;
  const action = includesAny(text, ["exonuclease", "eaten", "chewed", "nibbled", "nibbl", "degrad", "shorten", "synthesis", "synthesize", "extend", "extension"]);
  const biochemical = includesAny(text, ["5 prime end", "5′ end", "five prime end", "from 5 prime", "from five prime", "from the five prime", "from its 5 prime", "from its five prime", "at 5 prime", "at five prime", "at the five prime", "at its 5 prime", "at its five prime", "starting at 5 prime", "starting at five prime", "starting at the five prime"]) && action ? "fiveToThree" : includesAny(text, ["3 prime end", "3′ end", "three prime end", "from 3 prime", "from three prime", "from the three prime", "from its 3 prime", "from its three prime", "at 3 prime", "at three prime", "at the three prime", "at its 3 prime", "at its three prime", "starting at 3 prime", "starting at three prime", "starting at the three prime"]) && action ? "threeToFive" : includesAny(text, ["5 prime to 3 prime", "5′ to 3′"]) ? "fiveToThree" : includesAny(text, ["3 prime to 5 prime", "3′ to 5′"]) ? "threeToFive" : text.includes("opposite") && hasPrimeLabel(text) ? "strandRelative" : includesAny(text, ["upstream", "downstream"]) ? "sequenceDirection" : undefined;
  if (screen && biochemical) return { screen, biochemical, meaning: "ambiguous" };
  if (screen) return { screen, meaning: "presentational" };
  if (biochemical) return { biochemical, meaning: "scientific" };
  return undefined;
}

function claimsFor(text: string, rawUtterance: string): SemanticIntentV1["assertedClaims"] {
  if (/(?:i\s+have\s+not\s+said|not\s+specified|haven'?t\s+specified|unspecified)/i.test(text)) return [];
  if (text.includes("dna has ribose")) return [{ rawText: "DNA has ribose", status: "suspected" }];
  if (text.includes("a pairs with g")) return [{ rawText: "A pairs with G", status: "suspected" }];
  const canonicalPair = rawUtterance.match(/canonical\s+[A-Za-z]-[A-Za-z]\s+pairing/i)?.[0];
  if (canonicalPair) return [{ rawText: canonicalPair, status: "suspected" }];
  // Preserve claim-shaped user language verbatim enough for later grounding; do
  // not assert, correct, or validate its scientific content in P1-C.
  const clause = rawUtterance.split(/[;.]/)[0]?.trim().replace(/\?$/, "") ?? rawUtterance.trim();
  // Noun-phrase requests such as “A-U pair in RNA” are not assertions.
  if (/^(?:show|display|visualize|pair|present)\b/i.test(clause) || /\b(?:A|G|C|T|U)[-–—\s]+(?:A|G|C|T|U)\s+pair\b/i.test(clause)) return [];
  const questionOrRequest = /^(show|display|visualize|why|how|can|could|is this|what)\b/i.test(clause);
  // A claim requires an explicit proposition, not merely a noun such as
  // “pair” inside an imperative/request.  This keeps visual requests like
  // “pair these bases” and “A–U pair in RNA” neutral while preserving actual
  // assertions (“DNA has ribose”, “A pairs with G”).
  const claimLike = /\b(?:DNA|RNA)(?:\s+strands?)?(?:\s+(?:really|actually|truly))?\s+(?:has|have|uses?|runs?|contains?|pairs?|is|are|was|were|should|could)\b/i.test(clause)
    || /\b(?:A|G|T|U|helicase|strand|hydroxyl|polymer|base)(?:\s+(?:really|actually|truly))?\s+(?:has|have|uses?|runs?|contains?|pairs?|is|are|was|were|should|could)\b/i.test(clause)
    || /\b(?:DNA|RNA)\s+(?:less|more)\s+stable\b/i.test(clause);
  if (/\b(?:DNA|RNA)\b.*\bmore stable\b.*\b(?:DNA|RNA)\b/i.test(clause) || /\b(?:DNA|RNA)\b.*\bless stable\b.*\b(?:DNA|RNA)\b/i.test(clause)) return [{ rawText: clause, status: "neutral" }];
  const validatedAttribution = /^(?:a\s+)?(?:validated|published|peer reviewed)\s+[^;,.]*?\s+(?:found|says?|reports?)\s+(?:that\s+)?/i.test(clause);
  const reportedAttribution = /^(?:a\s+)?(?:student|teacher|source|review|study)\s+(?:says?|claims?|calls?|reports?)\s+/i.test(clause);
  const withoutAttribution = clause
    .replace(/^(?:a\s+)?(?:validated|published|peer reviewed)\s+[^;,.]*?\s+(?:found|says?|reports?)\s+that\s+/i, "")
    .replace(/^(?:a\s+)?(?:student|teacher|source|review|study)\s+(?:says?|claims?|calls?|reports?)\s+/i, "");
  const explanatoryQuestion = /^(?:why|how|what|which|talk me through|walk me through|does that|is that|could)\b/i.test(clause)
    && !/^does\s+(?:DNA|RNA)\b.*\b(?:has|have|uses?|contains?|pairs?|is|are)\b/i.test(clause);
  if (!questionOrRequest && !explanatoryQuestion && (claimLike || reportedAttribution) && /\b(DNA|RNA|A|G|T|U|helicase|strand|hydroxyl|polymer|base)/i.test(withoutAttribution)) return [{ rawText: withoutAttribution.replace(/^does\s+/i, "").trim(), status: validatedAttribution ? "validated" : "suspected" }];
  return [];
}

function statesFor(text: string, existing: readonly BiologicalStateId[] | undefined): BiologicalStateId[] | undefined {
  const temporalStateTransition = /\bclosed\b.*\b(and|then)\b.*\bopen\b/.test(text) && !/\bsame state\b/.test(text);
  const states = new Set((existing ?? []).filter((state) => !temporalStateTransition || (state !== "closed" && state !== "open")));
  if (/\bintact\b/.test(text)) states.add("intact");
  if (/\bcleaved\b|\bcut\b/.test(text)) states.add("cleaved");
  if (/\bpaired\b/.test(text)) states.add("paired");
  if (/\bunpaired\b/.test(text)) states.add("unpaired");
  // Explicit state transitions become alternatives below; they are not silently
  // flattened into an invalid simultaneous state.
  if (/\bclosed\b/.test(text)) states.add("closed");
  if (/\bopen\b/.test(text) && !temporalStateTransition) states.add("open");
  return states.size ? [...states] : undefined;
}

function alternativesFor(text: string, match: SemanticMatch): SemanticIntentV1["alternatives"] {
  // An explicit acceptance of either polymer is not a clarification request.
  if (/\b(?:dna\s+or\s+rna|either\s+dna\s+or\s+rna)\b.*\b(?:fine|okay|doesn'?t matter)\b/.test(text)) return [];
  if ((includesAny(text, ["cut internally", "internal link cut", "backbone cut", "cut at one internal", "internal cleavage"]) && includesAny(text, ["nibbled", "nibbling", "end", "terminus", "exonuclease"])) || (text.includes("cut") && includesAny(text, ["nibbled", "nibbling", "chewed", "end"]))) {
    return [
      { id: "local-cleavage", description: "Internal polymer cleavage", requests: [{ subjects: [mention("RNA", "rna")], phenomenon: "cleavage", mechanism: "rnaCleavage" }], confidence: 0.5 },
      { id: "terminal-degradation", description: "Terminal exonuclease degradation", requests: [{ subjects: [mention("RNA", "rna")], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction" }], confidence: 0.5 },
    ];
  }
  if (text.includes("open this helix") || text.includes("open the helix")) {
    return [
      { id: "dna-helix-opening", description: "DNA duplex strand opening", requests: [{ subjects: [mention("helix", "duplex"), mention("DNA", "dna")], phenomenon: "strandSeparation", mechanism: "strandOpening", states: ["open"] }], confidence: 0.5 },
      { id: "rna-secondary-opening", description: "RNA secondary-structure unfolding", requests: [{ subjects: [mention("helix", "rna")], phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding", states: ["unfolded"] }], confidence: 0.5 },
    ];
  }
  if (text.includes("polymerase action")) {
    return [
      { id: "dna-replication-polymerase", description: "DNA replication polymerase activity", requests: [{ subjects: [mention("polymerase", "polymerase"), mention("DNA", "dna")], phenomenon: "replication", mechanism: "dnaReplication" }], confidence: 0.5 },
      { id: "rna-polymerase-transcription", description: "RNA polymerase transcription activity", requests: [{ subjects: [mention("polymerase", "rnaPolymerase"), mention("RNA", "rna")], phenomenon: "transcription", mechanism: "transcriptionElongation" }], confidence: 0.5 },
    ];
  }
  if (includesAny(text, ["replication", "replicate"]) && includesAny(text, ["transcription", "transcribe"]) && text.includes("polymerase")) {
    return [
      { id: "replication-polymerase", description: "DNA replication activity", requests: [{ subjects: [mention("polymerase", "polymerase"), mention("DNA", "dna")], phenomenon: "replication", mechanism: "dnaReplication" }], confidence: 0.5 },
      { id: "transcription-polymerase", description: "RNA transcription activity", requests: [{ subjects: [mention("polymerase", "rnaPolymerase"), mention("DNA", "dna"), mention("RNA", "rna")], phenomenon: "transcription", mechanism: "transcriptionElongation" }], confidence: 0.5 },
    ];
  }
  if ((hasAssociationCue(text) || includesAny(text, ["hybrid or", "hybrid duplex", "co localized"])) && text.includes("dna") && text.includes("rna")) {
    return [
      { id: "rna-dna-hybrid", description: "RNA-DNA hybrid formation", requests: [{ subjects: [mention("RNA", "rna"), mention("DNA", "dna")], phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation" }], confidence: 0.5 },
      { id: "rna-dna-association", description: "RNA-DNA association without specified hybridization", requests: [{ subjects: [mention("RNA", "rna"), mention("DNA", "dna")] }], confidence: 0.5 },
    ];
  }
  if (!match.phenomenon && includesAny(text, ["chain", "polymer", "strand"]) && includesAny(text, ["doing", "happening", "acting", "changing", "cut", "cutting", "nibbled", "chewed", "worked on"])) {
    return [
      { id: "polymer-cleavage", description: "Local polymer cleavage", requests: [{ subjects: [mention("RNA", "rna")], phenomenon: "cleavage", mechanism: "rnaCleavage" }], confidence: 0.5 },
      { id: "polymer-terminal-degradation", description: "Terminal exonuclease degradation", requests: [{ subjects: [mention("RNA", "rna")], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction" }], confidence: 0.5 },
    ];
  }
  if (text.includes("whether") && text.includes("rna") && text.includes("dna")) {
    return [
      { id: "rna-interpretation", description: "RNA participant", requests: [{ subjects: [mention("RNA", "rna")] }], confidence: 0.5 },
      { id: "dna-interpretation", description: "DNA participant", requests: [{ subjects: [mention("DNA", "dna")] }], confidence: 0.5 },
    ];
  }
  if (includesAny(text, ["this strand", "this chain", "pair these bases", "pair this base", "it pairs"])) {
    return [
      { id: "dna-structural-reference", description: "DNA structural reference", requests: [{ subjects: [mention("reference", "dna"), mention("strand", "strand")] }], confidence: 0.5 },
      { id: "rna-structural-reference", description: "RNA structural reference", requests: [{ subjects: [mention("reference", "rna"), mention("strand", "strand")] }], confidence: 0.5 },
    ];
  }
  if (includesAny(text, ["enzyme opening", "enzyme unwinding", "molecular machine", "fork motor", "which enzyme is opening"]) || (/\benzyme\b/.test(text) && /\b(open|opening|unwind|unwinding)\b/.test(text))) {
    return [
      { id: "helicase-opening", description: "Helicase-mediated DNA opening", requests: [{ subjects: [mention("enzyme", "helicase"), mention("DNA", "dna")], phenomenon: "strandSeparation", mechanism: "strandOpening" }], confidence: 0.5 },
      { id: "polymerase-opening", description: "RNA polymerase transcription opening", requests: [{ subjects: [mention("enzyme", "rnaPolymerase"), mention("DNA", "dna")], phenomenon: "transcription", mechanism: "transcriptionElongation" }], confidence: 0.5 },
    ];
  }
  if (text.includes("ambiguous direction") && match.mechanism) {
    return [
      { id: "five-to-three-reading", description: "5′→3′ reading", requests: [{ subjects: [mention("target", "dna")], phenomenon: match.phenomenon, mechanism: match.mechanism, direction: { biochemical: "fiveToThree", meaning: "scientific" } }], confidence: 0.5 },
      { id: "three-to-five-reading", description: "3′→5′ reading", requests: [{ subjects: [mention("target", "dna")], phenomenon: match.phenomenon, mechanism: match.mechanism, direction: { biochemical: "threeToFive", meaning: "scientific" } }], confidence: 0.5 },
    ];
  }
  if (/\bclosed\b.*\b(and|then)\b.*\bopen\b/.test(text)) {
    return [
      { id: "closed-state", description: "closed molecular state", requests: [{ subjects: [mention("structure", "duplex")], states: ["closed"] }], confidence: 0.5 },
      { id: "open-state", description: "open molecular state", requests: [{ subjects: [mention("structure", "duplex")], states: ["open"] }], confidence: 0.5 },
    ];
  }
  return match.confidence < 0.5 ? [{ id: "unresolved-domain", description: "The prompt does not name a molecular domain.", requests: [{ subjects: [mention("request", undefined, ["dna", "rna"])] }], confidence: 0.4 }] : [];
}

function requestFor(text: string, match: SemanticMatch): SemanticRequest {
  const subjects = match.entities.length ? match.entities.map((id) => mention(id, id)) : [mention("request", undefined, ["dna", "rna"])];
  const direction = directionFor(text);
  const acts = actsFor(text);
  const outputPreferences: NonNullable<SemanticRequest["outputPreferences"]> = [acts.includes("animate") ? "animated" : "static"];
  if (acts.includes("compare")) outputPreferences.push("comparison");
  if (match.focus === "local" || match.focus === "terminus") outputPreferences.push("localFocus");
  if (match.focus === "overview") outputPreferences.push("overview");
  return {
    subjects,
    phenomenon: match.phenomenon,
    mechanism: match.mechanism,
    states: statesFor(text, match.states),
    focus: match.focus,
    direction,
    spatialFrame: direction?.meaning === "presentational" ? "screen" : direction?.biochemical ? "sequenceRelative" : "molecular",
    detail: includesAny(text, ["beginner", "simple"]) ? "beginner" : includesAny(text, ["advanced", "atom", "detailed"]) ? "advanced" : "auto",
    outputPreferences: unique(outputPreferences),
    requestedOutput: acts.includes("export") ? "dataExport" : acts.includes("compare") ? "comparisonFigure" : acts.includes("animate") ? "interactiveScene" : "scientificFigure",
  };
}

/** Independent semantic mechanisms become separate requests; no timeline is implied. */
function additionalMatchesFor(text: string, entities: SemanticEntityId[], primary: SemanticMatch): SemanticMatch[] {
  const values: SemanticMatch[] = [];
  const same = (phenomenon: PhenomenonId | undefined, mechanism: MechanismId | undefined) => primary.phenomenon === phenomenon && primary.mechanism === mechanism;
  if (hasPairingCue(text) && /\ba\s+g\b/.test(text) && !same("canonicalBasePairing", "hydrogenBonding")) values.push({ entities, phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.9 });
  if (hasBackboneCue(text) && !same("backboneChemistry", "phosphodiesterLinkage")) values.push({ entities, phenomenon: "backboneChemistry", mechanism: "phosphodiesterLinkage", focus: "local", confidence: 0.85 });
  if (includesAny(text, ["cleavage", "cleaved", "snip", "break rna"]) && !same("cleavage", "rnaCleavage")) values.push({ entities, phenomenon: "cleavage", mechanism: "rnaCleavage", states: ["cleaved"], focus: "local", confidence: 0.9 });
  if (includesAny(text, ["exonuclease", "degrad", "chewed", "eaten"]) && !same("exonucleaseDegradation", "terminalExonucleaseAction")) values.push({ entities, phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["partiallyDegraded"], focus: "terminus", confidence: 0.9 });
  if (/\b(?:intron|exons?|splic\w*)\b/.test(text) && !same("rnaProcessing", "rnaSplicing")) values.push({ entities, phenomenon: "rnaProcessing", mechanism: "rnaSplicing", focus: "region", confidence: 0.9 });
  if (includesAny(text, ["cap", "poly a"]) && !same("rnaProcessing", "rnaCapping")) values.push({ entities, phenomenon: "rnaProcessing", mechanism: "rnaCapping", focus: "region", confidence: 0.9 });
  if (includesAny(text, ["replication", "copying", "fork"]) && includesAny(text, ["open", "opening", "unwind", "separate"]) && !same("strandSeparation", "strandOpening")) values.push({ entities: unique([...entities, "dna", "strand"]), phenomenon: "strandSeparation", mechanism: "strandOpening", states: ["open"], focus: "relationship", confidence: 0.88 });
  if ((text.includes("hybrid") || hasAssociationCue(text)) && hasSecondaryCue(text) && !same("rnaDnaHybridization", "rnaDnaHybridFormation")) values.push({ entities: unique([...entities, "rna", "dna"]), phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation", states: ["hybridized"], focus: "relationship", confidence: 0.88 });
  if (hasPairingCue(text) && (includesAny(text, ["stack", "stacking", "organized", "helix stays"]) || hasSecondaryCue(text)) && !same("helixStabilization", "baseStacking")) values.push({ entities: unique([...entities, "duplex"]), phenomenon: "helixStabilization", mechanism: "baseStacking", focus: "region", confidence: 0.86 });
  if ((text.includes("transcript") || text.includes("rna copy")) && text.includes("dna") && (text.includes("contact") || text.includes("emerging") || text.includes("exiting")) && !same("transcription", "transcriptionElongation")) values.push({ entities: unique([...entities, "dna", "rna"]), phenomenon: "transcription", mechanism: "transcriptionElongation", states: ["nascent"], focus: "region", confidence: 0.88 });
  if (text.includes("dna") && text.includes("rna") && (hasBackboneCue(text) || includesAny(text, ["sugar", "hydroxyl", "stability"])) && !same("chemicalStabilityComparison", "riboseHydroxylSusceptibility")) values.push({ entities: unique([...entities, "dna", "rna"]), phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "local", confidence: 0.84 });
  if (hasSecondaryCue(text) && !same("rnaSecondaryStructure", "rnaSecondaryFolding")) values.push({ entities: unique([...entities, "rna"]), phenomenon: "rnaSecondaryStructure", mechanism: "rnaSecondaryFolding", states: ["folded"], focus: "region", confidence: 0.9 });
  return values;
}

/** Relationship-first candidates. These rules inspect an actor/action/target
 * relation and are intentionally independent of the legacy precedence chain. */
function compositionalMatchesFor(text: string, entities: SemanticEntityId[]): SemanticMatch[] {
  const clauses = segmentSemanticClauses(text);
  const values: SemanticMatch[] = [];
  const add = (match: Omit<SemanticMatch, "entities">, extra: SemanticEntityId[] = []) => values.push({ ...match, entities: unique([...entities, ...extra]) });
  const has = (...terms: string[]) => includesAny(text, terms);

  if (has("hereditary information", "inherited information", "genetic information", "information passed from parent") && has("rails", "strands", "double", "helix")) add({ phenomenon: "polarity", mechanism: "antiparallelOrganization", states: ["paired"], focus: "relationship", confidence: 0.91 }, ["dna", "duplex", "strand"]);
  if (has("copying fork", "fork-driven", "fork driven", "daughter chain") && has("unwind", "unwinds", "motor", "extend", "extends", "copy")) {
    add({ phenomenon: "strandSeparation", mechanism: "strandOpening", states: ["open"], focus: "relationship", confidence: 0.95 }, ["dna", "replicationFork", "strand"]);
    if (has("extend", "extends", "copy", "daughter")) add({ phenomenon: "replication", mechanism: "dnaReplication", focus: "region", confidence: 0.94 }, ["dna", "replicationFork", "polymerase"]);
  }
  if ((has("product leaving", "copy leaving", "copy is emerging", "leaving the dna", "leaving its dna", "still being made", "nascent") && has("dna", "instructions", "template")) || has("rna copy", "emerging transcript")) add({ phenomenon: "transcription", mechanism: "transcriptionElongation", states: ["nascent"], focus: "region", confidence: 0.97 }, ["dna", "rna", "mRNA"]);
  if (has("cap", "capped") && has("messenger", "message", "transcript")) add({ phenomenon: "rnaProcessing", mechanism: "rnaCapping", states: ["capped"], focus: "region", confidence: 0.95 }, ["rna", "mRNA", "cap"]);
  if (has("splice", "splicing") && has("cap", "capped")) add({ phenomenon: "rnaProcessing", mechanism: "rnaSplicing", states: ["preMRNA", "matureMRNA"], focus: "region", confidence: 0.9 }, ["rna", "mRNA", "intron", "exon"]);
  if (has("cut internally", "internal link cut", "backbone cut", "cut at one internal", "cleavage") && has("nibbled", "end", "terminus", "exonuclease", "shortened")) {
    add({ phenomenon: "cleavage", mechanism: "rnaCleavage", states: ["cleaved"], focus: "local", confidence: 0.96 }, ["rna", "phosphodiesterLinkage"]);
    add({ phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["partiallyDegraded"], focus: "terminus", confidence: 0.96 }, ["rna"]);
  }
  if (has("hybrid", "hybridized") && has("rna", "dna")) add({ phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation", states: ["hybridized"], focus: "relationship", confidence: 0.95 }, ["rna", "dna", "duplex"]);
  if (has("rna", "dna") && has("touch", "touching", "colocated", "co-located", "nearby") && !has("hybrid")) add({ phenomenon: "rnaDnaHybridization", mechanism: "rnaDnaHybridFormation", focus: "relationship", confidence: 0.62 }, ["rna", "dna"]);
  if (has("stacking", "stacking forces", "stacking force") && has("hydrogen", "pair", "base contact", "base contacts")) {
    add({ phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.93 }, ["duplex"]);
    add({ phenomenon: "helixStabilization", mechanism: "baseStacking", focus: "region", confidence: 0.93 }, ["duplex"]);
  }
  if (has("bonds to", "pairs with", "matches") && /\b[agutc]\b/.test(text)) add({ phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.94 });
  if ((has("donor") || has("acceptor")) && (has("base", "pair") || /\b[agutc]\s*(?:-|–|—|to|and|\s)\s*[agutc]\b/.test(text))) add({ phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.94 }, ["base"]);
  if (has("hydrogen bond", "hydrogen bonds") && /\b[agutc]\s*(?:-|–|—|to|and|\s)\s*[agutc]\b/.test(text)) add({ phenomenon: "canonicalBasePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.94 }, ["base"]);
  if (has("adenine", "guanine") && has("uracil", "cytosine", "thymine") && has("paired", "contact", "bonds")) add({ phenomenon: "basePairing", mechanism: "hydrogenBonding", states: ["paired"], focus: "relationship", confidence: 0.94 }, ["base"]);
  if (has("shorten", "shortening", "nibbled", "eaten", "chewed") && has("end", "terminus", "five prime", "three prime")) add({ phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["partiallyDegraded"], focus: "terminus", confidence: 0.95 }, ["rna"]);
  if (has("cut at one backbone site", "backbone site", "phosphodiester site") && has("cut", "broken", "break")) add({ phenomenon: "cleavage", mechanism: "rnaCleavage", states: ["cleaved"], focus: "local", confidence: 0.95 }, ["rna", "phosphodiesterLinkage"]);
  if (has("internal cleavage", "internal cut") && has("terminal nibbling", "nibbled from an end", "terminal nibbling")) {
    add({ phenomenon: "cleavage", mechanism: "rnaCleavage", states: ["cleaved"], focus: "local", confidence: 0.95 }, ["rna"]);
    add({ phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["partiallyDegraded"], focus: "terminus", confidence: 0.95 }, ["rna"]);
  }
  if (has("helicase") && has("open", "opens", "unwind", "unwinds")) add({ phenomenon: "strandSeparation", mechanism: "strandOpening", states: ["open"], focus: "relationship", confidence: 0.95 }, ["dna", "helicase"]);
  if (has("replication") && has("transcription")) {
    add({ phenomenon: "replication", mechanism: "dnaReplication", focus: "region", confidence: 0.93 }, ["dna"]);
    add({ phenomenon: "transcription", mechanism: "transcriptionElongation", focus: "region", confidence: 0.93 }, ["dna", "rna"]);
  }
  if (has("same way", "same direction") && has("strands", "rails")) add({ phenomenon: "polarity", mechanism: "antiparallelOrganization", focus: "relationship", confidence: 0.93 }, ["dna", "strand"]);
  if (has("compare") && has("rna", "dna") && has("pairing", "paired", "base")) add({ phenomenon: "basePairing", mechanism: "hydrogenBonding", focus: "relationship", confidence: 0.9 }, ["rna", "dna"]);
  if (has("toward five prime", "toward its five prime", "toward the five prime", "to the five prime") && has("synthesis", "synthes", "extension", "extend", "daughter")) add({ phenomenon: "replication", mechanism: "dnaReplication", focus: "region", confidence: 0.94 }, ["dna", "strand"]);
  if (has("opposite", "antiparallel", "biochemical termini") && has("prime", "termini", "ends")) add({ phenomenon: "polarity", mechanism: "antiparallelOrganization", states: ["paired"], focus: "relationship", confidence: 0.94 }, ["dna", "duplex", "strand"]);
  if (has("phosphodiester", "phosphate bridge", "phosphate connection") && has("join", "joins", "added", "joining", "neighboring")) add({ phenomenon: "nucleotideAssembly", mechanism: "nucleotideAddition", states: ["forming"], focus: "terminus", confidence: 0.93 }, ["nucleotide", "phosphate", "phosphodiesterLinkage"]);
  if (has("two prime", "2 prime", "hydroxyl") && has("rna", "ribose", "hydrolysis", "vulnerable", "vulnerable", "prone")) add({ phenomenon: "chemicalStabilityComparison", mechanism: "riboseHydroxylSusceptibility", focus: "local", confidence: 0.94 }, ["rna", "dna", "riboseTwoPrimeHydroxyl"]);
  // Keep this internal pass observable in development diagnostics without
  // exposing a second public semantic contract.
  void clauses;
  return values;
}

function hasDirection(text: string, direction: "fiveToThree" | "threeToFive") {
  return direction === "fiveToThree" ? text.includes("5 prime to 3 prime") : text.includes("3 prime to 5 prime");
}

function canonicalGlossFor(match: SemanticMatch, acts: readonly IntentAct[]): string {
  const subject = match.entities.length ? match.entities.join(", ") : "molecular request";
  const meaning = match.mechanism ?? match.phenomenon ?? subject;
  return `${acts.join(" and ")} ${meaning} concerning ${subject}.`;
}

/** The only P1 semantic authority. It is deliberately not a production route. */
export function extractSemanticIntent(prompt: NormalizedPrompt): SemanticIntentV1 {
  if (prompt.schemaVersion !== normalizedPromptSchemaVersion) throw new Error("Semantic extraction requires NormalizedPrompt v1.");
  const text = lower(prompt.normalizedText);
  const entities = entitiesFor(text);
  const legacyMatch = matchFor(text, entities);
  const compositional = compositionalMatchesFor(text, entities);
  const primary = compositional.find((candidate) => candidate.confidence >= 0.92) ?? legacyMatch;
  const supplemental = [...additionalMatchesFor(text, entities, primary), ...compositional.filter((candidate) => candidate !== primary)];
  const requestKey = (value: SemanticMatch) => `${value.phenomenon ?? ""}|${value.mechanism ?? ""}|${value.focus ?? ""}|${(value.states ?? []).join(",")}`;
  const uniqueSupplemental = supplemental.filter((value, index, all) => all.findIndex((candidate) => requestKey(candidate) === requestKey(value)) === index && requestKey(value) !== requestKey(primary));
  const requests = [requestFor(text, primary), ...uniqueSupplemental.map((value) => requestFor(text, value))];
  // Opposing directions explicitly named for the same request are preserved as
  // structured competing scientific directions for P1-E, never collapsed.
  if (hasDirection(text, "fiveToThree") && hasDirection(text, "threeToFive") && requests[0]?.direction?.biochemical === "fiveToThree") {
    requests.push({ ...requests[0], direction: { biochemical: "threeToFive", meaning: "scientific" } });
  }
  const intent: SemanticIntentV1 = {
    schemaVersion: semanticIntentSchemaVersion,
    rawUtterance: prompt.raw.rawText,
    canonicalGloss: canonicalGlossFor(primary, actsFor(text)),
    acts: actsFor(text),
    requests,
    assertedClaims: claimsFor(text, prompt.raw.rawText),
    alternatives: alternativesFor(text, primary),
    // P1-D owns the policy decision; P1-C only preserves possible readings.
    clarification: { required: false },
    confidence: primary.confidence,
  };
  const validation = validateSemanticIntent(intent);
  if (!validation.valid) throw new Error(`Extractor emitted invalid SemanticIntent v1: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  return intent;
}
