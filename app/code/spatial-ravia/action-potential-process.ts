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
  ScientificSource,
  ScientificState,
  ScientificTransition
} from "./model.ts";
import { validateBiologicalProcessPack } from "./model.ts";
import type { ScientificPrimitive } from "./primitives.ts";
import { primitiveBase } from "./primitives.ts";
import {
  actionPotentialTracePath,
  actionPotentialTraceSource
} from "./action-potential-trace.ts";

const actionPotentialSources: ScientificSource[] = [
  {
    id: "hodgkin-huxley-1952",
    title: "A quantitative description of membrane current and its application to conduction and excitation in nerve",
    authors: "Hodgkin and Huxley",
    locator: "Membrane equation and action-potential response",
    note: "Primary source for the reviewed Hodgkin-Huxley voltage-trace fixture.",
    urlOrDoi: "https://doi.org/10.1113/jphysiol.1952.sp004764",
    publicationType: "primary-literature",
    accessDate: "2026-08-06",
    license: "Publisher-hosted primary literature metadata; trace values are a local benchmark fixture."
  },
  {
    id: "openstax-neuron-action-potential",
    title: "Anatomy and Physiology: The Action Potential",
    authors: "OpenStax",
    locator: "Nervous tissue chapter",
    note: "Reference for neuron membrane potential stages and channel behavior.",
    urlOrDoi: "https://openstax.org/books/anatomy-and-physiology/pages/12-4-the-action-potential",
    publicationType: "textbook",
    accessDate: "2026-08-05",
    license: "CC BY 4.0"
  },
  {
    id: "ncbi-neuroscience-action-potential",
    title: "Neuroscience, 2nd edition: Action Potentials",
    authors: "Purves et al. / NCBI Bookshelf",
    locator: "Action potentials section",
    note: "Reference for voltage-gated sodium and potassium channel sequence.",
    urlOrDoi: "https://www.ncbi.nlm.nih.gov/books/",
    publicationType: "textbook",
    accessDate: "2026-08-05"
  }
];

