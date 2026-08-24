import assert from "node:assert/strict";
import test from "node:test";
import { depositedRnaBoundaryV1, deriveFreeRnaContinuation } from "./transcription-free-rna-continuation.ts";

const base = { exitAnchor: [0, 0, 0] as const, exitDirection: [1, 0, 0] as const };

test("deposited RNA boundary is explicit and continuation is S2", () => {
  assert.equal(depositedRnaBoundaryV1.sourceId.includes("6ALH"), true);
  assert.equal(depositedRnaBoundaryV1.chainId, "R");
  assert.equal(depositedRnaBoundaryV1.residueId, 11);
  assert.equal(depositedRnaBoundaryV1.continuationFidelity, "S2_SCHEMATIC");
});

test("tail count is canonical length minus deposited representation, clamped at zero", () => {
  assert.equal(deriveFreeRnaContinuation({ ...base, canonicalVisibleLength: 8 }).tailCount, 0);
  assert.equal(deriveFreeRnaContinuation({ ...base, canonicalVisibleLength: 13 }).tailCount, 2);
});

test("tail preserves 5-prime outward ordering and 3-prime boundary semantics", () => {
  const value = deriveFreeRnaContinuation({ ...base, canonicalVisibleLength: 14 });
  assert.equal(value.threePrimeAtBoundary, true);
  assert.equal(value.strand?.threePrimeIndex, value.tailCount - 1);
  assert.ok((value.positions[0]?.[0] ?? 0) > (value.positions.at(-1)?.[0] ?? 0));
});

test("unresolved exit evidence is an explicit schematic fallback", () => {
  const value = deriveFreeRnaContinuation({ ...base, canonicalVisibleLength: 14 });
  assert.equal(value.exitEvidence, "UNRESOLVED_S2_FALLBACK");
});

test("continuation is deterministic and RNA alphabet excludes T", () => {
  const a = deriveFreeRnaContinuation({ ...base, canonicalVisibleLength: 15 });
  const b = deriveFreeRnaContinuation({ ...base, canonicalVisibleLength: 15 });
  assert.deepEqual(a.positions, b.positions);
  assert.ok(a.strand?.nucleotides.every((item) => item.base !== ("T" as never)));
});
