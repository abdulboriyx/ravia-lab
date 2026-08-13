import type { BiologyRenderer } from "./biology-renderer-router.ts";
import type { ExpectedAction, ExpectedRelation } from "./semantic-holdout-set.ts";

export type SignalingHoldoutCategory =
  | "membrane-receptor"
  | "ligand-binding"
  | "dimerization"
  | "phosphorylation"
  | "adaptor"
  | "ras"
  | "mapk"
  | "topology"
  | "nucleus"
  | "unsupported-cross-domain";

export type SignalingHoldoutCase = {
  id: string;
  category: SignalingHoldoutCategory;
  prompt: string;
  expected:
    | {
        supported: true;
        domain: "replication" | "transcription" | "translation" | "signaling";
        renderer: BiologyRenderer;
        requiredEntities?: string[];
        forbiddenEntities?: string[];
        requiredActions?: ExpectedAction[];
        requiredRelations?: ExpectedRelation[];
        topologyChecks?: Array<"ligandExtracellular" | "receptorEmbedded" | "adaptorCytoplasmic" | "rasMembrane" | "phosphoCytoplasmic">;
        stateChecks?: Array<"rtkActive" | "rtkPhosphorylated" | "rasGdpToGtp">;
      }
    | { supported: false };
};

const three = "three" as const;
const signalingCore = ["plasma-membrane", "receptor-tyrosine-kinase"];
const noNucleicMachinery = ["ribosome", "rna-polymerase", "polymerase", "dna"];

function supported(
  id: string,
  category: SignalingHoldoutCategory,
  prompt: string,
  expected: Extract<SignalingHoldoutCase["expected"], { supported: true }>
): SignalingHoldoutCase {
  return { id, category, prompt, expected };
}

function unsupported(id: string, prompt: string): SignalingHoldoutCase {
  return { id, category: "unsupported-cross-domain", prompt, expected: { supported: false } };
}