export const actionPotentialPack: BiologicalProcessPack = {
  id: "action-potential",
  process: "Action potential",
  aliases: [
    "action potential",
    "neuron spike",
    "neuronal action potential",
    "membrane voltage spike",
    "membrane potential rising and falling",
    "sodium and potassium currents",
    "nerve impulse",
    "depolarization repolarization",
    "depolarization",
    "repolarization",
    "refractory period",
    "ion flow across membrane",
    "ion flow across the membrane"
  ],
  examples: [
    "Show an action potential.",
    "Visualize membrane voltage over time.",
    "Show sodium and potassium channels during a neuron spike.",
    "Compare blocked sodium channels."
  ],
  biologicalContexts: [
    "generic neuron axon membrane",
    "excitable cell membrane"
  ],
  defaultContext: "generic neuron axon membrane",
  unsupportedMessage: "This prototype supports a reviewed Hodgkin-Huxley trace fixture inside a schematic action-potential workspace, not arbitrary electrophysiology.",
  entities: [
    entity("resting-potential", "Resting potential", ["resting membrane potential"], "process", "The membrane starts polarized near a negative resting voltage."),
    entity("membrane", "Membrane", ["axon membrane", "cell membrane"], "process", "Lipid membrane separating intracellular and extracellular ion compartments."),
    entity("sodium-channels", "Voltage-gated sodium channels", ["na channels", "sodium channel", "sodium current"], "protein", "Open rapidly during depolarization, allowing inward sodium current."),
    entity("potassium-channels", "Voltage-gated potassium channels", ["k channels", "potassium channel", "potassium current"], "protein", "Open more slowly and support outward potassium current during repolarization."),
    entity("depolarization", "Depolarization", ["rising phase"], "process", "Membrane voltage moves upward as sodium conductance increases."),
    entity("repolarization", "Repolarization", ["falling phase"], "process", "Membrane voltage returns downward as potassium conductance dominates."),
    entity("hyperpolarization", "Hyperpolarization", ["undershoot"], "process", "Membrane voltage transiently falls below resting level."),
    entity("refractory-period", "Refractory period", ["refractory"], "process", "Period of reduced excitability after sodium-channel inactivation."),
    entity("membrane-voltage", "Membrane voltage over time", ["membrane potential", "voltage trace", "voltage graph"], "process", "A reviewed Hodgkin-Huxley benchmark voltage trace displayed inside the schematic workspace."),
    entity("ion-flow", "Ion-flow direction", ["ion flow", "current direction"], "process", "Direction of sodium influx and potassium efflux in the schematic.")
  ],
  relations: [
    relation("resting-potential", "membrane", "polarizes", "Resting ion gradients polarize the membrane."),
    relation("sodium-channels", "depolarization", "drives", "Opening sodium channels drive the rising phase."),
    relation("potassium-channels", "repolarization", "drives", "Opening potassium channels drive the falling phase."),
    relation("potassium-channels", "hyperpolarization", "contributes to", "Delayed potassium conductance contributes to undershoot."),
    relation("sodium-channels", "refractory-period", "inactivates during", "Sodium-channel inactivation contributes to the refractory period."),
    relation("membrane-voltage", "depolarization", "plots", "The voltage trace plots depolarization."),
    relation("membrane-voltage", "repolarization", "plots", "The voltage trace plots repolarization."),
    relation("ion-flow", "sodium-channels", "shows influx through", "Sodium ions flow inward through open sodium channels."),
    relation("ion-flow", "potassium-channels", "shows efflux through", "Potassium ions flow outward through open potassium channels.")
  ],
  states: [
    state("resting", "Resting potential", 0, "Membrane is polarized and voltage-gated channels are mostly closed.", ["resting-potential", "membrane", "membrane-voltage"]),
    state("depolarizing", "Depolarization", 1, "Sodium channels open and voltage rises quickly.", ["sodium-channels", "depolarization", "ion-flow", "membrane-voltage"]),
    state("repolarizing", "Repolarization", 2, "Sodium channels inactivate while potassium channels drive voltage downward.", ["potassium-channels", "repolarization", "ion-flow", "membrane-voltage"]),
    state("hyperpolarized", "Hyperpolarization", 3, "Potassium channels close slowly, producing a schematic undershoot.", ["potassium-channels", "hyperpolarization", "membrane-voltage"]),
    state("refractory", "Refractory period", 4, "Excitability is reduced before the system returns toward rest.", ["refractory-period", "sodium-channels", "membrane-voltage"])
  ],
  transitions: [
    transition("threshold-crossed", "resting", "depolarizing", "threshold stimulus", "sodium_channel_open_probability increases"),
    transition("sodium-inactivation", "depolarizing", "repolarizing", "sodium channel inactivation", "sodium_current decreases while potassium_current increases"),
    transition("potassium-delay", "repolarizing", "hyperpolarized", "delayed potassium closure", "membrane_voltage falls below resting voltage"),
    transition("recovery", "hyperpolarized", "refractory", "channel recovery", "sodium channels recover from inactivation over the refractory period")
  ],
  parameters: [
    parameter("membrane-voltage", "Membrane voltage", -65, "mV", `Voltage fixture uses ${actionPotentialTraceSource.voltageUnit} over ${actionPotentialTraceSource.timeUnit}.`),
    parameter("depolarization-rate", "Depolarization rate", 1, "relative", "Schematic speed of the rising phase."),
    parameter("sodium-channel-available", "Sodium channel available", true, undefined, "Whether sodium channels can open in this model."),
    parameter("potassium-channel-delay", "Potassium channel delay", 1, "relative", "Schematic delay of potassium-channel closure.")
  ],
  interventions: [
    intervention("isolate-sodium-channels", "Isolate sodium channels", "Focus the membrane schematic on sodium channels.", ["sodium-channels", "depolarization", "ion-flow"]),
    intervention("slow-depolarization", "Slow depolarization", "Reduce the schematic rising-phase speed.", ["depolarization", "sodium-channels"]),
    intervention("show-refractory-period", "Show refractory period", "Focus the timeline and graph on the refractory period.", ["refractory-period", "sodium-channels"]),
    intervention("blocked-sodium-channels", "Blocked sodium channels", "Counterfactual branch where sodium channels cannot open.", ["sodium-channels", "depolarization", "membrane-voltage"], blockedSodiumDelta()),
    intervention("switch-voltage-graph", "Switch to voltage graph", "Use the voltage trace as the active representation.", ["membrane-voltage"])
  ],
  assumptions: [
    claim("ap-assumption-schematic", "The membrane and channels are schematic, not molecularly exact.", "schematic-simplification", "openstax-neuron-action-potential"),
    claim("ap-assumption-normalized-time", "Time and channel state transitions are normalized for explanation.", "model-assumption", "ncbi-neuroscience-action-potential"),
    claim("ap-assumption-generic-neuron", "A generic neuron axon membrane is shown without cell-type-specific conductance values.", "model-assumption", "openstax-neuron-action-potential"),
    claim("ap-assumption-hh-trace-fixture", "The voltage graph is a fixed Hodgkin-Huxley benchmark trace fixture, not a live browser-side numerical solve.", "model-assumption", "hodgkin-huxley-1952")
  ],
  limitations: [
    claim("ap-limitation-not-live-hh-solver", "The workspace does not expose an editable Hodgkin-Huxley equation solver.", "schematic-simplification", "hodgkin-huxley-1952"),
    claim("ap-limitation-no-spatial-propagation", "Axonal propagation, myelination, and synaptic integration are not modeled.", "schematic-simplification", "openstax-neuron-action-potential")
  ],
  representationRules: [
    claim("ap-rule-mixed", "Use a synchronized mixed representation with membrane schematic, channel-state animation, voltage graph, and timeline.", "schematic-simplification", "openstax-neuron-action-potential"),
    claim("ap-rule-voltage", "Expose membrane voltage over time as a D3-scaled graph rather than a strand animation.", "interpretation", "hodgkin-huxley-1952"),
    claim("ap-rule-ion-flow", "Show sodium influx and potassium efflux direction as schematic arrows.", "interpretation", "openstax-neuron-action-potential")
  ],
  commonMisconceptions: [
    claim("ap-misconception-strand", "An action potential is not a strand-copying process.", "direct-fact", "openstax-neuron-action-potential"),
    claim("ap-misconception-exact-voltage", "The displayed voltage curve is schematic unless quantitative conductance parameters are supplied.", "schematic-simplification", "ncbi-neuroscience-action-potential")
  ],
  validationRules: [
    {
      id: "required-action-potential-entities",
      description: "Action potential pack requires membrane, channels, stages, voltage trace, and ion-flow direction.",
      requiredEntities: [
        "resting-potential",
        "membrane",
        "sodium-channels",
        "potassium-channels",
        "depolarization",
        "repolarization",
        "hyperpolarization",
        "refractory-period",
        "membrane-voltage",
        "ion-flow"
      ]
    },
    {
      id: "required-action-potential-relations",
      description: "Action potential pack must encode sodium depolarization and potassium repolarization.",
      requiredParameters: [
        { id: "membrane-voltage", message: "Action potential requires membrane voltage parameterization." }
      ],
      requiredRelations: [
        { source: "sodium-channels", target: "depolarization", relation: "drives" },
        { source: "potassium-channels", target: "repolarization", relation: "drives" },
        { source: "sodium-channels", target: "refractory-period", relation: "inactivates during" }
      ]
    }
  ],
  incompatibilityRules: [
    incompatibility(
      "ap-sodium-repolarization",
      [
        ["sodium channel"],
        ["driving", "drive", "cause", "causing"],
        ["repolarization"]
      ],
      "Sodium channels drive depolarization, not repolarization, in this action-potential model."
    ),
    incompatibility(
      "ap-potassium-depolarization",
      [
        ["potassium channel"],
        ["driving", "drive", "cause", "causing"],
        ["depolarization"]
      ],
      "Potassium channels drive repolarization and hyperpolarization, not depolarization, in this model."
    ),
    incompatibility(
      "ap-sodium-synthesizes-rna",
      [
        ["sodium channel"],
        ["synthesize", "synthesizes", "synthesizing", "transcribe", "transcribes"],
        ["rna"]
      ],
      "Sodium channels do not synthesize RNA in this model."
    ),
    incompatibility(
      "ap-okazaki-fragments",
      [
        ["action potential"],
        ["okazaki"]
      ],
      "Okazaki fragments are DNA replication entities, not action-potential entities."
    ),
    incompatibility(
      "ap-proven-drug-dosing",
      [
        ["bypass provenance", "mark"],
        ["drug dosing"],
        ["proven"]
      ],
      "Bypassing provenance or marking unsupported drug dosing as proven is not allowed."
    )
  ],
  promptRules: [
    {
      id: "action-potential",
      hints: ["action potential", "neuron spike", "nerve impulse"],
      context: "generic neuron axon membrane",
      intent: "show-mixed-action-potential"
    },
    {
      id: "depolarization-repolarization",
      hints: ["depolarization", "repolarization", "depolarization repolarization", "explain depolarization repolarization"],
      context: "generic neuron axon membrane",
      intent: "explain-voltage-phases"
    },
    {
      id: "refractory-period",
      hints: ["refractory period", "display refractory period"],
      context: "generic neuron axon membrane",
      intent: "show-refractory-period",
      suggestedCommandId: "show-refractory-period"
    },
    {
      id: "ion-flow",
      hints: ["ion flow", "ion flow across membrane", "ion flow across the membrane", "sodium potassium currents", "sodium and potassium currents"],
      context: "generic neuron axon membrane",
      intent: "show-ion-flow",
      suggestedCommandId: "isolate-sodium-channels"
    },
    {
      id: "voltage-trace",
      hints: ["membrane voltage over time", "membrane potential", "membrane potential rising and falling", "voltage graph", "voltage trace"],
      context: "generic neuron axon membrane",
      intent: "show-voltage-graph",
      suggestedCommandId: "switch-voltage-graph"
    },
    {
      id: "blocked-sodium",
      hints: ["blocked sodium channels", "sodium channels blocked"],
      context: "generic neuron axon membrane",
      intent: "compare-blocked-sodium",
      suggestedCommandId: "compare-blocked-sodium-channels"
    }
  ],
  commandRules: [
    {
      id: "isolate-sodium-channels",
      phrases: ["isolate sodium channels", "isolate the sodium channels"],
      patch: {
        isolatedEntity: "sodium-channels",
        selectedEntities: ["sodium-channels", "depolarization", "ion-flow"],
        activeIntervention: "isolate-sodium-channels"
      },
      response: "Isolated sodium channels and sodium influx."
    },
    {
      id: "slow-depolarization",
      phrases: ["slow depolarization", "slow down depolarization"],
      patch: {
        selectedEntities: ["depolarization", "sodium-channels"],
        playback: { speed: 0.5 },
        activeIntervention: "slow-depolarization"
      },
      response: "Depolarization playback slowed."
    },
    {
      id: "show-refractory-period",
      phrases: ["show refractory period", "show the refractory period"],
      patch: {
        selectedEntities: ["refractory-period", "sodium-channels"],
        playback: { showLabels: true, timelinePosition: 0.86 },
        activeIntervention: "show-refractory-period"
      },
      response: "Focused the refractory period."
    },
    {
      id: "compare-blocked-sodium-channels",
      phrases: ["compare blocked sodium channels", "compare sodium channels blocked"],
      patch: {
        selectedEntities: ["sodium-channels", "depolarization", "membrane-voltage"],
        representationMode: "mixed",
        activeIntervention: "blocked-sodium-channels"
      },
      response: "Comparing baseline action potential with blocked sodium channels."
    },
    {
      id: "switch-voltage-graph",
      phrases: ["switch to voltage graph", "show voltage graph"],
      patch: {
        representationMode: "voltage-graph",
        selectedEntities: ["membrane-voltage"],
        activeIntervention: "switch-voltage-graph"
      },
      response: "Switched to the membrane-voltage graph."
    }
  ],
  scaleDistortions: [
    "Channel size and ion arrows are enlarged for readability.",
    "Voltage trace is a fixed Hodgkin-Huxley benchmark fixture scaled into the workspace."
  ],
  animation: {
    planId: "action-potential-mixed",
    title: "Action potential / synchronized mixed representation",
    subtitle: "Schematic membrane, channel states, voltage graph, and timeline.",
    ariaLabel: "Schematic action potential mixed representation with ion channels and D3-scaled Hodgkin-Huxley voltage graph",
    viewBox: "0 0 960 620",
    progressDurationMs: 9000,
    isolationGroups: {
      "sodium-channels": ["sodium-channels", "depolarization", "ion-flow"],
      "potassium-channels": ["potassium-channels", "repolarization", "hyperpolarization", "ion-flow"],
      "membrane-voltage": ["membrane-voltage", "depolarization", "repolarization", "hyperpolarization", "refractory-period"],
      "refractory-period": ["refractory-period", "sodium-channels", "membrane-voltage"]
    },
    primitives: actionPotentialPrimitives()
  },
  sources: actionPotentialSources
};

