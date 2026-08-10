import { writeFileSync } from "node:fs";

import { detectBiologyContext } from "../app/code/spatial-ravia/biology-context.ts";
import type { BiologyParseResult } from "../app/code/spatial-ravia/biology-parse-result.ts";
import { parseBiologyScenePrompt } from "../app/code/spatial-ravia/biology-parser.ts";
import type { BiologySceneSpec } from "../app/code/spatial-ravia/biology-scene-spec.ts";
import { chooseBiologyRenderer } from "../app/code/spatial-ravia/biology-renderer-router.ts";
import {
  transcriptionHoldoutSet,
  type TranscriptionHoldoutCase,
  type TranscriptionHoldoutCategory,
} from "../app/code/spatial-ravia/transcription-holdout-set.ts";
import type { ExpectedAction, ExpectedRelation } from "../app/code/spatial-ravia/semantic-holdout-set.ts";

type FailureCategory =
  | "none"
  | "valid prompt rejected"
  | "ambiguity handled too confidently"
  | "missing required entity"
  | "extra incorrect entity"
  | "wrong action"
  | "wrong relation"
  | "wrong renderer"
  | "wrong organism context"
  | "replication/transcription confusion"
  | "other";

type EvaluatedCase = {
  id: string;
  category: TranscriptionHoldoutCategory;
  prompt: string;
  expected: TranscriptionHoldoutCase["expected"];
  actual: {
    status: BiologyParseResult["status"];
    confidence: number;
    source?: "deterministic" | "semantic";
    renderer?: ReturnType<typeof chooseBiologyRenderer>;
    organismContext: ReturnType<typeof detectBiologyContext>["organism"];
    entities: string[];
    actions: ExpectedAction[];
    relations: ExpectedRelation[];
    reason?: string;
  };
  score: {
    supportCorrect: boolean;
    rendererCorrect: boolean | null;
    requiredEntityRecall: number | null;
    forbiddenEntityFalsePositiveRate: number | null;
    actionAccuracy: number | null;
    relationAccuracy: number | null;
    organismContextCorrect: boolean | null;
    exactSemanticPass: boolean;
    confusedReplicationTranscription: boolean;
  };
  failureCategory: FailureCategory;
  failureReasons: string[];
};

const jsonPath = "SPATIAL_RAVIA_TRANSCRIPTION_HOLDOUT.json";
const reportPath = "SPATIAL_RAVIA_TRANSCRIPTION_HOLDOUT_REPORT.md";
const baselineBeforeHoldoutTuning = {
  note: "First frozen transcription holdout run before post-baseline parser changes.",
  total: 90,
  supportedCount: 75,
  unsupportedCount: 15,
  exactSemanticPassRate: 0.4111111111111111,
  supportedClassPassRate: 0.4,
  supportClassificationAccuracy: 0.6444444444444445,
  falseSupportedRate: 0.5333333333333333,
  falseSupportedCount: 8,
  organismContextAccuracy: 1,
  replicationTranscriptionConfusionRate: 0,
  failureClusters: {
    "valid prompt rejected": 24,
    "wrong renderer": 15,
    "ambiguity handled too confidently": 8,
    "extra incorrect entity": 4,
    "missing required entity": 2,
  },
};

function hasEntity(scene: BiologySceneSpec, entityId: string) {
  return scene.entities.some((entity) => entity.id === entityId);
}

function hasAction(scene: BiologySceneSpec, expected: ExpectedAction) {
  return scene.actions.some(
    (action) =>
      action.actor === expected.actor &&
      action.action === expected.action &&
      action.target === expected.target
  );
}

function hasRelation(scene: BiologySceneSpec, expected: ExpectedRelation) {
  return scene.relations.some(
    (relation) =>
      relation.subject === expected.subject &&
      relation.relation === expected.relation &&
      (expected.object === undefined || relation.object === expected.object)
  );
}

function ratio(passed: number, total: number) {
  return total === 0 ? null : passed / total;
}

function isReplicationTranscriptionConfusion(entityIds: string[]) {
  const hasTranscription = entityIds.some((id) =>
    [
      "rna-polymerase",
      "bacterial-rna-polymerase",
      "rna-polymerase-ii",
      "rna-transcript",
      "transcription-bubble",
      "promoter",
      "gene",
      "template-strand",
      "coding-strand",
    ].includes(id)
  );
  const hasReplication = entityIds.some((id) =>
    [
      "fork",
      "helicase",
      "daughter-leading-strand",
      "daughter-lagging-strand",
      "okazaki-fragment",
      "ligase",
      "ssdna-binding-protein",
      "rpa",
      "ssb",
    ].includes(id)
  );
  return hasTranscription && hasReplication;
}

