/** D-E: single-pass membrane-protein topology over the D-D secretory authority. */

import type { ScientificActorId } from "./scientific-actor.ts";
import { evaluateSecretoryPathwayAtTime, type SecretoryProgramV1, type SecretorySnapshotV1 } from "./secretory-pathway.ts";
import type { TeachingPlan, TeachingReference } from "./teaching-plan.ts";

export const membraneProteinTopologySchemaVersion = "1" as const;
export type MembraneProteinTopologyClass = "TYPE_I_SINGLE_PASS" | "TYPE_II_SINGLE_PASS";
export type MembraneInsertionState = "UNINSERTED" | "TRANSLOCON_ENGAGED" | "PARTIALLY_INSERTED" | "INSERTED" | "RELEASED_FROM_TRANSLOCON";
export type MembraneOwner = "ER_MEMBRANE" | "ER_TRANSPORT_VESICLE" | "CIS_GOLGI_MEMBRANE" | "MEDIAL_GOLGI_MEMBRANE" | "TRANS_GOLGI_MEMBRANE" | "SECRETORY_VESICLE_MEMBRANE" | "PLASMA_MEMBRANE";
export type ProteinDomainSide = "UNRESOLVED" | "CYTOSOLIC" | "LUMINAL" | "EXTRACELLULAR";

export type ProteinRegionV1 = Readonly<{ regionId: string; kind: "CYTOSOLIC_DOMAIN" | "TRANSMEMBRANE_SEGMENT" | "LUMINAL_DOMAIN"; startResidue: number; endResidue: number; proteinId: ScientificActorId }>;
export type ProteinModificationV1 = Readonly<{ modificationId: string; kind: "N_LINKED_GLYCAN" | "DISULFIDE_BOND"; targetRegionId: string; siteResidues: readonly number[]; locality: "ER_LUMEN" | "GOLGI_LUMEN"; state: "ABSENT" | "ER_INITIAL" | "GOLGI_PROCESSED" | "MATURE"; sourceEventId: string }>;
export type MembraneProteinTopologyV1 = Readonly<{ schemaVersion: typeof membraneProteinTopologySchemaVersion; proteinId: ScientificActorId; membraneId: ScientificActorId; topologyClass: MembraneProteinTopologyClass; signalMode: "SIGNAL_ANCHOR" | "CLEAVABLE_SIGNAL_PEPTIDE"; regionIds: readonly string[]; cytosolicRegionIds: readonly string[]; luminalRegionIds: readonly string[]; transmembraneRegionIds: readonly string[]; orientation: Readonly<{ nTerminal: ProteinDomainSide; cTerminal: ProteinDomainSide }>; provenanceRefs: readonly TeachingReference[]; fidelity: "S2_SCHEMATIC" }>;
export type MembraneProteinProgramV1 = Readonly<{ schemaVersion: "1"; programId: string; secretoryProgram: SecretoryProgramV1; topology: MembraneProteinTopologyV1; regions: readonly ProteinRegionV1[]; modifications: readonly ProteinModificationV1[]; disulfideEvent: Readonly<{ eventId: string; at: number; siteResidues: readonly [number, number]; regionId: string }>; multipassSupport: "DEFERRED_D_V1" }>;
export type MembraneProteinSnapshotV1 = Readonly<{ schemaVersion: "1"; programId: string; timeSeconds: number; proteinId: ScientificActorId; secretory: SecretorySnapshotV1; insertionState: MembraneInsertionState; activeMembrane: MembraneOwner | null; topology: MembraneProteinTopologyV1["orientation"]; regionSides: Readonly<Record<string, ProteinDomainSide>>; disulfideState: "ABSENT" | "FORMED"; glycosylationState: "ABSENT" | "ER_INITIAL" | "GOLGI_PROCESSED" | "MATURE"; modificationLocality: "NONE" | "ER_LUMEN" | "GOLGI_LUMEN"; qualityState: SecretorySnapshotV1["qualityState"]; finalPlasmaMembrane: boolean; appliedEventIds: readonly string[] }>;
export type MembraneProteinResult = Readonly<{ ok: true; snapshot: MembraneProteinSnapshotV1 }> | Readonly<{ ok: false; code: string; reasons: readonly string[] }>;
export type MembraneProteinValidation = { valid: true; issues: [] } | { valid: false; issues: Array<{ path: string; message: string }> };

const fail = (code: string, ...reasons: string[]): MembraneProteinResult => ({ ok: false, code, reasons });
const has = (snapshot: SecretorySnapshotV1, eventId: string) => snapshot.appliedEventIds.includes(eventId);

