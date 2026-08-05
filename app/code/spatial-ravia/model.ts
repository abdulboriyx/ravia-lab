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
  | "mixed"
  | "molecular-structure"
  | "timeline"
  | "graph"
  | "voltage-graph"
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
  modelDelta?: ScientificModelDelta;
};

export type ScientificModelDeltaOperation =
  | {
      type: "SET_PARAMETER";
      parameterId: string;
      value: ScientificParameter["value"];
    }
  | {
      type: "SET_ENTITY_STATE";
      entityId: string;
      state: "present" | "absent" | "stopped" | "inaccessible" | "disabled";
    }
  | {
      type: "SET_TRANSITION_STATE";
      transitionId: string;
      state: "enabled" | "blocked" | "unsupported";
    }
  | {
      type: "ADD_RELATION_QUALIFIER";
      relationId: string;
      qualifier: string;
    };

export type CounterfactualClaim = {
  id: string;
  claim: string;
  status: "direct-intervention" | "predicted-downstream" | "unsupported-outcome";
  classification: "schematic" | "quantitative";
};

export type ScientificModelDelta = {
  id: string;
  label: string;
  interventionId: string;
  operations: ScientificModelDeltaOperation[];
  directInterventions: CounterfactualClaim[];
  predictedConsequences: CounterfactualClaim[];
  unsupportedOutcomes: CounterfactualClaim[];
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
    message?: string;
  }>;
  requiredLimitations?: string[];
  requiredParameters?: Array<{
    id: string;
    value?: ScientificParameter["value"];
    message?: string;
  }>;
  requiredStageOrder?: Array<{
    before: string;
    after: string;
    message?: string;
  }>;
  requiredClaimText?: Array<{
    path: "relations" | "claims";
    entityId?: string;
    includes: string;
    message?: string;
  }>;
  forbiddenClaimText?: Array<{
    path: "relations" | "claims";
    entityId?: string;
    includes: string;
    message: string;
  }>;
  forbiddenVerifiedClaimPatterns?: Array<{
    pattern: string;
    message: string;
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

export type ScientificModelDifference = {
  path: string;
  baseline: string;
  counterfactual: string;
  source: "direct-intervention" | "predicted-downstream" | "unsupported-outcome";
  classification: "schematic" | "quantitative";
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

export type ConversationTurn = {
  role: "user" | "system";
  message: string;
};

export type ScientificSessionEventType =
  | "PROCESS_SELECTED"
  | "UNSUPPORTED_PROMPT"
  | "CONVERSATION_TURN_ADDED"
  | "ENTITY_SELECTED"
  | "ENTITY_HIDDEN"
  | "ENTITY_SHOWN"
  | "ENTITY_ISOLATED"
  | "INTERVENTION_APPLIED"
  | "REPRESENTATION_CHANGED"
  | "PLAYBACK_CHANGED"
  | "TIMELINE_MOVED"
  | "CONTEXT_CHANGED"
  | "BRANCH_CREATED"
  | "BRANCH_SWITCHED"
  | "MODEL_DELTA_APPLIED"
  | "SESSION_RESET";

export type ScientificSessionEvent =
  | {
      type: "PROCESS_SELECTED";
      prompt: string;
      packId: string;
      biologicalContext: string;
      intent: string;
      validation: LayeredValidationResult;
    }
  | {
      type: "UNSUPPORTED_PROMPT";
      prompt: string;
      reason: string;
    }
  | {
      type: "CONVERSATION_TURN_ADDED";
      turn: ConversationTurn;
    }
  | {
      type: "ENTITY_SELECTED";
      entityIds: string[];
    }
  | {
      type: "ENTITY_HIDDEN";
      entityIds: string[];
    }
  | {
      type: "ENTITY_SHOWN";
      entityIds: string[];
    }
  | {
      type: "ENTITY_ISOLATED";
      entityId: string | null;
      entityIds: string[];
    }
  | {
      type: "INTERVENTION_APPLIED";
      interventionId: string;
    }
  | {
      type: "REPRESENTATION_CHANGED";
      representationMode: RepresentationMode;
    }
  | {
      type: "PLAYBACK_CHANGED";
      playback: Partial<PlaybackState> & { reset?: boolean };
    }
  | {
      type: "TIMELINE_MOVED";
      timelinePosition: number;
    }
  | {
      type: "CONTEXT_CHANGED";
      biologicalContext: string;
    }
  | {
      type: "BRANCH_CREATED";
      branchId: string;
      name: string;
      sourceBranchId: string;
    }
  | {
      type: "BRANCH_SWITCHED";
      branchId: string;
    }
  | {
      type: "MODEL_DELTA_APPLIED";
      branchId: string;
      delta: ScientificModelDelta;
    }
  | {
      type: "SESSION_RESET";
    };

export type ScientificModelBranch = {
  id: string;
  name: string;
  sourceBranchId: string | null;
  model: ScientificModel | null;
  modelVersion: number;
  representationMode: RepresentationMode;
  selectedEntities: string[];
  hiddenEntities: string[];
  isolatedEntity: string | null;
  playback: PlaybackState;
  interventions: string[];
  appliedDeltas: ScientificModelDelta[];
  differences: ScientificModelDifference[];
  directInterventions: CounterfactualClaim[];
  predictedConsequences: CounterfactualClaim[];
  unsupportedOutcomes: CounterfactualClaim[];
};

export type SpatialSessionState = {
  sessionId: string;
  initialPrompt: string;
  currentPrompt: string;
  selectedProcessPackId: string | null;
  activeModel: ScientificModel | null;
  modelVersion: number;
  baselineModel: ScientificModel | null;
  activeBranchId: string;
  branches: ScientificModelBranch[];
  selectedEntities: string[];
  hiddenEntities: string[];
  isolatedEntity: string | null;
  activeIntervention: string;
  representationMode: RepresentationMode;
  playback: PlaybackState;
  interventions: string[];
  conversationHistory: ConversationTurn[];
  validationResults: LayeredValidationResult | null;
  provenance: ScientificClaimProvenance[];
  modelChangeHistory: string[];
  eventLog: ScientificSessionEvent[];
  undoneEvents: ScientificSessionEvent[];
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
  const unsupportedReason = unsupportedScientificPromptReason(normalized);

  if (!normalized) {
    return {
      supported: false,
      prompt,
      reason: "No scientific process was provided.",
      resolution
    };
  }

  if (unsupportedReason) {
    return {
      supported: false,
      prompt,
      reason: unsupportedReason,
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
  { representation: "mixed", terms: ["mixed", "workspace", "synchronized"] },
  { representation: "molecular-structure", terms: ["structure", "pdb", "molstar", "experimental"] },
  { representation: "timeline", terms: ["timeline", "stages", "steps", "sequence"] },
  { representation: "graph", terms: ["graph", "network", "relations", "causal"] },
  { representation: "voltage-graph", terms: ["voltage graph", "voltage trace", "voltage over time"] },
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
  helcase: "helicase",
  promotor: "promoter",
  potentil: "potential",
  depolarizaton: "depolarization",
  repolarizaton: "repolarization",
  sodum: "sodium",
  rna: "rna",
  dna: "dna"
};

const unsupportedPromptPatterns: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\bbacterial\b.*\brna polymerase ii\b|\brna polymerase ii\b.*\bbacterial\b/,
    reason: "RNA polymerase II is eukaryotic in this model; bacterial RNA polymerase II transcription is unsupported."
  },
  {
    pattern: /\bdna\b.*\brna polymerase\b.*\btogether\b|\bdna\b.*\brna polymerase\b.*\bpolymerase\b/,
    reason: "The request mixes DNA replication and RNA polymerase processes and needs clarification."
  },
  {
    pattern: /\bligase\b.*\b(synthesize|synthesizes|synthesizing|copy|copies|copying)\b.*\b(okazaki|fragment|leading strand)\b/,
    reason: "DNA ligase seals nicks; it does not synthesize fragments or copy strands in this model."
  },
  {
    pattern: /\bsodium channel\b.*\b(driving|drive|drives|causing|cause|causes)\b.*\brepolarization\b/,
    reason: "Sodium channels drive depolarization, not repolarization, in this action-potential model."
  },
  {
    pattern: /\bpotassium channel\b.*\b(driving|drive|drives|causing|cause|causes)\b.*\bdepolarization\b/,
    reason: "Potassium channels drive repolarization and hyperpolarization, not depolarization, in this model."
  },
  {
    pattern: /\brna polymerase\b.*\b(read|reads|reading)\b.*\bcoding strand\b/,
    reason: "RNA polymerase reads the template strand, not the coding strand, in this transcription model."
  },
  {
    pattern: /\bremove\b.*\bmembrane\b.*\btranscription\b/,
    reason: "Removing a membrane from transcription is a cross-process intervention and is unsupported."
  },
  {
    pattern: /\b(block|remove|delete)\b.*\brna polymerase ii\b.*\bdna replication\b/,
    reason: "RNA polymerase II is not an intervention target for DNA replication in this model."
  },
  {
    pattern: /\bsodium channel\b.*\b(synthesize|synthesizes|transcribe|transcribes)\b.*\brna\b/,
    reason: "Sodium channels do not synthesize RNA in this model."
  },
  {
    pattern: /\b(delete|remove)\b.*\bokazaki\b.*\btranscription\b/,
    reason: "Okazaki fragments are DNA replication entities, not transcription entities."
  },
  {
    pattern: /\bdna replication\b.*\brna polymerase ii\b|\brna polymerase ii\b.*\bdna replication\b/,
    reason: "DNA replication and RNA polymerase II transcription are distinct process packs; the request is conflicting."
  },
  {
    pattern: /\btranscription\b.*\bcopy\b.*\bboth\b.*\bdna strand\b.*\bdna\b/,
    reason: "Transcription does not copy both DNA strands into DNA in this model."
  },
  {
    pattern: /\baction potential\b.*\bokazaki\b|\bokazaki\b.*\baction potential\b/,
    reason: "Okazaki fragments are DNA replication entities, not action-potential entities."
  },
  {
    pattern: /\bdna replication\b.*\bwithout dna polymerase\b.*\bnormal\b/,
    reason: "DNA replication cannot keep normal synthesis while removing DNA polymerase in this model."
  },
  {
    pattern: /\btranscription\b.*\bremove\b.*\btemplate strand\b.*\bstill\b.*\btranscribe\b/,
    reason: "Template-strand removal conflicts with continued transcription in this model."
  },
  {
    pattern: /\bbypass provenance\b|\bmark\b.*\bdrug dosing\b.*\bproven\b/,
    reason: "Bypassing provenance or marking unsupported drug dosing as proven is not allowed."
  },
  {
    pattern: /\binvent\b.*\bpdb\b|\bexact replication fork\b.*\bpdb\b/,
    reason: "The system must not invent PDB structures for uncurated exact molecular scenes."
  }
];

function unsupportedScientificPromptReason(normalizedPrompt: string) {
  for (const { pattern, reason } of unsupportedPromptPatterns) {
    if (pattern.test(normalizedPrompt)) {
      return reason;
    }
  }

  return null;
}

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

    if (
      token.length >= 4 &&
      promptToken.length >= 4 &&
      (promptToken.includes(token) || token.includes(promptToken))
    ) {
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
    sessionId: "local-scientific-session",
    initialPrompt: "",
    currentPrompt: "",
    selectedProcessPackId: null,
    activeModel: null,
    modelVersion: 0,
    baselineModel: null,
    activeBranchId: "baseline",
    branches: [],
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
    interventions: [],
    conversationHistory: [],
    validationResults: null,
    provenance: [],
    modelChangeHistory: [],
    eventLog: [],
    undoneEvents: []
  };
}

export function startSessionFromPrompt(
  session: SpatialSessionState,
  prompt: string,
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  const result = parsePromptWithPacks(prompt, packs);

  if (!result.supported) {
    return dispatchScientificSessionEvents(session, [
      { type: "UNSUPPORTED_PROMPT", prompt, reason: result.reason },
      { type: "CONVERSATION_TURN_ADDED", turn: { role: "user", message: prompt } },
      { type: "CONVERSATION_TURN_ADDED", turn: { role: "system", message: result.reason } }
    ], packs);
  }

  const packId = result.resolution.processCandidates[0]?.packId;
  const pack = packId ? packs.find((item) => item.id === packId) : null;
  const validation = pack ? validateBiologicalProcessPackLayered(pack) : null;
  const withModel = dispatchScientificSessionEvents(createInitialSession(), [
    {
      type: "PROCESS_SELECTED",
      prompt,
      packId: packId ?? result.model.process,
      biologicalContext: result.context,
      intent: result.intent,
      validation: validation ?? createEmptyLayeredValidation()
    },
    { type: "PLAYBACK_CHANGED", playback: { ...session.playback, playing: true, timelinePosition: 0 } },
    { type: "CONVERSATION_TURN_ADDED", turn: { role: "user", message: prompt } },
    {
      type: "CONVERSATION_TURN_ADDED",
      turn: { role: "system", message: `Loaded ${result.model.process}: ${result.intent}` }
    }
  ], packs);

  return result.suggestedCommandId
    ? applyCommandRule(withModel, findCommandRule(result.model, result.suggestedCommandId), packs)
    : withModel;
}

export function applyFollowUpCommand(
  session: SpatialSessionState,
  command: string
): SpatialSessionState {
  if (!session.activeModel) {
    return dispatchScientificSessionEvents(session, [
      { type: "CONVERSATION_TURN_ADDED", turn: { role: "user", message: command } },
      { type: "INTERVENTION_APPLIED", interventionId: "no active model" },
      {
        type: "CONVERSATION_TURN_ADDED",
        turn: { role: "system", message: "Generate a supported process before applying commands." }
      }
    ]);
  }

  const normalized = normalizeText(command);
  const rule = session.activeModel.commandRules.find((commandRule) =>
    commandRule.phrases.some((phrase) => normalized === normalizeText(phrase))
  );

  if (!rule) {
    return dispatchScientificSessionEvents(session, [
      { type: "CONVERSATION_TURN_ADDED", turn: { role: "user", message: command } },
      { type: "INTERVENTION_APPLIED", interventionId: "unsupported command" },
      {
        type: "CONVERSATION_TURN_ADDED",
        turn: { role: "system", message: "Unsupported command. The deterministic prototype abstained." }
      }
    ]);
  }

  return applyCommandRule(
    dispatchScientificSessionEvent(session, {
      type: "CONVERSATION_TURN_ADDED",
      turn: { role: "user", message: command }
    }),
    rule
  );
}

export function setRepresentationMode(
  session: SpatialSessionState,
  representationMode: RepresentationMode
): SpatialSessionState {
  return dispatchScientificSessionEvent(session, {
    type: "REPRESENTATION_CHANGED",
    representationMode
  });
}

export function setTimelinePosition(
  session: SpatialSessionState,
  timelinePosition: number
): SpatialSessionState {
  return dispatchScientificSessionEvents(session, [
    { type: "PLAYBACK_CHANGED", playback: { playing: false } },
    { type: "TIMELINE_MOVED", timelinePosition }
  ]);
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
  commandRule: CommandRule | undefined,
  packs?: BiologicalProcessPack[]
): SpatialSessionState {
  if (!commandRule) {
    return session;
  }

  const patch = commandRule.patch;
  const events: ScientificSessionEvent[] = [];

  if (patch.hiddenEntities?.reset) {
    events.push({ type: "ENTITY_SHOWN", entityIds: [...session.hiddenEntities] });
  }

  if (patch.hiddenEntities?.remove?.length) {
    events.push({ type: "ENTITY_SHOWN", entityIds: patch.hiddenEntities.remove });
  }

  if (patch.hiddenEntities?.add?.length) {
    events.push({ type: "ENTITY_HIDDEN", entityIds: patch.hiddenEntities.add });
  }

  if (patch.selectedEntities) {
    events.push({ type: "ENTITY_SELECTED", entityIds: patch.selectedEntities });
  }

  if (patch.isolatedEntity !== undefined) {
    events.push({
      type: "ENTITY_ISOLATED",
      entityId: patch.isolatedEntity,
      entityIds: patch.isolatedEntity
        ? session.activeModel?.renderPlan.isolationGroups[patch.isolatedEntity] ?? [patch.isolatedEntity]
        : []
    });
  }

  events.push({
    type: "INTERVENTION_APPLIED",
    interventionId: patch.activeIntervention ?? commandRule.id
  });

  if (patch.representationMode) {
    events.push({
      type: "REPRESENTATION_CHANGED",
      representationMode: patch.representationMode
    });
  }

  if (patch.playback) {
    events.push({
      type: "PLAYBACK_CHANGED",
      playback: patch.playback
    });
  }

  events.push({
    type: "CONVERSATION_TURN_ADDED",
    turn: { role: "system", message: commandRule.response }
  });

  return dispatchScientificSessionEvents(session, events, packs);
}

function findCommandRule(model: ScientificModel, id: string) {
  return model.commandRules.find((commandRule) => commandRule.id === id);
}

export function dispatchScientificSessionEvent(
  session: SpatialSessionState,
  event: ScientificSessionEvent,
  packs: BiologicalProcessPack[] = []
): SpatialSessionState {
  return dispatchScientificSessionEvents(session, [event], packs);
}

export function dispatchScientificSessionEvents(
  session: SpatialSessionState,
  events: ScientificSessionEvent[],
  packs: BiologicalProcessPack[] = []
): SpatialSessionState {
  return events.reduce((current, event) => ({
    ...syncActiveBranch(applyScientificSessionEvent(current, event, packs)),
    eventLog: [...current.eventLog, event],
    undoneEvents: []
  }), session);
}

export function replayScientificSessionEvents(
  events: ScientificSessionEvent[],
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  return events.reduce(
    (session, event) => syncActiveBranch(applyScientificSessionEvent(session, event, packs)),
    createInitialSession()
  );
}

export function undoScientificSessionEvent(
  session: SpatialSessionState,
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  if (session.eventLog.length === 0) {
    return session;
  }

  const undoStart = findUndoStartIndex(session.eventLog);
  const eventLog = session.eventLog.slice(0, undoStart);
  const removedEvents = session.eventLog.slice(undoStart);

  return {
    ...replayScientificSessionEvents(eventLog, packs),
    eventLog,
    undoneEvents: [...removedEvents, ...session.undoneEvents]
  };
}

export function redoScientificSessionEvent(
  session: SpatialSessionState,
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  if (session.undoneEvents.length === 0) {
    return session;
  }

  return {
    ...dispatchScientificSessionEvents(
      { ...session, undoneEvents: [] },
      session.undoneEvents,
      packs
    ),
    undoneEvents: []
  };
}

export function resetScientificSession(session: SpatialSessionState): SpatialSessionState {
  return dispatchScientificSessionEvent(session, { type: "SESSION_RESET" });
}

export function createCounterfactualBranch(
  session: SpatialSessionState,
  name: string
): SpatialSessionState {
  const branchId = createBranchId(name, session.branches);

  return dispatchScientificSessionEvents(session, [
    {
      type: "BRANCH_CREATED",
      branchId,
      name,
      sourceBranchId: session.activeBranchId
    },
    {
      type: "BRANCH_SWITCHED",
      branchId
    }
  ]);
}

export function switchScientificBranch(
  session: SpatialSessionState,
  branchId: string
): SpatialSessionState {
  return dispatchScientificSessionEvent(session, {
    type: "BRANCH_SWITCHED",
    branchId
  });
}

export function returnToBaselineBranch(session: SpatialSessionState): SpatialSessionState {
  return switchScientificBranch(session, "baseline");
}

export function applyCounterfactualIntervention(
  session: SpatialSessionState,
  interventionId: string
): SpatialSessionState {
  const intervention = session.activeModel?.interventions.find((item) => item.id === interventionId);

  if (!intervention?.modelDelta) {
    return dispatchScientificSessionEvent(session, {
      type: "INTERVENTION_APPLIED",
      interventionId: `unsupported counterfactual: ${interventionId}`
    });
  }

  return dispatchScientificSessionEvent(session, {
    type: "MODEL_DELTA_APPLIED",
    branchId: session.activeBranchId,
    delta: intervention.modelDelta
  });
}

export function compareActiveBranchToBaseline(
  session: SpatialSessionState
): ScientificModelDifference[] {
  const branch = getActiveBranch(session);
  const baseline = getBaselineBranch(session);

  if (!branch || !baseline) {
    return [];
  }

  return compareBranches(baseline, branch);
}

export function serializeScientificSession(session: SpatialSessionState) {
  return JSON.stringify({
    sessionId: session.sessionId,
    eventLog: session.eventLog,
    undoneEvents: session.undoneEvents
  });
}

export function deserializeScientificSession(
  serialized: string,
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  const parsed = JSON.parse(serialized) as {
    sessionId?: string;
    eventLog?: ScientificSessionEvent[];
    undoneEvents?: ScientificSessionEvent[];
  };
  const eventLog = parsed.eventLog ?? [];
  const replayed = replayScientificSessionEvents(eventLog, packs);

  return {
    ...replayed,
    sessionId: parsed.sessionId ?? replayed.sessionId,
    eventLog,
    undoneEvents: parsed.undoneEvents ?? []
  };
}

function applyScientificSessionEvent(
  session: SpatialSessionState,
  event: ScientificSessionEvent,
  packs: BiologicalProcessPack[]
): SpatialSessionState {
  if (event.type === "BRANCH_CREATED") {
    const source = session.branches.find((branch) => branch.id === event.sourceBranchId) ??
      getBaselineBranch(session);

    if (!source) {
      return session;
    }

    if (session.branches.some((branch) => branch.id === event.branchId)) {
      return session;
    }

    return {
      ...session,
      branches: [
        ...session.branches,
        createScientificModelBranch({
          id: event.branchId,
          name: event.name,
          sourceBranchId: source.id,
          model: cloneScientificModel(source.model),
          modelVersion: source.modelVersion,
          representationMode: source.representationMode,
          selectedEntities: [...source.selectedEntities],
          hiddenEntities: [...source.hiddenEntities],
          isolatedEntity: source.isolatedEntity,
          playback: { ...source.playback },
          interventions: [...source.interventions],
          appliedDeltas: source.appliedDeltas.map(cloneScientificModelDelta),
          differences: source.differences.map((difference) => ({ ...difference })),
          directInterventions: source.directInterventions.map((claim) => ({ ...claim })),
          predictedConsequences: source.predictedConsequences.map((claim) => ({ ...claim })),
          unsupportedOutcomes: source.unsupportedOutcomes.map((claim) => ({ ...claim }))
        })
      ],
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Created branch: ${event.name}`
      ]
    };
  }

  if (event.type === "BRANCH_SWITCHED") {
    const branch = session.branches.find((item) => item.id === event.branchId);

    if (!branch) {
      return session;
    }

    return {
      ...session,
      activeBranchId: branch.id,
      activeModel: branch.model,
      modelVersion: branch.modelVersion,
      representationMode: branch.representationMode,
      selectedEntities: [...branch.selectedEntities],
      hiddenEntities: [...branch.hiddenEntities],
      isolatedEntity: branch.isolatedEntity,
      playback: { ...branch.playback },
      interventions: [...branch.interventions],
      activeIntervention: branch.interventions.at(-1) ?? "baseline",
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Switched branch: ${branch.name}`
      ]
    };
  }

  if (event.type === "MODEL_DELTA_APPLIED") {
    if (event.branchId !== session.activeBranchId || !session.activeModel) {
      return session;
    }

    const model = applyScientificModelDelta(session.activeModel, event.delta);
    const baseline = getBaselineBranch(session);
    const nextBranch = createScientificModelBranch({
      id: session.activeBranchId,
      name: getActiveBranch(session)?.name ?? session.activeBranchId,
      sourceBranchId: getActiveBranch(session)?.sourceBranchId ?? "baseline",
      model,
      modelVersion: session.modelVersion + 1,
      representationMode: session.representationMode,
      selectedEntities: [...session.selectedEntities],
      hiddenEntities: addUniqueMany(session.hiddenEntities, hiddenEntitiesForDelta(event.delta)),
      isolatedEntity: session.isolatedEntity,
      playback: { ...session.playback },
      interventions: addUniqueMany(session.interventions, [event.delta.interventionId]),
      appliedDeltas: [...(getActiveBranch(session)?.appliedDeltas ?? []), event.delta],
      differences: [],
      directInterventions: [
        ...(getActiveBranch(session)?.directInterventions ?? []),
        ...event.delta.directInterventions
      ],
      predictedConsequences: [
        ...(getActiveBranch(session)?.predictedConsequences ?? []),
        ...event.delta.predictedConsequences
      ],
      unsupportedOutcomes: [
        ...(getActiveBranch(session)?.unsupportedOutcomes ?? []),
        ...event.delta.unsupportedOutcomes
      ]
    });
    nextBranch.differences = baseline ? compareBranches(baseline, nextBranch) : [];

    return {
      ...session,
      activeModel: model,
      modelVersion: session.modelVersion + 1,
      hiddenEntities: nextBranch.hiddenEntities,
      interventions: nextBranch.interventions,
      activeIntervention: event.delta.interventionId,
      branches: replaceBranch(session.branches, nextBranch),
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Applied model delta: ${event.delta.label}`
      ]
    };
  }

  if (event.type === "SESSION_RESET") {
    return createInitialSession();
  }

  if (event.type === "UNSUPPORTED_PROMPT") {
    return {
      ...session,
      currentPrompt: event.prompt,
      activeIntervention: "unsupported prompt",
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Unsupported prompt: ${event.reason}`
      ]
    };
  }

  if (event.type === "PROCESS_SELECTED") {
    const pack = packs.find((item) => item.id === event.packId);
    const compiled = pack
      ? compileBiologicalProcessPack(pack, { biologicalContext: event.biologicalContext })
      : null;

    if (!compiled?.ok) {
      return {
        ...session,
        currentPrompt: event.prompt,
        initialPrompt: session.initialPrompt || event.prompt,
        selectedProcessPackId: event.packId,
        activeIntervention: "compile failed",
        validationResults: event.validation,
        modelChangeHistory: [
          ...session.modelChangeHistory,
          `Failed to load process pack ${event.packId}`
        ]
      };
    }

    return {
      ...session,
      initialPrompt: session.initialPrompt || event.prompt,
      currentPrompt: event.prompt,
      selectedProcessPackId: event.packId,
      activeModel: compiled.model,
      modelVersion: session.modelVersion + 1,
      baselineModel: compiled.model,
      activeBranchId: "baseline",
      branches: [
        createScientificModelBranch({
          id: "baseline",
          name: "Baseline",
          sourceBranchId: null,
          model: compiled.model,
          modelVersion: session.modelVersion + 1,
          representationMode: compiled.model.representationChoice,
          selectedEntities: [],
          hiddenEntities: [],
          isolatedEntity: null,
          playback: session.playback,
          interventions: []
        })
      ],
      selectedEntities: [],
      hiddenEntities: [],
      isolatedEntity: null,
      activeIntervention: "baseline",
      representationMode: compiled.model.representationChoice,
      interventions: [],
      validationResults: event.validation,
      provenance: collectSessionProvenance(compiled.model),
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Loaded ${compiled.model.process} from ${event.packId}`
      ]
    };
  }

  if (event.type === "CONVERSATION_TURN_ADDED") {
    return {
      ...session,
      conversationHistory: [...session.conversationHistory, event.turn]
    };
  }

  if (event.type === "ENTITY_SELECTED") {
    return {
      ...session,
      selectedEntities: [...event.entityIds],
      modelVersion: session.modelVersion + 1,
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Selected entities: ${event.entityIds.join(", ") || "none"}`
      ]
    };
  }

  if (event.type === "ENTITY_HIDDEN") {
    return {
      ...session,
      hiddenEntities: addUniqueMany(session.hiddenEntities, event.entityIds),
      modelVersion: session.modelVersion + 1,
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Hidden entities: ${event.entityIds.join(", ")}`
      ]
    };
  }

  if (event.type === "ENTITY_SHOWN") {
    return {
      ...session,
      hiddenEntities: session.hiddenEntities.filter((id) => !event.entityIds.includes(id)),
      modelVersion: session.modelVersion + 1,
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Shown entities: ${event.entityIds.join(", ") || "all"}`
      ]
    };
  }

  if (event.type === "ENTITY_ISOLATED") {
    return {
      ...session,
      isolatedEntity: event.entityId,
      modelVersion: session.modelVersion + 1,
      modelChangeHistory: [
        ...session.modelChangeHistory,
        event.entityId ? `Isolated entity: ${event.entityId}` : "Cleared isolation"
      ]
    };
  }

  if (event.type === "INTERVENTION_APPLIED") {
    return {
      ...session,
      activeIntervention: event.interventionId,
      interventions: addUniqueMany(session.interventions, [event.interventionId]),
      modelVersion: session.modelVersion + 1,
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Applied intervention: ${event.interventionId}`
      ]
    };
  }

  if (event.type === "REPRESENTATION_CHANGED") {
    return {
      ...session,
      representationMode: event.representationMode,
      modelVersion: session.modelVersion + 1,
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Changed representation: ${event.representationMode}`
      ]
    };
  }

  if (event.type === "PLAYBACK_CHANGED") {
    const { reset, ...playbackPatch } = event.playback;

    return {
      ...session,
      playback: reset
        ? { ...createInitialSession().playback, ...playbackPatch }
        : { ...session.playback, ...playbackPatch },
      modelChangeHistory: [
        ...session.modelChangeHistory,
        "Changed playback state"
      ]
    };
  }

  if (event.type === "TIMELINE_MOVED") {
    return {
      ...session,
      playback: {
        ...session.playback,
        timelinePosition: Math.min(1, Math.max(0, event.timelinePosition))
      },
      modelChangeHistory: [
        ...session.modelChangeHistory,
        `Moved timeline: ${Math.round(Math.min(1, Math.max(0, event.timelinePosition)) * 100)}%`
      ]
    };
  }

  return {
    ...session,
    activeModel: session.activeModel
      ? { ...session.activeModel, biologicalContext: event.biologicalContext }
      : null,
    modelVersion: session.modelVersion + 1,
    modelChangeHistory: [
      ...session.modelChangeHistory,
      `Changed context: ${event.biologicalContext}`
    ]
  };
}

