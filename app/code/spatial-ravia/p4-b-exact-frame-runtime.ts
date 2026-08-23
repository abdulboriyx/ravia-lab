/** P4-B: pure exact-frame state derivation and a small owner application seam. */

import type { PresentationMechanismSnapshotV1, PresentationOwnerId, PresentationOwnerInput } from "./p3-e-presentation-synchronization.ts";
import { createProductionTemporalCursor, evaluateProductionTemporalFrame, seekProductionTemporalCursor, type ProductionTemporalMigrationV1 } from "./p3-g-production-temporal-migration.ts";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production.ts";
import type { SecretoryProductionProjectionV1 } from "./secretory-production.ts";
import type { MembraneProteinProductionProjectionV1 } from "./membrane-protein-production.ts";
import type { IntracellularTransportProductionProjectionV1 } from "./intracellular-transport-production.ts";
import type { CellularSignalingProductionProjectionV1 } from "./cellular-signaling-production.ts";

export type ExactFrameFailureCode =
  | "EXACT_FRAME_REQUEST_INVALID"
  | "OWNER_UNAVAILABLE"
  | "SCIENTIFIC_STATE_UNAVAILABLE"
  | "FRAGMENTATION_UNGROUNDED"
  | "RENDER_STATE_INCOMPLETE"
  | "UNSUPPORTED_EXACT_FRAME_OWNER";

export type RenderConfigV1 = Readonly<{
  schemaVersion: "1";
  width: number;
  height: number;
  pixelRatio: number;
  background: Readonly<{ mode: "opaque" | "transparent"; color?: string }>;
  runtimeMode: "EXACT_FRAME";
  ownerId: PresentationOwnerId;
}>;

export type ExactFrameRequestV1 = Readonly<{
  schemaVersion: "1";
  migration: ProductionTemporalMigrationV1;
  frameIndex?: number;
  timeSeconds?: number;
  fps?: number;
  renderConfig: RenderConfigV1;
}>;

export type ExactFrameTraceV1 = Readonly<{
  sourceInteractionIds: readonly string[];
  sourceTopologyChangeIds: readonly string[];
  sourceContinuityIds: readonly string[];
  sourceActorIds: readonly string[];
  timelineId: string;
}>;

export type AppliedOwnerStateV1 =
  | Readonly<{
      ownerId: "DnaBasePairInteractionPresentation";
      actorIds: readonly [string, string];
      interactionId: string;
      interactionActive: boolean;
      bondVisibility: number;
      emphasis: boolean;
    }>
  | Readonly<{
      ownerId: "DnaStrandSeparationPresentation";
      strandActorIds: readonly [string, string];
      state: "paired" | "opening" | "separated";
      openingProgress: number;
      bubbleProgress: number;
      separationAmount: number;
      separationApplied: boolean;
      sourceInteractionId: string;
      sourceTopologyChangeId: string;
    }>
  | Readonly<{
      ownerId: "RnaSecondaryStructurePresentation";
      rnaActorId: string;
      stemGroupId: string;
      paired: boolean;
      morphProgress: number;
      sourceInteractionIds: readonly string[];
    }>
  | Readonly<{
      ownerId: "RnaDegradationPresentation";
      rnaActorId: string;
      retainedActorId: string;
      state: "intact" | "degrading" | "degraded";
      retainedFragmentVisibility: number;
      sourceTopologyChangeId: string;
      sourceContinuityId: string;
    }>;

export type AppliedRenderStateV1 = Readonly<{
  schemaVersion: "1";
  ownerId: PresentationOwnerId;
  timeSeconds: number;
  renderConfig: RenderConfigV1;
  presentation: PresentationMechanismSnapshotV1;
  ownerState: AppliedOwnerStateV1;
  actorVisibility: readonly Readonly<{ actorId: string; visible: boolean }>[];
  labels: PresentationMechanismSnapshotV1["labels"];
  cameraCue: PresentationMechanismSnapshotV1["cameraCue"];
  trace: ExactFrameTraceV1;
}>;

export type ExactFrameFailure = Readonly<{ ok: false; code: ExactFrameFailureCode; reasons: readonly string[] }>;
export type ExactFrameEvaluationResult = Readonly<{ ok: true; request: ExactFrameRequestV1; timeSeconds: number; appliedState: AppliedRenderStateV1 } | ExactFrameFailure>;

