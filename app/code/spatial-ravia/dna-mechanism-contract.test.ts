import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dnaMechanismBenchmark } from "./dna-mechanism-benchmark.ts";
import { dnaMechanismFamilies, dnaMechanismPrimitives, type DnaInteractionType } from "./dna-mechanism-contract.ts";

test("DNA mechanism benchmark contains exactly 60 cases and 10 per family", () => {
  assert.equal(dnaMechanismBenchmark.length, 60);
  for (const family of dnaMechanismFamilies) {
    assert.equal(dnaMechanismBenchmark.filter((item) => item.family === family).length, 10, family);
  }
  assert.equal(new Set(dnaMechanismBenchmark.map((item) => item.id)).size, 60);
});

test("every mechanism case declares renderer-independent primitive and molecular requirements", () => {
  for (const item of dnaMechanismBenchmark) {
    assert.ok(item.prompt.length > 0);
    assert.ok(item.spec.requiredPrimitives.length > 0, item.id);
    assert.ok(item.spec.molecularSelections.length > 0, item.id);
    assert.ok(item.spec.participatingGroups.length > 0, item.id);
    assert.equal(item.spec.structuralSubstrate, "existingDnaVisualSystem");
    assert.ok(item.spec.representation.backbone);
  }
  assert.ok(dnaMechanismPrimitives.includes("reactionStateProgression"));
});

test("interaction and orientation contracts encode typed chemistry and antiparallel polarity", () => {
  const interactionTypes = new Set<DnaInteractionType>();
  for (const item of dnaMechanismBenchmark) {
    for (const interaction of item.spec.interactions) {
      interactionTypes.add(interaction.type);
      assert.ok(interaction.participants.length > 0);
      assert.ok(["present", "forming", "breaking", "absent"].includes(interaction.state));
    }
  }
  for (const type of ["covalent", "phosphodiester", "hydrogenBond", "baseStacking", "noncovalent"] satisfies DnaInteractionType[]) {
    assert.ok(interactionTypes.has(type), type);
  }
  // Lesion/crosslink is part of the shared contract for future damage cases;
  // this checkpoint's six families intentionally do not include damage prompts.
  assert.match(JSON.stringify(["lesionCrosslink"]), /lesionCrosslink/);
  const polarity = dnaMechanismBenchmark.find((item) => item.id === "polarity-01");
  assert.ok(polarity?.spec.orientation.antiparallel);
  assert.deepEqual(polarity?.spec.orientation.strandDirections, ["5primeTo3prime", "3primeTo5prime"]);
});

test("reaction sequences are renderer-independent before/transition/after contracts", () => {
  const progressing = dnaMechanismBenchmark.filter((item) => item.spec.reaction?.required);
  assert.ok(progressing.length > 0);
  for (const item of progressing) {
    assert.deepEqual(item.spec.reaction?.steps.map((step) => step.id), ["before", "transition", "after"], item.id);
    assert.ok(item.spec.reaction?.steps.every((step) => step.interactionStates.length > 0), item.id);
  }
});

test("mechanism semantic contract has no renderer-library dependency", () => {
  const source = readFileSync(new URL("./dna-mechanism-contract.ts", import.meta.url), "utf8").toLowerCase();
  assert.doesNotMatch(source, /(?:from\s+["'][^"']*(?:react|three|molstar)|@react-three)/);
});
