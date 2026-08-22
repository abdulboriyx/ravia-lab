import assert from "node:assert/strict";
import test from "node:test";
import { groundScientificInteractions, validateInteractionTopologyEvidence } from "./p2-e-interaction-topology-grounding.ts";
import type { ScientificActorId } from "./scientific-actor.ts";
import { createConnectivityFixture, createScientificGroundingFixture } from "./p2-tf-scientific-grounding-fixtures.ts";

const scene = (fixture: ReturnType<typeof createScientificGroundingFixture>) => ({ actors: [{ actorId: fixture.handles.actors.strandA, semanticTypeId: "nucleotide" as const, scope: "residue" as const, instanceId: "fixture-a" }, { actorId: fixture.handles.actors.strandB, semanticTypeId: "nucleotide" as const, scope: "residue" as const, instanceId: "fixture-b" }], groups: [] });
type LinkParticipants = [{ actorId: ScientificActorId; selectorBindingId: string; residueKey: string; atomKeys: readonly string[] }, { actorId: ScientificActorId; selectorBindingId: string; residueKey: string; atomKeys: readonly string[] }];
const endpoints = (fixture: ReturnType<typeof createConnectivityFixture>, id: string): LinkParticipants => { const link = fixture.chemistry.linkAssertions.find((item) => item.linkAssertionId === id); if (!link) throw new Error("missing link"); const [first, second] = link.endpoints; return [{ actorId: first.actorId, selectorBindingId: first.selectorBindingId, residueKey: first.residueKey, atomKeys: first.atomKeys }, { actorId: second.actorId, selectorBindingId: second.selectorBindingId, residueKey: second.residueKey, atomKeys: second.atomKeys }]; };

test("P2-EG A-E/K/L use real authenticated pair/hybrid fixtures", () => {
  for (const kind of ["dnaAT", "dnaGC", "rnaAU", "rnaGC", "rnaDnaHybrid", "invalidAG"] as const) { const fixture = createScientificGroundingFixture(kind); const result = groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "pair", kind: kind === "rnaDnaHybrid" ? "hybridization" : "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }] }); assert.equal(result.ok, kind !== "invalidAG"); }
});

for (const kind of ["dnaPhosphodiester", "rnaPhosphodiester", "rnaCleavage", "rnaExonuclease"] as const) test(`P2-EG ${kind} uses exact authenticated endpoints`, () => { const fixture = createConnectivityFixture(kind); if (!("phosphodiester" in fixture.handles.facts)) return; const result = groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "link", kind: "phosphodiesterLinkage", participants: endpoints(fixture, fixture.handles.facts.phosphodiester), chemicalFactId: fixture.handles.facts.phosphodiester, evidence: "CHEMICAL_RULE" }], continuities: [{ continuityId: "continuity", strandActorId: fixture.handles.actors.strandA, orderedActorIds: [fixture.handles.actors.strandA, fixture.handles.actors.strandB], state: "intact", chemicalFactId: fixture.handles.facts.phosphodiester }] }); assert.equal(result.ok, true); if (result.ok) assert.equal(validateInteractionTopologyEvidence(result, fixture.substrate, fixture.chemistry).valid, true); });

test("P2-EG H emits traced cleavage topology from a real authenticated cleavage fixture", () => {
  const fixture = createConnectivityFixture("rnaCleavage");
  if (!("cleavageSite" in fixture.handles.facts) || !fixture.handles.facts.cleavageSite) throw new Error("cleavage fixture lacks cleavage handle");
  const linkId = fixture.handles.facts.cleavageSite!;
  const result = groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "pre-cleavage-link", kind: "phosphodiesterLinkage", participants: endpoints(fixture, linkId), chemicalFactId: linkId, evidence: "CHEMICAL_RULE" }], continuities: [{ continuityId: "pre-cleavage-continuity", strandActorId: fixture.handles.actors.strandA, orderedActorIds: [fixture.handles.actors.strandA, fixture.handles.actors.strandB], state: "intact", chemicalFactId: linkId }], changes: [{ changeId: "cleavage", kind: "cleavage", actorIds: [fixture.handles.actors.strandA, fixture.handles.actors.strandB], interactionIds: ["pre-cleavage-link"], chemicalFactId: linkId }] });
  assert.equal(result.ok, true); if (!result.ok) return;
  assert.equal(result.model.topology.changes?.some((change) => change.changeId === "cleavage" && change.kind === "cleavage"), true);
  assert.deepEqual(result.evidence.cleavage?.linkAssertionIds, [linkId]);
  assert.equal(validateInteractionTopologyEvidence(result, fixture.substrate, fixture.chemistry).valid, true);
});

