import assert from "node:assert/strict";
import test from "node:test";
import { sampleTranscriptionMolecularRna } from "./transcription-molecular-actors.ts";

const state = { nascentRnaVisualLength: 6, nascentRnaAnchor: 0.62, bubbleOpenFraction: 0.8 };

test("nascent RNA is an ordered molecular polymer with RNA chemistry", () => {
  const rna = sampleTranscriptionMolecularRna(state);
  assert.equal(rna.units.length, 6);
  assert.deepEqual(rna.units.map((unit) => unit.index), [0, 1, 2, 3, 4, 5]);
  assert.ok(rna.units.every((unit) => unit.ribose.length === 3 && unit.phosphate.length === 3 && unit.basePosition.length === 3));
  assert.ok(rna.units.some((unit) => unit.base === "U"));
  assert.ok(rna.units.every((unit) => unit.base !== ("T" as never)));
  assert.equal(rna.backboneSegments.length, 5);
  assert.equal(rna.growingThreePrime, rna.units.at(-1)!.basePosition);
});

test("RNA–DNA hybrid is bounded at the active site and exits in 5′→3′ order", () => {
  const early = sampleTranscriptionMolecularRna({ ...state, nascentRnaVisualLength: 2 });
  const late = sampleTranscriptionMolecularRna({ ...state, nascentRnaVisualLength: 8 });
  assert.equal(early.hybridPairs.length, 2);
  assert.equal(late.hybridPairs.length, 3);
  assert.ok(late.hybridPairs.every((pair) => pair.rnaPosition[1] < 0.1 && pair.dnaPosition[1] >= 0));
  assert.ok(late.units.at(-1)!.position[0] < late.units[0]!.position[0]);
  assert.deepEqual(late.tangent, [1, 0, 0]);
});

test("RNA growth is monotonic and future units are not leaked", () => {
  const early = sampleTranscriptionMolecularRna({ ...state, nascentRnaVisualLength: 1.1 });
  const late = sampleTranscriptionMolecularRna({ ...state, nascentRnaVisualLength: 5.1 });
  assert.equal(early.units.length, 2);
  assert.equal(late.units.length, 6);
  assert.ok(late.units.length > early.units.length);
});
