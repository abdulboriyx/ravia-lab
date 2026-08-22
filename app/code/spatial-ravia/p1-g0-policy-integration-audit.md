# P1-G0 — C/D/E/F Policy Integration Audit

## Canonical stack

`NormalizedPrompt → P1-C extractSemanticIntent → P1-D applyClarificationPolicy → P1-E evaluateScientificClaimPolicy → P1-F decomposeSemanticIntent`

P1-C is the only language-to-F1 authority. P1-D changes only `clarification`; P1-E returns a separate claim/scientific-validity decision; P1-F returns a non-authoritative projection that references intact shared F1 context. D/E/F do not inspect raw or normalized prompt text.

## Deterministic precedence

All policies receive the same valid SemanticIntent after P1-D populates its field. P1-D owns whether ambiguity blocks. P1-E independently reports claims or deterministic internally contradictory scientific requests and never changes clarification. P1-F retains every act/request and records P1-D/P1-E handoffs; it makes no decision. Thus ambiguity plus a claim yields both a clarification and `CLAIM_REQUIRES_GROUNDING`; contradictory multi-intent semantics retain all acts while P1-E reports invalid science. Low confidence alone is non-blocking.

## F1 boundary

P1-D outputs a valid F1 document. P1-E and P1-F keep an F1-valid input intact; neither creates F1 fields. No stage represents audience, renderer ownership, SceneSpec/topology, provenance, or grounding. F1 v1 has no clause-level sequencing signal, so P1-F never infers `then` from textual or array order and reports compound acts as parallel. Explicit sequence requires a future F1 version change.

## Findings

- **NOTE:** `SemanticEntityMention.rawText` remains preserved by F1 but is excluded from P1-D policy identity; post-extraction policy uses only resolved/candidate semantic IDs.
- **NOTE:** Explicit sequential intent cannot be preserved with frozen F1 v1; it is documented rather than hidden in a projection convention.
