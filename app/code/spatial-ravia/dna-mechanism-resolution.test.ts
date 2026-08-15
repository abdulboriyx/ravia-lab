import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dnaMechanismBenchmark } from "./dna-mechanism-benchmark.ts";
import { resolveDnaMechanismFamily, resolveDnaMechanismIntent } from "./dna-mechanism-intent.ts";
import { buildDnaMechanismRepresentationPlan, resolveDnaLocalSelections, resolveDnaMolecularGroups } from "./dna-mechanism-resolution.ts";

test("all 60 mechanism prompts resolve to their declared family", () => {
  for (const benchmarkCase of dnaMechanismBenchmark) {
    const resolved = resolveDnaMechanismFamily(benchmarkCase.prompt);
    assert.ok(resolved, benchmarkCase.id);
    assert.equal(resolved.family, benchmarkCase.family, `${benchmarkCase.id}: ${benchmarkCase.prompt}`);
  }
});

test("family-specific conflict guards preserve G-C, phosphodiester, polarity, stabilization, separation, and assembly ownership", () => {
  assert.equal(resolveDnaMechanismFamily("show hydrogen bonds between G and C")?.family, "basePairing");
  assert.equal(resolveDnaMechanismFamily("show a phosphodiester bond")?.family, "backboneChemistry");
  assert.equal(resolveDnaMechanismFamily("why are DNA strands antiparallel")?.family, "polarityAntiparallel");
  assert.equal(resolveDnaMechanismFamily("show base stacking in DNA")?.family, "helixStabilization");
  assert.equal(resolveDnaMechanismFamily("show DNA strands reannealing")?.family, "strandSeparation");
  assert.equal(resolveDnaMechanismFamily("show one nucleotide joining another")?.family, "nucleotideAssembly");
});

test("resolved specs and representation plans preserve existing DNA as substrate", () => {
  for (const benchmarkCase of dnaMechanismBenchmark) {
    const intent = resolveDnaMechanismIntent(benchmarkCase.prompt);
    assert.ok(intent, benchmarkCase.id);
    assert.equal(intent.spec.structuralSubstrate, "existingDnaVisualSystem");
    for (const primitive of benchmarkCase.spec.requiredPrimitives) {
      assert.ok(intent.spec.requiredPrimitives.includes(primitive), `${benchmarkCase.id}: missing ${primitive}`);
    }
    const plan = buildDnaMechanismRepresentationPlan(intent.spec);
    assert.equal(plan.sourceSpec, intent.spec);
    assert.ok(plan.primitives.length > 0, benchmarkCase.id);
    assert.ok(plan.focusAnchors.length > 0, benchmarkCase.id);
    assert.ok(plan.localSelection.every((selection) => selection.source === "existingDnaVisualSystem"), benchmarkCase.id);
  }
});

test("local selections and molecular groups are deterministic and valid", () => {
  for (const benchmarkCase of dnaMechanismBenchmark) {
    const spec = resolveDnaMechanismIntent(benchmarkCase.prompt)!.spec;
    const firstSelections = resolveDnaLocalSelections(spec);
    const secondSelections = resolveDnaLocalSelections(spec);
    assert.deepEqual(firstSelections, secondSelections, benchmarkCase.id);
    const groups = resolveDnaMolecularGroups(spec);
    assert.ok(groups.length > 0, benchmarkCase.id);
    assert.ok(groups.every((group) => group.source === "existingDnaVisualSystem"), benchmarkCase.id);
    assert.ok(groups.every((group) => group.canonicalAnchor.length > 0), benchmarkCase.id);
  }
});

test("planning and intent layers have no rendering-library dependency", () => {
  for (const file of ["dna-mechanism-intent.ts", "dna-mechanism-resolution.ts"]) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?:from\s+["'][^"']*(?:react|three|molstar)|@react-three)/, file);
  }
});
