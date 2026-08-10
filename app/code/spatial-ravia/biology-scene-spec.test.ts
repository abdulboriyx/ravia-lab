import test from "node:test";
import assert from "node:assert/strict";
import { BiologySceneSpecSchema } from "./biology-scene-spec.ts";

test("accepts helicase mechanism scene", () => {
  const result = BiologySceneSpecSchema.safeParse({
    intent: "mechanism",
    scale: "complex",

    entities: [
      { id: "dna", name: "DNA", type: "dna" },
      { id: "helicase", name: "Helicase", type: "protein" },
      { id: "rpa", name: "RPA", type: "protein" },
    ],

    relations: [
      {
        subject: "rpa",
        relation: "stabilizes",
        object: "dna",
      },
    ],

    actions: [
      {
        actor: "helicase",
        action: "unwinds",
        target: "dna",
      },
    ],

    renderMode: "mechanistic-3d",
  });

  assert.equal(result.success, true);
});
test("rejects invalid entity types", () => {
  const result = BiologySceneSpecSchema.safeParse({
    intent: "mechanism",
    scale: "complex",
    entities: [
      {
        id: "helicase",
        name: "Helicase",
        type: "spaceship",
      },
    ],
    relations: [],
    actions: [],
    renderMode: "mechanistic-3d",
  });

  assert.equal(result.success, false);
});