export const signalingHoldoutSet: SignalingHoldoutCase[] = [
  ...[
    "show a transmembrane receptor in the plasma membrane",
    "visualize a receptor crossing the cell membrane",
    "show a membrane-spanning signaling receptor",
    "display an RTK embedded in the membrane",
    "show the receptor with outside and cytoplasmic sides",
    "visualize a cell-surface receptor",
    "show a receptor tyrosine kinase in the bilayer",
    "show a membrane receptor without downstream cascade",
    "display a receptor anchored through the membrane",
    "show a signaling receptor at the cell surface",
  ].map((prompt, index) =>
    supported(`mem-${index + 1}`, "membrane-receptor", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: signalingCore,
      forbiddenEntities: ["raf", "mek", "erk"],
      requiredRelations: [{ subject: "receptor-tyrosine-kinase", relation: "embedded_in", object: "plasma-membrane" }],
      topologyChecks: ["receptorEmbedded"],
    })
  ),

  ...[
    "show a growth factor binding its RTK",
    "visualize an extracellular ligand binding a membrane receptor",
    "show the signal molecule attaching outside the receptor",
    "display ligand-bound receptor tyrosine kinase",
    "what happens when an extracellular signal binds the receptor?",
    "show ligand binding at the cell surface",
    "visualize growth factor docking on the receptor outside the cell",
    "show an RTK catching a ligand above the membrane",
    "display a ligand contacting the extracellular receptor domain",
    "show receptor activation by an outside ligand",
    "show ligand binding without the MAPK cascade",
    "show a ligand activating a receptor tyrosine kinase",
  ].map((prompt, index) =>
    supported(`lig-${index + 1}`, "ligand-binding", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: [...signalingCore, "ligand"],
      forbiddenEntities: ["raf", "mek", "erk"],
      requiredActions: [{ actor: "ligand", action: "binds", target: "receptor-tyrosine-kinase" }],
      requiredRelations: [{ subject: "ligand", relation: "located_in", object: "extracellular-space" }],
      topologyChecks: ["ligandExtracellular", "receptorEmbedded"],
    })
  ),

  ...[
    "show two receptor molecules pairing after ligand arrives",
    "visualize RTK receptors coming together",
    "show receptor dimer formation",
    "display a receptor dimer in the membrane",
    "what happens after ligand binding to the receptors?",
    "show two RTK monomers side by side",
    "visualize paired receptor tyrosine kinases",
    "show the membrane receptor dimerizing",
    "display receptor monomer A next to monomer B",
    "show receptor dimerization",
  ].map((prompt, index) =>
    supported(`dim-${index + 1}`, "dimerization", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["receptor-monomer-a", "receptor-monomer-b", "receptor-dimer"],
      requiredRelations: [{ subject: "receptor-monomer-a", relation: "dimerizes_with", object: "receptor-monomer-b" }],
      topologyChecks: ["receptorEmbedded"],
    })
  ),

  ...[
    "what creates docking sites on cytoplasmic receptor tails?",
    "show RTK autophosphorylation after dimerization",
    "visualize phosphate groups added to receptor tails",
    "show phosphorylated tyrosines on the inside tail",
    "display activated RTK with phosphotyrosine sites",
    "show receptor tail phosphorylation",
    "show intracellular domains becoming phosphorylated",
    "visualize phosphates on the cytoplasmic RTK tail",
    "show a receptor being phosphorylated in the membrane",
    "show activated receptor kinase domains phosphorylating tails",
    "show phosphate docking sites after receptor activation",
    "visualize an active phosphorylated RTK dimer",
    "show phosphotyrosine markers below the membrane",
    "show the receptor switching into a phosphorylated state",
    "ignore transcription and show the membrane receptor being phosphorylated",
  ].map((prompt, index) =>
    supported(`pho-${index + 1}`, "phosphorylation", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["receptor-dimer", "phosphotyrosine-site", "phosphate-group"],
      requiredActions: [{ actor: "receptor-dimer", action: "phosphorylates", target: "phosphotyrosine-site" }],
      requiredRelations: [{ subject: "phosphotyrosine-site", relation: "cytoplasmic_side_of", object: "receptor-dimer" }],
      topologyChecks: ["phosphoCytoplasmic"],
      stateChecks: ["rtkPhosphorylated"],
    })
  ),

  ...[
    "show an adaptor protein binding a phosphorylated RTK",
    "visualize Grb2 recruited to the activated receptor",
    "show SH2 adaptor docking on phosphotyrosine",
    "display Grb2 binding receptor tail docking sites",
    "show adaptor recruitment below the membrane",
    "show the cytoplasmic adaptor at the activated receptor",
    "visualize SOS associated with Grb2 at the receptor",
    "show Grb2 and SOS recruited to phosphotyrosine sites",
    "what binds the phosphorylated receptor tail?",
    "show adaptor binding after RTK autophosphorylation",
  ].map((prompt, index) =>
    supported(`adp-${index + 1}`, "adaptor", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["adaptor-protein", "grb2", "sos", "phosphotyrosine-site"],
      requiredRelations: [{ subject: "grb2", relation: "binds_to", object: "phosphotyrosine-site" }],
      topologyChecks: ["adaptorCytoplasmic", "phosphoCytoplasmic"],
    })
  ),

  ...[
    "show Ras activation downstream of RTK",
    "show how an activated receptor turns on Ras",
    "visualize GDP being exchanged for GTP on Ras",
    "show Ras switching from GDP-bound to GTP-bound",
    "display SOS activating membrane-associated Ras",
    "show Ras-GDP becoming Ras-GTP",
    "visualize Grb2 SOS coupling the receptor to Ras",
    "show the signal crossing from outside the cell to Ras at the inner membrane",
    "show Ras activated at the inner membrane surface",
    "what turns Ras into its GTP-bound state?",
    "show RTK recruiting SOS to activate Ras",
    "display Ras-GTP next to the plasma membrane",
  ].map((prompt, index) =>
    supported(`ras-${index + 1}`, "ras", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["ras", "ras-gdp", "ras-gtp", "sos"],
      requiredActions: [{ actor: "sos", action: "activates", target: "ras" }],
      requiredRelations: [{ subject: "ras-gdp", relation: "transitions_to", object: "ras-gtp" }],
      topologyChecks: ["rasMembrane"],
      stateChecks: ["rasGdpToGtp"],
    })
  ),

  ...[
    "show the MAPK cascade downstream of Ras",
    "visualize Ras activating Raf MEK and ERK",
    "show RTK signaling through Ras Raf MEK ERK",
    "display Raf phosphorylating MEK and MEK phosphorylating ERK",
    "show the MAP kinase chain after Ras-GTP",
    "visualize ERK activation downstream of Raf and MEK",
    "show Ras to Raf to MEK to ERK signaling",
    "display a simplified MAPK cascade",
    "show RTK signaling to ERK",
    "show Ras-GTP driving the kinase cascade",
    "visualize receptor signaling ending at ERK",
    "show Raf MEK ERK in order",
    "display downstream kinases beneath the receptor",
    "show the cytoplasmic kinase cascade",
    "show MAPK activation after RTK activation",
  ].map((prompt, index) =>
    supported(`mapk-${index + 1}`, "mapk", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["ras-gtp", "raf", "mek", "erk"],
      requiredActions: [
        { actor: "raf", action: "phosphorylates", target: "mek" },
        { actor: "mek", action: "phosphorylates", target: "erk" },
      ],
      requiredRelations: [{ subject: "ras-gtp", relation: "activates", object: "raf" }],
      topologyChecks: ["rasMembrane"],
    })
  ),

  ...[
    "place the ligand outside the cell and the adaptor beneath the membrane",
    "show extracellular ligand and cytoplasmic receptor tail",
    "visualize outside-to-inside signaling across the plasma membrane",
    "show receptor kinase domains on the cytoplasmic side",
    "display phosphotyrosines below the membrane only",
    "show Ras at the inner membrane surface",
    "visualize ligand above and Ras below the membrane",
    "show the membrane separating ligand from adaptor",
    "display outside signal with inside kinase cascade",
    "show topology of RTK signaling across the membrane",
  ].map((prompt, index) =>
    supported(`topo-${index + 1}`, "topology", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["ligand", "plasma-membrane", "phosphotyrosine-site"],
      topologyChecks: ["ligandExtracellular", "phosphoCytoplasmic", "receptorEmbedded"],
    })
  ),

  ...[
    "show ERK signaling toward the nucleus",
    "visualize an RTK signal reaching the nucleus",
    "show activated ERK near the nucleus",
    "display membrane receptor signaling to a response gene",
    "show ERK driving a downstream cellular response",
    "show the signal path from RTK to nuclear response",
  ].map((prompt, index) =>
    supported(`nuc-${index + 1}`, "nucleus", prompt, {
      supported: true,
      domain: "signaling",
      renderer: three,
      requiredEntities: ["erk", "nucleus", "cellular-response"],
      requiredRelations: [{ subject: "erk", relation: "signals_to", object: "nucleus" }],
    })
  ),

  unsupported("neg-1", "show a protein near the membrane"),
  supported("broad-1", "mapk", "show cell signaling", {
    supported: true,
    domain: "signaling",
    renderer: three,
    requiredEntities: ["ligand", "receptor-dimer", "ras", "raf", "mek", "erk", "nucleus"],
    requiredRelations: [{ subject: "erk", relation: "signals_to", object: "nucleus" }],
    topologyChecks: ["ligandExtracellular", "receptorEmbedded", "rasMembrane"],
  }),
  unsupported("neg-3", "show a phosphorylated protein"),
  unsupported("neg-4", "make the receptor cool"),
  unsupported("neg-5", "show a ligand binding DNA"),
  unsupported("neg-6", "show ribosome phosphorylation during translation"),
  unsupported("neg-7", "show a random membrane thing"),
  unsupported("neg-8", "show protein phosphorylation"),
  unsupported("neg-9", "show a receptor doing stuff"),
  unsupported("neg-10", "show the outside of a cell"),
  supported("trap-1", "unsupported-cross-domain", "show RNA polymerase", {
    supported: true,
    domain: "transcription",
    renderer: "molstar",
    requiredEntities: ["rna-polymerase"],
    forbiddenEntities: ["receptor-tyrosine-kinase"],
  }),
  supported("trap-2", "unsupported-cross-domain", "show protein synthesis", {
    supported: true,
    domain: "translation",
    renderer: three,
    requiredEntities: ["ribosome", "polypeptide"],
    forbiddenEntities: ["receptor-tyrosine-kinase"],
  }),
  supported("trap-3", "unsupported-cross-domain", "show DNA polymerase binding DNA", {
    supported: true,
    domain: "replication",
    renderer: three,
    requiredEntities: ["polymerase", "dna"],
    forbiddenEntities: ["receptor-tyrosine-kinase"],
  }),
  unsupported("neg-14", "show receptor magic"),
  unsupported("neg-15", "show an important cell protein"),
];
