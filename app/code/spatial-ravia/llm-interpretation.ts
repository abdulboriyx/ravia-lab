import type {
  BiologicalProcessPack,
  Context,
  InterventionIntent,
  PromptIntentResolution,
  RepresentationType,
  ScientificModel
} from "./model.ts";
import { resolvePromptIntent } from "./model.ts";

export type ScientificModelDelta = {
  representationChoice?: RepresentationType;
  selectedEntities?: string[];
  hiddenEntities?: string[];
  activeIntervention?: string;
  parameterUpdates?: Array<{
    id: string;
    value: string | number | boolean;
  }>;
};

export type StructuredBiologicalIntent = {
  processSelection?: {
    processId: string;
    confidence: number;
  };
  biologicalContext?: string;
  requestedFocus: string[];
  requestedEntities: string[];
  requestedRepresentation?: RepresentationType;
  requestedIntervention?: {
    commandId?: string;
    interventionId?: string;
    confidence: number;
  };
  scientificModelDelta?: ScientificModelDelta;
  confidence: number;
  ambiguity: string[];
  unsupported?: {
    reason: string;
  };
};

export type BiologicalIntentProviderRequest = {
  prompt: string;
  packs: Array<{
    id: string;
    process: string;
    aliases: string[];
    biologicalContexts: string[];
    entities: Array<{
      id: string;
      label: string;
      aliases: string[];
    }>;
    commandRules: Array<{
      id: string;
      phrases: string[];
      activeIntervention?: string;
    }>;
    parameters: Array<{
      id: string;
      label: string;
    }>;
    representationModes: RepresentationType[];
  }>;
  instruction: string;
};

export type BiologicalIntentProvider = {
  id: string;
  isAvailable: () => boolean;
  interpret: (request: BiologicalIntentProviderRequest) => Promise<unknown>;
  repairFormat?: (
    request: BiologicalIntentProviderRequest,
    invalidResponse: unknown,
    validationErrors: string[]
  ) => Promise<unknown>;
};

export type InterpretationLogEntry = {
  providerId: string;
  prompt: string;
  structuredResponse: unknown;
  validationResult: {
    valid: boolean;
    errors: string[];
  };
  fallbackPath: "none" | "no-api-key" | "provider-error" | "format-repair" | "deterministic";
};

export type BiologicalIntentInterpretation = {
  resolution: PromptIntentResolution;
  source: "llm" | "deterministic";
  structuredResponse?: StructuredBiologicalIntent;
  logs: InterpretationLogEntry[];
};

const allowedTopLevelKeys = new Set([
  "processSelection",
  "biologicalContext",
  "requestedFocus",
  "requestedEntities",
  "requestedRepresentation",
  "requestedIntervention",
  "scientificModelDelta",
  "confidence",
  "ambiguity",
  "unsupported"
]);

const allowedDeltaKeys = new Set([
  "representationChoice",
  "selectedEntities",
  "hiddenEntities",
  "activeIntervention",
  "parameterUpdates"
]);

const allowedProcessSelectionKeys = new Set(["processId", "confidence"]);
const allowedInterventionKeys = new Set(["commandId", "interventionId", "confidence"]);
const allowedUnsupportedKeys = new Set(["reason"]);
const allowedParameterUpdateKeys = new Set(["id", "value"]);

const representationModes: RepresentationType[] = [
  "scene",
  "timeline",
  "graph",
  "explanation",
  "json"
];
const PROVIDER_PROCESS_CONFIDENCE_THRESHOLD = 0.38;

