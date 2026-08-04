import assert from "node:assert/strict";
import test from "node:test";
import type { PrimitiveKind } from "./primitives.ts";
import {
  primitiveGalleryPrimitives,
  validatePrimitive
} from "./primitives.ts";

const expectedKinds: PrimitiveKind[] = [
  "strand",
  "molecular-complex",
  "particle",
  "membrane",
  "compartment",
  "connector",
  "directional-arrow",
  "field",
  "surface",
  "label",
  "annotation",
  "timeline-event",
  "graph-node",
  "graph-edge"
];

test("gallery includes every scientific primitive kind", () => {
  const kinds = new Set(primitiveGalleryPrimitives.map((primitive) => primitive.kind));

  for (const kind of expectedKinds) {
    assert.equal(kinds.has(kind), true, `missing ${kind}`);
  }
});

test("each primitive carries required generic metadata", () => {
  for (const primitive of primitiveGalleryPrimitives) {
    const validation = validatePrimitive(primitive);

    assert.equal(validation.valid, true, `${primitive.id}: ${validation.errors.join(", ")}`);
    assert.ok(primitive.geometryType);
    assert.ok(primitive.semanticRole);
    assert.ok(primitive.styleToken);
    assert.ok(primitive.transform);
    assert.ok(primitive.visibility.mode);
    assert.equal(typeof primitive.selectable.enabled, "boolean");
    assert.ok(Array.isArray(primitive.animationBindings));
    assert.ok(Array.isArray(primitive.labels));
    assert.ok(Array.isArray(primitive.provenance));
    assert.ok(["literal", "schematic", "mixed"].includes(primitive.classification));
  }
});

test("primitive validation reports malformed primitive metadata", () => {
  const invalid = {
    ...primitiveGalleryPrimitives[0],
    semanticRole: ""
  };
  const validation = validatePrimitive(invalid);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("semanticRole")));
});
