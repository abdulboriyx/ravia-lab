import assert from "node:assert/strict";
import test from "node:test";
import { cellularProductionOwnerComponents } from "./cellular-production-dispatch.ts";
import { resolveProductionPromptRoute } from "./production-prompt-router.ts";
import { createCanonicalEukaryoticGeneExpressionProgram } from "./cellular-gene-expression.ts";
import { projectGeneExpressionProductionAtTime } from "./gene-expression-production.ts";

test("every routed D-series owner has one mounted production component", () => {
  const prompts = [
    ["Show transcription", "GENE_EXPRESSION_CELLULAR_V1", "GeneExpressionProductionView"],
    ["Show RNA splicing", "GENE_EXPRESSION_CELLULAR_V1", "GeneExpressionProductionView"],
    ["Show translation", "GENE_EXPRESSION_CELLULAR_V1", "GeneExpressionProductionView"],
    ["Show how a secreted protein moves through the ER and Golgi", "SECRETORY_PATHWAY_CELLULAR_V1", "SecretoryPathwayProductionView"],
    ["Show kinesin transporting a vesicle", "INTRACELLULAR_TRANSPORT_CELLULAR_V1", "IntracellularTransportProductionView"],
    ["Show RTK Ras MAPK signaling", "CELL_SIGNALING_RTK_MAPK_V1", "CellularSignalingProductionView"],
  ] as const;
  for (const [prompt, owner, component] of prompts) {
    const route = resolveProductionPromptRoute(prompt);
    assert.equal(route.productionOwner, owner, prompt);
    assert.equal(cellularProductionOwnerComponents[owner], component, prompt);
  }
});

test("transcription visual chapters expose only the canonical exact-time state", () => {
  const program = createCanonicalEukaryoticGeneExpressionProgram();
  const initial = projectGeneExpressionProductionAtTime(program, 0);
  const initiation = projectGeneExpressionProductionAtTime(program, 0.5);
  const earlyElongation = projectGeneExpressionProductionAtTime(program, 1);
  const laterElongation = projectGeneExpressionProductionAtTime(program, 1.5);
  const termination = projectGeneExpressionProductionAtTime(program, 2);
  assert.equal(initial.ok, true);
  assert.equal(initiation.ok, true);
  assert.equal(earlyElongation.ok, true);
  assert.equal(laterElongation.ok, true);
  assert.equal(termination.ok, true);
  if (!initial.ok || !initiation.ok || !earlyElongation.ok || !laterElongation.ok || !termination.ok) return;
  assert.equal(initial.projection.dna.transcriptionBubble, "CLOSED");
  assert.equal(initial.projection.transcription.polymeraseState, "AVAILABLE");
  assert.equal(initial.projection.transcription.visibleRnaLength, 0);
  assert.equal(initiation.projection.dna.transcriptionBubble, "OPEN");
  assert.equal(initiation.projection.transcription.polymeraseState, "INITIATING");
  assert.equal(earlyElongation.projection.transcription.visibleRnaLength, 3);
  assert.equal(laterElongation.projection.transcription.visibleRnaLength, 6);
  assert.equal(termination.projection.dna.transcriptionBubble, "CLOSED");
  assert.equal(termination.projection.transcription.polymeraseState, "TERMINATING_OR_RELEASING");
  assert.equal(termination.projection.transcription.visibleRnaLength, 6);
});
