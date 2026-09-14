# Research Protocol: Depression Diagnosis and Personalization

**Status:** Frozen before collection  
**Version:** 1.1  
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

Collection must not begin until outcome definitions are recorded in this protocol. Sampling criteria are specified below.

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

## Change control after collection begins

After collection begins, major changes to the primary question, sampling criteria, or outcomes must be recorded below with the date, the change, and its rationale. They must not be silently changed.

| Date | Change | Rationale |
| --- | --- | --- |
| 2026-09-14 | Protocol created and frozen before collection. | Establish the study questions, interpretive limits, and change-control rule. |
| 2026-09-14 | Version 1.1: added the 10,000-post family allocation, time stratification, and sampling manifest. | Freeze sampling criteria before collection. |
