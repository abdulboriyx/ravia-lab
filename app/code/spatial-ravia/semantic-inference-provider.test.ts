import { strict as assert } from "node:assert";
import test from "node:test";
import { normalizeRawPrompt } from "./prompt-normalization.ts";
import { extractSemanticIntentWithModel } from "./semantic-model-extractor.ts";
import { parseSemanticInferenceOutput, projectSemanticInference, type SemanticInferenceOutput, type SemanticInferenceProvider } from "./semantic-inference-provider.ts";
import { semanticInferenceJsonSchema } from "./openai-semantic-inference-provider.ts";

const request = (subjects: Array<{ rawText: string; resolvedId: "dna" | "rna" }>, phenomenon?: "basePairing", mechanism?: "hydrogenBonding") => ({ subjects, phenomenon, mechanism, focus: "relationship" as const, spatialFrame: "molecular" as const, detail: "auto" as const, outputPreferences: ["static" as "static"], requestedOutput: "scientificFigure" as const });
const baseOutput: SemanticInferenceOutput = { canonicalGloss: "show DNA base pairing", acts: ["show"], requests: [request([{ rawText: "DNA", resolvedId: "dna" }], "basePairing", "hydrogenBonding")], assertedClaims: [], alternatives: [], confidence: 0.91 };

test("strict model output accepts bounded vocabulary and projects to SemanticIntent v1", async () => {
  const provider: SemanticInferenceProvider = { id: "fixture-model", infer: async () => baseOutput };
  const result = await extractSemanticIntentWithModel(normalizeRawPrompt("show DNA base pairing"), provider);
  assert.equal(result.ok, true);
  if (result.ok) { assert.equal(result.intent.schemaVersion, "1"); assert.equal(result.intent.rawUtterance, "show DNA base pairing"); assert.equal(result.intent.requests[0]?.phenomenon, "basePairing"); }
});

test("unknown model fields and IDs are rejected before projection", () => {
  const unknown = parseSemanticInferenceOutput({ ...baseOutput, renderer: "three", requests: [{ ...baseOutput.requests[0], phenomenon: "inventedPhenomenon" }] });
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.ok(unknown.issues.some((issue) => issue.includes("unknown field")) && unknown.issues.some((issue) => issue.includes("invalid vocabulary")));
});

test("model preserves claims and ambiguity without deciding policy", () => {
  const output: SemanticInferenceOutput = { ...baseOutput, assertedClaims: [{ rawText: "DNA has ribose", status: "suspected" }], alternatives: [{ id: "dna-or-rna", description: "DNA or RNA pairing", requests: [request([{ rawText: "DNA", resolvedId: "dna" }], "basePairing", "hydrogenBonding")], confidence: 0.5 }] };
  const intent = projectSemanticInference(normalizeRawPrompt("DNA has ribose"), output);
  assert.equal(intent.assertedClaims[0]?.status, "suspected");
  assert.equal(intent.alternatives[0]?.id, "dna-or-rna");
  assert.equal(intent.clarification.required, false);
});

test("provider failures are explicit and never invoke the legacy parser", async () => {
  const provider: SemanticInferenceProvider = { id: "failing-model", infer: async () => { throw new Error("unavailable"); } };
  const result = await extractSemanticIntentWithModel("show RNA", provider);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "provider_error");
});

test("repeated identical provider responses are semantically stable", async () => {
  const provider: SemanticInferenceProvider = { id: "stable-fixture", infer: async () => baseOutput };
  const [one, two] = await Promise.all([extractSemanticIntentWithModel("show DNA base pairing", provider), extractSemanticIntentWithModel("show DNA base pairing", provider)]);
  assert.deepEqual(one.ok && one.intent, two.ok && two.intent);
});

test("OpenAI structured schema is bounded to the F1 projection", () => {
  assert.equal(semanticInferenceJsonSchema.additionalProperties, false);
  assert.deepEqual(semanticInferenceJsonSchema.required, ["canonicalGloss", "acts", "requests", "assertedClaims", "alternatives", "confidence"]);
  const request = semanticInferenceJsonSchema.properties.requests.items as { additionalProperties?: boolean };
  assert.equal(request.additionalProperties, false);
});
