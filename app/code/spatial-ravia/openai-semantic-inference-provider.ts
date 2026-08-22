import OpenAI from "openai";
import {
  frozenSemanticVocabularyPacket,
  semanticInferenceInstruction,
  type SemanticInferenceInput,
  type SemanticInferenceProvider,
} from "./semantic-inference-provider.ts";

export type OpenAISemanticProviderOptions = {
  apiKey?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
  onUsage?: (usage: { inputTokens?: number; outputTokens?: number; latencyMs: number; retries: number }) => void;
};

const nullableEnum = (values: readonly string[]) => ({ anyOf: [{ type: "string", enum: [...values] }, { type: "null" }] });
const subjectSchema = {
  type: "object", additionalProperties: false,
  properties: {
    rawText: { type: "string" },
    resolvedId: nullableEnum(frozenSemanticVocabularyPacket.entityIds),
    candidateIds: { type: "array", items: { type: "string", enum: [...frozenSemanticVocabularyPacket.entityIds] } },
    role: nullableEnum(["substrate", "product", "template", "complement", "donor", "acceptor", "catalyst", "regulator", "lesion", "focus", "context"]),
  }, required: ["rawText", "resolvedId", "candidateIds", "role"],
};
const requestSchema = {
  type: "object", additionalProperties: false,
  properties: {
    subjects: { type: "array", items: subjectSchema },
    phenomenon: nullableEnum(frozenSemanticVocabularyPacket.phenomenonIds),
    mechanism: nullableEnum(frozenSemanticVocabularyPacket.mechanismIds),
    states: { type: "array", items: { type: "string", enum: [...frozenSemanticVocabularyPacket.stateIds] } },
    focus: nullableEnum(["overview", "local", "region", "relationship", "terminus", "activeSite", "unknown"]),
    direction: {
      anyOf: [{ type: "object", additionalProperties: false, properties: {
        biochemical: nullableEnum(["fiveToThree", "threeToFive", "strandRelative", "sequenceDirection", "molecularDirection", "unknown"]),
        screen: nullableEnum(["screenLeft", "screenRight", "screenTop", "screenBottom"]),
        meaning: { type: "string", enum: ["scientific", "presentational", "ambiguous"] },
      }, required: ["biochemical", "screen", "meaning"] }, { type: "null" }],
    },
    spatialFrame: nullableEnum(["molecular", "strandRelative", "sequenceRelative", "screen", "unknown"]),
    detail: nullableEnum(frozenSemanticVocabularyPacket.detailLevels),
    outputPreferences: { type: "array", items: { type: "string", enum: ["static", "animated", "comparison", "localFocus", "overview"] } },
    requestedOutput: nullableEnum(["scientificFigure", "interactiveScene", "comparisonFigure", "dataExport", "unspecified"]),
  }, required: ["subjects", "phenomenon", "mechanism", "states", "focus", "direction", "spatialFrame", "detail", "outputPreferences", "requestedOutput"],
};

export const semanticInferenceJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    canonicalGloss: { type: "string" },
    acts: { type: "array", items: { type: "string", enum: [...frozenSemanticVocabularyPacket.intentActs] } },
    requests: { type: "array", items: requestSchema },
    assertedClaims: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      rawText: { type: "string" }, status: { type: "string", enum: ["neutral", "suspected", "validated", "corrected"] }, correctedInterpretation: { anyOf: [{ type: "string" }, { type: "null" }] },
    }, required: ["rawText", "status", "correctedInterpretation"] } },
    alternatives: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      id: { type: "string" }, description: { type: "string" }, requests: { type: "array", items: requestSchema }, confidence: { type: "number", minimum: 0, maximum: 1 },
    }, required: ["id", "description", "requests", "confidence"] } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  }, required: ["canonicalGloss", "acts", "requests", "assertedClaims", "alternatives", "confidence"],
} as const;

const removeNulls = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(removeNulls);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null).map(([k, v]) => [k, removeNulls(v)]));
  return value;
};

const promptFor = (input: SemanticInferenceInput) => `${semanticInferenceInstruction}\n\nFrozen vocabulary (use IDs exactly; do not invent):\n${JSON.stringify(input.vocabulary)}\n\nUser prompt:\n${input.normalizedPrompt.normalizedText}`;

export function createOpenAISemanticInferenceProvider(options: OpenAISemanticProviderOptions = {}): SemanticInferenceProvider {
  const client = new OpenAI({ apiKey: options.apiKey ?? process.env.OPENAI_API_KEY, timeout: options.timeoutMs ?? 30_000, maxRetries: 0 });
  const model = options.model ?? process.env.SPATIAL_SEMANTIC_MODEL ?? "gpt-5-mini";
  const retries = Math.max(0, options.maxRetries ?? 1);
  return {
    id: `openai:${model}`,
    async infer(input) {
      let attempt = 0;
      const started = Date.now();
      while (true) {
        try {
          const response = await client.responses.create({ model, input: promptFor(input), text: { format: { type: "json_schema", name: "semantic_inference", strict: true, schema: semanticInferenceJsonSchema } } });
          options.onUsage?.({ inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens, latencyMs: Date.now() - started, retries: attempt });
          return removeNulls(JSON.parse(response.output_text));
        } catch (error) {
          if (attempt >= retries) throw error;
          attempt += 1;
        }
      }
    },
  };
}
