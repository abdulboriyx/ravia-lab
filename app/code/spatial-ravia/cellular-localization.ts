/**
 * D-B: additive, renderer-independent cellular compartment and localization
 * semantics. This module composes with ScientificSceneSpec v1; it does not
 * mutate or reinterpret the frozen F2/P2 scene contract.
 */

import type { ScientificActorId, ScientificActorScene } from "./scientific-actor.ts";
import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { ProvenanceSourceId, ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";

export const cellularScientificExtensionSchemaVersion = "1" as const;

export const cellularCompartmentTypes = [
  "EXTRACELLULAR_SPACE", "CYTOSOL", "NUCLEUS", "NUCLEOPLASM", "NUCLEOLUS",
  "NUCLEAR_ENVELOPE", "NUCLEAR_PORE", "ER_LUMEN", "ER_MEMBRANE",
  "GOLGI_LUMEN", "GOLGI_MEMBRANE", "VESICLE_LUMEN", "VESICLE_MEMBRANE",
  "PLASMA_MEMBRANE", "EARLY_ENDOSOME", "EARLY_ENDOSOME_LUMEN", "EARLY_ENDOSOME_MEMBRANE",
] as const;
export type CellularCompartmentType = (typeof cellularCompartmentTypes)[number];

export const cellularScaleLevels = ["MOLECULAR", "COMPLEX", "ORGANELLE", "CELLULAR", "MULTI_COMPARTMENT"] as const;
export type CellularScaleLevel = (typeof cellularScaleLevels)[number];

export const compartmentRelationKinds = ["CONTAINED_IN", "ENCLOSED_BY", "MEMBRANE_OF", "LUMEN_OF", "ADJACENT_TO", "CONNECTED_VIA", "HAS_BOUNDARY"] as const;
export type CompartmentRelationKind = (typeof compartmentRelationKinds)[number];

export const membraneSides = ["CYTOSOLIC", "LUMINAL", "EXTRACELLULAR", "NUCLEOPLASMIC"] as const;
export type MembraneSide = (typeof membraneSides)[number];

export const localizationKinds = ["IN_COMPARTMENT", "MEMBRANE_EMBEDDED", "MEMBRANE_ASSOCIATED", "LUMINAL", "CYTOSOLIC_FACE", "EXTRACELLULAR_FACE", "NUCLEAR", "CYTOSOLIC"] as const;
export type LocalizationKind = (typeof localizationKinds)[number];

export const transportKinds = ["DIFFUSION", "FACILITATED_TRANSPORT", "ACTIVE_TRANSPORT", "NUCLEAR_IMPORT", "NUCLEAR_EXPORT", "TRANSLOCATION", "VESICULAR_TRANSPORT", "ENDOCYTOSIS", "EXOCYTOSIS"] as const;
export type TransportKind = (typeof transportKinds)[number];

export const cellularSpatialRelationKinds = ["INSIDE", "OUTSIDE", "MEMBRANE_ASSOCIATED", "NEAR", "BOUND_TO", "LUMINAL", "CYTOSOLIC_SIDE_OF"] as const;
export type CellularSpatialRelationKind = (typeof cellularSpatialRelationKinds)[number];

export type CellularExternalOntologyRefV1 = {
  namespace: "GO" | "UniProt";
  identifier: string;
};

export type CompartmentV1 = {
  compartmentId: string;
  type: CellularCompartmentType;
  parentCompartmentId?: string;
  enclosingMembraneId?: string;
  sourceIds?: ProvenanceSourceId[];
  fidelity: ScientificFidelityTier;
  externalOntologyRefs?: CellularExternalOntologyRefV1[];
};

export type CompartmentRelationV1 = {
  relationId: string;
  kind: CompartmentRelationKind;
  subjectId: string;
  objectId: string;
  sourceIds?: ProvenanceSourceId[];
};

export type LocalizationV1 = {
  actorId: ScientificActorId;
  compartmentId: string;
  localizationKind: LocalizationKind;
  membraneId?: string;
  membraneSide?: MembraneSide;
  sourceIds?: ProvenanceSourceId[];
};

export type LocalizationChangeV1 = {
  changeId: string;
  actorId: ScientificActorId;
  from: LocalizationV1;
  to: LocalizationV1;
  transportKind: TransportKind;
  membraneRelationId?: string;
  timelineEventId?: string;
  sourceIds?: ProvenanceSourceId[];
  requiredChangeIds?: string[];
};

export type CellularSpatialRelationV1 = {
  relationId: string;
  kind: CellularSpatialRelationKind;
  subjectActorId: ScientificActorId;
  objectId: string;
  qualitative?: "SCHEMATIC" | "GROUNDED";
  sourceIds?: ProvenanceSourceId[];
};

/** Locality is attached once to the scientific subject that occurs there. */
export type CellularLocalityV1 = {
  subjectKind: "interaction" | "timelineEvent";
  subjectId: string;
  compartmentId: string;
  sourceIds?: ProvenanceSourceId[];
};

export type CellularScientificExtensionV1 = {
  schemaVersion: typeof cellularScientificExtensionSchemaVersion;
  scale: CellularScaleLevel;
  compartments: CompartmentV1[];
  compartmentRelations: CompartmentRelationV1[];
  localizations: LocalizationV1[];
  localizationChanges: LocalizationChangeV1[];
  spatialRelations?: CellularSpatialRelationV1[];
  localities?: CellularLocalityV1[];
};

/** Versioned composition wrapper; ScientificSceneSpec v1 remains unchanged. */
export type CellularScientificSceneV1 = {
  scene: ScientificSceneSpec;
  cellular: CellularScientificExtensionV1;
};

export type CellularValidationIssue = { path: string; message: string };
export type CellularValidationResult = { valid: true; issues: [] } | { valid: false; issues: CellularValidationIssue[] };

type UnknownRecord = Record<string, unknown>;
const idPattern = /^[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const finiteId = (value: unknown): value is string => typeof value === "string" && idPattern.test(value);
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const checkKeys = (value: unknown, path: string, allowed: readonly string[], issue: (path: string, message: string) => void) => {
  if (!isRecord(value)) { issue(path, "must be an object"); return false; }
  const allowedSet = new Set(allowed);
  Object.keys(value).forEach((key) => { if (!allowedSet.has(key)) issue(`${path}.${key}`, "unknown field is not allowed"); });
  return true;
};
const checkIdArray = (value: unknown, path: string, issue: (path: string, message: string) => void) => {
  if (!Array.isArray(value)) { issue(path, "must be an array"); return; }
  if (!unique(value.map(String))) issue(path, "must not contain duplicate IDs");
  value.forEach((entry, index) => { if (!finiteId(entry)) issue(`${path}[${index}]`, "must be a stable ID"); });
};
const allowedFidelity = new Set<ScientificFidelityTier>(["E0_DEPOSITED", "C0_COMPUTED", "S1_CONSTRAINED", "S2_SCHEMATIC", "O_OVERLAY"]);

function validateSources(value: unknown, path: string, sourceIds: Set<string>, issue: (path: string, message: string) => void) {
  if (value === undefined) return;
  checkIdArray(value, path, issue);
  if (Array.isArray(value)) value.forEach((entry, index) => { if (typeof entry === "string" && sourceIds.size && !sourceIds.has(entry)) issue(`${path}[${index}]`, "references a missing provenance source"); });
}

function validateExternalRefs(value: unknown, path: string, issue: (path: string, message: string) => void) {
  if (value === undefined) return;
  if (!Array.isArray(value)) { issue(path, "must be an array"); return; }
  const keys = ["namespace", "identifier"] as const;
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!checkKeys(entry, entryPath, keys, issue)) return;
    const item = entry as UnknownRecord;
    if (!(item.namespace === "GO" || item.namespace === "UniProt")) issue(`${entryPath}.namespace`, "must be GO or UniProt");
    if (typeof item.identifier !== "string" || item.identifier.length === 0) issue(`${entryPath}.identifier`, "must be non-empty");
  });
}

