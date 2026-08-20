import assert from "node:assert/strict";
import test from "node:test";
import { validateSceneSpecV1 } from "./scene-spec-v1.ts";
import { validateScientificSceneSpec } from "./scientific-scene-spec.ts";
import { validateScientificTimeline } from "./scientific-timeline.ts";
import { migrateDnaStrandSeparationPrompt, createDnaStrandSeparationScientificScene, createDnaStrandSeparationTimeline, dnaStrandSeparationTimelineContext, retainedDnaStrandSeparationOwner } from "./f7-dna-strand-separation-migration.ts";

test("F7-B routes a resolved strand-separation prompt through F1/F5/F2/F3/F4 to the retained owner", () => {
  const migration = migrateDnaStrandSeparationPrompt("show DNA strands separating");
  assert.ok(migration);
  assert.equal(migration.semanticIntent.requests[0]!.phenomenon, "strandSeparation");
  assert.equal(migration.capability.capabilityId, "dna-strand-separation");
  assert.equal(migration.presentation.owner, retainedDnaStrandSeparationOwner);
  assert.equal(migration.presentation.family, "strandSeparation");
  assert.equal(validateSceneSpecV1(migration.sceneSpec).valid, true);
});

test("F7-B preserves two persistent strand actors, open/closed states, and the separation interaction change", () => {
  const scene = createDnaStrandSeparationScientificScene();
  assert.equal(validateScientificSceneSpec(scene).valid, true);
  assert.deepEqual(scene.states.map((state) => state.stateId), ["closed-duplex", "locally-open"]);
  assert.deepEqual(scene.states.flatMap((state) => state.actorIds), ["dna-template-1", "dna-coding-1", "dna-template-1", "dna-coding-1"]);
  assert.equal(scene.topology.interactions.find((interaction) => interaction.interactionId === "opened-pair-1")?.state, "absent");
  assert.deepEqual(scene.topology.changes?.[0], { changeId: "change-strand-opening", kind: "separation", actorIds: ["dna-template-1", "dna-coding-1"], interactionIds: ["opened-pair-1"] });
});

test("F7-B timeline uses valid F2 references and does not create a second animation runtime", () => {
  const scene = createDnaStrandSeparationScientificScene();
  const timeline = createDnaStrandSeparationTimeline(scene);
  assert.equal(validateScientificTimeline(timeline, dnaStrandSeparationTimelineContext(scene)).valid, true);
  assert.equal(timeline.tracks.length, 0);
  assert.equal(timeline.events[0]!.interactionId, "opened-pair-1");
  assert.equal(timeline.events[0]!.topologyChangeId, "change-strand-opening");
});

test("F7-B rejects non-strand-separation prompts at ingress", () => {
  assert.equal(migrateDnaStrandSeparationPrompt("show a phosphodiester bond in DNA"), undefined);
});