export async function interpretBiologicalIntent(
  prompt: string,
  packs: BiologicalProcessPack[],
  provider?: BiologicalIntentProvider
): Promise<BiologicalIntentInterpretation> {
  const fallback = () => resolvePromptIntent(prompt, packs);
  const providerId = provider?.id ?? "deterministic";

  if (!provider || !provider.isAvailable()) {
    return {
      resolution: fallback(),
      source: "deterministic",
      logs: [
        {
          providerId,
          prompt,
          structuredResponse: null,
          validationResult: { valid: false, errors: ["No LLM provider or API key is available."] },
          fallbackPath: "no-api-key"
        }
      ]
    };
  }

  const request = buildProviderRequest(prompt, packs);

  try {
    const response = await provider.interpret(request);
    const validation = validateStructuredIntent(response, packs);

    if (validation.valid) {
      return {
        resolution: resolutionFromStructuredIntent(validation.value, packs),
        source: "llm",
        structuredResponse: validation.value,
        logs: [
          {
            providerId,
            prompt,
            structuredResponse: response,
            validationResult: { valid: true, errors: [] },
            fallbackPath: "none"
          }
        ]
      };
    }

    const validationErrors = validation.errors;

    if (provider.repairFormat) {
      const repaired = await provider.repairFormat(request, response, validationErrors);
      const repairedValidation = validateStructuredIntent(repaired, packs);

      if (repairedValidation.valid) {
        return {
          resolution: resolutionFromStructuredIntent(repairedValidation.value, packs),
          source: "llm",
          structuredResponse: repairedValidation.value,
          logs: [
            {
              providerId,
              prompt,
              structuredResponse: response,
              validationResult: { valid: false, errors: validationErrors },
              fallbackPath: "format-repair"
            },
            {
              providerId,
              prompt,
              structuredResponse: repaired,
              validationResult: { valid: true, errors: [] },
              fallbackPath: "none"
            }
          ]
        };
      }

      return fallbackWithLogs(prompt, providerId, fallback(), response, validationErrors, repaired, repairedValidation.errors);
    }

    return {
      resolution: fallback(),
      source: "deterministic",
      logs: [
        {
          providerId,
          prompt,
          structuredResponse: response,
          validationResult: { valid: false, errors: validationErrors },
          fallbackPath: "deterministic"
        }
      ]
    };
  } catch (error) {
    return {
      resolution: fallback(),
      source: "deterministic",
      logs: [
        {
          providerId,
          prompt,
          structuredResponse: error instanceof Error ? error.message : String(error),
          validationResult: { valid: false, errors: ["Provider threw before returning structured data."] },
          fallbackPath: "provider-error"
        }
      ]
    };
  }
}

export function validateStructuredIntent(
  response: unknown,
  packs: BiologicalProcessPack[]
): { valid: true; value: StructuredBiologicalIntent } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(response)) {
    return { valid: false, errors: ["Response must be an object."] };
  }

  for (const key of Object.keys(response)) {
    if (!allowedTopLevelKeys.has(key)) {
      errors.push(`Unsupported top-level field "${key}".`);
    }
  }

  const pack = validateProcessSelection(response.processSelection, packs, errors);
  validateContext(response.biologicalContext, pack, errors);
  validateStringArray(response.requestedFocus, "requestedFocus", errors);
  validateEntityIds(response.requestedEntities, pack, "requestedEntities", errors);
  validateRepresentation(response.requestedRepresentation, "requestedRepresentation", errors);
  validateIntervention(response.requestedIntervention, pack, errors);
  validateModelDelta(response.scientificModelDelta, pack, errors);
  validateConfidence(response.confidence, "confidence", errors);
  validateStringArray(response.ambiguity, "ambiguity", errors);
  validateUnsupported(response.unsupported, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: response as StructuredBiologicalIntent
  };
}

export function buildProviderRequest(
  prompt: string,
  packs: BiologicalProcessPack[]
): BiologicalIntentProviderRequest {
  return {
    prompt,
    instruction:
      "Return only structured biological intent. Do not generate executable code, equations, renderer instructions, new process ids, or unsupported entities.",
    packs: packs.map((pack) => ({
      id: pack.id,
      process: pack.process,
      aliases: pack.aliases,
      biologicalContexts: pack.biologicalContexts,
      entities: pack.entities.map((entity) => ({
        id: entity.id,
        label: entity.label,
        aliases: entity.aliases
      })),
      commandRules: pack.commandRules.map((rule) => ({
        id: rule.id,
        phrases: rule.phrases,
        activeIntervention: rule.patch.activeIntervention
      })),
      parameters: pack.parameters.map((parameter) => ({
        id: parameter.id,
        label: parameter.label
      })),
      representationModes
    }))
  };
}

