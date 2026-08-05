import assert from "node:assert/strict";
import test from "node:test";
import { compileBiologicalProcessPack } from "./model.ts";
import { dnaReplicationPack, dnaReplicationPhenomenonSpec } from "./dna-process.ts";
import type { PhenomenonSpec } from "./phenomenon-spec.ts";
import { validatePhenomenonSpec } from "./phenomenon-spec.ts";

test("DNA replication PhenomenonSpec validates against the runtime contract", () => {
  const validation = validatePhenomenonSpec(dnaReplicationPhenomenonSpec);

  assert.equal(validation.valid, true, validation.valid ? "" : validation.errors.map((error) => error.message).join(", "));
  assert.equal(dnaReplicationPhenomenonSpec.views[0].evidenceMode, "schematic");
  assert.equal(dnaReplicationPhenomenonSpec.views[1].kind, "molecular-structure");
  assert.equal(dnaReplicationPhenomenonSpec.views[1].structureMapping?.pdbId, "1ZF5");
});

test("compilation rejects a pack with an invalid PhenomenonSpec before scene compilation", () => {
  const spec = cloneSpec();
  spec.components[0].claimIds = ["missing-claim"];
  const compiled = compileBiologicalProcessPack({
    ...dnaReplicationPack,
    phenomenonSpec: spec
  });

  assert.equal(compiled.ok, false);

  if (!compiled.ok) {
    assert.ok(compiled.errors.some((error) => error.path.includes("phenomenonSpec")));
    assert.ok(compiled.errors.some((error) => /unknown claim/i.test(error.message)));
  }
});

test("PhenomenonSpec rejects missing component references", () => {
  const spec = cloneSpec();
  spec.relations[0].targetComponentId = "missing-component";

  assertInvalidIncludes(spec, "unknown target component");
});

test("PhenomenonSpec rejects unknown claim IDs", () => {
  const spec = cloneSpec();
  spec.components[0].claimIds = ["missing-claim"];

  assertInvalidIncludes(spec, "unknown claim");
});

test("PhenomenonSpec rejects unknown source IDs", () => {
  const spec = cloneSpec();
  spec.claims[0].sourceIds = ["missing-source"];

  assertInvalidIncludes(spec, "unknown source");
});

test("PhenomenonSpec rejects reversed parameter bounds", () => {
  const spec = cloneSpec();
  spec.parameters[0].value.bounds = [1, 0];

  assertInvalidIncludes(spec, "bounds must be ordered");
});

test("PhenomenonSpec rejects out-of-range parameter values", () => {
  const spec = cloneSpec();
  spec.parameters[0].value.value = 2;

  assertInvalidIncludes(spec, "outside declared bounds");
});

test("PhenomenonSpec rejects duplicate IDs", () => {
  const spec = cloneSpec();
  spec.components = [...spec.components, { ...spec.components[0] }];

  assertInvalidIncludes(spec, "duplicate id");
});

test("PhenomenonSpec rejects invalid renderer and representation pairs", () => {
  const spec = cloneSpec();
  spec.views[0].renderer = "molstar";

  assertInvalidIncludes(spec, "not allowed");
});

test("PhenomenonSpec rejects literal molecular views without approved coordinates", () => {
  const spec = cloneSpec();
  delete spec.views[1].structureMapping;

  assertInvalidIncludes(spec, "approved deposited structure mapping");
});

test("PhenomenonSpec rejects schematic process views mislabeled as literal", () => {
  const spec = cloneSpec();
  spec.views[0].evidenceMode = "literal";

  assertInvalidIncludes(spec, "cannot be labeled literal");
});

test("PhenomenonSpec rejects invalid timeline keyframes", () => {
  const spec = cloneSpec();
  spec.timeline.keyframes[2].at = 0.1;

  assertInvalidIncludes(spec, "ascending order");
});

test("PhenomenonSpec rejects unsupported interaction targets", () => {
  const spec = cloneSpec();
  spec.interactions[0].targetIds = ["missing-target"];

  assertInvalidIncludes(spec, "unsupported target");
});

test("PhenomenonSpec rejects normalized timelines that claim physical timing", () => {
  const spec = cloneSpec();
  const timelineClaim = spec.claims.find((claim) => claim.id === spec.timeline.duration.claimId);
  assert.ok(timelineClaim);
  timelineClaim.text = "This normalized timeline claims physical timing in seconds.";

  assertInvalidIncludes(spec, "cannot claim physical timing");
});

test("PhenomenonSpec rejects unknown units where quantity meaning is required", () => {
  const spec = cloneSpec();
  spec.timeline.duration.unit = "mystery-unit";

  assertInvalidIncludes(spec, "unknown or unsupported unit");
});

function cloneSpec(): PhenomenonSpec {
  return structuredClone(dnaReplicationPhenomenonSpec);
}

function assertInvalidIncludes(spec: PhenomenonSpec, expectedMessage: string) {
  const validation = validatePhenomenonSpec(spec);

  assert.equal(validation.valid, false);

  if (!validation.valid) {
    assert.ok(
      validation.errors.some((error) => error.message.toLowerCase().includes(expectedMessage.toLowerCase())),
      validation.errors.map((error) => `${error.path}: ${error.message}`).join("\n")
    );
  }
}
