import { rnaV1Benchmark } from "../app/code/spatial-ravia/rna-benchmark.ts";
import { resolveRnaFamily } from "../app/code/spatial-ravia/rna-intent.ts";

const results = rnaV1Benchmark.map((item) => ({ item, resolved: resolveRnaFamily(item.prompt) }));
const passed = results.filter(({ item, resolved }) => resolved?.family === item.expectedFamily).length;
console.log("# RNA v1 Semantic Benchmark\n");
console.log(`- Cases: ${results.length}`);
console.log(`- Passed: ${passed}`);
console.log(`- Failed: ${results.length - passed}`);
for (const { item, resolved } of results.filter(({ item, resolved }) => resolved?.family !== item.expectedFamily)) console.log(`- ${item.id}: expected ${item.expectedFamily}, got ${resolved?.family ?? "unsupported"}`);
if (passed !== results.length) process.exitCode = 1;

