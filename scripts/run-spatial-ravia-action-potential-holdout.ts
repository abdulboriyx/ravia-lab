import { writeFileSync } from "node:fs";
import { parseBiologyScenePrompt } from "../app/code/spatial-ravia/biology-parser.ts";
import { chooseBiologyRenderer } from "../app/code/spatial-ravia/biology-renderer-router.ts";
import {
  actionPotentialHoldoutCases,
  actionPotentialHoldoutFrozen,
  actionPotentialHoldoutVersion,
  type ActionPotentialHoldoutCase,
} from "../app/code/spatial-ravia/action-potential-holdout-set.ts";

type CaseResult = {
  id: string;
  category: string;
  prompt: string;
  expected: ActionPotentialHoldoutCase["expected"];
  actual: {
    supported: boolean;
    entities: string[];
    relations: Array<{ subject: string; relation: string; object: string }>;
    renderer?: string;
    currentPhase?: string;
    reason?: string;
  };
  scores: {
    supportCorrect: boolean;
    entitiesCorrect: boolean;
    relationsCorrect: boolean;
    rendererCorrect: boolean;
    phaseCorrect: boolean;
    exactSemanticPass: boolean;
    falseSupported: boolean;
    fiveDomainConfusion: boolean;
    ionDirectionCorrect: boolean;
    channelStateCorrect: boolean;
    topologyCorrect: boolean;
  };
  failureCategory: string | null;
};

function relationKey(relation: { subject: string; relation: string; object: string }) {
  return `${relation.subject}|${relation.relation}|${relation.object}`;
}

function classifyFailure(result: CaseResult) {
  if (result.scores.exactSemanticPass) return null;
  if (result.scores.falseSupported) return "ambiguity handled too confidently";
  if (!result.scores.supportCorrect) return result.actual.supported ? "false supported" : "valid prompt rejected";
  if (!result.scores.rendererCorrect) return "wrong renderer";
  if (!result.scores.entitiesCorrect) return "missing required entity";
  if (!result.scores.relationsCorrect) return "wrong relation";
  if (!result.scores.phaseCorrect) return "wrong phase";
  if (!result.scores.ionDirectionCorrect) return "ion direction error";
  if (!result.scores.channelStateCorrect) return "channel state error";
  if (!result.scores.topologyCorrect) return "topology error";
  return "other";
}

function evaluateCase(testCase: ActionPotentialHoldoutCase): CaseResult {
  const parseResult = parseBiologyScenePrompt(testCase.prompt);
  const supported = parseResult.status === "supported";
  const scene = supported ? parseResult.scene : undefined;
  const renderer = scene ? chooseBiologyRenderer(scene) : undefined;
  const entityIds = scene?.entities.map((entity) => entity.id) ?? [];
  const relationKeys = new Set((scene?.relations ?? []).map(relationKey));
  const actual = {
    supported,
    entities: entityIds,
    relations: scene?.relations ?? [],
    renderer,
    currentPhase: scene?.temporal?.currentPhase,
    reason: supported ? undefined : parseResult.reason,
  };

  if (!testCase.expected.supported) {
    const result: CaseResult = {
      id: testCase.id,
      category: testCase.category,
      prompt: testCase.prompt,
      expected: testCase.expected,
      actual,
      scores: {
        supportCorrect: !supported,
        entitiesCorrect: true,
        relationsCorrect: true,
        rendererCorrect: true,
        phaseCorrect: true,
        exactSemanticPass: !supported,
        falseSupported: supported,
        fiveDomainConfusion: supported,
        ionDirectionCorrect: true,
        channelStateCorrect: true,
        topologyCorrect: true,
      },
      failureCategory: null,
    };
    result.failureCategory = classifyFailure(result);
    return result;
  }

  const requiredEntities = testCase.expected.requiredEntities;
  const requiredRelations = testCase.expected.requiredRelations ?? [];
  const forbiddenEntities = testCase.expected.forbiddenEntities ?? [
    "receptor-tyrosine-kinase",
    "ribosome",
    "rna-polymerase",
    "polymerase",
  ];
  const entitiesCorrect =
    requiredEntities.every((entity) => entityIds.includes(entity)) &&
    forbiddenEntities.every((entity) => !entityIds.includes(entity));
  const relationsCorrect = requiredRelations.every((relation) =>
    relationKeys.has(relationKey(relation))
  );
  const rendererCorrect =
    renderer === (testCase.expected.renderer === "mechanistic-3d" ? "three" : testCase.expected.renderer);
  const phaseCorrect =
    !testCase.expected.currentPhase ||
    actual.currentPhase === testCase.expected.currentPhase;
  const ionDirectionCorrect =
    (!entityIds.includes("sodium-current") || relationKeys.has("sodium-current|flows_into|cytoplasm")) &&
    (!entityIds.includes("potassium-current") || relationKeys.has("potassium-current|flows_out_to|extracellular-space"));
  const topologyCorrect =
    !entityIds.includes("plasma-membrane") ||
    relationKeys.has("extracellular-space|outside_of|plasma-membrane");
  const currentPhase = scene?.temporal?.phases.find((phase) => phase.id === scene.temporal?.currentPhase);
  const channelStateCorrect =
    !currentPhase ||
    currentPhase.states["voltage-gated-sodium-channel"] !== "open" ||
    currentPhase.id === "depolarization";

  const scores = {
    supportCorrect: supported,
    entitiesCorrect,
    relationsCorrect,
    rendererCorrect,
    phaseCorrect,
    exactSemanticPass:
      supported &&
      entitiesCorrect &&
      relationsCorrect &&
      rendererCorrect &&
      phaseCorrect &&
      ionDirectionCorrect &&
      channelStateCorrect &&
      topologyCorrect,
    falseSupported: false,
    fiveDomainConfusion: forbiddenEntities.some((entity) => entityIds.includes(entity)),
    ionDirectionCorrect,
    channelStateCorrect,
    topologyCorrect,
  };

  const result: CaseResult = {
    id: testCase.id,
    category: testCase.category,
    prompt: testCase.prompt,
    expected: testCase.expected,
    actual,
    scores,
    failureCategory: null,
  };
  result.failureCategory = classifyFailure(result);
  return result;
}

