# P1-F — Multi-Intent Decomposition

`decomposeSemanticIntent(intent)` is the sole P1-F projection from a valid frozen `SemanticIntent v1`. It does not parse raw text, interpret a canonical-gloss string, select a production owner, plan science, create a SceneSpec, or introduce another semantic authority.

## Projection contract

- `sharedContext` retains the semantic requests, alternatives, claims, clarification state, gloss, and confidence once.
- Every `subIntent` names one frozen F1 act and references shared requests by index. This supports show + explain, compare + animate, show + identify, repeated actors, and related multiple actors without copying scientific context.
- `conflicts` only hands existing ambiguity to P1-D and preserved non-neutral claims to P1-E. It never drops a clause or resolves a conflict.

## Ordering boundary

F1 v1 retains a list of acts and requests but has no clause-to-act association or explicit temporal-order field. P1-F therefore reports compound acts as `parallel`; it does **not** infer a sequence from array position, canonical gloss, or raw utterance. A future requirement to preserve “then”/ordered work needs a SemanticIntent schema/version change that carries an explicit semantic sequence. This preserves the frozen-contract boundary and prevents a second parser from appearing downstream.

## Protected boundaries

P1-F must not choose a renderer or SceneSpec, select a capability, scientific structure, timeline, or production route. It consumes only validated SemanticIntent v1 and emits a non-authoritative planning projection.
