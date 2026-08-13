import type { DnaSceneFamily, DnaStrandState } from "./biology-dna-representation-contract.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";

/** Frozen, renderer-independent semantic benchmark for the DNA visual grammar. */
export type DnaBenchmarkCase = {
  id: string;
  prompt: string;
  expected: {
    sceneFamily: DnaSceneFamily;
    scale: BiologySceneSpec["scale"];
    dnaState: DnaStrandState;
    importantEntities: string[];
    focus: string;
    supported: boolean;
  };
};

type Prompt = readonly [string, string, boolean?];

function cases(
  prefix: string,
  sceneFamily: DnaSceneFamily,
  scale: BiologySceneSpec["scale"],
  dnaState: DnaStrandState,
  importantEntities: string[],
  prompts: readonly Prompt[]
): DnaBenchmarkCase[] {
  return prompts.map(([prompt, focus, supported = true], index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    prompt,
    expected: { sceneFamily, scale, dnaState, importantEntities, focus, supported },
  }));
}

export const dnaFamilyBenchmarkVersion = "dna-family-v1";

export const dnaFamilyBenchmark: DnaBenchmarkCase[] = [
  ...cases("structure", "structure", "molecular", "double-stranded", ["dna"], [
    ["show a canonical B-DNA double helix", "whole helix"],
    ["visualize the major and minor grooves of DNA", "major/minor grooves"],
    ["display antiparallel DNA strands with 5-prime and 3-prime ends", "strand polarity"],
    ["show Watson-Crick base pairs in a DNA helix", "base pairing"],
    ["make a molecular model of double-stranded DNA", "whole molecule"],
    ["show the sugar-phosphate backbones of a DNA duplex", "backbones"],
    ["visualize one turn of right-handed B form DNA", "helix geometry"],
    ["show how adenine pairs with thymine in DNA", "AT base pair"],
    ["show how guanine pairs with cytosine in a DNA duplex", "GC base pair"],
    ["inspect the base-pair stacking inside DNA", "base stacking"],
    ["show a short DNA oligomer at nucleotide resolution", "nucleotide detail"],
    ["display the double helix rather than a replication diagram", "whole helix"],
    ["visualize the two grooves around the DNA helix", "major/minor grooves"],
    ["make DNA look cool", "ambiguous request", false],
    ["show a random nucleic acid thing", "ambiguous request", false],
  ]),
  ...cases("regulation", "sequence-regulation", "molecular", "double-stranded", ["dna", "promoter"], [
    ["show a promoter immediately upstream of a gene", "promoter-gene region"],
    ["visualize a transcription factor binding a DNA enhancer", "enhancer binding"],
    ["show a repressor bound to an operator sequence", "operator repression"],
    ["display a CpG island near a gene promoter", "CpG promoter"],
    ["show an enhancer looping to a promoter", "enhancer-promoter loop"],
    ["visualize a TATA box in a eukaryotic promoter", "TATA box"],
    ["show RNA polymerase recognizing a bacterial promoter", "promoter recognition"],
    ["compare coding and noncoding regulatory DNA around a gene", "regulatory region"],
    ["show a silencer element recruiting a repressor", "silencer repression"],
    ["display a response element occupied by a nuclear receptor", "response element"],
    ["show a transcription start site and its upstream promoter", "transcription start"],
    ["visualize an insulator boundary between an enhancer and promoter", "insulator boundary"],
    ["show methylated promoter DNA blocking transcription-factor binding", "epigenetic regulation"],
    ["show gene regulation with enhancers and mediator", "enhancer regulation"],
    ["show a gene doing regulation magic", "ambiguous request", false],
  ]),
  ...cases("replication", "replication", "complex", "locally-open", ["dna", "fork", "polymerase"], [
    ["show DNA replication at a replication fork", "full fork"],
    ["visualize helicase unwinding parental DNA", "fork opening"],
    ["show DNA polymerase extending the leading strand", "leading synthesis"],
    ["display discontinuous lagging-strand synthesis", "lagging synthesis"],
    ["show primase making an RNA primer at the fork", "primer synthesis"],
    ["visualize Okazaki fragments behind the fork", "Okazaki fragments"],
    ["show ligase sealing nicks between DNA fragments", "ligation"],
    ["show topoisomerase relieving supercoils ahead of helicase", "torsion relief"],
    ["show DNA synthesis only in the 5-prime to 3-prime direction", "synthesis polarity"],
    ["visualize a bacterial replisome copying both strands", "bacterial replisome"],
    ["show RPA coating exposed single-stranded DNA in human cells", "ssDNA stabilization"],
    ["show SSB proteins protecting bacterial single-stranded DNA", "ssDNA stabilization"],
    ["show the difference between leading and lagging strand synthesis", "leading/lagging comparison"],
    ["visualize DNA polymerase adding complementary nucleotides", "polymerase elongation"],
    ["show a daughter DNA strand growing from a primer", "daughter-strand extension"],
    ["show the enzyme that opens the replication fork", "helicase"],
    ["display replication fork progression over time", "fork progression"],
    ["show semiconservative duplication of a DNA molecule", "semiconservative replication"],
    ["show the replication helper", "ambiguous request", false],
    ["show a fork but do not say what it is", "ambiguous request", false],
  ]),
  ...cases("transcription", "transcription", "complex", "locally-open", ["dna", "rna-polymerase", "rna-transcript"], [
    ["show RNA polymerase transcribing a DNA template", "elongation"],
    ["visualize the transcription bubble around RNA polymerase", "transcription bubble"],
    ["show a nascent RNA emerging from RNA polymerase", "nascent transcript"],
    ["display RNA synthesis from a DNA template strand", "template reading"],
    ["show RNA polymerase binding a promoter to begin transcription", "initiation"],
    ["show coding and template DNA strands during transcription", "strand roles"],
    ["visualize 5-prime to 3-prime RNA chain growth", "RNA directionality"],
    ["show bacterial RNA polymerase starting at a promoter", "bacterial initiation"],
    ["display eukaryotic RNA polymerase II transcribing a gene", "Pol II elongation"],
    ["show RNA polymerase moving along DNA and extending RNA", "elongation"],
    ["visualize transcription terminating at a terminator", "termination"],
    ["show the local DNA opening used to make RNA, not a replication fork", "transcription bubble"],
    ["display a gene being copied into an RNA transcript", "gene transcription"],
    ["show ribosomes transcribing DNA", "biologically invalid", false],
    ["show RNA being made", "ambiguous request", false],
  ]),
  ...cases("repair", "damage-repair", "molecular", "double-stranded", ["dna", "repair-machinery", "damage"], [
    ["show base excision repair removing uracil from DNA", "base excision repair"],
    ["visualize nucleotide excision repair around a UV thymine dimer", "UV lesion repair"],
    ["show mismatch repair correcting a wrongly paired base", "mismatch repair"],
    ["display a double-strand break being repaired by homologous recombination", "homologous recombination"],
    ["show nonhomologous end joining at a DNA break", "end joining"],
    ["visualize a DNA glycosylase recognizing an oxidized base", "lesion recognition"],
    ["show AP endonuclease cutting at an abasic site", "abasic-site incision"],
    ["display photolyase repairing a thymine dimer", "photoreactivation"],
    ["show a stalled repair complex at a bulky DNA adduct", "bulky-adduct repair"],
    ["visualize repair polymerase filling a single-strand gap", "repair synthesis"],
    ["show ligase sealing a nick after DNA repair", "repair ligation"],
    ["display ATM signaling at a broken DNA double helix", "damage signaling"],
    ["show RAD51 filaments invading a homologous DNA template", "strand invasion"],
    ["show DNA repair", "unspecified repair mechanism"],
    ["show the DNA damage thing", "ambiguous request", false],
  ]),
  ...cases("packaging", "packaging", "complex", "double-stranded", ["dna", "histone"], [
    ["show DNA wrapped around a histone octamer", "nucleosome"],
    ["visualize a nucleosome core particle", "nucleosome core"],
    ["show linker DNA between adjacent nucleosomes", "beads on a string"],
    ["display histone H1 compacting nucleosomal DNA", "linker-histone compaction"],
    ["show chromatin folding into a loop domain", "chromatin loop"],
    ["visualize cohesin holding a DNA loop", "loop extrusion"],
    ["show condensin compacting a mitotic chromosome", "mitotic compaction"],
    ["display euchromatin as an open nucleosome array", "open chromatin"],
    ["show heterochromatin packing DNA densely", "condensed chromatin"],
    ["visualize DNA packaging from nucleosomes to a chromosome", "packaging hierarchy"],
  ]),
  ...cases("chemistry", "local-chemistry", "atomic", "double-stranded", ["dna", "base-pair"], [
    ["show the hydrogen bonds in an adenine-thymine base pair", "AT hydrogen bonds"],
    ["visualize the three hydrogen bonds of a guanine-cytosine pair", "GC hydrogen bonds"],
    ["display the phosphodiester bond linking two DNA nucleotides", "phosphodiester bond"],
    ["show a deoxyribose sugar attached to a DNA base", "nucleoside chemistry"],
    ["visualize a methyl group on 5-methylcytosine in DNA", "cytosine methylation"],
    ["show the local atoms of a thymine dimer lesion", "thymine-dimer chemistry"],
    ["display a DNA minor-groove drug bound to a base pair", "small-molecule binding"],
    ["show a protonated DNA base causing a mismatch", "tautomeric mismatch"],
    ["make DNA chemistry pretty", "ambiguous request", false],
    ["show an atom near DNA", "ambiguous request", false],
  ]),
];

if (dnaFamilyBenchmark.length !== 100) {
  throw new Error(`DNA family benchmark must contain 100 cases; found ${dnaFamilyBenchmark.length}.`);
}
