import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { exportBenchmarkCorpusV1, exportBenchmarkReportMarkdown, runExportBenchmark } from "../app/code/spatial-ravia/export-benchmark.ts";

async function main(): Promise<void> {
  const corpus = exportBenchmarkCorpusV1();
  const holdoutPayload = JSON.stringify(corpus.filter((item) => item.split === "SEALED_HOLDOUT"));
  const holdoutHash = createHash("sha256").update(holdoutPayload).digest("hex");
  const report = await runExportBenchmark();
  const frozen = { ...report, holdoutHash };
  writeFileSync("EXPORT_BENCHMARK_V1.json", `${JSON.stringify(frozen, null, 2)}\n`);
  writeFileSync("EXPORT_BENCHMARK_V1_REPORT.md", exportBenchmarkReportMarkdown(frozen));
  console.log(JSON.stringify({ version: frozen.version, total: frozen.total, passed: frozen.passed, criticalFailures: frozen.criticalFailures, holdoutHash: frozen.holdoutHash, runtimeMs: frozen.runtimeMs, dimensions: frozen.dimensions, bySplit: frozen.bySplit, byCategory: frozen.byCategory, partialStatuses: frozen.partialStatuses, unsupportedStatuses: frozen.unsupportedStatuses }, null, 2));
  if (frozen.passed !== frozen.total || frozen.criticalFailures !== 0) process.exitCode = 1;
}
void main();
