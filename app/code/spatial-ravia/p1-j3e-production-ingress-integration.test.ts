import assert from "node:assert/strict";
import test from "node:test";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";
import { adaptProductionIngressV1 } from "./production-ingress-adapter.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { createDnaStrandSeparationScientificScene } from "./f7-dna-strand-separation-migration.ts";
import { createRnaExonucleaseMigration } from "./rna-exonuclease-migration.ts";
import type { SceneSpecV1 } from "./scene-spec-v1.ts";

function sceneFor(intent: ReturnType<typeof compilePromptIngress>["semanticIntent"], key: keyof typeof scientificSceneSpecFixtures, scientificScene = scientificSceneSpecFixtures[key]): SceneSpecV1 {
  return { schemaVersion: "1", sceneId: scientificScene.sceneId, compatibility: { semanticIntent: "1", scientificScene: "1" }, semanticIntent: intent, scientificScene };
}

test("P1-J3E routes all four proof cases through one structured production boundary", () => {
  const cases = [
    { prompt: "show G-C base pairing", capabilityId: "dna-base-pairing", scene: (intent: ReturnType<typeof compilePromptIngress>["semanticIntent"]) => sceneFor(intent, "gc-pairing") },
    { prompt: "unzip DNA", capabilityId: "dna-strand-separation", scene: (intent: ReturnType<typeof compilePromptIngress>["semanticIntent"]) => sceneFor(intent, "strand-separation", createDnaStrandSeparationScientificScene()) },
    { prompt: "show an RNA hairpin", capabilityId: "rna-secondary-structure", scene: (intent: ReturnType<typeof compilePromptIngress>["semanticIntent"]) => sceneFor(intent, "hairpin") },
    { prompt: "show exonuclease degradation of RNA", capabilityId: "rna-exonuclease-degradation", scene: (intent: ReturnType<typeof compilePromptIngress>["semanticIntent"]) => sceneFor(intent, "exonuclease-shortened", createRnaExonucleaseMigration("fiveToThree").sceneSpec.scientificScene) },
  ] as const;
  for (const item of cases) {
    const ingress = compilePromptIngress(item.prompt);
    assert.equal(ingress.disposition, "READY", item.prompt);
    const result = adaptProductionIngressV1({ semanticIntent: ingress.semanticIntent, capabilityId: item.capabilityId, sceneSpec: item.scene(ingress.semanticIntent) });
    assert.equal(result.kind, "ready", item.prompt);
    if (result.kind !== "ready") continue;
    assert.equal(result.fallbackStatus, "none");
    assert.equal(result.sceneSpec.semanticIntent, result.semanticIntent);
    assert.equal("rawPrompt" in result.structuredOwner, false, item.prompt);
    assert.equal("camera" in result.structuredOwner, false, item.prompt);
  }
});

test("P1-J3E preserves structured proof facts and explicit partial-act handling", () => {
  const ingress = compilePromptIngress("show G-C base pairing and animate the hydrogen bonds");
  assert.equal(ingress.disposition, "READY");
  const result = adaptProductionIngressV1({ semanticIntent: ingress.semanticIntent, capabilityId: "dna-base-pairing", sceneSpec: sceneFor(ingress.semanticIntent, "gc-pairing") });
  assert.equal(result.kind, "ready");
  if (result.kind === "ready") {
    assert.equal(result.capability.capabilityId, "dna-base-pairing");
    assert.equal(result.semanticIntent.acts.includes("animate"), true);
    assert.equal(result.partialActs.includes("animate"), true);
    assert.equal("hydrogenBondInteractionIds" in result.structuredOwner, true);
    if ("hydrogenBondInteractionIds" in result.structuredOwner) assert.equal(result.structuredOwner.hydrogenBondInteractionIds.length, 3);
  }
});

test("P1-J3E stops clarification and rejects malformed or unsupported structured input", () => {
  const ambiguous = compilePromptIngress("open the helix");
  assert.equal(ambiguous.disposition, "CLARIFICATION_REQUIRED");
  const ready = compilePromptIngress("show G-C base pairing");
  const scene = sceneFor(ready.semanticIntent, "gc-pairing");
  assert.equal(adaptProductionIngressV1({ semanticIntent: ready.semanticIntent, capabilityId: "not-a-capability", sceneSpec: scene }).kind, "rejected");
  const malformed = { ...scene, sceneId: "bad id" } as SceneSpecV1;
  const rejected = adaptProductionIngressV1({ semanticIntent: ready.semanticIntent, capabilityId: "dna-base-pairing", sceneSpec: malformed });
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected") assert.equal(rejected.code, "MALFORMED_SCENE_SPEC");
});
