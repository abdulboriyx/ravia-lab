/**
 * P1-B: the single authoritative raw-prompt lexical normalization entry point.
 *
 * This module deliberately does not import parsers, capability records, F1, or
 * production ownership. It preserves wording while canonicalizing only
 * representation-level formatting.
 */

export const normalizedPromptSchemaVersion = "1" as const;

export type RawPrompt = {
  rawText: string;
};

export const promptNormalizationOperationKinds = [
  "unicodeNfc",
  "formattingResidueRemoved",
  "whitespaceNormalized",
  "primeNotationNormalized",
  "quoteNormalized",
  "dashNormalized",
  "arrowNormalized",
  "repeatedPunctuationCollapsed",
] as const;

export type PromptNormalizationOperationKind = (typeof promptNormalizationOperationKinds)[number];

export type PromptNormalizationOperation = {
  kind: PromptNormalizationOperationKind;
  replacements: number;
};

export type NormalizedPrompt = {
  schemaVersion: typeof normalizedPromptSchemaVersion;
  raw: RawPrompt;
  normalizedText: string;
  operations: readonly PromptNormalizationOperation[];
};

type MutableOperationCounts = Partial<Record<PromptNormalizationOperationKind, number>>;

const countReplace = (
  text: string,
  pattern: RegExp,
  replacement: string | ((substring: string, ...args: unknown[]) => string),
  kind: PromptNormalizationOperationKind,
  counts: MutableOperationCounts,
) => {
  let replacements = 0;
  const next = text.replace(pattern, (...args: unknown[]) => {
    const replacementText = typeof replacement === "function" ? replacement(args[0] as string, ...args.slice(1)) : replacement;
    if (replacementText !== args[0]) replacements += 1;
    return replacementText;
  });
  if (replacements) counts[kind] = (counts[kind] ?? 0) + replacements;
  return next;
};

const operationsFor = (counts: MutableOperationCounts): readonly PromptNormalizationOperation[] =>
  promptNormalizationOperationKinds.flatMap((kind) => {
    const replacements = counts[kind];
    return replacements ? [{ kind, replacements }] : [];
  });

const rawTextFor = (input: string | RawPrompt | NormalizedPrompt): string => {
  if (typeof input === "string") return input;
  return "raw" in input ? input.raw.rawText : input.rawText;
};

/**
 * Canonicalizes lexical representation only. It does not case-fold because
 * case can be scientifically meaningful, and it never corrects spelling.
 * Re-normalizing a NormalizedPrompt replays its retained raw text, making the
 * result structurally idempotent and preserving audit traceability.
 */
export function normalizeRawPrompt(input: string | RawPrompt | NormalizedPrompt): NormalizedPrompt {
  const rawText = rawTextFor(input);
  const counts: MutableOperationCounts = {};
  let text = rawText;

  const nfc = text.normalize("NFC");
  if (nfc !== text) {
    counts.unicodeNfc = 1;
    text = nfc;
  }

  // Formatting controls and paired Markdown/code wrappers carry no request meaning.
  text = countReplace(text, /[\u200B-\u200D\uFEFF]/g, "", "formattingResidueRemoved", counts);
  text = countReplace(text, /```(?:[A-Za-z0-9_+-]+)?\s*|```/g, "", "formattingResidueRemoved", counts);
  text = countReplace(text, /`([^`\n]+)`/g, (_match, content) => String(content), "formattingResidueRemoved", counts);
  text = countReplace(text, /(\*\*|__)(\S(?:[\s\S]*?\S)?)\1/g, (_match, _marker, content) => String(content), "formattingResidueRemoved", counts);

  // Normalize numeric prime typography before canonicalizing apostrophes.
  text = countReplace(
    text,
    /\b([0-9])\s*[′’‘`'´](?=\s*(?:prime\b|to\b|end\b|[-–—−→⟶⟹]|$|[.,;:!?)}\]]))/g,
    (_match, digit) => `${digit}-prime`,
    "primeNotationNormalized",
    counts,
  );
  text = countReplace(text, /[‘’‚‛´`]/g, "'", "quoteNormalized", counts);
  text = countReplace(text, /[“”„‟]/g, '"', "quoteNormalized", counts);
  text = countReplace(text, /[–—―−]/g, "-", "dashNormalized", counts);
  text = countReplace(text, /[→⟶⟹➔]/g, "->", "arrowNormalized", counts);
  text = countReplace(text, /[←⟵⟸]/g, "<-", "arrowNormalized", counts);

  text = countReplace(text, /[\t\n\r\f\v\u00A0 ]+/g, " ", "whitespaceNormalized", counts);
  text = countReplace(text, /\s*(->|<-)\s*/g, (_match, arrow) => ` ${arrow} `, "whitespaceNormalized", counts);
  text = countReplace(text, /\s+([,;!?])/g, (_match, punctuation) => String(punctuation), "whitespaceNormalized", counts);
  text = countReplace(text, /!{2,}/g, "!", "repeatedPunctuationCollapsed", counts);
  text = countReplace(text, /\?{2,}/g, "?", "repeatedPunctuationCollapsed", counts);
  text = countReplace(text, /([,;])\1+/g, (_match, separator) => String(separator), "repeatedPunctuationCollapsed", counts);

  const trimmed = text.trim();
  if (trimmed !== text) {
    counts.whitespaceNormalized = (counts.whitespaceNormalized ?? 0) + 1;
    text = trimmed;
  }

  return {
    schemaVersion: normalizedPromptSchemaVersion,
    raw: { rawText },
    normalizedText: text,
    operations: operationsFor(counts),
  };
}