function relationAllowed(kind: CompartmentRelationKind, subject: CompartmentV1 | undefined, object: CompartmentV1 | undefined): boolean {
  if (!subject || !object) return false;
  const membraneTypes = new Set(["PLASMA_MEMBRANE", "ER_MEMBRANE", "NUCLEAR_ENVELOPE", "VESICLE_MEMBRANE", "GOLGI_MEMBRANE", "EARLY_ENDOSOME_MEMBRANE"]);
  const lumenTypes = new Set(["NUCLEOPLASM", "NUCLEOLUS", "ER_LUMEN", "GOLGI_LUMEN", "VESICLE_LUMEN", "EARLY_ENDOSOME_LUMEN"]);
  switch (kind) {
    case "CONTAINED_IN": return subject.compartmentId !== object.compartmentId;
    case "ENCLOSED_BY": return lumenTypes.has(subject.type) && membraneTypes.has(object.type);
    case "MEMBRANE_OF": return membraneTypes.has(subject.type) && object.compartmentId !== subject.compartmentId;
    case "LUMEN_OF": return lumenTypes.has(subject.type) && membraneTypes.has(object.type);
    case "ADJACENT_TO": return subject.compartmentId !== object.compartmentId;
    case "CONNECTED_VIA": return subject.compartmentId !== object.compartmentId && (object.type === "NUCLEAR_PORE" || membraneTypes.has(object.type));
    case "HAS_BOUNDARY": return membraneTypes.has(object.type);
  }
}

