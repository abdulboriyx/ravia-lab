import assert from "node:assert/strict";
import test from "node:test";
import { compilePromptIngress } from "./prompt-ingress-compiler.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { adaptProductionIngressV1 } from "./production-ingress-adapter.ts";
import { createDnaStrandSeparationScientificScene } from "./f7-dna-strand-separation-migration.ts";
import { createRnaExonucleaseMigration } from "./rna-exonuclease-migration.ts";

const scene = (intent: ReturnType<typeof compilePromptIngress>["semanticIntent"], key: keyof typeof scientificSceneSpecFixtures) => ({ schemaVersion: "1" as const, sceneId: scientificSceneSpecFixtures[key].sceneId, compatibility: { semanticIntent: "1" as const, scientificScene: "1" as const }, semanticIntent: intent, scientificScene: scientificSceneSpecFixtures[key] });

test("P1-J2 adapts only structured ingress/SceneSpec data to registered owners", () => {
  const cases = [
    ["show G-C base pairing", "dna-base-pairing", "gc-pairing", "dna-mechanism"],
    ["unzip DNA", "dna-strand-separation", "strand-separation", "dna-mechanism"],
    ["show an RNA hairpin", "rna-secondary-structure", "hairpin", "RnaSecondaryStructurePresentation"],
    ["RNA gets eaten from the 5′ end", "rna-exonuclease-degradation", "exonuclease-shortened", "RnaDegradationPresentation"],
  ] as const;
  for (const [raw, capabilityId, key, owner] of cases) {
    const ingress = compilePromptIngress(raw); assert.equal(ingress.disposition, "READY", raw);
    const scientificScene = capabilityId === "dna-strand-separation" ? createDnaStrandSeparationScientificScene() : capabilityId === "rna-exonuclease-degradation" ? createRnaExonucleaseMigration("fiveToThree").sceneSpec.scientificScene : scientificSceneSpecFixtures[key];
    const result = adaptProductionIngressV1({ semanticIntent: ingress.semanticIntent, capabilityId, sceneSpec: { ...scene(ingress.semanticIntent, key), sceneId: scientificScene.sceneId, scientificScene } });
    assert.equal(result.kind, "ready", raw); if (result.kind === "ready") assert.equal(result.productionOwner, owner, raw);
  }
});

test("P1-J2 has no production path for non-ready ingress or malformed structured data", () => {
  const ambiguous = compilePromptIngress("open the helix");
  assert.equal(ambiguous.disposition, "CLARIFICATION_REQUIRED");
  const ready = compilePromptIngress("show G-C base pairing");
  const malformed = { ...scene(ready.semanticIntent, "gc-pairing"), sceneId: "invalid id" } as never;
  assert.deepEqual(adaptProductionIngressV1({ semanticIntent: ready.semanticIntent, capabilityId: "dna-base-pairing", sceneSpec: malformed }), { kind: "rejected", adapterVersion: "1", code: "MALFORMED_SCENE_SPEC" });
});
