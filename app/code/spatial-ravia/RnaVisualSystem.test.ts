import assert from "node:assert/strict";
import test from "node:test";
import { canonicalRnaNucleotide, canonicalRnaPair, canonicalRnaView, isFiniteRnaSample, rnaCameraFor, rnaDepositedCoordinatePlan, rnaDnaHybridPlan, rnaLodPolicy, rnaMaterialPalette, rnaTopologyState, sampleCanonicalRna, rnaVisualSystem } from "./RnaVisualSystem.ts";

test("canonical RNA chemistry uses ribose, 2′-OH, and A/U/G/C without thymine", () => {
  const nucleotide = canonicalRnaNucleotide("U");
  assert.equal(nucleotide.sugar, "ribose");
  assert.equal(nucleotide.hasTwoPrimeHydroxyl, true);
  assert.ok(nucleotide.atoms.some((atom) => atom.role === "twoPrimeHydroxyl"));
  assert.deepEqual(rnaVisualSystem.chemistry.canonicalBases, ["A", "U", "G", "C"]);
  assert.ok(!rnaVisualSystem.chemistry.canonicalBases.includes("T" as never));
});

test("canonical ssRNA geometry is finite, deterministic, and polarity-aware", () => {
  const state = { topology: "single-stranded" as const, lod: 1 as const, source: "canonical-procedural" as const };
  const first = sampleCanonicalRna(12, state);
  const second = sampleCanonicalRna(12, state);
  assert.deepEqual(first, second);
  assert.equal(first.length, 12);
  assert.ok(first.every(isFiniteRnaSample));
  assert.notDeepEqual(first[0].backbone, first[11].backbone);
});

test("single-strand topology preserves every residue as unpaired substrate", () => {
  const topology = rnaTopologyState("singleStrand", 12);
  assert.equal(topology.pairedResidues.length, 0);
  assert.equal(topology.unpairedResidues.length, 12);
  assert.equal(sampleCanonicalRna(12, { topology: "single-stranded", lod: 1, source: "canonical-procedural", topologyState: topology }).length, 12);
});

test("secondary-structure topology expresses stems, loops, bulges, and paired/unpaired regions", () => {
  for (const kind of ["stem", "hairpin", "internalLoop", "bulge", "pairedUnpaired"] as const) {
    const topology = rnaTopologyState(kind, 14);
    assert.ok(topology.deterministicKey.startsWith(`${kind}:`));
    assert.ok(topology.regions.length > 0);
    assert.ok(topology.pairedResidues.every(([a, b]) => a !== b));
    const samples = sampleCanonicalRna(14, { topology: "secondary-structure", lod: 2, source: "canonical-procedural", topologyState: topology });
    assert.ok(samples.every(isFiniteRnaSample));
  }
});

test("RNA canonical pairs support A-U, G-C, and typed G-U wobble", () => {
  assert.deepEqual(canonicalRnaPair("A-U"), { pair: "A-U", bases: ["A", "U"], interactionType: "canonical", width: "consistent" });
  assert.deepEqual(canonicalRnaPair("G-C"), { pair: "G-C", bases: ["G", "C"], interactionType: "canonical", width: "consistent" });
  assert.equal(canonicalRnaPair("G-U-wobble").interactionType, "wobble");
});

test("RNA-DNA hybrid preserves distinct strand chemistry", () => {
  const hybrid = rnaDnaHybridPlan();
  assert.equal(hybrid.distinctChemistries, true);
  assert.equal(hybrid.rna.chemistry, "ribose-2prime-oh-uracil");
  assert.equal(hybrid.dna.chemistry, "deoxyribose-canonical-dna");
  assert.notEqual(hybrid.rna.strandId, hybrid.dna.strandId);
});

test("LOD, camera, material, and deposited-coordinate contracts are deterministic", () => {
  assert.deepEqual(rnaLodPolicy(4), rnaLodPolicy(4));
  assert.equal(canonicalRnaView("local-chemistry").lod, 4);
  assert.equal(rnaCameraFor("whole-rna").framing, "global");
  assert.equal(rnaCameraFor("local-chemistry").framing, "local");
  assert.notDeepEqual(rnaMaterialPalette("light"), rnaMaterialPalette("dark"));
  assert.equal(rnaDepositedCoordinatePlan("1ABC", ["A"]).provider, "Mol*");
});
