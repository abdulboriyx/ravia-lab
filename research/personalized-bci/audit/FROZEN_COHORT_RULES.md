# ds004148 frozen cohort and exclusion rules

## Audit-only scope

This cohort is frozen for a descriptive data audit. No feature extraction, model fitting, hyperparameter tuning, or model selection is permitted in this audit directory.

## Source snapshot

- Public OpenNeuro S3 object listings, retrieved 2026-09-08, for `ds004148/sub-01` through `sub-60`.
- Public BIDS `participants.tsv` and accompanying metadata copied in `../sources/datasets/`.
- A representative raw BrainVision header and JSON sidecar in this directory establish the duration calculation: 61 stored channels × 4 bytes (IEEE float32) × 500 Hz.

## Inclusion: cross-session SAS cohort

Include a participant only when all are true:

1. session1 and session2 each contain all five expected raw EEG task files (`eyesclosed`, `eyesopen`, `mathematic`, `memory`, `music`);
2. session1 SAS is present (the immutable anchor); and
3. session2 SAS is present (the only later SAS observation available in this public participant table).

## Exclusions and missing-data rules

- Never infer an absent score, duration, session date, or task.
- Session3 is retained in the all-session manifest but excluded from the frozen SAS-change cohort because the supplied participant table has no `SAS_3rdVisit`, `SDS_3rdVisit`, or `ESS_3rdVisit` columns.
- Chronological order is `session1`, `session2`, then `session3` based on BIDS labels. Calendar dates are not available in the public metadata; no date interval is imputed.
- A session with fewer than five raw task files is marked EEG-incomplete and excluded from the primary repeated-session cohort.
- Missingness is recorded field-by-field. It is not replaced or imputed.

## Immutable anchor and change

For every participant, session1 SAS is the only permitted immutable anchor. `sas_anchor_session_id` is `session1` when it exists and blank otherwise. `anchored_sas_change` equals later SAS minus this anchor. It is blank, not zero, when either value is absent. No later available value may replace a missing session1 anchor.

## Interpretation boundary

This cohort can establish whether there is usable repeated EEG with two SAS measurements for a cross-session audit. It cannot establish robust preservation of genuine psychiatric symptom transitions unless the observed SAS-change distribution has adequate prespecified range and event coverage. The audit report states this empirical limitation without substituting a clinical threshold.
