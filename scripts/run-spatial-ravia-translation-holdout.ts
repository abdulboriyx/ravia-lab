import { writeFileSync } from "node:fs";

import { parseBiologyScenePrompt } from "../app/code/spatial-ravia/biology-parser.ts";
import type { BiologyParseResult } from "../app/code/spatial-ravia/biology-parse-result.ts";
import type { BiologySceneSpec } from "../app/code/spatial-ravia/biology-scene-spec.ts";
import { chooseBiologyRenderer } from "../app/code/spatial-ravia/biology-renderer-router.ts";
import type { ExpectedAction, ExpectedRelation } from "../app/code/spatial-ravia/semantic-holdout-set.ts";
import {
  translationHoldoutSet,
  type TranslationHoldoutCase,
  type TranslationHoldoutCategory,
} from "../app/code/spatial-ravia/translation-holdout-set.ts";

type Domain = "replication" | "transcription" | "translation" | "unknown";

type FailureCategory =
  | "none"
  | "valid prompt rejected"
  | "ambiguity handled too confidently"
  | "missing required entity"
  | "extra incorrect entity"
  | "wrong action"
  | "wrong relation"
  | "wrong renderer"
  | "domain confusion"
  | "other";

type EvaluatedCase = {
  id: string;
  category: TranslationHoldoutCategory;
  prompt: string;
  expected: TranslationHoldoutCase["expected"];
  actual: {
    status: BiologyParseResult["status"];
    confidence: number;
    source?: "deterministic" | "semantic";
    renderer?: ReturnType<typeof chooseBiologyRenderer>;
    domain: Domain;
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
    directionalityAccuracy: number | null;
    exactSemanticPass: boolean;
    domainConfused: boolean;
  };
  failureCategory: FailureCategory;
  failureReasons: string[];
};

const jsonPath = "SPATIAL_RAVIA_TRANSLATION_HOLDOUT.json";
const reportPath = "SPATIAL_RAVIA_TRANSLATION_HOLDOUT_REPORT.md";
const baselineBeforeHoldoutTuning = {
  note: "First frozen translation holdout run before post-baseline parser changes.",
  total: 110,
  supportedCount: 95,
  unsupportedCount: 15,
  exactSemanticPassRate: 0.3181818181818182,
  supportedClassPassRate: 0.29473684210526313,
  supportClassificationAccuracy: 0.44545454545454544,
  falseSupportedRate: 0.5333333333333333,
  falseSupportedCount: 8,
  threeDomainConfusionRate: 0.05263157894736842,
  totalConfusions: 5,
  failureClusters: {
    "valid prompt rejected": 53,
    "ambiguity handled too confidently": 8,
    "missing required entity": 6,
    "domain confusion": 5,
    "wrong action": 2,
    "wrong renderer": 1,
  },
};
const postBaselineExpectationCorrections = [
  "show RNA polymerase making RNA was corrected from unsupported to supported transcription.",
  "show DNA polymerase copying DNA was corrected from unsupported to supported replication.",
  "show RNA polymerase was corrected from unsupported to supported transcription structure.",
];

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

function inferDomain(entityIds: string[]): Domain {
  const hasTranslation = entityIds.some((id) =>
    [
      "mrna",
      "ribosome",
      "small-ribosomal-subunit",
      "large-ribosomal-subunit",
      "codon",
      "trna",
      "anticodon",
      "amino-acid",
      "aminoacyl-trna",
      "a-site",
      "p-site",
      "e-site",
      "polypeptide",
      "start-codon",
      "stop-codon",
      "release-factor",
    ].includes(id)
  );
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
      "terminator",
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
      "primase",
      "rna-primer",
      "polymerase",
    ].includes(id)
  );

  const domains = [
    hasReplication ? "replication" : null,
    hasTranscription ? "transcription" : null,
    hasTranslation ? "translation" : null,
  ].filter(Boolean);

  return domains.length === 1 ? (domains[0] as Domain) : "unknown";
}

function directionalityExpected(expected: TranslationHoldoutCase["expected"]) {
  return (
    expected.supported &&
    ((expected.requiredEntities ?? []).some((entity) =>
      ["mrna-5-prime", "mrna-3-prime", "n-terminus", "c-terminus"].includes(entity)
    ) ||
      (expected.requiredRelations ?? []).some((relation) =>
        ["5-to-3", "n-to-c"].includes(relation.object ?? "")
      ))
  );
}

