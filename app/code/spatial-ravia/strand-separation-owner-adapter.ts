/** P1-J3B: structured Foundation → retained DNA strand-separation owner adapter. */
import { routeDnaMechanismPresentation, type DnaMechanismPresentationRoute } from "./DnaMechanismPresentationRouter.ts";
import { createDnaStrandSeparationSpec, type DnaStrandSeparationState } from "./DnaStrandSeparationPresentation.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import type { DnaInteraction, DnaMechanismSpec } from "./dna-mechanism-contract.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";
import { validateSceneSpecV1 } from "./scene-spec-v1.ts";
import type { ScientificActorId } from "./scientific-actor.ts";
import type { ScientificFidelityProvenanceDocument } from "./scientific-fidelity-provenance.ts";
import type { TopologyInteractionKind, TopologyInteractionType, InteractionState } from "./scientific-topology.ts";

export const strandSeparationOwnerInputSchemaVersion = "1" as const;
export const strandSeparationProductionOwner = "DnaStrandSeparationPresentation" as const;

export type StrandSeparationOwnerInteractionV1 = {
  interactionId: string;
  kind: TopologyInteractionKind;
  type: TopologyInteractionType;
  state: InteractionState;
  actorIds: readonly ScientificActorId[];
};

/** Renderer-neutral, resolved data supplied to the existing production owner. */
export type StrandSeparationOwnerInputV1 = {
  schemaVersion: typeof strandSeparationOwnerInputSchemaVersion;
  sceneId: string;
  capabilityId: "dna-strand-separation";
  owner: typeof strandSeparationProductionOwner;
  strandActorIds: readonly ScientificActorId[];
  closedStateId: string;
  openStateId: string;
  mechanism: "strandSeparation";
  interactions: readonly StrandSeparationOwnerInteractionV1[];
  /** Scientific orientation, if semantic input supplied one; never a screen direction. */
  direction?: SceneSpecV1["semanticIntent"]["requests"][number]["direction"];
  fidelityProvenance: ScientificFidelityProvenanceDocument;
};

function fail(message: string): never { throw new Error(`Invalid strand-separation owner input: ${message}`); }

/**
 * Derives the owner payload only from validated SceneSpec/Foundation fields.
 * No raw prompt, parser, camera, geometry, or animation implementation enters
 * this boundary.
 */
export function createStrandSeparationOwnerInput(sceneSpec: SceneSpecV1): StrandSeparationOwnerInputV1 {
  const validation = validateSceneSpecV1(sceneSpec);
  if (!validation.valid) fail(validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; "));
  const request = sceneSpec.semanticIntent.requests[0];
  if (!request || request.phenomenon !== "strandSeparation") fail("SceneSpec must resolve the strandSeparation phenomenon");
  const strands = sceneSpec.scientificScene.actors.filter((actor) => actor.semanticTypeId === "strand").map((actor) => actor.actorId);
  if (strands.length !== 2) fail("requires exactly two resolved strand actors");
  const closed = sceneSpec.scientificScene.states.find((state) => state.kind === "closed");
  const open = sceneSpec.scientificScene.states.find((state) => state.kind === "open");
  if (!closed || !open) fail("requires both closed and open scientific states");
  if (!closed.actorIds.every((actorId) => strands.includes(actorId)) || !open.actorIds.every((actorId) => strands.includes(actorId))) fail("open/closed states must reference the resolved strand actors");
  const interactions = sceneSpec.scientificScene.topology.interactions
    .filter((interaction) => interaction.participants.every((participant) => strands.includes(participant.actorId)))
    .map((interaction) => ({ interactionId: interaction.interactionId, kind: interaction.kind, type: interaction.type, state: interaction.state, actorIds: interaction.participants.map((participant) => participant.actorId) }));
  if (!interactions.some((interaction) => interaction.type === "basePairing" && interaction.state === "absent")) fail("requires an absent inter-strand base-pairing interaction for opening");
  return {
    schemaVersion: "1",
    sceneId: sceneSpec.sceneId,
    capabilityId: "dna-strand-separation",
    owner: strandSeparationProductionOwner,
    strandActorIds: strands,
    closedStateId: closed.stateId,
    openStateId: open.stateId,
    mechanism: "strandSeparation",
    interactions,
    ...(request.direction ? { direction: request.direction } : {}),
    fidelityProvenance: sceneSpec.scientificScene.fidelityProvenance,
  };
}

/** Maps structured scientific interaction state to the legacy owner contract. */
function existingOwnerSpec(input: StrandSeparationOwnerInputV1): DnaMechanismSpec {
  if (input.schemaVersion !== "1" || input.owner !== strandSeparationProductionOwner || input.mechanism !== "strandSeparation") fail("unsupported owner input version or owner");
  const opening = input.interactions.some((interaction) => interaction.type === "basePairing" && interaction.state === "absent");
  const state: DnaStrandSeparationState = opening ? "opening" : "paired";
  const spec = createDnaStrandSeparationSpec({ state });
  const pairingState: DnaInteraction["state"] = opening ? "absent" : "present";
  return { ...spec, interactions: spec.interactions.map((interaction) => interaction.type === "hydrogenBond" ? { ...interaction, state: pairingState } : interaction) };
}

/** Thin production handoff; the established owner remains responsible for presentation. */
export function routeStrandSeparationOwnerInput(input: StrandSeparationOwnerInputV1): DnaMechanismPresentationRoute {
  return routeDnaMechanismPresentation(buildDnaMechanismRepresentationPlan(existingOwnerSpec(input)));
}

export type StrandSeparationStructuredEquivalence = {
  equivalent: boolean;
  differences: readonly string[];
};

/** Checks semantic equivalence, not geometry equivalence, across the owner seam. */
export function verifyStrandSeparationStructuredEquivalence(input: StrandSeparationOwnerInputV1, route: DnaMechanismPresentationRoute): StrandSeparationStructuredEquivalence {
  const differences: string[] = [];
  if (route.owner !== input.owner) differences.push("production owner changed");
  if (route.family !== "strandSeparation") differences.push("mechanism family changed");
  if (route.plan.sourceSpec.structuralState !== "locallyOpen") differences.push("open scientific state was not retained");
  const inputOpening = input.interactions.some((interaction) => interaction.type === "basePairing" && interaction.state === "absent");
  const ownerOpening = route.plan.sourceSpec.interactions.filter((interaction) => interaction.type === "hydrogenBond").every((interaction) => interaction.state === "absent");
  if (inputOpening !== ownerOpening) differences.push("inter-strand pairing state changed");
  if (!route.presentation || !("backbonePreserved" in route.presentation) || !route.presentation.backbonePreserved) differences.push("backbone preservation was lost");
  return { equivalent: differences.length === 0, differences };
}
