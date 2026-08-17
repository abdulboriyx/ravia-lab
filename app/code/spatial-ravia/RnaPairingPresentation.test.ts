import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { classifyRnaPair, createRnaLocalPairFrame, deriveRnaPairingPresentation, isValidRnaPairingPresentation, rnaHybridPresentation, rnaPairInteractions, transformRnaLocalPairPoint } from "./RnaPairingPresentation.ts";

function spec(prompt: string) {
  const resolved = resolveRnaIntent(prompt);
  assert.ok(resolved, prompt);
  return resolved.spec;
}

test("RNA A-U pairing has exactly two canonical hydrogen bonds", () => {
  const presentation = deriveRnaPairingPresentation(spec("show how adenine pairs with uracil"));
  assert.equal(presentation.classification.hydrogenBondCount, 2);
  assert.equal(presentation.interactions.length, 2);
  assert.ok(presentation.interactions.every((interaction) => interaction.type === "hydrogenBond"));
  assert.equal(isValidRnaPairingPresentation(presentation), true);
});

test("local RNA pair frame is deterministic and faces both bases toward one another", () => {
  const frame = createRnaLocalPairFrame();
  assert.deepEqual(frame, createRnaLocalPairFrame());
  const left = transformRnaLocalPairPoint([0.55, 0.1, 0], 0, frame);
  const right = transformRnaLocalPairPoint([0.55, 0.1, 0], 1, frame);
  assert.ok(left[0] < right[0]);
  assert.equal(left[1], right[1]);
  assert.equal(left[2], right[2]);
});

test("RNA G-C pairing has exactly three canonical hydrogen bonds", () => {
  const presentation = deriveRnaPairingPresentation(spec("show G C pairing in RNA"));
  assert.equal(presentation.classification.pair, "G-C");
  assert.equal(presentation.interactions.length, 3);
  assert.equal(presentation.strands[0].chemistry.sugar, "ribose");
  assert.equal(presentation.strands[1].chemistry.hasTwoPrimeHydroxyl, true);
});

test("G-U is typed as wobble and is not labeled Watson-Crick", () => {
  const classification = classifyRnaPair("G-U-wobble");
  const presentation = deriveRnaPairingPresentation("G-U-wobble");
  assert.equal(classification.interactionType, "wobble");
  assert.equal(classification.specificityNote, "wobble-not-Watson-Crick");
  assert.equal(presentation.labels[0].text, "G–U wobble");
  assert.equal(presentation.interactions.length, 2);
});

test("canonical RNA pairing uses U and never substitutes T", () => {
  const presentation = deriveRnaPairingPresentation("A-U");
  assert.deepEqual(presentation.classification.bases, ["A", "U"]);
  assert.ok(presentation.strands.every((strand) => strand.kind === "RNA"));
  assert.ok(presentation.strands.every((strand) => strand.chemistry.canonicalBaseAlphabet.includes("U")));
  assert.ok(presentation.strands.every((strand) => !strand.chemistry.canonicalBaseAlphabet.includes("T")));
});

test("complementary RNA short duplex has two RNA strands and deterministic backbone", () => {
  const presentation = deriveRnaPairingPresentation(spec("show complementary RNA strands pairing"), { mode: "shortDuplex", length: 4 });
  assert.equal(presentation.spec.mode, "shortDuplex");
  assert.equal(presentation.strands.length, 2);
  assert.ok(presentation.strands.every((strand) => strand.kind === "RNA" && strand.chemistry.hasTwoPrimeHydroxyl));
  assert.equal(presentation.backboneInteractions.length, 6);
  assert.deepEqual(presentation, deriveRnaPairingPresentation(spec("show complementary RNA strands pairing"), { mode: "shortDuplex", length: 4 }));
});

test("RNA-DNA hybrid preserves distinct sugar and base alphabets", () => {
  const presentation = rnaHybridPresentation("A-T");
  assert.equal(presentation.spec.mode, "hybrid");
  assert.equal(presentation.strands[0].kind, "RNA");
  assert.equal(presentation.strands[0].chemistry.sugar, "ribose");
  assert.equal(presentation.strands[0].chemistry.hasTwoPrimeHydroxyl, true);
  assert.equal(presentation.strands[1].kind, "DNA");
  assert.equal(presentation.strands[1].chemistry.sugar, "deoxyribose");
  assert.equal(presentation.strands[1].chemistry.hasTwoPrimeHydroxyl, false);
  assert.equal(presentation.strands[1].bases[0], "T");
  assert.equal(presentation.hybridPlan?.distinctChemistries, true);
});

test("donor and acceptor assignments cross strands", () => {
  const presentation = deriveRnaPairingPresentation("G-C");
  assert.ok(presentation.interactions.every((interaction) => {
    const [first, second] = interaction.participants;
    return first.strandId !== second.strandId && new Set([first.role, second.role]).size === 2;
  }));
});

