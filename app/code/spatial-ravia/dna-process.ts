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
  ScientificTransition,
} from "./model.ts";
import {
  validateBiologicalProcessPack
} from "./model.ts";
import type { Coord, ScientificPrimitive } from "./primitives.ts";
import { phenomenonSpecFromBiologicalProcessPack } from "./phenomenon-adapter.ts";
import { assertValidPhenomenonSpec } from "./phenomenon-spec.ts";
import { primitiveBase } from "./primitives.ts";

const dnaSources = [
  {
    id: "alberts-essential-cell-biology",
    title: "Essential Cell Biology",
    authors: "Alberts et al.",
    locator: "DNA replication chapter",
    note: "General mechanism and enzyme roles.",
    urlOrDoi: "https://wwnorton.com/books/9780393680362",
    publicationType: "textbook" as const,
    accessDate: "2026-08-05",
    license: "Copyrighted textbook metadata; short claim-level paraphrases only."
  },
  {
    id: "ncbi-dna-replication",
    title: "Molecular Biology of the Cell / NCBI Bookshelf DNA replication overview",
    authors: "NCBI Bookshelf",
    locator: "DNA replication overview",
    note: "Reference for fork, leading and lagging synthesis, and ligase.",
    urlOrDoi: "https://www.ncbi.nlm.nih.gov/books/",
    publicationType: "database" as const,
    accessDate: "2026-08-05",
    license: "NCBI Bookshelf terms apply."
  }
];