export function validateActionPotentialPack() {
  return validateBiologicalProcessPack(actionPotentialPack);
}

function actionPotentialPrimitives(): ScientificPrimitive[] {
  return [
    primitiveBase({
      id: "extracellular-field",
      kind: "field",
      entityId: "membrane",
      geometryType: "area",
      semanticRole: "extracellular compartment",
      styleToken: "field",
      classification: "schematic",
      geometry: { d: () => "M70 92 H890 V214 H70 Z" },
      labels: [{ text: "outside", at: [84, 172], visibility: { mode: "labels" } }]
    }),
    primitiveBase({
      id: "intracellular-field",
      kind: "field",
      entityId: "membrane",
      geometryType: "area",
      semanticRole: "intracellular compartment",
      styleToken: "surface",
      classification: "schematic",
      geometry: { d: () => "M70 274 H890 V396 H70 Z" },
      labels: [{ text: "inside", at: [84, 374], visibility: { mode: "labels" } }]
    }),
    primitiveBase({
      id: "membrane-band",
      kind: "membrane",
      entityId: "membrane",
      geometryType: "path",
      semanticRole: "axon membrane",
      styleToken: "primary",
      classification: "schematic",
      geometry: { d: () => "M70 232 C220 216 330 248 480 232 S740 216 890 232 M70 252 C220 236 330 268 480 252 S740 236 890 252" },
      labels: [{ text: "membrane", at: [84, 274], visibility: { mode: "labels" } }]
    }),
    ...channelPrimitives(),
    ...ionFlowPrimitives(),
    primitiveBase({
      id: "voltage-axis-x",
      kind: "connector",
      entityId: "membrane-voltage",
      geometryType: "line",
      semanticRole: "voltage graph axis",
      styleToken: "guide",
      classification: "schematic",
      geometry: { x1: 92, y1: 520, x2: 886, y2: 520 }
    }),
    primitiveBase({
      id: "voltage-axis-y",
      kind: "connector",
      entityId: "membrane-voltage",
      geometryType: "line",
      semanticRole: "voltage graph axis",
      styleToken: "guide",
      classification: "schematic",
      geometry: { x1: 92, y1: 430, x2: 92, y2: 560 }
    }),
    primitiveBase({
      id: "voltage-trace",
      kind: "connector",
      entityId: "membrane-voltage",
      geometryType: "path",
      semanticRole: "membrane voltage over time",
      styleToken: "accent",
      classification: "mixed",
      geometry: { d: () => actionPotentialTracePath() },
      labels: [{ text: "membrane voltage", at: [96, 418], visibility: { mode: "always" } }],
      provenance: [{ sourceId: "hodgkin-huxley-1952", note: actionPotentialTraceSource.note }]
    }),
    ...timelinePrimitives()
  ];
}

