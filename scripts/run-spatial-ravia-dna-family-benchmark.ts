import { writeFileSync } from "node:fs";

import { dnaFamilyBenchmark, dnaFamilyBenchmarkVersion, type DnaBenchmarkCase } from "../app/code/spatial-ravia/dna-family-benchmark.ts";
import type { DnaSceneFamily, DnaStrandState } from "../app/code/spatial-ravia/biology-dna-representation-contract.ts";
import { parseBiologyPromptSemantically } from "../app/code/spatial-ravia/biology-semantic-parser.ts";
import type { BiologySceneSpec } from "../app/code/spatial-ravia/biology-scene-spec.ts";

type ActualFamily = DnaSceneFamily | "non-dna";
type Failure = "none" | "valid prompt rejected" | "unsupported prompt accepted" | "wrong scene family" | "wrong scale" | "wrong DNA state" | "missing important entity";

function familyFor(scene: BiologySceneSpec): ActualFamily {
  const ids = new Set(scene.entities.map((entity) => entity.id));
  if (ids.has("rna-polymerase") || ids.has("transcription-bubble") || ids.has("rna-transcript")) return "transcription";
  if (ids.has("fork") || ids.has("helicase") || ids.has("primase") || ids.has("okazaki-fragment") || ids.has("ssb") || ids.has("rpa")) return "replication";
  if (ids.has("promoter")) return "sequence-regulation";
  if (ids.has("repair-machinery") || ids.has("damage")) return "damage-repair";
  if (ids.has("histone")) return "packaging";
  if (ids.has("base-pair")) return "local-chemistry";
  return ids.has("dna") ? "structure" : "non-dna";
}

function stateFor(family: ActualFamily): DnaStrandState | "not-dna" {
  if (family === "replication" || family === "transcription") return "locally-open";
  return family === "non-dna" ? "not-dna" : "double-stranded";
}

// The benchmark names semantic roles canonically; organism-specific scenes may
// use a more precise implementation ID for the same role.
function hasImportantEntity(entityIds: string[], expectedId: string) {
  const aliases: Record<string, string[]> = {
    "rna-polymerase": ["rna-polymerase", "bacterial-rna-polymerase", "rna-polymerase-ii"],
  };
  return (aliases[expectedId] ?? [expectedId]).some((id) => entityIds.includes(id));
}

function evaluate(testCase: DnaBenchmarkCase) {
  const result = parseBiologyPromptSemantically(testCase.prompt);
  const expected = testCase.expected;
  const actual = result.status === "supported" ? result.scene : undefined;
  const family = actual ? familyFor(actual) : undefined;
  const dnaState = family ? stateFor(family) : undefined;
  const entities = actual?.entities.map((entity) => entity.id) ?? [];
  const missingEntities = expected.importantEntities.filter((id) => !hasImportantEntity(entities, id));
  const failures: Failure[] = [];

  if (expected.supported && !actual) failures.push("valid prompt rejected");
  if (!expected.supported && actual) failures.push("unsupported prompt accepted");
  if (expected.supported && actual && family !== expected.sceneFamily) failures.push("wrong scene family");
  if (expected.supported && actual && actual.scale !== expected.scale) failures.push("wrong scale");
  if (expected.supported && actual && dnaState !== expected.dnaState) failures.push("wrong DNA state");
  if (expected.supported && actual && missingEntities.length > 0) failures.push("missing important entity");

  const actualResult = result.status === "supported"
    ? { status: result.status, confidence: result.confidence, source: result.source, sceneFamily: family, scale: actual?.scale, dnaState, entities }
    : { status: result.status, confidence: result.confidence, reason: result.reason };

  return {
    id: testCase.id, prompt: testCase.prompt, expected, actual: actual ? {
      ...actualResult,
    } : actualResult,
    passed: failures.length === 0, failures: failures.length ? failures : ["none" as const], missingEntities,
  };
}

const results = dnaFamilyBenchmark.map(evaluate);
const failures = results.filter((result) => !result.passed);
const byFamily = Object.fromEntries(
  ["structure", "sequence-regulation", "replication", "transcription", "damage-repair", "packaging", "local-chemistry"].map((family) => {
    const group = results.filter((result) => result.expected.sceneFamily === family);
    return [family, { total: group.length, passed: group.filter((result) => result.passed).length, failed: group.filter((result) => !result.passed).length }];
  })
);
const byFailure = Object.fromEntries(
  [...new Set(failures.flatMap((result) => result.failures))].filter((failure) => failure !== "none").map((failure) => [failure, failures.filter((result) => result.failures.includes(failure)).length])
);
const payload = { version: dnaFamilyBenchmarkVersion, total: results.length, passed: results.length - failures.length, failed: failures.length, byFamily, byFailure, results };
writeFileSync("SPATIAL_RAVIA_DNA_FAMILY_BENCHMARK.json", `${JSON.stringify(payload, null, 2)}\n`);
const markdown = [
  "# DNA Semantic Parser Benchmark", "", `Version: ${dnaFamilyBenchmarkVersion}`, "",
  `- Cases: ${results.length}`, `- Passed: ${payload.passed}`, `- Failed: ${payload.failed}`, "",
  "## Results by family", "", "| Family | Cases | Passed | Failed |", "| --- | ---: | ---: | ---: |",
  ...Object.entries(byFamily).map(([family, value]) => `| ${family} | ${value.total} | ${value.passed} | ${value.failed} |`), "",
  "## Failure categories", "", ...Object.entries(byFailure).map(([failure, count]) => `- ${failure}: ${count}`), "",
  "## Failed cases", "", "| ID | Expected family | Prompt | Failures |", "| --- | --- | --- | --- |",
  ...failures.map((result) => `| ${result.id} | ${result.expected.sceneFamily} | ${result.prompt} | ${result.failures.join(", ")} |`), "",
].join("\n");
writeFileSync("SPATIAL_RAVIA_DNA_FAMILY_BENCHMARK_REPORT.md", markdown);
console.log(markdown);