function createEmptyLayeredValidation(): LayeredValidationResult {
  return {
    valid: false,
    errors: [],
    warnings: [],
    abstentionReasons: ["No process-pack validation was available."],
    layers: createEmptyLayerMap()
  };
}

function createScientificModelBranch(input: {
  id: string;
  name: string;
  sourceBranchId: string | null;
  model: ScientificModel | null;
  modelVersion: number;
  representationMode: RepresentationMode;
  selectedEntities: string[];
  hiddenEntities: string[];
  isolatedEntity: string | null;
  playback: PlaybackState;
  interventions: string[];
  appliedDeltas?: ScientificModelDelta[];
  differences?: ScientificModelDifference[];
  directInterventions?: CounterfactualClaim[];
  predictedConsequences?: CounterfactualClaim[];
  unsupportedOutcomes?: CounterfactualClaim[];
}): ScientificModelBranch {
  return {
    id: input.id,
    name: input.name,
    sourceBranchId: input.sourceBranchId,
    model: input.model,
    modelVersion: input.modelVersion,
    representationMode: input.representationMode,
    selectedEntities: input.selectedEntities,
    hiddenEntities: input.hiddenEntities,
    isolatedEntity: input.isolatedEntity,
    playback: input.playback,
    interventions: input.interventions,
    appliedDeltas: input.appliedDeltas ?? [],
    differences: input.differences ?? [],
    directInterventions: input.directInterventions ?? [],
    predictedConsequences: input.predictedConsequences ?? [],
    unsupportedOutcomes: input.unsupportedOutcomes ?? []
  };
}

