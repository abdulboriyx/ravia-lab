import { actorId, type ScientificActorScene } from "./scientific-actor.ts";
import type { ScientificTopologyModel } from "./scientific-topology.ts";

export const topologyActorFixture: ScientificActorScene = {
  actors: [
    { actorId: actorId("dna-1"), semanticTypeId: "dna", scope: "polymer", childActorIds: [actorId("dna-template-1"), actorId("dna-coding-1")] },
    { actorId: actorId("dna-template-1"), semanticTypeId: "strand", role: "templateStrand", scope: "strand", parentActorId: actorId("dna-1"), childActorIds: [actorId("dna-nucleotide-1")] , anchors: [{ id: "three-prime", kind: "terminus" }] },
    { actorId: actorId("dna-coding-1"), semanticTypeId: "strand", role: "codingStrand", scope: "strand", parentActorId: actorId("dna-1"), childActorIds: [actorId("dna-nucleotide-2")] },
    { actorId: actorId("dna-nucleotide-1"), semanticTypeId: "nucleotide", scope: "residue", parentActorId: actorId("dna-template-1"), anchors: [{ id: "base-site", kind: "attachment" }] },
    { actorId: actorId("dna-nucleotide-2"), semanticTypeId: "nucleotide", scope: "residue", parentActorId: actorId("dna-coding-1") },
    { actorId: actorId("rna-1"), semanticTypeId: "rna", scope: "polymer" },
    { actorId: actorId("rna-fragment-1"), semanticTypeId: "cleavageFragment", scope: "polymer" },
  ],
  groups: [],
};

export const topologyFixture: ScientificTopologyModel = {
  topology: {
    graphId: "graph-dna-rna-1",
    actorIds: topologyActorFixture.actors.map((actor) => actor.actorId),
    interactions: [
      { interactionId: "bond-o3-p", kind: "covalent", type: "phosphodiesterLinkage", participants: [{ actorId: actorId("dna-nucleotide-1"), anchorId: "base-site" }, { actorId: actorId("dna-nucleotide-2") }], state: "present" },
      { interactionId: "pairing-1", kind: "noncovalent", type: "basePairing", participants: [{ actorId: actorId("dna-nucleotide-1") }, { actorId: actorId("dna-nucleotide-2") }], state: "present" },
      { interactionId: "continuity-1", kind: "semanticRelation", type: "polymerContinuity", participants: [{ actorId: actorId("dna-template-1") }, { actorId: actorId("dna-nucleotide-1") }], state: "present", explanatory: true },
    ],
    continuities: [{ continuityId: "continuity-template", strandActorId: actorId("dna-template-1"), orderedActorIds: [actorId("dna-nucleotide-1"), actorId("dna-nucleotide-2")], state: "intact" }],
    changes: [{ changeId: "change-cleavage-1", kind: "cleavage", actorIds: [actorId("rna-1"), actorId("rna-fragment-1")], interactionIds: ["pairing-1"] }],
  },
  states: [
    { stateId: "state-paired", kind: "paired", actorIds: [actorId("dna-nucleotide-1"), actorId("dna-nucleotide-2")], interactionIds: ["pairing-1"] },
    { stateId: "state-cleaved", kind: "cleaved", actorIds: [actorId("rna-1"), actorId("rna-fragment-1")], continuityIds: ["continuity-template"], topologyChangeIds: ["change-cleavage-1"] },
  ],
  constraints: [{ constraintId: "constraint-continuity", kind: "preservesContinuity", actorIds: [actorId("dna-template-1")], description: "Backbone continuity remains represented while pairing changes." }],
};