export const dnaReplicationPack: BiologicalProcessPack = {
  id: "dna-replication",
  process: "DNA replication",
  aliases: [
    "dna copied",
    "dna copying",
    "dna replication",
    "dna duplication",
    "dna duplicated",
    "replication fork",
    "unwinding dna duplex",
    "lagging strand copied",
    "helicase opening fork",
    "ligase finish replication",
    "template strand during replication",
    "okazaki fragments",
    "bacterial dna replication"
  ],
  examples: [
    "How is DNA copied?",
    "Show a replication fork.",
    "Why are Okazaki fragments necessary?",
    "What happens without ligase?"
  ],
  biologicalContexts: [
    "general DNA replication",
    "bacterial DNA replication",
    "bacterial chromosome replication",
    "eukaryotic DNA replication",
    "eukaryotic chromosome replication"
  ],
  defaultContext: "bacterial chromosome replication",
  unsupportedMessage: "This prototype currently supports DNA replication and eukaryotic transcription.",
  entities: [
    entity("parental-strand-5to3", "Parental strand 5'->3'", ["opposite template"], "strand", "Original DNA template running 5' to 3' in the schematic."),
    entity("parental-strand-3to5", "Parental strand 3'->5'", ["template strand", "replication template strand"], "strand", "Original DNA template running 3' to 5' in the schematic."),
    entity("helicase", "Helicase", ["dna helicase"], "enzyme", "Unwinds the parental duplex at the replication fork."),
    entity("ssb", "Single-strand binding proteins", ["ssb proteins"], "protein", "Stabilize exposed single-stranded DNA."),
    entity("primase", "Primase", ["rna primase"], "enzyme", "Synthesizes short RNA primers."),
    entity("rna-primers", "RNA primers", ["primers"], "molecule", "Provide a starting 3' hydroxyl for DNA polymerase."),
    entity("dna-polymerase", "DNA polymerase", ["polymerase"], "enzyme", "Extends DNA only in the 5' to 3' direction."),
    entity("leading-strand", "Leading strand", ["continuous strand"], "strand", "New strand synthesized continuously toward the fork."),
    entity("lagging-strand", "Lagging strand", ["discontinuous strand"], "strand", "New strand synthesized discontinuously away from the fork."),
    entity("okazaki-fragments", "Okazaki fragments", ["fragments"], "fragment", "Short DNA fragments that belong to the lagging strand."),
    entity("primer-removal", "Primer removal", ["rna primer removal"], "process", "RNA primers are removed and replaced with DNA."),
    entity("ligase", "Ligase", ["dna ligase"], "enzyme", "Seals nicks between adjacent DNA fragments.")
  ],
  relations: [
    relation("helicase", "parental-strand-5to3", "unwinds", "Helicase separates the parental strands."),
    relation("helicase", "parental-strand-3to5", "unwinds", "Helicase separates the parental strands."),
    relation("ssb", "parental-strand-5to3", "stabilizes", "SSB proteins reduce reannealing of exposed templates."),
    relation("ssb", "parental-strand-3to5", "stabilizes", "SSB proteins reduce reannealing of exposed templates."),
    relation("primase", "rna-primers", "creates", "Primase lays down RNA primers."),
    relation("rna-primers", "dna-polymerase", "enables", "Polymerase requires a primer to begin extension."),
    relation("dna-polymerase", "leading-strand", "extends continuously", "Leading synthesis follows fork movement."),
    relation("dna-polymerase", "lagging-strand", "extends discontinuously", "Lagging synthesis creates fragments."),
    relation("okazaki-fragments", "lagging-strand", "compose", "Okazaki fragments belong to the lagging strand."),
    relation("primer-removal", "okazaki-fragments", "prepares for ligation", "Primer removal leaves DNA-filled fragments with nicks."),
    relation("ligase", "okazaki-fragments", "seals nicks", "Ligase joins adjacent fragments into a continuous strand.")
  ],
  states: [
    state("closed-duplex", "Closed duplex", 0, "Parental DNA is double-stranded before local unwinding.", ["parental-strand-5to3", "parental-strand-3to5"]),
    state("fork-open", "Replication fork opens", 1, "Helicase opens a fork and SSB proteins stabilize templates.", ["helicase", "ssb"]),
    state("primed", "Primers placed", 2, "Primase creates RNA primers for polymerase.", ["primase", "rna-primers"]),
    state("extension", "Strands extended", 3, "Polymerase extends leading and lagging strands 5' to 3'.", ["dna-polymerase", "leading-strand", "lagging-strand", "okazaki-fragments"]),
    state("ligation", "Fragments sealed", 4, "Primer removal and ligase complete the lagging strand.", ["primer-removal", "ligase"])
  ],
  transitions: [
    transition("open-fork", "closed-duplex", "fork-open", "helicase ATP-driven unwinding", "fork_position increases with time"),
    transition("lay-primers", "fork-open", "primed", "primase activity", "primers appear before polymerase extension"),
    transition("extend-dna", "primed", "extension", "DNA polymerase activity", "synthesis_direction is always 5' -> 3'"),
    transition("seal-fragments", "extension", "ligation", "primer removal and ligase activity", "ligase_present is required to seal remaining nicks")
  ],
  parameters: [
    parameter("fork-position", "Fork position", 0, "normalized", "Progress of the schematic replication fork."),
    parameter("fork-rate", "Fork rate", 1, "relative", "Mocked playback rate for the teaching model."),
    parameter("ligase-present", "Ligase present", true, undefined, "Whether the ligation stage can seal nicks."),
    parameter("directionality", "Synthesis direction", "5' -> 3'", undefined, "DNA polymerase extension direction."),
    parameter("template-reading-direction", "Template reading direction", "3' -> 5'", undefined, "DNA polymerase reads the template strand 3' to 5' while synthesizing 5' to 3'.")
  ],
  interventions: [
    intervention("isolate-lagging-strand", "Isolate lagging strand", "Dim all entities except the lagging-strand path.", ["lagging-strand", "okazaki-fragments", "rna-primers"]),
    intervention("hide-leading-strand", "Hide leading strand", "Remove the continuous leading-strand path.", ["leading-strand"]),
    intervention("show-rna-primers", "Show RNA primers", "Reveal primer segments on the lagging strand.", ["rna-primers"]),
    intervention("hide-helicase", "Hide helicase", "Hide helicase from the schematic view.", ["helicase"]),
    intervention("remove-ligase", "Remove ligase", "Show unresolved nicks between Okazaki fragments.", ["ligase", "okazaki-fragments"], dnaCounterfactualDelta("ligase-absent")),
    intervention("compare-no-ligase", "Compare normal vs no ligase", "Render baseline and no-ligase outcome together.", ["ligase", "okazaki-fragments"], dnaCounterfactualDelta("ligase-absent")),
    intervention("helicase-stopped", "Helicase stopped", "Stop fork opening before strand extension can proceed.", ["helicase", "parental-strand-5to3", "parental-strand-3to5"], dnaCounterfactualDelta("helicase-stopped")),
    intervention("primer-formation-disabled", "Primer formation disabled", "Disable RNA primer formation before polymerase extension.", ["primase", "rna-primers", "dna-polymerase"], dnaCounterfactualDelta("primer-formation-disabled")),
    intervention("explain-okazaki", "Explain Okazaki fragments", "Focus the model on lagging-strand discontinuity.", ["lagging-strand", "okazaki-fragments"])
  ],
  representationRules: [
    claim("dna-rule-schematic", "Use a schematic fork, not molecular geometry.", "schematic-simplification", "ncbi-dna-replication"),
    claim("dna-rule-directionality", "Show 5' and 3' directionality when explaining strand asymmetry.", "interpretation", "ncbi-dna-replication"),
    claim("dna-rule-fragments", "Use fragmented lagging synthesis to explain why Okazaki fragments are necessary.", "interpretation", "ncbi-dna-replication"),
    claim("dna-rule-ligase", "When ligase is removed, keep fragments visible and show unresolved nicks.", "interpretation", "ncbi-dna-replication")
  ],
  commonMisconceptions: [
    claim("dna-misconception-direction", "DNA polymerase does not synthesize in both directions.", "direct-fact", "ncbi-dna-replication"),
    claim("dna-misconception-okazaki", "Okazaki fragments are not part of the leading strand.", "direct-fact", "ncbi-dna-replication"),
    claim("dna-misconception-ligase", "Ligase does not synthesize most of the new DNA.", "direct-fact", "ncbi-dna-replication"),
    claim("dna-misconception-schematic", "The schematic animation is not molecularly exact.", "schematic-simplification", "ncbi-dna-replication")
  ],
  validationRules: [
    {
      id: "required-replication-entities",
      description: "DNA replication requires the core template, enzyme, strand, fragment, primer, and ligation entities.",
      requiredEntities: [
        "parental-strand-5to3",
        "parental-strand-3to5",
        "helicase",
        "ssb",
        "primase",
        "rna-primers",
        "dna-polymerase",
        "leading-strand",
        "lagging-strand",
        "okazaki-fragments",
        "primer-removal",
        "ligase"
      ]
    },
    {
      id: "directionality-and-strand-rules",
      description: "The pack must encode 5' -> 3' synthesis, continuous leading synthesis, and discontinuous lagging synthesis.",
      requiredParameters: [
        { id: "fork-position", message: "DNA replication requires a fork-position parameter." },
        { id: "ligase-present", message: "DNA replication counterfactuals require a ligase-present parameter." },
        { id: "directionality", value: "5' -> 3'", message: "DNA synthesis must be encoded as 5' -> 3'." },
        { id: "template-reading-direction", value: "3' -> 5'", message: "Template reading must be encoded as 3' -> 5'." }
      ],
      requiredRelations: [
        {
          source: "dna-polymerase",
          target: "leading-strand",
          relation: "extends continuously",
          message: "Leading-strand synthesis must be continuous."
        },
        {
          source: "dna-polymerase",
          target: "lagging-strand",
          relation: "extends discontinuously",
          message: "Lagging-strand synthesis must be discontinuous."
        },
        {
          source: "okazaki-fragments",
          target: "lagging-strand",
          message: "Okazaki fragments must occur on the lagging strand."
        },
        {
          source: "ligase",
          target: "okazaki-fragments",
          relation: "seals nicks",
          message: "Ligase must seal nicks."
        }
      ],
      requiredStageOrder: [
        { before: "primed", after: "extension", message: "Primers must precede DNA extension." }
      ],
      requiredClaimText: [
        {
          path: "relations",
          entityId: "ligase",
          includes: "seals nicks",
          message: "Ligase must not be represented as synthesizing DNA fragments."
        }
      ],
      forbiddenClaimText: [
        {
          path: "relations",
          entityId: "ligase",
          includes: "ligase synthesizes",
          message: "Ligase must not be represented as synthesizing DNA fragments."
        }
      ],
      forbiddenVerifiedClaimPatterns: [
        {
          pattern: "dna polymerase synthesizes.*3'? to 5'?|dna synthesis.*3'? to 5'?",
          message: "DNA polymerase synthesis direction claim is unsupported."
        },
        {
          pattern: "template reading direction\\s+5'? (?:->|to) 3'?|reads? (?:the )?template strand 5'? (?:->|to) 3'?",
          message: "DNA template reading direction claim is unsupported."
        },
        {
          pattern: "leading.*discontinuous",
          message: "Leading-strand discontinuous synthesis claim is unsupported."
        },
        {
          pattern: "lagging.*continuous",
          message: "Lagging-strand continuous synthesis claim is unsupported."
        },
        {
          pattern: "okazaki.*leading",
          message: "Okazaki fragments on the leading strand is unsupported."
        },
        {
          pattern: "ligase.*synthesizes.*fragment|ligase.*synthesize.*fragment",
          message: "Ligase synthesizing fragments is unsupported."
        }
      ]
    },
    {
      id: "schematic-limitation",
      description: "The pack must explicitly state that the animation is not molecularly exact.",
      requiredLimitations: ["molecularly exact"]
    }
  ],
  incompatibilityRules: [
    incompatibility(
      "dna-rna-polymerase-ii-replication-fork",
      [
        ["rna polymerase ii", "polymerase ii", "pol ii"],
        ["replication fork", "dna replication", "fork"]
      ],
      "RNA polymerase II belongs to the eukaryotic transcription pack, not the DNA replication-fork model."
    ),
    incompatibility(
      "dna-ligase-synthesis",
      [
        ["ligase"],
        ["synthesize", "synthesizes", "synthesizing", "copy"],
        ["okazaki", "fragment", "leading strand"]
      ],
      "DNA ligase seals nicks; it does not synthesize fragments or copy strands in this model."
    ),
    incompatibility(
      "dna-rna-polymerase-conflict",
      [
        ["dna replication"],
        ["rna polymerase ii"]
      ],
      "DNA replication and RNA polymerase II transcription are distinct process packs; the request is conflicting."
    ),
    incompatibility(
      "dna-rna-polymerase-together",
      [
        ["dna"],
        ["rna polymerase"],
        ["together"]
      ],
      "The request mixes DNA replication and RNA polymerase processes and needs clarification."
    ),
    incompatibility(
      "dna-block-rna-polymerase",
      [
        ["block", "remove", "delete"],
        ["rna polymerase ii"],
        ["dna replication"]
      ],
      "RNA polymerase II is not an intervention target for DNA replication in this model."
    ),
    incompatibility(
      "dna-wrong-synthesis-direction",
      [
        ["dna synthesis"],
        ["3 prime to 5 prime", "3' to 5'"]
      ],
      "DNA polymerase synthesis direction claim is unsupported."
    ),
    incompatibility(
      "dna-template-reading-direction",
      [
        ["template reading direction", "read template strand", "reads template strand"],
        ["5 prime to 3 prime", "5' to 3'"]
      ],
      "DNA template reading direction claim is unsupported."
    ),
    incompatibility(
      "dna-leading-discontinuous",
      [
        ["leading strand"],
        ["discontinuous"]
      ],
      "Leading-strand discontinuous synthesis claim is unsupported."
    ),
    incompatibility(
      "dna-lagging-continuous",
      [
        ["lagging strand"],
        ["continuous"]
      ],
      "Lagging-strand continuous synthesis claim is unsupported."
    ),
    incompatibility(
      "dna-okazaki-leading",
      [
        ["okazaki"],
        ["leading strand"]
      ],
      "Okazaki fragments on the leading strand is unsupported."
    ),
    incompatibility(
      "dna-normal-without-polymerase",
      [
        ["dna replication"],
        ["without dna polymerase"],
        ["normal"]
      ],
      "DNA replication cannot keep normal synthesis while removing DNA polymerase in this model."
    ),
    incompatibility(
      "dna-potassium-seals-nicks",
      [
        ["potassium channel"],
        ["seal"],
        ["dna nick"]
      ],
      "Potassium channels are action-potential components, not DNA ligases."
    ),
    incompatibility(
      "dna-ligase-transcribes-rna",
      [
        ["ligase"],
        ["transcribe"],
        ["rna"]
      ],
      "Ligase does not transcribe RNA in this model."
    ),
    incompatibility(
      "dna-invent-pdb",
      [
        ["invent", "exact replication fork"],
        ["pdb"]
      ],
      "The system must not invent PDB structures for uncurated exact molecular scenes."
    )
  ],
  assumptions: [
    claim("dna-assumption-one-fork", "One replication fork is shown.", "model-assumption", "ncbi-dna-replication"),
    claim("dna-assumption-mocked-time", "Timing and distances are mocked for clarity.", "model-assumption", "ncbi-dna-replication"),
    claim("dna-assumption-shared-core", "Bacterial and eukaryotic contexts share the simplified core mechanism here.", "interpretation", "alberts-essential-cell-biology"),
    claim("dna-assumption-shapes", "Protein complexes are represented as labels and simple shapes.", "schematic-simplification", "ncbi-dna-replication")
  ],
  limitations: [
    claim("dna-limitation-atomistic", "Not atomistic or sequence-specific.", "schematic-simplification", "ncbi-dna-replication"),
    claim("dna-limitation-kinetic", "Not a kinetic simulation.", "schematic-simplification", "ncbi-dna-replication"),
    claim("dna-limitation-stoichiometry", "Does not model full replisome stoichiometry.", "schematic-simplification", "alberts-essential-cell-biology"),
    claim("dna-limitation-molecularly-exact", "Schematic motion must not be described as molecularly exact.", "schematic-simplification", "ncbi-dna-replication")
  ],
  scaleDistortions: [
    "Enzymes are drawn larger than DNA for selection.",
    "Fork travel and fragment length are normalized to fit the canvas.",
    "Molecular collisions and thermal motion are omitted."
  ],
  sources: dnaSources,
  promptRules: [
    {
      id: "dna-copying",
      hints: ["dna copied", "dna copy", "lagging strand copied"],
      context: "general DNA replication",
      intent: "show-replication-fork"
    },
    {
      id: "replication-fork",
      hints: ["dna replication", "replication fork", "helicase opening fork", "helicase opening dna", "helicase open fork", "helicase unwinding dna duplex", "unwinding dna duplex"],
      context: "general DNA replication",
      intent: "show-replication-fork"
    },
    {
      id: "replication-template-strand",
      hints: ["template strand during replication", "template strand replication"],
      context: "general DNA replication",
      intent: "show-template-strand"
    },
    {
      id: "okazaki-why",
      hints: ["okazaki"],
      context: "general DNA replication",
      intent: "explain-lagging-strand"
    },
    {
      id: "bacterial-replication",
      hints: ["bacterial dna replication"],
      context: "bacterial DNA replication",
      intent: "show-replication-fork"
    },
    {
      id: "eukaryotic-replication",
      hints: ["eukaryotic dna replication"],
      context: "eukaryotic DNA replication",
      intent: "show-replication-fork"
    },
    {
      id: "without-ligase",
      hints: ["without ligase", "no ligase", "ligase finish replication", "ligase finishes replication"],
      context: "general DNA replication",
      intent: "compare-no-ligase",
      suggestedCommandId: "compare-no-ligase"
    }
  ],
  commandRules: [
    {
      id: "isolate-lagging-strand",
      phrases: ["isolate the lagging strand", "isolate lagging strand"],
      patch: {
        isolatedEntity: "lagging-strand",
        selectedEntities: ["lagging-strand", "okazaki-fragments"],
        activeIntervention: "isolate-lagging-strand"
      },
      response: "Isolated the lagging strand and its fragments."
    },
    {
      id: "hide-leading-strand",
      phrases: ["hide the leading strand", "hide leading strand"],
      patch: {
        hiddenEntities: { add: ["leading-strand"] },
        activeIntervention: "hide-leading-strand"
      },
      response: "Hid the leading strand."
    },
    {
      id: "hide-helicase",
      phrases: ["hide helicase", "hide the helicase"],
      patch: {
        hiddenEntities: { add: ["helicase"] },
        activeIntervention: "hide-helicase"
      },
      response: "Hid helicase."
    },
    {
      id: "show-rna-primers",
      phrases: ["show rna primers", "show primers"],
      patch: {
        hiddenEntities: { remove: ["rna-primers"] },
        selectedEntities: ["rna-primers"],
        activeIntervention: "show-rna-primers"
      },
      response: "RNA primers are visible."
    },
    {
      id: "remove-ligase",
      phrases: ["remove ligase"],
      patch: {
        hiddenEntities: { add: ["ligase"] },
        activeIntervention: "remove-ligase"
      },
      response: "Removed ligase; nicks remain unresolved."
    },
    {
      id: "pause",
      phrases: ["pause"],
      patch: { playback: { playing: false }, activeIntervention: "pause" },
      response: "Playback paused."
    },
    {
      id: "slow-down",
      phrases: ["slow down"],
      patch: { playback: { speed: 0.5 }, activeIntervention: "slow-down" },
      response: "Playback speed reduced."
    },
    {
      id: "restart",
      phrases: ["restart"],
      patch: {
        hiddenEntities: { reset: true },
        isolatedEntity: null,
        selectedEntities: [],
        playback: { reset: true, playing: true },
        activeIntervention: "restart"
      },
      response: "Restarted the current model."
    },
    {
      id: "show-directionality",
      phrases: ["show 5' and 3' ends", "show directionality"],
      patch: {
        playback: { showDirectionality: true },
        activeIntervention: "show-directionality"
      },
      response: "Directionality labels are visible."
    },
    {
      id: "compare-no-ligase",
      phrases: ["compare normal replication with no ligase", "compare normal vs no ligase"],
      patch: {
        activeIntervention: "compare-no-ligase",
        representationMode: "scene"
      },
      response: "Comparing baseline replication with a no-ligase intervention."
    },
    {
      id: "show-timeline",
      phrases: ["show timeline"],
      patch: {
        representationMode: "timeline",
        activeIntervention: "show-timeline"
      },
      response: "Switched to the process timeline."
    },
    {
      id: "show-process-graph",
      phrases: ["show process graph"],
      patch: {
        representationMode: "graph",
        activeIntervention: "show-process-graph"
      },
      response: "Switched to the process graph."
    },
    {
      id: "explain-okazaki",
      phrases: ["explain why okazaki fragments are necessary"],
      patch: {
        representationMode: "explanation",
        selectedEntities: ["lagging-strand", "okazaki-fragments"],
        activeIntervention: "explain-okazaki"
      },
      response: "Okazaki fragments are necessary because polymerase extends only 5' to 3' while the lagging template is exposed opposite fork movement."
    }
  ],
  animation: {
    planId: "dna-replication-fork-scene",
    title: "DNA replication / replication fork",
    subtitle: "Schematic, not molecularly exact",
    ariaLabel: "DNA replication fork schematic",
    viewBox: "0 0 920 560",
    progressDurationMs: 11000,
    isolationGroups: {
      "lagging-strand": ["lagging-strand", "okazaki-fragments", "rna-primers"]
    },
    primitives: [
      {
        ...primitiveBase({
          id: "guide-top",
          kind: "connector",
          geometryType: "path",
          semanticRole: "template guide",
          styleToken: "guide",
          classification: "schematic",
          selectable: { enabled: false }
        }),
        geometry: { d: () => "M108 280 C232 222 360 226 470 280" }
      },
      {
        ...primitiveBase({
          id: "guide-bottom",
          kind: "connector",
          geometryType: "path",
          semanticRole: "template guide",
          styleToken: "guide",
          classification: "schematic",
          selectable: { enabled: false }
        }),
        geometry: { d: () => "M108 280 C232 338 360 334 470 280" }
      },
      {
        ...primitiveBase({
          id: "parental-top",
          entityId: "parental-strand-5to3",
          kind: "strand",
          geometryType: "path",
          semanticRole: "template polymer",
          styleToken: "primary",
          labels: [{ text: "template 5'->3'", at: [132, 246], visibility: { mode: "labels" } }],
          classification: "mixed",
          animationBindings: [{ property: "path", parameter: "fork-position" }],
          provenance: [{ sourceId: "alberts-essential-cell-biology", note: "Template strand role." }]
        }),
        geometry: {
          d: (p) => {
            const x = forkX(p);
            return `M112 280 C230 224 ${x - 70} 222 ${x} 214 C650 186 738 142 820 92`;
          }
        }
      },
      {
        ...primitiveBase({
          id: "parental-bottom",
          entityId: "parental-strand-3to5",
          kind: "strand",
          geometryType: "path",
          semanticRole: "template polymer",
          styleToken: "primary",
          labels: [{ text: "template 3'->5'", at: [132, 350], visibility: { mode: "labels" } }],
          classification: "mixed",
          animationBindings: [{ property: "path", parameter: "fork-position" }],
          provenance: [{ sourceId: "alberts-essential-cell-biology", note: "Template strand role." }]
        }),
        geometry: {
          d: (p) => {
            const x = forkX(p);
            return `M112 280 C230 336 ${x - 70} 338 ${x} 346 C650 374 738 418 820 468`;
          }
        }
      },
      {
        ...primitiveBase({
          id: "leading-path",
          entityId: "leading-strand",
          kind: "strand",
          geometryType: "path",
          semanticRole: "new polymer",
          styleToken: "secondary",
          classification: "mixed",
          animationBindings: [{ property: "path", parameter: "fork-position" }],
          provenance: [{ sourceId: "ncbi-dna-replication", note: "Continuous synthesis role." }]
        }),
        geometry: {
          d: (p) => {
            const x = forkX(p);
            return `M130 296 C260 322 ${x - 110} 324 ${x - 24} 342`;
          }
        }
      },
      ...laggingPaths(),
      ...primerLines(),
      ...fragmentRects(),
      ...ssbParticles(),
      {
        ...primitiveBase({
          id: "helicase-symbol",
          entityId: "helicase",
          kind: "molecular-complex",
          geometryType: "polygon",
          semanticRole: "process complex",
          styleToken: "accent",
          classification: "schematic",
          labels: [{ text: "helicase", at: [{ base: 270 + 56, progress: 310 }, 284], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "points", parameter: "fork-position" }],
          provenance: [{ sourceId: "alberts-essential-cell-biology", note: "Unwinding enzyme role." }]
        }),
        geometry: {
          points: [
            [{ base: 270 - 28, progress: 310 }, 280],
            [{ base: 270 + 4, progress: 310 }, 244],
            [{ base: 270 + 46, progress: 310 }, 280],
            [{ base: 270 + 4, progress: 310 }, 316]
          ]
        }
      },
      {
        ...primitiveBase({
          id: "primase-symbol",
          entityId: "primase",
          kind: "molecular-complex",
          geometryType: "rect",
          semanticRole: "process complex",
          styleToken: "accent",
          classification: "schematic",
          labels: [{ text: "primase", at: [{ base: 270 - 130, progress: 310 }, 204], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "x", parameter: "fork-position" }],
          provenance: [{ sourceId: "alberts-essential-cell-biology", note: "Primer synthesis enzyme role." }]
        }),
        geometry: {
          x: { base: 270 - 92, progress: 310 },
          y: 210,
          width: 34,
          height: 24
        }
      },
      {
        ...primitiveBase({
          id: "polymerase-leading",
          entityId: "dna-polymerase",
          kind: "molecular-complex",
          geometryType: "circle",
          semanticRole: "process complex",
          styleToken: "accent",
          classification: "schematic",
          labels: [{ text: "polymerase", at: [{ base: 270 - 24, progress: 310 }, 382], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "cx", parameter: "fork-position" }],
          provenance: [{ sourceId: "ncbi-dna-replication", note: "Polymer extension role." }]
        }),
        geometry: { cx: { base: 270 - 42, progress: 310 }, cy: 342, r: 22 }
      },
      {
        ...primitiveBase({
          id: "polymerase-lagging",
          entityId: "dna-polymerase",
          kind: "molecular-complex",
          geometryType: "circle",
          semanticRole: "process complex",
          styleToken: "accent",
          classification: "schematic",
          animationBindings: [{ property: "cx", parameter: "fork-position" }],
          provenance: [{ sourceId: "ncbi-dna-replication", note: "Polymer extension role." }]
        }),
        geometry: { cx: { base: 270 - 84, progress: 310 }, cy: 238, r: 18 }
      },
      {
        ...primitiveBase({
          id: "ligase-symbol",
          entityId: "ligase",
          kind: "molecular-complex",
          geometryType: "rect",
          semanticRole: "process complex",
          styleToken: "accent",
          classification: "schematic",
          labels: [{ text: "ligase", at: [{ base: 270 - 354, progress: 310 }, 330], visibility: { mode: "labels" } }],
          animationBindings: [{ property: "x", parameter: "fork-position" }],
          provenance: [{ sourceId: "ncbi-dna-replication", note: "Ligation role." }]
        }),
        geometry: {
          x: { base: 270 - 326, progress: 310 },
          y: 270,
          width: 28,
          height: 28
        }
      },
      ...directionalityLabels(),
      ...comparisonElements()
    ]
  }
};

