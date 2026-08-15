import type {
  DnaInteraction,
  DnaMechanismBenchmarkCase,
  DnaMechanismFamily,
  DnaMechanismPrimitive,
  DnaMechanismScale,
  DnaMolecularSelection,
} from "./dna-mechanism-contract.ts";

const basePrimitives: DnaMechanismPrimitive[] = ["bondingInteraction", "molecularAssembly"];
const chemistryPrimitives: DnaMechanismPrimitive[] = ["bondingInteraction", "molecularAssembly", "localConformationalChange"];
const orientationPrimitives: DnaMechanismPrimitive[] = ["polarityOrientation", "molecularAssembly"];

function selection(id: string, kind: DnaMolecularSelection["kind"], role?: DnaMolecularSelection["role"]): DnaMolecularSelection {
  return { id, kind, role, structuralAnchor: "existingDnaVisualSystem" };
}

function interaction(id: string, type: DnaInteraction["type"], participants: string[], role: DnaInteraction["role"] = "stabilization"): DnaInteraction {
  return { id, type, participants, role, state: "present", evidence: "explanatory" };
}

function makeCase(
  id: string,
  prompt: string,
  family: DnaMechanismFamily,
  focus: string,
  scale: DnaMechanismScale,
  requiredPrimitives: DnaMechanismPrimitive[],
  molecularSelections: DnaMolecularSelection[],
  interactions: DnaInteraction[],
  orientation: DnaMechanismBenchmarkCase["spec"]["orientation"],
  structuralState: DnaMechanismBenchmarkCase["spec"]["structuralState"],
  representation: DnaMechanismBenchmarkCase["spec"]["representation"],
  supportExpectation: DnaMechanismBenchmarkCase["supportExpectation"] = "grounded-or-explanatory",
  reaction = false,
): DnaMechanismBenchmarkCase {
  return {
    id,
    prompt,
    family,
    supportExpectation,
    spec: {
      family,
      focus,
      scale: { level: scale, locality: scale === "duplex" ? "regional" : "local" },
      requiredPrimitives,
      molecularSelections,
      participatingGroups: molecularSelections.map((item) => item.id),
      interactions,
      orientation,
      structuralState,
      annotations: [],
      representation,
      reaction: reaction ? {
        required: true,
        steps: [
          { id: "before", label: "initial molecular state", interactionStates: interactions.map(({ id }) => ({ id, state: "absent" as const })) },
          { id: "transition", label: "mechanism transition", interactionStates: interactions.map(({ id }) => ({ id, state: "forming" as const })) },
          { id: "after", label: "resulting molecular state", interactionStates: interactions.map(({ id }) => ({ id, state: "present" as const })) },
        ],
      } : { required: false, steps: [] },
      structuralSubstrate: "existingDnaVisualSystem",
    },
  };
}

const duplexOrientation = { strandDirections: ["5primeTo3prime", "3primeTo5prime"] as ["5primeTo3prime", "3primeTo5prime"], antiparallel: true, atomOrGroupAnchors: ["duplex-axis"] };
const localBasePair = [selection("adenine", "base", "pyrimidine"), selection("thymine", "base", "pyrimidine")];
const gcPair = [selection("guanine", "base", "purine"), selection("cytosine", "base", "pyrimidine")];
const duplexRepresentation = { backbone: "canonicalDna" as const, localResidueDetail: "residue" as const, basePairRungs: true, grooveReadability: true, strandSeparation: false, atomColorGrammar: false };
const chemistryRepresentation = { backbone: "canonicalDna" as const, localResidueDetail: "atomAndBond" as const, basePairRungs: true, grooveReadability: false, strandSeparation: false, atomColorGrammar: true };

