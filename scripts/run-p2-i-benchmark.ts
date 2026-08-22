import { p2IDevCases, runP2IBenchmark } from "../app/code/spatial-ravia/p2-i-scientific-benchmark.ts";
import { runSealedP2IHoldoutOnce } from "../app/code/spatial-ravia/p2-i-scientific-benchmark.holdout.ts";

const summarize = (label: string, result: ReturnType<typeof runP2IBenchmark>) => {
  const byDomain = result.results.reduce<Record<string, typeof result.results>>((groups, item) => { const key = p2IDevCases.find((candidate) => candidate.id === item.id)?.id.startsWith("dna-") ? "DNA" : "RNA/CROSS"; (groups[key] ??= []).push(item); return groups; }, {});
  console.log(JSON.stringify({ label, total: result.total, passed: result.passed, criticalFailures: result.criticalFailures, noncriticalFailures: result.noncriticalFailures, dimensions: result.dimensions, byDomain: Object.fromEntries(Object.entries(byDomain).map(([key, items]) => [key, { total: items?.length ?? 0, passed: items?.filter((item) => item.passed).length ?? 0 }])) }, null, 2));
};

summarize("DEV", runP2IBenchmark(p2IDevCases));
summarize("SEALED_HOLDOUT", runSealedP2IHoldoutOnce());