export function validateDnaReplicationPack() {
  const genericValidation = validateBiologicalProcessPack(dnaReplicationPack);
  const errors = [...genericValidation.errors];

  if (!dnaReplicationPack.parameters.some((parameterItem) => parameterItem.id === "directionality" && parameterItem.value === "5' -> 3'")) {
    errors.push("DNA replication pack must specify 5' -> 3' synthesis.");
  }

  if (!relationExists("dna-polymerase", "leading-strand", "extends continuously")) {
    errors.push("DNA replication pack must encode continuous leading-strand synthesis.");
  }

  if (!relationExists("dna-polymerase", "lagging-strand", "extends discontinuously")) {
    errors.push("DNA replication pack must encode discontinuous lagging-strand synthesis.");
  }

  if (!relationExists("okazaki-fragments", "lagging-strand")) {
    errors.push("DNA replication pack must encode Okazaki fragments as lagging-strand components.");
  }

  if (!relationExists("ligase", "okazaki-fragments", "seals nicks")) {
    errors.push("DNA replication pack must encode ligase sealing nicks.");
  }

  if (!dnaReplicationPack.limitations.some((limitation) => limitation.claim.includes("molecularly exact"))) {
    errors.push("DNA replication pack must warn against molecular exactness.");
  }

  return { valid: errors.length === 0, errors };
}