export function createCanonicalMembraneProteinProgram(secretoryProgram: SecretoryProgramV1): MembraneProteinProgramV1 {
  const proteinId = secretoryProgram.actors.proteinId;
  const source = secretoryProgram.cellularScene.scene.fidelityProvenance.sources[0]!.sourceId;
  const topology: MembraneProteinTopologyV1 = { schemaVersion: "1", proteinId, membraneId: secretoryProgram.actors.erMembraneId, topologyClass: "TYPE_I_SINGLE_PASS", signalMode: "SIGNAL_ANCHOR", regionIds: ["n-domain", "tm-helix-1", "c-domain"], cytosolicRegionIds: ["c-domain"], luminalRegionIds: ["n-domain"], transmembraneRegionIds: ["tm-helix-1"], orientation: { nTerminal: "LUMINAL", cTerminal: "CYTOSOLIC" }, provenanceRefs: [{ kind: "source", sourceId: source }], fidelity: "S2_SCHEMATIC" };
  return { schemaVersion: "1", programId: "canonical-type-i-membrane-protein", secretoryProgram: { ...secretoryProgram, programId: "canonical-type-i-membrane-protein-secretory", outcome: "MEMBRANE_PROTEIN" }, topology, regions: [{ regionId: "n-domain", kind: "LUMINAL_DOMAIN", startResidue: 1, endResidue: 12, proteinId }, { regionId: "tm-helix-1", kind: "TRANSMEMBRANE_SEGMENT", startResidue: 13, endResidue: 32, proteinId }, { regionId: "c-domain", kind: "CYTOSOLIC_DOMAIN", startResidue: 33, endResidue: 60, proteinId }], modifications: [{ modificationId: "n-glycan-n-domain", kind: "N_LINKED_GLYCAN", targetRegionId: "n-domain", siteResidues: [8], locality: "ER_LUMEN", state: "ABSENT", sourceEventId: "er-glycosylated" }, { modificationId: "disulfide-n-domain", kind: "DISULFIDE_BOND", targetRegionId: "n-domain", siteResidues: [4, 10], locality: "ER_LUMEN", state: "ABSENT", sourceEventId: "disulfide-formed" }], disulfideEvent: { eventId: "disulfide-formed", at: 12.4, siteResidues: [4, 10], regionId: "n-domain" }, multipassSupport: "DEFERRED_D_V1" };
}

