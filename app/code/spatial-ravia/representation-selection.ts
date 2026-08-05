import type {
  PromptIntentResolution,
  RepresentationType,
  ScientificClaim,
  ScientificModel
} from "./model.ts";

export type ScientificRepresentation =
  | "schematic-3d"
  | "molecular-3d"
  | "process-diagram"
  | "network"
  | "timeline"
  | "time-series-graph"
  | "state-space-view"
  | "mixed-representation";

export type ScientificScale =
  | "atomic"
  | "molecular"
  | "cellular"
  | "tissue"
  | "organism"
  | "population"
  | "abstract";

export type QuantitativeDataAvailability = {
  timeSeries: boolean;
  kineticParameters: boolean;
  stateVariables: boolean;
  structuralData: boolean;
  networkEdges: boolean;
};

export type RepresentationSelectionInput = {
  model: ScientificModel;
  representationRules: Array<string | ScientificClaim>;
  userIntent: Pick<
    PromptIntentResolution,
    "requestedFocus" | "requestedEntities" | "requestedRepresentation" | "requestedIntervention"
  >;
  availableRenderers: ScientificRepresentation[];
  scale: ScientificScale;
  quantitativeData: QuantitativeDataAvailability;
};

export type RepresentationSelectionDecision = {
  primaryRepresentation: ScientificRepresentation;
  synchronizedSecondaryViews: ScientificRepresentation[];
  explanation: string;
  literalVersusSchematicWarning: string;
  unsupportedViewWarnings: string[];
};

type CandidateScore = {
  representation: ScientificRepresentation;
  score: number;
  reasons: string[];
};

const allRepresentations: ScientificRepresentation[] = [
  "schematic-3d",
  "molecular-3d",
  "process-diagram",
  "network",
  "timeline",
  "time-series-graph",
  "state-space-view",
  "mixed-representation"
];

export function selectScientificRepresentation(
  input: RepresentationSelectionInput
): RepresentationSelectionDecision {
  const requested = mapRequestedRepresentation(input.userIntent.requestedRepresentation);
  const available = new Set(input.availableRenderers);
  const features = inferRepresentationFeatures(input);
  const unsupportedViewWarnings: string[] = [];
  const candidates = scoreRepresentations(input, features);

  applyUserPreference(candidates, requested, input, unsupportedViewWarnings);
  preventMisleadingChoices(candidates, input, features, unsupportedViewWarnings);

  const primaryRepresentation = chooseAvailablePrimary(candidates, available);
  const synchronizedSecondaryViews = chooseSecondaryViews(primaryRepresentation, candidates, available, input);

  return {
    primaryRepresentation,
    synchronizedSecondaryViews,
    explanation: explainDecision(primaryRepresentation, candidates, features, input),
    literalVersusSchematicWarning: literalSchematicWarning(primaryRepresentation, input, features),
    unsupportedViewWarnings
  };
}

function scoreRepresentations(
  input: RepresentationSelectionInput,
  features: ReturnType<typeof inferRepresentationFeatures>
): CandidateScore[] {
  const candidates = allRepresentations.map((representation): CandidateScore => ({
    representation,
    score: 0,
    reasons: []
  }));

  addScore(candidates, "process-diagram", 1.8, "The model contains ordered biological mechanism stages.");
  addScore(candidates, "timeline", input.model.transitions.length > 0 ? 1.7 : 0, "Transitions can be synchronized as stages.");

  if (features.isReactionNetwork || features.isRegulatoryNetwork || input.quantitativeData.networkEdges) {
    addScore(candidates, "network", 4.4, "Relations dominate the model, so a network view avoids fake spatial geometry.");
    addScore(candidates, "process-diagram", 0.8, "A process diagram can show causal order alongside the network.");
  }

  if (features.isTimeDependent && input.quantitativeData.timeSeries) {
    addScore(candidates, "time-series-graph", 3.8, "Time-dependent quantitative data is available.");
    addScore(candidates, "timeline", 1.4, "Timeline stages provide process context for the graph.");
  }

  if (features.hasStateSpace || input.quantitativeData.stateVariables) {
    addScore(candidates, "state-space-view", 3.7, "State variables or state-space focus are present.");
  }

  if (input.quantitativeData.structuralData && input.scale === "molecular") {
    addScore(candidates, "molecular-3d", 4.2, "Molecular-scale structural data is available.");
    addScore(candidates, "schematic-3d", 1.6, "A schematic 3D view can stay synchronized with structural context.");
  } else if (features.hasSpatialFocus || input.scale === "molecular" || input.scale === "cellular") {
    addScore(candidates, "schematic-3d", 2.6, "Spatial intuition is useful, but structural geometry is not established.");
  }

  if (features.needsMultipleViews) {
    addScore(candidates, "mixed-representation", 2.8, "The request combines process, relation, or quantitative views.");
  }

  if (features.needsSynchronizedMixedView) {
    addScore(candidates, "mixed-representation", 4.6, "The model explicitly requires synchronized schematic, graph, and timeline views.");
    addScore(candidates, "time-series-graph", 1.8, "A quantitative trace remains synchronized inside the mixed view.");
    addScore(candidates, "timeline", 1.2, "Timeline events remain synchronized inside the mixed view.");
  }

  if (features.isAbstract) {
    addScore(candidates, "process-diagram", 1.2, "The process is abstract and should be shown as a schematic projection.");
    addScore(candidates, "network", 0.8, "Abstract relations may be clearer as a network.");
  }

  return candidates;
}