export const dnaReplicationPhenomenonSpec = phenomenonSpecFromBiologicalProcessPack(dnaReplicationPack);
dnaReplicationPack.phenomenonSpec = dnaReplicationPhenomenonSpec;

if (process.env.NODE_ENV !== "production") {
  assertValidPhenomenonSpec(dnaReplicationPhenomenonSpec);
}

function relationExists(source: string, target: string, relationLabel?: string) {
  return dnaReplicationPack.relations.some(
    (relationItem) =>
      relationItem.source === source &&
      relationItem.target === target &&
      (!relationLabel || relationItem.relation === relationLabel)
  );
}

function forkX(progress: number) {
  return 270 + progress * 310;
}

function laggingPaths(): ScientificPrimitive[] {
  return [0, 1, 2].map((index) => ({
    ...primitiveBase({
      id: `lagging-path-${index}`,
      entityId: "lagging-strand",
      kind: "strand",
      geometryType: "path",
      semanticRole: "new polymer segment",
      styleToken: "secondary",
      classification: "mixed",
      animationBindings: [{ property: "path", parameter: "fork-position" }],
      provenance: [{ sourceId: "ncbi-dna-replication", note: "Discontinuous synthesis role." }]
    }),
    geometry: {
      d: (p: number) => {
        const x = forkX(p);
        const offsets = [
          [-44, 228, -96, 236, -140, 254, -186, 270],
          [-138, 252, -190, 264, -234, 276, -282, 288],
          [-238, 276, -288, 288, -332, 298, -372, 306]
        ][index];
        return `M${x + offsets[0]} ${offsets[1]} C${x + offsets[2]} ${offsets[3]} ${x + offsets[4]} ${offsets[5]} ${x + offsets[6]} ${offsets[7]}`;
      }
    }
  }));
}