function resolutionFromStructuredIntent(
  intent: StructuredBiologicalIntent,
  packs: BiologicalProcessPack[]
): PromptIntentResolution {
  const pack = intent.processSelection
    ? packs.find((item) => item.id === intent.processSelection?.processId)
    : undefined;
  const context: Context = {
    value: intent.biologicalContext ?? pack?.defaultContext ?? null,
    confidence: intent.biologicalContext ? intent.confidence : 0,
    matchedKeywords: intent.biologicalContext ? [intent.biologicalContext] : []
  };
  const intervention: InterventionIntent | undefined = intent.requestedIntervention
    ? {
        commandId: intent.requestedIntervention.commandId ?? "",
        interventionId: intent.requestedIntervention.interventionId ?? null,
        confidence: intent.requestedIntervention.confidence,
        matchedPhrase: intent.requestedIntervention.commandId ?? intent.requestedIntervention.interventionId ?? ""
      }
    : undefined;

  return {
    processCandidates: pack && intent.processSelection
      ? [{
          packId: pack.id,
          process: pack.process,
          score: intent.processSelection.confidence,
          matchedTerms: [pack.process],
          reasons: ["llm structured provider"]
        }]
      : [],
    biologicalContext: context,
    requestedFocus: intent.requestedFocus,
    requestedEntities: intent.requestedEntities,
    requestedRepresentation: intent.requestedRepresentation,
    requestedIntervention: intervention,
    confidence: intent.confidence,
    ambiguity: intent.ambiguity
  };
}

function fallbackWithLogs(
  prompt: string,
  providerId: string,
  resolution: PromptIntentResolution,
  response: unknown,
  validationErrors: string[],
  repaired: unknown,
  repairedErrors: string[]
): BiologicalIntentInterpretation {
  return {
    resolution,
    source: "deterministic",
    logs: [
      {
        providerId,
        prompt,
        structuredResponse: response,
        validationResult: { valid: false, errors: validationErrors },
        fallbackPath: "format-repair"
      },
      {
        providerId,
        prompt,
        structuredResponse: repaired,
        validationResult: { valid: false, errors: repairedErrors },
        fallbackPath: "deterministic"
      }
    ]
  };
}

function validateProcessSelection(
  value: unknown,
  packs: BiologicalProcessPack[],
  errors: string[]
) {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    errors.push("processSelection must be an object.");
    return undefined;
  }

  rejectUnknownKeys(value, allowedProcessSelectionKeys, "processSelection", errors);
  const processId = value.processId;
  validateConfidence(value.confidence, "processSelection.confidence", errors);

  if (typeof value.confidence === "number" && value.confidence < PROVIDER_PROCESS_CONFIDENCE_THRESHOLD) {
    errors.push("processSelection.confidence is below the process selection threshold.");
  }

  if (typeof processId !== "string") {
    errors.push("processSelection.processId must be a string.");
    return undefined;
  }

  const pack = packs.find((item) => item.id === processId);

  if (!pack) {
    errors.push(`Unsupported process id "${processId}".`);
  }

  return pack;
}

function validateContext(value: unknown, pack: BiologicalProcessPack | undefined, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "string") {
    errors.push("biologicalContext must be a string.");
    return;
  }

  if (!pack || !pack.biologicalContexts.includes(value)) {
    errors.push(`Unsupported biological context "${value}".`);
  }
}

