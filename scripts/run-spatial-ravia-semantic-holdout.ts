import { writeFileSync } from "node:fs";
import { parseBiologyScenePrompt } from "../app/code/spatial-ravia/biology-parser.ts";
import { detectBiologyContext } from "../app/code/spatial-ravia/biology-context.ts";
import { chooseBiologyRenderer } from "../app/code/spatial-ravia/biology-renderer-router.ts";
import {
  semanticHoldoutSet,
  type ExpectedAction,
  type ExpectedRelation,
  type SemanticHoldoutCase,
  type SemanticHoldoutCategory,
} from "../app/code/spatial-ravia/semantic-holdout-set.ts";
import type { BiologyParseResult } from "../app/code/spatial-ravia/biology-parse-result.ts";
import type { BiologySceneSpec } from "../app/code/spatial-ravia/biology-scene-spec.ts";

type FailureCategory =
  | "none"
  | "concept not recognized"
  | "wrong concept selected"
  | "missing required entity"
  | "extra incorrect entity"
  | "wrong action"
  | "wrong relation"
  | "wrong organism context"
  | "wrong renderer"
  | "ambiguity handled too confidently"
  | "valid prompt rejected"
  | "deterministic fallback interference"
  | "parser ordering / scoring conflict"
  | "other";

type CaseScore = {
  supportCorrect: boolean;
  intentCorrect: boolean | null;
  rendererCorrect: boolean | null;
  requiredEntityRecall: number | null;
  forbiddenEntityFalsePositiveRate: number | null;
  actionAccuracy: number | null;
  relationAccuracy: number | null;
  organismContextCorrect: boolean | null;
  exactSemanticPass: boolean;
};

type EvaluatedCase = {
  id: string;
  category: SemanticHoldoutCategory;
  difficulty: SemanticHoldoutCase["difficulty"];
  prompt: string;
  expected: SemanticHoldoutCase["expected"];
  actual: {
    status: BiologyParseResult["status"];
    confidence: number;
    source?: "deterministic" | "semantic";
    intent?: BiologySceneSpec["intent"];
    renderer?: ReturnType<typeof chooseBiologyRenderer>;
    organismContext: ReturnType<typeof detectBiologyContext>["organism"];
    entities: string[];
    actions: ExpectedAction[];
    relations: ExpectedRelation[];
    reason?: string;
  };
  score: CaseScore;
  failureCategory: FailureCategory;
  failureReasons: string[];
};

const jsonPath = "SPATIAL_RAVIA_SEMANTIC_HOLDOUT.json";
const reportPath = "SPATIAL_RAVIA_SEMANTIC_HOLDOUT_REPORT.md";

