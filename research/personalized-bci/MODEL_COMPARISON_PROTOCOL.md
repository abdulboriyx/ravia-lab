# Task-wise and non-EEG model comparison protocol

This extension leaves the frozen 58-person cohort and anchored-SAS primary target unchanged. It evaluates each task in isolation, beginning with eyes-open resting EEG alongside the already completed eyes-closed benchmark. Cognitive tasks are supported by the same script but are not mixed with resting data.

## Fixed comparators

1. **Session-1 mean SAS:** population mean from only the training participants.
2. **Last-known SAS:** observed session-1 SAS carried forward to session 2. This has no session-1 reference score because that would use the target itself.
3. **Context-only ridge:** SDS, ESS, KSS, PANAS positive, and PANAS negative at the corresponding session. These are contemporaneous psychometric/context measures, not an assertion that they are available in a prospective setting.
4. **EEG ridge:** 2,196 fixed spectral/correlation features, ridge alpha 100.
5. **EEG RBF kernel ridge:** the same fixed EEG features; alpha 1, gamma `1 / training feature count` after training-only standardization.
6. **EEG + context ridge:** concatenated fixed EEG and context features, ridge alpha 100.

For every learned model, imputers, standardizers, and fit are calculated using session-1 training participants only. The participant-disjoint stability comparison applies the same model to a held-out person&apos;s session 1 and session 2. The direct later-session score trains on all session-1 participants and applies unchanged to session 2.

## EEG-added-value estimand

The primary incremental check is `MAE(EEG + context) − MAE(context-only)` on the participant-disjoint session-2 test, with a 10,000-resample paired participant bootstrap. A negative interval excluding zero would support incremental predictive value in this narrow setting; otherwise the result is inconclusive. It does not establish causality or clinical utility.
