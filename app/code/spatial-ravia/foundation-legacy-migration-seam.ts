/** F7-E: the single Foundation → existing-production migration seam. */
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";

export type FoundationLegacyFallbackStatus = "none";
export type FoundationLegacyMigrationInput<TLegacy> = {
  semanticIntent: SemanticIntentV1;
  capability: CapabilityRegistryRecord;
  sceneSpec: SceneSpecV1;
  productionOwner: string;
  legacyOutput: TLegacy;
  actorIds?: readonly string[];
  interactionIds?: readonly string[];
  stateIds?: readonly string[];
  fidelitySourceIds?: readonly string[];
};

export type FoundationLegacyMigration<TLegacy> = {
  seamVersion: "1";
  semanticIntent: SemanticIntentV1;
  capability: CapabilityRegistryRecord;
  sceneSpec: SceneSpecV1;
  productionOwner: string;
  legacyOutput: TLegacy;
  fallbackStatus: FoundationLegacyFallbackStatus;
  equivalence: {
    actorIds: readonly string[];
    interactionIds: readonly string[];
    stateIds: readonly string[];
    fidelitySourceIds: readonly string[];
  };
};

/**
 * Validates and packages an already-resolved Foundation payload for an
 * existing production owner. It never parses prompts or creates geometry.
 */
export function createFoundationLegacyMigration<TLegacy>(input: FoundationLegacyMigrationInput<TLegacy>): FoundationLegacyMigration<TLegacy> {
  if (!input.semanticIntent || input.semanticIntent.schemaVersion !== "1") throw new Error("Migration seam requires SemanticIntent v1.");
  if (!input.capability || !capabilityRegistryById.has(input.capability.capabilityId)) throw new Error("Migration seam requires a registered capability.");
  if (input.capability.supportStatus !== "SUPPORTED") throw new Error("Migration seam rejects non-supported capabilities; no generic fallback is permitted.");
  if (!input.productionOwner.trim()) throw new Error("Migration seam requires an existing production owner.");
  if (input.legacyOutput === undefined || input.legacyOutput === null) throw new Error("Migration seam requires an existing production output.");
  const sceneValidation = validateSceneSpecV1(input.sceneSpec);
  if (!sceneValidation.valid) throw new Error(`Migration seam rejects malformed SceneSpec: ${sceneValidation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`);
  return {
    seamVersion: "1",
    semanticIntent: input.semanticIntent,
    capability: input.capability,
    sceneSpec: input.sceneSpec,
    productionOwner: input.productionOwner,
    legacyOutput: input.legacyOutput,
    fallbackStatus: "none",
    equivalence: {
      actorIds: input.actorIds ?? input.sceneSpec.scientificScene.actors.map((actor) => actor.actorId),
      interactionIds: input.interactionIds ?? input.sceneSpec.scientificScene.topology.interactions.map((interaction) => interaction.interactionId),
      stateIds: input.stateIds ?? input.sceneSpec.scientificScene.states.map((state) => state.stateId),
      fidelitySourceIds: input.fidelitySourceIds ?? input.sceneSpec.scientificScene.fidelityProvenance.sources.map((source) => source.sourceId),
    },
  };
}
