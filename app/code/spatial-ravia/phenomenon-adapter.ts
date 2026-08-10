import type {
  BiologicalProcessPack,
  ScientificClaim,
  ScientificClaimProvenance,
  ScientificParameter,
  ScientificSource
} from "./model.ts";
import type {
  Claim,
  PhenomenonSpec,
  Source,
  ViewSpec
} from "./phenomenon-spec.ts";

export function phenomenonSpecFromBiologicalProcessPack(pack: BiologicalProcessPack): PhenomenonSpec {
  const sources = pack.sources.map(sourceFromLegacy);
  const primitiveIdsByEntity = new Map<string, string[]>();

  for (const primitive of pack.animation.primitives) {
    if (!primitive.entityId) {
      continue;
    }

    primitiveIdsByEntity.set(primitive.entityId, [
      ...(primitiveIdsByEntity.get(primitive.entityId) ?? []),
      primitive.id
    ]);
  }

  const relationClaims = pack.relations.map((relation) =>
    claimFromLegacy(`relation-${relation.id}-claim`, relation.description, relation.provenance)
  );
  const stateClaims = pack.states.map((state) =>
    claimFromLegacy(`state-${state.id}-claim`, state.description, state.provenance)
  );
  const transitionClaims = pack.transitions.map((transition) =>
    claimFromLegacy(`transition-${transition.id}-claim`, transition.rule, transition.provenance)
  );
  const componentClaims = pack.entities.map((entity) =>
    claimFromLegacy(`component-${entity.id}-claim`, entity.description, entity.provenance)
  );
  const numericParameters = pack.parameters.filter(hasNumericValue);
  const parameterClaims = numericParameters.map((parameter) =>
    claimFromLegacy(`parameter-${parameter.id}-claim`, parameter.description, parameter.provenance)
  );
  const timelineClaim: Claim = {
    id: "timeline-normalized-claim",
    text: "Timeline progress is normalized for explanatory playback, not measured biological time.",
    sourceIds: firstSourceId(pack.sources),
    status: "verified",
    support: "assumption"
  };

  const claims = [
    ...componentClaims,
    ...relationClaims,
    ...stateClaims,
    ...transitionClaims,
    ...parameterClaims,
    timelineClaim,
    ...pack.representationRules.map(claimFromLegacy),
    ...pack.commonMisconceptions.map(claimFromLegacy)
  ];

  return {
    schemaVersion: "1.0.0",
    packVersion: "1.0.0",
    id: pack.id,
    title: pack.process,
    modelClass: "explanatory-model",
    description: `${pack.process} as a curated process representation.`,
    aliases: pack.aliases,
    components: pack.entities.map((entity) => ({
      id: entity.id,
      label: entity.label,
      kind: entity.kind,
      description: entity.description,
      claimIds: [`component-${entity.id}-claim`],
      evidenceMode: entity.schematic && !entity.literal ? "schematic" : "schematic",
      geometry: {
        primitiveIds: primitiveIdsByEntity.get(entity.id) ?? [],
        role: entity.kind
      }
    })),
    relations: pack.relations.map((relation) => ({
      id: relation.id,
      sourceComponentId: relation.source,
      targetComponentId: relation.target,
      relation: relation.relation,
      description: relation.description,
      claimIds: [`relation-${relation.id}-claim`]
    })),
    states: pack.states.map((state) => ({
      id: state.id,
      label: state.label,
      order: state.order,
      description: state.description,
      activeComponentIds: state.activeEntities,
      claimIds: [`state-${state.id}-claim`]
    })),
    transitions: pack.transitions.map((transition) => ({
      id: transition.id,
      fromStateId: transition.from,
      toStateId: transition.to,
      trigger: transition.trigger,
      rule: transition.rule,
      claimIds: [`transition-${transition.id}-claim`]
    })),
    parameters: numericParameters.map(parameterFromLegacy),
    timeline: {
      basis: "normalized",
      duration: {
        value: 1,
        unit: "normalized",
        bounds: [0, 1],
        claimId: timelineClaim.id
      },
      keyframes: pack.states
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((state, index, states) => ({
          at: states.length === 1 ? 0 : index / (states.length - 1),
          stateId: state.id,
          claimIds: [`state-${state.id}-claim`]
        }))
    },
    views: viewsFromPack(pack),
    interactions: [
      ...pack.entities.flatMap((entity) => [
        {
          id: `select-${entity.id}`,
          type: "select" as const,
          targetIds: [entity.id],
          description: `Select ${entity.label}.`
        },
        {
          id: `hide-${entity.id}`,
          type: "hide" as const,
          targetIds: [entity.id],
          description: `Hide ${entity.label}.`
        },
        {
          id: `isolate-${entity.id}`,
          type: "isolate" as const,
          targetIds: [entity.id],
          description: `Isolate ${entity.label}.`
        }
      ]),
      ...numericParameters.map((parameter) => ({
        id: `set-${parameter.id}`,
        type: "set-parameter" as const,
        targetIds: [parameter.id],
        description: `Set ${parameter.label}.`
      })),
      {
        id: `change-view-${pack.id}`,
        type: "change-view",
        targetIds: [`${pack.id}-process-view`],
        description: `Show the ${pack.process} process view.`
      },
      {
        id: "playback-controls",
        type: "playback",
        targetIds: ["play", "pause", "restart", "timeline", "speed"],
        description: "Control playback, timeline position, and speed."
      }
    ],
    claims,
    sources,
    assumptions: pack.assumptions.map(claimFromLegacy),
    uncertainties: pack.scaleDistortions.map((distortion, index) => ({
      id: `scale-distortion-${index + 1}`,
      text: distortion,
      sourceIds: firstSourceId(pack.sources),
      status: "uncertain",
      support: "schematic-simplification"
    })),
    limitations: pack.limitations.map(claimFromLegacy),
    supportedFollowUps: [
      ...pack.examples,
      ...pack.promptRules.flatMap((rule) => rule.hints),
      ...pack.commandRules.flatMap((rule) => rule.phrases)
    ]
  };
}

