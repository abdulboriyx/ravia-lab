/** P1-J3C: structured Foundation → existing RNA secondary-structure owner bridge. */
import { createRnaSecondaryStructureSpec, deriveRnaSecondaryStructurePresentation, type RnaSecondaryStructurePresentation } from "./RnaSecondaryStructurePresentation.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import type { ScientificActorId, ScientificGroupId } from "./scientific-actor.ts";
import type { ScientificInteraction, ScientificState } from "./scientific-topology.ts";
import type { ScientificFidelityProvenanceDocument } from "./scientific-fidelity-provenance.ts";

export const rnaHairpinOwnerInputSchemaVersion = "1" as const;

/**
 * Renderer-independent ownership hand-off. IDs retain their Foundation meaning;
 * the existing owner receives only its established hairpin semantic choice.
 */
export type RnaHairpinOwnerInputV1 = {
  schemaVersion: typeof rnaHairpinOwnerInputSchemaVersion;
  sceneId: string;
  owner: "RnaSecondaryStructurePresentation";
  rnaActorId: ScientificActorId;
  pairedRegionGroupId: ScientificGroupId;
  pairedStateId: ScientificState["stateId"];
  basePairingInteractionIds: readonly ScientificInteraction["interactionId"][];
  unpairedRegion: "hairpin-loop";
  fidelityProvenance: ScientificFidelityProvenanceDocument;
};

export type RnaHairpinOwnerOutputV1 = {
  input: RnaHairpinOwnerInputV1;
  owner: RnaHairpinOwnerInputV1["owner"];
  presentation: RnaSecondaryStructurePresentation;
};

export type RnaHairpinStructuredEquivalence = { equivalent: boolean; differences: readonly string[] };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Extracts only the existing F2 hairpin facts; no prompt or legacy RNA scene resolver participates. */
export function adaptSceneSpecToRnaHairpinOwnerInput(sceneSpec: SceneSpecV1): RnaHairpinOwnerInputV1 {
  const validation = validateSceneSpecV1(sceneSpec);
  if (!validation.valid) throw new Error(`Invalid SceneSpec: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  const scene = sceneSpec.scientificScene;
  const rna = scene.actors.find((actor) => actor.semanticTypeId === "rna");
  const pairedGroup = scene.groups.find((group) => group.kind === "pairedStem");
  const pairedState = scene.states.find((state) => state.kind === "paired");
  const request = sceneSpec.semanticIntent.requests.find((candidate) => candidate.phenomenon === "rnaSecondaryStructure" && candidate.mechanism === "rnaSecondaryFolding" && candidate.states?.includes("folded") && candidate.subjects.some((subject) => subject.resolvedId === "rna"));
  const basePairing = scene.topology.interactions.filter((interaction) => interaction.type === "basePairing" && interaction.state === "present" && interaction.participants.length === 2);
  if (!request || !rna || !pairedGroup || !pairedState || basePairing.length === 0) throw new Error("SceneSpec does not contain complete RNA hairpin semantics and topology");
  if (!pairedState.actorIds.includes(rna.actorId) || !basePairing.every((interaction) => pairedState.interactionIds?.includes(interaction.interactionId)) || !basePairing.every((interaction) => interaction.participants.every((participant) => pairedGroup.memberActorIds.includes(participant.actorId)))) throw new Error("RNA hairpin state and paired-stem topology references must agree");
  return {
    schemaVersion: rnaHairpinOwnerInputSchemaVersion,
    sceneId: sceneSpec.sceneId,
    owner: "RnaSecondaryStructurePresentation",
    rnaActorId: rna.actorId,
    pairedRegionGroupId: pairedGroup.groupId,
    pairedStateId: pairedState.stateId,
    basePairingInteractionIds: basePairing.map((interaction) => interaction.interactionId),
    unpairedRegion: "hairpin-loop",
    fidelityProvenance: scene.fidelityProvenance,
  };
}

/** Rejects malformed direct structured handoffs before the established owner is invoked. */
function assertValidRnaHairpinOwnerInput(input: unknown): asserts input is RnaHairpinOwnerInputV1 {
  if (!isRecord(input)) throw new Error("Invalid RnaHairpinOwnerInputV1: must be a structured record");
  const allowed = ["schemaVersion", "sceneId", "owner", "rnaActorId", "pairedRegionGroupId", "pairedStateId", "basePairingInteractionIds", "unpairedRegion", "fidelityProvenance"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new Error("Invalid RnaHairpinOwnerInputV1: unknown field");
  if (input.schemaVersion !== rnaHairpinOwnerInputSchemaVersion || input.owner !== "RnaSecondaryStructurePresentation" || input.unpairedRegion !== "hairpin-loop") throw new Error("Invalid RnaHairpinOwnerInputV1: schema, owner, or hairpin semantics");
  if ([input.sceneId, input.rnaActorId, input.pairedRegionGroupId, input.pairedStateId].some((id) => typeof id !== "string" || !id)) throw new Error("Invalid RnaHairpinOwnerInputV1: missing Foundation references");
  if (!Array.isArray(input.basePairingInteractionIds) || input.basePairingInteractionIds.length === 0 || input.basePairingInteractionIds.some((id) => typeof id !== "string" || !id)) throw new Error("Invalid RnaHairpinOwnerInputV1: missing paired topology references");
  if (!isRecord(input.fidelityProvenance) || !Array.isArray(input.fidelityProvenance.sources) || input.fidelityProvenance.sources.length === 0 || !Array.isArray(input.fidelityProvenance.attachments)) throw new Error("Invalid RnaHairpinOwnerInputV1: missing fidelity provenance");
}

/** Calls the unchanged secondary-structure owner without creating alternate RNA geometry. */
export function presentRnaHairpinOwnerInput(input: unknown): RnaHairpinOwnerOutputV1 {
  assertValidRnaHairpinOwnerInput(input);
  return { input, owner: input.owner, presentation: deriveRnaSecondaryStructurePresentation(createRnaSecondaryStructureSpec("hairpin")) };
}

/** Confirms that the retained owner received the same structured hairpin meaning. */
export function verifyRnaHairpinStructuredEquivalence(input: RnaHairpinOwnerInputV1, output: RnaHairpinOwnerOutputV1): RnaHairpinStructuredEquivalence {
  const differences: string[] = [];
  if (output.input !== input) differences.push("owner input identity changed");
  if (output.owner !== input.owner) differences.push("production owner changed");
  if (output.presentation.motif !== "hairpin") differences.push("hairpin semantics changed");
  if (output.presentation.topology.pairedResidues.length === 0 || output.presentation.topology.unpairedResidues.length === 0) differences.push("paired/unpaired regions were not retained");
  if (!output.presentation.topology.regions.some((region) => region.kind === "hairpin" || region.kind === "loop")) differences.push("hairpin loop region was lost");
  return { equivalent: differences.length === 0, differences };
}
