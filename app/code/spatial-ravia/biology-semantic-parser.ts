import { detectBiologyContext } from "./biology-context.ts";
import { normalizeBiologyPrompt } from "./biology-normalizer.ts";
import type { BiologyParseResult } from "./biology-parse-result.ts";
import {
  dnaReplicationSynthesisScene,
  dnaStructureScene,
  helicaseMechanismScene,
  primasePrimerScene,
  strandStabilizationScene,
  topoisomeraseAheadOfHelicaseScene,
  transcriptionScene,
  signalingScene,
  translationScene,
  actionPotentialScene,
} from "./biology-scene-builders.ts";
import { validateBiologySceneConsistency } from "./biology-scene-validator.ts";

type SemanticConcept =
  | "dna-structure"
  | "helicase-unwinds"
  | "strand-stabilization"
  | "topoisomerase-ahead"
  | "primase-primer"
  | "polymerase-synthesis"
  | "leading-synthesis"
  | "lagging-synthesis"
  | "leading-lagging-comparison"
  | "okazaki-fragment"
  | "ligase-joins"
  | "directionality"
  | "transcription-rna-polymerase"
  | "transcription-gene"
  | "transcription-promoter"
  | "transcription-template-coding"
  | "transcription-mechanism"
  | "transcription-initiation"
  | "transcription-bubble"
  | "transcription-rna-transcript"
  | "transcription-directionality"
  | "transcription-termination"
  | "translation-ribosome"
  | "translation-initiation"
  | "translation-elongation"
  | "translation-charged-trna"
  | "translation-codon-anticodon"
  | "translation-peptide-bond"
  | "translation-translocation"
  | "translation-directionality"
  | "translation-termination"
  | "signaling-membrane-receptor"
  | "signaling-ligand-binding"
  | "signaling-dimerization"
  | "signaling-rtk-activation"
  | "signaling-phosphorylation"
  | "signaling-adaptor"
  | "signaling-ras"
  | "signaling-mapk"
  | "signaling-nucleus"
  | "action-potential-full"
  | "action-potential-resting"
  | "action-potential-threshold"
  | "action-potential-depolarization"
  | "action-potential-peak"
  | "action-potential-repolarization"
  | "action-potential-hyperpolarization"
  | "action-potential-recovery"
  | "action-potential-refractory"
  | "action-potential-sodium-channel"
  | "action-potential-potassium-channel"
  | "action-potential-gradients"
  | "action-potential-sodium-flux"
  | "action-potential-potassium-flux"
  | "action-potential-positive-feedback";

type ConceptScore = {
  concept: SemanticConcept;
  score: number;
};

const minimumSemanticConfidence = 0.72;

export function parseBiologyPromptSemantically(
  prompt: string
): BiologyParseResult {
  const normalized = normalizeBiologyPrompt(prompt);
  const context = detectBiologyContext(prompt);
  const tokens = tokenize(normalized);
  const scores = scoreConcepts(normalized, tokens);
  const best = scores.sort((left, right) => right.score - left.score)[0];

  if (!best || best.score < minimumSemanticConfidence) {
    return {
      status: "unsupported",
      reason: "This prompt is too ambiguous for a confident biology scene.",
      confidence: best?.score ?? 0,
    };
  }

  const scene = sceneForConcept(best.concept, context);
  const validation = validateBiologySceneConsistency(scene, context);

  if (!validation.ok) {
    return {
      status: "unsupported",
      reason: validation.reason,
      confidence: best.score,
    };
  }

  return {
    status: "supported",
    scene,
    confidence: best.score,
    source: "semantic",
  };
}

function tokenize(text: string) {
  return new Set(text.match(/[a-z0-9-]+/g) ?? []);
}

function hasAny(tokens: Set<string>, terms: string[]) {
  return terms.some((term) => tokens.has(term));
}

