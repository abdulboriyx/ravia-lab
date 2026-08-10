import {
  BiologySceneSpecSchema,
  type BiologySceneSpec,
} from "./biology-scene-spec.ts";
import type { BiologyContext } from "./biology-context.ts";

type SynthesisFocus =
  | "polymerase"
  | "leading-strand"
  | "lagging-strand"
  | "okazaki-fragment"
  | "ligase"
  | "directionality"
  | "leading-lagging-comparison";

export type TranscriptionFocus =
  | "rna-polymerase"
  | "gene"
  | "promoter"
  | "template-coding-strands"
  | "transcription"
  | "initiation"
  | "bubble"
  | "rna-transcript"
  | "directionality"
  | "termination";

export type TranslationFocus =
  | "ribosome"
  | "charged-trna"
  | "codon-anticodon"
  | "initiation"
  | "elongation"
  | "peptide-bond"
  | "translocation"
  | "directionality"
  | "termination";

export type SignalingFocus =
  | "membrane-receptor"
  | "ligand-binding"
  | "dimerization"
  | "rtk-activation"
  | "phosphorylation"
  | "adaptor-recruitment"
  | "ras-activation"
  | "mapk-cascade"
  | "signal-to-nucleus";

export function dnaStructureScene(): BiologySceneSpec {
  return BiologySceneSpecSchema.parse({
    intent: "structure",
    scale: "molecular",
    entities: [{ id: "dna", name: "DNA", type: "dna" }],
    relations: [],
    actions: [],
    renderMode: "molecular-structure",
  });
}

export function helicaseMechanismScene(): BiologySceneSpec {
  return BiologySceneSpecSchema.parse({
    intent: "mechanism",
    scale: "complex",
    entities: [
      { id: "dna", name: "DNA", type: "dna" },
      { id: "helicase", name: "Helicase", type: "protein" },
    ],
    relations: [],
    actions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    renderMode: "mechanistic-3d",
  });
}

export function strandStabilizationScene(
  context: BiologyContext
): BiologySceneSpec {
  const stabilizer =
    context.organism === "bacterial"
      ? {
          id: "ssb",
          name: "Single-strand binding protein",
          type: "protein" as const,
        }
      : context.organism === "eukaryotic"
      ? {
          id: "rpa",
          name: "Replication Protein A",
          type: "protein" as const,
        }
      : {
          id: "ssdna-binding-protein",
          name: "ssDNA-binding protein",
          type: "protein" as const,
        };

  return BiologySceneSpecSchema.parse({
    intent: "relation",
    scale: "complex",
    entities: [{ id: "dna", name: "single-stranded DNA", type: "dna" }, stabilizer],
    relations: [
      { subject: stabilizer.id, relation: "stabilizes", object: "dna" },
    ],
    actions: [],
    renderMode: "mechanistic-3d",
  });
}

export function topoisomeraseAheadOfHelicaseScene(): BiologySceneSpec {
  return BiologySceneSpecSchema.parse({
    intent: "relation",
    scale: "complex",
    entities: [
      { id: "dna", name: "DNA", type: "dna" },
      { id: "topoisomerase", name: "Topoisomerase", type: "protein" },
      { id: "helicase", name: "Helicase", type: "protein" },
    ],
    relations: [
      {
        subject: "topoisomerase",
        relation: "acts_ahead_of",
        object: "helicase",
      },
    ],
    actions: [{ actor: "helicase", action: "unwinds", target: "dna" }],
    renderMode: "mechanistic-3d",
  });
}

export function primasePrimerScene(): BiologySceneSpec {
  return BiologySceneSpecSchema.parse({
    intent: "mechanism",
    scale: "complex",
    entities: [
      { id: "dna", name: "DNA", type: "dna" },
      { id: "primase", name: "Primase", type: "protein" },
      { id: "rna-primer", name: "RNA primer", type: "rna" },
    ],
    relations: [
      { subject: "primase", relation: "binds_to", object: "dna" },
      { subject: "rna-primer", relation: "attached_to", object: "dna" },
    ],
    actions: [{ actor: "primase", action: "synthesizes", target: "rna-primer" }],
    renderMode: "mechanistic-3d",
  });
}

