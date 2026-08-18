import { actorId, groupId, type ScientificActorScene } from "./scientific-actor.ts";
import type { PresentationIntent } from "./presentation-intent.ts";

/** F2-D examples map current display needs into semantic emphasis only. */
export const presentationIntentActorFixture: ScientificActorScene = {
  actors: [
    { actorId: actorId("rna-ribose-1"), semanticTypeId: "ribose", scope: "chemicalComponent", anchors: [{ id: "two-prime-oh", kind: "atomGroup" }] },
    { actorId: actorId("rna-pre-mrna-1"), semanticTypeId: "mRNA", scientificSubtype: "pre-mRNA", scope: "polymer" },
    { actorId: actorId("rna-mature-mrna-1"), semanticTypeId: "mRNA", scientificSubtype: "mature mRNA", scope: "polymer" },
    { actorId: actorId("dna-deoxyribose-1"), semanticTypeId: "deoxyribose", scope: "chemicalComponent", anchors: [{ id: "two-prime-position", kind: "atomGroup" }] },
    { actorId: actorId("dna-template-strand-1"), semanticTypeId: "strand", role: "templateStrand", scope: "strand", anchors: [{ id: "five-prime-end", kind: "terminus" }, { id: "three-prime-end", kind: "terminus" }] },
    { actorId: actorId("dna-coding-strand-1"), semanticTypeId: "strand", role: "codingStrand", scope: "strand" },
    { actorId: actorId("dna-separation-site-1"), semanticTypeId: "localReactionCenter", scope: "molecularComplex" },
    { actorId: actorId("nucleosome-1"), semanticTypeId: "nucleosome", role: "packagingComplex", scope: "molecularComplex" },
    { actorId: actorId("dna-packaged-1"), semanticTypeId: "dna", scope: "polymer" },
  ],
  groups: [
    { groupId: groupId("group-rna-dna-stability-1"), kind: "comparisonPair", memberActorIds: [actorId("rna-ribose-1"), actorId("dna-deoxyribose-1")] },
    { groupId: groupId("group-dna-packaging-1"), kind: "complexComposition", memberActorIds: [actorId("dna-packaged-1"), actorId("nucleosome-1")] },
  ],
};

export const currentPresentationIntentExamples = {
  rnaLocalChemistry: { mode: "localFocus", focusActorIds: [actorId("rna-ribose-1")], contextActorIds: [], contextSuppression: "nonFocus", regionOfInterest: [{ kind: "anchor", actorId: actorId("rna-ribose-1"), anchorId: "two-prime-oh" }], annotationPriority: [{ kind: "anchor", actorId: actorId("rna-ribose-1"), anchorId: "two-prime-oh" }], motion: "static", audience: "student", detail: "molecular" },
  preVsMatureComparison: { mode: "comparison", focusActorIds: [actorId("rna-pre-mrna-1"), actorId("rna-mature-mrna-1")], contextActorIds: [], contextSuppression: "nonFocus", annotationPriority: [{ kind: "actor", actorId: actorId("rna-pre-mrna-1") }, { kind: "actor", actorId: actorId("rna-mature-mrna-1") }], comparison: { left: { kind: "actor", actorId: actorId("rna-pre-mrna-1") }, right: { kind: "actor", actorId: actorId("rna-mature-mrna-1") } }, motion: "static", audience: "student", detail: "standard" },
  rnaDnaStabilityComparison: { mode: "comparison", focusActorIds: [actorId("rna-ribose-1"), actorId("dna-deoxyribose-1")], contextActorIds: [], contextSuppression: "nonFocus", regionOfInterest: [{ kind: "group", groupId: groupId("group-rna-dna-stability-1") }], annotationPriority: [{ kind: "anchor", actorId: actorId("rna-ribose-1"), anchorId: "two-prime-oh" }, { kind: "anchor", actorId: actorId("dna-deoxyribose-1"), anchorId: "two-prime-position" }], comparison: { left: { kind: "actor", actorId: actorId("rna-ribose-1") }, right: { kind: "actor", actorId: actorId("dna-deoxyribose-1") } }, motion: "static", audience: "student", detail: "molecular" },
  dnaPolarity: { mode: "localFocus", focusActorIds: [actorId("dna-template-strand-1"), actorId("dna-coding-strand-1")], contextActorIds: [], contextSuppression: "none", regionOfInterest: [{ kind: "anchor", actorId: actorId("dna-template-strand-1"), anchorId: "five-prime-end" }, { kind: "anchor", actorId: actorId("dna-template-strand-1"), anchorId: "three-prime-end" }], annotationPriority: [{ kind: "actor", actorId: actorId("dna-template-strand-1") }, { kind: "actor", actorId: actorId("dna-coding-strand-1") }], motion: "static", audience: "student", detail: "standard" },
  strandSeparation: { mode: "mechanismFocus", focusActorIds: [actorId("dna-separation-site-1")], contextActorIds: [actorId("dna-template-strand-1"), actorId("dna-coding-strand-1")], contextSuppression: "allExceptContext", regionOfInterest: [{ kind: "actor", actorId: actorId("dna-separation-site-1") }], annotationPriority: [{ kind: "actor", actorId: actorId("dna-separation-site-1") }], motion: "static", audience: "student", detail: "standard" },
  packagingOverview: { mode: "overview", focusActorIds: [actorId("nucleosome-1")], contextActorIds: [actorId("dna-packaged-1")], contextSuppression: "none", regionOfInterest: [{ kind: "group", groupId: groupId("group-dna-packaging-1") }], annotationPriority: [{ kind: "actor", actorId: actorId("nucleosome-1") }], motion: "static", audience: "general", detail: "overview" },
} as const satisfies Record<string, PresentationIntent>;