function primerLines(): ScientificPrimitive[] {
  return [
    [-54, 229, -26, 223],
    [-150, 254, -122, 248],
    [-252, 278, -224, 272]
  ].map((line, index) => ({
    ...primitiveBase({
      id: `primer-line-${index}`,
      entityId: "rna-primers",
      kind: "connector",
      geometryType: "line",
      semanticRole: "short polymer marker",
      styleToken: "warning",
      classification: "schematic",
      animationBindings: [{ property: "x1", parameter: "fork-position" }],
      provenance: [{ sourceId: "alberts-essential-cell-biology", note: "Primer role." }]
    }),
    geometry: {
      x1: { base: 270 + line[0], progress: 310 },
      y1: line[1],
      x2: { base: 270 + line[2], progress: 310 },
      y2: line[3]
    }
  }));
}

function fragmentRects(): ScientificPrimitive[] {
  return [
    [-190, 267, 54, 8],
    [-288, 290, 62, 8],
    [-372, 309, 48, 8]
  ].map((rect, index) => ({
    ...primitiveBase({
      id: `fragment-rect-${index}`,
      entityId: "okazaki-fragments",
      kind: "surface",
      geometryType: "rect",
      semanticRole: "segment marker",
      styleToken: "surface",
      classification: "schematic",
      animationBindings: [{ property: "x", parameter: "fork-position" }],
      provenance: [{ sourceId: "ncbi-dna-replication", note: "Fragment role." }]
    }),
    geometry: {
      x: { base: 270 + rect[0], progress: 310 },
      y: rect[1],
      width: rect[2],
      height: rect[3]
    }
  }));
}

