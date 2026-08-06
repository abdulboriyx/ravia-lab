import assert from "node:assert/strict";
import test from "node:test";
import type {
  BiologicalProcessPack,
  CompilationErrorCode,
  PhenomenonPack,
  ScientificEntityKind
} from "./model.ts";
import {
  applyFollowUpCommand,
  applyCounterfactualIntervention,
  compareActiveBranchToBaseline,
  compileBiologicalProcessPack,
  compilePhenomenonPack,
  createCounterfactualBranch,
  createInitialSession,
  deserializeScientificSession,
  dispatchScientificSessionEvent,
  parsePromptWithPacks,
  redoScientificSessionEvent,
  replayScientificSessionEvents,
  resolvePromptIntent,
  resetScientificSession,
  serializeScientificSession,
  startSessionFromPrompt,
  switchScientificBranch,
  undoScientificSessionEvent,
  validateBiologicalProcessPack,
  validateBiologicalProcessPackLayered,
  validatePhenomenonPack,
  validatePhenomenonPackLayered
} from "./model.ts";
import { dnaReplicationPack, validateDnaReplicationPack } from "./dna-process.ts";
import { phenomenonPacks, processPacks } from "./process-registry.ts";
import {
  actionPotentialPack,
  validateActionPotentialPack
} from "./action-potential-process.ts";
import {
  eukaryoticTranscriptionPack,
  validateEukaryoticTranscriptionPack
} from "./transcription-process.ts";
import { orbitPack } from "./orbit-process.ts";

test("generic process-pack validation catches invalid references", () => {
  const validation = validateBiologicalProcessPack(dnaReplicationPack);

  assert.equal(validation.valid, true, validation.errors.join(", "));
});

test("PhenomenonPack is the primary compatible pack contract", () => {
  const packs: PhenomenonPack[] = phenomenonPacks;

  assert.equal(packs.length, processPacks.length);

  for (const pack of packs) {
    const validation = validatePhenomenonPack(pack);
    const layered = validatePhenomenonPackLayered(pack);
    const compiled = compilePhenomenonPack(pack);

    assert.equal(validation.valid, true, validation.errors.join(", "));
    assert.equal(layered.valid, true, layered.errors.map((error) => error.message).join(", "));
    assert.equal(compiled.ok, true);
  }
});

test("PhenomenonPack supports equation-model and spatial component kinds", () => {
  const pack = clonePack();
  const equationKind: ScientificEntityKind = "equation-model";
  const spatialKind: ScientificEntityKind = "spatial-body";

  pack.entities[0] = { ...pack.entities[0], kind: equationKind };
  pack.entities[1] = { ...pack.entities[1], kind: spatialKind };

  const validation = validatePhenomenonPack(pack);
  const compiled = compilePhenomenonPack(pack);

  assert.equal(validation.valid, true, validation.errors.join(", "));
  assert.equal(compiled.ok, true);
});

test("process-specific validation owns pack invariants", () => {
  const validation = validateDnaReplicationPack();

  assert.equal(validation.valid, true, validation.errors.join(", "));
});

test("transcription process-specific validation owns pack invariants", () => {
  const validation = validateEukaryoticTranscriptionPack();

  assert.equal(validation.valid, true, validation.errors.join(", "));
});

test("action potential pack validates as a non-strand mixed representation", () => {
  const validation = validateActionPotentialPack();
  const compiled = compileBiologicalProcessPack(actionPotentialPack);

  assert.equal(validation.valid, true, validation.errors.join(", "));
  assert.equal(compiled.ok, true);

  if (compiled.ok) {
    const kinds = new Set(compiled.renderPlan.primitives.map((primitive) => primitive.kind));
    assert.ok(kinds.has("membrane"));
    assert.ok(kinds.has("molecular-complex"));
    assert.ok(kinds.has("connector"));
    assert.ok(kinds.has("timeline-event"));
    assert.equal(kinds.has("strand"), false);
    assert.equal(compiled.renderPlan.primitives.find((primitive) => primitive.id === "voltage-trace")?.geometryType, "path");
  }
});

test("layered validation returns structured layer results", () => {
  const validation = validateBiologicalProcessPackLayered(dnaReplicationPack);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.abstentionReasons, []);
  assert.ok("schema_integrity" in validation.layers);
  assert.ok("biological_invariants" in validation.layers);
  assert.ok("visualization_honesty" in validation.layers);
});

test("generic prompt parser maps registered pack prompts and abstains on unsupported processes", () => {
  for (const prompt of [...dnaReplicationPack.examples, ...eukaryoticTranscriptionPack.examples]) {
    const result = parsePromptWithPacks(prompt, processPacks);
    assert.equal(result.supported, true, prompt);
  }

  const unsupported = parsePromptWithPacks("Show protein folding", processPacks);
  assert.equal(unsupported.supported, false);
});