export function validateMembraneProteinTopologyContract(topology: MembraneProteinTopologyV1): MembraneProteinValidation {
  const issues: Array<{ path: string; message: string }> = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  if (topology.schemaVersion !== "1") issue("topology.schemaVersion", "unsupported topology schema");
  if (!topology.proteinId || !topology.membraneId) issue("topology", "proteinId and membraneId are required");
  if (topology.topologyClass === "TYPE_I_SINGLE_PASS" && (topology.luminalRegionIds.length !== 1 || topology.cytosolicRegionIds.length !== 1 || topology.transmembraneRegionIds.length !== 1 || topology.orientation.nTerminal !== "LUMINAL" || topology.orientation.cTerminal !== "CYTOSOLIC")) issue("topology", "TYPE_I_SINGLE_PASS requires one luminal domain, one cytosolic domain, and one transmembrane segment");
  const all = [...topology.luminalRegionIds, ...topology.cytosolicRegionIds, ...topology.transmembraneRegionIds];
  if (new Set(all).size !== all.length || new Set(all).size !== topology.regionIds.length || all.some((regionId) => !topology.regionIds.includes(regionId))) issue("topology.regionIds", "region partitions must be complete and disjoint");
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

function membraneFor(snapshot: SecretorySnapshotV1): MembraneOwner | null { if (snapshot.extracellular) return "PLASMA_MEMBRANE"; if (snapshot.vesicleState !== "NONE") return snapshot.vesicleState === "DOCKED" || snapshot.vesicleState === "FUSED" ? "SECRETORY_VESICLE_MEMBRANE" : "ER_TRANSPORT_VESICLE"; if (snapshot.golgiCompartment === "CIS") return "CIS_GOLGI_MEMBRANE"; if (snapshot.golgiCompartment === "MEDIAL") return "MEDIAL_GOLGI_MEMBRANE"; if (snapshot.golgiCompartment === "TRANS" || snapshot.golgiCompartment === "TGN") return "TRANS_GOLGI_MEMBRANE"; return snapshot.transloconState === "ENGAGED" || snapshot.transloconState === "RELEASED" ? "ER_MEMBRANE" : null; }

export function evaluateMembraneProteinAtTime(program: MembraneProteinProgramV1, timeSeconds: number): MembraneProteinResult {
  const result = evaluateSecretoryPathwayAtTime(program.secretoryProgram, timeSeconds);
  if (!result.ok) return fail("MEMBRANE_PROTEIN_SCIENCE_UNAVAILABLE", ...result.reasons);
  const secretory = result.snapshot;
  const inserted = has(secretory, "translocation-complete");
  const engaged = has(secretory, "translocon-engaged");
  const fused = has(secretory, "membrane-fusion");
  const insertionState: MembraneInsertionState = fused ? "RELEASED_FROM_TRANSLOCON" : inserted ? "INSERTED" : engaged ? secretory.luminalChainLength > 0 ? "PARTIALLY_INSERTED" : "TRANSLOCON_ENGAGED" : "UNINSERTED";
  const nSide: ProteinDomainSide = !inserted ? "UNRESOLVED" : fused ? "EXTRACELLULAR" : "LUMINAL";
  const cSide: ProteinDomainSide = !inserted ? "UNRESOLVED" : "CYTOSOLIC";
  const disulfide = timeSeconds >= program.disulfideEvent.at ? "FORMED" : "ABSENT";
  const glycosylation = secretory.modificationState === "GOLGI_PROCESSED" ? "MATURE" : secretory.modificationState === "N_LINKED_GLYCAN_ADDED" ? "ER_INITIAL" : "ABSENT";
  const modificationLocality = glycosylation === "MATURE" ? "GOLGI_LUMEN" : glycosylation === "ER_INITIAL" ? "ER_LUMEN" : "NONE";
  const regionSides = { "n-domain": nSide, "tm-helix-1": inserted ? "MEMBRANE" : "UNRESOLVED", "c-domain": cSide } as unknown as Record<string, ProteinDomainSide>;
  return { ok: true, snapshot: { schemaVersion: "1", programId: program.programId, timeSeconds, proteinId: program.topology.proteinId, secretory, insertionState, activeMembrane: membraneFor(secretory), topology: { nTerminal: nSide, cTerminal: cSide }, regionSides, disulfideState: disulfide, glycosylationState: glycosylation, modificationLocality, qualityState: secretory.qualityState, finalPlasmaMembrane: fused, appliedEventIds: [...secretory.appliedEventIds, ...(disulfide === "FORMED" ? [program.disulfideEvent.eventId] : [])] } };
}

export function validateMembraneProteinProgram(program: MembraneProteinProgramV1): MembraneProteinValidation {
  const issues: Array<{ path: string; message: string }> = [];
  const issue = (path: string, message: string) => issues.push({ path, message });
  const ids = new Set(program.regions.map((region) => region.regionId));
  const topologyValidation = validateMembraneProteinTopologyContract(program.topology); if (!topologyValidation.valid) topologyValidation.issues.forEach((entry) => issue(entry.path, entry.message));
  if (program.topology.proteinId !== program.secretoryProgram.actors.proteinId) issue("topology.proteinId", "must preserve the D-D protein actor identity");
  if (program.topology.transmembraneRegionIds.some((id) => !ids.has(id)) || program.topology.luminalRegionIds.some((id) => !ids.has(id)) || program.topology.cytosolicRegionIds.some((id) => !ids.has(id))) issue("topology", "all topology region references must resolve");
  if (program.topology.topologyClass !== "TYPE_I_SINGLE_PASS" || program.topology.orientation.nTerminal !== "LUMINAL" || program.topology.orientation.cTerminal !== "CYTOSOLIC") issue("topology", "canonical D-E fixture requires TYPE_I single-pass orientation");
  if (program.regions.some((region) => region.proteinId !== program.topology.proteinId)) issue("regions", "all regions must preserve protein identity");
  for (const modification of program.modifications) { if (!ids.has(modification.targetRegionId)) issue(`modifications.${modification.modificationId}`, "target region is missing"); if (modification.locality === "ER_LUMEN" && !program.topology.luminalRegionIds.includes(modification.targetRegionId)) issue(`modifications.${modification.modificationId}`, "ER-lumen modification must target a luminal region"); if (new Set(modification.siteResidues).size !== modification.siteResidues.length) issue(`modifications.${modification.modificationId}`, "site residues must be unique"); }
  if (program.disulfideEvent.siteResidues[0] >= program.disulfideEvent.siteResidues[1]) issue("disulfideEvent", "disulfide residue order is invalid");
  const final = evaluateMembraneProteinAtTime(program, program.secretoryProgram.timeline.clock.duration);
  if (!final.ok) issue("evaluation", final.code); else if (!final.snapshot.finalPlasmaMembrane || final.snapshot.topology.nTerminal !== "EXTRACELLULAR" || final.snapshot.topology.cTerminal !== "CYTOSOLIC") issue("evaluation", "final type-I topology is not established");
  return issues.length ? { valid: false, issues } : { valid: true, issues: [] };
}

export function serializeMembraneProteinProgram(program: MembraneProteinProgramV1): string { return JSON.stringify(program); }
export function serializeMembraneProteinSnapshot(snapshot: MembraneProteinSnapshotV1): string { return JSON.stringify(snapshot); }

export function createMembraneProteinTeachingPlan(program: MembraneProteinProgramV1, requestMode: TeachingPlan["requestMode"] = "explain"): TeachingPlan {
  const actor = (actorId: ScientificActorId): TeachingReference => ({ kind: "actor", actorId });
  const compartment = (compartmentId: string): TeachingReference => ({ kind: "compartment", compartmentId });
  const event = (timelineEventId: string): TeachingReference => ({ kind: "timelineEvent", timelineEventId });
  const defs = [["targeting-signal", "Targeting signal", "secretory-signal-recognized"], ["translocon-insertion", "Translocon insertion", "translocon-engaged"], ["topology-established", "Topology established", "translocation-complete"], ["er-folding", "ER folding", "folding-complete"], ["disulfide-modification", "Disulfide and glycan modification", "er-glycosylated"], ["quality-control", "ER quality control", "er-quality-pass"], ["er-export", "ER export", "er-exit-vesicle-formed"], ["golgi-processing", "Golgi processing", "golgi-processing"], ["sorting", "Cargo sorting", "cargo-sorted"], ["membrane-delivery", "Membrane delivery", "secretory-vesicle-formed"], ["fusion", "Fusion", "membrane-fusion"], ["final-orientation", "Final plasma-membrane orientation", "exocytosis-completed"]] as const;
  const chapters = defs.map(([chapterId, title, eventId], index) => ({ chapterId, order: index + 1, title, focus: [event(eventId), actor(program.topology.proteinId)], context: [compartment("er-lumen"), compartment("extracellular-space")], chapterRole: index === 0 ? "IDENTIFY" as const : index === defs.length - 1 ? "SUMMARIZE" as const : "EXPLAIN" as const, ...(index ? { dependsOnChapterIds: [defs[index - 1]![0]] } : {}), disclosure: { primaryFocusRefs: [event(eventId)], secondaryContextRefs: [actor(program.topology.proteinId), compartment("er-lumen")], suppressedContextRefs: [], detail: index < 3 ? "STRUCTURAL" as const : "MECHANISTIC" as const }, timelineMapping: { eventIds: [eventId], chapterIds: [], transitionIds: [] }, narrationCueIds: [`cue-${chapterId}`] }));
  return { schemaVersion: "3", planId: "membrane-protein-topology-teaching", sceneId: program.secretoryProgram.cellularScene.scene.sceneId, requestMode, learningObjective: "Follow one membrane protein's orientation from ER insertion to the plasma membrane.", objectiveTrace: { objectiveKind: requestMode === "why" ? "EXPLAIN_CAUSE" : "EXPLAIN_MECHANISM", capabilityId: "membrane-protein-topology", phenomenon: "membrane-protein topology", mechanism: "ER insertion preserves sidedness through trafficking and fusion", targetActorIds: [program.topology.proteinId], requestMode }, prerequisiteAssumptions: [], chapters, narrationCues: chapters.map((chapter) => ({ cueId: `cue-${chapter.chapterId}`, target: chapter.focus[0]!, purpose: requestMode === "why" ? "explain" as const : "orient" as const })), annotations: [{ annotationId: "topology-continuity", kind: "identity", target: actor(program.topology.proteinId), text: "The ER-luminal domain becomes extracellular after fusion; the cytosolic domain remains cytosolic." }], causalSteps: [{ stepId: "lumen-to-extracellular", order: 1, cause: compartment("er-lumen"), effect: compartment("extracellular-space"), explanation: "Membrane continuity carries the luminal-facing domain to the extracellular side after exocytotic fusion." }], projections: [{ audience: "beginner", chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["topology-continuity"] }, { audience: "intermediate", chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["topology-continuity"] }, { audience: "advanced", chapterIds: chapters.map((chapter) => chapter.chapterId), revealedAnnotationIds: ["topology-continuity"] }] };
}
