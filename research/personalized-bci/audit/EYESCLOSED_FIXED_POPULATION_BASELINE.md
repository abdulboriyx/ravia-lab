# Eyes-closed fixed population baseline

**Status:** complete, fixed-model baseline only. No personalization, adaptation, target-session fitting, or hyperparameter search was run.

## Question measured

The first benchmark uses only the five-minute eyes-closed resting recording. It predicts raw SAS from session-1 EEG and applies the unchanged population model directly to session-2 EEG. The scientific target remains anchored session-2 SAS change: predicted change is predicted session-2 SAS minus the observed immutable session-1 SAS anchor.

The model and all feature definitions were frozen in [`../BASELINE_PROTOCOL.md`](../BASELINE_PROTOCOL.md) before execution. The 58 included people are exactly the cohort marked in `analysis_manifest.csv`; no inclusion decision used a feature or model result.

## Leakage boundary

- Spectral/correlation features were computed independently within a recording, without labels.
- Every median imputer, standardizer, and ridge fit used session-1 training participants only.
- The stability comparison holds one participant out, then uses that same session-1-trained model to predict that person&apos;s session 1 and session 2. This makes the two metrics comparable without giving the model that person&apos;s earlier data.
- The direct later-session result separately trains on all 58 session-1 records and applies that unchanged model to all 58 session-2 records, as the fixed-population deployment baseline.

## Features and model

| Component | Frozen specification |
|---|---|
| Task | eyes-closed resting EEG only |
| Input | 61 documented EEG channels, 500 Hz, 300 seconds per recording |
| Spectral features | relative log power, 5-second windows: 1–4, 4–8, 8–13, 13–30, 30–45 Hz |
| Covariance feature | 1,891 upper-triangle channel-correlation values |
| Feature total | 2,196 |
| Model | ridge regression, alpha 100 |

## Results

| Evaluation | MAE | RMSE |
|---|---:|---:|
| Participant-disjoint session-1 reference | 8.50 | 10.56 |
| Participant-disjoint session-2 later test | 7.93 | 10.24 |
| Direct session-1-trained model on session 2 | 6.64 | 8.43 |
| Direct model, anchored session-2 change | 6.64 | 8.43 |

The preregistered comparison quantity, `MAE(participant-disjoint session 2) − MAE(participant-disjoint session 1)`, was **−0.56 SAS points** (10,000 participant bootstrap resamples; 95% interval −2.06 to +0.92). Thus, this specific fixed model did **not** show a clear later-session performance drop; the interval includes no difference. It would be invalid to claim that personalization can recover a loss that this baseline has not established.

The direct model&apos;s anchored-change MAE equals its session-2 raw-SAS MAE algebraically because both prediction and observed value subtract the same observed session-1 anchor. That identity is not evidence of symptom-change preservation. The dataset still has one SAS follow-up only and no session-3 SAS, as documented in `DATASET_AUDIT.md`.

## Reproducibility

`eyesclosed_fixed_population_baseline.json` contains all 58 participant-level predictions, fixed-model metadata, and SHA-256 provenance for all 116 downloaded public raw recordings. `scripts/run-ds004148-eyesclosed-baseline.py` regenerates the result from the frozen manifest. Raw EEG is downloaded one file at a time, feature-extracted, checksum-recorded, and deleted; only ignored local feature caches are retained.
