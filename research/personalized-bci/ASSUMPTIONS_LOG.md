# Assumptions log

| Status | Assumption | Rationale / impact |
| --- | --- | --- |
| Fixed | Anchored SAS change is the sole primary discovery endpoint. | Prevents outcome switching after comparing SAS/SDS/PANAS/KSS. Other measures are secondary controls/context only. |
| Fixed | Session-1 SAS is the sole personal anchor. | Prevents a continuously adapted baseline from making sustained observed change disappear by definition; a later value cannot replace a missing session-1 anchor. |
| Fixed | Calibration labels are restricted to earlier sessions. | Defines a deployable, time-ordered personalization comparison. |
| Fixed | The first baseline uses eyes-closed resting EEG only, fixed spectral/correlation features, and ridge alpha 100. | Limits the first result to one task and prevents task, feature, or regularization selection based on session-2 performance. |

No unlisted assumption may silently enter the final experimental analysis.
