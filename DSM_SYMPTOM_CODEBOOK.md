# Symptom Evidence Codebook

This codebook captures self-reported symptom evidence in text. It does not diagnose an author.

## Domains

| Field | Domain |
| --- | --- |
| `depressed_mood` | Depressed mood |
| `anhedonia` | Loss of interest or pleasure |
| `appetite_weight_change` | Appetite or weight change |
| `sleep_disturbance` | Sleep disturbance |
| `psychomotor_change` | Psychomotor change |
| `fatigue_loss_energy` | Fatigue or loss of energy |
| `worthlessness_guilt` | Worthlessness or guilt |
| `concentration_decision_problems` | Concentration or decision problems |
| `suicidal_ideation_death_thoughts` | Suicidal ideation or thoughts of death |

## States

Each domain receives one of four values:

| State | Meaning |
| --- | --- |
| `present` | The author explicitly describes the domain as present. Retain a de-identified evidence span. |
| `explicitly_absent` | The author explicitly says the domain is absent. |
| `uncertain` | The text could concern the domain but is too unclear to code as present or absent. |
| `not_mentioned` | The text does not address the domain. This is missing information, not a zero. |

## Evidence-span rule

For every `present` label, retain one or more de-identified text fragments in a private research record. Example:

```json
{
  "anhedonia": "present",
  "anhedonia_evidence_spans": ["Nothing interests me anymore and games don't feel enjoyable."]
}
```

## Non-diagnostic constraint

Do not calculate or use a symptom-count rule to assign MDD or any other diagnosis. Posts usually lack the information required to assess duration, impairment, exclusion criteria, mania, substances, and medical causes.
