import { writeFileSync } from "node:fs";
import { cellBiologyBenchmarkReportMarkdown, runCellBiologyBenchmark } from "../app/code/spatial-ravia/cell-biology-benchmark.ts";

const report = runCellBiologyBenchmark();
writeFileSync("CELL_BIOLOGY_BENCHMARK_V1.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync("CELL_BIOLOGY_BENCHMARK_V1_REPORT.md", `${cellBiologyBenchmarkReportMarkdown(report)}\n`);
console.log(JSON.stringify({ total: report.total, dev: report.dev, holdout: report.holdout, passed: report.passed, criticalFailures: report.criticalFailures, holdoutHash: report.holdoutHash, runtimeMs: report.runtimeMs }, null, 2));
if (report.passed !== report.total || report.criticalFailures !== 0) process.exitCode = 1;
