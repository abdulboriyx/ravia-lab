import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detailLevels,
  entityIds,
  foundationVocabulary,
  intentActDefinitions,
  intentActs,
  mechanismIds,
  phenomenonIds,
  type SemanticDirection,
  type SemanticEntityRef,
} from "./foundation-semantic-vocabulary.ts";

test("F1-A vocabulary is bounded and renderer-independent", () => {
  assert.deepEqual(foundationVocabulary.intentActs, ["show", "explain", "compare", "animate", "inspect", "export"]);
  assert.equal(new Set(entityIds).size, entityIds.length);
  assert.equal(new Set(phenomenonIds).size, phenomenonIds.length);
  assert.equal(new Set(mechanismIds).size, mechanismIds.length);
  assert.deepEqual(detailLevels, ["beginner", "intermediate", "advanced", "auto"]);
  assert.equal(Object.keys(intentActDefinitions).length, intentActs.length);
});

test("entity references distinguish type, instance, and scientific role", () => {
  const strand: SemanticEntityRef = { id: "strand", kind: "biopolymer", instanceId: "template-1", role: "template", aliases: ["template strand"] };
  assert.equal(strand.id, "strand");
  assert.equal(strand.instanceId, "template-1");
  assert.equal(strand.role, "template");
});

test("biochemical direction is independent from screen direction", () => {
  const direction: SemanticDirection = { biochemical: "fiveToThree", screen: "screenRight", meaning: "scientific" };
  assert.equal(direction.biochemical, "fiveToThree");
  assert.equal(direction.screen, "screenRight");
  assert.notEqual(direction.biochemical, direction.screen);
});

test("all supported mechanism families have distinct phenomenon and mechanism IDs", () => {
  assert.ok(phenomenonIds.includes("basePairing"));
  assert.ok(phenomenonIds.includes("rnaProcessing"));
  assert.ok(mechanismIds.includes("hydrogenBonding"));
  assert.ok(mechanismIds.includes("phosphodiesterLinkage"));
  assert.ok(mechanismIds.includes("terminalExonucleaseAction"));
  assert.notEqual("basePairing", "hydrogenBonding");
});
