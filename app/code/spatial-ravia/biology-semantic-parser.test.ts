import assert from "node:assert/strict";
import test from "node:test";
import { parseBiologyScenePrompt } from "./biology-parser.ts";
import { parseBiologyPromptSemantically } from "./biology-semantic-parser.ts";
import { validateBiologySceneConsistency } from "./biology-scene-validator.ts";
import { detectBiologyContext } from "./biology-context.ts";
import type { BiologySceneSpec } from "./biology-scene-spec.ts";

function supportedScene(prompt: string) {
  const result = parseBiologyScenePrompt(prompt);
  assert.equal(result.status, "supported", prompt);
  assert.equal(result.status, "supported");
  return result.scene;
}

function semanticScene(prompt: string) {
  const result = parseBiologyPromptSemantically(prompt);
  assert.equal(result.status, "supported", prompt);
  assert.equal(result.status, "supported");
  assert.equal(result.source, "semantic");
  return result.scene;
}

function ids(scene: BiologySceneSpec) {
  return new Set(scene.entities.map((entity) => entity.id));
}

function assertEntities(scene: BiologySceneSpec, entityIds: string[]) {
  const actual = ids(scene);
  for (const entityId of entityIds) {
    assert.ok(actual.has(entityId), `${entityId} missing`);
  }
}

function assertAction(
  scene: BiologySceneSpec,
  actor: string,
  action: string,
  target?: string
) {
  assert.ok(
    scene.actions.some(
      (candidate) =>
        candidate.actor === actor &&
        candidate.action === action &&
        candidate.target === target
    ),
    `${actor}/${action}/${target ?? ""} missing`
  );
}

function assertRelation(
  scene: BiologySceneSpec,
  subject: string,
  relation: string,
  object?: string
) {
  assert.ok(
    scene.relations.some(
      (candidate) =>
        candidate.subject === subject &&
        candidate.relation === relation &&
        (object === undefined || candidate.object === object)
    ),
    `${subject}/${relation}/${object ?? ""} missing`
  );
}

test("semantic helicase paraphrases produce equivalent unwinding scenes", () => {
  const prompts = [
    "show helicase opening DNA",
    "visualize helicase unzipping the duplex",
    "show the protein that unwinds DNA",
  ];

  for (const prompt of prompts) {
    const scene = semanticScene(prompt);
    assert.equal(scene.renderMode, "mechanistic-3d");
    assertEntities(scene, ["dna", "helicase"]);
    assertAction(scene, "helicase", "unwinds", "dna");
  }
});

test("broad DNA replication prompts resolve to canonical temporal fork mechanism", () => {
  const prompts = [
    "show DNA replication",
    "show how DNA replicates",
    "visualize DNA being copied",
    "show a replication fork working",
    "show DNA duplication",
  ];

  for (const prompt of prompts) {
    const scene = semanticScene(prompt);

    assert.equal(scene.renderMode, "mechanistic-3d");
    assert.ok(scene.temporal, `${prompt} did not include temporal data`);
    assertEntities(scene, [
      "dna",
      "fork",
      "helicase",
      "polymerase",
      "daughter-leading-strand",
      "daughter-lagging-strand",
      "okazaki-fragment",
    ]);
    assertAction(scene, "helicase", "unwinds", "dna");
    assertAction(scene, "polymerase", "synthesizes", "daughter-leading-strand");
    assertAction(scene, "polymerase", "synthesizes", "daughter-lagging-strand");
  }
});

test("semantic ssDNA stabilization resolves organism-aware stabilizers", () => {
  const neutral = semanticScene("what keeps DNA strands apart?");
  assertEntities(neutral, ["dna", "ssdna-binding-protein"]);
  assertRelation(neutral, "ssdna-binding-protein", "stabilizes", "dna");

  const bacterial = semanticScene("what stabilizes bacterial single-stranded DNA?");
  assertEntities(bacterial, ["dna", "ssb"]);
  assertRelation(bacterial, "ssb", "stabilizes", "dna");

  const human = semanticScene("what coats exposed DNA in human cells?");
  assertEntities(human, ["dna", "rpa"]);
  assertRelation(human, "rpa", "stabilizes", "dna");

  const humanApart = semanticScene("what keeps human DNA strands apart?");
  assertEntities(humanApart, ["dna", "rpa"]);
  assertRelation(humanApart, "rpa", "stabilizes", "dna");
});

test("semantic topoisomerase paraphrases resolve ahead-of-helicase relation", () => {
  for (const prompt of [
    "where is topoisomerase relative to helicase?",
    "what relieves torsional strain ahead of the fork?",
    "show the enzyme acting ahead of helicase",
  ]) {
    const scene = semanticScene(prompt);
    assertEntities(scene, ["dna", "topoisomerase", "helicase"]);
    assertRelation(scene, "topoisomerase", "acts_ahead_of", "helicase");
  }
});