type OwnerAdapter = (frame: Extract<ReturnType<typeof evaluateProductionTemporalFrame>, { ok: true }>, renderConfig: RenderConfigV1) => AppliedOwnerStateV1 | ExactFrameFailure;

const failure = (code: ExactFrameFailureCode, ...reasons: string[]): ExactFrameFailure => ({ ok: false, code, reasons });
const finitePositive = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0;
const finiteNonNegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;

function resolveTime(request: ExactFrameRequestV1): { ok: true; timeSeconds: number } | ExactFrameFailure {
  const hasFrame = request.frameIndex !== undefined;
  const hasTime = request.timeSeconds !== undefined;
  if (hasFrame === hasTime) return failure("EXACT_FRAME_REQUEST_INVALID", "provide exactly one of frameIndex or timeSeconds");
  if (hasFrame) {
    if (!Number.isInteger(request.frameIndex) || request.frameIndex! < 0 || !Number.isInteger(request.fps) || request.fps! <= 0) return failure("EXACT_FRAME_REQUEST_INVALID", "frameIndex requires a non-negative integer fps and frameIndex");
    return { ok: true, timeSeconds: request.frameIndex! / request.fps! };
  }
  if (!finiteNonNegative(request.timeSeconds) || request.fps !== undefined) return failure("EXACT_FRAME_REQUEST_INVALID", "timeSeconds must be finite and non-negative without fps");
  return { ok: true, timeSeconds: request.timeSeconds! };
}

function validateRequest(request: ExactFrameRequestV1): ExactFrameFailure | undefined {
  if (request.schemaVersion !== "1") return failure("EXACT_FRAME_REQUEST_INVALID", "unsupported exact-frame request version");
  if (request.renderConfig.schemaVersion !== "1" || !Number.isInteger(request.renderConfig.width) || request.renderConfig.width <= 0 || !Number.isInteger(request.renderConfig.height) || request.renderConfig.height <= 0 || !finitePositive(request.renderConfig.pixelRatio)) return failure("EXACT_FRAME_REQUEST_INVALID", "renderConfig requires positive width, height, and pixelRatio");
  if (request.renderConfig.ownerId !== request.migration.ownerId) return failure("EXACT_FRAME_REQUEST_INVALID", "renderConfig ownerId must match the production migration owner");
  if (request.renderConfig.background.mode === "transparent" && request.renderConfig.background.color !== undefined) return failure("EXACT_FRAME_REQUEST_INVALID", "transparent backgrounds cannot include an opaque color");
  if (request.renderConfig.background.mode === "opaque" && request.renderConfig.background.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(request.renderConfig.background.color)) return failure("EXACT_FRAME_REQUEST_INVALID", "opaque background color must be #RRGGBB");
  return undefined;
}

function pairingAdapter(frame: Extract<ReturnType<typeof evaluateProductionTemporalFrame>, { ok: true }>, renderConfig: RenderConfigV1): AppliedOwnerStateV1 | ExactFrameFailure {
  if (frame.ownerInput.ownerId !== "DnaBasePairInteractionPresentation") return failure("OWNER_UNAVAILABLE", "DNA pairing owner input is unavailable");
  return { ownerId: frame.ownerInput.ownerId, actorIds: frame.ownerInput.actorIds, interactionId: frame.ownerInput.interactionId, interactionActive: frame.ownerInput.interactionActive, bondVisibility: frame.ownerInput.bondVisibility, emphasis: frame.presentation.visual.highlight };
}

function separationAdapter(frame: Extract<ReturnType<typeof evaluateProductionTemporalFrame>, { ok: true }>, renderConfig: RenderConfigV1): AppliedOwnerStateV1 | ExactFrameFailure {
  if (frame.ownerInput.ownerId !== "DnaStrandSeparationPresentation") return failure("OWNER_UNAVAILABLE", "DNA separation owner input is unavailable");
  return { ownerId: frame.ownerInput.ownerId, strandActorIds: frame.ownerInput.strandActorIds, state: frame.ownerInput.state, openingProgress: frame.ownerInput.openingProgress, bubbleProgress: frame.ownerInput.bubbleProgress, separationAmount: frame.presentation.visual.separationAmount, separationApplied: frame.ownerInput.separationApplied, sourceInteractionId: frame.ownerInput.sourceInteractionId, sourceTopologyChangeId: frame.ownerInput.sourceTopologyChangeId };
}

