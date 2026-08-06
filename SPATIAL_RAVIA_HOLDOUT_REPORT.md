# Spatial RAVIA Holdout Report

Generated: 2026-08-06T07:31:07.788Z

## Protocol

Run once against the current MVP before tuning. Do not edit cases to improve the score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 100
- Passed: 100
- Failed: 0
- Pass rate: 100.0%

## Category Results

- dna-replication: 20/20 passed
- transcription: 20/20 passed
- action-potential: 15/15 passed
- orbit: 12/12 passed
- ambiguous: 5/5 passed
- unsupported: 8/8 passed
- follow-up: 17/17 passed
- scope-boundary: 3/3 passed

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
