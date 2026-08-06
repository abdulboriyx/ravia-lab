import { readFileSync, writeFileSync } from "node:fs";
import {
  applyFollowUpCommand,
  createInitialSession,
  parsePromptWithPacks,
  resolvePromptIntent,
  startSessionFromPrompt
} from "../app/code/spatial-ravia/model.ts";
import type { RepresentationMode } from "../app/code/spatial-ravia/model.ts";
import { processPacks } from "../app/code/spatial-ravia/process-registry.ts";
import { selectScientificRepresentation } from "../app/code/spatial-ravia/representation-selection.ts";
import type {
  QuantitativeDataAvailability,
  ScientificRepresentation,
  ScientificScale
} from "../app/code/spatial-ravia/representation-selection.ts";

type HoldoutCase = {
  id: string;
  category: string;
  prompt?: string;
  initialPrompt?: string;
  command?: string;
  expectedSupported?: boolean;
  expectedAbstention?: boolean;
  expectedProcessId?: string;
  expectedContextIncludes?: string;
  expectedEntities?: string[];
  expectedRepresentation?: RepresentationMode;
  expectedPrimaryRepresentation?: ScientificRepresentation;
  expectedWarningIncludes?: string;
  expectedInterventionId?: string;
  expectedSelectedEntities?: string[];
  expectedHiddenEntities?: string[];
  expectedIsolatedEntity?: string;
  expectedPlaybackPlaying?: boolean;
  expectedPlaybackSpeed?: number;
  expectedTimelinePosition?: number;
  expectedDirectionality?: boolean;
};

type HoldoutSet = {
  suite: string;
  version: string;
  rule: string;
  cases: HoldoutCase[];
};

type Check = {
  dimension: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  detail: string;
};

type CaseResult = {
  id: string;
  category: string;
  prompt?: string;
  command?: string;
  passed: boolean;
  checks: Check[];
  failureAnalysis: string[];
};

const holdout = JSON.parse(readFileSync("SPATIAL_RAVIA_HOLDOUT_SET.json", "utf8")) as HoldoutSet;

const results = holdout.cases.map(evaluateHoldoutCase);
const passedCases = results.filter((result) => result.passed).length;
const report = {
  suite: holdout.suite,
  version: holdout.version,
  generatedAt: new Date().toISOString(),
  rule: holdout.rule,
  totalCases: results.length,
  passedCases,
  failedCases: results.length - passedCases,
  passRate: Number((passedCases / results.length).toFixed(4)),
  byCategory: summarizeByCategory(results),
  results
};

