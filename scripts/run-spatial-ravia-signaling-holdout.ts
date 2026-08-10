import { writeFileSync } from "node:fs";

import { parseBiologyScenePrompt } from "../app/code/spatial-ravia/biology-parser.ts";
import type { BiologyParseResult } from "../app/code/spatial-ravia/biology-parse-result.ts";
import type { BiologySceneSpec } from "../app/code/spatial-ravia/biology-scene-spec.ts";
import { chooseBiologyRenderer } from "../app/code/spatial-ravia/biology-renderer-router.ts";
import { resolveSpatialPlacements } from "../app/code/spatial-ravia/biology-spatial-resolver.ts";
import type { ExpectedAction, ExpectedRelation } from "../app/code/spatial-ravia/semantic-holdout-set.ts";
import {
  signalingHoldoutSet,
  type SignalingHoldoutCase,
  type SignalingHoldoutCategory,
} from "../app/code/spatial-ravia/signaling-holdout-set.ts";

type Domain = "replication" | "transcription" | "translation" | "signaling" | "unknown";

type EvaluatedCase = {
  id: string;
  category: SignalingHoldoutCategory;
  prompt: string;
  expected: SignalingHoldoutCase["expected"];
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
    topologyAccuracy: number | null;
    stateTransitionAccuracy: number | null;
    exactSemanticPass: boolean;
    domainConfused: boolean;
  };
  failureCategory: string;
  failureReasons: string[];
};

const jsonPath = "SPATIAL_RAVIA_SIGNALING_HOLDOUT.json";
const reportPath = "SPATIAL_RAVIA_SIGNALING_HOLDOUT_REPORT.md";
const baselineBeforeHoldoutTuning = {
  note: "First frozen signaling holdout run before post-baseline parser changes.",
  total: 115,
  supportedCount: 103,
  unsupportedCount: 12,
  exactSemanticPassRate: 0.5478260869565217,
  supportedClassPassRate: 0.5048543689320388,
  supportClassificationAccuracy: 0.591304347826087,
  falseSupportedRate: 0.08333333333333333,
  falseSupportedCount: 1,
  fourDomainConfusionRate: 0,
  topologyAccuracy: 0.5153061224489796,
  stateTransitionAccuracy: 0.27692307692307694,
  failureClusters: {
    "valid prompt rejected": 46,
    "missing required entity": 3,
    "extra incorrect entity": 1,
    "ambiguity handled too confidently": 1,
    "wrong renderer": 1,
  },
};
const postBaselineExpectationCorrections = [
  "show DNA polymerase binding DNA was corrected from molecular-structure to the existing replication mechanistic renderer.",
];

function hasEntity(scene: BiologySceneSpec, entityId: string) {
  return scene.entities.some((entity) => entity.id === entityId);
}

