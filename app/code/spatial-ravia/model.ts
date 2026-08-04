export type ScientificEntityKind =
  | "molecule"
  | "enzyme"
  | "protein"
  | "strand"
  | "fragment"
  | "process";

export type RepresentationMode =
  | "scene"
  | "timeline"
  | "graph"
  | "explanation"
  | "json";

export type PlaybackState = {
  playing: boolean;
  speed: number;
  timelinePosition: number;
  showLabels: boolean;
  showDirectionality: boolean;
};

export type ScientificEntity = {
  id: string;
  label: string;
  aliases: string[];
  kind: ScientificEntityKind;
  description: string;
  literal: boolean;
  schematic: boolean;
};

export type ScientificRelation = {
  id: string;
  source: string;
  target: string;
  relation: string;
  description: string;
};

export type ScientificState = {
  id: string;
  label: string;
  order: number;
  description: string;
  activeEntities: string[];
};

export type ScientificTransition = {
  id: string;
  from: string;
  to: string;
  trigger: string;
  rule: string;
};

export type ScientificParameter = {
  id: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  description: string;
};

export type ScientificIntervention = {
  id: string;
  label: string;
  description: string;
  affectedEntities: string[];
};

export type ScientificSource = {
  id: string;
  title: string;
  authors: string;
  locator: string;
  note: string;
};

export type BiologicalProcessPack = {
  id: string;
  process: string;
  aliases: string[];
  biologicalContexts: string[];
  entities: ScientificEntity[];
  relations: ScientificRelation[];
  states: ScientificState[];
  transitions: ScientificTransition[];
  parameters: ScientificParameter[];
  interventions: ScientificIntervention[];
  representationRules: string[];
  commonMisconceptions: string[];
  assumptions: string[];
  limitations: string[];
  sources: ScientificSource[];
};

export type ScientificModel = {
  process: string;
  aliases: string[];
  biologicalContext: string;
  entities: ScientificEntity[];
  relations: ScientificRelation[];
  states: ScientificState[];
  transitions: ScientificTransition[];
  parameters: ScientificParameter[];
  interventions: ScientificIntervention[];
  assumptions: string[];
  limitations: string[];
  sources: ScientificSource[];
  representationChoice: RepresentationMode;
  literalElements: string[];
  schematicElements: string[];
  scaleDistortions: string[];
};

export type SpatialPromptResult =
  | {
      supported: true;
      prompt: string;
      intent: string;
      context: string;
      model: ScientificModel;
      suggestedIntervention?: string;
    }
  | {
      supported: false;
      prompt: string;
      reason: string;
    };

export type SpatialSessionState = {
  currentPrompt: string;
  activeModel: ScientificModel | null;
  selectedEntities: string[];
  hiddenEntities: string[];
  isolatedEntity: string | null;
  activeIntervention: string;
  representationMode: RepresentationMode;
  playback: PlaybackState;
  conversationHistory: Array<{
    role: "user" | "system";
    message: string;
  }>;
};

