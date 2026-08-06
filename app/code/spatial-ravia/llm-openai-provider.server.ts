import type {
  BiologicalIntentProvider,
  BiologicalIntentProviderRequest,
  StructuredBiologicalIntent
} from "./llm-interpretation.ts";

export type OpenAiStructuredIntentProviderOptions = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  transport?: typeof fetch;
};

type ResponsesApiOutput = {
  output_text?: unknown;
  output?: unknown;
};

const defaultEndpoint = "https://api.openai.com/v1/responses";
const defaultModel = "gpt-5-mini";

export function createOpenAiStructuredIntentProvider(
  options: OpenAiStructuredIntentProviderOptions = {}
): BiologicalIntentProvider {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const endpoint = options.endpoint ?? defaultEndpoint;
  const model = options.model ?? process.env.SPATIAL_RAVIA_LLM_MODEL ?? defaultModel;
  const transport = options.transport ?? fetch;

  return {
    id: "openai-structured-intent",
    isAvailable: () => Boolean(apiKey),
    interpret: async (request) => {
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured.");
      }

      const response = await transport(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(createResponsesRequestBody(request, model))
      });

      if (!response.ok) {
        throw new Error(`OpenAI structured intent request failed with status ${response.status}.`);
      }

      return parseStructuredIntent(await response.json());
    }
  };
}

export function createResponsesRequestBody(
  request: BiologicalIntentProviderRequest,
  model = defaultModel
) {
  return {
    model,
    temperature: 0,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You are a bounded Spatial RAVIA intent selector.",
              request.instruction,
              "Use only the registered IDs in the supplied catalog.",
              "If the prompt is unsupported, return unsupported.reason and leave processSelection absent.",
              "Do not invent processes, entities, contexts, commands, interventions, parameters, geometry, equations, sources, URLs, or renderers."
            ].join(" ")
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              prompt: request.prompt,
              registeredCatalog: request.packs
            })
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "spatial_ravia_registered_intent",
        strict: true,
        schema: structuredIntentJsonSchema(request)
      }
    }
  };
}

export function parseStructuredIntent(payload: ResponsesApiOutput): StructuredBiologicalIntent {
  const outputText = typeof payload.output_text === "string"
    ? payload.output_text
    : outputTextFromResponsesOutput(payload.output);

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  const parsed = JSON.parse(outputText) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("OpenAI structured output was not a JSON object.");
  }

  return parsed as StructuredBiologicalIntent;
}

function structuredIntentJsonSchema(request: BiologicalIntentProviderRequest) {
  const processIds = request.packs.map((pack) => pack.id);
  const contextValues = unique(request.packs.flatMap((pack) => pack.biologicalContexts));
  const entityIds = unique(request.packs.flatMap((pack) => pack.entities.map((entity) => entity.id)));
  const commandIds = unique(request.packs.flatMap((pack) => pack.commandRules.map((rule) => rule.id)));
  const interventionIds = unique(
    request.packs.flatMap((pack) =>
      pack.commandRules
        .map((rule) => rule.activeIntervention)
        .filter((id): id is string => Boolean(id))
    )
  );
  const representationModes = unique(request.packs.flatMap((pack) => pack.representationModes));

  return {
    type: "object",
    additionalProperties: false,
    required: ["requestedFocus", "requestedEntities", "confidence", "ambiguity"],
    properties: {
      processSelection: {
        type: "object",
        additionalProperties: false,
        required: ["processId", "confidence"],
        properties: {
          processId: { type: "string", enum: processIds },
          confidence: confidenceSchema()
        }
      },
      biologicalContext: { type: "string", enum: contextValues },
      requestedFocus: {
        type: "array",
        items: { type: "string" }
      },
      requestedEntities: {
        type: "array",
        items: { type: "string", enum: entityIds }
      },
      requestedRepresentation: { type: "string", enum: representationModes },
      requestedIntervention: {
        type: "object",
        additionalProperties: false,
        required: ["confidence"],
        properties: {
          commandId: { type: "string", enum: commandIds },
          interventionId: { type: "string", enum: interventionIds },
          confidence: confidenceSchema()
        }
      },
      scientificModelDelta: {
        type: "object",
        additionalProperties: false,
        properties: {
          representationChoice: { type: "string", enum: representationModes },
          selectedEntities: {
            type: "array",
            items: { type: "string", enum: entityIds }
          },
          hiddenEntities: {
            type: "array",
            items: { type: "string", enum: entityIds }
          },
          activeIntervention: { type: "string", enum: interventionIds },
          parameterUpdates: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "value"],
              properties: {
                id: {
                  type: "string",
                  enum: unique(request.packs.flatMap((pack) => pack.parameters.map((parameter) => parameter.id)))
                },
                value: {
                  anyOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" }
                  ]
                }
              }
            }
          }
        }
      },
      confidence: confidenceSchema(),
      ambiguity: {
        type: "array",
        items: { type: "string" }
      },
      unsupported: {
        type: "object",
        additionalProperties: false,
        required: ["reason"],
        properties: {
          reason: { type: "string" }
        }
      }
    }
  };
}

function confidenceSchema() {
  return {
    type: "number",
    minimum: 0,
    maximum: 1
  };
}

function outputTextFromResponsesOutput(output: unknown) {
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
