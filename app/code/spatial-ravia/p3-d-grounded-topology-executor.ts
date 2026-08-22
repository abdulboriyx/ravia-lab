/** P3-D: pure execution of topology changes already grounded by P2-E. */

import { validateScientificSceneSpec, type ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificActorId } from "./scientific-actor.ts";
import type { ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";
import type { MechanismSnapshotV1 } from "./p3-b-mechanism-state-kernel.ts";
import type { DeterministicTemporalProgramV1 } from "./p3-c-deterministic-temporal-semantics.ts";
import type { ScientificInteraction, TopologyChange } from "./scientific-topology.ts";

export const topologyExecutionFailureCodes = [
  "TOPOLOGY_REFERENCE_MISSING",
  "TOPOLOGY_EVIDENCE_INVALID",
  "TOPOLOGY_EXECUTION_UNSUPPORTED",
  "TOPOLOGY_CONFLICT",
  "FRAGMENTATION_UNGROUNDED",
] as const;
export type TopologyExecutionFailureCode = (typeof topologyExecutionFailureCodes)[number];

export type MechanismTopologySnapshotV1 = Readonly<{
  schemaVersion: "1";
  timelineId: string;
  timeSeconds: number;
  activeInteractionIds: readonly string[];
  inactiveInteractionIds: readonly string[];
  activeContinuityIds: readonly string[];
  brokenContinuityIds: readonly string[];
  activeTopologyChangeIds: readonly string[];
  actorPresence: readonly Readonly<{ actorId: ScientificActorId; present: boolean }>[];
  fragmentation: readonly Readonly<{ changeId: string; actorIds: readonly ScientificActorId[]; orderedFragmentActorIds: readonly ScientificActorId[] }>[];
  separationChangeIds: readonly string[];
  evidence: readonly Readonly<{
    eventId?: string;
    changeId?: string;
    interactionIds: readonly string[];
    continuityIds: readonly string[];
    attachmentIds: readonly string[];
    sourceIds: readonly string[];
  }>[];
  fidelityReferences: readonly Readonly<{ changeId?: string; fidelity: ScientificFidelityTier; sourceId: string }>[];
}>;

export type TopologyExecutionFailure = Readonly<{ ok: false; code: TopologyExecutionFailureCode; reasons: readonly string[] }>;
export type TopologyExecutionResult = Readonly<{ ok: true; snapshot: MechanismTopologySnapshotV1 } | TopologyExecutionFailure>;

export type MechanismSnapshotWithTopologyV1 = MechanismSnapshotV1 & Readonly<{ topologyState: MechanismTopologySnapshotV1 }>;

const fail = (code: TopologyExecutionFailureCode, ...reasons: string[]): TopologyExecutionFailure => ({ ok: false, code, reasons });

function actorSet(scene: ScientificSceneSpec) { return new Set(scene.actors.map((actor) => actor.actorId)); }
function interactionMap(scene: ScientificSceneSpec) { return new Map(scene.topology.interactions.map((interaction) => [interaction.interactionId, interaction])); }
function continuityMap(scene: ScientificSceneSpec) { return new Map((scene.topology.continuities ?? []).map((continuity) => [continuity.continuityId, continuity])); }
function changeMap(scene: ScientificSceneSpec) { return new Map((scene.topology.changes ?? []).map((change) => [change.changeId, change])); }

function attachmentEvidence(scene: ScientificSceneSpec, change: TopologyChange | undefined, interactionIds: readonly string[]): { attachmentIds: string[]; sourceIds: string[] } {
  const actorIds = new Set(change?.actorIds ?? []);
  const interactions = new Set(interactionIds);
  const attachments = scene.fidelityProvenance.attachments.filter((attachment) => {
    if (attachment.target.kind === "actor") return actorIds.has(attachment.target.actorId);
    if (attachment.target.kind === "interaction") return interactions.has(attachment.target.interactionId);
    return false;
  });
  return { attachmentIds: attachments.map((attachment) => attachment.attachmentId).sort(), sourceIds: [...new Set(attachments.map((attachment) => String(attachment.provenanceSourceId)))].sort() };
}

function validateEventReferences(program: DeterministicTemporalProgramV1): TopologyExecutionFailure | null {
  const scene = program.scientificScene;
  const actors = actorSet(scene);
  const interactions = interactionMap(scene);
  const changes = changeMap(scene);
  for (const event of program.timeline.events) {
    if (!(["bondFormed", "bondBroken", "topologyChanged", "polymerShortened", "polymerGrew", "actorCreated", "actorRemoved"] as string[]).includes(event.kind)) continue;
    if (event.actorIds.some((actorId) => !actors.has(actorId))) return fail("TOPOLOGY_REFERENCE_MISSING", `event ${event.eventId} references a missing actor`);
    if (["bondFormed", "bondBroken"].includes(event.kind) && (!event.interactionId || !interactions.has(event.interactionId))) return fail("TOPOLOGY_REFERENCE_MISSING", `event ${event.eventId} requires a grounded interaction`);
    if (["topologyChanged", "polymerShortened", "polymerGrew", "actorCreated", "actorRemoved"].includes(event.kind) && (!event.topologyChangeId || !changes.has(event.topologyChangeId))) return fail("TOPOLOGY_REFERENCE_MISSING", `event ${event.eventId} requires a grounded topology change`);
    if (event.topologyChangeId) {
      const change = changes.get(event.topologyChangeId)!;
      const relevantInteractionIds = change.interactionIds ?? (event.interactionId ? [event.interactionId] : []);
      const evidence = attachmentEvidence(scene, change, relevantInteractionIds);
      if (evidence.attachmentIds.length === 0) return fail("TOPOLOGY_EVIDENCE_INVALID", `event ${event.eventId} has no fidelity/evidence attachment for its grounded topology`);
    }
  }
  return null;
}

function validateTopologyConflicts(program: DeterministicTemporalProgramV1): TopologyExecutionFailure | null {
  const events = program.timeline.events;
  const changes = changeMap(program.scientificScene);
  const affected = (event: typeof events[number]) => event.interactionId ? [event.interactionId] : (event.topologyChangeId ? changes.get(event.topologyChangeId)?.interactionIds ?? [] : []);
  const operation = (event: typeof events[number]) => event.kind === "bondFormed" || event.kind === "bondBroken" ? event.kind === "bondFormed" ? "form" : "break" : event.topologyChangeId && ["pairing", "hybridization"].includes(changes.get(event.topologyChangeId)?.kind ?? "") ? "form" : event.topologyChangeId ? "break" : undefined;
  for (let left = 0; left < events.length; left += 1) for (let right = left + 1; right < events.length; right += 1) {
    const first = events[left]!; const second = events[right]!;
    if (first.at !== second.at) continue;
    const sharedInteraction = affected(first).find((interactionId) => affected(second).includes(interactionId));
    const contradictory = sharedInteraction !== undefined && operation(first) !== undefined && operation(second) !== undefined && operation(first) !== operation(second);
    if (contradictory) return fail("TOPOLOGY_CONFLICT", `interaction ${sharedInteraction} is formed and broken at the same semantic instant`);
  }
  return null;
}

function initialTopology(scene: ScientificSceneSpec) {
  const activeInteractionIds = scene.topology.interactions.filter((interaction) => interaction.state !== "absent").map((interaction) => interaction.interactionId).sort();
  const inactiveInteractionIds = scene.topology.interactions.filter((interaction) => interaction.state === "absent").map((interaction) => interaction.interactionId).sort();
  const continuities = scene.topology.continuities ?? [];
  return {
    activeInteractionIds,
    inactiveInteractionIds,
    activeContinuityIds: continuities.filter((continuity) => continuity.state !== "cleaved").map((continuity) => continuity.continuityId).sort(),
    brokenContinuityIds: continuities.filter((continuity) => continuity.state === "cleaved").map((continuity) => continuity.continuityId).sort(),
    actorPresence: scene.actors.map((actor) => ({ actorId: actor.actorId, present: true })),
  };
}

function setInteraction(active: Set<string>, inactive: Set<string>, interaction: ScientificInteraction, shouldBeActive: boolean) {
  if (shouldBeActive) { active.add(interaction.interactionId); inactive.delete(interaction.interactionId); }
  else { inactive.add(interaction.interactionId); active.delete(interaction.interactionId); }
}

function applyChange(change: TopologyChange, eventId: string, scene: ScientificSceneSpec, active: Set<string>, inactive: Set<string>, activeContinuities: Set<string>, brokenContinuities: Set<string>, actorPresence: Map<string, boolean>, activeChanges: Set<string>, separationChanges: Set<string>, fragmentation: Map<string, { changeId: string; actorIds: readonly ScientificActorId[]; orderedFragmentActorIds: readonly ScientificActorId[] }>, evidence: Array<MechanismTopologySnapshotV1["evidence"][number]>, fidelityReferences: Array<MechanismTopologySnapshotV1["fidelityReferences"][number]>) : TopologyExecutionFailure | null {
  if (activeChanges.has(change.changeId)) return null;
  const interactions = interactionMap(scene);
  const continuities = scene.topology.continuities ?? [];
  const changedInteractionIds = change.interactionIds ?? [];
  for (const interactionId of changedInteractionIds) {
    const interaction = interactions.get(interactionId);
    if (!interaction) return fail("TOPOLOGY_REFERENCE_MISSING", `change ${change.changeId} references missing interaction ${interactionId}`);
    const activeAfter = change.kind === "pairing" || change.kind === "hybridization";
    setInteraction(active, inactive, interaction, activeAfter);
  }
  if (change.kind === "cleavage" || change.kind === "fragmentation") {
    for (const continuity of continuities) if (continuity.orderedActorIds.some((actorId) => change.actorIds.includes(actorId)) || change.actorIds.includes(continuity.strandActorId)) { activeContinuities.delete(continuity.continuityId); brokenContinuities.add(continuity.continuityId); }
  }
  if (change.kind === "separation") separationChanges.add(change.changeId);
  if (change.kind === "fragmentation" || change.kind === "processing") {
    const fragmentContinuities = continuities.filter((continuity) => continuity.orderedActorIds.some((actorId) => change.actorIds.includes(actorId)));
    if (fragmentContinuities.length === 0) return fail("FRAGMENTATION_UNGROUNDED", `change ${change.changeId} does not ground fragment membership`);
    fragmentation.set(change.changeId, { changeId: change.changeId, actorIds: [...change.actorIds], orderedFragmentActorIds: [...new Set(fragmentContinuities.flatMap((continuity) => continuity.orderedActorIds))] });
  }
  for (const actorId of change.actorIds) if (!actorPresence.has(actorId)) return fail("TOPOLOGY_REFERENCE_MISSING", `change ${change.changeId} references missing actor ${actorId}`);
  const attachment = attachmentEvidence(scene, change, changedInteractionIds);
  const sourceIds = attachment.sourceIds;
  const attachments = scene.fidelityProvenance.attachments.filter((item) => attachment.attachmentIds.includes(item.attachmentId));
  if (attachments.length === 0) return fail("TOPOLOGY_EVIDENCE_INVALID", `change ${change.changeId} has no grounded evidence attachment`);
  evidence.push({ eventId, changeId: change.changeId, interactionIds: [...changedInteractionIds].sort(), continuityIds: continuities.filter((continuity) => continuity.orderedActorIds.some((actorId) => change.actorIds.includes(actorId))).map((continuity) => continuity.continuityId).sort(), attachmentIds: attachment.attachmentIds, sourceIds });
  for (const item of attachments) fidelityReferences.push({ changeId: change.changeId, fidelity: item.fidelity, sourceId: String(item.provenanceSourceId) });
  activeChanges.add(change.changeId);
  return null;
}

export function evaluateGroundedTopologyAtTime(program: DeterministicTemporalProgramV1, timeSeconds: number): TopologyExecutionResult {
  const sceneResult = validateScientificSceneSpec(program.scientificScene);
  if (!sceneResult.valid) return fail("TOPOLOGY_REFERENCE_MISSING", ...sceneResult.issues.map((issue) => `${issue.path}: ${issue.message}`));
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > program.timeline.clock.duration) return fail("TOPOLOGY_EXECUTION_UNSUPPORTED", `timeSeconds must be within [0, ${program.timeline.clock.duration}]`);
  const referenceFailure = validateEventReferences(program);
  if (referenceFailure) return referenceFailure;
  const conflictFailure = validateTopologyConflicts(program);
  if (conflictFailure) return conflictFailure;
  const initial = initialTopology(program.scientificScene);
  const active = new Set(initial.activeInteractionIds); const inactive = new Set(initial.inactiveInteractionIds);
  const activeContinuities = new Set(initial.activeContinuityIds); const brokenContinuities = new Set(initial.brokenContinuityIds);
  const actorPresence = new Map(initial.actorPresence.map((item) => [item.actorId, item.present]));
  const activeChanges = new Set<string>(); const separationChanges = new Set<string>();
  const fragmentation = new Map<string, { changeId: string; actorIds: readonly ScientificActorId[]; orderedFragmentActorIds: readonly ScientificActorId[] }>();
  const evidence: Array<MechanismTopologySnapshotV1["evidence"][number]> = []; const fidelityReferences: Array<MechanismTopologySnapshotV1["fidelityReferences"][number]> = [];
  const interactions = interactionMap(program.scientificScene); const changes = changeMap(program.scientificScene);
  for (const eventId of program.eventOrder) {
    const event = program.timeline.events.find((candidate) => candidate.eventId === eventId)!;
    if (event.at > timeSeconds) continue;
    if (event.kind === "bondFormed" || event.kind === "bondBroken") {
      const interaction = interactions.get(event.interactionId!);
      if (!interaction) return fail("TOPOLOGY_REFERENCE_MISSING", `event ${event.eventId} references missing interaction ${event.interactionId}`);
      setInteraction(active, inactive, interaction, event.kind === "bondFormed");
      if (event.topologyChangeId) {
        const change = changes.get(event.topologyChangeId);
        if (!change) return fail("TOPOLOGY_REFERENCE_MISSING", `event ${event.eventId} references missing change ${event.topologyChangeId}`);
        const result = applyChange(change, event.eventId, program.scientificScene, active, inactive, activeContinuities, brokenContinuities, actorPresence, activeChanges, separationChanges, fragmentation, evidence, fidelityReferences);
        if (result) return result;
      }
      continue;
    }
    if (event.kind === "topologyChanged" || event.kind === "polymerShortened" || event.kind === "polymerGrew") {
      const change = changes.get(event.topologyChangeId!);
      if (!change) return fail("TOPOLOGY_REFERENCE_MISSING", `event ${event.eventId} references missing change ${event.topologyChangeId}`);
      if ((event.kind === "polymerShortened" || event.kind === "polymerGrew") && change.kind === "fragmentation" && !(program.scientificScene.topology.continuities ?? []).length) return fail("FRAGMENTATION_UNGROUNDED", `shortening ${event.eventId} lacks grounded continuity partition`);
      const result = applyChange(change, event.eventId, program.scientificScene, active, inactive, activeContinuities, brokenContinuities, actorPresence, activeChanges, separationChanges, fragmentation, evidence, fidelityReferences);
      if (result) return result;
      continue;
    }
    if (event.kind === "actorCreated" || event.kind === "actorRemoved") {
      if (!event.topologyChangeId) return fail("TOPOLOGY_EXECUTION_UNSUPPORTED", `actor lifecycle event ${event.eventId} lacks a grounded topology change`);
      const change = changes.get(event.topologyChangeId);
      if (!change) return fail("TOPOLOGY_REFERENCE_MISSING", `actor lifecycle event ${event.eventId} references missing change`);
      const result = applyChange(change, event.eventId, program.scientificScene, active, inactive, activeContinuities, brokenContinuities, actorPresence, activeChanges, separationChanges, fragmentation, evidence, fidelityReferences);
      if (result) return result;
      for (const actorId of event.actorIds) actorPresence.set(actorId, event.kind === "actorCreated");
    }
  }
  return { ok: true, snapshot: { schemaVersion: "1", timelineId: program.timeline.timelineId, timeSeconds, activeInteractionIds: [...active].sort(), inactiveInteractionIds: [...inactive].sort(), activeContinuityIds: [...activeContinuities].sort(), brokenContinuityIds: [...brokenContinuities].sort(), activeTopologyChangeIds: [...activeChanges].sort(), actorPresence: [...actorPresence].map(([actorId, present]) => ({ actorId, present })), fragmentation: [...fragmentation.values()].sort((left, right) => left.changeId.localeCompare(right.changeId)), separationChangeIds: [...separationChanges].sort(), evidence, fidelityReferences: fidelityReferences.filter((item, index, all) => all.findIndex((candidate) => candidate.changeId === item.changeId && candidate.fidelity === item.fidelity && candidate.sourceId === item.sourceId) === index) } };
}

export function composeMechanismSnapshotWithTopology(snapshot: MechanismSnapshotV1, topology: MechanismTopologySnapshotV1): MechanismSnapshotWithTopologyV1 {
  return { ...snapshot, topologyState: topology };
}

export function serializeMechanismTopologySnapshot(snapshot: MechanismTopologySnapshotV1): string { return JSON.stringify(snapshot); }
