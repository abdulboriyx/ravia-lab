import assert from "node:assert/strict";
import test from "node:test";
import { adaptRnaExonucleaseMigration, createRnaExonucleaseMigration } from "./rna-exonuclease-migration.ts";
import { adaptRnaExonucleaseOwnerInput, createRnaExonucleaseOwnerInputV1 } from "./rna-exonuclease-owner-adapter.ts";

for (const direction of ["fiveToThree", "threeToFive"] as const) {
  test(`P1-J3D derives a ${direction} owner input from Foundation data only`, () => {
    const migration = createRnaExonucleaseMigration(direction);
    const input = createRnaExonucleaseOwnerInputV1({ sceneSpec: migration.sceneSpec, capability: migration.capability });
    const adapted = adaptRnaExonucleaseOwnerInput(input);
    assert.equal(input.capabilityId, "rna-exonuclease-degradation");
    assert.equal(input.rnaActorId, "rna-1");
    assert.equal(input.direction, direction === "fiveToThree" ? "fivePrimeToThreePrime" : "threePrimeToFivePrime");
    assert.equal(input.removedTerminus, direction === "fiveToThree" ? "5prime" : "3prime");
    assert.ok(input.terminalShorteningInteractionId);
    assert.ok(input.partiallyDegradedStateId);
    assert.ok(input.continuityId);
    assert.ok(input.topologyChangeId);
    assert.ok(input.provenanceSourceIds.length > 0);
    assert.ok(input.fidelityTiers.length > 0);
    assert.equal(adapted.owner, "RnaDegradationPresentation");
    assert.equal(adapted.presentation.spec.direction, input.direction);
    assert.equal(adapted.presentation.terminalShortening?.removedTerminus, input.removedTerminus);
  });
}

test("P1-J3D structured adapter is equivalent to the existing owner on preserved degradation semantics", () => {
  const migration = createRnaExonucleaseMigration("fiveToThree");
  const structured = adaptRnaExonucleaseOwnerInput(createRnaExonucleaseOwnerInputV1({ sceneSpec: migration.sceneSpec, capability: migration.capability }));
  const existing = adaptRnaExonucleaseMigration(migration);
  assert.equal(structured.owner, existing.owner);
  assert.equal(structured.presentation.spec.mode, existing.presentation.spec.mode);
  assert.equal(structured.presentation.spec.direction, existing.presentation.spec.direction);
  assert.deepEqual(structured.presentation.terminalShortening, existing.presentation.terminalShortening);
  assert.equal(structured.presentation.state, existing.presentation.state);
  assert.equal(structured.presentation.fragments.filter((fragment) => fragment.retained).length, 1);
});
