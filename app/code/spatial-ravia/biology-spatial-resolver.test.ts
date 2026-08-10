import test from "node:test";
import assert from "node:assert/strict";

import { parseBiologyPrompt } from "./biology-prompt-parser.ts";
import { resolveSpatialPlacements } from "./biology-spatial-resolver.ts";

test("places topoisomerase ahead of helicase", () => {
  const scene = parseBiologyPrompt(
    "where is topoisomerase relative to helicase?"
  );

  const placements = resolveSpatialPlacements(scene);

  const topo = placements.find(
    (p) => p.entityId === "topoisomerase"
  );

  assert.ok(topo);
  assert.equal(topo.position.y, -1.55);
});


test("places primase and RNA primer on DNA", () => {
  const scene = parseBiologyPrompt(
    "show primase making an RNA primer"
  );

  const placements = resolveSpatialPlacements(scene);

  assert.ok(
    placements.some((p) => p.entityId === "primase")
  );

  assert.ok(
    placements.some((p) => p.entityId === "rna-primer")
  );
});

test("places polymerase and daughter strands at the replication fork", () => {
  const scene = parseBiologyPrompt("show polymerase synthesizing DNA");
  const placements = resolveSpatialPlacements(scene);

  assert.ok(placements.some((p) => p.entityId === "polymerase"));
  assert.ok(placements.some((p) => p.entityId === "daughter-leading-strand"));
  assert.ok(placements.some((p) => p.entityId === "daughter-lagging-strand"));
});

test("places RNA primers for leading and lagging synthesis", () => {
  const scene = parseBiologyPrompt("show lagging strand synthesis");
  const placements = resolveSpatialPlacements(scene);

  assert.ok(placements.some((p) => p.entityId === "rna-primer-leading"));
  assert.ok(placements.some((p) => p.entityId === "rna-primer-lagging"));
});

test("places Okazaki fragment and ligase together", () => {
  const scene = parseBiologyPrompt("what joins Okazaki fragments?");
  const placements = resolveSpatialPlacements(scene);

  const fragment = placements.find((p) => p.entityId === "okazaki-fragment");
  const ligase = placements.find((p) => p.entityId === "ligase");

  assert.ok(fragment);
  assert.ok(ligase);
  assert.ok(ligase.position.x > fragment.position.x);
});

test("places 5 prime and 3 prime markers", () => {
  const scene = parseBiologyPrompt(
    "show 5 prime and 3 prime direction during replication"
  );
  const placements = resolveSpatialPlacements(scene);

  assert.ok(placements.some((p) => p.entityId === "template-5-prime"));
  assert.ok(placements.some((p) => p.entityId === "template-3-prime"));
});
