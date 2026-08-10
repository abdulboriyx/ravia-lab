import type { BiologyRenderer } from "./biology-renderer-router.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { BiologyContext } from "./biology-context.ts";
import type { ExpectedAction, ExpectedRelation } from "./semantic-holdout-set.ts";

export type TranscriptionHoldoutCategory =
  | "mechanism"
  | "promoter-initiation"
  | "template-coding"
  | "bubble"
  | "rna-transcript"
  | "directionality"
  | "termination"
  | "organism-context"
  | "unsupported-cross-domain";

export type TranscriptionHoldoutCase = {
  id: string;
  category: TranscriptionHoldoutCategory;
  prompt: string;
  expected:
    | {
        supported: true;
        intent?: BiologySceneSpec["intent"];
        renderer: BiologyRenderer;
        requiredEntities?: string[];
        forbiddenEntities?: string[];
        requiredActions?: ExpectedAction[];
        requiredRelations?: ExpectedRelation[];
        organismContext?: BiologyContext["organism"];
      }
    | {
        supported: false;
      };
};

const three = "three" as const;
const molstar = "molstar" as const;

const txCore: TranscriptionHoldoutCase["expected"] = {
  supported: true,
  renderer: three,
  requiredEntities: ["dna", "rna-polymerase", "rna-transcript", "transcription-bubble"],
  forbiddenEntities: ["daughter-leading-strand", "okazaki-fragment", "helicase"],
  requiredActions: [
    { actor: "rna-polymerase", action: "synthesizes", target: "rna-transcript" },
    { actor: "rna-polymerase", action: "locally_unwinds", target: "dna" },
  ],
};

