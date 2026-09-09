# Personalized BCI research package

This directory makes the associated research page reproducible and source-traceable. It is a **protocol and evidence pack**, not a claim that personalization has already improved a mental-health endpoint.

## Contents

- `RESEARCH_QUESTION.md` — registered-style question, estimands, and decision rule.
- `EVALUATION_PROTOCOL.md` — time-ordered splits, calibration budgets, controls, and reporting requirements.
- `BASELINE_PROTOCOL.md` — frozen eyes-closed, session-1-to-session-2 fixed-population benchmark; no personalization.
- `audit/EYESCLOSED_FIXED_POPULATION_BASELINE.md` — completed fixed-model result and its later-session stability comparison.
- `citations.bib` — the cited primary paper and data record.
- `sources/` — local copies of the paper and official dataset metadata used to justify eligibility. `SOURCE_MANIFEST.md` records provenance and retrieval date.

## Selected primary dataset

OpenNeuro **ds004148**, *A test-retest resting and cognitive state EEG dataset*, is the discovery dataset. Its official README documents 60 participants, three sessions, and resting/cognitive EEG. The accompanying participant dictionary explicitly defines repeated Self-rating Anxiety Scale (SAS), Self-rating Depression Scale (SDS), Epworth Sleepiness Scale (ESS), Karolinska Sleepiness Scale (KSS), and PANAS affect fields. See `sources/datasets/`.

This dataset supports a test of near-term and approximately one-month session stability in a non-clinical sample. It does **not** establish a clinical mental-health monitoring population or a treatment effect; the protocol keeps those limits explicit.

## Reproducibility rule

Every claim in the page and protocol is either (a) a fact attributed to a source in `SOURCE_MANIFEST.md`, or (b) a proposed analysis labeled as such. Any new experimental assumption must be added to `ASSUMPTIONS_LOG.md` with a rationale and its effect on the estimand before it is used.