test("P2-EG I emits traced terminal-processing topology from a real exonuclease fixture", () => {
  const fixture = createConnectivityFixture("rnaExonuclease");
  if (!("phosphodiester" in fixture.handles.facts)) throw new Error("exonuclease fixture lacks link handle");
  const linkId = fixture.handles.facts.phosphodiester;
  const result = groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "terminal-link", kind: "phosphodiesterLinkage", participants: endpoints(fixture, linkId), chemicalFactId: linkId, evidence: "CHEMICAL_RULE" }], changes: [{ changeId: "shortening", kind: "processing", actorIds: [fixture.handles.actors.strandA, fixture.handles.actors.strandB], interactionIds: ["terminal-link"], biochemicalDirection: "fiveToThree", terminusFactIds: [fixture.handles.facts.fivePrime, fixture.handles.facts.threePrime], chemicalFactId: linkId }] });
  assert.equal(result.ok, true); if (!result.ok) return;
  assert.equal(result.model.topology.changes?.some((change) => change.changeId === "shortening" && change.kind === "processing"), true);
  assert.deepEqual(result.evidence.shortening?.chemicalFactIds, [fixture.handles.facts.fivePrime, fixture.handles.facts.threePrime, linkId]);
  assert.deepEqual(result.evidence.shortening?.linkAssertionIds, [linkId]);
  assert.equal(validateInteractionTopologyEvidence(result, fixture.substrate, fixture.chemistry).valid, true);
});

test("P2-EG J emits traced strand separation from a real two-chain fixture", () => {
  const fixture = createConnectivityFixture("strandSeparation");
  const result = groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "paired", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }], changes: [{ changeId: "separation", kind: "separation", actorIds: [fixture.handles.actors.strandA, fixture.handles.actors.strandB], interactionIds: ["paired"] }] });
  assert.equal(result.ok, true); if (!result.ok) return;
  assert.equal(result.model.topology.changes?.some((change) => change.changeId === "separation" && change.kind === "separation"), true);
  assert.equal(result.evidence.separation?.chemicalFactIds.length, 0);
  assert.equal(validateInteractionTopologyEvidence(result, fixture.substrate, fixture.chemistry).valid, true);
});

test("P2-EG L rejects a real substrate request whose required authenticated chemistry fact is absent", () => {
  const fixture = createScientificGroundingFixture("dnaAT");
  const result = groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "missing-chemistry", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: "missing-authenticated-fact" }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "CHEMICAL_FACT_MISSING");
});

test("P2-EG rejects selector, residue, and site endpoint mutations while accepting reversed exact endpoints", () => { const fixture = createConnectivityFixture("dnaPhosphodiester"); const linkId = fixture.chemistry.linkAssertions[0]!.linkAssertionId; const valid = endpoints(fixture, linkId); const run = (participants: LinkParticipants) => groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [{ interactionId: "link", kind: "phosphodiesterLinkage", participants, chemicalFactId: linkId, evidence: "CHEMICAL_RULE" }] }); assert.equal(run(valid).ok, true); assert.equal(run([valid[1], valid[0]]).ok, true); for (const participants of [[{ ...valid[0], selectorBindingId: "wrong-binding" }, valid[1]], [{ ...valid[0], residueKey: "A:999" }, valid[1]], [{ ...valid[0], atomKeys: ["A:1:wrong"] }, valid[1]]] as LinkParticipants[]) { const result = run(participants); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "LINK_MISMATCH"); } });

test("P2-EG rejects swapped, duplicate, unrelated, and wrong-kind terminus references", () => { const fixture = createConnectivityFixture("rnaExonuclease"); const five = fixture.chemistry.assertions.find((fact) => fact.target === "fivePrimeTerminus")!; const three = fixture.chemistry.assertions.find((fact) => fact.target === "threePrimeTerminus")!; const run = (terminusFactIds: readonly [string, string]) => groundScientificInteractions({ grounding: fixture.substrate, actorScene: scene(fixture), chemistry: fixture.chemistry, interactions: [], changes: [{ changeId: "shorten", kind: "processing", actorIds: [fixture.handles.actors.strandA, fixture.handles.actors.strandB], biochemicalDirection: "fiveToThree", terminusFactIds }] }); assert.equal(run([five.assertionId, three.assertionId]).ok, true); for (const ids of [[three.assertionId, five.assertionId], [five.assertionId, five.assertionId], [three.assertionId, three.assertionId], ["other-substrate-terminus", three.assertionId], [three.assertionId, three.assertionId]] as const) { const result = run(ids); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.code, "TERMINUS_UNGROUNDED"); } });
