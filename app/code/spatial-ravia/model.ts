import type {
  Coord,
  ScientificPrimitive
} from "./primitives.ts";
import { validatePrimitive } from "./primitives.ts";

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

export type RepresentationType = RepresentationMode;

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
  provenance: ScientificClaimProvenance[];
};

export type ScientificRelation = {
  id: string;
  source: string;
  target: string;
  relation: string;
  description: string;
  provenance: ScientificClaimProvenance[];
};

export type ScientificState = {
  id: string;
  label: string;
  order: number;
  description: string;
  activeEntities: string[];
  provenance: ScientificClaimProvenance[];
};

export type ScientificTransition = {
  id: string;
  from: string;
  to: string;
  trigger: string;
  rule: string;
  provenance: ScientificClaimProvenance[];
};

export type ScientificParameter = {
  id: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  description: string;
  provenance: ScientificClaimProvenance[];
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
  urlOrDoi: string;
  publicationType: "textbook" | "review" | "database" | "primary-literature" | "documentation";
  accessDate: string;
  license?: string;
};

export type ScientificClaimType =
  | "direct-fact"
  | "model-assumption"
  | "interpretation"
  | "schematic-simplification";

export type ScientificClaimStatus = "verified" | "unverified" | "disputed";

export type ScientificClaimProvenance = {
  sourceId: string;
  title: string;
  authorsOrInstitution: string;
  urlOrDoi: string;
  publicationType: ScientificSource["publicationType"];
  accessDate: string;
  confidence: number;
  supportedClaim: string;
  supportType: ScientificClaimType;
  claimStatus: ScientificClaimStatus;
  license?: string;
  disagreementNote?: string;
};

export type ScientificClaim = {
  id: string;
  claim: string;
  claimType: ScientificClaimType;
  status: ScientificClaimStatus;
  provenance: ScientificClaimProvenance[];
};

export type RenderPlan = {
  id: string;
  title: string;
  subtitle: string;
  ariaLabel: string;
  viewBox: string;
  progressDurationMs: number;
  isolationGroups: Record<string, string[]>;
  primitives: ScientificPrimitive[];
};

export type AnimationInstructions = {
  planId: string;
  title: string;
  subtitle: string;
  ariaLabel: string;
  viewBox: string;
  progressDurationMs: number;
  isolationGroups: Record<string, string[]>;
  primitives: ScientificPrimitive[];
};

export type ValidationRule = {
  id: string;
  description: string;
  requiredEntities?: string[];
  requiredRelations?: Array<{
    source: string;
    target: string;
    relation?: string;
  }>;
  requiredLimitations?: string[];
  requiredParameters?: Array<{
    id: string;
    value?: ScientificParameter["value"];
  }>;
};

export type PromptRule = {
  id: string;
  hints: string[];
  context: string;
  intent: string;
  suggestedCommandId?: string;
};

export type CommandPatch = {
  hiddenEntities?: { add?: string[]; remove?: string[]; reset?: boolean };
  selectedEntities?: string[];
  isolatedEntity?: string | null;
  activeIntervention?: string;
  representationMode?: RepresentationMode;
  playback?: Partial<PlaybackState> & { reset?: boolean };
};

export type CommandRule = {
  id: string;
  phrases: string[];
  patch: CommandPatch;
  response: string;
};

export type BiologicalProcessPack = {
  id: string;
  process: string;
  aliases: string[];
  examples: string[];
  biologicalContexts: string[];
  entities: ScientificEntity[];
  relations: ScientificRelation[];
  states: ScientificState[];
  transitions: ScientificTransition[];
  parameters: ScientificParameter[];
  interventions: ScientificIntervention[];
  assumptions: ScientificClaim[];
  limitations: ScientificClaim[];
  sources: ScientificSource[];
  representationRules: ScientificClaim[];
  commonMisconceptions: ScientificClaim[];
  validationRules: ValidationRule[];
  promptRules: PromptRule[];
  commandRules: CommandRule[];
  animation: AnimationInstructions;
  defaultContext: string;
  unsupportedMessage: string;
  scaleDistortions: string[];
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
  assumptions: ScientificClaim[];
  limitations: ScientificClaim[];
  sources: ScientificSource[];
  representationRules: ScientificClaim[];
  representationChoice: RepresentationMode;
  literalElements: string[];
  schematicElements: string[];
  scaleDistortions: string[];
  renderPlan: RenderPlan;
  commandRules: CommandRule[];
  examples: string[];
};

export type CompilationErrorCode =
  | "missing_required_field"
  | "missing_required_entity"
  | "duplicate_id"
  | "invalid_relation_target"
  | "invalid_stage_reference"
  | "invalid_transition_reference"
  | "unsupported_intervention"
  | "malformed_source"
  | "invalid_animation_reference"
  | "invalid_context"
  | "invalid_stage_order"
  | "unit_consistency_failed"
  | "visualization_honesty_failed"
  | "unsupported_claim"
  | "validation_rule_failed";

export type CompilationError = {
  code: CompilationErrorCode;
  path: string;
  message: string;
};

export type ValidationLayer =
  | "schema_integrity"
  | "entity_existence"
  | "relation_integrity"
  | "stage_order"
  | "biological_invariants"
  | "unit_consistency"
  | "intervention_validity"
  | "source_coverage"
  | "visualization_honesty"
  | "unsupported_claim_detection";

export type ValidationIssueSeverity = "error" | "warning" | "abstain";

export type LayeredValidationIssue = CompilationError & {
  layer: ValidationLayer;
  severity: ValidationIssueSeverity;
  abstentionReason?: string;
};

export type LayeredValidationResult = {
  valid: boolean;
  errors: LayeredValidationIssue[];
  warnings: LayeredValidationIssue[];
  abstentionReasons: string[];
  layers: Record<ValidationLayer, LayeredValidationIssue[]>;
};

export type CompilationResult =
  | {
      ok: true;
      model: ScientificModel;
      renderPlan: RenderPlan;
    }
  | {
      ok: false;
      errors: CompilationError[];
    };

export type Candidate = {
  packId: string;
  process: string;
  score: number;
  matchedTerms: string[];
  reasons: string[];
};

export type Context = {
  value: string | null;
  confidence: number;
  matchedKeywords: string[];
};

export type InterventionIntent = {
  commandId: string;
  interventionId: string | null;
  confidence: number;
  matchedPhrase: string;
};

export type PromptIntentResolution = {
  processCandidates: Candidate[];
  biologicalContext: Context;
  requestedFocus: string[];
  requestedEntities: string[];
  requestedRepresentation?: RepresentationType;
  requestedIntervention?: InterventionIntent;
  confidence: number;
  ambiguity: string[];
};

