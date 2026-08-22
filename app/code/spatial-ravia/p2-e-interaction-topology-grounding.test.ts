import assert from "node:assert/strict";
import test from "node:test";
import { groundScientificInteractions, validateInteractionTopologyEvidence, type InteractionTopologyGroundingResult } from "./p2-e-interaction-topology-grounding.ts";
import { createConnectivityFixture, createScientificGroundingFixture } from "./p2-tf-scientific-grounding-fixtures.ts";

const fixture = createScientificGroundingFixture("rnaAU");
const actorScene = { actors: [{ actorId: fixture.handles.actors.strandA, semanticTypeId: "adenine" as const, scope: "residue" as const, instanceId: "fixture-a", anchors: [{ id: "donor", kind: "atomGroup" as const }] }, { actorId: fixture.handles.actors.strandB, semanticTypeId: "uracil" as const, scope: "residue" as const, instanceId: "fixture-b", anchors: [{ id: "acceptor", kind: "atomGroup" as const }] }], groups: [] };
const baseInput = { grounding: fixture.substrate, actorScene, chemistry: fixture.chemistry, continuities: [], changes: [] };

test("P2-E derives canonical pairing and H-bonds only from authenticated P2-G facts", () => {
  const result = groundScientificInteractions({ ...baseInput, interactions: [{ interactionId: "au-pair", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }, { interactionId: "au-hbond", kind: "hydrogenBond", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.donorA, anchorId: "donor" }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.acceptorT, anchorId: "acceptor" }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(result.ok, true); if (result.ok) assert.deepEqual(result.participantIdentity["au-pair"], ["RNA:A", "RNA:U"]);
});

test("P2-E rejects missing authenticated facts, incompatible A-G chemistry, dangling anchors, and unsupported fields", () => {
  const missing = groundScientificInteractions({ ...baseInput, interactions: [{ interactionId: "missing", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: "absent" }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(missing.ok, false); if (!missing.ok) assert.equal(missing.code, "CHEMICAL_FACT_MISSING");
  const ag = createScientificGroundingFixture("invalidAG"); const wrong = groundScientificInteractions({ grounding: ag.substrate, actorScene: { ...actorScene, actors: [{ ...actorScene.actors[0]!, actorId: ag.handles.actors.strandA }, { ...actorScene.actors[1]!, actorId: ag.handles.actors.strandB }] }, chemistry: ag.chemistry, interactions: [{ interactionId: "ag", kind: "basePairing", participants: [{ actorId: ag.handles.actors.strandA, chemicalFactId: ag.handles.facts.baseA }, { actorId: ag.handles.actors.strandB, chemicalFactId: ag.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(wrong.ok, false); if (!wrong.ok) assert.equal(wrong.code, "CHEMISTRY_INCOMPATIBLE");
  const dangling = groundScientificInteractions({ ...baseInput, interactions: [{ interactionId: "h", kind: "hydrogenBond", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.donorA, anchorId: "missing" }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.acceptorT, anchorId: "acceptor" }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(dangling.ok, false); if (!dangling.ok) assert.equal(dangling.code, "SELECTOR_UNRESOLVED");
  assert.equal(groundScientificInteractions({ ...baseInput, interactions: [], camera: {} } as never).ok, false);
});

test("P2-E evidence validator rejects trace corruption from a real authenticated output", () => {
  const result = groundScientificInteractions({ ...baseInput, interactions: [{ interactionId: "pair", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(result.ok, true); if (!result.ok) return; assert.equal(validateInteractionTopologyEvidence(result, fixture.substrate, fixture.chemistry).valid, true);
  const mutate = (trace: Partial<(typeof result.evidence)[string]>, key = "pair") => ({ ...result, evidence: { ...result.evidence, [key]: { ...result.evidence.pair!, ...trace } } });
  for (const broken of [mutate({}, "missing"), mutate({ outputKind: "change" }), mutate({ chemicalFactIds: ["missing"] }), mutate({ selectorBindingIds: ["missing"] }), mutate({ provenanceSourceId: "wrong" }), mutate({ structureId: "wrong" }), mutate({ evidence: "CONSTRAINED_SCHEMATIC", fidelity: "E0_DEPOSITED" })]) assert.equal(validateInteractionTopologyEvidence(broken, fixture.substrate, fixture.chemistry).valid, false);
  const missing = { ...result, evidence: {} }; assert.equal(validateInteractionTopologyEvidence(missing, fixture.substrate, fixture.chemistry).valid, false);
});

test("P2-E trace validator enforces deposited E0 and computed C0 pairings", () => {
  const result = groundScientificInteractions({ ...baseInput, interactions: [{ interactionId: "pair", kind: "basePairing", participants: [{ actorId: fixture.handles.actors.strandA, chemicalFactId: fixture.handles.facts.baseA }, { actorId: fixture.handles.actors.strandB, chemicalFactId: fixture.handles.facts.baseT }], evidence: "CHEMICAL_RULE" }] });
  assert.equal(result.ok, true); if (!result.ok) return; const trace = result.evidence.pair!;
  const deposited = { ...result, evidence: { ...result.evidence, pair: { ...trace, evidence: "DEPOSITED_SOURCE" as const, fidelity: "E0_DEPOSITED" } } }; assert.equal(validateInteractionTopologyEvidence(deposited, fixture.substrate, fixture.chemistry).valid, true);
  const depositedWrong = { ...deposited, evidence: { ...deposited.evidence, pair: { ...deposited.evidence.pair!, fidelity: "C0_COMPUTED" } } }; assert.equal(validateInteractionTopologyEvidence(depositedWrong, fixture.substrate, fixture.chemistry).valid, false);
  const computed = { ...result, evidence: { ...result.evidence, pair: { ...trace, evidence: "COMPUTED" as const, fidelity: "C0_COMPUTED" } } }; assert.equal(validateInteractionTopologyEvidence(computed, fixture.substrate, fixture.chemistry).valid, true);
  const computedWrong = { ...computed, evidence: { ...computed.evidence, pair: { ...computed.evidence.pair!, fidelity: "E0_DEPOSITED" } } }; assert.equal(validateInteractionTopologyEvidence(computedWrong, fixture.substrate, fixture.chemistry).valid, false);
});

test("P2-E evidence validator rejects removing a continuity, change, or constraint trace from real output", () => {
  const connectivity = createConnectivityFixture("rnaCleavage");
  if (!("cleavageSite" in connectivity.handles.facts) || !connectivity.handles.facts.cleavageSite) throw new Error("cleavage fixture lacks cleavage handle");
  const linkId = connectivity.handles.facts.cleavageSite!;
  const link = connectivity.chemistry.linkAssertions.find((item) => item.linkAssertionId === linkId)!;
  const participants = link.endpoints.map((endpoint) => ({ actorId: endpoint.actorId, selectorBindingId: endpoint.selectorBindingId, residueKey: endpoint.residueKey, atomKeys: endpoint.atomKeys })) as [{ actorId: typeof link.endpoints[0]["actorId"]; selectorBindingId: string; residueKey: string; atomKeys: readonly string[] }, { actorId: typeof link.endpoints[1]["actorId"]; selectorBindingId: string; residueKey: string; atomKeys: readonly string[] }];
  const actorScene = { actors: [{ actorId: connectivity.handles.actors.strandA, semanticTypeId: "nucleotide" as const, scope: "residue" as const, instanceId: "fixture-a" }, { actorId: connectivity.handles.actors.strandB, semanticTypeId: "nucleotide" as const, scope: "residue" as const, instanceId: "fixture-b" }], groups: [] };
  const result = groundScientificInteractions({ grounding: connectivity.substrate, actorScene, chemistry: connectivity.chemistry, interactions: [{ interactionId: "link", kind: "phosphodiesterLinkage", participants, chemicalFactId: linkId, evidence: "CHEMICAL_RULE" }], continuities: [{ continuityId: "continuity", strandActorId: connectivity.handles.actors.strandA, orderedActorIds: [connectivity.handles.actors.strandA, connectivity.handles.actors.strandB], state: "intact", chemicalFactId: linkId }], changes: [{ changeId: "cleavage", kind: "cleavage", actorIds: [connectivity.handles.actors.strandA, connectivity.handles.actors.strandB], interactionIds: ["link"], chemicalFactId: linkId }], constraints: [{ constraintId: "requires-link", kind: "requiresParticipant", actorIds: [connectivity.handles.actors.strandA, connectivity.handles.actors.strandB], interactionIds: ["link"] }] });
  assert.equal(result.ok, true); if (!result.ok) return;
  assert.equal(validateInteractionTopologyEvidence(result, connectivity.substrate, connectivity.chemistry).valid, true);
  for (const id of ["continuity", "cleavage", "requires-link"]) { const evidence = { ...result.evidence }; delete evidence[id]; const corrupted: Extract<InteractionTopologyGroundingResult, { ok: true }> = { ...result, evidence }; assert.equal(validateInteractionTopologyEvidence(corrupted, connectivity.substrate, connectivity.chemistry).valid, false); }
});
