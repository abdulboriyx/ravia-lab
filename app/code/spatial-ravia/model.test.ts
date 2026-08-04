import assert from "node:assert/strict";
import test from "node:test";
import type {
  BiologicalProcessPack,
  CompilationErrorCode
} from "./model.ts";
import {
  applyFollowUpCommand,
  compileBiologicalProcessPack,
  createInitialSession,
  parsePromptWithPacks,
  resolvePromptIntent,
  startSessionFromPrompt,
  validateBiologicalProcessPack,
  validateBiologicalProcessPackLayered
} from "./model.ts";
import { dnaReplicationPack, validateDnaReplicationPack } from "./dna-process.ts";
import { processPacks } from "./process-registry.ts";
import {
  eukaryoticTranscriptionPack,
  validateEukaryoticTranscriptionPack
} from "./transcription-process.ts";

test("generic process-pack validation catches invalid references", () => {
  const validation = validateBiologicalProcessPack(dnaReplicationPack);

  assert.equal(validation.valid, true, validation.errors.join(", "));
});

test("process-specific validation owns pack invariants", () => {
  const validation = validateDnaReplicationPack();

  assert.equal(validation.valid, true, validation.errors.join(", "));
});

test("transcription process-specific validation owns pack invariants", () => {
  const validation = validateEukaryoticTranscriptionPack();

  assert.equal(validation.valid, true, validation.errors.join(", "));
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

test("overlapping DNA-to-RNA prompt resolves to transcription through the shared parser", () => {
  const result = parsePromptWithPacks("How is DNA copied into RNA?", processPacks);

  assert.equal(result.supported, true);

  if (result.supported) {
    assert.equal(result.model.process, eukaryoticTranscriptionPack.process);
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
      requiredParameters: rule.requiredParameters?.map((parameter) => ({ ...parameter }))
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
