import assert from "node:assert/strict";
import test from "node:test";
import { getScientificPrimitive, scientificPrimitives, validateScientificPrimitiveRegistry } from "./scientific-primitive-registry.ts";

test("F5-C catalogs every available foundational scientific primitive", () => {
  assert.deepEqual(scientificPrimitives.map((primitive) => primitive.id), [
    "dna-duplex", "rna-polymer", "nucleotide", "base-pair", "phosphodiester-linkage", "polarity-endpoints",
    "hydrogen-bond-interaction", "stacking-interaction", "polymer-continuity", "strand-opening", "comparison-group",
    "exon-intron-region", "cleavage-fragments", "terminal-shortening", "local-chemistry-comparison",
  ]);
  assert.deepEqual(validateScientificPrimitiveRegistry(), []);
});

test("registry entries reference F2 vocabulary requirements without defining a scene", () => {
  for (const primitive of scientificPrimitives) {
    assert.ok(primitive.requirements.scientific.length > 0, primitive.id);
    assert.ok(primitive.requirements.actors.semanticTypes.length > 0, primitive.id);
    assert.ok(primitive.requirements.states.length > 0, primitive.id);
    assert.ok(primitive.requirements.fidelity.allowedTiers.length > 0, primitive.id);
  }
});

test("key primitives point at their existing canonical capability sources", () => {
  assert.deepEqual(getScientificPrimitive("dna-duplex").availableFrom, ["DnaVisualSystem.ts"]);
  assert.ok(getScientificPrimitive("strand-opening").availableFrom.includes("TranscriptionDnaTemplate.tsx"));
  assert.deepEqual(getScientificPrimitive("exon-intron-region").availableFrom, ["RnaProcessingPresentation.ts"]);
  assert.ok(getScientificPrimitive("local-chemistry-comparison").availableFrom.includes("RnaLocalChemistryPresentation.ts"));
});

test("registry validation catches incomplete catalog entries", () => {
  const incomplete = [{ ...scientificPrimitives[0]!, reusedBy: [] }, ...scientificPrimitives.slice(1)];
  assert.ok(validateScientificPrimitiveRegistry(incomplete).some((problem) => problem.includes("consumers and sources")));
});