test("action potential prompt resolves through the shared process registry", () => {
  const result = parsePromptWithPacks("Show an action potential.", processPacks);

  assert.equal(result.supported, true);

  if (result.supported) {
    assert.equal(result.model.process, actionPotentialPack.process);
    assert.equal(result.model.renderPlan.id, "action-potential-mixed");
  }
});

test("overlapping DNA-to-RNA prompt resolves to transcription through the shared parser", () => {
  const result = parsePromptWithPacks("How is DNA copied into RNA?", processPacks);

  assert.equal(result.supported, true);

  if (result.supported) {
    assert.equal(result.model.process, eukaryoticTranscriptionPack.process);
  }
});

test("holdout routing regression prompts resolve or abstain correctly", () => {
  const duplication = parsePromptWithPacks(
    "Show me how the parental strands separate during DNA duplication.",
    processPacks
  );
  const geneTranscribed = parsePromptWithPacks(
    "Open a model of a gene being transcribed.",
    processPacks
  );
  const rnaNotReplication = parsePromptWithPacks(
    "Show RNA made from DNA, not DNA replication.",
    processPacks
  );
  const polIiFork = parsePromptWithPacks(
    "Show polymerase II at a replication fork.",
    processPacks
  );

  assert.equal(duplication.supported, true);
  assert.equal(geneTranscribed.supported, true);
  assert.equal(rnaNotReplication.supported, true);
  assert.equal(polIiFork.supported, false);

  if (duplication.supported) {
    assert.equal(duplication.model.process, dnaReplicationPack.process);
  }

  if (geneTranscribed.supported) {
    assert.equal(geneTranscribed.model.process, eukaryoticTranscriptionPack.process);
  }

  if (rnaNotReplication.supported) {
    assert.equal(rnaNotReplication.model.process, eukaryoticTranscriptionPack.process);
  }

  assert.match(polIiFork.reason, /RNA polymerase II/i);
});

test("holdout entity alias regressions resolve registered components", () => {
  const centralGravity = resolvePromptIntent(
    "Visualize central gravity in the Earth orbit scene.",
    processPacks
  );
  const jplMarkers = resolvePromptIntent(
    "Show the JPL comparison markers for Earth orbit.",
    processPacks
  );
  const membranePotential = resolvePromptIntent(
    "Show membrane potential rising and falling.",
    processPacks
  );
  const misspelledChannels = resolvePromptIntent(
    "Visualize soduim and potasium currents in a spike.",
    processPacks
  );
  const misspelledHelicase = resolvePromptIntent(
    "Show hellicase unwinding the DNA duplex.",
    processPacks
  );
  const supportedMembranePotential = parsePromptWithPacks(
    "Show membrane potential rising and falling.",
    processPacks
  );
  const supportedMisspelledChannels = parsePromptWithPacks(
    "Visualize soduim and potasium currents in a spike.",
    processPacks
  );
  const supportedMisspelledHelicase = parsePromptWithPacks(
    "Show hellicase unwinding the DNA duplex.",
    processPacks
  );

  assert.equal(centralGravity.processCandidates[0]?.packId, orbitPack.id);
  assert.ok(centralGravity.requestedEntities.includes("gravity-vector"));

  assert.equal(jplMarkers.processCandidates[0]?.packId, orbitPack.id);
  assert.ok(jplMarkers.requestedEntities.includes("jpl-benchmark"));

  assert.equal(membranePotential.processCandidates[0]?.packId, actionPotentialPack.id);
  assert.ok(membranePotential.requestedEntities.includes("membrane-voltage"));

  assert.equal(misspelledChannels.processCandidates[0]?.packId, actionPotentialPack.id);
  assert.ok(misspelledChannels.requestedEntities.includes("sodium-channels"));
  assert.ok(misspelledChannels.requestedEntities.includes("potassium-channels"));

  assert.equal(misspelledHelicase.processCandidates[0]?.packId, dnaReplicationPack.id);
  assert.ok(misspelledHelicase.requestedEntities.includes("helicase"));

  assert.equal(supportedMembranePotential.supported, true);
  assert.equal(supportedMisspelledChannels.supported, true);
  assert.equal(supportedMisspelledHelicase.supported, true);
});

