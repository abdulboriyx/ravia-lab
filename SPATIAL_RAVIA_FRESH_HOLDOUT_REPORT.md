# Spatial RAVIA Holdout Report

Generated: 2026-08-06T07:31:06.804Z

## Protocol

Fresh sealed holdout after stabilization. Run once before tuning. Do not edit cases to improve score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 60
- Passed: 60
- Failed: 0
- Pass rate: 100.0%

## Category Results

- dna-replication: 12/12 passed
- transcription: 12/12 passed
- action-potential: 10/10 passed
- orbit: 10/10 passed
- ambiguous: 4/4 passed
- unsupported: 4/4 passed
- follow-up: 8/8 passed

## Failure Categories

No failures.

## Failed Cases

## Release Decision

Release freeze is reasonable from this holdout pass, pending remote CI and stakeholder review.

## Known Limitations

- This holdout validates deterministic process selection, entity extraction, representation requests, abstention, and command state changes.
- It does not prove open-ended scientific completeness beyond the registered process packs.
- It does not make live provider calls or add retrieval.
- Browser visual regression remains covered by the existing static smoke gate, not by this prompt holdout.
