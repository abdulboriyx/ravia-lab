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

/** Extracts only the existing F2 hairpin facts; no prompt or legacy RNA scene resolver participates. */
export function adaptSceneSpecToRnaHairpinOwnerInput(sceneSpec: SceneSpecV1): RnaHairpinOwnerInputV1 {
  const validation = validateSceneSpecV1(sceneSpec);
  if (!validation.valid) throw new Error(`Invalid SceneSpec: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  const scene = sceneSpec.scientificScene;
  const rna = scene.actors.find((actor) => actor.semanticTypeId === "rna");
  const pairedGroup = scene.groups.find((group) => group.kind === "pairedStem");
  const pairedState = scene.states.find((state) => state.kind === "paired");
  const basePairing = scene.topology.interactions.filter((interaction) => interaction.type === "basePairing" && interaction.state === "present");
  if (!rna || !pairedGroup || !pairedState || basePairing.length === 0) throw new Error("SceneSpec does not contain a complete RNA hairpin scientific topology");
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

/** Calls the unchanged secondary-structure owner without creating alternate RNA geometry. */
export function presentRnaHairpinOwnerInput(input: RnaHairpinOwnerInputV1): RnaHairpinOwnerOutputV1 {
  if (input.schemaVersion !== rnaHairpinOwnerInputSchemaVersion || input.owner !== "RnaSecondaryStructurePresentation" || input.basePairingInteractionIds.length === 0) throw new Error("Invalid RnaHairpinOwnerInputV1");
  return { input, owner: input.owner, presentation: deriveRnaSecondaryStructurePresentation(createRnaSecondaryStructureSpec("hairpin")) };
}
