import assert from "node:assert/strict";
import test from "node:test";
import { migrateDnaFoundationRequest } from "./dna-foundation-migration.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { adaptBasePairingOwnerV1, canonicalBasePairingOwnerInput } from "./p1-j3a-dna-base-pairing-owner-adapter.ts";

function input(pair: "A-T" | "G-C") {
  const scene = scientificSceneSpecFixtures[pair === "A-T" ? "at-pairing" : "gc-pairing"];
  const proof = migrateDnaFoundationRequest({ rawPrompt: `show a ${pair} base pair in DNA`, source: "basePairMechanism", pair, scientificScene: scene });
  const actorIds = pair === "A-T" ? ["adenine-1", "thymine-1"] as const : ["guanine-1", "cytosine-1"] as const;
  return canonicalBasePairingOwnerInput(proof.sceneSpec, pair, actorIds, proof.fidelitySourceIds);
}

test("structured adapter preserves A-T and G-C owner equivalence", () => {
  for (const pair of ["A-T", "G-C"] as const) {
    const result = adaptBasePairingOwnerV1(input(pair));
    assert.equal(result.kind, "ready");
    if (result.kind === "ready") {
      assert.equal(result.owner, "DnaBasePairInteractionPresentation");
      assert.equal(result.pair, pair);
      assert.equal(result.hydrogenBondInteractionIds.length, pair === "A-T" ? 2 : 3);
      assert.deepEqual(result.fallbackStatus, "none");
    }
  }
});

test("structured adapter rejects invalid fields and references", () => {
  const base = input("G-C");
  const wrongActor = adaptBasePairingOwnerV1({ ...base, actorIds: ["guanine-1", "missing"] });
  assert.equal(wrongActor.kind, "rejected");
  assert.equal(wrongActor.kind === "rejected" ? wrongActor.code : "", "ACTOR_MISMATCH");
  const unknown = adaptBasePairingOwnerV1({ ...base, cameraPreset: "hero" } as never);
  assert.equal(unknown.kind, "rejected");
  assert.equal(unknown.kind === "rejected" ? unknown.code : "", "MALFORMED_INPUT");
});
