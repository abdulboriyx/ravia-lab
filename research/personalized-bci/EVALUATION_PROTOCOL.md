# Evaluation protocol

## 1. Dataset gate (before modelling)

Create a subject-by-session manifest from the BIDS folders and participant table. Freeze it with subject ID, session label/date/order, target availability, recording condition, usable-channel/quality fields, and exclusions. Do not infer a missing visit date or label. Publish the manifest and its script output.

For ds004148, the paper reports three sessions: two close repeats and a roughly one-month repeat. The official dataset metadata provide repeated mental-health, affect, and sleep-related fields. This supports a *discovery* evaluation of session drift, not a claim about clinical trajectories or reliable psychiatric symptom transitions. [Wang et al., 2022; `sources/datasets/ds004148-*`]

## 2. Splits that measure the stability problem

Preassign whole participants, sessions, and overlapping windows before feature fitting.

| Evaluation | Train / calibration access | Test | Purpose |
| --- | --- | --- | --- |
| Earlier-to-later, same person | Earlier sessions only | The next later session | Later-session stability |
| Unseen person | No data from held-out people in training, preprocessing fit, or tuning | All sessions of held-out people | Population generalization |
| Personalization | The exact, prespecified early-session calibration budget for that person | A strictly later session not used for adaptation | Recovery after personalization |

Do not randomize EEG windows across partitions. Segment-level splits can leak person/recording signatures and inflate translational EEG results; this is the methodological warning demonstrated by Brookshire et al. (2024), not an effect-size assumption for this dataset.

## 3. Matched methods

Run the following models in order under identical target, preprocessing, model-selection, and calibration information. Do not introduce EEG foundation models unless the simpler EEG baselines show incremental signal over historical/context baselines on the later-session split.

1. historical-mean / last-observation baseline (non-EEG);
2. context-only baseline (sleepiness and documented quality fields, where available);
3. spectral EEG features + regularized linear model;
4. covariance/Riemannian model;
5. small EEG neural network;
6. the strongest fixed population EEG model + personal baseline/intercept;
7. the strongest fixed model + supervised calibration head/adapters; then partial or full fine-tuning only if the calibration-label budget supports it;
8. optional EEG foundation model only after step 3–5 establish later-session EEG signal.

If a method uses unlabeled target-session data, label it **transductive** and evaluate it separately. It must never use the future test recording to normalize an earlier prediction.

## 4. Outcomes and uncertainty

The primary metric is later-session **SAS MAE standardized by the training-set SAS standard deviation**. The primary change metric is anchored-SAS-change MAE, with within-person Spearman correlation reported descriptively. Report participant-level values and confidence intervals produced by resampling participants (and sessions where appropriate), not correlated windows as independent people. The frozen decision thresholds are in `RESEARCH_QUESTION.md`.

Report: fixed-model result, adapted result, paired recovery, calibration labels/minutes, usable recording coverage, abstentions, and percentage of participants improved. Do not substitute classification accuracy for a continuous measure without a prespecified, source-justified threshold.

## 5. Anti-cheating / change-preservation checks

- **Anchor test:** retain the first valid target as an immutable reference. Compare predicted and observed anchored changes; quantify regression-to-baseline and errors on the largest observed changes.
- **Sleep/context control:** compare EEG with context-only and EEG+context models. Do not automatically residualize sleep away: sleep can be both a confounder and an explanatory correlate, so the causal role must be stated for the intended use.
- **Artifact control:** train artifact/quality-only and cleaned-EEG models. Report channel rejection, motion/EOG/EMG availability, and whether an artifact-only model matches the purported EEG effect.
- **Session identity control:** predict session from features within the training data. High identity information is a diagnostic for recording drift, not an outcome.
- **Person identity control:** assess whether representations identify people under participant-disjoint evaluation. Do not treat either high or low identity accuracy as proof of valid symptom decoding.
- **Permutation controls:** shuffle targets only inside the training fold and retain the full pipeline. This tests whether the evaluation or tuning path has a spurious route to the target.

## 6. Guardrails

No adaptation update is allowed before the prediction for the new session is stored. Keep a frozen population fallback. Any deviation — target recoding, missing-data imputation, session ordering, EEG preprocessing, calibration budget, or clinical-change definition — must be recorded in `ASSUMPTIONS_LOG.md` before final analysis.
