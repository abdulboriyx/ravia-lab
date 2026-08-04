import assert from "node:assert/strict";
import test from "node:test";
import type {
  QuantitativeDataAvailability,
  ScientificRepresentation,
  ScientificScale
} from "./representation-selection.ts";
import { selectScientificRepresentation } from "./representation-selection.ts";
import type {
  PromptIntentResolution,
  ScientificModel
} from "./model.ts";
import { compileBiologicalProcessPack } from "./model.ts";
import { dnaReplicationPack } from "./dna-process.ts";
import { eukaryoticTranscriptionPack } from "./transcription-process.ts";

const availableRenderers: ScientificRepresentation[] = [
  "schematic-3d",
  "molecular-3d",
  "process-diagram",
  "network",
  "timeline",
  "time-series-graph",
  "state-space-view",
  "mixed-representation"
];

const noQuantitativeData: QuantitativeDataAvailability = {
  timeSeries: false,
  kineticParameters: false,
  stateVariables: false,
  structuralData: false,
  networkEdges: false
};

const dnaModel = compileModel(dnaReplicationPack);
const transcriptionModel = compileModel(eukaryoticTranscriptionPack);

type Case = {
  name: string;
  model: ScientificModel;
  rules?: string[];
  requestedRepresentation?: PromptIntentResolution["requestedRepresentation"];
  requestedFocus?: string[];
  available?: ScientificRepresentation[];
  scale: ScientificScale;
  quantitativeData?: Partial<QuantitativeDataAvailability>;
  expectedPrimary: ScientificRepresentation;
  expectedSecondary?: ScientificRepresentation;
  expectedWarning?: string;
};

const cases: Case[] = [
  {
    name: "DNA replication fork defaults to schematic 3D when no structural data exists",
    model: dnaModel,
    scale: "molecular",
    expectedPrimary: "schematic-3d",
    expectedSecondary: "timeline",
    expectedWarning: "schematic projection"
  },
  {
    name: "DNA replication timeline request uses timeline",
    model: dnaModel,
    requestedRepresentation: "timeline",
    scale: "molecular",
    expectedPrimary: "timeline",
    expectedSecondary: "schematic-3d"
  },
  {
    name: "DNA replication graph request uses network",
    model: dnaModel,
    requestedRepresentation: "graph",
    scale: "molecular",
    expectedPrimary: "network",
    expectedSecondary: "timeline"
  },
  {
    name: "DNA replication with measured fork rate exposes time-series graph",
    model: dnaModel,
    scale: "molecular",
    quantitativeData: { timeSeries: true, kineticParameters: true },
    rules: ["time dependent fork-rate trajectory"],
    expectedPrimary: "time-series-graph",
    expectedSecondary: "timeline"
  },
  {
    name: "DNA replication with structural data may use molecular 3D",
    model: dnaModel,
    scale: "molecular",
    quantitativeData: { structuralData: true },
    expectedPrimary: "molecular-3d",
    expectedSecondary: "schematic-3d"
  },
  {
    name: "Transcription unit defaults to schematic 3D",
    model: transcriptionModel,
    scale: "molecular",
    expectedPrimary: "schematic-3d",
    expectedSecondary: "timeline"
  },
  {
    name: "Transcription timeline request uses timeline",
    model: transcriptionModel,
    requestedRepresentation: "timeline",
    scale: "molecular",
    expectedPrimary: "timeline"
  },
  {
    name: "Transcription factor relation focus uses network",
    model: transcriptionModel,
    requestedRepresentation: "graph",
    requestedFocus: ["transcription-factors", "relations"],
    scale: "molecular",
    expectedPrimary: "network"
  },
  {
    name: "Transcription with elongation measurements exposes graph",
    model: transcriptionModel,
    requestedFocus: ["elongation", "rate", "trajectory"],
    scale: "molecular",
    quantitativeData: { timeSeries: true, kineticParameters: true },
    expectedPrimary: "time-series-graph"
  },
  {
    name: "Transcription structural data can use molecular 3D",
    model: transcriptionModel,
    scale: "molecular",
    quantitativeData: { structuralData: true },
    expectedPrimary: "molecular-3d"
  },
  {
    name: "MAPK cascade reaction network does not default to fake molecular 3D",
    model: mockModel("MAPK signaling cascade", ["reaction network", "cascade", "phosphorylation"]),
    scale: "cellular",
    quantitativeData: { networkEdges: true },
    expectedPrimary: "network",
    expectedWarning: "schematic projection"
  },
  {
    name: "Metabolic pathway uses network",
    model: mockModel("Glycolysis metabolic pathway", ["reaction network", "metabolic pathway"]),
    scale: "cellular",
    quantitativeData: { networkEdges: true },
    expectedPrimary: "network"
  },
  {
    name: "Calcium oscillation with traces uses time-series graph",
    model: mockModel("Calcium oscillation", ["time dependent concentration oscillation"]),
    scale: "cellular",
    quantitativeData: { timeSeries: true, kineticParameters: true },
    expectedPrimary: "time-series-graph"
  },
  {
    name: "Cell-cycle checkpoints with state variables use state-space view",
    model: mockModel("Cell cycle checkpoint control", ["state variable phase transition"]),
    scale: "cellular",
    quantitativeData: { stateVariables: true },
    expectedPrimary: "state-space-view"
  },
  {
    name: "Gene regulatory network uses network",
    model: mockModel("Gene regulatory network", ["gene regulatory network", "transcription factor edges"]),
    scale: "cellular",
    quantitativeData: { networkEdges: true },
    expectedPrimary: "network"
  },
  {
    name: "Morphogen gradient with time data uses graph",
    model: mockModel("Morphogen gradient formation", ["field concentration trajectory"]),
    scale: "tissue",
    quantitativeData: { timeSeries: true },
    expectedPrimary: "time-series-graph"
  },
  {
    name: "Membrane transport without quantitative data uses schematic 3D",
    model: mockModel("Membrane transport", ["membrane compartment spatial"]),
    scale: "cellular",
    expectedPrimary: "schematic-3d"
  },
  {
    name: "Protein folding without structure stays schematic",
    model: mockModel("Protein folding pathway", ["abstract state transition"]),
    scale: "molecular",
    requestedRepresentation: "scene",
    expectedPrimary: "schematic-3d",
    expectedWarning: "schematic projection"
  },
  {
    name: "Protein structure with structural data uses molecular 3D",
    model: mockModel("Protein structural domain", ["molecular structure geometry"]),
    scale: "molecular",
    quantitativeData: { structuralData: true },
    expectedPrimary: "molecular-3d"
  },
  {
    name: "Ecological population dynamics with quantitative data uses time-series graph",
    model: mockModel("Population dynamics", ["time dependent trajectory rate"]),
    scale: "population",
    quantitativeData: { timeSeries: true, stateVariables: true },
    expectedPrimary: "time-series-graph",
    expectedSecondary: "state-space-view"
  },
  {
    name: "Abstract differentiation landscape uses state-space view",
    model: mockModel("Cell differentiation landscape", ["abstract state space attractor projection"]),
    scale: "abstract",
    quantitativeData: { stateVariables: true },
    expectedPrimary: "state-space-view",
    expectedWarning: "schematic projection"
  },
  {
    name: "Mixed quantitative signaling model uses mixed representation when available",
    model: mockModel("Quantitative signaling network", ["reaction network time dependent concentration"]),
    requestedRepresentation: "json",
    scale: "cellular",
    quantitativeData: { timeSeries: true, networkEdges: true },
    expectedPrimary: "mixed-representation",
    expectedSecondary: "time-series-graph"
  },
  {
    name: "Unavailable requested timeline warns and falls back",
    model: dnaModel,
    requestedRepresentation: "timeline",
    available: ["process-diagram", "network"],
    scale: "molecular",
    expectedPrimary: "process-diagram",
    expectedWarning: "not available"
  }
];

