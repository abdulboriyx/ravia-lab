import { z } from "zod";

const idSchema = z.string().min(1).regex(/^[a-z0-9][a-z0-9._:-]*$/);
const versionSchema = z.string().min(1).regex(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);

export const RepresentationKindSchema = z.enum([
  "mechanistic-process",
  "molecular-structure",
  "spatial-scene",
  "timeline",
  "graph",
  "equation-model"
]);

export const EvidenceModeSchema = z.enum([
  "literal",
  "schematic",
  "derived",
  "hypothetical"
]);

export const ModelClassSchema = z.enum([
  "deposited-structure",
  "explanatory-model",
  "simulation",
  "analytical-model",
  "data-plot"
]);

export const QuantitySchema = z.object({
  value: z.number().finite(),
  unit: z.string().min(1),
  bounds: z.tuple([z.number().finite(), z.number().finite()]).optional(),
  claimId: idSchema
}).strict();

export const SourceSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  authors: z.string().min(1),
  locator: z.string().min(1),
  urlOrDoi: z.string().min(1),
  publicationType: z.enum(["primary-paper", "database", "review", "documentation"]),
  accessDate: z.string().min(1),
  license: z.string().min(1).optional()
}).strict();

export const ClaimSchema = z.object({
  id: idSchema,
  text: z.string().min(1),
  sourceIds: z.array(idSchema).nonempty(),
  status: z.enum(["verified", "uncertain", "disputed"]),
  support: z.enum(["direct", "inferred", "assumption", "schematic-simplification"])
}).strict();

const GeometryReferenceSchema = z.object({
  primitiveIds: z.array(idSchema).optional(),
  role: z.string().min(1).optional()
}).strict();

export const ComponentSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  kind: z.enum([
    "molecule",
    "enzyme",
    "protein",
    "strand",
    "fragment",
    "process",
    "equation-model",
    "equation-state",
    "spatial-body",
    "spatial-reference-frame",
    "spatial-vector"
  ]),
  description: z.string().min(1),
  claimIds: z.array(idSchema).nonempty(),
  evidenceMode: EvidenceModeSchema,
  geometry: GeometryReferenceSchema
}).strict();

const RelationSchema = z.object({
  id: idSchema,
  sourceComponentId: idSchema,
  targetComponentId: idSchema,
  relation: z.string().min(1),
  description: z.string().min(1),
  claimIds: z.array(idSchema).nonempty()
}).strict();

const StateSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
  description: z.string().min(1),
  activeComponentIds: z.array(idSchema),
  claimIds: z.array(idSchema).nonempty()
}).strict();

const TransitionSchema = z.object({
  id: idSchema,
  fromStateId: idSchema,
  toStateId: idSchema,
  trigger: z.string().min(1),
  rule: z.string().min(1),
  claimIds: z.array(idSchema).nonempty()
}).strict();

const ParameterSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  value: QuantitySchema,
  editable: z.boolean()
}).strict();

const TimelineKeyframeSchema = z.object({
  at: z.number().finite(),
  stateId: idSchema,
  claimIds: z.array(idSchema).nonempty()
}).strict();

const TimelineSchema = z.object({
  basis: z.enum(["normalized", "physical"]),
  duration: QuantitySchema,
  keyframes: z.array(TimelineKeyframeSchema).nonempty()
}).strict();

const DepositedStructureMappingSchema = z.object({
  pdbId: z.string().regex(/^[0-9][A-Za-z0-9]{3}$/),
  deposited: z.boolean(),
  approved: z.boolean(),
  componentIds: z.array(idSchema).nonempty()
}).strict();

export const ViewSpecSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  kind: RepresentationKindSchema,
  renderer: z.enum(["svg", "molstar", "d3", "r3f"]),
  evidenceMode: EvidenceModeSchema,
  public: z.boolean(),
  componentIds: z.array(idSchema).nonempty(),
  synchronizedBy: z.enum(["time", "selection", "camera"]).optional(),
  structureMapping: DepositedStructureMappingSchema.optional()
}).strict();