function ssbParticles(): ScientificPrimitive[] {
  return [
    [72, 190],
    [103, 176],
    [74, 370],
    [104, 386]
  ].map((circle, index) => ({
    ...primitiveBase({
      id: `ssb-circle-${index}`,
      entityId: "ssb",
      kind: "particle",
      geometryType: "circle",
      semanticRole: "stabilizing particle",
      styleToken: "secondary",
      classification: "schematic",
      animationBindings: [{ property: "cx", parameter: "fork-position" }],
      provenance: [{ sourceId: "alberts-essential-cell-biology", note: "Single-strand binding role." }]
    }),
    geometry: {
      cx: { base: 270 + circle[0], progress: 310 },
      cy: circle[1],
      r: 9
    }
  }));
}

function directionalityLabels(): ScientificPrimitive[] {
  const labels: Array<[string, Coord, Coord, string]> = [
    ["direction-left-top", 88, 250, "5'"],
    ["direction-right-top", 812, 76, "3'"],
    ["direction-left-bottom", 88, 328, "3'"],
    ["direction-right-bottom", 812, 494, "5'"],
    ["direction-synthesis", { base: 270 + 18, progress: 310 }, 414, "5' -> 3'"]
  ];

  return labels.map(([id, x, y, text]) => ({
    ...primitiveBase({
      id: String(id),
      kind: "label",
      geometryType: "text",
      semanticRole: "direction marker",
      styleToken: "primary",
      classification: "schematic",
      visibility: { mode: "directionality" },
      selectable: { enabled: false },
      provenance: [{ sourceId: "ncbi-dna-replication", note: "Directionality label." }]
    }),
    geometry: { x, y, text: String(text) }
  }));
}

