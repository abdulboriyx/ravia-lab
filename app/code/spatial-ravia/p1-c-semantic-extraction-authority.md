# P1-C Semantic Extraction Authority

`extractSemanticIntent(normalizedPrompt)` in `semantic-extractor.ts` is the single new P1 authority for `NormalizedPrompt v1 → SemanticIntent v1`. It validates every result against frozen F1 and has no parser, capability, SceneSpec, grounding, renderer, or production-owner dependency.

It extracts bounded acts; subjects; phenomena; mechanisms; states; direction meaning; detail/output intent; claims; alternatives; and confidence for the current DNA/RNA vocabulary. It preserves ambiguity as F1 alternatives and always leaves `clarification.required` false: P1-D owns clarification policy.

F1 v1 has no audience field. Audience language remains recoverable in `rawUtterance` and `canonicalGloss`; adding structured audience requires a future F1 schema/version change and is out of scope.

## Legacy comparison

| Existing path | Classification | Evidence |
| --- | --- | --- |
| General biology parser | Foundation more precise | Both recognize replication/transcription vocabulary; P1-C retains multiple acts, claims, direction meaning, confidence, and alternatives instead of emitting a scene or taking fallback precedence. |
| DNA family interpretation | Equivalent at family level; Foundation more precise | Both cover structure, regulation, replication, transcription, repair, packaging, and local chemistry. P1-C separates entity, phenomenon, mechanism, and state, while legacy additionally chooses detail/camera-facing selection. |
| DNA mechanism interpretation | Equivalent at mechanism level; Foundation more precise | Both cover pairing, backbone, polarity, stabilization, separation, and assembly. P1-C intentionally does not create interaction/reaction/presentation specifications. |
| RNA resolver | Equivalent for current RNA families; Foundation more precise | Both recognize hairpins, processing, pairing/hybridization, cleavage, degradation, stability, and chemistry. P1-C additionally preserves claims, alternatives, multi-acts, and screen-versus-biochemical direction. |

Legacy paths remain more precise only for production-specific representation detail, which is deliberately out of scope. Phrase conflicts are retained as F1 alternatives rather than resolved by legacy branch precedence. No production route is migrated in P1-C.