const InteractionSchema = z.object({
  id: idSchema,
  type: z.enum(["select", "hide", "isolate", "set-parameter", "change-view", "playback"]),
  targetIds: z.array(idSchema).nonempty(),
  description: z.string().min(1)
}).strict();

export const PhenomenonSpecSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  packVersion: versionSchema,
  id: idSchema,
  title: z.string().min(1),
  modelClass: ModelClassSchema,
  description: z.string().min(1),
  aliases: z.array(z.string().min(1)).nonempty(),
  components: z.array(ComponentSchema).nonempty(),
  relations: z.array(RelationSchema),
  states: z.array(StateSchema).nonempty(),
  transitions: z.array(TransitionSchema),
  parameters: z.array(ParameterSchema),
  timeline: TimelineSchema,
  views: z.array(ViewSpecSchema).nonempty(),
  interactions: z.array(InteractionSchema),
  claims: z.array(ClaimSchema),
  sources: z.array(SourceSchema).nonempty(),
  assumptions: z.array(ClaimSchema).nonempty(),
  uncertainties: z.array(ClaimSchema).nonempty(),
  limitations: z.array(ClaimSchema).nonempty(),
  supportedFollowUps: z.array(z.string().min(1)).nonempty()
}).strict().superRefine((spec, context) => {
  const componentIds = idsFor(spec.components, "components", context);
  const sourceIds = idsFor(spec.sources, "sources", context);
  const stateIds = idsFor(spec.states, "states", context);
  const transitionIds = idsFor(spec.transitions, "transitions", context);
  const parameterIds = idsFor(spec.parameters, "parameters", context);
  const viewIds = idsFor(spec.views, "views", context);
  idsFor(spec.relations, "relations", context);
  idsFor(spec.interactions, "interactions", context);

  const displayedClaims = [
    ...spec.claims,
    ...spec.assumptions,
    ...spec.uncertainties,
    ...spec.limitations
  ];
  const claimIds = idsFor(displayedClaims, "displayed claims", context);

  for (const claim of displayedClaims) {
    for (const sourceId of claim.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        addIssue(context, ["claims", claim.id, "sourceIds"], `Claim "${claim.id}" references unknown source "${sourceId}".`);
      }
    }
  }

  for (const component of spec.components) {
    for (const claimId of component.claimIds) {
      if (!claimIds.has(claimId)) {
        addIssue(context, ["components", component.id, "claimIds"], `Component "${component.id}" references unknown claim "${claimId}".`);
      }
    }
  }

  for (const relation of spec.relations) {
    if (!componentIds.has(relation.sourceComponentId)) {
      addIssue(context, ["relations", relation.id, "sourceComponentId"], `Relation "${relation.id}" references unknown source component "${relation.sourceComponentId}".`);
    }

    if (!componentIds.has(relation.targetComponentId)) {
      addIssue(context, ["relations", relation.id, "targetComponentId"], `Relation "${relation.id}" references unknown target component "${relation.targetComponentId}".`);
    }

    validateClaimReferences(relation.claimIds, claimIds, ["relations", relation.id, "claimIds"], context);
  }

  for (const state of spec.states) {
    for (const componentId of state.activeComponentIds) {
      if (!componentIds.has(componentId)) {
        addIssue(context, ["states", state.id, "activeComponentIds"], `State "${state.id}" references unknown component "${componentId}".`);
      }
    }

    validateClaimReferences(state.claimIds, claimIds, ["states", state.id, "claimIds"], context);
  }

  for (const transition of spec.transitions) {
    if (!stateIds.has(transition.fromStateId) || !stateIds.has(transition.toStateId)) {
      addIssue(context, ["transitions", transition.id], `Transition "${transition.id}" references an unknown state.`);
    }

    validateClaimReferences(transition.claimIds, claimIds, ["transitions", transition.id, "claimIds"], context);
  }

  for (const parameter of spec.parameters) {
    validateQuantity(parameter.value, claimIds, ["parameters", parameter.id, "value"], context);

    if (parameter.editable && !parameter.value.bounds) {
      addIssue(context, ["parameters", parameter.id, "editable"], `Editable parameter "${parameter.id}" must declare bounds.`);
    }
  }

  validateQuantity(spec.timeline.duration, claimIds, ["timeline", "duration"], context);
  validateTimeline(spec, stateIds, claimIds, context);

  for (const view of spec.views) {
    validateRendererCombination(spec, view, componentIds, context);
  }

  for (const interaction of spec.interactions) {
    validateInteractionTargets(interaction, componentIds, parameterIds, viewIds, context);
  }

  for (const transition of spec.transitions) {
    if (!transitionIds.has(transition.id)) {
      addIssue(context, ["transitions", transition.id], `Transition "${transition.id}" is not registered.`);
    }
  }
});