test("holdout unsupported boundary regressions abstain", () => {
  const jupiterPerturbation = parsePromptWithPacks(
    "Show Jupiter perturbing the Earth orbit.",
    processPacks
  );
  const sodiumAfterRepolarization = parsePromptWithPacks(
    "Make sodium channels open after repolarization only.",
    processPacks
  );
  const removeMembrane = parsePromptWithPacks(
    "Remove the cell membrane from an action potential.",
    processPacks
  );
  const calciumOscillation = parsePromptWithPacks(
    "Show calcium oscillations instead of a neuron spike.",
    processPacks
  );
  const templateStrandAmbiguous = parsePromptWithPacks(
    "Show a template strand being used.",
    processPacks
  );

  assert.equal(jupiterPerturbation.supported, false);
  assert.match(jupiterPerturbation.reason, /two-body benchmark|third-body/i);

  assert.equal(sodiumAfterRepolarization.supported, false);
  assert.match(sodiumAfterRepolarization.reason, /depolarization|repolarization/i);

  assert.equal(removeMembrane.supported, false);
  assert.match(removeMembrane.reason, /membrane/i);

  assert.equal(calciumOscillation.supported, false);
  assert.match(calciumOscillation.reason, /calcium oscillations/i);

  assert.equal(templateStrandAmbiguous.supported, false);
  assert.match(templateStrandAmbiguous.reason, /replication and transcription/i);
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
  assert.ok(resolution.confidence >= 0.38);
  assert.deepEqual(resolution.ambiguity, []);
});

test("intent resolver supports paraphrases through normalized terminology", () => {
  const result = parsePromptWithPacks("Visualize RNA polymerase traveling on DNA", processPacks);

  assert.equal(result.supported, true);

  if (result.supported) {
    assert.equal(result.model.process, eukaryoticTranscriptionPack.process);
    assert.ok(result.resolution.requestedEntities.includes("rna-polymerase-ii"));
  }
});

test("intent resolver tolerates misspelled process terms", () => {
  const transcription = parsePromptWithPacks("Show transcripton", processPacks);
  assert.equal(transcription.supported, true);

  if (transcription.supported) {
    assert.equal(transcription.model.process, eukaryoticTranscriptionPack.process);
  }

  const replication = parsePromptWithPacks("Show a replicaton fork", processPacks);
  assert.equal(replication.supported, true);

  if (replication.supported) {
    assert.equal(replication.model.process, dnaReplicationPack.process);
  }
});

test("intent resolver returns clarification for ambiguous overlapping terminology", () => {
  const result = parsePromptWithPacks("Show polymerase", processPacks);

  assert.equal(result.supported, false);
  assert.ok(result.resolution.ambiguity.length > 0);
  assert.ok(result.reason.includes("ambiguous"));
});

test("intent resolver extracts intervention commands from pack metadata", () => {
  const result = parsePromptWithPacks("What happens without ligase?", processPacks);

  assert.equal(result.supported, true);

  if (result.supported) {
    assert.equal(result.model.process, dnaReplicationPack.process);
    assert.equal(result.suggestedCommandId, "compare-no-ligase");
    assert.equal(result.resolution.requestedIntervention?.commandId, "compare-no-ligase");
  }
});

test("prompt incompatibilities are owned by process packs", () => {
  const dnaResult = parsePromptWithPacks("Make ligase copy the leading strand.", processPacks);
  const transcriptionResult = parsePromptWithPacks("Show RNA polymerase reading the coding strand.", processPacks);
  const actionPotentialResult = parsePromptWithPacks("Show sodium channels driving repolarization.", processPacks);

  assert.equal(dnaResult.supported, false);
  assert.equal(transcriptionResult.supported, false);
  assert.equal(actionPotentialResult.supported, false);

  assert.equal(
    dnaReplicationPack.incompatibilityRules.some((rule) => rule.reason === dnaResult.reason),
    true
  );
  assert.equal(
    eukaryoticTranscriptionPack.incompatibilityRules.some((rule) => rule.reason === transcriptionResult.reason),
    true
  );
  assert.equal(
    actionPotentialPack.incompatibilityRules.some((rule) => rule.reason === actionPotentialResult.reason),
    true
  );
});

test("intent resolver abstains on unsupported biology", () => {
  const result = parsePromptWithPacks("Visualize protein folding in a chaperonin", processPacks);

  assert.equal(result.supported, false);
  assert.equal(result.resolution.processCandidates.length, 0);
});

test("compiler reports missing required entities", () => {
  const pack = clonePack();
  pack.entities = pack.entities.filter((entity) => entity.id !== "helicase");

  assertCompileError(pack, "missing_required_entity");
});

test("compiler reports invalid relation targets", () => {
  const pack = clonePack();
  pack.relations = [
    ...pack.relations,
    {
      id: "invalid-target",
      source: pack.entities[0].id,
      target: "missing-entity",
      relation: "points at",
      description: "Invalid relation for compiler test.",
      provenance: [...pack.relations[0].provenance]
    }
  ];

  assertCompileError(pack, "invalid_relation_target");
});

test("compiler reports duplicate IDs", () => {
  const pack = clonePack();
  pack.entities = [...pack.entities, { ...pack.entities[0] }];

  assertCompileError(pack, "duplicate_id");
});

test("compiler reports impossible stage references", () => {
  const pack = clonePack();
  pack.states = [
    ...pack.states,
    {
      id: "invalid-stage",
      label: "Invalid stage",
      order: 99,
      description: "Invalid stage for compiler test.",
      activeEntities: ["missing-entity"],
      provenance: [...pack.states[0].provenance]
    }
  ];

  assertCompileError(pack, "invalid_stage_reference");
});

