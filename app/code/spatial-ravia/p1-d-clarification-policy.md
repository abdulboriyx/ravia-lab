# P1-D Clarification Policy

`applyClarificationPolicy(intent)` is the single deterministic F1-to-F1 policy authority. It consumes an already valid `SemanticIntent v1`, preserves every semantic field and alternative, and replaces only `clarification`.

It asks exactly one minimum-distinction question for unresolved entity/actor candidates, materially different alternatives, materially consequential ambiguous biochemical direction, or a missing target for a directional mechanism. It does not clarify wording variation, screen direction, known paraphrases, supported multi-acts, or claims. Claims remain for P1-E.

It never reads raw/normalized text, reparses, selects a capability, resolves science, decomposes requests, creates a SceneSpec, or selects production behavior.
