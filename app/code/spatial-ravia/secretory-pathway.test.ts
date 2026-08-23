import test from "node:test";
import assert from "node:assert/strict";
import {
  createCanonicalSecretoryPathwayProgram,
  evaluateSecretoryPathwayAtTime,
  validateSecretoryPathwayProgram,
  serializeSecretoryPathwayProgram,
} from "./secretory-pathway.ts";

const program = createCanonicalSecretoryPathwayProgram();

test("D-D canonical secretory fixture validates and continues the D-C peptide identity", () => {
  const validation = validateSecretoryPathwayProgram(program);
  assert.equal(validation.valid, true, validation.valid ? "" : validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  assert.equal(program.actors.proteinId, program.geneExpression.actors.nascentPeptideId);
  assert.equal(program.actors.proteinId, program.geneExpression.actors.releasedPolypeptideId);
  assert.equal(program.outcome, "SECRETED_PROTEIN");
});

test("D-D exact boundaries preserve targeting, translocation, quality, vesicle, Golgi, fusion, and secretion state", () => {
  const states = new Map([9, 9.2, 9.7, 10, 10.5, 11.3, 11.8, 12.2, 12.8, 13.2, 13.5, 14, 14.4, 14.8, 15, 15.3, 15.8, 16.2, 16.4].map((time) => [time, evaluateSecretoryPathwayAtTime(program, time)]));
  const at = (time: number) => { const result = states.get(time)!; if (!result.ok) throw new Error(result.reasons.join("; ")); return result.snapshot; };
  assert.equal(at(9).proteinLocalization, "CYTOSOL");
  assert.equal(at(9.2).signalState, "SIGNAL_RECOGNIZED");
  assert.equal(at(9.7).proteinLocalization, "ER_MEMBRANE_ASSOCIATED");
  assert.equal(at(10).transloconState, "ENGAGED");
  assert.ok(at(10.5).luminalChainLength <= at(10.5).translatedResidueCount);
  assert.equal(at(11.3).proteinLocalization, "ER_LUMEN");
  assert.equal(at(11.8).foldingState, "PARTIALLY_FOLDED");
  assert.equal(at(12.2).modificationState, "N_LINKED_GLYCAN_ADDED");
  assert.equal(at(12.8).qualityState, "PASS");
  assert.equal(at(13.2).vesicleState, "BUDDING");
  assert.equal(at(13.5).cargoContained, true);
  assert.equal(at(14).golgiCompartment, "CIS");
  assert.equal(at(14.8).golgiCompartment, "TRANS");
  assert.equal(at(15).golgiCompartment, "TGN");
  assert.equal(at(15.3).proteinLocalization, "SECRETORY_VESICLE_LUMEN");
  assert.equal(at(15.8).dockingState, "DOCKED");
  assert.equal(at(16.2).membraneContinuity, "FUSED");
  assert.equal(at(16.4).proteinLocalization, "EXTRACELLULAR_SPACE");
  assert.equal(at(16.4).proteinId, program.actors.proteinId);
});

test("D-D rejects future leakage and serializes canonically", () => {
  const early = evaluateSecretoryPathwayAtTime(program, 12.8);
  assert.equal(early.ok, true);
  if (!early.ok) return;
  assert.equal(early.snapshot.extracellular, false);
  assert.equal(early.snapshot.vesicleId, null);
  assert.equal(early.snapshot.golgiCompartment, "NONE");
  const roundTrip = JSON.parse(serializeSecretoryPathwayProgram(program));
  assert.equal(roundTrip.actors.proteinId, program.actors.proteinId);
  assert.equal(roundTrip.events.length, program.events.length);
});

test("D-D membrane-sidedness and vesicle topology remain explicit", () => {
  const cellular = program.cellularScene.cellular;
  const erProtein = cellular.localizations.find((item) => item.actorId === program.actors.proteinId && item.compartmentId === "er-lumen");
  const translocon = cellular.localizations.find((item) => item.actorId === program.actors.transloconId);
  assert.equal(erProtein?.membraneSide, "LUMINAL");
  assert.equal(translocon?.membraneSide, "CYTOSOLIC");
  assert.equal(cellular.compartments.find((item) => item.compartmentId === "er-lumen")?.enclosingMembraneId, "rough-er");
  assert.equal(cellular.compartments.find((item) => item.compartmentId === "secretory-vesicle-lumen")?.enclosingMembraneId, "secretory-vesicle-membrane");
  assert.equal(cellular.compartmentRelations.some((relation) => relation.kind === "ADJACENT_TO" && relation.subjectId === "plasma-membrane" && relation.objectId === "extracellular-space"), true);
});

test("D-D direct, history, restart, and frame-rate-equivalent evaluations agree", () => {
  const direct = evaluateSecretoryPathwayAtTime(program, 15.8);
  const late = evaluateSecretoryPathwayAtTime(program, 16.4);
  const early = evaluateSecretoryPathwayAtTime(program, 10);
  const lateAgain = evaluateSecretoryPathwayAtTime(program, 16.4);
  assert.deepEqual(lateAgain, late);
  assert.equal(direct.ok && direct.snapshot.dockingState, "DOCKED");
  assert.equal(early.ok && early.snapshot.proteinLocalization, "TRANSLOCON");
  const frameEquivalent = evaluateSecretoryPathwayAtTime(program, 158 / 10);
  assert.deepEqual(frameEquivalent, direct);
});

test("D-D preserves a distinct cytosolic-protein control and rejects premature export", () => {
  const noSignal = { ...program, outcome: "MEMBRANE_PROTEIN" as const, events: [] };
  const control = evaluateSecretoryPathwayAtTime(noSignal, 16.4);
  assert.equal(control.ok, true);
  if (control.ok) assert.equal(control.snapshot.proteinLocalization, "CYTOSOL");
  const invalid = { ...program, events: program.events.map((event) => event.eventId === "er-exit-budding" ? { ...event, at: 12.5 } : event) };
  assert.equal(validateSecretoryPathwayProgram(invalid).valid, false);
});
