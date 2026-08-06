import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { BiologicalIntentProvider } from "./llm-interpretation.ts";
import {
  interpretBiologicalIntent,
  validateStructuredIntent
} from "./llm-interpretation.ts";
import {
  createOpenAiStructuredIntentProvider,
  createResponsesRequestBody,
  parseStructuredIntent
} from "./llm-openai-provider.server.ts";
import { buildProviderRequest } from "./llm-interpretation.ts";
import { dnaReplicationPack } from "./dna-process.ts";
import { processPacks } from "./process-registry.ts";

test("OpenAI structured intent provider is unavailable without a server API key", () => {
  const provider = createOpenAiStructuredIntentProvider({ apiKey: "" });

  assert.equal(provider.id, "openai-structured-intent");
  assert.equal(provider.isAvailable(), false);
});

test("OpenAI structured intent request only exposes registered intent catalog", () => {
  const request = buildProviderRequest("Show DNA replication.", processPacks);
  const body = createResponsesRequestBody(request, "test-model");
  const serialized = JSON.stringify(body);
  const schema = body.text.format.schema;

  assert.equal(body.model, "test-model");
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.strict, true);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ["requestedFocus", "requestedEntities", "confidence", "ambiguity"]);
  assert.ok(serialized.includes("dna-replication"));
  assert.ok(serialized.includes("two-body-orbit"));
  assert.ok(!serialized.includes("urlOrDoi"));
  assert.ok(!serialized.includes("renderPlan"));
  assert.ok(!serialized.includes("animation"));
});

test("OpenAI structured intent provider parses Responses output_text", async () => {
  const provider = createOpenAiStructuredIntentProvider({
    apiKey: "test-key",
    model: "test-model",
    transport: async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "test-model");
      assert.equal(body.text.format.name, "spatial_ravia_registered_intent");
      assert.equal(body.text.format.schema.properties.processSelection.properties.processId.enum.includes("dna-replication"), true);

      return jsonResponse({
        output_text: JSON.stringify({
          processSelection: {
            processId: dnaReplicationPack.id,
            confidence: 0.91
          },
          biologicalContext: dnaReplicationPack.defaultContext,
          requestedFocus: ["replication-fork"],
          requestedEntities: ["helicase"],
          requestedRepresentation: "scene",
          confidence: 0.91,
          ambiguity: []
        })
      });
    }
  });

  const result = await interpretBiologicalIntent("Show DNA replication.", processPacks, provider);

  assert.equal(result.source, "llm");
  assert.equal(result.resolution.processCandidates[0]?.packId, "dna-replication");
  assert.equal(result.logs[0].fallbackPath, "none");
});

test("OpenAI structured intent provider falls back deterministically on API errors", async () => {
  const provider = createOpenAiStructuredIntentProvider({
    apiKey: "test-key",
    transport: async () => jsonResponse({ error: { message: "rate limited" } }, 429)
  });

  const result = await interpretBiologicalIntent("Show Earth orbit.", processPacks, provider);

  assert.equal(result.source, "deterministic");
  assert.equal(result.logs[0].fallbackPath, "provider-error");
  assert.equal(result.resolution.processCandidates[0]?.packId, "two-body-orbit");
});

test("OpenAI parser accepts nested Responses output text and validation still rejects invented IDs", () => {
  const parsed = parseStructuredIntent({
    output: [
      {
        content: [
          {
            type: "output_text",
            text: JSON.stringify({
              processSelection: {
                processId: "invented-process",
                confidence: 0.99
              },
              requestedFocus: ["unsupported"],
              requestedEntities: [],
              confidence: 0.99,
              ambiguity: []
            })
          }
        ]
      }
    ]
  });
  const validation = validateStructuredIntent(parsed, processPacks);

  assert.equal(validation.valid, false);

  if (!validation.valid) {
    assert.ok(validation.errors.some((error) => error.includes("Unsupported process id")));
  }
});

test("visible client workspace does not import the server OpenAI provider", () => {
  const source = readFileSync(new URL("./prototype.tsx", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("./dna-workspace.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /llm-openai-provider/);
  assert.doesNotMatch(workspace, /llm-openai-provider/);
});

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}
