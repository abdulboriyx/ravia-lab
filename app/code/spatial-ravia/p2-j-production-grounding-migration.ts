/** P2-J: production migration proof seam. It never parses prompts or selects a fallback owner. */
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { planScientificScene, executeScientificPlan, composeSceneSpecV1, type GroundedScientificPlanResult } from "./p2-h-scientific-plan-compiler.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";
import type { ScientificExecutionInventoryV1 } from "./scientific-execution-inventory.ts";
import { canonicalBasePairingOwnerInput, adaptBasePairingOwnerV1 } from "./p1-j3a-dna-base-pairing-owner-adapter.ts";
import { createStrandSeparationOwnerInput, routeStrandSeparationOwnerInput } from "./strand-separation-owner-adapter.ts";
import { adaptSceneSpecToRnaHairpinOwnerInput, presentRnaHairpinOwnerInput } from "./rna-hairpin-owner-adapter.ts";
import { createRnaExonucleaseOwnerInputV1, adaptRnaExonucleaseOwnerInput } from "./rna-exonuclease-owner-adapter.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";
import { adaptDnaBasePairingOwnerView, adaptDnaStrandSeparationOwnerView, adaptRnaHairpinOwnerView, adaptRnaExonucleaseOwnerView } from "./p2-j1-owner-scientific-views.ts";

export const productionScientificMigrationSchemaVersion = "1" as const;
export type ProductionMigrationOwner = "DnaBasePairInteractionPresentation" | "DnaStrandSeparationPresentation" | "RnaSecondaryStructurePresentation" | "RnaDegradationPresentation";
type ProductionMigrationFailureCode = "INVALID_INTENT" | "GROUNDING_FAILURE" | "SCENESPEC_INVALID" | "PRODUCTION_OWNER_UNAVAILABLE" | "OWNER_REJECTED";
export type ProductionMigrationResult =
  | { ok: true; schemaVersion: "1"; capability: CapabilityRegistryRecord; owner: ProductionMigrationOwner; route: unknown; sceneSpec: SceneSpecV1; scientific: GroundedScientificPlanResult }
  | { ok: false; schemaVersion: "1"; capabilityId: string; code: ProductionMigrationFailureCode; reasons: readonly string[] };

const ownerFor: Readonly<Record<string, ProductionMigrationOwner>> = {
  "dna-base-pairing": "DnaBasePairInteractionPresentation",
  "dna-strand-separation": "DnaStrandSeparationPresentation",
  "rna-secondary-structure": "RnaSecondaryStructurePresentation",
  "rna-exonuclease-degradation": "RnaDegradationPresentation",
};

const fail = (capabilityId: string, code: ProductionMigrationFailureCode, reasons: readonly string[]): ProductionMigrationResult => ({ ok: false, schemaVersion: "1", capabilityId, code, reasons });

/** Maps only already-grounded semantic references into the existing owner contracts. */
export function migrateProductionScientificScene(intent: SemanticIntentV1, capabilityId: string, inventory: ScientificExecutionInventoryV1): ProductionMigrationResult {
  const owner = ownerFor[capabilityId];
  if (!owner || !capabilityRegistryById.has(capabilityId)) return fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", ["no explicit production owner is registered for this grounded capability"]);
  const planned = planScientificScene(intent, { capabilityId });
  if (!planned.ok) return fail(capabilityId, planned.code === "INVALID_INTENT" ? "INVALID_INTENT" : "GROUNDING_FAILURE", planned.reasons);
  const scientific = executeScientificPlan(planned.plan, inventory);
  if (!scientific.ok) return fail(capabilityId, "GROUNDING_FAILURE", scientific.reasons);
  const composed = composeSceneSpecV1(planned.plan.planId, intent, scientific.scientificScene);
  if ("issues" in composed) return fail(capabilityId, "SCENESPEC_INVALID", composed.issues);
  const sceneSpec = composed;
  try {
    if (owner === "DnaBasePairInteractionPresentation") {
      const first = planned.plan.selectorRequirements.find((item) => item.selectorId === "base-a")?.base;
      const second = planned.plan.selectorRequirements.find((item) => item.selectorId === "base-b")?.base;
      const pair = first === "A" && second === "T" ? "A-T" : first === "G" && second === "C" ? "G-C" : undefined;
      if (!pair) return fail(capabilityId, "OWNER_REJECTED", ["grounded selector requirements are not a canonical DNA pair"]);
      const view = adaptDnaBasePairingOwnerView(sceneSpec, scientific); if (!view.ok) return fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", view.reasons);
      const adapted = adaptBasePairingOwnerV1(canonicalBasePairingOwnerInput(view.sceneSpec, view.view.pair, view.view.actorIds, view.sceneSpec.scientificScene.fidelityProvenance.sources.map((source) => String(source.sourceId))));
      return adapted.kind === "ready" ? { ok: true, schemaVersion: "1", capability: planned.capability, owner, route: adapted.route, sceneSpec: view.sceneSpec, scientific } : fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", [adapted.code, adapted.reason]);
    }
    if (owner === "DnaStrandSeparationPresentation") {
      const view = adaptDnaStrandSeparationOwnerView(sceneSpec, scientific); if (!view.ok) return fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", view.reasons); const input = createStrandSeparationOwnerInput(view.sceneSpec);
      return { ok: true, schemaVersion: "1", capability: planned.capability, owner, route: routeStrandSeparationOwnerInput(input), sceneSpec: view.sceneSpec, scientific };
    }
    if (owner === "RnaSecondaryStructurePresentation") {
      const view = adaptRnaHairpinOwnerView(sceneSpec, scientific); if (!view.ok) return fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", view.reasons); const input = adaptSceneSpecToRnaHairpinOwnerInput(view.sceneSpec);
      return { ok: true, schemaVersion: "1", capability: planned.capability, owner, route: presentRnaHairpinOwnerInput(input), sceneSpec: view.sceneSpec, scientific };
    }
    const view = adaptRnaExonucleaseOwnerView(sceneSpec, scientific); if (!view.ok) return fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", view.reasons); const input = createRnaExonucleaseOwnerInputV1({ sceneSpec: view.sceneSpec, capability: planned.capability });
    return { ok: true, schemaVersion: "1", capability: planned.capability, owner, route: adaptRnaExonucleaseOwnerInput(input), sceneSpec: view.sceneSpec, scientific };
  } catch (error) {
    return fail(capabilityId, "PRODUCTION_OWNER_UNAVAILABLE", [error instanceof Error ? error.message : String(error)]);
  }
}
