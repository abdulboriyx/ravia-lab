import { actorId, groupId } from "./scientific-actor.ts";
import { claimId, provenanceSourceId } from "./scientific-fidelity-provenance.ts";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import type { TeachingPlan } from "./teaching-plan.ts";

export const teachingPlanFixture: TeachingPlan = {
  schemaVersion: "1",
  planId: "rna-stability-why",
  sceneId: scientificSceneSpecFixtures["rna-dna-stability"].sceneId,
  requestMode: "why",
  learningObjective: "Explain why RNA 2-prime hydroxyl chemistry increases backbone susceptibility relative to DNA.",
  prerequisiteAssumptions: ["A nucleotide includes a sugar and phosphate context."],
  chapters: [
    { chapterId: "observe-local-sugars", order: 1, title: "Observe the matched local sugars", focus: [{ kind: "actor", actorId: actorId("rna-ribose-1") }, { kind: "actor", actorId: actorId("dna-deoxyribose-1") }], narrationCueIds: ["cue-orient"], annotationIds: ["annotation-two-prime"], contrastIds: ["contrast-rna-dna"] },
    { chapterId: "connect-chemistry", order: 2, title: "Connect the hydroxyl difference to susceptibility", focus: [{ kind: "claim", claimId: claimId("rna-two-prime-oh-susceptibility") }], context: [{ kind: "source", sourceId: provenanceSourceId("local-chemistry") }], narrationCueIds: ["cue-explain"], causalStepIds: ["cause-hydroxyl-susceptibility"] },
  ],
  narrationCues: [
    { cueId: "cue-orient", target: { kind: "group", groupId: groupId("group-rna-dna-stability") }, purpose: "orient" },
    { cueId: "cue-explain", target: { kind: "claim", claimId: claimId("rna-two-prime-oh-susceptibility") }, purpose: "explain" },
  ],
  annotations: [{ annotationId: "annotation-two-prime", kind: "contrast", target: { kind: "actor", actorId: actorId("rna-ribose-1") }, text: "RNA carries a 2-prime hydroxyl; the matched DNA sugar does not." }],
  causalSteps: [{ stepId: "cause-hydroxyl-susceptibility", order: 1, cause: { kind: "actor", actorId: actorId("rna-ribose-1") }, effect: { kind: "claim", claimId: claimId("rna-two-prime-oh-susceptibility") }, explanation: "The 2-prime hydroxyl is the relevant local chemical distinction." }],
  contrasts: [{ contrastId: "contrast-rna-dna", left: { kind: "actor", actorId: actorId("rna-ribose-1") }, right: { kind: "actor", actorId: actorId("dna-deoxyribose-1") }, distinction: "The compared sugars differ at the 2-prime position." }],
  misconceptionCorrection: { misconception: "DNA is chemically indestructible.", correction: "DNA lacks RNA's 2-prime hydroxyl but remains chemically reactive.", chapterIds: ["observe-local-sugars", "connect-chemistry"], evidence: [{ kind: "source", sourceId: provenanceSourceId("local-chemistry") }] },
  projections: [
    { audience: "beginner", chapterIds: ["observe-local-sugars"], revealedAnnotationIds: ["annotation-two-prime"] },
    { audience: "intermediate", chapterIds: ["observe-local-sugars", "connect-chemistry"], revealedAnnotationIds: ["annotation-two-prime"] },
    { audience: "advanced", chapterIds: ["observe-local-sugars", "connect-chemistry"], revealedAnnotationIds: ["annotation-two-prime"] },
  ],
};