function validateLocalization(value: unknown, path: string, actorIds: Set<string>, compartments: Map<string, CompartmentV1>, membraneIds: Set<string>, sourceIds: Set<string>, issue: (path: string, message: string) => void): LocalizationV1 | undefined {
  if (!checkKeys(value, path, ["actorId", "compartmentId", "localizationKind", "membraneId", "membraneSide", "sourceIds"], issue)) return undefined;
  const item = value as UnknownRecord;
  if (typeof item.actorId !== "string" || !actorIds.has(item.actorId)) issue(`${path}.actorId`, "must reference an actor");
  if (typeof item.compartmentId !== "string" || !compartments.has(item.compartmentId)) issue(`${path}.compartmentId`, "must reference a compartment");
  if (!localizationKinds.includes(item.localizationKind as LocalizationKind)) issue(`${path}.localizationKind`, "is invalid");
  const kind = item.localizationKind as LocalizationKind;
  const membraneRequired = ["MEMBRANE_EMBEDDED", "MEMBRANE_ASSOCIATED", "LUMINAL", "CYTOSOLIC_FACE", "EXTRACELLULAR_FACE"].includes(kind);
  if (membraneRequired && (typeof item.membraneId !== "string" || !membraneIds.has(item.membraneId))) issue(`${path}.membraneId`, "is required and must reference a membrane compartment");
  if (!membraneRequired && item.membraneId !== undefined) issue(`${path}.membraneId`, "is not valid for this localization kind");
  if (item.membraneSide !== undefined && !membraneSides.includes(item.membraneSide as MembraneSide)) issue(`${path}.membraneSide`, "is invalid");
  if (["CYTOSOLIC_FACE", "EXTRACELLULAR_FACE", "LUMINAL", "MEMBRANE_EMBEDDED"].includes(kind) && item.membraneSide === undefined) issue(`${path}.membraneSide`, "is required for membrane-facing localization");
  if (kind === "LUMINAL" && item.membraneSide !== "LUMINAL") issue(`${path}.membraneSide`, "luminal localization requires the LUMINAL side");
  if (kind === "CYTOSOLIC_FACE" && item.membraneSide !== "CYTOSOLIC") issue(`${path}.membraneSide`, "cytosolic-face localization requires the CYTOSOLIC side");
  if (kind === "EXTRACELLULAR_FACE" && item.membraneSide !== "EXTRACELLULAR") issue(`${path}.membraneSide`, "extracellular-face localization requires the EXTRACELLULAR side");
  validateSources(item.sourceIds, `${path}.sourceIds`, sourceIds, issue);
  return item as unknown as LocalizationV1;
}