function hasPhrase(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function scoreConcepts(text: string, tokens: Set<string>): ConceptScore[] {
  const replicationContext = hasAny(tokens, [
    "replication",
    "fork",
    "duplex",
    "ssdna",
    "single-stranded",
  ]);
  const transcriptionContext =
    hasAny(tokens, [
      "transcription",
      "transcribing",
      "transcribe",
      "transcribed",
      "promoter",
      "gene",
      "coding",
      "rna",
      "transcript",
      "terminator",
      "termination",
    ]) ||
    hasPhrase(text, [
      "rna polymerase",
      "rna from dna",
      "dna information into rna",
      "dna template",
      "template strand",
      "coding strand",
      "non-template strand",
      "3-prime to 5-prime reading",
      "3 prime to 5 prime reading",
      "transcription bubble",
    ]);
  const translationContext =
    hasAny(tokens, [
      "translation",
      "translate",
      "translating",
      "ribosome",
      "ribosomal",
      "trna",
      "codon",
      "anticodon",
      "polypeptide",
      "peptide",
      "mrna",
      "stop",
      "subunit",
      "subunits",
    ]) ||
    hasPhrase(text, [
      "protein synthesis",
      "messenger rna",
      "large subunit joining",
      "subunit joining",
      "large subunit ligates",
      "subunit ligates",
      "ribosome joining the next amino acid",
      "joining the next amino acid",
      "ribosome ligates the next amino acid",
      "ligates the next amino acid",
      "protein comes out",
      "protein from a transcript",
      "protein from transcript",
      "make a protein from a transcript",
      "make protein from a transcript",
      "protein n terminus",
      "protein n-terminus",
      "growing c terminus",
      "growing c-terminus",
      "finished protein release",
      "finished protein released",
      "peptidyl and aminoacyl sites",
      "a p and e sites",
      "a p e sites",
      "a site next to the p site",
      "e site in relation to p and a",
      "make protein from mrna",
      "making protein from mrna",
      "protein from mrna",
      "amino-acid chain",
      "amino acid chain",
      "charged trna",
      "transfer rna",
      "release factor",
    ]);
  const signalingContext =
    hasAny(tokens, [
      "membrane",
      "receptor",
      "rtk",
      "ligand",
      "extracellular",
      "intracellular",
      "cytoplasm",
      "cytoplasmic",
      "phosphorylation",
      "phosphorylated",
      "phosphotyrosine",
      "adaptor",
      "grb2",
      "sos",
      "ras",
      "raf",
      "mek",
      "erk",
      "mapk",
      "nucleus",
    ]) ||
    hasPhrase(text, [
      "receptor tyrosine kinase",
      "growth factor",
      "cell membrane",
      "plasma membrane",
      "membrane receptor",
      "receptor dimer",
      "receptor tail",
      "gdp to gtp",
      "gdp-bound to gtp-bound",
      "ras-gdp",
      "ras-gtp",
      "map kinase",
      "kinase cascade",
      "signal crossing",
      "outside the cell",
      "inside the cell",
    ]);
  const actionPotentialContext =
    hasAny(tokens, [
      "action",
      "potential",
      "spike",
      "neuron",
      "neuronal",
      "nerve",
      "impulse",
      "voltage",
      "voltage-gated",
      "depolarization",
      "depolarize",
      "depolarizing",
      "repolarization",
      "repolarize",
      "hyperpolarization",
      "afterhyperpolarization",
      "threshold",
      "sodium",
      "potassium",
      "na",
      "k",
      "na+",
      "k+",
      "ion",
      "ions",
      "current",
      "influx",
      "efflux",
      "inactivated",
      "refractory",
    ]) ||
    hasPhrase(text, [
      "membrane potential",
      "resting potential",
      "axon membrane",
      "excitable membrane",
      "membrane firing",
      "membrane events",
      "axon spike",
      "spike mechanism",
      "spike phases",
      "channel sequence",
      "channel states",
      "voltage gates",
      "voltage-sensitive channels",
      "voltage gated sodium",
      "voltage-gated sodium",
      "voltage gated potassium",
      "voltage-gated potassium",
      "sodium channel",
      "potassium channel",
      "na channel",
      "k channel",
      "sodium entering",
      "sodium influx",
      "potassium leaving",
      "potassium efflux",
      "falling phase",
      "rising phase",
      "nerve impulse",
      "happens at the peak",
    ]);
  const unsupportedTranscriptionTrap = hasPhrase(text, [
    "look awesome",
    "ribosomes transcribing",
    "replication but use rna polymerase",
    "rna polymerase making daughter dna",
    "helicase making rna",
    "mitochondria transcribing every genome",
    "promoter magic",
    "polymerase doing biology",
    "doing biology",
    "transcription regulation",
    "enhancers and mediator",
    "splicing after transcription",
    "transcription bubbles",
    "protein being transcribed",
    "ribosome transcribing dna",
    "rna being made",
  ]);
  const replicationSpecificPrompt =
    (replicationContext &&
      !hasPhrase(text, [
        "without a replication fork",
        "not a replication fork",
        "not dna replication direction",
      ])) ||
    hasPhrase(text, [
      "rna primer",
      "dna polymerase",
      "daughter dna",
    ]) ||
    (hasPhrase(text, ["template strands"]) && !hasAny(tokens, ["coding"]));
  const transcriptionSpecificPrompt =
    (transcriptionContext && !translationContext) ||
    hasPhrase(text, ["rna polymerase", "rna being made", "make rna"]);
  const translationTrap = hasPhrase(text, [
    "protein being transcribed",
    "mrna being replicated",
    "enzyme that copies dna",
    "polymerase reading a template",
    "show something making protein",
    "show the rna helper",
    "ribosome transcribing dna",
    "ribosome phosphorylation during translation",
    "stop codon pairing with normal trna",
    "amino acids emerging directly from mrna",
    "trna copying dna",
  ]);
  const signalingTrap = hasPhrase(text, [
    "ligand binding dna",
    "ribosome phosphorylation during translation",
    "make the receptor cool",
    "protein near the membrane",
    "show cell signaling",
    "show a phosphorylated protein",
    "show protein phosphorylation",
    "show a membrane protein",
  ]);
  const dnaStructureRequested =
    hasPhrase(text, ["show dna", "visualize dna"]) ||
    hasAny(tokens, ["b-dna", "structure", "helix", "molecular", "model", "coordinates", "atomic"]);
  const excludesReplicationDiagram = hasPhrase(text, [
    "rather than a replication diagram",
    "rather than replication diagram",
    "not a replication diagram",
    "not replication diagram",
  ]);
  const processOrAmbiguousDna =
    ((replicationContext || transcriptionContext) && !excludesReplicationDiagram) ||
    hasAny(tokens, [
      "helicase",
      "polymerase",
      "primase",
      "ligase",
      "okazaki",
      "protein",
      "unwinds",
      "unwind",
      "unzips",
      "unzipping",
      "separates",
      "separating",
      "synthesis",
      "direction",
      "copying",
      "repair",
      "ribosomes",
      "mitochondria",
      "near",
      "thing",
    ]);
  const strandSeparationCue =
    hasAny(tokens, [
      "separates",
      "separate",
      "separating",
      "unzip",
      "unzips",
      "unzipped",
      "unzipping",
      "unwind",
      "unwinds",
      "unwinding",
      "opens",
      "open",
      "opening",
      "apart",
    ]) ||
    hasPhrase(text, [
      "pulling apart",
      "prying open",
      "duplex becomes single stranded",
      "template strands available",
      "fork opens",
      "opens the replication fork",
      "strand separation",
      "parental dna being unzipped",
      "parental dna being unzipped at the fork",
    ]);
  const topoisomeraseCue =
    hasAny(tokens, [
      "topoisomerase",
      "torsional",
      "twisting",
      "supercoils",
      "supercoiling",
      "overwinding",
      "swivel",
      "relaxation",
      "relaxes",
      "relieve",
      "relieves",
      "strain",
    ]) ||
    hasPhrase(text, [
      "reduce twisting",
      "creating too much torsional stress",
      "handles twisting",
      "cuts and rejoins dna",
      "ahead-of-fork relaxation",
      "in front of the fork",
    ]);
  const excludesPolymerase = hasPhrase(text, [
    "ignore polymerase",
    "not polymerase",
    "without polymerase",
  ]);
  const excludesPrimase = hasPhrase(text, [
    "ignore primase",
    "not primase",
    "not the primer enzyme",
    "ignore the primer enzyme",
  ]);
  const excludesLigase = hasPhrase(text, [
    "ignore ligase",
    "not ligase",
    "without ligase",
  ]);
  const excludesHelicase = hasPhrase(text, [
    "ignore helicase",
    "not helicase",
    "without helicase",
  ]);
  const extensionCue =
    hasAny(tokens, [
      "extending",
      "extends",
      "extension",
      "lengthens",
      "elongating",
      "elongates",
    ]) ||
    hasPhrase(text, [
      "enzyme extending dna",
      "enzyme that extends dna",
      "lengthens the daughter dna",
      "nucleotide addition",
      "growing daughter strand",
    ]);
  const primerCue =
    !excludesPrimase && !extensionCue && (hasAny(tokens, ["primase", "primer"]) ||
    hasPhrase(text, [
      "rna segment",
      "rna starter",
      "starter piece",
      "starting point",
      "rna handle",
      "primer formation",
      "primer production",
      "primer being made",
    ]));
  const polymeraseCue =
    (hasAny(tokens, ["polymerase"]) && !transcriptionContext && !translationTrap) ||
    hasPhrase(text, [
      "daughter strand built",
      "nucleotide addition",
      "copying enzyme",
      "growing daughter strand",
      "complementary dna strand",
      "new dna appears",
      "new strand",
      "lengthens the daughter",
      "adding bases",
      "opposite the old strand",
    ]);
  const directionCue =
    !transcriptionContext &&
    !translationContext &&
    (hasPhrase(text, ["5-prime", "3-prime", "5-to-3", "5 to 3", "synthesis direction"]) ||
      hasAny(tokens, ["polarity"]) ||
      (hasAny(tokens, ["direction", "way"]) &&
        hasAny(tokens, ["polymerase", "dna", "synthesize", "synthesis", "nucleotides"])) ||
      hasPhrase(text, ["add nucleotides", "grow only from the 3", "3 end", "strand polarity"]));
  const rnaPolymeraseCue =
    hasPhrase(text, ["rna polymerase", "polymerase ii", "pol ii"]) ||
    hasAny(tokens, ["transcription"]) ||
    hasPhrase(text, [
      "enzyme making rna",
      "makes rna",
      "make rna",
      "making rna",
      "rna from dna",
      "copies dna information into rna",
      "copying dna information into rna",
      "copies dna into rna",
      "reading the template strand",
      "reads the template strand",
      "transcription enzyme",
    ]);
  const transcriptionMechanismCue =
    transcriptionContext &&
    !translationTrap &&
    !unsupportedTranscriptionTrap &&
    (hasAny(tokens, ["transcribing", "transcribe", "transcribed"]) ||
      (hasAny(tokens, ["polymerase"]) && hasAny(tokens, ["rna"]) && hasAny(tokens, ["dna", "gene", "template", "growing"])) ||
      hasPhrase(text, [
        "transcription of a short gene",
        "transcription of a gene",
        "protein machine producing rna",
        "producing rna on a gene",
        "dna information being written as rna",
        "dna information into rna",
        "copy dna information into rna",
        "turns a dna template into rna",
        "copying a gene into rna",
        "rna production from genetic dna information",
        "transcription enzyme making a nascent rna",
        "transcription elongation complex",
        "rna polymerase with dna and a growing rna",
        "rna polymerase making rna",
        "polymerase ii making rna",
        "rna polymerase ii making rna",
        "dna copied into rna",
        "making rna from dna",
        "make rna from dna",
        "copies dna into rna",
        "copying dna into rna",
        "rna being made from dna",
        "rna synthesis from a dna template",
        "how transcription works",
        "moving along a gene",
        "rna emerging",
        "rna from a dna template",
        "rna polymerase transcribing",
        "rna polymerase moving",
        "rna polymerase reading",
        "show bacterial transcription",
      "show eukaryotic transcription",
      ]));
  const bareAmbiguousRnaPrompt = hasPhrase(text, ["show rna being made"]);
  const transcriptionBubbleCue =
    !unsupportedTranscriptionTrap &&
    hasPhrase(text, [
      "transcription bubble",
      "locally opened dna",
      "local opening in dna during transcription",
      "dna opens during transcription",
      "dna opening around rna polymerase",
      "dna opening locally around rna polymerase",
      "dna around rna polymerase",
      "dna right around rna polymerase",
      "dna opens locally",
      "dna opened only at the transcription enzyme",
      "rna polymerase separates the dna locally",
      "opened dna pocket inside rna polymerase",
      "local unwinding without a replication fork",
      "dna open while rna is being synthesized",
      "opens around rna polymerase",
    ]);
  const promoterCue =
    (!translationContext && hasAny(tokens, ["promoter", "initiation"])) ||
    hasPhrase(text, [
      "dna site where rna polymerase binds before a gene",
      "polymerase binding site before gene",
      "polymerase binding site for transcription",
      "transcription start region",
      "start region for transcription",
      "where transcription starts",
      "where does transcription start",
      "upstream start of a transcribed gene",
      "transcription initiation",
    ]);
  const templateCodingCue =
    hasPhrase(text, [
      "template and coding strands",
      "template and coding dna strands",
      "coding versus template strands",
      "template strand",
      "coding strand",
      "non-template and template",
      "non-template strand",
      "dna strand being read",
      "strand polymerase reads",
      "which dna strand is read",
      "strand does rna polymerase use",
      "strand that is read during transcription",
      "strand matches the rna except u for t",
      "strand roles during transcription",
      "strand is not read by rna polymerase",
      "read strand and coding strand",
      "coding strand correspondence",
    ]);
  const transcriptionDirectionCue =
    transcriptionContext &&
    !translationContext &&
    (hasPhrase(text, [
      "5-prime to 3-prime rna synthesis",
      "5 prime to 3 prime rna synthesis",
      "rna synthesis from 5-prime to 3-prime",
      "rna synthesis from 5 prime to 3 prime",
      "transcription direction",
      "direction rna polymerase moves",
      "which direction does rna polymerase read dna",
      "rna polymerase read dna",
      "rna chain growth direction",
      "rna strand synthesized",
      "rna 5-prime to 3-prime growth",
      "transcription polarity",
      "end of rna is extended",
      "3-prime to 5-prime reading of the template",
      "3-prime to 5-prime reading",
      "5-to-3 rna synthesis",
    ]) ||
      hasAny(tokens, ["direction", "polarity"]));
  const terminationCue =
    (!translationContext && hasAny(tokens, ["termination", "terminator"])) ||
    hasPhrase(text, [
      "terminate transcription",
      "stop transcription",
      "stops transcription",
      "stopping at the end of a transcription unit",
      "reaches a terminator",
      "polymerase releases transcript",
      "releases the transcript",
      "releasing the rna transcript",
    ]);
  const translationMechanismCue =
    translationContext &&
    !translationTrap &&
    !transcriptionSpecificPrompt &&
    (hasPhrase(text, [
      "ribosome elongating a protein",
      "ribosome synthesizing protein",
      "ribosome making protein",
      "make protein from mrna",
      "making protein from mrna",
      "protein from mrna",
      "convert mrna information into protein",
      "mrna information into protein",
      "protein from a transcript",
      "protein from transcript",
      "make a protein from a transcript",
      "make protein from a transcript",
      "amino-acid chain",
      "amino acid chain",
      "protein synthesis",
      "protein synthesis on an mrna",
      "ribosomal protein synthesis",
      "mrna being decoded into a polypeptide",
      "mrna information converted into a protein",
      "mrna information into a protein",
      "reads codons and grows a peptide",
      "protein-building complex on messenger rna",
      "protein building complex on messenger rna",
      "peptide emerging from the ribosome",
      "ribosome building a polypeptide",
      "codon reading during protein synthesis",
      "complex reading mrna",
      "protein-making machine",
      "ribosome reading mrna",
    ]) ||
      (hasAny(tokens, ["translation", "translate", "translating"]) && hasAny(tokens, ["protein", "mrna", "ribosome"])));
  const translationInitiationCue =
    translationContext &&
    !translationTrap &&
    hasPhrase(text, [
      "translation initiation",
      "ribosome assembling on mrna",
      "ribosome assembly at the beginning of translation",
      "initiator trna",
      "first trna",
      "first amino acid carrier",
      "first trna in the p site",
      "first amino acid carrier already sitting in the ribosome",
      "beginning of protein synthesis",
      "start codon in translation",
      "start codon",
      "large subunit joining",
      "subunit joining",
      "large subunit ligates",
      "subunit ligates",
      "starts translation on mrna",
    ]);
  const chargedTrnaCue =
    !translationTrap &&
    hasPhrase(text, [
      "charged trna",
      "charged trna before codon recognition",
      "charged adaptor rna",
      "amino acid attached to trna",
      "amino acid carried by transfer rna",
      "trna with an amino acid attached",
      "aminoacyl trna",
      "aminoacyl-trna",
      "amino acid to ribosome",
      "amino acids to the a site",
      "brings amino acids to the a site",
      "next amino acid on its trna",
      "amino acid attached at the top of trna",
      "trna carrying amino acid",
      "trna carrying cargo",
      "amino-acid delivery by trna",
      "carrier that delivers amino acids",
      "rna brings the next amino acid",
    ]);
  const codonAnticodonCue =
    !translationTrap &&
    !chargedTrnaCue &&
    hasPhrase(text, [
      "codon anticodon",
      "codon-anticodon",
      "trna recognize",
      "trna reading a codon",
      "codon recognition",
      "trna matching the codon",
      "matching the codon",
      "codon pairing",
      "complementary anticodon",
      "transcript triplet",
      "adaptor triplet",
      "mrna codon",
      "anticodon complementary",
      "triplet to the transcript",
      "three-base mrna unit",
      "mrna word",
    ]);
  const ribosomeSiteCue =
    !translationTrap &&
    translationContext &&
    (hasPhrase(text, [
      "a p and e sites",
      "a p e sites",
      "all three trna binding sites",
      "ribosomal site order",
      "p-site trna",
      "a-site trna",
      "incoming trna in the a site",
      "peptidyl and aminoacyl sites",
      "exit site for empty trna",
      "a site next to the p site",
      "e site in relation to p and a",
      "site receives the next charged trna",
      "trnas arranged across",
    ]) ||
      (hasAny(tokens, ["site", "sites"]) && hasAny(tokens, ["ribosome", "ribosomal", "trna", "a", "p", "e"])));
  const peptideBondCue =
    !translationTrap &&
    !hasPhrase(text, ["without a peptide bond"]) &&
    hasPhrase(text, [
      "peptide bond",
      "peptidyl transferase",
      "peptide chain being transferred",
      "peptide is transferred",
      "chain is transferred",
      "chemical step linking amino acids",
      "peptide moving onto the a-site amino acid",
      "growing peptide after transfer",
      "amino-acid chain extended",
      "bond-forming step of elongation",
      "ribosome joining the next amino acid",
      "joining the next amino acid",
      "ribosome ligates the next amino acid",
      "ligates the next amino acid",
      "chain transfer from p-site trna to a-site trna",
      "growing peptide move from the p site to the a site",
    ]);
  const translocationCue =
    !translationTrap &&
    hasPhrase(text, [
      "ribosome translocation",
      "trna moving through a p and e sites",
      "a p and e sites",
      "after peptide bond formation",
      "advancing one codon",
      "ribosome advancing one codon",
      "immediately after peptide bond formation",
      "trnas shifting from a to p to e",
      "translocation after elongation",
      "ribosome movement along the transcript",
      "former a-site trna moving to p",
      "p-site trna shifting toward e",
      "one-codon movement on mrna",
      "trna traffic through the ribosome",
      "empty trna leave",
      "empty trna exits",
    ]);
  const translationDirectionCue =
    translationContext &&
    !translationTrap &&
    hasPhrase(text, [
      "translation from 5-prime to 3-prime",
      "translation from 5 prime to 3 prime",
      "5-prime to 3-prime translation",
      "5 prime to 3 prime translation",
      "ribosome move",
      "ribosome moves",
      "mrna read direction",
      "mrna polarity in translation",
      "protein n terminus",
      "protein n-terminus",
      "growing c terminus",
      "growing c-terminus",
      "n to c growth",
      "mrna direction during translation",
      "direction along the transcript",
      "protein comes out first",
      "n-terminus",
      "c-terminus",
    ]);
  const translationTerminationCue =
    translationContext &&
    !translationTrap &&
    hasPhrase(text, [
      "translation termination",
      "stop codon",
      "release factor",
      "finished protein released",
      "finished protein release",
      "polypeptide release",
      "release of the polypeptide",
      "release factor recognizing a stop codon",
      "release factor in the a site",
      "ribosome reaches a stop",
      "stop signal",
      "ribosome termination",
    ]);
  const signalingMembraneCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "show a membrane receptor",
      "show membrane receptor",
      "show a membrane protein",
      "transmembrane receptor",
      "receptor embedded in membrane",
      "cell-surface receptor",
      "cell surface receptor",
      "receptor crossing the cell membrane",
      "membrane-spanning signaling receptor",
      "rtk embedded in the membrane",
      "outside and cytoplasmic sides",
      "receptor tyrosine kinase in the bilayer",
      "receptor anchored through the membrane",
      "signaling receptor at the cell surface",
    ]);
  const signalingLigandCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "ligand binding",
      "ligand binds",
      "ligand activating",
      "growth factor binding",
      "extracellular signal",
      "signaling molecule binding receptor",
      "ligand binding to a membrane receptor",
      "ligand binding a receptor tyrosine kinase",
      "signal molecule attaching outside the receptor",
      "ligand-bound receptor",
      "growth factor docking",
      "rtk catching a ligand",
      "ligand contacting the extracellular receptor domain",
      "receptor activation by an outside ligand",
    ]);
  const signalingDimerCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "receptor dimerization",
      "receptors coming together",
      "two rtk receptors",
      "pair receptors",
      "receptor dimer",
      "after ligand binding",
      "two receptor molecules pairing",
      "rtk monomers",
      "paired receptor tyrosine kinases",
      "receptor monomer",
      "side by side",
    ]);
  const signalingPhosphoCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "autophosphorylation",
      "phosphorylation",
      "phosphorylated",
      "phosphate added",
      "phosphotyrosine",
      "receptor tails",
      "cytoplasmic tails",
      "docking sites",
      "intracellular receptor domains",
      "membrane receptor being phosphorylated",
      "receptor being phosphorylated",
      "phosphates on the cytoplasmic rtk tail",
      "activated receptor kinase domains phosphorylating tails",
    ]);
  const signalingAdaptorCue =
    signalingContext &&
    !translationContext &&
    !signalingTrap &&
    !hasPhrase(text, ["adaptor rna", "adaptor matching", "adaptor triplet", "transcript triplet"]) &&
    hasPhrase(text, [
      "adaptor",
      "grb2",
      "sh2",
      "binding to an activated receptor",
      "recruited to the activated receptor",
      "phosphorylated receptor tail",
    ]);
  const signalingRasCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "ras activation",
      "turns on ras",
      "gdp to gtp",
      "gdp-bound to gtp-bound",
      "gdp being exchanged for gtp",
      "ras switching",
      "ras-gdp",
      "ras-gtp",
      "ras-gdp becoming ras-gtp",
      "ras gdp becoming ras gtp",
      "sos activating",
      "ras-gdp becoming ras-gtp",
      "grb2 sos coupling",
      "signal crossing from outside the cell to ras",
      "ras activated at the inner membrane surface",
      "turns ras into its gtp-bound state",
      "rtk recruiting sos",
    ]);
  const signalingMapkCue =
    signalingContext &&
    !signalingTrap &&
    !hasPhrase(text, ["without the mapk cascade"]) &&
    hasPhrase(text, [
      "mapk cascade",
      "map kinase cascade",
      "ras raf mek erk",
      "raf mek and erk",
      "rtk signaling to erk",
      "rtk signaling through ras",
      "raf phosphorylating mek",
      "erk activation downstream",
      "ras to raf to mek to erk",
      "ras-gtp driving the kinase cascade",
      "ras gtp driving the kinase cascade",
      "receptor signaling ending at erk",
      "raf mek erk in order",
      "downstream kinases",
      "cytoplasmic kinase cascade",
      "mapk activation after rtk activation",
      "map kinase chain after ras-gtp",
    ]);
  const signalingNucleusCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "erk signaling to the nucleus",
      "erk signaling toward the nucleus",
      "signal reaching the nucleus",
      "signal to the nucleus",
      "nuclear response",
      "activated erk near the nucleus",
      "response gene",
      "downstream cellular response",
    ]);
  const signalingTopologyCue =
    signalingContext &&
    !signalingTrap &&
    hasPhrase(text, [
      "extracellular ligand and cytoplasmic receptor tail",
      "outside-to-inside signaling",
      "receptor kinase domains on the cytoplasmic side",
      "ras at the inner membrane surface",
      "ligand above and ras below the membrane",
      "outside signal with inside kinase cascade",
      "kinase cascade",
      "topology of rtk signaling",
      "ligand outside the cell and the adaptor beneath the membrane",
    ]);
  const actionPotentialTrap =
    ["show sodium", "show potassium", "show ions"].includes(text) ||
    hasPhrase(text, [
      "show electricity in a cell",
      "make the neuron fire somehow",
      "show a membrane protein",
      "show a charged membrane object",
      "show a cellular wave",
      "show a channel without saying which channel",
      "show ions doing something",
      "show a membrane event",
      "show the cell becoming excited",
    ]);
  const actionPotentialFullCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "action potential",
      "neuronal spike",
      "nerve impulse",
      "membrane spike",
      "how an action potential works",
      "full action potential",
      "voltage-gated channel sequence",
      "ordered ion-channel states",
      "excitable membrane firing",
      "local axon spike",
      "canonical action-potential phases",
      "canonical action potential phases",
      "spike phases",
      "channel state changes across the spike",
      "voltage-gated channel state transitions",
      "ion channels crossing the axon membrane",
      "open closed and inactivated channel states",
    ]);
  const restingCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "resting membrane",
      "resting potential",
      "before an action potential",
      "before the spike",
      "resting state",
      "membrane at rest",
      "before firing",
      "minus seventy millivolt",
      "seventy millivolt",
      "resting ionic gradients",
      "pre-threshold resting",
      "at rest",
      "before the action potential",
      "closed sodium and potassium channels",
      "available closed sodium channels",
    ]);
  const thresholdCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "threshold",
      "triggering an action potential",
      "trigger point",
      "enough depolarization to fire",
      "minus fifty-five millivolt",
      "fifty-five millivolt",
      "threshold before the rising phase",
      "enough depolarization to start",
      "threshold starts positive feedback",
    ]);
  const depolarizationCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    (hasAny(tokens, ["depolarization", "depolarize", "depolarizing"]) ||
      hasPhrase(text, [
        "rising phase",
        "voltage rise",
        "voltage rises",
        "membrane voltage rise",
        "sodium entering during",
        "sodium entering through voltage-gated",
        "sodium influx",
        "na enters",
        "why does membrane voltage rise",
        "membrane voltage shoot upward",
        "rising limb",
        "sodium entry",
        "na entering",
        "voltage gates",
      ]));
  const peakCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "peak of an action potential",
      "at the peak",
      "happens at the peak",
      "after the action potential reaches its peak",
      "sodium channels after the action potential reaches its peak",
      "positive peak",
      "na channels inactivated",
      "sodium channel inactivation",
      "channel inactivation",
      "apex of the spike",
      "sodium current shuts down",
      "k-channel opening at peak",
      "na-channel inactivation",
      "na channel inactivation",
      "peak before the falling phase",
      "top of the action potential",
      "transition from rising to falling",
      "sodium influx stops after the peak",
      "spike reaches the top",
      "plus thirty millivolts",
    ]);
  const repolarizationCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    (hasAny(tokens, ["repolarization", "repolarize", "repolarizing"]) ||
      hasPhrase(text, [
        "falling phase",
        "voltage fall",
        "voltage falls",
        "voltage returning negative",
        "potassium leaving during",
        "potassium efflux",
        "k exits",
        "why does the voltage fall",
        "voltage to return negative",
        "ap falling limb",
        "k current",
        "delayed voltage-gated channels",
        "open voltage-gated potassium channels after na-channel inactivation",
        "ap falling limb",
      ]));
  const hyperpolarizationCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "hyperpolarization",
      "afterhyperpolarization",
      "undershoot",
      "below resting",
      "below rest",
      "voltage below rest",
      "too negative",
      "below-rest membrane voltage",
      "hyperpolarized state",
      "continued k efflux below",
      "membrane to become too negative",
      "hyperpolarized state before recovery",
    ]);
  const recoveryCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "recovery after an action potential",
      "return to resting",
      "returns toward rest",
      "after an action potential",
      "channels recover",
      "channels returning to the resting configuration",
      "channel availability after the action potential",
      "recovery without reversing",
      "after hyperpolarization ends",
      "potassium channels closing during recovery",
      "sodium channel reset and potassium channel closure",
    ]);
  const refractoryCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "cannot immediately fire again",
      "can't immediately fire again",
      "refractory",
      "reduced excitability",
      "absolute refractory",
      "relative refractory",
    ]);
  const sodiumChannelCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "voltage-gated sodium channel",
      "voltage gated sodium channel",
      "sodium channel",
      "na channel",
    ]);
  const potassiumChannelCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "voltage-gated potassium channel",
      "voltage gated potassium channel",
      "potassium channel",
      "k channel",
    ]);
  const gradientCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "sodium and potassium gradients",
      "na and k gradients",
      "ion gradients",
      "sodium outside and potassium inside",
      "put sodium outside and potassium mainly inside",
      "sodium mainly outside and potassium mainly inside",
      "na outside to inside and k inside to outside",
      "sodium gradient and the potassium gradient",
      "inward sodium current and outward potassium current",
      "main ions cross the membrane",
      "opposing ion currents",
      "ion movement directions",
      "na/k flux directions",
    ]);
  const sodiumFluxCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "which way does sodium move",
      "sodium entering",
      "sodium enters",
      "sodium influx",
      "na enters",
      "na+ enters",
      "sodium current inward",
      "which direction does na+ move",
      "which direction does na move",
    ]);
  const potassiumFluxCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "which way does potassium move",
      "potassium leaving",
      "potassium leaves",
      "potassium efflux",
      "k exits",
      "k+ exits",
      "potassium current outward",
      "which direction does k+ move",
      "which direction does k move",
    ]);
  const positiveFeedbackCue =
    actionPotentialContext &&
    !actionPotentialTrap &&
    hasPhrase(text, [
      "positive feedback",
      "depolarization accelerates",
      "rise so quickly after threshold",
      "more sodium channels open",
      "opening sodium channels causes more sodium channels to open",
    ]);

  return [
    { concept: "action-potential-positive-feedback", score: positiveFeedbackCue ? 0.98 : 0 },
    { concept: "action-potential-refractory", score: refractoryCue ? 0.97 : 0 },
    { concept: "action-potential-recovery", score: recoveryCue ? 0.97 : 0 },
    { concept: "action-potential-threshold", score: thresholdCue ? 0.97 : 0 },
    { concept: "action-potential-hyperpolarization", score: hyperpolarizationCue ? 0.96 : 0 },
    { concept: "action-potential-repolarization", score: repolarizationCue ? 0.96 : 0 },
    { concept: "action-potential-peak", score: peakCue ? 0.95 : 0 },
    { concept: "action-potential-depolarization", score: depolarizationCue ? 0.96 : 0 },
    { concept: "action-potential-resting", score: restingCue ? 0.95 : 0 },
    { concept: "action-potential-sodium-flux", score: sodiumFluxCue ? 0.98 : 0 },
    { concept: "action-potential-potassium-flux", score: potassiumFluxCue ? 0.98 : 0 },
    { concept: "action-potential-gradients", score: gradientCue ? 0.97 : 0 },
    { concept: "action-potential-sodium-channel", score: sodiumChannelCue && !depolarizationCue && !peakCue ? 0.93 : 0 },
    { concept: "action-potential-potassium-channel", score: potassiumChannelCue && !repolarizationCue ? 0.93 : 0 },
    { concept: "action-potential-full", score: actionPotentialFullCue ? 0.95 : 0 },
    { concept: "signaling-nucleus", score: signalingNucleusCue ? 0.97 : 0 },
    { concept: "signaling-mapk", score: signalingMapkCue ? 0.96 : 0 },
    { concept: "signaling-ras", score: signalingRasCue || signalingTopologyCue ? 0.96 : 0 },
    { concept: "signaling-adaptor", score: signalingAdaptorCue ? 0.95 : 0 },
    { concept: "signaling-phosphorylation", score: signalingPhosphoCue ? 0.95 : 0 },
    { concept: "signaling-rtk-activation", score: signalingLigandCue && hasAny(tokens, ["activating", "activates", "activation", "rtk"]) ? 0.96 : 0 },
    { concept: "signaling-dimerization", score: signalingDimerCue ? 0.95 : 0 },
    { concept: "signaling-ligand-binding", score: signalingLigandCue || signalingTopologyCue ? 0.94 : 0 },
    { concept: "signaling-membrane-receptor", score: signalingMembraneCue ? 0.93 : 0 },
    {
      concept: "dna-structure",
      score:
        hasAny(tokens, ["dna", "b-dna"]) &&
        dnaStructureRequested &&
        !processOrAmbiguousDna
          ? 0.92
          : 0,
    },
    {
      concept: "translation-ribosome",
      score:
        hasPhrase(text, ["show a ribosome", "show ribosome"]) &&
        !translationTrap &&
        !hasAny(tokens, ["elongating", "translation", "mrna", "trna", "codon", "protein", "polypeptide", "building", "transcribing", "dna"])
          ? 0.91
          : 0,
    },
    {
      concept: "translation-initiation",
      score: translationInitiationCue ? 0.95 : 0,
    },
    {
      concept: "translation-termination",
      score: translationTerminationCue ? 0.96 : 0,
    },
    {
      concept: "translation-peptide-bond",
      score: peptideBondCue ? 0.96 : 0,
    },
    {
      concept: "translation-translocation",
      score: translocationCue ? 0.97 : 0,
    },
    {
      concept: "translation-directionality",
      score: translationDirectionCue ? 0.95 : 0,
    },
    {
      concept: "translation-codon-anticodon",
      score: codonAnticodonCue ? 0.95 : 0,
    },
    {
      concept: "translation-charged-trna",
      score: chargedTrnaCue ? 0.94 : 0,
    },
    {
      concept: "translation-elongation",
      score: translationMechanismCue || ribosomeSiteCue ? 0.95 : 0,
    },
    {
      concept: "transcription-rna-polymerase",
      score:
        hasPhrase(text, ["show rna polymerase", "visualize rna polymerase"]) &&
        !unsupportedTranscriptionTrap &&
        !replicationSpecificPrompt &&
        !hasAny(tokens, ["transcribing", "transcription", "gene", "dna", "promoter", "making", "makes", "synthesizing"])
          ? 0.93
          : 0,
    },
    {
      concept: "transcription-gene",
      score:
        hasPhrase(text, ["show a gene on dna", "show gene on dna"]) ||
        (hasAny(tokens, ["gene"]) && hasAny(tokens, ["dna"]) && !rnaPolymeraseCue && !unsupportedTranscriptionTrap && !replicationSpecificPrompt)
          ? 0.91
          : 0,
    },
    {
      concept: "transcription-promoter",
      score:
        promoterCue && !transcriptionMechanismCue && !transcriptionDirectionCue && !unsupportedTranscriptionTrap && !replicationSpecificPrompt
          ? 0.92
          : 0,
    },
    {
      concept: "transcription-template-coding",
      score:
        templateCodingCue && !transcriptionMechanismCue && !unsupportedTranscriptionTrap && !replicationSpecificPrompt
          ? 0.94
          : 0,
    },
    {
      concept: "transcription-directionality",
      score:
        !unsupportedTranscriptionTrap &&
        !replicationSpecificPrompt &&
        (transcriptionDirectionCue || (templateCodingCue && hasAny(tokens, ["direction", "read"])))
          ? 0.97
          : 0,
    },
    {
      concept: "transcription-termination",
      score: terminationCue && !unsupportedTranscriptionTrap && !replicationSpecificPrompt ? 0.96 : 0,
    },
    {
      concept: "transcription-bubble",
      score:
        transcriptionBubbleCue ||
        (hasAny(tokens, ["bubble"]) && transcriptionContext) ||
        hasPhrase(text, ["where dna opens during transcription", "what happens to dna around rna polymerase"])
          ? replicationSpecificPrompt ? 0 : 0.95
          : 0,
    },
    {
      concept: "transcription-rna-transcript",
      score:
        !unsupportedTranscriptionTrap &&
        !replicationSpecificPrompt &&
        (hasPhrase(text, [
          "rna emerging",
          "rna transcript",
          "transcript emerging",
          "rna being made",
          "nascent rna coming out",
          "growing rna attached to rna polymerase",
          "rna being synthesized from the template",
          "new rna chain leaving",
          "produced by rna polymerase",
          "transcript extension during transcription",
          "rna strand paired briefly with template dna",
          "rna product formation",
          "nascent transcript behind polymerase",
        ]) ||
          (hasAny(tokens, ["rna"]) && hasAny(tokens, ["emerging", "transcript", "synthesis", "produced"]) && transcriptionContext))
          ? 0.94
          : 0,
    },
    {
      concept: "transcription-initiation",
      score:
        promoterCue && transcriptionMechanismCue && !replicationSpecificPrompt
          ? 0.94
          : 0,
    },
    {
      concept: "transcription-mechanism",
      score:
        transcriptionMechanismCue
          && !replicationSpecificPrompt
          ? 0.95
          : 0,
    },
    {
      concept: "helicase-unwinds",
      score: Math.max(
        (hasAny(tokens, ["helicase"]) || hasAny(tokens, ["enzyme", "protein", "motor"])) &&
          !excludesHelicase &&
          strandSeparationCue &&
          !primerCue &&
          (!hasAny(tokens, ["polymerase"]) || excludesPolymerase) &&
          (!hasAny(tokens, ["ligase"]) || excludesLigase)
          ? 0.94
          : 0,
        hasAny(tokens, ["helicase"]) &&
          !excludesHelicase &&
          (strandSeparationCue ||
            hasPhrase(text, ["opening dna", "opening the duplex", "at the replication fork"]))
          ? 0.96
          : 0,
        !excludesHelicase &&
          hasPhrase(text, [
            "protein that unwinds dna",
            "protein separating the dna strands",
            "separating the dna strands",
            "opens the replication fork",
            "strand separation at the fork",
            "parental dna being unzipped",
            "duplex becomes single stranded",
          ])
          ? 0.9
          : 0
      ),
    },
    {
      concept: "strand-stabilization",
      score:
        (hasAny(tokens, ["stabilizes", "stabilizing", "stabilize", "coats", "coating", "protecting"]) ||
          hasAny(tokens, ["rpa", "ssb"]) ||
          (hasAny(tokens, ["binds"]) && hasAny(tokens, ["ssdna", "single-stranded"])) ||
          (hasAny(tokens, ["keeps", "holds", "stops", "prevents"]) &&
            hasAny(tokens, ["apart", "reannealing"])) ||
          hasPhrase(text, [
            "keeps dna strands apart",
            "keeps the strands apart",
            "stops the strands from reannealing",
            "prevents ssdna from reannealing",
            "snapping together",
            "open fork templates usable",
            "coating factors",
            "template strands",
            "single strands",
            "holds ssdna open",
          ])) &&
        (hasAny(tokens, ["dna", "ssdna", "single-stranded", "strands", "templates"]) || hasPhrase(text, ["strands apart"]))
          ? hasAny(tokens, ["coding"]) ? 0 : hasAny(tokens, ["rpa", "ssb"]) ? 0.98 : 0.94
          : 0,
    },
    {
      concept: "topoisomerase-ahead",
      score: Math.max(
        hasAny(tokens, ["topoisomerase"]) && hasAny(tokens, ["helicase", "fork", "ahead"])
          ? 0.95
          : 0,
        topoisomeraseCue
          ? 0.93
          : 0,
        hasPhrase(text, [
          "relieves torsional strain",
          "relieves twisting ahead",
          "enzyme acting ahead of helicase",
          "acts ahead of the replication fork",
        ])
          ? 0.9
          : 0
      ),
    },
    {
      concept: "primase-primer",
      score: Math.max(
        hasAny(tokens, ["primase"]) && !excludesPrimase && hasAny(tokens, ["primer", "rna"])
          ? 0.96
          : 0,
        primerCue && (!hasAny(tokens, ["ligase"]) || excludesLigase)
          ? 0.93
          : 0,
        hasPhrase(text, [
          "rna primer come from",
          "primer synthesis",
          "synthesize rna primer",
          "primer at the fork",
        ])
          ? 0.9
          : 0
      ),
    },
    {
      concept: "polymerase-synthesis",
      score: Math.max(
        hasPhrase(text, ["copy dna into dna", "copying dna into dna", "dna into dna"])
          ? 0.93
          : 0,
        hasAny(tokens, ["polymerase"]) &&
          !unsupportedTranscriptionTrap &&
          !excludesPolymerase &&
          !directionCue &&
          !primerCue &&
          (hasAny(tokens, ["synthesizing", "synthesis", "extending", "copying", "moves", "synthesize", "elongating"]) ||
            hasPhrase(text, ["copies the template", "copying the template"]))
          ? 0.94
          : 0,
        polymeraseCue && !unsupportedTranscriptionTrap && !excludesPolymerase && !directionCue && !primerCue && !strandSeparationCue
          ? 0.9
          : 0,
        hasPhrase(text, [
          "enzyme extending dna",
          "enzyme that extends dna",
          "lengthens the daughter dna",
          "grows behind the fork",
          "template is read",
        ]) && !unsupportedTranscriptionTrap && !excludesPolymerase
          ? 0.92
          : 0,
        hasPhrase(text, ["daughter strand synthesized", "dna copying by polymerase"])
          ? 0.88
          : 0
      ),
    },
    {
      concept: "leading-synthesis",
      score:
        ((hasPhrase(text, ["leading strand", "leading-strand", "leading-side", "leading template"]) ||
          hasAny(tokens, ["continuous", "continuously", "smooth", "steadily", "non-fragmented"])) &&
          (hasAny(tokens, ["synthesis", "synthesized", "replication", "growth", "copied", "copying", "strand"]) ||
            hasPhrase(text, ["made continuously", "one smooth run", "without fragments", "continuous replication"])))
          ? 0.93
          : 0,
    },
    {
      concept: "lagging-synthesis",
      score:
        ((hasPhrase(text, ["lagging strand", "lagging-side", "delayed strand", "fragment-based"]) ||
          hasAny(tokens, ["discontinuous", "fragments", "fragmented", "chunks", "backstitching"])) &&
          (hasAny(tokens, ["synthesis", "synthesized", "replication", "copying", "strand", "side"]) ||
            hasPhrase(text, ["made on the delayed strand", "separate chunks", "lagging strand fragments"])))
          ? 0.93
          : 0,
    },
    {
      concept: "leading-lagging-comparison",
      score:
        hasPhrase(text, ["leading and lagging"]) ||
        (hasAny(tokens, ["continuous"]) && hasAny(tokens, ["discontinuous"])) ||
        (hasAny(tokens, ["difference", "compare"]) &&
          hasAny(tokens, ["leading"]) &&
          hasAny(tokens, ["lagging"]))
          ? 0.94
          : 0,
    },
    {
      concept: "okazaki-fragment",
      score:
        hasAny(tokens, ["okazaki"]) && !hasAny(tokens, ["joins", "ligates", "closes", "seals"])
          ? 0.95
          : 0,
    },
    {
      concept: "ligase-joins",
      score: Math.max(
        hasAny(tokens, ["ligase"]) && !excludesLigase && hasAny(tokens, ["dna", "backbone", "seals", "ligates"])
          ? 0.96
          : 0,
        hasAny(tokens, ["seals", "closes", "nicks", "nick", "gaps", "gap"]) &&
          (hasAny(tokens, ["fragments", "lagging", "replication", "backbone"]) || hasPhrase(text, ["primer replacement", "discontinuous replication products"]))
          ? 0.95
          : 0,
        hasPhrase(text, ["makes discontinuous replication products continuous"])
          ? 0.95
          : 0,
        hasAny(tokens, ["okazaki"]) && hasAny(tokens, ["ligates", "joins", "closes", "seals"])
          ? 0.95
          : 0,
        hasPhrase(text, [
          "enzyme that closes fragment gaps",
          "closes fragment gaps",
          "seals the gaps after primer replacement",
        ]) && !excludesLigase
          ? 0.95
          : 0,
        hasPhrase(text, [
          "joins okazaki fragments",
          "what joins okazaki",
          "closes the nick",
          "closes the nicks",
          "nick between fragments",
        ])
          ? 0.94
          : 0
      ),
    },
    {
      concept: "directionality",
      score: directionCue ? 0.97 : 0,
    },
  ];
}

