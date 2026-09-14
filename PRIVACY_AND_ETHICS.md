# Privacy and Ethics Layer

## Data separation

| Location | Purpose | Git policy |
| --- | --- | --- |
| `data_raw_private/` | Raw Reddit text and any source identifiers. | Never commit. |
| `data_deidentified/` | Research-ready records after de-identification. | Never commit. |
| `analysis/` | Reusable analysis and privacy tooling only. | May be committed; it must contain no participant data. |

## Direct identifiers

Before a record enters `data_deidentified/`, remove usernames, profile links, names, email addresses, phone numbers, exact addresses, URLs, workplaces, universities, hospitals, and other explicitly identifying entities where feasible.

## Indirect identification

Flag combinations that could identify a person even after direct identifiers are removed. For example, “22-year-old Uzbek student at X university living at Y dorm” should be generalized to broader categories or removed before analysis.

## Longitudinal IDs

If longitudinal analysis is needed, create an irreversible research identifier with an HMAC-SHA-256 digest of the Reddit user name and a locally supplied secret salt. The source user name is removed after the ID is generated, and no lookup mapping is retained.

Set the salt locally as `REDDIT_USER_ID_SALT`; do not save it in Git or alongside research data.

## Review gate

De-identification is not proof of anonymity. Records flagged for indirect identification require review and generalization before they are available to analysis.
