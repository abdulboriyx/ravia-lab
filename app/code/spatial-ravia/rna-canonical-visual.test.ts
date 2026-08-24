import assert from "node:assert/strict";
import test from "node:test";
import { buildRnaVisualStrand } from "./rna-canonical-visual.ts";

test("canonical RNA builds ordered A/U/G/C nucleotide units with stable spacing", () => {
  const strand = buildRnaVisualStrand({ sequence: ["A", "U", "G", "C", "A", "U", "G", "C", "U", "A"] });
  assert.equal(strand.fidelity, "S2_SCHEMATIC");
  assert.equal(strand.nucleotides.length, 10);
  assert.deepEqual(strand.nucleotides.map((nucleotide) => nucleotide.index), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(strand.nucleotides.map((nucleotide) => nucleotide.base), ["A", "U", "G", "C", "A", "U", "G", "C", "U", "A"]);
  assert.ok(strand.nucleotides.slice(1).every((nucleotide, index) => {
    const previous = strand.nucleotides[index]!;
    const dx = nucleotide.position[0] - previous.position[0];
    const dy = nucleotide.position[1] - previous.position[1];
    const dz = nucleotide.position[2] - previous.position[2];
    return Math.hypot(dx, dy, dz) > 0.3 && Math.hypot(dx, dy, dz) < 0.7;
  }));
  assert.equal(strand.backboneLinks.length, 9);
  assert.equal(strand.fivePrimeIndex, 0);
  assert.equal(strand.threePrimeIndex, 9);
});

test("RNA visual geometry is deterministic, frame-oriented, and chemically connected", () => {
  const input = { sequence: ["A", "U", "G", "C"] as const };
  const first = buildRnaVisualStrand(input);
  const second = buildRnaVisualStrand(input);
  assert.deepEqual(first.nucleotides.map((nucleotide) => [nucleotide.position, nucleotide.sugarPosition, nucleotide.phosphatePosition, nucleotide.basePosition]), second.nucleotides.map((nucleotide) => [nucleotide.position, nucleotide.sugarPosition, nucleotide.phosphatePosition, nucleotide.basePosition]));
  assert.ok(first.nucleotides.every((nucleotide) => [nucleotide.tangent, nucleotide.normal, nucleotide.binormal].flat().every(Number.isFinite)));
  assert.ok(first.nucleotides.every((nucleotide) => nucleotide.base !== ("T" as never)));
  assert.ok(first.backboneLinks.every((link) => link.from.length === 3 && link.to.length === 3));
});

test("empty and malformed RNA paths fail safely while thymine is rejected", () => {
  assert.equal(buildRnaVisualStrand({ sequence: [] }).nucleotides.length, 0);
  assert.throws(() => buildRnaVisualStrand({ sequence: ["T" as never] }), /A, U, G, and C/);
  assert.throws(() => buildRnaVisualStrand({ sequence: ["A", "U"], positions: [[0, 0, 0]] }), /match/);
});
