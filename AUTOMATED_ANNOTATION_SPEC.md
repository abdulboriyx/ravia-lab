# Automated Annotation Specification

## Output contract

The annotator returns valid JSON only—never free prose or Markdown. Every field must use the codebook values. Each `present` symptom or phenotype finding includes a confidence from 0 to 1 and a de-identified evidence span.

```json
{
  "diagnosis_status": "self_diagnosed_or_suspected",
  "symptoms": {
    "anhedonia": {
      "status": "present",
      "confidence": 0.91,
      "evidence": "Nothing interests me anymore."
    }
  }
}
```

## Prompt rules

- Label only what is stated or strongly entailed by the post.
- Do not infer diagnoses.
- Use `not_mentioned` generously.
- Do not infer trauma unless it is mentioned.
- Do not infer causation.
- Do not add text outside the JSON object.

## Gold-set validation

Hold back a preselected part of the manually annotated sample. For each variable, calculate precision, recall, F1, specificity where useful, and a confusion matrix. Report results per variable; do not use an overall F1 to mask weak categories.

## Acceptance thresholds

| Per-variable F1 | Status |
| --- | --- |
| `> 0.80` | usable |
| `0.70–0.80` | usable with caution |
| `0.60–0.70` | exploratory |
| `< 0.60` | do not use automatically |

Thresholds may later be adjusted for prevalence and research purpose, with the change logged in `RESEARCH_PROTOCOL.md`.
