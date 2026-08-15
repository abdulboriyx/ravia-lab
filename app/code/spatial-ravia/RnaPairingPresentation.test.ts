import assert from "node:assert/strict";
import test from "node:test";
import { resolveRnaIntent } from "./rna-intent.ts";
import { classifyRnaPair, deriveRnaPairingPresentation, isValidRnaPairingPresentation, rnaHybridPresentation, rnaPairInteractions } from "./RnaPairingPresentation.ts";

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

test("pairing state transitions affect H-bonds but preserve phosphodiester backbone", () => {
  const separating = deriveRnaPairingPresentation("A-U", { interactionState: "separating", mode: "shortDuplex", length: 3 });
  const approaching = deriveRnaPairingPresentation("A-U", { interactionState: "approaching" });
  assert.ok(separating.interactions.every((interaction) => interaction.state === "breaking"));
  assert.ok(approaching.interactions.every((interaction) => interaction.state === "forming"));
  assert.ok(separating.backboneInteractions.every((interaction) => interaction.state === "present"));
  assert.equal(separating.hydrogenBondsRemainDistinctFromBackbone, true);
});
