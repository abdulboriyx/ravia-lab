import assert from "node:assert/strict";
import test from "node:test";
import {
  applyFollowUpCommand,
  createInitialSession,
  dnaReplicationPack,
  parseBiologyPrompt,
  startSessionFromPrompt,
  validateBiologicalProcessPack
} from "./model.ts";

test("DNA replication pack validates and contains required scientific invariants", () => {
  const validation = validateBiologicalProcessPack(dnaReplicationPack);

  assert.equal(validation.valid, true, validation.errors.join(", "));
  assert.ok(
    dnaReplicationPack.parameters.some(
      (parameter) => parameter.id === "directionality" && parameter.value === "5' -> 3'"
    )
  );
  assert.ok(
    dnaReplicationPack.relations.some(
      (relation) =>
        relation.source === "dna-polymerase" &&
        relation.target === "leading-strand" &&
        relation.relation === "extends continuously"
    )
  );
  assert.ok(
    dnaReplicationPack.relations.some(
      (relation) =>
        relation.source === "dna-polymerase" &&
        relation.target === "lagging-strand" &&
        relation.relation === "extends discontinuously"
    )
  );
  assert.ok(
    dnaReplicationPack.relations.some(
      (relation) =>
        relation.source === "okazaki-fragments" &&
        relation.target === "lagging-strand"
    )
  );
  assert.ok(
    dnaReplicationPack.relations.some(
      (relation) => relation.source === "ligase" && relation.relation === "seals nicks"
    )
  );
  assert.ok(
    dnaReplicationPack.limitations.some((limitation) =>
      limitation.includes("molecularly exact")
    )
  );
});

test("prompt parser maps supported DNA prompts and abstains on unsupported processes", () => {
  const supportedPrompts = [
    "How is DNA copied?",
    "Show DNA replication.",
    "Show a replication fork.",
    "Why are Okazaki fragments necessary?",
    "Show bacterial DNA replication.",
    "What happens without ligase?"
  ];

  for (const prompt of supportedPrompts) {
    const result = parseBiologyPrompt(prompt);
    assert.equal(result.supported, true, prompt);
  }

  const unsupported = parseBiologyPrompt("Show protein folding");
  assert.equal(unsupported.supported, false);
});

test("follow-up commands mutate the same active session state", () => {
  const session = startSessionFromPrompt(createInitialSession(), "Show DNA replication.");
  assert.ok(session.activeModel);

  const isolated = applyFollowUpCommand(session, "isolate the lagging strand");
  assert.equal(isolated.activeModel, session.activeModel);
  assert.equal(isolated.isolatedEntity, "lagging-strand");
  assert.deepEqual(isolated.selectedEntities, ["lagging-strand", "okazaki-fragments"]);

  const noLigase = applyFollowUpCommand(isolated, "remove ligase");
  assert.equal(noLigase.activeModel, session.activeModel);
  assert.ok(noLigase.hiddenEntities.includes("ligase"));

  const graph = applyFollowUpCommand(noLigase, "show process graph");
  assert.equal(graph.activeModel, session.activeModel);
  assert.equal(graph.representationMode, "graph");
});
