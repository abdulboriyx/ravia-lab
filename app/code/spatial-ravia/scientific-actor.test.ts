import assert from "node:assert/strict";
import test from "node:test";
import { dnaActorFixture, rnaActorFixture } from "./scientific-actor-fixtures.ts";
import { actorId, candidateFromSemanticMention, groupId, validateScientificActorScene, type ScientificActorScene } from "./scientific-actor.ts";

test("DNA actor fixture covers duplex, strands, chemistry, machinery, packaging, and lesion context", () => {
  const result = validateScientificActorScene(dnaActorFixture);
  assert.equal(result.valid, true);
  assert.ok(dnaActorFixture.actors.some((actor) => actor.semanticTypeId === "rnaPolymerase"));
  assert.ok(dnaActorFixture.actors.some((actor) => actor.semanticTypeId === "nucleosome"));
  assert.ok(dnaActorFixture.groups.some((group) => group.kind === "basePair"));
});

test("RNA actor fixture covers transcript states, types, motifs, fragments, and comparison", () => {
  const result = validateScientificActorScene(rnaActorFixture);
  assert.equal(result.valid, true);
  assert.ok(rnaActorFixture.actors.some((actor) => actor.role === "nascentTranscript"));
  assert.ok(rnaActorFixture.actors.some((actor) => actor.semanticTypeId === "cleavageFragment"));
  assert.ok(rnaActorFixture.groups.some((group) => group.kind === "comparisonPair"));
});

test("type and instance identity remain distinct and candidate mapping is renderer-independent", () => {
  const actor = dnaActorFixture.actors.find((entry) => entry.actorId === actorId("dna-template-strand-1"))!;
  assert.equal(actor.semanticTypeId, "strand");
  assert.equal(actor.instanceId, "dna-template-strand-1");
  const candidate = candidateFromSemanticMention({ rawText: "template strand", resolvedId: "strand", role: "template" }, [actor.actorId]);
  assert.equal(candidate.resolved, true);
  assert.equal(candidate.candidateActorIds[0], actor.actorId);
});

test("groups are distinct from hierarchy and can overlap composition memberships", () => {
  const group = rnaActorFixture.groups.find((entry) => entry.kind === "comparisonPair")!;
  assert.equal(group.groupId, groupId("group-comparison-1"));
  assert.notEqual(group.memberActorIds[0], rnaActorFixture.actors[0]!.parentActorId);
});

test("strict validation rejects duplicate IDs, missing parents, cycles, invalid groups, and unknown fields", () => {
  const invalid = structuredClone(dnaActorFixture) as unknown as ScientificActorScene & Record<string, unknown>;
  invalid.extra = true;
  invalid.actors[0]!.actorId = invalid.actors[1]!.actorId;
  invalid.actors[1]!.parentActorId = actorId("missing-parent");
  invalid.actors[2]!.parentActorId = invalid.actors[2]!.actorId;
  invalid.groups[0]!.memberActorIds = [actorId("missing-member")];
  const result = validateScientificActorScene(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.ok(result.issues.some((issue) => issue.path === "scene.extra"));
    assert.ok(result.issues.some((issue) => issue.message.includes("unique")));
    assert.ok(result.issues.some((issue) => issue.message.includes("missing actor")));
    assert.ok(result.issues.some((issue) => issue.message.includes("cycle")));
  }
});

test("instance identities are unique independently of actor IDs", () => {
  const invalid = structuredClone(rnaActorFixture) as ScientificActorScene;
  invalid.actors[1]!.instanceId = invalid.actors[0]!.instanceId;
  const result = validateScientificActorScene(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.path === "actors[1].instanceId" && issue.message.includes("unique")));
});

test("selectors and anchors validate as renderer-independent placeholders", () => {
  const scene = structuredClone(dnaActorFixture) as ScientificActorScene;
  scene.actors[0]!.source = { sourceId: "pdb-4v5c", modelId: "1", selector: { sourceStructureId: "4V5C", chainId: "Y", residueRange: { start: 1, end: 10, namespace: "label" }, atomNames: ["P", "O3'"] } };
  scene.actors[0]!.anchors = [{ id: "acceptor-end", kind: "attachment", selector: { chainId: "Y", residueRange: { start: 75, end: 76 } } }];
  assert.equal(validateScientificActorScene(scene).valid, true);
});

test("parent-child declarations and anchors are reciprocal and unique", () => {
  const invalid = structuredClone(dnaActorFixture) as ScientificActorScene;
  invalid.actors[0]!.childActorIds = [actorId("dna-template-strand-1"), actorId("dna-template-strand-1")];
  invalid.actors[1]!.parentActorId = actorId("dna-coding-strand-1");
  invalid.actors[1]!.anchors = [{ id: "end", kind: "terminus" }, { id: "end", kind: "terminus" }];
  const result = validateScientificActorScene(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.message.includes("reciprocally")) && result.issues.some((issue) => issue.message.includes("repeat a child")) && result.issues.some((issue) => issue.message.includes("unique within the actor")));
});

test("malformed selectors are rejected deterministically", () => {
  const invalid = structuredClone(dnaActorFixture) as ScientificActorScene;
  invalid.actors[0]!.selectors = [
    {},
    { residueRange: { start: 4, end: 2 } },
    { atomNames: ["P", "P"] },
    { chainId: "", sourceStructureId: 7 as unknown as string },
  ];
  const result = validateScientificActorScene(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.message.includes("must select")) && result.issues.some((issue) => issue.message.includes("ordered integer")) && result.issues.some((issue) => issue.message.includes("unique non-empty")) && result.issues.some((issue) => issue.message.includes("non-empty string")));
});

test("actor source pointers cannot assert fidelity outside F2-C", () => {
  const invalid = structuredClone(dnaActorFixture) as ScientificActorScene;
  invalid.actors[0]!.source = { sourceId: "unverified", fidelity: "deposited" } as unknown as NonNullable<typeof invalid.actors[number]["source"]>;
  const result = validateScientificActorScene(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.path.endsWith("source.fidelity") && issue.message.includes("unknown field")));
});