function syncActiveBranch(session: SpatialSessionState): SpatialSessionState {
  if (session.branches.length === 0 || !session.activeBranchId) {
    return session;
  }

  const existing = getActiveBranch(session);

  if (!existing) {
    return session;
  }

  const synced = {
    ...existing,
    model: session.activeModel,
    modelVersion: session.modelVersion,
    representationMode: session.representationMode,
    selectedEntities: [...session.selectedEntities],
    hiddenEntities: [...session.hiddenEntities],
    isolatedEntity: session.isolatedEntity,
    playback: { ...session.playback },
    interventions: [...session.interventions]
  };

  return {
    ...session,
    branches: replaceBranch(session.branches, synced)
  };
}

function applyScientificModelDelta(
  model: ScientificModel,
  delta: ScientificModelDelta
): ScientificModel {
  const cloned = cloneScientificModel(model);

  if (!cloned) {
    return model;
  }

  let next: ScientificModel = cloned;

  for (const operation of delta.operations) {
    if (operation.type === "SET_PARAMETER") {
      next = {
        ...next,
        parameters: next.parameters.map((parameter) =>
          parameter.id === operation.parameterId
            ? {
                ...parameter,
                value: operation.value,
                description: `${parameter.description} Counterfactual: ${delta.label}.`
              }
            : parameter
        )
      };
    }

    if (operation.type === "SET_ENTITY_STATE") {
      next = {
        ...next,
        entities: next.entities.map((entity) =>
          entity.id === operation.entityId
            ? {
                ...entity,
                description: `${entity.description} Counterfactual state: ${operation.state}.`
              }
            : entity
        )
      };
    }

    if (operation.type === "SET_TRANSITION_STATE") {
      next = {
        ...next,
        transitions: next.transitions.map((transition) =>
          transition.id === operation.transitionId
            ? {
                ...transition,
                rule: `${transition.rule}; counterfactual transition state: ${operation.state}`
              }
            : transition
        )
      };
    }

    if (operation.type === "ADD_RELATION_QUALIFIER") {
      next = {
        ...next,
        relations: next.relations.map((relation) =>
          relation.id === operation.relationId
            ? {
                ...relation,
                description: `${relation.description} ${operation.qualifier}`
              }
            : relation
        )
      };
    }
  }

  return next;
}

