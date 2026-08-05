import type {
  BiologicalProcessPack,
  ScientificClaim,
  ScientificClaimProvenance,
  ScientificEntity,
  ScientificEntityKind,
  ScientificIntervention,
  ScientificModelDelta,
  ScientificParameter,
  ScientificRelation,
  ScientificState,
  ScientificTransition
} from "./model.ts";
import { validateBiologicalProcessPack } from "./model.ts";
import type { Coord, ScientificPrimitive } from "./primitives.ts";
import { primitiveBase } from "./primitives.ts";

const transcriptionSources = [
  {
    id: "alberts-molecular-biology-transcription",
    title: "Molecular Biology of the Cell",
    authors: "Alberts et al.",
    locator: "Transcription chapter",
    note: "Reference for promoter assembly, RNA polymerase II, template use, and elongation.",
    urlOrDoi: "https://wwnorton.com/books/9780393884821",
    publicationType: "textbook" as const,
    accessDate: "2026-08-05",
    license: "Copyrighted textbook metadata; short claim-level paraphrases only."
  },
  {
    id: "lodish-molecular-cell-biology-transcription",
    title: "Molecular Cell Biology",
    authors: "Lodish et al.",
    locator: "Eukaryotic transcription sections",
    note: "Reference for general transcription factors, promoter escape, and transcription stages.",
    urlOrDoi: "https://www.macmillanlearning.com/college/us/product/Molecular-Cell-Biology/p/1319208525",
    publicationType: "textbook" as const,
    accessDate: "2026-08-05",
    license: "Copyrighted textbook metadata; short claim-level paraphrases only."
  },
  {
    id: "ncbi-bookshelf-transcription",
    title: "NCBI Bookshelf transcription overview",
    authors: "NCBI Bookshelf",
    locator: "RNA synthesis and transcription overview",
    note: "Reference for 5' to 3' RNA synthesis and template-strand use.",
    urlOrDoi: "https://www.ncbi.nlm.nih.gov/books/",
    publicationType: "database" as const,
    accessDate: "2026-08-05",
    license: "NCBI Bookshelf terms apply."
  }
];