export type SpatialPromptResult =
  | {
      supported: true;
      prompt: string;
      intent: string;
      context: string;
      model: ScientificModel;
      suggestedCommandId?: string;
      resolution: PromptIntentResolution;
    }
  | {
      supported: false;
      prompt: string;
      reason: string;
      resolution: PromptIntentResolution;
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

export function createScientificModelFromPack(
  pack: BiologicalProcessPack,
  biologicalContext = pack.defaultContext
): ScientificModel {
  const result = compileBiologicalProcessPack(pack, { biologicalContext });

  if (!result.ok) {
    throw new Error(formatCompilationErrors(result.errors));
  }

  return result.model;
}

export function compileBiologicalProcessPack(
  pack: BiologicalProcessPack,
  options: { biologicalContext?: string } = {}
): CompilationResult {
  const validation = validateBiologicalProcessPackLayered(pack);
  const errors = [
    ...validation.errors,
    ...validation.layers.unsupported_claim_detection.filter((issue) => issue.severity === "abstain")
  ];

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const biologicalContext = options.biologicalContext ?? pack.defaultContext;

  if (!pack.biologicalContexts.includes(biologicalContext)) {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_context",
          path: "biologicalContext",
          message: `Context "${biologicalContext}" is not supported by process pack "${pack.id}".`
        }
      ]
    };
  }

  const renderPlan = deriveRenderPlan(pack);
  const model: ScientificModel = {
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
    representationRules: pack.representationRules,
    representationChoice: "scene",
    literalElements: pack.entities.filter((item) => item.literal).map((item) => item.id),
    schematicElements: pack.entities.filter((item) => item.schematic).map((item) => item.id),
    scaleDistortions: pack.scaleDistortions,
    renderPlan,
    commandRules: pack.commandRules,
    examples: pack.examples
  };

  return { ok: true, model, renderPlan };
}

function deriveRenderPlan(pack: BiologicalProcessPack): RenderPlan {
  return {
    id: pack.animation.planId,
    title: pack.animation.title,
    subtitle: pack.animation.subtitle,
    ariaLabel: pack.animation.ariaLabel,
    viewBox: pack.animation.viewBox,
    progressDurationMs: pack.animation.progressDurationMs,
    isolationGroups: pack.animation.isolationGroups,
    primitives: pack.animation.primitives
  };
}

export function validateBiologicalProcessPack(pack: BiologicalProcessPack) {
  const errors = validateProcessPackStrict(pack);

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => `${error.path}: ${error.message}`)
  };
}

export function validateBiologicalProcessPackLayered(
  pack: BiologicalProcessPack
): LayeredValidationResult {
  const genericErrors = validateProcessPackStrict(pack);
  const issues = [
    ...genericErrors.map((error) => issueFromCompilationError(error)),
    ...validateStageOrderLayer(pack),
    ...validateBiologicalInvariantLayer(pack),
    ...validateUnitConsistencyLayer(pack),
    ...validateVisualizationHonestyLayer(pack),
    ...validateUnsupportedClaimLayer(pack)
  ];
  const layers = createEmptyLayerMap();

  for (const issue of issues) {
    layers[issue.layer].push(issue);
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error" || issue.severity === "abstain"),
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    abstentionReasons: issues
      .filter((issue) => issue.severity === "abstain")
      .map((issue) => issue.abstentionReason ?? issue.message),
    layers
  };
}