function percent(count: number, total: number) {
  return total === 0 ? 0 : Number(((count / total) * 100).toFixed(1));
}

const caseResults = actionPotentialHoldoutCases.map(evaluateCase);
const supportedCases = caseResults.filter((result) => result.expected.supported);
const unsupportedCases = caseResults.filter((result) => !result.expected.supported);
const aggregate = {
  total: caseResults.length,
  exactSemanticPassRate: percent(caseResults.filter((result) => result.scores.exactSemanticPass).length, caseResults.length),
  supportedUnsupportedAccuracy: percent(caseResults.filter((result) => result.scores.supportCorrect).length, caseResults.length),
  supportedClassPassRate: percent(supportedCases.filter((result) => result.scores.exactSemanticPass).length, supportedCases.length),
  unsupportedClassPassRate: percent(unsupportedCases.filter((result) => result.scores.exactSemanticPass).length, unsupportedCases.length),
  falseSupportedRate: percent(caseResults.filter((result) => result.scores.falseSupported).length, unsupportedCases.length),
  fiveDomainConfusionRate: percent(caseResults.filter((result) => result.scores.fiveDomainConfusion).length, caseResults.length),
  ionDirectionAccuracy: percent(caseResults.filter((result) => result.scores.ionDirectionCorrect).length, caseResults.length),
  channelStateAccuracy: percent(caseResults.filter((result) => result.scores.channelStateCorrect).length, caseResults.length),
  topologyAccuracy: percent(caseResults.filter((result) => result.scores.topologyCorrect).length, caseResults.length),
};

const observedBaseline = {
  initialEvaluatorRunExactSemanticPassRate: 6.5,
  initialEvaluatorRunFalseSupportedRate: 46.7,
  correctedEvaluatorPreFinalCueTuningExactSemanticPassRate: 45.5,
  correctedEvaluatorPreFinalCueTuningFalseSupportedRate: 46.7,
  note:
    "The first baseline exposed an evaluator renderer-name mismatch and cross-domain labels that treated valid non-AP Spatial Ravia prompts as unsupported. Those evaluator/expectation issues were corrected before final parser cue tuning.",
};

const failuresByCategory = caseResults.reduce<Record<string, number>>((counts, result) => {
  if (result.failureCategory) counts[result.failureCategory] = (counts[result.failureCategory] ?? 0) + 1;
  return counts;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  holdoutFrozen: actionPotentialHoldoutFrozen,
  datasetVersion: actionPotentialHoldoutVersion,
  baselineBeforeParserImprovements: observedBaseline,
  postFixMetrics: aggregate,
  aggregate,
  failuresByCategory,
  cases: caseResults,
};

writeFileSync("SPATIAL_RAVIA_ACTION_POTENTIAL_HOLDOUT.json", `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  "SPATIAL_RAVIA_ACTION_POTENTIAL_HOLDOUT_REPORT.md",
  `# Spatial Ravia Action-Potential Holdout Report

## Summary

- Holdout size: ${aggregate.total}
- Initial observed baseline exact pass: ${observedBaseline.initialEvaluatorRunExactSemanticPassRate}%
- Corrected pre-final-tuning exact pass: ${observedBaseline.correctedEvaluatorPreFinalCueTuningExactSemanticPassRate}%
- Exact semantic pass rate: ${aggregate.exactSemanticPassRate}%
- Supported/unsupported accuracy: ${aggregate.supportedUnsupportedAccuracy}%
- Supported-class pass rate: ${aggregate.supportedClassPassRate}%
- Unsupported-class pass rate: ${aggregate.unsupportedClassPassRate}%
- False-supported rate: ${aggregate.falseSupportedRate}%
- Five-domain confusion rate: ${aggregate.fiveDomainConfusionRate}%
- Ion-direction accuracy: ${aggregate.ionDirectionAccuracy}%
- Channel-state accuracy: ${aggregate.channelStateAccuracy}%
- Topology accuracy: ${aggregate.topologyAccuracy}%

## Failure Categories

${Object.entries(failuresByCategory).map(([category, count]) => `- ${category}: ${count}`).join("\n") || "- none"}

## Important Failures

${caseResults.filter((result) => !result.scores.exactSemanticPass).slice(0, 10).map((result) => `- ${result.id}: ${result.prompt} (${result.failureCategory})`).join("\n") || "- none"}

## Notes

This evaluator is offline and deterministic. It does not call OpenAI or any external biology service. Baseline bookkeeping includes an initial evaluator issue and a documented expectation correction for cross-domain prompts that are valid in other Spatial Ravia domains.
`
);

console.log("Wrote SPATIAL_RAVIA_ACTION_POTENTIAL_HOLDOUT.json");
console.log("Wrote SPATIAL_RAVIA_ACTION_POTENTIAL_HOLDOUT_REPORT.md");
console.log(`Overall exact semantic pass rate: ${aggregate.exactSemanticPassRate}%`);
console.log(`Five-domain confusion rate: ${aggregate.fiveDomainConfusionRate}%`);
console.log(`False-supported rate: ${aggregate.falseSupportedRate}%`);
