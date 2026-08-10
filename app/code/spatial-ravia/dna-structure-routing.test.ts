import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseSpatialScenePrompt } from "./dna-structure-routing.ts";

const supportedPrompts = [
  "show DNA",
  "show DNA structure",
  "show B-DNA",
  "visualize DNA double helix"
];

test("DNA structure prompts route to the Molstar B-DNA viewer", () => {
  for (const prompt of supportedPrompts) {
    const result = parseSpatialScenePrompt(prompt);

    assert.equal(result.supported, true, prompt);

    if (result.supported) {
      assert.equal(result.command.kind, "SHOW_STRUCTURE");
      assert.equal(result.command.source, prompt.includes("B-DNA") ? "experimental" : result.command.source);
    }
  }
});

test("schematic biological process prompts are unsupported", () => {
  for (const prompt of [
    "show transcription",
    "show eukaryotic transcription",
    "show DNA replication",
    "show a replication fork",
    "show an action potential",
    "show Earth orbit"
  ]) {
    const result = parseSpatialScenePrompt(prompt);

    assert.equal(result.supported, false, prompt);

    if (!result.supported) {
      assert.match(result.reason, /no longer supports schematic biological process simulations/i);
    }
  }
});

test("Spatial Ravia route renders the DNA molecular view directly", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /DnaMolecularView/);
  assert.doesNotMatch(source, /SpatialRaviaPrototype/);
});
