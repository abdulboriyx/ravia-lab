/** F7-D: Foundation-to-existing-owner migration proof for directional RNA exonuclease shortening. */

import { actorId, type ScientificActorId } from "./scientific-actor.ts";
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { deriveProductionRnaScenePlan, type RnaProductionScenePlan } from "./RnaProductionScenePlan.ts";
import type { RnaDegradationPresentation } from "./RnaDegradationPresentation.ts";
import { routeRnaPresentation, type RnaPresentationRoute } from "./RnaPresentationRouter.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { ScientificSceneSpec } from "./scientific-scene-spec.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";
import { createFoundationLegacyMigration, type FoundationLegacyMigration } from "./foundation-legacy-migration-seam.ts";

export type RnaExonucleaseDirection = "fiveToThree" | "threeToFive";

export type RnaExonucleaseMigration = Readonly<{
  prompt: string;
  direction: RnaExonucleaseDirection;
  semanticIntent: SemanticIntentV1;
  capability: CapabilityRegistryRecord;
  sceneSpec: SceneSpecV1;
}>;

export type RnaExonucleaseProductionAdapter = Readonly<{
  owner: "RnaDegradationPresentation";
  route: RnaPresentationRoute;
  presentation: RnaDegradationPresentation;
  productionPlan: RnaProductionScenePlan;
  seam: FoundationLegacyMigration<RnaProductionScenePlan>;
}>;

const rnaId = actorId("rna-1");
const retainedId = actorId("retained-rna-1");
const sourceId = "canonical-rna";
const directionText = (direction: RnaExonucleaseDirection) => direction === "fiveToThree" ? "5′→3′" : "3′→5′";
const terminal = (direction: RnaExonucleaseDirection) => direction === "fiveToThree" ? "five-prime" : "three-prime";
const productionDirection = (direction: RnaExonucleaseDirection) => direction === "fiveToThree" ? "fivePrimeToThreePrime" as const : "threePrimeToFivePrime" as const;

function semanticIntent(prompt: string, direction: RnaExonucleaseDirection): SemanticIntentV1 {
  return {
    schemaVersion: "1", rawUtterance: prompt, canonicalGloss: `Show ${directionText(direction)} exonucleolytic shortening of an RNA terminus.`, acts: ["show", "explain"],
    requests: [{ subjects: [{ rawText: "RNA", resolvedId: "rna", role: "substrate" }, { rawText: "RNA strand", resolvedId: "strand", role: "substrate" }], phenomenon: "exonucleaseDegradation", mechanism: "terminalExonucleaseAction", states: ["intact", "partiallyDegraded"], focus: "terminus", direction: { biochemical: direction, meaning: "scientific" }, spatialFrame: "strandRelative", outputPreferences: ["static", "localFocus"], requestedOutput: "scientificFigure" }],
    assertedClaims: [], alternatives: [], clarification: { required: false }, confidence: 1,
  };
}

function scientificScene(direction: RnaExonucleaseDirection): ScientificSceneSpec {
  const base = structuredClone(scientificSceneSpecFixtures["exonuclease-shortened"]);
  const changeId = `change-${direction === "fiveToThree" ? "five-to-three" : "three-to-five"}-shortening`;
  const retained = base.actors.find((actor) => actor.actorId === retainedId)!;
  retained.anchors = [{ id: "five-prime", kind: "terminus" }, { id: "three-prime", kind: "terminus" }];
  const shortening = base.topology.interactions.find((interaction) => interaction.interactionId === "terminal-shortening")!;
  shortening.participants = [{ actorId: rnaId, anchorId: terminal(direction) }, { actorId: retainedId, anchorId: terminal(direction) }];
  return {
    ...base,
    sceneId: `rna-exonuclease-${direction === "fiveToThree" ? "five-to-three" : "three-to-five"}`,
    states: [{ stateId: "rna-intact-before", kind: "intact", actorIds: [rnaId] }, ...base.states.map((state) => ({ ...state, topologyChangeIds: [changeId] }))],
    topology: {
      ...base.topology,
      continuities: [{ continuityId: "rna-retained-continuity", strandActorId: rnaId, orderedActorIds: [rnaId, retainedId], state: "partial" }],
      changes: [{ changeId, kind: "fragmentation", actorIds: [rnaId, retainedId], interactionIds: ["terminal-shortening"], biochemicalDirection: direction }],
    },
  };
}