for (const item of cases) {
  test(item.name, () => {
    const decision = selectScientificRepresentation({
      model: item.model,
      representationRules: item.rules ?? item.model.representationRules,
      userIntent: {
        requestedFocus: item.requestedFocus ?? [],
        requestedEntities: [],
        requestedRepresentation: item.requestedRepresentation
      },
      availableRenderers: item.available ?? availableRenderers,
      scale: item.scale,
      quantitativeData: {
        ...noQuantitativeData,
        ...item.quantitativeData
      }
    });

    assert.equal(decision.primaryRepresentation, item.expectedPrimary);
    assert.ok(decision.explanation.length > 0);
    assert.ok(decision.literalVersusSchematicWarning.length > 0);

    if (item.expectedSecondary) {
      assert.ok(
        decision.synchronizedSecondaryViews.includes(item.expectedSecondary),
        `Expected secondary ${item.expectedSecondary}, got ${decision.synchronizedSecondaryViews.join(", ")}`
      );
    }

    if (item.expectedWarning) {
      assert.ok(
        [
          decision.literalVersusSchematicWarning,
          ...decision.unsupportedViewWarnings
        ].some((warning) => warning.includes(item.expectedWarning ?? "")),
        `Expected warning containing ${item.expectedWarning}`
      );
    }
  });
}

test("molecular 3D request without structural data is prevented", () => {
  const decision = selectScientificRepresentation({
    model: mockModel("Reaction network", ["reaction network"]),
    representationRules: ["reaction networks should not default to fake molecular 3D"],
    userIntent: {
      requestedFocus: ["molecular-3d"],
      requestedEntities: [],
      requestedRepresentation: "scene"
    },
    availableRenderers,
    scale: "molecular",
    quantitativeData: {
      ...noQuantitativeData,
      networkEdges: true
    }
  });

  assert.notEqual(decision.primaryRepresentation, "molecular-3d");
  assert.equal(decision.primaryRepresentation, "network");
  assert.ok(decision.unsupportedViewWarnings.some((warning) => warning.includes("no structural data")));
});

function compileModel(pack: typeof dnaReplicationPack): ScientificModel {
  const result = compileBiologicalProcessPack(pack);
  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("Pack failed to compile in representation-selection test.");
  }

  return result.model;
}

function mockModel(process: string, rules: string[]): ScientificModel {
  return {
    ...dnaModel,
    process,
    aliases: [process.toLowerCase()],
    biologicalContext: "mock biological context",
    relations: [
      {
        id: "a-relates-b",
        source: "a",
        target: "b",
        relation: rules.join(" "),
        description: "Mock relation.",
        provenance: [...dnaModel.relations[0].provenance]
      }
    ],
    transitions: [
      {
        id: "a-to-b",
        from: "a",
        to: "b",
        trigger: "mock trigger",
        rule: rules.join(" "),
        provenance: [...dnaModel.transitions[0].provenance]
      }
    ],
    parameters: [
      {
        id: "mock-rate",
        label: "Mock rate",
        value: 1,
        unit: "relative",
        description: rules.join(" "),
        provenance: [...dnaModel.parameters[0].provenance]
      }
    ],
    representationRules: rules.map((rule, index) => ({
      ...dnaModel.representationRules[0],
      id: `mock-rule-${index}`,
      claim: rule,
      provenance: dnaModel.representationRules[0].provenance.map((item) => ({
        ...item,
        supportedClaim: rule
      }))
    }))
  };
}