export type RepresentationKind = z.infer<typeof RepresentationKindSchema>;
export type EvidenceMode = z.infer<typeof EvidenceModeSchema>;
export type ModelClass = z.infer<typeof ModelClassSchema>;
export type Quantity = z.infer<typeof QuantitySchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type ViewSpec = z.infer<typeof ViewSpecSchema>;
export type PhenomenonSpec = z.infer<typeof PhenomenonSpecSchema>;

export type PhenomenonSpecValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; errors: Array<{ path: string; message: string }> };

export function validatePhenomenonSpec(spec: unknown): PhenomenonSpecValidationResult {
  const result = PhenomenonSpecSchema.safeParse(spec);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join(".") : "$",
      message: issue.message
    }))
  };
}

export function assertValidPhenomenonSpec(spec: unknown): asserts spec is PhenomenonSpec {
  const validation = validatePhenomenonSpec(spec);

  if (!validation.valid) {
    throw new Error(
      validation.errors.map((error) => `${error.path}: ${error.message}`).join("\n")
    );
  }
}

function idsFor(items: Array<{ id: string }>, path: string, context: z.RefinementCtx) {
  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) {
      addIssue(context, [path, item.id], `Duplicate ID "${item.id}" in ${path}.`);
    }

    ids.add(item.id);
  }

  return ids;
}

function validateClaimReferences(
  ids: string[],
  claimIds: Set<string>,
  path: Array<string | number>,
  context: z.RefinementCtx
) {
  for (const id of ids) {
    if (!claimIds.has(id)) {
      addIssue(context, path, `Unknown claim "${id}".`);
    }
  }
}

function validateQuantity(
  quantity: Quantity,
  claimIds: Set<string>,
  path: Array<string | number>,
  context: z.RefinementCtx
) {
  const allowedUnits = new Set([
    "normalized",
    "relative",
    "dimensionless",
    "s",
    "ms",
    "min",
    "bp",
    "nt",
    "angstrom",
    "nm",
    "mV",
    "AU",
    "day",
    "AU/day",
    "AU^3/day^2"
  ]);

  if (!allowedUnits.has(quantity.unit)) {
    addIssue(context, [...path, "unit"], `Unknown or unsupported unit "${quantity.unit}".`);
  }

  if (!claimIds.has(quantity.claimId)) {
    addIssue(context, [...path, "claimId"], `Quantity references unknown claim "${quantity.claimId}".`);
  }

  if (quantity.bounds) {
    const [lower, upper] = quantity.bounds;

    if (lower > upper) {
      addIssue(context, [...path, "bounds"], "Quantity bounds must be ordered from lower to upper.");
      return;
    }

    if (quantity.value < lower || quantity.value > upper) {
      addIssue(context, [...path, "value"], `Quantity value ${quantity.value} is outside declared bounds ${lower}..${upper}.`);
    }
  }
}