writeFileSync("SPATIAL_RAVIA_HOLDOUT_REPORT.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync("SPATIAL_RAVIA_HOLDOUT_REPORT.md", renderMarkdown(report));

console.log(JSON.stringify({
  suite: report.suite,
  totalCases: report.totalCases,
  passedCases: report.passedCases,
  failedCases: report.failedCases,
  passRate: report.passRate
}, null, 2));

function evaluateHoldoutCase(testCase: HoldoutCase): CaseResult {
  const checks: Check[] = [];

  if (testCase.prompt) {
    const parsed = parsePromptWithPacks(testCase.prompt, processPacks);
    const resolution = resolvePromptIntent(testCase.prompt, processPacks);

    if (testCase.expectedSupported !== undefined) {
      checks.push(check("abstention", parsed.supported === testCase.expectedSupported, testCase.expectedSupported, parsed.supported, "Prompt support classification."));
    }

    if (testCase.expectedAbstention) {
      checks.push(check("abstention", !parsed.supported, "unsupported", parsed.supported ? "supported" : parsed.reason, "Prompt should abstain instead of inventing unsupported behavior."));
    }

    if (testCase.expectedProcessId) {
      checks.push(check("process-selection", resolution.processCandidates[0]?.packId === testCase.expectedProcessId, testCase.expectedProcessId, resolution.processCandidates[0]?.packId ?? null, "Top process candidate."));
    }

    if (testCase.expectedContextIncludes) {
      const context = parsed.supported ? parsed.context : resolution.biologicalContext.value;
      checks.push(check("context-extraction", String(context ?? "").toLowerCase().includes(testCase.expectedContextIncludes.toLowerCase()), testCase.expectedContextIncludes, context, "Context extraction."));
    }

    for (const entityId of testCase.expectedEntities ?? []) {
      checks.push(check("entity-resolution", resolution.requestedEntities.includes(entityId), entityId, resolution.requestedEntities, "Requested entity resolution."));
    }

    if (testCase.expectedRepresentation) {
      checks.push(check("representation-selection", resolution.requestedRepresentation === testCase.expectedRepresentation, testCase.expectedRepresentation, resolution.requestedRepresentation ?? null, "Requested representation parsing."));
    }

    if (testCase.expectedInterventionId) {
      checks.push(check(
        "follow-up-state",
        resolution.requestedIntervention?.commandId === testCase.expectedInterventionId ||
          resolution.requestedIntervention?.interventionId === testCase.expectedInterventionId,
        testCase.expectedInterventionId,
        resolution.requestedIntervention ?? null,
        "Prompt-level intervention resolution."
      ));
    }

    if (parsed.supported && (testCase.expectedPrimaryRepresentation || testCase.expectedWarningIncludes)) {
      const decision = selectScientificRepresentation({
        model: parsed.model,
        representationRules: parsed.model.representationRules,
        userIntent: {
          requestedRepresentation: resolution.requestedRepresentation,
          requestedFocus: resolution.requestedFocus,
          requestedEntities: resolution.requestedEntities,
          requestedIntervention: resolution.requestedIntervention
        },
        availableRenderers: [
          "schematic-3d",
          "molecular-3d",
          "process-diagram",
          "network",
          "timeline",
          "time-series-graph",
          "state-space-view",
          "mixed-representation"
        ],
        scale: inferScale(parsed.model.process),
        quantitativeData: inferQuantitativeData(parsed.model.process)
      });

      if (testCase.expectedPrimaryRepresentation) {
        checks.push(check("visualization-honesty", decision.primaryRepresentation === testCase.expectedPrimaryRepresentation, testCase.expectedPrimaryRepresentation, decision.primaryRepresentation, "Primary representation honesty."));
      }

      if (testCase.expectedWarningIncludes) {
        const warnings = [decision.literalVersusSchematicWarning, ...decision.unsupportedViewWarnings].join(" ");
        checks.push(check("visualization-honesty", warnings.toLowerCase().includes(testCase.expectedWarningIncludes.toLowerCase()), testCase.expectedWarningIncludes, warnings, "Honesty warning text."));
      }
    }
  } else if (testCase.initialPrompt && testCase.command) {
    const session = startSessionFromPrompt(createInitialSession(), testCase.initialPrompt, processPacks);
    const updated = applyFollowUpCommand(session, testCase.command);

    if (testCase.expectedProcessId) {
      checks.push(check("process-selection", updated.selectedProcessPackId === testCase.expectedProcessId, testCase.expectedProcessId, updated.selectedProcessPackId, "Follow-up preserves process."));
    }

    if (testCase.expectedInterventionId) {
      checks.push(check("follow-up-state", updated.activeIntervention === testCase.expectedInterventionId, testCase.expectedInterventionId, updated.activeIntervention, "Follow-up intervention state."));
    }

    for (const entityId of testCase.expectedSelectedEntities ?? []) {
      checks.push(check("entity-resolution", updated.selectedEntities.includes(entityId), entityId, updated.selectedEntities, "Follow-up selected entity."));
    }

    for (const entityId of testCase.expectedHiddenEntities ?? []) {
      checks.push(check("follow-up-state", updated.hiddenEntities.includes(entityId), entityId, updated.hiddenEntities, "Follow-up hidden entity."));
    }

    if (testCase.expectedIsolatedEntity) {
      checks.push(check("follow-up-state", updated.isolatedEntity === testCase.expectedIsolatedEntity, testCase.expectedIsolatedEntity, updated.isolatedEntity, "Follow-up isolated entity."));
    }

    if (testCase.expectedRepresentation) {
      checks.push(check("representation-selection", updated.representationMode === testCase.expectedRepresentation, testCase.expectedRepresentation, updated.representationMode, "Follow-up representation."));
    }

    if (testCase.expectedPlaybackPlaying !== undefined) {
      checks.push(check("follow-up-state", updated.playback.playing === testCase.expectedPlaybackPlaying, testCase.expectedPlaybackPlaying, updated.playback.playing, "Playback playing state."));
    }

    if (testCase.expectedPlaybackSpeed !== undefined) {
      checks.push(check("follow-up-state", updated.playback.speed === testCase.expectedPlaybackSpeed, testCase.expectedPlaybackSpeed, updated.playback.speed, "Playback speed."));
    }

    if (testCase.expectedTimelinePosition !== undefined) {
      checks.push(check("follow-up-state", updated.playback.timelinePosition === testCase.expectedTimelinePosition, testCase.expectedTimelinePosition, updated.playback.timelinePosition, "Timeline position."));
    }

    if (testCase.expectedDirectionality !== undefined) {
      checks.push(check("follow-up-state", updated.playback.showDirectionality === testCase.expectedDirectionality, testCase.expectedDirectionality, updated.playback.showDirectionality, "Directionality display."));
    }
  } else {
    checks.push(check("case-format", false, "prompt or initialPrompt+command", testCase, "Holdout case format."));
  }

  const failureAnalysis = checks
    .filter((item) => !item.passed)
    .map((item) => `${item.dimension}: expected ${JSON.stringify(item.expected)}, got ${JSON.stringify(item.actual)}.`);

  return {
    id: testCase.id,
    category: testCase.category,
    prompt: testCase.prompt ?? testCase.initialPrompt,
    command: testCase.command,
    passed: checks.every((item) => item.passed),
    checks,
    failureAnalysis
  };
}

function check(dimension: string, passed: boolean, expected: unknown, actual: unknown, detail: string): Check {
  return { dimension, passed, expected, actual, detail };
}

function summarizeByCategory(resultsToSummarize: CaseResult[]) {
  const summary: Record<string, { total: number; passed: number; failed: number }> = {};

  for (const result of resultsToSummarize) {
    summary[result.category] ??= { total: 0, passed: 0, failed: 0 };
    summary[result.category].total += 1;
    if (result.passed) {
      summary[result.category].passed += 1;
    } else {
      summary[result.category].failed += 1;
    }
  }

  return summary;
}

function inferScale(process: string): ScientificScale {
  if (process === "Two-body orbit") {
    return "abstract";
  }

  return "cellular";
}

function inferQuantitativeData(process: string): QuantitativeDataAvailability {
  return {
    timeSeries: process === "Action potential" || process === "Two-body orbit",
    kineticParameters: process === "Two-body orbit",
    stateVariables: process === "Action potential" || process === "Two-body orbit",
    structuralData: false,
    networkEdges: true
  };
}

function renderMarkdown(input: typeof report) {
  const failing = input.results.filter((result) => !result.passed);
  const lines = [
    "# Spatial RAVIA Holdout Report",
    "",
    `Generated: ${input.generatedAt}`,
    "",
    "## Protocol",
    "",
    input.rule,
    "",
    "The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.",
    "",
    "## Summary",
    "",
    `- Total cases: ${input.totalCases}`,
    `- Passed: ${input.passedCases}`,
    `- Failed: ${input.failedCases}`,
    `- Pass rate: ${(input.passRate * 100).toFixed(1)}%`,
    "",
    "## Category Results",
    ""
  ];

  for (const [category, counts] of Object.entries(input.byCategory)) {
    lines.push(`- ${category}: ${counts.passed}/${counts.total} passed`);
  }

  lines.push("", "## Failure Categories", "");

  if (failing.length === 0) {
    lines.push("No failures.");
  } else {
    const grouped = summarizeByCategory(failing);
    for (const [category, counts] of Object.entries(grouped)) {
      lines.push(`- ${category}: ${counts.failed} failure(s)`);
    }
  }

  lines.push("", "## Failed Cases", "");

  for (const result of failing) {
    lines.push(`### ${result.id} ${result.category}`, "");
    lines.push(`Prompt: ${result.prompt ?? ""}`);
    if (result.command) {
      lines.push(`Command: ${result.command}`);
    }
    for (const failure of result.failureAnalysis) {
      lines.push(`- ${failure}`);
    }
    lines.push("");
  }

  lines.push(
    "## Release Decision",
    "",
    input.failedCases === 0
      ? "Release freeze is reasonable from this holdout pass, pending remote CI and stakeholder review."
      : "Do not release-freeze yet. Run a stabilization pass only for genuine product defects represented by the failed categories, then rerun a new holdout or a clearly marked regression subset.",
    "",
    "## Known Limitations",
    "",
    "- This holdout validates deterministic process selection, entity extraction, representation requests, abstention, and command state changes.",
    "- It does not prove open-ended scientific completeness beyond the registered process packs.",
    "- It does not make live provider calls or add retrieval.",
    "- Browser visual regression remains covered by the existing static smoke gate, not by this prompt holdout."
  );

  return `${lines.join("\n")}\n`;
}