function applyUserPreference(
  candidates: CandidateScore[],
  requested: ScientificRepresentation | undefined,
  input: RepresentationSelectionInput,
  warnings: string[]
) {
  if (!requested) {
    return;
  }

  if (!input.availableRenderers.includes(requested)) {
    warnings.push(`Requested view "${requested}" is not available in the current renderer set.`);
    return;
  }

  addScore(candidates, requested, 2.7, "The user explicitly requested this representation.");
}

function preventMisleadingChoices(
  candidates: CandidateScore[],
  input: RepresentationSelectionInput,
  features: ReturnType<typeof inferRepresentationFeatures>,
  warnings: string[]
) {
  if (!input.quantitativeData.structuralData) {
    suppress(candidates, "molecular-3d", "Molecular 3D requires structural data.");
    if (input.availableRenderers.includes("molecular-3d")) {
      warnings.push("Molecular 3D was not selected because no structural data is available.");
    }
  }

  if (features.isReactionNetwork && !input.quantitativeData.structuralData) {
    suppress(candidates, "molecular-3d", "Reaction networks must not default to fake molecular 3D.");
    addScore(candidates, "network", 1.0, "Reaction-network processes should preserve relation topology.");
  }

  if (features.isAbstract) {
    suppress(candidates, "molecular-3d", "Abstract biological processes cannot be shown as literal molecular geometry.");
  }

  if (features.isTimeDependent && input.quantitativeData.timeSeries) {
    suppressBelow(candidates, "time-series-graph", 2.5);
  }
}

function chooseAvailablePrimary(
  candidates: CandidateScore[],
  available: Set<ScientificRepresentation>
) {
  const sorted = candidates
    .filter((candidate) => available.has(candidate.representation))
    .sort((a, b) => b.score - a.score);

  return sorted[0]?.representation ?? "process-diagram";
}

function chooseSecondaryViews(
  primary: ScientificRepresentation,
  candidates: CandidateScore[],
  available: Set<ScientificRepresentation>,
  input: RepresentationSelectionInput
) {
  const secondary = new Set<ScientificRepresentation>();

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    if (
      candidate.representation !== primary &&
      available.has(candidate.representation) &&
      candidate.score > 1.2
    ) {
      secondary.add(candidate.representation);
    }
  }

  if (input.model.transitions.length > 0 && primary !== "timeline" && available.has("timeline")) {
    secondary.add("timeline");
  }

  if (input.model.relations.length > 0 && primary !== "network" && available.has("network")) {
    secondary.add("network");
  }

  return [...secondary].slice(0, 3);
}