export function dnaReplicationSynthesisScene(
  focus: SynthesisFocus
): BiologySceneSpec {
  const entities: BiologySceneSpec["entities"] = [
    { id: "dna", name: "DNA replication fork", type: "dna" },
    { id: "fork", name: "replication fork", type: "complex" },
    { id: "polymerase", name: "DNA polymerase", type: "protein" },
    { id: "leading-template", name: "leading-strand template", type: "dna" },
    { id: "lagging-template", name: "lagging-strand template", type: "dna" },
    { id: "daughter-leading-strand", name: "growing leading daughter strand", type: "dna" },
    { id: "daughter-lagging-strand", name: "growing lagging daughter strand", type: "dna" },
    { id: "rna-primer-leading", name: "leading-strand RNA primer", type: "rna" },
    { id: "rna-primer-lagging", name: "lagging-strand RNA primers", type: "rna" },
    { id: "okazaki-fragment", name: "Okazaki fragment", type: "dna" },
  ];

  if (focus === "ligase") {
    entities.push({ id: "ligase", name: "DNA ligase", type: "protein" });
  }

  if (focus === "directionality") {
    entities.push(
      { id: "template-5-prime", name: "5 prime template end", type: "other" },
      { id: "template-3-prime", name: "3 prime template end", type: "other" },
      { id: "5-to-3", name: "5 prime to 3 prime synthesis direction", type: "other" }
    );
  }

  return BiologySceneSpecSchema.parse({
    intent: "mechanism",
    scale: "complex",
    entities,
    relations: [
      { subject: "polymerase", relation: "binds_to", object: "dna" },
      { subject: "daughter-leading-strand", relation: "extends_from", object: "rna-primer-leading" },
      { subject: "daughter-lagging-strand", relation: "extends_from", object: "rna-primer-lagging" },
      { subject: "rna-primer-leading", relation: "placed_on", object: "leading-template" },
      { subject: "rna-primer-lagging", relation: "placed_on", object: "lagging-template" },
      { subject: "okazaki-fragment", relation: "part_of", object: "daughter-lagging-strand" },
      ...(focus === "leading-strand" || focus === "leading-lagging-comparison"
        ? [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }]
        : []),
      ...(focus === "lagging-strand" ||
      focus === "okazaki-fragment" ||
      focus === "ligase" ||
      focus === "leading-lagging-comparison"
        ? [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }]
        : []),
      ...(focus === "ligase"
        ? [{ subject: "ligase", relation: "joins", object: "okazaki-fragment" }]
        : []),
      ...(focus === "directionality"
        ? [
            { subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" },
            { subject: "daughter-lagging-strand", relation: "direction", object: "5-to-3" },
          ]
        : []),
    ],
    actions: [
      { actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" },
      { actor: "polymerase", action: "synthesizes", target: "daughter-lagging-strand" },
      ...(focus === "ligase"
        ? [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }]
        : []),
    ],
    renderMode: "mechanistic-3d",
  });
}

function transcriptionPolymeraseEntity(context: BiologyContext) {
  if (context.organism === "bacterial") {
    return {
      id: "bacterial-rna-polymerase",
      name: "bacterial RNA polymerase",
      type: "protein" as const,
    };
  }

  if (context.organism === "eukaryotic") {
    return {
      id: "rna-polymerase-ii",
      name: "RNA polymerase II",
      type: "protein" as const,
    };
  }

  return {
    id: "rna-polymerase",
    name: "RNA polymerase",
    type: "protein" as const,
  };
}

