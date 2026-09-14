# Research Protocol: Depression Diagnosis and Personalization

**Status:** Pre-collection; eligibility pilot pending  
**Version:** 1.2  
**Date frozen:** 2026-09-14

## Primary question

> Do self-described depressive experiences on Reddit form reproducible multidimensional profiles that contain more information than the broad label “depression”?

## Secondary questions

1. Which symptom combinations recur?
2. Which life contexts co-occur with which symptom profiles?
3. Do self-reported clinician-diagnosed users differ from self-suspected users?
4. Are some profiles associated with more functional impairment or suicidality?

## Explicit limits of interpretation

This project does not:

- diagnose individuals;
- infer causation from life events;
- claim that clusters are biological diseases; or
- claim that Reddit represents all depressed people.

## Collection gate

Full collection must not begin until all of the following are complete:

- outcome definitions are recorded in this protocol;
- the eligibility pilot is complete; and
- the final eligibility rules are frozen.

## Sampling design

### Target size and allocation

The target sample is **10,000 posts**. Posts are allocated across analytical families, rather than collected from the newest or most active communities.

| Subreddit family | Target posts |
| --- | ---: |
| General depression | 3,000 |
| Anhedonia / emotional numbness | 1,500 |
| Suicidal ideation | 1,500 |
| Loneliness / social disconnection | 1,500 |
| Depression treatment / recovery | 1,500 |
| Related comparison communities, including anxiety | 1,000 |
| **Total** | **10,000** |

### Time stratification

Posts will be sampled across calendar quarters from **2021-01-01** through **2025-12-31**. The sample must not be assembled by simply taking the newest 10,000 posts. Within each family, sampling is stratified by calendar quarter to reduce temporal and platform-ranking bias.

### Manifest and traceability

`SAMPLING_MANIFEST.csv` is the frozen, group-level sampling manifest. Before collection, the individual communities assigned to each family must be entered in a community-level supplement to the manifest, with the family, inclusion decision, and date recorded.

Each final dataset record must retain the manifest row, subreddit family, source community, and calendar-quarter stratum. This makes the final dataset traceable back to the sampling design.

## Post eligibility rules

### Include

Include a post only when it:

- is written in the first person;
- concerns the author’s own experience;
- discusses mood, cognition, motivation, functioning, symptoms, treatment, or circumstances; and
- contains enough text to interpret its meaning.

### Exclude

Exclude:

- memes;
- advertisements;
- moderator posts;
- reposted news;
- pure questions about somebody else;
- bot posts;
- obvious fiction;
- empty or deleted posts; and
- extremely short posts without interpretable content.

### Decision labels

Every screened candidate post receives exactly one of these labels:

| Label | Meaning |
| --- | --- |
| `include` | Meets all inclusion criteria and no exclusion criterion. |
| `exclude` | Meets an exclusion criterion or fails an inclusion criterion. |
| `uncertain` | The available text does not support a confident inclusion or exclusion decision. |

`uncertain` posts must not be forced into the final dataset.

### Pilot review before final freeze

Before full collection, approximately 100 randomly selected candidate posts must be manually screened. `PILOT_SCREENING_LOG.csv` records each post’s decision and rationale. After the pilot, ambiguous definitions may be clarified and logged; the eligibility rules are frozen only after that review.

## Change control after collection begins

After collection begins, major changes to the primary question, sampling criteria, or outcomes must be recorded below with the date, the change, and its rationale. They must not be silently changed.

| Date | Change | Rationale |
| --- | --- | --- |
| 2026-09-14 | Protocol created and frozen before collection. | Establish the study questions, interpretive limits, and change-control rule. |
| 2026-09-14 | Version 1.1: added the 10,000-post family allocation, time stratification, and sampling manifest. | Freeze sampling criteria before collection. |
| 2026-09-14 | Version 1.2: added provisional eligibility rules, three screening labels, and a required 100-post pilot review. | Prevent ambiguous posts from being forced into the dataset and calibrate the rules before full collection. |