function sourceFromLegacy(source: ScientificSource): Source {
  return {
    id: source.id,
    title: source.title,
    authors: source.authors,
    locator: source.locator,
    urlOrDoi: source.urlOrDoi,
    publicationType:
      source.publicationType === "primary-literature" ? "primary-paper" :
      source.publicationType === "textbook" ? "review" :
      source.publicationType,
    accessDate: source.accessDate,
    license: source.license
  };
}

function claimFromLegacy(claim: ScientificClaim): Claim;
function claimFromLegacy(id: string, text: string, provenance: ScientificClaimProvenance[]): Claim;
function claimFromLegacy(
  claimOrId: ScientificClaim | string,
  text?: string,
  provenance?: ScientificClaimProvenance[]
): Claim {
  if (typeof claimOrId !== "string") {
    return {
      id: claimOrId.id,
      text: claimOrId.claim,
      sourceIds: sourceIdsFromProvenance(claimOrId.provenance),
      status: statusFromLegacy(claimOrId.status),
      support: supportFromLegacy(claimOrId.claimType)
    };
  }

  const claimProvenance = provenance ?? [];

  return {
    id: claimOrId,
    text: text ?? claimProvenance[0]?.supportedClaim ?? claimOrId,
    sourceIds: sourceIdsFromProvenance(claimProvenance),
    status: statusFromLegacy(claimProvenance[0]?.claimStatus ?? "verified"),
    support: supportFromLegacy(claimProvenance[0]?.supportType ?? "interpretation")
  };
}

function parameterFromLegacy(parameter: ScientificParameter) {
  const bounds =
    [0, 1] as [number, number];

  return {
    id: parameter.id,
    label: parameter.label,
    editable: true,
    value: {
      value: Number(parameter.value),
      unit: parameter.unit ?? "dimensionless",
      bounds,
      claimId: `parameter-${parameter.id}-claim`
    }
  };
}

function viewsFromPack(pack: BiologicalProcessPack): ViewSpec[] {
  const componentIds = pack.entities.map((entity) => entity.id);

  return [
    {
      id: `${pack.id}-process-view`,
      title: "Process mechanism",
      kind: "mechanistic-process",
      renderer: "svg",
      evidenceMode: "schematic",
      public: true,
      componentIds,
      synchronizedBy: "time"
    }
  ];
}

function hasNumericValue(parameter: ScientificParameter) {
  return typeof parameter.value === "number";
}

function sourceIdsFromProvenance(provenance: ScientificClaimProvenance[]) {
  const sourceIds = Array.from(new Set(provenance.map((item) => item.sourceId)));
  return sourceIds;
}

function firstSourceId(sources: ScientificSource[]) {
  return sources[0]?.id ? [sources[0].id] : [];
}

function statusFromLegacy(status: ScientificClaim["status"]): Claim["status"] {
  if (status === "disputed") {
    return "disputed";
  }

  if (status === "unverified") {
    return "uncertain";
  }

  return "verified";
}

function supportFromLegacy(type: ScientificClaim["claimType"]): Claim["support"] {
  if (type === "direct-fact") {
    return "direct";
  }

  if (type === "model-assumption") {
    return "assumption";
  }

  if (type === "schematic-simplification") {
    return "schematic-simplification";
  }

  return "inferred";
}
