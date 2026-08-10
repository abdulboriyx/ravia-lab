import { detectBiologyContext } from "./biology-context.ts";
import { normalizeBiologyPrompt } from "./biology-normalizer.ts";
import { parseBiologyPrompt } from "./biology-prompt-parser.ts";
import type { BiologyParseResult } from "./biology-parse-result.ts";
import { parseBiologyPromptSemantically } from "./biology-semantic-parser.ts";
import { validateBiologySceneConsistency } from "./biology-scene-validator.ts";

const deterministicFallbackConfidence = 0.86;

function shouldSuppressDeterministicFallback(prompt: string) {
  const text = normalizeBiologyPrompt(prompt);
  return [
    "polymerase reading a template",
    "ribosome transcribing dna",
    "stop codon pairing with normal trna",
    "amino acids emerging directly from mrna",
    "trna copying dna",
    "protein being transcribed",
    "rna being made",
  ].some((phrase) => text.includes(phrase));
}

export function parseBiologyScenePrompt(prompt: string): BiologyParseResult {
  const semantic = parseBiologyPromptSemantically(prompt);

  if (
    semantic.status === "supported" &&
    semantic.confidence >= deterministicFallbackConfidence
  ) {
    return semantic;
  }

  try {
    if (semantic.status === "unsupported" && shouldSuppressDeterministicFallback(prompt)) {
      return semantic;
    }

    const scene = parseBiologyPrompt(prompt);
    const context = detectBiologyContext(prompt);
    const validation = validateBiologySceneConsistency(scene, context);

    if (!validation.ok) {
      return {
        status: "unsupported",
        reason: validation.reason,
        confidence: 0,
      };
    }

    return {
      status: "supported",
      scene,
      confidence: deterministicFallbackConfidence,
      source: "deterministic",
    };
  } catch {
    return {
      status: "unsupported",
      reason:
        semantic.status === "unsupported"
          ? semantic.reason
          : "I cannot interpret this biology prompt yet.",
      confidence: semantic.status === "unsupported" ? semantic.confidence : 0,
    };
  }
}