export const transcriptionHoldoutSet: TranscriptionHoldoutCase[] = [
  ...[
    "show the protein machine producing RNA on a gene",
    "visualize DNA information being written as RNA",
    "show RNA polymerase reading DNA and producing RNA",
    "display transcription of a short gene",
    "what enzyme turns a DNA template into RNA?",
    "show the molecular machine copying a gene into RNA",
    "visualize RNA production from genetic DNA information",
    "show a gene being transcribed into RNA",
    "show the transcription enzyme making a nascent RNA",
    "how does polymerase make RNA from DNA?",
    "show RNA polymerase traveling over a transcribed region",
    "display a simple transcription elongation complex",
    "show RNA polymerase with DNA and a growing RNA",
    "visualize RNA synthesis at a gene",
    "show DNA copied into RNA, not DNA",
  ].map((prompt, index) => ({
    id: `tx-${String(index + 1).padStart(3, "0")}`,
    category: "mechanism" as const,
    prompt,
    expected: txCore,
  })),

  ...[
    "show the DNA site where RNA polymerase binds before a gene",
    "visualize a promoter upstream of a gene",
    "where does transcription start on DNA?",
    "show promoter recognition during transcription initiation",
    "display the polymerase binding site for transcription",
    "show a bacterial promoter with initiation machinery",
    "visualize sigma helping polymerase recognize the promoter",
    "show initiation before RNA synthesis begins",
    "show the start region for transcription",
    "what marks the upstream start of a transcribed gene?",
  ].map((prompt, index) => ({
    id: `init-${String(index + 1).padStart(3, "0")}`,
    category: "promoter-initiation" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: ["dna", "promoter"],
      requiredRelations: [{ subject: "promoter", relation: "located_on", object: "dna" }],
    },
  })),

  ...[
    "which strand does RNA polymerase use as the template?",
    "show the DNA strand that is read during transcription",
    "visualize coding versus template strands",
    "show non-template and template DNA strands",
    "which DNA strand matches the RNA except U for T?",
    "display the read strand and coding strand",
    "show strand roles during transcription",
    "mark the template strand beneath RNA polymerase",
    "show coding strand correspondence to RNA",
    "which strand is not read by RNA polymerase?",
  ].map((prompt, index) => ({
    id: `strand-${String(index + 1).padStart(3, "0")}`,
    category: "template-coding" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: ["dna", "template-strand", "coding-strand"],
      forbiddenEntities: ["daughter-leading-strand", "okazaki-fragment"],
      requiredRelations: [
        { subject: "template-strand", relation: "part_of", object: "dna" },
        { subject: "coding-strand", relation: "part_of", object: "dna" },
      ],
    },
  })),

  ...[
    "show the local opening in DNA during transcription",
    "what happens to DNA right around RNA polymerase?",
    "visualize the small bubble where DNA is separated for transcription",
    "show DNA opened only at the transcription enzyme",
    "display the transient transcription bubble",
    "show where RNA polymerase separates the DNA locally",
    "visualize DNA reformed behind the transcription bubble",
    "show the opened DNA pocket inside RNA polymerase",
    "show local unwinding without a replication fork",
    "where does DNA open while RNA is being synthesized?",
  ].map((prompt, index) => ({
    id: `bubble-${String(index + 1).padStart(3, "0")}`,
    category: "bubble" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: ["dna", "rna-polymerase", "transcription-bubble"],
      forbiddenEntities: ["helicase", "fork"],
      requiredActions: [{ actor: "rna-polymerase", action: "locally_unwinds", target: "dna" }],
    },
  })),

  ...[
    "show the nascent RNA coming out of polymerase",
    "visualize the RNA transcript emerging from the enzyme",
    "show growing RNA attached to RNA polymerase",
    "display RNA being synthesized from the template",
    "show a new RNA chain leaving the transcription complex",
    "what is produced by RNA polymerase on DNA?",
    "show transcript extension during transcription",
    "visualize the RNA strand paired briefly with template DNA",
    "show RNA product formation at a gene",
    "display a nascent transcript behind polymerase",
  ].map((prompt, index) => ({
    id: `rna-${String(index + 1).padStart(3, "0")}`,
    category: "rna-transcript" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: ["rna-polymerase", "rna-transcript"],
      forbiddenEntities: ["daughter-leading-strand"],
      requiredActions: [{ actor: "rna-polymerase", action: "synthesizes", target: "rna-transcript" }],
      requiredRelations: [{ subject: "rna-transcript", relation: "extends_from", object: "rna-polymerase" }],
    },
  })),

  ...[
    "show RNA chain growth direction during transcription",
    "which way is the RNA strand synthesized?",
    "visualize RNA 5-prime to 3-prime growth",
    "show how RNA polymerase reads the DNA template direction",
    "display template read direction versus RNA growth direction",
    "show transcription polarity",
    "which end of RNA is extended by polymerase?",
    "mark 3-prime to 5-prime reading of the template",
    "show RNA synthesis direction, not DNA replication direction",
    "visualize 5-to-3 RNA synthesis on a gene",
  ].map((prompt, index) => ({
    id: `dir-${String(index + 1).padStart(3, "0")}`,
    category: "directionality" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: ["rna-transcript", "5-to-3", "3-to-5"],
      forbiddenEntities: ["daughter-leading-strand", "okazaki-fragment"],
      requiredRelations: [
        { subject: "rna-transcript", relation: "direction", object: "5-to-3" },
        { subject: "rna-polymerase", relation: "reads_direction", object: "3-to-5" },
      ],
    },
  })),

  ...[
    "show how transcription stops at a terminator",
    "visualize RNA polymerase releasing the RNA transcript",
    "show termination after a gene is transcribed",
    "display polymerase stopping at the end of a transcription unit",
    "what happens when RNA polymerase reaches a terminator?",
  ].map((prompt, index) => ({
    id: `term-${String(index + 1).padStart(3, "0")}`,
    category: "termination" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: ["terminator", "rna-transcript"],
      requiredActions: [{ actor: "rna-polymerase", action: "terminates", target: "rna-transcript" }],
      requiredRelations: [{ subject: "terminator", relation: "located_on", object: "dna" }],
    },
  })),

  ...([
    ["in bacteria, show transcription initiation", "bacterial-rna-polymerase", "bacterial"],
    ["show E. coli RNA polymerase transcribing DNA", "bacterial-rna-polymerase", "bacterial"],
    ["visualize human RNA polymerase II on a gene", "rna-polymerase-ii", "eukaryotic"],
    ["show eukaryotic transcription of a protein-coding gene", "rna-polymerase-ii", "eukaryotic"],
    ["show mammalian RNA polymerase II making RNA", "rna-polymerase-ii", "eukaryotic"],
  ] as Array<[string, string, BiologyContext["organism"]]>).map(([prompt, polymeraseId, organism], index) => ({
    id: `org-${String(index + 1).padStart(3, "0")}`,
    category: "organism-context" as const,
    prompt,
    expected: {
      supported: true,
      renderer: three,
      requiredEntities: [polymeraseId],
      organismContext: organism,
    },
  })),

  ...[
    "show transcription doing something cool",
    "make RNA polymerase look awesome",
    "show a protein near a gene",
    "show DNA and RNA somehow",
    "visualize the gene helper",
    "show transcription regulation with enhancers and mediator",
    "show splicing after transcription",
    "show ribosomes transcribing mRNA",
    "show DNA replication but use RNA polymerase",
    "show RNA polymerase making daughter DNA strands",
    "show helicase making RNA",
    "show mitochondria transcribing every genome at once",
    "show promoter magic",
    "show the complex thing before transcription",
    "show polymerase doing biology",
  ].map((prompt, index) => ({
    id: `neg-${String(index + 1).padStart(3, "0")}`,
    category: "unsupported-cross-domain" as const,
    prompt,
    expected: { supported: false as const },
  })),
];
