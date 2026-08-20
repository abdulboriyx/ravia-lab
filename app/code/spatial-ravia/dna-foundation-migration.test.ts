import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { validateSceneSpecV1 } from "./scene-spec-v1.ts";
import { migrateDnaFoundationRequest } from "./dna-foundation-migration.ts";

const cases = [
  { prompt: "show the structure of B-DNA", source: "structure" as const, scene: scientificSceneSpecFixtures["canonical-duplex"], capability: "dna-canonical-structure", owner: "molecular-view" },
  { prompt: "show an A-T base pair in DNA", source: "basePairMechanism" as const, pair: "A-T" as const, scene: scientificSceneSpecFixtures["at-pairing"], capability: "dna-base-pairing", owner: "DnaBasePairInteractionPresentation" },
  { prompt: "show a G-C base pair in DNA", source: "basePairMechanism" as const, pair: "G-C" as const, scene: scientificSceneSpecFixtures["gc-pairing"], capability: "dna-base-pairing", owner: "DnaBasePairInteractionPresentation" },
];

test("F7-A migrates DNA duplex and base-pair requests through Foundation contracts", () => {
  for (const item of cases) {
    const proof = migrateDnaFoundationRequest({ rawPrompt: item.prompt, source: item.source, scientificScene: item.scene, pair: item.pair });
    assert.equal(proof.rawPrompt, item.prompt);
    assert.equal(proof.capability.capabilityId, item.capability, item.prompt);
    assert.equal(proof.capability.domain, "DNA");
    assert.equal(validateSceneSpecV1(proof.sceneSpec).valid, true, item.prompt);
    assert.ok(proof.fidelitySourceIds.length > 0, item.prompt);
    assert.equal(proof.renderer.owner, item.owner, item.prompt);
    assert.equal(proof.sceneSpec.scientificScene.sceneId, item.scene.sceneId);
    assert.equal(proof.sceneSpec.semanticIntent.rawUtterance, item.prompt);
  }
});

test("F7-A preserves distinct local pair identity and existing owner state", () => {
  const at = migrateDnaFoundationRequest({ rawPrompt: cases[1]!.prompt, source: cases[1]!.source, scientificScene: cases[1]!.scene, pair: cases[1]!.pair });
  const gc = migrateDnaFoundationRequest({ rawPrompt: cases[2]!.prompt, source: cases[2]!.source, scientificScene: cases[2]!.scene, pair: cases[2]!.pair });
  assert.equal(at.renderer.kind, "dnaMechanism");
  assert.equal(gc.renderer.kind, "dnaMechanism");
  if (at.renderer.kind === "dnaMechanism" && gc.renderer.kind === "dnaMechanism") {
    assert.equal(at.renderer.route.localChemistrySubject, "at-base-pair");
    assert.equal(gc.renderer.route.localChemistrySubject, "gc-base-pair");
  }
  assert.ok(at.semanticIntent.requests[0]!.subjects.some((subject) => subject.resolvedId === "adenine"));
  assert.ok(at.semanticIntent.requests[0]!.subjects.some((subject) => subject.resolvedId === "thymine"));
  assert.ok(gc.semanticIntent.requests[0]!.subjects.some((subject) => subject.resolvedId === "guanine"));
  assert.ok(gc.semanticIntent.requests[0]!.subjects.some((subject) => subject.resolvedId === "cytosine"));
});

test("F7-A migration is adapter-only and does not expose renderer geometry policy", () => {
  const proof = migrateDnaFoundationRequest({ rawPrompt: cases[0]!.prompt, source: cases[0]!.source, scientificScene: cases[0]!.scene });
  const serialized = JSON.stringify(proof.semanticIntent);
  assert.equal(serialized.includes("camera"), false);
  assert.equal(serialized.includes("mesh"), false);
  assert.equal(serialized.includes("geometry"), false);
});
