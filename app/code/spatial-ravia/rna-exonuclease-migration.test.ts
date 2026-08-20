import assert from "node:assert/strict";
import test from "node:test";
import { adaptRnaExonucleaseMigration, createRnaExonucleaseMigration, exonucleaseActorIds } from "./rna-exonuclease-migration.ts";
import { validateSceneSpecV1 } from "./scene-spec-v1.ts";
import { validateSemanticIntent } from "./semantic-intent.ts";

for (const direction of ["fiveToThree", "threeToFive"] as const) {
  test(`F7-D preserves ${direction} exonuclease semantics through the Foundation path`, () => {
    const migration = createRnaExonucleaseMigration(direction);
    assert.equal(validateSemanticIntent(migration.semanticIntent).valid, true);
    assert.equal(migration.capability.capabilityId, "rna-exonuclease-degradation");
    assert.equal(validateSceneSpecV1(migration.sceneSpec).valid, true);
    assert.ok(exonucleaseActorIds(migration).some((id) => id === "rna-1"));
    assert.equal(migration.sceneSpec.semanticIntent.requests[0]!.direction?.biochemical, direction);
    assert.equal(migration.sceneSpec.scientificScene.topology.changes![0]!.biochemicalDirection, direction);
    assert.equal(migration.sceneSpec.scientificScene.states.some((state) => state.kind === "partiallyDegraded"), true);
    assert.equal(migration.sceneSpec.scientificScene.topology.continuities![0]!.state, "partial");
    assert.equal(migration.sceneSpec.timeline?.events.some((event) => event.kind === "polymerShortened"), true);
  });
}

test("F7-D uses the existing RNA degradation owner and production renderer path without fallback", () => {
  const adapter = adaptRnaExonucleaseMigration(createRnaExonucleaseMigration("fiveToThree"));
  assert.equal(adapter.owner, "RnaDegradationPresentation");
  assert.equal(adapter.route.owner, "RnaDegradationPresentation");
  assert.equal(adapter.route.family, "degradationStability");
  assert.equal(adapter.presentation.spec.mode, "exonucleolytic");
  assert.equal(adapter.presentation.terminalShortening?.removedTerminus, "5prime");
  assert.equal(adapter.productionPlan.metadata.owner, "RnaDegradationPresentation");
});
