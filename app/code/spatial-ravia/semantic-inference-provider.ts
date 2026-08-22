/** P1-K5 provider-independent structured semantic inference boundary.
 * This module contains no model SDK, renderer, SceneSpec, or production owner.
 * A provider returns data only; P1-C validates and projects it. */
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
import { semanticIntentSchemaVersion, validateSemanticIntent, type SemanticIntentV1, type SemanticRequest } from "./semantic-intent.ts";
import { normalizedPromptSchemaVersion, type NormalizedPrompt } from "./prompt-normalization.ts";

export type SemanticInferenceSubject = {
  rawText: string;
  resolvedId?: SemanticEntityId;
  candidateIds?: SemanticEntityId[];
  role?: SemanticEntityRole;
};

export type SemanticInferenceRequest = {
  subjects: SemanticInferenceSubject[];
  phenomenon?: PhenomenonId;
  mechanism?: MechanismId;
  states?: BiologicalStateId[];
  focus?: SemanticRequest["focus"];
  direction?: { biochemical?: BiochemicalDirection; screen?: ScreenDirection; meaning: DirectionMeaning };
  spatialFrame?: SemanticRequest["spatialFrame"];
  detail?: DetailLevel;
  outputPreferences?: NonNullable<SemanticRequest["outputPreferences"]>;
  requestedOutput?: RequestedOutputType;
};

export type SemanticInferenceClaim = {
  rawText: string;
  status: MisconceptionStatus;
  correctedInterpretation?: string;
};

export type SemanticInferenceAlternative = {
  id: string;
  description: string;
  requests: SemanticInferenceRequest[];
  confidence: number;
};

/** The complete model output. It is intentionally a strict subset of
 * SemanticIntent v1 and contains no renderer or scientific-topology fields. */
export type SemanticInferenceOutput = {
  canonicalGloss: string;
  acts: IntentAct[];
  requests: SemanticInferenceRequest[];
  assertedClaims: SemanticInferenceClaim[];
  alternatives: SemanticInferenceAlternative[];
  confidence: number;
};

export type SemanticInferenceInput = {
  normalizedPrompt: NormalizedPrompt;
  vocabulary: SemanticVocabularyPacket;
};

export type SemanticVocabularyPacket = {
  entityIds: readonly SemanticEntityId[];
  phenomenonIds: readonly PhenomenonId[];
  mechanismIds: readonly MechanismId[];
  stateIds: readonly BiologicalStateId[];
  intentActs: readonly IntentAct[];
  detailLevels: readonly DetailLevel[];
};

export const frozenSemanticVocabularyPacket: SemanticVocabularyPacket = {
  entityIds, phenomenonIds, mechanismIds, stateIds, intentActs, detailLevels,
};

export type SemanticInferenceProvider = {
  readonly id: string;
  infer(input: SemanticInferenceInput): Promise<unknown>;
};

export type SemanticInferenceFailureCode = "provider_error" | "malformed_output" | "invalid_vocabulary" | "invalid_semantic_intent";
export type SemanticInferenceResult =
  | { ok: true; intent: SemanticIntentV1; providerId: string; latencyMs: number }
  | { ok: false; providerId: string; code: SemanticInferenceFailureCode; issues: readonly string[]; latencyMs: number };

type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const isUnit = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
const sets = {
  acts: new Set(intentActs), entities: new Set(entityIds), phenomena: new Set(phenomenonIds), mechanisms: new Set(mechanismIds), states: new Set(stateIds), details: new Set(detailLevels),
  roles: new Set(["substrate", "product", "template", "complement", "donor", "acceptor", "catalyst", "regulator", "lesion", "focus", "context"]),
  focuses: new Set(["overview", "local", "region", "relationship", "terminus", "activeSite", "unknown"]), frames: new Set(["molecular", "strandRelative", "sequenceRelative", "screen", "unknown"]),
  biochemical: new Set(["fiveToThree", "threeToFive", "strandRelative", "sequenceDirection", "molecularDirection", "unknown"]), screen: new Set(["screenLeft", "screenRight", "screenTop", "screenBottom"]), meanings: new Set(["scientific", "presentational", "ambiguous"]),
  outputs: new Set(["scientificFigure", "interactiveScene", "comparisonFigure", "dataExport", "unspecified"]), preferences: new Set(["static", "animated", "comparison", "localFocus", "overview"]), statuses: new Set(["neutral", "suspected", "validated", "corrected"]),
};