test("layered validation reports invalid stage order", () => {
  const pack = clonePack();
  pack.states = pack.states.map((state) =>
    state.id === "primed" ? { ...state, order: 4 } : state
  );

  const validation = validateBiologicalProcessPackLayered(pack);

  assert.equal(validation.valid, false);
  assert.ok(validation.layers.stage_order.some((issue) => issue.code === "invalid_stage_order"));
});

test("layered validation reports unit consistency failures", () => {
  const pack = clonePack();
  pack.parameters = pack.parameters.map((parameter) =>
    parameter.id === "fork-position" ? { ...parameter, value: 2 } : parameter
  );

  const validation = validateBiologicalProcessPackLayered(pack);

  assert.equal(validation.valid, false);
  assert.ok(validation.layers.unit_consistency.some((issue) => issue.code === "unit_consistency_failed"));
});

test("compiler reports unsupported interventions", () => {
  const pack = clonePack();
  pack.commandRules = [
    ...pack.commandRules,
    {
      id: "unsupported-intervention-command",
      phrases: ["unsupported intervention"],
      patch: {
        selectedEntities: [pack.entities[0].id],
        activeIntervention: "missing-intervention"
      },
      response: "Invalid command for compiler test."
    }
  ];

  assertCompileError(pack, "unsupported_intervention");
});

test("compiler reports malformed pack-owned incompatibility rules", () => {
  const pack = clonePack();
  pack.incompatibilityRules = [
    ...pack.incompatibilityRules,
    {
      id: "malformed-incompatibility",
      reason: "",
      match: [{ any: [] }]
    }
  ];

  assertCompileError(pack, "missing_required_field");
});

test("compiler reports malformed source metadata", () => {
  const pack = clonePack();
  pack.sources = [{ ...pack.sources[0], locator: "" }];

  assertCompileError(pack, "malformed_source");
});

test("compiler blocks verified claims without claim-level provenance", () => {
  const pack = clonePack();
  pack.assumptions = [
    {
      ...pack.assumptions[0],
      provenance: []
    }
  ];

  assertCompileError(pack, "validation_rule_failed");
});

test("compiler accepts disputed claims when every source has provenance", () => {
  const pack = clonePack();
  const disputed = {
    ...pack.representationRules[0],
    id: "disputed-schematic-choice",
    status: "disputed" as const,
    provenance: [
      {
        ...pack.representationRules[0].provenance[0],
        claimStatus: "disputed" as const,
        disagreementNote: "One source emphasizes enzyme ordering while another emphasizes schematic simplification."
      },
      {
        ...pack.sources[1],
        sourceId: pack.sources[1].id,
        authorsOrInstitution: pack.sources[1].authors,
        supportedClaim: pack.representationRules[0].claim,
        supportType: "schematic-simplification" as const,
        claimStatus: "disputed" as const,
        confidence: 0.75,
        disagreementNote: "Different source emphasis, not a contradiction in core mechanism."
      }
    ]
  };
  pack.representationRules = [disputed, ...pack.representationRules.slice(1)];

  const result = compileBiologicalProcessPack(pack);

  assert.equal(result.ok, true);
});

test("DNA adversarial misconception causes abstention", () => {
  const pack = clonePack();
  pack.representationRules = [
    {
      ...pack.representationRules[0],
      id: "wrong-okazaki-leading",
      claim: "Okazaki fragments occur on the leading strand."
    },
    ...pack.representationRules.slice(1)
  ];

  const validation = validateBiologicalProcessPackLayered(pack);
  const compiled = compileBiologicalProcessPack(pack);

  assert.equal(validation.valid, false);
  assert.ok(validation.abstentionReasons.some((reason) => reason.includes("Okazaki")));
  assert.equal(compiled.ok, false);
});

test("DNA adversarial ligase misconception is rejected", () => {
  const pack = clonePack();
  pack.relations = [
    ...pack.relations,
    {
      ...pack.relations[0],
      id: "wrong-ligase-synthesis",
      source: "ligase",
      target: "okazaki-fragments",
      relation: "synthesizes fragments",
      description: "Ligase synthesizes Okazaki fragments."
    }
  ];

  const validation = validateBiologicalProcessPackLayered(pack);

  assert.equal(validation.valid, false);
  assert.ok(validation.layers.biological_invariants.length > 0);
  assert.ok(validation.abstentionReasons.some((reason) => reason.includes("Ligase")));
});

test("transcription adversarial coding-strand misconception causes abstention", () => {
  const pack = cloneTranscriptionPack();
  pack.representationRules = [
    {
      ...pack.representationRules[0],
      id: "wrong-coding-read",
      claim: "RNA polymerase reads the coding strand during this transcription model."
    },
    ...pack.representationRules.slice(1)
  ];

  const validation = validateBiologicalProcessPackLayered(pack);

  assert.equal(validation.valid, false);
  assert.ok(validation.abstentionReasons.some((reason) => reason.includes("coding strand")));
});

