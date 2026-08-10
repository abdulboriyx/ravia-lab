import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFollowUpCommand,
  compileBiologicalProcessPack,
  createInitialSession,
  dispatchScientificSessionEvent,
  parsePromptWithPacks,
  resolvePromptIntent,
  startSessionFromPrompt,
  validateBiologicalProcessPack,
  validateBiologicalProcessPackLayered,
  validatePhenomenonPack
} from "./model.ts";
import { actionPotentialPack, validateActionPotentialPack } from "./action-potential-process.ts";
import { phenomenonPacks, processPacks } from "./process-registry.ts";
import {
  eukaryoticTranscriptionPack,
  validateEukaryoticTranscriptionPack
} from "./transcription-process.ts";
import { orbitPack } from "./orbit-process.ts";

test("registered Spatial RAVIA packs validate and compile", () => {
  assert.deepEqual(processPacks.map((pack) => pack.id), [
    "eukaryotic-transcription",
    "action-potential",
    "two-body-orbit"
  ]);

  for (const pack of phenomenonPacks) {
    assert.equal(validateBiologicalProcessPack(pack).valid, true, pack.id);
    assert.equal(validateBiologicalProcessPackLayered(pack).valid, true, pack.id);
    assert.equal(validatePhenomenonPack(pack).valid, true, pack.id);
    assert.equal(compileBiologicalProcessPack(pack).ok, true, pack.id);
  }
});

test("process-specific validators remain active for supported packs", () => {
  assert.equal(validateEukaryoticTranscriptionPack().valid, true);
  assert.equal(validateActionPotentialPack().valid, true);
});

test("prompt parser routes supported Spatial RAVIA prompts", () => {
  const transcription = parsePromptWithPacks("Show RNA polymerase moving along DNA.", processPacks);
  const actionPotential = parsePromptWithPacks("Show an action potential.", processPacks);
  const orbit = parsePromptWithPacks("Show Earth orbit.", processPacks);

  assert.equal(transcription.supported, true);
  assert.equal(actionPotential.supported, true);
  assert.equal(orbit.supported, true);

  if (transcription.supported) {
    assert.equal(transcription.model.process, eukaryoticTranscriptionPack.process);
  }
  if (actionPotential.supported) {
    assert.equal(actionPotential.model.process, actionPotentialPack.process);
  }
  if (orbit.supported) {
    assert.equal(orbit.model.process, orbitPack.process);
  }
});

test("DNA replication and replication-fork prompts fall through as unsupported", () => {
  for (const prompt of [
    "Show DNA replication.",
    "Show a replication fork.",
    "Show hellicase unwinding the DNA duplex.",
    "What happens without ligase?"
  ]) {
    const result = parsePromptWithPacks(prompt, processPacks);

    assert.equal(result.supported, false, prompt);
    assert.equal(result.resolution.processCandidates.some((candidate) => candidate.packId === "dna-replication"), false);
  }
});

test("intent resolver returns structured fields for a transcription prompt", () => {
  const resolution = resolvePromptIntent(
    "Show RNA polymerase moving along DNA as a timeline",
    processPacks
  );

  assert.equal(resolution.processCandidates[0]?.packId, eukaryoticTranscriptionPack.id);
  assert.equal(resolution.requestedRepresentation, "timeline");
  assert.ok(resolution.requestedEntities.includes("rna-polymerase-ii"));
  assert.ok(resolution.requestedFocus.includes("visualization"));
});

test("follow-up commands preserve supported session state", () => {
  const session = startSessionFromPrompt(createInitialSession(), "Show an action potential.", processPacks);
  const paused = dispatchScientificSessionEvent(session, {
    type: "PLAYBACK_CHANGED",
    playback: { playing: false }
  });
  const isolated = applyFollowUpCommand(paused, "isolate sodium channels");

  assert.equal(paused.playback.playing, false);
  assert.equal(isolated.selectedProcessPackId, actionPotentialPack.id);
  assert.equal(isolated.isolatedEntity, "sodium-channels");
});
