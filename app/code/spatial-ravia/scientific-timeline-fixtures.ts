import { actorId } from "./scientific-actor.ts";
import { provenanceSourceId } from "./scientific-fidelity-provenance.ts";
import { topologyActorFixture, topologyFixture } from "./scientific-topology-fixtures.ts";
import type { ScientificTimeline } from "./scientific-timeline.ts";

export const timelineFixture: ScientificTimeline = {
  schemaVersion: "1",
  timelineId: "timeline-cleavage-demo",
  clock: { duration: 2, unit: "seconds", timeStep: 0.01 },
  initialMechanismStateId: "mechanism-before",
  states: [
    { mechanismStateId: "mechanism-before", scientificStateId: "state-paired", kind: "before", actorIds: [actorId("dna-nucleotide-1"), actorId("dna-nucleotide-2")] },
    { mechanismStateId: "mechanism-transition", scientificStateId: "state-cleaved", kind: "transition", actorIds: [actorId("rna-1"), actorId("rna-fragment-1")], topologyChangeIds: ["change-cleavage-1"] },
    { mechanismStateId: "mechanism-after", scientificStateId: "state-cleaved", kind: "after", actorIds: [actorId("rna-1"), actorId("rna-fragment-1")], topologyChangeIds: ["change-cleavage-1"] },
  ],
  transitions: [
    { transitionId: "transition-cleavage", fromMechanismStateId: "mechanism-before", toMechanismStateId: "mechanism-transition", start: 0.5, end: 1, eventIds: ["break-pair", "shorten-rna"], fidelity: { fidelity: "C0_COMPUTED", sourceId: provenanceSourceId("canonical-model") } },
    { transitionId: "transition-settle", fromMechanismStateId: "mechanism-transition", toMechanismStateId: "mechanism-after", start: 1, end: 1.2, eventIds: ["enter-after"] },
  ],
  events: [
    { eventId: "break-pair", at: 0.6, kind: "bondBroken", actorIds: [actorId("dna-nucleotide-1"), actorId("dna-nucleotide-2")], interactionId: "pairing-1" },
    { eventId: "shorten-rna", at: 0.8, kind: "polymerShortened", actorIds: [actorId("rna-1"), actorId("rna-fragment-1")], amount: 1 },
    { eventId: "enter-after", at: 1, kind: "stateEntered", actorIds: [actorId("rna-fragment-1")], stateId: "state-cleaved" },
  ],
  tracks: [
    { trackId: "rna-coordinate", category: "continuous", channel: "coordinate", actorIds: [actorId("rna-fragment-1")], keyframes: [{ at: 0.5, interpolation: "linear", value: { kind: "coordinate", value: { x: 0, y: 0, z: 0 } } }, { at: 1, interpolation: "linear", value: { kind: "coordinate", value: { x: 1, y: 0, z: 0 } } }] },
    { trackId: "rna-conformation", category: "continuous", channel: "conformation", actorIds: [actorId("rna-fragment-1")], keyframes: [{ at: 0.5, interpolation: "cubic", value: { kind: "conformation", value: { parameter: "endExposure", value: 0 } } }, { at: 1, interpolation: "cubic", value: { kind: "conformation", value: { parameter: "endExposure", value: 1 } } }] },
  ],
  constraints: [
    { constraintId: "events-in-order", kind: "orderedEvents", eventIds: ["break-pair", "shorten-rna", "enter-after"] },
    { constraintId: "retain-fragment", kind: "actorPersistence", actorIds: [actorId("rna-fragment-1")] },
  ],
  chapters: [{ chapterId: "chapter-cleavage", start: 0, end: 1.2, stateIds: ["state-paired", "state-cleaved"], transitionIds: ["transition-cleavage", "transition-settle"], eventIds: ["break-pair", "shorten-rna", "enter-after"] }],
};

export const timelineFixtureContext = {
  actorIds: topologyActorFixture.actors.map((actor) => actor.actorId),
  stateIds: topologyFixture.states.map((state) => state.stateId),
  interactionIds: topologyFixture.topology.interactions.map((interaction) => interaction.interactionId),
  topologyChangeIds: topologyFixture.topology.changes?.map((change) => change.changeId) ?? [],
  sourceIds: [provenanceSourceId("canonical-model")],
} as const;
