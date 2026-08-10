import test from "node:test";
import assert from "node:assert/strict";

import { chooseBiologyRenderer } from "./biology-renderer-router.ts";
import { parseBiologyPrompt } from "./biology-prompt-parser.ts";

test("DNA structure goes to Molstar", () => {
  const scene = parseBiologyPrompt("show DNA");

  assert.equal(
    chooseBiologyRenderer(scene),
    "molstar"
  );
});

test("helicase mechanism goes to Three.js", () => {
  const scene = parseBiologyPrompt(
    "show helicase opening DNA"
  );

  assert.equal(
    chooseBiologyRenderer(scene),
    "three"
  );
});

test("strand stabilization goes to Three.js", () => {
  const scene = parseBiologyPrompt(
    "what keeps bacterial DNA strands apart?"
  );

  assert.equal(
    chooseBiologyRenderer(scene),
    "three"
  );
});

test("replication synthesis prompts go to Three.js", () => {
  const prompts = [
    "show polymerase synthesizing DNA",
    "show leading strand synthesis",
    "show lagging strand synthesis",
    "show an Okazaki fragment",
    "what joins Okazaki fragments?",
    "show ligase sealing the DNA backbone",
    "show 5 prime and 3 prime direction during replication",
  ];

  for (const prompt of prompts) {
    assert.equal(
      chooseBiologyRenderer(parseBiologyPrompt(prompt)),
      "three"
    );
  }
});