function hairpinAdapter(frame: Extract<ReturnType<typeof evaluateProductionTemporalFrame>, { ok: true }>, renderConfig: RenderConfigV1): AppliedOwnerStateV1 | ExactFrameFailure {
  if (frame.ownerInput.ownerId !== "RnaSecondaryStructurePresentation") return failure("OWNER_UNAVAILABLE", "RNA hairpin owner input is unavailable");
  return { ownerId: frame.ownerInput.ownerId, rnaActorId: frame.ownerInput.rnaActorId, stemGroupId: frame.ownerInput.stemGroupId, paired: frame.ownerInput.paired, morphProgress: frame.ownerInput.morphProgress, sourceInteractionIds: frame.ownerInput.sourceInteractionIds };
}

function exonucleaseAdapter(frame: Extract<ReturnType<typeof evaluateProductionTemporalFrame>, { ok: true }>, renderConfig: RenderConfigV1): AppliedOwnerStateV1 | ExactFrameFailure {
  if (frame.ownerInput.ownerId !== "RnaDegradationPresentation") return failure("OWNER_UNAVAILABLE", "RNA exonuclease owner input is unavailable");
  return { ownerId: frame.ownerInput.ownerId, rnaActorId: frame.ownerInput.rnaActorId, retainedActorId: frame.ownerInput.retainedActorId, state: frame.ownerInput.state, retainedFragmentVisibility: frame.ownerInput.retainedFragmentVisibility, sourceTopologyChangeId: frame.ownerInput.sourceTopologyChangeId, sourceContinuityId: frame.ownerInput.sourceContinuityId };
}

export const exactFrameOwnerRegistry: Readonly<Record<PresentationOwnerId, OwnerAdapter>> = {
  DnaBasePairInteractionPresentation: pairingAdapter,
  DnaStrandSeparationPresentation: separationAdapter,
  RnaSecondaryStructurePresentation: hairpinAdapter,
  RnaDegradationPresentation: exonucleaseAdapter,
};

function ownerAdapter(ownerId: PresentationOwnerId): OwnerAdapter | undefined {
  return exactFrameOwnerRegistry[ownerId];
}

export function deriveRenderState(request: ExactFrameRequestV1, timeSeconds: number): ExactFrameEvaluationResult {
  const invalid = validateRequest(request);
  if (invalid) return invalid;
  if (!finiteNonNegative(timeSeconds) || timeSeconds > request.migration.timeline.clock.duration) return failure("EXACT_FRAME_REQUEST_INVALID", "exact time is outside the timeline duration");
  const adapter = ownerAdapter(request.migration.ownerId);
  if (!adapter) return failure("UNSUPPORTED_EXACT_FRAME_OWNER", `no exact-frame adapter is registered for ${request.migration.ownerId}`);
  const cursor = seekProductionTemporalCursor(createProductionTemporalCursor(request.migration), timeSeconds, request.migration.timeline.clock.duration);
  const frame = evaluateProductionTemporalFrame(request.migration, cursor);
  if (!frame.ok) {
    if (frame.reasons.includes("FRAGMENTATION_UNGROUNDED")) return failure("FRAGMENTATION_UNGROUNDED", ...frame.reasons);
    if (frame.code === "PRODUCTION_TEMPORAL_PRESENTATION_FAILURE") return failure("SCIENTIFIC_STATE_UNAVAILABLE", ...frame.reasons);
    return failure("SCIENTIFIC_STATE_UNAVAILABLE", ...frame.reasons);
  }
  const ownerState = adapter(frame, request.renderConfig);
  if ("code" in ownerState) return ownerState;
  const appliedState: AppliedRenderStateV1 = {
    schemaVersion: "1",
    ownerId: request.migration.ownerId,
    timeSeconds,
    renderConfig: request.renderConfig,
    presentation: frame.presentation,
    ownerState,
    actorVisibility: frame.presentation.actors.map((actor) => ({ actorId: actor.actorId, visible: actor.visible })),
    labels: frame.presentation.labels,
    cameraCue: frame.presentation.cameraCue,
    trace: { sourceInteractionIds: frame.topology.evidence.flatMap((item) => item.interactionIds), sourceTopologyChangeIds: frame.topology.activeTopologyChangeIds, sourceContinuityIds: frame.topology.activeContinuityIds, sourceActorIds: frame.presentation.trace.sourceActorIds.map(String), timelineId: frame.mechanism.timelineId },
  };
  return { ok: true, request, timeSeconds, appliedState };
}

