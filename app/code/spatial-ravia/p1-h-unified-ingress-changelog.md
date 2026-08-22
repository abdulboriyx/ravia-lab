# P1-H — Unified Ingress Change Log

## Authoritative composition

`compilePromptIngress(rawPrompt)` composes B → C → D → E → F and returns the normalized prompt, F1-valid intent, clarification, scientific-validity decision, decomposition, disposition, and renderer-independent reason codes. Clarification takes precedence over a concurrent claim outcome so unresolved alternatives remain visible.

## Development-only iterations

| Root cause | Systemic P1-C fix | Development result |
| --- | --- | --- |
| Surface representation variants did not share semantic lookup forms. | Canonical semantic token form plus shared DNA/RNA vocabulary aliases and mechanism synonyms. | 17/68 → 31/68 |
| Claim-shaped utterances and explicit incompatible states were not retained structurally. | Generic clause-level claim preservation and compositional state extraction. | 31/68 → 36/68; science-error 6/15 → 11/15 |
| Ambiguous references were scored only against a single preferred reading. | Bounded DNA/RNA and actor alternatives plus invariant scoring against any preserved reading. | 36/68 → 46/68; ambiguity 5/17 → 11/17 |
| Relationship and compound-mechanism context was not represented independently. | General relation inference, separate requests for independent mechanisms, arrow canonicalization, and transcript/splicing context. | 46/68 → 58/68; 0 critical failures |

No case-ID branching, benchmark exceptions, capability selection, or holdout evaluation was used. The final development score is 58/68 (85.3%) with zero critical failures. Category floors are lexical 22/22, ambiguity 13/17, science-error 12/15, and multi-intent 11/14.

## Deferred model-evaluation status

See [`p1-deferred-model-evaluation-status.md`](./p1-deferred-model-evaluation-status.md).

**P1 STATUS — DEFERRED: EXTERNAL API QUOTA REQUIRED**. P1 is not frozen: deterministic semantic extraction failed fresh generalization, while the model-backed provider architecture awaits funded live evaluation. The deterministic production path remains active.
