import assert from "node:assert/strict";
import test from "node:test";
import type { BiologicalIntentProvider } from "./llm-interpretation.ts";
import {
  applyScientificModelDelta,
  interpretBiologicalIntent,
  validateStructuredIntent
} from "./llm-interpretation.ts";
import { compileBiologicalProcessPack } from "./model.ts";
import { processPacks } from "./process-registry.ts";
import { eukaryoticTranscriptionPack } from "./transcription-process.ts";

test("mock provider returns schema-validated structured biological intent", async () => {
  const provider = mockProvider({
    processSelection: {
      processId: eukaryoticTranscriptionPack.id,
      confidence: 0.92
    },
    biologicalContext: eukaryoticTranscriptionPack.defaultContext,
    requestedFocus: ["show-polymerase-motion"],
    requestedEntities: ["rna-polymerase-ii", "template-strand"],
    requestedRepresentation: "timeline",
    requestedIntervention: {
      commandId: "switch-to-timeline",
      confidence: 0.86
    },
    scientificModelDelta: {
      representationChoice: "timeline",
      selectedEntities: ["rna-polymerase-ii"]
    },
    confidence: 0.9,
    ambiguity: []
  });

  const result = await interpretBiologicalIntent(
    "Show RNA polymerase moving along DNA as a timeline",
    processPacks,
    provider
  );

  assert.equal(result.source, "llm");
  assert.equal(result.resolution.processCandidates[0]?.packId, eukaryoticTranscriptionPack.id);
  assert.equal(result.resolution.requestedRepresentation, "timeline");
  assert.equal(result.structuredResponse?.scientificModelDelta?.representationChoice, "timeline");
  assert.equal(result.logs.length, 1);
  assert.equal(result.logs[0].validationResult.valid, true);
  assert.equal(result.logs[0].fallbackPath, "none");
});

test("provider validation rejects invented process ids and falls back deterministically", async () => {
  const provider = mockProvider({
    processSelection: {
      processId: "photosynthesis-made-up",
      confidence: 0.98
    },
    requestedFocus: ["visualization"],
    requestedEntities: [],
    confidence: 0.98,
    ambiguity: []
  });

  const result = await interpretBiologicalIntent("Show transcription.", processPacks, provider);

  assert.equal(result.source, "deterministic");
  assert.equal(result.resolution.processCandidates[0]?.packId, eukaryoticTranscriptionPack.id);
  assert.equal(result.logs[0].validationResult.valid, false);
  assert.ok(result.logs[0].validationResult.errors.some((error) => error.includes("Unsupported process id")));
});

test("provider validation rejects unsupported entities and direct renderer manipulation", () => {
  const validation = validateStructuredIntent(
    {
      processSelection: {
        processId: eukaryoticTranscriptionPack.id,
        confidence: 0.9
      },
      requestedFocus: ["visualization"],
      requestedEntities: ["rna-polymerase-ii", "ribosome"],
      requestedRepresentation: "scene",
      rendererInstructions: { draw: "custom canvas command" },
      confidence: 0.9,
      ambiguity: []
    },
    processPacks
  );

  assert.equal(validation.valid, false);

  if (!validation.valid) {
    assert.ok(validation.errors.some((error) => error.includes("Unsupported top-level field")));
    assert.ok(validation.errors.some((error) => error.includes("unsupported entity")));
  }
});

test("provider validation rejects arbitrary equations or executable code fields", () => {
  const validation = validateStructuredIntent(
    {
      processSelection: {
        processId: eukaryoticTranscriptionPack.id,
        confidence: 0.9
      },
      requestedFocus: ["visualization"],
      requestedEntities: ["rna-polymerase-ii"],
      confidence: 0.9,
      ambiguity: [],
      generatedCode: "console.log('run')",
      equations: ["invented_rate = x / y"]
    },
    processPacks
  );

  assert.equal(validation.valid, false);

  if (!validation.valid) {
    assert.ok(validation.errors.some((error) => error.includes("generatedCode")));
    assert.ok(validation.errors.some((error) => error.includes("equations")));
  }
});

