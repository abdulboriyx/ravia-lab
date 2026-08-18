import assert from "node:assert/strict";
import test from "node:test";
import { actorId } from "./scientific-actor.ts";
import { topologyActorFixture, topologyFixture } from "./scientific-topology-fixtures.ts";
import { validateScientificTopologyModel, type ScientificTopologyModel } from "./scientific-topology.ts";

test("topology fixture validates actor references, interactions, continuity, states, and constraints", () => {
  const result = validateScientificTopologyModel(topologyFixture, topologyActorFixture);
  assert.equal(result.valid, true);
});

test("interaction categories remain distinct", () => {
  const interactions = topologyFixture.topology.interactions;
  assert.equal(interactions.find((item) => item.type === "phosphodiesterLinkage")?.kind, "covalent");
  assert.equal(interactions.find((item) => item.type === "basePairing")?.kind, "noncovalent");
  assert.equal(interactions.find((item) => item.type === "polymerContinuity")?.kind, "semanticRelation");
});

test("interaction kind/type compatibility matrix rejects cross-category chemistry", () => {
  for (const [kind, type] of [["covalent", "hydrogenBond"], ["noncovalent", "phosphodiesterLinkage"], ["semanticRelation", "baseStacking"]] as const) {
    const invalid = structuredClone(topologyFixture) as ScientificTopologyModel;
    invalid.topology.interactions[0]!.kind = kind;
    invalid.topology.interactions[0]!.type = type;
    const result = validateScientificTopologyModel(invalid, topologyActorFixture);
    assert.equal(result.valid, false, `${kind}:${type}`);
    if (!result.valid) assert.ok(result.issues.some((issue) => issue.message.includes("incompatible")));
  }
});

test("states reference persistent actor and topology identities", () => {
  const state = topologyFixture.states.find((item) => item.kind === "cleaved")!;
  assert.ok(state.actorIds.includes(actorId("rna-fragment-1")));
  assert.ok(state.topologyChangeIds?.includes("change-cleavage-1"));
  assert.ok(topologyFixture.topology.changes?.some((change) => change.changeId === "change-cleavage-1"));
});

test("strict validation rejects duplicate covalent links, bad anchors, missing state refs, and unknown keys", () => {
  const invalid = structuredClone(topologyFixture) as ScientificTopologyModel & Record<string, unknown>;
  invalid.extra = true;
  invalid.topology.interactions.push({
    interactionId: "bond-duplicate",
    kind: "covalent",
    type: "phosphodiesterLinkage",
    participants: [{ actorId: actorId("dna-nucleotide-1"), anchorId: "missing-anchor" }, { actorId: actorId("dna-nucleotide-2") }],
    state: "present",
  });
  invalid.states[0]!.interactionIds = ["missing-interaction"];
  const result = validateScientificTopologyModel(invalid, topologyActorFixture);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path === "model.extra"));
    assert.ok(result.issues.some((issue) => issue.path.includes("anchorId")));
    assert.ok(result.issues.some((issue) => issue.message.includes("interaction")));
  }
});

test("strict validation rejects invalid continuity and unknown nested fields", () => {
  const invalid = structuredClone(topologyFixture) as ScientificTopologyModel;
  (invalid.topology.continuities![0] as Record<string, unknown>).unexpected = true;
  invalid.topology.continuities![0]!.orderedActorIds = [actorId("dna-nucleotide-1"), actorId("dna-nucleotide-1")];
  const result = validateScientificTopologyModel(invalid, topologyActorFixture);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.message.includes("unknown field")));
    assert.ok(result.issues.some((issue) => issue.message.includes("repeat")));
  }
});