test("transcription adversarial RNA direction misconception causes abstention", () => {
  const pack = cloneTranscriptionPack();
  pack.parameters = pack.parameters.map((parameter) =>
    parameter.id === "rna-synthesis-direction" ? { ...parameter, value: "3' -> 5'" } : parameter
  );
  pack.representationRules = [
    {
      ...pack.representationRules[0],
      id: "wrong-rna-direction",
      claim: "RNA synthesis occurs 3' to 5'."
    },
    ...pack.representationRules.slice(1)
  ];

  const validation = validateBiologicalProcessPackLayered(pack);

  assert.equal(validation.valid, false);
  assert.ok(validation.layers.biological_invariants.length > 0);
  assert.ok(validation.abstentionReasons.some((reason) => reason.includes("RNA synthesis")));
});

test("compiler compiles valid DNA pack into model and render plan", () => {
  const result = compileBiologicalProcessPack(dnaReplicationPack);

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.model.process, dnaReplicationPack.process);
    assert.equal(result.model.renderPlan, result.renderPlan);
    assert.equal(result.renderPlan.id, dnaReplicationPack.animation.planId);
    assert.ok(result.renderPlan.primitives.length > 0);
  }
});

test("compiler compiles valid transcription pack into model and render plan", () => {
  const result = compileBiologicalProcessPack(eukaryoticTranscriptionPack);

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.model.process, eukaryoticTranscriptionPack.process);
    assert.equal(result.model.renderPlan, result.renderPlan);
    assert.equal(result.renderPlan.id, eukaryoticTranscriptionPack.animation.planId);
    assert.ok(result.renderPlan.primitives.length > 0);
  }
});

test("generic command reducer mutates the same active session state via command rules", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    dnaReplicationPack.examples[0],
    processPacks
  );
  assert.ok(session.activeModel);

  const isolateCommand = session.activeModel.commandRules.find(
    (rule) => rule.patch.isolatedEntity && rule.patch.selectedEntities?.length
  );
  assert.ok(isolateCommand);

  const isolated = applyFollowUpCommand(session, isolateCommand.phrases[0]);
  assert.equal(isolated.activeModel, session.activeModel);
  assert.equal(isolated.isolatedEntity, isolateCommand.patch.isolatedEntity);
  assert.deepEqual(isolated.selectedEntities, isolateCommand.patch.selectedEntities);

  const hideCommand = session.activeModel.commandRules.find(
    (rule) => rule.patch.hiddenEntities?.add?.length
  );
  assert.ok(hideCommand);

  const hidden = applyFollowUpCommand(isolated, hideCommand.phrases[0]);
  assert.equal(hidden.activeModel, session.activeModel);

  for (const id of hideCommand.patch.hiddenEntities?.add ?? []) {
    assert.ok(hidden.hiddenEntities.includes(id));
  }

  const graphCommand = session.activeModel.commandRules.find(
    (rule) => rule.patch.representationMode === "graph"
  );
  assert.ok(graphCommand);

  const graph = applyFollowUpCommand(hidden, graphCommand.phrases[0]);
  assert.equal(graph.activeModel, session.activeModel);
  assert.equal(graph.representationMode, "graph");
});

test("transcription follow-up commands use the same session reducer", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    "Show transcription.",
    processPacks
  );
  assert.ok(session.activeModel);
  assert.equal(session.activeModel.process, eukaryoticTranscriptionPack.process);

  const isolated = applyFollowUpCommand(session, "isolate template strand");
  assert.equal(isolated.activeModel, session.activeModel);
  assert.equal(isolated.isolatedEntity, "template-strand");
  assert.deepEqual(isolated.selectedEntities, [
    "template-strand",
    "rna-polymerase-ii",
    "growing-rna-transcript"
  ]);

  const hidden = applyFollowUpCommand(isolated, "hide coding strand");
  assert.equal(hidden.activeModel, session.activeModel);
  assert.ok(hidden.hiddenEntities.includes("coding-strand"));

  const timeline = applyFollowUpCommand(hidden, "switch to timeline");
  assert.equal(timeline.activeModel, session.activeModel);
  assert.equal(timeline.representationMode, "timeline");

  const paused = applyFollowUpCommand(timeline, "pause at initiation");
  assert.equal(paused.playback.playing, false);
  assert.equal(paused.playback.timelinePosition, 0);
});

