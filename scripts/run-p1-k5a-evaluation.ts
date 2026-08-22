import { compilePromptIngress } from "../app/code/spatial-ravia/prompt-ingress-compiler.ts";
import { normalizeRawPrompt } from "../app/code/spatial-ravia/prompt-normalization.ts";
import { applyClarificationPolicy } from "../app/code/spatial-ravia/semantic-clarification-policy.ts";
import { evaluateScientificClaimPolicy } from "../app/code/spatial-ravia/semantic-misconception-policy.ts";
import { inferSemanticIntent } from "../app/code/spatial-ravia/semantic-inference-provider.ts";
import { createOpenAISemanticInferenceProvider } from "../app/code/spatial-ravia/openai-semantic-inference-provider.ts";
import { p1K5AFreshDevelopmentCorpus } from "../app/code/spatial-ravia/p1-k5a-fresh-corpus.ts";
import type { SemanticIntentV1 } from "../app/code/spatial-ravia/semantic-intent.ts";

const requests = (intent: SemanticIntentV1) => [intent.requests, ...intent.alternatives.map(({ requests: value }) => value)].flat();
const score = (entry: typeof p1K5AFreshDevelopmentCorpus[number], intent: SemanticIntentV1, scienceOutcome: string) => {
  const rs = requests(intent); const entities = new Set(rs.flatMap((r) => r.subjects.map((s) => s.resolvedId).filter(Boolean)));
  const semantic = (!entry.expected.entities || entry.expected.entities.every((id) => entities.has(id))) && (!entry.expected.phenomenon || rs.some((r) => r.phenomenon === entry.expected.phenomenon)) && (!entry.expected.mechanism || rs.some((r) => r.mechanism === entry.expected.mechanism));
  const acts = !entry.expected.acts || entry.expected.acts.every((act) => intent.acts.includes(act));
  const direction = !entry.expected.biochemicalDirection || rs.some((r) => r.direction?.biochemical === entry.expected.biochemicalDirection);
  const clarification = entry.expected.clarification === undefined || intent.clarification.required === entry.expected.clarification;
  return { passed: semantic && acts && direction && clarification && scienceOutcome !== "INVALID_SCIENTIFIC_REQUEST", semantic, acts, direction, clarification, critical: !acts || !direction || scienceOutcome === "INVALID_SCIENTIFIC_REQUEST" };
};

const corpus = process.env.K5A_LIMIT ? p1K5AFreshDevelopmentCorpus.slice(0, Number(process.env.K5A_LIMIT)) : p1K5AFreshDevelopmentCorpus;
const deterministic = corpus.map((entry) => { const ingress = compilePromptIngress(entry.prompt); return { entry, ...score(entry, ingress.semanticIntent, ingress.scientificValidity.outcome) }; });
const baseline = { total: deterministic.length, passed: deterministic.filter((x) => x.passed).length, critical: deterministic.filter((x) => x.critical).length };

async function main() {
  if (process.env.K5A_SKIP_MODEL === "1") { console.log(JSON.stringify({ corpus: corpus.length, baseline }, null, 2)); return; }
  const usage: { input: number; output: number; latency: number[]; retries: number } = { input: 0, output: 0, latency: [], retries: 0 };
  const provider = createOpenAISemanticInferenceProvider({ onUsage: (u) => { usage.input += u.inputTokens ?? 0; usage.output += u.outputTokens ?? 0; usage.latency.push(u.latencyMs); usage.retries += u.retries; } });
  const modelResults: Array<ReturnType<typeof score> & { id: string; ok: boolean; error?: string }> = [];
  for (const entry of corpus) {
    const result = await inferSemanticIntent(normalizeRawPrompt(entry.prompt), provider);
    if (!result.ok) { modelResults.push({ id: entry.id, ok: false, error: `${result.code}:${result.issues[0] ?? ""}`, passed: false, semantic: false, acts: false, direction: false, clarification: false, critical: true }); continue; }
    const intent = applyClarificationPolicy(result.intent); const science = evaluateScientificClaimPolicy(intent);
    modelResults.push({ id: entry.id, ok: true, ...score(entry, intent, science.outcome) });
  }
  const model = { total: modelResults.length, passed: modelResults.filter((x) => x.passed).length, critical: modelResults.filter((x) => x.critical).length, malformed: modelResults.filter((x) => !x.ok).length };
  const percentile = (values: number[], p: number) => values.length ? values.slice().sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] : 0;
  console.log(JSON.stringify({ corpus: corpus.length, baseline, model, usage: { inputTokens: usage.input, outputTokens: usage.output, retries: usage.retries, medianMs: percentile(usage.latency, .5), p90Ms: percentile(usage.latency, .9), p95Ms: percentile(usage.latency, .95), worstMs: Math.max(0, ...usage.latency) }, failures: modelResults.filter((x) => !x.passed).map((x) => ({ id: x.id, error: x.error })) }, null, 2));
}
void main();
