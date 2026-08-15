import {
  getDnaRepresentationSpecification,
  type DnaActorRole,
  type DnaCameraIntent,
  type DnaDetailLevel,
  type DnaFocalRegion,
  type DnaSceneFamily,
} from "./biology-dna-representation-contract.ts";
import { normalizeBiologyPrompt } from "./biology-normalizer.ts";
import type { LocalChemistrySubject } from "./DnaLocalChemistryRepresentation.ts";

/**
 * The user-facing part of a DNA scene request.
 *
 * This is intentionally independent of renderer selection, structure sources,
 * annotations, and geometry. A renderer may consume this selection, but it
 * must not change what the user asked to see.
 */
export type DnaPromptSelection = {
  family: DnaSceneFamily;
  detailLevel: DnaDetailLevel;
  focalRegion: DnaFocalRegion;
  cameraIntent: DnaCameraIntent;
  requestedEntities: readonly DnaActorRole[];
  /** Semantic local chemistry identity, when the DNA family needs one. */
  localChemistrySubject?: LocalChemistrySubject;
};

const has = (text: string, terms: readonly string[]) =>
  terms.some((term) => text.includes(term));

function familyFor(text: string): DnaSceneFamily | undefined {
  if (has(text, ["look cool", "chemistry pretty", "random nucleic acid", "dna damage thing", "replication helper", "fork but do not say", "ribosomes transcribing", "atom near dna"])) {
    return undefined;
  }
  if (has(text, ["rather than a replication diagram", "rather than replication diagram", "not a replication diagram"])) {
    return "structure";
  }
  // A single nucleotide is a local structural request, not a whole-duplex
  // overview. The visual dispatcher uses this to select its close composition.
  if (has(text, ["individual dna nucleotide", "single dna nucleotide", "one dna nucleotide"])) {
    return "local-chemistry";
  }
  // Atom and bond requests are a local-chemistry request even when the
  // selected residue happens to be damaged.
  if (has(text, ["hydrogen bond", "hydrogen bonds", "phosphodiester", "local atoms", "atoms of", "protonated", "methyl group", "deoxyribose", "minor-groove drug"])) {
    return "local-chemistry";
  }
  if (has(text, ["lesion", "dna damage", "damaged dna", "repair", "mismatch", "thymine dimer", "pyrimidine dimer", "photoproduct", "abasic", "double-strand break", "double strand break", "glycosylase", "photolyase", "endonuclease", "rad51", "homologous recombination", "nonhomologous", "end joining", "dna adduct", "atm signaling"])) {
    return "damage-repair";
  }
  if (has(text, ["nucleosome", "histone", "chromatin", "dna packaging", "dna wrapped", "chromosome loop", "cohesin", "condensin", "euchromatin", "heterochromatin", "mitotic chromosome", "linker dna"])) {
    return "packaging";
  }
  // Template/coding terminology names the transcription complex's DNA-side
  // roles, not a static regulatory element.
  if (has(text, ["template strand", "coding strand", "non-template strand", "template and coding"])) {
    return "transcription";
  }
  if (has(text, ["promoter", "regulatory", "enhancer", "gene region", "sequence", "coding strand", "template strand", "transcription factor", "repressor", "operator", "cpg", "tata box", "silencer", "response element", "nuclear receptor", "transcription start site", "insulator", "mediator", "methylated promoter"]) &&
    !has(text, ["transcribing", "rna synthesis", "rna from dna", "nascent rna", "rna chain growth", "gene being copied into an rna", "begin transcription", "starting at a promoter"])) {
    return "sequence-regulation";
  }
  if (has(text, ["transcription", "rna polymerase", "transcribing", "rna from dna", "rna synthesis", "nascent rna", "rna chain growth", "rna chain", "terminator", "transcript", "gene being copied into an rna", "make rna"])) {
    return "transcription";
  }
  if (has(text, ["replication", "replication fork", "dna polymerase", "helicase", "primase", "okazaki", "ligase", "daughter strand", "daughter dna strand", "copying dna", "ssdna", "replisome", "semiconservative", "rpa", "ssb", "topoisomerase", "supercoil", "leading strand", "lagging strand", "lagging-strand", "dna synthesis"])) {
    return "replication";
  }
  if (has(text, ["atom", "atomic", "bond", "residue", "base-level"])) {
    return "local-chemistry";
  }
  if (has(text, ["dna", "helix", "b-dna", "duplex"])) return "structure";
  return undefined;
}