const basePairing: DnaMechanismBenchmarkCase[] = [
  makeCase("pair-01", "show how guanine bonds with cytosine", "basePairing", "G–C complementary pairing", "basePair", [...basePrimitives, "stabilizationForces"], gcPair, [interaction("gc-hb", "hydrogenBond", ["guanine", "cytosine"], "basePair")], duplexOrientation, "pairedDuplex", chemistryRepresentation, "renderer-ready"),
  makeCase("pair-02", "why does adenine pair with thymine", "basePairing", "A–T complementary pairing", "basePair", [...basePrimitives, "stabilizationForces"], localBasePair, [interaction("at-hb", "hydrogenBond", ["adenine", "thymine"], "basePair")], duplexOrientation, "pairedDuplex", chemistryRepresentation),
  makeCase("pair-03", "show hydrogen bond donors and acceptors in G and C", "basePairing", "G–C donor and acceptor geometry", "localChemistry", [...basePrimitives, "stabilizationForces"], gcPair, [interaction("gc-donor-acceptor", "hydrogenBond", ["guanine", "cytosine"], "donorAcceptor")], duplexOrientation, "pairedDuplex", chemistryRepresentation),
  makeCase("pair-04", "why do purines pair with pyrimidines", "basePairing", "constant duplex width", "basePair", [...basePrimitives, "stabilizationForces"], [selection("purine", "base", "purine"), selection("pyrimidine", "base", "pyrimidine")], [interaction("pair-width", "noncovalent", ["purine", "pyrimidine"], "stabilization")], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("pair-05", "show complementary base pairing in DNA", "basePairing", "complementary bases", "basePair", [...basePrimitives], [...localBasePair], [interaction("complement", "hydrogenBond", ["adenine", "thymine"], "basePair")], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("pair-06", "what holds A and T together in DNA", "basePairing", "A–T hydrogen bonding", "basePair", [...basePrimitives, "stabilizationForces"], localBasePair, [interaction("at-hb", "hydrogenBond", ["adenine", "thymine"], "donorAcceptor")], duplexOrientation, "pairedDuplex", chemistryRepresentation),
  makeCase("pair-07", "compare A–T and G–C base pairs", "basePairing", "base-pair hydrogen-bond differences", "basePair", [...basePrimitives, "stabilizationForces"], [...localBasePair, ...gcPair], [interaction("at", "hydrogenBond", ["adenine", "thymine"], "basePair"), interaction("gc", "hydrogenBond", ["guanine", "cytosine"], "basePair")], duplexOrientation, "pairedDuplex", chemistryRepresentation),
  makeCase("pair-08", "where are hydrogen bonds located in a DNA base pair", "basePairing", "base-pair interface", "localChemistry", [...basePrimitives], gcPair, [interaction("interface", "hydrogenBond", ["guanine", "cytosine"], "basePair")], duplexOrientation, "pairedDuplex", chemistryRepresentation),
  makeCase("pair-09", "explain visually why DNA bases pair specifically", "basePairing", "specific complementary geometry", "basePair", [...basePrimitives, "stabilizationForces"], [...localBasePair, ...gcPair], [interaction("specificity", "hydrogenBond", ["adenine", "thymine"], "basePair")], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("pair-10", "show the purine–pyrimidine geometry of a base pair", "basePairing", "purine-pyrimidine fit", "basePair", [...basePrimitives], [selection("purine", "base", "purine"), selection("pyrimidine", "base", "pyrimidine")], [interaction("fit", "noncovalent", ["purine", "pyrimidine"], "basePair")], duplexOrientation, "pairedDuplex", duplexRepresentation),
];

const backbone: DnaMechanismBenchmarkCase[] = [
  makeCase("backbone-01", "show a phosphodiester bond in DNA", "backboneChemistry", "phosphodiester linkage", "localChemistry", [...chemistryPrimitives], [selection("phosphate", "phosphate"), selection("sugar-3", "deoxyribose", "threePrimeCarbon"), selection("sugar-5", "deoxyribose", "fivePrimeCarbon")], [interaction("pd", "phosphodiester", ["phosphate", "sugar-3", "sugar-5"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation, "renderer-ready", true),
  makeCase("backbone-02", "how are two DNA nucleotides connected", "backboneChemistry", "neighboring nucleotide connectivity", "nucleotide", [...chemistryPrimitives], [selection("nucleotide-a", "nucleotide", "neighbor"), selection("nucleotide-b", "nucleotide", "neighbor")], [interaction("neighbor-link", "phosphodiester", ["nucleotide-a", "nucleotide-b"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-03", "show the 3 prime and 5 prime carbons", "backboneChemistry", "sugar carbon anchors", "localChemistry", [...chemistryPrimitives], [selection("3-prime", "deoxyribose", "threePrimeCarbon"), selection("5-prime", "deoxyribose", "fivePrimeCarbon")], [interaction("carbon-framework", "covalent", ["3-prime", "5-prime"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-04", "why is the DNA backbone sugar phosphate", "backboneChemistry", "sugar-phosphate backbone", "strand", [...basePrimitives], [selection("sugar", "deoxyribose"), selection("phosphate", "phosphate"), selection("backbone", "backbone")], [interaction("sugar-phosphate", "phosphodiester", ["sugar", "phosphate"], "backboneLink")], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("backbone-05", "show phosphate sugar and base in one nucleotide", "backboneChemistry", "nucleotide components", "nucleotide", [...chemistryPrimitives], [selection("phosphate", "phosphate"), selection("sugar", "deoxyribose"), selection("base", "base")], [interaction("base-sugar", "covalent", ["base", "sugar"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-06", "where does the base attach to deoxyribose", "backboneChemistry", "base–sugar attachment", "localChemistry", [...chemistryPrimitives], [selection("base", "base"), selection("one-prime", "deoxyribose", "onePrimeCarbon")], [interaction("glycosidic", "covalent", ["base", "one-prime"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-07", "which bond links neighboring nucleotides", "backboneChemistry", "neighboring phosphodiester bond", "localChemistry", [...chemistryPrimitives], [selection("left", "nucleotide", "neighbor"), selection("right", "nucleotide", "neighbor")], [interaction("link", "phosphodiester", ["left", "right"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-08", "how does the phosphate connect two sugars", "backboneChemistry", "phosphate bridge", "localChemistry", [...chemistryPrimitives], [selection("phosphate", "phosphate"), selection("sugar-left", "deoxyribose"), selection("sugar-right", "deoxyribose")], [interaction("bridge", "phosphodiester", ["phosphate", "sugar-left", "sugar-right"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-09", "show the 1 prime carbon of a DNA nucleotide", "backboneChemistry", "1′ sugar carbon", "localChemistry", [...chemistryPrimitives], [selection("one-prime", "deoxyribose", "onePrimeCarbon"), selection("base", "base")], [interaction("attachment", "covalent", ["one-prime", "base"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("backbone-10", "explain visually how a DNA backbone is assembled", "backboneChemistry", "repeating nucleotide connectivity", "strand", [...basePrimitives], [selection("strand", "strand"), selection("nucleotides", "nucleotide", "neighbor")], [interaction("repeat", "phosphodiester", ["strand", "nucleotides"], "backboneLink")], duplexOrientation, "assembledNucleotide", duplexRepresentation),
];

const polarity: DnaMechanismBenchmarkCase[] = [
  makeCase("polarity-01", "why are DNA strands antiparallel", "polarityAntiparallel", "antiparallel duplex organization", "duplex", orientationPrimitives, [selection("strand-a", "strand", "template"), selection("strand-b", "strand", "complementary")], [], duplexOrientation, "pairedDuplex", duplexRepresentation, "renderer-ready"),
  makeCase("polarity-02", "show 5 prime to 3 prime direction on both strands", "polarityAntiparallel", "strand direction markers", "duplex", orientationPrimitives, [selection("strand-a", "strand", "template"), selection("strand-b", "strand", "complementary")], [], { ...duplexOrientation, fivePrime: "strand-a", threePrime: "strand-b" }, "pairedDuplex", duplexRepresentation),
  makeCase("polarity-03", "compare the directions of the two DNA strands", "polarityAntiparallel", "opposite strand direction", "duplex", orientationPrimitives, [selection("strand-a", "strand"), selection("strand-b", "strand")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("polarity-04", "where is the 5 prime end of a DNA strand", "polarityAntiparallel", "5′ endpoint", "strand", orientationPrimitives, [selection("five-prime", "strand", "fivePrimeEnd")], [], { strandDirections: ["5primeTo3prime"], fivePrime: "five-prime", antiparallel: false, atomOrGroupAnchors: ["five-prime"] }, "singleStrand", duplexRepresentation),
  makeCase("polarity-05", "where is the 3 prime end of a DNA strand", "polarityAntiparallel", "3′ endpoint", "strand", orientationPrimitives, [selection("three-prime", "strand", "threePrimeEnd")], [], { strandDirections: ["5primeTo3prime"], threePrime: "three-prime", antiparallel: false, atomOrGroupAnchors: ["three-prime"] }, "singleStrand", duplexRepresentation),
  makeCase("polarity-06", "show the opposite orientation of paired DNA strands", "polarityAntiparallel", "opposite orientations", "duplex", orientationPrimitives, [selection("template", "strand", "template"), selection("complement", "strand", "complementary")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("polarity-07", "how do 5 prime and 3 prime labels relate across DNA", "polarityAntiparallel", "paired end labels", "duplex", orientationPrimitives, [selection("ends", "duplex")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("polarity-08", "show DNA strand polarity", "polarityAntiparallel", "polarity axis", "strand", orientationPrimitives, [selection("strand", "strand")], [], { strandDirections: ["5primeTo3prime"], antiparallel: false, atomOrGroupAnchors: ["strand-axis"] }, "singleStrand", duplexRepresentation),
  makeCase("polarity-09", "which way does each DNA strand run", "polarityAntiparallel", "strand direction", "duplex", orientationPrimitives, [selection("strand-a", "strand"), selection("strand-b", "strand")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("polarity-10", "explain visually the antiparallel DNA arrangement", "polarityAntiparallel", "antiparallel arrangement", "duplex", orientationPrimitives, [selection("duplex", "duplex")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
];

const stabilization: DnaMechanismBenchmarkCase[] = [
  makeCase("stability-01", "show base stacking in DNA", "helixStabilization", "stacked bases", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("stacked-bases", "base")], [interaction("stacking", "baseStacking", ["stacked-bases"], "stacking")], duplexOrientation, "stackedDuplex", duplexRepresentation, "renderer-ready"),
  makeCase("stability-02", "what holds the DNA double helix together", "helixStabilization", "combined helix stabilization", "duplex", ["stabilizationForces", "bondingInteraction", "molecularAssembly"], [selection("duplex", "duplex"), selection("bases", "base"), selection("backbone", "backbone")], [interaction("stack", "baseStacking", ["bases"], "stacking"), interaction("hb", "hydrogenBond", ["bases"], "stabilization")], duplexOrientation, "stackedDuplex", duplexRepresentation),
  makeCase("stability-03", "show the major and minor grooves", "helixStabilization", "groove organization", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("major", "groove"), selection("minor", "groove"), selection("duplex", "duplex")], [], duplexOrientation, "pairedDuplex", { ...duplexRepresentation, grooveReadability: true }),
  makeCase("stability-04", "why are bases inside the DNA helix", "helixStabilization", "inward bases and outward backbone", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("bases", "base"), selection("backbone", "backbone")], [interaction("inside", "noncovalent", ["bases", "backbone"], "stabilization")], duplexOrientation, "stackedDuplex", duplexRepresentation),
  makeCase("stability-05", "how does DNA maintain a consistent width", "helixStabilization", "duplex width", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("duplex", "duplex"), selection("purines", "base", "purine"), selection("pyrimidines", "base", "pyrimidine")], [interaction("width", "noncovalent", ["purines", "pyrimidines"], "stabilization")], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("stability-06", "where do stacking forces act in DNA", "helixStabilization", "adjacent base stacking", "localChemistry", ["stabilizationForces", "bondingInteraction"], [selection("base-one", "base"), selection("base-two", "base")], [interaction("stack", "baseStacking", ["base-one", "base-two"], "stacking")], duplexOrientation, "stackedDuplex", chemistryRepresentation),
  makeCase("stability-07", "compare the major and minor grooves", "helixStabilization", "groove asymmetry", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("major", "groove"), selection("minor", "groove")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("stability-08", "show how the backbone faces outward", "helixStabilization", "backbone placement", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("backbone", "backbone"), selection("bases", "base")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
  makeCase("stability-09", "why does base stacking stabilize DNA", "helixStabilization", "stacking stabilization", "localChemistry", ["stabilizationForces", "bondingInteraction"], [selection("stacked", "base")], [interaction("stack", "baseStacking", ["stacked"], "stacking")], duplexOrientation, "stackedDuplex", chemistryRepresentation),
  makeCase("stability-10", "explain visually the organization of the DNA helix", "helixStabilization", "organized helix", "duplex", ["stabilizationForces", "molecularAssembly"], [selection("duplex", "duplex"), selection("grooves", "groove")], [], duplexOrientation, "pairedDuplex", duplexRepresentation),
];

const separation: DnaMechanismBenchmarkCase[] = [
  makeCase("separation-01", "what breaks when DNA strands separate", "strandSeparation", "local strand opening", "duplex", ["bondingInteraction", "localConformationalChange", "reactionStateProgression"], [selection("strand-a", "strand"), selection("strand-b", "strand"), selection("base-pairs", "base")], [interaction("hb", "hydrogenBond", ["strand-a", "strand-b"], "basePair")], duplexOrientation, "locallyOpen", { ...duplexRepresentation, strandSeparation: true }, "renderer-ready", true),
  makeCase("separation-02", "why does the DNA backbone remain intact when strands separate", "strandSeparation", "backbone-preserving separation", "duplex", ["bondingInteraction", "localConformationalChange"], [selection("backbone-a", "backbone"), selection("backbone-b", "backbone"), selection("base-pairs", "base")], [interaction("pd-a", "phosphodiester", ["backbone-a"], "backboneLink"), interaction("hb", "hydrogenBond", ["base-pairs"], "basePair")], duplexOrientation, "locallyOpen", { ...duplexRepresentation, strandSeparation: true }, "renderer-ready"),
  makeCase("separation-03", "show DNA strands reannealing", "strandSeparation", "complementary reannealing", "duplex", ["bondingInteraction", "localConformationalChange", "reactionStateProgression"], [selection("strand-a", "strand"), selection("strand-b", "strand")], [interaction("hb", "hydrogenBond", ["strand-a", "strand-b"], "basePair")], duplexOrientation, "reannealing", { ...duplexRepresentation, strandSeparation: true }, "renderer-ready", true),
  makeCase("separation-04", "how does a DNA bubble open", "strandSeparation", "bounded duplex opening", "duplex", ["bondingInteraction", "localConformationalChange"], [selection("duplex", "duplex"), selection("bubble", "base")], [interaction("hb", "hydrogenBond", ["bubble"], "basePair")], duplexOrientation, "locallyOpen", { ...duplexRepresentation, strandSeparation: true }),
  makeCase("separation-05", "which interactions are disrupted during strand separation", "strandSeparation", "disrupted base interactions", "localChemistry", ["bondingInteraction", "localConformationalChange"], [selection("bases", "base"), selection("backbone", "backbone")], [interaction("hb", "hydrogenBond", ["bases"], "basePair"), interaction("stack", "baseStacking", ["bases"], "stacking")], duplexOrientation, "separatedStrands", chemistryRepresentation),
  makeCase("separation-06", "show separated complementary DNA strands", "strandSeparation", "separated strands", "strand", ["localConformationalChange", "polarityOrientation"], [selection("strand-a", "strand"), selection("strand-b", "strand")], [], duplexOrientation, "separatedStrands", { ...duplexRepresentation, strandSeparation: true }),
  makeCase("separation-07", "why can separated DNA strands find their complements", "strandSeparation", "complementary recognition", "duplex", ["bondingInteraction", "localConformationalChange"], [selection("strand-a", "strand"), selection("strand-b", "strand")], [interaction("recognition", "hydrogenBond", ["strand-a", "strand-b"], "basePair")], duplexOrientation, "reannealing", duplexRepresentation),
  makeCase("separation-08", "compare intact and opened DNA", "strandSeparation", "paired versus locally open state", "duplex", ["localConformationalChange", "reactionStateProgression"], [selection("duplex", "duplex"), selection("bubble", "base")], [interaction("bubble-hb", "hydrogenBond", ["bubble"], "basePair")], duplexOrientation, "locallyOpen", { ...duplexRepresentation, strandSeparation: true }, "grounded-or-explanatory", true),
  makeCase("separation-09", "what remains connected during DNA melting", "strandSeparation", "preserved covalent backbone", "localChemistry", ["bondingInteraction", "localConformationalChange"], [selection("backbone", "backbone"), selection("base-pairs", "base")], [interaction("backbone", "phosphodiester", ["backbone"], "backboneLink"), interaction("broken-hb", "hydrogenBond", ["base-pairs"], "basePair")], duplexOrientation, "locallyOpen", chemistryRepresentation),
  makeCase("separation-10", "explain visually DNA opening and closing", "strandSeparation", "reversible local opening", "duplex", ["localConformationalChange", "reactionStateProgression", "bondingInteraction"], [selection("duplex", "duplex"), selection("bubble", "base")], [interaction("hb", "hydrogenBond", ["bubble"], "basePair")], duplexOrientation, "reannealing", { ...duplexRepresentation, strandSeparation: true }, "grounded-or-explanatory", true),
];

const assembly: DnaMechanismBenchmarkCase[] = [
  makeCase("assembly-01", "show one nucleotide joining another nucleotide", "nucleotideAssembly", "nucleotide addition", "nucleotide", [...chemistryPrimitives, "reactionStateProgression"], [selection("incoming", "nucleotide"), selection("strand-end", "strand", "threePrimeEnd")], [interaction("addition", "phosphodiester", ["incoming", "strand-end"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation, "renderer-ready", true),
  makeCase("assembly-02", "show how a nucleotide is organized from phosphate sugar and base", "nucleotideAssembly", "nucleotide component assembly", "nucleotide", [...chemistryPrimitives], [selection("phosphate", "phosphate"), selection("sugar", "deoxyribose"), selection("base", "base")], [interaction("base-attachment", "covalent", ["sugar", "base"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation, "renderer-ready"),
  makeCase("assembly-03", "how is a new nucleotide added to a DNA strand", "nucleotideAssembly", "strand extension", "nucleotide", [...chemistryPrimitives, "reactionStateProgression"], [selection("incoming", "nucleotide"), selection("strand", "strand", "threePrimeEnd")], [interaction("extension", "phosphodiester", ["incoming", "strand"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation, "grounded-or-explanatory", true),
  makeCase("assembly-04", "show complementary nucleotides pairing during assembly", "nucleotideAssembly", "pairing during assembly", "basePair", [...basePrimitives, "reactionStateProgression"], [...localBasePair], [interaction("pair", "hydrogenBond", ["adenine", "thymine"], "basePair")], duplexOrientation, "pairedDuplex", chemistryRepresentation, "grounded-or-explanatory", true),
  makeCase("assembly-05", "where does a nucleotide connect to the growing strand", "nucleotideAssembly", "growing strand 3′ end", "localChemistry", [...chemistryPrimitives], [selection("incoming", "nucleotide"), selection("three-prime", "strand", "threePrimeEnd")], [interaction("join", "phosphodiester", ["incoming", "three-prime"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("assembly-06", "what bond forms when DNA is extended", "nucleotideAssembly", "new phosphodiester linkage", "localChemistry", [...chemistryPrimitives, "reactionStateProgression"], [selection("incoming", "nucleotide"), selection("strand-end", "backbone")], [interaction("new-link", "phosphodiester", ["incoming", "strand-end"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation, "grounded-or-explanatory", true),
  makeCase("assembly-07", "compare a free nucleotide with a nucleotide in a strand", "nucleotideAssembly", "free versus connected nucleotide", "nucleotide", [...chemistryPrimitives], [selection("free", "nucleotide"), selection("connected", "nucleotide", "neighbor")], [interaction("connectivity", "phosphodiester", ["free", "connected"], "backboneLink")], duplexOrientation, "assembledNucleotide", chemistryRepresentation),
  makeCase("assembly-08", "show adjacent nucleotide connectivity in DNA", "nucleotideAssembly", "adjacent backbone units", "strand", [...basePrimitives], [selection("left", "nucleotide", "neighbor"), selection("right", "nucleotide", "neighbor")], [interaction("adjacency", "phosphodiester", ["left", "right"], "backboneLink")], duplexOrientation, "assembledNucleotide", duplexRepresentation),
  makeCase("assembly-09", "how does a complementary base become part of DNA", "nucleotideAssembly", "complementary base incorporation", "basePair", [...chemistryPrimitives, "reactionStateProgression"], [selection("base", "base"), selection("nucleotide", "nucleotide")], [interaction("incorporation", "hydrogenBond", ["base", "nucleotide"], "basePair")], duplexOrientation, "pairedDuplex", chemistryRepresentation, "grounded-or-explanatory", true),
  makeCase("assembly-10", "explain visually how nucleotides build a DNA strand", "nucleotideAssembly", "iterated nucleotide assembly", "strand", [...chemistryPrimitives, "reactionStateProgression"], [selection("strand", "strand"), selection("nucleotides", "nucleotide", "neighbor")], [interaction("repeat", "phosphodiester", ["strand", "nucleotides"], "backboneLink")], duplexOrientation, "assembledNucleotide", duplexRepresentation, "grounded-or-explanatory", true),
];

export const dnaMechanismBenchmark: DnaMechanismBenchmarkCase[] = [
  ...basePairing,
  ...backbone,
  ...polarity,
  ...stabilization,
  ...separation,
  ...assembly,
];

if (dnaMechanismBenchmark.length !== 60) {
  throw new Error(`DNA mechanism benchmark must contain 60 cases; found ${dnaMechanismBenchmark.length}.`);
}