function compareBranches(
  baseline: ScientificModelBranch,
  branch: ScientificModelBranch
): ScientificModelDifference[] {
  const differences: ScientificModelDifference[] = [];

  for (const delta of branch.appliedDeltas) {
    for (const operation of delta.operations) {
      differences.push(differenceForOperation(baseline.model, branch.model, operation));
    }

    for (const claim of delta.predictedConsequences) {
      differences.push({
        path: `prediction.${claim.id}`,
        baseline: "not present",
        counterfactual: claim.claim,
        source: "predicted-downstream",
        classification: claim.classification
      });
    }

    for (const claim of delta.unsupportedOutcomes) {
      differences.push({
        path: `unsupported.${claim.id}`,
        baseline: "not present",
        counterfactual: claim.claim,
        source: "unsupported-outcome",
        classification: claim.classification
      });
    }
  }

  return differences;
}

function differenceForOperation(
  baseline: ScientificModel | null,
  branch: ScientificModel | null,
  operation: ScientificModelDeltaOperation
): ScientificModelDifference {
  if (operation.type === "SET_PARAMETER") {
    return {
      path: `parameters.${operation.parameterId}`,
      baseline: String(baseline?.parameters.find((item) => item.id === operation.parameterId)?.value ?? "missing"),
      counterfactual: String(branch?.parameters.find((item) => item.id === operation.parameterId)?.value ?? operation.value),
      source: "direct-intervention",
      classification: "schematic"
    };
  }

  if (operation.type === "SET_ENTITY_STATE") {
    return {
      path: `entities.${operation.entityId}`,
      baseline: "present",
      counterfactual: operation.state,
      source: "direct-intervention",
      classification: "schematic"
    };
  }

  if (operation.type === "SET_TRANSITION_STATE") {
    return {
      path: `transitions.${operation.transitionId}`,
      baseline: baseline?.transitions.find((item) => item.id === operation.transitionId)?.rule ?? "missing",
      counterfactual: branch?.transitions.find((item) => item.id === operation.transitionId)?.rule ?? operation.state,
      source: "direct-intervention",
      classification: "schematic"
    };
  }

  return {
    path: `relations.${operation.relationId}`,
    baseline: baseline?.relations.find((item) => item.id === operation.relationId)?.description ?? "missing",
    counterfactual: branch?.relations.find((item) => item.id === operation.relationId)?.description ?? operation.qualifier,
    source: "direct-intervention",
    classification: "schematic"
  };
}

