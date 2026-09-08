# ds004148 subject-by-session audit

Audit date: 2026-09-08. This is a manifest-only audit. No EEG was read into a learning pipeline and no model was trained.

## Frozen result

All 60 listed participants have all five expected raw EEG task files in session1, session2, and session3. Each session contains 1,500 seconds (25 minutes) of raw EEG across eyes closed, eyes open, mathematic, memory, and music tasks. Duration is calculated from public S3 object sizes using the public BrainVision header: 61 stored channels, IEEE float32, 500 Hz. The JSON sidecar confirms 300 seconds per task.

The frozen cross-session SAS cohort contains **58 participants**: all five EEG tasks plus SAS in session1 (anchor) and session2 (later observation). Session labels establish order; the public metadata do not provide recording dates, so no date interval has been inferred.

## SAS and anchored change

Across all observed SAS values, there are 117 values: mean 41.26, SD 8.77, median 39, IQR 35–45, and range 25–69.

For the 58 valid session1→session2 pairs, anchored SAS change is `SAS_session2 − SAS_session1`: mean +1.16, SD 6.38, median +1, IQR −2.75 to +3, and range −15 to +18. Six participants have no recorded change. Twenty-three of 58 have an absolute recorded change of at least 5 SAS points. This is a descriptive count, not a claim that five points is clinically meaningful.

## Missingness

| Session | SAS | SDS | ESS | KSS | PANAS positive | PANAS negative |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| session1 | 2 | 2 | 2 | 3 | 3 | 3 |
| session2 | 1 | 0 | 0 | 2 | 2 | 2 |
| session3 | 60 | 60 | 60 | 3 | 3 | 3 |

The participant table has no third-visit SAS/SDS/ESS fields. Session3 remains in the all-session manifest for EEG, KSS, PANAS, and availability auditing, but it cannot contribute to anchored SAS change.

## Interpretation

**Cross-session stability:** yes, the public dataset supports an audited two-SAS-observation, repeated-session cohort of 58 people with complete raw EEG task availability.

**Symptom-change preservation:** insufficient for a reliable conclusion. There is measurable session1→session2 SAS spread, but only one later SAS observation per eligible person and no session3 SAS. The dataset supplies neither repeated symptom trajectories nor an externally justified clinical-transition threshold. It can therefore test whether an already-specified method survives recording/session drift; it cannot establish reliable preservation of genuine psychiatric symptom transitions.

## Files that freeze this audit

- `SUBJECT_SESSION_MANIFEST.csv`: every listed subject and BIDS session, with EEG availability, total raw duration, values, missingness, anchor, and anchored change.
- `FROZEN_COHORT_SESSION1_SESSION2.csv`: the 58 eligible rows used for a future cross-session SAS protocol.
- `FROZEN_COHORT_RULES.md`: inclusion, exclusion, chronological-order, and missing-data rules.
- `AUDIT_SUMMARY.json`: machine-readable counts and distribution summaries, including input checksums.
- `s3-subject-lists/`: public OpenNeuro S3 object-list snapshots used to establish raw EEG availability and sizes.

Run `npx tsx scripts/audit-ds004148.ts` to regenerate the derived outputs from the retained source snapshot. This script contains no modeling code.