export const dnaReplicationPack: BiologicalProcessPack = {
  id: "dna-replication",
  process: "DNA replication",
  aliases: [
    "dna copied",
    "dna copying",
    "dna replication",
    "replication fork",
    "okazaki fragments",
    "bacterial dna replication"
  ],
  biologicalContexts: [
    "bacterial chromosome replication",
    "eukaryotic chromosome replication"
  ],
  entities: [
    entity("parental-strand-5to3", "Parental strand 5'->3'", ["template strand"], "strand", "Original DNA template running 5' to 3' in the schematic."),
    entity("parental-strand-3to5", "Parental strand 3'->5'", ["opposite template"], "strand", "Original DNA template running 3' to 5' in the schematic."),
    entity("helicase", "Helicase", ["dna helicase"], "enzyme", "Unwinds the parental duplex at the replication fork."),
    entity("ssb", "Single-strand binding proteins", ["ssb proteins"], "protein", "Stabilize exposed single-stranded DNA."),
    entity("primase", "Primase", ["rna primase"], "enzyme", "Synthesizes short RNA primers."),
    entity("rna-primers", "RNA primers", ["primers"], "molecule", "Provide a starting 3' hydroxyl for DNA polymerase."),
    entity("dna-polymerase", "DNA polymerase", ["polymerase"], "enzyme", "Extends DNA only in the 5' to 3' direction."),
    entity("leading-strand", "Leading strand", ["continuous strand"], "strand", "New strand synthesized continuously toward the fork."),
    entity("lagging-strand", "Lagging strand", ["discontinuous strand"], "strand", "New strand synthesized discontinuously away from the fork."),
    entity("okazaki-fragments", "Okazaki fragments", ["fragments"], "fragment", "Short DNA fragments that belong to the lagging strand."),
    entity("primer-removal", "Primer removal", ["rna primer removal"], "process", "RNA primers are removed and replaced with DNA."),
    entity("ligase", "Ligase", ["dna ligase"], "enzyme", "Seals remaining nicks between adjacent DNA fragments.")
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
    parameter("directionality", "Synthesis direction", "5' -> 3'", undefined, "DNA polymerase extension direction.")
  ],
  interventions: [
    intervention("isolate-lagging-strand", "Isolate lagging strand", "Dim all entities except the lagging-strand path.", ["lagging-strand", "okazaki-fragments", "rna-primers"]),
    intervention("hide-leading-strand", "Hide leading strand", "Remove the continuous leading-strand path.", ["leading-strand"]),
    intervention("show-rna-primers", "Show RNA primers", "Reveal primer segments on the lagging strand.", ["rna-primers"]),
    intervention("remove-ligase", "Remove ligase", "Show unresolved nicks between Okazaki fragments.", ["ligase", "okazaki-fragments"]),
    intervention("compare-no-ligase", "Compare normal vs no ligase", "Render baseline and no-ligase outcome together.", ["ligase", "okazaki-fragments"])
  ],
  representationRules: [
    "Use a schematic fork, not molecular geometry.",
    "Show 5' and 3' directionality when explaining strand asymmetry.",
    "Use fragmented lagging synthesis to explain why Okazaki fragments are necessary.",
    "When ligase is removed, keep fragments visible and show unresolved nicks."
  ],
  commonMisconceptions: [
    "DNA polymerase does not synthesize in both directions.",
    "Okazaki fragments are not part of the leading strand.",
    "Ligase does not synthesize most of the new DNA.",
    "The schematic animation is not molecularly exact."
  ],
  assumptions: [
    "One replication fork is shown.",
    "Timing and distances are mocked for clarity.",
    "Bacterial and eukaryotic contexts share the simplified core mechanism here.",
    "Protein complexes are represented as labels and simple shapes."
  ],
  limitations: [
    "Not atomistic or sequence-specific.",
    "Not a kinetic simulation.",
    "Does not model full replisome stoichiometry.",
    "Schematic motion must not be described as molecularly exact."
  ],
  sources: [
    {
      id: "alberts-essential-cell-biology",
      title: "Essential Cell Biology",
      authors: "Alberts et al.",
      locator: "DNA replication chapter",
      note: "General mechanism and enzyme roles."
    },
    {
      id: "ncbi-dna-replication",
      title: "Molecular Biology of the Cell / NCBI Bookshelf DNA replication overview",
      authors: "NCBI Bookshelf",
      locator: "DNA replication overview",
      note: "Reference for fork, leading and lagging synthesis, and ligase."
    }
  ]
};

export function createScientificModelFromPack(
  pack: BiologicalProcessPack,
  biologicalContext = "bacterial chromosome replication"
): ScientificModel {
  return {
    process: pack.process,
    aliases: pack.aliases,
    biologicalContext,
    entities: pack.entities,
    relations: pack.relations,
    states: pack.states,
    transitions: pack.transitions,
    parameters: pack.parameters,
    interventions: pack.interventions,
    assumptions: pack.assumptions,
    limitations: pack.limitations,
    sources: pack.sources,
    representationChoice: "scene",
    literalElements: pack.entities.filter((item) => item.literal).map((item) => item.id),
    schematicElements: pack.entities.filter((item) => item.schematic).map((item) => item.id),
    scaleDistortions: [
      "Enzymes are drawn larger than DNA for selection.",
      "Fork travel and fragment length are normalized to fit the canvas.",
      "Molecular collisions and thermal motion are omitted."
    ]
  };
}