function inferRepresentationFeatures(input: RepresentationSelectionInput) {
  const text = [
    input.model.process,
    input.model.biologicalContext,
    ...input.model.aliases,
    ...input.representationRules.map((rule) => typeof rule === "string" ? rule : rule.claim),
    ...input.model.relations.map((relation) => relation.relation),
    ...input.model.parameters.map((parameter) => `${parameter.id} ${parameter.label} ${parameter.unit ?? ""}`),
    ...input.userIntent.requestedFocus,
    ...input.userIntent.requestedEntities
  ].join(" ").toLowerCase();
  const hasStateSpace = hasAny(text, ["state space", "phase", "attractor", "state-variable", "state variable"]);
  const isReactionNetwork = hasAny(text, ["reaction", "metabolic", "cascade", "network", "regulatory"]);
  const isRegulatoryNetwork = hasAny(text, ["gene regulatory", "regulatory network", "signaling", "transcription factor"]);
  const isTimeDependent = hasAny(text, ["time", "rate", "kinetic", "oscillation", "concentration", "trajectory", "timeline"]);
  const hasSpatialFocus = hasAny(text, ["3d", "spatial", "geometry", "structure", "molecular", "membrane", "compartment"]);
  const isAbstract = input.scale === "abstract" || hasAny(text, ["abstract", "projection"]);
  const needsMultipleViews =
    (input.quantitativeData.timeSeries && input.model.relations.length > 0) ||
    (isReactionNetwork && input.model.transitions.length > 0) ||
    input.userIntent.requestedRepresentation === "json";
  const needsSynchronizedMixedView = hasAny(text, [
    "mixed representation",
    "synchronized mixed",
    "synchronized membrane",
    "voltage graph",
    "membrane voltage"
  ]);

  return {
    hasStateSpace,
    isReactionNetwork,
    isRegulatoryNetwork,
    isTimeDependent,
    hasSpatialFocus,
    isAbstract,
    needsMultipleViews,
    needsSynchronizedMixedView
  };
}

function mapRequestedRepresentation(
  requested: RepresentationType | undefined
): ScientificRepresentation | undefined {
  if (!requested) {
    return undefined;
  }

  const map: Record<RepresentationType, ScientificRepresentation> = {
    scene: "schematic-3d",
    mixed: "mixed-representation",
    "molecular-structure": "molecular-3d",
    timeline: "timeline",
    graph: "network",
    "voltage-graph": "time-series-graph",
    explanation: "process-diagram",
    json: "mixed-representation"
  };

  return map[requested];
}

function explainDecision(
  primary: ScientificRepresentation,
  candidates: CandidateScore[],
  features: ReturnType<typeof inferRepresentationFeatures>,
  input: RepresentationSelectionInput
) {
  const candidate = candidates.find((item) => item.representation === primary);
  const reasons = candidate?.reasons.slice(0, 3) ?? [];
  const dataNote = input.quantitativeData.structuralData
    ? "Structural data is available."
    : "No structural data was provided.";
  const featureNote = features.isTimeDependent && input.quantitativeData.timeSeries
    ? "Quantitative time-series data is available."
    : "The selection prioritizes the curated model structure and representation rules.";

  return [dataNote, featureNote, ...reasons].join(" ");
}

function literalSchematicWarning(
  primary: ScientificRepresentation,
  input: RepresentationSelectionInput,
  features: ReturnType<typeof inferRepresentationFeatures>
) {
  if (primary === "molecular-3d" && input.quantitativeData.structuralData) {
    return "Uses structural data where available; omitted or uncertain parts must remain marked as modeled or schematic.";
  }

  if (features.isAbstract || primary !== "molecular-3d") {
    return "This view is a schematic projection for reasoning and should not be read as literal molecular geometry.";
  }

  return "Literal geometry is limited to validated structural data.";
}

function addScore(
  candidates: CandidateScore[],
  representation: ScientificRepresentation,
  score: number,
  reason: string
) {
  const candidate = candidates.find((item) => item.representation === representation);

  if (!candidate || score <= 0) {
    return;
  }

  candidate.score += score;
  candidate.reasons.push(reason);
}

function suppress(
  candidates: CandidateScore[],
  representation: ScientificRepresentation,
  reason: string
) {
  const candidate = candidates.find((item) => item.representation === representation);

  if (!candidate) {
    return;
  }

  candidate.score = -Infinity;
  candidate.reasons.push(reason);
}

function suppressBelow(
  candidates: CandidateScore[],
  representation: ScientificRepresentation,
  minimumScore: number
) {
  const candidate = candidates.find((item) => item.representation === representation);

  if (candidate && candidate.score < minimumScore) {
    candidate.score = minimumScore;
  }
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
