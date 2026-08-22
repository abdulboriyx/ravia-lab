import { createP3FDevCorpus, createP3FSealedHoldout, p3fCorpusVersion, p3fHoldoutHash, runP3FBenchmark, summarizeP3FResults } from "../app/code/spatial-ravia/p3-f-mechanism-presentation-benchmark.ts";

const dev = runP3FBenchmark(createP3FDevCorpus());
const holdout = runP3FBenchmark(createP3FSealedHoldout());
const print = (name: string, results: typeof dev) => {
  const summary = summarizeP3FResults(results);
  console.log(`${name}: ${summary.passed}/${summary.total} passed; critical=${summary.criticalFailures}`);
  console.log(JSON.stringify(summary, null, 2));
  return summary;
};

console.log(`# P3-F ${p3fCorpusVersion}`);
console.log(`Sealed holdout hash: ${p3fHoldoutHash}`);
const devSummary = print("DEV", dev);
const holdoutSummary = print("SEALED_HOLDOUT", holdout);
if (devSummary.criticalFailures > 0 || holdoutSummary.criticalFailures > 0) process.exitCode = 1;
