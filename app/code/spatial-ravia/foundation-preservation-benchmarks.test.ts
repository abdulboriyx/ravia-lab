import assert from "node:assert/strict";
import test from "node:test";
import { rnaCapabilityRegistry } from "./rna-capability-registry.ts";
import { validateFoundationPreservation } from "./foundation-preservation-benchmarks.ts";
test("F6-C maps Foundation capability claims to existing accepted benchmark behavior", () => { assert.deepEqual(validateFoundationPreservation(), { valid: true, issues: [] }); });
test("F6-C detects support overclaims and fallback-owner drift without changing benchmark expectations", () => { const capability = rnaCapabilityRegistry.find((entry) => entry.capabilityId === "rna-processing")!; const original = capability.presentationOwner; (capability as { presentationOwner: string }).presentationOwner = "RnaVisualSystem"; const result = validateFoundationPreservation(); (capability as { presentationOwner: string }).presentationOwner = original; assert.equal(result.valid, false); if (!result.valid) assert.ok(result.issues.some((issue) => issue.path.includes("presentationOwner"))); });
