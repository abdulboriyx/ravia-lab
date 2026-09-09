# Task-wise EEG, non-EEG, and context comparison

**Status:** complete for eyes-closed and eyes-open resting EEG. No tasks were pooled. No personalization or adaptation was run.

The frozen 58-person cohort, session-1 SAS anchor, and session-1-to-session-2 order are unchanged. Each learned model fits its median imputer, standardizer, and model using only session-1 training participants. The direct later-session column below is the requested fixed population model trained on all session-1 records and applied unchanged to session 2.

## Direct later-session SAS prediction

| Method | Eyes closed MAE | Eyes open MAE | Interpretation |
|---|---:|---:|---|
| Session-1 population mean | 7.08 | 7.08 | trivial non-EEG reference |
| Last-known session-1 SAS | **4.60** | **4.60** | later-session historical baseline |
| Context-only ridge | 5.33 | 5.33 | SDS, ESS, KSS, PANAS positive/negative at the corresponding session |
| EEG spectral/correlation ridge | 6.64 | 7.94 | fixed linear EEG model |
| EEG RBF kernel ridge | 6.73 | 7.24 | fixed stronger nonlinear representation; no tuning |
| EEG + context ridge | 6.23 | 7.43 | incremental EEG test |

Last-known SAS is not scored as a session-1 reference because it would copy that same-session target. It is a legitimate later-session comparator because session-1 SAS is the prespecified immutable historical observation.

## Does EEG add value beyond context?

The participant-disjoint session-2 incremental estimand is `MAE(EEG + context) − MAE(context-only)`. Negative values would favor EEG+context.

| Task | Difference in MAE | 95% paired participant-bootstrap interval | Finding |
|---|---:|---:|---|
| Eyes closed | +2.02 | +0.98 to +3.08 | EEG+context is worse than context-only. |
| Eyes open | +3.03 | +2.01 to +4.07 | EEG+context is worse than context-only. |

For this frozen feature/model family and cohort, there is **no evidence that EEG adds predictive value beyond the specified contemporaneous context/psychometric information**. Both resting EEG models also underperform the last-known-SAS baseline. This is a controlled negative result, not evidence that no EEG representation could ever be useful.

## Controlled stronger model

The RBF kernel ridge model uses the same 2,196 fixed EEG features as the linear ridge model. Its alpha is 1 and its RBF gamma is `1 / training feature count` after standardization. These values were fixed in `MODEL_COMPARISON_PROTOCOL.md`; no hyperparameter search or choice based on session-2 performance occurred. It improves over linear ridge for eyes open (7.24 vs 7.94 MAE) but remains worse than non-EEG/context baselines.

## Limits and next boundary

The comparison is limited to eyes-closed and eyes-open resting EEG. Arithmetic, memory, and music remain supported by the task-isolated runner but were not run or combined here. They require their own separately reported outputs; no later result may replace the primary resting-task result simply because it looks better.

The negative incremental finding does not alter the dataset audit: ds004148 still provides a 58-person session-stability cohort but insufficient longitudinal SAS evidence to establish preservation of genuine psychiatric symptom transitions.

## Reproducibility

- `eyesclosed_model_comparison.json` and `eyesopen_model_comparison.json` contain participant-level predictions, all metrics, and hashes/URLs for 116 raw source files per task.
- `scripts/run-ds004148-task-model-comparison.py --task eyesclosed` or `--task eyesopen` regenerates each task in isolation.
- Raw EEG is streamed, checksummed, feature-extracted, and removed. Ignored local feature caches are not versioned.