export function evaluateExactFrame(request: ExactFrameRequestV1): ExactFrameEvaluationResult {
  const invalid = validateRequest(request);
  if (invalid) return invalid;
  const time = resolveTime(request);
  if (!time.ok) return time;
  return deriveRenderState(request, time.timeSeconds);
}

export type ExactFrameOwnerTarget = Readonly<{ ownerId: PresentationOwnerId; setExactFrameState: (state: AppliedRenderStateV1) => void }>;
export type ExactFrameApplicationResult = Readonly<{ ok: true; state: AppliedRenderStateV1 } | ExactFrameFailure>;

/** Runtime bridge: React/R3F owners receive a complete state; they do not evaluate P3. */
export function applyRenderState(target: ExactFrameOwnerTarget, state: AppliedRenderStateV1): ExactFrameApplicationResult {
  if (target.ownerId !== state.ownerId) return failure("OWNER_UNAVAILABLE", "owner target does not match applied render state");
  if (!state.renderConfig.width || !state.renderConfig.height || !state.renderConfig.pixelRatio) return failure("RENDER_STATE_INCOMPLETE", "fixed render dimensions are required");
  target.setExactFrameState(state);
  return { ok: true, state };
}

export function serializeExactFrameRequest(request: ExactFrameRequestV1): string { return JSON.stringify(request); }
export function serializeAppliedRenderState(state: AppliedRenderStateV1): string { return JSON.stringify(state); }

/** Additive P4 seam for the D-C production owner. The projection is already
 * evaluated by the canonical D-C timeline; this function only applies the
 * fixed render configuration and deterministic camera cue. */
export type CellularGeneExpressionAppliedRenderStateV1 = Readonly<{
  schemaVersion: "1";
  ownerId: "GENE_EXPRESSION_CELLULAR_V1";
  timeSeconds: number;
  renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"]; runtimeMode: "EXACT_FRAME" }>;
  projection: GeneExpressionProductionProjectionV1;
  cameraCue: Readonly<{ kind: "overview" | "focusNucleus" | "focusTranscription" | "focusProcessing" | "focusExport" | "focusTranslation"; actorIds: readonly string[] }>;
}>;

export function applyCellularGeneExpressionExactFrame(
  projection: GeneExpressionProductionProjectionV1,
  renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"] }>,
): Readonly<{ ok: true; state: CellularGeneExpressionAppliedRenderStateV1 } | ExactFrameFailure> {
  if (projection.ownerId !== "GENE_EXPRESSION_CELLULAR_V1") return failure("OWNER_UNAVAILABLE", "D-C production owner is unavailable");
  if (!Number.isInteger(renderConfig.width) || renderConfig.width <= 0 || !Number.isInteger(renderConfig.height) || renderConfig.height <= 0 || !finitePositive(renderConfig.pixelRatio)) return failure("RENDER_STATE_INCOMPLETE", "fixed render dimensions are required");
  const kind = projection.focus === "NUCLEAR" ? "focusNucleus" : projection.focus === "MOLECULAR_TRANSCRIPTION" ? "focusTranscription" : projection.focus === "RNA_PROCESSING" ? "focusProcessing" : projection.focus === "CELLULAR_EXPORT" ? "focusExport" : projection.focus === "MOLECULAR_TRANSLATION" ? "focusTranslation" : "overview";
  const actorIds = [projection.dna.templateStrandId, projection.dna.nonTemplateStrandId, projection.transcription.rnaActorId, projection.translation.peptideId];
  return { ok: true, state: { schemaVersion: "1", ownerId: "GENE_EXPRESSION_CELLULAR_V1", timeSeconds: projection.timeSeconds, renderConfig: { ...renderConfig, runtimeMode: "EXACT_FRAME" }, projection, cameraCue: { kind, actorIds } } };
}