function comparisonElements(): ScientificPrimitive[] {
  return [
    {
      ...comparisonBase("comparison-main", "intervention comparison marker"),
      kind: "connector" as const,
      geometryType: "line" as const,
      geometry: { x1: 642, y1: 150, x2: 824, y2: 150 }
    },
    {
      ...comparisonBase("comparison-gap-a", "intervention gap marker"),
      kind: "connector" as const,
      geometryType: "line" as const,
      geometry: { x1: 662, y1: 180, x2: 710, y2: 180 }
    },
    {
      ...comparisonBase("comparison-gap-b", "intervention gap marker"),
      kind: "connector" as const,
      geometryType: "line" as const,
      geometry: { x1: 730, y1: 180, x2: 778, y2: 180 }
    },
    {
      ...comparisonBase("comparison-label", "intervention annotation"),
      kind: "annotation" as const,
      geometryType: "text" as const,
      geometry: { x: 642, y: 128, text: "no ligase: nicks remain" }
    }
  ];
}

function comparisonBase(id: string, semanticRole: string) {
  return primitiveBase({
    id,
    kind: "connector",
    geometryType: "line",
    semanticRole,
    styleToken: "warning",
    classification: "schematic",
    visibility: {
      mode: "intervention",
      interventions: ["compare-no-ligase", "remove-ligase"]
    },
    selectable: { enabled: false },
    provenance: [{ sourceId: "ncbi-dna-replication", note: "Intervention comparison schematic." }]
  });
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
    provenance: [provenance("alberts-essential-cell-biology", description, "direct-fact")]
  };
}