function sceneForConcept(
  concept: SemanticConcept,
  context: ReturnType<typeof detectBiologyContext>
) {
  switch (concept) {
    case "dna-structure":
      return dnaStructureScene();
    case "helicase-unwinds":
      return helicaseMechanismScene();
    case "strand-stabilization":
      return strandStabilizationScene(context);
    case "topoisomerase-ahead":
      return topoisomeraseAheadOfHelicaseScene();
    case "primase-primer":
      return primasePrimerScene();
    case "polymerase-synthesis":
      return dnaReplicationSynthesisScene("polymerase");
    case "leading-synthesis":
      return dnaReplicationSynthesisScene("leading-strand");
    case "lagging-synthesis":
      return dnaReplicationSynthesisScene("lagging-strand");
    case "leading-lagging-comparison":
      return dnaReplicationSynthesisScene("leading-lagging-comparison");
    case "okazaki-fragment":
      return dnaReplicationSynthesisScene("okazaki-fragment");
    case "ligase-joins":
      return dnaReplicationSynthesisScene("ligase");
    case "directionality":
      return dnaReplicationSynthesisScene("directionality");
    case "transcription-rna-polymerase":
      return transcriptionScene("rna-polymerase", context);
    case "transcription-gene":
      return transcriptionScene("gene", context);
    case "transcription-promoter":
      return transcriptionScene("promoter", context);
    case "transcription-template-coding":
      return transcriptionScene("template-coding-strands", context);
    case "transcription-mechanism":
      return transcriptionScene("transcription", context);
    case "transcription-initiation":
      return transcriptionScene("initiation", context);
    case "transcription-bubble":
      return transcriptionScene("bubble", context);
    case "transcription-rna-transcript":
      return transcriptionScene("rna-transcript", context);
    case "transcription-directionality":
      return transcriptionScene("directionality", context);
    case "transcription-termination":
      return transcriptionScene("termination", context);
    case "translation-ribosome":
      return translationScene("ribosome", context);
    case "translation-initiation":
      return translationScene("initiation", context);
    case "translation-elongation":
      return translationScene("elongation", context);
    case "translation-charged-trna":
      return translationScene("charged-trna", context);
    case "translation-codon-anticodon":
      return translationScene("codon-anticodon", context);
    case "translation-peptide-bond":
      return translationScene("peptide-bond", context);
    case "translation-translocation":
      return translationScene("translocation", context);
    case "translation-directionality":
      return translationScene("directionality", context);
    case "translation-termination":
      return translationScene("termination", context);
    case "signaling-membrane-receptor":
      return signalingScene("membrane-receptor");
    case "signaling-ligand-binding":
      return signalingScene("ligand-binding");
    case "signaling-dimerization":
      return signalingScene("dimerization");
    case "signaling-rtk-activation":
      return signalingScene("rtk-activation");
    case "signaling-phosphorylation":
      return signalingScene("phosphorylation");
    case "signaling-adaptor":
      return signalingScene("adaptor-recruitment");
    case "signaling-ras":
      return signalingScene("ras-activation");
    case "signaling-mapk":
      return signalingScene("mapk-cascade");
    case "signaling-nucleus":
      return signalingScene("signal-to-nucleus");
    case "action-potential-full":
      return actionPotentialScene("full");
    case "action-potential-resting":
      return actionPotentialScene("resting");
    case "action-potential-threshold":
      return actionPotentialScene("threshold");
    case "action-potential-depolarization":
      return actionPotentialScene("depolarization");
    case "action-potential-peak":
      return actionPotentialScene("peak");
    case "action-potential-repolarization":
      return actionPotentialScene("repolarization");
    case "action-potential-hyperpolarization":
      return actionPotentialScene("hyperpolarization");
    case "action-potential-recovery":
      return actionPotentialScene("recovery");
    case "action-potential-refractory":
      return actionPotentialScene("refractory");
    case "action-potential-sodium-channel":
      return actionPotentialScene("sodium-channel");
    case "action-potential-potassium-channel":
      return actionPotentialScene("potassium-channel");
    case "action-potential-gradients":
      return actionPotentialScene("gradients");
    case "action-potential-sodium-flux":
      return actionPotentialScene("sodium-flux");
    case "action-potential-potassium-flux":
      return actionPotentialScene("potassium-flux");
    case "action-potential-positive-feedback":
      return actionPotentialScene("positive-feedback");
  }
}