test("G-C donor/acceptor sites stay attached to the chemically correct bases", () => {
  const presentation = deriveRnaPairingPresentation("G-C");
  assert.deepEqual(presentation.interactions.map((interaction) => interaction.participants.map((participant) => `${participant.base}-${participant.site}-${participant.role}`)), [
    ["G-G-N1-acceptor", "C-C-N3-donor"],
    ["G-G-N2-donor", "C-C-O2-acceptor"],
    ["C-C-N4-donor", "G-G-O6-acceptor"],
  ]);
  assert.ok(presentation.interactions.every((interaction) => interaction.anchors.every((anchor) => anchor.position.every(Number.isFinite))));
});

test("wobble geometry is visibly offset from the canonical pair frame", () => {
  const canonical = deriveRnaPairingPresentation("A-U");
  const wobble = deriveRnaPairingPresentation("G-U-wobble");
  assert.equal(wobble.classification.interactionType, "wobble");
  assert.notDeepEqual(wobble.geometry.frames[0].frame.pairAxis, canonical.geometry.frames[0].frame.pairAxis);
  assert.notDeepEqual(wobble.interactions[0].anchors[0].position, canonical.interactions[0].anchors[0].position);
  assert.ok(wobble.geometry.bounds.width > 0 && wobble.geometry.bounds.height > 0 && wobble.geometry.bounds.depth > 0);
});

test("short RNA duplex uses repeated antiparallel pair frames and real bounds", () => {
  const presentation = deriveRnaPairingPresentation("A-U", { mode: "shortDuplex", length: 5 });
  assert.deepEqual(presentation.strands.map((strand) => strand.direction), ["5primeTo3prime", "3primeTo5prime"]);
  assert.equal(presentation.geometry.frames.length, 5);
  assert.ok(presentation.geometry.frames.every((frame) => frame.frame.pairAxis[0] === 1 && frame.frame.sugarDirection[1] === 1));
  assert.ok(presentation.geometry.frames[0].frame.center[1] < presentation.geometry.frames[4].frame.center[1]);
  assert.ok(presentation.geometry.bounds.min[0] < presentation.geometry.bounds.max[0]);
  assert.ok(presentation.geometry.bounds.min[1] < presentation.geometry.bounds.max[1]);
  assert.equal(isValidRnaPairingPresentation(presentation), true);
});

test("RNA-DNA hybrid keeps RNA and DNA pairing chemistry distinct", () => {
  const presentation = rnaHybridPresentation("G-C", { length: 3 });
  assert.deepEqual(presentation.strands.map((strand) => [strand.kind, strand.chemistry.sugar, strand.chemistry.hasTwoPrimeHydroxyl]), [
    ["RNA", "ribose", true],
    ["DNA", "deoxyribose", false],
  ]);
  assert.ok(presentation.interactions.every((interaction) => interaction.participants[0].strandId !== interaction.participants[1].strandId));
  assert.equal(presentation.spec.length, 5);
  assert.equal(presentation.interactions.length, 15);
  assert.equal(presentation.hybridPlan?.distinctChemistries, true);
});

test("local donor/acceptor anchors form separated rows instead of a center line", () => {
  for (const pair of ["A-U", "G-C"] as const) {
    const presentation = deriveRnaPairingPresentation(pair);
    const rows = presentation.interactions.map((interaction) => interaction.anchors[0].position[1]);
    assert.equal(new Set(rows).size, presentation.classification.hydrogenBondCount);
    assert.ok(presentation.interactions.every((interaction) => Math.abs(interaction.anchors[0].position[0] - interaction.anchors[1].position[0]) > 0.8));
  }
});

test("RNA-DNA hybrid remains a short antiparallel ladder without a bond-count label", () => {
  const presentation = rnaHybridPresentation("A-T");
  assert.ok(presentation.spec.length >= 5 && presentation.spec.length <= 7);
  assert.deepEqual(presentation.strands.map((strand) => strand.direction), ["5primeTo3prime", "3primeTo5prime"]);
  assert.equal(presentation.labels.some((label) => /hydrogen bonds/.test(label.text)), false);
});

test("pairing state transitions affect H-bonds but preserve phosphodiester backbone", () => {
  const separating = deriveRnaPairingPresentation("A-U", { interactionState: "separating", mode: "shortDuplex", length: 3 });
  const approaching = deriveRnaPairingPresentation("A-U", { interactionState: "approaching" });
  assert.ok(separating.interactions.every((interaction) => interaction.state === "breaking"));
  assert.ok(approaching.interactions.every((interaction) => interaction.state === "forming"));
  assert.ok(separating.backboneInteractions.every((interaction) => interaction.state === "present"));
  assert.equal(separating.hydrogenBondsRemainDistinctFromBackbone, true);
});