function evaluateCase(testCase: TranscriptionHoldoutCase): EvaluatedCase {
  const result = parseBiologyScenePrompt(testCase.prompt);
  const context = detectBiologyContext(testCase.prompt);
  const expected = testCase.expected;
  const actual: EvaluatedCase["actual"] = {
    status: result.status,
    confidence: result.confidence,
    organismContext: context.organism,
    entities: [],
    actions: [],
    relations: [],
  };

  if (result.status === "supported") {
    actual.source = result.source;
    actual.renderer = chooseBiologyRenderer(result.scene);
    actual.entities = result.scene.entities.map((entity) => entity.id);
    actual.actions = result.scene.actions.map((action) => ({
      actor: action.actor,
      action: action.action,
      target: action.target,
    }));
    actual.relations = result.scene.relations.map((relation) => ({
      subject: relation.subject,
      relation: relation.relation,
      object: relation.object,
    }));
  } else {
    actual.reason = result.reason;
  }

  const failureReasons: string[] = [];
  const supportCorrect = result.status === (expected.supported ? "supported" : "unsupported");
  if (!supportCorrect) {
    failureReasons.push(
      expected.supported
        ? "Expected supported scene but parser returned unsupported."
        : "Expected unsupported prompt but parser returned a scene."
    );
  }

  if (!expected.supported) {
    const confusedReplicationTranscription =
      result.status === "supported" && isReplicationTranscriptionConfusion(actual.entities);
    return {
      id: testCase.id,
      category: testCase.category,
      prompt: testCase.prompt,
      expected,
      actual,
      score: {
        supportCorrect,
        rendererCorrect: null,
        requiredEntityRecall: null,
        forbiddenEntityFalsePositiveRate: null,
        actionAccuracy: null,
        relationAccuracy: null,
        organismContextCorrect: null,
        exactSemanticPass: supportCorrect,
        confusedReplicationTranscription,
      },
      failureCategory: supportCorrect
        ? "none"
        : confusedReplicationTranscription
          ? "replication/transcription confusion"
          : "ambiguity handled too confidently",
      failureReasons,
    };
  }

  if (result.status !== "supported") {
    return {
      id: testCase.id,
      category: testCase.category,
      prompt: testCase.prompt,
      expected,
      actual,
      score: {
        supportCorrect,
        rendererCorrect: false,
        requiredEntityRecall: 0,
        forbiddenEntityFalsePositiveRate: 0,
        actionAccuracy: 0,
        relationAccuracy: 0,
        organismContextCorrect: expected.organismContext ? false : null,
        exactSemanticPass: false,
        confusedReplicationTranscription: false,
      },
      failureCategory: "valid prompt rejected",
      failureReasons,
    };
  }

  const scene = result.scene;
  const requiredEntities = expected.requiredEntities ?? [];
  const forbiddenEntities = expected.forbiddenEntities ?? [];
  const requiredActions = expected.requiredActions ?? [];
  const requiredRelations = expected.requiredRelations ?? [];
  const presentRequiredEntities = requiredEntities.filter((entityId) => hasEntity(scene, entityId));
  const presentForbiddenEntities = forbiddenEntities.filter((entityId) => hasEntity(scene, entityId));
  const presentRequiredActions = requiredActions.filter((action) => hasAction(scene, action));
  const presentRequiredRelations = requiredRelations.filter((relation) => hasRelation(scene, relation));
  const renderer = chooseBiologyRenderer(scene);

  if (renderer !== expected.renderer) {
    failureReasons.push(`Expected renderer ${expected.renderer}, got ${renderer}.`);
  }
  for (const entityId of requiredEntities) {
    if (!hasEntity(scene, entityId)) {
      failureReasons.push(`Missing required entity ${entityId}.`);
    }
  }
  for (const entityId of forbiddenEntities) {
    if (hasEntity(scene, entityId)) {
      failureReasons.push(`Forbidden entity ${entityId} present.`);
    }
  }
  for (const action of requiredActions) {
    if (!hasAction(scene, action)) {
      failureReasons.push(`Missing action ${action.actor}/${action.action}/${action.target ?? ""}.`);
    }
  }
  for (const relation of requiredRelations) {
    if (!hasRelation(scene, relation)) {
      failureReasons.push(`Missing relation ${relation.subject}/${relation.relation}/${relation.object ?? ""}.`);
    }
  }
  if (expected.organismContext && context.organism !== expected.organismContext) {
    failureReasons.push(`Expected organism ${expected.organismContext}, got ${context.organism}.`);
  }

  const confusedReplicationTranscription = isReplicationTranscriptionConfusion(actual.entities);
  const score = {
    supportCorrect,
    rendererCorrect: renderer === expected.renderer,
    requiredEntityRecall: ratio(presentRequiredEntities.length, requiredEntities.length),
    forbiddenEntityFalsePositiveRate: ratio(presentForbiddenEntities.length, forbiddenEntities.length),
    actionAccuracy: ratio(presentRequiredActions.length, requiredActions.length),
    relationAccuracy: ratio(presentRequiredRelations.length, requiredRelations.length),
    organismContextCorrect: expected.organismContext
      ? context.organism === expected.organismContext
      : null,
    exactSemanticPass: failureReasons.length === 0,
    confusedReplicationTranscription,
  };

  return {
    id: testCase.id,
    category: testCase.category,
    prompt: testCase.prompt,
    expected,
    actual,
    score,
    failureCategory: score.exactSemanticPass
      ? "none"
      : classifyFailure(score, failureReasons),
    failureReasons,
  };
}

