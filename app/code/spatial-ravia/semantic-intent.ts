/** SemanticIntent v1. Contract-only layer. No parser or renderer dependencies. */

import {
  detailLevels,
  entityIds,
  intentActs,
  mechanismIds,
  phenomenonIds,
  stateIds,
  type BiologicalStateId,
  type BiochemicalDirection,
  type DetailLevel,
  type DirectionMeaning,
  type IntentAct,
  type MechanismId,
  type MisconceptionStatus,
  type PhenomenonId,
  type RequestedOutputType,
  type ScreenDirection,
  type SemanticEntityId,
  type SemanticEntityRole,
} from "./foundation-semantic-vocabulary.ts";

export const semanticIntentSchemaVersion = "1" as const;
export type SemanticIntentSchemaVersion = typeof semanticIntentSchemaVersion;

export type SemanticFocus = "overview" | "local" | "region" | "relationship" | "terminus" | "activeSite" | "unknown";
export type SemanticSpatialFrame = "molecular" | "strandRelative" | "sequenceRelative" | "screen" | "unknown";

export type SemanticEntityMention = {
  rawText: string;
  resolvedId?: SemanticEntityId;
  candidateIds?: SemanticEntityId[];
  role?: SemanticEntityRole;
};

export type SemanticRequest = {
  subjects: SemanticEntityMention[];
  phenomenon?: PhenomenonId;
  mechanism?: MechanismId;
  states?: BiologicalStateId[];
  focus?: SemanticFocus;
  direction?: {
    biochemical?: BiochemicalDirection;
    screen?: ScreenDirection;
    meaning: DirectionMeaning;
  };
  spatialFrame?: SemanticSpatialFrame;
  detail?: DetailLevel;
  outputPreferences?: Array<"static" | "animated" | "comparison" | "localFocus" | "overview">;
  requestedOutput?: RequestedOutputType;
};

export type SemanticClaim = {
  rawText: string;
  status: MisconceptionStatus;
  correctedInterpretation?: string;
};

export type SemanticAlternative = {
  id: string;
  description: string;
  requests: SemanticRequest[];
  confidence: number;
};

export type SemanticClarification = {
  required: boolean;
  reason?: "scienceChangingAmbiguity" | "unresolvedEntity" | "multiplePlausibleMeanings" | "unsupportedCapability";
  questionPlaceholder?: string;
};

export type SemanticIntentV1 = {
  schemaVersion: SemanticIntentSchemaVersion;
  rawUtterance: string;
  canonicalGloss: string;
  acts: IntentAct[];
  requests: SemanticRequest[];
  assertedClaims: SemanticClaim[];
  alternatives: SemanticAlternative[];
  clarification: SemanticClarification;
  confidence: number;
};

export type SemanticIntentValidationIssue = {
  path: string;
  message: string;
};

export type SemanticIntentValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: SemanticIntentValidationIssue[] };

const validSet = <T extends string>(values: readonly T[]) => new Set<string>(values);
const actsSet = validSet(intentActs);
const entitiesSet = validSet(entityIds);
const phenomenaSet = validSet(phenomenonIds);
const mechanismsSet = validSet(mechanismIds);
const statesSet = validSet(stateIds);
const detailsSet = validSet(detailLevels);
const directionMeanings = new Set(["scientific", "presentational", "ambiguous"]);
const biochemicalDirections = new Set(["fiveToThree", "threeToFive", "strandRelative", "sequenceDirection", "molecularDirection", "unknown"]);
const screenDirections = new Set(["screenLeft", "screenRight", "screenTop", "screenBottom"]);
const spatialFrames = new Set(["molecular", "strandRelative", "sequenceRelative", "screen", "unknown"]);
const focuses = new Set(["overview", "local", "region", "relationship", "terminus", "activeSite", "unknown"]);
const outputPreferences = new Set(["static", "animated", "comparison", "localFocus", "overview"]);
const requestedOutputs = new Set(["scientificFigure", "interactiveScene", "comparisonFigure", "dataExport", "unspecified"]);
const clarificationReasons = new Set(["scienceChangingAmbiguity", "unresolvedEntity", "multiplePlausibleMeanings", "unsupportedCapability"]);
const misconceptionStatuses = new Set(["neutral", "suspected", "validated", "corrected"]);
type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);

const isUnitInterval = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1;

