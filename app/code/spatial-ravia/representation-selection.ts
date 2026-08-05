import type {
  PromptIntentResolution,
  RepresentationType,
  ScientificClaim,
  ScientificModel
} from "./model.ts";
import type {
  PhenomenonSpec,
  RepresentationKind
} from "./phenomenon-spec.ts";

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
  phenomenonSpec?: PhenomenonSpec;
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
  const evidence = deriveEvidenceAvailability(input);
  const features = inferRepresentationFeatures(input, evidence);
  const unsupportedViewWarnings: string[] = [];
  const candidates = scoreRepresentations(input, features, evidence, requested);

  applyUserPreference(candidates, requested, input, unsupportedViewWarnings);
  preventMisleadingChoices(candidates, input, features, evidence, unsupportedViewWarnings);

  const primaryRepresentation = chooseAvailablePrimary(candidates, available);
  const synchronizedSecondaryViews = chooseSecondaryViews(primaryRepresentation, candidates, available, input, evidence);

  return {
    primaryRepresentation,
    synchronizedSecondaryViews,
    explanation: explainDecision(primaryRepresentation, candidates, features, input, evidence),
    literalVersusSchematicWarning: literalSchematicWarning(primaryRepresentation, input, features, evidence),
    unsupportedViewWarnings
  };
}

function scoreRepresentations(
  input: RepresentationSelectionInput,
  features: ReturnType<typeof inferRepresentationFeatures>,
  evidence: QuantitativeDataAvailability,
  requested: ScientificRepresentation | undefined
): CandidateScore[] {
  const candidates = allRepresentations.map((representation): CandidateScore => ({
    representation,
    score: 0,
    reasons: []
  }));

  addScore(candidates, "process-diagram", 1.8, "The model contains ordered biological mechanism stages.");
  addScore(candidates, "timeline", input.model.transitions.length > 0 ? 1.7 : 0, "Transitions can be synchronized as stages.");

  if (hasSchemaView(input, "mechanistic-process")) {
    addScore(candidates, "schematic-3d", 1.5, "The schema declares a schematic mechanistic-process view.");
  }

  if (features.isReactionNetwork || features.isRegulatoryNetwork || evidence.networkEdges) {
    addScore(candidates, "network", 4.4, "Relations dominate the model, so a network view avoids fake spatial geometry.");
    addScore(candidates, "process-diagram", 0.8, "A process diagram can show causal order alongside the network.");
  }

  if (features.isTimeDependent && evidence.timeSeries) {
    addScore(candidates, "time-series-graph", 3.8, "Time-dependent quantitative data is available.");
    addScore(candidates, "timeline", 1.4, "Timeline stages provide process context for the graph.");
  }

  if (features.hasStateSpace || evidence.stateVariables) {
    addScore(candidates, "state-space-view", 3.7, "State variables or state-space focus are present.");
  }

  if (evidence.structuralData && input.scale === "molecular") {
    addScore(
      candidates,
      "molecular-3d",
      input.quantitativeData.structuralData || requested === "molecular-3d" || !hasSchemaView(input, "mechanistic-process") ? 4.2 : 1.4,
      "Molecular-scale structural data is available."
    );
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

  addScore(
    candidates,
    requested,
    requested === "schematic-3d" ? 2.7 : 3.6,
    "The user explicitly requested this representation."
  );
}

function preventMisleadingChoices(
  candidates: CandidateScore[],
  input: RepresentationSelectionInput,
  features: ReturnType<typeof inferRepresentationFeatures>,
  evidence: QuantitativeDataAvailability,
  warnings: string[]
) {
  if (!evidence.structuralData) {
    suppress(candidates, "molecular-3d", "Molecular 3D requires structural data.");
    if (input.availableRenderers.includes("molecular-3d")) {
      warnings.push("Molecular 3D was not selected because no structural data is available.");
    }
  }

  if (features.isReactionNetwork && !evidence.structuralData) {
    suppress(candidates, "molecular-3d", "Reaction networks must not default to fake molecular 3D.");
    addScore(candidates, "network", 1.0, "Reaction-network processes should preserve relation topology.");
  }

  if (features.isAbstract) {
    suppress(candidates, "molecular-3d", "Abstract biological processes cannot be shown as literal molecular geometry.");
  }

  if (features.isTimeDependent && evidence.timeSeries) {
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
  input: RepresentationSelectionInput,
  evidence: QuantitativeDataAvailability
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

  if (
    evidence.structuralData &&
    primary !== "molecular-3d" &&
    available.has("molecular-3d") &&
    !secondary.has("molecular-3d")
  ) {
    secondary.add("molecular-3d");
  }

  return [...secondary].slice(0, 3);
}

function inferRepresentationFeatures(
  input: RepresentationSelectionInput,
  evidence: QuantitativeDataAvailability
) {
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
    (evidence.timeSeries && input.model.relations.length > 0) ||
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
  input: RepresentationSelectionInput,
  evidence: QuantitativeDataAvailability
) {
  const candidate = candidates.find((item) => item.representation === primary);
  const reasons = candidate?.reasons.slice(0, 3) ?? [];
  const dataNote = evidence.structuralData
    ? "Structural data is available."
    : "No structural data was provided.";
  const featureNote = features.isTimeDependent && evidence.timeSeries
    ? "Quantitative time-series data is available."
    : "The selection prioritizes the curated model structure and representation rules.";

  return [dataNote, featureNote, ...reasons].join(" ");
}

function literalSchematicWarning(
  primary: ScientificRepresentation,
  input: RepresentationSelectionInput,
  features: ReturnType<typeof inferRepresentationFeatures>,
  evidence: QuantitativeDataAvailability
) {
  if (primary === "molecular-3d" && evidence.structuralData) {
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

function deriveEvidenceAvailability(input: RepresentationSelectionInput): QuantitativeDataAvailability {
  const spec = input.phenomenonSpec ?? input.model.phenomenonSpec;
  const schemaEvidence: QuantitativeDataAvailability = {
    timeSeries: false,
    kineticParameters: false,
    stateVariables: false,
    structuralData: false,
    networkEdges: false
  };

  if (spec) {
    schemaEvidence.structuralData = spec.views.some((view) =>
      view.kind === "molecular-structure" &&
      view.renderer === "molstar" &&
      view.evidenceMode === "literal" &&
      view.structureMapping?.approved === true &&
      view.structureMapping.deposited === true
    );
    schemaEvidence.timeSeries = spec.timeline.basis === "physical";
    schemaEvidence.kineticParameters = spec.timeline.basis === "physical";
    schemaEvidence.networkEdges = hasSchemaView(spec, "graph");
    schemaEvidence.stateVariables = hasSchemaView(spec, "equation-model");
  }

  return {
    timeSeries: input.quantitativeData.timeSeries || schemaEvidence.timeSeries,
    kineticParameters: input.quantitativeData.kineticParameters || schemaEvidence.kineticParameters,
    stateVariables: input.quantitativeData.stateVariables || schemaEvidence.stateVariables,
    structuralData: input.quantitativeData.structuralData || schemaEvidence.structuralData,
    networkEdges: input.quantitativeData.networkEdges || schemaEvidence.networkEdges
  };
}

function hasSchemaView(
  input: RepresentationSelectionInput | PhenomenonSpec,
  kind: RepresentationKind
) {
  const spec = "views" in input ? input : input.phenomenonSpec ?? input.model.phenomenonSpec;

  return spec?.views.some((view) => view.kind === kind) ?? false;
}