export function validateBiologicalProcessPack(pack: BiologicalProcessPack) {
  const errors: string[] = [];
  const entityIds = new Set(pack.entities.map((entityItem) => entityItem.id));
  const stateIds = new Set(pack.states.map((stateItem) => stateItem.id));

  if (!pack.process || pack.entities.length === 0) {
    errors.push("process pack must include a process and entities");
  }

  for (const relationItem of pack.relations) {
    if (!entityIds.has(relationItem.source) || !entityIds.has(relationItem.target)) {
      errors.push(`relation ${relationItem.id} references an unknown entity`);
    }
  }

  for (const transitionItem of pack.transitions) {
    if (!stateIds.has(transitionItem.from) || !stateIds.has(transitionItem.to)) {
      errors.push(`transition ${transitionItem.id} references an unknown state`);
    }
  }

  if (!pack.representationRules.some((ruleItem) => ruleItem.includes("5'"))) {
    errors.push("representation rules must include strand directionality");
  }

  if (!pack.limitations.some((limitation) => limitation.includes("molecularly exact"))) {
    errors.push("limitations must warn against molecular exactness");
  }

  return { valid: errors.length === 0, errors };
}

export function parseBiologyPrompt(prompt: string): SpatialPromptResult {
  const normalized = prompt.trim().toLowerCase().replace(/[?.!]+$/g, "");

  if (!normalized) {
    return { supported: false, prompt, reason: "No biological process was provided." };
  }

  const dnaHints = [
    "dna copied",
    "dna copy",
    "dna replication",
    "replication fork",
    "okazaki",
    "bacterial dna replication",
    "without ligase",
    "no ligase"
  ];

  if (!dnaHints.some((hint) => normalized.includes(hint))) {
    return {
      supported: false,
      prompt,
      reason: "This prototype currently supports DNA replication only."
    };
  }

  const context = normalized.includes("bacterial")
    ? "bacterial chromosome replication"
    : "general DNA replication";
  const intent = normalized.includes("okazaki")
    ? "explain-lagging-strand"
    : normalized.includes("without ligase") || normalized.includes("no ligase")
      ? "compare-no-ligase"
      : "show-replication-fork";

  return {
    supported: true,
    prompt,
    intent,
    context,
    model: createScientificModelFromPack(dnaReplicationPack, context),
    suggestedIntervention: intent === "compare-no-ligase" ? "compare-no-ligase" : undefined
  };
}

export function createInitialSession(): SpatialSessionState {
  return {
    currentPrompt: "",
    activeModel: null,
    selectedEntities: [],
    hiddenEntities: [],
    isolatedEntity: null,
    activeIntervention: "none",
    representationMode: "scene",
    playback: {
      playing: false,
      speed: 1,
      timelinePosition: 0,
      showLabels: true,
      showDirectionality: true
    },
    conversationHistory: []
  };
}

export function startSessionFromPrompt(
  session: SpatialSessionState,
  prompt: string
): SpatialSessionState {
  const result = parseBiologyPrompt(prompt);

  if (!result.supported) {
    return {
      ...session,
      currentPrompt: prompt,
      activeIntervention: "unsupported prompt",
      conversationHistory: [
        ...session.conversationHistory,
        { role: "user", message: prompt },
        { role: "system", message: result.reason }
      ]
    };
  }

  const withModel: SpatialSessionState = {
    ...createInitialSession(),
    currentPrompt: prompt,
    activeModel: result.model,
    representationMode: result.model.representationChoice,
    playback: { ...session.playback, playing: true, timelinePosition: 0 },
    conversationHistory: [
      ...session.conversationHistory,
      { role: "user", message: prompt },
      { role: "system", message: `Loaded ${result.model.process}: ${result.intent}` }
    ]
  };

  return result.suggestedIntervention
    ? applyFollowUpCommand(withModel, "compare normal replication with no ligase")
    : withModel;
}