function classifyFailure(
  score: EvaluatedCase["score"],
  reasons: string[]
): FailureCategory {
  if (score.confusedReplicationTranscription) return "replication/transcription confusion";
  if (score.rendererCorrect === false) return "wrong renderer";
  if (score.organismContextCorrect === false) return "wrong organism context";
  if ((score.forbiddenEntityFalsePositiveRate ?? 0) > 0) return "extra incorrect entity";
  if ((score.requiredEntityRecall ?? 1) < 1) return "missing required entity";
  if ((score.actionAccuracy ?? 1) < 1) return "wrong action";
  if ((score.relationAccuracy ?? 1) < 1) return "wrong relation";
  return reasons.length > 0 ? "other" : "none";
}

function average(values: Array<number | null>) {
  const real = values.filter((value): value is number => value !== null);
  return real.length === 0 ? null : real.reduce((sum, value) => sum + value, 0) / real.length;
}

function percent(value: number | null) {
  return value === null ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function summarize(cases: EvaluatedCase[]) {
  const supportedCases = cases.filter((testCase) => testCase.expected.supported);
  const unsupportedCases = cases.filter((testCase) => !testCase.expected.supported);
  const falseSupported = unsupportedCases.filter((testCase) => testCase.actual.status === "supported");
  const trueUnsupported = unsupportedCases.filter((testCase) => testCase.actual.status === "unsupported");
  const predictedUnsupported = cases.filter((testCase) => testCase.actual.status === "unsupported");
  const explicitContextCases = cases.filter(
    (testCase) => testCase.expected.supported && testCase.expected.organismContext
  );

  const failureCounts: Record<string, number> = {};
  for (const testCase of cases) {
    failureCounts[testCase.failureCategory] = (failureCounts[testCase.failureCategory] ?? 0) + 1;
  }

  const categoryMetrics = Object.fromEntries(
    [...new Set(cases.map((testCase) => testCase.category))].map((category) => {
      const categoryCases = cases.filter((testCase) => testCase.category === category);
      return [
        category,
        {
          count: categoryCases.length,
          exactSemanticPassRate: average(categoryCases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)),
          supportAccuracy: average(categoryCases.map((testCase) => testCase.score.supportCorrect ? 1 : 0)),
        },
      ];
    })
  );

  return {
    total: cases.length,
    supportedCount: supportedCases.length,
    unsupportedCount: unsupportedCases.length,
    exactSemanticPassRate: average(cases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)),
    supportedClassPassRate: average(supportedCases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)),
    supportClassificationAccuracy: average(cases.map((testCase) => testCase.score.supportCorrect ? 1 : 0)),
    rendererAccuracy: average(cases.map((testCase) => testCase.score.rendererCorrect === null ? null : testCase.score.rendererCorrect ? 1 : 0)),
    requiredEntityRecall: average(cases.map((testCase) => testCase.score.requiredEntityRecall)),
    forbiddenEntityFalsePositiveRate: average(cases.map((testCase) => testCase.score.forbiddenEntityFalsePositiveRate)),
    actionAccuracy: average(cases.map((testCase) => testCase.score.actionAccuracy)),
    relationAccuracy: average(cases.map((testCase) => testCase.score.relationAccuracy)),
    organismContextAccuracy: average(explicitContextCases.map((testCase) => testCase.score.organismContextCorrect ? 1 : 0)),
    unsupportedPrecision: ratio(trueUnsupported.length, predictedUnsupported.length),
    unsupportedRecall: ratio(trueUnsupported.length, unsupportedCases.length),
    falseSupportedCount: falseSupported.length,
    falseSupportedRate: ratio(falseSupported.length, unsupportedCases.length),
    replicationTranscriptionConfusionRate: average(cases.map((testCase) => testCase.score.confusedReplicationTranscription ? 1 : 0)),
    categoryMetrics,
    failureCounts,
  };
}

