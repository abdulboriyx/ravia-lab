import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalIntracellularTransportProgram, evaluateIntracellularTransportAtTime, validateIntracellularTransportProgram, serializeIntracellularTransportProgram } from "./intracellular-transport.ts";
import { createCanonicalIntracellularTransportProductionProgram, projectIntracellularTransportProductionAtTime } from "./intracellular-transport-production.ts";
import { applyCellularIntracellularTransportExactFrame } from "./p4-b-exact-frame-runtime.ts";

test("D-F canonical transport validates polarity, identity, and topology", () => {
  const program = createCanonicalIntracellularTransportProgram();
  assert.deepEqual(validateIntracellularTransportProgram(program), { valid: true, issues: [] });
  assert.equal(program.filaments.find((item) => item.filamentId === "microtubule-1")?.polarity, "PLUS_END");
  assert.equal(program.motors.find((item) => item.motorClass === "KINESIN")?.preferredDirection, "PLUS_END");
  assert.equal(program.motors.find((item) => item.motorClass === "CYTOPLASMIC_DYNEIN")?.preferredDirection, "MINUS_END");
  assert.equal(program.secretoryProgram.actors.secretoryVesicleId, "secretory-vesicle-1");
});

test("D-F exact boundaries expose no future endocytosis state", () => {
  const program = createCanonicalIntracellularTransportProgram();
  const surface = evaluateIntracellularTransportAtTime(program, 2);
  const pit = evaluateIntracellularTransportAtTime(program, 2.7);
  const vesicle = evaluateIntracellularTransportAtTime(program, 3.2);
  const endosome = evaluateIntracellularTransportAtTime(program, 4.9);
  assert.equal(surface.ok && surface.snapshot.endocyticVesicleId, null);
  assert.equal(pit.ok && pit.snapshot.endocyticMembraneState, "INVAGINATING");
  assert.equal(vesicle.ok && vesicle.snapshot.endocyticVesicleId, "endocytic-vesicle-1");
  assert.equal(endosome.ok && endosome.snapshot.earlyEndosomeLocalization, true);
  assert.equal(endosome.ok && endosome.snapshot.receptorDomainSide.extracellularDomain, "LUMINAL");
  assert.equal(endosome.ok && endosome.snapshot.receptorDomainSide.cytosolicDomain, "CYTOSOLIC");
});

test("D-F kinesin transport is explicit and preserves D-D vesicle identity", () => {
  const program = createCanonicalIntracellularTransportProgram();
  const before = evaluateIntracellularTransportAtTime(program, 15.5);
  const arrived = evaluateIntracellularTransportAtTime(program, 15.7);
  assert.equal(before.ok && before.snapshot.transportProgress, "TRACK_BOUND");
  assert.equal(before.ok && before.snapshot.trackPolarity, "PLUS_END");
  assert.equal(arrived.ok && arrived.snapshot.transportProgress, "ARRIVED");
  assert.equal(arrived.ok && arrived.snapshot.cargoId, program.secretoryProgram.actors.secretoryVesicleId);
  assert.equal(arrived.ok && arrived.snapshot.motorClass, "KINESIN");
});

test("D-F direct, restart, serialization, and production/P4 projections are deterministic", () => {
  const program = createCanonicalIntracellularTransportProgram();
  const direct = evaluateIntracellularTransportAtTime(program, 4.9);
  const replay = [2, 3.2, 4.9].map((time) => evaluateIntracellularTransportAtTime(program, time)).at(-1);
  assert.deepEqual(direct, replay);
  const roundTrip = JSON.parse(serializeIntracellularTransportProgram(program));
  assert.equal(roundTrip.endocytosis.receptorId, "endocytic-receptor-1");
  const production = projectIntracellularTransportProductionAtTime(createCanonicalIntracellularTransportProductionProgram(), 15.7);
  assert.equal(production.ok, true);
  if (production.ok) { const applied = applyCellularIntracellularTransportExactFrame(production.projection, { width: 1280, height: 720, pixelRatio: 1, background: { mode: "opaque", color: "#101820" } }); assert.equal(applied.ok, true); }
});

test("D-F invalid motor/track polarity is rejected", () => {
  const program = createCanonicalIntracellularTransportProgram();
  const invalid = { ...program, motors: program.motors.map((motor) => motor.motorClass === "KINESIN" ? { ...motor, preferredDirection: "MINUS_END" as const } : motor) };
  const result = validateIntracellularTransportProgram(invalid);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.issues.some((issue) => issue.path.includes("associations")));
});
