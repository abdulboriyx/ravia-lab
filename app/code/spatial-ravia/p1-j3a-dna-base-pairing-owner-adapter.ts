/** P1-J3A: structured adapter for the existing DNA base-pair owner. */
import { capabilityRegistryById, type CapabilityRegistryRecord } from "./capability-registry.ts";
import { createDnaBasePairMechanismSpec, type DnaCanonicalPair } from "./DnaBasePairInteractionPresentation.ts";
import type { DnaMechanismSpec } from "./dna-mechanism-contract.ts";
import { dnaMechanismPresentationOwners, routeDnaMechanismPresentation, type DnaMechanismPresentationRoute } from "./DnaMechanismPresentationRouter.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { validateSceneSpecV1, type SceneSpecV1 } from "./scene-spec-v1.ts";
import type { SemanticIntentV1 } from "./semantic-intent.ts";
import type { ScientificFidelityTier } from "./scientific-fidelity-provenance.ts";

export const basePairingOwnerAdapterVersion = "1" as const;
export type BasePairingOwnerInputV1 = {
  schemaVersion: "1";
  capabilityId: "dna-base-pairing";
  pair: DnaCanonicalPair;
  sceneSpec: SceneSpecV1;
  mechanismSpec: DnaMechanismSpec;
  actorIds: readonly [string, string];
  fidelitySourceIds: readonly string[];
};
export type BasePairingOwnerOutputV1 = {
  kind: "ready";
  adapterVersion: "1";
  owner: typeof dnaMechanismPresentationOwners.basePairing;
  capability: CapabilityRegistryRecord;
  pair: DnaCanonicalPair;
  actorIds: readonly [string, string];
  /** IDs from Foundation topology, when it models individual H-bonds. */
  foundationHydrogenBondInteractionIds: readonly string[];
  /** Canonical interaction IDs retained by the established presentation owner. */
  hydrogenBondInteractionIds: readonly string[];
  semanticIntent: SemanticIntentV1;
  sceneSpec: SceneSpecV1;
  fidelity: { minimumTier: ScientificFidelityTier; sourceIds: readonly string[] };
  route: DnaMechanismPresentationRoute;
  fallbackStatus: "none";
};
export type BasePairingOwnerRejectionCode = "MALFORMED_INPUT" | "MALFORMED_SCENE_SPEC" | "CAPABILITY_MISMATCH" | "SEMANTIC_MISMATCH" | "PAIR_MISMATCH" | "ACTOR_MISMATCH" | "INTERACTION_MISMATCH" | "PROVENANCE_MISMATCH" | "OWNER_MISMATCH";
export type BasePairingOwnerResult = BasePairingOwnerOutputV1 | { kind: "rejected"; adapterVersion: "1"; code: BasePairingOwnerRejectionCode; reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const pairEntities: Record<DnaCanonicalPair, readonly [string, string]> = { "A-T": ["adenine", "thymine"], "G-C": ["guanine", "cytosine"] };
const pairResidues: Record<DnaCanonicalPair, readonly [string, string]> = { "A-T": ["A", "T"], "G-C": ["G", "C"] };
const requiredKeys = ["schemaVersion", "capabilityId", "pair", "sceneSpec", "mechanismSpec", "actorIds", "fidelitySourceIds"] as const;

function reject(code: BasePairingOwnerRejectionCode, reason: string): BasePairingOwnerResult { return { kind: "rejected", adapterVersion: "1", code, reason }; }
function exactKeys(value: unknown, allowed: readonly string[]): boolean { return isRecord(value) && Object.keys(value).every((key) => allowed.includes(key)); }
function sameStructuredValue(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }

function validMechanism(spec: DnaMechanismSpec, pair: DnaCanonicalPair): boolean {
  if (!isRecord(spec) || !exactKeys(spec, ["family", "focus", "scale", "requiredPrimitives", "molecularSelections", "participatingGroups", "interactions", "orientation", "structuralState", "annotations", "representation", "reaction", "structuralSubstrate"])) return false;
  if (!Array.isArray(spec.interactions) || !Array.isArray(spec.molecularSelections)) return false;
  const expected = pairResidues[pair];
  return spec.family === "basePairing" && spec.structuralState === "pairedDuplex" && spec.structuralSubstrate === "existingDnaVisualSystem" && spec.interactions.length === (pair === "A-T" ? 2 : 3) && spec.interactions.every((interaction) => interaction.type === "hydrogenBond" && interaction.state === "present" && interaction.participants.length === 2) && spec.molecularSelections.some((selection) => selection.residueNames?.[0] === expected[0]) && spec.molecularSelections.some((selection) => selection.residueNames?.[0] === expected[1]) && sameStructuredValue(spec, createDnaBasePairMechanismSpec(pair));
}

/** Accepts only already-resolved structured data and delegates to the frozen owner route. */
export function adaptBasePairingOwnerV1(input: unknown): BasePairingOwnerResult {
  if (!isRecord(input) || !exactKeys(input, requiredKeys) || input.schemaVersion !== "1" || input.capabilityId !== "dna-base-pairing" || (input.pair !== "A-T" && input.pair !== "G-C")) return reject("MALFORMED_INPUT", "Base-pair owner input must be a strict v1 structured record.");
  const data = input as BasePairingOwnerInputV1;
  const sceneResult = validateSceneSpecV1(data.sceneSpec); if (!sceneResult.valid) return reject("MALFORMED_SCENE_SPEC", sceneResult.issues.map((issue) => issue.path).join(", "));
  const capability = capabilityRegistryById.get(data.capabilityId); if (!capability || capability.supportStatus === "UNSUPPORTED") return reject("CAPABILITY_MISMATCH", "dna-base-pairing capability is unavailable.");
  const request = data.sceneSpec.semanticIntent.requests.find((candidate) => candidate.phenomenon === "canonicalBasePairing" || candidate.phenomenon === "basePairing");
  const expectedActors = pairEntities[data.pair];
  if (!request || !request.states?.includes("paired")) return reject("SEMANTIC_MISMATCH", "SceneSpec must declare canonical paired base-pair semantics.");
  if (!validMechanism(data.mechanismSpec, data.pair)) return reject("INTERACTION_MISMATCH", "Mechanism specification must be the unchanged canonical owner specification for the declared pair.");
  const actors = data.actorIds.map((id) => data.sceneSpec.scientificScene.actors.find((actor) => actor.actorId === id));
  if (data.actorIds.length !== 2 || actors.some((actor, index) => actor?.semanticTypeId !== expectedActors[index])) return reject("ACTOR_MISMATCH", "Actor IDs must identify the declared canonical bases in canonical order.");
  if (!expectedActors.every((entity) => request.subjects.some((subject) => subject.resolvedId === entity))) return reject("SEMANTIC_MISMATCH", "SceneSpec subjects must preserve both base identities.");
  const topology = data.sceneSpec.scientificScene.topology.interactions;
  const foundationHBonds = topology.filter((interaction) => interaction.type === "hydrogenBond" && interaction.state === "present" && interaction.participants.length === 2 && interaction.participants.every((participant) => data.actorIds.includes(participant.actorId))).map((interaction) => interaction.interactionId);
  const declaredPair = topology.some((interaction) => interaction.type === "basePairing" && interaction.state === "present" && interaction.participants.length === 2 && interaction.participants.every((participant) => data.actorIds.includes(participant.actorId)));
  if (!declaredPair && foundationHBonds.length !== (data.pair === "A-T" ? 2 : 3)) return reject("INTERACTION_MISMATCH", "Foundation topology must preserve a paired canonical interaction or its complete present hydrogen-bond set.");
  const hBondIds = data.mechanismSpec.interactions.map((interaction) => interaction.id);
  if (!data.fidelitySourceIds.length || !data.fidelitySourceIds.every((id) => data.sceneSpec.scientificScene.fidelityProvenance.sources.some((source) => String(source.sourceId) === id))) return reject("PROVENANCE_MISMATCH", "Fidelity source IDs must reference SceneSpec provenance.");
  const route = routeDnaMechanismPresentation(buildDnaMechanismRepresentationPlan(data.mechanismSpec));
  if (route.owner !== dnaMechanismPresentationOwners.basePairing || route.family !== "basePairing") return reject("OWNER_MISMATCH", "Structured input did not resolve to the authoritative base-pair owner.");
  return { kind: "ready", adapterVersion: "1", owner: dnaMechanismPresentationOwners.basePairing, capability, pair: data.pair, actorIds: data.actorIds, foundationHydrogenBondInteractionIds: foundationHBonds, hydrogenBondInteractionIds: hBondIds, semanticIntent: data.sceneSpec.semanticIntent, sceneSpec: data.sceneSpec, fidelity: { minimumTier: capability.fidelityRequirements.minimum as ScientificFidelityTier, sourceIds: data.fidelitySourceIds }, route, fallbackStatus: "none" };
}

export function canonicalBasePairingOwnerInput(sceneSpec: SceneSpecV1, pair: DnaCanonicalPair, actorIds: readonly [string, string], fidelitySourceIds: readonly string[]): BasePairingOwnerInputV1 {
  return { schemaVersion: "1", capabilityId: "dna-base-pairing", pair, sceneSpec, mechanismSpec: createDnaBasePairMechanismSpec(pair), actorIds, fidelitySourceIds };
}