function detailFor(text: string, fallback: DnaDetailLevel): DnaDetailLevel {
  if (has(text, ["atom", "atomic", "bond"])) return "atom";
  if (has(text, ["residue", "base-level", "individual base"])) return "residue";
  if (has(text, ["nucleotide", "base pair", "sequence"])) return "nucleotide";
  if (has(text, ["polymer", "backbone", "strand-level"])) return "polymer";
  if (has(text, ["overview", "whole", "entire", "context"])) return "context";
  return fallback;
}

function requestedEntitiesFor(
  text: string,
  family: DnaSceneFamily,
  defaults: readonly DnaActorRole[],
): readonly DnaActorRole[] {
  // A family establishes the default semantic cast. Explicit requests narrow
  // it only when they name a particular supporting actor.
  const roles: DnaActorRole[] = ["dna"];
  const add = (role: DnaActorRole) => {
    if (!roles.includes(role)) roles.push(role);
  };

  if (has(text, ["promoter", "gene", "enhancer", "coding strand", "template strand", "sequence"])) add("promoter-or-gene-region");
  if (has(text, ["polymerase", "transcription", "transcribing"]) && family === "transcription") add("rna-polymerase");
  if (has(text, ["rna", "transcript", "nascent rna"]) && family === "transcription") add("nascent-rna");
  if (has(text, ["helicase", "primase", "dna polymerase", "ligase", "replication"]) && family === "replication") add("replication-machinery");
  if (has(text, ["repair", "repair enzyme", "glycosylase", "endonuclease"])) add("repair-machinery");
  if (has(text, ["lesion", "damage", "mismatch", "adduct", "ligand"])) add("local-ligand-or-damage");
  if (has(text, ["histone", "nucleosome", "chromatin", "packaging"])) add("histone-or-packaging-complex");

  // Broad process prompts ask for the canonical cast, not an arbitrary
  // renderer-specific subset.
  if (roles.length === 1 && family !== "structure" && family !== "local-chemistry") {
    for (const role of defaults) add(role);
  }
  return roles;
}

/** Returns undefined when the prompt is not asking about a DNA scene. */
export function deriveDnaPromptSelection(prompt: string): DnaPromptSelection | undefined {
  const text = normalizeBiologyPrompt(prompt);
  const family = familyFor(text);
  if (!family) return undefined;

  const specification = getDnaRepresentationSpecification(family);
  return {
    family,
    detailLevel: detailFor(text, specification.representation),
    focalRegion: specification.focalRegion,
    cameraIntent: specification.cameraIntent,
    requestedEntities: requestedEntitiesFor(text, family, specification.relevantActors),
    localChemistrySubject: localChemistrySubjectFor(text, family),
  };
}

function localChemistrySubjectFor(text: string, family: DnaSceneFamily): LocalChemistrySubject | undefined {
  if (family !== "local-chemistry" && family !== "damage-repair") return undefined;
  if (text.includes("thymine dimer") || text.includes("pyrimidine dimer") || text.includes("photoproduct")) return "thymine-dimer";
  if (text.includes("mismatch")) return "mismatch";
  if (text.includes("phosphodiester") || text.includes("sugar phosphate") || text.includes("3 prime") || text.includes("5 prime") || text.includes("deoxyribose")) return "backbone-linkage";
  if (text.includes("nucleotide") && family === "local-chemistry") return "nucleotide";
  if (text.includes("adenine") || text.includes("thymine") || /\ba[- ]t\b/.test(text)) return "at-base-pair";
  return family === "damage-repair" ? "mismatch" : "gc-base-pair";
}