function channelPrimitives(): ScientificPrimitive[] {
  return [
    channel("sodium-channel-left", "sodium-channels", 304, "Na+", "accent"),
    channel("sodium-channel-right", "sodium-channels", 408, "Na+", "accent"),
    channel("potassium-channel-left", "potassium-channels", 574, "K+", "secondary"),
    channel("potassium-channel-right", "potassium-channels", 684, "K+", "secondary")
  ];
}

function channel(
  id: string,
  entityId: string,
  x: number,
  labelText: string,
  styleToken: "accent" | "secondary"
): ScientificPrimitive {
  return primitiveBase({
    id,
    kind: "molecular-complex",
    entityId,
    geometryType: "rect",
    semanticRole: "voltage-gated channel state",
    styleToken,
    classification: "mixed",
    geometry: { x, y: 198, width: 42, height: 92 },
    labels: [{ text: labelText, at: [x + 6, 192], visibility: { mode: "always" } }],
    provenance: [{ sourceId: "ncbi-neuroscience-action-potential", note: "Voltage-gated channel schematic." }]
  });
}

function ionFlowPrimitives(): ScientificPrimitive[] {
  return [
    arrow("sodium-influx", "ion-flow", 326, 150, 326, 334, "Na+ inward", "accent"),
    arrow("potassium-efflux", "ion-flow", 606, 334, 606, 150, "K+ outward", "secondary")
  ];
}