function hasAction(scene: BiologySceneSpec, expected: ExpectedAction) {
  return scene.actions.some(
    (action) => action.actor === expected.actor && action.action === expected.action && action.target === expected.target
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
  const domainHits = {
    replication: entityIds.some((id) => ["fork", "helicase", "polymerase", "okazaki-fragment", "ligase"].includes(id)),
    transcription: entityIds.some((id) => ["rna-polymerase", "rna-transcript", "promoter", "transcription-bubble"].includes(id)),
    translation: entityIds.some((id) => ["ribosome", "mrna", "trna", "polypeptide"].includes(id)),
    signaling: entityIds.some((id) => ["plasma-membrane", "receptor-tyrosine-kinase", "ligand", "ras", "raf", "mek", "erk"].includes(id)),
  };
  const domains = Object.entries(domainHits).filter(([, hit]) => hit).map(([domain]) => domain as Domain);
  return domains.length === 1 ? domains[0] : "unknown";
}

function topologyPass(scene: BiologySceneSpec, check: string) {
  const placements = resolveSpatialPlacements(scene);
  const position = (id: string) => placements.find((placement) => placement.entityId === id)?.position;
  if (check === "ligandExtracellular") return (position("ligand")?.y ?? -1) > 0;
  if (check === "receptorEmbedded") return Math.abs(position("receptor-tyrosine-kinase")?.y ?? 99) < 0.2 || Math.abs(position("receptor-monomer-a")?.y ?? 99) < 0.2;
  if (check === "adaptorCytoplasmic") return (position("adaptor-protein")?.y ?? position("grb2")?.y ?? 1) < 0;
  if (check === "rasMembrane") {
    const y = position("ras")?.y;
    return y !== undefined && y < 0 && y > -0.85;
  }
  if (check === "phosphoCytoplasmic") return (position("phosphotyrosine-site")?.y ?? 1) < 0;
  return false;
}

function statePass(scene: BiologySceneSpec, check: string) {
  if (check === "rtkActive") return hasRelation(scene, { subject: "receptor-dimer", relation: "state", object: "active-state" });
  if (check === "rtkPhosphorylated") return hasRelation(scene, { subject: "receptor-dimer", relation: "state", object: "phosphorylated-state" });
  if (check === "rasGdpToGtp") return hasRelation(scene, { subject: "ras-gdp", relation: "transitions_to", object: "ras-gtp" });
  return false;
}

function evaluateCase(testCase: SignalingHoldoutCase): EvaluatedCase {
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
    actual.actions = result.scene.actions.map((action) => ({ actor: action.actor, action: action.action, target: action.target }));
    actual.relations = result.scene.relations.map((relation) => ({ subject: relation.subject, relation: relation.relation, object: relation.object }));
  } else {
    actual.reason = result.reason;
  }

  const supportCorrect = result.status === (expected.supported ? "supported" : "unsupported");
  const failureReasons: string[] = [];
  if (!supportCorrect) failureReasons.push(expected.supported ? "Expected supported scene but parser returned unsupported." : "Expected unsupported prompt but parser returned a scene.");

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
        topologyAccuracy: null,
        stateTransitionAccuracy: null,
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
        topologyAccuracy: 0,
        stateTransitionAccuracy: 0,
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
  const topologyChecks = expected.topologyChecks ?? [];
  const stateChecks = expected.stateChecks ?? [];
  const presentRequiredEntities = requiredEntities.filter((entityId) => hasEntity(scene, entityId));
  const presentForbiddenEntities = forbiddenEntities.filter((entityId) => hasEntity(scene, entityId));
  const presentRequiredActions = requiredActions.filter((action) => hasAction(scene, action));
  const presentRequiredRelations = requiredRelations.filter((relation) => hasRelation(scene, relation));
  const passedTopology = topologyChecks.filter((check) => topologyPass(scene, check));
  const passedState = stateChecks.filter((check) => statePass(scene, check));
  const domainConfused = actual.domain !== "unknown" && actual.domain !== expected.domain;

  if (domainConfused) failureReasons.push(`Expected ${expected.domain} domain, got ${actual.domain}.`);
  if (actual.renderer !== expected.renderer) failureReasons.push(`Expected renderer ${expected.renderer}, got ${actual.renderer}.`);
  for (const entityId of requiredEntities) if (!hasEntity(scene, entityId)) failureReasons.push(`Missing required entity ${entityId}.`);
  for (const entityId of forbiddenEntities) if (hasEntity(scene, entityId)) failureReasons.push(`Forbidden entity ${entityId} present.`);
  for (const action of requiredActions) if (!hasAction(scene, action)) failureReasons.push(`Missing action ${action.actor}/${action.action}/${action.target ?? ""}.`);
  for (const relation of requiredRelations) if (!hasRelation(scene, relation)) failureReasons.push(`Missing relation ${relation.subject}/${relation.relation}/${relation.object ?? ""}.`);
  for (const check of topologyChecks) if (!topologyPass(scene, check)) failureReasons.push(`Failed topology check ${check}.`);
  for (const check of stateChecks) if (!statePass(scene, check)) failureReasons.push(`Failed state check ${check}.`);

  const score = {
    supportCorrect,
    rendererCorrect: actual.renderer === expected.renderer,
    requiredEntityRecall: ratio(presentRequiredEntities.length, requiredEntities.length),
    forbiddenEntityFalsePositiveRate: ratio(presentForbiddenEntities.length, forbiddenEntities.length),
    actionAccuracy: ratio(presentRequiredActions.length, requiredActions.length),
    relationAccuracy: ratio(presentRequiredRelations.length, requiredRelations.length),
    topologyAccuracy: ratio(passedTopology.length, topologyChecks.length),
    stateTransitionAccuracy: ratio(passedState.length, stateChecks.length),
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
    failureCategory: score.exactSemanticPass ? "none" : classifyFailure(score),
    failureReasons,
  };
}