test("action potential follow-up commands use generic session state", () => {
  const session = startSessionFromPrompt(
    createInitialSession(),
    "Show an action potential.",
    processPacks
  );
  const isolated = applyFollowUpCommand(session, "isolate sodium channels");
  const slowed = applyFollowUpCommand(isolated, "slow depolarization");
  const refractory = applyFollowUpCommand(slowed, "show refractory period");
  const voltage = applyFollowUpCommand(refractory, "switch to voltage graph");

  assert.equal(session.activeModel?.process, actionPotentialPack.process);
  assert.equal(isolated.isolatedEntity, "sodium-channels");
  assert.deepEqual(isolated.selectedEntities, ["sodium-channels", "depolarization", "ion-flow"]);
  assert.equal(slowed.playback.speed, 0.5);
  assert.ok(refractory.selectedEntities.includes("refractory-period"));
  assert.equal(voltage.representationMode, "voltage-graph");
  assert.deepEqual(voltage.selectedEntities, ["membrane-voltage"]);
});

test("event-sourced session replay reproduces current scientific state", () => {
  const started = startSessionFromPrompt(
    createInitialSession(),
    "Show DNA replication.",
    processPacks
  );
  const hidden = applyFollowUpCommand(started, "hide the leading strand");
  const timeline = dispatchScientificSessionEvent(hidden, {
    type: "TIMELINE_MOVED",
    timelinePosition: 0.66
  });
  const graph = dispatchScientificSessionEvent(timeline, {
    type: "REPRESENTATION_CHANGED",
    representationMode: "graph"
  });
  const replayed = replayScientificSessionEvents(graph.eventLog, processPacks);

  assert.equal(replayed.initialPrompt, "Show DNA replication.");
  assert.equal(replayed.selectedProcessPackId, dnaReplicationPack.id);
  assert.equal(replayed.activeModel?.process, graph.activeModel?.process);
  assert.deepEqual(replayed.hiddenEntities, graph.hiddenEntities);
  assert.equal(replayed.representationMode, "graph");
  assert.equal(replayed.playback.timelinePosition, 0.66);
  assert.equal(replayed.validationResults?.valid, true);
  assert.ok(replayed.provenance.length > 0);
  assert.ok(replayed.modelChangeHistory.length > 0);
});

test("undo and redo replay event history without destroying scientific model state", () => {
  const started = startSessionFromPrompt(
    createInitialSession(),
    "Show transcription.",
    processPacks
  );
  const timeline = dispatchScientificSessionEvent(started, {
    type: "REPRESENTATION_CHANGED",
    representationMode: "timeline"
  });
  const hidden = applyFollowUpCommand(timeline, "hide coding strand");
  const undone = undoScientificSessionEvent(hidden, processPacks);
  const redone = redoScientificSessionEvent(undone, processPacks);

  assert.equal(undone.activeModel?.process, eukaryoticTranscriptionPack.process);
  assert.equal(undone.representationMode, "timeline");
  assert.ok(!undone.hiddenEntities.includes("coding-strand"));
  assert.ok(redone.hiddenEntities.includes("coding-strand"));
  assert.equal(redone.activeModel?.process, eukaryoticTranscriptionPack.process);
});

test("session reset is event-sourced and clears active scientific state", () => {
  const started = startSessionFromPrompt(
    createInitialSession(),
    "Show DNA replication.",
    processPacks
  );
  const reset = resetScientificSession(started);
  const replayed = replayScientificSessionEvents(reset.eventLog, processPacks);

  assert.equal(reset.activeModel, null);
  assert.equal(reset.currentPrompt, "");
  assert.equal(replayed.activeModel, null);
  assert.equal(replayed.currentPrompt, "");
});

test("scientific session serialization round-trips through replay", () => {
  const session = applyFollowUpCommand(
    startSessionFromPrompt(createInitialSession(), "What happens without ligase?", processPacks),
    "show process graph"
  );
  const restored = deserializeScientificSession(
    serializeScientificSession(session),
    processPacks
  );

  assert.equal(restored.initialPrompt, "What happens without ligase?");
  assert.equal(restored.selectedProcessPackId, dnaReplicationPack.id);
  assert.deepEqual(restored.hiddenEntities, session.hiddenEntities);
  assert.equal(restored.activeIntervention, session.activeIntervention);
  assert.equal(restored.representationMode, session.representationMode);
  assert.deepEqual(restored.eventLog, session.eventLog);
});

test("representation switching never destroys scientific state", () => {
  const session = applyFollowUpCommand(
    startSessionFromPrompt(createInitialSession(), "Show transcription.", processPacks),
    "isolate template strand"
  );
  const changed = dispatchScientificSessionEvent(session, {
    type: "REPRESENTATION_CHANGED",
    representationMode: "json"
  });

  assert.equal(changed.activeModel?.process, session.activeModel?.process);
  assert.deepEqual(changed.selectedEntities, session.selectedEntities);
  assert.deepEqual(changed.hiddenEntities, session.hiddenEntities);
  assert.equal(changed.isolatedEntity, session.isolatedEntity);
  assert.equal(changed.activeModel?.renderPlan, session.activeModel?.renderPlan);
});