function relation(
  source: string,
  target: string,
  relationLabel: string,
  description: string
): ScientificRelation {
  return {
    id: `${source}-${relationLabel.replaceAll(" ", "-")}-${target}`,
    source,
    target,
    relation: relationLabel,
    description,
    provenance: [provenance("ncbi-dna-replication", description, "direct-fact")]
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
    provenance: [provenance("ncbi-dna-replication", description, "interpretation")]
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
    provenance: [provenance("ncbi-dna-replication", rule, "interpretation")]
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
    provenance: [provenance("ncbi-dna-replication", description, "model-assumption")]
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

function dnaCounterfactualDelta(
  id: "ligase-absent" | "helicase-stopped" | "primer-formation-disabled"
): ScientificModelDelta {
  if (id === "ligase-absent") {
    return {
      id,
      label: "Ligase absent",
      interventionId: "remove-ligase",
      operations: [
        { type: "SET_PARAMETER", parameterId: "ligase-present", value: false },
        { type: "SET_ENTITY_STATE", entityId: "ligase", state: "absent" },
        { type: "SET_TRANSITION_STATE", transitionId: "seal-fragments", state: "blocked" }
      ],
      directInterventions: [
        counterfactualClaim("dna-direct-ligase-absent", "Ligase is absent from the counterfactual branch.", "direct-intervention")
      ],
      predictedConsequences: [
        counterfactualClaim("dna-predicted-unsealed-nicks", "Okazaki fragments remain separated by unresolved nicks in this schematic model.", "predicted-downstream")
      ],
      unsupportedOutcomes: [
        counterfactualClaim("dna-unsupported-cell-fate", "Cell viability, checkpoint behavior, and repair pathway outcomes are not predicted by this prototype.", "unsupported-outcome")
      ]
    };
  }

  if (id === "helicase-stopped") {
    return {
      id,
      label: "Helicase stopped",
      interventionId: "helicase-stopped",
      operations: [
        { type: "SET_ENTITY_STATE", entityId: "helicase", state: "stopped" },
        { type: "SET_TRANSITION_STATE", transitionId: "open-fork", state: "blocked" },
        { type: "SET_PARAMETER", parameterId: "fork-rate", value: 0 }
      ],
      directInterventions: [
        counterfactualClaim("dna-direct-helicase-stopped", "Helicase unwinding is stopped in the counterfactual branch.", "direct-intervention")
      ],
      predictedConsequences: [
        counterfactualClaim("dna-predicted-fork-stalls", "Fork opening stalls, limiting downstream primer placement and strand extension in the schematic.", "predicted-downstream")
      ],
      unsupportedOutcomes: [
        counterfactualClaim("dna-unsupported-collapse-repair", "Replication-fork collapse or repair pathway choice is outside this model.", "unsupported-outcome")
      ]
    };
  }

  return {
    id,
    label: "Primer formation disabled",
    interventionId: "primer-formation-disabled",
    operations: [
      { type: "SET_ENTITY_STATE", entityId: "rna-primers", state: "disabled" },
      { type: "SET_TRANSITION_STATE", transitionId: "lay-primers", state: "blocked" },
      { type: "ADD_RELATION_QUALIFIER", relationId: "rna-primers-enables-dna-polymerase", qualifier: "Counterfactual: primer availability is disabled." }
    ],
    directInterventions: [
      counterfactualClaim("dna-direct-primers-disabled", "RNA primer formation is disabled in the counterfactual branch.", "direct-intervention")
    ],
    predictedConsequences: [
      counterfactualClaim("dna-predicted-extension-blocked", "DNA polymerase cannot initiate new extension events without primers in this schematic.", "predicted-downstream")
    ],
    unsupportedOutcomes: [
      counterfactualClaim("dna-unsupported-alternative-priming", "Alternative priming or rescue mechanisms are not modeled.", "unsupported-outcome")
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
  const source = dnaSources.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Missing DNA source ${sourceId}`);
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
