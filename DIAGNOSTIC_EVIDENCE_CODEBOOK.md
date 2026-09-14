# Diagnostic Evidence Codebook

This codebook describes self-reported evidence in text. It is not a tool for diagnosing people.

## Core fields

| Field | Allowed values | Coding rule |
| --- | --- | --- |
| `diagnosis_status` | `clinician_diagnosis_self_reported`, `self_diagnosed_or_suspected`, `diagnosis_unspecified`, `ambiguous` | Use the conservative rules in `RESEARCH_PROTOCOL.md`. |
| `clinical_source` | `psychiatrist`, `psychologist`, `family_doctor`, `therapist`, `unknown_clinician`, `not_mentioned` | Record a source only when the author explicitly names it. |
| `diagnosis_evidence_note` | short reviewer rationale | Explain the text basis without copying unnecessary identifiable detail. |

## Clinical-history variables

Each variable is self-reported and independently coded. None establishes a clinician diagnosis.

| Field | Allowed values |
| --- | --- |
| `medication_status` | `current`, `past`, `discontinued`, `mentioned_unspecified`, `not_mentioned`, `ambiguous` |
| `psychotherapy_status` | `current`, `past`, `discontinued`, `mentioned_unspecified`, `not_mentioned`, `ambiguous` |
| `hospitalization_status` | `current`, `past`, `mentioned_unspecified`, `not_mentioned`, `ambiguous` |
| `previous_diagnosis_status` | `self_reported`, `not_mentioned`, `ambiguous` |
| `current_treatment_status` | `current`, `not_mentioned`, `ambiguous` |
| `treatment_discontinuation_status` | `self_reported`, `not_mentioned`, `ambiguous` |

## Evidence threshold

Only explicit first-person evidence should change a field from `not_mentioned`. If a statement is unclear, attributed to another person, hypothetical, or quoted, code `ambiguous` rather than inferring a status.

Examples:

- “My psychiatrist diagnosed me with MDD.” → `clinician_diagnosis_self_reported`; `psychiatrist`.
- “I think I have depression.” → `self_diagnosed_or_suspected`; `not_mentioned`.
- “I’ve been depressed for five years.” → `diagnosis_unspecified`; `not_mentioned`.
- “My friend was diagnosed.” → `ambiguous`; `not_mentioned`.
