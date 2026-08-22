import { p2IHoldoutCases, p2IScientificBenchmarkVersion, runP2IBenchmark } from "./p2-i-scientific-benchmark.ts";

/** Frozen at corpus v1; holdout callers must not mutate or append cases. */
export const sealedP2IHoldoutCases = Object.freeze(p2IHoldoutCases.map((item) => Object.freeze({ ...item })));
export const sealedP2IHoldoutVersion = p2IScientificBenchmarkVersion;
export function runSealedP2IHoldoutOnce() { return runP2IBenchmark(sealedP2IHoldoutCases); }
