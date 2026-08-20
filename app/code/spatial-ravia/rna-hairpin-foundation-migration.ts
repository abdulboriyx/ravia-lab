/** F7-C: a thin, renderer-neutral proof path from an RNA hairpin request to its existing owner. */
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { resolveRnaIntent } from "./rna-intent.ts";
import { routeRnaPresentation, type RnaPresentationRoute } from "./RnaPresentationRouter.ts";
import { adaptRnaSceneSpec, type LegacySemanticAdapterResult } from "./semantic-intent-legacy-adapters.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import { createFoundationLegacyMigration, type FoundationLegacyMigration } from "./foundation-legacy-migration-seam.ts";

export type RnaHairpinFoundationMigration = {
  prompt: string;
  semantic: LegacySemanticAdapterResult;
  capability: CapabilityRegistryRecord;
  sceneSpec: SceneSpecV1;
  productionRoute: RnaPresentationRoute;
  seam: FoundationLegacyMigration<RnaPresentationRoute>;
};

function hairpinCapability(): CapabilityRegistryRecord {
  const capability = capabilityRegistryById.get("rna-secondary-structure");
  if (!capability) throw new Error("RNA secondary-structure capability is not registered");
  return capability;
}

/**
 * Deliberately delegates prompt resolution and presentation ownership to the existing RNA systems.
 * This layer only proves frozen contract composition; it owns neither geometry nor prompt branches.
 */
export function migrateRnaHairpinThroughFoundation(prompt: string): RnaHairpinFoundationMigration | undefined {
  const resolved = resolveRnaIntent(prompt);
  if (!resolved || resolved.spec.family !== "secondaryStructure" || !resolved.spec.secondaryStructure.motifs.includes("hairpin")) return undefined;
  const semantic = adaptRnaSceneSpec(resolved.spec, prompt);
  const sceneSpec: SceneSpecV1 = {
    schemaVersion: "1",
    sceneId: scientificSceneSpecFixtures.hairpin.sceneId,
    compatibility: { semanticIntent: "1", scientificScene: "1" },
    semanticIntent: semantic.intent,
    scientificScene: scientificSceneSpecFixtures.hairpin,
  };
  const validation = validateSceneSpecV1(sceneSpec);
  if (!validation.valid) throw new Error(`Hairpin SceneSpec is invalid: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`);
  const capability = hairpinCapability();
  const productionRoute = routeRnaPresentation(resolved.spec);
  const seam = createFoundationLegacyMigration({ semanticIntent: semantic.intent, capability, sceneSpec, productionOwner: productionRoute.owner, legacyOutput: productionRoute });
  return { prompt, semantic, capability, sceneSpec, productionRoute, seam };
}
