import assert from "node:assert/strict";
import test from "node:test";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { serializeScientificSceneSpec, validateScientificSceneSpec, withPresentationIntent, type ScientificSceneSpec } from "./scientific-scene-spec.ts";

test("F2-E represents every required current DNA/RNA capability fixture", () => {
  assert.equal(Object.keys(scientificSceneSpecFixtures).length, 19);
  for (const [id, scene] of Object.entries(scientificSceneSpecFixtures)) assert.deepEqual(validateScientificSceneSpec(scene), { valid: true, issues: [] }, id);
});

test("F2-E direct capability fixtures preserve G-C, repair, generic RNA, cleavage topology, and directional shortening", () => {
  const gc = scientificSceneSpecFixtures["gc-pairing"];
  assert.equal(gc.topology.interactions.filter((interaction) => interaction.type === "hydrogenBond").length, 3);
  assert.ok(scientificSceneSpecFixtures["damage-repair-context"].topology.interactions.some((interaction) => interaction.type === "repairRecognition"));
  assert.equal(scientificSceneSpecFixtures["generic-rna"].actors.some((actor) => actor.semanticTypeId === "rna"), true);
  assert.equal(scientificSceneSpecFixtures.cleavage.topology.continuities?.length, 3);
  assert.equal(scientificSceneSpecFixtures["exonuclease-shortened"].topology.changes?.[0]?.biochemicalDirection, "fiveToThree");
});

test("F2-E presentation replacement cannot mutate scientific truth", () => {
  const scene = scientificSceneSpecFixtures["at-pairing"];
  const replacement = { ...scene.presentationIntent, audience: "expert" as const };
  const next = withPresentationIntent(scene, replacement);
  assert.equal(next.actors, scene.actors);
  assert.equal(next.groups, scene.groups);
  assert.equal(next.topology, scene.topology);
  assert.equal(next.fidelityProvenance, scene.fidelityProvenance);
  assert.equal(next.presentationIntent.audience, "expert");
});

test("F2-E strictly rejects version, dangling science references, provenance targets, presentation targets, and renderer leakage", () => {
  const invalid = structuredClone(scientificSceneSpecFixtures["au-pairing"]) as ScientificSceneSpec & Record<string, unknown>;
  invalid.renderer = "three";
  invalid.schemaVersion = "2" as "1";
  invalid.topology.interactions[0]!.participants[0]!.actorId = "missing-actor" as typeof invalid.topology.interactions[0]["participants"][number]["actorId"];
  invalid.fidelityProvenance.attachments[0]!.target = { kind: "actor", actorId: "missing-actor" as typeof invalid.actors[number]["actorId"] };
  invalid.presentationIntent.focusActorIds = ["missing-actor" as typeof invalid.actors[number]["actorId"]];
  const result = validateScientificSceneSpec(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path === "scene.renderer"));
    assert.ok(result.issues.some((issue) => issue.path === "scene.schemaVersion"));
    assert.ok(result.issues.some((issue) => issue.message.includes("must reference an actor")));
    assert.ok(result.issues.some((issue) => issue.message.includes("missing actor")));
  }
});

test("F2-E canonical serialization is deterministic and rejects invalid documents", () => {
  const scene = scientificSceneSpecFixtures["canonical-duplex"];
  assert.equal(serializeScientificSceneSpec(scene), serializeScientificSceneSpec(structuredClone(scene)));
  const invalid = { ...scene, sceneId: "not valid" } as ScientificSceneSpec;
  assert.throws(() => serializeScientificSceneSpec(invalid), /Cannot serialize invalid/);
});