export function transcriptionScene(
  focus: TranscriptionFocus,
  context: BiologyContext
): BiologySceneSpec {
  const polymerase = transcriptionPolymeraseEntity(context);
  if (focus === "rna-polymerase") {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [polymerase],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  const entities: BiologySceneSpec["entities"] = [];

  const addEntity = (entity: BiologySceneSpec["entities"][number]) => {
    if (!entities.some((candidate) => candidate.id === entity.id)) {
      entities.push(entity);
    }
  };

  const includeDna = true;
  const includeGene = [
    "gene",
    "transcription",
    "initiation",
    "bubble",
    "rna-transcript",
    "directionality",
    "termination",
  ].includes(focus);
  const includePromoter = [
    "promoter",
    "transcription",
    "initiation",
    "bubble",
    "rna-transcript",
    "directionality",
    "termination",
  ].includes(focus);
  const includePolymerase = !["gene", "promoter", "template-coding-strands"].includes(focus);
  const includeBubble = [
    "transcription",
    "bubble",
    "rna-transcript",
    "directionality",
    "termination",
  ].includes(focus);
  const includeTranscript = [
    "transcription",
    "rna-transcript",
    "directionality",
    "termination",
  ].includes(focus);
  const includeStrands = [
    "template-coding-strands",
    "transcription",
    "bubble",
    "rna-transcript",
    "directionality",
  ].includes(focus);

  if (includeDna) {
    addEntity({ id: "dna", name: "DNA", type: "dna" });
  }

  if (includeGene) {
    addEntity({ id: "gene", name: "gene", type: "dna" });
  }

  if (includePromoter) {
    addEntity({ id: "promoter", name: "promoter", type: "dna" });
  }

  if (includeStrands) {
    addEntity({ id: "template-strand", name: "template strand", type: "dna" });
    addEntity({ id: "coding-strand", name: "coding strand", type: "dna" });
  }

  if (includePolymerase) {
    addEntity(polymerase);
  }

  if (context.organism === "bacterial" && (focus === "initiation" || focus === "promoter")) {
    addEntity({ id: "sigma-factor", name: "sigma factor", type: "protein" });
    if (!includePolymerase) {
      addEntity(polymerase);
    }
  }

  if (includeBubble) {
    addEntity({
      id: "transcription-bubble",
      name: "transcription bubble",
      type: "complex",
    });
  }

  if (includeTranscript) {
    addEntity({ id: "rna-transcript", name: "RNA transcript", type: "rna" });
  }

  if (focus === "directionality") {
    addEntity({ id: "rna-5-prime", name: "RNA 5 prime end", type: "other" });
    addEntity({ id: "rna-3-prime", name: "RNA 3 prime growing end", type: "other" });
    addEntity({ id: "template-3-prime", name: "template 3 prime read end", type: "other" });
    addEntity({ id: "template-5-prime", name: "template 5 prime read end", type: "other" });
    addEntity({ id: "5-to-3", name: "5 prime to 3 prime RNA synthesis", type: "other" });
    addEntity({ id: "3-to-5", name: "3 prime to 5 prime template reading", type: "other" });
  }

  if (focus === "termination") {
    addEntity({ id: "terminator", name: "terminator", type: "dna" });
  }

  const relations: BiologySceneSpec["relations"] = [];
  const addRelation = (subject: string, relation: string, object: string) => {
    if (
      entities.some((entity) => entity.id === subject) &&
      entities.some((entity) => entity.id === object)
    ) {
      relations.push({ subject, relation, object });
    }
  };

  addRelation("gene", "located_on", "dna");
  addRelation("promoter", "located_on", "dna");
  addRelation("template-strand", "part_of", "dna");
  addRelation("coding-strand", "part_of", "dna");
  addRelation("transcription-bubble", "located_on", "dna");
  addRelation(polymerase.id, "binds_to", "promoter");
  addRelation(polymerase.id, "positioned_at", "transcription-bubble");
  addRelation("rna-transcript", "extends_from", polymerase.id);
  addRelation("rna-transcript", "complementary_to", "template-strand");
  addRelation("terminator", "located_on", "dna");
  addRelation("sigma-factor", "associated_with", "bacterial-rna-polymerase");

  if (focus === "directionality") {
    addRelation("rna-transcript", "direction", "5-to-3");
    addRelation(polymerase.id, "reads_direction", "3-to-5");
    addRelation("coding-strand", "sequence_corresponds_to", "rna-transcript");
  }

  const actions: BiologySceneSpec["actions"] = [];
  const addAction = (actor: string, action: string, target?: string) => {
    if (
      entities.some((entity) => entity.id === actor) &&
      (!target || entities.some((entity) => entity.id === target))
    ) {
      actions.push({ actor, action, target });
    }
  };

  addAction(polymerase.id, "binds", "promoter");
  addAction(polymerase.id, "locally_unwinds", "dna");
  addAction(polymerase.id, "synthesizes", "rna-transcript");
  addAction(polymerase.id, "moves_along", "template-strand");
  if (focus === "termination") {
    addAction(polymerase.id, "terminates", "rna-transcript");
  }

  return BiologySceneSpecSchema.parse({
    intent:
      focus === "gene" ||
      focus === "promoter" ||
      focus === "template-coding-strands"
        ? "relation"
        : "mechanism",
    scale: "complex",
    entities,
    relations,
    actions,
    renderMode: "mechanistic-3d",
  });
}

function ribosomeEntity(context: BiologyContext) {
  if (context.organism === "bacterial") {
    return { id: "ribosome", name: "bacterial 70S ribosome", type: "complex" as const };
  }

  if (context.organism === "eukaryotic") {
    return { id: "ribosome", name: "eukaryotic 80S ribosome", type: "complex" as const };
  }

  return { id: "ribosome", name: "ribosome", type: "complex" as const };
}

export function translationScene(
  focus: TranslationFocus,
  context: BiologyContext
): BiologySceneSpec {
  if (focus === "ribosome") {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "complex",
      entities: [ribosomeEntity(context)],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  const entities: BiologySceneSpec["entities"] = [];
  const addEntity = (entity: BiologySceneSpec["entities"][number]) => {
    if (!entities.some((candidate) => candidate.id === entity.id)) {
      entities.push(entity);
    }
  };

  const includeRibosome = focus !== "charged-trna" && focus !== "codon-anticodon";
  const includeMrna = focus !== "charged-trna";
  const includeSites = ["charged-trna", "initiation", "elongation", "peptide-bond", "translocation", "directionality", "termination"].includes(focus);
  const includeSubunits = ["initiation", "elongation", "peptide-bond", "translocation", "directionality", "termination"].includes(focus);
  const includeTrna = ["charged-trna", "codon-anticodon", "initiation", "elongation", "peptide-bond", "translocation"].includes(focus);
  const includeAminoAcid = ["charged-trna", "elongation", "peptide-bond"].includes(focus);
  const includePolypeptide = ["elongation", "peptide-bond", "translocation", "directionality", "termination"].includes(focus);

  if (includeMrna) addEntity({ id: "mrna", name: "mRNA", type: "rna" });
  if (includeRibosome) addEntity(ribosomeEntity(context));
  if (includeSubunits) {
    addEntity({ id: "small-ribosomal-subunit", name: "small ribosomal subunit", type: "complex" });
    addEntity({ id: "large-ribosomal-subunit", name: "large ribosomal subunit", type: "complex" });
  }
  if (includeSites) {
    addEntity({ id: "a-site", name: "A site", type: "other" });
    addEntity({ id: "p-site", name: "P site", type: "other" });
    addEntity({ id: "e-site", name: "E site", type: "other" });
  }

  if (focus === "initiation") {
    addEntity({ id: "start-codon", name: "start codon", type: "rna" });
    addEntity({ id: "initiator-trna", name: "initiator tRNA", type: "rna" });
  }

  if (includeTrna) {
    addEntity({ id: "trna", name: "tRNA", type: "rna" });
    addEntity({ id: "anticodon", name: "anticodon", type: "rna" });
  }

  if (focus === "codon-anticodon") {
    addEntity({ id: "codon", name: "mRNA codon", type: "rna" });
  }

  if (includeAminoAcid) {
    addEntity({ id: "amino-acid", name: "amino acid", type: "other" });
    addEntity({ id: "aminoacyl-trna", name: "aminoacyl-tRNA", type: "complex" });
  }

  if (includePolypeptide) {
    addEntity({ id: "polypeptide", name: "growing polypeptide", type: "protein" });
  }

  if (focus === "directionality") {
    addEntity({ id: "mrna-5-prime", name: "mRNA 5 prime end", type: "other" });
    addEntity({ id: "mrna-3-prime", name: "mRNA 3 prime end", type: "other" });
    addEntity({ id: "n-terminus", name: "protein N-terminus", type: "other" });
    addEntity({ id: "c-terminus", name: "protein C-terminus", type: "other" });
    addEntity({ id: "5-to-3", name: "5 prime to 3 prime mRNA reading", type: "other" });
    addEntity({ id: "n-to-c", name: "N to C protein synthesis", type: "other" });
  }

  if (focus === "termination") {
    addEntity({ id: "stop-codon", name: "stop codon", type: "rna" });
    addEntity({ id: "release-factor", name: "release factor", type: "protein" });
  }

  const relations: BiologySceneSpec["relations"] = [];
  const addRelation = (subject: string, relation: string, object: string) => {
    if (
      entities.some((entity) => entity.id === subject) &&
      entities.some((entity) => entity.id === object)
    ) {
      relations.push({ subject, relation, object });
    }
  };

  addRelation("ribosome", "binds_to", "mrna");
  addRelation("small-ribosomal-subunit", "part_of", "ribosome");
  addRelation("large-ribosomal-subunit", "part_of", "ribosome");
  addRelation("a-site", "part_of", "ribosome");
  addRelation("p-site", "part_of", "ribosome");
  addRelation("e-site", "part_of", "ribosome");
  addRelation("codon", "located_on", "mrna");
  addRelation("start-codon", "located_on", "mrna");
  addRelation("stop-codon", "located_on", "mrna");
  addRelation("anticodon", "part_of", "trna");
  addRelation("anticodon", "complementary_to", "codon");
  addRelation("trna", "paired_with", "codon");
  addRelation("amino-acid", "attached_to", "trna");
  addRelation("aminoacyl-trna", "positioned_at", "a-site");
  addRelation("trna", "positioned_at", "p-site");
  addRelation("initiator-trna", "positioned_at", "p-site");
  addRelation("initiator-trna", "paired_with", "start-codon");
  addRelation("polypeptide", "attached_to", "trna");
  addRelation("polypeptide", "extends_from", "ribosome");
  addRelation("release-factor", "binds_to", "stop-codon");
  addRelation("stop-codon", "positioned_at", "a-site");

  if (focus === "directionality") {
    addRelation("ribosome", "reads_direction", "5-to-3");
    addRelation("polypeptide", "direction", "n-to-c");
  }

  const actions: BiologySceneSpec["actions"] = [];
  const addAction = (actor: string, action: string, target?: string) => {
    if (
      entities.some((entity) => entity.id === actor) &&
      (!target || entities.some((entity) => entity.id === target))
    ) {
      actions.push({ actor, action, target });
    }
  };

  addAction("ribosome", "binds", "mrna");
  addAction("trna", "recognizes", "codon");
  addAction("aminoacyl-trna", "enters", "a-site");
  addAction("ribosome", "synthesizes", "polypeptide");
  addAction("ribosome", "translocates", "mrna");
  addAction("polypeptide", "elongates");
  if (focus === "peptide-bond") {
    addAction("ribosome", "forms_peptide_bond", "polypeptide");
    addRelation("polypeptide", "transferred_to", "aminoacyl-trna");
  }
  if (focus === "translocation") {
    addAction("trna", "moves_through", "a-site");
    addAction("ribosome", "advances_one_codon", "mrna");
  }
  if (focus === "termination") {
    addAction("release-factor", "terminates", "polypeptide");
    addAction("polypeptide", "releases", "ribosome");
  }

  return BiologySceneSpecSchema.parse({
    intent: focus === "charged-trna" || focus === "codon-anticodon" ? "relation" : "mechanism",
    scale: "complex",
    entities,
    relations,
    actions,
    renderMode: "mechanistic-3d",
  });
}

export function signalingScene(focus: SignalingFocus): BiologySceneSpec {
  const entities: BiologySceneSpec["entities"] = [];
  const addEntity = (entity: BiologySceneSpec["entities"][number]) => {
    if (!entities.some((candidate) => candidate.id === entity.id)) entities.push(entity);
  };

  const includeLigand = ["ligand-binding", "rtk-activation", "phosphorylation", "adaptor-recruitment", "ras-activation", "mapk-cascade", "signal-to-nucleus"].includes(focus);
  const includeDimer = ["dimerization", "rtk-activation", "phosphorylation", "adaptor-recruitment", "ras-activation", "mapk-cascade", "signal-to-nucleus"].includes(focus);
  const includePhospho = ["rtk-activation", "phosphorylation", "adaptor-recruitment", "ras-activation", "mapk-cascade", "signal-to-nucleus"].includes(focus);
  const includeAdaptor = ["adaptor-recruitment", "ras-activation", "mapk-cascade", "signal-to-nucleus"].includes(focus);
  const includeRas = ["ras-activation", "mapk-cascade", "signal-to-nucleus"].includes(focus);
  const includeMapk = ["mapk-cascade", "signal-to-nucleus"].includes(focus);
  const includeNucleus = focus === "signal-to-nucleus";

  addEntity({ id: "extracellular-space", name: "extracellular space", type: "other" });
  addEntity({ id: "cytoplasm", name: "cytoplasm", type: "other" });
  addEntity({ id: "plasma-membrane", name: "plasma membrane", type: "membrane" });

  if (includeLigand) addEntity({ id: "ligand", name: "extracellular ligand", type: "other" });
  addEntity({ id: "receptor-tyrosine-kinase", name: "receptor tyrosine kinase", type: "protein" });
  if (includeDimer) {
    addEntity({ id: "receptor-monomer-a", name: "RTK monomer A", type: "protein" });
    addEntity({ id: "receptor-monomer-b", name: "RTK monomer B", type: "protein" });
    addEntity({ id: "receptor-dimer", name: "RTK dimer", type: "complex" });
  }
  if (includePhospho) {
    addEntity({ id: "active-state", name: "active state", type: "other" });
    addEntity({ id: "phosphorylated-state", name: "phosphorylated state", type: "other" });
    addEntity({ id: "phosphotyrosine-site", name: "phosphotyrosine docking site", type: "other" });
    addEntity({ id: "phosphate-group", name: "phosphate group", type: "other" });
  }
  if (includeAdaptor) {
    addEntity({ id: "adaptor-protein", name: "adaptor protein", type: "protein" });
    addEntity({ id: "grb2", name: "Grb2", type: "protein" });
    addEntity({ id: "sos", name: "SOS", type: "protein" });
  }
  if (includeRas) {
    addEntity({ id: "ras", name: "Ras", type: "protein" });
    addEntity({ id: "ras-gdp", name: "Ras-GDP inactive state", type: "complex" });
    addEntity({ id: "ras-gtp", name: "Ras-GTP active state", type: "complex" });
  }
  if (includeMapk) {
    addEntity({ id: "raf", name: "Raf", type: "protein" });
    addEntity({ id: "mek", name: "MEK", type: "protein" });
    addEntity({ id: "erk", name: "ERK", type: "protein" });
  }
  if (includeNucleus) {
    addEntity({ id: "nucleus", name: "nucleus", type: "organelle" });
    addEntity({ id: "cellular-response", name: "cellular response", type: "other" });
  }

  const relations: BiologySceneSpec["relations"] = [];
  const addRelation = (subject: string, relation: string, object: string) => {
    if (entities.some((entity) => entity.id === subject) && entities.some((entity) => entity.id === object)) {
      relations.push({ subject, relation, object });
    }
  };
  addRelation("extracellular-space", "outside_of", "plasma-membrane");
  addRelation("cytoplasm", "inside_of", "plasma-membrane");
  addRelation("receptor-tyrosine-kinase", "embedded_in", "plasma-membrane");
  addRelation("receptor-tyrosine-kinase", "crosses", "plasma-membrane");
  addRelation("ligand", "located_in", "extracellular-space");
  addRelation("ligand", "binds_to", "receptor-tyrosine-kinase");
  addRelation("receptor-monomer-a", "embedded_in", "plasma-membrane");
  addRelation("receptor-monomer-b", "embedded_in", "plasma-membrane");
  addRelation("receptor-monomer-a", "dimerizes_with", "receptor-monomer-b");
  addRelation("receptor-dimer", "formed_from", "receptor-monomer-a");
  addRelation("receptor-dimer", "embedded_in", "plasma-membrane");
  addRelation("receptor-dimer", "state", "active-state");
  addRelation("receptor-dimer", "state", "phosphorylated-state");
  addRelation("phosphotyrosine-site", "cytoplasmic_side_of", "receptor-dimer");
  addRelation("phosphate-group", "attached_to", "phosphotyrosine-site");
  addRelation("adaptor-protein", "located_in", "cytoplasm");
  addRelation("adaptor-protein", "binds_to", "phosphotyrosine-site");
  addRelation("grb2", "binds_to", "phosphotyrosine-site");
  addRelation("sos", "associated_with", "grb2");
  addRelation("ras", "associated_with_surface", "plasma-membrane");
  addRelation("ras-gdp", "state_of", "ras");
  addRelation("ras-gtp", "state_of", "ras");
  addRelation("ras-gdp", "transitions_to", "ras-gtp");
  addRelation("ras-gtp", "activates", "raf");
  addRelation("raf", "activates", "mek");
  addRelation("mek", "activates", "erk");
  addRelation("erk", "signals_to", "nucleus");
  addRelation("cellular-response", "downstream_of", "erk");

  const actions: BiologySceneSpec["actions"] = [];
  const addAction = (actor: string, action: string, target?: string) => {
    if (entities.some((entity) => entity.id === actor) && (!target || entities.some((entity) => entity.id === target))) {
      actions.push({ actor, action, target });
    }
  };
  addAction("ligand", "binds", "receptor-tyrosine-kinase");
  addAction("receptor-monomer-a", "dimerizes", "receptor-monomer-b");
  addAction("receptor-dimer", "activates");
  addAction("receptor-dimer", "phosphorylates", "phosphotyrosine-site");
  addAction("adaptor-protein", "recruits", "sos");
  addAction("sos", "activates", "ras");
  addAction("ras-gdp", "exchanges_for", "ras-gtp");
  addAction("ras-gtp", "activates", "raf");
  addAction("raf", "phosphorylates", "mek");
  addAction("mek", "phosphorylates", "erk");
  addAction("erk", "signals_to", "nucleus");

  return BiologySceneSpecSchema.parse({
    intent: focus === "membrane-receptor" ? "relation" : "mechanism",
    scale: "cellular",
    entities,
    relations,
    actions,
    renderMode: "mechanistic-3d",
  });
}