export function applyFollowUpCommand(
  session: SpatialSessionState,
  command: string
): SpatialSessionState {
  const normalized = command.trim().toLowerCase();
  const history = [
    ...session.conversationHistory,
    { role: "user" as const, message: command }
  ];

  if (!session.activeModel) {
    return {
      ...session,
      activeIntervention: "no active model",
      conversationHistory: [
        ...history,
        { role: "system", message: "Generate a supported process before applying commands." }
      ]
    };
  }

  const updated = (patch: Partial<SpatialSessionState>, message: string) => ({
    ...session,
    ...patch,
    conversationHistory: [...history, { role: "system" as const, message }]
  });

  if (normalized === "isolate the lagging strand" || normalized === "isolate lagging strand") {
    return updated(
      {
        isolatedEntity: "lagging-strand",
        selectedEntities: ["lagging-strand", "okazaki-fragments"],
        activeIntervention: "isolate-lagging-strand"
      },
      "Isolated the lagging strand and its fragments."
    );
  }

  if (normalized === "hide the leading strand" || normalized === "hide leading strand") {
    return updated(
      {
        hiddenEntities: addUnique(session.hiddenEntities, "leading-strand"),
        activeIntervention: "hide-leading-strand"
      },
      "Hid the leading strand."
    );
  }

  if (normalized === "show rna primers" || normalized === "show primers") {
    return updated(
      {
        hiddenEntities: session.hiddenEntities.filter((id) => id !== "rna-primers"),
        selectedEntities: ["rna-primers"],
        activeIntervention: "show-rna-primers"
      },
      "RNA primers are visible."
    );
  }

  if (normalized === "remove ligase") {
    return updated(
      {
        hiddenEntities: addUnique(session.hiddenEntities, "ligase"),
        activeIntervention: "remove-ligase"
      },
      "Removed ligase; nicks remain unresolved."
    );
  }

  if (normalized === "pause") {
    return updated(
      { playback: { ...session.playback, playing: false }, activeIntervention: "pause" },
      "Playback paused."
    );
  }

  if (normalized === "slow down") {
    return updated(
      {
        playback: {
          ...session.playback,
          speed: Math.max(0.25, session.playback.speed / 2)
        },
        activeIntervention: "slow-down"
      },
      "Playback speed reduced."
    );
  }

  if (normalized === "restart") {
    return updated(
      {
        hiddenEntities: [],
        isolatedEntity: null,
        selectedEntities: [],
        playback: { ...session.playback, playing: true, timelinePosition: 0, speed: 1 },
        activeIntervention: "restart"
      },
      "Restarted the current model."
    );
  }

  if (normalized === "show 5' and 3' ends" || normalized === "show directionality") {
    return updated(
      {
        playback: { ...session.playback, showDirectionality: true },
        activeIntervention: "show-directionality"
      },
      "Directionality labels are visible."
    );
  }

  if (normalized === "compare normal replication with no ligase" || normalized === "compare normal vs no ligase") {
    return updated(
      {
        activeIntervention: "compare-no-ligase",
        representationMode: "scene"
      },
      "Comparing baseline replication with a no-ligase intervention."
    );
  }

  if (normalized === "show timeline") {
    return updated(
      { representationMode: "timeline", activeIntervention: "show-timeline" },
      "Switched to the process timeline."
    );
  }

  if (normalized === "show process graph") {
    return updated(
      { representationMode: "graph", activeIntervention: "show-process-graph" },
      "Switched to the process graph."
    );
  }

  if (normalized === "explain why okazaki fragments are necessary") {
    return updated(
      {
        representationMode: "explanation",
        selectedEntities: ["lagging-strand", "okazaki-fragments"],
        activeIntervention: "explain-okazaki"
      },
      "Okazaki fragments are necessary because polymerase extends only 5' to 3' while the lagging template is exposed opposite fork movement."
    );
  }

  return updated(
    { activeIntervention: "unsupported command" },
    "Unsupported command. The deterministic prototype abstained."
  );
}

export function setRepresentationMode(
  session: SpatialSessionState,
  representationMode: RepresentationMode
): SpatialSessionState {
  return {
    ...session,
    representationMode,
    activeModel: session.activeModel
      ? { ...session.activeModel, representationChoice: representationMode }
      : null
  };
}

export function setTimelinePosition(
  session: SpatialSessionState,
  timelinePosition: number
): SpatialSessionState {
  return {
    ...session,
    playback: {
      ...session.playback,
      playing: false,
      timelinePosition: Math.min(1, Math.max(0, timelinePosition))
    }
  };
}

function entity(
  id: string,
  label: string,
  aliases: string[],
  kind: ScientificEntityKind,
  description: string
): ScientificEntity {
  return { id, label, aliases, kind, description, literal: true, schematic: true };
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
    description
  };
}

function state(
  id: string,
  label: string,
  order: number,
  description: string,
  activeEntities: string[]
): ScientificState {
  return { id, label, order, description, activeEntities };
}

function transition(
  id: string,
  from: string,
  to: string,
  trigger: string,
  rule: string
): ScientificTransition {
  return { id, from, to, trigger, rule };
}

function parameter(
  id: string,
  label: string,
  value: ScientificParameter["value"],
  unit: string | undefined,
  description: string
): ScientificParameter {
  return { id, label, value, unit, description };
}

function intervention(
  id: string,
  label: string,
  description: string,
  affectedEntities: string[]
): ScientificIntervention {
  return { id, label, description, affectedEntities };
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}