function markdownReport(cases: EvaluatedCase[], summary: ReturnType<typeof summarize>) {
  const categoryLines = Object.entries(summary.categoryMetrics)
    .map(([category, metrics]) => `| ${category} | ${metrics.count} | ${percent(metrics.exactSemanticPassRate)} | ${percent(metrics.supportAccuracy)} |`)
    .join("\n");
  const failureLines = Object.entries(summary.failureCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join("\n");
  const failures = cases.filter((testCase) => !testCase.score.exactSemanticPass).slice(0, 10)
    .map((testCase, index) => `${index + 1}. **${testCase.id}** (${testCase.category}): \`${testCase.prompt}\`\n   - Failure: ${testCase.failureCategory}\n   - Reasons: ${testCase.failureReasons.join("; ") || "none"}`)
    .join("\n");

  return `# Spatial Ravia Transcription Holdout Report

Generated by \`npm run eval:spatial:transcription-holdout\`.

## Executive Summary

- Holdout size: ${summary.total}
- Supported cases: ${summary.supportedCount}
- Unsupported/cross-domain cases: ${summary.unsupportedCount}
- Baseline exact semantic pass rate: ${percent(baselineBeforeHoldoutTuning.exactSemanticPassRate)}
- Baseline supported-class exact semantic pass rate: ${percent(baselineBeforeHoldoutTuning.supportedClassPassRate)}
- Baseline false-supported rate: ${percent(baselineBeforeHoldoutTuning.falseSupportedRate)} (${baselineBeforeHoldoutTuning.falseSupportedCount} cases)
- Baseline replication/transcription confusion rate: ${percent(baselineBeforeHoldoutTuning.replicationTranscriptionConfusionRate)}
- Exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}
- Supported-class exact semantic pass rate: ${percent(summary.supportedClassPassRate)}
- Supported/unsupported classification accuracy: ${percent(summary.supportClassificationAccuracy)}
- False-supported rate: ${percent(summary.falseSupportedRate)} (${summary.falseSupportedCount} cases)
- Organism-context accuracy: ${percent(summary.organismContextAccuracy)}
- Replication/transcription confusion rate: ${percent(summary.replicationTranscriptionConfusionRate)}

## Component Scores

- Renderer accuracy: ${percent(summary.rendererAccuracy)}
- Required entity recall: ${percent(summary.requiredEntityRecall)}
- Forbidden entity false-positive rate: ${percent(summary.forbiddenEntityFalsePositiveRate)}
- Action accuracy: ${percent(summary.actionAccuracy)}
- Relation accuracy: ${percent(summary.relationAccuracy)}

## Per-Concept Scores

| Category | Count | Exact semantic pass | Support accuracy |
|---|---:|---:|---:|
${categoryLines}

## Failure Modes

| Failure category | Count |
|---|---:|
${failureLines}

## Baseline Failure Clusters

| Failure category | Baseline count |
|---|---:|
${Object.entries(baselineBeforeHoldoutTuning.failureClusters)
  .map(([category, count]) => `| ${category} | ${count} |`)
  .join("\n")}

## Important Failures

${failures || "No semantic failures."}

## Notes

- This holdout is separate from the existing DNA replication holdout.
- The evaluator is offline and does not call live AI or external data services.
- The confusion metric tracks scenes that contain both transcription and replication-specific entities.
`;
}

const evaluatedCases = transcriptionHoldoutSet.map(evaluateCase);
const summary = summarize(evaluatedCases);
const output = {
  generatedAt: new Date().toISOString(),
  holdoutFrozen: true,
  datasetVersion: "transcription-holdout-v1",
  baselineBeforeHoldoutTuning,
  summary,
  cases: evaluatedCases,
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(reportPath, markdownReport(evaluatedCases, summary));

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Overall exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}`);
console.log(`Replication/transcription confusion rate: ${percent(summary.replicationTranscriptionConfusionRate)}`);