export function validateProcessPackStrict(pack: BiologicalProcessPack) {
  const errors: CompilationError[] = [];
  const entityIds = new Set(pack.entities.map((entityItem) => entityItem.id));
  const stateIds = new Set(pack.states.map((stateItem) => stateItem.id));
  const interventionIds = new Set(pack.interventions.map((item) => item.id));

  requireText(pack.id, "id", errors);
  requireText(pack.process, "process", errors);
  requireNonEmptyArray(pack.aliases, "aliases", errors);
  requireNonEmptyArray(pack.biologicalContexts, "biologicalContexts", errors);
  requireNonEmptyArray(pack.entities, "entities", errors);
  requireNonEmptyArray(pack.states, "states", errors);
  requireNonEmptyArray(pack.sources, "sources", errors);
  requireNonEmptyArray(pack.assumptions, "assumptions", errors);
  requireNonEmptyArray(pack.limitations, "limitations", errors);
  requireNonEmptyArray(pack.representationRules, "representationRules", errors);

  if (!pack.defaultContext || !pack.biologicalContexts.includes(pack.defaultContext)) {
    errors.push({
      code: "invalid_context",
      path: "defaultContext",
      message: "Default context must be one of biologicalContexts."
    });
  }

  collectDuplicateIds(pack.entities, "entities", errors);
  collectDuplicateIds(pack.relations, "relations", errors);
  collectDuplicateIds(pack.states, "states", errors);
  collectDuplicateIds(pack.transitions, "transitions", errors);
  collectDuplicateIds(pack.parameters, "parameters", errors);
  collectDuplicateIds(pack.interventions, "interventions", errors);
  collectDuplicateIds(pack.sources, "sources", errors);
  collectDuplicateIds(pack.promptRules, "promptRules", errors);
  collectDuplicateIds(pack.commandRules, "commandRules", errors);
  collectDuplicateIds(pack.animation.primitives, "animation.primitives", errors);

  for (const entityItem of pack.entities) {
    requireText(entityItem.label, `entities.${entityItem.id}.label`, errors);
    requireText(entityItem.description, `entities.${entityItem.id}.description`, errors);
    validateClaimProvenance(entityItem.provenance, `entities.${entityItem.id}.provenance`, pack.sources, errors);
  }

  for (const relationItem of pack.relations) {
    validateClaimProvenance(relationItem.provenance, `relations.${relationItem.id}.provenance`, pack.sources, errors);

    if (!entityIds.has(relationItem.source) || !entityIds.has(relationItem.target)) {
      errors.push({
        code: "invalid_relation_target",
        path: `relations.${relationItem.id}`,
        message: `Relation "${relationItem.id}" references an unknown entity.`
      });
    }
  }

  for (const stateItem of pack.states) {
    validateClaimProvenance(stateItem.provenance, `states.${stateItem.id}.provenance`, pack.sources, errors);

    for (const entityId of stateItem.activeEntities) {
      if (!entityIds.has(entityId)) {
        errors.push({
          code: "invalid_stage_reference",
          path: `states.${stateItem.id}.activeEntities`,
          message: `Stage "${stateItem.id}" references unknown entity "${entityId}".`
        });
      }
    }
  }

  for (const transitionItem of pack.transitions) {
    validateClaimProvenance(transitionItem.provenance, `transitions.${transitionItem.id}.provenance`, pack.sources, errors);

    if (!stateIds.has(transitionItem.from) || !stateIds.has(transitionItem.to)) {
      errors.push({
        code: "invalid_transition_reference",
        path: `transitions.${transitionItem.id}`,
        message: `Transition "${transitionItem.id}" references an unknown stage.`
      });
    }
  }

  for (const interventionItem of pack.interventions) {
    for (const entityId of interventionItem.affectedEntities) {
      if (!entityIds.has(entityId)) {
        errors.push({
          code: "unsupported_intervention",
          path: `interventions.${interventionItem.id}.affectedEntities`,
          message: `Intervention "${interventionItem.id}" references unknown entity "${entityId}".`
        });
      }
    }
  }

  for (const source of pack.sources) {
    if (
      !source.id ||
      !source.title ||
      !source.authors ||
      !source.locator ||
      !source.note ||
      !source.urlOrDoi ||
      !source.publicationType ||
      !source.accessDate
    ) {
      errors.push({
        code: "malformed_source",
        path: `sources.${source.id || "(missing-id)"}`,
        message: "Source metadata must include id, title, authors, locator, note, urlOrDoi, publicationType, and accessDate."
      });
    }
  }

  for (const parameterItem of pack.parameters) {
    validateClaimProvenance(parameterItem.provenance, `parameters.${parameterItem.id}.provenance`, pack.sources, errors);
  }

  for (const [claimPath, claims] of [
    ["assumptions", pack.assumptions],
    ["limitations", pack.limitations],
    ["representationRules", pack.representationRules],
    ["commonMisconceptions", pack.commonMisconceptions]
  ] as const) {
    collectDuplicateIds(claims, claimPath, errors);

    for (const claim of claims) {
      requireText(claim.claim, `${claimPath}.${claim.id}.claim`, errors);
      validateClaimProvenance(claim.provenance, `${claimPath}.${claim.id}.provenance`, pack.sources, errors, claim.status);
    }
  }

  if (pack.animation.progressDurationMs <= 0) {
    errors.push({
      code: "missing_required_field",
      path: "animation.progressDurationMs",
      message: "Animation duration must be greater than zero."
    });
  }

  for (const primitive of pack.animation.primitives) {
    const primitiveValidation = validatePrimitive(primitive);

    for (const error of primitiveValidation.errors) {
      errors.push({
        code: "invalid_animation_reference",
        path: `animation.primitives.${primitive.id}`,
        message: error
      });
    }

    if (primitive.entityId && !entityIds.has(primitive.entityId)) {
      errors.push({
        code: "invalid_animation_reference",
        path: `animation.primitives.${primitive.id}`,
        message: `Animation primitive "${primitive.id}" references unknown entity "${primitive.entityId}".`
      });
    }
  }

  for (const commandRule of pack.commandRules) {
    const ids = [
      ...(commandRule.patch.hiddenEntities?.add ?? []),
      ...(commandRule.patch.hiddenEntities?.remove ?? []),
      ...(commandRule.patch.selectedEntities ?? []),
      ...(commandRule.patch.isolatedEntity ? [commandRule.patch.isolatedEntity] : [])
    ];

    for (const id of ids) {
      if (!entityIds.has(id)) {
        errors.push({
          code: "unsupported_intervention",
          path: `commandRules.${commandRule.id}`,
          message: `Command "${commandRule.id}" references unknown entity "${id}".`
        });
      }
    }

    const intervention = commandRule.patch.activeIntervention;
    const affectsEntities = ids.length > 0;
    if (affectsEntities && intervention && intervention !== "baseline" && !interventionIds.has(intervention)) {
      errors.push({
        code: "unsupported_intervention",
        path: `commandRules.${commandRule.id}.patch.activeIntervention`,
        message: `Command "${commandRule.id}" references unsupported intervention "${intervention}".`
      });
    }
  }

  for (const promptRule of pack.promptRules) {
    if (!pack.biologicalContexts.includes(promptRule.context)) {
      errors.push({
        code: "invalid_context",
        path: `promptRules.${promptRule.id}.context`,
        message: `Prompt rule "${promptRule.id}" references unsupported context "${promptRule.context}".`
      });
    }

    if (promptRule.suggestedCommandId && !pack.commandRules.some((rule) => rule.id === promptRule.suggestedCommandId)) {
      errors.push({
        code: "unsupported_intervention",
        path: `promptRules.${promptRule.id}.suggestedCommandId`,
        message: `Prompt rule "${promptRule.id}" references unknown command "${promptRule.suggestedCommandId}".`
      });
    }
  }

  for (const validationRule of pack.validationRules) {
    for (const entityId of validationRule.requiredEntities ?? []) {
      if (!entityIds.has(entityId)) {
        errors.push({
          code: "missing_required_entity",
          path: `validationRules.${validationRule.id}.requiredEntities`,
          message: `Required entity "${entityId}" is missing.`
        });
      }
    }

    for (const relationRequirement of validationRule.requiredRelations ?? []) {
      const exists = pack.relations.some(
        (relationItem) =>
          relationItem.source === relationRequirement.source &&
          relationItem.target === relationRequirement.target &&
          (!relationRequirement.relation || relationItem.relation === relationRequirement.relation)
      );

      if (!exists) {
        errors.push({
          code: "validation_rule_failed",
          path: `validationRules.${validationRule.id}.requiredRelations`,
          message: `Required relation ${relationRequirement.source} -> ${relationRequirement.target} is missing.`
        });
      }
    }

    for (const limitation of validationRule.requiredLimitations ?? []) {
      if (!pack.limitations.some((value) => value.claim.includes(limitation))) {
        errors.push({
          code: "validation_rule_failed",
          path: `validationRules.${validationRule.id}.requiredLimitations`,
          message: `Required limitation containing "${limitation}" is missing.`
        });
      }
    }

    for (const parameterRequirement of validationRule.requiredParameters ?? []) {
      const parameterItem = pack.parameters.find((item) => item.id === parameterRequirement.id);

      if (!parameterItem || (
        parameterRequirement.value !== undefined &&
        parameterItem.value !== parameterRequirement.value
      )) {
        errors.push({
          code: "validation_rule_failed",
          path: `validationRules.${validationRule.id}.requiredParameters`,
          message: `Required parameter "${parameterRequirement.id}" is missing or has the wrong value.`
        });
      }
    }
  }

  return errors;
}

