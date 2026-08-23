import assert from "node:assert/strict";
import test from "node:test";
import { cellularProductionOwnerComponents } from "./cellular-production-dispatch.ts";
import { resolveProductionPromptRoute } from "./production-prompt-router.ts";

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