function validateTimeline(
  spec: PhenomenonSpec,
  stateIds: Set<string>,
  claimIds: Set<string>,
  context: z.RefinementCtx
) {
  let previous = -Infinity;

  if (spec.timeline.basis === "normalized" && spec.timeline.duration.unit !== "normalized") {
    addIssue(context, ["timeline", "duration", "unit"], "Normalized timelines must use a normalized duration unit.");
  }

  for (const keyframe of spec.timeline.keyframes) {
    if (keyframe.at < 0 || keyframe.at > 1) {
      addIssue(context, ["timeline", "keyframes", keyframe.stateId, "at"], "Normalized keyframes must be between 0 and 1.");
    }

    if (keyframe.at < previous) {
      addIssue(context, ["timeline", "keyframes", keyframe.stateId, "at"], "Timeline keyframes must be in ascending order.");
    }

    previous = keyframe.at;

    if (!stateIds.has(keyframe.stateId)) {
      addIssue(context, ["timeline", "keyframes", keyframe.stateId], `Timeline references unknown state "${keyframe.stateId}".`);
    }

    validateClaimReferences(keyframe.claimIds, claimIds, ["timeline", "keyframes", keyframe.stateId, "claimIds"], context);
  }

  const durationClaim = [
    ...spec.claims,
    ...spec.assumptions,
    ...spec.uncertainties,
    ...spec.limitations
  ].find((claim) => claim.id === spec.timeline.duration.claimId);

  if (
    spec.timeline.basis === "normalized" &&
    durationClaim &&
    /\b(ms|millisecond|second|minute|hour|kinetic|physical timing)\b/i.test(durationClaim.text)
  ) {
    addIssue(context, ["timeline", "duration", "claimId"], "A normalized timeline cannot claim physical timing.");
  }
}

function validateRendererCombination(
  spec: PhenomenonSpec,
  view: ViewSpec,
  componentIds: Set<string>,
  context: z.RefinementCtx
) {
  const allowedRendererByKind: Record<RepresentationKind, Set<ViewSpec["renderer"]>> = {
    "mechanistic-process": new Set(["svg", "d3"]),
    "molecular-structure": new Set(["molstar"]),
    "spatial-scene": new Set(["svg", "r3f"]),
    timeline: new Set(["svg", "d3"]),
    graph: new Set(["svg", "d3"]),
    "equation-model": new Set(["d3"])
  };

  if (!allowedRendererByKind[view.kind].has(view.renderer)) {
    addIssue(context, ["views", view.id, "renderer"], `Renderer "${view.renderer}" is not allowed for "${view.kind}".`);
  }

  for (const componentId of view.componentIds) {
    if (!componentIds.has(componentId)) {
      addIssue(context, ["views", view.id, "componentIds"], `View "${view.id}" references unknown component "${componentId}".`);
    }
  }

  if (view.kind === "molecular-structure") {
    if (view.evidenceMode !== "literal") {
      addIssue(context, ["views", view.id, "evidenceMode"], "Molecular-structure views must be literal deposited-structure views.");
    }

    if (!view.structureMapping?.deposited || !view.structureMapping.approved) {
      addIssue(context, ["views", view.id, "structureMapping"], "Molecular-structure views require an approved deposited structure mapping.");
    }

    for (const componentId of view.structureMapping?.componentIds ?? []) {
      if (!componentIds.has(componentId)) {
        addIssue(context, ["views", view.id, "structureMapping", "componentIds"], `Structure mapping references unknown component "${componentId}".`);
      }
    }
  }

  if (
    spec.modelClass === "explanatory-model" &&
    view.kind !== "molecular-structure" &&
    view.evidenceMode === "literal"
  ) {
    addIssue(context, ["views", view.id, "evidenceMode"], "A schematic explanatory model cannot be labeled literal.");
  }

  if (view.evidenceMode === "literal" && view.kind !== "molecular-structure") {
    addIssue(context, ["views", view.id, "evidenceMode"], "Only molecular-structure views may use literal evidence mode in this contract.");
  }
}

function validateInteractionTargets(
  interaction: z.infer<typeof InteractionSchema>,
  componentIds: Set<string>,
  parameterIds: Set<string>,
  viewIds: Set<string>,
  context: z.RefinementCtx
) {
  const allowedTargets =
    interaction.type === "set-parameter" ? parameterIds :
    interaction.type === "change-view" ? viewIds :
    interaction.type === "playback" ? new Set(["play", "pause", "restart", "timeline", "speed"]) :
    componentIds;

  for (const targetId of interaction.targetIds) {
    if (!allowedTargets.has(targetId)) {
      addIssue(context, ["interactions", interaction.id, "targetIds"], `Interaction "${interaction.id}" references unsupported target "${targetId}".`);
    }
  }
}

function addIssue(context: z.RefinementCtx, path: Array<string | number>, message: string) {
  context.addIssue({
    code: "custom",
    path,
    message
  });
}