export function parsePromptWithPacks(
  prompt: string,
  packs: BiologicalProcessPack[]
): SpatialPromptResult {
  const resolution = resolvePromptIntent(prompt, packs);
  const normalized = normalizePrompt(prompt);

  if (!normalized) {
    return {
      supported: false,
      prompt,
      reason: "No scientific process was provided.",
      resolution
    };
  }

  if (resolution.ambiguity.length > 0) {
    return {
      supported: false,
      prompt,
      reason: resolution.ambiguity.join(" "),
      resolution
    };
  }

  const topCandidate = resolution.processCandidates[0];

  if (!topCandidate || resolution.confidence < PROCESS_CONFIDENCE_THRESHOLD) {
    return {
      supported: false,
      prompt,
      reason: packs[0]?.unsupportedMessage ?? "This prototype does not support that process yet.",
      resolution
    };
  }

  const pack = packs.find((item) => item.id === topCandidate.packId);

  if (!pack) {
    return {
      prompt,
      supported: false,
      reason: "The selected process pack is not registered.",
      resolution
    };
  }

  const context = resolution.biologicalContext.value ?? pack.defaultContext;
  const compiled = compileBiologicalProcessPack(pack, { biologicalContext: context });

  if (!compiled.ok) {
    return {
      supported: false,
      prompt,
      reason: formatCompilationErrors(compiled.errors),
      resolution
    };
  }

  const promptRule = findBestPromptRule(prompt, pack);
  const focusIntent = resolution.requestedFocus[0] ?? "show-process";
  const intent = promptRule?.intent ?? focusIntent;
  const suggestedCommandId =
    resolution.requestedIntervention?.commandId ?? promptRule?.suggestedCommandId;

  return {
    prompt,
    supported: true,
    intent,
    context,
    model: compiled.model,
    suggestedCommandId,
    resolution
  };
}

const PROCESS_CONFIDENCE_THRESHOLD = 0.38;
const AMBIGUITY_DELTA = 0.08;

const representationKeywords: Array<{
  representation: RepresentationType;
  terms: string[];
}> = [
  { representation: "scene", terms: ["show", "visualize", "animation", "moving", "scene", "3d"] },
  { representation: "timeline", terms: ["timeline", "stages", "steps", "sequence"] },
  { representation: "graph", terms: ["graph", "network", "relations", "causal"] },
  { representation: "explanation", terms: ["why", "explain", "how", "describe"] },
  { representation: "json", terms: ["json", "developer", "structured model"] }
];

const normalizedTerminology: Record<string, string> = {
  copied: "copy",
  copies: "copy",
  copying: "copy",
  visualise: "visualize",
  visualized: "visualize",
  visualizeds: "visualize",
  travelling: "moving",
  traveling: "moving",
  travels: "moving",
  travel: "moving",
  on: "along",
  polymerases: "polymerase",
  strands: "strand",
  templates: "template",
  factors: "factor",
  fragments: "fragment",
  primers: "primer",
  transcripton: "transcription",
  transcrption: "transcription",
  replicaton: "replication",
  repication: "replication",
  rna: "rna",
  dna: "dna"
};

export function resolvePromptIntent(
  prompt: string,
  packs: BiologicalProcessPack[]
): PromptIntentResolution {
  const normalized = normalizePrompt(prompt);
  const tokens = tokenizePrompt(prompt);
  const requestedRepresentation = resolveRepresentation(tokens);
  const processScores = packs
    .map((pack) => scoreProcessPack(normalized, tokens, pack))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
  const topPack = processScores[0]
    ? packs.find((pack) => pack.id === processScores[0].packId)
    : undefined;
  const biologicalContext = topPack
    ? resolveBiologicalContext(normalized, tokens, topPack)
    : { value: null, confidence: 0, matchedKeywords: [] };
  const requestedEntities = topPack ? resolveRequestedEntities(normalized, tokens, topPack) : [];
  const requestedFocus = topPack
    ? resolveRequestedFocus(normalized, tokens, topPack, requestedEntities)
    : resolveGenericFocus(tokens);
  const requestedIntervention = topPack
    ? resolveInterventionIntent(normalized, tokens, topPack)
    : undefined;
  const confidence = processScores[0]?.score ?? 0;
  const ambiguity = resolveAmbiguity(processScores, confidence);

  return {
    processCandidates: processScores,
    biologicalContext,
    requestedFocus,
    requestedEntities,
    requestedRepresentation,
    requestedIntervention,
    confidence,
    ambiguity
  };
}

function scoreProcessPack(
  normalizedPrompt: string,
  promptTokens: string[],
  pack: BiologicalProcessPack
): Candidate {
  const matchedTerms = new Set<string>();
  const reasons = new Set<string>();
  let score = 0;

  const processScore = phraseListScore(normalizedPrompt, promptTokens, [
    pack.process,
    pack.id,
    ...pack.aliases,
    ...pack.examples
  ]);
  if (processScore.score > 0) {
    score += processScore.score * 0.5;
    addMatches(matchedTerms, processScore.matches);
    reasons.add("process identity");
  }

  const promptRuleScore = phraseListScore(
    normalizedPrompt,
    promptTokens,
    pack.promptRules.flatMap((rule) => rule.hints)
  );
  if (promptRuleScore.score > 0) {
    score += promptRuleScore.score * 0.26;
    addMatches(matchedTerms, promptRuleScore.matches);
    reasons.add("prompt metadata");
  }

  const entityScore = phraseListScore(
    normalizedPrompt,
    promptTokens,
    pack.entities.flatMap((entity) => [entity.id, entity.label, ...entity.aliases])
  );
  if (entityScore.score > 0) {
    score += Math.min(0.18, entityScore.score * 0.18);
    addMatches(matchedTerms, entityScore.matches);
    reasons.add("entity metadata");
  }

  const contextScore = phraseListScore(normalizedPrompt, promptTokens, pack.biologicalContexts);
  if (contextScore.score > 0) {
    score += contextScore.score * 0.08;
    addMatches(matchedTerms, contextScore.matches);
    reasons.add("context metadata");
  }

  const commandScore = phraseListScore(
    normalizedPrompt,
    promptTokens,
    pack.commandRules.flatMap((rule) => rule.phrases)
  );
  if (commandScore.score > 0) {
    score += commandScore.score * 0.12;
    addMatches(matchedTerms, commandScore.matches);
    reasons.add("intervention metadata");
  }

  return {
    packId: pack.id,
    process: pack.process,
    score: Math.min(1, Number(score.toFixed(3))),
    matchedTerms: [...matchedTerms],
    reasons: [...reasons]
  };
}

function resolveBiologicalContext(
  normalizedPrompt: string,
  promptTokens: string[],
  pack: BiologicalProcessPack
): Context {
  const scores = pack.biologicalContexts
    .map((context) => ({
      context,
      result: phraseScore(normalizedPrompt, promptTokens, context)
    }))
    .filter((item) => item.result.score > 0.35)
    .sort((a, b) => b.result.score - a.result.score);
  const top = scores[0];

  return {
    value: top?.context ?? pack.defaultContext,
    confidence: top ? top.result.score : 0.5,
    matchedKeywords: top?.result.matches ?? []
  };
}

