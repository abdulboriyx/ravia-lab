import assert from "node:assert/strict";
import test from "node:test";
import { resolveProductionPromptRoute } from "./production-prompt-router.ts";
import { resolveRnaPresentation } from "./RnaPresentationRouter.ts";

const expected = [
  ["Show DNA", "dna-canonical-structure", "DnaMolecularView"],
  ["Show DNA strand separation", "dna-strand-separation", "DnaStrandSeparationPresentation"],
  ["Show transcription", "transcription-elongation", "GENE_EXPRESSION_CELLULAR_V1"],
  ["Show RNA splicing", "mrna-splicing", "GENE_EXPRESSION_CELLULAR_V1"],
  ["Show translation", "translation-initiation", "GENE_EXPRESSION_CELLULAR_V1"],
  ["Show how a secreted protein moves through the ER and Golgi", "er-targeting", "SECRETORY_PATHWAY_CELLULAR_V1"],
  ["Show kinesin transporting a vesicle", "kinesin-cargo-transport", "INTRACELLULAR_TRANSPORT_CELLULAR_V1"],
  ["Show RTK Ras MAPK signaling", "kinase-cascade", "CELL_SIGNALING_RTK_MAPK_V1"],
] as const;

test("production prompt routing selects the requested owner without generic DNA fallback", () => {
  for (const [prompt, capabilityId, owner] of expected) {
    const route = resolveProductionPromptRoute(prompt);
    assert.equal(route.capabilityId, capabilityId, prompt);
    assert.equal(route.productionOwner, owner, prompt);
    if (prompt !== "Show DNA") assert.notEqual(route.productionOwner, "DnaMolecularView", prompt);
  }
});

test("cellular routes expose canonical P3/P4 availability and explicit renderer status", () => {
  const route = resolveProductionPromptRoute("Show transcription");
  assert.equal(route.p3StateAvailability, "AVAILABLE_VIA_CANONICAL_OWNER");
  assert.equal(route.p4StateAvailability, "AVAILABLE_VIA_CANONICAL_OWNER");
  assert.equal(route.fallback, "none");
  assert.equal(route.rendererOwner, "GeneExpressionProductionView");
});

test("a new unsupported prompt resolves to an explicit route error rather than retaining DNA", () => {
  const route = resolveProductionPromptRoute("Show an unsupported cellular process");
  assert.equal(route.productionOwner, "none");
  assert.equal(route.fallback, "explicit-error");
  assert.equal(route.failure?.code, "PRODUCTION_ROUTE_UNAVAILABLE");
});

test("generic RNA remains an explicit supported RNA presentation route", () => {
  const route = resolveRnaPresentation("show RNA");
  assert.ok(route);
  assert.equal(route?.family, "structure");
  assert.equal(route?.owner, "RnaVisualSystem");
});
