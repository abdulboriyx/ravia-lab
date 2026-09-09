# Fixed population baseline — eyes-closed resting EEG

## Scope

This is the first model-only benchmark. It uses **eyes-closed resting EEG** and excludes eyes-open, arithmetic, memory, and music recordings. The source sidecar describes this task as five minutes with eyes closed. [OpenNeuro ds004148, `sources/datasets/ds004148-*`]

The frozen cohort is the 58 people marked in `audit/analysis_manifest.csv`. A record is eligible only when the raw eyes-closed recording is available and the frozen session-1/session-2 SAS pair exists. The script refuses to add or remove people based on data quality or model result.

## Prediction target and comparison

The scientific primary target remains anchored SAS change, `SAS_session2 − SAS_session1`. The fixed model is trained to predict raw session-1 SAS from session-1 EEG, then applied directly to session-2 EEG to predict raw session-2 SAS. Its predicted anchored change is `predicted_SAS_session2 − observed_SAS_session1`.

The baseline quantity is the later-session performance drop:

`participant-disjoint later-session metric (session 2) − participant-disjoint session-1 reference metric`.

MAE and RMSE are reported for raw SAS; the corresponding anchored-change errors are reported only for session 2. No session-3 performance is claimed because the public table provides no session-3 SAS.

## Leakage-safe pipeline

1. Download only the raw eyes-closed `.eeg` file for each frozen participant/session into an ignored local cache. The source URL and SHA-256 of every downloaded file are recorded in the result, but raw recordings are never committed.
2. For each recording independently, read the documented multiplexed 61-channel float32 data at 500 Hz; remove the per-channel recording mean; split into non-overlapping 5-second windows; and calculate fixed-band relative log power (delta 1–4, theta 4–8, alpha 8–13, beta 13–30, gamma 30–45 Hz) plus a 61-channel correlation-covariance upper triangle. These operations use no labels and do not fit a dataset-wide transform.
3. Fit the feature median imputer, feature standardizer, and ridge regression **using session-1 training participants only**. For the stability comparison, they are refit within each leave-one-participant-out training fold and applied to that held-out person&apos;s session 1 and session 2 features. Session-2 features and labels never affect any fit, hyperparameter, threshold, or feature definition.
4. Fit once on all session-1 records and apply the unchanged fitted pipeline directly to every session-2 record. There is no target-session normalization, adaptation, recalibration, or personalization.

## Fixed choices before execution

| Choice | Prespecified value | Reason |
|---|---|---|
| Recording condition | eyes-closed resting EEG only | One reproducible, 5-minute resting condition before mixing paradigms. |
| Cohort | 58 frozen SAS-paired participants | Defined before modeling in `audit/FROZEN_COHORT_RULES.md`. |
| Window length | 5 seconds | Fixed for stable short-window spectral summaries; no data-driven selection. |
| Frequency bands | 1–4, 4–8, 8–13, 13–30, 30–45 Hz | Conventional fixed EEG band definitions; no band selection from the outcome. |
| Covariance representation | upper triangle of channel correlation matrix | Simple fixed second-order feature, not a learned representation. |
| Model | ridge regression, alpha = 100 | One fixed regularized linear population model; no hyperparameter search. |
| Reference | participant-disjoint, leave-one-out session-1/session-2 predictions | Makes the session-1 and later-session comparison use the same held-out person and the same training information. |
| Later test | all session-2 recordings, direct application | Measures session drift without calibration or adaptation. |

The alpha value is a deliberately fixed engineering regularizer, not a validated optimum. The result must not be used to select a new cohort, target, task, or model. Any later model comparison requires a separate protocol amendment.

## Interpretation limits

This benchmark can quantify whether a fixed population model loses later-session SAS accuracy. It cannot establish whether personalization recovers that loss or preserves clinically meaningful symptom change. The audit’s lack of session-3 SAS and clinical-transition reference remains binding.