function resolveRequestedEntities(
  normalizedPrompt: string,
  promptTokens: string[],
  pack: BiologicalProcessPack
) {
  return pack.entities
    .map((entity) => ({
      id: entity.id,
      score: phraseListScore(normalizedPrompt, promptTokens, [
        entity.id,
        entity.label,
        ...entity.aliases
      ]).score
    }))
    .filter((entity) => entity.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .map((entity) => entity.id);
}

function resolveRequestedFocus(
  normalizedPrompt: string,
  promptTokens: string[],
  pack: BiologicalProcessPack,
  requestedEntities: string[]
) {
  const focus = new Set<string>(resolveGenericFocus(promptTokens));

  for (const rule of pack.promptRules) {
    const score = phraseListScore(normalizedPrompt, promptTokens, rule.hints).score;
    if (score >= 0.55) {
      focus.add(rule.intent);
    }
  }

  for (const entityId of requestedEntities) {
    focus.add(entityId);
  }

  return [...focus];
}

function resolveGenericFocus(promptTokens: string[]) {
  const focus: string[] = [];

  if (hasAny(promptTokens, ["why"])) {
    focus.push("explanation");
  }

  if (hasAny(promptTokens, ["how", "explain", "describe"])) {
    focus.push("mechanism");
  }

  if (hasAny(promptTokens, ["show", "visualize", "moving", "animation"])) {
    focus.push("visualization");
  }

  return focus;
}

function resolveRepresentation(promptTokens: string[]): RepresentationType | undefined {
  const scored = representationKeywords
    .map((item) => ({
      representation: item.representation,
      score: item.terms.filter((term) => promptTokens.includes(term)).length
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.representation === "scene") {
        return 1;
      }

      if (b.representation === "scene") {
        return -1;
      }

      return 0;
    });

  return scored.find((item) => item.representation !== "scene")?.representation ??
    scored[0]?.representation;
}

function resolveInterventionIntent(
  normalizedPrompt: string,
  promptTokens: string[],
  pack: BiologicalProcessPack
): InterventionIntent | undefined {
  const matches = pack.commandRules
    .flatMap((commandRule) => {
      const commandScore = phraseListScore(normalizedPrompt, promptTokens, [
        ...commandRule.phrases,
        commandRule.id
      ]);
      const interventionId = commandRule.patch.activeIntervention &&
        commandRule.patch.activeIntervention !== "baseline"
        ? commandRule.patch.activeIntervention
        : null;
      const promptRuleScores = pack.promptRules
        .filter((rule) => rule.suggestedCommandId === commandRule.id)
        .map((rule) => phraseListScore(normalizedPrompt, promptTokens, rule.hints));
      const bestPromptRuleScore = promptRuleScores
        .sort((a, b) => b.score - a.score)[0];
      const bestScore = bestPromptRuleScore && bestPromptRuleScore.score > commandScore.score
        ? bestPromptRuleScore
        : commandScore;

      return [{
        commandId: commandRule.id,
        interventionId,
        confidence: bestScore.score,
        matchedPhrase: bestScore.matches[0] ?? ""
      }];
    })
    .filter((item) => item.confidence >= 0.58)
    .sort((a, b) => b.confidence - a.confidence);

  return matches[0];
}

function resolveAmbiguity(
  candidates: Candidate[],
  confidence: number
) {
  const ambiguity: string[] = [];
  const top = candidates[0];
  const second = candidates[1];

  if (top && second && top.score - second.score <= AMBIGUITY_DELTA) {
    ambiguity.push(
      `The request is ambiguous between ${top.process} and ${second.process}; please name the process explicitly.`
    );
  }

  if (ambiguity.length === 0 && confidence > 0 && confidence < PROCESS_CONFIDENCE_THRESHOLD) {
    ambiguity.push("The request matched known biology terms but not strongly enough to select a process.");
  }

  return ambiguity.filter(Boolean);
}

function findBestPromptRule(prompt: string, pack: BiologicalProcessPack) {
  const normalized = normalizePrompt(prompt);
  const tokens = tokenizePrompt(prompt);

  return pack.promptRules
    .map((rule) => ({
      rule,
      score: phraseListScore(normalized, tokens, rule.hints).score
    }))
    .filter((item) => item.score >= 0.45)
    .sort((a, b) => b.score - a.score)[0]?.rule;
}

function phraseListScore(
  normalizedPrompt: string,
  promptTokens: string[],
  phrases: string[]
) {
  const scores = phrases.map((phrase) => phraseScore(normalizedPrompt, promptTokens, phrase));
  const matches = scores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    score: matches[0]?.score ?? 0,
    matches: matches.slice(0, 4).flatMap((item) => item.matches)
  };
}

function phraseScore(
  _normalizedPrompt: string,
  promptTokens: string[],
  phrase: string
) {
  const matchPromptTokens = toMatchTokens(promptTokens);
  const phraseTokens = toMatchTokens(tokenizePrompt(phrase));
  const normalizedPhrase = phraseTokens.join(" ");
  const normalizedMatchPrompt = matchPromptTokens.join(" ");

  if (!normalizedPhrase || phraseTokens.length === 0) {
    return { score: 0, matches: [] };
  }

  if (normalizedMatchPrompt.includes(normalizedPhrase)) {
    return {
      score: exactPhraseScore(phraseTokens.length),
      matches: [phrase]
    };
  }

  const tokenScores = phraseTokens.map((token) => bestTokenScore(token, matchPromptTokens));
  const matchedTokenScores = tokenScores.filter((score) => score >= 0.78);
  const coverage = matchedTokenScores.length / phraseTokens.length;
  const mean = tokenScores.reduce((total, score) => total + score, 0) / phraseTokens.length;
  const score = coverage >= 0.66 ? coverage * 0.7 + mean * 0.3 : 0;

  return {
    score: Number(score.toFixed(3)),
    matches: score > 0 ? [phrase] : []
  };
}

function exactPhraseScore(tokenCount: number) {
  return Math.min(1, 0.75 + tokenCount * 0.06);
}

function bestTokenScore(token: string, promptTokens: string[]) {
  return promptTokens.reduce((best, promptToken) => {
    if (token === promptToken) {
      return 1;
    }

    if (promptToken.includes(token) || token.includes(promptToken)) {
      return Math.max(best, 0.86);
    }

    return Math.max(best, fuzzyTokenScore(token, promptToken));
  }, 0);
}

function fuzzyTokenScore(a: string, b: string) {
  if (a.length < 4 || b.length < 4) {
    return 0;
  }

  const distance = levenshteinDistance(a, b);
  const score = 1 - distance / Math.max(a.length, b.length);

  return score >= 0.82 ? score : 0;
}

function levenshteinDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function normalizePrompt(value: string) {
  return tokenizePrompt(value).join(" ");
}

function tokenizePrompt(value: string) {
  return value
    .toLowerCase()
    .replace(/[′’`]/g, "'")
    .replace(/→|->/g, " to ")
    .replace(/[^a-z0-9']+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => normalizedTerminology[token] ?? singularizeToken(token));
}

const matchStopwords = new Set([
  "a",
  "an",
  "the",
  "show",
  "visualize",
  "explain",
  "describe",
  "what",
  "happen",
  "why",
  "how",
  "is",
  "are",
  "as",
  "at",
  "in",
  "of",
  "only",
  "one",
  "used",
  "use",
  "want",
  "understand"
]);

function toMatchTokens(tokens: string[]) {
  return tokens.filter((token) => !matchStopwords.has(token));
}

function singularizeToken(token: string) {
  if (token.length > 4 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return token;
}

function addMatches(target: Set<string>, matches: string[]) {
  for (const match of matches) {
    target.add(match);
  }
}

function hasAny(tokens: string[], terms: string[]) {
  return terms.some((term) => tokens.includes(term));
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
  prompt: string,
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  const result = parsePromptWithPacks(prompt, packs);

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

  return result.suggestedCommandId
    ? applyCommandRule(withModel, findCommandRule(result.model, result.suggestedCommandId))
    : withModel;
}

export function applyFollowUpCommand(
  session: SpatialSessionState,
  command: string
): SpatialSessionState {
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

  const normalized = normalizeText(command);
  const rule = session.activeModel.commandRules.find((commandRule) =>
    commandRule.phrases.some((phrase) => normalized === normalizeText(phrase))
  );

  if (!rule) {
    return {
      ...session,
      activeIntervention: "unsupported command",
      conversationHistory: [
        ...history,
        { role: "system", message: "Unsupported command. The deterministic prototype abstained." }
      ]
    };
  }

  return applyCommandRule({ ...session, conversationHistory: history }, rule);
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

export function resolveCoord(coord: Coord, progress: number) {
  return typeof coord === "number" ? coord : coord.base + coord.progress * progress;
}

export function shouldShowPrimitive(
  primitive: ScientificPrimitive,
  session: SpatialSessionState
) {
  if (primitive.visibility.mode === "labels" && !session.playback.showLabels) {
    return false;
  }

  if (primitive.visibility.mode === "directionality" && !session.playback.showDirectionality) {
    return false;
  }

  if (
    primitive.visibility.mode === "intervention" &&
    (!primitive.visibility.interventions?.includes(session.activeIntervention))
  ) {
    return false;
  }

  if (!primitive.entityId) {
    return true;
  }

  if (session.hiddenEntities.includes(primitive.entityId)) {
    return false;
  }

  if (!session.isolatedEntity) {
    return true;
  }

  const group = session.activeModel?.renderPlan.isolationGroups[session.isolatedEntity] ?? [
    session.isolatedEntity
  ];

  return group.includes(primitive.entityId);
}

function applyCommandRule(
  session: SpatialSessionState,
  commandRule: CommandRule | undefined
): SpatialSessionState {
  if (!commandRule) {
    return session;
  }

  const patch = commandRule.patch;
  const hiddenReset = patch.hiddenEntities?.reset ? [] : session.hiddenEntities;
  const hiddenRemoved = hiddenReset.filter(
    (id) => !(patch.hiddenEntities?.remove ?? []).includes(id)
  );
  const hiddenEntities = [
    ...hiddenRemoved,
    ...(patch.hiddenEntities?.add ?? []).filter((id) => !hiddenRemoved.includes(id))
  ];
  const playback = patch.playback?.reset
    ? createInitialSession().playback
    : { ...session.playback, ...patch.playback };

  return {
    ...session,
    hiddenEntities,
    selectedEntities: patch.selectedEntities ?? session.selectedEntities,
    isolatedEntity:
      patch.isolatedEntity === undefined ? session.isolatedEntity : patch.isolatedEntity,
    activeIntervention: patch.activeIntervention ?? commandRule.id,
    representationMode: patch.representationMode ?? session.representationMode,
    playback,
    conversationHistory: [
      ...session.conversationHistory,
      { role: "system", message: commandRule.response }
    ]
  };
}

function findCommandRule(model: ScientificModel, id: string) {
  return model.commandRules.find((commandRule) => commandRule.id === id);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/[?.!]+$/g, "");
}

function requireText(
  value: string,
  path: string,
  errors: CompilationError[]
) {
  if (!value || value.trim().length === 0) {
    errors.push({
      code: "missing_required_field",
      path,
      message: `${path} is required.`
    });
  }
}

function requireNonEmptyArray<T>(
  value: T[],
  path: string,
  errors: CompilationError[]
) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push({
      code: "missing_required_field",
      path,
      message: `${path} must contain at least one item.`
    });
  }
}

function collectDuplicateIds(
  items: Array<{ id: string }>,
  path: string,
  errors: CompilationError[]
) {
  const seen = new Set<string>();

  for (const item of items) {
    if (!item.id || item.id.trim().length === 0) {
      errors.push({
        code: "missing_required_field",
        path,
        message: `${path} contains an item without an id.`
      });
      continue;
    }

    if (seen.has(item.id)) {
      errors.push({
        code: "duplicate_id",
        path,
        message: `${path} contains duplicate id "${item.id}".`
      });
    }

    seen.add(item.id);
  }
}

function validateClaimProvenance(
  provenance: ScientificClaimProvenance[],
  path: string,
  sources: ScientificSource[],
  errors: CompilationError[],
  claimStatus: ScientificClaimStatus = "verified"
) {
  if (!Array.isArray(provenance) || provenance.length === 0) {
    if (claimStatus === "verified") {
      errors.push({
        code: "validation_rule_failed",
        path,
        message: "Verified claims must include claim-level provenance."
      });
    }
    return;
  }

  const sourceIds = new Set(sources.map((source) => source.id));

  for (const [index, item] of provenance.entries()) {
    const itemPath = `${path}.${index}`;

    if (!sourceIds.has(item.sourceId)) {
      errors.push({
        code: "validation_rule_failed",
        path: itemPath,
        message: `Provenance references unknown source "${item.sourceId}".`
      });
    }

    if (
      !item.title ||
      !item.authorsOrInstitution ||
      !item.urlOrDoi ||
      !item.publicationType ||
      !item.accessDate ||
      !item.supportedClaim ||
      !item.supportType ||
      !item.claimStatus
    ) {
      errors.push({
        code: "validation_rule_failed",
        path: itemPath,
        message: "Provenance must include source ID, title, authors/institution, URL or DOI, publication type, access date, confidence, supported claim, support type, and claim status."
      });
    }

    if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 1) {
      errors.push({
        code: "validation_rule_failed",
        path: itemPath,
        message: "Provenance confidence must be a number from 0 to 1."
      });
    }

    if (item.claimStatus === "verified" && item.confidence < 0.7) {
      errors.push({
        code: "validation_rule_failed",
        path: itemPath,
        message: "Verified claims require provenance confidence of at least 0.7."
      });
    }
  }
}

function issueFromCompilationError(error: CompilationError): LayeredValidationIssue {
  return {
    ...error,
    layer: layerForCompilationError(error),
    severity: error.code === "unsupported_claim" ? "abstain" : "error",
    abstentionReason: error.code === "unsupported_claim" ? error.message : undefined
  };
}

function layerForCompilationError(error: CompilationError): ValidationLayer {
  if (error.path.startsWith("entities") || error.code === "missing_required_entity") {
    return "entity_existence";
  }

  if (error.path.startsWith("relations") || error.code === "invalid_relation_target") {
    return "relation_integrity";
  }

  if (error.path.startsWith("states") || error.path.startsWith("transitions") || error.code === "invalid_stage_reference" || error.code === "invalid_transition_reference") {
    return "stage_order";
  }

  if (error.path.startsWith("interventions") || error.path.startsWith("commandRules") || error.code === "unsupported_intervention") {
    return "intervention_validity";
  }

  if (error.path.startsWith("sources") || error.path.includes("provenance")) {
    return "source_coverage";
  }

  if (error.path.startsWith("animation")) {
    return "visualization_honesty";
  }

  if (error.path.startsWith("validationRules")) {
    return "biological_invariants";
  }

  return "schema_integrity";
}

function validateStageOrderLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  const issues: LayeredValidationIssue[] = [];
  const orderByState = new Map(pack.states.map((state) => [state.id, state.order]));
  const orders = pack.states.map((state) => state.order);

  if (new Set(orders).size !== orders.length) {
    issues.push(layerIssue("stage_order", "invalid_stage_order", "states.order", "Stage order values must be unique."));
  }

  for (const transitionItem of pack.transitions) {
    const fromOrder = orderByState.get(transitionItem.from);
    const toOrder = orderByState.get(transitionItem.to);

    if (fromOrder !== undefined && toOrder !== undefined && fromOrder >= toOrder) {
      issues.push(layerIssue(
        "stage_order",
        "invalid_stage_order",
        `transitions.${transitionItem.id}`,
        `Transition "${transitionItem.id}" must move from an earlier stage to a later stage.`
      ));
    }
  }

  return issues;
}

function validateBiologicalInvariantLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  if (pack.id === "dna-replication") {
    return validateDnaInvariantLayer(pack);
  }

  if (pack.id === "eukaryotic-transcription") {
    return validateTranscriptionInvariantLayer(pack);
  }

  return [];
}

function validateDnaInvariantLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  const issues: LayeredValidationIssue[] = [];

  requireParameterValue(pack, issues, "directionality", "5' -> 3'", "DNA synthesis must be encoded as 5' -> 3'.");
  requireParameterValue(pack, issues, "template-reading-direction", "3' -> 5'", "Template reading must be encoded as 3' -> 5'.");
  requireRelation(pack, issues, "dna-polymerase", "leading-strand", "extends continuously", "Leading-strand synthesis must be continuous.");
  requireRelation(pack, issues, "dna-polymerase", "lagging-strand", "extends discontinuously", "Lagging-strand synthesis must be discontinuous.");
  requireRelation(pack, issues, "okazaki-fragments", "lagging-strand", undefined, "Okazaki fragments must occur on the lagging strand.");
  requireRelation(pack, issues, "ligase", "okazaki-fragments", "seals nicks", "Ligase must seal nicks.");

  if (relationText(pack).includes("ligase synthesizes") || relationText(pack).includes("ligase synthesize")) {
    issues.push(layerIssue("biological_invariants", "validation_rule_failed", "relations.ligase", "Ligase must not be represented as synthesizing DNA fragments."));
  }

  const primed = pack.states.find((state) => state.id === "primed");
  const extension = pack.states.find((state) => state.id === "extension");
  if (!primed || !extension || primed.order >= extension.order) {
    issues.push(layerIssue("biological_invariants", "validation_rule_failed", "states.primed", "Primers must precede DNA extension."));
  }

  return issues;
}

function validateTranscriptionInvariantLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  const issues: LayeredValidationIssue[] = [];

  requireParameterValue(pack, issues, "rna-synthesis-direction", "5' -> 3'", "RNA synthesis must be encoded as 5' -> 3'.");
  requireRelation(pack, issues, "rna-polymerase-ii", "template-strand", "reads", "RNA polymerase II must read the template strand.");
  requireRelation(pack, issues, "template-strand", "growing-rna-transcript", "templates", "RNA sequence must be complementary to the template strand.");
  requireRelation(pack, issues, "coding-strand", "growing-rna-transcript", "corresponds to", "Coding strand must correspond to RNA except T/U.");

  const codingRelation = pack.relations.find((relationItem) =>
    relationItem.source === "coding-strand" &&
    relationItem.target === "growing-rna-transcript"
  );
  if (codingRelation && !normalizeText(codingRelation.description).includes("except thymine is replaced by uracil")) {
    issues.push(layerIssue("biological_invariants", "validation_rule_failed", `relations.${codingRelation.id}`, "Coding strand/RNA relation must state the T/U difference."));
  }

  return issues;
}

function validateUnitConsistencyLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  const issues: LayeredValidationIssue[] = [];

  for (const parameterItem of pack.parameters) {
    if (parameterItem.unit === "normalized" && (
      typeof parameterItem.value !== "number" ||
      parameterItem.value < 0 ||
      parameterItem.value > 1
    )) {
      issues.push(layerIssue("unit_consistency", "unit_consistency_failed", `parameters.${parameterItem.id}`, "Normalized parameters must be numeric values from 0 to 1."));
    }

    if (parameterItem.unit === "relative" && typeof parameterItem.value !== "number") {
      issues.push(layerIssue("unit_consistency", "unit_consistency_failed", `parameters.${parameterItem.id}`, "Relative parameters must be numeric."));
    }
  }

  return issues;
}

function validateVisualizationHonestyLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  const text = claimCorpus(pack);
  const issues: LayeredValidationIssue[] = [];

  if (!text.includes("schematic") || !text.includes("molecularly exact")) {
    issues.push(layerIssue("visualization_honesty", "visualization_honesty_failed", "limitations", "Schematic visualizations must explicitly warn that they are not molecularly exact."));
  }

  if (
    pack.animation.subtitle.toLowerCase().includes("molecularly exact") &&
    !isNegatedMisconceptionCorrection(pack.animation.subtitle)
  ) {
    issues.push(layerIssue("visualization_honesty", "visualization_honesty_failed", "animation.subtitle", "Animation subtitle must not describe schematic motion as molecularly exact."));
  }

  return issues;
}

function validateUnsupportedClaimLayer(pack: BiologicalProcessPack): LayeredValidationIssue[] {
  const unsupportedPatterns = unsupportedClaimPatternsForPack(pack);
  const issues: LayeredValidationIssue[] = [];

  if (unsupportedPatterns.length === 0) {
    return issues;
  }

  for (const claim of collectDisplayedClaims(pack)) {
    if (claim.status !== "verified") {
      continue;
    }

    if (isNegatedMisconceptionCorrection(claim.text)) {
      continue;
    }

    for (const unsupported of unsupportedPatterns) {
      if (unsupported.pattern.test(claim.text)) {
        issues.push(layerIssue(
          "unsupported_claim_detection",
          "unsupported_claim",
          claim.path,
          unsupported.message,
          "abstain",
          unsupported.message
        ));
      }
    }
  }

  return issues;
}

function unsupportedClaimPatternsForPack(pack: BiologicalProcessPack) {
  if (pack.id === "dna-replication") {
    return [
      {
        pattern: /dna polymerase synthesizes.*3'? to 5'?|dna synthesis.*3'? to 5'?/i,
        message: "DNA polymerase synthesis direction claim is unsupported."
      },
      {
        pattern: /template reading direction\s+5'? (?:->|to) 3'?|reads? (?:the )?template strand 5'? (?:->|to) 3'?/i,
        message: "DNA template reading direction claim is unsupported."
      },
      {
        pattern: /leading.*discontinuous/i,
        message: "Leading-strand discontinuous synthesis claim is unsupported."
      },
      {
        pattern: /lagging.*continuous/i,
        message: "Lagging-strand continuous synthesis claim is unsupported."
      },
      {
        pattern: /okazaki.*leading/i,
        message: "Okazaki fragments on the leading strand is unsupported."
      },
      {
        pattern: /ligase.*synthesizes.*fragment|ligase.*synthesize.*fragment/i,
        message: "Ligase synthesizing fragments is unsupported."
      }
    ];
  }

  if (pack.id === "eukaryotic-transcription") {
    return [
      {
        pattern: /rna.*synthesized.*3'? to 5'?|rna synthesis.*3'? to 5'?/i,
        message: "RNA synthesis 3' to 5' is unsupported."
      },
      {
        pattern: /polymerase.*reads.*coding strand|coding strand.*read by.*polymerase/i,
        message: "RNA polymerase reading the coding strand is unsupported for this transcription model."
      },
      {
        pattern: /rna.*identical.*template/i,
        message: "RNA identical to template strand is unsupported."
      }
    ];
  }

  return [];
}

function requireParameterValue(
  pack: BiologicalProcessPack,
  issues: LayeredValidationIssue[],
  id: string,
  value: ScientificParameter["value"],
  message: string
) {
  if (!pack.parameters.some((parameterItem) => parameterItem.id === id && parameterItem.value === value)) {
    issues.push(layerIssue("biological_invariants", "validation_rule_failed", `parameters.${id}`, message));
  }
}

function requireRelation(
  pack: BiologicalProcessPack,
  issues: LayeredValidationIssue[],
  source: string,
  target: string,
  relationLabel: string | undefined,
  message: string
) {
  const exists = pack.relations.some((relationItem) =>
    relationItem.source === source &&
    relationItem.target === target &&
    (!relationLabel || relationItem.relation === relationLabel)
  );

  if (!exists) {
    issues.push(layerIssue("biological_invariants", "validation_rule_failed", `relations.${source}.${target}`, message));
  }
}

function layerIssue(
  layer: ValidationLayer,
  code: CompilationErrorCode,
  path: string,
  message: string,
  severity: ValidationIssueSeverity = "error",
  abstentionReason?: string
): LayeredValidationIssue {
  return { layer, code, path, message, severity, abstentionReason };
}

function createEmptyLayerMap(): Record<ValidationLayer, LayeredValidationIssue[]> {
  return {
    schema_integrity: [],
    entity_existence: [],
    relation_integrity: [],
    stage_order: [],
    biological_invariants: [],
    unit_consistency: [],
    intervention_validity: [],
    source_coverage: [],
    visualization_honesty: [],
    unsupported_claim_detection: []
  };
}

function relationText(pack: BiologicalProcessPack) {
  return pack.relations
    .map((relationItem) => `${relationItem.relation} ${relationItem.description}`)
    .join(" ")
    .toLowerCase();
}

function claimCorpus(pack: BiologicalProcessPack) {
  return collectDisplayedClaims(pack)
    .map((claim) => claim.text)
    .join(" ")
    .toLowerCase();
}

function collectDisplayedClaims(pack: BiologicalProcessPack) {
  return [
    ...pack.entities.map((entityItem) => ({ path: `entities.${entityItem.id}`, text: entityItem.description, status: "verified" as const })),
    ...pack.relations.map((relationItem) => ({ path: `relations.${relationItem.id}`, text: `${relationItem.relation} ${relationItem.description}`, status: "verified" as const })),
    ...pack.states.map((stateItem) => ({ path: `states.${stateItem.id}`, text: stateItem.description, status: "verified" as const })),
    ...pack.transitions.map((transitionItem) => ({ path: `transitions.${transitionItem.id}`, text: `${transitionItem.trigger} ${transitionItem.rule}`, status: "verified" as const })),
    ...pack.parameters.map((parameterItem) => ({ path: `parameters.${parameterItem.id}`, text: `${parameterItem.label} ${parameterItem.value} ${parameterItem.description}`, status: "verified" as const })),
    ...pack.assumptions.map((claim) => ({ path: `assumptions.${claim.id}`, text: claim.claim, status: claim.status })),
    ...pack.limitations.map((claim) => ({ path: `limitations.${claim.id}`, text: claim.claim, status: claim.status })),
    ...pack.representationRules.map((claim) => ({ path: `representationRules.${claim.id}`, text: claim.claim, status: claim.status })),
    ...pack.commonMisconceptions.map((claim) => ({ path: `commonMisconceptions.${claim.id}`, text: claim.claim, status: claim.status }))
  ];
}

function isNegatedMisconceptionCorrection(text: string) {
  return /\bnot\b|does not|do not|must not|cannot/.test(text.toLowerCase());
}

function formatCompilationErrors(errors: CompilationError[]) {
  return errors
    .map((error) => `${error.code} at ${error.path}: ${error.message}`)
    .join("; ");
}
