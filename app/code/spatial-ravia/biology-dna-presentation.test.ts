import assert from "node:assert/strict";
import test from "node:test";
import { BiologySceneSpecSchema } from "./biology-scene-spec.ts";
import {
  deriveDnaPresentationPlan,
  inferDnaSceneFamily,
  isValidDnaPresentationPlan,
  resolveDnaRegions,
} from "./biology-dna-presentation.ts";

const regulationScene = BiologySceneSpecSchema.parse({
  intent: "relation",
  scale: "molecular",
  entities: [
    { id: "dna", name: "DNA", type: "dna" },
  ],
  relations: [],
  dnaRegions: [
    { id: "dna-region:enhancer", kind: "enhancer" },
    { id: "dna-region:promoter", kind: "promoter" },
    { id: "dna-region:gene", kind: "gene" },
  ],
  actions: [],
  renderMode: "mechanistic-3d",
});

test("DNA presentation keeps regulatory features as DNA-attached regions", () => {
  const regions = resolveDnaRegions(regulationScene);
  assert.deepEqual(regions.map((region) => region.kind), ["enhancer", "promoter", "gene"]);
  assert.ok(regions.every((region) => region.id.startsWith("dna-region:")));
  assert.ok(regions.every((region) => region.width > 0));
});

test("DNA presentation plans are static-first, focused, and label-capped", () => {
  const plan = deriveDnaPresentationPlan(regulationScene);
  assert.equal(inferDnaSceneFamily(regulationScene), "sequence-regulation");
  assert.equal(plan.motion, "static-first");
  assert.equal(plan.labelPlacement, "camera-aware-dna-attached");
  assert.deepEqual(plan.terminalMarkers, ["5′", "3′"]);
  assert.ok(plan.focalRoi.span > 0 && plan.focalRoi.span <= 1);
  assert.ok(plan.regions.length <= plan.maximumVisibleLabels);
  assert.equal(isValidDnaPresentationPlan(plan), true);
});
