import assert from "node:assert/strict";
import test from "node:test";
import { resolveCapabilitySupport, validateCapabilityPolicyRequest, type CapabilityDescriptor, type CapabilityPolicyRequest } from "./capability-support-policy.ts";

const capabilities: CapabilityDescriptor[] = [
  { capabilityId: "dna.structure", requiredEntityIds: ["dna"], supportedFidelity: "canonical", supportsStatic: true, supportsAnimation: false, supportedOutputKinds: ["scene", "figure"], composableWith: ["dna.transcription"] },
  { capabilityId: "dna.transcription", requiredEntityIds: ["dna", "rna"], supportedFidelity: "deposited", supportsStatic: true, supportsAnimation: true, supportedOutputKinds: ["scene"], composableWith: ["dna.structure"] },
  { capabilityId: "dna.packaging", requiredEntityIds: ["dna"], supportedFidelity: "schematic", supportsStatic: true, supportsAnimation: false, supportedOutputKinds: ["scene"], schematicDisclosure: "Educational packaging schematic." },
];

const request = (clause: CapabilityPolicyRequest["clauses"][number], overrides: Partial<CapabilityPolicyRequest> = {}): CapabilityPolicyRequest => ({ clauses: [clause], allowSchematic: false, allowExplicitStaticSubstitution: false, ...overrides });

test("supported capability compiles immediately", () => {
  const result = resolveCapabilitySupport(request({ clauseId: "structure", capabilityId: "dna.structure", requestedEntityIds: ["dna"], outputKind: "scene" }), capabilities);
  assert.equal(result.status, "SUPPORTED");
  assert.equal(result.compile, true);
});

test("schematic and explicit static substitutions are partial, never silent", () => {
  const schematic = resolveCapabilitySupport(request({ clauseId: "packaging", capabilityId: "dna.packaging", requestedEntityIds: ["dna"], requestedFidelity: "deposited" }, { allowSchematic: true }), capabilities);
  assert.equal(schematic.status, "PARTIALLY_SUPPORTED");
  assert.equal(schematic.disclosure?.schematic, true);
  const animated = resolveCapabilitySupport(request({ clauseId: "structure", capabilityId: "dna.structure", requestedEntityIds: ["dna"], requiresAnimation: true }, { allowExplicitStaticSubstitution: true }), capabilities);
  assert.equal(animated.status, "PARTIALLY_SUPPORTED");
  assert.equal(animated.disclosure?.staticSubstitution, true);
});

test("ambiguous mechanisms and unresolved entities require one clarification", () => {
  const result = resolveCapabilitySupport(request({ clauseId: "ambiguous", candidateCapabilityIds: ["dna.structure", "dna.transcription"], ambiguousMechanism: true }), capabilities);
  assert.equal(result.status, "CLARIFICATION_REQUIRED");
  assert.equal(result.compile, false);
  assert.equal(result.clarification?.required, true);
  assert.equal(result.clarification?.question, "Which scientific entity or mechanism should be shown?");
});

test("misconceptions are rejected before compilation", () => {
  const result = resolveCapabilitySupport(request({ clauseId: "claim", capabilityId: "dna.structure", scientificValidity: "misconception" }), capabilities);
  assert.equal(result.status, "INVALID_SCIENTIFIC_REQUEST");
  assert.equal(result.compile, false);
});

test("unsupported animation and export requests never silently fall back", () => {
  const animation = resolveCapabilitySupport(request({ clauseId: "motion", capabilityId: "dna.structure", requestedEntityIds: ["dna"], requiresAnimation: true }), capabilities);
  assert.equal(animation.status, "UNSUPPORTED");
  const exportRequest = resolveCapabilitySupport(request({ clauseId: "export", capabilityId: "dna.transcription", requestedEntityIds: ["dna", "rna"], outputKind: "export", exportFormat: "gltf" }), capabilities);
  assert.equal(exportRequest.status, "UNSUPPORTED");
});

test("multi-intent requests compile only when capabilities are composable", () => {
  const valid = resolveCapabilitySupport({ clauses: [
    { clauseId: "structure", capabilityId: "dna.structure", requestedEntityIds: ["dna"] },
    { clauseId: "transcription", capabilityId: "dna.transcription", requestedEntityIds: ["dna", "rna"] },
  ], allowSchematic: false, allowExplicitStaticSubstitution: false }, capabilities);
  assert.equal(valid.status, "SUPPORTED");
  const invalid = resolveCapabilitySupport({ clauses: [
    { clauseId: "left", capabilityId: "dna.structure", requestedEntityIds: ["dna"] },
    { clauseId: "right", capabilityId: "dna.packaging", requestedEntityIds: ["dna"] },
  ], allowSchematic: false, allowExplicitStaticSubstitution: false }, capabilities);
  assert.equal(invalid.status, "UNSUPPORTED");
});

test("policy validation rejects unknown fields and malformed descriptors", () => {
  const invalid = { clauses: [{ clauseId: "x", capabilityId: "dna.structure", renderer: "three" }], allowSchematic: false, allowExplicitStaticSubstitution: false } as unknown as CapabilityPolicyRequest;
  const result = validateCapabilityPolicyRequest(invalid, capabilities);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.path.includes("renderer")));
});
