import test from "node:test";
import assert from "node:assert/strict";
import { parseBiologyPrompt } from "./biology-prompt-parser.ts";

test("parses DNA structure prompt", () => {
  const result = parseBiologyPrompt("show DNA");

  assert.equal(result.intent, "structure");
  assert.equal(result.renderMode, "molecular-structure");
  assert.equal(result.entities[0].id, "dna");
});

test("parses helicase mechanism prompt", () => {
  const result = parseBiologyPrompt("show helicase opening DNA");

  assert.equal(result.intent, "mechanism");
  assert.equal(result.renderMode, "mechanistic-3d");

  assert.deepEqual(result.actions[0], {
    actor: "helicase",
    action: "unwinds",
    target: "dna",
  });
});

test("parses helicase structure prompt", () => {
  const result = parseBiologyPrompt("show helicase");

  assert.equal(result.intent, "structure");
  assert.equal(result.renderMode, "molecular-structure");
  assert.equal(result.entities[0].id, "helicase");
});

test("parses strand stabilization prompt", () => {
  const result = parseBiologyPrompt("what keeps DNA strands apart?");

  assert.equal(result.intent, "relation");

  assert.ok(
    result.entities.some(
      (e) => e.id === "ssdna-binding-protein"
    )
  );

  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "ssdna-binding-protein" &&
        r.relation === "stabilizes"
    )
  );
});

test("parses RPA binding prompt", () => {
  const result = parseBiologyPrompt("show RPA bound to ssDNA");

  assert.equal(result.intent, "relation");

  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "rpa" &&
        r.relation === "binds_to"
    )
  );
});

test("parses topoisomerase relation", () => {
  const result = parseBiologyPrompt(
    "where is topoisomerase relative to helicase?"
  );

  assert.ok(
    result.entities.some((e) => e.id === "topoisomerase")
  );

  assert.ok(
    result.entities.some((e) => e.id === "helicase")
  );
});

test("parses polymerase synthesis", () => {
  const result = parseBiologyPrompt(
    "show polymerase synthesizing DNA"
  );

  assert.equal(result.intent, "mechanism");

  assert.ok(
    result.actions.some(
      (a) =>
        a.actor === "polymerase" &&
        a.action === "synthesizes" &&
        a.target === "daughter-leading-strand"
    )
  );
});

test("parses leading strand synthesis", () => {
  const result = parseBiologyPrompt("show leading strand synthesis");

  assert.equal(result.renderMode, "mechanistic-3d");
  assert.ok(result.entities.some((e) => e.id === "daughter-leading-strand"));
  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "daughter-leading-strand" &&
        r.relation === "continuous_with"
    )
  );
});

test("parses lagging strand synthesis", () => {
  const result = parseBiologyPrompt("show lagging strand synthesis");

  assert.equal(result.renderMode, "mechanistic-3d");
  assert.ok(result.entities.some((e) => e.id === "daughter-lagging-strand"));
  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "okazaki-fragment" &&
        r.relation === "discontinuous_on"
    )
  );
});

test("parses Okazaki fragment prompt", () => {
  const result = parseBiologyPrompt("show an Okazaki fragment");

  assert.ok(result.entities.some((e) => e.id === "okazaki-fragment"));
  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "okazaki-fragment" &&
        r.object === "daughter-lagging-strand"
    )
  );
});

test("parses ligase as the enzyme that joins Okazaki fragments", () => {
  const result = parseBiologyPrompt("what joins Okazaki fragments?");

  assert.ok(result.entities.some((e) => e.id === "ligase"));
  assert.ok(
    result.actions.some(
      (a) =>
        a.actor === "ligase" &&
        a.action === "ligates" &&
        a.target === "okazaki-fragment"
    )
  );
});

test("parses ligase sealing the DNA backbone", () => {
  const result = parseBiologyPrompt(
    "show ligase sealing the DNA backbone"
  );

  assert.ok(result.entities.some((e) => e.id === "ligase"));
  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "ligase" &&
        r.relation === "joins" &&
        r.object === "okazaki-fragment"
    )
  );
});

test("parses 5 prime and 3 prime replication directionality", () => {
  const result = parseBiologyPrompt(
    "show 5 prime and 3 prime direction during replication"
  );

  assert.ok(result.entities.some((e) => e.id === "template-5-prime"));
  assert.ok(result.entities.some((e) => e.id === "template-3-prime"));
  assert.ok(
    result.relations.some(
      (r) =>
        r.subject === "daughter-leading-strand" &&
        r.relation === "direction" &&
        r.object === "5-to-3"
    )
  );
});

test("parses primase mechanism", () => {
  const result = parseBiologyPrompt(
    "show primase making an RNA primer"
  );

  assert.ok(
    result.actions.some(
      (a) =>
        a.actor === "primase" &&
        a.action === "synthesizes" &&
        a.target === "rna-primer"
    )
  );
});

test("understands helicase paraphrases", () => {
  const prompts = [
    "show helicase opening DNA",
    "show helicase unzipping DNA",
    "show helicase unwinding DNA",
    "show helicase opening the duplex",
  ];

  for (const prompt of prompts) {
    const result = parseBiologyPrompt(prompt);

    assert.equal(result.intent, "mechanism");

    assert.ok(
      result.actions.some(
        (a) =>
          a.actor === "helicase" &&
          a.action === "unwinds"
      )
    );
  }
});

test("understands strand stabilization paraphrases", () => {
  const prompts = [
    "what keeps DNA strands apart?",
    "what holds the DNA strands apart?",
    "what keeps the strands separated?",
    "what prevents DNA from reannealing?",
  ];

  for (const prompt of prompts) {
    const result = parseBiologyPrompt(prompt);

    assert.equal(result.intent, "relation");

    assert.ok(
      result.relations.some(
        (r) =>
          r.relation === "stabilizes"
      )
    );
  }
});
test("uses SSB for bacterial strand stabilization", () => {
  const result = parseBiologyPrompt(
    "what keeps bacterial DNA strands apart?"
  );

  assert.ok(
    result.entities.some((e) => e.id === "ssb")
  );
});

test("uses RPA for eukaryotic strand stabilization", () => {
  const result = parseBiologyPrompt(
    "what keeps eukaryotic DNA strands apart?"
  );

  assert.ok(
    result.entities.some((e) => e.id === "rpa")
  );
});

test("uses neutral ssDNA-binding protein when context is unspecified", () => {
  const result = parseBiologyPrompt(
    "what keeps DNA strands apart?"
  );

  assert.ok(
    result.entities.some(
      (e) => e.id === "ssdna-binding-protein"
    )
  );
});