function evaluateCase(testCase: TranslationHoldoutCase): EvaluatedCase {
  const result = parseBiologyScenePrompt(testCase.prompt);
  const expected = testCase.expected;
  const actual: EvaluatedCase["actual"] = {
    status: result.status,
    confidence: result.confidence,
    domain: "unknown",
    entities: [],
    actions: [],
    relations: [],
  };

  if (result.status === "supported") {
    actual.source = result.source;
    actual.renderer = chooseBiologyRenderer(result.scene);
    actual.entities = result.scene.entities.map((entity) => entity.id);
    actual.domain = inferDomain(actual.entities);
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
        directionalityAccuracy: null,
        exactSemanticPass: supportCorrect,
        domainConfused: false,
      },
      failureCategory: supportCorrect ? "none" : "ambiguity handled too confidently",
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
        directionalityAccuracy: directionalityExpected(expected) ? 0 : null,
        exactSemanticPass: false,
        domainConfused: false,
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
  const domainConfused = actual.domain !== "unknown" && actual.domain !== expected.domain;

  if (domainConfused) {
    failureReasons.push(`Expected ${expected.domain} domain, got ${actual.domain}.`);
  }
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

  const relationAccuracy = ratio(presentRequiredRelations.length, requiredRelations.length);
  const score = {
    supportCorrect,
    rendererCorrect: renderer === expected.renderer,
    requiredEntityRecall: ratio(presentRequiredEntities.length, requiredEntities.length),
    forbiddenEntityFalsePositiveRate: ratio(presentForbiddenEntities.length, forbiddenEntities.length),
    actionAccuracy: ratio(presentRequiredActions.length, requiredActions.length),
    relationAccuracy,
    directionalityAccuracy: directionalityExpected(expected) ? relationAccuracy : null,
    exactSemanticPass: failureReasons.length === 0,
    domainConfused,
  };

  return {
    id: testCase.id,
    category: testCase.category,
    prompt: testCase.prompt,
    expected,
    actual,
    score,
    failureCategory: score.exactSemanticPass ? "none" : classifyFailure(score, failureReasons),
    failureReasons,
  };
}

