# Research question — Research #1: BCI personalized

## Primary question

**Does personalization improve future-session mental-state prediction while preserving sensitivity to real within-person change?**

## Population and data currently in scope

The discovery analysis uses OpenNeuro ds004148 only after programmatic eligibility checks confirm: (1) a stable subject identifier, (2) at least two chronologically ordered usable EEG sessions per included subject, and (3) the proposed target exists at the evaluated session. The dataset documentation supports repeated-session EEG and repeated SAS/SDS/ESS, KSS, and PANAS measures; it does not make the dataset a clinical validation cohort. [Wang et al., 2022; ds004148 documentation]

## Targets

- Primary discovery target: a prespecified repeated affect-related measure available at each session (PANAS negative affect, if completeness checks pass).
- Secondary targets: KSS, SAS, and SDS, evaluated only where their measurement timing and repeat status are verified in the supplied metadata.
- Change target: \(\Delta y_{i,t}=y_{i,t}-y_{i,1}\), with the first valid session retained as an immutable anchor.

No threshold for “clinically meaningful change” is assumed in this dataset. Such a threshold requires a target-specific clinical justification and must be registered before a confirmatory clinical study.

## Estimands

1. **Future-session stability loss**: the participant-level change in performance from earlier-session evaluation to a strictly later session for the same people.
2. **Unseen-person generalization loss**: the difference between the fixed population model’s held-out-person result and its development result.
3. **Personalization recovery**: the participant-level difference between an adaptation method and the fixed population model on the same, later held-out session under the same permitted calibration budget.
4. **Change preservation**: performance for predicting the anchored within-person change, plus evidence that an adaptation method does not systematically attenuate observed change toward zero.

## Decision rule

The answer is **yes, in the evaluated setting only** if a method simultaneously:

1. improves the prespecified future-session metric over the fixed population baseline under paired participant/session resampling;
2. does not worsen the anchored change metric or show material shrinkage of predictions toward each person’s updated baseline; and
3. passes the artifact, context, session-identity, and person-identity controls in `EVALUATION_PROTOCOL.md`.

Otherwise the answer is **no or inconclusive**. A gain in a random-window split, a distribution-alignment score, or an identity-recognition score alone cannot satisfy the question.
