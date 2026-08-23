import test from "node:test";
import assert from "node:assert/strict";
import {
  createCanonicalEukaryoticGeneExpressionProgram,
  deserializeGeneExpressionProgram,
  evaluateGeneExpressionAtTime,
  serializeGeneExpressionProgram,
  validateGeneExpressionProgram,
} from "./cellular-gene-expression.ts";
import { validateTeachingPlan, type TeachingPlan } from "./teaching-plan.ts";

test("canonical eukaryotic gene-expression program is grounded and exact-time queryable", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  assert.deepEqual(validateGeneExpressionProgram(program), { valid: true, issues: [] });
  const before = evaluateGeneExpressionAtTime(program, 0.49);
  const initiation = evaluateGeneExpressionAtTime(program, 0.5);
  const processed = evaluateGeneExpressionAtTime(program, 5);
  const exported = evaluateGeneExpressionAtTime(program, 6);
  const released = evaluateGeneExpressionAtTime(program, 9);
  assert.equal(before.ok && before.snapshot.transcription.rnaLength, 0);
  assert.equal(initiation.ok && initiation.snapshot.transcription.bubbleOpen, true);
  assert.equal(processed.ok && processed.snapshot.processing.mature, true);
  assert.equal(exported.ok && exported.snapshot.exportState.localization, "CYTOSOL");
  assert.equal(released.ok && released.snapshot.translation.state, "RELEASED");
  assert.equal(released.ok && released.snapshot.translation.peptideLength, 2);
  assert.deepEqual(released.ok && released.snapshot.processing.retainedRegionIds, ["exon-1", "exon-2"]);
  assert.deepEqual(released.ok && released.snapshot.processing.removedRegionIds, ["intron-1"]);
});

test("D-C preserves explicit strand semantics, cumulative RNA growth, and serial form", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  assert.equal(program.transcriptionGrounding?.templatePolarity, "THREE_PRIME_TO_FIVE_PRIME");
  assert.equal(program.transcriptionGrounding?.nonTemplatePolarity, "FIVE_PRIME_TO_THREE_PRIME");
  const early = evaluateGeneExpressionAtTime(program, 1.5);
  assert.equal(early.ok && early.snapshot.transcription.rnaLength, 6);
  const roundTrip = deserializeGeneExpressionProgram(serializeGeneExpressionProgram(program));
  assert.deepEqual(roundTrip, program);
});

test("D-C rejects anticodon mismatches and duplicate tRNA site occupancy", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const mismatch = { ...program, events: program.events.map((event) => event.eventId === "trna-a-1" ? { ...event, anticodon: "AAA" } : event) };
  assert.equal(validateGeneExpressionProgram(mismatch).valid, false);
  const duplicate = { ...program, events: [...program.events, { eventId: "bad-site", timelineEventId: "trna-a-2", at: 7.8, kind: "TRNA_SITE_UPDATED" as const, actorIds: [program.actors.transcriptId], tRNAId: program.actors.trnaIds[1], site: "P" as const, charged: true, codonIndex: 1, anticodon: "CGG" }] };
  assert.equal(validateGeneExpressionProgram(duplicate).valid, false);
});

test("transcript and polypeptide identities persist across the full pathway", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  assert.equal(program.actors.transcriptId, program.actors.preMrnaId);
  assert.equal(program.actors.preMrnaId, program.actors.matureMrnaId);
  assert.equal(program.actors.nascentPeptideId, program.actors.releasedPolypeptideId);
  const early = evaluateGeneExpressionAtTime(program, 1.5);
  const late = evaluateGeneExpressionAtTime(program, 7);
  assert.equal(early.ok && early.snapshot.programId, late.ok && late.snapshot.programId);
  assert.equal(late.ok && late.snapshot.translation.peptideId, program.actors.nascentPeptideId);
});

test("direct evaluation is history-independent and event-array order is not authority", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const reordered = { ...program, events: [...program.events].reverse(), timeline: { ...program.timeline, events: [...program.timeline.events].reverse() } };
  const direct = evaluateGeneExpressionAtTime(program, 7.9);
  const reorderedResult = evaluateGeneExpressionAtTime(reordered, 7.9);
  assert.equal(direct.ok, true);
  assert.deepEqual(reorderedResult, direct);
  assert.deepEqual(evaluateGeneExpressionAtTime(program, 9), evaluateGeneExpressionAtTime(program, 9));
});

test("invalid direction, premature maturity, uncharged tRNA, and translation location are rejected", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const wrongDirection = { ...program, directionality: { ...program.directionality, peptideGrowth: "C_TO_N" as never } };
  assert.equal(validateGeneExpressionProgram(wrongDirection).valid, false);
  const premature = { ...program, events: program.events.map((event) => event.eventId === "mature-mrna" ? { ...event, at: 1.1 } : event) };
  assert.equal(validateGeneExpressionProgram(premature).valid, false);
  const uncharged = { ...program, events: program.events.map((event) => event.eventId === "peptide-bond-1" ? { ...event, charged: false } : event) };
  assert.equal(validateGeneExpressionProgram(uncharged).valid, false);
  const invalidTranslation = { ...program, events: program.events.map((event) => event.eventId === "translation-initiated" ? { ...event, at: 4 } : event) };
  assert.equal(validateGeneExpressionProgram(invalidTranslation).valid, false);
});

test("D-C teaching references target cellular compartments and localization without changing older plans", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const ref = { kind: "cellularLocalization" as const, actorId: program.actors.transcriptId, compartmentId: "nucleoplasm" };
  const plan: TeachingPlan = {
    schemaVersion: "3", planId: "gene-expression-teaching", sceneId: program.cellularScene.scene.sceneId, requestMode: "explain",
    learningObjective: "Explain the supplied gene-expression sequence.", prerequisiteAssumptions: [],
    chapters: [{ chapterId: "nuclear-expression", order: 1, title: "Nuclear expression", focus: [ref, { kind: "compartment", compartmentId: "nucleoplasm" }], chapterRole: "EXPLAIN", disclosure: { primaryFocusRefs: [ref], secondaryContextRefs: [], suppressedContextRefs: [], detail: "MECHANISTIC" } }],
    projections: ["beginner", "intermediate", "advanced"].map((audience) => ({ audience: audience as "beginner" | "intermediate" | "advanced", chapterIds: ["nuclear-expression"], revealedAnnotationIds: [] })),
  };
  assert.equal(validateTeachingPlan(plan, program.cellularScene.scene, program.timeline, program.cellularScene.cellular).valid, true);
});