function keys(value: unknown, allowed: readonly string[], path: string, issues: string[]): value is RecordValue {
  if (!isRecord(value)) { issues.push(`${path}: expected object`); return false; }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) issues.push(`${path}.${key}: unknown field`);
  return true;
}
function enumValue(value: unknown, set: Set<string>, path: string, issues: string[]) { if (value !== undefined && (typeof value !== "string" || !set.has(value))) issues.push(`${path}: invalid vocabulary value`); }
function arrayValues(value: unknown, set: Set<string>, path: string, issues: string[]) { if (!Array.isArray(value)) issues.push(`${path}: expected array`); else value.forEach((item, index) => enumValue(item, set, `${path}[${index}]`, issues)); }

function validateSubject(value: unknown, path: string, issues: string[]) {
  if (!keys(value, ["rawText", "resolvedId", "candidateIds", "role"], path, issues)) return;
  const subject = value as RecordValue;
  if (typeof subject.rawText !== "string" || !subject.rawText.trim()) issues.push(`${path}.rawText: required`);
  enumValue(subject.resolvedId, sets.entities, `${path}.resolvedId`, issues);
  if (subject.candidateIds !== undefined) arrayValues(subject.candidateIds, sets.entities, `${path}.candidateIds`, issues);
  enumValue(subject.role, sets.roles, `${path}.role`, issues);
  if (subject.resolvedId === undefined && (!Array.isArray(subject.candidateIds) || subject.candidateIds.length === 0)) issues.push(`${path}: resolvedId or candidateIds required`);
}
function validateRequest(value: unknown, path: string, issues: string[]) {
  if (!keys(value, ["subjects", "phenomenon", "mechanism", "states", "focus", "direction", "spatialFrame", "detail", "outputPreferences", "requestedOutput"], path, issues)) return;
  const request = value as RecordValue;
  if (!Array.isArray(request.subjects) || request.subjects.length === 0) issues.push(`${path}.subjects: at least one subject required`); else request.subjects.forEach((subject, index) => validateSubject(subject, `${path}.subjects[${index}]`, issues));
  enumValue(request.phenomenon, sets.phenomena, `${path}.phenomenon`, issues); enumValue(request.mechanism, sets.mechanisms, `${path}.mechanism`, issues); arrayValues(request.states ?? [], sets.states, `${path}.states`, issues); enumValue(request.focus, sets.focuses, `${path}.focus`, issues); enumValue(request.spatialFrame, sets.frames, `${path}.spatialFrame`, issues); enumValue(request.detail, sets.details, `${path}.detail`, issues); enumValue(request.requestedOutput, sets.outputs, `${path}.requestedOutput`, issues); arrayValues(request.outputPreferences ?? [], sets.preferences, `${path}.outputPreferences`, issues);
  if (request.direction !== undefined && keys(request.direction, ["biochemical", "screen", "meaning"], `${path}.direction`, issues)) { const direction = request.direction as RecordValue; enumValue(direction.biochemical, sets.biochemical, `${path}.direction.biochemical`, issues); enumValue(direction.screen, sets.screen, `${path}.direction.screen`, issues); enumValue(direction.meaning, sets.meanings, `${path}.direction.meaning`, issues); if (direction.screen !== undefined && direction.meaning === "scientific") issues.push(`${path}.direction: screen direction cannot be scientific`); }
}