function classifyFailure(score: EvaluatedCase["score"]) {
  if (score.domainConfused) return "domain confusion";
  if (score.rendererCorrect === false) return "wrong renderer";
  if ((score.forbiddenEntityFalsePositiveRate ?? 0) > 0) return "extra incorrect entity";
  if ((score.requiredEntityRecall ?? 1) < 1) return "missing required entity";
  if ((score.actionAccuracy ?? 1) < 1) return "wrong action";
  if ((score.relationAccuracy ?? 1) < 1) return "wrong relation";
  if ((score.topologyAccuracy ?? 1) < 1) return "wrong topology";
  if ((score.stateTransitionAccuracy ?? 1) < 1) return "wrong state transition";
  return "other";
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
  const confusionCount = supportedCases.filter((testCase) => testCase.score.domainConfused).length;
  const failureCounts: Record<string, number> = {};
  for (const testCase of cases) failureCounts[testCase.failureCategory] = (failureCounts[testCase.failureCategory] ?? 0) + 1;
  const categoryMetrics = Object.fromEntries(
    [...new Set(cases.map((testCase) => testCase.category))].map((category) => {
      const categoryCases = cases.filter((testCase) => testCase.category === category);
      return [category, { count: categoryCases.length, exactSemanticPassRate: average(categoryCases.map((testCase) => testCase.score.exactSemanticPass ? 1 : 0)), supportAccuracy: average(categoryCases.map((testCase) => testCase.score.supportCorrect ? 1 : 0)) }];
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
    topologyAccuracy: average(cases.map((testCase) => testCase.score.topologyAccuracy)),
    stateTransitionAccuracy: average(cases.map((testCase) => testCase.score.stateTransitionAccuracy)),
    unsupportedPrecision: ratio(trueUnsupported.length, predictedUnsupported.length),
    unsupportedRecall: ratio(trueUnsupported.length, unsupportedCases.length),
    falseSupportedCount: falseSupported.length,
    falseSupportedRate: ratio(falseSupported.length, unsupportedCases.length),
    fourDomainConfusionCount: confusionCount,
    fourDomainConfusionRate: ratio(confusionCount, supportedCases.length),
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
  return `# Spatial Ravia Signaling Holdout Report

Generated by \`npm run eval:spatial:signaling-holdout\`.

## Executive Summary

- Holdout size: ${summary.total}
- Supported cases: ${summary.supportedCount}
- Unsupported/cross-domain cases: ${summary.unsupportedCount}
- Baseline exact semantic pass rate: ${percent(baselineBeforeHoldoutTuning.exactSemanticPassRate)}
- Baseline supported-class exact semantic pass rate: ${percent(baselineBeforeHoldoutTuning.supportedClassPassRate)}
- Baseline false-supported rate: ${percent(baselineBeforeHoldoutTuning.falseSupportedRate)} (${baselineBeforeHoldoutTuning.falseSupportedCount} cases)
- Baseline four-domain confusion rate: ${percent(baselineBeforeHoldoutTuning.fourDomainConfusionRate)}
- Baseline topology accuracy: ${percent(baselineBeforeHoldoutTuning.topologyAccuracy)}
- Baseline state-transition accuracy: ${percent(baselineBeforeHoldoutTuning.stateTransitionAccuracy)}
- Exact semantic pass rate: ${percent(summary.exactSemanticPassRate)}
- Supported-class exact semantic pass rate: ${percent(summary.supportedClassPassRate)}
- Supported/unsupported classification accuracy: ${percent(summary.supportClassificationAccuracy)}
- False-supported rate: ${percent(summary.falseSupportedRate)} (${summary.falseSupportedCount} cases)
- Four-domain confusion rate: ${percent(summary.fourDomainConfusionRate)} (${summary.fourDomainConfusionCount} cases)
- Topology accuracy: ${percent(summary.topologyAccuracy)}
- State-transition accuracy: ${percent(summary.stateTransitionAccuracy)}

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

## Post-Baseline Expectation Corrections

${postBaselineExpectationCorrections.map((note) => `- ${note}`).join("\n")}

## Important Failures

${failures || "No semantic failures."}
`;
}

const evaluatedCases = signalingHoldoutSet.map(evaluateCase);
const summary = summarize(evaluatedCases);
const output = {
  generatedAt: new Date().toISOString(),
  holdoutFrozen: true,
  datasetVersion: "signaling-holdout-v1",
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
console.log(`Four-domain confusion rate: ${percent(summary.fourDomainConfusionRate)}`);
console.log(`False-supported rate: ${percent(summary.falseSupportedRate)}`);