test("provider validation rejects nested unknown fields and low-confidence process selection", () => {
  const validation = validateStructuredIntent(
    {
      processSelection: {
        processId: eukaryoticTranscriptionPack.id,
        confidence: 0.2,
        executableCode: "return unsafe"
      },
      requestedFocus: ["visualization"],
      requestedEntities: ["rna-polymerase-ii"],
      confidence: 0.2,
      ambiguity: []
    },
    processPacks
  );

  assert.equal(validation.valid, false);

  if (!validation.valid) {
    assert.ok(validation.errors.some((error) => error.includes("processSelection.executableCode")));
    assert.ok(validation.errors.some((error) => error.includes("below the process selection threshold")));
  }
});

test("provider validation rejects arbitrary equations inside model deltas", () => {
  const validation = validateStructuredIntent(
    {
      processSelection: {
        processId: eukaryoticTranscriptionPack.id,
        confidence: 0.9
      },
      requestedFocus: ["visualization"],
      requestedEntities: ["rna-polymerase-ii"],
      confidence: 0.9,
      ambiguity: [],
      scientificModelDelta: {
        equations: ["invented"],
        selectedEntities: ["helicase"]
      }
    },
    processPacks
  );

  assert.equal(validation.valid, false);

  if (!validation.valid) {
    assert.ok(validation.errors.some((error) => error.includes("scientificModelDelta.equations")));
  }
});

test("provider retries only for format repair and accepts repaired structured data", async () => {
  const provider: BiologicalIntentProvider = {
    id: "mock-repair-provider",
    isAvailable: () => true,
    interpret: async () => ({
      processSelection: {
        processId: "invented",
        confidence: 0.9
      },
      requestedFocus: ["visualization"],
      requestedEntities: [],
      confidence: 0.9,
      ambiguity: []
    }),
    repairFormat: async () => ({
      processSelection: {
        processId: eukaryoticTranscriptionPack.id,
        confidence: 0.86
      },
      biologicalContext: eukaryoticTranscriptionPack.defaultContext,
      requestedFocus: ["show-polymerase-motion"],
      requestedEntities: ["rna-polymerase-ii"],
      requestedRepresentation: "scene",
      confidence: 0.86,
      ambiguity: []
    })
  };

  const result = await interpretBiologicalIntent("Show transcription.", processPacks, provider);

  assert.equal(result.source, "llm");
  assert.equal(result.logs.length, 2);
  assert.equal(result.logs[0].fallbackPath, "format-repair");
  assert.equal(result.logs[1].validationResult.valid, true);
  assert.equal(result.resolution.processCandidates[0]?.packId, eukaryoticTranscriptionPack.id);
});

test("provider falls back deterministically when unavailable or throwing", async () => {
  const unavailable = await interpretBiologicalIntent(
    "Show transcription.",
    processPacks,
    mockProvider({}, false)
  );
  assert.equal(unavailable.source, "deterministic");
  assert.equal(unavailable.logs[0].fallbackPath, "no-api-key");
  assert.equal(unavailable.resolution.processCandidates[0]?.packId, eukaryoticTranscriptionPack.id);

  const throwing: BiologicalIntentProvider = {
    id: "mock-throwing-provider",
    isAvailable: () => true,
    interpret: async () => {
      throw new Error("network unavailable");
    }
  };
  const thrown = await interpretBiologicalIntent("Show transcription.", processPacks, throwing);
  assert.equal(thrown.source, "deterministic");
  assert.equal(thrown.logs[0].fallbackPath, "provider-error");
  assert.equal(thrown.resolution.processCandidates[0]?.packId, eukaryoticTranscriptionPack.id);
});

test("validated ScientificModel delta can update only supported model fields", () => {
  const compiled = compileBiologicalProcessPack(eukaryoticTranscriptionPack);
  assert.equal(compiled.ok, true);

  if (!compiled.ok) {
    return;
  }

  const updated = applyScientificModelDelta(compiled.model, {
    representationChoice: "graph",
    parameterUpdates: [{ id: "polymerase-position", value: 0.5 }]
  });

  assert.equal(updated.representationChoice, "graph");
  assert.equal(updated.parameters.find((parameter) => parameter.id === "polymerase-position")?.value, 0.5);
  assert.equal(updated.renderPlan, compiled.model.renderPlan);
});

function mockProvider(response: unknown, available = true): BiologicalIntentProvider {
  return {
    id: "mock-provider",
    isAvailable: () => available,
    interpret: async () => response
  };
}