/** Strict runtime parser for model output. Unknown fields are fatal. */
export function parseSemanticInferenceOutput(value: unknown): { ok: true; output: SemanticInferenceOutput } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  if (!keys(value, ["canonicalGloss", "acts", "requests", "assertedClaims", "alternatives", "confidence"], "model", issues)) return { ok: false, issues };
  const model = value as RecordValue;
  if (typeof model.canonicalGloss !== "string" || !model.canonicalGloss.trim()) issues.push("model.canonicalGloss: required");
  if (!Array.isArray(model.acts) || model.acts.length === 0) issues.push("model.acts: required"); else { arrayValues(model.acts, sets.acts, "model.acts", issues); if (new Set(model.acts).size !== model.acts.length) issues.push("model.acts: duplicates are not allowed"); }
  if (!Array.isArray(model.requests) || model.requests.length === 0) issues.push("model.requests: required"); else model.requests.forEach((request, index) => validateRequest(request, `model.requests[${index}]`, issues));
  if (!Array.isArray(model.assertedClaims)) issues.push("model.assertedClaims: required"); else model.assertedClaims.forEach((claim, index) => { if (!keys(claim, ["rawText", "status", "correctedInterpretation"], `model.assertedClaims[${index}]`, issues)) return; const item = claim as RecordValue; if (typeof item.rawText !== "string" || !item.rawText.trim()) issues.push(`model.assertedClaims[${index}].rawText: required`); enumValue(item.status, sets.statuses, `model.assertedClaims[${index}].status`, issues); });
  if (!Array.isArray(model.alternatives)) issues.push("model.alternatives: required"); else model.alternatives.forEach((alternative, index) => { if (!keys(alternative, ["id", "description", "requests", "confidence"], `model.alternatives[${index}]`, issues)) return; const item = alternative as RecordValue; if (typeof item.id !== "string" || !item.id.trim()) issues.push(`model.alternatives[${index}].id: required`); if (typeof item.description !== "string" || !item.description.trim()) issues.push(`model.alternatives[${index}].description: required`); if (!Array.isArray(item.requests) || item.requests.length === 0) issues.push(`model.alternatives[${index}].requests: required`); else item.requests.forEach((request, requestIndex) => validateRequest(request, `model.alternatives[${index}].requests[${requestIndex}]`, issues)); if (!isUnit(item.confidence)) issues.push(`model.alternatives[${index}].confidence: must be 0..1`); });
  if (!isUnit(model.confidence)) issues.push("model.confidence: must be 0..1");
  const alternatives = Array.isArray(model.alternatives) ? model.alternatives as Array<RecordValue> : []; const sum = alternatives.reduce((total, item) => total + (typeof item.confidence === "number" ? item.confidence : 0), 0); if (sum > 1 + 1e-9) issues.push("model.alternatives: confidence sum exceeds 1");
  if (issues.length) return { ok: false, issues };
  return { ok: true, output: model as unknown as SemanticInferenceOutput };
}

export function projectSemanticInference(normalizedPrompt: NormalizedPrompt, output: SemanticInferenceOutput): SemanticIntentV1 {
  const intent: SemanticIntentV1 = { schemaVersion: semanticIntentSchemaVersion, rawUtterance: normalizedPrompt.raw.rawText, canonicalGloss: output.canonicalGloss, acts: output.acts, requests: output.requests, assertedClaims: output.assertedClaims, alternatives: output.alternatives, clarification: { required: false }, confidence: output.confidence };
  const validation = validateSemanticIntent(intent);
  if (!validation.valid) throw new Error(`Model projection is not SemanticIntent v1: ${validation.issues.map(({ path, message }) => `${path} ${message}`).join("; ")}`);
  return intent;
}

export async function inferSemanticIntent(normalizedPrompt: NormalizedPrompt, provider: SemanticInferenceProvider): Promise<SemanticInferenceResult> {
  const started = Date.now();
  try {
    const raw = await provider.infer({ normalizedPrompt, vocabulary: frozenSemanticVocabularyPacket });
    const parsed = parseSemanticInferenceOutput(raw);
    if (!parsed.ok) return { ok: false, providerId: provider.id, code: "malformed_output", issues: parsed.issues, latencyMs: Date.now() - started };
    try { return { ok: true, providerId: provider.id, intent: projectSemanticInference(normalizedPrompt, parsed.output), latencyMs: Date.now() - started }; }
    catch (error) { return { ok: false, providerId: provider.id, code: "invalid_semantic_intent", issues: [error instanceof Error ? error.message : String(error)], latencyMs: Date.now() - started }; }
  } catch (error) { return { ok: false, providerId: provider.id, code: "provider_error", issues: [error instanceof Error ? error.message : String(error)], latencyMs: Date.now() - started }; }
}

export const semanticInferenceInstruction = "Interpret the user's meaning, not scientific truth. Preserve claims, ambiguity, screen direction, unspecified actors, and all independent mechanisms. Emit only the bounded structured fields; never invent IDs or renderer/geometry concepts.";
