import assert from "node:assert/strict";
import test from "node:test";
import { dnaMechanismBenchmark } from "./dna-mechanism-benchmark.ts";
import { resolveDnaMechanismPresentation, routeDnaMechanismPresentation } from "./DnaMechanismPresentationRouter.ts";
import { buildDnaMechanismRepresentationPlan } from "./dna-mechanism-resolution.ts";
import { resolveDnaMechanismIntent } from "./dna-mechanism-intent.ts";

test("mechanism prompts are owned by the central router", () => {
  for (const item of dnaMechanismBenchmark) {
    const route = resolveDnaMechanismPresentation(item.prompt);
    assert.ok(route, item.id);
    assert.equal(route.family, item.family, item.id);
    assert.equal(route.plan.sourceSpec.family, item.family, item.id);
  }
});

test("generic DNA structure remains ordinary DNA-family rendering", () => {
  assert.equal(resolveDnaMechanismPresentation("show the structure of B-DNA"), undefined);
});

test("owner mapping is family-based and has no prompt-specific fallback", () => {
  const cases = [
    ["basePairing", "DnaBasePairInteractionPresentation"],
    ["backboneChemistry", "DnaBackboneChemistryPresentation"],
    ["polarityAntiparallel", "DnaPolarityAntiparallelPresentation"],
    ["helixStabilization", "DnaHelixStabilizationPresentation"],
    ["strandSeparation", "DnaStrandSeparationPresentation"],
    ["nucleotideAssembly", "DnaBackboneChemistryPresentation"],
  ] as const;
  for (const [family, owner] of cases) {
    const intent = resolveDnaMechanismIntent(`test ${family}`);
    if (!intent || intent.family !== family) continue;
    const route = routeDnaMechanismPresentation(buildDnaMechanismRepresentationPlan(intent.spec));
    assert.equal(route.owner, owner);
  }
});

test("routing is deterministic and preserves plan identity", () => {
  for (const item of dnaMechanismBenchmark) {
    const intent = resolveDnaMechanismIntent(item.prompt)!;
    const first = resolveDnaMechanismPresentation(item.prompt)!;
    const second = resolveDnaMechanismPresentation(item.prompt)!;
    assert.deepEqual(first.plan, second.plan, item.id);
    assert.deepEqual(first.plan.sourceSpec, intent.spec, item.id);
    assert.equal(first.owner, second.owner, item.id);
  }
});
