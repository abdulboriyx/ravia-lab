import test from "node:test";
import assert from "node:assert/strict";
import { provenanceSourceId, type ScientificProvenanceSource } from "./scientific-fidelity-provenance.ts";
import { resolveStructureContext, type StructureCoordinateInventory } from "./p2-d-structure-context.ts";
import type { ValidatedProvenanceSource } from "./scientific-source-provenance-resolver.ts";

const source: ScientificProvenanceSource = { sourceId: provenanceSourceId("p2-d-4v5c"), sourceType: "depositedStructure", accessionOrEntryId: "4V5C", structure: { structureId: "4V5C", assemblyId: "1" }, provider: { id: "RCSB-PDB" }, citationReference: "pdb-4v5c", licenseReference: "rcsb", contentHash: "pending:p2-d-4v5c", quality: { sourceConfidence: 0.95 } };
const validatedSource = Object.defineProperty(source, "__p2BValidated", { value: true, enumerable: false }) as ValidatedProvenanceSource;
const base: StructureCoordinateInventory = { asymmetricUnit: { chainIds: ["A"], modelNumbers: [1] }, biologicalAssemblies: [{ assemblyId: "1", chainIds: ["A"], modelNumbers: [1] }] };

test("P2-D resolves an explicitly grounded biological assembly/model/chain context with rationale", () => {
  const result = resolveStructureContext(validatedSource, base, { assembly: { kind: "biologicalAssembly", assemblyId: "1" }, modelNumber: 1, chainIds: ["A"] });
  assert.equal(result.outcome, "RESOLVED");
  if (result.outcome !== "RESOLVED") return;
  assert.deepEqual(result.context.assembly, { kind: "biologicalAssembly", assemblyId: "1" });
  assert.equal(result.context.modelNumber, 1); assert.deepEqual(result.context.chainIds, ["A"]);
  assert.equal(result.context.sourceId, source.sourceId); assert.ok(result.context.rationale.length >= 3);
});

test("P2-D surfaces model, chain, variant, and alternate-location ambiguity instead of selecting first values", () => {
  assert.equal(resolveStructureContext(validatedSource, { ...base, biologicalAssemblies: [{ assemblyId: "1", chainIds: ["A"], modelNumbers: [1, 2] }] }).outcome, "AMBIGUOUS");
  assert.equal(resolveStructureContext(validatedSource, { ...base, biologicalAssemblies: [{ assemblyId: "1", chainIds: ["A", "B"], modelNumbers: [1] }] }).outcome, "AMBIGUOUS");
  assert.equal(resolveStructureContext(validatedSource, { ...base, variants: ["open", "closed"] }).outcome, "AMBIGUOUS");
  assert.equal(resolveStructureContext(validatedSource, { ...base, alternateLocationIds: ["A", "B"] }).outcome, "AMBIGUOUS");
});

test("P2-D resolves declared alternate-location policy and reports unsupported choices", () => {
  const resolved = resolveStructureContext(validatedSource, { ...base, alternateLocationIds: ["A", "B"] }, { alternateLocations: { policy: "specific", locationId: "B" } });
  assert.equal(resolved.outcome, "RESOLVED"); if (resolved.outcome === "RESOLVED") assert.deepEqual(resolved.context.alternateLocationPolicy, { specific: "B" });
  assert.equal(resolveStructureContext(validatedSource, base, { modelNumber: 9 }).outcome, "UNSUPPORTED");
});

test("P2-D rejects invalid source records before any assembly selection", () => {
  const notDeposited = { ...validatedSource, sourceType: "canonicalParameterSet" as const } as ValidatedProvenanceSource;
  assert.equal(resolveStructureContext(notDeposited, base).outcome, "INVALID_SOURCE");
});
