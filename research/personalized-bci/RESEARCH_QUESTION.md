# Research question — Research #1: BCI personalized

## Primary question

**Does personalization improve later repeated-session mental-state prediction while preserving sensitivity to real within-person change?**

## Population and data currently in scope

The discovery analysis uses OpenNeuro ds004148 only after programmatic eligibility checks confirm: (1) a stable subject identifier, (2) at least two chronologically ordered usable EEG sessions per included subject, and (3) the proposed target exists at the evaluated session. The dataset documentation supports repeated-session EEG and repeated SAS/SDS/ESS, KSS, and PANAS measures; it does not make the dataset a clinical validation cohort. [Wang et al., 2022; ds004148 documentation]

## Frozen targets

- **Primary discovery target: anchored SAS change**, \(\Delta SAS_{i,2}=SAS_{i,2}-SAS_{i,1}\). This is fixed before any model result is inspected; session-1 SAS is the immutable personal anchor. The fixed population baseline predicts raw session-2 SAS and derives its anchored-change prediction by subtracting the observed anchor.
- Secondary descriptive/control measures: absolute SAS, SDS, PANAS positive/negative affect, KSS, ESS, and recording-quality/context variables. They may explain or challenge a result; they cannot replace the primary endpoint because they perform better.
- The first benchmark has no session-3 SAS target: the dataset audit found `SAS_3rdVisit` absent for all 60 people. It therefore tests one later repeated session only.

No threshold for “clinically meaningful psychiatric change” is assumed. ds004148 has only three sessions, and its documentation/paper does not establish that it contains enough large, clinically meaningful SAS transitions. It can test **whether personalization survives session drift**. It may be underpowered to test **whether personalization preserves genuine psychiatric symptom change**; a null or positive result on the latter is therefore not clinical validation.

## Estimands

1. **Later-session stability loss**: the participant-level change in performance from earlier-session evaluation to a strictly later session for the same people.
2. **Unseen-person generalization loss**: the difference between the fixed population model’s held-out-person result and its development result.
3. **Personalization recovery**: the participant-level difference between an adaptation method and the fixed population model on the same, later held-out session under the same permitted calibration budget.
4. **Change preservation (exploratory only in ds004148)**: performance for predicting anchored SAS change, plus evidence that adaptation does not systematically attenuate observed change toward zero.

## Decision rule

The answer to the *session-drift* question is **yes, in the evaluated setting only** if the primary personalization method simultaneously:

1. lowers held-out later-session SAS MAE by **at least 0.10 within-sample SAS standard deviations** versus the fixed population model, with the paired participant bootstrap 95% interval excluding zero;
2. improves or ties (within 0.02 standardized MAE) anchored SAS-change MAE and has non-negative within-person Spearman correlation with observed anchored SAS change;
3. improves at least **60% of evaluable participants** on later-session SAS MAE; and
4. passes the artifact, context, session-identity, and person-identity controls in `EVALUATION_PROTOCOL.md`.

These are operational discovery thresholds, not clinical minimal-important-change thresholds. Failure to meet them is **no or inconclusive** for cross-session personalization. The genuine-symptom-change question remains explicitly **inconclusive** unless a dataset has a prespecified number and range of clinically meaningful repeated transitions. A gain in a random-window split, a distribution-alignment score, or an identity-recognition score alone cannot satisfy either question.