export function validateSemanticIntent(intent: SemanticIntentV1): SemanticIntentValidationResult {
  const issues: SemanticIntentValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  const checkKeys = (value: unknown, path: string, allowed: readonly string[]) => {
    if (!isRecord(value)) { issue(path, "must be an object"); return false; }
    const allowedSet = new Set(allowed);
    Object.keys(value).forEach((key) => { if (!allowedSet.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
    return true;
  };
  const validateMention = (value: unknown, path: string) => {
    if (!checkKeys(value, path, ["rawText", "resolvedId", "candidateIds", "role"])) return;
    const mention = value as UnknownRecord;
    if (typeof mention.rawText !== "string" || mention.rawText.trim().length === 0) issue(`${path}.rawText`, "is required");
    if (mention.resolvedId !== undefined && !entitiesSet.has(String(mention.resolvedId))) issue(`${path}.resolvedId`, "is not a stable entity ID");
    if (mention.candidateIds !== undefined) {
      if (!Array.isArray(mention.candidateIds)) issue(`${path}.candidateIds`, "must be an array");
      else mention.candidateIds.forEach((id, index) => { if (!entitiesSet.has(String(id))) issue(`${path}.candidateIds[${index}]`, "is not a stable entity ID"); });
    }
    if (mention.resolvedId === undefined && (!Array.isArray(mention.candidateIds) || mention.candidateIds.length === 0)) issue(path, "must retain a resolved ID or candidate IDs");
  };
  const validateRequest = (value: unknown, path: string) => {
    if (!checkKeys(value, path, ["subjects", "phenomenon", "mechanism", "states", "focus", "direction", "spatialFrame", "detail", "outputPreferences", "requestedOutput"])) return;
    const request = value as UnknownRecord;
    if (!Array.isArray(request.subjects)) issue(`${path}.subjects`, "must be an array");
    else request.subjects.forEach((subject, index) => validateMention(subject, `${path}.subjects[${index}]`));
    if (request.phenomenon !== undefined && !phenomenaSet.has(String(request.phenomenon))) issue(`${path}.phenomenon`, "is not a stable phenomenon ID");
    if (request.mechanism !== undefined && !mechanismsSet.has(String(request.mechanism))) issue(`${path}.mechanism`, "is not a stable mechanism ID");
    if ((!Array.isArray(request.subjects) || request.subjects.length === 0) && request.phenomenon === undefined && request.mechanism === undefined) issue(path, "must identify a subject, phenomenon, or mechanism");
    if (request.states !== undefined) {
      if (!Array.isArray(request.states)) issue(`${path}.states`, "must be an array");
      else request.states.forEach((state, index) => { if (!statesSet.has(String(state))) issue(`${path}.states[${index}]`, "is not a stable biological state ID"); });
    }
    if (request.focus !== undefined && !focuses.has(String(request.focus))) issue(`${path}.focus`, "is not a valid semantic focus");
    if (request.detail !== undefined && !detailsSet.has(String(request.detail))) issue(`${path}.detail`, "is not a valid detail level");
    if (request.spatialFrame !== undefined && !spatialFrames.has(String(request.spatialFrame))) issue(`${path}.spatialFrame`, "is not a valid semantic spatial frame");
    if (request.outputPreferences !== undefined) {
      if (!Array.isArray(request.outputPreferences)) issue(`${path}.outputPreferences`, "must be an array");
      else request.outputPreferences.forEach((preference, index) => { if (!outputPreferences.has(String(preference))) issue(`${path}.outputPreferences[${index}]`, "is not a valid output preference"); });
    }
    if (request.requestedOutput !== undefined && !requestedOutputs.has(String(request.requestedOutput))) issue(`${path}.requestedOutput`, "is not a valid requested output type");
    if (request.direction !== undefined) {
      if (!checkKeys(request.direction, `${path}.direction`, ["biochemical", "screen", "meaning"])) return;
      const direction = request.direction as UnknownRecord;
      if (direction.biochemical !== undefined && !biochemicalDirections.has(String(direction.biochemical))) issue(`${path}.direction.biochemical`, "is not a valid biochemical direction");
      if (direction.screen !== undefined && !screenDirections.has(String(direction.screen))) issue(`${path}.direction.screen`, "is not a valid screen direction");
      if (!directionMeanings.has(String(direction.meaning))) issue(`${path}.direction.meaning`, "is not a valid direction meaning");
      if (direction.screen !== undefined && direction.meaning === "scientific") issue(`${path}.direction`, "screen direction cannot be marked scientific");
    }
    if (request.spatialFrame === "screen" && request.direction && (request.direction as UnknownRecord).biochemical !== undefined) issue(`${path}.spatialFrame`, "screen frame cannot silently carry biochemical direction");
  };

  if (!checkKeys(intent, "intent", ["schemaVersion", "rawUtterance", "canonicalGloss", "acts", "requests", "assertedClaims", "alternatives", "clarification", "confidence"])) return { valid: false, issues };
  if (intent.schemaVersion !== semanticIntentSchemaVersion) issue("schemaVersion", "must be SemanticIntent schema version 1");
  if (typeof intent.rawUtterance !== "string" || intent.rawUtterance.trim().length === 0) issue("rawUtterance", "is required");
  if (typeof intent.canonicalGloss !== "string" || intent.canonicalGloss.trim().length === 0) issue("canonicalGloss", "is required");
  if (!Array.isArray(intent.acts)) issue("acts", "must be an array");
  else { if (intent.acts.length === 0) issue("acts", "must contain at least one intent act"); if (new Set(intent.acts).size !== intent.acts.length) issue("acts", "must not contain duplicate acts"); intent.acts.forEach((act, index) => { if (!actsSet.has(String(act))) issue(`acts[${index}]`, "is not a valid intent act"); }); }
  if (!Array.isArray(intent.requests)) issue("requests", "must be an array");
  else { if (intent.requests.length === 0) issue("requests", "must contain at least one semantic request"); intent.requests.forEach((request, requestIndex) => validateRequest(request, `requests[${requestIndex}]`)); }
  if (!Array.isArray(intent.assertedClaims)) issue("assertedClaims", "must be an array");
  else intent.assertedClaims.forEach((claim, index) => { const path = `assertedClaims[${index}]`; if (!checkKeys(claim, path, ["rawText", "status", "correctedInterpretation"])) return; const value = claim as UnknownRecord; if (typeof value.rawText !== "string" || value.rawText.trim().length === 0) issue(`${path}.rawText`, "is required"); if (!misconceptionStatuses.has(String(value.status))) issue(`${path}.status`, "is not a valid claim status"); });
  if (!isUnitInterval(intent.confidence)) issue("confidence", "must be finite and within 0..1");

  let alternativeProbability = 0;
  if (!Array.isArray(intent.alternatives)) issue("alternatives", "must be an array");
  else intent.alternatives.forEach((alternative, index) => {
    const path = `alternatives[${index}]`;
    if (!checkKeys(alternative, path, ["id", "description", "requests", "confidence"])) return;
    const value = alternative as UnknownRecord;
    if (typeof value.id !== "string" || value.id.trim().length === 0) issue(`${path}.id`, "is required");
    if (typeof value.description !== "string" || value.description.trim().length === 0) issue(`${path}.description`, "is required");
    if (!isUnitInterval(Number(value.confidence))) issue(`${path}.confidence`, "must be finite and within 0..1");
    alternativeProbability += Number(value.confidence);
    if (!Array.isArray(value.requests) || value.requests.length === 0) issue(`${path}.requests`, "must contain a semantic alternative");
    else value.requests.forEach((request, requestIndex) => validateRequest(request, `${path}.requests[${requestIndex}]`));
  });
  if (alternativeProbability > 1 + 1e-9) issue("alternatives", "probabilities must sum to at most 1");

  if (!checkKeys(intent.clarification, "clarification", ["required", "reason", "questionPlaceholder"])) return { valid: false, issues };
  if (typeof intent.clarification.required !== "boolean") issue("clarification.required", "must be boolean");
  if (intent.clarification.reason !== undefined && !clarificationReasons.has(intent.clarification.reason)) issue("clarification.reason", "is not a valid clarification reason");
  if (intent.clarification.required && !intent.clarification.reason) issue("clarification.reason", "is required when clarification is required");
  if (intent.clarification.questionPlaceholder !== undefined && (typeof intent.clarification.questionPlaceholder !== "string" || intent.clarification.questionPlaceholder.trim().length === 0)) issue("clarification.questionPlaceholder", "must not be empty");
  if (!intent.clarification.required && intent.clarification.reason) issue("clarification.reason", "cannot be set when clarification is not required");

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

export function assertSemanticIntent(intent: SemanticIntentV1): asserts intent is SemanticIntentV1 {
  const result = validateSemanticIntent(intent);
  if (!result.valid) throw new Error(`Invalid SemanticIntent v1: ${result.issues.map(({ path, message }) => `${path} ${message}`).join("; ")}`);
}
