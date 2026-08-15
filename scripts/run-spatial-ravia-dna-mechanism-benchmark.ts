import { dnaMechanismBenchmark } from "../app/code/spatial-ravia/dna-mechanism-benchmark.ts";
import { resolveDnaMechanismIntent } from "../app/code/spatial-ravia/dna-mechanism-intent.ts";

const failures = dnaMechanismBenchmark.flatMap((benchmarkCase) => {
  const resolved = resolveDnaMechanismIntent(benchmarkCase.prompt);
  const missingPrimitives = resolved
    ? benchmarkCase.spec.requiredPrimitives.filter((primitive) => !resolved.spec.requiredPrimitives.includes(primitive))
    : [];
  return !resolved || resolved.family !== benchmarkCase.family || missingPrimitives.length > 0
    ? [{ id: benchmarkCase.id, prompt: benchmarkCase.prompt, expected: benchmarkCase.family, actual: resolved?.family ?? "unresolved", missingPrimitives: missingPrimitives.join(",") }]
    : [];
});

console.log("# DNA Molecular Mechanism Benchmark");
console.log("");
console.log(`- Cases: ${dnaMechanismBenchmark.length}`);
console.log(`- Passed: ${dnaMechanismBenchmark.length - failures.length}`);
console.log(`- Failed: ${failures.length}`);
if (failures.length > 0) {
  console.log("");
  console.table(failures);
  process.exitCode = 1;
}
