import { writeFileSync } from "node:fs";
import { runTeachingBenchmark, teachingBenchmarkReportMarkdown } from "../app/code/spatial-ravia/teaching-benchmark.ts";

const report = runTeachingBenchmark();
writeFileSync("TEACHING_BENCHMARK_V1.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync("TEACHING_BENCHMARK_V1_REPORT.md", teachingBenchmarkReportMarkdown(report));
console.log(JSON.stringify({ version: report.version, total: report.total, passed: report.passed, criticalFailures: report.criticalFailures, holdoutHash: report.holdoutHash, runtimeMs: report.runtimeMs, dimensions: report.dimensionScores, bySplit: report.bySplit, byFamily: report.byFamily }, null, 2));
if (report.passed !== report.total || report.criticalFailures !== 0) process.exitCode = 1;
