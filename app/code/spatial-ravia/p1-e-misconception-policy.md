# P1-E Misconception and Invalid-Science Policy

`evaluateScientificClaimPolicy(intent)` is the sole P1-E policy authority over valid `SemanticIntent v1`. It does not inspect prompt text: it consumes preserved claim status and structured semantic requests only.

Outcomes are `ACCEPT`, `CLAIM_REQUIRES_GROUNDING`, `CORRECTION_REQUIRED`, and `INVALID_SCIENTIFIC_REQUEST`.

- Suspected claims remain claims and require grounding; the policy does not silently rewrite them.
- Validated disputed claims require correction before compilation.
- Mutually exclusive states, opposing biochemical directions for the same semantic request, and a narrow incompatible canonical-pair guard are invalid requests.
- Ambiguity remains P1-D-owned. Valid unusual requests are accepted.

This is a bounded consistency policy, not a grounding engine: it creates no scientific scene facts, correction content, coordinates, topology, capability choice, or production decision.