function arrow(
  id: string,
  entityId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  labelText: string,
  styleToken: "accent" | "secondary"
): ScientificPrimitive {
  return primitiveBase({
    id,
    kind: "directional-arrow",
    entityId,
    geometryType: "line",
    semanticRole: "ion-flow direction",
    styleToken,
    classification: "schematic",
    geometry: { x1, y1, x2, y2 },
    labels: [{ text: labelText, at: [x2 + 12, (y1 + y2) / 2], visibility: { mode: "always" } }]
  });
}

function timelinePrimitives(): ScientificPrimitive[] {
  return [
    timelineEvent("timeline-resting", "resting-potential", 0.06, 0, "rest"),
    timelineEvent("timeline-depolarization", "depolarization", 0.32, 0, "depol."),
    timelineEvent("timeline-repolarization", "repolarization", 0.58, 0, "repol."),
    timelineEvent("timeline-hyperpolarization", "hyperpolarization", 0.76, 0, "hyperpol."),
    timelineEvent("timeline-refractory", "refractory-period", 0.9, 0, "refract.")
  ];
}

function timelineEvent(
  id: string,
  entityId: string,
  time: number,
  lane: number,
  label: string
): ScientificPrimitive {
  return primitiveBase({
    id,
    kind: "timeline-event",
    entityId,
    geometryType: "event",
    semanticRole: "action potential timeline event",
    styleToken: "guide",
    classification: "schematic",
    geometry: { time, lane, label }
  });
}