test("semantic primase paraphrases resolve primer synthesis", () => {
  for (const prompt of [
    "show primase making an RNA primer",
    "where does the RNA primer come from?",
    "show primer synthesis",
  ]) {
    const scene = semanticScene(prompt);
    assertEntities(scene, ["dna", "primase", "rna-primer"]);
    assertAction(scene, "primase", "synthesizes", "rna-primer");
    assertRelation(scene, "rna-primer", "attached_to", "dna");
  }
});

test("semantic polymerase paraphrases resolve daughter-strand synthesis", () => {
  for (const prompt of [
    "show polymerase synthesizing DNA",
    "show polymerase extending the daughter strand",
    "visualize DNA copying by polymerase",
  ]) {
    const scene = semanticScene(prompt);
    assertEntities(scene, ["dna", "polymerase", "daughter-leading-strand"]);
    assertAction(scene, "polymerase", "synthesizes", "daughter-leading-strand");
  }
});

test("semantic leading and lagging prompts resolve continuity differences", () => {
  const leading = semanticScene("show continuous strand synthesis");
  assertRelation(leading, "daughter-leading-strand", "continuous_with", "fork");

  const lagging = semanticScene("show discontinuous synthesis");
  assertRelation(lagging, "okazaki-fragment", "discontinuous_on", "lagging-template");

  const comparison = semanticScene("show the difference between leading and lagging synthesis");
  assertRelation(comparison, "daughter-leading-strand", "continuous_with", "fork");
  assertRelation(comparison, "okazaki-fragment", "discontinuous_on", "lagging-template");
});

test("semantic Okazaki and ligase prompts resolve fragment joining", () => {
  const fragment = semanticScene("show Okazaki fragments");
  assertEntities(fragment, ["okazaki-fragment", "daughter-lagging-strand"]);

  for (const prompt of [
    "what joins Okazaki fragments?",
    "show ligase sealing DNA",
    "what closes the nick between fragments?",
  ]) {
    const scene = semanticScene(prompt);
    assertEntities(scene, ["ligase", "okazaki-fragment"]);
    assertAction(scene, "ligase", "ligates", "okazaki-fragment");
    assertRelation(scene, "ligase", "joins", "okazaki-fragment");
  }
});

test("semantic directionality prompts resolve 5-to-3 representation", () => {
  for (const prompt of [
    "show 5 prime and 3 prime direction",
    "show DNA synthesis direction",
    "which direction does polymerase synthesize DNA?",
  ]) {
    const scene = semanticScene(prompt);
    assertEntities(scene, ["template-5-prime", "template-3-prime", "5-to-3"]);
    assertRelation(scene, "daughter-leading-strand", "direction", "5-to-3");
  }
});

test("ambiguous prompts remain unsupported instead of inventing scenes", () => {
  for (const prompt of [
    "show something interesting",
    "show the replication helper",
    "make DNA cool",
    "show mitochondria exploding into pizza",
  ]) {
    const result = parseBiologyScenePrompt(prompt);
    assert.equal(result.status, "unsupported", prompt);
    assert.ok(result.confidence < 0.72, prompt);
  }
});

test("deterministic fallback still supports exact existing prompts", () => {
  const result = parseBiologyScenePrompt("show helicase unzipping DNA");

  assert.equal(result.status, "supported");
  assert.equal(result.status, "supported");
  assert.ok(["deterministic", "semantic"].includes(result.source));
  assertAction(result.scene, "helicase", "unwinds", "dna");
});

test("consistency validator rejects dangling references and organism mixups", () => {
  const dangling = validateBiologySceneConsistency(
    {
      intent: "mechanism",
      scale: "complex",
      entities: [{ id: "dna", name: "DNA", type: "dna" }],
      relations: [{ subject: "missing", relation: "binds_to", object: "dna" }],
      actions: [],
      renderMode: "mechanistic-3d",
    },
    detectBiologyContext("")
  );
  assert.equal(dangling.ok, false);

  const mixed = validateBiologySceneConsistency(
    {
      intent: "relation",
      scale: "complex",
      entities: [
        { id: "dna", name: "DNA", type: "dna" },
        { id: "rpa", name: "RPA", type: "protein" },
      ],
      relations: [{ subject: "rpa", relation: "stabilizes", object: "dna" }],
      actions: [],
      renderMode: "mechanistic-3d",
    },
    detectBiologyContext("bacterial")
  );
  assert.equal(mixed.ok, false);
});
