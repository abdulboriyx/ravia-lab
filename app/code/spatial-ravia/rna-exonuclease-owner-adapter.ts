/** P1-J3D: structured Foundation data → existing RNA exonuclease owner. */

import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { rnaTerminalDegradationPresentation, type RnaDegradationDirection, type RnaDegradationPresentation } from "./RnaDegradationPresentation.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";

export const rnaExonucleaseOwnerInputSchemaVersion = "1" as const;

export type FoundationRnaExonucleaseData = Readonly<{
  sceneSpec: SceneSpecV1;
  capability: CapabilityRegistryRecord;
}>;

/** Complete owner-ready semantic payload. It intentionally has no prompt or legacy scene fields. */
export type RnaExonucleaseOwnerInputV1 = Readonly<{
  schemaVersion: typeof rnaExonucleaseOwnerInputSchemaVersion;
  sceneId: string;
  owner: "RnaDegradationPresentation";
  capabilityId: "rna-exonuclease-degradation";
  rnaActorId: string;
  direction: RnaDegradationDirection;
  removedTerminus: "5prime" | "3prime";
  terminalShorteningInteractionId: string;
  partiallyDegradedStateId: string;
  continuityId: string;
  topologyChangeId: string;
  provenanceSourceIds: readonly string[];
  fidelityTiers: readonly string[];
}>;

export type RnaExonucleaseOwnerAdapterResult = Readonly<{
  owner: "RnaDegradationPresentation";
  input: RnaExonucleaseOwnerInputV1;
  presentation: RnaDegradationPresentation;
}>;

const rnaActorId = "rna-1";
const capabilityId = "rna-exonuclease-degradation";
const asOwnerDirection = (direction: "fiveToThree" | "threeToFive"): RnaDegradationDirection => direction === "fiveToThree" ? "fivePrimeToThreePrime" : "threePrimeToFivePrime";

function fail(message: string): never { throw new Error(`RNA exonuclease owner adapter: ${message}`); }

/** Converts already-resolved Foundation data without parsing a prompt or calling an RNA semantic resolver. */
export function createRnaExonucleaseOwnerInputV1(data: FoundationRnaExonucleaseData): RnaExonucleaseOwnerInputV1 {
  const validation = validateSceneSpecV1(data.sceneSpec);
  if (!validation.valid) fail(`invalid SceneSpec v1 (${validation.issues.map((issue) => issue.path).join(", ")})`);
  if (data.capability.capabilityId !== capabilityId || data.capability.presentationOwner !== "RnaDegradationPresentation" || data.capability.supportStatus !== "SUPPORTED") fail("requires the supported RNA exonuclease capability and existing degradation owner");
  if (!capabilityRegistryById.has(capabilityId)) fail("registered RNA exonuclease capability is missing");

  const scene = data.sceneSpec.scientificScene;
  if (!scene.actors.some((actor) => String(actor.actorId) === rnaActorId && actor.semanticTypeId === "rna")) fail("must preserve the RNA actor");
  const request = data.sceneSpec.semanticIntent.requests.find((candidate) => candidate.mechanism === "terminalExonucleaseAction" && candidate.phenomenon === "exonucleaseDegradation");
  const semanticDirection = request?.direction?.biochemical ?? scene.topology.changes?.find((candidate) => candidate.actorIds.some((id) => String(id) === rnaActorId))?.biochemicalDirection;
  if (semanticDirection !== "fiveToThree" && semanticDirection !== "threeToFive") fail("requires explicit scientific 5′/3′ direction semantics");
  const change = scene.topology.changes?.find((candidate) => candidate.biochemicalDirection === semanticDirection && candidate.actorIds.some((id) => String(id) === rnaActorId));
  if (!change) fail("requires a direction-matched RNA topology change");
  const shortening = scene.topology.interactions.find((interaction) => interaction.type === "terminalDegradation" && interaction.participants.some((participant) => String(participant.actorId) === rnaActorId));
  if (!shortening) fail("requires explicit terminal shortening interaction");
  const partiallyDegraded = scene.states.find((state) => state.kind === "partiallyDegraded" && state.actorIds.some((id) => String(id) === rnaActorId) && state.topologyChangeIds?.includes(change.changeId));
  if (!partiallyDegraded) fail("requires partially degraded state bound to the topology change");
  const continuity = scene.topology.continuities?.find((entry) => String(entry.strandActorId) === rnaActorId && entry.state === "partial");
  if (!continuity) fail("requires preserved partial RNA continuity");
  const direction = asOwnerDirection(semanticDirection);
  return {
    schemaVersion: rnaExonucleaseOwnerInputSchemaVersion, sceneId: scene.sceneId, owner: "RnaDegradationPresentation", capabilityId,
    rnaActorId, direction, removedTerminus: direction === "fivePrimeToThreePrime" ? "5prime" : "3prime",
    terminalShorteningInteractionId: shortening.interactionId, partiallyDegradedStateId: partiallyDegraded.stateId,
    continuityId: continuity.continuityId, topologyChangeId: change.changeId,
    provenanceSourceIds: scene.fidelityProvenance.sources.map((source) => String(source.sourceId)),
    fidelityTiers: scene.fidelityProvenance.attachments.map((attachment) => attachment.fidelity),
  };
}

/** Invokes the existing degradation owner directly; no router, prompt, or renderer is recreated. */
export function adaptRnaExonucleaseOwnerInput(input: RnaExonucleaseOwnerInputV1): RnaExonucleaseOwnerAdapterResult {
  if (input.schemaVersion !== "1" || input.owner !== "RnaDegradationPresentation" || input.capabilityId !== capabilityId) fail("received unsupported owner input");
  const presentation = rnaTerminalDegradationPresentation({ phase: "shortened", stabilityState: "degrading", mode: "exonucleolytic", cleavageLocation: input.removedTerminus === "5prime" ? "fivePrimeTerminal" : "threePrimeTerminal", direction: input.direction, cleavageIndex: 7, length: 16, structuredContext: false }, input.direction);
  if (presentation.state !== "terminallyDegraded" || presentation.spec.direction !== input.direction || presentation.terminalShortening?.removedTerminus !== input.removedTerminus) fail("existing owner did not preserve terminal shortening semantics");
  return { owner: "RnaDegradationPresentation", input, presentation };
}
