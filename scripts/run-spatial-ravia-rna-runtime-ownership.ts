import { rnaV1Benchmark } from "../app/code/spatial-ravia/rna-benchmark.ts";
import { resolveRnaPresentation } from "../app/code/spatial-ravia/RnaPresentationRouter.ts";

const failures: { id: string; expected: string; actual: string }[] = [];
for (const item of rnaV1Benchmark) {
  const route = resolveRnaPresentation(item.prompt);
  if (!route || route.family !== item.expectedFamily) failures.push({ id: item.id, expected: item.expectedFamily, actual: route?.family ?? "unresolved" });
}

console.log("# RNA v1 Runtime Ownership Benchmark");
console.log(`\n- Cases: ${rnaV1Benchmark.length}`);
console.log(`- Passed: ${rnaV1Benchmark.length - failures.length}`);
console.log(`- Failed: ${failures.length}`);
if (failures.length) {
  console.log("\n| ID | Expected family | Actual family |");
  console.log("| --- | --- | --- |");
  for (const failure of failures) console.log(`| ${failure.id} | ${failure.expected} | ${failure.actual} |`);
  process.exitCode = 1;
}