export type CellularSecretoryAppliedRenderStateV1 = Readonly<{
  schemaVersion: "1";
  ownerId: "SECRETORY_PATHWAY_CELLULAR_V1";
  timeSeconds: number;
  renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"]; runtimeMode: "EXACT_FRAME" }>;
  projection: SecretoryProductionProjectionV1;
  cameraCue: Readonly<{ kind: "overview" | "focusErTargeting" | "focusErLumen" | "focusGolgi" | "focusVesicle" | "focusExocytosis"; actorIds: readonly string[] }>;
}>;

/** Additive P4 application seam. It copies D-D projection state and adds only deterministic presentation focus. */
export function applyCellularSecretoryExactFrame(
  projection: SecretoryProductionProjectionV1,
  renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"] }>,
): Readonly<{ ok: true; state: CellularSecretoryAppliedRenderStateV1 } | ExactFrameFailure> {
  if (projection.ownerId !== "SECRETORY_PATHWAY_CELLULAR_V1") return failure("OWNER_UNAVAILABLE", "D-D production owner is unavailable");
  if (!Number.isInteger(renderConfig.width) || renderConfig.width <= 0 || !Number.isInteger(renderConfig.height) || renderConfig.height <= 0 || !finitePositive(renderConfig.pixelRatio)) return failure("RENDER_STATE_INCOMPLETE", "fixed render dimensions are required");
  const kind = projection.focus === "ER_TARGETING" ? "focusErTargeting" : projection.focus === "ER_LUMEN" || projection.focus === "ER_QUALITY" ? "focusErLumen" : projection.focus === "GOLGI" ? "focusGolgi" : projection.focus === "SECRETORY_VESICLE" ? "focusVesicle" : projection.focus === "EXOCYTOSIS" ? "focusExocytosis" : "overview";
  return { ok: true, state: { schemaVersion: "1", ownerId: "SECRETORY_PATHWAY_CELLULAR_V1", timeSeconds: projection.timeSeconds, renderConfig: { ...renderConfig, runtimeMode: "EXACT_FRAME" }, projection, cameraCue: { kind, actorIds: [projection.protein.actorId, ...(projection.vesicle.id ? [projection.vesicle.id] : [])] } } };
}

