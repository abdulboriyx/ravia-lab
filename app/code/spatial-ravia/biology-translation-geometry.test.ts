import test from "node:test";
import assert from "node:assert/strict";
import {
  getTranslationMotionState,
  type TranslationMotionState,
} from "./biology-motion-state.ts";
import { getTemporalFrame } from "./biology-timeline.ts";
import { translationScene } from "./biology-scene-builders.ts";
import {
  sampleTranslationGeometry,
  TRANSLATION_MRNA_SAMPLE_COUNT,
  TRANSLATION_PEPTIDE_SAMPLE_COUNT,
  translationSitePosition,
} from "./biology-translation-geometry.ts";

const context = { organism: "unspecified" as const };

function frameAtPhase(phaseId: string, progress: number) {
  const scene = translationScene("elongation", context);
  assert.ok(scene.temporal);
  let elapsed = 0;
  const phase = scene.temporal.phases.find((candidate) => candidate.id === phaseId);
  assert.ok(phase);

  for (const candidate of [...scene.temporal.phases].sort((a, b) => a.order - b.order)) {
    if (candidate.id === phaseId) break;
    elapsed += candidate.durationMs ?? 2400;
  }

  return getTemporalFrame(scene.temporal, elapsed + (phase.durationMs ?? 2400) * progress);
}

function stateAt(phaseId: string, progress: number): TranslationMotionState {
  return getTranslationMotionState(frameAtPhase(phaseId, progress));
}

function assertFiniteSamples(points: { x: number; y: number; z: number }[]) {
  for (const point of points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
    assert.ok(Number.isFinite(point.z));
  }
}

test("translation elongation scenes expose temporal phases", () => {
  const scene = translationScene("elongation", context);

  assert.ok(scene.temporal);
  assert.deepEqual(
    scene.temporal.phases.map((phase) => phase.id),
    [
      "initiation",
      "aminoacyl-trna-entry",
      "codon-recognition",
      "peptide-transfer",
      "translocation",
      "trna-exit",
      "elongation-cycle",
      "termination",
    ]
  );
});

test("translation repeated cycle index advances while cycle progress resets", () => {
  const early = stateAt("elongation-cycle", 0.12);
  const later = stateAt("elongation-cycle", 0.62);

  assert.ok(later.cycleIndex > early.cycleIndex);
  assert.ok(later.completedCycles >= early.completedCycles);
  assert.ok(later.cycleProgress < 1);
});

test("peptide length accumulates monotonically across translation cycles", () => {
  const samples = [0, 0.2, 0.45, 0.7, 0.95].map((progress) =>
    stateAt("elongation-cycle", progress)
  );

  for (let index = 1; index < samples.length; index += 1) {
    assert.ok(samples[index].peptideLength >= samples[index - 1].peptideLength);
  }
});

test("translation event order is entry recognition transfer translocation exit", () => {
  const entry = stateAt("aminoacyl-trna-entry", 0.8);
  const recognition = stateAt("codon-recognition", 0.8);
  const transfer = stateAt("peptide-transfer", 0.8);
  const translocation = stateAt("translocation", 0.8);
  const exit = stateAt("trna-exit", 0.8);

  assert.ok(entry.incomingTrnaProgress > 0);
  assert.ok(recognition.recognitionProgress > entry.recognitionProgress);
  assert.ok(transfer.peptideTransferProgress > recognition.peptideTransferProgress);
  assert.ok(translocation.translocationProgress > transfer.translocationProgress);
  assert.ok(exit.exitingTrnaProgress > translocation.exitingTrnaProgress);
});

test("A P E occupancy changes through elongation and translocation", () => {
  const entry = stateAt("aminoacyl-trna-entry", 0.9);
  assert.equal(entry.pSiteOccupancy.carriesPeptide, true);
  assert.equal(entry.aSiteOccupancy.carriesAminoAcid, true);

  const transfer = stateAt("peptide-transfer", 0.8);
  assert.equal(transfer.aSiteOccupancy.carriesPeptide, true);
  assert.equal(transfer.pSiteOccupancy.carriesPeptide, false);

  const translocation = stateAt("translocation", 0.8);
  assert.equal(translocation.eSiteOccupancy.occupied, true);
});

test("termination uses release factor and stops peptide growth", () => {
  const start = stateAt("termination", 0.1);
  const end = stateAt("termination", 0.9);

  assert.equal(start.aSiteOccupancy.trna, "release-factor");
  assert.equal(end.aSiteOccupancy.trna, "release-factor");
  assert.equal(start.peptideLength, end.peptideLength);
  assert.ok(end.polypeptideReleaseProgress > start.polypeptideReleaseProgress);
});

test("translation geometry has finite distinct site positions and stable polymer sample counts", () => {
  const state = stateAt("elongation-cycle", 0.58);
  const geometry = sampleTranslationGeometry(state);

  assert.equal(geometry.mrna.length, TRANSLATION_MRNA_SAMPLE_COUNT);
  assert.equal(geometry.polypeptide.length, TRANSLATION_PEPTIDE_SAMPLE_COUNT);
  assert.ok(geometry.polypeptideActiveSampleCount <= TRANSLATION_PEPTIDE_SAMPLE_COUNT);
  assert.notDeepEqual(translationSitePosition("a"), translationSitePosition("p"));
  assert.notDeepEqual(translationSitePosition("p"), translationSitePosition("e"));
  assertFiniteSamples(geometry.mrna);
  assertFiniteSamples(geometry.polypeptide);
});

test("mRNA advances in the 5 prime to 3 prime reading direction while peptide draw range grows", () => {
  const early = sampleTranslationGeometry(stateAt("elongation-cycle", 0.1));
  const late = sampleTranslationGeometry(stateAt("elongation-cycle", 0.85));

  assert.ok(late.mrna[0].x < early.mrna[0].x);
  assert.ok(late.polypeptideActiveSampleCount > early.polypeptideActiveSampleCount);
});
