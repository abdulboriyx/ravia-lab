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
  assert.ok(first.nucleotides.every((nucleotide) => {
    const sugar = nucleotide.sugarPosition;
    const base = nucleotide.basePosition;
    const distance = Math.hypot(base[0] - sugar[0], base[1] - sugar[1], base[2] - sugar[2]);
    return distance > 0.1 && distance < 0.25;
  }));
  assert.ok(first.nucleotides.slice(1).every((nucleotide, index) => {
    const previous = first.nucleotides[index]!;
    const dot = previous.orientation.dot(nucleotide.orientation);
    return Math.abs(dot) > 0.75;
  }));
});

test("default conformation is gently irregular rather than a periodic helix", () => {
  const strand = buildRnaVisualStrand({ sequence: ["A", "U", "G", "C", "A", "U", "G", "C", "U", "A"] });
  const y = strand.nucleotides.map((nucleotide) => nucleotide.position[1]);
  assert.ok(new Set(y.map((value) => value.toFixed(3))).size > 5);
  assert.ok(y.some((value, index) => index > 1 && value < y[index - 1]! && y[index - 1]! > y[index - 2]!));
});

test("one- and two-nucleotide strands remain safe and preserve polarity", () => {
  const one = buildRnaVisualStrand({ sequence: ["A"] });
  assert.equal(one.nucleotides.length, 1);
  assert.equal(one.fivePrimeIndex, 0);
  assert.equal(one.threePrimeIndex, 0);
  const two = buildRnaVisualStrand({ sequence: ["A", "U"] });
  assert.equal(two.backboneLinks.length, 1);
  assert.equal(two.fivePrimeIndex, 0);
  assert.equal(two.threePrimeIndex, 1);
});

test("empty and malformed RNA paths fail safely while thymine is rejected", () => {
  assert.equal(buildRnaVisualStrand({ sequence: [] }).nucleotides.length, 0);
  assert.throws(() => buildRnaVisualStrand({ sequence: ["T" as never] }), /A, U, G, and C/);
  assert.throws(() => buildRnaVisualStrand({ sequence: ["A", "U"], positions: [[0, 0, 0]] }), /match/);
});