test("counterfactual branch applies typed DNA deltas and reports exact differences", () => {
  const baseline = startSessionFromPrompt(
    createInitialSession(),
    "Show DNA replication.",
    processPacks
  );
  const branched = createCounterfactualBranch(baseline, "No ligase");
  const noLigase = applyCounterfactualIntervention(branched, "remove-ligase");
  const differences = compareActiveBranchToBaseline(noLigase);

  assert.equal(noLigase.activeBranchId, "no-ligase");
  assert.equal(noLigase.branches.length, 2);
  assert.equal(noLigase.activeModel?.parameters.find((parameter) => parameter.id === "ligase-present")?.value, false);
  assert.ok(noLigase.hiddenEntities.includes("ligase"));
  assert.ok(differences.some((difference) => difference.path === "parameters.ligase-present" && difference.source === "direct-intervention"));
  assert.ok(differences.some((difference) => difference.source === "predicted-downstream"));
  assert.ok(differences.some((difference) => difference.source === "unsupported-outcome"));
  assert.ok(differences.every((difference) => ["schematic", "quantitative"].includes(difference.classification)));
});

test("multiple named counterfactual branches remain isolated and reversible", () => {
  const baseline = startSessionFromPrompt(
    createInitialSession(),
    "Show DNA replication.",
    processPacks
  );
  const helicaseBranch = applyCounterfactualIntervention(
    createCounterfactualBranch(baseline, "Helicase stopped"),
    "helicase-stopped"
  );
  const primerBranch = applyCounterfactualIntervention(
    createCounterfactualBranch(switchScientificBranch(helicaseBranch, "baseline"), "No primers"),
    "primer-formation-disabled"
  );
  const backToHelicase = switchScientificBranch(primerBranch, "helicase-stopped");
  const backToBaseline = switchScientificBranch(backToHelicase, "baseline");

  assert.equal(primerBranch.branches.length, 3);
  assert.equal(backToHelicase.activeModel?.parameters.find((parameter) => parameter.id === "fork-rate")?.value, 0);
  assert.equal(backToBaseline.activeModel?.parameters.find((parameter) => parameter.id === "fork-rate")?.value, 1);
  assert.equal(backToBaseline.activeModel?.parameters.find((parameter) => parameter.id === "ligase-present")?.value, true);
  assert.deepEqual(backToBaseline.hiddenEntities, []);
});

test("transcription counterfactuals use process-pack model deltas", () => {
  const baseline = startSessionFromPrompt(
    createInitialSession(),
    "Show transcription.",
    processPacks
  );
  const branch = createCounterfactualBranch(baseline, "No polymerase");
  const noPolymerase = applyCounterfactualIntervention(branch, "rna-polymerase-absent");
  const differences = compareActiveBranchToBaseline(noPolymerase);

  assert.equal(noPolymerase.activeBranchId, "no-polymerase");
  assert.equal(noPolymerase.activeModel?.parameters.find((parameter) => parameter.id === "rna-length")?.value, 0);
  assert.ok(noPolymerase.hiddenEntities.includes("rna-polymerase-ii"));
  assert.ok(differences.some((difference) => difference.path === "entities.rna-polymerase-ii"));
  assert.ok(differences.some((difference) => difference.source === "predicted-downstream"));
});

test("counterfactual branches serialize, replay, undo, and redo", () => {
  const session = applyCounterfactualIntervention(
    createCounterfactualBranch(
      startSessionFromPrompt(createInitialSession(), "Show transcription.", processPacks),
      "Promoter blocked"
    ),
    "promoter-inaccessible"
  );
  const restored = deserializeScientificSession(serializeScientificSession(session), processPacks);
  const undone = undoScientificSessionEvent(session, processPacks);
  const redone = redoScientificSessionEvent(undone, processPacks);

  assert.equal(restored.activeBranchId, session.activeBranchId);
  assert.deepEqual(compareActiveBranchToBaseline(restored), compareActiveBranchToBaseline(session));
  assert.equal(undone.activeBranchId, "promoter-blocked");
  assert.equal(undone.activeModel?.entities.find((entity) => entity.id === "promoter")?.description.includes("Counterfactual state"), false);
  assert.equal(redone.activeModel?.entities.find((entity) => entity.id === "promoter")?.description.includes("Counterfactual state"), true);
});

test("action potential blocked sodium counterfactual is a typed model delta", () => {
  const session = createCounterfactualBranch(
    startSessionFromPrompt(createInitialSession(), "Show an action potential.", processPacks),
    "Blocked sodium"
  );
  const blocked = applyCounterfactualIntervention(session, "blocked-sodium-channels");
  const differences = compareActiveBranchToBaseline(blocked);

  assert.equal(blocked.activeModel?.parameters.find((parameter) => parameter.id === "sodium-channel-available")?.value, false);
  assert.ok(blocked.hiddenEntities.includes("sodium-channels"));
  assert.ok(differences.some((difference) => difference.source === "direct-intervention"));
  assert.ok(differences.some((difference) => difference.source === "predicted-downstream"));
  assert.ok(differences.some((difference) => difference.source === "unsupported-outcome"));
});

