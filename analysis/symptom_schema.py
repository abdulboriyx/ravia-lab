"""Validation for non-diagnostic symptom evidence records."""

SYMPTOM_FIELDS = (
    "depressed_mood", "anhedonia", "appetite_weight_change", "sleep_disturbance",
    "psychomotor_change", "fatigue_loss_energy", "worthlessness_guilt",
    "concentration_decision_problems", "suicidal_ideation_death_thoughts",
)
SYMPTOM_STATES = {"present", "explicitly_absent", "uncertain", "not_mentioned"}


def validate_symptom_record(record: dict[str, object]) -> None:
    """Require four-state coding and evidence spans for present findings only."""
    for field in SYMPTOM_FIELDS:
        state = record.get(field)
        if state not in SYMPTOM_STATES:
            raise ValueError(f"{field} must use a four-state symptom label")
        evidence = record.get(f"{field}_evidence_spans", [])
        if state == "present" and (not isinstance(evidence, list) or not evidence):
            raise ValueError(f"{field} marked present requires a de-identified evidence span")
        if state != "present" and evidence:
            raise ValueError(f"{field} evidence spans are reserved for present findings")
