/**
 * P1-J2: structured-only ingress → existing-production seam.
 *
 * F7 remains the frozen Foundation→legacy proof seam.  This adapter is the
 * separate, versioned seam for P1-migrated prompts: it deliberately accepts
 * no text and therefore cannot invoke a legacy parser or routing heuristic.
 */
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import type { PromptIngressResult } from "./prompt-ingress-compiler.ts";
import { adaptBasePairingOwnerV1, canonicalBasePairingOwnerInput, type BasePairingOwnerOutputV1 } from "./p1-j3a-dna-base-pairing-owner-adapter.ts";
import { createStrandSeparationOwnerInput, routeStrandSeparationOwnerInput, type StrandSeparationOwnerInputV1 } from "./strand-separation-owner-adapter.ts";
import { adaptSceneSpecToRnaHairpinOwnerInput, presentRnaHairpinOwnerInput, type RnaHairpinOwnerOutputV1 } from "./rna-hairpin-owner-adapter.ts";
import { createRnaExonucleaseOwnerInputV1, adaptRnaExonucleaseOwnerInput, type RnaExonucleaseOwnerAdapterResult } from "./rna-exonuclease-owner-adapter.ts";

export const productionIngressAdapterVersion = "1" as const;
export type ProductionIngressAdapterV1Input = {
  semanticIntent: PromptIngressResult["semanticIntent"];
  capabilityId: string;
  sceneSpec: SceneSpecV1;
};
export type ProductionIngressAdapterV1Result =
  | { kind: "ready"; adapterVersion: "1"; semanticIntent: PromptIngressResult["semanticIntent"]; capability: CapabilityRegistryRecord; sceneSpec: SceneSpecV1; productionOwner: string; partialActs: readonly string[]; fallbackStatus: "none"; structuredOwner: StructuredProductionOwnerOutputV1 }
  | { kind: "rejected"; adapterVersion: "1"; code: "MALFORMED_SCENE_SPEC" | "UNSUPPORTED_CAPABILITY" | "MISSING_OWNER" | "SEMANTIC_CAPABILITY_MISMATCH" | "OWNER_ADAPTER_REJECTED"; reason?: string };

const supported = new Set(["dna-base-pairing", "dna-strand-separation", "rna-secondary-structure", "rna-exonuclease-degradation"]);
type StructuredProductionOwnerOutputV1 = BasePairingOwnerOutputV1 | { kind: "strandSeparation"; input: StrandSeparationOwnerInputV1; route: ReturnType<typeof routeStrandSeparationOwnerInput> } | RnaHairpinOwnerOutputV1 | RnaExonucleaseOwnerAdapterResult;

/** Maps only already-resolved F1/F4 meaning to the registered existing owner. */
export function adaptProductionIngressV1(input: ProductionIngressAdapterV1Input): ProductionIngressAdapterV1Result {
  const scene = validateSceneSpecV1(input.sceneSpec);
  if (!scene.valid) return { kind: "rejected", adapterVersion: "1", code: "MALFORMED_SCENE_SPEC" };
  const capability = capabilityRegistryById.get(input.capabilityId);
  if (!capability || !supported.has(input.capabilityId) || capability.supportStatus !== "SUPPORTED") return { kind: "rejected", adapterVersion: "1", code: "UNSUPPORTED_CAPABILITY" };
  if (input.sceneSpec.semanticIntent !== input.semanticIntent || input.semanticIntent.schemaVersion !== "1") return { kind: "rejected", adapterVersion: "1", code: "SEMANTIC_CAPABILITY_MISMATCH" };
  const request = input.semanticIntent.requests[0];
  if (!request || (capability.phenomenon !== request.phenomenon && !capability.mechanisms.includes(request.mechanism!))) return { kind: "rejected", adapterVersion: "1", code: "SEMANTIC_CAPABILITY_MISMATCH" };
  if (!capability.presentationOwner) return { kind: "rejected", adapterVersion: "1", code: "MISSING_OWNER" };
  const partialActs = input.semanticIntent.acts.filter((act) => !capability.supportedActs.includes(act));
  try {
    let structuredOwner: StructuredProductionOwnerOutputV1;
    if (input.capabilityId === "dna-base-pairing") {
      const subjects = new Set(input.semanticIntent.requests.flatMap((request) => request.subjects.map((subject) => subject.resolvedId)));
      const pair = subjects.has("adenine") && subjects.has("thymine") ? "A-T" : subjects.has("guanine") && subjects.has("cytosine") ? "G-C" : undefined;
      if (!pair) return { kind: "rejected", adapterVersion: "1", code: "OWNER_ADAPTER_REJECTED", reason: "Base-pair identity is missing from structured subjects." };
      const adapted = adaptBasePairingOwnerV1(canonicalBasePairingOwnerInput(input.sceneSpec, pair, pair === "A-T" ? ["adenine-1", "thymine-1"] : ["guanine-1", "cytosine-1"], input.sceneSpec.scientificScene.fidelityProvenance.sources.map((source) => String(source.sourceId))));
      if (adapted.kind === "rejected") return { kind: "rejected", adapterVersion: "1", code: "OWNER_ADAPTER_REJECTED", reason: adapted.reason };
      structuredOwner = adapted;
    } else if (input.capabilityId === "dna-strand-separation") {
      const ownerInput = createStrandSeparationOwnerInput(input.sceneSpec);
      structuredOwner = { kind: "strandSeparation", input: ownerInput, route: routeStrandSeparationOwnerInput(ownerInput) };
    } else if (input.capabilityId === "rna-secondary-structure") {
      const ownerInput = adaptSceneSpecToRnaHairpinOwnerInput(input.sceneSpec);
      structuredOwner = presentRnaHairpinOwnerInput(ownerInput);
    } else {
      const ownerInput = createRnaExonucleaseOwnerInputV1({ sceneSpec: input.sceneSpec, capability });
      structuredOwner = adaptRnaExonucleaseOwnerInput(ownerInput);
    }
    return { kind: "ready", adapterVersion: "1", semanticIntent: input.semanticIntent, capability, sceneSpec: input.sceneSpec, productionOwner: capability.presentationOwner, partialActs, fallbackStatus: "none", structuredOwner };
  } catch (error) {
    return { kind: "rejected", adapterVersion: "1", code: "OWNER_ADAPTER_REJECTED", reason: error instanceof Error ? error.message : "Structured owner adapter rejected the input." };
  }
}