export function validateCellularScientificExtension(extension: CellularScientificExtensionV1, actorScene: ScientificActorScene, sourceIds: readonly string[], timeline?: ScientificTimeline, interactionIds: readonly string[] = []): CellularValidationResult {
  const issues: CellularValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (!checkKeys(extension, "cellular", ["schemaVersion", "scale", "compartments", "compartmentRelations", "localizations", "localizationChanges", "spatialRelations", "localities"], issue)) return { valid: false, issues };
  if (extension.schemaVersion !== cellularScientificExtensionSchemaVersion) issue("cellular.schemaVersion", "unknown cellular extension schema version");
  if (!cellularScaleLevels.includes(extension.scale)) issue("cellular.scale", "is invalid");
  if (!Array.isArray(extension.compartments) || extension.compartments.length === 0) issue("cellular.compartments", "must be a non-empty array");
  if (!Array.isArray(extension.compartmentRelations)) issue("cellular.compartmentRelations", "must be an array");
  if (!Array.isArray(extension.localizations)) issue("cellular.localizations", "must be an array");
  if (!Array.isArray(extension.localizationChanges)) issue("cellular.localizationChanges", "must be an array");

  const sourceSet = new Set(sourceIds.map(String));
  const compartments = new Map<string, CompartmentV1>();
  const membraneTypes = new Set(["PLASMA_MEMBRANE", "ER_MEMBRANE", "NUCLEAR_ENVELOPE", "VESICLE_MEMBRANE", "GOLGI_MEMBRANE", "EARLY_ENDOSOME_MEMBRANE"]);
  (Array.isArray(extension.compartments) ? extension.compartments : []).forEach((entry, index) => {
    const path = `cellular.compartments[${index}]`;
    if (!checkKeys(entry, path, ["compartmentId", "type", "parentCompartmentId", "enclosingMembraneId", "sourceIds", "fidelity", "externalOntologyRefs"], issue)) return;
    const item = entry as UnknownRecord;
    if (!finiteId(item.compartmentId)) issue(`${path}.compartmentId`, "must be a stable ID");
    if (compartments.has(String(item.compartmentId))) issue(`${path}.compartmentId`, "must be unique");
    if (!cellularCompartmentTypes.includes(item.type as CellularCompartmentType)) issue(`${path}.type`, "is invalid");
    if (item.parentCompartmentId !== undefined && !finiteId(item.parentCompartmentId)) issue(`${path}.parentCompartmentId`, "must be a stable ID");
    if (item.enclosingMembraneId !== undefined && !finiteId(item.enclosingMembraneId)) issue(`${path}.enclosingMembraneId`, "must be a stable ID");
    if (item.fidelity !== undefined && !allowedFidelity.has(item.fidelity as ScientificFidelityTier)) issue(`${path}.fidelity`, "is invalid");
    validateSources(item.sourceIds, `${path}.sourceIds`, sourceSet, issue);
    validateExternalRefs(item.externalOntologyRefs, `${path}.externalOntologyRefs`, issue);
    compartments.set(String(item.compartmentId), item as unknown as CompartmentV1);
  });
  const actorIds = new Set(actorScene.actors.map((actor) => String(actor.actorId)));
  const membraneIds = new Set([...compartments.values()].filter((item) => membraneTypes.has(item.type)).map((item) => item.compartmentId));
  compartments.forEach((item, id) => {
    if (item.parentCompartmentId !== undefined && !compartments.has(item.parentCompartmentId)) issue(`cellular.compartments.${id}.parentCompartmentId`, "references a missing compartment");
    if (item.enclosingMembraneId !== undefined && !membraneIds.has(item.enclosingMembraneId)) issue(`cellular.compartments.${id}.enclosingMembraneId`, "must reference a membrane compartment");
    const seen = new Set<string>(); let current: string | undefined = id;
    while (current) { if (seen.has(current)) { issue(`cellular.compartments.${id}`, "containment contains a cycle"); break; } seen.add(current); current = compartments.get(current)?.parentCompartmentId; }
  });

  const relationIds = new Set<string>();
  (Array.isArray(extension.compartmentRelations) ? extension.compartmentRelations : []).forEach((entry, index) => {
    const path = `cellular.compartmentRelations[${index}]`;
    if (!checkKeys(entry, path, ["relationId", "kind", "subjectId", "objectId", "sourceIds"], issue)) return;
    const item = entry as UnknownRecord;
    if (!finiteId(item.relationId)) issue(`${path}.relationId`, "must be a stable ID");
    if (relationIds.has(String(item.relationId))) issue(`${path}.relationId`, "must be unique"); relationIds.add(String(item.relationId));
    if (!compartmentRelationKinds.includes(item.kind as CompartmentRelationKind)) issue(`${path}.kind`, "is invalid");
    const subject = compartments.get(String(item.subjectId)); const object = compartments.get(String(item.objectId));
    if (!subject) issue(`${path}.subjectId`, "references a missing compartment");
    if (!object) issue(`${path}.objectId`, "references a missing compartment");
    if (subject && object && !relationAllowed(item.kind as CompartmentRelationKind, subject, object)) issue(`${path}`, "is incompatible with the referenced compartment types");
    validateSources(item.sourceIds, `${path}.sourceIds`, sourceSet, issue);
  });

  const localizations: LocalizationV1[] = [];
  (Array.isArray(extension.localizations) ? extension.localizations : []).forEach((entry, index) => { const item = validateLocalization(entry, `cellular.localizations[${index}]`, actorIds, compartments, membraneIds, sourceSet, issue); if (item) localizations.push(item); });
  const localizationKeys = new Set<string>();
  localizations.forEach((item, index) => { const key = `${item.actorId}:${item.compartmentId}:${item.localizationKind}:${item.membraneId ?? ""}:${item.membraneSide ?? ""}`; if (localizationKeys.has(key)) issue(`cellular.localizations[${index}]`, "duplicates a localization"); localizationKeys.add(key); });

  const timelineEventIds = new Set((timeline?.events ?? []).map((event) => event.eventId));
  const changeIds = new Set<string>();
  (Array.isArray(extension.localizationChanges) ? extension.localizationChanges : []).forEach((entry, index) => {
    const path = `cellular.localizationChanges[${index}]`;
    if (!checkKeys(entry, path, ["changeId", "actorId", "from", "to", "transportKind", "membraneRelationId", "timelineEventId", "sourceIds", "requiredChangeIds"], issue)) return;
    const item = entry as UnknownRecord;
    if (!finiteId(item.changeId)) issue(`${path}.changeId`, "must be a stable ID");
    if (changeIds.has(String(item.changeId))) issue(`${path}.changeId`, "must be unique"); changeIds.add(String(item.changeId));
    if (typeof item.actorId !== "string" || !actorIds.has(item.actorId)) issue(`${path}.actorId`, "must reference an actor");
    const from = validateLocalization(item.from, `${path}.from`, actorIds, compartments, membraneIds, sourceSet, issue);
    const to = validateLocalization(item.to, `${path}.to`, actorIds, compartments, membraneIds, sourceSet, issue);
    if (from && from.actorId !== item.actorId) issue(`${path}.from.actorId`, "must match change actorId");
    if (to && to.actorId !== item.actorId) issue(`${path}.to.actorId`, "must match change actorId");
    if (from && to && from.compartmentId === to.compartmentId && from.localizationKind === to.localizationKind && from.membraneSide === to.membraneSide) issue(`${path}`, "must change localization state");
    if (!transportKinds.includes(item.transportKind as TransportKind)) issue(`${path}.transportKind`, "is invalid");
    if (item.membraneRelationId !== undefined && (!finiteId(item.membraneRelationId) || !relationIds.has(item.membraneRelationId))) issue(`${path}.membraneRelationId`, "must reference a compartment relation");
    if (item.timelineEventId !== undefined && (!finiteId(item.timelineEventId) || (timeline && !timelineEventIds.has(item.timelineEventId)))) issue(`${path}.timelineEventId`, "must reference a known timeline event when a timeline is supplied");
    validateSources(item.sourceIds, `${path}.sourceIds`, sourceSet, issue);
    if (item.requiredChangeIds !== undefined) checkIdArray(item.requiredChangeIds, `${path}.requiredChangeIds`, issue);
  });

  const spatialIds = new Set<string>();
  (extension.spatialRelations ?? []).forEach((entry, index) => {
    const path = `cellular.spatialRelations[${index}]`;
    if (!checkKeys(entry, path, ["relationId", "kind", "subjectActorId", "objectId", "qualitative", "sourceIds"], issue)) return;
    const item = entry as UnknownRecord;
    if (!finiteId(item.relationId) || spatialIds.has(String(item.relationId))) issue(`${path}.relationId`, "must be a unique stable ID"); spatialIds.add(String(item.relationId));
    if (!cellularSpatialRelationKinds.includes(item.kind as CellularSpatialRelationKind)) issue(`${path}.kind`, "is invalid");
    if (typeof item.subjectActorId !== "string" || !actorIds.has(item.subjectActorId)) issue(`${path}.subjectActorId`, "must reference an actor");
    if (typeof item.objectId !== "string" || (!actorIds.has(item.objectId) && !compartments.has(item.objectId))) issue(`${path}.objectId`, "must reference an actor or compartment");
    if (item.qualitative !== undefined && item.qualitative !== "SCHEMATIC" && item.qualitative !== "GROUNDED") issue(`${path}.qualitative`, "is invalid");
    validateSources(item.sourceIds, `${path}.sourceIds`, sourceSet, issue);
  });

  (extension.localities ?? []).forEach((entry, index) => {
    const path = `cellular.localities[${index}]`;
    if (!checkKeys(entry, path, ["subjectKind", "subjectId", "compartmentId", "sourceIds"], issue)) return;
    const item = entry as UnknownRecord;
    if (item.subjectKind !== "interaction" && item.subjectKind !== "timelineEvent") issue(`${path}.subjectKind`, "is invalid");
    if (!finiteId(item.subjectId)) issue(`${path}.subjectId`, "must be a stable ID");
    if (!compartments.has(String(item.compartmentId))) issue(`${path}.compartmentId`, "must reference a compartment");
    if (item.subjectKind === "interaction" && !interactionIds.includes(String(item.subjectId))) issue(`${path}.subjectId`, "must reference a known interaction");
    if (item.subjectKind === "timelineEvent" && timeline && !timeline.events.some((event) => event.eventId === item.subjectId)) issue(`${path}.subjectId`, "must reference a known timeline event");
    validateSources(item.sourceIds, `${path}.sourceIds`, sourceSet, issue);
  });

  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function validateCellularScientificScene(value: CellularScientificSceneV1, timeline?: ScientificTimeline): CellularValidationResult {
  const sceneResult = validateScientificSceneSpec(value.scene);
  const issues: CellularValidationIssue[] = sceneResult.valid ? [] : sceneResult.issues.map((entry) => ({ path: entry.path, message: entry.message }));
  const cellularResult = validateCellularScientificExtension(value.cellular, { actors: value.scene.actors, groups: value.scene.groups }, value.scene.fidelityProvenance.sources.map((source) => source.sourceId), timeline, value.scene.topology.interactions.map((interaction) => interaction.interactionId));
  if (!cellularResult.valid) issues.push(...cellularResult.issues);
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

const stableJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableJson);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
  return value;
};
const sortBy = <T extends Record<string, unknown>>(values: readonly T[], key: keyof T) => [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));