function validateStringArray(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${path} must be an array of strings.`);
  }
}

function validateEntityIds(
  value: unknown,
  pack: BiologicalProcessPack | undefined,
  path: string,
  errors: string[]
) {
  validateStringArray(value, path, errors);

  if (!Array.isArray(value) || !pack) {
    return;
  }

  const entityIds = new Set(pack.entities.map((entity) => entity.id));

  for (const entityId of value) {
    if (typeof entityId === "string" && !entityIds.has(entityId)) {
      errors.push(`${path} contains unsupported entity "${entityId}".`);
    }
  }
}

function validateRepresentation(value: unknown, path: string, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "string" || !representationModes.includes(value as RepresentationType)) {
    errors.push(`${path} must be a supported representation mode.`);
  }
}

function validateIntervention(
  value: unknown,
  pack: BiologicalProcessPack | undefined,
  errors: string[]
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push("requestedIntervention must be an object.");
    return;
  }

  rejectUnknownKeys(value, allowedInterventionKeys, "requestedIntervention", errors);
  validateConfidence(value.confidence, "requestedIntervention.confidence", errors);

  if (!pack) {
    errors.push("requestedIntervention requires a valid processSelection.");
    return;
  }

  const commandId = value.commandId;
  const interventionId = value.interventionId;

  if (commandId !== undefined && (
    typeof commandId !== "string" ||
    !pack.commandRules.some((rule) => rule.id === commandId)
  )) {
    errors.push(`Unsupported command id "${String(commandId)}".`);
  }

  if (interventionId !== undefined && interventionId !== null && (
    typeof interventionId !== "string" ||
    !pack.interventions.some((intervention) => intervention.id === interventionId)
  )) {
    errors.push(`Unsupported intervention id "${String(interventionId)}".`);
  }
}

function validateModelDelta(
  value: unknown,
  pack: BiologicalProcessPack | undefined,
  errors: string[]
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push("scientificModelDelta must be an object.");
    return;
  }

  rejectUnknownKeys(value, allowedDeltaKeys, "scientificModelDelta", errors);

  validateRepresentation(value.representationChoice, "scientificModelDelta.representationChoice", errors);
  if (value.selectedEntities !== undefined) {
    validateEntityIds(value.selectedEntities, pack, "scientificModelDelta.selectedEntities", errors);
  }
  if (value.hiddenEntities !== undefined) {
    validateEntityIds(value.hiddenEntities, pack, "scientificModelDelta.hiddenEntities", errors);
  }

  if (value.activeIntervention !== undefined && (
    typeof value.activeIntervention !== "string" ||
    !pack?.interventions.some((intervention) => intervention.id === value.activeIntervention)
  )) {
    errors.push(`Unsupported ScientificModel delta intervention "${String(value.activeIntervention)}".`);
  }

  if (value.parameterUpdates !== undefined) {
    validateParameterUpdates(value.parameterUpdates, pack, errors);
  }
}

function validateParameterUpdates(
  value: unknown,
  pack: BiologicalProcessPack | undefined,
  errors: string[]
) {
  if (!Array.isArray(value)) {
    errors.push("scientificModelDelta.parameterUpdates must be an array.");
    return;
  }

  const parameterIds = new Set(pack?.parameters.map((parameter) => parameter.id) ?? []);

  for (const item of value) {
    if (!isRecord(item)) {
      errors.push("scientificModelDelta.parameterUpdates entries must be objects.");
      continue;
    }

    rejectUnknownKeys(item, allowedParameterUpdateKeys, "scientificModelDelta.parameterUpdates[]", errors);

    if (typeof item.id !== "string" || !parameterIds.has(item.id)) {
      errors.push(`Unsupported parameter id "${String(item.id)}".`);
    }

    if (
      typeof item.value !== "string" &&
      typeof item.value !== "number" &&
      typeof item.value !== "boolean"
    ) {
      errors.push(`Parameter update "${String(item.id)}" has an unsupported value type.`);
    }
  }
}

function validateUnsupported(value: unknown, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push("unsupported must contain a reason string.");
    return;
  }

  rejectUnknownKeys(value, allowedUnsupportedKeys, "unsupported", errors);

  if (typeof value.reason !== "string") {
    errors.push("unsupported must contain a reason string.");
  }
}

function validateConfidence(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "number" || value < 0 || value > 1) {
    errors.push(`${path} must be a number from 0 to 1.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowedKeys: Set<string>,
  path: string,
  errors: string[]
) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Unsupported field "${path}.${key}".`);
    }
  }
}

export function applyScientificModelDelta(
  model: ScientificModel,
  delta: ScientificModelDelta | undefined
): ScientificModel {
  if (!delta) {
    return model;
  }

  return {
    ...model,
    representationChoice: delta.representationChoice ?? model.representationChoice,
    parameters: delta.parameterUpdates
      ? model.parameters.map((parameter) => {
          const update = delta.parameterUpdates?.find((item) => item.id === parameter.id);
          return update ? { ...parameter, value: update.value } : parameter;
        })
      : model.parameters
  };
}
