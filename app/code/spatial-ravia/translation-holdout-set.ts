import type { BiologyRenderer } from "./biology-renderer-router.ts";
import type { ExpectedAction, ExpectedRelation } from "./semantic-holdout-set.ts";

export type TranslationHoldoutCategory =
  | "general"
  | "initiation"
  | "sites"
  | "trna"
  | "codon-anticodon"
  | "peptide-bond"
  | "translocation"
  | "directionality"
  | "termination"
  | "unsupported-cross-domain";

export type TranslationHoldoutCase = {
  id: string;
  category: TranslationHoldoutCategory;
  prompt: string;
  expected:
    | {
        supported: true;
        domain: "replication" | "transcription" | "translation";
        renderer: BiologyRenderer;
        requiredEntities?: string[];
        forbiddenEntities?: string[];
        requiredActions?: ExpectedAction[];
        requiredRelations?: ExpectedRelation[];
      }
    | { supported: false };
};

const three = "three" as const;

const txForbidden = ["polymerase", "rna-polymerase", "rna-transcript", "daughter-leading-strand"];

export const translationHoldoutSet: TranslationHoldoutCase[] = [
  ...[
    "show the molecular machine reading an mRNA and building an amino-acid chain",
    "visualize a ribosome producing a protein from a transcript",
    "show protein synthesis on an mRNA strand",
    "display the complex that reads codons and grows a peptide",
    "show mRNA being decoded into a polypeptide",
    "what makes a protein from mRNA?",
    "show the ribosome with a growing amino acid chain",
    "visualize translation elongation on an mRNA",
    "show the protein-building complex on messenger RNA",
    "display a ribosome translating an mRNA message",
    "show a peptide emerging from the ribosome",
    "visualize ribosomal protein synthesis",
    "show mRNA information converted into a protein",
    "show a ribosome building a polypeptide",
    "display codon reading during protein synthesis",
  ].map((prompt, index) => ({
    id: `gen-${String(index + 1).padStart(3, "0")}`,
    category: "general" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["mrna", "ribosome", "polypeptide"],
      forbiddenEntities: txForbidden,
      requiredActions: [{ actor: "ribosome", action: "synthesizes", target: "polypeptide" }],
    },
  })),

  ...[
    "show the first amino acid carrier already sitting in the ribosome",
    "visualize the start codon with initiator tRNA",
    "show ribosome assembly at the beginning of translation",
    "where does the initiator tRNA bind?",
    "show the first tRNA in the P site",
    "display the small subunit finding a start codon",
    "show initiation with the large subunit joining",
    "what starts translation on mRNA?",
    "show the beginning of protein synthesis at AUG conceptually",
    "display initiator tRNA paired to the start signal",
  ].map((prompt, index) => ({
    id: `init-${String(index + 1).padStart(3, "0")}`,
    category: "initiation" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["mrna", "ribosome", "start-codon", "initiator-trna", "p-site"],
      requiredRelations: [{ subject: "initiator-trna", relation: "positioned_at", object: "p-site" }],
    },
  })),

  ...[
    "what occupies the P site before the next peptide bond forms?",
    "show the incoming tRNA in the A site",
    "display A P and E sites inside the ribosome",
    "show peptidyl and aminoacyl sites",
    "which site receives the next charged tRNA?",
    "show the exit site for empty tRNA",
    "visualize ribosomal site order",
    "show tRNAs arranged across the A P E sites",
    "display the P-site tRNA carrying the growing chain",
    "show the A site next to the P site",
    "where is the E site in relation to P and A?",
    "show all three tRNA binding sites",
  ].map((prompt, index) => ({
    id: `site-${String(index + 1).padStart(3, "0")}`,
    category: "sites" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["ribosome", "a-site", "p-site", "e-site"],
      requiredRelations: [
        { subject: "a-site", relation: "part_of", object: "ribosome" },
        { subject: "p-site", relation: "part_of", object: "ribosome" },
        { subject: "e-site", relation: "part_of", object: "ribosome" },
      ],
    },
  })),

  ...[
    "which RNA brings the next amino acid into the ribosome?",
    "show an amino acid carried by transfer RNA",
    "display a charged adaptor RNA",
    "show aminoacyl tRNA entering the ribosome",
    "visualize a tRNA with an amino acid attached",
    "show the carrier that delivers amino acids to translation",
    "what brings amino acids to the A site?",
    "show a charged tRNA before codon recognition",
    "display amino-acid delivery by tRNA",
    "show the next amino acid on its tRNA",
    "visualize tRNA carrying cargo into the ribosome",
    "show the amino acid attached at the top of tRNA",
  ].map((prompt, index) => ({
    id: `trna-${String(index + 1).padStart(3, "0")}`,
    category: "trna" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["trna", "amino-acid", "aminoacyl-trna"],
      requiredRelations: [{ subject: "amino-acid", relation: "attached_to", object: "trna" }],
    },
  })),

  ...[
    "show the adaptor matching its triplet to the transcript",
    "visualize anticodon complementing an mRNA codon",
    "show tRNA reading a codon",
    "display codon recognition by a tRNA anticodon",
    "show the three-base mRNA unit matched by tRNA",
    "how does tRNA recognize the mRNA word?",
    "show codon pairing with the tRNA triplet",
    "visualize a complementary anticodon on tRNA",
    "show the transcript triplet and the adaptor triplet",
    "display codon anticodon matching without a peptide bond",
  ].map((prompt, index) => ({
    id: `codon-${String(index + 1).padStart(3, "0")}`,
    category: "codon-anticodon" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["mrna", "codon", "trna", "anticodon"],
      requiredRelations: [{ subject: "anticodon", relation: "complementary_to", object: "codon" }],
    },
  })),

  ...[
    "show the chemical step linking amino acids in the ribosome",
    "visualize peptidyl transferase making the next bond",
    "show the peptide moving onto the A-site amino acid",
    "what happens when the growing chain is transferred?",
    "display peptide bond formation between the chain and incoming amino acid",
    "show the growing peptide after transfer to the A-site tRNA",
    "how is the amino-acid chain extended?",
    "show the bond-forming step of elongation",
    "visualize the ribosome joining the next amino acid",
    "show chain transfer from P-site tRNA to A-site tRNA",
  ].map((prompt, index) => ({
    id: `bond-${String(index + 1).padStart(3, "0")}`,
    category: "peptide-bond" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["ribosome", "aminoacyl-trna", "polypeptide"],
      requiredActions: [{ actor: "ribosome", action: "forms_peptide_bond", target: "polypeptide" }],
    },
  })),

  ...[
    "show the ribosome advancing one codon",
    "what happens immediately after peptide bond formation?",
    "how does the empty tRNA leave the ribosome?",
    "show tRNAs shifting from A to P to E",
    "visualize translocation after elongation",
    "display ribosome movement along the transcript",
    "show the former A-site tRNA moving to P",
    "show the P-site tRNA shifting toward E",
    "visualize one-codon movement on mRNA",
    "show tRNA traffic through the ribosome",
  ].map((prompt, index) => ({
    id: `move-${String(index + 1).padStart(3, "0")}`,
    category: "translocation" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["ribosome", "a-site", "p-site", "e-site", "trna"],
      requiredActions: [{ actor: "ribosome", action: "advances_one_codon", target: "mrna" }],
    },
  })),

  ...[
    "which direction along the transcript does the ribosome travel?",
    "show mRNA read direction during protein synthesis",
    "visualize 5-prime to 3-prime translation",
    "which end of the protein comes out first?",
    "show N to C growth of the peptide",
    "display ribosome movement from the 5 end toward the 3 end",
    "show mRNA polarity in translation",
    "mark the protein N terminus and growing C terminus",
  ].map((prompt, index) => ({
    id: `dir-${String(index + 1).padStart(3, "0")}`,
    category: "directionality" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["mrna-5-prime", "mrna-3-prime", "n-terminus", "c-terminus"],
      requiredRelations: [
        { subject: "ribosome", relation: "reads_direction", object: "5-to-3" },
        { subject: "polypeptide", relation: "direction", object: "n-to-c" },
      ],
    },
  })),

  ...[
    "show what enters the A site at a stop signal",
    "visualize release factor recognizing a stop codon",
    "show finished protein release at termination",
    "what happens when translation reaches a stop codon?",
    "display release of the polypeptide from the ribosome",
    "show termination without a normal tRNA at the stop codon",
    "show the release factor in the A site",
    "visualize ribosome termination at the final codon",
  ].map((prompt, index) => ({
    id: `term-${String(index + 1).padStart(3, "0")}`,
    category: "termination" as const,
    prompt,
    expected: {
      supported: true as const,
      domain: "translation" as const,
      renderer: three,
      requiredEntities: ["stop-codon", "release-factor", "polypeptide"],
      forbiddenEntities: ["aminoacyl-trna"],
      requiredRelations: [{ subject: "release-factor", relation: "binds_to", object: "stop-codon" }],
      requiredActions: [{ actor: "release-factor", action: "terminates", target: "polypeptide" }],
    },
  })),

  ...[
    "show protein being transcribed",
    "show mRNA being replicated",
    "show the enzyme that copies DNA",
    "show polymerase reading a template",
    "show RNA being made",
    "show the protein machine",
    "show something making protein",
    "show the RNA helper",
    "show a ribosome transcribing DNA",
    "show tRNA copying DNA",
    "show stop codon pairing with normal tRNA",
    "show amino acids emerging directly from mRNA",
  ].map((prompt, index) => ({
    id: `neg-${String(index + 1).padStart(3, "0")}`,
    category: "unsupported-cross-domain" as const,
    prompt,
    expected: { supported: false as const },
  })),

  {
    id: "trap-supported-001",
    category: "unsupported-cross-domain",
    prompt: "show RNA polymerase making RNA",
    expected: {
      supported: true,
      domain: "transcription",
      renderer: three,
      requiredEntities: ["rna-polymerase", "rna-transcript"],
      forbiddenEntities: ["ribosome", "polypeptide"],
      requiredActions: [{ actor: "rna-polymerase", action: "synthesizes", target: "rna-transcript" }],
    },
  },
  {
    id: "trap-supported-002",
    category: "unsupported-cross-domain",
    prompt: "show DNA polymerase copying DNA",
    expected: {
      supported: true,
      domain: "replication",
      renderer: three,
      requiredEntities: ["polymerase", "daughter-leading-strand"],
      forbiddenEntities: ["ribosome", "rna-transcript"],
      requiredActions: [{ actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" }],
    },
  },
  {
    id: "trap-supported-003",
    category: "unsupported-cross-domain",
    prompt: "show RNA polymerase",
    expected: {
      supported: true,
      domain: "transcription",
      renderer: "molstar",
      requiredEntities: ["rna-polymerase"],
      forbiddenEntities: ["ribosome", "polypeptide"],
    },
  },
];