function hiddenEntitiesForDelta(delta: ScientificModelDelta) {
  return delta.operations
    .filter((operation) =>
      operation.type === "SET_ENTITY_STATE" &&
      ["absent", "inaccessible", "disabled"].includes(operation.state)
    )
    .map((operation) => operation.type === "SET_ENTITY_STATE" ? operation.entityId : "");
}

function getActiveBranch(session: SpatialSessionState) {
  return session.branches.find((branch) => branch.id === session.activeBranchId) ?? null;
}

function getBaselineBranch(session: SpatialSessionState) {
  return session.branches.find((branch) => branch.id === "baseline") ?? null;
}

function replaceBranch(
  branches: ScientificModelBranch[],
  nextBranch: ScientificModelBranch
) {
  return branches.map((branch) => branch.id === nextBranch.id ? nextBranch : branch);
}

function createBranchId(name: string, branches: ScientificModelBranch[]) {
  const base = normalizeText(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "branch";
  let candidate = base;
  let index = 2;

  while (branches.some((branch) => branch.id === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function cloneScientificModel(model: ScientificModel | null): ScientificModel | null {
  if (!model) {
    return null;
  }

  return {
    ...model,
    aliases: [...model.aliases],
    entities: model.entities.map((entity) => ({
      ...entity,
      aliases: [...entity.aliases],
      provenance: entity.provenance.map((item) => ({ ...item }))
    })),
    relations: model.relations.map((relation) => ({
      ...relation,
      provenance: relation.provenance.map((item) => ({ ...item }))
    })),
    states: model.states.map((state) => ({
      ...state,
      activeEntities: [...state.activeEntities],
      provenance: state.provenance.map((item) => ({ ...item }))
    })),
    transitions: model.transitions.map((transition) => ({
      ...transition,
      provenance: transition.provenance.map((item) => ({ ...item }))
    })),
    parameters: model.parameters.map((parameter) => ({
      ...parameter,
      provenance: parameter.provenance.map((item) => ({ ...item }))
    })),
    interventions: model.interventions.map((intervention) => ({
      ...intervention,
      affectedEntities: [...intervention.affectedEntities],
      modelDelta: intervention.modelDelta ? cloneScientificModelDelta(intervention.modelDelta) : undefined
    })),
    assumptions: model.assumptions.map((claim) => ({
      ...claim,
      provenance: claim.provenance.map((item) => ({ ...item }))
    })),
    limitations: model.limitations.map((claim) => ({
      ...claim,
      provenance: claim.provenance.map((item) => ({ ...item }))
    })),
    sources: model.sources.map((source) => ({ ...source })),
    representationRules: model.representationRules.map((claim) => ({
      ...claim,
      provenance: claim.provenance.map((item) => ({ ...item }))
    })),
    literalElements: [...model.literalElements],
    schematicElements: [...model.schematicElements],
    scaleDistortions: [...model.scaleDistortions],
    renderPlan: {
      ...model.renderPlan,
      isolationGroups: Object.fromEntries(
        Object.entries(model.renderPlan.isolationGroups).map(([id, entityIds]) => [
          id,
          [...entityIds]
        ])
      ),
      primitives: [...model.renderPlan.primitives]
    },
    commandRules: model.commandRules.map((rule) => ({
      ...rule,
      phrases: [...rule.phrases],
      patch: {
        ...rule.patch,
        hiddenEntities: rule.patch.hiddenEntities
          ? {
              add: rule.patch.hiddenEntities.add ? [...rule.patch.hiddenEntities.add] : undefined,
              remove: rule.patch.hiddenEntities.remove ? [...rule.patch.hiddenEntities.remove] : undefined,
              reset: rule.patch.hiddenEntities.reset
            }
          : undefined,
        selectedEntities: rule.patch.selectedEntities ? [...rule.patch.selectedEntities] : undefined,
        playback: rule.patch.playback ? { ...rule.patch.playback } : undefined
      }
    })),
    examples: [...model.examples]
  };
}

function cloneScientificModelDelta(delta: ScientificModelDelta): ScientificModelDelta {
  return structuredClone(delta) as ScientificModelDelta;
}

function collectSessionProvenance(model: ScientificModel): ScientificClaimProvenance[] {
  return [
    ...model.entities.flatMap((entity) => entity.provenance),
    ...model.relations.flatMap((relation) => relation.provenance),
    ...model.states.flatMap((state) => state.provenance),
    ...model.transitions.flatMap((transition) => transition.provenance),
    ...model.parameters.flatMap((parameter) => parameter.provenance),
    ...model.assumptions.flatMap((claim) => claim.provenance),
    ...model.limitations.flatMap((claim) => claim.provenance),
    ...model.representationRules.flatMap((claim) => claim.provenance)
  ];
}

function findUndoStartIndex(events: ScientificSessionEvent[]) {
  const lastEvent = events.at(-1);

  if (lastEvent?.type !== "CONVERSATION_TURN_ADDED" || lastEvent.turn.role !== "system") {
    return Math.max(0, events.length - 1);
  }

  for (let index = events.length - 2; index >= 0; index -= 1) {
    const event = events[index];

    if (event.type === "CONVERSATION_TURN_ADDED" && event.turn.role === "user") {
      return index;
    }
  }

  return Math.max(0, events.length - 1);
}

function addUniqueMany(values: string[], additions: string[]) {
  const next = [...values];

  for (const value of additions) {
    if (!next.includes(value)) {
      next.push(value);
    }
  }

  return next;
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
  const issues: LayeredValidationIssue[] = [];
  const orderByState = new Map(pack.states.map((state) => [state.id, state.order]));

  for (const rule of pack.validationRules) {
    for (const parameter of rule.requiredParameters ?? []) {
      requireParameterValue(
        pack,
        issues,
        parameter.id,
        parameter.value,
        parameter.message ?? `Required parameter "${parameter.id}" must be present with the expected value.`
      );
    }

    for (const relation of rule.requiredRelations ?? []) {
      requireRelation(
        pack,
        issues,
        relation.source,
        relation.target,
        relation.relation,
        relation.message ?? `Required relation "${relation.source}" -> "${relation.target}" must be present.`
      );
    }

    for (const ordering of rule.requiredStageOrder ?? []) {
      const beforeOrder = orderByState.get(ordering.before);
      const afterOrder = orderByState.get(ordering.after);
      if (beforeOrder === undefined || afterOrder === undefined || beforeOrder >= afterOrder) {
        issues.push(layerIssue(
          "biological_invariants",
          "validation_rule_failed",
          `states.${ordering.before}.${ordering.after}`,
          ordering.message ?? `Stage "${ordering.before}" must precede "${ordering.after}".`
        ));
      }
    }

    for (const textRule of rule.requiredClaimText ?? []) {
      const corpus = textRule.path === "relations"
        ? relationText(pack, textRule.entityId)
        : claimCorpus(pack);
      if (!normalizeText(corpus).includes(normalizeText(textRule.includes))) {
        issues.push(layerIssue(
          "biological_invariants",
          "validation_rule_failed",
          textRule.entityId ? `${textRule.path}.${textRule.entityId}` : textRule.path,
          textRule.message ?? `Required scientific text "${textRule.includes}" is missing.`
        ));
      }
    }

    for (const textRule of rule.forbiddenClaimText ?? []) {
      const corpus = textRule.path === "relations"
        ? relationText(pack, textRule.entityId)
        : claimCorpus(pack);
      if (normalizeText(corpus).includes(normalizeText(textRule.includes))) {
        issues.push(layerIssue(
          "biological_invariants",
          "validation_rule_failed",
          textRule.entityId ? `${textRule.path}.${textRule.entityId}` : textRule.path,
          textRule.message
        ));
      }
    }
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
  const unsupportedPatterns = pack.validationRules.flatMap((rule) =>
    (rule.forbiddenVerifiedClaimPatterns ?? []).map((patternRule) => ({
      pattern: new RegExp(patternRule.pattern, "i"),
      message: patternRule.message
    }))
  );
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

function requireParameterValue(
  pack: BiologicalProcessPack,
  issues: LayeredValidationIssue[],
  id: string,
  value: ScientificParameter["value"] | undefined,
  message: string
) {
  if (!pack.parameters.some((parameterItem) =>
    parameterItem.id === id && (value === undefined || parameterItem.value === value)
  )) {
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

function relationText(pack: BiologicalProcessPack, entityId?: string) {
  return pack.relations
    .filter((relationItem) =>
      !entityId || relationItem.source === entityId || relationItem.target === entityId
    )
    .map((relationItem) => `${relationItem.source} ${relationItem.relation} ${relationItem.target} ${relationItem.description}`)
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