function clonePack(): BiologicalProcessPack {
  return clonePackFrom(dnaReplicationPack);
}

function cloneTranscriptionPack(): BiologicalProcessPack {
  return clonePackFrom(eukaryoticTranscriptionPack);
}

function clonePackFrom(pack: BiologicalProcessPack): BiologicalProcessPack {
  return {
    ...pack,
    aliases: [...pack.aliases],
    examples: [...pack.examples],
    biologicalContexts: [...pack.biologicalContexts],
    entities: pack.entities.map((entity) => ({ ...entity, aliases: [...entity.aliases], provenance: entity.provenance.map((item) => ({ ...item })) })),
    relations: pack.relations.map((relation) => ({ ...relation, provenance: relation.provenance.map((item) => ({ ...item })) })),
    states: pack.states.map((state) => ({
      ...state,
      activeEntities: [...state.activeEntities],
      provenance: state.provenance.map((item) => ({ ...item }))
    })),
    transitions: pack.transitions.map((transition) => ({ ...transition, provenance: transition.provenance.map((item) => ({ ...item })) })),
    parameters: pack.parameters.map((parameter) => ({ ...parameter, provenance: parameter.provenance.map((item) => ({ ...item })) })),
    interventions: pack.interventions.map((intervention) => ({
      ...intervention,
      affectedEntities: [...intervention.affectedEntities]
    })),
    assumptions: pack.assumptions.map((claim) => ({ ...claim, provenance: claim.provenance.map((item) => ({ ...item })) })),
    limitations: pack.limitations.map((claim) => ({ ...claim, provenance: claim.provenance.map((item) => ({ ...item })) })),
    sources: pack.sources.map((source) => ({ ...source })),
    representationRules: pack.representationRules.map((claim) => ({ ...claim, provenance: claim.provenance.map((item) => ({ ...item })) })),
    commonMisconceptions: pack.commonMisconceptions.map((claim) => ({ ...claim, provenance: claim.provenance.map((item) => ({ ...item })) })),
    validationRules: pack.validationRules.map((rule) => ({
      ...rule,
      requiredEntities: rule.requiredEntities ? [...rule.requiredEntities] : undefined,
      requiredRelations: rule.requiredRelations?.map((relation) => ({ ...relation })),
      requiredLimitations: rule.requiredLimitations ? [...rule.requiredLimitations] : undefined,
      requiredParameters: rule.requiredParameters?.map((parameter) => ({ ...parameter })),
      requiredStageOrder: rule.requiredStageOrder?.map((ordering) => ({ ...ordering })),
      requiredClaimText: rule.requiredClaimText?.map((textRule) => ({ ...textRule })),
      forbiddenClaimText: rule.forbiddenClaimText?.map((textRule) => ({ ...textRule })),
      forbiddenVerifiedClaimPatterns: rule.forbiddenVerifiedClaimPatterns?.map((pattern) => ({ ...pattern }))
    })),
    incompatibilityRules: pack.incompatibilityRules.map((rule) => ({
      ...rule,
      match: rule.match.map((requirement) => ({ any: [...requirement.any] }))
    })),
    promptRules: pack.promptRules.map((rule) => ({
      ...rule,
      hints: [...rule.hints]
    })),
    commandRules: pack.commandRules.map((rule) => ({
      ...rule,
      phrases: [...rule.phrases],
      patch: {
        ...rule.patch,
        hiddenEntities: rule.patch.hiddenEntities
          ? {
              add: rule.patch.hiddenEntities.add ? [...rule.patch.hiddenEntities.add] : undefined,
              remove: rule.patch.hiddenEntities.remove ? [...rule.patch.hiddenEntities.remove] : undefined,
              reset: rule.patch.hiddenEntities.reset
            }
          : undefined,
        selectedEntities: rule.patch.selectedEntities ? [...rule.patch.selectedEntities] : undefined,
        playback: rule.patch.playback ? { ...rule.patch.playback } : undefined
      }
    })),
    animation: {
      ...pack.animation,
      isolationGroups: Object.fromEntries(
        Object.entries(pack.animation.isolationGroups).map(([key, value]) => [
          key,
          [...value]
        ])
      ),
      primitives: [...pack.animation.primitives]
    },
    scaleDistortions: [...pack.scaleDistortions]
  };
}

function assertCompileError(
  pack: BiologicalProcessPack,
  code: CompilationErrorCode
) {
  const result = compileBiologicalProcessPack(pack);

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.ok(
      result.errors.some((error) => error.code === code),
      `Expected ${code}, got ${result.errors.map((error) => error.code).join(", ")}`
    );
  }
}