export type CellularMembraneProteinAppliedRenderStateV1 = Readonly<{ schemaVersion: "1"; ownerId: "SECRETORY_PATHWAY_CELLULAR_V1"; timeSeconds: number; renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"]; runtimeMode: "EXACT_FRAME" }>; projection: MembraneProteinProductionProjectionV1; cameraCue: Readonly<{ kind: "focusErInsertion" | "focusTopology" | "focusQuality" | "focusGolgi" | "focusPlasmaMembrane"; actorIds: readonly string[] }> }>;
export function applyCellularMembraneProteinExactFrame(projection: MembraneProteinProductionProjectionV1, renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"] }>): Readonly<{ ok: true; state: CellularMembraneProteinAppliedRenderStateV1 } | ExactFrameFailure> {
  if (projection.ownerId !== "SECRETORY_PATHWAY_CELLULAR_V1") return failure("OWNER_UNAVAILABLE", "D-E production owner is unavailable");
  if (!Number.isInteger(renderConfig.width) || renderConfig.width <= 0 || !Number.isInteger(renderConfig.height) || renderConfig.height <= 0 || !finitePositive(renderConfig.pixelRatio)) return failure("RENDER_STATE_INCOMPLETE", "fixed render dimensions are required");
  const kind = projection.focus === "ER_INSERTION" ? "focusErInsertion" : projection.focus === "TOPOLOGY" ? "focusTopology" : projection.focus === "ER_QUALITY" ? "focusQuality" : projection.focus === "GOLGI" ? "focusGolgi" : "focusPlasmaMembrane";
  return { ok: true, state: { schemaVersion: "1", ownerId: "SECRETORY_PATHWAY_CELLULAR_V1", timeSeconds: projection.timeSeconds, renderConfig: { ...renderConfig, runtimeMode: "EXACT_FRAME" }, projection, cameraCue: { kind, actorIds: [projection.proteinId] } } };
}

export type CellularIntracellularTransportAppliedRenderStateV1 = Readonly<{ schemaVersion: "1"; ownerId: "INTRACELLULAR_TRANSPORT_CELLULAR_V1"; timeSeconds: number; renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"]; runtimeMode: "EXACT_FRAME" }>; projection: IntracellularTransportProductionProjectionV1; cameraCue: Readonly<{ kind: "overview" | "focusTransport" | "focusEndocytosis" | "focusEndosome"; actorIds: readonly string[] }> }>;
export function applyCellularIntracellularTransportExactFrame(projection: IntracellularTransportProductionProjectionV1, renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"] }>): Readonly<{ ok: true; state: CellularIntracellularTransportAppliedRenderStateV1 } | ExactFrameFailure> {
  if (projection.ownerId !== "INTRACELLULAR_TRANSPORT_CELLULAR_V1") return failure("OWNER_UNAVAILABLE", "D-F production owner is unavailable");
  if (!Number.isInteger(renderConfig.width) || renderConfig.width <= 0 || !Number.isInteger(renderConfig.height) || renderConfig.height <= 0 || !finitePositive(renderConfig.pixelRatio)) return failure("RENDER_STATE_INCOMPLETE", "fixed render dimensions are required");
  const kind = projection.focus === "ENDOSOME" ? "focusEndosome" : projection.focus === "ENDOCYTOSIS" ? "focusEndocytosis" : projection.focus === "TRANSPORT" ? "focusTransport" : "overview";
  return { ok: true, state: { schemaVersion: "1", ownerId: "INTRACELLULAR_TRANSPORT_CELLULAR_V1", timeSeconds: projection.timeSeconds, renderConfig: { ...renderConfig, runtimeMode: "EXACT_FRAME" }, projection, cameraCue: { kind, actorIds: [projection.endocytosis.receptorId, ...(projection.cargo.id ? [projection.cargo.id] : []), ...(projection.track.id ? [projection.track.id] : [])] } } };
}

export type CellularSignalingAppliedRenderStateV1 = Readonly<{ schemaVersion: "1"; ownerId: "CELL_SIGNALING_RTK_MAPK_V1"; timeSeconds: number; renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"]; runtimeMode: "EXACT_FRAME" }>; projection: CellularSignalingProductionProjectionV1; cameraCue: Readonly<{ kind: "focusExtracellularBinding" | "focusMembraneReceptor" | "focusCytosolicCascade" | "focusNuclearResponse"; actorIds: readonly string[] }> }>;
export function applyCellularSignalingExactFrame(projection: CellularSignalingProductionProjectionV1, renderConfig: Readonly<{ width: number; height: number; pixelRatio: number; background: RenderConfigV1["background"] }>): Readonly<{ ok: true; state: CellularSignalingAppliedRenderStateV1 } | ExactFrameFailure> {
  if (projection.ownerId !== "CELL_SIGNALING_RTK_MAPK_V1") return failure("OWNER_UNAVAILABLE", "D-G production owner is unavailable");
  if (!Number.isInteger(renderConfig.width) || renderConfig.width <= 0 || !Number.isInteger(renderConfig.height) || renderConfig.height <= 0 || !finitePositive(renderConfig.pixelRatio)) return failure("RENDER_STATE_INCOMPLETE", "fixed render dimensions are required");
  const kind = projection.focus === "EXTRACELLULAR_BINDING" ? "focusExtracellularBinding" : projection.focus === "MEMBRANE_RECEPTOR" ? "focusMembraneReceptor" : projection.focus === "CYTOSOLIC_CASCADE" ? "focusCytosolicCascade" : "focusNuclearResponse";
  return { ok: true, state: { schemaVersion: "1", ownerId: "CELL_SIGNALING_RTK_MAPK_V1", timeSeconds: projection.timeSeconds, renderConfig: { ...renderConfig, runtimeMode: "EXACT_FRAME" }, projection, cameraCue: { kind, actorIds: [projection.ligand.id, projection.receptor.id, projection.cascade.erk, projection.nuclearResponse.targetGeneId] } } };
}
