# P1-B NormalizedPrompt Contract

`normalizeRawPrompt` in `prompt-normalization.ts` is the sole authoritative P1-B normalization entry point.

It accepts raw text, `RawPrompt`, or a prior `NormalizedPrompt` and returns:

- schema version `1`;
- the recoverable original `raw.rawText`;
- `normalizedText` containing lexical formatting cleanup only; and
- an ordered trace of normalization operation kinds and replacement counts.

Allowed transforms are NFC Unicode composition, removal of harmless formatting controls and paired Markdown/code wrappers, whitespace cleanup, prime glyph spelling, quote/dash/arrow typography, and repeated punctuation/separator cleanup. Case and spelling are deliberately preserved. The function is deterministic and structurally idempotent.

It does not identify DNA/RNA, actors, mechanisms, direction meaning, capabilities, unsupported states, claims, clarification, or owners. It imports none of the Foundation semantic/capability/scene authorities and is not wired into production paths in P1-B.

Legacy normalizer inventory: `biology-normalizer.ts` is a legacy semantic normalizer (it rewrites `unzip`, `open`, and enzyme-action phrasing); `normalizeDnaMechanismPrompt` and `normalizeRnaPrompt` are later migration targets because their results feed semantic interpretation; `normalizeBiologyPrompt` must not be reused as the P1-B lexical authority.