const baselineBeforeParserImprovements = {
  note: "First frozen holdout run against the current parser before post-baseline parser changes.",
  total: 108,
  supportedCount: 93,
  unsupportedCount: 15,
  exactSemanticPassRate: 0.3333333333333333,
  supportedClassPassRate: 0.27956989247311825,
  supportClassificationAccuracy: 0.5648148148148148,
  unsupportedPrecision: 0.19230769230769232,
  unsupportedRecall: 0.6666666666666666,
  falseSupportedCount: 5,
  falseSupportedRate: 0.3333333333333333,
  organismContextAccuracy: 0.5714285714285714,
  failureClusters: {
    "valid prompt rejected": 42,
    "wrong renderer": 20,
    "ambiguity handled too confidently": 5,
    "missing required entity": 2,
    "wrong relation": 2,
    "extra incorrect entity": 1,
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

function evaluateCase(testCase: SemanticHoldoutCase): EvaluatedCase {
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
    actual.intent = result.scene.intent;
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
    const score = {
      supportCorrect,
      intentCorrect: null,
      rendererCorrect: null,
      requiredEntityRecall: null,
      forbiddenEntityFalsePositiveRate: null,
      actionAccuracy: null,
      relationAccuracy: null,
      organismContextCorrect: null,
      exactSemanticPass: supportCorrect,
    };

    return {
      id: testCase.id,
      category: testCase.category,
      difficulty: testCase.difficulty,
      prompt: testCase.prompt,
      expected,
      actual,
      score,
      failureCategory: supportCorrect ? "none" : "ambiguity handled too confidently",
      failureReasons,
    };
  }

  if (result.status !== "supported") {
    return {
      id: testCase.id,
      category: testCase.category,
      difficulty: testCase.difficulty,
      prompt: testCase.prompt,
      expected,
      actual,
      score: {
        supportCorrect,
        intentCorrect: false,
        rendererCorrect: false,
        requiredEntityRecall: 0,
        forbiddenEntityFalsePositiveRate: 0,
        actionAccuracy: 0,
        relationAccuracy: 0,
        organismContextCorrect: expected.organismContext ? false : null,
        exactSemanticPass: false,
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

  if (expected.intent && scene.intent !== expected.intent) {
    failureReasons.push(`Expected intent ${expected.intent}, got ${scene.intent}.`);
  }

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

  const score: CaseScore = {
    supportCorrect,
    intentCorrect: expected.intent ? scene.intent === expected.intent : null,
    rendererCorrect: renderer === expected.renderer,
    requiredEntityRecall: ratio(presentRequiredEntities.length, requiredEntities.length),
    forbiddenEntityFalsePositiveRate: ratio(presentForbiddenEntities.length, forbiddenEntities.length),
    actionAccuracy: ratio(presentRequiredActions.length, requiredActions.length),
    relationAccuracy: ratio(presentRequiredRelations.length, requiredRelations.length),
    organismContextCorrect: expected.organismContext
      ? context.organism === expected.organismContext
      : null,
    exactSemanticPass: failureReasons.length === 0,
  };

  return {
    id: testCase.id,
    category: testCase.category,
    difficulty: testCase.difficulty,
    prompt: testCase.prompt,
    expected,
    actual,
    score,
    failureCategory: score.exactSemanticPass ? "none" : classifyFailure(testCase, result, score, failureReasons),
    failureReasons,
  };
}

function classifyFailure(
  testCase: SemanticHoldoutCase,
  result: BiologyParseResult,
  score: CaseScore,
  reasons: string[]
): FailureCategory {
  if (result.status === "unsupported" && testCase.expected.supported) {
    return "valid prompt rejected";
  }

  if (result.status === "supported" && !testCase.expected.supported) {
    return "ambiguity handled too confidently";
  }

  if (score.organismContextCorrect === false) {
    return "wrong organism context";
  }

  if (score.rendererCorrect === false) {
    return "wrong renderer";
  }

  if ((score.forbiddenEntityFalsePositiveRate ?? 0) > 0) {
    return "extra incorrect entity";
  }

  if ((score.requiredEntityRecall ?? 1) < 1) {
    return "missing required entity";
  }

  if ((score.actionAccuracy ?? 1) < 1) {
    return "wrong action";
  }

  if ((score.relationAccuracy ?? 1) < 1) {
    return "wrong relation";
  }

  if (result.status === "supported" && result.source === "deterministic") {
    return "deterministic fallback interference";
  }

  if (reasons.some((reason) => reason.includes("intent"))) {
    return "wrong concept selected";
  }

  return "other";
}

function average(values: Array<number | null>) {
  const realValues = values.filter((value): value is number => value !== null);
  return realValues.length === 0
    ? null
    : realValues.reduce((sum, value) => sum + value, 0) / realValues.length;
}

function percent(value: number | null) {
  return value === null ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function summarize(evaluatedCases: EvaluatedCase[]) {
  const supportedCases = evaluatedCases.filter((testCase) => testCase.expected.supported);
  const unsupportedCases = evaluatedCases.filter((testCase) => !testCase.expected.supported);
  const falseSupported = unsupportedCases.filter((testCase) => testCase.actual.status === "supported");
  const falseUnsupported = supportedCases.filter((testCase) => testCase.actual.status === "unsupported");
  const trueUnsupported = unsupportedCases.filter((testCase) => testCase.actual.status === "unsupported");
  const predictedUnsupported = evaluatedCases.filter((testCase) => testCase.actual.status === "unsupported");

  const byCategory = new Map<SemanticHoldoutCategory, EvaluatedCase[]>();
  for (const testCase of evaluatedCases) {
    byCategory.set(testCase.category, [...(byCategory.get(testCase.category) ?? []), testCase]);
  }

  const failureCounts: Record<string, number> = {};
  for (const testCase of evaluatedCases) {
    failureCounts[testCase.failureCategory] = (failureCounts[testCase.failureCategory] ?? 0) + 1;
  }

  const categoryMetrics = Object.fromEntries(
    [...byCategory.entries()].map(([category, cases]) => [
      category,
      {
        count: cases.length,
        exactSemanticPassRate: average(cases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)),
        supportAccuracy: average(cases.map((testCase) => testCase.score.supportCorrect ? 1 : 0)),
      },
    ])
  );

  const explicitContextCases = evaluatedCases.filter(
    (testCase) => testCase.expected.supported && testCase.expected.organismContext
  );

  return {
    total: evaluatedCases.length,
    supportedCount: supportedCases.length,
    unsupportedCount: unsupportedCases.length,
    exactSemanticPassRate: average(evaluatedCases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)),
    supportedClassPassRate: average(supportedCases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)),
    supportClassificationAccuracy: average(evaluatedCases.map((testCase) => testCase.score.supportCorrect ? 1 : 0)),
    intentAccuracy: average(evaluatedCases.map((testCase) => testCase.score.intentCorrect === null ? null : testCase.score.intentCorrect ? 1 : 0)),
    rendererAccuracy: average(evaluatedCases.map((testCase) => testCase.score.rendererCorrect === null ? null : testCase.score.rendererCorrect ? 1 : 0)),
    requiredEntityRecall: average(evaluatedCases.map((testCase) => testCase.score.requiredEntityRecall)),
    forbiddenEntityFalsePositiveRate: average(evaluatedCases.map((testCase) => testCase.score.forbiddenEntityFalsePositiveRate)),
    actionAccuracy: average(evaluatedCases.map((testCase) => testCase.score.actionAccuracy)),
    relationAccuracy: average(evaluatedCases.map((testCase) => testCase.score.relationAccuracy)),
    organismContextAccuracy: average(explicitContextCases.map((testCase) => testCase.score.organismContextCorrect ? 1 : 0)),
    unsupportedPrecision: ratio(trueUnsupported.length, predictedUnsupported.length),
    unsupportedRecall: ratio(trueUnsupported.length, unsupportedCases.length),
    falseSupportedCount: falseSupported.length,
    falseSupportedRate: ratio(falseSupported.length, unsupportedCases.length),
    falseUnsupportedCount: falseUnsupported.length,
    categoryMetrics,
    failureCounts,
  };
}

function markdownReport(evaluatedCases: EvaluatedCase[], summary: ReturnType<typeof summarize>) {
  const failures = evaluatedCases.filter((testCase) => !testCase.score.exactSemanticPass);
  const importantFailures = failures.slice(0, 10);
  const categoryLines = Object.entries(summary.categoryMetrics)
    .map(([category, metrics]) => {
      return `| ${category} | ${metrics.count} | ${percent(metrics.exactSemanticPassRate)} | ${percent(metrics.supportAccuracy)} |`;
    })
    .join("\n");

  const failureLines = Object.entries(summary.failureCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join("\n");

  const importantFailureLines = importantFailures
    .map((testCase, index) => {
      return `${index + 1}. **${testCase.id}** (${testCase.category}): \`${testCase.prompt}\`\n   - Failure: ${testCase.failureCategory}\n   - Reasons: ${testCase.failureReasons.join("; ") || "none"}`;
    })
    .join("\n");

  return `# Spatial Ravia Semantic Holdout Report

Generated by \`npm run eval:spatial:semantic-holdout\`.

## Executive Summary

- Holdout size: ${summary.total}
- Supported cases: ${summary.supportedCount}
- Unsupported cases: ${summary.unsupportedCount}
- Baseline overall exact semantic pass rate: ${percent(baselineBeforeParserImprovements.exactSemanticPassRate)}
- Baseline supported-class exact semantic pass rate: ${percent(baselineBeforeParserImprovements.supportedClassPassRate)}
- Baseline supported/unsupported classification accuracy: ${percent(baselineBeforeParserImprovements.supportClassificationAccuracy)}
- Baseline false-supported rate: ${percent(baselineBeforeParserImprovements.falseSupportedRate)} (${baselineBeforeParserImprovements.falseSupportedCount} cases)
- Overall exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}
- Supported-class exact semantic pass rate: ${percent(summary.supportedClassPassRate)}
- Supported/unsupported classification accuracy: ${percent(summary.supportClassificationAccuracy)}
- Unsupported precision: ${percent(summary.unsupportedPrecision)}
- Unsupported recall: ${percent(summary.unsupportedRecall)}
- False-supported rate on unsupported prompts: ${percent(summary.falseSupportedRate)} (${summary.falseSupportedCount} cases)
- Explicit organism-context accuracy: ${percent(summary.organismContextAccuracy)}

## Component Scores

- Intent accuracy: ${percent(summary.intentAccuracy)}
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
${Object.entries(baselineBeforeParserImprovements.failureClusters)
  .map(([category, count]) => `| ${category} | ${count} |`)
  .join("\n")}

## 10 Most Important Failures

${importantFailureLines || "No semantic failures."}

## Parser Strengths

- The evaluator measures unseen DNA/replication phrasing separately from unit tests.
- Unsupported and ambiguous prompts are scored explicitly, including false-supported cases.
- Entity, action, relation, renderer, and organism-context requirements are scored independently.

## Parser Weaknesses

- The semantic parser remains a deterministic concept scorer for the implemented DNA/replication domain.
- Prompts requiring implicit biological inference beyond the current concept vocabulary are expected to fail.
- The evaluator does not test live AI parsing or external retrieval.

## Recommended Next Fixes

Prioritize the largest non-\`none\` failure categories above. Apply fixes as generalized semantic patterns, not exact holdout phrase rules, then rerun this frozen holdout set.
`;
}

const evaluatedCases = semanticHoldoutSet.map(evaluateCase);
const summary = summarize(evaluatedCases);
const output = {
  generatedAt: new Date().toISOString(),
  holdoutFrozen: true,
  datasetVersion: "semantic-holdout-v1",
  baselineBeforeParserImprovements,
  summary,
  cases: evaluatedCases,
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(reportPath, markdownReport(evaluatedCases, summary));

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Overall exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}`);
console.log(`False-supported rate: ${percent(summary.falseSupportedRate)}`);
