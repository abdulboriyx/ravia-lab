# Spatial RAVIA Holdout Report

Generated: 2026-08-10T08:46:09.471Z

## Protocol

Marked regression subset from the first sealed holdout failures. This is not a fresh sealed holdout and must not be used as an unbiased generalization score.

The holdout was run once against the current deterministic MVP. Failures below are validation findings, not tuned training cases.

## Summary

- Total cases: 16
- Passed: 16
- Failed: 0
- Pass rate: 100.0%

## Category Results

- transcription: 3/3 passed
- action-potential: 6/6 passed
- orbit: 3/3 passed
- ambiguous: 4/4 passed

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
