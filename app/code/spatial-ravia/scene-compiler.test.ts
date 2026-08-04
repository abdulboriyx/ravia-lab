import assert from "node:assert/strict";
import test from "node:test";
import {
  compileBiologicalProcessPack,
  createInitialSession,
  startSessionFromPrompt
} from "./model.ts";
import { dnaReplicationPack } from "./dna-process.ts";
import { processPacks } from "./process-registry.ts";
import { primitiveBase } from "./primitives.ts";
import {
  compileScene,
  compileSceneFromSession,
  createSceneSnapshot
} from "./scene-compiler.ts";

test("scene compiler produces stable structural snapshots for the same render plan", () => {
  const compiled = compileBiologicalProcessPack(dnaReplicationPack);
  assert.equal(compiled.ok, true);

  if (!compiled.ok) {
    return;
  }

  const first = compileScene(compiled.model, compiled.renderPlan, {
    progress: 0.35,
    showLabels: true,
    showDirectionality: true
  });
  const second = compileScene(compiled.model, compiled.renderPlan, {
    progress: 0.35,
    showLabels: true,
    showDirectionality: true
  });

  assert.deepEqual(createSceneSnapshot(first), createSceneSnapshot(second));
  assert.equal(first.timeline.activeStageId, "fork-open");
  assert.ok(first.nodes.every((node) => node.geometry.type.length > 0));
});

test("scene compiler resolves selection, camera focus, and labels generically", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    "Show DNA replication.",
    processPacks
  );
  const scene = compileSceneFromSession({
    ...session,
    selectedEntities: ["dna-polymerase"],
    playback: {
      ...session.playback,
      showLabels: true,
      showDirectionality: true,
      timelinePosition: 0.5
    }
  });

  assert.ok(scene);
  assert.equal(scene.camera.reason, "selection");
  assert.deepEqual(scene.camera.targetEntityIds, ["dna-polymerase"]);
  assert.ok(scene.nodes.some((node) => node.entityId === "dna-polymerase" && node.selected));
  assert.ok(scene.labels.some((label) => label.visible));
});

test("scene compiler applies hiding and isolation without process-specific renderer checks", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    "Show DNA replication.",
    processPacks
  );
  const scene = compileSceneFromSession({
    ...session,
    hiddenEntities: ["ligase"],
    isolatedEntity: "lagging-strand",
    playback: {
      ...session.playback,
      timelinePosition: 0.75
    }
  });

  assert.ok(scene);
  assert.equal(scene.camera.reason, "isolation");
  assert.ok(
    scene.nodes
      .filter((node) => node.entityId === "ligase")
      .every((node) => !node.visible && node.hiddenReason === "hidden-entity")
  );
  assert.ok(
    scene.nodes
      .filter((node) => node.entityId && node.entityId !== "ligase" && !scene.camera.targetEntityIds.includes(node.entityId))
      .some((node) => !node.visible && node.hiddenReason === "outside-isolation")
  );
});

test("scene compiler synchronizes interventions, stage state, and schematic indicators", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    "What happens without ligase?",
    processPacks
  );
  const scene = compileSceneFromSession({
    ...session,
    activeIntervention: "compare-no-ligase",
    playback: {
      ...session.playback,
      timelinePosition: 0.95
    }
  });

  assert.ok(scene);
  assert.equal(scene.timeline.activeStageId, "ligation");
  assert.ok(scene.overlays.some((overlay) => overlay.id === "compare-no-ligase" && overlay.visible));
  assert.ok(scene.indicators.schematicCount > 0);
  assert.ok(scene.indicators.warning);
});

test("scene compiler resolves relative anchors from process-pack layout hints", () => {
  const compiled = compileBiologicalProcessPack(dnaReplicationPack);
  assert.equal(compiled.ok, true);

  if (!compiled.ok) {
    return;
  }

  const anchor = compiled.renderPlan.primitives.find((primitive) => primitive.geometryType === "circle");
  assert.ok(anchor);

  const anchoredPrimitive = primitiveBase({
    id: "anchored-test-particle",
    kind: "particle",
    entityId: "dna-polymerase",
    geometryType: "circle",
    semanticRole: "anchored test marker",
    styleToken: "accent",
    classification: "schematic",
    layout: {
      anchorId: anchor.id,
      anchorPoint: "center",
      offset: [12, -8]
    },
    geometry: { cx: 0, cy: 0, r: 4 }
  });
  const scene = compileScene(
    compiled.model,
    {
      ...compiled.renderPlan,
      primitives: [...compiled.renderPlan.primitives, anchoredPrimitive]
    },
    { progress: 0.25 }
  );
  const anchorNode = scene.nodes.find((node) => node.id === anchor.id);
  const anchoredNode = scene.nodes.find((node) => node.id === anchoredPrimitive.id);

  assert.ok(anchorNode);
  assert.ok(anchoredNode);
  assert.equal(anchoredNode.geometry.type, "circle");

  if (anchorNode.geometry.type === "circle" && anchoredNode.geometry.type === "circle") {
    assert.equal(anchoredNode.geometry.cx, anchorNode.geometry.cx + 12);
    assert.equal(anchoredNode.geometry.cy, anchorNode.geometry.cy - 8);
  }
});