function blockedSodiumDelta(): ScientificModelDelta {
  return {
    id: "blocked-sodium-channels",
    label: "Blocked sodium channels",
    interventionId: "blocked-sodium-channels",
    operations: [
      { type: "SET_PARAMETER", parameterId: "sodium-channel-available", value: false },
      { type: "SET_ENTITY_STATE", entityId: "sodium-channels", state: "disabled" },
      { type: "SET_TRANSITION_STATE", transitionId: "threshold-crossed", state: "blocked" }
    ],
    directInterventions: [
      counterfactualClaim("ap-direct-sodium-blocked", "Voltage-gated sodium channels are blocked.", "direct-intervention")
    ],
    predictedConsequences: [
      counterfactualClaim("ap-predicted-depolarization-fails", "Rapid depolarization fails in this schematic, so the voltage spike is strongly reduced.", "predicted-downstream")
    ],
    unsupportedOutcomes: [
      counterfactualClaim("ap-unsupported-drug-dose", "Drug dose-response, channel subtype specificity, and propagation failure are not quantitatively predicted.", "unsupported-outcome")
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
    provenance: [provenance("openstax-neuron-action-potential", description, "direct-fact")]
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
    provenance: [provenance("ncbi-neuroscience-action-potential", description, "direct-fact")]
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
    provenance: [provenance("openstax-neuron-action-potential", description, "interpretation")]
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
    provenance: [provenance("ncbi-neuroscience-action-potential", rule, "interpretation")]
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
    provenance: [provenance("openstax-neuron-action-potential", description, "model-assumption")]
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
  const source = actionPotentialSources.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Missing action-potential source ${sourceId}`);
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
