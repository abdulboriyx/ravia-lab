import test from "node:test";
import assert from "node:assert/strict";
import { createCanonicalSecretoryPathwayProgram } from "./secretory-pathway.ts";
import { createCanonicalMembraneProteinProgram, evaluateMembraneProteinAtTime, validateMembraneProteinProgram, serializeMembraneProteinProgram, createMembraneProteinTeachingPlan } from "./membrane-protein-topology.ts";
import { compileTeachingChapterProgram } from "./teaching-chapter-program.ts";
import { projectTeachingForAudience } from "./teaching-audience-policy.ts";
import { projectMembraneProteinProductionAtTime, membraneProteinProductionStateAtFrame, validateMembraneProteinProductionProjection } from "./membrane-protein-production.ts";
import { applyCellularMembraneProteinExactFrame } from "./p4-b-exact-frame-runtime.ts";
import { buildScenePackage, buildEmbedPackage } from "./b-f-embed-scene-package.ts";

const membrane = createCanonicalMembraneProteinProgram(createCanonicalSecretoryPathwayProgram());

test("D-E single-pass type-I membrane fixture validates with persistent D-D protein identity", () => {
  const result = validateMembraneProteinProgram(membrane);
  assert.equal(result.valid, true, result.valid ? "" : result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  assert.equal(membrane.topology.proteinId, membrane.secretoryProgram.actors.proteinId);
  assert.deepEqual(membrane.topology.luminalRegionIds, ["n-domain"]);
  assert.deepEqual(membrane.topology.cytosolicRegionIds, ["c-domain"]);
  assert.deepEqual(membrane.topology.transmembraneRegionIds, ["tm-helix-1"]);
  assert.equal(membrane.multipassSupport, "DEFERRED_D_V1");
});

test("D-E preserves domain sidedness across ER, vesicle, Golgi, and plasma membrane", () => {
  const times = [9, 10, 11, 13.5, 14, 14.8, 15.3, 16.2, 16.4];
  const snapshots = times.map((time) => { const result = evaluateMembraneProteinAtTime(membrane, time); if (!result.ok) throw new Error(result.reasons.join("; ")); return result.snapshot; });
  assert.equal(snapshots[0]!.topology.nTerminal, "UNRESOLVED");
  assert.equal(snapshots[2]!.activeMembrane, "ER_MEMBRANE");
  for (const snapshot of snapshots.slice(3, 7)) { assert.equal(snapshot.topology.nTerminal, "LUMINAL"); assert.equal(snapshot.topology.cTerminal, "CYTOSOLIC"); }
  assert.equal(snapshots[7]!.topology.nTerminal, "EXTRACELLULAR");
  assert.equal(snapshots.at(-1)!.activeMembrane, "PLASMA_MEMBRANE");
  assert.equal(snapshots.at(-1)!.topology.nTerminal, "EXTRACELLULAR");
  assert.equal(snapshots.at(-1)!.topology.cTerminal, "CYTOSOLIC");
  assert.equal(snapshots.at(-1)!.proteinId, membrane.topology.proteinId);
});

test("D-E hardens modification locality, quality gating, serialization, and teaching", () => {
  const early = evaluateMembraneProteinAtTime(membrane, 11.8);
  const modified = evaluateMembraneProteinAtTime(membrane, 12.8);
  assert.equal(early.ok && early.snapshot.disulfideState, "ABSENT");
  assert.equal(modified.ok && modified.snapshot.disulfideState, "FORMED");
  assert.equal(modified.ok && modified.snapshot.glycosylationState, "ER_INITIAL");
  const invalid = { ...membrane, topology: { ...membrane.topology, luminalRegionIds: ["c-domain"] } };
  assert.equal(validateMembraneProteinProgram(invalid).valid, false);
  const roundTrip = JSON.parse(serializeMembraneProteinProgram(membrane));
  assert.equal(roundTrip.topology.proteinId, membrane.topology.proteinId);
  const plan = createMembraneProteinTeachingPlan(membrane);
  const compiled = compileTeachingChapterProgram(plan, membrane.secretoryProgram.cellularScene.scene, membrane.secretoryProgram.timeline, membrane.secretoryProgram.cellularScene.cellular);
  assert.equal(compiled.ok, true);
  if (compiled.ok) {
    const audiences = (["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((audience) => projectTeachingForAudience({ teachingPlan: plan, chapterProgram: compiled.program, audience, scene: membrane.secretoryProgram.cellularScene.scene, timeline: membrane.secretoryProgram.timeline, cellular: membrane.secretoryProgram.cellularScene.cellular }));
    assert.equal(audiences.every((audience) => audience.ok), true);
  }
});

test("D-E direct, reverse-scrub, and frame-equivalent topology evaluation is history-invariant", () => {
  const late = evaluateMembraneProteinAtTime(membrane, 16.4);
  const early = evaluateMembraneProteinAtTime(membrane, 10.5);
  const lateAgain = evaluateMembraneProteinAtTime(membrane, 16.4);
  const frame = evaluateMembraneProteinAtTime(membrane, 164 / 10);
  assert.deepEqual(lateAgain, late);
  assert.deepEqual(frame, late);
  assert.equal(early.ok && early.snapshot.finalPlasmaMembrane, false);
});

test("D-E production, P4, and package seams retain topology contracts", async () => {
  const projection = projectMembraneProteinProductionAtTime(membrane, 16.4);
  assert.equal(projection.ok, true);
  if (!projection.ok) return;
  assert.equal(projection.projection.regions.nDomain.side, "EXTRACELLULAR");
  assert.equal(projection.projection.regions.cDomain.side, "CYTOSOLIC");
  assert.deepEqual(membraneProteinProductionStateAtFrame(membrane, 164, 10), projection);
  assert.equal(validateMembraneProteinProductionProjection(membrane, { ...projection.projection, regions: { ...projection.projection.regions, cDomain: { ...projection.projection.regions.cDomain, side: "EXTRACELLULAR" } } }).ok, false);
  const applied = applyCellularMembraneProteinExactFrame(projection.projection, { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque", color: "#101820" } });
  assert.equal(applied.ok, true);
  const plan = createMembraneProteinTeachingPlan(membrane);
  const compiled = compileTeachingChapterProgram(plan, membrane.secretoryProgram.cellularScene.scene, membrane.secretoryProgram.timeline, membrane.secretoryProgram.cellularScene.cellular);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) return;
  const audience = projectTeachingForAudience({ teachingPlan: plan, chapterProgram: compiled.program, audience: "INTERMEDIATE", scene: membrane.secretoryProgram.cellularScene.scene, timeline: membrane.secretoryProgram.timeline, cellular: membrane.secretoryProgram.cellularScene.cellular });
  assert.equal(audience.ok, true);
  if (!audience.ok) return;
  const pkg = await buildScenePackage({ packageId: "membrane-protein-topology", scientificSceneSpec: membrane.secretoryProgram.cellularScene.scene, cellularScientificExtension: membrane.secretoryProgram.cellularScene.cellular, membraneProteinTopology: membrane.topology, scientificTimeline: membrane.secretoryProgram.timeline, teaching: { plan, chapterProgram: compiled.program, audiencePrograms: [audience.program], selectedAudience: "INTERMEDIATE" }, viewer: { schemaVersion: "1", packageVersion: "1", requiredRuntimeVersion: "teaching-runtime-v1", sceneOwner: "secretory-pathway-cellular", capabilityId: "membrane-protein-topology", initialView: "TIME_FOLLOWING", initialTimeSeconds: 16.4, teachingEnabled: true, audience: "INTERMEDIATE", playbackEnabled: true, supportedControls: ["PLAY", "SEEK", "CHAPTER_NAVIGATION", "AUDIENCE_SELECT"], assetResolution: "BUNDLED" }, representation: { owner: "PROCEDURAL", interactiveView: "SUPPORTED", exactFrameExport: "SUPPORTED" }, limitations: ["S2_SCHEMATIC topology presentation"] });
  assert.equal(pkg.ok, true, pkg.ok ? "" : pkg.reasons.join("; "));
  if (pkg.ok) { const embed = await buildEmbedPackage(pkg.package); assert.equal(embed.ok, true); assert.equal(embed.ok && embed.embed.package.membraneProteinTopology?.transmembraneRegionIds[0], "tm-helix-1"); }
});