export const eukaryoticTranscriptionPack: BiologicalProcessPack = {
  id: "eukaryotic-transcription",
  process: "Eukaryotic transcription",
  aliases: [
    "transcription",
    "eukaryotic transcription",
    "dna copied into rna",
    "rna polymerase ii",
    "rna polymerase moving along dna",
    "promoter escape",
    "transcription bubble",
    "growing rna transcript",
    "template strand transcription"
  ],
  examples: [
    "Show transcription.",
    "How is DNA copied into RNA?",
    "Show RNA polymerase moving along DNA.",
    "Why is only one DNA strand used as template?"
  ],
  biologicalContexts: [
    "eukaryotic protein-coding gene transcription",
    "general eukaryotic transcription"
  ],
  defaultContext: "eukaryotic protein-coding gene transcription",
  unsupportedMessage: "This prototype currently supports DNA replication and eukaryotic transcription.",
  entities: [
    entity("promoter", "Promoter", ["core promoter", "promoter region"], "molecule", "DNA regulatory region where transcription machinery assembles."),
    entity("transcription-factors", "Transcription factors", ["general transcription factors", "tfs"], "protein", "Proteins that help recruit and position RNA polymerase II at the promoter."),
    entity("rna-polymerase-ii", "RNA polymerase II", ["pol ii", "rna polymerase", "polymerase"], "enzyme", "Enzyme that synthesizes the RNA transcript from the DNA template strand."),
    entity("template-strand", "Template strand", ["antisense strand", "transcribed strand"], "strand", "DNA strand read by RNA polymerase II to build complementary RNA."),
    entity("coding-strand", "Coding strand", ["sense strand", "non-template strand"], "strand", "DNA strand whose sequence matches the RNA except T is replaced by U."),
    entity("transcription-bubble", "Transcription bubble", ["open complex", "bubble"], "process", "Locally unwound DNA region inside the moving transcription complex."),
    entity("growing-rna-transcript", "Growing RNA transcript", ["nascent rna", "rna transcript"], "strand", "RNA chain extended 5' to 3' as polymerase advances."),
    entity("initiation", "Initiation", ["pre-initiation complex"], "process", "Assembly and early RNA synthesis at the promoter."),
    entity("promoter-escape", "Promoter escape", ["escape"], "process", "Transition where polymerase leaves the promoter and enters productive elongation."),
    entity("elongation", "Elongation", ["rna elongation"], "process", "Processive RNA extension along the template strand."),
    entity("termination", "Termination", ["transcription termination"], "process", "Release of RNA and disengagement of polymerase from the transcription unit.")
  ],
  relations: [
    relation("promoter", "transcription-factors", "recruits", "Promoter elements help assemble transcription factors."),
    relation("transcription-factors", "rna-polymerase-ii", "positions", "General transcription factors recruit and position RNA polymerase II."),
    relation("rna-polymerase-ii", "transcription-bubble", "maintains", "Polymerase holds a local transcription bubble during synthesis."),
    relation("rna-polymerase-ii", "template-strand", "reads", "RNA polymerase II uses one DNA strand as the template."),
    relation("template-strand", "growing-rna-transcript", "templates", "The RNA sequence is complementary to the template strand."),
    relation("coding-strand", "growing-rna-transcript", "corresponds to", "The coding strand matches the RNA sequence except thymine is replaced by uracil."),
    relation("initiation", "promoter-escape", "precedes", "Promoter escape follows initiation."),
    relation("promoter-escape", "elongation", "enables", "Escape from the promoter allows productive elongation."),
    relation("elongation", "termination", "precedes", "Termination follows elongation at the end of the transcription unit."),
    relation("rna-polymerase-ii", "growing-rna-transcript", "synthesizes 5' -> 3'", "RNA polymerase II extends RNA at the 3' end, producing 5' to 3' synthesis.")
  ],
  states: [
    state("promoter-bound", "Initiation", 0, "Transcription factors and RNA polymerase II assemble at the promoter.", ["promoter", "transcription-factors", "rna-polymerase-ii", "initiation"]),
    state("open-complex", "Transcription bubble opens", 1, "DNA locally opens and the template strand is positioned in the active site.", ["transcription-bubble", "template-strand", "coding-strand"]),
    state("promoter-escape-state", "Promoter escape", 2, "RNA polymerase II leaves the promoter after early RNA synthesis.", ["promoter-escape", "rna-polymerase-ii", "growing-rna-transcript"]),
    state("elongating", "Elongation", 3, "The RNA transcript grows 5' to 3' while polymerase moves along the template.", ["elongation", "rna-polymerase-ii", "template-strand", "growing-rna-transcript"]),
    state("terminated", "Termination", 4, "RNA is released and the transcription complex disengages in the schematic endpoint.", ["termination", "growing-rna-transcript"])
  ],
  transitions: [
    transition("assemble-initiation", "promoter-bound", "open-complex", "initiation complex formation", "transcription_bubble_open becomes true"),
    transition("escape-promoter", "open-complex", "promoter-escape-state", "early RNA synthesis", "polymerase_position leaves promoter after short transcript formation"),
    transition("enter-elongation", "promoter-escape-state", "elongating", "productive elongation", "rna_length increases as polymerase_position advances"),
    transition("terminate", "elongating", "terminated", "termination signal and processing", "transcript_release occurs at the modeled endpoint")
  ],
  parameters: [
    parameter("polymerase-position", "Polymerase position", 0, "normalized", "Progress of RNA polymerase II across the schematic gene."),
    parameter("rna-length", "RNA length", 0, "normalized", "Mocked length of the growing transcript."),
    parameter("template-strand-selected", "Template strand selected", true, undefined, "Only the template strand is read by polymerase in this model."),
    parameter("rna-synthesis-direction", "RNA synthesis direction", "5' -> 3'", undefined, "RNA polymerase II extends the RNA transcript at the 3' end.")
  ],
  interventions: [
    intervention("isolate-template-strand", "Isolate template strand", "Dim all entities except the template strand, polymerase, bubble, and transcript.", ["template-strand", "rna-polymerase-ii", "transcription-bubble", "growing-rna-transcript"]),
    intervention("hide-coding-strand", "Hide coding strand", "Hide the non-template coding strand.", ["coding-strand"]),
    intervention("show-growing-rna", "Show growing RNA", "Select and reveal the nascent RNA transcript.", ["growing-rna-transcript"]),
    intervention("pause-at-initiation", "Pause at initiation", "Pause playback at the initiation state.", ["initiation", "promoter", "transcription-factors", "rna-polymerase-ii"]),
    intervention("show-transcription-bubble", "Show transcription bubble", "Highlight the locally unwound transcription bubble.", ["transcription-bubble"]),
    intervention("promoter-inaccessible", "Promoter inaccessible", "Prevent initiation complex assembly at the promoter.", ["promoter", "transcription-factors", "rna-polymerase-ii"], transcriptionCounterfactualDelta("promoter-inaccessible")),
    intervention("rna-polymerase-absent", "RNA polymerase absent", "Remove RNA polymerase II from the transcription unit.", ["rna-polymerase-ii", "growing-rna-transcript"], transcriptionCounterfactualDelta("rna-polymerase-absent")),
    intervention("initiation-factor-removed", "Initiation factor removed", "Remove the grouped general transcription-factor support for initiation.", ["transcription-factors", "initiation", "rna-polymerase-ii"], transcriptionCounterfactualDelta("initiation-factor-removed")),
    intervention("explain-template-choice", "Explain template-strand use", "Focus explanation on template selection and coding-strand correspondence.", ["template-strand", "coding-strand", "growing-rna-transcript"])
  ],
  assumptions: [
    claim("transcription-assumption-single-unit", "A single eukaryotic protein-coding transcription unit is shown.", "model-assumption", "alberts-molecular-biology-transcription"),
    claim("transcription-assumption-factors-grouped", "General transcription factors are grouped into one schematic complex.", "schematic-simplification", "lodish-molecular-cell-biology-transcription"),
    claim("transcription-assumption-processing-omitted", "RNA processing, chromatin remodeling, pausing, and splice-site handling are not simulated.", "model-assumption", "lodish-molecular-cell-biology-transcription"),
    claim("transcription-assumption-normalized-motion", "Motion and distances are normalized for explanation.", "schematic-simplification", "ncbi-bookshelf-transcription")
  ],
  limitations: [
    claim("transcription-limitation-atomistic", "Not atomistic or sequence-specific.", "schematic-simplification", "ncbi-bookshelf-transcription"),
    claim("transcription-limitation-mediator", "Does not model full Mediator, chromatin, enhancers, promoter-proximal pausing, or RNA processing kinetics.", "schematic-simplification", "lodish-molecular-cell-biology-transcription"),
    claim("transcription-limitation-termination", "Termination is represented as a simplified endpoint.", "schematic-simplification", "alberts-molecular-biology-transcription"),
    claim("transcription-limitation-molecularly-exact", "Schematic motion must not be described as molecularly exact.", "schematic-simplification", "ncbi-bookshelf-transcription")
  ],
  sources: transcriptionSources,
  representationRules: [
    claim("transcription-rule-schematic", "Use a schematic transcription unit, not molecular geometry.", "schematic-simplification", "ncbi-bookshelf-transcription"),
    claim("transcription-rule-pol-ii", "Represent RNA polymerase II as a moving complex over a local transcription bubble.", "interpretation", "alberts-molecular-biology-transcription"),
    claim("transcription-rule-template", "Show the template strand as the strand read by polymerase and the coding strand as the sequence-corresponding strand.", "direct-fact", "ncbi-bookshelf-transcription"),
    claim("transcription-rule-direction", "Use labels and direction markers to show 5' -> 3' RNA synthesis.", "direct-fact", "ncbi-bookshelf-transcription")
  ],
  commonMisconceptions: [
    claim("transcription-misconception-both-strands", "Both DNA strands are not copied into one RNA molecule.", "direct-fact", "ncbi-bookshelf-transcription"),
    claim("transcription-misconception-coding", "The coding strand is not the strand read by RNA polymerase for that transcript.", "direct-fact", "ncbi-bookshelf-transcription"),
    claim("transcription-misconception-direction", "RNA synthesis is not 3' to 5'.", "direct-fact", "ncbi-bookshelf-transcription"),
    claim("transcription-misconception-schematic", "This schematic is not a full molecular or kinetic simulation.", "schematic-simplification", "lodish-molecular-cell-biology-transcription")
  ],
  validationRules: [
    {
      id: "required-transcription-entities",
      description: "Eukaryotic transcription requires promoter, factors, polymerase, strands, bubble, transcript, and stage entities.",
      requiredEntities: [
        "promoter",
        "transcription-factors",
        "rna-polymerase-ii",
        "template-strand",
        "coding-strand",
        "transcription-bubble",
        "growing-rna-transcript",
        "initiation",
        "promoter-escape",
        "elongation",
        "termination"
      ]
    },
    {
      id: "template-and-direction-rules",
      description: "The pack must encode template-strand use and 5' -> 3' RNA synthesis.",
      requiredParameters: [
        { id: "rna-length", message: "Transcription requires an rna-length parameter." },
        { id: "rna-synthesis-direction", value: "5' -> 3'", message: "RNA synthesis must be encoded as 5' -> 3'." }
      ],
      requiredRelations: [
        { source: "rna-polymerase-ii", target: "template-strand", relation: "reads", message: "RNA polymerase II must read the template strand." },
        { source: "template-strand", target: "growing-rna-transcript", relation: "templates", message: "RNA sequence must be complementary to the template strand." },
        { source: "coding-strand", target: "growing-rna-transcript", relation: "corresponds to", message: "Coding strand must correspond to RNA except T/U." },
        { source: "rna-polymerase-ii", target: "growing-rna-transcript", relation: "synthesizes 5' -> 3'" }
      ],
      requiredClaimText: [
        {
          path: "relations",
          entityId: "coding-strand",
          includes: "except thymine is replaced by uracil",
          message: "Coding strand/RNA relation must state the T/U difference."
        }
      ],
      forbiddenVerifiedClaimPatterns: [
        {
          pattern: "rna.*synthesized.*3'? to 5'?|rna synthesis.*3'? to 5'?",
          message: "RNA synthesis 3' to 5' is unsupported."
        },
        {
          pattern: "polymerase.*reads.*coding strand|coding strand.*read by.*polymerase",
          message: "RNA polymerase reading the coding strand is unsupported for this transcription model."
        },
        {
          pattern: "rna.*identical.*template",
          message: "RNA identical to template strand is unsupported."
        }
      ]
    },
    {
      id: "schematic-transcription-limitation",
      description: "The pack must explicitly state that the animation is not molecularly exact.",
      requiredLimitations: ["molecularly exact"]
    }
  ],
  incompatibilityRules: [
    incompatibility(
      "transcription-bacterial-pol-ii",
      [
        ["bacterial"],
        ["rna polymerase ii"]
      ],
      "RNA polymerase II is eukaryotic in this model; bacterial RNA polymerase II transcription is unsupported."
    ),
    incompatibility(
      "transcription-coding-strand-read",
      [
        ["rna polymerase", "polymerase"],
        ["read", "reads", "reading"],
        ["coding strand"]
      ],
      "RNA polymerase reads the template strand, not the coding strand, in this transcription model."
    ),
    incompatibility(
      "transcription-wrong-synthesis-direction",
      [
        ["rna synthesis", "rna synthesized"],
        ["3 prime to 5 prime", "3' to 5'"]
      ],
      "RNA synthesis 3' to 5' is unsupported."
    ),
    incompatibility(
      "transcription-rna-identical-template",
      [
        ["rna"],
        ["identical"],
        ["template"]
      ],
      "RNA identical to template strand is unsupported."
    ),
    incompatibility(
      "transcription-remove-membrane",
      [
        ["remove"],
        ["membrane"],
        ["transcription"]
      ],
      "Removing a membrane from transcription is a cross-process intervention and is unsupported."
    ),
    incompatibility(
      "transcription-okazaki-fragments",
      [
        ["delete", "remove"],
        ["okazaki"],
        ["transcription"]
      ],
      "Okazaki fragments are DNA replication entities, not transcription entities."
    ),
    incompatibility(
      "transcription-copy-both-dna-strands",
      [
        ["transcription"],
        ["copy"],
        ["both"],
        ["dna strand"],
        ["dna"]
      ],
      "Transcription does not copy both DNA strands into DNA in this model."
    ),
    incompatibility(
      "transcription-template-removed",
      [
        ["transcription"],
        ["remove"],
        ["template strand"],
        ["still"],
        ["transcribe"]
      ],
      "Template-strand removal conflicts with continued transcription in this model."
    )
  ],
  promptRules: [
    {
      id: "show-transcription",
      hints: ["show transcription", "transcription"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "show-transcription-unit"
    },
    {
      id: "dna-to-rna",
      hints: ["dna copied into rna", "copied into rna", "copy dna into rna"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "explain-template-directed-rna-synthesis"
    },
    {
      id: "polymerase-motion",
      hints: ["rna polymerase moving along dna", "polymerase moving along dna", "rna polymerase ii"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "show-polymerase-motion"
    },
    {
      id: "promoter-escape",
      hints: ["promoter escape", "visualize promoter escape"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "show-promoter-escape"
    },
    {
      id: "transcription-bubble",
      hints: ["transcription bubble", "display transcription bubble"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "show-transcription-bubble",
      suggestedCommandId: "show-transcription-bubble"
    },
    {
      id: "growing-rna-transcript",
      hints: ["growing rna transcript", "display growing rna transcript"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "show-growing-rna",
      suggestedCommandId: "show-growing-rna"
    },
    {
      id: "template-strand-why",
      hints: ["only one dna strand used as template", "one dna strand used as template", "why is only one dna strand"],
      context: "eukaryotic protein-coding gene transcription",
      intent: "explain-template-choice",
      suggestedCommandId: "explain-template-choice"
    }
  ],
  commandRules: [
    {
      id: "isolate-template-strand",
      phrases: ["isolate template strand", "isolate the template strand"],
      patch: {
        isolatedEntity: "template-strand",
        selectedEntities: ["template-strand", "rna-polymerase-ii", "growing-rna-transcript"],
        activeIntervention: "isolate-template-strand"
      },
      response: "Isolated the template strand and the transcription machinery using it."
    },
    {
      id: "hide-coding-strand",
      phrases: ["hide coding strand", "hide the coding strand"],
      patch: {
        hiddenEntities: { add: ["coding-strand"] },
        activeIntervention: "hide-coding-strand"
      },
      response: "Hid the coding strand."
    },
    {
      id: "show-growing-rna",
      phrases: ["show growing rna", "show growing rna transcript"],
      patch: {
        selectedEntities: ["growing-rna-transcript"],
        activeIntervention: "show-growing-rna",
        playback: { showLabels: true }
      },
      response: "Selected the growing RNA transcript."
    },
    {
      id: "pause-at-initiation",
      phrases: ["pause at initiation"],
      patch: {
        selectedEntities: ["initiation", "promoter", "transcription-factors", "rna-polymerase-ii"],
        activeIntervention: "pause-at-initiation",
        playback: { playing: false, timelinePosition: 0 }
      },
      response: "Paused at initiation."
    },
    {
      id: "switch-to-timeline",
      phrases: ["switch to timeline", "show timeline"],
      patch: {
        representationMode: "timeline",
        activeIntervention: "switch-to-timeline"
      },
      response: "Switched to the transcription timeline."
    },
    {
      id: "show-transcription-bubble",
      phrases: ["show transcription bubble", "show the transcription bubble"],
      patch: {
        selectedEntities: ["transcription-bubble"],
        activeIntervention: "show-transcription-bubble",
        playback: { showLabels: true }
      },
      response: "Highlighted the transcription bubble."
    },
    {
      id: "explain-template-choice",
      phrases: ["why is only one dna strand used as template"],
      patch: {
        representationMode: "explanation",
        selectedEntities: ["template-strand", "coding-strand", "growing-rna-transcript"],
        activeIntervention: "explain-template-choice"
      },
      response: "Only one strand is used as template for a given transcription unit because RNA polymerase reads one strand directionally; the other strand corresponds to the RNA sequence except T/U."
    }
  ],
  scaleDistortions: [
    "Protein complexes are enlarged for selection.",
    "Transcript length and polymerase travel are normalized to the canvas.",
    "A large bubble is shown so the active template region remains inspectable."
  ],
  animation: {
    planId: "eukaryotic-transcription-scene",
    title: "Eukaryotic transcription / RNA polymerase II",
    subtitle: "Schematic, not molecularly exact",
    ariaLabel: "Eukaryotic transcription schematic with RNA polymerase II and growing RNA",
    viewBox: "0 0 920 560",
    progressDurationMs: 10000,
    isolationGroups: {
      "template-strand": ["template-strand", "rna-polymerase-ii", "transcription-bubble", "growing-rna-transcript"]
    },
    primitives: [
      {
        ...primitiveBase({
          id: "gene-axis",
          kind: "connector",
          geometryType: "line",
          semanticRole: "reference axis",
          styleToken: "guide",
          classification: "schematic",
          selectable: { enabled: false }
        }),
        geometry: { x1: 92, y1: 280, x2: 830, y2: 280 }
      },
      {
        ...primitiveBase({
          id: "promoter-region",
          entityId: "promoter",
          kind: "surface",
          geometryType: "rect",
          semanticRole: "regulatory region",
          styleToken: "surface",
          classification: "mixed",
          labels: [{ text: "promoter", at: [104, 236], visibility: { mode: "labels" } }],
          provenance: [{ sourceId: "alberts-molecular-biology-transcription", note: "Promoter assembly site." }]
        }),
        geometry: { x: 92, y: 246, width: 124, height: 68 }
      },
      {
        ...primitiveBase({
          id: "coding-strand-line",
          entityId: "coding-strand",
          kind: "strand",
          geometryType: "path",
          semanticRole: "sequence-corresponding polymer",
          styleToken: "primary",
          classification: "mixed",
          provenance: [{ sourceId: "ncbi-bookshelf-transcription", note: "Coding strand corresponds to RNA sequence." }]
        }),
        geometry: {
          d: (p) => `M96 248 C260 242 ${polymeraseX(p) - 78} 242 ${polymeraseX(p) - 26} 236 C${polymeraseX(p) + 42} 230 ${polymeraseX(p) + 104} 242 830 246`
        }
      },
      {
        ...primitiveBase({
          id: "template-strand-line",
          entityId: "template-strand",
          kind: "strand",
          geometryType: "path",
          semanticRole: "read polymer",
          styleToken: "primary",
          classification: "mixed",
          provenance: [{ sourceId: "alberts-molecular-biology-transcription", note: "Template strand is read by RNA polymerase II." }]
        }),
        geometry: {
          d: (p) => `M96 312 C260 318 ${polymeraseX(p) - 78} 318 ${polymeraseX(p) - 26} 324 C${polymeraseX(p) + 42} 330 ${polymeraseX(p) + 104} 318 830 314`
        }
      },
      {
        ...primitiveBase({
          id: "transcription-bubble-shape",
          entityId: "transcription-bubble",
          kind: "compartment",
          geometryType: "ellipse",
          semanticRole: "local open region",
          styleToken: "field",
          classification: "schematic",
          labels: [{ text: "bubble", at: [{ base: 188, progress: 440 }, 214], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "cx", parameter: "polymerase-position" }],
          provenance: [{ sourceId: "lodish-molecular-cell-biology-transcription", note: "Open transcription complex." }]
        }),
        geometry: {
          cx: { base: 200, progress: 430 },
          cy: 280,
          rx: 74,
          ry: 58
        }
      },
      {
        ...primitiveBase({
          id: "pol-ii-complex",
          entityId: "rna-polymerase-ii",
          kind: "molecular-complex",
          geometryType: "circle",
          semanticRole: "moving synthesis complex",
          styleToken: "accent",
          classification: "schematic",
          labels: [{ text: "pol II", at: [{ base: 172, progress: 430 }, 374], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "cx", parameter: "polymerase-position" }],
          provenance: [{ sourceId: "alberts-molecular-biology-transcription", note: "RNA polymerase II synthesizes messenger RNA precursors." }]
        }),
        geometry: {
          cx: { base: 200, progress: 430 },
          cy: 290,
          r: 42
        }
      },
      ...transcriptionFactorParticles(),
      {
        ...primitiveBase({
          id: "growing-rna-path",
          entityId: "growing-rna-transcript",
          kind: "strand",
          geometryType: "path",
          semanticRole: "new polymer",
          styleToken: "secondary",
          classification: "mixed",
          labels: [{ text: "growing RNA", at: [{ base: 136, progress: 300 }, 424], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "path", parameter: "rna-length" }],
          provenance: [{ sourceId: "ncbi-bookshelf-transcription", note: "RNA synthesis occurs 5' to 3'." }]
        }),
        geometry: {
          d: (p) => {
            const x = polymeraseX(p);
            const tail = Math.max(60, 80 + p * 260);
            return `M${x - 8} 322 C${x - 44} 372 ${x - tail} 386 ${x - tail - 54} 430`;
          }
        }
      },
      {
        ...primitiveBase({
          id: "rna-synthesis-arrow",
          entityId: "growing-rna-transcript",
          kind: "directional-arrow",
          geometryType: "line",
          semanticRole: "synthesis direction",
          styleToken: "primary",
          classification: "schematic",
          visibility: { mode: "directionality" },
          provenance: [{ sourceId: "ncbi-bookshelf-transcription", note: "5' to 3' RNA synthesis direction." }]
        }),
        geometry: {
          x1: { base: 116, progress: 300 },
          y1: 452,
          x2: { base: 220, progress: 300 },
          y2: 408
        }
      },
      ...directionalityLabels()
    ]
  }
};

export function validateEukaryoticTranscriptionPack() {
  const genericValidation = validateBiologicalProcessPack(eukaryoticTranscriptionPack);
  const errors = [...genericValidation.errors];

  if (!eukaryoticTranscriptionPack.parameters.some((parameterItem) => parameterItem.id === "rna-synthesis-direction" && parameterItem.value === "5' -> 3'")) {
    errors.push("Eukaryotic transcription pack must specify 5' -> 3' RNA synthesis.");
  }

  if (!relationExists("rna-polymerase-ii", "template-strand", "reads")) {
    errors.push("Eukaryotic transcription pack must encode RNA polymerase II reading the template strand.");
  }

  if (!relationExists("template-strand", "growing-rna-transcript", "templates")) {
    errors.push("Eukaryotic transcription pack must encode template-directed RNA synthesis.");
  }

  if (!relationExists("rna-polymerase-ii", "growing-rna-transcript", "synthesizes 5' -> 3'")) {
    errors.push("Eukaryotic transcription pack must encode 5' -> 3' RNA synthesis.");
  }

  if (!eukaryoticTranscriptionPack.limitations.some((limitation) => limitation.claim.includes("molecularly exact"))) {
    errors.push("Eukaryotic transcription pack must warn against molecular exactness.");
  }

  return { valid: errors.length === 0, errors };
}

function relationExists(source: string, target: string, relationLabel?: string) {
  return eukaryoticTranscriptionPack.relations.some(
    (relationItem) =>
      relationItem.source === source &&
      relationItem.target === target &&
      (!relationLabel || relationItem.relation === relationLabel)
  );
}

function polymeraseX(progress: number) {
  return 200 + progress * 430;
}

function transcriptionFactorParticles(): ScientificPrimitive[] {
  return [
    [128, 202, "TF"],
    [166, 194, "TF"],
    [204, 204, "TF"]
  ].map(([cx, cy, label], index) => ({
    ...primitiveBase({
      id: `transcription-factor-${index}`,
      entityId: "transcription-factors",
      kind: "particle",
      geometryType: "circle",
      semanticRole: "assembly factor",
      styleToken: "secondary",
      classification: "schematic",
      labels: [{ text: String(label), at: [Number(cx) - 12, Number(cy) + 6], visibility: { mode: "labels" } }],
      provenance: [{ sourceId: "lodish-molecular-cell-biology-transcription", note: "General transcription factor assembly." }]
    }),
    geometry: { cx: Number(cx), cy: Number(cy), r: 15 }
  }));
}

function directionalityLabels(): ScientificPrimitive[] {
  const labels: Array<[string, Coord, Coord, string]> = [
    ["coding-left", 98, 226, "5'"],
    ["coding-right", 832, 226, "3'"],
    ["template-left", 98, 344, "3'"],
    ["template-right", 832, 344, "5'"],
    ["rna-direction", { base: 246, progress: 300 }, 410, "RNA 5' -> 3'"]
  ];

  return labels.map(([id, x, y, text]) => ({
    ...primitiveBase({
      id,
      kind: "label",
      geometryType: "text",
      semanticRole: "direction marker",
      styleToken: "primary",
      classification: "schematic",
      visibility: { mode: "directionality" },
      selectable: { enabled: false },
      provenance: [{ sourceId: "ncbi-bookshelf-transcription", note: "Strand directionality label." }]
    }),
    geometry: { x, y, text }
  }));
}

function entity(
  id: string,
  label: string,
  aliases: string[],
  kind: ScientificEntityKind,
  description: string
): ScientificEntity {
  return {
    id,
    label,
    aliases,
    kind,
    description,
    literal: true,
    schematic: true,
    provenance: [provenance("alberts-molecular-biology-transcription", description, "direct-fact")]
  };
}

function relation(
  source: string,
  target: string,
  relationLabel: string,
  description: string
): ScientificRelation {
  return {
    id: `${source}-${relationLabel.replace(/\W+/g, "-")}-${target}`,
    source,
    target,
    relation: relationLabel,
    description,
    provenance: [provenance("ncbi-bookshelf-transcription", description, "direct-fact")]
  };
}

function state(
  id: string,
  label: string,
  order: number,
  description: string,
  activeEntities: string[]
): ScientificState {
  return {
    id,
    label,
    order,
    description,
    activeEntities,
    provenance: [provenance("lodish-molecular-cell-biology-transcription", description, "interpretation")]
  };
}

function transition(
  id: string,
  from: string,
  to: string,
  trigger: string,
  rule: string
): ScientificTransition {
  return {
    id,
    from,
    to,
    trigger,
    rule,
    provenance: [provenance("lodish-molecular-cell-biology-transcription", rule, "interpretation")]
  };
}

function parameter(
  id: string,
  label: string,
  value: ScientificParameter["value"],
  unit: string | undefined,
  description: string
): ScientificParameter {
  return {
    id,
    label,
    value,
    unit,
    description,
    provenance: [provenance("ncbi-bookshelf-transcription", description, "model-assumption")]
  };
}

function intervention(
  id: string,
  label: string,
  description: string,
  affectedEntities: string[],
  modelDelta?: ScientificModelDelta
): ScientificIntervention {
  return { id, label, description, affectedEntities, modelDelta };
}

function transcriptionCounterfactualDelta(
  id: "promoter-inaccessible" | "rna-polymerase-absent" | "initiation-factor-removed"
): ScientificModelDelta {
  if (id === "promoter-inaccessible") {
    return {
      id,
      label: "Promoter inaccessible",
      interventionId: "promoter-inaccessible",
      operations: [
        { type: "SET_ENTITY_STATE", entityId: "promoter", state: "inaccessible" },
        { type: "SET_TRANSITION_STATE", transitionId: "assemble-initiation", state: "blocked" }
      ],
      directInterventions: [
        counterfactualClaim("transcription-direct-promoter-inaccessible", "The promoter is inaccessible in the counterfactual branch.", "direct-intervention")
      ],
      predictedConsequences: [
        counterfactualClaim("transcription-predicted-initiation-blocked", "Initiation-complex assembly is blocked, so productive transcription does not begin in the schematic.", "predicted-downstream")
      ],
      unsupportedOutcomes: [
        counterfactualClaim("transcription-unsupported-chromatin-remodeling", "Chromatin remodeling or enhancer-mediated rescue is not predicted.", "unsupported-outcome")
      ]
    };
  }

  if (id === "rna-polymerase-absent") {
    return {
      id,
      label: "RNA polymerase absent",
      interventionId: "rna-polymerase-absent",
      operations: [
        { type: "SET_ENTITY_STATE", entityId: "rna-polymerase-ii", state: "absent" },
        { type: "SET_TRANSITION_STATE", transitionId: "escape-promoter", state: "blocked" },
        { type: "SET_PARAMETER", parameterId: "rna-length", value: 0 }
      ],
      directInterventions: [
        counterfactualClaim("transcription-direct-polymerase-absent", "RNA polymerase II is absent from the counterfactual branch.", "direct-intervention")
      ],
      predictedConsequences: [
        counterfactualClaim("transcription-predicted-no-rna-growth", "The RNA transcript does not grow because the polymerase is missing in this schematic.", "predicted-downstream")
      ],
      unsupportedOutcomes: [
        counterfactualClaim("transcription-unsupported-polymerase-recruitment", "Delayed recruitment, degradation, or compensation by other polymerases is not modeled.", "unsupported-outcome")
      ]
    };
  }

  return {
    id,
    label: "Initiation factor removed",
    interventionId: "initiation-factor-removed",
    operations: [
      { type: "SET_ENTITY_STATE", entityId: "transcription-factors", state: "absent" },
      { type: "SET_TRANSITION_STATE", transitionId: "assemble-initiation", state: "blocked" },
      { type: "ADD_RELATION_QUALIFIER", relationId: "transcription-factors-positions-rna-polymerase-ii", qualifier: "Counterfactual: initiation-factor support is removed." }
    ],
    directInterventions: [
      counterfactualClaim("transcription-direct-factor-removed", "The grouped initiation factor support is removed in the counterfactual branch.", "direct-intervention")
    ],
    predictedConsequences: [
      counterfactualClaim("transcription-predicted-polymerase-positioning-impaired", "RNA polymerase II positioning at the promoter is impaired in this schematic.", "predicted-downstream")
    ],
    unsupportedOutcomes: [
      counterfactualClaim("transcription-unsupported-factor-specificity", "Specific factor identities and partial-complex rescue are not modeled.", "unsupported-outcome")
    ]
  };
}

function counterfactualClaim(
  id: string,
  claimText: string,
  status: ScientificModelDelta["directInterventions"][number]["status"]
) {
  return {
    id,
    claim: claimText,
    status,
    classification: "schematic" as const
  };
}

function incompatibility(
  id: string,
  match: Array<[string, ...string[]]>,
  reason: string
) {
  return {
    id,
    reason,
    match: match.map((any) => ({ any: [...any] }))
  };
}

function claim(
  id: string,
  claimText: string,
  claimType: ScientificClaim["claimType"],
  sourceId: string
): ScientificClaim {
  return {
    id,
    claim: claimText,
    claimType,
    status: "verified",
    provenance: [provenance(sourceId, claimText, claimType)]
  };
}

function provenance(
  sourceId: string,
  supportedClaim: string,
  supportType: ScientificClaimProvenance["supportType"]
): ScientificClaimProvenance {
  const source = transcriptionSources.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Missing transcription source ${sourceId}`);
  }

  return {
    sourceId: source.id,
    title: source.title,
    authorsOrInstitution: source.authors,
    urlOrDoi: source.urlOrDoi,
    publicationType: source.publicationType,
    accessDate: source.accessDate,
    confidence: supportType === "schematic-simplification" ? 0.82 : 0.9,
    supportedClaim,
    supportType,
    claimStatus: "verified",
    license: source.license
  };
}