function timeline(scene: ScientificSceneSpec, direction: RnaExonucleaseDirection): ScientificTimeline {
  const changeId = scene.topology.changes![0]!.changeId;
  const degradedState = scene.states.find((state) => state.kind === "partiallyDegraded")!;
  return {
    schemaVersion: "1", timelineId: `timeline-${scene.sceneId}`, clock: { duration: 1, unit: "seconds" }, initialMechanismStateId: "before-shortening",
    states: [
      { mechanismStateId: "before-shortening", scientificStateId: "rna-intact-before", kind: "before", actorIds: [rnaId] },
      { mechanismStateId: "after-shortening", scientificStateId: degradedState.stateId, kind: "after", actorIds: [rnaId, retainedId], topologyChangeIds: [changeId] },
    ],
    transitions: [{ transitionId: "terminal-shortening-transition", fromMechanismStateId: "before-shortening", toMechanismStateId: "after-shortening", start: 0, end: 1, eventIds: ["shorten-rna", "enter-partially-degraded"], fidelity: { fidelity: "C0_COMPUTED", sourceId: sourceId as never } }],
    events: [
      { eventId: "shorten-rna", at: 0.5, kind: "polymerShortened", actorIds: [rnaId, retainedId], topologyChangeId: changeId, amount: 1 },
      { eventId: "enter-partially-degraded", at: 1, kind: "stateEntered", actorIds: [rnaId, retainedId], stateId: degradedState.stateId },
    ],
    tracks: [], constraints: [{ constraintId: "rna-actor-persists", kind: "actorPersistence", actorIds: [rnaId] }, { constraintId: "shortening-requires-partial-state", kind: "requiresState", stateIds: [degradedState.stateId] }],
  };
}

/** Creates a complete F1→F6 payload, without modifying any frozen contract. */
export function createRnaExonucleaseMigration(direction: RnaExonucleaseDirection = "fiveToThree"): RnaExonucleaseMigration {
  const prompt = `show ${directionText(direction)} exonuclease degradation of RNA`;
  const capability = capabilityRegistryById.get("rna-exonuclease-degradation");
  if (!capability) throw new Error("Missing rna-exonuclease-degradation capability");
  const scientific = scientificScene(direction);
  return { prompt, direction, semanticIntent: semanticIntent(prompt, direction), capability, sceneSpec: { schemaVersion: "1", sceneId: scientific.sceneId, compatibility: { semanticIntent: "1", scientificScene: "1", timeline: "1" }, semanticIntent: semanticIntent(prompt, direction), scientificScene: scientific, timeline: timeline(scientific, direction) } };
}

/** Thin terminal adapter: directly selects the pre-existing RNA degradation owner and production plan. */
export function adaptRnaExonucleaseMigration(migration: RnaExonucleaseMigration): RnaExonucleaseProductionAdapter {
  const direction = productionDirection(migration.direction);
  const route = routeRnaPresentation({ family: "degradationStability", focus: `${directionText(migration.direction)} exonuclease terminal shortening`, scale: { level: "strand", locality: "regional" }, rnaType: "generic", structuralState: "degrading", strandCount: 1, pairingState: "none", requiredEntities: ["phosphodiesterLinkage", "fivePrimeEnd", "threePrimeEnd"], annotations: ["exonuclease", directionText(migration.direction)], sequenceRequirements: { required: false }, secondaryStructure: { required: false, motifs: [] }, dnaContext: { required: false }, processingState: "none", degradationState: "degrading", representation: { detail: "residue", showBackbone: true, showBases: true, showAnnotations: true }, supportExpectation: "renderer-ready" });
  if (route.owner !== "RnaDegradationPresentation" || route.family !== "degradationStability") throw new Error("RNA exonuclease migration must retain the degradation presentation owner");
  const presentation = route.presentation;
  if (!("terminalShortening" in presentation) || presentation.spec.direction !== direction || presentation.state !== "terminallyDegraded" || !presentation.terminalShortening) throw new Error("RNA exonuclease migration did not resolve terminal shortening");
  const productionPlan = deriveProductionRnaScenePlan(route);
  const seam = createFoundationLegacyMigration({ semanticIntent: migration.semanticIntent, capability: migration.capability, sceneSpec: migration.sceneSpec, productionOwner: "RnaDegradationPresentation", legacyOutput: productionPlan });
  return { owner: "RnaDegradationPresentation", route, presentation, productionPlan, seam };
}

export function exonucleaseActorIds(migration: RnaExonucleaseMigration): readonly ScientificActorId[] {
  return migration.sceneSpec.scientificScene.actors.map((actor) => actor.actorId);
}