/** Canonicalizes semantically unordered cellular arrays before JSON serialization. */
export function canonicalizeCellularExtension(extension: CellularScientificExtensionV1): CellularScientificExtensionV1 {
  return {
    ...extension,
    compartments: sortBy(extension.compartments as Array<Record<string, unknown>>, "compartmentId") as unknown as CompartmentV1[],
    compartmentRelations: sortBy(extension.compartmentRelations as Array<Record<string, unknown>>, "relationId") as unknown as CompartmentRelationV1[],
    localizations: [...extension.localizations].sort((a, b) => `${a.actorId}:${a.compartmentId}:${a.localizationKind}`.localeCompare(`${b.actorId}:${b.compartmentId}:${b.localizationKind}`)),
    localizationChanges: sortBy(extension.localizationChanges as Array<Record<string, unknown>>, "changeId") as unknown as LocalizationChangeV1[],
    spatialRelations: extension.spatialRelations ? sortBy(extension.spatialRelations as Array<Record<string, unknown>>, "relationId") as unknown as CellularSpatialRelationV1[] : undefined,
    localities: extension.localities ? [...extension.localities].sort((a, b) => `${a.subjectKind}:${a.subjectId}`.localeCompare(`${b.subjectKind}:${b.subjectId}`)) : undefined,
  };
}

export function serializeCellularScientificScene(value: CellularScientificSceneV1, timeline?: ScientificTimeline): string {
  const result = validateCellularScientificScene(value, timeline);
  if (!result.valid) throw new Error(`Cannot serialize invalid cellular scene: ${result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; ")}`);
  return JSON.stringify(stableJson({ scene: value.scene, cellular: canonicalizeCellularExtension(value.cellular) }));
}

export function localizationStateAtChange(change: LocalizationChangeV1): { actorId: ScientificActorId; from: LocalizationV1; to: LocalizationV1; transportKind: TransportKind } {
  return { actorId: change.actorId, from: change.from, to: change.to, transportKind: change.transportKind };
}