function classifyFailure(score: EvaluatedCase["score"], reasons: string[]): FailureCategory {
  if (score.domainConfused) return "domain confusion";
  if (score.rendererCorrect === false) return "wrong renderer";
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

function confusionRates(cases: EvaluatedCase[]) {
  const pairs = {
    replicationToTranscription: 0,
    replicationToTranslation: 0,
    transcriptionToReplication: 0,
    transcriptionToTranslation: 0,
    translationToReplication: 0,
    translationToTranscription: 0,
  };
  let domainExpectedCount = 0;

  for (const testCase of cases) {
    if (!testCase.expected.supported) continue;
    domainExpectedCount += 1;
    if (testCase.expected.domain === "replication" && testCase.actual.domain === "transcription") {
      pairs.replicationToTranscription += 1;
    }
    if (testCase.expected.domain === "replication" && testCase.actual.domain === "translation") {
      pairs.replicationToTranslation += 1;
    }
    if (testCase.expected.domain === "transcription" && testCase.actual.domain === "replication") {
      pairs.transcriptionToReplication += 1;
    }
    if (testCase.expected.domain === "transcription" && testCase.actual.domain === "translation") {
      pairs.transcriptionToTranslation += 1;
    }
    if (testCase.expected.domain === "translation" && testCase.actual.domain === "replication") {
      pairs.translationToReplication += 1;
    }
    if (testCase.expected.domain === "translation" && testCase.actual.domain === "transcription") {
      pairs.translationToTranscription += 1;
    }
  }

  const totalConfusions = Object.values(pairs).reduce((sum, value) => sum + value, 0);

  return {
    ...pairs,
    totalConfusions,
    threeDomainConfusionRate: ratio(totalConfusions, domainExpectedCount),
  };
}

function summarize(cases: EvaluatedCase[]) {
  const supportedCases = cases.filter((testCase) => testCase.expected.supported);
  const unsupportedCases = cases.filter((testCase) => !testCase.expected.supported);
  const falseSupported = unsupportedCases.filter((testCase) => testCase.actual.status === "supported");
  const trueUnsupported = unsupportedCases.filter((testCase) => testCase.actual.status === "unsupported");
  const predictedUnsupported = cases.filter((testCase) => testCase.actual.status === "unsupported");

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
    directionalityAccuracy: average(cases.map((testCase) => testCase.score.directionalityAccuracy)),
    unsupportedPrecision: ratio(trueUnsupported.length, predictedUnsupported.length),
    unsupportedRecall: ratio(trueUnsupported.length, unsupportedCases.length),
    falseSupportedCount: falseSupported.length,
    falseSupportedRate: ratio(falseSupported.length, unsupportedCases.length),
    ...confusionRates(cases),
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

  return `# Spatial Ravia Translation Holdout Report

Generated by \`npm run eval:spatial:translation-holdout\`.

## Executive Summary

- Holdout size: ${summary.total}
- Supported cases: ${summary.supportedCount}
- Unsupported/cross-domain cases: ${summary.unsupportedCount}
- Baseline exact semantic pass rate: ${percent(baselineBeforeHoldoutTuning.exactSemanticPassRate)}
- Baseline supported-class exact semantic pass rate: ${percent(baselineBeforeHoldoutTuning.supportedClassPassRate)}
- Baseline false-supported rate: ${percent(baselineBeforeHoldoutTuning.falseSupportedRate)} (${baselineBeforeHoldoutTuning.falseSupportedCount} cases)
- Baseline three-domain confusion rate: ${percent(baselineBeforeHoldoutTuning.threeDomainConfusionRate)} (${baselineBeforeHoldoutTuning.totalConfusions} cases)
- Exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}
- Supported-class exact semantic pass rate: ${percent(summary.supportedClassPassRate)}
- Supported/unsupported classification accuracy: ${percent(summary.supportClassificationAccuracy)}
- False-supported rate: ${percent(summary.falseSupportedRate)} (${summary.falseSupportedCount} cases)
- Three-domain confusion rate: ${percent(summary.threeDomainConfusionRate)} (${summary.totalConfusions} cases)

## Component Scores

- Renderer accuracy: ${percent(summary.rendererAccuracy)}
- Required entity recall: ${percent(summary.requiredEntityRecall)}
- Forbidden entity false-positive rate: ${percent(summary.forbiddenEntityFalsePositiveRate)}
- Action accuracy: ${percent(summary.actionAccuracy)}
- Relation accuracy: ${percent(summary.relationAccuracy)}
- Directionality accuracy: ${percent(summary.directionalityAccuracy)}

## Confusion Matrix Counts

| Confusion pair | Count |
|---|---:|
| Replication -> Transcription | ${summary.replicationToTranscription} |
| Replication -> Translation | ${summary.replicationToTranslation} |
| Transcription -> Replication | ${summary.transcriptionToReplication} |
| Transcription -> Translation | ${summary.transcriptionToTranslation} |
| Translation -> Replication | ${summary.translationToReplication} |
| Translation -> Transcription | ${summary.translationToTranscription} |

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

## Post-Baseline Expectation Corrections

${postBaselineExpectationCorrections.map((note) => `- ${note}`).join("\n")}

## Important Failures

${failures || "No semantic failures."}

## Notes

- This holdout is separate from the existing DNA replication and transcription holdouts.
- The evaluator is offline and does not call live AI or external data services.
- The frozen prompt set is not part of the normal unit-test suite.
`;
}

const evaluatedCases = translationHoldoutSet.map(evaluateCase);
const summary = summarize(evaluatedCases);
const output = {
  generatedAt: new Date().toISOString(),
  holdoutFrozen: true,
  datasetVersion: "translation-holdout-v1",
  baselineBeforeHoldoutTuning,
  postBaselineExpectationCorrections,
  summary,
  cases: evaluatedCases,
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(reportPath, markdownReport(evaluatedCases, summary));

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${reportPath}`);
console.log(`Overall exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}`);
console.log(`Three-domain confusion rate: ${percent(summary.threeDomainConfusionRate)}`);
console.log(`False-supported rate: ${percent(summary.falseSupportedRate)}`);
