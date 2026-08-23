import test from "node:test";
import assert from "node:assert/strict";
import { scientificSceneSpecFixtures } from "./scientific-scene-spec-fixtures.ts";
import { capabilityRegistry, capabilityRegistryV2, validateCapabilityRegistry, validateCapabilityRegistryV2 } from "./capability-registry.ts";
import { cellularPrimitiveIds } from "./cell-capability-registry.ts";
import { validateScientificPrimitiveRegistry } from "./scientific-primitive-registry.ts";
import { validateCellularScientificScene, serializeCellularScientificScene, type CellularScientificExtensionV1 } from "./cellular-localization.ts";

const source = scientificSceneSpecFixtures["generic-rna"].fidelityProvenance.sources[0]!.sourceId;
const scene = scientificSceneSpecFixtures["generic-rna"];

function extension(overrides: Partial<CellularScientificExtensionV1> = {}): CellularScientificExtensionV1 {
  return {
    schemaVersion: "1",
    scale: "MULTI_COMPARTMENT",
    compartments: [
      { compartmentId: "extracellular", type: "EXTRACELLULAR_SPACE", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "plasma-membrane", type: "PLASMA_MEMBRANE", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "cytosol", type: "CYTOSOL", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "nucleus", type: "NUCLEUS", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "nucleoplasm", type: "NUCLEOPLASM", parentCompartmentId: "nucleus", enclosingMembraneId: "nuclear-envelope", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "nuclear-envelope", type: "NUCLEAR_ENVELOPE", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "nuclear-pore", type: "NUCLEAR_PORE", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "er-membrane", type: "ER_MEMBRANE", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "er-lumen", type: "ER_LUMEN", enclosingMembraneId: "er-membrane", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "vesicle-membrane", type: "VESICLE_MEMBRANE", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
      { compartmentId: "vesicle-lumen", type: "VESICLE_LUMEN", enclosingMembraneId: "vesicle-membrane", fidelity: "S2_SCHEMATIC", sourceIds: [source] },
    ],
    compartmentRelations: [
      { relationId: "nucleoplasm-in-nucleus", kind: "CONTAINED_IN", subjectId: "nucleoplasm", objectId: "nucleus", sourceIds: [source] },
      { relationId: "nucleus-boundary", kind: "HAS_BOUNDARY", subjectId: "nucleus", objectId: "nuclear-envelope", sourceIds: [source] },
      { relationId: "nucleoplasm-lumen", kind: "LUMEN_OF", subjectId: "nucleoplasm", objectId: "nuclear-envelope", sourceIds: [source] },
      { relationId: "nucleus-pore", kind: "CONNECTED_VIA", subjectId: "nucleus", objectId: "nuclear-pore", sourceIds: [source] },
      { relationId: "cytosol-plasma-adjacency", kind: "ADJACENT_TO", subjectId: "cytosol", objectId: "plasma-membrane", sourceIds: [source] },
      { relationId: "vesicle-lumen", kind: "LUMEN_OF", subjectId: "vesicle-lumen", objectId: "vesicle-membrane", sourceIds: [source] },
    ],
    localizations: [
      { actorId: scene.actors[0]!.actorId, compartmentId: "nucleus", localizationKind: "NUCLEAR", sourceIds: [source] },
      { actorId: scene.actors[0]!.actorId, compartmentId: "plasma-membrane", localizationKind: "MEMBRANE_EMBEDDED", membraneId: "plasma-membrane", membraneSide: "CYTOSOLIC", sourceIds: [source] },
    ],
    localizationChanges: [
      { changeId: "rna-nuclear-export", actorId: scene.actors[0]!.actorId, from: { actorId: scene.actors[0]!.actorId, compartmentId: "nucleus", localizationKind: "NUCLEAR", sourceIds: [source] }, to: { actorId: scene.actors[0]!.actorId, compartmentId: "cytosol", localizationKind: "CYTOSOLIC", sourceIds: [source] }, transportKind: "NUCLEAR_EXPORT", timelineEventId: "export-event", sourceIds: [source] },
    ],
    localities: [{ subjectKind: "interaction", subjectId: "missing-until-overridden", compartmentId: "nucleus", sourceIds: [source] }],
    ...overrides,
  };
}

test("valid cellular compartment graph, localization, and membrane semantics", () => {
  const value = extension({ localities: [] });
  const result = validateCellularScientificScene({ scene, cellular: value });
  assert.deepEqual(result, { valid: true, issues: [] });
});

test("persistent actor identity and compartment-localized interaction seam are representable", () => {
  const value = extension({
    localizations: [{ actorId: scene.actors[0]!.actorId, compartmentId: "nucleus", localizationKind: "NUCLEAR", sourceIds: [source] }],
    localities: [{ subjectKind: "interaction", subjectId: "rna-local-interaction", compartmentId: "nucleus", sourceIds: [source] }],
  });
  const result = validateCellularScientificScene({ scene: { ...scene, topology: { ...scene.topology, interactions: [{ interactionId: "rna-local-interaction", kind: "semanticRelation", type: "polymerContinuity", participants: [{ actorId: scene.actors[0]!.actorId }, { actorId: scene.actors[0]!.actorId }], state: "present", explanatory: true }] } }, cellular: value });
  assert.equal(result.valid, true);
});

test("invalid containment cycles and membrane sides are rejected", () => {
  const cycle = extension({ compartments: extension().compartments.map((item) => item.compartmentId === "nucleus" ? { ...item, parentCompartmentId: "nucleoplasm" } : item) });
  assert.equal(validateCellularScientificScene({ scene, cellular: cycle }).valid, false);
  const invalidSide = extension({ localizations: [{ actorId: scene.actors[0]!.actorId, compartmentId: "plasma-membrane", localizationKind: "LUMINAL", membraneId: "plasma-membrane", membraneSide: "CYTOSOLIC", sourceIds: [source] }] });
  assert.equal(validateCellularScientificScene({ scene, cellular: invalidSide }).valid, false);
});

test("missing actor, membrane, timeline, and transport references are rejected", () => {
  const value = extension({ localizations: [{ actorId: "missing-actor" as never, compartmentId: "plasma-membrane", localizationKind: "MEMBRANE_EMBEDDED", membraneId: "missing-membrane", membraneSide: "CYTOSOLIC", sourceIds: [source] }] });
  assert.equal(validateCellularScientificScene({ scene, cellular: value }).valid, false);
});

test("cellular serialization is deterministic under cellular array reordering", () => {
  const value = extension({ localities: [] });
  const reordered = { ...value, compartments: [...value.compartments].reverse(), compartmentRelations: [...value.compartmentRelations].reverse(), localizations: [...value.localizations].reverse(), localizationChanges: [...value.localizationChanges].reverse() };
  assert.equal(serializeCellularScientificScene({ scene, cellular: value }), serializeCellularScientificScene({ scene, cellular: reordered }));
});

test("D-B capability and primitive registry entries validate", () => {
  assert.deepEqual(validateScientificPrimitiveRegistry(), []);
  assert.deepEqual(validateCapabilityRegistry(), { valid: true, issues: [] });
  assert.deepEqual(validateCapabilityRegistryV2(), { valid: true, issues: [] });
  assert.equal(capabilityRegistry.some((record) => String(record.domain) === "CELL"), false);
  assert.ok(capabilityRegistryV2.some((record) => record.capabilityId === "cell-compartmentalization"));
  assert.ok(capabilityRegistryV2.some((record) => record.capabilityId === "localization-change"));
  assert.equal(cellularPrimitiveIds.length, 5);
});
